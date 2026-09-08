"""Keep persisted combined-sheet scores synchronized with their source sheets."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Asset, GraphEdge, Organization, RiskScore, Sheet
from .ai_service import assess_correlation


async def resolve_leaf_sheet_ids(sheet: Sheet, db: AsyncSession, visited: set[str] | None = None) -> set[str]:
    """Return all base-sheet IDs beneath a sheet, including nested combined views."""
    visited = visited or set()
    if sheet.id in visited:
        return set()
    visited.add(sheet.id)
    if sheet.type == "base" or not sheet.source_sheet_ids:
        return {sheet.id}

    sources = (await db.execute(select(Sheet).where(Sheet.id.in_(sheet.source_sheet_ids)))).scalars().all()
    leaves: set[str] = set()
    for source in sources:
        leaves.update(await resolve_leaf_sheet_ids(source, db, visited))
    return leaves


async def _latest_sheet_eal(sheet_id: str, db: AsyncSession) -> float:
    score = (await db.execute(
        select(RiskScore)
        .where(RiskScore.sheet_id == sheet_id, RiskScore.asset_id.is_(None))
        .order_by(RiskScore.computed_at.desc())
        .limit(1)
    )).scalar_one_or_none()
    return score.expected_annual_loss_inr if score else 0.0


async def recompute_dependent_sheets(org_id: str, changed_sheet_ids: set[str], db: AsyncSession) -> None:
    """Recompute every dependent combined sheet, propagating through nested views."""
    org = await db.get(Organization, org_id)
    if not org:
        return

    combined_sheets = (await db.execute(
        select(Sheet).where(Sheet.org_id == org_id, Sheet.type == "combined")
    )).scalars().all()
    pending = set(changed_sheet_ids)
    processed: set[str] = set()

    while pending:
        updated_this_pass: set[str] = set()
        for sheet in combined_sheets:
            source_ids = set(sheet.source_sheet_ids or [])
            if sheet.id in processed or not (source_ids & pending):
                continue

            naive_sum = sum([await _latest_sheet_eal(source_id, db) for source_id in source_ids])
            leaf_ids = await resolve_leaf_sheet_ids(sheet, db)
            assets = (await db.execute(select(Asset).where(Asset.sheet_id.in_(leaf_ids)))).scalars().all()
            asset_to_sheet = {asset.id: asset.sheet_id for asset in assets}
            asset_to_name = {asset.id: asset.name for asset in assets}
            sheet_names = {
                source.id: source.name
                for source in (await db.execute(select(Sheet).where(Sheet.id.in_(leaf_ids)))).scalars().all()
            }

            cross_descriptions: list[str] = []
            cross_edge_dicts: list[dict] = []
            for edge in (await db.execute(select(GraphEdge))).scalars().all():
                source_sheet = asset_to_sheet.get(edge.source_asset_id)
                target_sheet = asset_to_sheet.get(edge.target_asset_id)
                if source_sheet and target_sheet and source_sheet != target_sheet:
                    src_a = next((a for a in assets if a.id == edge.source_asset_id), None)
                    tgt_a = next((a for a in assets if a.id == edge.target_asset_id), None)
                    cross_descriptions.append(
                        f"{asset_to_name[edge.source_asset_id]} ({sheet_names.get(source_sheet, 'Sheet')}) → "
                        f"{asset_to_name[edge.target_asset_id]} ({sheet_names.get(target_sheet, 'Sheet')}) [{edge.dependency_strength}]"
                    )
                    cross_edge_dicts.append({
                        "src_name": src_a.name if src_a else "Asset",
                        "tgt_name": tgt_a.name if tgt_a else "Asset",
                        "src_type": src_a.asset_type if src_a else "server",
                        "tgt_type": tgt_a.asset_type if tgt_a else "server",
                        "src_crit": src_a.criticality_tag if src_a else "medium",
                        "tgt_crit": tgt_a.criticality_tag if tgt_a else "medium",
                        "strength": edge.dependency_strength,
                        "src_cvss": 7.0,
                    })

            # Fetch active controls
            from ..models import Control
            from .correlation_engine import evaluate_sheet_correlation
            controls_res = await db.execute(
                select(Control.name).where(Control.org_id == org_id, Control.status == "present")
            )
            controls_present = [r[0] for r in controls_res.all()]

            corr_out = evaluate_sheet_correlation(
                sheet_names=[sheet_names.get(source_id, "Derived view") for source_id in source_ids],
                naive_sum_inr=naive_sum,
                cross_edges=cross_edge_dicts,
                controls_present=controls_present,
                org_sector=org.sector or "BFSI",
            )

            ai = await assess_correlation(
                sheet_names=[sheet_names.get(source_id, "Derived view") for source_id in source_ids],
                naive_sum_inr=naive_sum,
                cross_edge_count=len(cross_descriptions),
                edge_descriptions=cross_descriptions,
                org_context={"name": org.name, "sector": org.sector, "size_tier": org.size_tier},
                deterministic_pct=corr_out.compounding_adjustment_pct,
                deterministic_rules=[{"rule_id": r.rule_id, "description": r.description, "adjustment_pct": r.adjustment_delta_pct, "reason": r.reason} for r in corr_out.rule_trace],
            )
            adjustment = ai.get("adjustment_pct", corr_out.compounding_adjustment_pct)
            score = (await db.execute(
                select(RiskScore).where(RiskScore.sheet_id == sheet.id, RiskScore.asset_id.is_(None))
            )).scalar_one_or_none()
            if not score:
                score = RiskScore(sheet_id=sheet.id, asset_id=None)
                db.add(score)
            score.expected_annual_loss_inr = round(naive_sum * (1 + adjustment / 100), 2)
            
            trace = [
                {"rule_id": "COMBINED_NAIVE_SUM", "description": "Current sum of source sheets", "contribution_inr": naive_sum,
                 "rule_tier": "universal", "reason": "Recalculated from persisted source-sheet scores."},
            ]
            for r in corr_out.rule_trace:
                trace.append({
                    "rule_id": r.rule_id,
                    "description": r.description,
                    "contribution_inr": round(naive_sum * (r.adjustment_delta_pct / 100.0), 2),
                    "rule_tier": "correlation_engine",
                    "reason": r.reason,
                })
            score.rule_trace = trace
            score.ai_narrative = ai.get("ai_narrative")
            score.ai_adjustment_pct = adjustment
            score.ai_mode = ai.get("ai_mode", "rules_only")
            processed.add(sheet.id)
            updated_this_pass.add(sheet.id)
        pending = updated_this_pass
