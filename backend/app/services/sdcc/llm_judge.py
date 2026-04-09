"""
services/sdcc/llm_judge.py
===========================
LLM-as-a-Judge using Groq API.

Workflow
--------
1. For each (input, output) row:
   a. If knowledge-base chunks are provided, first search the KB for a relevant answer.
      - If KB contains a relevant answer → judge correctness against the KB answer.
      - If no relevant KB answer found    → fall back to pure LLM judgement.
   b. If no KB is provided → pure LLM judgement (is the output factually reasonable?).

2. Returns per-row labels (1 = correct, 0 = incorrect) and aggregate metrics.

The judge uses llama-3.3-70b-versatile via Groq for best accuracy.
"""

from __future__ import annotations
import json
import os
import re
import time
from typing import Optional

import pandas as pd

_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
_JUDGE_MODEL = "llama-3.3-70b-versatile"

# ── KB relevance threshold ──────────────────────────────────────────────────────
# Jaccard word-overlap threshold above which we consider the KB to have answered
_KB_RELEVANCE_THRESHOLD = 0.12


def _jaccard(a: str, b: str) -> float:
    """Simple word-level Jaccard similarity."""
    wa = set(a.lower().split())
    wb = set(b.lower().split())
    if not wa or not wb:
        return 0.0
    return len(wa & wb) / len(wa | wb)


def _find_kb_answer(question: str, kb_chunks: list[str]) -> Optional[str]:
    """
    Return the most relevant KB chunk for the question, or None if no chunk
    is sufficiently relevant (below _KB_RELEVANCE_THRESHOLD).
    """
    if not kb_chunks:
        return None
    best_chunk = max(kb_chunks, key=lambda c: _jaccard(question, c))
    if _jaccard(question, best_chunk) >= _KB_RELEVANCE_THRESHOLD:
        return best_chunk
    return None


def _build_judge_prompt(
    question: str,
    ai_output: str,
    kb_context: Optional[str],
) -> str:
    """Build the judge system + user messages."""
    if kb_context:
        system = (
            "You are an expert AI evaluator. You are given:\n"
            "1. A question or user prompt.\n"
            "2. A reference answer from a knowledge base.\n"
            "3. The AI system's response to the question.\n\n"
            "Your task: Determine whether the AI's response is CORRECT based on the "
            "knowledge base reference. A response is CORRECT if it is factually "
            "consistent with the reference and adequately answers the question. "
            "Minor wording differences are acceptable.\n\n"
            'Respond ONLY with valid JSON: {"correct": true|false, "reason": "<one sentence>"}'
        )
        user = (
            f"QUESTION:\n{question}\n\n"
            f"KNOWLEDGE BASE REFERENCE:\n{kb_context}\n\n"
            f"AI RESPONSE:\n{ai_output}\n\n"
            "Is the AI response correct based on the knowledge base?"
        )
    else:
        system = (
            "You are an expert AI evaluator acting as an impartial judge. "
            "You are given a question and an AI system's response.\n\n"
            "Your task: Determine whether the AI's response is CORRECT — i.e., "
            "factually accurate, coherent, helpful, and not misleading. "
            "Use your world knowledge. Do NOT penalise for style differences.\n\n"
            'Respond ONLY with valid JSON: {"correct": true|false, "reason": "<one sentence>"}'
        )
        user = (
            f"QUESTION:\n{question}\n\n"
            f"AI RESPONSE:\n{ai_output}\n\n"
            "Is the AI response correct?"
        )
    return system, user


def _call_groq_judge(
    system: str,
    user: str,
    api_key: str,
    max_retries: int = 2,
) -> Optional[dict]:
    """Call Groq and return parsed JSON or None."""
    try:
        import requests as _req
    except ImportError:
        return None

    for attempt in range(max_retries + 1):
        try:
            resp = _req.post(
                _GROQ_URL,
                json={
                    "model": _JUDGE_MODEL,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user",   "content": user},
                    ],
                    "temperature": 0.0,
                    "max_tokens": 150,
                    "response_format": {"type": "json_object"},
                },
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                timeout=15,
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            return parsed
        except Exception:
            if attempt < max_retries:
                time.sleep(1.0 * (attempt + 1))
    return None


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC API
# ─────────────────────────────────────────────────────────────────────────────

