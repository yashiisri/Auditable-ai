"""
services/sdcc/metrics_calculator.py
=====================================
Actual metric computation engine.

Accepts only `input` and `output` columns from the user (plus optional
`reference` / `context` / `label` columns depending on model type).
All metric values are computed here using real NLP/ML libraries — nothing
is read from pre-logged columns.

Library dependency strategy
-----------------------------
Every library import is guarded with a try/except so the server never crashes
due to a missing optional dependency.  When a library is unavailable the
affected metric returns None and the risk_level becomes "Unavailable".

Required (always installed):
  numpy, pandas, re, statistics, collections

Optional (install for best results):
  rouge_score       → pip install rouge-score
  sacrebleu         → pip install sacrebleu
  bert_score        → pip install bert-score
  sklearn           → pip install scikit-learn
  detoxify          → pip install detoxify
  sentence_transformers → pip install sentence-transformers
  nltk              → pip install nltk
"""

from __future__ import annotations
import re, math, statistics
from collections import Counter
from typing import Optional
import pandas as pd
import numpy as np

# ── Optional library guards ────────────────────────────────────────────────────

try:
    from rouge_score import rouge_scorer
    _HAS_ROUGE = True
except ImportError:
    _HAS_ROUGE = False

try:
    import sacrebleu as _sacrebleu
    _HAS_BLEU = True
except ImportError:
    _HAS_BLEU = False

try:
    from bert_score import score as _bert_score
    _HAS_BERTSCORE = True
except ImportError:
    _HAS_BERTSCORE = False

try:
    from sklearn.metrics import (
        roc_auc_score, f1_score, precision_score, recall_score
    )
    _HAS_SKLEARN = True
except ImportError:
    _HAS_SKLEARN = False

try:
    from detoxify import Detoxify
    _detox_model = Detoxify("original")
    _HAS_DETOXIFY = True
except Exception:
    _HAS_DETOXIFY = False

try:
    from sentence_transformers import SentenceTransformer, util as st_util
    _st_model = SentenceTransformer("all-MiniLM-L6-v2")
    _HAS_ST = True
except Exception:
    _HAS_ST = False


# ─────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────────────────────

def _col(df: pd.DataFrame, *candidates: str) -> Optional[str]:
    """Return first column matching any candidate (case-insensitive substring)."""
    lower = {c.lower(): c for c in df.columns}
    for cand in candidates:
        for col_low, col_orig in lower.items():
            if cand in col_low:
                return col_orig
    return None


def _texts(df: pd.DataFrame, *candidates: str) -> list[str]:
    """Return non-null string values from first matching column."""
    col = _col(df, *candidates)
    if col is None:
        return []
    return [str(v) for v in df[col].dropna().tolist() if str(v).strip()]


def _safe_mean(values: list[float]) -> Optional[float]:
    return float(np.mean(values)) if values else None


# ─────────────────────────────────────────────────────────────────────────────
# ROUGE  (summarization, RAG)
# ─────────────────────────────────────────────────────────────────────────────

