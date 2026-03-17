"""
services/sdcc/models/automation.py
====================================
Evaluator for automation and agentic AI systems (RPA, multi-step pipelines,
tool-calling agents, workflow orchestrators).

Model-specific metrics
-----------------------
  - step_success_rate     Proportion of individual steps that succeed
  - task_completion_rate  Proportion of end-to-end tasks completed
  - error_rate            Proportion of steps that raised errors  (lower is better)
  - avg_retry_rate        Mean retries per step  (lower is better)
  - avg_step_latency_ms   Mean step execution time  (lower is better)
  - human_override_rate   Proportion of tasks escalated to human intervention

TAF emphasis
------------
  Reliability is the highest-weighted principle (step/task success drives
  everything). Accountability is second because agentic systems take real-world
  actions that must be traceable.
"""

from __future__ import annotations
import pandas as pd
from app.services.sdcc.base_evaluator import BaseEvaluator


class AutomationEvaluator(BaseEvaluator):

    MODEL_TYPE  = "automation"
    LABEL       = "Automation / Agentic AI"
    DESCRIPTION = "AI agents executing multi-step workflows, RPA, or tool-calling pipelines"

    THRESHOLDS = {
        "step_success_rate":    {"low": 0.95, "moderate": 0.85, "unit": "ratio"},
        "task_completion_rate": {"low": 0.90, "moderate": 0.75, "unit": "ratio"},
        "error_rate":           {"low": 0.02, "moderate": 0.10, "unit": "ratio", "inverted": True},
        "avg_retry_rate":       {"low": 0.10, "moderate": 0.30, "unit": "count", "inverted": True},
        "avg_step_latency_ms":  {"low": 500,  "moderate": 2000, "unit": "ms",    "inverted": True},
    }

    TAF_METRIC_WEIGHTS = {
        "Reliability":    0.35,
        "Accountability": 0.30,
        "Safety":         0.25,   # autonomous actions causing real-world harm = highest safety risk
        "Security":       0.10,
    }

    def model_metrics(self, df: pd.DataFrame) -> dict:
        return {
            "step_success_rate": self._metric_result(
                self._bool_rate(df, "step_success", "success", "step_result",
                                "status", "step_status"),
                "Proportion of individual workflow steps that completed successfully",
                "step_success_rate",
            ),
            "task_completion_rate": self._metric_result(
                self._bool_rate(df, "task_complete", "completed", "finished",
                                "done", "task_status"),
                "Proportion of end-to-end tasks that were completed without failure",
                "task_completion_rate",
            ),
            "error_rate": self._metric_result(
                self._coverage(df, "error", "exception", "failed", "failure_reason"),
                "Proportion of steps that raised errors or exceptions",
                "error_rate",
            ),
            "avg_retry_rate": self._metric_result(
                self._mean(df, "retry_count", "retries", "attempts", "retry"),
                "Mean number of retries per step (higher = less reliable execution)",
                "avg_retry_rate",
            ),
            "avg_step_latency_ms": self._metric_result(
                self._mean(df, "latency", "step_duration", "duration_ms",
                           "elapsed_ms", "execution_time"),
                "Mean step execution time in milliseconds",
                "avg_step_latency_ms",
            ),
        }

    def taf_principles(self, diagnostics: dict, logs_count: int, metrics: dict) -> dict:
        s = self._structural(diagnostics, logs_count)
        io = self._io_bonus(s)
        boost = self._metric_boost(metrics)
        c = self.clamp
        p = self.param_score

        step_val  = metrics.get("step_success_rate", {}).get("value")
        task_val  = metrics.get("task_completion_rate", {}).get("value")
        err_val   = metrics.get("error_rate", {}).get("value")

        step_score = c((step_val or 0) * 100) if step_val is not None else 35
        task_score = c((task_val or 0) * 100) if task_val is not None else 35
        err_score  = c((1 - (err_val or 1)) * 100) if err_val is not None else 35

        # 1. Transparency — workflow visibility is transparency for agentic AI
        t = {
            "Schema Confidence":        s["schema_score"],
            "Step Name Logging":        100 if s["has_input"] else 20,
            "Model Version Tracking":   100 if s["has_version"] else 30,
            "Workflow ID Logging":       c(io * 4.5),
            "Column Completeness":      c(s["col_diversity"] * 0.8 + s["schema_score"] * 0.2),
        }

        # 2. Explainability — step-level audit trails enable explainability
        e = {
            "Model Interpretability":   60,   # rule-based/scripted steps are interpretable
            "Step Result Logging":      step_score,
            "Error Reasoning Logged":   100 if s["has_error"] else 20,
            "Feedback Integration":     100 if s["has_feedback"] else 30,
            "Output Traceability":      c(io * 4 + (20 if s["has_score"] else 0)),
        }

        # 3. Fairness — automation fairness is about equitable task success across groups
        f = {
            "Data Completeness":    s["completeness"],
            "Task Success Equity":  task_score,
            "Demographic Coverage": c(60 + s["text_ratio"] * 0.4),
            "Bias Indicator Fields": 100 if s["has_feedback"] else 35,
            "Missing Data Equity":  c((1 - s["missing"] * 2) * 100),
        }

        # 4. Accountability — the most critical principle for agentic AI
        a = {
            "Audit Log Volume":        s["volume_score"],
            "Timestamp Coverage":      100 if s["has_timestamp"] else 20,
            "Workflow/Task ID Logged": 100 if s["has_user_id"] else 25,
            "Model Version Control":   100 if s["has_version"] else 30,
            "Error/Exception Logging": 100 if s["has_error"] else 20,   # critical for automation
        }

        # 5. Data Integrity
        di = {
            "Completeness Score":      s["completeness"],
            "Duplicate-Free Rate":     s["dup_penalty"],
            "Schema Consistency":      s["schema_score"],
            "Step Result Coverage":    step_score,
            "Error Log Coverage":      100 if s["has_error"] else 20,
        }

        # 6. Reliability — step and task success are THE reliability metrics for automation
        r = {
            "Step Success Rate":    step_score,
            "Task Completion Rate": task_score,
            "Error Rate":           err_score,
            "Latency Monitoring":   100 if s["has_latency"] else 30,
            "Volume Sufficiency":   s["volume_score"],
        }

        # 7. Security — agentic systems can take real-world actions with security implications
        sec = {
            "Safety Flagging":         100 if s["has_safety"] else 25,
            "Input Validation":        c(s["schema_score"] * 0.8 + (20 if s["has_input"] else 0)),
            "Adversarial Robustness":  60,   # automation agents should have robust error handling
            "Error Containment":       err_score,
            "PII Detection":           100 if s["has_pii"] else 20,
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
            "Compute Proxy Score":   60,   # automation efficiency depends on workflow design
            "Redundancy Elimination": s["dup_penalty"],
            "Resource Optimisation": c(s["schema_score"] * 0.6 + 40),
        }

        # 10. Safety — agentic systems take real-world actions; failed or uncontrolled steps can cause direct harm
        # Human override capability is the single most important safety control for automation
        sf = {
            "Harm Prevention Logging":   100 if s["has_safety"] else 20,
            "Human Override Logged":     100 if s["has_override"] else 15,   # critical for automation
            "Escalation Path Defined":   100 if s["has_override"] else (60 if s["has_feedback"] else 15),
            "Incident Response Signals": 100 if s["has_error"] else 20,
            "Safeguard Effectiveness":   err_score,   # low error rate = effective safeguards
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
        "step_success_rate":    "Step success below threshold. Add retry logic, timeouts, and fallback strategies.",
        "task_completion_rate": "Task completion below threshold. Review workflow design and end-to-end error handling.",
        "error_rate":           "Error rate above threshold. Implement structured error logging and automated alerting.",
        "avg_retry_rate":       "High retry rate indicates fragile steps. Add idempotency and circuit breaker patterns.",
        "avg_step_latency_ms":  "Step latency above threshold. Profile bottlenecks and add async execution where possible.",
    }

    def _rec_for_metric(self, metric_name: str) -> str:
        return self._METRIC_RECS.get(metric_name,
            f"Investigate elevated risk in '{metric_name}' for this automation system.")