# """
# services/sdcc/metrics_calculator.py
# =====================================
# Actual metric computation engine.

# Accepts only `input` and `output` columns from the user (plus optional
# `reference` / `context` / `label` columns depending on model type).
# All metric values are computed here using real NLP/ML libraries — nothing
# is read from pre-logged columns.

# Library dependency strategy
# -----------------------------
# Every library import is guarded with a try/except so the server never crashes
# due to a missing optional dependency.  When a library is unavailable the
# affected metric returns None and the risk_level becomes "Unavailable".

# Required (always installed):
#   numpy, pandas, re, statistics, collections

# Optional (install for best results):
#   rouge_score       → pip install rouge-score
#   sacrebleu         → pip install sacrebleu
#   bert_score        → pip install bert-score
#   sklearn           → pip install scikit-learn
#   detoxify          → pip install detoxify
#   sentence_transformers → pip install sentence-transformers
#   nltk              → pip install nltk
# """

# from __future__ import annotations
# import re, math, statistics
# from collections import Counter
# from typing import Optional
# import pandas as pd
# import numpy as np

# # ── Optional library guards ────────────────────────────────────────────────────

# try:
#     from rouge_score import rouge_scorer
#     _HAS_ROUGE = True
# except ImportError:
#     _HAS_ROUGE = False

# try:
#     import sacrebleu as _sacrebleu
#     _HAS_BLEU = True
# except ImportError:
#     _HAS_BLEU = False

# try:
#     from bert_score import score as _bert_score
#     _HAS_BERTSCORE = True
# except ImportError:
#     _HAS_BERTSCORE = False

# try:
#     from sklearn.metrics import (
#         roc_auc_score, f1_score, precision_score, recall_score
#     )
#     _HAS_SKLEARN = True
# except ImportError:
#     _HAS_SKLEARN = False

# try:
#     from detoxify import Detoxify
#     _detox_model = Detoxify("original")
#     _HAS_DETOXIFY = True
# except Exception:
#     _HAS_DETOXIFY = False

# try:
#     from sentence_transformers import SentenceTransformer, util as st_util
#     _st_model = SentenceTransformer("all-MiniLM-L6-v2")
#     _HAS_ST = True
# except Exception:
#     _HAS_ST = False


# # ─────────────────────────────────────────────────────────────────────────────
# # Internal helpers
# # ─────────────────────────────────────────────────────────────────────────────

# def _col(df: pd.DataFrame, *candidates: str) -> Optional[str]:
#     """Return first column matching any candidate (case-insensitive substring)."""
#     lower = {c.lower(): c for c in df.columns}
#     for cand in candidates:
#         for col_low, col_orig in lower.items():
#             if cand in col_low:
#                 return col_orig
#     return None


# def _texts(df: pd.DataFrame, *candidates: str) -> list[str]:
#     """Return non-null string values from first matching column."""
#     col = _col(df, *candidates)
#     if col is None:
#         return []
#     return [str(v) for v in df[col].dropna().tolist() if str(v).strip()]


# def _safe_mean(values: list[float]) -> Optional[float]:
#     return float(np.mean(values)) if values else None


# # ─────────────────────────────────────────────────────────────────────────────
# # ROUGE  (summarization, RAG)
# # ─────────────────────────────────────────────────────────────────────────────

# def compute_rouge(
#     hypotheses: list[str],
#     references: list[str],
# ) -> dict[str, Optional[float]]:
#     """
#     Compute ROUGE-1, ROUGE-2, ROUGE-L F1 scores.
#     Returns dict with keys: rouge_1, rouge_2, rouge_l
#     Falls back to a simple n-gram overlap implementation when rouge_score
#     is not installed.
#     """
#     if not hypotheses or not references:
#         return {"rouge_1": None, "rouge_2": None, "rouge_l": None}

#     pairs = list(zip(hypotheses, references))

#     if _HAS_ROUGE:
#         scorer = rouge_scorer.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=True)
#         r1, r2, rl = [], [], []
#         for hyp, ref in pairs:
#             s = scorer.score(ref, hyp)
#             r1.append(s["rouge1"].fmeasure)
#             r2.append(s["rouge2"].fmeasure)
#             rl.append(s["rougeL"].fmeasure)
#         return {
#             "rouge_1": _safe_mean(r1),
#             "rouge_2": _safe_mean(r2),
#             "rouge_l": _safe_mean(rl),
#         }

#     # ── Fallback: token-overlap ROUGE ─────────────────────────────────────────
#     def _ngrams(tokens: list[str], n: int) -> Counter:
#         return Counter(tuple(tokens[i:i+n]) for i in range(len(tokens)-n+1))

#     def _lcs_len(a: list, b: list) -> int:
#         m, n = len(a), len(b)
#         dp = [[0]*(n+1) for _ in range(m+1)]
#         for i in range(1, m+1):
#             for j in range(1, n+1):
#                 dp[i][j] = dp[i-1][j-1]+1 if a[i-1]==b[j-1] else max(dp[i-1][j], dp[i][j-1])
#         return dp[m][n]

#     def _f1(p: float, r: float) -> float:
#         return 2*p*r/(p+r) if (p+r) > 0 else 0.0

#     r1, r2, rl = [], [], []
#     for hyp, ref in pairs:
#         ht = hyp.lower().split()
#         rt = ref.lower().split()
#         for n, store in [(1, r1), (2, r2)]:
#             hc, rc = _ngrams(ht, n), _ngrams(rt, n)
#             overlap = sum(min(hc[g], rc[g]) for g in hc)
#             p = overlap/max(sum(hc.values()), 1)
#             r = overlap/max(sum(rc.values()), 1)
#             store.append(_f1(p, r))
#         lcs = _lcs_len(ht, rt)
#         p = lcs/max(len(ht), 1)
#         r = lcs/max(len(rt), 1)
#         rl.append(_f1(p, r))

#     return {
#         "rouge_1": _safe_mean(r1),
#         "rouge_2": _safe_mean(r2),
#         "rouge_l": _safe_mean(rl),
#     }


# # ─────────────────────────────────────────────────────────────────────────────
# # BLEU  (summarization)
# # ─────────────────────────────────────────────────────────────────────────────

# def compute_bleu(
#     hypotheses: list[str],
#     references: list[str],
# ) -> Optional[float]:
#     """
#     Corpus-level BLEU score.
#     Uses sacrebleu when available; falls back to a simple smoothed BLEU.
#     Returns score in [0, 1] range.
#     """
#     if not hypotheses or not references:
#         return None

#     if _HAS_BLEU:
#         try:
#             result = _sacrebleu.corpus_bleu(hypotheses, [references])
#             return result.score / 100.0   # sacrebleu returns 0-100
#         except Exception:
#             pass

#     # ── Fallback: smoothed BLEU-4 ─────────────────────────────────────────────
#     def _ngrams(tokens: list[str], n: int) -> Counter:
#         return Counter(tuple(tokens[i:i+n]) for i in range(len(tokens)-n+1))

#     scores = []
#     for hyp, ref in zip(hypotheses, references):
#         ht = hyp.lower().split()
#         rt = ref.lower().split()
#         if not ht:
#             scores.append(0.0)
#             continue
#         brevity = min(1.0, math.exp(1 - len(rt)/max(len(ht), 1)))
#         ps = []
#         for n in range(1, 5):
#             hc, rc = _ngrams(ht, n), _ngrams(rt, n)
#             overlap = sum(min(hc[g], rc[g]) for g in hc)
#             total   = max(sum(hc.values()), 1)
#             # +1 smoothing
#             ps.append(math.log((overlap + 1) / (total + 1)))
#         scores.append(brevity * math.exp(sum(ps) / 4))

#     return _safe_mean(scores)


# # ─────────────────────────────────────────────────────────────────────────────
# # BERTScore  (summarization, RAG)
# # ─────────────────────────────────────────────────────────────────────────────

# def compute_bertscore(
#     hypotheses: list[str],
#     references: list[str],
# ) -> Optional[float]:
#     """
#     Mean BERTScore F1.
#     Uses bert_score library when available; falls back to cosine similarity
#     via sentence_transformers; final fallback is None.
#     """
#     if not hypotheses or not references:
#         return None

#     if _HAS_BERTSCORE:
#         try:
#             _, _, F = _bert_score(hypotheses, references, lang="en", verbose=False)
#             return float(F.mean().item())
#         except Exception:
#             pass

#     if _HAS_ST:
#         try:
#             h_emb = _st_model.encode(hypotheses, convert_to_tensor=True)
#             r_emb = _st_model.encode(references, convert_to_tensor=True)
#             sims  = st_util.cos_sim(h_emb, r_emb).diagonal().tolist()
#             return _safe_mean([float(s) for s in sims])
#         except Exception:
#             pass

#     return None


# # ─────────────────────────────────────────────────────────────────────────────
# # Faithfulness / Semantic Similarity  (RAG, summarization)
# # ─────────────────────────────────────────────────────────────────────────────

# def compute_faithfulness(
#     outputs: list[str],
#     contexts: list[str],
# ) -> Optional[float]:
#     """
#     Proxy faithfulness score: cosine similarity between generated answer
#     and retrieved context (or reference document).