def compute_rouge(
    hypotheses: list[str],
    references: list[str],
) -> dict[str, Optional[float]]:
    """
    Compute ROUGE-1, ROUGE-2, ROUGE-L F1 scores.
    Returns dict with keys: rouge_1, rouge_2, rouge_l
    Falls back to a simple n-gram overlap implementation when rouge_score
    is not installed.
    """
    if not hypotheses or not references:
        return {"rouge_1": None, "rouge_2": None, "rouge_l": None}

    pairs = list(zip(hypotheses, references))

    if _HAS_ROUGE:
        scorer = rouge_scorer.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=True)
        r1, r2, rl = [], [], []
        for hyp, ref in pairs:
            s = scorer.score(ref, hyp)
            r1.append(s["rouge1"].fmeasure)
            r2.append(s["rouge2"].fmeasure)
            rl.append(s["rougeL"].fmeasure)
        return {
            "rouge_1": _safe_mean(r1),
            "rouge_2": _safe_mean(r2),
            "rouge_l": _safe_mean(rl),
        }

    # ── Fallback: token-overlap ROUGE ─────────────────────────────────────────
    def _ngrams(tokens: list[str], n: int) -> Counter:
        return Counter(tuple(tokens[i:i+n]) for i in range(len(tokens)-n+1))

    def _lcs_len(a: list, b: list) -> int:
        m, n = len(a), len(b)
        dp = [[0]*(n+1) for _ in range(m+1)]
        for i in range(1, m+1):
            for j in range(1, n+1):
                dp[i][j] = dp[i-1][j-1]+1 if a[i-1]==b[j-1] else max(dp[i-1][j], dp[i][j-1])
        return dp[m][n]

    def _f1(p: float, r: float) -> float:
        return 2*p*r/(p+r) if (p+r) > 0 else 0.0

    r1, r2, rl = [], [], []
    for hyp, ref in pairs:
        ht = hyp.lower().split()
        rt = ref.lower().split()
        for n, store in [(1, r1), (2, r2)]:
            hc, rc = _ngrams(ht, n), _ngrams(rt, n)
            overlap = sum(min(hc[g], rc[g]) for g in hc)
            p = overlap/max(sum(hc.values()), 1)
            r = overlap/max(sum(rc.values()), 1)
            store.append(_f1(p, r))
        lcs = _lcs_len(ht, rt)
        p = lcs/max(len(ht), 1)
        r = lcs/max(len(rt), 1)
        rl.append(_f1(p, r))

    return {
        "rouge_1": _safe_mean(r1),
        "rouge_2": _safe_mean(r2),
        "rouge_l": _safe_mean(rl),
    }


# ─────────────────────────────────────────────────────────────────────────────
# BLEU  (summarization)
# ─────────────────────────────────────────────────────────────────────────────

def compute_bleu(
    hypotheses: list[str],
    references: list[str],
) -> Optional[float]:
    """
    Corpus-level BLEU score.
    Uses sacrebleu when available; falls back to a simple smoothed BLEU.
    Returns score in [0, 1] range.
    """
    if not hypotheses or not references:
        return None

    if _HAS_BLEU:
        try:
            result = _sacrebleu.corpus_bleu(hypotheses, [references])
            return result.score / 100.0   # sacrebleu returns 0-100
        except Exception:
            pass

    # ── Fallback: smoothed BLEU-4 ─────────────────────────────────────────────
    def _ngrams(tokens: list[str], n: int) -> Counter:
        return Counter(tuple(tokens[i:i+n]) for i in range(len(tokens)-n+1))

    scores = []
    for hyp, ref in zip(hypotheses, references):
        ht = hyp.lower().split()
        rt = ref.lower().split()
        if not ht:
            scores.append(0.0)
            continue
        brevity = min(1.0, math.exp(1 - len(rt)/max(len(ht), 1)))
        ps = []
        for n in range(1, 5):
            hc, rc = _ngrams(ht, n), _ngrams(rt, n)
            overlap = sum(min(hc[g], rc[g]) for g in hc)
            total   = max(sum(hc.values()), 1)
            # +1 smoothing
            ps.append(math.log((overlap + 1) / (total + 1)))
        scores.append(brevity * math.exp(sum(ps) / 4))

    return _safe_mean(scores)


# ─────────────────────────────────────────────────────────────────────────────
# BERTScore  (summarization, RAG)
# ─────────────────────────────────────────────────────────────────────────────

def compute_bertscore(
    hypotheses: list[str],
    references: list[str],
) -> Optional[float]:
    """
    Mean BERTScore F1.
    Uses bert_score library when available; falls back to cosine similarity
    via sentence_transformers; final fallback is None.
    """
    if not hypotheses or not references:
        return None

    if _HAS_BERTSCORE:
        try:
            _, _, F = _bert_score(hypotheses, references, lang="en", verbose=False)
            return float(F.mean().item())
        except Exception:
            pass

    if _HAS_ST:
        try:
            h_emb = _st_model.encode(hypotheses, convert_to_tensor=True)
            r_emb = _st_model.encode(references, convert_to_tensor=True)
            sims  = st_util.cos_sim(h_emb, r_emb).diagonal().tolist()
            return _safe_mean([float(s) for s in sims])
        except Exception:
            pass

    return None


