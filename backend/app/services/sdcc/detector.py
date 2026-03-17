"""
services/sdcc/detector.py
==========================
Detects the AI model family from an uploaded DataFrame using weighted
multi-signal scoring — NOT first-match-wins.

How it works
-------------
For every model type we check three tiers of column signals:
  strong   × 3 pts — highly discriminative columns (e.g. "roc_auc" → classification)
  moderate × 2 pts — commonly associated but not unique (e.g. "label" → classification)
  weak     × 1 pt  — generic columns that appear in many model types

Each type's raw score is normalised by its maximum possible score so that types
with many signals don't automatically win by volume.

A type must exceed MIN_NORMALISED_SCORE (0.08) AND MIN_RAW_SCORE (3) to be
selected. If nothing clears both bars, we return "general_llm" as the safe
fallback.

The function returns (model_type, confidence) where confidence ∈ [0, 1].
Confidence < 0.25 means the detection was ambiguous.
"""

from __future__ import annotations
from typing import Tuple
import pandas as pd


# Signals for each model type.
# Keys: "strong", "moderate", "weak"
# Values: substrings checked against lowercased column names (substring match,
# not exact match, so "roc_auc_score" matches the term "roc_auc").
_SIGNALS: dict[str, dict[str, list[str]]] = {

    "classification": {
        "strong":   ["roc_auc", "auc_score", "f1_score", "f1score", "precision_score",
                     "recall_score", "predicted_class", "pred_label", "true_label",
                     "class_weight", "confusion"],
        "moderate": ["label", "class", "target", "ground_truth", "prediction",
                     "predicted", "actual", "probability", "pred_prob"],
        "weak":     ["confidence", "score", "output"],
    },

    "rag": {
        "strong":   ["faithfulness", "context_recall", "answer_relevance", "groundedness",
                     "retrieved_chunks", "source_doc", "retrieval_score",
                     "context_precision", "hallucination"],
        "moderate": ["context", "chunks", "passages", "retrieved", "documents",
                     "answer", "query"],
        "weak":     ["response", "input"],
    },

    "summarization": {
        "strong":   ["rouge_l", "rouge_lsum", "rouge_1", "rouge_2", "rouge1", "rouge2",
                     "bleu", "bleu_score", "bertscore", "bert_score",
                     "reference_summary", "compression_ratio"],
        "moderate": ["summary", "abstract", "condensed", "generated_summary",
                     "faithfulness", "source_doc"],
        "weak":     ["output", "text"],
    },

    "automation": {
        "strong":   ["workflow_id", "step_name", "step_success", "task_complete",
                     "tool_call", "tool_name", "agent_id", "step_result",
                     "retry_count", "task_id"],
        "moderate": ["step", "action", "workflow", "pipeline", "job", "run_id",
                     "execution", "subtask", "operation"],
        "weak":     ["status", "process"],
    },

    "image_classification": {
        "strong":   ["iou", "intersection_over_union", "map", "mean_average_precision",
                     "bbox", "bounding_box", "segmentation", "pixel", "detection_score",
                     "top_k_accuracy", "top5_acc", "annotation", "image_path",
                     "mean_iou", "miou"],
        "moderate": ["image", "frame", "image_id", "crop", "mask", "category",
                     "class_name", "detected_class"],
        "weak":     ["label", "prediction", "confidence"],
    },

    # general_llm is the fallback — we still score it so callers can compare
    "general_llm": {
        "strong":   ["toxicity", "toxicity_score", "perplexity", "coherence",
                     "conversation_id", "turn_id", "is_safe", "safety_flag",
                     "content_safe", "moderated"],
        "moderate": ["prompt", "response", "assistant", "user_message",
                     "instruction", "completion"],
        "weak":     ["input", "output"],
    },
}

_WEIGHTS = {"strong": 3, "moderate": 2, "weak": 1}
MIN_NORMALISED_SCORE = 0.08
MIN_RAW_SCORE = 3.0


def detect_model_type(df: pd.DataFrame) -> Tuple[str, float]:
    """
    Returns (model_type, confidence).

    confidence is normalised to [0, 1]:
      ≥ 0.60  high confidence
      0.25-0.59 moderate
      < 0.25  low / ambiguous (general_llm fallback used)
    """
    col_tokens: set[str] = set()
    for col in df.columns:
        col_tokens.add(col.lower())

    raw_scores: dict[str, float] = {}
    max_possible: dict[str, float] = {}

    for model_type, tiers in _SIGNALS.items():
        score = 0.0
        possible = 0.0
        for tier, terms in tiers.items():
            w = _WEIGHTS[tier]
            possible += len(terms) * w
            for term in terms:
                # Substring match across all column tokens
                if any(term in tok for tok in col_tokens):
                    score += w
        raw_scores[model_type] = score
        max_possible[model_type] = possible

    # Exclude general_llm from primary ranking — it's always the fallback
    candidates = {
        mt: (raw_scores[mt] / max_possible[mt])
        for mt in raw_scores
        if mt != "general_llm" and max_possible.get(mt, 0) > 0
    }

    # Find best non-fallback candidate
    if candidates:
        best_type  = max(candidates, key=lambda k: candidates[k])
        best_norm  = candidates[best_type]
        best_raw   = raw_scores[best_type]

        if best_raw >= MIN_RAW_SCORE and best_norm >= MIN_NORMALISED_SCORE:
            return best_type, round(best_norm, 3)

    # Nothing cleared the bar — use general_llm
    general_norm = (
        raw_scores.get("general_llm", 0) / max_possible.get("general_llm", 1)
        if max_possible.get("general_llm", 0) > 0 else 0.0
    )
    return "general_llm", round(general_norm, 3)