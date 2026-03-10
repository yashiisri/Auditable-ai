# import pandas as pd
# from datetime import datetime
# import uuid


# def detect_model_type(df: pd.DataFrame):
#     columns = [c.lower() for c in df.columns]
#     if "label" in columns or "class" in columns:
#         return "classification"
#     if "summary" in columns:
#         return "summarization"
#     if "step" in columns or "action" in columns:
#         return "automation"
#     return "general_llm"


# def compute_data_quality(df: pd.DataFrame):
#     total_cells   = df.size
#     missing       = df.isna().sum().sum()
#     missing_ratio = missing / total_cells if total_cells > 0 else 0
#     duplicates    = df.duplicated().sum()
#     schema_conf   = 1 - (missing_ratio * 0.5)

#     data_quality_score = int(
#         ((1 - missing_ratio) * 70) + (schema_conf * 30)
#     )

#     return {
#         "missing_ratio":      round(missing_ratio, 4),
#         "duplicates":         int(duplicates),
#         "schema_confidence":  round(schema_conf, 3),
#         "data_quality_score": min(data_quality_score, 100)
#     }


# def extract_column_intelligence(df: pd.DataFrame):
#     text_cols    = [c for c in df.columns if not pd.api.types.is_numeric_dtype(df[c])]
#     numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
#     return {
#         "total_columns":   len(df.columns),
#         "text_columns":    len(text_cols),
#         "numeric_columns": len(numeric_cols),
#         "column_names":    list(df.columns)
#     }


# def compute_structural_risk(score):
#     if score >= 85: return "Low"
#     if score >= 65: return "Moderate"
#     return "High"


# def generate_recommendation(score, logs_count):
#     if logs_count < 30:
#         return "Dataset size may limit advanced statistical evaluation."
#     if score < 60:
#         return "Improve data completeness before governance audit."
#     return "Dataset structurally suitable for Trusted AI evaluation."


# def run_sdcc_pipeline(ai_name, file, current_user):
#     df = pd.read_csv(file.file)

#     logs_count       = len(df)
#     model_type       = detect_model_type(df)
#     quality_metrics  = compute_data_quality(df)
#     column_info      = extract_column_intelligence(df)
#     structural_risk  = compute_structural_risk(quality_metrics["data_quality_score"])
#     recommendation   = generate_recommendation(quality_metrics["data_quality_score"], logs_count)

#     return {
#         "scan_id":           str(uuid.uuid4()),
#         "timestamp":         datetime.utcnow().isoformat(),
#         "model_type":        model_type,
#         "logs_ingested":     logs_count,
#         "data_quality_score": quality_metrics["data_quality_score"],
#         "structural_risk":   structural_risk,
#         "diagnostics": {
#             "missing_ratio":     quality_metrics["missing_ratio"],
#             "duplicates":        quality_metrics["duplicates"],
#             "schema_confidence": quality_metrics["schema_confidence"],
#             **column_info
#         },
#         "recommendation": recommendation
#     }



import pandas as pd
import json
from datetime import datetime
from fastapi import UploadFile
import uuid


def detect_model_type(df: pd.DataFrame) -> str:
    columns = [c.lower() for c in df.columns]
    if "label" in columns or "class" in columns or "target" in columns:
        return "classification"
    if "summary" in columns or "rouge_score" in columns or "faithfulness" in columns:
        return "summarization"
    if "step" in columns or "action" in columns or "workflow" in columns:
        return "automation"
    if "image" in columns or "bbox" in columns or "pixel" in columns:
        return "image_classification"
    return "general_llm"


def compute_data_quality(df: pd.DataFrame) -> dict:
    total_cells   = df.size
    missing       = df.isna().sum().sum()
    missing_ratio = missing / total_cells if total_cells > 0 else 0
    duplicates    = df.duplicated().sum()
    schema_conf   = 1 - (missing_ratio * 0.5)

    data_quality_score = int(
        ((1 - missing_ratio) * 70) + (schema_conf * 30)
    )

    return {
        "missing_ratio":      round(float(missing_ratio), 4),
        "duplicates":         int(duplicates),
        "schema_confidence":  round(float(schema_conf), 3),
        "data_quality_score": min(data_quality_score, 100)
    }


def extract_column_intelligence(df: pd.DataFrame) -> dict:
    text_cols    = [c for c in df.columns if not pd.api.types.is_numeric_dtype(df[c])]
    numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    return {
        "total_columns":   len(df.columns),
        "text_columns":    len(text_cols),
        "numeric_columns": len(numeric_cols),
        "column_names":    list(df.columns),
    }


def compute_structural_risk(score: int) -> str:
    if score >= 85: return "Low"
    if score >= 65: return "Moderate"
    return "High"


def generate_recommendation(score: int, logs_count: int) -> str:
    if logs_count < 30:
        return "Dataset size may limit advanced statistical evaluation. Aim for at least 100 records."
    if score < 60:
        return "Improve data completeness and reduce missing values before governance audit."
    if score < 80:
        return "Dataset is usable but has moderate quality issues. Consider enriching with additional fields."
    return "Dataset structurally suitable for comprehensive Trusted AI evaluation."


def parse_upload(file: UploadFile) -> pd.DataFrame:
    """Parse CSV or JSON upload into a DataFrame."""
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
        # Default: CSV
        df = pd.read_csv(file.file)

    # Normalise column names
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    return df


def run_sdcc_pipeline(ai_name: str, file: UploadFile, current_user: dict) -> dict:
    df = parse_upload(file)

    logs_count      = len(df)
    model_type      = detect_model_type(df)
    quality_metrics = compute_data_quality(df)
    column_info     = extract_column_intelligence(df)
    structural_risk = compute_structural_risk(quality_metrics["data_quality_score"])
    recommendation  = generate_recommendation(quality_metrics["data_quality_score"], logs_count)

    return {
        "scan_id":            str(uuid.uuid4()),
        "timestamp":          datetime.utcnow().isoformat(),
        "model_type":         model_type,
        "logs_ingested":      logs_count,
        "data_quality_score": quality_metrics["data_quality_score"],
        "structural_risk":    structural_risk,
        "diagnostics": {
            "missing_ratio":     quality_metrics["missing_ratio"],
            "duplicates":        quality_metrics["duplicates"],
            "schema_confidence": quality_metrics["schema_confidence"],
            **column_info
        },
        "recommendation": recommendation,
    }