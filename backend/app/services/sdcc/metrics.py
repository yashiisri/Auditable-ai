import numpy as np


def detect_columns(df):
    input_col = None
    output_col = None

    for col in df.columns:
        if any(k in col for k in ["input", "prompt", "query", "text"]):
            input_col = col
        if any(k in col for k in ["output", "response", "answer", "prediction"]):
            output_col = col

    return input_col, output_col


def extract_metrics(df, model_type):
    metrics = {}

    metrics["total_logs"] = len(df)
    metrics["total_columns"] = len(df.columns)
    metrics["columns_detected"] = list(df.columns)

    input_col, output_col = detect_columns(df)

    metrics["input_column"] = input_col
    metrics["output_column"] = output_col

    # 📊 Data Quality
    metrics["missing_ratio"] = float(df.isnull().mean().mean())

    # 📏 Length stats
    if input_col:
        metrics["avg_input_length"] = float(df[input_col].astype(str).str.len().mean())

    if output_col:
        metrics["avg_output_length"] = float(df[output_col].astype(str).str.len().mean())

    # 🏷 Classification specific
    if model_type == "classification":
        if "label" in df.columns:
            metrics["unique_labels"] = int(df["label"].nunique())

    # 🧠 Confidence estimation
    metrics["schema_confidence"] = round(
        1 - metrics["missing_ratio"], 2
    )

    return metrics