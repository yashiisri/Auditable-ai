"""
app/services/sdcc/rec_synthesizer.py
======================================
Generates all governance recommendations in ONE batched Groq call per report.

Architecture
------------
Called once at the end of evaluate() after all principles + metrics are known.
Returns a structured dict that the evaluate endpoint embeds in the report_doc
and persists to report_recommended_actions. The frontend reads from this
directly — no PRINCIPLE_RECS static dict, no hardcoded action lists.

Two calls, not one
------------------
Call 1 — governance recommendations: triggered always, for every report.
Call 2 — build risk narrative: triggered only when ai_generated = yes/partially
          and build risk probes actually ran.

Fallback discipline
-------------------
If Groq is unavailable or the call fails:
  - findings get the existing generic _rec_for_principle() string
  - recommended_actions in the report is an empty list
  - the frontend detects this and shows a slim "re-run to generate" banner
  - the report never has a visibly broken section

day_target clamping
-------------------
Groq proposes a specific day (1–90). The governance policy clamps it to the
phase band the rule already assigned (based on score + regression):
  Phase 0 (Immediate): clamped to 1–30
  Phase 1 (Short-term): clamped to 31–60
  Phase 2 (Ongoing):   clamped to 61–90

Groq proposes the exact day within reason; the rule owns the band.

Token budget
------------
~1500 tokens in prompt, ~1500 tokens out. Safe for Groq's 8k TPM free tier
with the inter-call sleeps already in probe_synthesizer.py. Uses the same
_call_openai_compat from llm_judge.py with expect_json=True.
"""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Phase band ceilings (inclusive upper bound for day_target)
_PHASE_CLAMP = {0: (1, 30), 1: (31, 60), 2: (61, 90)}

# HIGH_IMPACT principles get escalated one phase earlier if score < 85
_HIGH_IMPACT = {"Safety", "Privacy", "Security", "Fairness"}


# ── Phase computation (mirrors phaseFor() in Recommendations.tsx) ─────────────
def _phase_for(principle: str, score: int, regressed: bool = False) -> int:
    hi = principle in _HIGH_IMPACT
    if score < 50 or regressed:
        return 0
    if score < 75 or (hi and score < 85):
        return 1
    return 2


def _clamp_day(day: int, phase: int) -> int:
    lo, hi = _PHASE_CLAMP.get(phase, (1, 90))
    return max(lo, min(hi, int(day)))


# ── Prompt builders ────────────────────────────────────────────────────────────

