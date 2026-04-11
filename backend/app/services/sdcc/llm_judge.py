# """
# services/sdcc/llm_judge.py
# ===========================
# LLM-as-a-Judge using Groq API.

# Workflow
# --------
# 1. For each (input, output) row:
#    a. If knowledge-base chunks are provided, first search the KB for a relevant answer.
#       - If KB contains a relevant answer → judge correctness against the KB answer.
#       - If no relevant KB answer found    → fall back to pure LLM judgement.
#    b. If no KB is provided → pure LLM judgement (is the output factually reasonable?).

# 2. Returns per-row labels (1 = correct, 0 = incorrect) and aggregate metrics.

# The judge uses llama-3.3-70b-versatile via Groq for best accuracy.
# """

# from __future__ import annotations
# import json
# import os
# import re
# import time
# from typing import Optional

# import pandas as pd

# _GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
# _JUDGE_MODEL = "llama-3.3-70b-versatile"

# # ── KB relevance threshold ──────────────────────────────────────────────────────
# # Jaccard word-overlap threshold above which we consider the KB to have answered
# _KB_RELEVANCE_THRESHOLD = 0.12


# def _jaccard(a: str, b: str) -> float:
#     """Simple word-level Jaccard similarity."""
#     wa = set(a.lower().split())
#     wb = set(b.lower().split())
#     if not wa or not wb:
#         return 0.0
#     return len(wa & wb) / len(wa | wb)


# def _find_kb_answer(question: str, kb_chunks: list[str]) -> Optional[str]:
#     """
#     Return the most relevant KB chunk for the question, or None if no chunk
#     is sufficiently relevant (below _KB_RELEVANCE_THRESHOLD).
#     """
#     if not kb_chunks:
#         return None
#     best_chunk = max(kb_chunks, key=lambda c: _jaccard(question, c))
#     if _jaccard(question, best_chunk) >= _KB_RELEVANCE_THRESHOLD:
#         return best_chunk
#     return None


# def _build_judge_prompt(
#     question: str,
#     ai_output: str,
#     kb_context: Optional[str],
# ) -> str:
#     """Build the judge system + user messages."""
#     if kb_context:
#         system = (
#             "You are an expert AI evaluator. You are given:\n"
#             "1. A question or user prompt.\n"
#             "2. A reference answer from a knowledge base.\n"
#             "3. The AI system's response to the question.\n\n"
#             "Your task: Determine whether the AI's response is CORRECT based on the "
#             "knowledge base reference. A response is CORRECT if it is factually "
#             "consistent with the reference and adequately answers the question. "
#             "Minor wording differences are acceptable.\n\n"
#             'Respond ONLY with valid JSON: {"correct": true|false, "reason": "<one sentence>"}'
#         )
#         user = (
#             f"QUESTION:\n{question}\n\n"
#             f"KNOWLEDGE BASE REFERENCE:\n{kb_context}\n\n"
#             f"AI RESPONSE:\n{ai_output}\n\n"
#             "Is the AI response correct based on the knowledge base?"
#         )
#     else:
#         system = (
#             "You are an expert AI evaluator acting as an impartial judge. "
#             "You are given a question and an AI system's response.\n\n"
#             "Your task: Determine whether the AI's response is CORRECT — i.e., "
#             "factually accurate, coherent, helpful, and not misleading. "
#             "Use your world knowledge. Do NOT penalise for style differences.\n\n"
#             'Respond ONLY with valid JSON: {"correct": true|false, "reason": "<one sentence>"}'
#         )
#         user = (
#             f"QUESTION:\n{question}\n\n"
#             f"AI RESPONSE:\n{ai_output}\n\n"
#             "Is the AI response correct?"
#         )
#     return system, user


# def _call_groq_judge(
#     system: str,
#     user: str,
#     api_key: str,
#     max_retries: int = 2,
# ) -> Optional[dict]:
#     """Call Groq and return parsed JSON or None."""
#     try:
#         import requests as _req
#     except ImportError:
#         return None

