"""
services/ai_service.py — Groq AI Reasoning Layer for Tarazu.

MANDATORY DESIGN RULES (from master prompt):
1. Rules engine runs FIRST. AI layer only calibrates on its output.
2. AI adjustment is BOUNDED at ±30% (ai_adjustment_pct capped at [-30, +30]).
3. GROQ_API_KEY blank → silent deterministic fallback, NEVER a crash.
4. Every response includes ai_mode: "rules_only" | "ai_assisted".
5. In-memory cache keyed on rule_trace hash to avoid rate-limit burn.
6. Retry with exponential backoff on transient errors.
"""
from __future__ import annotations
import asyncio
import hashlib
import json
import logging
import time
from typing import Optional

from ..config import settings

logger = logging.getLogger(__name__)

# ── In-Memory Cache ───────────────────────────────────────────────────────────
_ai_cache: dict[str, dict] = {}
AI_CACHE_TTL = 600  # 10 minutes


def _cache_key(payload: str) -> str:
    return hashlib.sha256(payload.encode()).hexdigest()[:24]


def _get_ai_cached(key: str) -> Optional[dict]:
    entry = _ai_cache.get(key)
    if entry and (time.time() - entry["ts"]) < AI_CACHE_TTL:
        return entry["data"]
    return None


def _set_ai_cache(key: str, data: dict) -> None:
    _ai_cache[key] = {"data": data, "ts": time.time()}


# ── Fallback Response ─────────────────────────────────────────────────────────

def _rules_only_response(base_eal: float, rule_trace: list[dict]) -> dict:
    """Deterministic fallback when AI is unavailable."""
    top_rules = sorted(rule_trace, key=lambda r: r.get("contribution_inr", 0), reverse=True)[:3]
    narrative_parts = [f"[{r['rule_id']}] {r['description']}" for r in top_rules]
    return {
        "ai_mode": "rules_only",
        "ai_narrative": (
            "AI reasoning unavailable — showing rules-only estimate. "
            "Deterministic engine identified the following key risk drivers: "
            + "; ".join(narrative_parts) + "."
        ),
        "ai_adjustment_pct": 0.0,
        "adjusted_eal": base_eal,
    }


# ── AI Assessor ───────────────────────────────────────────────────────────────

