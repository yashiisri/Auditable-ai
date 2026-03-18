"""
services/sdcc/detector.py  (REFACTORED)
=========================================
Detects the AI model family from an uploaded DataFrame using:

  1. Column-name signals   (fast, no content reading)
  2. Content-pattern signals  (looks at actual input/output text values)

The user is expected to upload a CSV/JSON with at minimum:
  - `input`  (or prompt / query / instruction)
  - `output` (or response / answer / completion / result / summary)

Optional enrichment columns:
  - `reference` / `reference_summary`
  - `context` / `retrieved_chunks`
  - `label` / `ground_truth`
  - `confidence`, `latency`, etc.

Detection logic
---------------
Phase 1 — column-name scoring (same weighted approach as before, now
          exclusively for structural/metadata column signals, NOT metric cols)
Phase 2 — content-pattern scoring (regexes over actual input/output text)

Both phases produce a normalised score in [0,1].  The final score is a
weighted blend: 60% content, 40% column-name (when content is available).

If neither phase clears the threshold we return "general_llm" as a safe fallback.
"""

from __future__ import annotations
import re
from typing import Tuple
import pandas as pd


# ── Column-name signals ────────────────────────────────────────────────────────
# These look at STRUCTURAL / CONTEXTUAL columns only — not pre-computed metric
# columns (rouge, f1, etc.) because users are no longer expected to log those.

_COL_SIGNALS: dict[str, dict[str, list[str]]] = {

    "classification": {
        "strong":   ["predicted_class", "pred_label", "true_label", "class_weight"],
        "moderate": ["label", "class", "target", "ground_truth"],
        "weak":     ["confidence", "score"],
    },

    "rag": {
        "strong":   ["retrieved_chunks", "source_doc", "context_precision"],
        "moderate": ["context", "chunks", "passages", "retrieved", "documents"],
        "weak":     ["query", "answer"],
    },

    "summarization": {
        "strong":   ["reference_summary", "compression_ratio", "source_doc"],
        "moderate": ["summary", "abstract", "condensed", "generated_summary"],
        "weak":     ["reference", "target"],
    },

    "automation": {
        "strong":   ["workflow_id", "step_name", "task_id", "step_result",
                     "retry_count", "agent_id"],
        "moderate": ["step", "action", "workflow", "pipeline", "job", "run_id"],
        "weak":     ["status", "process"],
    },

    "image_classification": {
        "strong":   ["image_path", "bbox", "bounding_box", "annotation",
                     "image_id"],
        "moderate": ["image", "frame", "mask", "category", "class_name"],
        "weak":     ["label", "confidence"],
    },

    "general_llm": {
        "strong":   ["conversation_id", "turn_id", "system_prompt", "is_safe",
                     "moderated"],
        "moderate": ["prompt", "response", "assistant", "user_message",
                     "instruction", "completion"],
        "weak":     ["input", "output"],
    },
}

_COL_WEIGHTS = {"strong": 3, "moderate": 2, "weak": 1}
_COL_MIN_NORM  = 0.06
_COL_MIN_RAW   = 2.0


# ── Content-pattern signals ────────────────────────────────────────────────────
# Patterns matched against combined input+output text (first 200 rows).

