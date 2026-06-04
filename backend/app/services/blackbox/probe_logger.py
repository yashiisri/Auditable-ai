# """
# app/services/blackbox/probe_logger.py
# =======================================
# Saves probe results to a CSV after every blackbox audit (API mode and UI mode).

# Output location:
#     <project_root>/audit_logs/<ai_name>/<YYYYMMDD_HHMMSS>_<audit_id[:8]>_<mode>.csv

# Schema (matches general_llm_logs format):
#     task_id | input | output | latency

#     task_id  → probe_id  (e.g. "transparency_1", "safety_3")
#     input    → the probe prompt sent to the AI
#     output   → the full AI response text (no truncation)
#     latency  → round-trip latency in milliseconds (float)

# Usage:
#     from app.services.blackbox.probe_logger import save_probe_csv

#     csv_path = save_probe_csv(
#         audit_id      = audit_id,
#         ai_name       = ai_name,
#         mode          = "api",           # or "ui"
#         probe_results = probe_results,   # list of probe dicts WITH latency_ms
#         started_at    = started_at,      # ISO string
#     )
# """

# from __future__ import annotations

# import csv
# import logging
# import os
# import re
# from datetime import datetime, timezone
# from pathlib import Path

# logger = logging.getLogger(__name__)

# # ── Where logs are stored ─────────────────────────────────────────────────────
# _THIS_FILE    = Path(__file__).resolve()          # …/app/services/blackbox/probe_logger.py
# _PROJECT_ROOT = _THIS_FILE.parents[3]            # three levels up = project root
# AUDIT_LOG_DIR = _PROJECT_ROOT / "audit_logs"

# # ── CSV columns (matches general_llm_logs schema) ─────────────────────────────
# CSV_FIELDNAMES = [
#     "task_id",   # probe_id  e.g. "transparency_1"
#     "input",     # the probe prompt
#     "output",    # full AI response text — NO truncation
#     "latency",   # round-trip ms (float)
# ]


# def _safe_name(name: str) -> str:
#     """Strips characters invalid in directory / file names."""
#     return re.sub(r'[^\w\-.]', '_', name.strip())[:50]


# def save_probe_csv(
#     audit_id:      str,
#     ai_name:       str,
#     mode:          str,
#     probe_results: list[dict],
#     started_at:    str = "",
# ) -> str:
#     """
#     Writes probe_results to a CSV file and returns the absolute file path.

#     Each item in probe_results must have at minimum:
#         probe_id  – used as task_id
#         prompt    – written to input column
#         response  – written to output column (full text, not truncated)

#     Optional:
#         latency_ms – float/int ms; written to latency column (blank if absent)
#     """
#     # ── Build directory ────────────────────────────────────────────────────
#     safe_ai = _safe_name(ai_name) or "unknown_ai"
#     ai_dir  = AUDIT_LOG_DIR / safe_ai
#     ai_dir.mkdir(parents=True, exist_ok=True)

#     # ── Build filename ─────────────────────────────────────────────────────
#     try:
#         dt_str = datetime.fromisoformat(started_at).strftime("%Y%m%d_%H%M%S")
#     except Exception:
#         dt_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

#     short_id  = audit_id[:8] if audit_id else "noid"
#     safe_mode = _safe_name(mode) or "unknown"
#     filename  = f"{dt_str}_{short_id}_{safe_mode}.csv"
#     filepath  = ai_dir / filename

#     # ── Write CSV ──────────────────────────────────────────────────────────
#     try:
#         with open(filepath, "w", newline="", encoding="utf-8") as f:
#             writer = csv.DictWriter(
#                 f,
#                 fieldnames=CSV_FIELDNAMES,
#                 extrasaction="ignore",  # silently drop any extra fields
#             )
#             writer.writeheader()

#             for pr in probe_results:
#                 writer.writerow({
#                     "task_id": pr.get("probe_id", ""),
#                     "input":   pr.get("prompt", ""),
#                     # Full response — probe_logger never truncates
#                     "output":  pr.get("response", ""),
#                     "latency": pr.get("latency_ms", ""),
#                 })

#         logger.info(
#             f"[probe_logger] CSV saved → {filepath}  ({len(probe_results)} rows)"
#         )
#         return str(filepath)

#     except Exception as exc:
#         # Never crash the audit because logging failed — just warn and continue
#         logger.error(f"[probe_logger] Failed to write CSV: {exc}")
#         return ""













"""
app/services/blackbox/probe_logger.py
=======================================
Saves probe results to a CSV after every blackbox audit (API mode and UI mode).

Output location:
    <project_root>/audit_logs/<ai_name>/<YYYYMMDD_HHMMSS>_<audit_id[:8]>_<mode>.csv

Schema (matches general_llm_logs format):
    task_id | input | output | latency

    task_id  → probe_id  (e.g. "transparency_1", "safety_3")
    input    → the probe prompt sent to the AI
    output   → the full AI response text (no truncation)
    latency  → round-trip latency in milliseconds (float)

Usage:
    from app.services.blackbox.probe_logger import save_probe_csv

    csv_path = save_probe_csv(
        audit_id      = audit_id,
        ai_name       = ai_name,
        mode          = "api",           # or "ui"
        probe_results = probe_results,   # list of probe dicts WITH latency_ms
        started_at    = started_at,      # ISO string
    )
"""

from __future__ import annotations

import csv
import logging
import os
import re
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)

# ── Where logs are stored ─────────────────────────────────────────────────────
_THIS_FILE    = Path(__file__).resolve()          # …/app/services/blackbox/probe_logger.py
_PROJECT_ROOT = _THIS_FILE.parents[3]            # three levels up = project root
AUDIT_LOG_DIR = _PROJECT_ROOT / "audit_logs"