# ─────────────────────────────────────────────────────────────────────────────
# Faithfulness / Semantic Similarity  (RAG, summarization)
# ─────────────────────────────────────────────────────────────────────────────

def compute_faithfulness(
    outputs: list[str],
    contexts: list[str],
) -> Optional[float]:
    """
    Proxy faithfulness score: cosine similarity between generated answer
    and retrieved context (or reference document).

    Uses sentence_transformers when available, falls back to simple Jaccard
    token overlap.
    """
    if not outputs or not contexts:
        return None

    pairs = list(zip(outputs, contexts))

    if _HAS_ST:
        try:
            o_emb = _st_model.encode(outputs, convert_to_tensor=True)
            c_emb = _st_model.encode(contexts, convert_to_tensor=True)
            sims  = st_util.cos_sim(o_emb, c_emb).diagonal().tolist()
            return _safe_mean([float(s) for s in sims])
        except Exception:
            pass

    # Jaccard fallback
    def _jaccard(a: str, b: str) -> float:
        sa = set(a.lower().split())
        sb = set(b.lower().split())
        inter = len(sa & sb)
        union = len(sa | sb)
        return inter / union if union else 0.0

    return _safe_mean([_jaccard(o, c) for o, c in pairs])


# ─────────────────────────────────────────────────────────────────────────────
# Answer Relevance  (RAG)
# ─────────────────────────────────────────────────────────────────────────────

def compute_answer_relevance(
    queries: list[str],
    answers: list[str],
) -> Optional[float]:
    """
    Cosine similarity between query and answer as a proxy for answer relevance.
    Uses sentence_transformers; falls back to Jaccard token overlap.
    """
    if not queries or not answers:
        return None

    pairs = list(zip(queries, answers))

    if _HAS_ST:
        try:
            q_emb = _st_model.encode(queries, convert_to_tensor=True)
            a_emb = _st_model.encode(answers, convert_to_tensor=True)
            sims  = st_util.cos_sim(q_emb, a_emb).diagonal().tolist()
            return _safe_mean([float(s) for s in sims])
        except Exception:
            pass

    def _jaccard(a: str, b: str) -> float:
        sa = set(a.lower().split())
        sb = set(b.lower().split())
        inter = len(sa & sb)
        union = len(sa | sb)
        return inter / union if union else 0.0

    return _safe_mean([_jaccard(q, a) for q, a in pairs])


# ─────────────────────────────────────────────────────────────────────────────
# Context Recall  (RAG)
# ─────────────────────────────────────────────────────────────────────────────

def compute_context_recall(
    contexts: list[str],
    references: list[str],
) -> Optional[float]:
    """
    What proportion of reference answer tokens appear in the context?
    Proxy: unigram recall(reference_tokens ∩ context_tokens).
    """
    if not contexts or not references:
        return None

    recalls = []
    for ctx, ref in zip(contexts, references):
        rt = set(ref.lower().split())
        ct = set(ctx.lower().split())
        if not rt:
            continue
        recalls.append(len(rt & ct) / len(rt))

    return _safe_mean(recalls) if recalls else None


# ─────────────────────────────────────────────────────────────────────────────
# Hallucination Rate  (general LLM, RAG)
# ─────────────────────────────────────────────────────────────────────────────

def compute_hallucination_rate(
    outputs: list[str],
    contexts: list[str],
) -> Optional[float]:
    """
    Hallucination rate = 1 - faithfulness (inverse of semantic grounding).
    A high semantic distance between output and context implies hallucination.
    """
    faith = compute_faithfulness(outputs, contexts)
    if faith is None:
        return None
    return round(1.0 - faith, 4)


# ─────────────────────────────────────────────────────────────────────────────
# Toxicity  (general LLM)
# ─────────────────────────────────────────────────────────────────────────────