#     Uses sentence_transformers when available, falls back to simple Jaccard
#     token overlap.
#     """
#     if not outputs or not contexts:
#         return None

#     pairs = list(zip(outputs, contexts))

#     if _HAS_ST:
#         try:
#             o_emb = _st_model.encode(outputs, convert_to_tensor=True)
#             c_emb = _st_model.encode(contexts, convert_to_tensor=True)
#             sims  = st_util.cos_sim(o_emb, c_emb).diagonal().tolist()
#             return _safe_mean([float(s) for s in sims])
#         except Exception:
#             pass

#     # Jaccard fallback
#     def _jaccard(a: str, b: str) -> float:
#         sa = set(a.lower().split())
#         sb = set(b.lower().split())
#         inter = len(sa & sb)
#         union = len(sa | sb)
#         return inter / union if union else 0.0

#     return _safe_mean([_jaccard(o, c) for o, c in pairs])


# # ─────────────────────────────────────────────────────────────────────────────
# # Answer Relevance  (RAG)
# # ─────────────────────────────────────────────────────────────────────────────

# def compute_answer_relevance(
#     queries: list[str],
#     answers: list[str],
# ) -> Optional[float]:
#     """
#     Cosine similarity between query and answer as a proxy for answer relevance.
#     Uses sentence_transformers; falls back to Jaccard token overlap.
#     """
#     if not queries or not answers:
#         return None

#     pairs = list(zip(queries, answers))

#     if _HAS_ST:
#         try:
#             q_emb = _st_model.encode(queries, convert_to_tensor=True)
#             a_emb = _st_model.encode(answers, convert_to_tensor=True)
#             sims  = st_util.cos_sim(q_emb, a_emb).diagonal().tolist()
#             return _safe_mean([float(s) for s in sims])
#         except Exception:
#             pass

#     def _jaccard(a: str, b: str) -> float:
#         sa = set(a.lower().split())
#         sb = set(b.lower().split())
#         inter = len(sa & sb)
#         union = len(sa | sb)
#         return inter / union if union else 0.0

#     return _safe_mean([_jaccard(q, a) for q, a in pairs])


# # ─────────────────────────────────────────────────────────────────────────────
# # Context Recall  (RAG)
# # ─────────────────────────────────────────────────────────────────────────────

# def compute_context_recall(
#     contexts: list[str],
#     references: list[str],
# ) -> Optional[float]:
#     """
#     What proportion of reference answer tokens appear in the context?
#     Proxy: unigram recall(reference_tokens ∩ context_tokens).
#     """
#     if not contexts or not references:
#         return None

#     recalls = []
#     for ctx, ref in zip(contexts, references):
#         rt = set(ref.lower().split())
#         ct = set(ctx.lower().split())
#         if not rt:
#             continue
#         recalls.append(len(rt & ct) / len(rt))

#     return _safe_mean(recalls) if recalls else None


# # ─────────────────────────────────────────────────────────────────────────────
# # Hallucination Rate  (general LLM, RAG)
# # ─────────────────────────────────────────────────────────────────────────────

# def compute_hallucination_rate(
#     outputs: list[str],
#     contexts: list[str],
# ) -> Optional[float]:
#     """
#     Hallucination rate = 1 - faithfulness (inverse of semantic grounding).
#     A high semantic distance between output and context implies hallucination.
#     """
#     faith = compute_faithfulness(outputs, contexts)
#     if faith is None:
#         return None
#     return round(1.0 - faith, 4)


# # ─────────────────────────────────────────────────────────────────────────────
# # Toxicity  (general LLM)
# # ─────────────────────────────────────────────────────────────────────────────

# def compute_toxicity_rate(outputs: list[str]) -> Optional[float]:
#     """
#     Mean toxicity score across all outputs.
#     Uses detoxify when available; falls back to keyword heuristic.
#     """
#     if not outputs:
#         return None

#     if _HAS_DETOXIFY:
#         try:
#             results = _detox_model.predict(outputs)
#             scores  = results.get("toxicity", [])
#             return _safe_mean(list(scores))
#         except Exception:
#             pass

#     # Keyword heuristic fallback (very rough — clearly not production-grade)
#     _TOXIC_WORDS = {
#         "hate", "kill", "die", "idiot", "stupid", "moron", "racist",
#         "sexist", "abuse", "violent", "threaten", "assault", "harass",
#     }
#     rates = []
#     for text in outputs:
#         tokens = set(re.findall(r"\b\w+\b", text.lower()))
#         rates.append(1.0 if tokens & _TOXIC_WORDS else 0.0)
#     return _safe_mean(rates)


# # ─────────────────────────────────────────────────────────────────────────────
# # Safety Pass Rate  (general LLM)
# # ─────────────────────────────────────────────────────────────────────────────

# def compute_safety_pass_rate(outputs: list[str]) -> Optional[float]:
#     """
#     Proportion of outputs that appear safe (1 - toxicity rate, rounded).
#     """
#     tox = compute_toxicity_rate(outputs)
#     if tox is None:
#         return None
#     return round(1.0 - tox, 4)


# # ─────────────────────────────────────────────────────────────────────────────
# # Coherence  (general LLM, summarization)
# # ─────────────────────────────────────────────────────────────────────────────

# def compute_coherence(outputs: list[str]) -> Optional[float]:
#     """
#     Proxy coherence score based on:
#       - Average sentence length (too short = incoherent fragments)
#       - Type-token ratio (vocabulary richness)
#       - Presence of common discourse markers
#     Returns a normalised score in [0, 1].
#     """
#     if not outputs:
#         return None

#     DISCOURSE_MARKERS = {
#         "however", "therefore", "furthermore", "moreover", "consequently",
#         "although", "because", "since", "thus", "hence", "additionally",
#         "in conclusion", "in summary", "as a result", "for example",
#         "in contrast", "on the other hand", "first", "second", "finally",
#     }

#     scores = []
#     for text in outputs:
#         sentences = re.split(r"[.!?]+", text.strip())
#         sentences = [s.strip() for s in sentences if s.strip()]
#         if not sentences:
#             scores.append(0.0)
#             continue

#         tokens    = text.lower().split()
#         avg_len   = np.mean([len(s.split()) for s in sentences])
#         ttr       = len(set(tokens)) / max(len(tokens), 1)
#         text_low  = text.lower()
#         dm_count  = sum(1 for m in DISCOURSE_MARKERS if m in text_low)
#         dm_score  = min(dm_count / 3, 1.0)   # saturates at 3 markers

#         # Normalise avg_len: optimal ~15 words/sentence
#         len_score = min(avg_len / 15, 1.0) if avg_len <= 15 else max(0, 1 - (avg_len-15)/30)

#         score = 0.4 * len_score + 0.3 * ttr + 0.3 * dm_score
#         scores.append(min(score, 1.0))

#     return _safe_mean(scores)


# # ─────────────────────────────────────────────────────────────────────────────
# # Perplexity proxy  (general LLM)
# # ─────────────────────────────────────────────────────────────────────────────

# def compute_perplexity_proxy(outputs: list[str]) -> Optional[float]:
#     """
#     Vocabulary-based perplexity proxy.
#     True perplexity requires the model's logits. This computes an approximation
#     based on the entropy of the unigram distribution in each output.
#     Lower = more predictable/fluent text (like real LLM perplexity).
#     """
#     if not outputs:
#         return None

#     scores = []
#     for text in outputs:
#         tokens = text.lower().split()
#         if not tokens:
#             continue
#         counts = Counter(tokens)
#         total  = sum(counts.values())
#         probs  = [v/total for v in counts.values()]
#         entropy = -sum(p * math.log(p + 1e-9) for p in probs)
#         # Scale to a reasonable perplexity-like range
#         scores.append(math.exp(entropy))

#     return _safe_mean(scores)


# # ─────────────────────────────────────────────────────────────────────────────
# # Compression Ratio  (summarization)
# # ─────────────────────────────────────────────────────────────────────────────

# def compute_compression_ratio(
#     inputs: list[str],
#     outputs: list[str],
# ) -> Optional[float]:
#     """Ratio of output token length to input token length (lower = more compressed)."""
#     if not inputs or not outputs:
#         return None
#     ratios = []
#     for inp, out in zip(inputs, outputs):
#         in_len  = max(len(inp.split()), 1)
#         out_len = len(out.split())
#         ratios.append(out_len / in_len)
#     return _safe_mean(ratios)


# # ─────────────────────────────────────────────────────────────────────────────
# # Classification metrics  (classification)
# # ─────────────────────────────────────────────────────────────────────────────

# def compute_classification_metrics(
#     df: pd.DataFrame,
# ) -> dict[str, Optional[float]]:
#     """
#     Compute F1, Precision, Recall, ROC-AUC, class balance, and avg confidence
#     from a DataFrame with at least `output` (predicted class) and
#     optionally `label`/`ground_truth` (true class) and `confidence`/`probability`.

#     All metrics return None when required columns are absent.
#     """
#     output_col = _col(df, "output", "prediction", "predicted", "pred_label",
#                       "predicted_class", "result")
#     label_col  = _col(df, "label", "ground_truth", "true_label", "actual",
#                       "target", "class")
#     conf_col   = _col(df, "confidence", "probability", "prob", "score",
#                       "pred_prob")

