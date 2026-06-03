"""
app/services/blackbox/probe_logger.py
=======================================
Saves audit data to CSV in two explicit phases.

Phase 1 — Context / Fingerprint  (phase1_xval.csv)
    Written after behavioral fingerprinting completes.
    Captures the three-source reconciliation: what the operator registered,
    what the system prompt says, and what the live model reports about itself.
    Schema: task_id | dimension | probe_question | model_response
            | registration_value | system_prompt_value | reconciliation_status
            | ai_adds_more_detail | governance_finding | notes | latency_ms

Phase 2 — Probe Results  (<date>_<id>_<mode>.csv)
    Written after all three waves of adversarial probing complete.
    Schema: task_id | input | output | latency | wave | category | passed
"""

from __future__ import annotations

import csv
import logging
import re
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)

# ── Output directory ──────────────────────────────────────────────────────────
_PROJECT_ROOT = Path(__file__).resolve().parents[3]
AUDIT_LOG_DIR = _PROJECT_ROOT / "audit_logs"

# ── Phase 1 schema: context fingerprint ──────────────────────────────────────
PHASE1_FIELDS = [
    "task_id",
    "dimension",
    "probe_question",
    "model_response",
    "registration_value",
    "system_prompt_value",
    "reconciliation_status",
    "ai_adds_more_detail",
    "governance_finding",
    "notes",
    "latency_ms",
]

# ── Phase 2 schema: probe results (waves 1-3) ─────────────────────────────────
PHASE2_FIELDS = [
    "task_id",    # probe_id
    "input",      # prompt sent to the AI
    "output",     # full AI response — never truncated
    "latency",    # round-trip ms
    "wave",       # 1 | 2 | 3
    "category",   # KPMG principle
    "passed",     # True | False
]


def _safe_name(name: str) -> str:
    return re.sub(r"[^\w\-.]", "_", name.strip())[:50]


def _ai_dir(ai_name: str) -> Path:
    d = AUDIT_LOG_DIR / (_safe_name(ai_name) or "unknown_ai")
    d.mkdir(parents=True, exist_ok=True)
    return d


def _dt_prefix(started_at: str) -> str:
    try:
        return datetime.fromisoformat(started_at).strftime("%Y%m%d_%H%M%S")
    except Exception:
        return datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")


# ═══════════════════════════════════════════════════════════════════════════
#  PHASE 1 — Context fingerprint CSV
# ═══════════════════════════════════════════════════════════════════════════

def save_phase1_csv(
    audit_id:               str,
    ai_name:                str,
    reconciliation_records: list[dict],
    probes:                 list[dict],
    started_at:             str = "",
) -> str:
    """
    Writes the Phase 1 three-source reconciliation to a CSV.

    Each row = one governance dimension with the probe asked, all three
    source values, and the reconciliation outcome.

    Args:
        audit_id:               Audit UUID.
        ai_name:                Name of the AI system under audit.
        reconciliation_records: Output of behavioral_fingerprinter._build_fingerprint["reconciliation"].
        probes:                 SELF_REPORT_PROBES list (for probe_question lookup fallback).
        started_at:             ISO timestamp used in the filename.

    Returns:
        Absolute path to the written CSV, or "" on failure.
    """
    ai_dir   = _ai_dir(ai_name)
    short_id = (audit_id or "noid")[:8]
    filename = f"{_dt_prefix(started_at)}_{short_id}_phase1_context.csv"
    filepath = ai_dir / filename

    prompt_by_field = {p.get("field", p.get("dimension", "")): p.get("prompt", "") for p in probes}

    try:
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=PHASE1_FIELDS, extrasaction="ignore")
            writer.writeheader()
            for rec in reconciliation_records:
                dim      = rec.get("dimension") or rec.get("field", "")
                question = rec.get("probe_question") or prompt_by_field.get(dim, "")
                enrichment_list = rec.get("enrichment", [])
                writer.writerow({
                    "task_id":               rec.get("probe_id") or f"sr_{dim}",
                    "dimension":             dim,
                    "probe_question":        question,
                    "model_response":        rec.get("model_response") or rec.get("ai_response", ""),
                    "registration_value":    rec.get("registration_value") or rec.get("user_value", ""),
                    "system_prompt_value":   rec.get("system_prompt_value", ""),
                    "reconciliation_status": rec.get("status", ""),
                    "ai_adds_more_detail":   "; ".join(enrichment_list) if enrichment_list else "",
                    "governance_finding":    rec.get("governance_finding", ""),
                    "notes":                 rec.get("notes") or rec.get("note", ""),
                    "latency_ms":            rec.get("latency_ms", ""),
                })
        logger.info(
            "[probe_logger] Phase 1 CSV → %s  (%d rows)", filepath, len(reconciliation_records)
        )
        return str(filepath)
    except Exception as exc:
        logger.error("[probe_logger] Failed to write Phase 1 CSV: %s", exc)
        return ""


# ═══════════════════════════════════════════════════════════════════════════
#  PHASE 2 — Probe results CSV (waves 1-3)
# ═══════════════════════════════════════════════════════════════════════════

def save_phase2_csv(
    audit_id:      str,
    ai_name:       str,
    mode:          str,
    probe_results: list[dict],
    started_at:    str = "",
) -> str:
    """
    Writes the adversarial probe results from all waves to a CSV.

    Each row = one probe with its prompt, full response, latency, wave
    number, KPMG category, and pass/fail verdict.

    Args:
        audit_id:      Audit UUID.
        ai_name:       Name of the AI system under audit.
        mode:          "api" | "ui".
        probe_results: Combined list of probe result dicts from all waves.
        started_at:    ISO timestamp used in the filename.

    Returns:
        Absolute path to the written CSV, or "" on failure.
    """
    ai_dir   = _ai_dir(ai_name)
    short_id = (audit_id or "noid")[:8]
    safe_mode = _safe_name(mode) or "unknown"
    filename = f"{_dt_prefix(started_at)}_{short_id}_{safe_mode}_probes.csv"
    filepath = ai_dir / filename

    try:
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=PHASE2_FIELDS, extrasaction="ignore")
            writer.writeheader()
            for pr in probe_results:
                writer.writerow({
                    "task_id":  pr.get("probe_id") or pr.get("id", ""),
                    "input":    pr.get("prompt", ""),
                    "output":   pr.get("response", ""),      # full — never truncated
                    "latency":  pr.get("latency_ms", ""),
                    "wave":     pr.get("wave", ""),
                    "category": pr.get("category", ""),
                    "passed":   pr.get("passed", ""),
                })
        logger.info(
            "[probe_logger] Phase 2 CSV → %s  (%d rows)", filepath, len(probe_results)
        )
        return str(filepath)
    except Exception as exc:
        logger.error("[probe_logger] Failed to write Phase 2 CSV: %s", exc)
        return ""


# ── Backward-compat alias ─────────────────────────────────────────────────────
# Old code that calls save_probe_csv or save_fingerprint_csv still works.

def save_probe_csv(
    audit_id: str, ai_name: str, mode: str,
    probe_results: list[dict], started_at: str = "",
) -> str:
    return save_phase2_csv(audit_id, ai_name, mode, probe_results, started_at)


def save_fingerprint_csv(
    audit_id: str, ai_name: str,
    reconciliation_records: list[dict], probes: list[dict],
    started_at: str = "",
) -> str:
    return save_phase1_csv(audit_id, ai_name, reconciliation_records, probes, started_at)