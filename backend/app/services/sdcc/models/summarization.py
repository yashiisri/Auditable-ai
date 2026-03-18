"""
services/sdcc/models/summarization.py  (REFACTORED)
======================================================
Uses real computed ROUGE / BLEU / BERTScore / Faithfulness values from
metrics_calculator instead of reading pre-logged columns.

model_metrics() now accepts a `computed` dict injected by ai_routes.py.
"""

from __future__ import annotations
import pandas as pd
from app.services.sdcc.base_evaluator import BaseEvaluator


class SummarizationEvaluator(BaseEvaluator):

    MODEL_TYPE  = "summarization"
    LABEL       = "Summarization"
    DESCRIPTION = "Models that condense long documents or conversations into shorter summaries"

    THRESHOLDS = {
        "rouge_l":            {"low": 0.40, "moderate": 0.25, "unit": "score"},
        "rouge_1":            {"low": 0.45, "moderate": 0.30, "unit": "score"},
        "rouge_2":            {"low": 0.18, "moderate": 0.10, "unit": "score"},
        "bleu":               {"low": 0.25, "moderate": 0.12, "unit": "score"},
        "bertscore":          {"low": 0.85, "moderate": 0.75, "unit": "score"},
        "faithfulness":       {"low": 0.75, "moderate": 0.60, "unit": "score"},
        "reference_coverage": {"low": 0.90, "moderate": 0.70, "unit": "ratio"},
    }

    TAF_METRIC_WEIGHTS = {
        "Reliability":    0.35,
        "Explainability": 0.30,
        "Data Integrity": 0.20,
        "Transparency":   0.15,
    }

    def model_metrics(self, df: pd.DataFrame, computed: dict | None = None) -> dict:
        c = computed or {}

        rouge_l_val   = c.get("rouge_l")   or self._mean(df, "rouge_l", "rouge_lsum", "rougel")
        rouge_1_val   = c.get("rouge_1")   or self._mean(df, "rouge_1", "rouge1")
        rouge_2_val   = c.get("rouge_2")   or self._mean(df, "rouge_2", "rouge2")
        bleu_val      = c.get("bleu")      or self._mean(df, "bleu", "bleu_score")
        bert_val      = c.get("bertscore") or self._mean(df, "bertscore", "bert_score", "bert_f1")
        faith_val     = c.get("faithfulness") or self._mean(df, "faithfulness", "factual_consistency")
        ref_cov_val   = c.get("reference_coverage") or self._coverage(
                            df, "reference_summary", "reference", "ground_truth", "target")

        return {
            "rouge_l": self._metric_result(
                rouge_l_val,
                "ROUGE-L F1 — measures longest common subsequence overlap with reference summary "
                "(computed from your input/output pairs)",
                "rouge_l",
            ),
            "rouge_1": self._metric_result(
                rouge_1_val,
                "ROUGE-1 unigram overlap with reference summary (computed)",
                "rouge_1",
            ),
            "rouge_2": self._metric_result(
                rouge_2_val,
                "ROUGE-2 bigram overlap with reference summary (computed)",
                "rouge_2",
            ),
            "bleu": self._metric_result(
                bleu_val,
                "BLEU n-gram precision score against reference summaries (computed)",
                "bleu",
            ),
            "bertscore": self._metric_result(
                bert_val,
                "BERTScore F1 — semantic similarity to reference using contextual embeddings (computed)",
                "bertscore",
            ),
            "faithfulness": self._metric_result(
                faith_val,
                "Factual consistency of the summary with the source document (computed via semantic similarity)",
                "faithfulness",
            ),
            "reference_coverage": self._metric_result(
                ref_cov_val,
                "Proportion of records with reference summaries available for evaluation",
                "reference_coverage",
            ),
        }

    def taf_principles(self, diagnostics: dict, logs_count: int, metrics: dict) -> dict:
        s = self._structural(diagnostics, logs_count)
        io = self._io_bonus(s)
        boost = self._metric_boost(metrics)
        c = self.clamp
        p = self.param_score

        rouge_l   = metrics.get("rouge_l",   {}).get("value")
        rouge_1   = metrics.get("rouge_1",   {}).get("value")
        faith_val = metrics.get("faithfulness", {}).get("value")
        bscore    = metrics.get("bertscore", {}).get("value")
        ref_cov   = metrics.get("reference_coverage", {}).get("value")

        has_rouge = rouge_l is not None or rouge_1 is not None
        has_faith = faith_val is not None
        has_bert  = bscore is not None
        has_ref   = ref_cov is not None

        best_rouge_val = rouge_l or rouge_1 or 0.0

        t = {
            "Schema Confidence":        s["schema_score"],
            "Field Documentation":      c(io * 4 + s["schema_score"] * 0.2),
            "Model Version Tracking":   100 if s["has_version"] else 30,
            "Source Document Logged":   100 if s["has_input"] else 20,
            "Reference Summary Logged": c((ref_cov or 0) * 100) if has_ref else 20,
        }

        e = {
            "Model Interpretability":  55,
            "Faithfulness Score":      c((faith_val or 0) * 100) if has_faith else 25,
            "Semantic Similarity":     c((bscore or 0) * 100) if has_bert else 30,
            "Feedback Integration":    100 if s["has_feedback"] else 30,
            "Output Traceability":     c(io * 4 + (20 if has_faith else 0)),
        }

        f = {
            "Data Completeness":   s["completeness"],
            "Source Coverage":     100 if s["has_input"] else 20,
            "Reference Coverage":  c((ref_cov or 0) * 100) if has_ref else 20,
            "Bias Indicator Fields": 100 if s["has_feedback"] else 35,
            "Missing Data Equity": c((1 - s["missing"] * 2) * 100),
        }

        a = {
            "Audit Log Volume":        s["volume_score"],
            "Timestamp Coverage":      100 if s["has_timestamp"] else 20,
            "User Attribution":        100 if s["has_user_id"] else 25,
            "Model Version Control":   100 if s["has_version"] else 30,
            "Error/Exception Logging": 100 if s["has_error"] else 35,
        }

        di = {
            "Completeness Score":     s["completeness"],
            "Duplicate-Free Rate":    s["dup_penalty"],
            "Reference Summary Rate": c((ref_cov or 0) * 100) if has_ref else 20,
            "Schema Consistency":     s["schema_score"],
            "Ground Truth Quality":   100 if (has_ref and has_rouge) else 30,
        }

        rouge_score = c(best_rouge_val * 200) if has_rouge else 30
        r = {
            "ROUGE-L Score":      rouge_score,
            "BERTScore F1":       c((bscore or 0) * 100) if has_bert else 30,
            "Faithfulness":       c((faith_val or 0) * 100) if has_faith else 30,
            "Latency Monitoring": 100 if s["has_latency"] else 30,
            "Volume Sufficiency": s["volume_score"],
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
            "Compute Proxy Score":   50,
            "Redundancy Elimination": s["dup_penalty"],
            "Resource Optimisation": c(s["schema_score"] * 0.6 + 40),
        }

        sf = {
            "Harm Prevention Logging":   100 if s["has_safety"] else 20,
            "Faithfulness as Safety":    c((faith_val or 0) * 100) if has_faith else 25,
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
        "rouge_l":            "ROUGE-L below threshold. Fine-tune on domain summaries or adjust length penalty.",
        "rouge_1":            "ROUGE-1 below threshold. Improve lexical overlap with reference summaries.",
        "rouge_2":            "ROUGE-2 below threshold. Model may over-abstract; reduce paraphrasing.",
        "bleu":               "BLEU below threshold. Add more reference summaries or reduce over-abstraction.",
        "bertscore":          "BERTScore below threshold. Semantic drift detected — consider factual consistency training.",
        "faithfulness":       "Faithfulness below threshold. Add a factual verification post-processing step.",
        "reference_coverage": "Reference summary coverage below threshold. Add reference summaries for at least 90% of records.",
    }

    def _rec_for_metric(self, metric_name: str) -> str:
        return self._METRIC_RECS.get(metric_name,
            f"Investigate elevated risk in '{metric_name}' for this summarization model.")