#     for attempt in range(max_retries + 1):
#         try:
#             resp = _req.post(
#                 _GROQ_URL,
#                 json={
#                     "model": _JUDGE_MODEL,
#                     "messages": [
#                         {"role": "system", "content": system},
#                         {"role": "user",   "content": user},
#                     ],
#                     "temperature": 0.0,
#                     "max_tokens": 150,
#                     "response_format": {"type": "json_object"},
#                 },
#                 headers={
#                     "Authorization": f"Bearer {api_key}",
#                     "Content-Type": "application/json",
#                 },
#                 timeout=15,
#             )
#             resp.raise_for_status()
#             content = resp.json()["choices"][0]["message"]["content"]
#             parsed = json.loads(content)
#             return parsed
#         except Exception:
#             if attempt < max_retries:
#                 time.sleep(1.0 * (attempt + 1))
#     return None


# # ─────────────────────────────────────────────────────────────────────────────
# # PUBLIC API
# # ─────────────────────────────────────────────────────────────────────────────

# def run_llm_judge(
#     df: pd.DataFrame,
#     kb_chunks: Optional[list[str]] = None,
#     groq_api_key: Optional[str] = None,
#     max_rows: int = 200,
# ) -> dict:
#     """
#     Run LLM-as-a-Judge on every row of the DataFrame.

#     Parameters
#     ----------
#     df            : DataFrame with columns: input, output (+ optional: task_id, latency)
#     kb_chunks     : Optional list of knowledge-base text chunks
#     groq_api_key  : Groq API key (falls back to GROQ_API_KEY env var)
#     max_rows      : Cap to avoid runaway costs (default 200)

#     Returns
#     -------
#     {
#         "labels":          [0|1, ...],        # per-row correctness (1=correct)
#         "accuracy":        float,             # proportion correct
#         "reasons":         ["...", ...],      # per-row reason from judge
#         "kb_used":         [True|False, ...], # whether KB was used per row
#         "rows_judged":     int,
#         "rows_skipped":    int,               # rows where judge failed
#         "judge_model":     str,
#         "kb_chunks_count": int,
#     }
#     """
#     api_key = groq_api_key or os.environ.get("GROQ_API_KEY", "")
#     if not api_key:
#         return {
#             "error": "GROQ_API_KEY not set — LLM judge unavailable.",
#             "labels": [],
#             "accuracy": None,
#             "reasons": [],
#             "kb_used": [],
#             "rows_judged": 0,
#             "rows_skipped": 0,
#             "judge_model": _JUDGE_MODEL,
#             "kb_chunks_count": len(kb_chunks) if kb_chunks else 0,
#         }

#     # ── Find input/output columns ──────────────────────────────────────────────
#     def _find_col(df, *candidates):
#         lower = {c.lower(): c for c in df.columns}
#         for cand in candidates:
#             for col_low, col_orig in lower.items():
#                 if cand in col_low:
#                     return col_orig
#         return None

#     input_col  = _find_col(df, "input",  "prompt",   "query",    "question", "instruction")
#     output_col = _find_col(df, "output", "response", "answer",   "completion", "result")

#     if not input_col or not output_col:
#         return {
#             "error": "Cannot find input/output columns for LLM judge.",
#             "labels": [],
#             "accuracy": None,
#             "reasons": [],
#             "kb_used": [],
#             "rows_judged": 0,
#             "rows_skipped": 0,
#             "judge_model": _JUDGE_MODEL,
#             "kb_chunks_count": len(kb_chunks) if kb_chunks else 0,
#         }

#     rows = df[[input_col, output_col]].dropna().head(max_rows)

#     labels   = []
#     reasons  = []
#     kb_flags = []
#     skipped  = 0

#     for _, row in rows.iterrows():
#         question  = str(row[input_col]).strip()
#         ai_output = str(row[output_col]).strip()

#         if not question or not ai_output:
#             skipped += 1
#             continue

#         # KB lookup
#         kb_context = _find_kb_answer(question, kb_chunks) if kb_chunks else None
#         system, user = _build_judge_prompt(question, ai_output, kb_context)

#         result = _call_groq_judge(system, user, api_key)
#         if result is None:
#             skipped += 1
#             continue

#         correct = bool(result.get("correct", False))
#         reason  = result.get("reason", "")
#         labels.append(1 if correct else 0)
#         reasons.append(reason)
#         kb_flags.append(kb_context is not None)

#     accuracy = float(sum(labels) / len(labels)) if labels else None

#     return {
#         "labels":          labels,
#         "accuracy":        accuracy,
#         "reasons":         reasons,
#         "kb_used":         kb_flags,
#         "rows_judged":     len(labels),
#         "rows_skipped":    skipped,
#         "judge_model":     _JUDGE_MODEL,
#         "kb_chunks_count": len(kb_chunks) if kb_chunks else 0,
#     }



