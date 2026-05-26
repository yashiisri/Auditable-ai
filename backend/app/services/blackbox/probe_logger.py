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
FINGERPRINT_CSV_FIELDNAMES = [
    "task_id",      # xval probe id  e.g. "xval_domain"
    "field",        # which registration field was being validated
    "user_value",   # what the user entered at registration
    "input",        # the confirmation-style prompt sent to the AI
    "output",       # the AI's full response — NO truncation
    "status",       # MATCH | AI_ADDS_MORE | CONFLICT | NO_USER_VALUE | NO_RESPONSE
    "extra_detail", # additional context surfaced by AI (AI_ADDS_MORE only)
    "note",         # human-readable reconciliation explanation
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
    Writes probe_results to a CSV file and returns the absolute file path.

    Each item in probe_results must have at minimum:
        probe_id  – used as task_id
        prompt    – written to input column
        response  – written to output column (full text, not truncated)

    Optional:
        latency_ms – float/int ms; written to latency column (blank if absent)
    """
    # ── Build directory ────────────────────────────────────────────────────
    safe_ai = _safe_name(ai_name) or "unknown_ai"
    ai_dir  = AUDIT_LOG_DIR / safe_ai
    ai_dir.mkdir(parents=True, exist_ok=True)

    # ── Build filename ─────────────────────────────────────────────────────
    try:
        dt_str = datetime.fromisoformat(started_at).strftime("%Y%m%d_%H%M%S")
    except Exception:
        dt_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    short_id  = audit_id[:8] if audit_id else "noid"
    safe_mode = _safe_name(mode) or "unknown"
    filename  = f"{dt_str}_{short_id}_{safe_mode}.csv"
    filepath  = ai_dir / filename

    # ── Write CSV ──────────────────────────────────────────────────────────
    try:
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=CSV_FIELDNAMES,
                extrasaction="ignore",  # silently drop any extra fields
            )
            writer.writeheader()

            for pr in probe_results:
                writer.writerow({
                    "task_id": pr.get("probe_id", ""),
                    "input":   pr.get("prompt", ""),
                    # Full response — probe_logger never truncates
                    "output":  pr.get("response", ""),
                    "latency": pr.get("latency_ms", ""),
                })

        logger.info(
            f"[probe_logger] CSV saved → {filepath}  ({len(probe_results)} rows)"
        )
        return str(filepath)

    except Exception as exc:
        # Never crash the audit because logging failed — just warn and continue
        logger.error(f"[probe_logger] Failed to write CSV: {exc}")
        return ""

def save_fingerprint_csv(
    audit_id:                str,
    ai_name:                 str,
    reconciliation_records:  list[dict],
    probes:                  list[dict],   # original probe dicts (carry the prompt text)
    started_at:              str = "",
) -> str:
    """
    Writes Phase 1 cross-validation / fingerprint probe results to a separate
    CSV file alongside the main audit CSV.

    Filename format:
        <YYYYMMDD_HHMMSS>_<audit_id[:8]>_phase1_xval.csv

    Each row corresponds to one confirmation-style probe and includes both
    what the user said (user_value) and how the AI responded (output), plus
    the reconciliation outcome (status, note, extra_detail).

    reconciliation_records — list of dicts from behavioral_fingerprinter
        (each has: field, user_value, ai_response, status, merged_value,
         extra_detail, note)

    probes — list of probe dicts from _build_confirmation_probes
        (each has: id, field, prompt, user_value, generic)
        Used to recover the original prompt text for the "input" column.
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

    # Build a lookup: field → prompt text from the probe list
    prompt_by_field: dict[str, str] = {p["field"]: p["prompt"] for p in probes}

    try:
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=FINGERPRINT_CSV_FIELDNAMES,
                extrasaction="ignore",
            )
            writer.writeheader()

            for rec in reconciliation_records:
                field = rec.get("field", "")
                writer.writerow({
                    "task_id":      f"xval_{field}",
                    "field":        field,
                    "user_value":   rec.get("user_value", ""),
                    "input":        prompt_by_field.get(field, ""),
                    "output":       rec.get("ai_response", ""),   # full — never truncated
                    "status":       rec.get("status", ""),
                    "extra_detail": rec.get("extra_detail", ""),
                    "note":         rec.get("note", ""),
                })

        logger.info(
            f"[probe_logger] Phase 1 xval CSV saved → {filepath}  ({len(reconciliation_records)} rows)"
        )
        return str(filepath)

    except Exception as exc:
        logger.error(f"[probe_logger] Failed to write Phase 1 xval CSV: {exc}")
        return ""