async def assess_risk(
    base_eal: float,
    rule_trace: list[dict],
    org_context: dict,
    asset_context: Optional[dict] = None,
    retries: int = 2,
) -> dict:
    """
    AI Assessor Agent — calibrates base EAL from rules engine.
    Returns {ai_mode, ai_narrative, ai_adjustment_pct, adjusted_eal}.
    Guaranteed to never crash. Falls back to rules-only on any failure.
    """
    if not settings.ai_enabled:
        return _rules_only_response(base_eal, rule_trace)

    # Build cache key from rule trace hash + org context
    payload_str = json.dumps({
        "base_eal": round(base_eal, -3),  # round to nearest thousand for cache hits
        "rules": [r.get("rule_id") for r in rule_trace],
        "sector": org_context.get("sector"),
        "size_tier": org_context.get("size_tier"),
    }, sort_keys=True)
    ckey = _cache_key(payload_str)

    cached = _get_ai_cached(ckey)
    if cached:
        logger.debug("AI cache hit (key=%s)", ckey)
        return cached

    # Build prompt
    top_rules = sorted(rule_trace, key=lambda r: r.get("contribution_inr", 0), reverse=True)[:5]
    rules_text = "\n".join([
        f"- {r['rule_id']}: {r['description']} (₹{r['contribution_inr']:,.0f})"
        for r in top_rules
    ])
    asset_text = ""
    if asset_context:
        asset_text = f"\nAsset: {asset_context.get('name','?')} [{asset_context.get('asset_type','?')}], criticality: {asset_context.get('criticality_tag','?')}"

    prompt = f"""You are a senior cybersecurity risk quantification expert for Indian organizations.

Organization: {org_context.get('name','?')} | Sector: {org_context.get('sector','?')} | Size: {org_context.get('size_tier','?')}
Annual Revenue: ₹{org_context.get('annual_revenue_inr',0)/10000000:.1f} Cr | Employees: {org_context.get('employee_count',0):,}
{asset_text}

The deterministic rules engine computed Expected Annual Loss (EAL) = ₹{base_eal:,.0f}

Top triggered rules:
{rules_text}

Your task:
1. Review if the rules overlap, conflict, or miss important context.
2. Suggest an adjustment percentage between -30% and +30% ONLY. Do not suggest adjustments outside this range.
3. Write a 2-3 sentence plain-English justification that a board member can understand.

Respond in this EXACT JSON format only (no markdown, no explanation outside JSON):
{{
  "adjustment_pct": <number between -30 and 30>,
  "narrative": "<2-3 sentence explanation for board>"
}}"""

    for attempt in range(retries):
        try:
            from groq import Groq
            client = Groq(api_key=settings.groq_api_key)
            response = client.chat.completions.create(
                model=settings.groq_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=2048,
                response_format={"type": "json_object"},
            )
            content = response.choices[0].message.content or ""
            parsed = json.loads(content)

            # Enforce ±30% bound
            raw_adj = float(parsed.get("adjustment_pct", 0.0))
            adj_pct = max(-30.0, min(30.0, raw_adj))
            if raw_adj != adj_pct:
                logger.info("AI adjustment clamped: %.1f%% → %.1f%% (bounds enforced)", raw_adj, adj_pct)

            adjusted_eal = base_eal * (1 + adj_pct / 100)
            narrative = str(parsed.get("narrative", "")).strip()
            if not narrative:
                raise ValueError("Empty narrative from AI")

            result = {
                "ai_mode": "ai_assisted",
                "ai_narrative": narrative,
                "ai_adjustment_pct": adj_pct,
                "adjusted_eal": round(adjusted_eal, 2),
            }
            _set_ai_cache(ckey, result)
            logger.info("AI Assessor: adj=%.1f%%, EAL ₹%,.0f→₹%,.0f", adj_pct, base_eal, adjusted_eal)
            return result

        except Exception as exc:
            wait = 2 ** attempt
            logger.warning("AI assess attempt %d/%d failed: %s. Waiting %ds", attempt + 1, retries, exc, wait)
            if attempt < retries - 1:
                await asyncio.sleep(wait)

    logger.warning("AI Assessor: all retries failed, returning rules-only fallback")
    return _rules_only_response(base_eal, rule_trace)


# ── AI Correlation Agent ──────────────────────────────────────────────────────

async def assess_correlation(
    sheet_names: list[str],
    naive_sum_inr: float,
    cross_edge_count: int,
    edge_descriptions: list[str],
    org_context: dict,
    deterministic_pct: float = 0.0,
    deterministic_rules: Optional[list[dict]] = None,
) -> dict:
    """
    Correlation Agent — explains compounding vs. naive sum for combined sheets,
    grounded in deterministic graph correlation rules (C01-C20) + LLM calibrated escalation.
    """
    rules_text = ""
    if deterministic_rules:
        rules_text = "\n".join([f"- {r.get('rule_id')}: {r.get('description')} ({r.get('adjustment_pct', 0):+.1f}%)" for r in deterministic_rules[:6]])

    if not settings.ai_enabled or cross_edge_count == 0:
        narrative = (
            "No cross-segment connections detected. Combined risk = arithmetic sum of source sheet EALs."
            if cross_edge_count == 0 else
            f"Deterministic Correlation Engine applied {len(deterministic_rules or [])} rules: compounding adjustment of {deterministic_pct:+.1f}% calculated based on {cross_edge_count} cross-segment topology edges."
        )
        return {
            "ai_mode": "rules_only",
            "ai_narrative": narrative,
            "adjustment_pct": deterministic_pct if cross_edge_count > 0 else 0.0,
        }

    payload_str = json.dumps({
        "sheets": sheet_names,
        "naive_sum": round(naive_sum_inr, -3),
        "edges": cross_edge_count,
        "det_pct": deterministic_pct,
    }, sort_keys=True)
    ckey = _cache_key(payload_str)
    cached = _get_ai_cached(ckey)
    if cached:
        return cached

    edge_text = "\n".join([f"- {e}" for e in edge_descriptions[:5]])
    prompt = f"""You are a cybersecurity risk analyst evaluating interconnected infrastructure segments.

Organization: {org_context.get('name','?')} | Sector: {org_context.get('sector','?')}
Combined sheets: {', '.join(sheet_names)}
Naive arithmetic sum of EALs: ₹{naive_sum_inr:,.0f}
Cross-segment dependencies ({cross_edge_count} edges):
{edge_text}

Deterministic Rules Baseline: {deterministic_pct:+.1f}% compounding adjustment
Triggered Rules:
{rules_text or 'Standard topology compounding'}

These cross-segment connections can cause cascading failures — one segment's breach can propagate across security boundaries.
Based on the deterministic baseline, refine the compounding adjustment (-10% to +40% range, positive = higher combined risk than simple sum).
Write 2 sentences explaining why the combined risk differs from the arithmetic sum.

Respond in JSON only:
{{
  "adjustment_pct": <number>,
  "narrative": "<2 sentence explanation>"
}}"""

    for attempt in range(2):
        try:
            from groq import Groq
            client = Groq(api_key=settings.groq_api_key)
            response = client.chat.completions.create(
                model=settings.groq_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=2048,
                response_format={"type": "json_object"},
            )
            parsed = json.loads(response.choices[0].message.content or "{}")
            adj_pct = max(-10.0, min(40.0, float(parsed.get("adjustment_pct", deterministic_pct))))
            result = {
                "ai_mode": "ai_assisted",
                "ai_narrative": str(parsed.get("narrative", "")),
                "adjustment_pct": adj_pct,
            }
            _set_ai_cache(ckey, result)
            return result
        except Exception as exc:
            logger.warning("Correlation AI attempt %d failed: %s", attempt + 1, exc)
            if attempt < 1:
                await asyncio.sleep(2)

    return {
        "ai_mode": "rules_only",
        "ai_narrative": f"Deterministic Correlation Engine evaluated {cross_edge_count} cross-segment edges with +{deterministic_pct:.1f}% compounding factor based on graph topology.",
        "adjustment_pct": deterministic_pct,
    }