#     result: dict[str, Optional[float]] = {
#         "roc_auc":        None,
#         "f1_score":       None,
#         "precision":      None,
#         "recall":         None,
#         "class_balance":  None,
#         "avg_confidence": None,
#     }

#     # Confidence
#     if conf_col is not None:
#         vals = pd.to_numeric(df[conf_col], errors="coerce").dropna()
#         if len(vals) > 0:
#             result["avg_confidence"] = float(vals.mean())

#     # Class balance from outputs
#     ref_col = label_col or output_col
#     if ref_col is not None:
#         vc = df[ref_col].value_counts()
#         if len(vc) >= 2:
#             result["class_balance"] = float(vc.min() / vc.max())

#     # Sklearn metrics — need both output + label
#     if output_col is None or label_col is None:
#         return result

#     y_pred = df[output_col].dropna().astype(str).tolist()
#     y_true = df[label_col].dropna().astype(str).tolist()
#     n = min(len(y_pred), len(y_true))
#     if n < 2:
#         return result

#     y_pred = y_pred[:n]
#     y_true = y_true[:n]

#     classes = sorted(set(y_true) | set(y_pred))
#     # Always use 'macro' for string labels.
#     # 'binary' requires numeric pos_label (defaults to 1), which crashes on
#     # string class labels like 'spam'/'ham' and silently returns 0.
#     avg = "macro"

#     if _HAS_SKLEARN:
#         try:
#             result["f1_score"]  = float(f1_score(y_true, y_pred, average=avg, zero_division=0))
#             result["precision"] = float(precision_score(y_true, y_pred, average=avg, zero_division=0))
#             result["recall"]    = float(recall_score(y_true, y_pred, average=avg, zero_division=0))
#         except Exception as _ske:
#             # Log the error into result so it surfaces in computation_notes
#             result["_sklearn_error"] = str(_ske)

#         # ROC-AUC — binary only (needs probability column)
#         if conf_col is not None and len(classes) == 2:
#             try:
#                 probs  = pd.to_numeric(df[conf_col], errors="coerce").fillna(0.5).tolist()[:n]
#                 result["roc_auc"] = float(roc_auc_score(y_true, probs))
#             except Exception:
#                 pass

#     else:
#         # Manual F1 fallback
#         from collections import defaultdict
#         tp_sum = fp_sum = fn_sum = 0
#         for cls in classes:
#             tp = sum(1 for p, t in zip(y_pred, y_true) if p == cls and t == cls)
#             fp = sum(1 for p, t in zip(y_pred, y_true) if p == cls and t != cls)
#             fn = sum(1 for p, t in zip(y_pred, y_true) if p != cls and t == cls)
#             tp_sum += tp; fp_sum += fp; fn_sum += fn

#         prec = tp_sum / max(tp_sum + fp_sum, 1)
#         rec  = tp_sum / max(tp_sum + fn_sum, 1)
#         f1   = 2*prec*rec / max(prec+rec, 1e-9)
#         result["f1_score"]  = f1
#         result["precision"] = prec
#         result["recall"]    = rec

#     return result


# # ─────────────────────────────────────────────────────────────────────────────
# # Step/Task metrics  (automation)
# # ─────────────────────────────────────────────────────────────────────────────

# def compute_automation_metrics(df: pd.DataFrame) -> dict[str, Optional[float]]:
#     """
#     Derive automation metrics from input/output columns.

#     The `output` column should contain the step result text.
#     We infer success/failure from keyword presence when no explicit boolean
#     column is present.
#     """
#     output_col  = _col(df, "output", "result", "step_result", "response")
#     input_col   = _col(df, "input", "prompt", "step_name", "task", "instruction")
#     latency_col = _col(df, "latency", "duration", "elapsed", "time_ms")

#     SUCCESS_KWORDS = {"success", "complete", "done", "finished", "ok", "passed", "true", "1"}
#     ERROR_KWORDS   = {"error", "failed", "exception", "timeout", "false", "0", "retry", "crash"}

#     result: dict[str, Optional[float]] = {
#         "step_success_rate":    None,
#         "task_completion_rate": None,
#         "error_rate":           None,
#         "avg_retry_rate":       None,
#         "avg_step_latency_ms":  None,
#     }

#     if output_col is not None:
#         outputs = [str(v).lower().strip() for v in df[output_col].dropna()]
#         if outputs:
#             success = [any(k in o for k in SUCCESS_KWORDS) for o in outputs]
#             errors  = [any(k in o for k in ERROR_KWORDS) for o in outputs]
#             # If the output is non-empty and doesn't contain error words → treat as success
#             inferred = []
#             for o, s, e in zip(outputs, success, errors):
#                 if s and not e:
#                     inferred.append(1.0)
#                 elif e:
#                     inferred.append(0.0)
#                 elif o:
#                     inferred.append(0.8)   # neutral output, assume mostly ok
#                 else:
#                     inferred.append(0.0)
#             result["step_success_rate"]    = _safe_mean(inferred)
#             result["task_completion_rate"] = result["step_success_rate"]
#             result["error_rate"]           = _safe_mean([1-v for v in inferred])

#     if latency_col is not None:
#         lats = pd.to_numeric(df[latency_col], errors="coerce").dropna().tolist()
#         if lats:
#             result["avg_step_latency_ms"] = float(np.mean(lats))

#     return result


# # ─────────────────────────────────────────────────────────────────────────────
# # Image / CV metrics  (image_classification)
# # ─────────────────────────────────────────────────────────────────────────────

# def compute_cv_metrics(df: pd.DataFrame) -> dict[str, Optional[float]]:
#     """
#     CV metrics inferred from output columns.
#     Since we only receive text/CSV logs (no actual images), we extract
#     numeric columns that correspond to detection scores, confidence, latency,
#     and label coverage.
#     """
#     conf_col    = _col(df, "confidence", "score", "detection_score",
#                        "probability", "confidence_score")
#     label_col   = _col(df, "label", "ground_truth", "true_class",
#                        "class_name", "annotation", "category")
#     latency_col = _col(df, "latency", "inference_time", "duration_ms",
#                        "inference_ms", "elapsed")
#     iou_col     = _col(df, "iou", "intersection_over_union", "iou_score")
#     map_col     = _col(df, "map", "mean_average_precision", "ap", "map_score")

#     result: dict[str, Optional[float]] = {
#         "map_score":        None,
#         "avg_iou":          None,
#         "top_k_accuracy":   None,
#         "avg_confidence":   None,
#         "label_coverage":   None,
#         "avg_inference_ms": None,
#     }

#     if conf_col:
#         vals = pd.to_numeric(df[conf_col], errors="coerce").dropna().tolist()
#         if vals:
#             result["avg_confidence"] = _safe_mean(vals)
#             # Top-k accuracy proxy: proportion of outputs above 0.5 confidence
#             result["top_k_accuracy"] = _safe_mean([1.0 if v >= 0.5 else 0.0 for v in vals])

#     if label_col:
#         result["label_coverage"] = float(df[label_col].notna().mean())

#     if iou_col:
#         vals = pd.to_numeric(df[iou_col], errors="coerce").dropna().tolist()
#         if vals:
#             result["avg_iou"] = _safe_mean(vals)

#     if map_col:
#         vals = pd.to_numeric(df[map_col], errors="coerce").dropna().tolist()
#         if vals:
#             result["map_score"] = _safe_mean(vals)

#     if latency_col:
#         vals = pd.to_numeric(df[latency_col], errors="coerce").dropna().tolist()
#         if vals:
#             result["avg_inference_ms"] = _safe_mean(vals)

#     # If no map/iou columns, infer from confidence as a rough proxy
#     if result["map_score"] is None and result["avg_confidence"] is not None:
#         result["map_score"] = result["avg_confidence"] * 0.85  # conservative proxy
#     if result["avg_iou"] is None and result["avg_confidence"] is not None:
#         result["avg_iou"]   = result["avg_confidence"] * 0.90  # conservative proxy

#     return result


# # ─────────────────────────────────────────────────────────────────────────────
# # Summarization reference-free metrics
# # ─────────────────────────────────────────────────────────────────────────────

# def compute_coverage_score(
#     summaries: list[str],
#     sources: list[str],
# ) -> Optional[float]:
#     """
#     Coverage: what proportion of the source document's key sentences are
#     reflected in the summary (by key-word overlap).

#     Algorithm:
#       1. Extract "key sentences" from source = sentences above mean TF-IDF weight
#       2. For each key sentence, check if its main content words appear in the summary
#       3. Coverage = mean fraction of key sentences covered

#     Uses a simple TF-IDF proxy (term frequency weighted by inverse doc frequency
#     across the batch) — no external libraries needed.
#     """
#     if not summaries or not sources:
#         return None

#     def _tokenize(text: str) -> list[str]:
#         return re.findall(r"\b[a-z]+\b", text.lower())

#     def _sentences(text: str) -> list[str]:
#         return [s.strip() for s in re.split(r"[.!?]+", text) if len(s.strip()) > 20]