def run_llm_judge(
    df: pd.DataFrame,
    kb_chunks: Optional[list[str]] = None,
    groq_api_key: Optional[str] = None,
    max_rows: int = 200,
) -> dict:
    """
    Run LLM-as-a-Judge on every row of the DataFrame.

    Parameters
    ----------
    df            : DataFrame with columns: input, output (+ optional: task_id, latency)
    kb_chunks     : Optional list of knowledge-base text chunks
    groq_api_key  : Groq API key (falls back to GROQ_API_KEY env var)
    max_rows      : Cap to avoid runaway costs (default 200)

    Returns
    -------
    {
        "labels":          [0|1, ...],        # per-row correctness (1=correct)
        "accuracy":        float,             # proportion correct
        "reasons":         ["...", ...],      # per-row reason from judge
        "kb_used":         [True|False, ...], # whether KB was used per row
        "rows_judged":     int,
        "rows_skipped":    int,               # rows where judge failed
        "judge_model":     str,
        "kb_chunks_count": int,
    }
    """
    api_key = groq_api_key or os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        return {
            "error": "GROQ_API_KEY not set — LLM judge unavailable.",
            "labels": [],
            "accuracy": None,
            "reasons": [],
            "kb_used": [],
            "rows_judged": 0,
            "rows_skipped": 0,
            "judge_model": _JUDGE_MODEL,
            "kb_chunks_count": len(kb_chunks) if kb_chunks else 0,
        }

    # ── Find input/output columns ──────────────────────────────────────────────
    def _find_col(df, *candidates):
        lower = {c.lower(): c for c in df.columns}
        for cand in candidates:
            for col_low, col_orig in lower.items():
                if cand in col_low:
                    return col_orig
        return None

    input_col  = _find_col(df, "input",  "prompt",   "query",    "question", "instruction")
    output_col = _find_col(df, "output", "response", "answer",   "completion", "result")

    if not input_col or not output_col:
        return {
            "error": "Cannot find input/output columns for LLM judge.",
            "labels": [],
            "accuracy": None,
            "reasons": [],
            "kb_used": [],
            "rows_judged": 0,
            "rows_skipped": 0,
            "judge_model": _JUDGE_MODEL,
            "kb_chunks_count": len(kb_chunks) if kb_chunks else 0,
        }

    rows = df[[input_col, output_col]].dropna().head(max_rows)

    labels   = []
    reasons  = []
    kb_flags = []
    skipped  = 0

    for _, row in rows.iterrows():
        question  = str(row[input_col]).strip()
        ai_output = str(row[output_col]).strip()

        if not question or not ai_output:
            skipped += 1
            continue

        # KB lookup
        kb_context = _find_kb_answer(question, kb_chunks) if kb_chunks else None
        system, user = _build_judge_prompt(question, ai_output, kb_context)

        result = _call_groq_judge(system, user, api_key)
        if result is None:
            skipped += 1
            continue

        correct = bool(result.get("correct", False))
        reason  = result.get("reason", "")
        labels.append(1 if correct else 0)
        reasons.append(reason)
        kb_flags.append(kb_context is not None)

    accuracy = float(sum(labels) / len(labels)) if labels else None

    return {
        "labels":          labels,
        "accuracy":        accuracy,
        "reasons":         reasons,
        "kb_used":         kb_flags,
        "rows_judged":     len(labels),
        "rows_skipped":    skipped,
        "judge_model":     _JUDGE_MODEL,
        "kb_chunks_count": len(kb_chunks) if kb_chunks else 0,
    }