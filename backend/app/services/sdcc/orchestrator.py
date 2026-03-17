"""
services/sdcc/orchestrator.py
==============================
SDCC (Structural Data Completeness Check) pipeline entry point.

Responsibilities (only these — no metric logic lives here)
-------------------------------------------------------------
1. Parse the uploaded file into a DataFrame
2. Detect the model type using the weighted detector
3. Compute universal data-quality diagnostics (completeness, duplicates, schema)
4. Store a sample of the raw rows so the /evaluate endpoint can reuse them
   without re-reading the file

Everything model-specific is in services/sdcc/models/<type>.py.
"""

from __future__ import annotations
import json
import uuid
from datetime import datetime

import pandas as pd
from fastapi import UploadFile

from app.services.sdcc.detector import detect_model_type


# ── File parser ───────────────────────────────────────────────────────────────

def parse_upload(file: UploadFile) -> pd.DataFrame:
    """Parse a CSV or JSON upload into a normalised DataFrame."""
    filename = (file.filename or "").lower()

    if filename.endswith(".json"):
        content = json.load(file.file)
        if isinstance(content, list):
            df = pd.DataFrame(content)
        elif isinstance(content, dict):
            df = pd.json_normalize(content)
        else:
            raise ValueError("JSON must be a list of objects or a dict.")
    else:
        df = pd.read_csv(file.file)

    # Normalise: lowercase, strip whitespace, underscores for spaces
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    return df


# ── Data quality ──────────────────────────────────────────────────────────────

def compute_data_quality(df: pd.DataFrame) -> dict:
    total = df.size
    missing = df.isna().sum().sum()
    missing_ratio = float(missing / total) if total > 0 else 0.0
    duplicates    = int(df.duplicated().sum())
    schema_conf   = 1.0 - (missing_ratio * 0.5)

    # 70% weight on completeness, 30% on schema confidence
    dq_score = min(int(((1 - missing_ratio) * 70) + (schema_conf * 30)), 100)

    text_cols = [c for c in df.columns if not pd.api.types.is_numeric_dtype(df[c])]
    num_cols  = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]

    return {
        "missing_ratio":      round(missing_ratio, 4),
        "duplicates":         duplicates,
        "schema_confidence":  round(schema_conf, 3),
        "data_quality_score": dq_score,
        "total_columns":      len(df.columns),
        "text_columns":       len(text_cols),
        "numeric_columns":    len(num_cols),
        "column_names":       list(df.columns),
    }


def _structural_risk(dq_score: int) -> str:
    if dq_score >= 85: return "Low"
    if dq_score >= 65: return "Moderate"
    return "High"


def _recommendation(dq_score: int, logs_count: int, model_type: str) -> str:
    if logs_count < 30:
        return (
            f"Dataset too small ({logs_count} records) for reliable {model_type} evaluation. "
            "Aim for ≥ 100 records; 500+ recommended."
        )
    if dq_score < 60:
        return (
            "Significant data quality issues detected. Resolve missing values and duplicates "
            "before running a governance audit."
        )
    if dq_score < 80:
        return (
            f"Dataset is usable for {model_type} evaluation but has moderate quality issues. "
            "Enriching logs with model-specific metric columns will improve audit depth."
        )
    return f"Dataset structurally suitable for a comprehensive {model_type} Trusted AI evaluation."


# ── Main entry point ──────────────────────────────────────────────────────────

def run_sdcc_pipeline(ai_name: str, file: UploadFile, current_user: dict) -> dict:
    df = parse_upload(file)

    model_type, detection_confidence = detect_model_type(df)
    quality = compute_data_quality(df)

    return {
        "scan_id":              str(uuid.uuid4()),
        "timestamp":            datetime.utcnow().isoformat(),
        "model_type":           model_type,
        "detection_confidence": detection_confidence,
        "logs_ingested":        len(df),
        "data_quality_score":   quality["data_quality_score"],
        "structural_risk":      _structural_risk(quality["data_quality_score"]),
        "diagnostics": {
            "missing_ratio":     quality["missing_ratio"],
            "duplicates":        quality["duplicates"],
            "schema_confidence": quality["schema_confidence"],
            "total_columns":     quality["total_columns"],
            "text_columns":      quality["text_columns"],
            "numeric_columns":   quality["numeric_columns"],
            "column_names":      quality["column_names"],
        },
        "recommendation": _recommendation(
            quality["data_quality_score"], len(df), model_type
        ),
        # Store up to 1 000 rows so /evaluate can recompute model metrics
        # without the file being re-uploaded.
        "sample_records": df.head(1_000).to_dict(orient="records"),
    }