_CONTENT_PATTERNS: dict[str, list[str]] = {

    "summarization": [
        r"\bsummar(y|ise|ize|izing|ising)\b",
        r"\babstract\b",
        r"\bkey points?\b",
        r"\bin (brief|short|summary)\b",
        r"\bthe (article|document|text|passage|report|paper) (says?|states?|discusses?|describes?|argues?)\b",
        r"\bcondensed?\b",
        r"\bTL;?DR\b",
        r"\bmain (points?|ideas?|findings?|takeaways?)\b",
        r"\boverall[,\s]+(the|this|it)\b",
        r"\bto summarise\b",
        r"\bto summarize\b",
        r"\bin conclusion\b",
        r"\bthe (author|writer|report|document|text|article) (argues?|claims?|suggests?|notes?|states?|explains?)\b",
    ],

    "rag": [
        r"\baccording to (the |our )?(document|source|context|knowledge base|retrieved)\b",
        r"\bbased on (the )?(provided|retrieved|given) (context|document|information)\b",
        r"\bthe (document|passage|source) (states?|mentions?|indicates?)\b",
        r"\bretriev(ed|al)\b",
        r"\bvector (search|store|database|db)\b",
        r"\bsource:\s*\[",   # citation markers
        r"\bfrom (the )?knowledge base\b",
        r"\bno (relevant )?(information|context) (found|available|retrieved)\b",
    ],

    "classification": [
        r"\b(positive|negative|neutral)\b",
        r"\b(spam|not spam|ham)\b",
        r"\b(benign|malignant|malicious|safe|unsafe)\b",
        r"\b(class|category|label|type)\s*[:\-=]\s*\w+",
        r"\bpredicted\s+(class|label|category)\b",
        r"\bconfidence\s*[:\-=]?\s*[\d.]+%?",
        r"\b(true|false) (positive|negative)\b",
        r"\bprobability\s*[:\-=]?\s*[\d.]+",
    ],

    "automation": [
        r"\bstep\s+\d+",
        r"\btask\s+(id|complete|failed|started)\b",
        r"\bworkflow\b",
        r"\b(tool|function|api)\s+(call|called|invoked|result)\b",
        r"\baction\s*[:\-=]\s*\w+",
        r"\b(retry|retried|retrying)\b",
        r"\bpipeline\b",
        r"\b(agent|bot)\s+(executed|ran|performed|triggered)\b",
        r"\b(success|failure)\s*[:\-=]\s*(true|false|1|0)\b",
    ],

    "image_classification": [
        r"\b(image|photo|picture|frame|screenshot)\b",
        r"\b(bounding box|bbox|coordinates)\b",
        r"\bdetected\s+(object|class|label)\b",
        r"\b(width|height)\s*[:\-=]?\s*\d+",
        r"\b(pixel|resolution|rgb|grayscale)\b",
        r"\b(object detection|segmentation|OCR)\b",
        r"\bconfidence\s*[:\-=]?\s*[\d.]+",
        r"\bclass\s+name\s*[:\-=]\s*\w+",
    ],

    "general_llm": [
        r"\b(user|human)\s*[:\->\|]+\s*\w",
        r"\b(assistant|bot|ai|claude|gpt|gemini)\s*[:\->\|]+\s*\w",
        r"\bhow can I (help|assist)\b",
        r"\bsure[,!]?\s+(here|I|let me|happy)\b",
        r"\b(hello|hi|hey)[,!]?\s",
        r"\bI (am|'m) an AI\b",
        r"\bI (don'?t|cannot|can'?t) (help|assist) with that\b",
        r"\bplease (ask|tell|describe|provide)\b",
    ],
}

_CONTENT_MIN_MATCHES = 1   # at least 1 pattern match to count the category


def _score_column_names(df: pd.DataFrame) -> dict[str, float]:
    """Return {model_type: normalised_score} from column name signals."""
    col_tokens: set[str] = {c.lower() for c in df.columns}

    scores: dict[str, float] = {}
    for mt, tiers in _COL_SIGNALS.items():
        raw = possible = 0.0
        for tier, terms in tiers.items():
            w = _COL_WEIGHTS[tier]
            possible += len(terms) * w
            for term in terms:
                if any(term in tok for tok in col_tokens):
                    raw += w
        scores[mt] = raw / possible if possible > 0 else 0.0

    return scores