"""
services/sdcc/llm_judge.py
===========================
Triple-LLM Judge Panel — "Jury of Judges" pattern.

WHY THREE JUDGES?
-----------------
Any single LLM can be wrong, biased toward verbose answers, or simply
hallucinate a verdict. Running three *different* models from three
*different* providers and requiring a majority vote (≥ 2/3) gives you:
  - Cross-provider independence (no shared weights or fine-tuning)
  - Majority voting to cancel out individual errors
  - A DISPUTED flag when all three disagree (1-1-1 is impossible with
    boolean votes, but 2-1 splits are surfaced in the reasoning)

JUDGE PANEL
-----------
  Judge 1 — Groq         : llama-3.3-70b-versatile   (fast, open-weight)
  Judge 2 — OpenRouter   : mistralai/mistral-large    (different architecture)
  Judge 3 — Together AI  : Qwen/Qwen2.5-72B-Instruct  (different training data)

WORKFLOW
--------
For each (input, output) row in the logs:

  1. KB PATH (if kb_chunks provided):
       a. Search KB for a relevant chunk (Jaccard similarity ≥ threshold).
       b. If found → all three judges evaluate the AI output AGAINST the KB
          reference. This is the most reliable path.
       c. If not found → fall through to the LLM path.

  2. LLM PATH (no KB, or KB had no relevant chunk):
       a. Each judge independently generates what it believes is the CORRECT
          answer for the question.
       b. The three "reference answers" are compared to each other — if they
          broadly agree (Jaccard ≥ threshold), we use the majority answer
          as the reference.
       c. The AI's logged output is then compared against that reference.
       d. Final verdict: each judge votes correct/incorrect against the
          agreed reference. Majority wins.

VERDICT RULES
-------------
  - 3/3 agree CORRECT   → label=1, confidence="high"
  - 2/3 agree CORRECT   → label=1, confidence="medium"
  - 2/3 agree INCORRECT → label=0, confidence="medium"
  - 3/3 agree INCORRECT → label=0, confidence="high"
  - All votes available but split evenly (shouldn't happen with 3 binary
    judges, but guard included) → label=0, confidence="low", disputed=True

REQUIRED ENV VARS
-----------------
  GROQ_API_KEY        — https://console.groq.com
  OPENROUTER_API_KEY  — https://openrouter.ai
  TOGETHER_API_KEY    — https://api.together.xyz

All three are needed for the full panel. If one is missing, the panel
degrades gracefully to a 2-judge or 1-judge panel with a warning, but
confidence scores are adjusted accordingly.
"""

from __future__ import annotations

import json
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional

import pandas as pd

# ── Model identifiers ──────────────────────────────────────────────────────────
_GROQ_URL          = "https://api.groq.com/openai/v1/chat/completions"
_GROQ_MODEL        = "llama-3.3-70b-versatile"

_OPENROUTER_URL    = "https://openrouter.ai/api/v1/chat/completions"
_OPENROUTER_MODEL  = "mistralai/mistral-large"

_TOGETHER_URL      = "https://api.together.xyz/v1/chat/completions"
_TOGETHER_MODEL    = "Qwen/Qwen2.5-72B-Instruct"

# ── Thresholds ─────────────────────────────────────────────────────────────────
_KB_RELEVANCE_THRESHOLD      = 0.12   # Jaccard: KB chunk vs question
_ANSWER_AGREEMENT_THRESHOLD  = 0.15   # Jaccard: judge-generated answers vs each other


# ─────────────────────────────────────────────────────────────────────────────
# UTILITY
# ─────────────────────────────────────────────────────────────────────────────

def _jaccard(a: str, b: str) -> float:
    """Word-level Jaccard similarity between two strings."""
    wa = set(a.lower().split())
    wb = set(b.lower().split())
    if not wa or not wb:
        return 0.0
    return len(wa & wb) / len(wa | wb)


def _find_kb_answer(question: str, kb_chunks: list[str]) -> Optional[str]:
    """Return the most relevant KB chunk, or None if below threshold."""
    if not kb_chunks:
        return None
    best = max(kb_chunks, key=lambda c: _jaccard(question, c))
    return best if _jaccard(question, best) >= _KB_RELEVANCE_THRESHOLD else None


