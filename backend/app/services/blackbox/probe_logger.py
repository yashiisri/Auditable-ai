"""
app/services/blackbox/probe_logger.py
=======================================
Saves probe results to CSV after every blackbox audit (API mode and UI mode).

Output location:
    <project_root>/audit_logs/<ai_name>/<YYYYMMDD_HHMMSS>_<audit_id[:8]>_<mode>.csv

Standard probe schema (matches general_llm_logs format):
    task_id  → probe_id  (e.g. "transparency_1", "safety_3")
    input    → the probe prompt sent to the AI
    output   → the full AI response text (no truncation)
    latency  → round-trip latency in milliseconds (float)

Phase 1 fingerprint schema:
    task_id, dimension, probe_question, model_response,
    registration_value, system_prompt_value, reconciliation_status,
    governance_finding, notes, latency_ms

Aliases at the bottom map the names orchestrator.py expects:
    save_phase1_csv → save_fingerprint_csv
    save_phase2_csv → save_probe_csv
"""

from __future__ import annotations

import csv
import logging
import re
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)

# ── Where logs are stored ─────────────────────────────────────────────────────
_THIS_FILE    = Path(__file__).resolve()
_PROJECT_ROOT = _THIS_FILE.parents[3]
AUDIT_LOG_DIR = _PROJECT_ROOT / "audit_logs"

# ── CSV column definitions ─────────────────────────────────────────────────────

CSV_FIELDNAMES = [
    "task_id",   # probe_id  e.g. "transparency_1"
    "input",     # the probe prompt
    "output",    # full AI response text — NO truncation
    "latency",   # round-trip ms (float)
]

FINGERPRINT_CSV_FIELDNAMES = [
    "task_id",               # probe id  e.g. "sr_purpose"
    "dimension",             # governance dimension  e.g. "purpose", "refusals"
    "probe_question",        # the open-ended question asked
    "model_response",        # verbatim AI response — NO truncation
    "registration_value",    # what the operator registered for this dimension
    "system_prompt_value",   # what the system prompt says (if provided)
    "reconciliation_status", # AGREE | PARTIAL | CONFLICT | NO_MODEL_RESPONSE | SOURCE_ONLY
    "governance_finding",    # populated for CONFLICT rows
    "notes",                 # reconciliation reasoning
    "latency_ms",            # round-trip ms
]


def _safe_name(name: str) -> str:
    """Strip characters invalid in directory/file names."""
    return re.sub(r"[^\w\-.]", "_", name.strip())[:50]


def _make_dir(ai_name: str) -> Path:
    directory = AUDIT_LOG_DIR / (_safe_name(ai_name) or "unknown_ai")
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def _timestamp(started_at: str) -> str:
    try:
        return datetime.fromisoformat(started_at).strftime("%Y%m%d_%H%M%S")
    except Exception:
        return datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")


# ── Standard probe CSV ────────────────────────────────────────────────────────

def save_probe_csv(
    audit_id:      str,
    ai_name:       str,
    mode:          str,
    probe_results: list[dict],
    started_at:    str = "",
) -> str:
    """
    Write probe_results to a CSV file and return the absolute path.

    Each item in probe_results must have at minimum:
        probe_id   – written to task_id column
        prompt     – written to input column
        response   – written to output column (full text, never truncated)
        latency_ms – optional float/int ms
    """
    ai_dir    = _make_dir(ai_name)
    short_id  = (audit_id or "")[:8] or "noid"
    safe_mode = _safe_name(mode) or "unknown"
    filepath  = ai_dir / f"{_timestamp(started_at)}_{short_id}_{safe_mode}.csv"

    try:
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=CSV_FIELDNAMES, extrasaction="ignore")
            writer.writeheader()
            for pr in probe_results:
                writer.writerow({
                    "task_id": pr.get("probe_id", ""),
                    "input":   pr.get("prompt", ""),
                    "output":  pr.get("response", ""),
                    "latency": pr.get("latency_ms", ""),
                })
        logger.info("[probe_logger] CSV saved → %s  (%d rows)", filepath, len(probe_results))
        return str(filepath)
    except Exception as exc:
        logger.error("[probe_logger] Failed to write CSV: %s", exc)
        return ""


# ── Phase 1 fingerprint CSV ───────────────────────────────────────────────────

def save_fingerprint_csv(
    audit_id:               str,
    ai_name:                str,
    reconciliation_records: list[dict],
    probes:                 list[dict],
    started_at:             str = "",
) -> str:
    """
    Write Phase 1 three-source fingerprint results to a separate CSV.

    Filename: <YYYYMMDD_HHMMSS>_<audit_id[:8]>_phase1_xval.csv

    reconciliation_records — list of dicts from behavioral_fingerprinter._build_fingerprint
        Expected keys: probe_id, dimension, probe_question, model_response,
                       registration_value, system_prompt_value, status,
                       governance_finding, notes, latency_ms

    probes — list of probe dicts (backward-compat fallback for probe_question lookup)
    """
    ai_dir   = _make_dir(ai_name)
    short_id = (audit_id or "")[:8] or "noid"
    filepath = ai_dir / f"{_timestamp(started_at)}_{short_id}_phase1_xval.csv"

    # Backward-compat: build question lookup from probes list when
    # probe_question is not already stored in the record itself.
    prompt_by_field: dict[str, str] = {
        p.get("field", ""): p.get("prompt", "") for p in probes
    }

    try:
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(
                f, fieldnames=FINGERPRINT_CSV_FIELDNAMES, extrasaction="ignore"
            )
            writer.writeheader()
            for rec in reconciliation_records:
                dim = rec.get("dimension") or rec.get("field", "")
                question = rec.get("probe_question") or prompt_by_field.get(dim, "")
                writer.writerow({
                    "task_id":               rec.get("probe_id") or f"sr_{dim}",
                    "dimension":             dim,
                    "probe_question":        question,
                    "model_response":        rec.get("model_response") or rec.get("ai_response", ""),
                    "registration_value":    rec.get("registration_value") or rec.get("user_value", ""),
                    "system_prompt_value":   rec.get("system_prompt_value", ""),
                    "reconciliation_status": rec.get("status", ""),
                    "governance_finding":    rec.get("governance_finding", ""),
                    "notes":                 rec.get("notes") or rec.get("note", ""),
                    "latency_ms":            rec.get("latency_ms", ""),
                })
        logger.info(
            "[probe_logger] Phase 1 CSV saved → %s  (%d rows)",
            filepath, len(reconciliation_records),
        )
        return str(filepath)
    except Exception as exc:
        logger.error("[probe_logger] Failed to write Phase 1 CSV: %s", exc)
        return ""