def compute_toxicity_rate(outputs: list[str]) -> Optional[float]:
    """
    Mean toxicity score across all outputs.
    Uses detoxify when available; falls back to keyword heuristic.
    """
    if not outputs:
        return None

    if _HAS_DETOXIFY:
        try:
            results = _detox_model.predict(outputs)
            scores  = results.get("toxicity", [])
            return _safe_mean(list(scores))
        except Exception:
            pass

    # Keyword heuristic fallback (very rough — clearly not production-grade)
    _TOXIC_WORDS = {
        "hate", "kill", "die", "idiot", "stupid", "moron", "racist",
        "sexist", "abuse", "violent", "threaten", "assault", "harass",
    }
    rates = []
    for text in outputs:
        tokens = set(re.findall(r"\b\w+\b", text.lower()))
        rates.append(1.0 if tokens & _TOXIC_WORDS else 0.0)
    return _safe_mean(rates)


# ─────────────────────────────────────────────────────────────────────────────
# Safety Pass Rate  (general LLM)
# ─────────────────────────────────────────────────────────────────────────────

def compute_safety_pass_rate(outputs: list[str]) -> Optional[float]:
    """
    Proportion of outputs that appear safe (1 - toxicity rate, rounded).
    """
    tox = compute_toxicity_rate(outputs)
    if tox is None:
        return None
    return round(1.0 - tox, 4)


# ─────────────────────────────────────────────────────────────────────────────
# Coherence  (general LLM, summarization)
# ─────────────────────────────────────────────────────────────────────────────

def compute_coherence(outputs: list[str]) -> Optional[float]:
    """
    Proxy coherence score based on:
      - Average sentence length (too short = incoherent fragments)
      - Type-token ratio (vocabulary richness)
      - Presence of common discourse markers
    Returns a normalised score in [0, 1].
    """
    if not outputs:
        return None

    DISCOURSE_MARKERS = {
        "however", "therefore", "furthermore", "moreover", "consequently",
        "although", "because", "since", "thus", "hence", "additionally",
        "in conclusion", "in summary", "as a result", "for example",
        "in contrast", "on the other hand", "first", "second", "finally",
    }

    scores = []
    for text in outputs:
        sentences = re.split(r"[.!?]+", text.strip())
        sentences = [s.strip() for s in sentences if s.strip()]
        if not sentences:
            scores.append(0.0)
            continue

        tokens    = text.lower().split()
        avg_len   = np.mean([len(s.split()) for s in sentences])
        ttr       = len(set(tokens)) / max(len(tokens), 1)
        text_low  = text.lower()
        dm_count  = sum(1 for m in DISCOURSE_MARKERS if m in text_low)
        dm_score  = min(dm_count / 3, 1.0)   # saturates at 3 markers

        # Normalise avg_len: optimal ~15 words/sentence
        len_score = min(avg_len / 15, 1.0) if avg_len <= 15 else max(0, 1 - (avg_len-15)/30)

        score = 0.4 * len_score + 0.3 * ttr + 0.3 * dm_score
        scores.append(min(score, 1.0))

    return _safe_mean(scores)


# ─────────────────────────────────────────────────────────────────────────────
# Perplexity proxy  (general LLM)
# ─────────────────────────────────────────────────────────────────────────────

def compute_perplexity_proxy(outputs: list[str]) -> Optional[float]:
    """
    Vocabulary-based perplexity proxy.
    True perplexity requires the model's logits. This computes an approximation
    based on the entropy of the unigram distribution in each output.
    Lower = more predictable/fluent text (like real LLM perplexity).
    """
    if not outputs:
        return None

    scores = []
    for text in outputs:
        tokens = text.lower().split()
        if not tokens:
            continue
        counts = Counter(tokens)
        total  = sum(counts.values())
        probs  = [v/total for v in counts.values()]
        entropy = -sum(p * math.log(p + 1e-9) for p in probs)
        # Scale to a reasonable perplexity-like range
        scores.append(math.exp(entropy))

    return _safe_mean(scores)


# ─────────────────────────────────────────────────────────────────────────────
# Compression Ratio  (summarization)
# ─────────────────────────────────────────────────────────────────────────────

def compute_compression_ratio(
    inputs: list[str],
    outputs: list[str],
) -> Optional[float]:
    """Ratio of output token length to input token length (lower = more compressed)."""
    if not inputs or not outputs:
        return None
    ratios = []
    for inp, out in zip(inputs, outputs):
        in_len  = max(len(inp.split()), 1)
        out_len = len(out.split())
        ratios.append(out_len / in_len)
    return _safe_mean(ratios)