def _answers_agree(answers: list[str]) -> bool:
    """
    Return True if the majority of judge-generated answers broadly agree
    with each other (pairwise Jaccard average ≥ threshold).
    """
    if len(answers) < 2:
        return True
    pairs = [
        _jaccard(answers[i], answers[j])
        for i in range(len(answers))
        for j in range(i + 1, len(answers))
    ]
    return (sum(pairs) / len(pairs)) >= _ANSWER_AGREEMENT_THRESHOLD


# ─────────────────────────────────────────────────────────────────────────────
# PROMPT BUILDERS
# ─────────────────────────────────────────────────────────────────────────────

def _build_verdict_prompt(
    question: str,
    ai_output: str,
    reference: str,
    reference_source: str,   # "knowledge_base" | "judge_panel"
) -> tuple[str, str]:
    """Build system + user prompt for a VERDICT call (correct/incorrect)."""
    system = (
        "You are an expert, impartial AI evaluator on a three-judge panel. "
        "Your job is to determine whether an AI system's response is CORRECT.\n\n"
        f"You are given:\n"
        f"1. The original question asked to the AI.\n"
        f"2. A reference answer (source: {reference_source}).\n"
        f"3. The AI system's actual response (the response being audited).\n\n"
        "CORRECT means: the AI response is factually consistent with the reference "
        "and adequately addresses the question. Minor phrasing differences are fine.\n"
        "INCORRECT means: the AI response contradicts the reference, omits critical "
        "facts, or is meaningfully misleading.\n\n"
        'Respond ONLY with valid JSON: {"correct": true|false, "reason": "<one concise sentence>"}'
    )
    user = (
        f"QUESTION:\n{question}\n\n"
        f"REFERENCE ANSWER ({reference_source}):\n{reference}\n\n"
        f"AI SYSTEM RESPONSE (being audited):\n{ai_output}\n\n"
        "Is the AI response correct based on the reference?"
    )
    return system, user


def _build_direct_verdict_prompt(question: str, ai_output: str) -> tuple[str, str]:
    """
    Single-call verdict prompt — no reference generation needed.
    The judge uses its own world knowledge to evaluate correctness directly.
    """
    system = (
        "You are an expert, impartial AI evaluator. "
        "Evaluate whether the AI system's response is CORRECT using your world knowledge.\n\n"
        "CORRECT means: factually accurate, coherent, helpful, and not misleading.\n"
        "INCORRECT means: factually wrong, incoherent, harmful, or meaningfully misleading.\n\n"
        'Respond ONLY with valid JSON: {"correct": true|false, "reason": "<one concise sentence>"}'
    )
    user = (
        f"QUESTION:\n{question}\n\n"
        f"AI SYSTEM RESPONSE:\n{ai_output}\n\n"
        "Is the AI response correct?"
    )
    return system, user


def _build_generate_answer_prompt(question: str) -> tuple[str, str]:
    """Build system + user prompt to ask a judge to GENERATE a reference answer."""
    system = (
        "You are a knowledgeable, factual assistant. "
        "Answer the following question as accurately and concisely as possible. "
        "Provide only the factual answer — no preamble, no explanation of your reasoning."
    )
    user = f"Question: {question}\n\nAnswer:"
    return system, user


# ─────────────────────────────────────────────────────────────────────────────
# INDIVIDUAL JUDGE CALLERS
# ─────────────────────────────────────────────────────────────────────────────

def _call_openai_compat(
    url: str,
    api_key: str,
    model: str,
    system: str,
    user: str,
    expect_json: bool = True,
    max_retries: int = 2,
    timeout: int = 20,
) -> Optional[str]:
    """
    Generic caller for any OpenAI-compatible endpoint.
    Returns the raw text content of the response, or None on failure.
    """
    try:
        import requests as _req
    except ImportError:
        return None

    payload: dict = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
        "temperature": 0.0,
        "max_tokens": 300,
    }
    if expect_json:
        payload["response_format"] = {"type": "json_object"}

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type":  "application/json",
    }
    # OpenRouter requires an extra header for ranking/billing
    if "openrouter" in url:
        headers["HTTP-Referer"] = "https://auditable.ai"
        headers["X-Title"]      = "AuditableAI-Judge"

    for attempt in range(max_retries + 1):
        try:
            resp = _req.post(url, json=payload, headers=headers, timeout=timeout)
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]
        except Exception:
            if attempt < max_retries:
                time.sleep(1.0 * (attempt + 1))
    return None