# ── Re-run CSV extensions ────────────────────────────────────────────────────

RERUN_FINGERPRINT_CSV_FIELDNAMES = FINGERPRINT_CSV_FIELDNAMES + ["prior_status"]


def save_rerun_probe_csv(
    audit_id:        str,
    ai_name:         str,
    mode:            str,
    probe_results:   list[dict],
    started_at:      str = "",
    rerun_sequence:  int = 2,
) -> str:
    """
    Write probe_results to a re-run CSV file and return the absolute path.

    Identical to save_probe_csv but the filename stem gets ``_r{rerun_sequence}``
    appended before the ``.csv`` extension.

    Example filename: 20260610_120000_abc12345_api_r2.csv
    """
    ai_dir    = _make_dir(ai_name)
    short_id  = (audit_id or "")[:8] or "noid"
    safe_mode = _safe_name(mode) or "unknown"
    filepath  = ai_dir / f"{_timestamp(started_at)}_{short_id}_{safe_mode}_r{rerun_sequence}.csv"

    try:
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=CSV_FIELDNAMES, extrasaction="ignore")
            writer.writeheader()
            for pr in probe_results:
                writer.writerow({
                    "task_id": pr.get("probe_id", ""),
                    "input":   pr.get("prompt", ""),
                    "output":  pr.get("response", ""),
                    "latency": pr.get("latency_ms", ""),
                })
        logger.info(
            "[probe_logger] Re-run probe CSV saved → %s  (%d rows)",
            filepath, len(probe_results),
        )
        return str(filepath)
    except Exception as exc:
        logger.error("[probe_logger] Failed to write re-run probe CSV: %s", exc)
        return ""


def save_rerun_fingerprint_csv(
    audit_id:                   str,
    ai_name:                    str,
    reconciliation_records:     list[dict],
    probes:                     list[dict],
    started_at:                 str = "",
    rerun_sequence:             int = 2,
    prior_fingerprint_statuses: dict[str, str] | None = None,
) -> str:
    """
    Write Phase 1 fingerprint results for a re-run to a CSV file and return the
    absolute path.

    Extends save_fingerprint_csv in two ways:
    - Filename stem gets ``_r{rerun_sequence}`` before ``.csv``
      (e.g. 20260610_120000_abc12345_phase1_xval_r2.csv)
    - CSV has an additional ``prior_status`` column appended after ``latency_ms``,
      populated from ``prior_fingerprint_statuses`` dict mapping
      ``{dimension: prior_status_string}``.  Missing entries resolve to ``""``.
    """
    if prior_fingerprint_statuses is None:
        prior_fingerprint_statuses = {}

    ai_dir   = _make_dir(ai_name)
    short_id = (audit_id or "")[:8] or "noid"
    filepath = ai_dir / f"{_timestamp(started_at)}_{short_id}_phase1_xval_r{rerun_sequence}.csv"

    # Backward-compat: build question lookup from probes list when
    # probe_question is not already stored in the record itself.
    prompt_by_field: dict[str, str] = {
        p.get("field", ""): p.get("prompt", "") for p in probes
    }

    try:
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(
                f, fieldnames=RERUN_FINGERPRINT_CSV_FIELDNAMES, extrasaction="ignore"
            )
            writer.writeheader()
            for rec in reconciliation_records:
                dim = rec.get("dimension") or rec.get("field", "")
                question = rec.get("probe_question") or prompt_by_field.get(dim, "")
                writer.writerow({
                    "task_id":               rec.get("probe_id") or f"sr_{dim}",
                    "dimension":             dim,
                    "probe_question":        question,
                    "model_response":        rec.get("model_response") or rec.get("ai_response", ""),
                    "registration_value":    rec.get("registration_value") or rec.get("user_value", ""),
                    "system_prompt_value":   rec.get("system_prompt_value", ""),
                    "reconciliation_status": rec.get("status", ""),
                    "governance_finding":    rec.get("governance_finding", ""),
                    "notes":                 rec.get("notes") or rec.get("note", ""),
                    "latency_ms":            rec.get("latency_ms", ""),
                    "prior_status":          prior_fingerprint_statuses.get(dim, ""),
                })
        logger.info(
            "[probe_logger] Re-run Phase 1 CSV saved → %s  (%d rows)",
            filepath, len(reconciliation_records),
        )
        return str(filepath)
    except Exception as exc:
        logger.error("[probe_logger] Failed to write re-run Phase 1 CSV: %s", exc)
        return ""


# ── Aliases expected by orchestrator ─────────────────────────────────────────
save_phase1_csv = save_fingerprint_csv
save_phase2_csv = save_probe_csv