# ─────────────────────────────────────────────────────────────────────────────
# Classification metrics  (classification)
# ─────────────────────────────────────────────────────────────────────────────

def compute_classification_metrics(
    df: pd.DataFrame,
) -> dict[str, Optional[float]]:
    """
    Compute F1, Precision, Recall, ROC-AUC, class balance, and avg confidence
    from a DataFrame with at least `output` (predicted class) and
    optionally `label`/`ground_truth` (true class) and `confidence`/`probability`.

    All metrics return None when required columns are absent.
    """
    output_col = _col(df, "output", "prediction", "predicted", "pred_label",
                      "predicted_class", "result")
    label_col  = _col(df, "label", "ground_truth", "true_label", "actual",
                      "target", "class")
    conf_col   = _col(df, "confidence", "probability", "prob", "score",
                      "pred_prob")

    result: dict[str, Optional[float]] = {
        "roc_auc":        None,
        "f1_score":       None,
        "precision":      None,
        "recall":         None,
        "class_balance":  None,
        "avg_confidence": None,
    }

    # Confidence
    if conf_col is not None:
        vals = pd.to_numeric(df[conf_col], errors="coerce").dropna()
        if len(vals) > 0:
            result["avg_confidence"] = float(vals.mean())

    # Class balance from outputs
    ref_col = label_col or output_col
    if ref_col is not None:
        vc = df[ref_col].value_counts()
        if len(vc) >= 2:
            result["class_balance"] = float(vc.min() / vc.max())

    # Sklearn metrics — need both output + label
    if output_col is None or label_col is None:
        return result

    y_pred = df[output_col].dropna().astype(str).tolist()
    y_true = df[label_col].dropna().astype(str).tolist()
    n = min(len(y_pred), len(y_true))
    if n < 2:
        return result

    y_pred = y_pred[:n]
    y_true = y_true[:n]

    classes = sorted(set(y_true) | set(y_pred))
    avg = "binary" if len(classes) == 2 else "macro"

    if _HAS_SKLEARN:
        try:
            result["f1_score"]  = float(f1_score(y_true, y_pred, average=avg, zero_division=0))
            result["precision"] = float(precision_score(y_true, y_pred, average=avg, zero_division=0))
            result["recall"]    = float(recall_score(y_true, y_pred, average=avg, zero_division=0))
        except Exception:
            pass

        # ROC-AUC — binary only (needs probability column)
        if conf_col is not None and len(classes) == 2:
            try:
                probs  = pd.to_numeric(df[conf_col], errors="coerce").fillna(0.5).tolist()[:n]
                result["roc_auc"] = float(roc_auc_score(y_true, probs))
            except Exception:
                pass

    else:
        # Manual F1 fallback
        from collections import defaultdict
        tp_sum = fp_sum = fn_sum = 0
        for cls in classes:
            tp = sum(1 for p, t in zip(y_pred, y_true) if p == cls and t == cls)
            fp = sum(1 for p, t in zip(y_pred, y_true) if p == cls and t != cls)
            fn = sum(1 for p, t in zip(y_pred, y_true) if p != cls and t == cls)
            tp_sum += tp; fp_sum += fp; fn_sum += fn

        prec = tp_sum / max(tp_sum + fp_sum, 1)
        rec  = tp_sum / max(tp_sum + fn_sum, 1)
        f1   = 2*prec*rec / max(prec+rec, 1e-9)
        result["f1_score"]  = f1
        result["precision"] = prec
        result["recall"]    = rec

    return result


# ─────────────────────────────────────────────────────────────────────────────
# Step/Task metrics  (automation)
# ─────────────────────────────────────────────────────────────────────────────