def _parse_verdict(raw: Optional[str]) -> Optional[dict]:
    """Safely parse a judge's JSON verdict."""
    if not raw:
        return None
    try:
        # Strip markdown fences if any model wraps in ```json
        clean = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        return json.loads(clean)
    except Exception:
        return None


# ─────────────────────────────────────────────────────────────────────────────
# JUDGE PANEL ORCHESTRATION
# ─────────────────────────────────────────────────────────────────────────────

class JudgePanel:
    """
    Manages a panel of up to three LLM judges and exposes two public methods:

      generate_reference_answers(question)
          → Ask each judge to produce a reference answer independently.

      vote_on_verdict(question, ai_output, reference, reference_source)
          → Ask each judge to vote correct/incorrect. Returns majority verdict.
    """

    def __init__(
        self,
        groq_api_key: Optional[str] = None,
        openrouter_api_key: Optional[str] = None,
        together_api_key: Optional[str] = None,
    ):
        self.judges: list[dict] = []

        groq_key = groq_api_key or os.environ.get("GROQ_API_KEY", "")
        or_key   = openrouter_api_key or os.environ.get("OPENROUTER_API_KEY", "")
        tog_key  = together_api_key or os.environ.get("TOGETHER_API_KEY", "")

        if groq_key:
            self.judges.append({
                "name": "Groq/Llama-3.3-70B",
                "url":   _GROQ_URL,
                "key":   groq_key,
                "model": _GROQ_MODEL,
            })
        if or_key:
            self.judges.append({
                "name": "OpenRouter/Mistral-Large",
                "url":   _OPENROUTER_URL,
                "key":   or_key,
                "model": _OPENROUTER_MODEL,
            })
        if tog_key:
            self.judges.append({
                "name": "Together/Qwen2.5-72B",
                "url":   _TOGETHER_URL,
                "key":   tog_key,
                "model": _TOGETHER_MODEL,
            })

    @property
    def active_count(self) -> int:
        return len(self.judges)

    def _call_one(
        self,
        judge: dict,
        system: str,
        user: str,
        expect_json: bool,
    ) -> Optional[str]:
        return _call_openai_compat(
            url=judge["url"],
            api_key=judge["key"],
            model=judge["model"],
            system=system,
            user=user,
            expect_json=expect_json,
        )

    def generate_reference_answers(self, question: str) -> dict:
        """
        Ask each judge to independently answer the question.
        Returns:
        {
            "answers":       {"judge_name": "answer text", ...},
            "agreed":        bool,
            "best_answer":   str | None,   # the answer with most agreement
        }
        """
        system, user = _build_generate_answer_prompt(question)
        results: dict[str, str] = {}

        # Call all judges in parallel
        with ThreadPoolExecutor(max_workers=3) as pool:
            futures = {
                pool.submit(self._call_one, j, system, user, False): j["name"]
                for j in self.judges
            }
            for future in as_completed(futures):
                name = futures[future]
                raw  = future.result()
                if raw and raw.strip():
                    results[name] = raw.strip()

        if not results:
            return {"answers": {}, "agreed": False, "best_answer": None}

        answers_list = list(results.values())
        agreed = _answers_agree(answers_list) if len(answers_list) > 1 else True

        # Pick "best answer" = the one with highest average similarity to the others
        if len(answers_list) == 1:
            best = answers_list[0]
        else:
            best = max(
                answers_list,
                key=lambda a: sum(_jaccard(a, b) for b in answers_list if b != a)
            )

        return {"answers": results, "agreed": agreed, "best_answer": best}

    def vote_direct(self, question: str, ai_output: str) -> dict:
        """
        Single-call verdict using each judge's world knowledge directly.
        No reference generation step — avoids double API calls and rate limits.
        """
        system, user = _build_direct_verdict_prompt(question, ai_output)
        votes:   dict[str, bool] = {}
        reasons: dict[str, str]  = {}

        with ThreadPoolExecutor(max_workers=3) as pool:
            futures = {
                pool.submit(self._call_one, j, system, user, True): j["name"]
                for j in self.judges
            }
            for future in as_completed(futures):
                name   = futures[future]
                parsed = _parse_verdict(future.result())
                if parsed is not None:
                    votes[name]   = bool(parsed.get("correct", False))
                    reasons[name] = parsed.get("reason", "")

        if not votes:
            return {
                "votes": {}, "reasons": {}, "correct": False,
                "confidence": "low", "vote_count": 0,
                "total_votes": 0, "disputed": True,
            }

        total       = len(votes)
        correct_cnt = sum(1 for v in votes.values() if v)
        majority    = correct_cnt > (total / 2)
        disputed    = (correct_cnt == total - correct_cnt)

        if correct_cnt == total or correct_cnt == 0:
            confidence = "high"
        elif abs(correct_cnt - (total - correct_cnt)) == 1:
            confidence = "medium"
        else:
            confidence = "low"

        return {
            "votes":       votes,
            "reasons":     reasons,
            "correct":     majority,
            "confidence":  confidence,
            "vote_count":  correct_cnt,
            "total_votes": total,
            "disputed":    disputed,
        }

    def vote_on_verdict(
        self,
        question: str,
        ai_output: str,
        reference: str,
        reference_source: str,
    ) -> dict:
        """
        Each judge votes correct/incorrect for the AI output vs the reference.
        Returns:
        {
            "votes":       {"judge_name": True|False, ...},
            "reasons":     {"judge_name": "reason", ...},
            "correct":     bool,     # majority decision
            "confidence":  str,      # "high" | "medium" | "low"
            "vote_count":  int,      # how many judges voted correct
            "total_votes": int,
            "disputed":    bool,
        }
        """
        system, user = _build_verdict_prompt(
            question, ai_output, reference, reference_source
        )
        votes:   dict[str, bool] = {}
        reasons: dict[str, str]  = {}

        with ThreadPoolExecutor(max_workers=3) as pool:
            futures = {
                pool.submit(self._call_one, j, system, user, True): j["name"]
                for j in self.judges
            }
            for future in as_completed(futures):
                name   = futures[future]
                parsed = _parse_verdict(future.result())
                if parsed is not None:
                    votes[name]   = bool(parsed.get("correct", False))
                    reasons[name] = parsed.get("reason", "")

        if not votes:
            return {
                "votes": {}, "reasons": {}, "correct": False,
                "confidence": "low", "vote_count": 0,
                "total_votes": 0, "disputed": True,
            }

        total       = len(votes)
        correct_cnt = sum(1 for v in votes.values() if v)
        majority    = correct_cnt > (total / 2)
        disputed    = correct_cnt == total - correct_cnt  # exact tie (only possible with even count)

        if correct_cnt == total:
            confidence = "high"
        elif correct_cnt == 0:
            confidence = "high"
        elif abs(correct_cnt - (total - correct_cnt)) == 1:
            confidence = "medium"
        else:
            confidence = "low"

        return {
            "votes":       votes,
            "reasons":     reasons,
            "correct":     majority,
            "confidence":  confidence,
            "vote_count":  correct_cnt,
            "total_votes": total,
            "disputed":    disputed,
        }


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC API
# ─────────────────────────────────────────────────────────────────────────────

