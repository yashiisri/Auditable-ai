"""
services/sdcc/models/rag.py  (REFACTORED)
==========================================
Uses real computed Faithfulness / Answer Relevance / Context Recall /
Hallucination Rate values from metrics_calculator.
"""

from __future__ import annotations
import pandas as pd
from app.services.sdcc.base_evaluator import BaseEvaluator


class RAGEvaluator(BaseEvaluator):

    MODEL_TYPE  = "rag"
    LABEL       = "RAG (Retrieval-Augmented Generation)"
    DESCRIPTION = "LLMs augmented with external knowledge retrieval (vector DB, search index)"

    THRESHOLDS = {
        "faithfulness":       {"low": 0.80, "moderate": 0.65, "unit": "score"},
        "answer_relevance":   {"low": 0.75, "moderate": 0.60, "unit": "score"},
        "context_recall":     {"low": 0.75, "moderate": 0.60, "unit": "score"},
        "hallucination_rate": {"low": 0.05, "moderate": 0.15, "unit": "ratio", "inverted": True},
        "context_coverage":   {"low": 0.95, "moderate": 0.80, "unit": "ratio"},
        "avg_latency_ms":     {"low": 1500,  "moderate": 3000, "unit": "ms", "inverted": True},
    }

    TAF_METRIC_WEIGHTS = {
        "Reliability":    0.30,
        "Security":       0.25,
        "Explainability": 0.25,
        "Data Integrity": 0.20,
    }

    def model_metrics(self, df: pd.DataFrame, computed: dict | None = None) -> dict:
        c = computed or {}

        faith_val  = c.get("faithfulness")      or self._mean(df, "faithfulness", "groundedness")
        rel_val    = c.get("answer_relevance")   or self._mean(df, "answer_relevance", "relevance_score")
        recall_val = c.get("context_recall")     or self._mean(df, "context_recall", "context_precision")
        hall_val   = c.get("hallucination_rate") or self._mean(df, "hallucination", "hallucination_rate")
        ctx_cov    = c.get("context_coverage")   or self._coverage(
                         df, "context", "retrieved_chunks", "chunks", "passages")
        lat_val    = self._mean(df, "latency", "response_time", "duration_ms", "latency_ms")

        return {
            "faithfulness": self._metric_result(
                faith_val,
                "Factual consistency of the generated answer with retrieved context "
                "(computed via semantic similarity between output and context)",
                "faithfulness",
            ),
            "answer_relevance": self._metric_result(
                rel_val,
                "How relevant the generated answer is to the original query "
                "(computed via query–answer semantic similarity)",
                "answer_relevance",
            ),
            "context_recall": self._metric_result(
                recall_val,
                "Proportion of relevant information successfully retrieved from the knowledge base "
                "(computed as token recall of reference content in retrieved context)",
                "context_recall",
            ),
            "hallucination_rate": self._metric_result(
                hall_val,
                "Rate of hallucinated or ungrounded claims — computed as 1 − faithfulness",
                "hallucination_rate",
            ),
            "context_coverage": self._metric_result(
                ctx_cov,
                "Proportion of records where retrieved context was logged (required for auditability)",
                "context_coverage",
            ),
            "avg_latency_ms": self._metric_result(
                lat_val,
                "Mean retrieval + generation latency in milliseconds (from latency column if present)",
                "avg_latency_ms",
            ),
        }

    def taf_principles(self, diagnostics: dict, logs_count: int, metrics: dict) -> dict:
        s = self._structural(diagnostics, logs_count)
        io = self._io_bonus(s)
        boost = self._metric_boost(metrics)
        c = self.clamp
        p = self.param_score

        faith_val = metrics.get("faithfulness",   {}).get("value")
        hall_val  = metrics.get("hallucination_rate", {}).get("value")
        ctx_cov   = metrics.get("context_coverage",  {}).get("value")
        has_faith = faith_val is not None
        has_hall  = hall_val is not None

        t = {
            "Schema Confidence":      s["schema_score"],
            "Field Documentation":    c(io * 4 + s["schema_score"] * 0.2),
            "Model Version Tracking": 100 if s["has_version"] else 30,
            "Input/Output Coverage":  c(io * 4.5),
            "Context Logging":        c((ctx_cov or 0) * 100) if ctx_cov is not None else 20,
        }

        e = {
            "Model Interpretability":  55,
            "Faithfulness Score":      c((faith_val or 0) * 100) if has_faith else 30,
            "Source Citation Logging": 100 if s["has_context"] else 20,
            "Feedback Integration":    100 if s["has_feedback"] else 30,
            "Output Traceability":     c(io * 4 + (20 if s["has_context"] else 0)),
        }

        f = {
            "Data Completeness":    s["completeness"],
            "Query Coverage":       100 if s["has_input"] else 30,
            "Demographic Coverage": c(60 + s["text_ratio"] * 0.4),
            "Bias Indicator Fields": 100 if s["has_feedback"] else 35,
            "Missing Data Equity":  c((1 - s["missing"] * 2) * 100),
        }

        a = {
            "Audit Log Volume":        s["volume_score"],
            "Timestamp Coverage":      100 if s["has_timestamp"] else 20,
            "User Attribution":        100 if s["has_user_id"] else 25,
            "Model Version Control":   100 if s["has_version"] else 30,
            "Error/Exception Logging": 100 if s["has_error"] else 35,
        }

        di = {
            "Completeness Score":        s["completeness"],
            "Duplicate-Free Rate":       s["dup_penalty"],
            "Context Logged Rate":       c((ctx_cov or 0) * 100) if ctx_cov is not None else 20,
            "Reference Answer Coverage": 100 if s["has_ref"] else 30,
            "Schema Consistency":        s["schema_score"],
        }

        hall_score = c((1 - (hall_val or 1)) * 100) if has_hall else 30
        r = {
            "Faithfulness Score":  c((faith_val or 0) * 100) if has_faith else 30,
            "Hallucination Rate":  hall_score,
            "Latency Monitoring":  100 if s["has_latency"] else 30,
            "Error Rate Tracking": 100 if s["has_error"] else 35,
            "Volume Sufficiency":  s["volume_score"],
        }

        sec = {
            "Hallucination Control": hall_score,
            "Input Validation":      c(s["schema_score"] * 0.8 + (20 if s["has_input"] else 0)),
            "Prompt Injection Risk": 50,
            "Content Moderation":    100 if s["has_safety"] else 25,
            "PII Detection":         100 if s["has_pii"] else 20,
        }

        pr = {
            "PII Field Tracking":     100 if s["has_pii"] else 20,
            "Data Minimisation":      c(100 - (s["total_cols"] / 20) * 40),
            "User Anonymisation":     50 if s["has_user_id"] else 70,
            "Consent Management":     40,
            "Data Retention Signals": 100 if s["has_timestamp"] else 30,
        }

        su = {
            "Dataset Efficiency":     c(100 - (logs_count / 10_000) * 30),
            "Retrieval Efficiency":   100 if s["has_latency"] else 40,
            "Compute Proxy Score":    50,
            "Redundancy Elimination": s["dup_penalty"],
            "Resource Optimisation":  c(s["schema_score"] * 0.6 + 40),
        }

        sf = {
            "Harm Prevention Logging":   100 if s["has_safety"] else 20,
            "Hallucination Containment": c((1 - (hall_val or 1)) * 100) if hall_val is not None else 25,
            "Human Override Capability": 100 if s["has_override"] else (60 if s["has_feedback"] else 20),
            "Incident Response Signals": 100 if s["has_error"] else 30,
            "Safeguard Effectiveness":   100 if (s["has_safety"] and s["has_context"]) else 25,
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
        "faithfulness":       "Improve faithfulness by adding a post-generation verification step or self-critique loop.",
        "answer_relevance":   "Tune retrieval to return more relevant context chunks. Consider hybrid BM25 + dense retrieval.",
        "context_recall":     "Expand the knowledge base or improve embeddings to increase retrieval coverage.",
        "hallucination_rate": "Add a hallucination detector as a post-processing guard before returning answers.",
        "context_coverage":   "Ensure retrieved context is always logged — missing context makes RAG unauditable.",
        "avg_latency_ms":     "Optimise retrieval pipeline: add caching, reduce chunk count, or use a faster encoder.",
    }

    def _rec_for_metric(self, metric_name: str) -> str:
        return self._METRIC_RECS.get(metric_name,
            f"Investigate elevated risk in '{metric_name}' for this RAG system.")