def _score_content(df: pd.DataFrame) -> dict[str, float]:
    """
    Sample up to 200 rows of input+output text and count pattern matches per
    model type.  Returns {model_type: normalised_score ∈ [0,1]}.
    """
    # Find input/output columns
    low_map = {c.lower(): c for c in df.columns}

    def _get(*keys: str) -> list[str]:
        for k in keys:
            for col_l, col_o in low_map.items():
                if k in col_l:
                    sample = df[col_o].dropna().head(200).astype(str).tolist()
                    return [t for t in sample if t.strip()]
        return []

    inputs  = _get("input",  "prompt",   "query",      "instruction", "step_name")
    outputs = _get("output", "response", "answer",     "completion",  "result",
                   "summary", "prediction")
    combined = inputs[:100] + outputs[:100]

    if not combined:
        return {}

    all_text = " ".join(combined).lower()
    max_possible = len(combined) * 2   # normalisation denominator

    scores: dict[str, float] = {}
    for mt, patterns in _CONTENT_PATTERNS.items():
        hits = sum(
            1
            for row_text in combined
            for pat in patterns
            if re.search(pat, row_text, re.IGNORECASE)
        )
        scores[mt] = min(hits / max(max_possible, 1), 1.0)

    return scores


def detect_model_type(df: pd.DataFrame) -> Tuple[str, float]:
    """
    Returns (model_type, confidence ∈ [0,1]).

    confidence ≥ 0.60  → high confidence
    0.25–0.59          → moderate
    < 0.25             → low / ambiguous (general_llm fallback used)
    """
    col_scores  = _score_column_names(df)
    cont_scores = _score_content(df)

    # ── Structural heuristic: output much shorter than input → summarization ──
    # (only when content signals are weak and no other type dominates)
    struct_bonus: dict[str, float] = {}
    low_map = {c.lower(): c for c in df.columns}

    def _get_texts(*keys: str) -> list[str]:
        for k in keys:
            for col_l, col_o in low_map.items():
                if k in col_l:
                    return df[col_o].dropna().head(50).astype(str).tolist()
        return []

    inp_texts = _get_texts("input", "prompt", "query", "instruction")
    out_texts = _get_texts("output", "response", "answer", "completion", "result", "summary")

    if inp_texts and out_texts:
        n = min(len(inp_texts), len(out_texts))
        avg_in  = sum(len(t.split()) for t in inp_texts[:n]) / n
        avg_out = sum(len(t.split()) for t in out_texts[:n]) / n
        # If output is less than 60% of input length → compression → summarization signal
        if avg_in > 10 and avg_out < avg_in * 0.60:
            struct_bonus["summarization"] = 0.20

    # Reference column → strong summarization indicator
    has_ref_col = any("reference" in c or "ref_summary" in c for c in low_map)
    if has_ref_col:
        struct_bonus["summarization"] = struct_bonus.get("summarization", 0) + 0.25

    # Blend: 40% column-name, 60% content (when content available)
    has_content = bool(cont_scores)
    blended: dict[str, float] = {}
    for mt in set(col_scores) | set(cont_scores) | set(struct_bonus):
        c_score = col_scores.get(mt, 0.0)
        t_score = cont_scores.get(mt, 0.0)
        s_bonus = struct_bonus.get(mt, 0.0)
        if has_content:
            blended[mt] = 0.40 * c_score + 0.60 * t_score + s_bonus
        else:
            blended[mt] = c_score + s_bonus

    # Exclude general_llm from primary ranking (always fallback)
    candidates = {mt: s for mt, s in blended.items() if mt != "general_llm"}

    if candidates:
        best_type = max(candidates, key=lambda k: candidates[k])
        best_score = candidates[best_type]

        # Content raw check: require at least _CONTENT_MIN_MATCHES
        if has_content:
            content_raw = cont_scores.get(best_type, 0.0)
            col_raw_ok  = (
                col_scores.get(best_type, 0.0) >= _COL_MIN_NORM
            )
            if best_score >= 0.05 or col_raw_ok:
                return best_type, round(min(best_score * 2, 1.0), 3)
        else:
            # Column-name only
            raw_col = sum(
                _COL_WEIGHTS[tier] * sum(
                    1 for term in terms
                    if any(term in c.lower() for c in df.columns)
                )
                for tier, terms in _COL_SIGNALS.get(best_type, {}).items()
            )
            if raw_col >= _COL_MIN_RAW and col_scores.get(best_type, 0) >= _COL_MIN_NORM:
                return best_type, round(min(blended[best_type] * 2, 1.0), 3)

    # Fallback
    general_score = blended.get("general_llm", 0.0)
    return "general_llm", round(min(general_score * 2, 1.0), 3)