def calculate_risk(metrics, model_type):
    risk_score = 0

    if metrics.get("total_logs", 0) < 50:
        risk_score += 30

    if not metrics.get("input_column") or not metrics.get("output_column"):
        risk_score += 40

    if model_type == "image_classification":
        risk_score += 10

    if risk_score < 30:
        level = "Low"
    elif risk_score < 60:
        level = "Medium"
    else:
        level = "High"

    return {
        "risk_score": risk_score,
        "risk_level": level
    }