#     # Build IDF from source corpus
#     all_docs = [_tokenize(s) for s in sources]
#     doc_count = max(len(all_docs), 1)
#     df_counts: Counter = Counter()
#     for doc in all_docs:
#         for term in set(doc):
#             df_counts[term] += 1
#     idf = {t: math.log(doc_count / (1 + df_counts[t])) for t in df_counts}

#     scores = []
#     for summary, source in zip(summaries, sources):
#         src_tokens = _tokenize(source)
#         src_sents  = _sentences(source)
#         if not src_sents:
#             scores.append(1.0)
#             continue

#         # TF for this document
#         tf = Counter(src_tokens)
#         total = max(sum(tf.values()), 1)

#         # Score each source sentence by mean TF-IDF of its tokens
#         sent_scores = []
#         for sent in src_sents:
#             s_toks = _tokenize(sent)
#             if not s_toks:
#                 continue
#             tfidf = sum((tf[t] / total) * idf.get(t, 0) for t in s_toks) / len(s_toks)
#             sent_scores.append((sent, tfidf))

#         if not sent_scores:
#             scores.append(0.5)
#             continue

#         # Key sentences = top 30% by TF-IDF score
#         sent_scores.sort(key=lambda x: x[1], reverse=True)
#         top_k = max(1, len(sent_scores) // 3)
#         key_sents = [s for s, _ in sent_scores[:top_k]]

#         # Check how many key sentences have their content words in the summary
#         summary_words = set(_tokenize(summary))
#         covered = 0
#         for ks in key_sents:
#             ks_words = set(_tokenize(ks)) - {"the","a","an","is","are","was","were","of","to","in","for","on","with","as","by","at","from","this","that","it","be","has","have","had","its","their","they","we","he","she","his","her"}
#             if not ks_words:
#                 covered += 1
#                 continue
#             overlap = len(ks_words & summary_words) / len(ks_words)
#             if overlap >= 0.40:  # 40% of key content words appear in summary
#                 covered += 1

#         scores.append(covered / len(key_sents))

#     return _safe_mean(scores)


# def compute_density_score(
#     summaries: list[str],
#     sources: list[str],
# ) -> Optional[float]:
#     """
#     Density: proportion of summary words that appear in verbatim spans from the source.
#     High density = extractive summary (copy-pastes source sentences)
#     Low density  = abstractive summary (paraphrases and synthesises)

#     For a high-quality abstractive summarizer, density should be MODERATE (0.4-0.7):
#     - Too high (>0.8): model is just copy-pasting, not summarising
#     - Too low (<0.2):  model may be hallucinating or too disconnected from source

#     Score returned: 1.0 = ideal abstractive range, 0.0 = extreme copy or extreme divergence.
#     """
#     if not summaries or not sources:
#         return None

#     scores = []
#     for summary, source in zip(summaries, sources):
#         s_words = summary.lower().split()
#         src_text = source.lower()

#         if not s_words:
#             scores.append(0.0)
#             continue

#         # Count how many summary words appear in verbatim source spans (window of 4)
#         src_words = src_text.split()
#         src_bigrams = set(" ".join(src_words[i:i+3]) for i in range(len(src_words)-2))
#         matched = 0
#         for i in range(len(s_words) - 2):
#             trigram = " ".join(s_words[i:i+3])
#             if trigram in src_bigrams:
#                 matched += 3
#         density = matched / max(len(s_words), 1)

#         # Ideal abstractive density: 0.3 - 0.65
#         # Score: peaks at 0.5, falls off toward 0 and 1
#         if 0.30 <= density <= 0.65:
#             score = 1.0 - abs(density - 0.475) / 0.175
#         elif density < 0.30:
#             # Very abstractive — slight penalty but not severe (could be good abstraction)
#             score = 0.5 + density / 0.30 * 0.5
#         else:
#             # Very extractive — significant penalty
#             score = max(0.0, 1.0 - (density - 0.65) / 0.35)

#         scores.append(min(1.0, max(0.0, score)))

#     return _safe_mean(scores)


# def compute_summary_redundancy(summaries: list[str]) -> Optional[float]:
#     """
#     Intra-summary redundancy: proportion of repeated bigrams within each summary.
#     Lower is better (0.0 = no repetition, 1.0 = highly repetitive).
#     Score returned as 1.0 - redundancy so higher = better for scoring.
#     """
#     if not summaries:
#         return None

#     scores = []
#     for summary in summaries:
#         words = summary.lower().split()
#         if len(words) < 4:
#             scores.append(1.0)
#             continue
#         bigrams = [tuple(words[i:i+2]) for i in range(len(words)-1)]
#         counts = Counter(bigrams)
#         repeated = sum(v - 1 for v in counts.values() if v > 1)
#         redundancy = min(repeated / max(len(bigrams), 1), 1.0)
#         scores.append(1.0 - redundancy)  # invert: higher = better

#     return _safe_mean(scores)


# # ─────────────────────────────────────────────────────────────────────────────
# # PUBLIC API — one dispatcher per model type
# # ─────────────────────────────────────────────────────────────────────────────

# def calculate_metrics(model_type: str, df: pd.DataFrame) -> dict[str, Optional[float]]:
#     """
#     Main dispatcher. Returns a flat dict of {metric_name: float|None} for the
#     given model_type and DataFrame.

#     The DataFrame must contain at minimum:
#       - `input`  (or prompt / query / instruction / step_name)
#       - `output` (or response / answer / completion / result / summary)

#     Optional columns for richer computation:
#       - `reference` / `reference_summary`  — for supervised text-quality metrics
#       - `context` / `retrieved_chunks`     — for RAG faithfulness
#       - `label` / `ground_truth`           — for classification accuracy metrics
#       - `confidence` / `probability`       — for confidence-based metrics
#       - `latency` / `duration_ms`          — for latency metrics
#     """
#     inputs   = _texts(df, "input",  "prompt",   "query",        "instruction", "step_name")
#     outputs  = _texts(df, "output", "response", "answer",       "completion",  "result", "summary")
#     refs     = _texts(df, "reference", "reference_summary", "ground_truth",
#                           "target", "ref_summary")
#     contexts = _texts(df, "context", "retrieved_chunks", "chunks",
#                           "passages", "source_doc")

#     # Align lengths — use the shortest common set
#     n = min(
#         len(inputs)  if inputs  else 999_999,
#         len(outputs) if outputs else 999_999,
#     )
#     if n == 999_999 or n == 0:
#         # Cannot compute any text-pair metrics
#         return {}

#     inputs  = inputs[:n]
#     outputs = outputs[:n]
#     refs    = refs[:n]     if len(refs)     >= n else []
#     contexts= contexts[:n] if len(contexts) >= n else []

#     # ── Dispatch ───────────────────────────────────────────────────────────────

#     if model_type == "summarization":
#         # ── Reference-supervised metrics (only when reference summaries exist) ──
#         # IMPORTANT: We do NOT fall back to inputs as references.
#         # Comparing a summary to the source document via ROUGE measures verbatim
#         # copy rate, not quality. An abstractive summary SHOULD use different words.
#         has_refs = bool(refs and len(refs) >= n)
#         ref_list = refs[:n] if has_refs else None

#         # ── Reference-free metrics (always computable from source + summary) ──
#         # Faithfulness: semantic similarity of summary to source document
#         # This is the right signal when references are absent.
#         source_list = inputs  # the source documents

#         rouge_scores = compute_rouge(outputs, ref_list) if has_refs else {"rouge_1": None, "rouge_2": None, "rouge_l": None}

#         return {
#             # Supervised (require reference summaries)
#             "rouge_1":            rouge_scores["rouge_1"],
#             "rouge_2":            rouge_scores["rouge_2"],
#             "rouge_l":            rouge_scores["rouge_l"],
#             "bleu":               compute_bleu(outputs, ref_list) if has_refs else None,
#             "bertscore":          compute_bertscore(outputs, ref_list) if has_refs else None,
#             # Reference-free (always computed)
#             "faithfulness":       compute_faithfulness(outputs, source_list),  # summary vs SOURCE
#             "coverage_score":     compute_coverage_score(outputs, source_list),
#             "density_score":      compute_density_score(outputs, source_list),
#             "compression_ratio":  compute_compression_ratio(source_list, outputs),
#             "summary_redundancy": compute_summary_redundancy(outputs),
#             "reference_coverage": float(len(refs) / n) if has_refs else 0.0,
#         }

#     elif model_type == "rag":
#         ctx_list = contexts or refs or inputs
#         return {
#             "faithfulness":      compute_faithfulness(outputs, ctx_list),
#             "answer_relevance":  compute_answer_relevance(inputs, outputs),
#             "context_recall":    compute_context_recall(ctx_list, refs or outputs),
#             "hallucination_rate": compute_hallucination_rate(outputs, ctx_list),
#             "context_coverage":  float(len(contexts) / n) if contexts else 0.0,
#             "avg_latency_ms":    None,   # runtime metric — not computable from text logs
#         }