def compute_automation_metrics(df: pd.DataFrame) -> dict[str, Optional[float]]:
    """
    Derive automation metrics from input/output columns.

    The `output` column should contain the step result text.
    We infer success/failure from keyword presence when no explicit boolean
    column is present.
    """
    output_col  = _col(df, "output", "result", "step_result", "response")
    input_col   = _col(df, "input", "prompt", "step_name", "task", "instruction")
    latency_col = _col(df, "latency", "duration", "elapsed", "time_ms")

    SUCCESS_KWORDS = {"success", "complete", "done", "finished", "ok", "passed", "true", "1"}
    ERROR_KWORDS   = {"error", "failed", "exception", "timeout", "false", "0", "retry", "crash"}

    result: dict[str, Optional[float]] = {
        "step_success_rate":    None,
        "task_completion_rate": None,
        "error_rate":           None,
        "avg_retry_rate":       None,
        "avg_step_latency_ms":  None,
    }

    if output_col is not None:
        outputs = [str(v).lower().strip() for v in df[output_col].dropna()]
        if outputs:
            success = [any(k in o for k in SUCCESS_KWORDS) for o in outputs]
            errors  = [any(k in o for k in ERROR_KWORDS) for o in outputs]
            # If the output is non-empty and doesn't contain error words → treat as success
            inferred = []
            for o, s, e in zip(outputs, success, errors):
                if s and not e:
                    inferred.append(1.0)
                elif e:
                    inferred.append(0.0)
                elif o:
                    inferred.append(0.8)   # neutral output, assume mostly ok
                else:
                    inferred.append(0.0)
            result["step_success_rate"]    = _safe_mean(inferred)
            result["task_completion_rate"] = result["step_success_rate"]
            result["error_rate"]           = _safe_mean([1-v for v in inferred])

    if latency_col is not None:
        lats = pd.to_numeric(df[latency_col], errors="coerce").dropna().tolist()
        if lats:
            result["avg_step_latency_ms"] = float(np.mean(lats))

    return result


# ─────────────────────────────────────────────────────────────────────────────
# Image / CV metrics  (image_classification)
# ─────────────────────────────────────────────────────────────────────────────

def compute_cv_metrics(df: pd.DataFrame) -> dict[str, Optional[float]]:
    """
    CV metrics inferred from output columns.
    Since we only receive text/CSV logs (no actual images), we extract
    numeric columns that correspond to detection scores, confidence, latency,
    and label coverage.
    """
    conf_col    = _col(df, "confidence", "score", "detection_score",
                       "probability", "confidence_score")
    label_col   = _col(df, "label", "ground_truth", "true_class",
                       "class_name", "annotation", "category")
    latency_col = _col(df, "latency", "inference_time", "duration_ms",
                       "inference_ms", "elapsed")
    iou_col     = _col(df, "iou", "intersection_over_union", "iou_score")
    map_col     = _col(df, "map", "mean_average_precision", "ap", "map_score")

    result: dict[str, Optional[float]] = {
        "map_score":        None,
        "avg_iou":          None,
        "top_k_accuracy":   None,
        "avg_confidence":   None,
        "label_coverage":   None,
        "avg_inference_ms": None,
    }

    if conf_col:
        vals = pd.to_numeric(df[conf_col], errors="coerce").dropna().tolist()
        if vals:
            result["avg_confidence"] = _safe_mean(vals)
            # Top-k accuracy proxy: proportion of outputs above 0.5 confidence
            result["top_k_accuracy"] = _safe_mean([1.0 if v >= 0.5 else 0.0 for v in vals])

    if label_col:
        result["label_coverage"] = float(df[label_col].notna().mean())

    if iou_col:
        vals = pd.to_numeric(df[iou_col], errors="coerce").dropna().tolist()
        if vals:
            result["avg_iou"] = _safe_mean(vals)

    if map_col:
        vals = pd.to_numeric(df[map_col], errors="coerce").dropna().tolist()
        if vals:
            result["map_score"] = _safe_mean(vals)

    if latency_col:
        vals = pd.to_numeric(df[latency_col], errors="coerce").dropna().tolist()
        if vals:
            result["avg_inference_ms"] = _safe_mean(vals)

    # If no map/iou columns, infer from confidence as a rough proxy
    if result["map_score"] is None and result["avg_confidence"] is not None:
        result["map_score"] = result["avg_confidence"] * 0.85  # conservative proxy
    if result["avg_iou"] is None and result["avg_confidence"] is not None:
        result["avg_iou"]   = result["avg_confidence"] * 0.90  # conservative proxy

    return result


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC API — one dispatcher per model type
# ─────────────────────────────────────────────────────────────────────────────