# ── AI Advisor Agent ──────────────────────────────────────────────────────────

async def assess_recommendations(
    selected_controls: list[dict],
    budget_inr: float,
    total_risk_reduction: float,
    org_context: dict,
) -> dict:
    """
    Advisor Agent — explains the optimizer's chosen control set and flags tradeoffs.
    """
    if not settings.ai_enabled:
        return {
            "ai_mode": "rules_only",
            "ai_narrative": (
                "AI reasoning unavailable — showing rules-only optimization. "
                f"Selected {len(selected_controls)} controls within ₹{budget_inr/100_000:.0f}L budget "
                f"for estimated ₹{total_risk_reduction/10_000_000:.1f} Cr risk reduction."
            ),
        }

    controls_text = "\n".join([
        f"- {c['control_name']}: reduces risk by ₹{c['risk_reduction_inr']:,.0f}, costs ₹{c['cost_inr']:,.0f} (ROI: {c['roi_ratio']:.1f}x)"
        for c in selected_controls[:6]
    ])
    prompt = f"""You are a cybersecurity investment advisor for {org_context.get('name','?')} ({org_context.get('sector','?')}).

Budget: ₹{budget_inr:,.0f}
Greedy optimizer selected these controls:
{controls_text}
Total risk reduction: ₹{total_risk_reduction:,.0f}

In 2-3 sentences:
1. Explain WHY this combination is effective (not just that it reduces risk).
2. Flag ONE non-obvious tradeoff or dependency the team should know.

JSON only:
{{"narrative": "<2-3 sentences>"}}"""

    try:
        from groq import Groq
        client = Groq(api_key=settings.groq_api_key)
        response = client.chat.completions.create(
            model=settings.groq_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=2048,
            response_format={"type": "json_object"},
        )
        parsed = json.loads(response.choices[0].message.content or "{}")
        return {"ai_mode": "ai_assisted", "ai_narrative": str(parsed.get("narrative", ""))}
    except Exception as exc:
        logger.warning("Advisor AI failed: %s", exc)
        return {
            "ai_mode": "rules_only",
            "ai_narrative": (
                f"AI reasoning unavailable. Greedy optimizer selected {len(selected_controls)} controls. "
                "Prioritize MFA and EDR — they protect across all asset types simultaneously."
            ),
        }


# ── AI Compliance Agent ───────────────────────────────────────────────────────

