"""
services/sdcc/models/image_cv.py
==================================
Evaluator for Computer Vision models — object detection, image classification,
segmentation, and related tasks.

Model-specific metrics
-----------------------
  - map_score         Mean Average Precision (object detection / segmentation)
  - avg_iou           Mean Intersection-over-Union for bounding box predictions
  - top_k_accuracy    Top-K classification accuracy
  - avg_confidence    Mean prediction confidence score
  - label_coverage    Proportion of records with ground-truth labels
  - avg_inference_ms  Mean model inference time  (lower is better)

TAF emphasis
------------
  Reliability (mAP/IoU) and Fairness (demographic/class coverage in visual data)
  are the highest-weighted principles for CV models, reflecting the well-known
  risks of dataset bias and poor edge-case performance.
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
        "Fairness":       0.30,   # demographic bias in CV is a major risk
        "Data Integrity": 0.20,
        "Explainability": 0.15,
    }

    def model_metrics(self, df: pd.DataFrame) -> dict:
        return {
            "map_score": self._metric_result(
                self._mean(df, "map", "mean_average_precision", "ap",
                           "map_score", "map_50"),
                "Mean Average Precision — primary performance metric for object detection",
                "map_score",
            ),
            "avg_iou": self._metric_result(
                self._mean(df, "iou", "intersection_over_union", "iou_score",
                           "mean_iou", "miou"),
                "Mean Intersection-over-Union for bounding box predictions",
                "avg_iou",
            ),
            "top_k_accuracy": self._metric_result(
                self._mean(df, "top_k", "top_k_accuracy", "top5_acc",
                           "top_k_acc", "top1_acc"),
                "Top-K classification accuracy across all test images",
                "top_k_accuracy",
            ),
            "avg_confidence": self._metric_result(
                self._mean(df, "confidence_score", "confidence", "score",
                           "probability", "detection_score"),
                "Mean prediction confidence / detection score",
                "avg_confidence",
            ),
            "label_coverage": self._metric_result(
                self._coverage(df, "label", "ground_truth", "true_class",
                                "class_name", "annotation", "category"),
                "Proportion of images with ground-truth labels available for validation",
                "label_coverage",
            ),
            "avg_inference_ms": self._metric_result(
                self._mean(df, "latency", "inference_time", "duration_ms",
                           "inference_ms", "elapsed_ms"),
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

        map_val   = metrics.get("map_score", {}).get("value")
        iou_val   = metrics.get("avg_iou", {}).get("value")
        topk_val  = metrics.get("top_k_accuracy", {}).get("value")
        conf_val  = metrics.get("avg_confidence", {}).get("value")
        lbl_val   = metrics.get("label_coverage", {}).get("value")

        map_score  = c((map_val or 0) * 100)  if map_val is not None  else 30
        iou_score  = c((iou_val or 0) * 100)  if iou_val is not None  else 30
        topk_score = c((topk_val or 0) * 100) if topk_val is not None else 30
        conf_score = c((conf_val or 0) * 100) if conf_val is not None else 30
        lbl_score  = c((lbl_val or 0) * 100)  if lbl_val is not None  else 20

        # 1. Transparency
        t = {
            "Schema Confidence":       s["schema_score"],
            "Field Documentation":     c(io * 4 + s["schema_score"] * 0.2),
            "Model Version Tracking":  100 if s["has_version"] else 30,
            "Image ID Logging":        100 if s["has_input"] else 20,
            "Label Column Present":    lbl_score,
        }

        # 2. Explainability — CV models are notoriously difficult to explain
        e = {
            "Model Interpretability":  40,   # deep CV models are low-interpretability
            "Prediction Confidence":   conf_score,
            "Detection Score Logging": c(io * 4 + (20 if s["has_score"] else 0)),
            "Feedback Integration":    100 if s["has_feedback"] else 30,
            "Output Traceability":     c(io * 4.5),
        }

        # 3. Fairness — demographic and lighting bias are primary CV fairness risks
        f = {
            "Data Completeness":       s["completeness"],
            "Class/Category Balance":  lbl_score,
            "Demographic Coverage":    c(60 + s["text_ratio"] * 0.4),
            "Bias Indicator Fields":   100 if s["has_feedback"] else 30,
            "Missing Data Equity":     c((1 - s["missing"] * 2) * 100),
        }

        # 4. Accountability
        a = {
            "Audit Log Volume":        s["volume_score"],
            "Timestamp Coverage":      100 if s["has_timestamp"] else 20,
            "Image ID Attribution":    100 if s["has_user_id"] else 25,
            "Model Version Control":   100 if s["has_version"] else 30,
            "Error/Exception Logging": 100 if s["has_error"] else 35,
        }

        # 5. Data Integrity — label coverage is THE data integrity metric for CV
        di = {
            "Completeness Score":    s["completeness"],
            "Duplicate-Free Rate":   s["dup_penalty"],
            "Ground Truth Coverage": lbl_score,
            "Schema Consistency":    s["schema_score"],
            "Annotation Quality":    c(lbl_score * 0.7 + conf_score * 0.3),
        }

        # 6. Reliability — mAP and IoU are the primary reliability metrics for CV
        r = {
            "mAP Score":           map_score,
            "Mean IoU":            iou_score,
            "Top-K Accuracy":      topk_score,
            "Latency Monitoring":  100 if s["has_latency"] else 30,
            "Volume Sufficiency":  s["volume_score"],
        }

        # 7. Security
        sec = {
            "Safety Flagging":        100 if s["has_safety"] else 25,
            "Input Validation":       c(s["schema_score"] * 0.8 + (20 if s["has_input"] else 0)),
            "Adversarial Robustness": 45,   # CV models are vulnerable to adversarial patches
            "Content Moderation":     100 if s["has_safety"] else 30,
            "PII Detection":          100 if s["has_pii"] else 20,
        }

        # 8. Privacy — images may contain faces and biometric data
        pr = {
            "PII/Biometric Field Tracking": 100 if s["has_pii"] else 15,   # lower default: images have inherent PII risk
            "Data Minimisation":            c(100 - (s["total_cols"] / 20) * 40),
            "Face/Biometric Anonymisation": 100 if s["has_pii"] else 20,
            "Consent Management":           40,
            "Data Retention Signals":       100 if s["has_timestamp"] else 30,
        }

        # 9. Sustainability
        su = {
            "Dataset Efficiency":    c(100 - (logs_count / 10_000) * 30),
            "Feature Engineering":   c(s["col_diversity"] * 0.7 + 30),
            "Compute Proxy Score":   35,   # CV inference is very compute-intensive (GPU required)
            "Redundancy Elimination": s["dup_penalty"],
            "Resource Optimisation": c(s["schema_score"] * 0.6 + 40),
        }

        # 10. Safety — CV misidentification in surveillance/medical/autonomous vehicles causes direct harm
        # Low confidence + poor label coverage = unsafe deployment conditions
        sf = {
            "Harm Prevention Logging":    100 if s["has_safety"] else 20,
            "Misidentification Controls": conf_score,   # low confidence = high misidentification risk
            "Human Override Capability":  100 if s["has_override"] else (60 if s["has_feedback"] else 20),
            "Incident Response Signals":  100 if s["has_error"] else 30,
            "Safeguard Effectiveness":    lbl_score,   # unlabelled images = unvalidated safety
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