"""
app/api/graph.py — Cytoscape Network Graph, Edge CRUD & Blast Radius Traversal (Demo Pillar #2).
"""
from __future__ import annotations
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..auth import AuthContext, assert_org_access, require_api_key
from ..models import Sheet, Asset, GraphEdge, RiskScore
from ..schemas import EdgeCreate, EdgeOut, BlastRadiusResult
from ..services.blast_radius import compute_blast_radius
from ..services.derived_sheets import recompute_dependent_sheets, resolve_leaf_sheet_ids

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/graph", tags=["Graph & Blast Radius"])


def _calculate_risk_level(eal: float) -> str:
    """Helper to assign risk tier for visual badge and node coloration."""
    if eal >= 10_000_000:  # >= ₹1 Crore
        return "critical"
    elif eal >= 2_500_000:  # >= ₹25 Lakh
        return "high"
    elif eal >= 500_000:   # >= ₹5 Lakh
        return "medium"
    return "low"


@router.get("/{sheet_id}")
async def get_sheet_graph(
    sheet_id: str, db: AsyncSession = Depends(get_db), auth: AuthContext = Depends(require_api_key)
):
    """
    Get Cytoscape-formatted graph elements (nodes and edges) for a sheet.
    Supports both base sheets and combined sheets (aggregates source sheet nodes & cross edges).
    """
    sheet = await db.get(Sheet, sheet_id)
    if not sheet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sheet not found")
    assert_org_access(auth, sheet.org_id)

    target_sheet_ids = list(await resolve_leaf_sheet_ids(sheet, db))

    # Fetch sheets for name lookup
    sheets_res = await db.execute(select(Sheet).where(Sheet.id.in_(target_sheet_ids)))
    sheet_map = {s.id: s.name for s in sheets_res.scalars().all()}

    # Fetch assets
    assets_res = await db.execute(
        select(Asset)
        .where(Asset.sheet_id.in_(target_sheet_ids))
        .options(selectinload(Asset.vulnerabilities), selectinload(Asset.risk_scores))
    )
    assets = assets_res.scalars().all()
    asset_ids = {a.id for a in assets}

    # Fetch edges
    edges_res = await db.execute(
        select(GraphEdge).where(
            (GraphEdge.sheet_id.in_(target_sheet_ids)) |
            (GraphEdge.source_asset_id.in_(asset_ids) & GraphEdge.target_asset_id.in_(asset_ids))
        )
    )
    edges = edges_res.scalars().all()

    # Build Cytoscape nodes
    elements = []
    for a in assets:
        latest_score = a.risk_scores[-1] if a.risk_scores else None
        eal = latest_score.expected_annual_loss_inr if latest_score else 0.0
        risk_level = _calculate_risk_level(eal)

        cve_list = [v.cve_id for v in a.vulnerabilities if v.cve_id]
        elements.append({
            "group": "nodes",
            "data": {
                "id": a.id,
                "label": a.name,
                "asset_type": a.asset_type,
                "criticality_tag": a.criticality_tag,
                "revenue_dependency_pct": a.revenue_dependency_pct,
                "eal_inr": eal,
                "risk_level": risk_level,
                "sheet_id": a.sheet_id,
                "sheet_name": sheet_map.get(a.sheet_id, "Unknown"),
                "cves": cve_list,
                "vuln_count": len(a.vulnerabilities),
            }
        })

    # Build Cytoscape edges (deduplicate by id)
    seen_edge_ids = set()
    for e in edges:
        if e.id in seen_edge_ids:
            continue
        seen_edge_ids.add(e.id)
        elements.append({
            "group": "edges",
            "data": {
                "id": e.id,
                "source": e.source_asset_id,
                "target": e.target_asset_id,
                "strength": e.dependency_strength,
                "label": e.dependency_strength.capitalize(),
            }
        })

    return {
        "sheet_id": sheet.id,
        "sheet_name": sheet.name,
        "sheet_type": sheet.type,
        "node_count": len(assets),
        "edge_count": len(seen_edge_ids),
        "elements": elements,
    }


