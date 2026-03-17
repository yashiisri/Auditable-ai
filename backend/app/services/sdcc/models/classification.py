"""
services/sdcc/models/classification.py
========================================
Evaluator for binary and multi-class classification models.

Model-specific metrics
-----------------------
  - roc_auc          ROC-AUC score (from logged column or computed proxy)
  - f1_score         F1 score
  - precision        Precision
  - recall           Recall / sensitivity
  - class_balance    Minority-to-majority class ratio (1.0 = perfectly balanced)
  - avg_confidence   Mean prediction confidence / probability

TAF emphasis
------------
  Fairness and Reliability are the highest-weighted principles for classification
  because class imbalance and discriminatory predictions are the primary risks.
"""

from __future__ import annotations
import pandas as pd
from app.services.sdcc.base_evaluator import BaseEvaluator


class ClassificationEvaluator(BaseEvaluator):

    MODEL_TYPE  = "classification"
    LABEL       = "Classification"
    DESCRIPTION = "Binary or multi-class prediction models (tabular, NLP, or image-based)"

    # ── Thresholds ────────────────────────────────────────────────────────────
    # Derived from industry benchmarks for production ML systems.
    THRESHOLDS = {
        "roc_auc":        {"low": 0.85, "moderate": 0.70, "unit": "score"},
        "f1_score":       {"low": 0.80, "moderate": 0.65, "unit": "score"},
        "precision":      {"low": 0.75, "moderate": 0.60, "unit": "score"},
        "recall":         {"low": 0.75, "moderate": 0.60, "unit": "score"},
        "class_balance":  {"low": 0.80, "moderate": 0.50, "unit": "ratio"},
        "avg_confidence": {"low": 0.80, "moderate": 0.65, "unit": "score"},
    }

    TAF_METRIC_WEIGHTS = {
        "Fairness":       0.35,   # class balance → fairness
        "Reliability":    0.30,   # F1/ROC-AUC → reliability
        "Explainability": 0.20,   # confidence scores → explainability
        "Data Integrity": 0.15,   # label availability → data integrity
    }

    # ── Model metrics ─────────────────────────────────────────────────────────

    def model_metrics(self, df: pd.DataFrame) -> dict:
        # Class balance — minority/majority ratio from label column
        label_col = self._col(df, "label", "class", "target", "ground_truth", "true_label", "actual")
        class_balance = None
        if label_col is not None:
            vc = df[label_col].value_counts()
            if len(vc) >= 2:
                class_balance = float(vc.min() / vc.max())

        return {
            "roc_auc": self._metric_result(
                self._mean(df, "roc_auc", "auc", "auc_score"),
                "Area Under the ROC Curve — measures separability between classes",
                "roc_auc",
            ),
            "f1_score": self._metric_result(
                self._mean(df, "f1_score", "f1", "f1score"),
                "F1 Score — harmonic mean of precision and recall",
                "f1_score",
            ),
            "precision": self._metric_result(
                self._mean(df, "precision", "ppv", "precision_score"),
                "Precision — proportion of positive predictions that are correct",
                "precision",
            ),
            "recall": self._metric_result(
                self._mean(df, "recall", "sensitivity", "tpr", "recall_score"),
                "Recall / Sensitivity — proportion of actual positives correctly identified",
                "recall",
            ),
            "class_balance": self._metric_result(
                class_balance,
                "Class balance ratio (minority class / majority class); 1.0 = perfectly balanced",
                "class_balance",
            ),
            "avg_confidence": self._metric_result(
                self._mean(df, "probability", "confidence", "score", "prob", "pred_prob"),
                "Mean prediction confidence score logged by the model",
                "avg_confidence",
            ),
        }

    # ── TAF principles ────────────────────────────────────────────────────────

    def taf_principles(
        self,
        diagnostics: dict,
        logs_count: int,
        metrics: dict,
    ) -> dict:
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

        # 1. Transparency
        t = {
            "Schema Confidence":       s["schema_score"],
            "Field Documentation":     c(io * 4 + s["schema_score"] * 0.2),
            "Model Version Tracking":  100 if s["has_version"] else 30,
            "Input/Output Coverage":   c(io * 4.5),
            "Label Column Present":    100 if s["has_label"] else 20,
        }

        # 2. Explainability — confidence scores are primary signal for classification
        e = {
            "Model Interpretability":  75,   # classification models are relatively interpretable
            "Prediction Confidence":   100 if has_conf else 40,
            "SHAP/Feature Importance": 100 if s["has_score"] else 30,
            "Feedback Integration":    100 if s["has_feedback"] else 30,
            "Output Traceability":     c(io * 4 + (20 if has_conf else 0)),
        }

        # 3. Fairness — class balance is the primary risk for classification
        balance_score = c(balance_val * 100) if has_balance else 50
        f = {
            "Data Completeness":   s["completeness"],
            "Class Balance":       balance_score,
            "Demographic Coverage": c(60 + s["text_ratio"] * 0.4),
            "Bias Indicator Fields": 100 if s["has_feedback"] else (60 if s["has_label"] else 25),
            "Missing Data Equity": c((1 - s["missing"] * 2) * 100),
        }

        # 4. Accountability
        a = {
            "Audit Log Volume":        s["volume_score"],
            "Timestamp Coverage":      100 if s["has_timestamp"] else 20,
            "User Attribution":        100 if s["has_user_id"] else 25,
            "Model Version Control":   100 if s["has_version"] else 30,
            "Error/Exception Logging": 100 if s["has_error"] else 35,
        }

        # 5. Data Integrity — ROC-AUC and F1 as ground-truth quality proxies
        di = {
            "Completeness Score":      s["completeness"],
            "Duplicate-Free Rate":     s["dup_penalty"],
            "Schema Consistency":      s["schema_score"],
            "Ground Truth Labels":     100 if s["has_label"] else 20,
            "Performance Metric Logs": 100 if (has_roc or has_f1) else 35,
        }

        # 6. Reliability — F1/ROC-AUC are the primary reliability metrics
        r = {
            "ROC-AUC Score":       (c(metrics["roc_auc"]["value"] * 100) if has_roc else 35),
            "F1 Score":            (c(metrics["f1_score"]["value"] * 100) if has_f1 else 35),
            "Latency Monitoring":  100 if s["has_latency"] else 30,
            "Error Rate Tracking": 100 if s["has_error"] else 35,
            "Volume Sufficiency":  s["volume_score"],
        }

        # 7. Security
        sec = {
            "Safety Flagging":        100 if s["has_safety"] else 25,
            "Input Validation":       c(s["schema_score"] * 0.8 + (20 if s["has_input"] else 0)),
            "Adversarial Robustness": 55,   # classification models have moderate robustness baseline
            "Content Moderation":     100 if s["has_safety"] else 30,
            "PII Detection":          100 if s["has_pii"] else 20,
        }

        # 8. Privacy
        pr = {
            "PII Field Tracking":    100 if s["has_pii"] else 20,
            "Data Minimisation":     c(100 - (s["total_cols"] / 20) * 40),
            "User Anonymisation":    50 if s["has_user_id"] else 70,
            "Consent Management":    40,
            "Data Retention Signals": 100 if s["has_timestamp"] else 30,
        }

        # 9. Sustainability
        su = {
            "Dataset Efficiency":    c(100 - (logs_count / 10_000) * 30),
            "Feature Engineering":   c(s["col_diversity"] * 0.7 + 30),
            "Compute Efficiency":    80,   # classification is relatively lightweight
            "Redundancy Elimination": s["dup_penalty"],
            "Resource Optimisation": c(s["schema_score"] * 0.6 + 40),
        }

        # 10. Safety — safeguarding against harm to people, businesses, and property
        # For classification: mispredictions in high-stakes domains (medical, credit, hiring) are harm events
        sf = {
            "Harm Prevention Logging":   100 if s["has_safety"] else 20,
            "Safety Test Coverage":      100 if s["has_feedback"] else 30,
            "Human Override Capability": 100 if s["has_override"] else (60 if s["has_feedback"] else 20),
            "Incident Response Signals": 100 if s["has_error"] else 30,
            "Safeguard Effectiveness":   100 if s["has_safety"] else 25,
        }

        raw = {
            "Transparency":   {"score": p(t),  "parameters": t},
            "Explainability": {"score": p(e),  "parameters": e},
            "Fairness":       {"score": p(f),  "parameters": f},
            "Accountability": {"score": p(a),  "parameters": a},
            "Data Integrity": {"score": p(di), "parameters": di},
            "Reliability":    {"score": p(r),  "parameters": r},
            "Security":       {"score": p(sec),"parameters": sec},
            "Privacy":        {"score": p(pr), "parameters": pr},
            "Sustainability": {"score": p(su), "parameters": su},
            "Safety":         {"score": p(sf), "parameters": sf},
        }

        # Apply model-metric boosts (capped at 100)
        for principle, b in boost.items():
            if principle in raw:
                raw[principle]["score"] = c(raw[principle]["score"] + b)

        return raw

    # ── Recommendations ───────────────────────────────────────────────────────

    _METRIC_RECS = {
        "roc_auc":        "ROC-AUC below threshold. Review feature quality, class separation, and model architecture.",
        "f1_score":        "F1 below threshold. Balance precision/recall trade-off based on the use-case cost matrix.",
        "precision":       "Low precision — too many false positives. Raise decision threshold or improve features.",
        "recall":          "Low recall — too many false negatives. Lower decision threshold or add training data.",
        "class_balance":   "Severe class imbalance detected. Apply SMOTE, class weighting, or collect more minority samples.",
        "avg_confidence":  "Low average confidence may indicate distribution shift or poor calibration. Recalibrate the model.",
    }

    def _rec_for_metric(self, metric_name: str) -> str:
        return self._METRIC_RECS.get(
            metric_name,
            f"Investigate elevated risk in '{metric_name}' for this classification model.",
        )