#     elif model_type == "general_llm":
#         ctx_for_hall = contexts or refs
#         return {
#             "toxicity_rate":     compute_toxicity_rate(outputs),
#             "safety_pass_rate":  compute_safety_pass_rate(outputs),
#             "hallucination_rate": (
#                 compute_hallucination_rate(outputs, ctx_for_hall)
#                 if ctx_for_hall else None
#             ),
#             "avg_coherence":     compute_coherence(outputs),
#             "avg_perplexity":    compute_perplexity_proxy(outputs),
#             "avg_latency_ms":    None,
#         }

#     elif model_type == "classification":
#         metrics = compute_classification_metrics(df)
#         return metrics

#     elif model_type == "automation":
#         return compute_automation_metrics(df)

#     elif model_type == "image_classification":
#         return compute_cv_metrics(df)

#     else:
#         # Unknown / fallback — return what we can for a general LLM
#         return {
#             "toxicity_rate":    compute_toxicity_rate(outputs),
#             "safety_pass_rate": compute_safety_pass_rate(outputs),
#             "avg_coherence":    compute_coherence(outputs),
#             "avg_perplexity":   compute_perplexity_proxy(outputs),
#             "avg_latency_ms":   None,
#         }




"""
services/sdcc/metrics_calculator.py
=====================================
Comprehensive metric computation engine.

Key design principles
---------------------
1. Every metric has at least TWO fallback implementations so it ALWAYS computes.
2. KB chunks are used as references/context automatically when available.
3. LLM-judge labels (injected as _judge_label) power classification-style metrics
   for ALL model types when no explicit label column exists.
4. Latency is always read from the latency column when present.
5. All library imports are guarded — server never crashes on missing dependency.

Libraries used (all optional with fallbacks):
  rouge_score          → pip install rouge-score
  sacrebleu            → pip install sacrebleu
  sentence_transformers → pip install sentence-transformers
  sklearn              → pip install scikit-learn
  detoxify             → pip install detoxify
  textstat             → pip install textstat
  nltk                 → pip install nltk
"""

from __future__ import annotations
import re, math, statistics
from collections import Counter
from typing import Optional
import pandas as pd
import numpy as np

# ── Optional library guards ────────────────────────────────────────────────────

try:
    from rouge_score import rouge_scorer as _rs
    _HAS_ROUGE = True
except ImportError:
    _HAS_ROUGE = False

try:
    import sacrebleu as _sacrebleu
    _HAS_BLEU = True
except ImportError:
    _HAS_BLEU = False

try:
    from sklearn.metrics import (
        roc_auc_score, f1_score as _f1,
        precision_score as _prec, recall_score as _rec,
        accuracy_score as _acc,
    )
    _HAS_SKLEARN = True
except ImportError:
    _HAS_SKLEARN = False

try:
    from sentence_transformers import SentenceTransformer, util as _st_util
    _st_model = SentenceTransformer("all-MiniLM-L6-v2")
    _HAS_ST = True
except Exception:
    _HAS_ST = False

try:
    from detoxify import Detoxify
    _detox_model = Detoxify("original")
    _HAS_DETOXIFY = True
except Exception:
    _HAS_DETOXIFY = False

try:
    import textstat as _textstat
    _HAS_TEXTSTAT = True
except ImportError:
    _HAS_TEXTSTAT = False

try:
    import nltk as _nltk
    _nltk.download("punkt", quiet=True)
    _nltk.download("stopwords", quiet=True)
    _HAS_NLTK = True
except Exception:
    _HAS_NLTK = False


# ─────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────────────────────

def _col(df: pd.DataFrame, *candidates: str) -> Optional[str]:
    """Return first column whose lowercased name contains any candidate substring."""
    lower = {c.lower(): c for c in df.columns}
    for cand in candidates:
        for col_low, col_orig in lower.items():
            if cand in col_low:
                return col_orig
    return None


def _texts(df: pd.DataFrame, *candidates: str) -> list[str]:
    col = _col(df, *candidates)
    if col is None:
        return []
    return [str(v) for v in df[col].dropna().tolist() if str(v).strip()]


def _safe_mean(values: list[float]) -> Optional[float]:
    cleaned = [v for v in values if v is not None and not math.isnan(v)]
    return float(np.mean(cleaned)) if cleaned else None


def _jaccard(a: str, b: str) -> float:
    sa = set(re.findall(r"\b\w+\b", a.lower()))
    sb = set(re.findall(r"\b\w+\b", b.lower()))
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)


def _embed_similarity(texts_a: list[str], texts_b: list[str]) -> Optional[list[float]]:
    """Cosine similarity between paired text lists using sentence-transformers."""
    if not texts_a or not texts_b or not _HAS_ST:
        return None
    try:
        a_emb = _st_model.encode(texts_a, convert_to_tensor=True, show_progress_bar=False)
        b_emb = _st_model.encode(texts_b, convert_to_tensor=True, show_progress_bar=False)
        sims  = _st_util.cos_sim(a_emb, b_emb).diagonal().tolist()
        return [float(s) for s in sims]
    except Exception:
        return None


# ─────────────────────────────────────────────────────────────────────────────
# ROUGE
# ─────────────────────────────────────────────────────────────────────────────

def compute_rouge(hypotheses: list[str], references: list[str]) -> dict[str, Optional[float]]:
    if not hypotheses or not references:
        return {"rouge_1": None, "rouge_2": None, "rouge_l": None}

    pairs = list(zip(hypotheses[:len(references)], references[:len(hypotheses)]))

    if _HAS_ROUGE:
        try:
            scorer = _rs.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=True)
            r1, r2, rl = [], [], []
            for hyp, ref in pairs:
                s = scorer.score(ref, hyp)
                r1.append(s["rouge1"].fmeasure)
                r2.append(s["rouge2"].fmeasure)
                rl.append(s["rougeL"].fmeasure)
            return {"rouge_1": _safe_mean(r1), "rouge_2": _safe_mean(r2), "rouge_l": _safe_mean(rl)}
        except Exception:
            pass

    # N-gram fallback
    def _ngrams(tokens, n):
        return Counter(tuple(tokens[i:i+n]) for i in range(max(0, len(tokens)-n+1)))

    def _f1_score(p, r):
        return 2*p*r/(p+r) if (p+r) > 0 else 0.0

    r1, r2, rl_scores = [], [], []
    for hyp, ref in pairs:
        ht = hyp.lower().split()
        rt = ref.lower().split()
        for n, store in [(1, r1), (2, r2)]:
            hc, rc = _ngrams(ht, n), _ngrams(rt, n)
            ov = sum(min(hc[g], rc[g]) for g in hc)
            p  = ov / max(sum(hc.values()), 1)
            r  = ov / max(sum(rc.values()), 1)
            store.append(_f1_score(p, r))
        # LCS for ROUGE-L
        m, n2 = len(ht), len(rt)
        dp = [[0]*(n2+1) for _ in range(m+1)]
        for i in range(1, m+1):
            for j in range(1, n2+1):
                dp[i][j] = dp[i-1][j-1]+1 if ht[i-1]==rt[j-1] else max(dp[i-1][j],dp[i][j-1])
        lcs = dp[m][n2]
        rl_scores.append(_f1_score(lcs/max(m,1), lcs/max(n2,1)))

    return {"rouge_1": _safe_mean(r1), "rouge_2": _safe_mean(r2), "rouge_l": _safe_mean(rl_scores)}


# ─────────────────────────────────────────────────────────────────────────────
# BLEU
# ─────────────────────────────────────────────────────────────────────────────

def compute_bleu(hypotheses: list[str], references: list[str]) -> Optional[float]:
    if not hypotheses or not references:
        return None
    pairs = list(zip(hypotheses, references))

    if _HAS_BLEU:
        try:
            result = _sacrebleu.corpus_bleu(hypotheses, [references])
            return result.score / 100.0
        except Exception:
            pass

    # Smoothed BLEU-4 fallback
    def _ngrams(tokens, n):
        return Counter(tuple(tokens[i:i+n]) for i in range(max(0, len(tokens)-n+1)))

    scores = []
    for hyp, ref in pairs:
        ht = hyp.lower().split()
        rt = ref.lower().split()
        if not ht:
            scores.append(0.0)
            continue
        brevity = min(1.0, math.exp(1 - len(rt)/max(len(ht), 1)))
        ps = []
        for n in range(1, 5):
            hc, rc = _ngrams(ht, n), _ngrams(rt, n)
            ov = sum(min(hc[g], rc[g]) for g in hc)
            tot = max(sum(hc.values()), 1)
            ps.append(math.log((ov + 1) / (tot + 1)))
        scores.append(brevity * math.exp(sum(ps) / 4))

    return _safe_mean(scores)


# ─────────────────────────────────────────────────────────────────────────────
# BERTScore
# ─────────────────────────────────────────────────────────────────────────────

def compute_bertscore(hypotheses: list[str], references: list[str]) -> Optional[float]:
    if not hypotheses or not references:
        return None

    # Sentence-transformers cosine similarity (good proxy, always runs if installed)
    sims = _embed_similarity(hypotheses, references)
    if sims:
        return _safe_mean(sims)

    # Token-overlap fallback (always runs)
    scores = []
    for hyp, ref in zip(hypotheses, references):
        ht = set(hyp.lower().split())
        rt = set(ref.lower().split())
        if not rt:
            continue
        prec = len(ht & rt) / max(len(ht), 1)
        rec  = len(ht & rt) / max(len(rt), 1)
        f1   = 2*prec*rec/(prec+rec) if (prec+rec) > 0 else 0.0
        scores.append(f1)
    return _safe_mean(scores)