@router.post("/edge", response_model=EdgeOut, status_code=status.HTTP_201_CREATED)
async def create_graph_edge(
    payload: EdgeCreate, db: AsyncSession = Depends(get_db), auth: AuthContext = Depends(require_api_key)
):
    """Create a directional dependency edge between two assets."""
    # Verify assets exist
    src = await db.get(Asset, payload.source_asset_id)
    tgt = await db.get(Asset, payload.target_asset_id)
    if not src or not tgt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source or target asset not found")
    if src.id == tgt.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Self-referential edges not permitted")

    graph_sheet = await db.get(Sheet, payload.sheet_id)
    source_sheet = await db.get(Sheet, src.sheet_id)
    target_sheet = await db.get(Sheet, tgt.sheet_id)
    if not graph_sheet or not source_sheet or not target_sheet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sheet not found")
    assert_org_access(auth, graph_sheet.org_id)
    if len({graph_sheet.org_id, source_sheet.org_id, target_sheet.org_id}) != 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Graph edges cannot cross organizations")
    edge = GraphEdge(
        sheet_id=payload.sheet_id,
        source_asset_id=payload.source_asset_id,
        target_asset_id=payload.target_asset_id,
        dependency_strength=payload.dependency_strength,
    )
    db.add(edge)
    await recompute_dependent_sheets(graph_sheet.org_id, {source_sheet.id, target_sheet.id}, db)
    await db.commit()
    await db.refresh(edge)
    return edge


@router.delete("/edge/{edge_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_graph_edge(
    edge_id: str, db: AsyncSession = Depends(get_db), auth: AuthContext = Depends(require_api_key)
):
    """Delete a graph dependency edge."""
    edge = await db.get(GraphEdge, edge_id)
    if not edge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Edge not found")
    graph_sheet = await db.get(Sheet, edge.sheet_id)
    if graph_sheet:
        assert_org_access(auth, graph_sheet.org_id)
    await db.delete(edge)
    if graph_sheet:
        await recompute_dependent_sheets(graph_sheet.org_id, {graph_sheet.id}, db)
    await db.commit()
    return None


@router.get("/{sheet_id}/blast-radius/{asset_id}", response_model=BlastRadiusResult)
async def get_asset_blast_radius(
    sheet_id: str, asset_id: str, db: AsyncSession = Depends(get_db), auth: AuthContext = Depends(require_api_key)
):
    """
    Demo Pillar #2 — Blast Radius Traversal Engine.
    Given an asset (e.g. HR Laptop), traverses downstream directed edges through intermediaries
    (e.g. Corporate VPN) to crown-jewel assets (e.g. Core Payment Gateway), accumulating
    their ₹ Expected Annual Loss into a total downstream financial exposure figure.
    """
    sheet = await db.get(Sheet, sheet_id)
    if not sheet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sheet not found")
    assert_org_access(auth, sheet.org_id)

    target_sheet_ids = list(await resolve_leaf_sheet_ids(sheet, db))

    # Load all assets and latest risk scores
    assets_res = await db.execute(
        select(Asset)
        .where(Asset.sheet_id.in_(target_sheet_ids))
        .options(selectinload(Asset.risk_scores))
    )
    all_assets = assets_res.scalars().all()
    asset_ids = {a.id for a in all_assets}

    if asset_id not in asset_ids:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found in target sheet scope")

    asset_name_map = {a.id: a.name for a in all_assets}
    asset_eal_map = {
        a.id: (a.risk_scores[-1].expected_annual_loss_inr if a.risk_scores else 0.0)
        for a in all_assets
    }

    # Load edges
    edges_res = await db.execute(
        select(GraphEdge).where(
            GraphEdge.source_asset_id.in_(asset_ids) | GraphEdge.target_asset_id.in_(asset_ids)
        )
    )
    edges = edges_res.scalars().all()
    edge_dicts = [
        {
            "source_asset_id": e.source_asset_id,
            "target_asset_id": e.target_asset_id,
            "dependency_strength": e.dependency_strength,
        }
        for e in edges
    ]

    blast_radius = compute_blast_radius(
        origin_asset_id=asset_id,
        edges=edge_dicts,
        asset_eal_map=asset_eal_map,
        asset_name_map=asset_name_map,
    )

    return BlastRadiusResult(**blast_radius)
