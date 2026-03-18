"""
services/sdcc/models/classification.py  (REFACTORED)
"""
from __future__ import annotations
import pandas as pd
from app.services.sdcc.base_evaluator import BaseEvaluator


class ClassificationEvaluator(BaseEvaluator):

    MODEL_TYPE  = "classification"
    LABEL       = "Classification"
    DESCRIPTION = "Binary or multi-class prediction models (tabular, NLP, or image-based)"

    THRESHOLDS = {
        "roc_auc":        {"low": 0.85, "moderate": 0.70, "unit": "score"},
        "f1_score":       {"low": 0.80, "moderate": 0.65, "unit": "score"},
        "precision":      {"low": 0.75, "moderate": 0.60, "unit": "score"},
        "recall":         {"low": 0.75, "moderate": 0.60, "unit": "score"},
        "class_balance":  {"low": 0.80, "moderate": 0.50, "unit": "ratio"},
        "avg_confidence": {"low": 0.80, "moderate": 0.65, "unit": "score"},
    }

    TAF_METRIC_WEIGHTS = {
        "Fairness":       0.35,
        "Reliability":    0.30,
        "Explainability": 0.20,
        "Data Integrity": 0.15,
    }

    def model_metrics(self, df: pd.DataFrame, computed: dict | None = None) -> dict:
        c = computed or {}

        roc_val   = c.get("roc_auc")        or self._mean(df, "roc_auc", "auc", "auc_score")
        f1_val    = c.get("f1_score")        or self._mean(df, "f1_score", "f1", "f1score")
        prec_val  = c.get("precision")       or self._mean(df, "precision", "ppv", "precision_score")
        rec_val   = c.get("recall")          or self._mean(df, "recall", "sensitivity", "tpr")
        bal_val   = c.get("class_balance")   or None   # always computed by calculator
        conf_val  = c.get("avg_confidence")  or self._mean(df, "probability", "confidence", "score")

        # Fallback class balance from label column
        if bal_val is None:
            label_col = self._col(df, "label", "class", "target", "ground_truth", "true_label", "actual")
            if label_col is not None:
                vc = df[label_col].value_counts()
                if len(vc) >= 2:
                    bal_val = float(vc.min() / vc.max())

        return {
            "roc_auc": self._metric_result(
                roc_val,
                "Area Under the ROC Curve — computed from predicted probabilities vs ground-truth labels",
                "roc_auc",
            ),
            "f1_score": self._metric_result(
                f1_val,
                "F1 Score — harmonic mean of precision and recall (computed)",
                "f1_score",
            ),
            "precision": self._metric_result(
                prec_val,
                "Precision — proportion of positive predictions that are correct (computed)",
                "precision",
            ),
            "recall": self._metric_result(
                rec_val,
                "Recall / Sensitivity — proportion of actual positives correctly identified (computed)",
                "recall",
            ),
            "class_balance": self._metric_result(
                bal_val,
                "Class balance ratio (minority class / majority class); 1.0 = perfectly balanced",
                "class_balance",
            ),
            "avg_confidence": self._metric_result(
                conf_val,
                "Mean prediction confidence score",
                "avg_confidence",
            ),
        }

    def taf_principles(self, diagnostics: dict, logs_count: int, metrics: dict) -> dict:
        s = self._structural(diagnostics, logs_count)
        io = self._io_bonus(s)
        boost = self._metric_boost(metrics)
        c = self.clamp
        p = self.param_score

        has_roc     = metrics.get("roc_auc", {}).get("value") is not None
        has_f1      = metrics.get("f1_score", {}).get("value") is not None
        has_conf    = metrics.get("avg_confidence", {}).get("value") is not None
        has_balance = metrics.get("class_balance", {}).get("value") is not None
        balance_val = metrics.get("class_balance", {}).get("value") or 0.0

        t = {
            "Schema Confidence":      s["schema_score"],
            "Field Documentation":    c(io * 4 + s["schema_score"] * 0.2),
            "Model Version Tracking": 100 if s["has_version"] else 30,
            "Input/Output Coverage":  c(io * 4.5),
            "Label Column Present":   100 if s["has_label"] else 20,
        }

        e = {
            "Model Interpretability": 75,
            "Prediction Confidence":  100 if has_conf else 40,
            "SHAP/Feature Importance": 100 if s["has_score"] else 30,
            "Feedback Integration":   100 if s["has_feedback"] else 30,
            "Output Traceability":    c(io * 4 + (20 if has_conf else 0)),
        }

        balance_score = c(balance_val * 100) if has_balance else 50
        f = {
            "Data Completeness":     s["completeness"],
            "Class Balance":         balance_score,
            "Demographic Coverage":  c(60 + s["text_ratio"] * 0.4),
            "Bias Indicator Fields": 100 if s["has_feedback"] else (60 if s["has_label"] else 25),
            "Missing Data Equity":   c((1 - s["missing"] * 2) * 100),
        }

        a = {
            "Audit Log Volume":        s["volume_score"],
            "Timestamp Coverage":      100 if s["has_timestamp"] else 20,
            "User Attribution":        100 if s["has_user_id"] else 25,
            "Model Version Control":   100 if s["has_version"] else 30,
            "Error/Exception Logging": 100 if s["has_error"] else 35,
        }

        di = {
            "Completeness Score":      s["completeness"],
            "Duplicate-Free Rate":     s["dup_penalty"],
            "Schema Consistency":      s["schema_score"],
            "Ground Truth Labels":     100 if s["has_label"] else 20,
            "Performance Metric Logs": 100 if (has_roc or has_f1) else 35,
        }

        r = {
            "ROC-AUC Score":       (c(metrics["roc_auc"]["value"] * 100) if has_roc else 35),
            "F1 Score":            (c(metrics["f1_score"]["value"] * 100) if has_f1 else 35),
            "Latency Monitoring":  100 if s["has_latency"] else 30,
            "Error Rate Tracking": 100 if s["has_error"] else 35,
            "Volume Sufficiency":  s["volume_score"],
        }

        sec = {
            "Safety Flagging":        100 if s["has_safety"] else 25,
            "Input Validation":       c(s["schema_score"] * 0.8 + (20 if s["has_input"] else 0)),
            "Adversarial Robustness": 55,
            "Content Moderation":     100 if s["has_safety"] else 30,
            "PII Detection":          100 if s["has_pii"] else 20,
        }

        pr = {
            "PII Field Tracking":     100 if s["has_pii"] else 20,
            "Data Minimisation":      c(100 - (s["total_cols"] / 20) * 40),
            "User Anonymisation":     50 if s["has_user_id"] else 70,
            "Consent Management":     40,
            "Data Retention Signals": 100 if s["has_timestamp"] else 30,
        }

        su = {
            "Dataset Efficiency":    c(100 - (logs_count / 10_000) * 30),
            "Feature Engineering":   c(s["col_diversity"] * 0.7 + 30),
            "Compute Efficiency":    80,
            "Redundancy Elimination": s["dup_penalty"],
            "Resource Optimisation": c(s["schema_score"] * 0.6 + 40),
        }

        sf = {
            "Harm Prevention Logging":   100 if s["has_safety"] else 20,
            "Safety Test Coverage":      100 if s["has_feedback"] else 30,
            "Human Override Capability": 100 if s["has_override"] else (60 if s["has_feedback"] else 20),
            "Incident Response Signals": 100 if s["has_error"] else 30,
            "Safeguard Effectiveness":   100 if s["has_safety"] else 25,
        }

        raw = {
            "Transparency":   {"score": p(t),   "parameters": t},
            "Explainability": {"score": p(e),   "parameters": e},
            "Fairness":       {"score": p(f),   "parameters": f},
            "Accountability": {"score": p(a),   "parameters": a},
            "Data Integrity": {"score": p(di),  "parameters": di},
            "Reliability":    {"score": p(r),   "parameters": r},
            "Security":       {"score": p(sec), "parameters": sec},
            "Privacy":        {"score": p(pr),  "parameters": pr},
            "Sustainability": {"score": p(su),  "parameters": su},
            "Safety":         {"score": p(sf),  "parameters": sf},
        }

        for principle, b in boost.items():
            if principle in raw:
                raw[principle]["score"] = c(raw[principle]["score"] + b)

        return raw

    _METRIC_RECS = {
        "roc_auc":       "ROC-AUC below threshold. Review feature quality, class separation, and model architecture.",
        "f1_score":      "F1 below threshold. Balance precision/recall trade-off based on the use-case cost matrix.",
        "precision":     "Low precision — too many false positives. Raise decision threshold or improve features.",
        "recall":        "Low recall — too many false negatives. Lower decision threshold or add training data.",
        "class_balance": "Severe class imbalance detected. Apply SMOTE, class weighting, or collect more minority samples.",
        "avg_confidence": "Low average confidence may indicate distribution shift or poor calibration. Recalibrate the model.",
    }

    def _rec_for_metric(self, metric_name: str) -> str:
        return self._METRIC_RECS.get(metric_name,
            f"Investigate elevated risk in '{metric_name}' for this classification model.")