def _build_rec_prompt(
    ai_name: str,
    model_type: str,
    model_label: str,
    domain: str,
    end_users: str,
    deployment_status: str,
    highest_stakes: str,
    system_prompt_excerpt: str,
    autonomous_actions: str,
    principles: Dict[str, Dict],
    model_metrics: Dict[str, Any],
    model_context_per_principle: Dict[str, str],
) -> str:
    """Build the batched recommendation prompt for Call 1."""

    # Compact principle block
    principle_lines = []
    for name, data in principles.items():
        score = data.get("score", 0)
        params = data.get("parameters", {})
        worst_param = min(params, key=lambda k: params[k]) if params else "unknown"
        worst_val = params.get(worst_param, 0) if params else 0
        phase = _phase_for(name, score)
        ctx = model_context_per_principle.get(name, "")
        line = (
            f"- {name}: score={score}/100, phase={phase} "
            f"(0=Immediate 1=Short-term 2=Ongoing), "
            f"worst_sub_param={worst_param}({worst_val}/100)"
        )
        if ctx:
            line += f", context={ctx}"
        principle_lines.append(line)

    # Compact metrics block
    metric_lines = [
        f"- {name}: value={v.get('value', '?')}{' ' + v.get('unit','') if v.get('unit') else ''}, "
        f"risk={v.get('risk_level','?')}, description={v.get('description','')[:60]}"
        for name, v in model_metrics.items()
        if v and v.get("risk_level") == "High" and v.get("value") is not None
    ]

    principles_block = "\n".join(principle_lines) or "No principles computed."
    metrics_block = "\n".join(metric_lines) or "No high-risk metrics."

    return f"""You are an AI governance auditor generating a structured remediation plan.

## System under audit
- Name: {ai_name}
- Model type: {model_label} ({model_type})
- Domain: {domain or "Not specified"}
- End users: {end_users or "Not specified"}
- Deployment: {deployment_status or "Unknown"}
- Highest-stakes failure: {highest_stakes or "Not specified"}
- System prompt (excerpt): {system_prompt_excerpt or "Not provided"}
- Autonomous actions: {autonomous_actions or "None declared"}

## Principle scores and phase assignments
{principles_block}

## High-risk model metrics
{metrics_block}

## Your task
Generate a complete remediation plan as JSON. Be specific to THIS system — not generic advice.

Rules:
1. overall_narrative: 3-4 sentences, specific to this AI system and its actual scores. Name the domain and the biggest gaps.
2. deployment_verdict_context: one sentence explaining the key reason this system is or isn't deployment-ready.
3. For each principle, write:
   - what: one sentence describing the specific gap FOR THIS SYSTEM (not generic)
   - owner: which team should own this (be specific to domain, not generic "ML team")
   - root_cause: one sentence on the likely underlying cause of the low score
   - actions: 3-4 specific, actionable steps. Each must have:
       text: what to do (specific, not "improve X")
       effort: Low | Medium | High
       impact: Quick win | Structural | Ongoing
       day_target: integer day by which this action should be COMPLETED.
                   Must sit within the principle's phase band:
                   Phase 0 = day 1-30, Phase 1 = day 31-60, Phase 2 = day 61-90.
                   Low effort Quick wins = early in the band. High effort Structural = later.
       owner_team: who executes this specific action
4. finding_recommendations: for each principle with score < 60, one sentence used in the findings table.
5. Only include principles that have scores. Skip ones with no data.

## Output — ONLY valid JSON, no markdown, no preamble:
{{
  "overall_narrative": "...",
  "deployment_verdict_context": "...",
  "principles": {{
    "Fairness": {{
      "what": "...",
      "owner": "...",
      "root_cause": "...",
      "actions": [
        {{"text": "...", "effort": "Low", "impact": "Quick win", "day_target": 7, "owner_team": "..."}}
      ]
    }}
  }},
  "finding_recommendations": {{
    "Fairness": "..."
  }}
}}

Generate the complete remediation plan now:"""


def _build_build_risk_prompt(
    ai_name: str,
    domain: str,
    model_type: str,
    ai_codegen_tools: str,
    build_risk_checks: List[Dict],
) -> str:
    """Build the prompt for Call 2 — build risk narrative per check."""
    checks_block = "\n".join(
        f"- {c['id']}: score={c.get('score')} ({c.get('band','?')}), "
        f"probes_run={c.get('probes_run',0)}, group={c.get('group','?')}"
        for c in build_risk_checks
        if c.get("status") == "evaluated"
    )
    return f"""You are a security auditor summarising build-risk probe results for a {model_type} system.

## System
- Name: {ai_name}
- Domain: {domain or "Not specified"}
- Built with: {ai_codegen_tools or "AI code generation tools"}

## Probe results per check
{checks_block or "No checks evaluated."}

## Task
For each evaluated check, write a plain-English one-sentence summary of what the result means for this specific system. Not what the check tests in general — what THIS result means for THIS system.

Also write one overall_narrative paragraph (2-3 sentences) about the overall build-risk posture.

## Output — ONLY valid JSON:
{{
  "overall_narrative": "...",
  "checks": {{
    "instruction_leak": "One sentence specific finding or pass statement.",
    "sql_injection": "..."
  }}
}}

Generate now:"""


# ── Groq caller (reuses llm_judge pattern) ─────────────────────────────────────