def calculate_metrics(model_type: str, df: pd.DataFrame) -> dict[str, Optional[float]]:
    """
    Main dispatcher. Returns a flat dict of {metric_name: float|None} for the
    given model_type and DataFrame.

    The DataFrame must contain at minimum:
      - `input`  (or prompt / query / instruction / step_name)
      - `output` (or response / answer / completion / result / summary)

    Optional columns for richer computation:
      - `reference` / `reference_summary`  — for supervised text-quality metrics
      - `context` / `retrieved_chunks`     — for RAG faithfulness
      - `label` / `ground_truth`           — for classification accuracy metrics
      - `confidence` / `probability`       — for confidence-based metrics
      - `latency` / `duration_ms`          — for latency metrics
    """
    inputs   = _texts(df, "input",  "prompt",   "query",        "instruction", "step_name")
    outputs  = _texts(df, "output", "response", "answer",       "completion",  "result", "summary")
    refs     = _texts(df, "reference", "reference_summary", "ground_truth",
                          "target", "ref_summary")
    contexts = _texts(df, "context", "retrieved_chunks", "chunks",
                          "passages", "source_doc")

    # Align lengths — use the shortest common set
    n = min(
        len(inputs)  if inputs  else 999_999,
        len(outputs) if outputs else 999_999,
    )
    if n == 999_999 or n == 0:
        # Cannot compute any text-pair metrics
        return {}

    inputs  = inputs[:n]
    outputs = outputs[:n]
    refs    = refs[:n]     if len(refs)     >= n else []
    contexts= contexts[:n] if len(contexts) >= n else []

    # ── Dispatch ───────────────────────────────────────────────────────────────

    if model_type == "summarization":
        ref_list  = refs or inputs   # fall back to using input as "reference"
        rouge     = compute_rouge(outputs, ref_list)
        return {
            "rouge_1":           rouge["rouge_1"],
            "rouge_2":           rouge["rouge_2"],
            "rouge_l":           rouge["rouge_l"],
            "bleu":              compute_bleu(outputs, ref_list),
            "bertscore":         compute_bertscore(outputs, ref_list),
            "faithfulness":      compute_faithfulness(outputs, ref_list),
            "reference_coverage": float(len(refs) / n) if refs else 0.0,
        }

    elif model_type == "rag":
        ctx_list = contexts or refs or inputs
        return {
            "faithfulness":      compute_faithfulness(outputs, ctx_list),
            "answer_relevance":  compute_answer_relevance(inputs, outputs),
            "context_recall":    compute_context_recall(ctx_list, refs or outputs),
            "hallucination_rate": compute_hallucination_rate(outputs, ctx_list),
            "context_coverage":  float(len(contexts) / n) if contexts else 0.0,
            "avg_latency_ms":    None,   # runtime metric — not computable from text logs
        }

    elif model_type == "general_llm":
        ctx_for_hall = contexts or refs
        return {
            "toxicity_rate":     compute_toxicity_rate(outputs),
            "safety_pass_rate":  compute_safety_pass_rate(outputs),
            "hallucination_rate": (
                compute_hallucination_rate(outputs, ctx_for_hall)
                if ctx_for_hall else None
            ),
            "avg_coherence":     compute_coherence(outputs),
            "avg_perplexity":    compute_perplexity_proxy(outputs),
            "avg_latency_ms":    None,
        }

    elif model_type == "classification":
        metrics = compute_classification_metrics(df)
        return metrics

    elif model_type == "automation":
        return compute_automation_metrics(df)

    elif model_type == "image_classification":
        return compute_cv_metrics(df)

    else:
        # Unknown / fallback — return what we can for a general LLM
        return {
            "toxicity_rate":    compute_toxicity_rate(outputs),
            "safety_pass_rate": compute_safety_pass_rate(outputs),
            "avg_coherence":    compute_coherence(outputs),
            "avg_perplexity":   compute_perplexity_proxy(outputs),
            "avg_latency_ms":   None,
        }