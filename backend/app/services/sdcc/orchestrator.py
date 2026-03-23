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

# ── Supported document formats for direct document upload ────────────────────
_DOCUMENT_EXTENSIONS = {".txt", ".md", ".pdf", ".docx"}
_LOG_EXTENSIONS      = {".csv", ".json"}


def is_document_upload(filename: str) -> bool:
    """Return True if this is a raw document upload (not a CSV/JSON log)."""
    lower = (filename or "").lower()
    return any(lower.endswith(ext) for ext in _DOCUMENT_EXTENSIONS)


def parse_upload(file: UploadFile) -> pd.DataFrame:
    """
    Parse an uploaded file into a normalised DataFrame.

    Supported formats:
      CSV / JSON  → normal log format: each row = one inference record
      TXT / MD    → treated as a source document; produces a single-row DataFrame
                    with columns: [source, document_mode=True]
      PDF / DOCX  → text extracted and treated as source document (single row)

    For document uploads (TXT/PDF/DOCX), the DataFrame has columns:
      source   : the full extracted document text
    The evaluate endpoint detects document_mode and handles accordingly.
    """
    filename = (file.filename or "").lower()
    content  = file.file.read()

    # ── Raw document upload ───────────────────────────────────────────────────
    if is_document_upload(filename):
        from app.services.sdcc.models.summarization import SummarizationEvaluator
        try:
            text = SummarizationEvaluator.extract_text_from_document(content, filename)
        except ValueError as e:
            raise ValueError(str(e))

        if not text or not text.strip():
            raise ValueError(f"Could not extract any text from '{filename}'. "
                             "Ensure the document is not empty or password-protected.")

        # Split into chunks of ~500 words to simulate multi-document evaluation
        words  = text.split()
        chunk_size = 500
        chunks = []
        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i:i+chunk_size])
            if chunk.strip():
                chunks.append(chunk)

        if not chunks:
            chunks = [text]

        df = pd.DataFrame({"source": chunks})
        df["_document_mode"] = True   # flag for evaluate endpoint
        return df

    # ── CSV / JSON log upload ─────────────────────────────────────────────────
    import io
    if filename.endswith(".json"):
        content_str = content.decode("utf-8", errors="replace")
        import json as _json
        parsed = _json.loads(content_str)
        if isinstance(parsed, list):
            df = pd.DataFrame(parsed)
        elif isinstance(parsed, dict):
            df = pd.json_normalize(parsed)
        else:
            raise ValueError("JSON must be a list of objects or a dict.")
    else:
        df = pd.read_csv(io.BytesIO(content))

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

    # ── Detect document_mode ─────────────────────────────────────────────────
    document_mode = bool(df.get("_document_mode", pd.Series([False])).any()
                         if "_document_mode" in df.columns else False)
    if document_mode:
        # Document upload: force summarization model type
        # Remove the internal flag column before analysis
        df_clean = df.drop(columns=["_document_mode"])
        model_type          = "summarization"
        detection_confidence = 0.95   # we're certain — it's a document
    else:
        df_clean = df
        model_type, detection_confidence = detect_model_type(df_clean)

    quality = compute_data_quality(df_clean)

    result = {
        "scan_id":              str(uuid.uuid4()),
        "timestamp":            datetime.utcnow().isoformat(),
        "model_type":           model_type,
        "detection_confidence": detection_confidence,
        "document_mode":        document_mode,
        "logs_ingested":        len(df_clean),
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
        "recommendation": (
            f"Document uploaded and split into {len(df_clean)} chunk(s) for summarization evaluation. "
            "The system will evaluate compression, faithfulness, coverage, and abstractiveness. "
            "Add a 'summary' column or reference summaries for supervised metrics."
            if document_mode
            else _recommendation(quality["data_quality_score"], len(df_clean), model_type)
        ),
        # Store up to 1 000 rows so /evaluate can recompute model metrics
        "sample_records": df_clean.head(1_000).to_dict(orient="records"),
    }

    if document_mode:
        result["document_mode_note"] = (
            "Raw document uploaded. Source text has been split into "
            f"{len(df_clean)} chunk(s). To evaluate generated summaries, "
            "provide them via the evaluate endpoint."
        )

    return result