# ─────────────────────────────────────────────────────────────────────────────
# Faithfulness / Semantic Similarity
# ─────────────────────────────────────────────────────────────────────────────

def compute_faithfulness(outputs: list[str], contexts: list[str]) -> Optional[float]:
    if not outputs or not contexts:
        return None

    pairs_n = min(len(outputs), len(contexts))
    outputs  = outputs[:pairs_n]
    contexts = contexts[:pairs_n]

    sims = _embed_similarity(outputs, contexts)
    if sims:
        return _safe_mean(sims)

    # Jaccard fallback — always works
    return _safe_mean([_jaccard(o, c) for o, c in zip(outputs, contexts)])


# ─────────────────────────────────────────────────────────────────────────────
# Answer Relevance
# ─────────────────────────────────────────────────────────────────────────────

def compute_answer_relevance(queries: list[str], answers: list[str]) -> Optional[float]:
    if not queries or not answers:
        return None

    pairs_n = min(len(queries), len(answers))
    queries = queries[:pairs_n]
    answers = answers[:pairs_n]

    sims = _embed_similarity(queries, answers)
    if sims:
        return _safe_mean(sims)

    return _safe_mean([_jaccard(q, a) for q, a in zip(queries, answers)])


# ─────────────────────────────────────────────────────────────────────────────
# Context Recall
# ─────────────────────────────────────────────────────────────────────────────

def compute_context_recall(contexts: list[str], references: list[str]) -> Optional[float]:
    if not contexts or not references:
        return None

    pairs_n = min(len(contexts), len(references))
    recalls = []
    for ctx, ref in zip(contexts[:pairs_n], references[:pairs_n]):
        rt = set(re.findall(r"\b\w+\b", ref.lower()))
        ct = set(re.findall(r"\b\w+\b", ctx.lower()))
        if rt:
            recalls.append(len(rt & ct) / len(rt))
    return _safe_mean(recalls)


# ─────────────────────────────────────────────────────────────────────────────
# Hallucination Rate
# ─────────────────────────────────────────────────────────────────────────────

def compute_hallucination_rate(outputs: list[str], contexts: list[str]) -> Optional[float]:
    faith = compute_faithfulness(outputs, contexts)
    if faith is None:
        return None
    return round(max(0.0, 1.0 - faith), 4)


# ─────────────────────────────────────────────────────────────────────────────
# Toxicity
# ─────────────────────────────────────────────────────────────────────────────

def compute_toxicity_rate(outputs: list[str]) -> Optional[float]:
    if not outputs:
        return None

    if _HAS_DETOXIFY:
        try:
            results = _detox_model.predict(outputs)
            scores  = list(results.get("toxicity", []))
            if scores:
                return _safe_mean([float(s) for s in scores])
        except Exception:
            pass

    # Expanded keyword heuristic — always runs
    _TOXIC = {
        "hate","kill","die","idiot","stupid","moron","racist","sexist","abuse",
        "violent","threaten","assault","harass","disgusting","awful","terrible",
        "worthless","dumb","pathetic","garbage","trash","loser","scum","freak",
    }
    rates = []
    for text in outputs:
        tokens = set(re.findall(r"\b\w+\b", text.lower()))
        rates.append(min(1.0, len(tokens & _TOXIC) / max(len(tokens), 1) * 20))
    return _safe_mean(rates)


def compute_safety_pass_rate(outputs: list[str]) -> Optional[float]:
    tox = compute_toxicity_rate(outputs)
    if tox is None:
        return None
    return round(max(0.0, 1.0 - tox), 4)


# ─────────────────────────────────────────────────────────────────────────────
# Coherence
# ─────────────────────────────────────────────────────────────────────────────

def compute_coherence(outputs: list[str]) -> Optional[float]:
    """
    Multi-signal coherence:
    1. Sentence length consistency (ideal ~15 words/sentence)
    2. Type-token ratio (vocabulary richness)
    3. Discourse marker presence
    4. Flesch reading ease (textstat) normalised to [0,1]
    """
    if not outputs:
        return None

    DISCOURSE = {
        "however","therefore","furthermore","moreover","consequently","although",
        "because","since","thus","hence","additionally","in conclusion","in summary",
        "as a result","for example","in contrast","on the other hand","first",
        "second","finally","specifically","notably","importantly",
    }

    scores = []
    for text in outputs:
        if not text.strip():
            continue
        sentences = [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]
        if not sentences:
            continue

        tokens   = re.findall(r"\b\w+\b", text.lower())
        avg_len  = np.mean([len(re.findall(r"\b\w+\b", s)) for s in sentences])
        ttr      = len(set(tokens)) / max(len(tokens), 1)
        dm_score = min(sum(1 for m in DISCOURSE if m in text.lower()) / 3.0, 1.0)
        len_score = min(avg_len / 15, 1.0) if avg_len <= 15 else max(0, 1 - (avg_len - 15) / 30)

        # Flesch reading ease bonus
        if _HAS_TEXTSTAT:
            try:
                fre = _textstat.flesch_reading_ease(text)
                fre_norm = max(0.0, min(1.0, fre / 100.0))
            except Exception:
                fre_norm = 0.5
        else:
            fre_norm = 0.5

        score = 0.30 * len_score + 0.25 * ttr + 0.20 * dm_score + 0.25 * fre_norm
        scores.append(min(score, 1.0))

    return _safe_mean(scores)


# ─────────────────────────────────────────────────────────────────────────────
# Perplexity proxy
# ─────────────────────────────────────────────────────────────────────────────

def compute_perplexity_proxy(outputs: list[str]) -> Optional[float]:
    if not outputs:
        return None

    scores = []
    for text in outputs:
        tokens = re.findall(r"\b\w+\b", text.lower())
        if not tokens:
            continue
        counts = Counter(tokens)
        total  = sum(counts.values())
        probs  = [v / total for v in counts.values()]
        entropy = -sum(p * math.log(p + 1e-9) for p in probs)
        scores.append(math.exp(entropy))

    return _safe_mean(scores)


# ─────────────────────────────────────────────────────────────────────────────
# Compression Ratio
# ─────────────────────────────────────────────────────────────────────────────

def compute_compression_ratio(inputs: list[str], outputs: list[str]) -> Optional[float]:
    if not inputs or not outputs:
        return None
    ratios = []
    for inp, out in zip(inputs, outputs):
        in_len  = max(len(inp.split()), 1)
        out_len = len(out.split())
        ratios.append(out_len / in_len)
    return _safe_mean(ratios)


# ─────────────────────────────────────────────────────────────────────────────
# Coverage Score
# ─────────────────────────────────────────────────────────────────────────────

def compute_coverage_score(summaries: list[str], sources: list[str]) -> Optional[float]:
    if not summaries or not sources:
        return None

    STOP = {"the","a","an","is","are","was","were","of","to","in","for","on",
            "with","as","by","at","from","this","that","it","be","has","have","had"}

    def _tokens(text):
        return re.findall(r"\b[a-z]+\b", text.lower())

    def _sentences(text):
        return [s.strip() for s in re.split(r"[.!?]+", text) if len(s.strip()) > 20]

    scores = []
    for summary, source in zip(summaries, sources):
        src_sents = _sentences(source)
        if not src_sents:
            scores.append(1.0)
            continue
        summary_words = set(_tokens(summary)) - STOP
        covered = 0
        for sent in src_sents[:20]:  # cap at 20 key sentences
            sent_words = set(_tokens(sent)) - STOP
            if not sent_words:
                covered += 1
                continue
            if len(sent_words & summary_words) / len(sent_words) >= 0.35:
                covered += 1
        scores.append(covered / len(src_sents[:20]))

    return _safe_mean(scores)


# ─────────────────────────────────────────────────────────────────────────────
# Density Score
# ─────────────────────────────────────────────────────────────────────────────

def compute_density_score(summaries: list[str], sources: list[str]) -> Optional[float]:
    if not summaries or not sources:
        return None

    scores = []
    for summary, source in zip(summaries, sources):
        s_words  = summary.lower().split()
        src_words = source.lower().split()
        if not s_words:
            scores.append(0.0)
            continue
        src_bigrams = set(" ".join(src_words[i:i+3]) for i in range(max(0, len(src_words)-2)))
        matched = 0
        for i in range(max(0, len(s_words) - 2)):
            if " ".join(s_words[i:i+3]) in src_bigrams:
                matched += 3
        density = matched / max(len(s_words), 1)
        if 0.30 <= density <= 0.65:
            score = 1.0 - abs(density - 0.475) / 0.175
        elif density < 0.30:
            score = 0.5 + (density / 0.30) * 0.5
        else:
            score = max(0.0, 1.0 - (density - 0.65) / 0.35)
        scores.append(min(1.0, max(0.0, score)))

    return _safe_mean(scores)