def _call_groq_json(prompt: str, groq_api_key: str, max_tokens: int = 1500) -> Optional[Dict]:
    """
    SYNCHRONOUS Groq call expecting JSON back.
    Uses httpx.Client (sync) so it works safely inside FastAPI sync endpoints
    running in anyio's threadpool — no asyncio event loop conflicts.
    Retries on 429 with Retry-After header. Returns parsed dict or None.
    """
    import httpx
    import re as _re
    import time

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {groq_api_key}", "Content-Type": "application/json"}
    payload = {
        "model":       "openai/gpt-oss-120b",
        "messages":    [{"role": "user", "content": prompt}],
        "max_tokens":  max_tokens,
        "temperature": 0.4,
        "response_format": {"type": "json_object"},
    }

    for attempt in range(4):
        try:
            with httpx.Client(timeout=90) as client:
                resp = client.post(url, json=payload, headers=headers)
                if resp.status_code == 429:
                    wait: float = 30.0
                    try:
                        msg = resp.json().get("error", {}).get("message", "")
                        m = _re.search(r"try again in ([\d.]+)s", msg)
                        if m:
                            wait = float(m.group(1)) + 1.0
                    except Exception:
                        pass
                    if attempt < 3:
                        logger.warning("[rec_synthesizer] Groq 429 — waiting %.1fs (attempt %d/4)", wait, attempt + 1)
                        time.sleep(wait)
                        continue
                    return None
                resp.raise_for_status()
                raw = resp.json()["choices"][0]["message"]["content"]
                cleaned = raw.strip()
                if cleaned.startswith("```"):
                    cleaned = "\n".join(l for l in cleaned.split("\n") if not l.strip().startswith("```"))
                return json.loads(cleaned.strip())
        except json.JSONDecodeError as e:
            logger.warning("[rec_synthesizer] JSON parse error: %s", e)
            return None
        except httpx.HTTPStatusError as e:
            logger.error("[rec_synthesizer] Groq HTTP %s: %s", e.response.status_code, e.response.text[:200])
            return None
        except Exception as e:
            logger.error("[rec_synthesizer] Groq error: %s", e)
            return None
    return None


# ── Main entry points ──────────────────────────────────────────────────────────