# ── CSV columns (matches general_llm_logs schema) ─────────────────────────────
CSV_FIELDNAMES = [
    "task_id",   # probe_id  e.g. "transparency_1"
    "input",     # the probe prompt
    "output",    # full AI response text — NO truncation
    "latency",   # round-trip ms (float)
]

# ── CSV columns for Phase 1 cross-validation / fingerprint probes ─────────────

# ── Phase 1 CSV columns — three-source fingerprint schema ─────────────────
FINGERPRINT_CSV_FIELDNAMES = [
    "task_id",              # probe id  e.g. "sr_purpose"
    "dimension",            # governance dimension  e.g. "purpose", "refusals"
    "probe_question",       # the open-ended question asked
    "model_response",       # verbatim AI response — NO truncation
    "registration_value",   # what the operator registered for this dimension
    "system_prompt_value",  # what the system prompt says (if provided)
    "reconciliation_status",# AGREE | PARTIAL | CONFLICT | NO_MODEL_RESPONSE | SOURCE_ONLY
    "governance_finding",   # populated for CONFLICT rows (the actual governance issue)
    "notes",                # reconciliation reasoning
    "latency_ms",           # round-trip ms
]


def _safe_name(name: str) -> str:
    """Strips characters invalid in directory / file names."""
    return re.sub(r'[^\w\-.]', '_', name.strip())[:50]


def save_probe_csv(
    audit_id:      str,
    ai_name:       str,
    mode:          str,
    probe_results: list[dict],
    started_at:    str = "",
) -> str:
    """
    Writes probe_results to a CSV file.

    Each item in probe_results must have at minimum:
        probe_id   – used as task_id
        prompt     – written to input column
        response   – written to output column (full text, not truncated)
        latency_ms – optional float/int ms
    """
    safe_ai = _safe_name(ai_name) or "unknown_ai"
    ai_dir  = AUDIT_LOG_DIR / safe_ai
    ai_dir.mkdir(parents=True, exist_ok=True)

    try:
        dt_str = datetime.fromisoformat(started_at).strftime("%Y%m%d_%H%M%S")
    except Exception:
        dt_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    short_id  = audit_id[:8] if audit_id else "noid"
    safe_mode = _safe_name(mode) or "unknown"
    filename  = f"{dt_str}_{short_id}_{safe_mode}.csv"
    filepath  = ai_dir / filename

    try:
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=CSV_FIELDNAMES, extrasaction="ignore")
            writer.writeheader()
            for pr in probe_results:
                writer.writerow({
                    "task_id": pr.get("probe_id", ""),
                    "input":   pr.get("prompt", ""),
                    "output":  pr.get("response", ""),   # full — never truncated
                    "latency": pr.get("latency_ms", ""),
                })
        logger.info(f"[probe_logger] CSV saved → {filepath}  ({len(probe_results)} rows)")
        return str(filepath)
    except Exception as exc:
        logger.error(f"[probe_logger] Failed to write CSV: {exc}")
        return ""


def save_fingerprint_csv(
    audit_id:               str,
    ai_name:                str,
    reconciliation_records: list[dict],
    probes:                 list[dict],
    started_at:             str = "",
) -> str:
    """
    Writes Phase 1 three-source fingerprint results to a separate CSV.

    Filename: <YYYYMMDD_HHMMSS>_<audit_id[:8]>_phase1_xval.csv

    Each row = one governance dimension with:
      - The question asked (probe_question)
      - The model's verbatim response (model_response)
      - Registration value for this dimension (registration_value)
      - System prompt excerpt for this dimension (system_prompt_value)
      - Reconciliation outcome (reconciliation_status)
      - Governance finding if CONFLICT (governance_finding)

    reconciliation_records — list of dicts from behavioral_fingerprinter._build_fingerprint
        Keys: probe_id, dimension, probe_question, model_response, registration_value,
              system_prompt_value, status, governance_finding, notes, latency_ms

    probes — list of probe dicts from fingerprinter._probes_used
        (kept for backward compat; prompt text is now in reconciliation_records directly)
    """
    safe_ai = _safe_name(ai_name) or "unknown_ai"
    ai_dir  = AUDIT_LOG_DIR / safe_ai
    ai_dir.mkdir(parents=True, exist_ok=True)

    try:
        dt_str = datetime.fromisoformat(started_at).strftime("%Y%m%d_%H%M%S")
    except Exception:
        dt_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    short_id = audit_id[:8] if audit_id else "noid"
    filename = f"{dt_str}_{short_id}_phase1_xval.csv"
    filepath = ai_dir / filename

    # Build prompt lookup from probes list (backward compat fallback)
    prompt_by_field: dict[str, str] = {p.get("field", ""): p.get("prompt", "") for p in probes}

    try:
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=FINGERPRINT_CSV_FIELDNAMES, extrasaction="ignore")
            writer.writeheader()

            for rec in reconciliation_records:
                dim = rec.get("dimension") or rec.get("field", "")
                # Prefer probe_question from the record itself; fall back to probes lookup
                question = (
                    rec.get("probe_question")
                    or prompt_by_field.get(dim, "")
                )
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
            f"[probe_logger] Phase 1 CSV saved → {filepath}  ({len(reconciliation_records)} rows)"
        )
        return str(filepath)

    except Exception as exc:
        logger.error(f"[probe_logger] Failed to write Phase 1 CSV: {exc}")
        return ""

# ── Aliases expected by orchestrator ─────────────────────────────────────────
# orchestrator.py imports save_phase1_csv and save_phase2_csv.
# save_phase1_csv  → save_fingerprint_csv  (three-source fingerprint / Phase 1 results)
# save_phase2_csv  → save_probe_csv        (adversarial probes / Phase 2 results)

save_phase1_csv = save_fingerprint_csv
save_phase2_csv = save_probe_csv