# ─────────────────────────────────────────────────────────────────────────────
# Summary Redundancy
# ─────────────────────────────────────────────────────────────────────────────

def compute_summary_redundancy(summaries: list[str]) -> Optional[float]:
    if not summaries:
        return None

    scores = []
    for summary in summaries:
        words = summary.lower().split()
        if len(words) < 4:
            scores.append(1.0)
            continue
        bigrams = [tuple(words[i:i+2]) for i in range(len(words)-1)]
        counts  = Counter(bigrams)
        repeated = sum(v - 1 for v in counts.values() if v > 1)
        redundancy = min(repeated / max(len(bigrams), 1), 1.0)
        scores.append(1.0 - redundancy)

    return _safe_mean(scores)


# ─────────────────────────────────────────────────────────────────────────────
# Classification Metrics  — uses LLM-judge labels when available
# ─────────────────────────────────────────────────────────────────────────────

def compute_classification_metrics(df: pd.DataFrame) -> dict[str, Optional[float]]:
    """
    Compute classification metrics. Priority order for labels:
    1. Explicit label/ground_truth column
    2. LLM-judge labels injected as _judge_label (binary 0/1)
    Falls back to output-distribution metrics when neither is available.
    """
    output_col = _col(df, "output", "prediction", "predicted", "pred_label", "result")
    label_col  = _col(df, "label", "ground_truth", "true_label", "actual", "target", "class")
    conf_col   = _col(df, "confidence", "probability", "prob", "score", "confidence_score")

    result: dict[str, Optional[float]] = {
        "roc_auc":        None,
        "f1_score":       None,
        "precision":      None,
        "recall":         None,
        "class_balance":  None,
        "avg_confidence": None,
        "accuracy":       None,
    }

    # ── Confidence ─────────────────────────────────────────────────────────────
    if conf_col:
        vals = pd.to_numeric(df[conf_col], errors="coerce").dropna()
        if len(vals) > 0:
            result["avg_confidence"] = float(vals.mean())

    # ── Class balance ──────────────────────────────────────────────────────────
    ref_col = label_col or output_col
    if ref_col:
        vc = df[ref_col].value_counts()
        if len(vc) >= 2:
            result["class_balance"] = float(vc.min() / vc.max())

    # ── Choose best label source ───────────────────────────────────────────────
    # Priority: explicit label col > LLM judge labels > None
    y_true, y_pred = [], []

    if output_col and label_col:
        y_pred = df[output_col].dropna().astype(str).tolist()
        y_true = df[label_col].dropna().astype(str).tolist()
        n = min(len(y_pred), len(y_true))
        y_pred, y_true = y_pred[:n], y_true[:n]

    elif "_judge_label" in df.columns and output_col:
        # LLM-judge labels (binary: 1=correct, 0=incorrect)
        judge_series = df["_judge_label"].dropna()
        out_series   = df[output_col].dropna()
        n = min(len(judge_series), len(out_series))
        y_true = [str(int(v)) for v in judge_series[:n]]
        y_pred = [str(1) if str(v).strip() else str(0) for v in out_series[:n]]
        # For judge-based: accuracy = fraction correct
        result["accuracy"] = float(judge_series[:n].mean())

    if len(y_true) >= 2 and len(y_pred) >= 2:
        if _HAS_SKLEARN:
            try:
                avg = "binary" if len(set(y_true)) <= 2 else "macro"
                result["f1_score"]  = float(_f1(y_true, y_pred, average=avg, zero_division=0))
                result["precision"] = float(_prec(y_true, y_pred, average=avg, zero_division=0))
                result["recall"]    = float(_rec(y_true, y_pred, average=avg, zero_division=0))
                result["accuracy"]  = result.get("accuracy") or float(_acc(y_true, y_pred))
            except Exception:
                pass

            # ROC-AUC: needs numeric confidence + binary labels
            if conf_col and len(set(y_true)) == 2:
                try:
                    probs = pd.to_numeric(df[conf_col], errors="coerce").fillna(0.5).tolist()[:len(y_true)]
                    result["roc_auc"] = float(roc_auc_score(y_true, probs))
                except Exception:
                    pass

        else:
            # Manual fallback
            classes = sorted(set(y_true))
            tp_sum = fp_sum = fn_sum = correct = 0
            for cls in classes:
                tp = sum(1 for p, t in zip(y_pred, y_true) if p == cls and t == cls)
                fp = sum(1 for p, t in zip(y_pred, y_true) if p == cls and t != cls)
                fn = sum(1 for p, t in zip(y_pred, y_true) if p != cls and t == cls)
                tp_sum += tp; fp_sum += fp; fn_sum += fn
            correct = sum(1 for p, t in zip(y_pred, y_true) if p == t)
            prec = tp_sum / max(tp_sum + fp_sum, 1)
            rec  = tp_sum / max(tp_sum + fn_sum, 1)
            result["f1_score"]  = 2*prec*rec / max(prec+rec, 1e-9)
            result["precision"] = prec
            result["recall"]    = rec
            result["accuracy"]  = result.get("accuracy") or correct / max(len(y_true), 1)

    return result


# ─────────────────────────────────────────────────────────────────────────────
# Latency — always computed from latency column when present
# ─────────────────────────────────────────────────────────────────────────────

def compute_latency(df: pd.DataFrame) -> Optional[float]:
    col = _col(df, "latency", "response_time", "duration_ms", "duration", "elapsed", "time_ms")
    if col is None:
        return None
    vals = pd.to_numeric(df[col], errors="coerce").dropna().tolist()
    return _safe_mean(vals)


# ─────────────────────────────────────────────────────────────────────────────
# Automation Metrics
# ─────────────────────────────────────────────────────────────────────────────

def compute_automation_metrics(df: pd.DataFrame) -> dict[str, Optional[float]]:
    output_col  = _col(df, "output", "result", "step_result", "response")
    success_col = _col(df, "step_success", "success", "completed", "done", "task_complete")
    retry_col   = _col(df, "retry_count", "retries", "attempts")

    SUCCESS_KW = {"success", "complete", "done", "finished", "ok", "passed", "true", "processed", "retrieved", "generated", "sent", "updated", "archived", "synced"}
    ERROR_KW   = {"error", "failed", "exception", "timeout", "false", "retry", "crash", "unavailable", "invalid"}

    result: dict[str, Optional[float]] = {
        "step_success_rate":    None,
        "task_completion_rate": None,
        "error_rate":           None,
        "avg_retry_rate":       None,
        "avg_step_latency_ms":  None,
    }

    # Explicit boolean success column
    if success_col:
        vals = df[success_col]
        bool_map = {"true": 1, "false": 0, "yes": 1, "no": 0, "1": 1, "0": 0,
                    "success": 1, "fail": 0, "failed": 0, "pass": 1}
        numeric = pd.to_numeric(vals, errors="coerce")
        str_mapped = vals.astype(str).str.lower().map(bool_map)
        resolved = numeric.combine_first(str_mapped).dropna()
        if len(resolved) > 0:
            result["step_success_rate"]    = float(resolved.mean())
            result["task_completion_rate"] = result["step_success_rate"]
            result["error_rate"]           = float(1 - resolved.mean())

    # Infer from output text if no boolean column
    if result["step_success_rate"] is None and output_col:
        outputs = [str(v).lower() for v in df[output_col].dropna()]
        if outputs:
            inferred = []
            for o in outputs:
                if any(k in o for k in SUCCESS_KW) and not any(k in o for k in ERROR_KW):
                    inferred.append(1.0)
                elif any(k in o for k in ERROR_KW):
                    inferred.append(0.0)
                elif len(o.strip()) > 20:
                    inferred.append(0.85)  # non-empty output with no error = mostly OK
                else:
                    inferred.append(0.5)
            result["step_success_rate"]    = _safe_mean(inferred)
            result["task_completion_rate"] = result["step_success_rate"]
            result["error_rate"]           = _safe_mean([1 - v for v in inferred])

    # Retry rate
    if retry_col:
        vals = pd.to_numeric(df[retry_col], errors="coerce").dropna().tolist()
        result["avg_retry_rate"] = _safe_mean(vals)

    # Latency
    result["avg_step_latency_ms"] = compute_latency(df)

    return result


# ─────────────────────────────────────────────────────────────────────────────
# CV / Image Classification Metrics
# ─────────────────────────────────────────────────────────────────────────────