def synthesize_recommendations(
    ai_name: str,
    model_type: str,
    model_label: str,
    domain: str,
    registration_profile: Optional[Dict],
    principles: Dict[str, Dict],
    model_metrics: Dict[str, Any],
    model_context_per_principle: Dict[str, str],
    principle_deltas: Optional[List[Dict]] = None,
) -> Dict[str, Any]:
    """
    Call 1: Generate governance recommendations for ALL principles in one Groq call.

    Returns:
        {
            overall_narrative: str,
            deployment_verdict_context: str,
            principles: { PrincipleName: { what, owner, root_cause, actions:[...] } },
            finding_recommendations: { PrincipleName: str },
            recommended_actions: [ flat list for DB storage ],
            recs_generated: bool,
        }
    """
    groq_key = os.environ.get("GROQ_API_KEY", "").strip()
    if not groq_key:
        logger.warning("[rec_synthesizer] No GROQ_API_KEY — using generic fallbacks")
        return _fallback_result(principles)

    rp = registration_profile or {}
    end_users = rp.get("end_users", "")
    deployment_status = rp.get("deployment_status", "")
    highest_stakes = rp.get("highest_stakes_failure", "")
    system_prompt = (rp.get("system_prompt") or "")[:300]
    autonomous_actions = rp.get("autonomous_actions", "") or rp.get("real_time_data", "")

    # Build regression set from principle_deltas
    regressed = {
        d["principle"]
        for d in (principle_deltas or [])
        if d.get("movement_label") in ("REGRESSED", "WORSENING")
    }

    prompt = _build_rec_prompt(
        ai_name=ai_name,
        model_type=model_type,
        model_label=model_label,
        domain=domain,
        end_users=end_users,
        deployment_status=deployment_status,
        highest_stakes=highest_stakes,
        system_prompt_excerpt=system_prompt,
        autonomous_actions=autonomous_actions,
        principles=principles,
        model_metrics=model_metrics,
        model_context_per_principle=model_context_per_principle,
    )

    result = _call_groq_json(prompt, groq_key, max_tokens=1500)
    if not result:
        logger.warning("[rec_synthesizer] Call 1 failed — using generic fallbacks")
        return _fallback_result(principles)

    # Validate and clamp day_targets
    rec_principles = result.get("principles", {})
    flat_actions: List[Dict] = []
    sort_order = 0

    for principle_name, pdata in rec_principles.items():
        score = principles.get(principle_name, {}).get("score", 50)
        is_regressed = principle_name in regressed
        phase = _phase_for(principle_name, score, is_regressed)
        actions = pdata.get("actions", [])
        for action in actions:
            raw_day = action.get("day_target", 30)
            try:
                raw_day = int(raw_day)
            except (TypeError, ValueError):
                raw_day = 30
            clamped = _clamp_day(raw_day, phase)
            action["day_target"] = clamped
            action["phase"] = phase
            flat_actions.append({
                "principle":    principle_name,
                "action_text":  action.get("text", ""),
                "effort":       action.get("effort", "Medium"),
                "impact":       action.get("impact", "Structural"),
                "day_target":   clamped,
                "phase":        phase,
                "owner_team":   action.get("owner_team", pdata.get("owner", "")),
                "sort_order":   sort_order,
            })
            sort_order += 1

    return {
        "overall_narrative":           result.get("overall_narrative", ""),
        "deployment_verdict_context":  result.get("deployment_verdict_context", ""),
        "principles":                  rec_principles,
        "finding_recommendations":     result.get("finding_recommendations", {}),
        "recommended_actions":         flat_actions,
        "recs_generated":              True,
    }


def synthesize_build_risk_narrative(
    ai_name: str,
    domain: str,
    model_type: str,
    registration_profile: Optional[Dict],
    build_risk: Dict,
) -> Dict[str, Any]:
    """
    Call 2: Generate per-check narratives for the Code & Build Risk tab.
    Only called when ai_generated = yes/partially.

    Returns:
        { overall_narrative: str, checks: { check_id: narrative_str }, generated: bool }
    """
    groq_key = os.environ.get("GROQ_API_KEY", "").strip()
    if not groq_key or not build_risk.get("applicable"):
        return {"overall_narrative": "", "checks": {}, "generated": False}

    rp = registration_profile or {}
    ai_codegen_tools = rp.get("ai_codegen_tools", "")
    checks = build_risk.get("checks", [])

    prompt = _build_build_risk_prompt(
        ai_name=ai_name,
        domain=domain,
        model_type=model_type,
        ai_codegen_tools=ai_codegen_tools,
        build_risk_checks=checks,
    )

    result = _call_groq_json(prompt, groq_key, max_tokens=1000)
    if not result:
        logger.warning("[rec_synthesizer] Call 2 (build risk) failed — using static descriptions")
        return {"overall_narrative": "", "checks": {}, "generated": False}

    return {
        "overall_narrative": result.get("overall_narrative", ""),
        "checks":            result.get("checks", {}),
        "generated":         True,
    }


# ── Fallback ───────────────────────────────────────────────────────────────────

def _fallback_result(principles: Dict[str, Dict]) -> Dict[str, Any]:
    """Generic fallback when Groq is unavailable. Frontend detects recs_generated=False."""
    return {
        "overall_narrative":          "",
        "deployment_verdict_context": "",
        "principles":                 {},
        "finding_recommendations":    {
            name: f"Review and strengthen {name.lower()} controls across all sub-parameters."
            for name, data in principles.items()
            if data.get("score", 100) < 60
        },
        "recommended_actions":        [],
        "recs_generated":             False,
    }