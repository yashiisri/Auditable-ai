import pandas as pd
from datetime import datetime
import uuid


def detect_model_type(df: pd.DataFrame):
    columns = [c.lower() for c in df.columns]
    if "label" in columns or "class" in columns:
        return "classification"
    if "summary" in columns:
        return "summarization"
    if "step" in columns or "action" in columns:
        return "automation"
    return "general_llm"


def compute_data_quality(df: pd.DataFrame):
    total_cells   = df.size
    missing       = df.isna().sum().sum()
    missing_ratio = missing / total_cells if total_cells > 0 else 0
    duplicates    = df.duplicated().sum()
    schema_conf   = 1 - (missing_ratio * 0.5)

    data_quality_score = int(
        ((1 - missing_ratio) * 70) + (schema_conf * 30)
    )

    return {
        "missing_ratio":      round(missing_ratio, 4),
        "duplicates":         int(duplicates),
        "schema_confidence":  round(schema_conf, 3),
        "data_quality_score": min(data_quality_score, 100)
    }


def extract_column_intelligence(df: pd.DataFrame):
    text_cols    = [c for c in df.columns if not pd.api.types.is_numeric_dtype(df[c])]
    numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    return {
        "total_columns":   len(df.columns),
        "text_columns":    len(text_cols),
        "numeric_columns": len(numeric_cols),
        "column_names":    list(df.columns)
    }


def compute_structural_risk(score):
    if score >= 85: return "Low"
    if score >= 65: return "Moderate"
    return "High"


def generate_recommendation(score, logs_count):
    if logs_count < 30:
        return "Dataset size may limit advanced statistical evaluation."
    if score < 60:
        return "Improve data completeness before governance audit."
    return "Dataset structurally suitable for Trusted AI evaluation."


def run_sdcc_pipeline(ai_name, file, current_user):
    df = pd.read_csv(file.file)

    logs_count       = len(df)
    model_type       = detect_model_type(df)
    quality_metrics  = compute_data_quality(df)
    column_info      = extract_column_intelligence(df)
    structural_risk  = compute_structural_risk(quality_metrics["data_quality_score"])
    recommendation   = generate_recommendation(quality_metrics["data_quality_score"], logs_count)

    return {
        "scan_id":           str(uuid.uuid4()),
        "timestamp":         datetime.utcnow().isoformat(),
        "model_type":        model_type,
        "logs_ingested":     logs_count,
        "data_quality_score": quality_metrics["data_quality_score"],
        "structural_risk":   structural_risk,
        "diagnostics": {
            "missing_ratio":     quality_metrics["missing_ratio"],
            "duplicates":        quality_metrics["duplicates"],
            "schema_confidence": quality_metrics["schema_confidence"],
            **column_info
        },
        "recommendation": recommendation
    }