def detect_model_type(df):
    cols = df.columns.tolist()

    if any("label" in c for c in cols):
        return "classification"
    if any("image" in c or "bbox" in c for c in cols):
        return "image_classification"
    if any("summary" in c for c in cols):
        return "summarization"
    if any("workflow" in c or "step" in c for c in cols):
        return "automation"

    return "general_llm"