def run_llm_judge(
    df: pd.DataFrame,
    kb_chunks: Optional[list[str]] = None,
    groq_api_key: Optional[str] = None,
    openrouter_api_key: Optional[str] = None,
    together_api_key: Optional[str] = None,
    max_rows: int = 200,
) -> dict:
    """
    Run the Triple-LLM Judge Panel on every row of the DataFrame.

    Parameters
    ----------
    df                  : DataFrame with columns: input, output
    kb_chunks           : Optional list of knowledge-base text chunks
    groq_api_key        : Groq API key (falls back to GROQ_API_KEY env var)
    openrouter_api_key  : OpenRouter API key (falls back to OPENROUTER_API_KEY)
    together_api_key    : Together AI key (falls back to TOGETHER_API_KEY)
    max_rows            : Cap to avoid runaway costs (default 200)

    Returns
    -------
    {
        "labels":           [0|1, ...],
        "accuracy":         float,
        "confidence":       ["high"|"medium"|"low", ...],
        "reasons":          [{"judge_name": "reason", ...}, ...],
        "votes":            [{"judge_name": True|False, ...}, ...],
        "kb_used":          [True|False, ...],
        "disputed_rows":    [int, ...],       # row indices with disputed verdicts
        "rows_judged":      int,
        "rows_skipped":     int,
        "judge_panel":      [str, ...],       # names of active judges
        "panel_size":       int,
        "kb_chunks_count":  int,
        "warnings":         [str, ...],
    }
    """
    warnings: list[str] = []

    # ── Build panel ────────────────────────────────────────────────────────────
    panel = JudgePanel(
        groq_api_key=groq_api_key,
        openrouter_api_key=openrouter_api_key,
        together_api_key=together_api_key,
    )

    if panel.active_count == 0:
        return {
            "error": (
                "No judge API keys found. Set GROQ_API_KEY, OPENROUTER_API_KEY, "
                "and/or TOGETHER_API_KEY."
            ),
            "labels": [], "accuracy": None, "confidence": [], "reasons": [],
            "votes": [], "kb_used": [], "disputed_rows": [],
            "rows_judged": 0, "rows_skipped": 0,
            "judge_panel": [], "panel_size": 0,
            "kb_chunks_count": len(kb_chunks) if kb_chunks else 0,
            "warnings": [],
        }

    if panel.active_count < 3:
        warnings.append(
            f"Only {panel.active_count}/3 judges available. "
            f"Confidence scores will be lower. Add missing API keys for full panel."
        )

    # ── Locate columns ─────────────────────────────────────────────────────────
    def _find_col(df: pd.DataFrame, *candidates: str) -> Optional[str]:
        lower = {c.lower(): c for c in df.columns}
        for cand in candidates:
            for col_low, col_orig in lower.items():
                if cand in col_low:
                    return col_orig
        return None

    input_col  = _find_col(df, "input",  "prompt",   "query",    "question",   "instruction")
    output_col = _find_col(df, "output", "response", "answer",   "completion", "result")

    if not input_col or not output_col:
        return {
            "error": "Cannot find input/output columns.",
            "labels": [], "accuracy": None, "confidence": [], "reasons": [],
            "votes": [], "kb_used": [], "disputed_rows": [],
            "rows_judged": 0, "rows_skipped": 0,
            "judge_panel": [j["name"] for j in panel.judges],
            "panel_size": panel.active_count,
            "kb_chunks_count": len(kb_chunks) if kb_chunks else 0,
            "warnings": warnings,
        }

    rows = df[[input_col, output_col]].dropna().head(max_rows)

    labels:         list[int]              = []
    confidences:    list[str]              = []
    reasons_list:   list[dict]             = []
    votes_list:     list[dict]             = []
    kb_flags:       list[bool]             = []
    disputed_rows:  list[int]              = []
    skipped:        int                    = 0
    row_index:      int                    = 0

    for _, row in rows.iterrows():
        question  = str(row[input_col]).strip()
        ai_output = str(row[output_col]).strip()

        if not question or not ai_output:
            skipped += 1
            row_index += 1
            continue

        # ── Step 1: Determine reference answer ────────────────────────────────
        kb_context = _find_kb_answer(question, kb_chunks) if kb_chunks else None

        if kb_context:
            # KB path: judge against ground truth from knowledge base
            verdict = panel.vote_on_verdict(
                question=question,
                ai_output=ai_output,
                reference=kb_context,
                reference_source="knowledge_base",
            )
            kb_used = True
        else:
            # Direct path: single-call verdict using judge's world knowledge
            # (avoids double API calls + rate limits from the generate-then-vote pattern)
            verdict = panel.vote_direct(question=question, ai_output=ai_output)
            kb_used = False

        if not verdict["votes"]:
            skipped += 1
            row_index += 1
            continue

        labels.append(1 if verdict["correct"] else 0)
        confidences.append(verdict["confidence"])
        reasons_list.append(verdict["reasons"])
        votes_list.append(verdict["votes"])
        kb_flags.append(kb_used)

        if verdict["disputed"]:
            disputed_rows.append(row_index)

        row_index += 1

    accuracy = float(sum(labels) / len(labels)) if labels else None

    return {
        "labels":          labels,
        "accuracy":        accuracy,
        "confidence":      confidences,
        "reasons":         reasons_list,
        "votes":           votes_list,
        "kb_used":         kb_flags,
        "disputed_rows":   disputed_rows,
        "rows_judged":     len(labels),
        "rows_skipped":    skipped,
        "judge_panel":     [j["name"] for j in panel.judges],
        "panel_size":      panel.active_count,
        "kb_chunks_count": len(kb_chunks) if kb_chunks else 0,
        "warnings":        warnings,
    }