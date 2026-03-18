"""
services/sdcc/base_evaluator.py  (REFACTORED)
===============================================
Abstract base for all model-specific evaluators.

Key change from original
------------------------
`model_metrics(df)` now receives a `computed: dict` keyword argument that
contains pre-calculated metric values from `metrics_calculator.calculate_metrics()`.
Each evaluator uses `computed` values first; it only falls back to column-reading
helpers (_mean, _bool_rate, etc.) if a value is None in `computed`.

This means:
  - Metric values are ALWAYS computed from raw text via real NLP/ML libraries
  - Pre-logged metric columns are a secondary fallback (backwards-compatible)
  - The TAF scoring chain is unchanged
"""

from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any, Optional
import pandas as pd


class BaseEvaluator(ABC):

    MODEL_TYPE: str = "base"
    LABEL: str = "Base"
    DESCRIPTION: str = ""

    THRESHOLDS: dict[str, dict] = {}
    TAF_METRIC_WEIGHTS: dict[str, float] = {}

    # ── Abstract interface ─────────────────────────────────────────────────────

    @abstractmethod
    def model_metrics(
        self,
        df: pd.DataFrame,
        computed: Optional[dict] = None,
    ) -> dict[str, Any]:
        """
        Build the standardised metric result dict for this model type.

        Parameters
        ----------
        df       : raw DataFrame (used as fallback for column-reading helpers)
        computed : flat dict of {metric_name: float|None} from metrics_calculator.
                   When provided, these values take priority over column-reading.
        """

    @abstractmethod
    def taf_principles(
        self,
        diagnostics: dict,
        logs_count: int,
        metrics: dict[str, Any],
    ) -> dict[str, dict]:
        """Return the 10 KPMG TAF principle dicts."""

    # ── Structural helpers ────────────────────────────────────────────────────

    def _structural(self, diagnostics: dict, logs_count: int) -> dict:
        missing  = diagnostics.get("missing_ratio", 0.0)
        dupes    = diagnostics.get("duplicates", 0)
        schema_c = diagnostics.get("schema_confidence", 0.8)
        total_c  = diagnostics.get("total_columns", 1)
        text_c   = diagnostics.get("text_columns", 0)
        num_c    = diagnostics.get("numeric_columns", 0)
        cols     = [c.lower() for c in diagnostics.get("column_names", [])]

        def has(*keys: str) -> bool:
            return any(k in c for k in keys for c in cols)

        clamp = self.clamp

        return {
            "completeness":    clamp((1 - missing) * 100),
            "schema_score":    clamp(schema_c * 100),
            "dup_penalty":     clamp(max(0, 100 - (dupes / max(logs_count, 1)) * 500)),
            "volume_score":    clamp(min(logs_count / 100 * 100, 100)),
            "col_diversity":   clamp(min(total_c / 10 * 100, 100)),
            "text_ratio":      clamp((text_c / max(total_c, 1)) * 100),
            "num_ratio":       clamp((num_c / max(total_c, 1)) * 100),
            "total_cols":      total_c,
            "missing":         missing,
            "dupes":           dupes,
            "logs_count":      logs_count,
            "has_input":       has("input", "prompt", "query", "question", "instruction"),
            "has_output":      has("output", "response", "answer", "completion",
                                   "generated", "result", "summary", "prediction"),
            "has_label":       has("label", "class", "target", "ground_truth", "true_label"),
            "has_timestamp":   has("timestamp", "date", "time", "created_at"),
            "has_user_id":     has("user_id", "user", "session_id", "session", "conversation_id"),
            "has_score":       has("score", "confidence", "probability", "prob",
                                   "rouge", "bleu", "bertscore", "f1", "auc", "iou", "map"),
            "has_feedback":    has("feedback", "rating", "review", "human_eval", "human_score"),
            "has_safety":      has("is_safe", "safety", "flagged", "moderated",
                                   "toxicity", "content_safe"),
            "has_pii":         has("contains_pii", "pii", "personal"),
            "has_version":     has("model_version", "version", "model_id"),
            "has_latency":     has("latency", "response_time", "duration",
                                   "inference_time", "elapsed"),
            "has_error":       has("error", "exception", "failed", "failure"),
            "has_halluc":      has("hallucination", "faithfulness", "groundedness", "factual"),
            "has_override":    has("human_override", "escalated", "manual_intervention",
                                   "human_review"),
            "has_context":     has("context", "retrieved", "chunks", "passages"),
            "has_ref":         has("reference", "reference_summary", "ground_truth"),
        }

    def _io_bonus(self, s: dict) -> int:
        if s["has_input"] and s["has_output"]:
            return 20
        if s["has_input"] or s["has_output"]:
            return 10
        return 0

    # ── Metric helpers (fallback column-readers) ───────────────────────────────

    def _col(self, df: pd.DataFrame, *candidates: str) -> Optional[str]:
        lower = {c.lower(): c for c in df.columns}
        for cand in candidates:
            for col_low, col_orig in lower.items():
                if cand in col_low:
                    return col_orig
        return None

    def _mean(self, df: pd.DataFrame, *candidates: str) -> Optional[float]:
        col = self._col(df, *candidates)
        if col is None:
            return None
        vals = pd.to_numeric(df[col], errors="coerce").dropna()
        return float(vals.mean()) if len(vals) > 0 else None

    def _bool_rate(self, df: pd.DataFrame, *candidates: str) -> Optional[float]:
        col = self._col(df, *candidates)
        if col is None:
            return None
        mapping = {
            "true": 1, "false": 0, "yes": 1, "no": 0,
            "success": 1, "fail": 0, "failed": 0, "pass": 1,
            "1": 1, "0": 0,
        }
        series  = df[col].copy()
        numeric = pd.to_numeric(series, errors="coerce")
        fallback = series.astype(str).str.lower().map(mapping)
        resolved = numeric.combine_first(fallback)
        vals = resolved.dropna()
        return float(vals.mean()) if len(vals) > 0 else None

    def _coverage(self, df: pd.DataFrame, *candidates: str) -> Optional[float]:
        col = self._col(df, *candidates)
        if col is None:
            return None
        return float(df[col].notna().mean())

    # ── Metric result builder ──────────────────────────────────────────────────

    def _computed_or_fallback(
        self,
        computed: Optional[dict],
        metric_key: str,
        fallback_fn,  # callable → Optional[float]
    ) -> Optional[float]:
        """
        Return computed[metric_key] if available and not None,
        otherwise call fallback_fn() to read from columns.
        """
        if computed and metric_key in computed and computed[metric_key] is not None:
            return computed[metric_key]
        return fallback_fn()

    def _metric_result(
        self,
        value: Optional[float],
        description: str,
        threshold_key: str,
        unit: str = "",
    ) -> dict:
        risk = self.metric_risk(value, threshold_key) if value is not None else "Unavailable"
        thr  = self.THRESHOLDS.get(threshold_key, {})
        return {
            "value":              round(value, 4) if value is not None else None,
            "risk_level":         risk,
            "description":        description,
            "unit":               unit or thr.get("unit", ""),
            "threshold_low":      thr.get("low"),
            "threshold_moderate": thr.get("moderate"),
            "higher_is_better":   not thr.get("inverted", False),
        }

    def metric_risk(self, value: float, threshold_key: str) -> str:
        thr = self.THRESHOLDS.get(threshold_key)
        if not thr:
            return "Unknown"
        inverted = thr.get("inverted", False)
        low, moderate = thr["low"], thr["moderate"]
        if not inverted:
            if value >= low:      return "Low"
            if value >= moderate: return "Moderate"
            return "High"
        else:
            if value <= low:      return "Low"
            if value <= moderate: return "Moderate"
            return "High"

    def _metric_boost(self, metrics: dict[str, Any], weights: Optional[dict] = None) -> dict[str, int]:
        w = weights or self.TAF_METRIC_WEIGHTS
        available = {k: v for k, v in metrics.items() if v.get("value") is not None}
        if not available:
            return {}
        risk_pts = {"Low": 20, "Moderate": 10, "High": 0}
        avg = sum(risk_pts.get(m["risk_level"], 0) for m in available.values()) / len(available)
        return {principle: self.clamp(int(avg * weight)) for principle, weight in w.items()}

    # ── Shared TAF analysis ───────────────────────────────────────────────────

    def compute_risk_analysis(
        self,
        principles: dict,
        diagnostics: dict,
        logs_count: int,
        model_metrics: dict,
    ) -> dict:
        risk_items = []
        for name, data in principles.items():
            score  = data["score"]
            params = data.get("parameters", {})
            worst  = min(params, key=lambda k: params[k]) if params else "N/A"

            if   score < 40: severity, color = "Critical", "#ff4d4d"
            elif score < 60: severity, color = "High",     "#ff7043"
            elif score < 75: severity, color = "Moderate", "#ffb020"
            else:            severity, color = "Low",      "#00C896"

            risk_items.append({
                "principle":  name,
                "score":      score,
                "severity":   severity,
                "color":      color,
                "worst_param": worst,
                "worst_val":  params.get(worst, score),
                "gap":        100 - score,
            })

        risk_items.sort(key=lambda x: x["score"])
        counts = {s: sum(1 for r in risk_items if r["severity"] == s)
                  for s in ("Critical", "High", "Moderate", "Low")}
        avg = sum(r["score"] for r in risk_items) / max(len(risk_items), 1)

        if   counts["Critical"] > 0: overall = "Critical"
        elif counts["High"] >= 3:    overall = "High"
        elif avg >= 75:              overall = "Low"
        elif avg >= 55:              overall = "Moderate"
        else:                        overall = "High"

        high_metrics = [
            k for k, v in model_metrics.items()
            if v.get("risk_level") == "High" and v.get("value") is not None
        ]
        missing_ratio = diagnostics.get("missing_ratio", 0)

        return {
            "overall_risk_level":  overall,
            "risk_items":          risk_items,
            "critical_count":      counts["Critical"],
            "high_count":          counts["High"],
            "moderate_count":      counts["Moderate"],
            "low_count":           counts["Low"],
            "average_score":       round(avg, 1),
            "data_volume_risk":    (
                "High — insufficient log volume for reliable evaluation" if logs_count < 30
                else "Moderate — limited dataset; results may not generalise" if logs_count < 100
                else "Low — adequate data volume for statistical confidence"
            ),
            "missing_data_risk":   (
                "High" if missing_ratio > 0.2 else
                "Moderate" if missing_ratio > 0.05 else "Low"
            ),
            "high_model_metric_risks": high_metrics,
        }

    def generate_findings(
        self,
        principles: dict,
        model_metrics: dict,
    ) -> list[dict]:
        findings = []

        for name, data in principles.items():
            if data["score"] < 60:
                findings.append({
                    "category":       name,
                    "type":           "structural",
                    "severity":       "High" if data["score"] < 40 else "Medium",
                    "issue":          f"{name} score is {data['score']}/100 — governance gap detected.",
                    "recommendation": self._rec_for_principle(name, data.get("parameters", {})),
                })

        for metric_name, metric_data in model_metrics.items():
            if metric_data.get("risk_level") == "High" and metric_data.get("value") is not None:
                findings.append({
                    "category":       metric_name,
                    "type":           "model_metric",
                    "severity":       "High",
                    "issue":          (
                        f"{metric_data['description']} is at risk "
                        f"(value: {metric_data['value']:.3f}"
                        f"{' ' + metric_data['unit'] if metric_data.get('unit') else ''})."
                    ),
                    "recommendation": self._rec_for_metric(metric_name),
                })

        return findings

    # ── Utilities ─────────────────────────────────────────────────────────────

    @staticmethod
    def clamp(v: float) -> int:
        return max(0, min(100, int(v)))

    def param_score(self, params: dict) -> int:
        return self.clamp(sum(params.values()) / max(len(params), 1))

    # ── Recommendations ────────────────────────────────────────────────────────

    _STRUCTURAL_RECS: dict[str, dict[str, str]] = {
        "Transparency": {
            "Schema Confidence":       "Improve data schema consistency and reduce null fields.",
            "Model Version Tracking":  "Implement model versioning (e.g., MLflow) and log the version in every record.",
            "Input/Output Coverage":   "Ensure input and output columns are consistently present in logs.",
            "Field Documentation":     "Document all fields with descriptions and expected formats.",
            "Column Completeness":     "Increase the number of meaningful, well-named columns.",
        },
        "Explainability": {
            "Model Interpretability":  "Add SHAP/LIME explanations or switch to a more interpretable architecture.",
            "Prediction Confidence":   "Log a confidence or probability score for every model output.",
            "Reasoning Documentation": "Log faithfulness scores, chain-of-thought traces, or ROUGE metrics.",
            "Feedback Integration":    "Capture human ratings or corrections per prediction.",
            "Output Traceability":     "Ensure every output is traceable to its input and model version.",
        },
        "Fairness": {
            "Data Completeness":      "Reduce missing data below 5% to ensure equitable representation.",
            "Label Balance":          "Audit class distribution and resample if imbalanced.",
            "Demographic Coverage":   "Expand training data to include diverse demographic groups.",
            "Bias Indicator Fields":  "Add bias-audit fields such as demographic labels or fairness scores.",
            "Missing Data Equity":    "Check whether missing data is disproportionate across subgroups.",
        },
        "Accountability": {
            "Audit Log Volume":        "Increase log coverage to at least 1 000 records for a meaningful audit.",
            "Timestamp Coverage":      "Add a timestamp to every log record for chronological auditability.",
            "User Attribution":        "Track user or session IDs so outputs can be attributed to actors.",
            "Model Version Control":   "Log the model version used for every prediction.",
            "Error/Exception Logging": "Implement structured error logging for all failed predictions.",
        },
        "Data Integrity": {
            "Completeness Score":        "Fill or impute missing values and document the imputation strategy.",
            "Duplicate-Free Rate":       "Deduplicate logs before analysis to ensure reliable metrics.",
            "Schema Consistency":        "Enforce schema validation at ingestion time.",
            "Data Type Diversity":       "Ensure a balanced mix of numeric and categorical features.",
            "Ground Truth Availability": "Add ground truth labels or reference outputs for comparison.",
        },
        "Reliability": {
            "Consistency Score":    "Investigate sources of missing or inconsistent data across runs.",
            "Performance Metrics":  "Track ROUGE, BLEU, accuracy, or F1 scores per prediction.",
            "Latency Monitoring":   "Log response latency to detect performance degradation over time.",
            "Error Rate Tracking":  "Monitor error rates and set alerting thresholds.",
            "Volume Sufficiency":   "Increase log volume to at least 500 records for statistical reliability.",
        },
        "Security": {
            "Safety Flagging":        "Implement content safety classifiers and log outcomes per request.",
            "Input Validation":       "Validate all inputs against a schema before processing.",
            "Adversarial Robustness": "Run red-team exercises and log adversarial probe results.",
            "Content Moderation":     "Integrate a moderation layer and log all moderated outputs.",
            "PII Detection":          "Run PII detection on inputs/outputs and flag or mask sensitive data.",
        },
        "Privacy": {
            "PII Field Tracking":    "Add a contains_pii column and implement automatic PII detection.",
            "Data Minimisation":     "Remove any columns not required for model operation.",
            "User Anonymisation":    "Hash or pseudonymise user identifiers before logging.",
            "Consent Management":    "Implement consent tracking and store consent signals with data.",
            "Data Retention Signals": "Add timestamp fields to enable automated data retention policies.",
        },
        "Sustainability": {
            "Dataset Efficiency":    "Sample representative subsets instead of logging every request.",
            "Feature Engineering":   "Reduce redundant features to lower compute and storage footprint.",
            "Compute Proxy Score":   "Use lighter model variants where performance targets are still met.",
            "Redundancy Elimination": "Deduplicate and compress logs to reduce storage overhead.",
            "Resource Optimisation": "Profile inference cost and optimise batch sizes.",
        },
        "Safety": {
            "Harm Prevention Logging":    "Log all outputs flagged as potentially harmful to people, businesses, or property.",
            "Safety Test Coverage":       "Run structured safety evaluations and store results in the audit log.",
            "Human Override Capability":  "Implement and log human override mechanisms for high-stakes AI decisions.",
            "Incident Response Signals":  "Add fields that capture safety incidents, near-misses, and escalations.",
            "Safeguard Effectiveness":    "Track the proportion of flagged outputs that were successfully mitigated.",
        },
    }

    def _rec_for_principle(self, principle: str, params: dict) -> str:
        worst = min(params, key=lambda k: params[k]) if params else None
        table = self._STRUCTURAL_RECS.get(principle, {})
        if worst and worst in table:
            return table[worst]
        return f"Review and strengthen {principle.lower()} controls across all sub-parameters."

    def _rec_for_metric(self, metric_name: str) -> str:
        return f"Investigate elevated risk in metric '{metric_name}' and review model outputs."