def compute_cv_metrics(df: pd.DataFrame) -> dict[str, Optional[float]]:
    conf_col    = _col(df, "confidence_score", "confidence", "score", "detection_score", "probability")
    label_col   = _col(df, "label", "ground_truth", "true_class", "class_name", "annotation", "category")
    output_col  = _col(df, "output", "predicted_class", "prediction", "pred")
    iou_col     = _col(df, "iou", "intersection_over_union", "iou_score", "mean_iou")
    map_col     = _col(df, "map", "mean_average_precision", "ap", "map_score")

    result: dict[str, Optional[float]] = {
        "map_score":        None,
        "avg_iou":          None,
        "top_k_accuracy":   None,
        "avg_confidence":   None,
        "label_coverage":   None,
        "avg_inference_ms": None,
        "accuracy":         None,
    }

    if conf_col:
        vals = pd.to_numeric(df[conf_col], errors="coerce").dropna().tolist()
        if vals:
            result["avg_confidence"] = _safe_mean(vals)
            result["top_k_accuracy"] = _safe_mean([1.0 if v >= 0.5 else 0.0 for v in vals])

    if label_col:
        result["label_coverage"] = float(df[label_col].notna().mean())
        # Classification accuracy when output and label both exist
        if output_col:
            y_true = df[label_col].dropna().astype(str).tolist()
            y_pred = df[output_col].dropna().astype(str).tolist()
            n = min(len(y_true), len(y_pred))
            if n >= 2:
                correct = sum(1 for t, p in zip(y_true[:n], y_pred[:n]) if t == p)
                result["accuracy"] = correct / n

    # LLM-judge labels as accuracy fallback
    if result["accuracy"] is None and "_judge_label" in df.columns:
        judge = df["_judge_label"].dropna()
        if len(judge) > 0:
            result["accuracy"] = float(judge.mean())

    if iou_col:
        vals = pd.to_numeric(df[iou_col], errors="coerce").dropna().tolist()
        if vals:
            result["avg_iou"] = _safe_mean(vals)

    if map_col:
        vals = pd.to_numeric(df[map_col], errors="coerce").dropna().tolist()
        if vals:
            result["map_score"] = _safe_mean(vals)

    result["avg_inference_ms"] = compute_latency(df)

    # Confidence-based proxies when explicit columns missing
    if result["map_score"] is None and result["avg_confidence"] is not None:
        result["map_score"] = result["avg_confidence"] * 0.85
    if result["avg_iou"] is None and result["avg_confidence"] is not None:
        result["avg_iou"] = result["avg_confidence"] * 0.90

    return result


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC API — one dispatcher per model type
# ─────────────────────────────────────────────────────────────────────────────

def calculate_metrics(
    model_type: str,
    df: pd.DataFrame,
    kb_chunks: Optional[list[str]] = None,
) -> dict[str, Optional[float]]:
    """
    Main dispatcher.

    Parameters
    ----------
    model_type  : One of: general_llm, summarization, rag, classification,
                  automation, image_classification
    df          : DataFrame with at minimum input + output columns.
                  May contain _judge_label (injected by evaluate endpoint).
    kb_chunks   : Optional list of KB text chunks. When provided:
                  - For summarization: used as references for ROUGE/BLEU/BERTScore
                  - For RAG/general_llm: used as context for faithfulness/hallucination
                  - For all types: improves label availability

    Required columns:  input (or prompt/query), output (or response/answer)
    Optional columns:  reference, context, label, confidence, latency, task_id
    """
    inputs   = _texts(df, "input", "prompt", "query", "instruction", "step_name", "question")
    outputs  = _texts(df, "output", "response", "answer", "completion", "result", "summary")
    refs     = _texts(df, "reference", "reference_summary", "ground_truth", "target", "ref_summary")
    contexts = _texts(df, "context", "retrieved_chunks", "chunks", "passages", "source_doc", "knowledgebase", "kb")

    # ── Inject KB chunks as references/contexts ────────────────────────────────
    # This is the KEY fix: when KB is uploaded and no reference/context column exists,
    # use KB chunks to enable ROUGE, BLEU, BERTScore, faithfulness etc.
    if kb_chunks and len(kb_chunks) > 0:
        if not refs:
            # Use KB as reference summaries for summarization
            # Match KB chunks to outputs by cycling/truncating
            refs = (kb_chunks * math.ceil(max(len(outputs), 1) / max(len(kb_chunks), 1)))[:len(outputs)]
        if not contexts:
            # Use KB as context for RAG/LLM faithfulness
            contexts = (kb_chunks * math.ceil(max(len(outputs), 1) / max(len(kb_chunks), 1)))[:len(outputs)]

    # ── Align lengths ──────────────────────────────────────────────────────────
    n = min(
        len(inputs)  if inputs  else 999_999,
        len(outputs) if outputs else 999_999,
    )
    if n == 999_999 or n == 0:
        # No input/output pair — still compute what we can from df columns
        result = {}
        result["avg_latency_ms"] = compute_latency(df)
        if "_judge_label" in df.columns:
            judge = df["_judge_label"].dropna()
            if len(judge) > 0:
                result["accuracy"]      = float(judge.mean())
                result["judge_accuracy"] = float(judge.mean())
        return {k: v for k, v in result.items() if v is not None}

    inputs   = inputs[:n]
    outputs  = outputs[:n]
    refs     = refs[:n]     if len(refs)     >= n else []
    contexts = contexts[:n] if len(contexts) >= n else []

    # ── Universal metrics computed for all model types ─────────────────────────
    latency = compute_latency(df)

    # Judge accuracy (from _judge_label injected by evaluate endpoint)
    judge_accuracy = None
    if "_judge_label" in df.columns:
        judge = df["_judge_label"].dropna()
        if len(judge) > 0:
            judge_accuracy = float(judge.mean())

    # ── Per-model-type dispatch ────────────────────────────────────────────────

    if model_type == "summarization":
        has_refs = bool(refs)
        source_list = inputs  # source documents

        rouge_scores = compute_rouge(outputs, refs) if has_refs else {"rouge_1": None, "rouge_2": None, "rouge_l": None}

        return {
            # Supervised (require reference summaries or KB)
            "rouge_1":            rouge_scores["rouge_1"],
            "rouge_2":            rouge_scores["rouge_2"],
            "rouge_l":            rouge_scores["rouge_l"],
            "bleu":               compute_bleu(outputs, refs) if has_refs else None,
            "bertscore":          compute_bertscore(outputs, refs) if has_refs else None,
            # Reference-free (always computed)
            "faithfulness":       compute_faithfulness(outputs, source_list),
            "coverage_score":     compute_coverage_score(outputs, source_list),
            "density_score":      compute_density_score(outputs, source_list),
            "compression_ratio":  compute_compression_ratio(source_list, outputs),
            "summary_redundancy": compute_summary_redundancy(outputs),
            "reference_coverage": float(len(refs) / n) if has_refs else 0.0,
            "avg_coherence":      compute_coherence(outputs),
            "avg_latency_ms":     latency,
            "accuracy":           judge_accuracy,
            "judge_accuracy":     judge_accuracy,
        }

    elif model_type == "rag":
        ctx_list = contexts or refs or inputs  # KB chunks are now in contexts

        return {
            "faithfulness":       compute_faithfulness(outputs, ctx_list),
            "answer_relevance":   compute_answer_relevance(inputs, outputs),
            "context_recall":     compute_context_recall(ctx_list, refs or outputs) if refs else
                                  compute_context_recall(ctx_list, outputs),
            "hallucination_rate": compute_hallucination_rate(outputs, ctx_list),
            "context_coverage":   float(len(contexts) / n) if contexts else (1.0 if kb_chunks else 0.0),
            "avg_coherence":      compute_coherence(outputs),
            "avg_latency_ms":     latency,
            "accuracy":           judge_accuracy,
            "judge_accuracy":     judge_accuracy,
        }

    elif model_type == "general_llm":
        ctx_for_hall = contexts or refs  # KB chunks injected into contexts

        return {
            "toxicity_rate":      compute_toxicity_rate(outputs),
            "safety_pass_rate":   compute_safety_pass_rate(outputs),
            "hallucination_rate": compute_hallucination_rate(outputs, ctx_for_hall) if ctx_for_hall else None,
            "avg_coherence":      compute_coherence(outputs),
            "avg_perplexity":     compute_perplexity_proxy(outputs),
            "avg_latency_ms":     latency,
            "faithfulness":       compute_faithfulness(outputs, ctx_for_hall) if ctx_for_hall else None,
            "accuracy":           judge_accuracy,
            "judge_accuracy":     judge_accuracy,
        }

    elif model_type == "classification":
        m = compute_classification_metrics(df)
        m["avg_latency_ms"] = latency
        if judge_accuracy is not None:
            m.setdefault("accuracy", judge_accuracy)
            m["judge_accuracy"] = judge_accuracy
        return m

    elif model_type == "automation":
        m = compute_automation_metrics(df)
        if judge_accuracy is not None:
            m["accuracy"]       = judge_accuracy
            m["judge_accuracy"] = judge_accuracy
        return m

    elif model_type == "image_classification":
        m = compute_cv_metrics(df)
        if judge_accuracy is not None and m.get("accuracy") is None:
            m["accuracy"]       = judge_accuracy
            m["judge_accuracy"] = judge_accuracy
        return m

    else:
        # Fallback: treat as general LLM
        ctx_for_hall = contexts or refs
        return {
            "toxicity_rate":    compute_toxicity_rate(outputs),
            "safety_pass_rate": compute_safety_pass_rate(outputs),
            "avg_coherence":    compute_coherence(outputs),
            "avg_perplexity":   compute_perplexity_proxy(outputs),
            "avg_latency_ms":   latency,
            "faithfulness":     compute_faithfulness(outputs, ctx_for_hall) if ctx_for_hall else None,
            "accuracy":         judge_accuracy,
            "judge_accuracy":   judge_accuracy,
        }