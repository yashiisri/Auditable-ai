"""
services/sdcc/models/image_cv.py  (REFACTORED)
"""
from __future__ import annotations
import pandas as pd
from app.services.sdcc.base_evaluator import BaseEvaluator


class ImageCVEvaluator(BaseEvaluator):

    MODEL_TYPE  = "image_classification"
    LABEL       = "Computer Vision / Image Classification"
    DESCRIPTION = "Object detection, image classification, and segmentation models"

    THRESHOLDS = {
        "map_score":        {"low": 0.60, "moderate": 0.40, "unit": "score"},
        "avg_iou":          {"low": 0.75, "moderate": 0.50, "unit": "score"},
        "top_k_accuracy":   {"low": 0.85, "moderate": 0.70, "unit": "ratio"},
        "avg_confidence":   {"low": 0.80, "moderate": 0.65, "unit": "score"},
        "label_coverage":   {"low": 0.95, "moderate": 0.80, "unit": "ratio"},
        "avg_inference_ms": {"low": 100,  "moderate": 500,  "unit": "ms", "inverted": True},
    }

    TAF_METRIC_WEIGHTS = {
        "Reliability":    0.35,
        "Fairness":       0.30,
        "Data Integrity": 0.20,
        "Explainability": 0.15,
    }

    def model_metrics(self, df: pd.DataFrame, computed: dict | None = None) -> dict:
        c = computed or {}

        map_val   = c.get("map_score")        or self._mean(df, "map", "mean_average_precision", "map_score")
        iou_val   = c.get("avg_iou")          or self._mean(df, "iou", "intersection_over_union", "mean_iou")
        topk_val  = c.get("top_k_accuracy")   or self._mean(df, "top_k", "top_k_accuracy", "top5_acc")
        conf_val  = c.get("avg_confidence")   or self._mean(df, "confidence_score", "confidence", "detection_score")
        lbl_val   = c.get("label_coverage")   or self._coverage(df, "label", "ground_truth", "annotation", "category")
        lat_val   = c.get("avg_inference_ms") or self._mean(df, "latency", "inference_time", "duration_ms")

        return {
            "map_score": self._metric_result(
                map_val,
                "Mean Average Precision — primary detection performance metric "
                "(from map/confidence columns or computed proxy)",
                "map_score",
            ),
            "avg_iou": self._metric_result(
                iou_val,
                "Mean Intersection-over-Union for bounding box predictions (computed)",
                "avg_iou",
            ),
            "top_k_accuracy": self._metric_result(
                topk_val,
                "Top-K classification accuracy — proportion of outputs with confidence ≥ 0.5 "
                "(computed from confidence column)",
                "top_k_accuracy",
            ),
            "avg_confidence": self._metric_result(
                conf_val,
                "Mean prediction confidence / detection score",
                "avg_confidence",
            ),
            "label_coverage": self._metric_result(
                lbl_val,
                "Proportion of images with ground-truth labels available for validation",
                "label_coverage",
            ),
            "avg_inference_ms": self._metric_result(
                lat_val,
                "Mean model inference time per image in milliseconds",
                "avg_inference_ms",
            ),
        }

    def taf_principles(self, diagnostics: dict, logs_count: int, metrics: dict) -> dict:
        s = self._structural(diagnostics, logs_count)
        io = self._io_bonus(s)
        boost = self._metric_boost(metrics)
        c = self.clamp
        p = self.param_score

        map_val  = metrics.get("map_score",      {}).get("value")
        iou_val  = metrics.get("avg_iou",         {}).get("value")
        topk_val = metrics.get("top_k_accuracy",  {}).get("value")
        conf_val = metrics.get("avg_confidence",  {}).get("value")
        lbl_val  = metrics.get("label_coverage",  {}).get("value")

        map_score  = c((map_val  or 0) * 100) if map_val  is not None else 30
        iou_score  = c((iou_val  or 0) * 100) if iou_val  is not None else 30
        topk_score = c((topk_val or 0) * 100) if topk_val is not None else 30
        conf_score = c((conf_val or 0) * 100) if conf_val is not None else 30
        lbl_score  = c((lbl_val  or 0) * 100) if lbl_val  is not None else 20

        t = {
            "Schema Confidence":      s["schema_score"],
            "Field Documentation":    c(io * 4 + s["schema_score"] * 0.2),
            "Model Version Tracking": 100 if s["has_version"] else 30,
            "Image ID Logging":       100 if s["has_input"] else 20,
            "Label Column Present":   lbl_score,
        }

        e = {
            "Model Interpretability":  40,
            "Prediction Confidence":   conf_score,
            "Detection Score Logging": c(io * 4 + (20 if s["has_score"] else 0)),
            "Feedback Integration":    100 if s["has_feedback"] else 30,
            "Output Traceability":     c(io * 4.5),
        }

        f = {
            "Data Completeness":      s["completeness"],
            "Class/Category Balance": lbl_score,
            "Demographic Coverage":   c(60 + s["text_ratio"] * 0.4),
            "Bias Indicator Fields":  100 if s["has_feedback"] else 30,
            "Missing Data Equity":    c((1 - s["missing"] * 2) * 100),
        }

        a = {
            "Audit Log Volume":        s["volume_score"],
            "Timestamp Coverage":      100 if s["has_timestamp"] else 20,
            "Image ID Attribution":    100 if s["has_user_id"] else 25,
            "Model Version Control":   100 if s["has_version"] else 30,
            "Error/Exception Logging": 100 if s["has_error"] else 35,
        }

        di = {
            "Completeness Score":    s["completeness"],
            "Duplicate-Free Rate":   s["dup_penalty"],
            "Ground Truth Coverage": lbl_score,
            "Schema Consistency":    s["schema_score"],
            "Annotation Quality":    c(lbl_score * 0.7 + conf_score * 0.3),
        }

        r = {
            "mAP Score":           map_score,
            "Mean IoU":            iou_score,
            "Top-K Accuracy":      topk_score,
            "Latency Monitoring":  100 if s["has_latency"] else 30,
            "Volume Sufficiency":  s["volume_score"],
        }

        sec = {
            "Safety Flagging":        100 if s["has_safety"] else 25,
            "Input Validation":       c(s["schema_score"] * 0.8 + (20 if s["has_input"] else 0)),
            "Adversarial Robustness": 45,
            "Content Moderation":     100 if s["has_safety"] else 30,
            "PII Detection":          100 if s["has_pii"] else 20,
        }

        pr = {
            "PII/Biometric Field Tracking": 100 if s["has_pii"] else 15,
            "Data Minimisation":            c(100 - (s["total_cols"] / 20) * 40),
            "Face/Biometric Anonymisation": 100 if s["has_pii"] else 20,
            "Consent Management":           40,
            "Data Retention Signals":       100 if s["has_timestamp"] else 30,
        }

        su = {
            "Dataset Efficiency":    c(100 - (logs_count / 10_000) * 30),
            "Feature Engineering":   c(s["col_diversity"] * 0.7 + 30),
            "Compute Proxy Score":   35,
            "Redundancy Elimination": s["dup_penalty"],
            "Resource Optimisation": c(s["schema_score"] * 0.6 + 40),
        }

        sf = {
            "Harm Prevention Logging":    100 if s["has_safety"] else 20,
            "Misidentification Controls": conf_score,
            "Human Override Capability":  100 if s["has_override"] else (60 if s["has_feedback"] else 20),
            "Incident Response Signals":  100 if s["has_error"] else 30,
            "Safeguard Effectiveness":    lbl_score,
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
        "map_score":        "mAP below threshold. Review anchor sizes, NMS thresholds, and class-specific recall.",
        "avg_iou":          "Mean IoU below threshold. Improve bounding box regression or increase data diversity.",
        "top_k_accuracy":   "Top-K accuracy below threshold. Investigate hard negatives and augmentation strategy.",
        "avg_confidence":   "Low confidence may indicate distribution shift between train and test domains.",
        "label_coverage":   "Label coverage below threshold. Improve annotation pipeline to reach 95%+ coverage.",
        "avg_inference_ms": "Inference latency above threshold. Consider quantisation, TensorRT, or model pruning.",
    }

    def _rec_for_metric(self, metric_name: str) -> str:
        return self._METRIC_RECS.get(metric_name,
            f"Investigate elevated risk in '{metric_name}' for this CV model.")