async def assess_compliance_gaps(
    framework: str,
    gaps: list[dict],
    satisfied_count: int,
    total_count: int,
    org_context: dict,
) -> dict:
    """
    Compliance Agent — priority-ordered gap narrative for auditors.
    """
    if not settings.ai_enabled:
        top_gaps = [g["clause_ref"] for g in gaps[:3]]
        return {
            "ai_mode": "rules_only",
            "ai_narrative": (
                f"AI reasoning unavailable. {framework} compliance: {satisfied_count}/{total_count} controls satisfied. "
                f"Priority gaps: {', '.join(top_gaps)}. Address these before your next audit."
            ),
        }

    gap_text = "\n".join([f"- {g['clause_ref']}: {g['clause_title']}" for g in gaps[:8]])
    payload_str = json.dumps({"fw": framework, "gaps": [g["clause_ref"] for g in gaps], "org": org_context.get("sector")}, sort_keys=True)
    ckey = _cache_key(payload_str)
    cached = _get_ai_cached(ckey)
    if cached:
        return cached

    prompt = f"""You are an Indian cybersecurity compliance consultant.

Organization: {org_context.get('name','?')} | Sector: {org_context.get('sector','?')}
Framework: {framework}
Status: {satisfied_count}/{total_count} clauses satisfied ({100*satisfied_count/max(total_count,1):.0f}%)

Open gaps:
{gap_text}

Write one paragraph (3-4 sentences) that:
1. Summarizes the overall compliance posture.
2. Prioritizes the top 2-3 gaps by regulatory/business risk impact.
3. Recommends the single highest-impact remediation action.

JSON only: {{"narrative": "<paragraph>"}}"""

    try:
        from groq import Groq
        client = Groq(api_key=settings.groq_api_key)
        response = client.chat.completions.create(
            model=settings.groq_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=2048,
            response_format={"type": "json_object"},
        )
        parsed = json.loads(response.choices[0].message.content or "{}")
        result = {"ai_mode": "ai_assisted", "ai_narrative": str(parsed.get("narrative", ""))}
        _set_ai_cache(ckey, result)
        return result
    except Exception as exc:
        logger.warning("Compliance AI failed: %s", exc)
        top_gaps = [g["clause_ref"] for g in gaps[:3]]
        return {
            "ai_mode": "rules_only",
            "ai_narrative": (
                f"AI reasoning unavailable. {framework}: {satisfied_count}/{total_count} controls satisfied. "
                f"Priority gaps: {', '.join(top_gaps)}."
            ),
        }


# ── AI Analyst Agent (Conversational Intake) ──────────────────────────────────

async def parse_conversational_intake(text: str) -> dict:
    """
    Analyst Agent — Parses unstructured natural language descriptions of infrastructure
    into normalized structured assets ready for intake.
    """
    if not settings.ai_enabled:
        from .intake_engine import rule_i04_classify_asset_type, rule_i05_infer_criticality
        # Deterministic extraction fallback: split lines / sentences
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        if not lines:
            lines = [text.strip()]
        extracted = []
        for line in lines[:8]:
            asset_type = rule_i04_classify_asset_type(line)
            crit, rev_dep = rule_i05_infer_criticality(line, asset_type)
            extracted.append({
                "name": line[:60],
                "asset_type": asset_type,
                "criticality_tag": crit,
                "revenue_dependency_pct": rev_dep,
                "vuln_description": line[:200],
                "days_unpatched": 30,
            })
        return {
            "ai_mode": "rules_only",
            "assets": extracted,
            "explanation": "Extracted assets using deterministic keyword recognition rules (LLM API key not configured).",
        }

    prompt = f"""You are a cybersecurity systems analyst.
Extract all computing assets, databases, network devices, and software mentioned in the following user infrastructure description.

User Text:
\"\"\"{text}\"\"\"

For each asset found, output JSON with:
- name: string (e.g. "Oracle CBS Production DB", "HR Admin Workstation")
- asset_type: one of ["Server", "Database", "Workstation", "Cloud Resource", "Network Appliance", "OT/SCADA", "Payment Switch", "Identity/IAM"]
- criticality_tag: one of ["core_db", "payment_processing", "customer_portal", "admin_workstation", "crown_jewel", "standard"]
- revenue_dependency_pct: float (0.0 to 100.0 estimate based on importance)
- vuln_description: string (any mentioned version or security weakness or default to "Standard intake inventory entry")
- days_unpatched: int (estimated days or 30)

JSON format:
{{
  "assets": [ ... ],
  "explanation": "Brief explanation of what was extracted"
}}"""

    try:
        from groq import Groq
        client = Groq(api_key=settings.groq_api_key)
        response = client.chat.completions.create(
            model=settings.groq_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=2048,
            response_format={"type": "json_object"},
        )
        parsed = json.loads(response.choices[0].message.content or "{}")
        return {
            "ai_mode": "ai_assisted",
            "assets": parsed.get("assets", []),
            "explanation": parsed.get("explanation", "Extracted assets with Groq Llama-3.3."),
        }
    except Exception as exc:
        logger.warning("Conversational intake AI failed: %s", exc)
        return {
            "ai_mode": "rules_only",
            "assets": [{"name": text[:50], "asset_type": "Server", "criticality_tag": "standard", "revenue_dependency_pct": 5.0, "vuln_description": text[:200], "days_unpatched": 30}],
            "explanation": f"AI extraction error ({exc}). Fallback asset created.",
        }


# ── AI CISO RAG Assistant ─────────────────────────────────────────────────────

async def rag_ciso_assistant(query: str, org_data: dict) -> dict:
    """
    RAG Advisory Assistant — Answers board and executive questions grounded in
    the organization's live risk telemetry and Indian cybersecurity regulatory framework
    (DPDP Act 2023, RBI CSF, CERT-In 6-hour reporting directions, SEBI CSCRF).
    """
    if not settings.ai_enabled:
        return {
            "ai_mode": "rules_only",
            "answer": (
                f"Tarazu Telemetry Summary for {org_data.get('name', 'Organization')}: "
                f"Total Expected Annual Loss is ₹{org_data.get('total_eal_inr', 0):,.0f}. "
                f"Monitored Assets: {org_data.get('total_assets', 0)}. "
                f"Critical Vulnerabilities: {org_data.get('critical_vulnerabilities', 0)}. "
                "For conversational AI reasoning with statutory citations, configure GROQ_API_KEY."
            ),
            "citations": ["RBI CSF Circular RBI/2015-16/418", "DPDP Act 2023 §8 & §12", "CERT-In Directions 2022"],
        }

    prompt = f"""You are Tarazu AI, an elite CISO advisor specializing in Indian Cyber Risk Quantification, RBI CSF, SEBI CSCRF, CERT-In directions, and DPDP Act 2023.

Organization Live Telemetry Context:
- Name: {org_data.get('name')}
- Sector: {org_data.get('sector')} ({org_data.get('size_tier')} Tier)
- Annual Revenue: ₹{org_data.get('annual_revenue_inr', 0):,.0f}
- Total Expected Annual Loss (EAL): ₹{org_data.get('total_eal_inr', 0):,.0f}
- Monitored Assets Count: {org_data.get('total_assets', 0)}
- Critical CVEs: {org_data.get('critical_vulnerabilities', 0)}
- Top Risky Assets: {json.dumps(org_data.get('top_risky_assets', []))}
- Top ROI Security Fixes: {json.dumps(org_data.get('top_roi_controls', []))}
- Compliance: RBI CSF: {org_data.get('compliance_rbi_csf', {}).get('coverage_pct', 0)}%, ISO 27001: {org_data.get('compliance_iso27001', {}).get('coverage_pct', 0)}%

Executive / Board Question:
\"{query}\"

Answer professionally and concisely in 2-3 structured paragraphs. Provide exact Indian Rupee impact numbers, explain the financial risk exposure, and cite relevant Indian regulatory clauses (RBI/DPDP/CERT-In).

Output JSON:
{{
  "answer": "Your comprehensive advisory response formatted with markdown bolding",
  "citations": ["List of relevant standards or clauses cited"]
}}"""

    try:
        from groq import Groq
        client = Groq(api_key=settings.groq_api_key)
        response = client.chat.completions.create(
            model=settings.groq_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=2048,
            response_format={"type": "json_object"},
        )
        parsed = json.loads(response.choices[0].message.content or "{}")
        return {
            "ai_mode": "ai_assisted",
            "answer": parsed.get("answer", "No answer generated."),
            "citations": parsed.get("citations", []),
        }
    except Exception as exc:
        logger.warning("RAG CISO Assistant failed: %s", exc)
        return {
            "ai_mode": "rules_only",
            "answer": f"EAL for {org_data.get('name')}: ₹{org_data.get('total_eal_inr', 0):,.0f}. (AI advisory error: {exc})",
            "citations": ["Tarazu Deterministic Engine"],
        }

