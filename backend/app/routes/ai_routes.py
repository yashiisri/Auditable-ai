# from __future__ import annotations
# import uuid
# from datetime import datetime
# from typing import Any, Dict, List, Optional

# import pandas as pd
# from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
# from pydantic import BaseModel

# from app.database import ai_collection, reports_collection, sdcc_collection
# from app.dependencies import get_current_user
# from app.services.sdcc.models import get_evaluator
# from app.services.sdcc.orchestrator import run_sdcc_pipeline
# from app.services.sdcc.metrics_calculator import calculate_metrics
# from app.services.sdcc.llm_judge import run_llm_judge

# router = APIRouter()

# # ── Schemas ────────────────────────────────────────────────────────────────────

# class ConnectorSchema(BaseModel):
#     type: str
#     endpoint: str
#     headers: Dict[str, Any] = {}


# # ── Approach 3: Enriched Registration Profile ──────────────────────────────────
# # Captured once at registration — low friction, high payoff.
# # These axes transform probe relevance dramatically (jurisdiction, user type,
# # decision stakes, data sensitivity).

# class RegistrationProfileSchema(BaseModel):
#     end_users: Optional[str] = ""
#     # e.g. "employees", "customers", "clinicians", "students", "public"

#     decision_influence: Optional[str] = ""
#     # e.g. "informational only", "recommendations", "approvals", "automated actions"

#     data_types: Optional[List[str]] = []
#     # multi-select: ["PII", "financial", "medical", "legal", "proprietary IP", "none"]

#     jurisdictions: Optional[List[str]] = []
#     # e.g. ["India", "EU", "US"] — affects which bias dimensions and regs are relevant

#     highest_stakes_failure: Optional[str] = ""
#     # freeform one sentence: "Misdiagnosis in triage", "Wrongful credit denial", etc.

#     system_prompt: Optional[str] = ""
#     # Optional: paste your system prompt for richer context (kept private)


# class AISystemSchema(BaseModel):
#     name: str
#     description: str
#     domain: str
#     connector: ConnectorSchema
#     # Approach 3: optional enriched profile — feels like config, not a questionnaire
#     profile: Optional[RegistrationProfileSchema] = None


# # ── Register AI system ─────────────────────────────────────────────────────────

# @router.post("/register-ai")
# def register_ai_system(ai_data: AISystemSchema, current_user=Depends(get_current_user)):
#     existing = ai_collection.find_one({
#         "name":     ai_data.name,
#         "owner_id": str(current_user["_id"]),
#     })
#     if existing:
#         raise HTTPException(status_code=400, detail="AI system already registered.")

#     doc = {
#         "name":        ai_data.name,
#         "description": ai_data.description,
#         "domain":      ai_data.domain,
#         "connector":   ai_data.connector.dict(),
#         "owner_id":    str(current_user["_id"]),
#         "created_at":  datetime.utcnow(),
#         "status":      "active",
#         "audit_runs":  0,
#     }

#     # Store the enriched profile if provided (Approach 3)
#     if ai_data.profile:
#         doc["registration_profile"] = ai_data.profile.dict()

#     ai_collection.insert_one(doc)
#     return {"message": "AI system registered successfully"}


# # ── Update registration profile (standalone endpoint) ─────────────────────────
# # Allows updating just the profile without re-registering the full AI system.

# @router.patch("/register-ai/{ai_name}/profile")
# def update_registration_profile(
#     ai_name:  str,
#     profile:  RegistrationProfileSchema,
#     current_user=Depends(get_current_user),
# ):
#     result = ai_collection.update_one(
#         {"name": ai_name, "owner_id": str(current_user["_id"])},
#         {"$set": {"registration_profile": profile.dict(), "profile_updated_at": datetime.utcnow()}},
#     )
#     if result.matched_count == 0:
#         raise HTTPException(status_code=404, detail="AI system not found.")
#     return {"message": "Registration profile updated successfully."}


# # ── List AI systems ────────────────────────────────────────────────────────────

# @router.get("/ai-systems")
# def list_ai_systems(current_user=Depends(get_current_user)):
#     systems = list(ai_collection.find(
#         {"owner_id": str(current_user["_id"])},
#         {"_id": 0, "connector.headers": 0},
#     ))
#     for s in systems:
#         if isinstance(s.get("created_at"), datetime):
#             s["created_at"] = s["created_at"].isoformat()
#     return {"systems": systems}


# # ── Ingest logs (primary upload) ───────────────────────────────────────────────

# @router.post("/sdcc/ingest/{ai_name}")
# def ingest_logs(
#     ai_name: str,
#     file: UploadFile = File(...),
#     merge: bool = False,
#     current_user=Depends(get_current_user),
# ):
#     result = run_sdcc_pipeline(ai_name, file, current_user)

#     if merge:
#         existing = sdcc_collection.find_one(
#             {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
#             {"sample_records": 1, "logs_ingested": 1, "_id": 0},
#         ) or {}
#         existing_recs  = existing.get("sample_records", [])
#         new_recs       = result.get("sample_records", [])
#         combined_recs  = existing_recs + new_recs
#         result["sample_records"] = combined_recs
#         result["logs_ingested"]  = len(combined_recs)

#     sdcc_collection.update_one(
#         {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
#         {"$set": {
#             **result,
#             "ai_name":    ai_name,
#             "owner_id":   str(current_user["_id"]),
#             "updated_at": datetime.utcnow(),
#             "kb_chunks":  existing.get("kb_chunks", []) if merge else [],
#         }},
#         upsert=True,
#     )
#     return {
#         **{k: v for k, v in result.items() if k != "sample_records"},
#         "merged": merge,
#     }


# # ── Ingest chat history text ───────────────────────────────────────────────────

# class ChatHistoryRequest(BaseModel):
#     text: str
#     source: str = ""

# @router.post("/sdcc/ingest-chat/{ai_name}")
# def ingest_chat_history(
#     ai_name: str,
#     payload: ChatHistoryRequest,
#     current_user=Depends(get_current_user),
# ):
#     import re, io, time

#     text = payload.text.strip()
#     if not text:
#         raise HTTPException(status_code=422, detail="No text provided.")

#     pairs: list[dict] = []
#     blocks = re.split(r'\n(?=You\n|ChatGPT\n|Assistant\n|Claude\n|Gemini\n|Human\n|AI\n)', text)
#     if len(blocks) >= 2:
#         i = 0
#         while i < len(blocks) - 1:
#             user_block = blocks[i].strip()
#             ai_block   = blocks[i + 1].strip()
#             user_match = re.match(r'^(You|Human)\n(.+)', user_block, re.DOTALL)
#             ai_match   = re.match(r'^(ChatGPT|Assistant|Claude|Gemini|AI|Copilot)\n(.+)', ai_block, re.DOTALL)
#             if user_match and ai_match:
#                 pairs.append({
#                     "input":  user_match.group(2).strip()[:2000],
#                     "output": ai_match.group(2).strip()[:2000],
#                 })
#                 i += 2
#             else:
#                 i += 1

#     if not pairs:
#         inline = re.findall(
#             r'(?:You|User|Human):\s*(.+?)(?:\n|$).*?(?:ChatGPT|Assistant|Claude|AI|Gemini|Copilot):\s*(.+?)(?=\n(?:You|User|Human):|$)',
#             text, re.DOTALL | re.IGNORECASE
#         )
#         pairs = [{"input": u.strip()[:2000], "output": a.strip()[:2000]} for u, a in inline if u.strip() and a.strip()]

#     if not pairs:
#         chunks = [c.strip() for c in re.split(r'\n{2,}', text) if c.strip()]
#         for i in range(0, len(chunks) - 1, 2):
#             pairs.append({"input": chunks[i][:2000], "output": chunks[i + 1][:2000]})

#     if not pairs:
#         raise HTTPException(
#             status_code=422,
#             detail="Could not parse conversation turns. Paste the full chat history including role labels."
#         )

#     header = "task_id,input,output,latency"
#     def esc(v: str) -> str:
#         return '"' + v.replace('"', '""') + '"'

#     rows = [
#         f"{esc(f'chat-{i+1}')},{esc(p['input'])},{esc(p['output'])},0"
#         for i, p in enumerate(pairs)
#     ]
#     csv_content = "\n".join([header] + rows).encode("utf-8")

#     import tempfile
#     with tempfile.SpooledTemporaryFile(max_size=10 * 1024 * 1024) as tmp:
#         tmp.write(csv_content)
#         tmp.seek(0)

#         class _Upload:
#             filename = f"{payload.source or 'chat'}_history.csv"
#             content_type = "text/csv"
#             file = tmp
#             def read(self): return tmp.read()

#         result = run_sdcc_pipeline(ai_name, _Upload(), current_user)

#     sdcc_collection.update_one(
#         {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
#         {"$set": {
#             **result,
#             "ai_name":    ai_name,
#             "owner_id":   str(current_user["_id"]),
#             "updated_at": datetime.utcnow(),
#             "kb_chunks":  [],
#         }},
#         upsert=True,
#     )

#     return {
#         **{k: v for k, v in result.items() if k != "sample_records"},
#         "turns_parsed": len(pairs),
#         "source": payload.source or "chat",
#     }


# # ── Upload knowledge base ──────────────────────────────────────────────────────

# @router.post("/sdcc/upload-kb/{ai_name}")
# async def upload_knowledge_base(
#     ai_name: str,
#     files: List[UploadFile] = File(...),
#     current_user=Depends(get_current_user),
# ):
#     from app.services.sdcc.models.summarization import SummarizationEvaluator
#     import io as _io

#     if isinstance(files, UploadFile):
#         files = [files]
#     if not files:
#         raise HTTPException(status_code=422, detail="No files received.")

#     all_chunks: list[str] = []
#     processed_files: list[str] = []
#     errors: list[str] = []

#     for upload in files:
#         raw_name = upload.filename or "unknown"
#         filename = raw_name.lower()
#         try:
#             content = await upload.read()
#             if not content:
#                 errors.append(f"'{raw_name}': file is empty.")
#                 continue

#             if any(filename.endswith(ext) for ext in (".txt", ".md", ".pdf", ".docx")):
#                 text = SummarizationEvaluator.extract_text_from_document(content, filename)
#             elif filename.endswith(".csv"):
#                 df_kb = pd.read_csv(_io.BytesIO(content))
#                 text = " ".join(
#                     " ".join(str(v) for v in df_kb[col].dropna().tolist())
#                     for col in df_kb.columns
#                     if not pd.api.types.is_numeric_dtype(df_kb[col])
#                 )
#             else:
#                 text = content.decode("utf-8", errors="replace")

#             if not text or not text.strip():
#                 errors.append(f"'{raw_name}': could not extract any text.")
#                 continue

#             words      = text.split()
#             chunk_size = 500
#             chunks = [
#                 " ".join(words[i : i + chunk_size])
#                 for i in range(0, len(words), chunk_size)
#                 if " ".join(words[i : i + chunk_size]).strip()
#             ]
#             if not chunks:
#                 chunks = [text.strip()]

#             all_chunks.extend(chunks)
#             processed_files.append(raw_name)

#         except Exception as exc:
#             errors.append(f"'{raw_name}': {str(exc)}")

#     sdcc_collection.update_one(
#         {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
#         {"$set": {
#             "kb_chunks":     all_chunks,
#             "kb_files":      processed_files,
#             "kb_updated_at": datetime.utcnow().isoformat(),
#         }},
#         upsert=True,
#     )

#     return {
#         "files_processed": processed_files,
#         "chunks_stored":   len(all_chunks),
#         "errors":          errors,
#         "message": (
#             f"Knowledge base updated: {len(all_chunks)} chunk(s) from "
#             f"{len(processed_files)} file(s)."
#             + (f" Errors: {len(errors)}." if errors else "")
#         ),
#     }


# # ── SDCC status ────────────────────────────────────────────────────────────────

# @router.get("/sdcc/status/{ai_name}")
# def get_sdcc_status(ai_name: str, current_user=Depends(get_current_user)):
#     doc = sdcc_collection.find_one(
#         {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
#         {"_id": 0, "sample_records": 0, "kb_chunks": 0},
#     )
#     if not doc:
#         raise HTTPException(
#             status_code=404,
#             detail="No ingested data found. Please upload logs first.",
#         )
#     return doc


# # ── Principle descriptions ─────────────────────────────────────────────────────

# _PRINCIPLE_DESCRIPTIONS: dict[str, str] = {
#     "Fairness": (
#         "AI solutions should be designed to reduce or eliminate bias against individuals, "
#         "communities, and groups. Ongoing bias monitoring and equal error rates across groups "
#         "must be maintained across the full model lifecycle."
#     ),
#     "Transparency": (
#         "AI solutions should include responsible disclosure to provide stakeholders with a "
#         "clear understanding of what is happening in each solution across the AI lifecycle, "
#         "including training data sources, model architecture, and known limitations."
#     ),
#     "Explainability": (
#         "AI solutions should be developed and delivered in a way that answers the questions "
#         "of how and why a conclusion was drawn from the solution. Outputs must be interpretable "
#         "to non-technical users, regulators, and affected individuals."
#     ),
#     "Accountability": (
#         "Human oversight and responsibility should be embedded across the AI lifecycle to manage "
#         "risk and comply with applicable laws and regulations. Clear governance structures, audit "
#         "trails, and escalation procedures must assign and enforce accountability."
#     ),
#     "Data Integrity": (
#         "Data used in AI solutions should be assessed for accuracy, completeness, "
#         "appropriateness, and quality to drive trusted decisions."
#     ),
#     "Reliability": (
#         "AI solutions should consistently operate in accordance with their intended purpose and "
#         "scope and at the desired level of precision. Performance degradation, failures, and "
#         "edge cases must be actively monitored and SLA compliance maintained."
#     ),
#     "Security": (
#         "Robust and resilient practices should be implemented to safeguard AI solutions against "
#         "bad actors, misinformation, or adverse events. A defence-in-depth approach covering "
#         "input validation, output filtering, adversarial robustness, and continuous red-teaming."
#     ),
#     "Safety": (
#         "AI solutions should be designed and implemented to safeguard against harm to people, "
#         "businesses, and property. Safety must be embedded across the full AI lifecycle through "
#         "proactive risk assessment, harm prevention controls, and human override mechanisms."
#     ),
#     "Privacy": (
#         "AI solutions should be designed to comply with applicable privacy and data protection "
#         "laws and regulations. Data minimisation, purpose limitation, consent management, "
#         "anonymisation, and right-to-erasure must be embedded by design."
#     ),
#     "Sustainability": (
#         "AI solutions should be designed to be energy efficient, reduce carbon emissions, and "
#         "support a cleaner environment. Efficient model architectures, optimised training and "
#         "inference pipelines, and responsible resource allocation reduce climate impact."
#     ),
# }

# _COMPLIANCE_THRESHOLDS: dict[str, dict[str, int]] = {
#     "classification":       {"EU_AI_Act": 75, "ISO_42001": 80, "NIST_AI_RMF": 70},
#     "rag":                  {"EU_AI_Act": 70, "ISO_42001": 75, "NIST_AI_RMF": 65},
#     "summarization":        {"EU_AI_Act": 70, "ISO_42001": 75, "NIST_AI_RMF": 65},
#     "general_llm":          {"EU_AI_Act": 70, "ISO_42001": 75, "NIST_AI_RMF": 65},
#     "automation":           {"EU_AI_Act": 80, "ISO_42001": 85, "NIST_AI_RMF": 75},
#     "image_classification": {"EU_AI_Act": 75, "ISO_42001": 80, "NIST_AI_RMF": 70},
# }

# _METRIC_LIBRARY_MAP: dict[str, str] = {
#     "rouge_l":             "rouge_score library (fallback: n-gram LCS overlap)",
#     "rouge_1":             "rouge_score library (fallback: unigram overlap)",
#     "rouge_2":             "rouge_score library (fallback: bigram overlap)",
#     "bleu":                "sacrebleu corpus BLEU (fallback: smoothed BLEU-4)",
#     "bertscore":           "sentence_transformers cosine sim (fallback: token F1)",
#     "faithfulness":        "sentence_transformers cosine sim (fallback: Jaccard)",
#     "answer_relevance":    "sentence_transformers cosine sim (fallback: Jaccard)",
#     "context_recall":      "unigram token recall (reference ∩ context / reference)",
#     "hallucination_rate":  "1 − faithfulness score",
#     "context_coverage":    "proportion of rows with KB/context available",
#     "reference_coverage":  "proportion of rows with reference summaries",
#     "coverage_score":      "TF-IDF key-sentence coverage (source → summary)",
#     "density_score":       "trigram copy-rate density (extractive vs abstractive)",
#     "compression_ratio":   "output token count / input token count",
#     "summary_redundancy":  "1 − bigram repetition rate within summaries",
#     "toxicity_rate":       "Detoxify classifier (fallback: expanded keyword heuristic)",
#     "safety_pass_rate":    "1 − toxicity_rate",
#     "avg_coherence":       "sentence-length + TTR + discourse markers + Flesch (textstat)",
#     "avg_perplexity":      "vocabulary entropy proxy (unigram distribution)",
#     "roc_auc":             "scikit-learn roc_auc_score (requires binary confidence col)",
#     "f1_score":            "scikit-learn f1_score (fallback: manual macro-F1)",
#     "precision":           "scikit-learn precision_score (fallback: manual)",
#     "recall":              "scikit-learn recall_score (fallback: manual)",
#     "class_balance":       "min/max class count ratio",
#     "avg_confidence":      "mean of confidence/probability column",
#     "accuracy":            "LLM-judge (Groq llama-3.3-70b) correctness rate",
#     "judge_accuracy":      "LLM-judge (Groq llama-3.3-70b) correctness rate",
#     "step_success_rate":   "explicit boolean col or keyword inference from output text",
#     "task_completion_rate": "same as step_success_rate",
#     "error_rate":          "1 − step_success_rate",
#     "avg_retry_rate":      "mean of retry_count column",
#     "avg_step_latency_ms": "mean of latency/duration column (ms)",
#     "map_score":           "mean of map column (fallback: confidence × 0.85)",
#     "avg_iou":             "mean of iou column (fallback: confidence × 0.90)",
#     "top_k_accuracy":      "proportion of predictions with confidence ≥ 0.5",
#     "label_coverage":      "proportion of rows with non-null ground-truth label",
#     "avg_inference_ms":    "mean of latency/inference_time column (ms)",
#     "avg_latency_ms":      "mean of latency/response_time column (ms)",
# }


# # ── Evaluate ───────────────────────────────────────────────────────────────────

# @router.post("/evaluate/{ai_name}")
# def evaluate_ai(
#     ai_name: str,
#     include_blackbox: bool = True,
#     current_user=Depends(get_current_user),
# ):
#     sdcc_doc = sdcc_collection.find_one({
#         "ai_name":  ai_name,
#         "owner_id": str(current_user["_id"]),
#     })
#     if not sdcc_doc:
#         raise HTTPException(
#             status_code=404,
#             detail="No ingested data found. Please upload logs first via /sdcc/ingest.",
#         )

#     model_type  = sdcc_doc.get("model_type",  "general_llm")
#     logs_count  = sdcc_doc.get("logs_ingested", 0)
#     dq_score    = sdcc_doc.get("data_quality_score", 0)
#     struct_risk = sdcc_doc.get("structural_risk", "Unknown")
#     diagnostics = sdcc_doc.get("diagnostics", {})
#     det_conf    = sdcc_doc.get("detection_confidence", 0.0)
#     sample_recs = sdcc_doc.get("sample_records", [])
#     kb_chunks   = sdcc_doc.get("kb_chunks", [])

#     blackbox_rows: list[dict] = []
#     blackbox_source_info: dict = {}

#     if include_blackbox:
#         from app.database import db as _db
#         _bb_col = _db["blackbox_audits"]
#         bb_doc  = _bb_col.find_one(
#             {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
#             sort=[("created_at", -1)],
#         )
#         if bb_doc and bb_doc.get("probe_results"):
#             for pr in bb_doc["probe_results"]:
#                 prompt   = pr.get("prompt", "").strip()
#                 response = pr.get("response", "").strip()
#                 if prompt and response and not response.startswith("["):
#                     blackbox_rows.append({
#                         "input":   prompt,
#                         "output":  response,
#                         "task_id": pr.get("probe_id", ""),
#                         "latency": pr.get("latency_ms", 0),
#                         "_source": "blackbox",
#                     })
#             blackbox_source_info = {
#                 "audit_id":    bb_doc.get("audit_id", ""),
#                 "probes_used": len(blackbox_rows),
#                 "started_at":  str(bb_doc.get("started_at", "")),
#             }

#     seen_task_ids: set = set()
#     combined_recs: list = []
#     for row in sample_recs + blackbox_rows:
#         tid = row.get("task_id", "") or ""
#         if tid and tid in seen_task_ids:
#             continue
#         if tid:
#             seen_task_ids.add(tid)
#         combined_recs.append(row)

#     logs_count = len(combined_recs)
#     df = pd.DataFrame(combined_recs) if combined_recs else pd.DataFrame()

#     judge_result: dict = {}
#     judge_labels: list = []

#     if not df.empty:
#         judge_result = run_llm_judge(
#             df=df,
#             kb_chunks=kb_chunks if kb_chunks else None,
#             max_rows=200,
#         )
#         judge_labels = judge_result.get("labels", [])

#         if judge_labels:
#             label_series = pd.Series(
#                 judge_labels + [None] * max(0, len(df) - len(judge_labels)),
#                 index=df.index[:len(df)]
#             )
#             df["_judge_label"] = label_series

#     computed_values: dict = {}
#     computation_notes: dict = {}

#     if not df.empty:
#         try:
#             computed_values = calculate_metrics(
#                 model_type, df,
#                 kb_chunks=kb_chunks if kb_chunks else None,
#             )

#             if judge_result.get("accuracy") is not None:
#                 computed_values["accuracy"]      = judge_result["accuracy"]
#                 computed_values["judge_accuracy"] = judge_result["accuracy"]

#             for metric_key, value in computed_values.items():
#                 library = _METRIC_LIBRARY_MAP.get(metric_key, "computed from text/data")
#                 status  = "computed" if value is not None else "unavailable (missing data)"
#                 computation_notes[metric_key] = {
#                     "library": library,
#                     "status":  status,
#                     "value":   round(value, 4) if value is not None else None,
#                 }
#         except Exception as exc:
#             computation_notes["_error"] = str(exc)

#     EvaluatorClass = get_evaluator(model_type)
#     evaluator      = EvaluatorClass()

#     model_metrics = evaluator.model_metrics(df, computed=computed_values)
#     principles = evaluator.taf_principles(diagnostics, logs_count, model_metrics, df=df)
#     for name in principles:
#         principles[name]["description"] = _PRINCIPLE_DESCRIPTIONS.get(name, "")

#     overall = evaluator.clamp(
#         sum(p["score"] for p in principles.values()) / max(len(principles), 1)
#     )

#     risk_analysis = evaluator.compute_risk_analysis(principles, diagnostics, logs_count, model_metrics)
#     risk_level = risk_analysis["overall_risk_level"]
#     findings   = evaluator.generate_findings(principles, model_metrics)

#     thr = _COMPLIANCE_THRESHOLDS.get(model_type, _COMPLIANCE_THRESHOLDS["general_llm"])
#     framework_compliance = {
#         "EU_AI_Act":   "Compliant"       if overall >= thr["EU_AI_Act"]   else "Conditional",
#         "ISO_42001":   "Certified Ready" if overall >= thr["ISO_42001"]   else "Conditional",
#         "NIST_AI_RMF": "Aligned"         if overall >= thr["NIST_AI_RMF"] else "Conditional",
#         "KPMG_TAF":    "Assessed",
#     }

#     _ts = datetime.utcnow()
#     _safe_name = "".join(c if c.isalnum() else "-" for c in ai_name.strip()).strip("-")
#     _safe_name = "-".join(p for p in _safe_name.split("-") if p)[:40]
#     report_id  = f"{_safe_name}-{_ts.strftime('%H%M')}"
#     report_doc = {
#         "report_id":            report_id,
#         "ai_name":              ai_name,
#         "model_type":           model_type,
#         "model_label":          evaluator.LABEL,
#         "detection_confidence": det_conf,
#         "evaluated_at":         datetime.utcnow().isoformat(),
#         "overall_score":        overall,
#         "risk_level":           risk_level,
#         "structural_risk":      struct_risk,
#         "logs_evaluated":       logs_count,
#         "data_quality_score":   dq_score,
#         "trusted_ai_principles": principles,
#         "diagnostics":          diagnostics,
#         "model_metrics":        model_metrics,
#         "computation_notes":    computation_notes,
#         "llm_judge": {
#             "rows_judged":     judge_result.get("rows_judged", 0),
#             "rows_skipped":    judge_result.get("rows_skipped", 0),
#             "accuracy":        judge_result.get("accuracy"),
#             "judge_model":     judge_result.get("judge_model", ""),
#             "kb_chunks_used":  judge_result.get("kb_chunks_count", 0),
#             "kb_grounded":     bool(kb_chunks),
#             "error":           judge_result.get("error"),
#             "panel_size":      judge_result.get("panel_size", 0),
#             "judge_panel":     judge_result.get("judge_panel", []),
#             "warnings":        judge_result.get("warnings", []),
#         },
#         "audit_sources": {
#             "uploaded_logs":   len(sample_recs),
#             "blackbox_probes": len(blackbox_rows),
#             "combined_total":  logs_count,
#             "blackbox_info":   blackbox_source_info,
#         },
#         "findings":             findings,
#         "risk_analysis":        risk_analysis,
#         "recommendation":       sdcc_doc.get("recommendation", ""),
#         "framework_compliance": framework_compliance,
#         "column_warnings":      sdcc_doc.get("column_warnings", []),
#         "owner_id":             str(current_user["_id"]),
#         "created_at":           datetime.utcnow(),
#     }

#     result = reports_collection.insert_one(report_doc)
#     report_doc["_id"] = str(result.inserted_id)

#     ai_collection.update_one(
#         {"name": ai_name, "owner_id": str(current_user["_id"])},
#         {"$inc": {"audit_runs": 1}},
#     )

#     return report_doc


from __future__ import annotations
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.database import ai_collection, reports_collection, sdcc_collection
from app.dependencies import get_current_user
from app.services.sdcc.models import get_evaluator
from app.services.sdcc.orchestrator import run_sdcc_pipeline
from app.services.sdcc.metrics_calculator import calculate_metrics
from app.services.sdcc.llm_judge import run_llm_judge

router = APIRouter()

# ── Schemas ────────────────────────────────────────────────────────────────────

class ConnectorSchema(BaseModel):
    type: str
    endpoint: str
    headers: Dict[str, Any] = {}


# ── Approach 3: Enriched Registration Profile ──────────────────────────────────
# Captured once at registration — low friction, high payoff.
# These axes transform probe relevance dramatically (jurisdiction, user type,
# decision stakes, data sensitivity).

class RegistrationProfileSchema(BaseModel):
    end_users: Optional[str] = ""
    # e.g. "employees", "customers", "clinicians", "students", "public"

    decision_influence: Optional[str] = ""
    # e.g. "informational only", "recommendations", "approvals", "automated actions"

    data_types: Optional[List[str]] = []
    # multi-select: ["PII", "financial", "medical", "legal", "proprietary IP", "none"]

    jurisdictions: Optional[List[str]] = []
    # e.g. ["India", "EU", "US"] — affects which bias dimensions and regs are relevant

    highest_stakes_failure: Optional[str] = ""
    # freeform one sentence: "Misdiagnosis in triage", "Wrongful credit denial", etc.

    system_prompt: Optional[str] = ""
    # Optional: paste your system prompt for richer context (kept private)


class AISystemSchema(BaseModel):
    name: str
    description: str
    domain: str
    connector: ConnectorSchema
    # Approach 3: optional enriched profile — feels like config, not a questionnaire
    profile: Optional[RegistrationProfileSchema] = None


# ── Register AI system ─────────────────────────────────────────────────────────

@router.post("/register-ai")
def register_ai_system(ai_data: AISystemSchema, current_user=Depends(get_current_user)):
    existing = ai_collection.find_one({
        "name":     ai_data.name,
        "owner_id": str(current_user["_id"]),
    })
    if existing:
        raise HTTPException(status_code=400, detail="AI system already registered.")

    doc = {
        "name":        ai_data.name,
        "description": ai_data.description,
        "domain":      ai_data.domain,
        "connector":   ai_data.connector.dict(),
        "owner_id":    str(current_user["_id"]),
        "created_at":  datetime.utcnow(),
        "status":      "active",
        "audit_runs":  0,
    }

    # Store the enriched profile if provided (Approach 3)
    if ai_data.profile:
        doc["registration_profile"] = ai_data.profile.dict()

    ai_collection.insert_one(doc)
    return {"message": "AI system registered successfully"}


# ── Update registration profile (standalone endpoint) ─────────────────────────
# Allows updating just the profile without re-registering the full AI system.

@router.patch("/register-ai/{ai_name}/profile")
def update_registration_profile(
    ai_name:  str,
    profile:  RegistrationProfileSchema,
    current_user=Depends(get_current_user),
):
    result = ai_collection.update_one(
        {"name": ai_name, "owner_id": str(current_user["_id"])},
        {"$set": {"registration_profile": profile.dict(), "profile_updated_at": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="AI system not found.")
    return {"message": "Registration profile updated successfully."}


# ── List AI systems ────────────────────────────────────────────────────────────

@router.get("/ai-systems")
def list_ai_systems(current_user=Depends(get_current_user)):
    systems = list(ai_collection.find(
        {"owner_id": str(current_user["_id"])},
        {"_id": 0, "connector.headers": 0},
    ))
    for s in systems:
        if isinstance(s.get("created_at"), datetime):
            s["created_at"] = s["created_at"].isoformat()
    return {"systems": systems}


# ── Ingest logs (primary upload) ───────────────────────────────────────────────

@router.post("/sdcc/ingest/{ai_name}")
def ingest_logs(
    ai_name: str,
    file: UploadFile = File(...),
    merge: bool = False,
    current_user=Depends(get_current_user),
):
    # Fetch registered AI context so the detector can use description/domain as a prior
    ai_doc = ai_collection.find_one(
        {"name": ai_name, "owner_id": str(current_user["_id"])},
        {"description": 1, "domain": 1, "_id": 0},
    ) or {}
    ai_description = ai_doc.get("description", "")
    ai_domain      = ai_doc.get("domain", "")

    result = run_sdcc_pipeline(ai_name, file, current_user,
                               ai_description=ai_description, ai_domain=ai_domain)

    if merge:
        existing = sdcc_collection.find_one(
            {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
            {"sample_records": 1, "logs_ingested": 1, "_id": 0},
        ) or {}
        existing_recs  = existing.get("sample_records", [])
        new_recs       = result.get("sample_records", [])
        combined_recs  = existing_recs + new_recs
        result["sample_records"] = combined_recs
        result["logs_ingested"]  = len(combined_recs)

    sdcc_collection.update_one(
        {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
        {"$set": {
            **result,
            "ai_name":    ai_name,
            "owner_id":   str(current_user["_id"]),
            "updated_at": datetime.utcnow(),
            "kb_chunks":  existing.get("kb_chunks", []) if merge else [],
        }},
        upsert=True,
    )
    return {
        **{k: v for k, v in result.items() if k != "sample_records"},
        "merged": merge,
    }


# ── Ingest chat history text ───────────────────────────────────────────────────

class ChatHistoryRequest(BaseModel):
    text: str
    source: str = ""

@router.post("/sdcc/ingest-chat/{ai_name}")
def ingest_chat_history(
    ai_name: str,
    payload: ChatHistoryRequest,
    current_user=Depends(get_current_user),
):
    import re, io, time

    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="No text provided.")

    pairs: list[dict] = []
    blocks = re.split(r'\n(?=You\n|ChatGPT\n|Assistant\n|Claude\n|Gemini\n|Human\n|AI\n)', text)
    if len(blocks) >= 2:
        i = 0
        while i < len(blocks) - 1:
            user_block = blocks[i].strip()
            ai_block   = blocks[i + 1].strip()
            user_match = re.match(r'^(You|Human)\n(.+)', user_block, re.DOTALL)
            ai_match   = re.match(r'^(ChatGPT|Assistant|Claude|Gemini|AI|Copilot)\n(.+)', ai_block, re.DOTALL)
            if user_match and ai_match:
                pairs.append({
                    "input":  user_match.group(2).strip()[:2000],
                    "output": ai_match.group(2).strip()[:2000],
                })
                i += 2
            else:
                i += 1

    if not pairs:
        inline = re.findall(
            r'(?:You|User|Human):\s*(.+?)(?:\n|$).*?(?:ChatGPT|Assistant|Claude|AI|Gemini|Copilot):\s*(.+?)(?=\n(?:You|User|Human):|$)',
            text, re.DOTALL | re.IGNORECASE
        )
        pairs = [{"input": u.strip()[:2000], "output": a.strip()[:2000]} for u, a in inline if u.strip() and a.strip()]

    if not pairs:
        chunks = [c.strip() for c in re.split(r'\n{2,}', text) if c.strip()]
        for i in range(0, len(chunks) - 1, 2):
            pairs.append({"input": chunks[i][:2000], "output": chunks[i + 1][:2000]})

    if not pairs:
        raise HTTPException(
            status_code=422,
            detail="Could not parse conversation turns. Paste the full chat history including role labels."
        )

    header = "task_id,input,output,latency"
    def esc(v: str) -> str:
        return '"' + v.replace('"', '""') + '"'

    rows = [
        f"{esc(f'chat-{i+1}')},{esc(p['input'])},{esc(p['output'])},0"
        for i, p in enumerate(pairs)
    ]
    csv_content = "\n".join([header] + rows).encode("utf-8")

    import tempfile
    with tempfile.SpooledTemporaryFile(max_size=10 * 1024 * 1024) as tmp:
        tmp.write(csv_content)
        tmp.seek(0)

        class _Upload:
            filename = f"{payload.source or 'chat'}_history.csv"
            content_type = "text/csv"
            file = tmp
            def read(self): return tmp.read()

        # Fetch registered AI context for accurate model type detection
        _ai_doc = ai_collection.find_one(
            {"name": ai_name, "owner_id": str(current_user["_id"])},
            {"description": 1, "domain": 1, "_id": 0},
        ) or {}
        result = run_sdcc_pipeline(
            ai_name, _Upload(), current_user,
            ai_description=_ai_doc.get("description", ""),
            ai_domain=_ai_doc.get("domain", ""),
        )

    sdcc_collection.update_one(
        {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
        {"$set": {
            **result,
            "ai_name":    ai_name,
            "owner_id":   str(current_user["_id"]),
            "updated_at": datetime.utcnow(),
            "kb_chunks":  [],
        }},
        upsert=True,
    )

    return {
        **{k: v for k, v in result.items() if k != "sample_records"},
        "turns_parsed": len(pairs),
        "source": payload.source or "chat",
    }


# ── Upload knowledge base ──────────────────────────────────────────────────────

@router.post("/sdcc/upload-kb/{ai_name}")
async def upload_knowledge_base(
    ai_name: str,
    files: List[UploadFile] = File(...),
    current_user=Depends(get_current_user),
):
    from app.services.sdcc.models.summarization import SummarizationEvaluator
    import io as _io

    if isinstance(files, UploadFile):
        files = [files]
    if not files:
        raise HTTPException(status_code=422, detail="No files received.")

    all_chunks: list[str] = []
    processed_files: list[str] = []
    errors: list[str] = []

    for upload in files:
        raw_name = upload.filename or "unknown"
        filename = raw_name.lower()
        try:
            content = await upload.read()
            if not content:
                errors.append(f"'{raw_name}': file is empty.")
                continue

            if any(filename.endswith(ext) for ext in (".txt", ".md", ".pdf", ".docx")):
                text = SummarizationEvaluator.extract_text_from_document(content, filename)
            elif filename.endswith(".csv"):
                df_kb = pd.read_csv(_io.BytesIO(content))
                text = " ".join(
                    " ".join(str(v) for v in df_kb[col].dropna().tolist())
                    for col in df_kb.columns
                    if not pd.api.types.is_numeric_dtype(df_kb[col])
                )
            else:
                text = content.decode("utf-8", errors="replace")

            if not text or not text.strip():
                errors.append(f"'{raw_name}': could not extract any text.")
                continue

            words      = text.split()
            chunk_size = 500
            chunks = [
                " ".join(words[i : i + chunk_size])
                for i in range(0, len(words), chunk_size)
                if " ".join(words[i : i + chunk_size]).strip()
            ]
            if not chunks:
                chunks = [text.strip()]

            all_chunks.extend(chunks)
            processed_files.append(raw_name)

        except Exception as exc:
            errors.append(f"'{raw_name}': {str(exc)}")

    sdcc_collection.update_one(
        {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
        {"$set": {
            "kb_chunks":     all_chunks,
            "kb_files":      processed_files,
            "kb_updated_at": datetime.utcnow().isoformat(),
        }},
        upsert=True,
    )

    return {
        "files_processed": processed_files,
        "chunks_stored":   len(all_chunks),
        "errors":          errors,
        "message": (
            f"Knowledge base updated: {len(all_chunks)} chunk(s) from "
            f"{len(processed_files)} file(s)."
            + (f" Errors: {len(errors)}." if errors else "")
        ),
    }


# ── SDCC status ────────────────────────────────────────────────────────────────

@router.get("/sdcc/status/{ai_name}")
def get_sdcc_status(ai_name: str, current_user=Depends(get_current_user)):
    doc = sdcc_collection.find_one(
        {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
        {"_id": 0, "sample_records": 0, "kb_chunks": 0},
    )
    if not doc:
        raise HTTPException(
            status_code=404,
            detail="No ingested data found. Please upload logs first.",
        )
    return doc


# ── Principle descriptions ─────────────────────────────────────────────────────

_PRINCIPLE_DESCRIPTIONS: dict[str, str] = {
    "Fairness": (
        "AI solutions should be designed to reduce or eliminate bias against individuals, "
        "communities, and groups. Ongoing bias monitoring and equal error rates across groups "
        "must be maintained across the full model lifecycle."
    ),
    "Transparency": (
        "AI solutions should include responsible disclosure to provide stakeholders with a "
        "clear understanding of what is happening in each solution across the AI lifecycle, "
        "including training data sources, model architecture, and known limitations."
    ),
    "Explainability": (
        "AI solutions should be developed and delivered in a way that answers the questions "
        "of how and why a conclusion was drawn from the solution. Outputs must be interpretable "
        "to non-technical users, regulators, and affected individuals."
    ),
    "Accountability": (
        "Human oversight and responsibility should be embedded across the AI lifecycle to manage "
        "risk and comply with applicable laws and regulations. Clear governance structures, audit "
        "trails, and escalation procedures must assign and enforce accountability."
    ),
    "Data Integrity": (
        "Data used in AI solutions should be assessed for accuracy, completeness, "
        "appropriateness, and quality to drive trusted decisions."
    ),
    "Reliability": (
        "AI solutions should consistently operate in accordance with their intended purpose and "
        "scope and at the desired level of precision. Performance degradation, failures, and "
        "edge cases must be actively monitored and SLA compliance maintained."
    ),
    "Security": (
        "Robust and resilient practices should be implemented to safeguard AI solutions against "
        "bad actors, misinformation, or adverse events. A defence-in-depth approach covering "
        "input validation, output filtering, adversarial robustness, and continuous red-teaming."
    ),
    "Safety": (
        "AI solutions should be designed and implemented to safeguard against harm to people, "
        "businesses, and property. Safety must be embedded across the full AI lifecycle through "
        "proactive risk assessment, harm prevention controls, and human override mechanisms."
    ),
    "Privacy": (
        "AI solutions should be designed to comply with applicable privacy and data protection "
        "laws and regulations. Data minimisation, purpose limitation, consent management, "
        "anonymisation, and right-to-erasure must be embedded by design."
    ),
    "Sustainability": (
        "AI solutions should be designed to be energy efficient, reduce carbon emissions, and "
        "support a cleaner environment. Efficient model architectures, optimised training and "
        "inference pipelines, and responsible resource allocation reduce climate impact."
    ),
}

_COMPLIANCE_THRESHOLDS: dict[str, dict[str, int]] = {
    "classification":       {"EU_AI_Act": 75, "ISO_42001": 80, "NIST_AI_RMF": 70},
    "rag":                  {"EU_AI_Act": 70, "ISO_42001": 75, "NIST_AI_RMF": 65},
    "summarization":        {"EU_AI_Act": 70, "ISO_42001": 75, "NIST_AI_RMF": 65},
    "general_llm":          {"EU_AI_Act": 70, "ISO_42001": 75, "NIST_AI_RMF": 65},
    "automation":           {"EU_AI_Act": 80, "ISO_42001": 85, "NIST_AI_RMF": 75},
    "image_classification": {"EU_AI_Act": 75, "ISO_42001": 80, "NIST_AI_RMF": 70},
}

_METRIC_LIBRARY_MAP: dict[str, str] = {
    "rouge_l":             "rouge_score library (fallback: n-gram LCS overlap)",
    "rouge_1":             "rouge_score library (fallback: unigram overlap)",
    "rouge_2":             "rouge_score library (fallback: bigram overlap)",
    "bleu":                "sacrebleu corpus BLEU (fallback: smoothed BLEU-4)",
    "bertscore":           "sentence_transformers cosine sim (fallback: token F1)",
    "faithfulness":        "sentence_transformers cosine sim (fallback: Jaccard)",
    "answer_relevance":    "sentence_transformers cosine sim (fallback: Jaccard)",
    "context_recall":      "unigram token recall (reference ∩ context / reference)",
    "hallucination_rate":  "1 − faithfulness score",
    "context_coverage":    "proportion of rows with KB/context available",
    "reference_coverage":  "proportion of rows with reference summaries",
    "coverage_score":      "TF-IDF key-sentence coverage (source → summary)",
    "density_score":       "trigram copy-rate density (extractive vs abstractive)",
    "compression_ratio":   "output token count / input token count",
    "summary_redundancy":  "1 − bigram repetition rate within summaries",
    "toxicity_rate":       "Detoxify classifier (fallback: expanded keyword heuristic)",
    "safety_pass_rate":    "1 − toxicity_rate",
    "avg_coherence":       "sentence-length + TTR + discourse markers + Flesch (textstat)",
    "avg_perplexity":      "vocabulary entropy proxy (unigram distribution)",
    "roc_auc":             "scikit-learn roc_auc_score (requires binary confidence col)",
    "f1_score":            "scikit-learn f1_score (fallback: manual macro-F1)",
    "precision":           "scikit-learn precision_score (fallback: manual)",
    "recall":              "scikit-learn recall_score (fallback: manual)",
    "class_balance":       "min/max class count ratio",
    "avg_confidence":      "mean of confidence/probability column",
    "accuracy":            "LLM-judge (Groq llama-3.3-70b) correctness rate",
    "judge_accuracy":      "LLM-judge (Groq llama-3.3-70b) correctness rate",
    "step_success_rate":   "explicit boolean col or keyword inference from output text",
    "task_completion_rate": "same as step_success_rate",
    "error_rate":          "1 − step_success_rate",
    "avg_retry_rate":      "mean of retry_count column",
    "avg_step_latency_ms": "mean of latency/duration column (ms)",
    "map_score":           "mean of map column (fallback: confidence × 0.85)",
    "avg_iou":             "mean of iou column (fallback: confidence × 0.90)",
    "top_k_accuracy":      "proportion of predictions with confidence ≥ 0.5",
    "label_coverage":      "proportion of rows with non-null ground-truth label",
    "avg_inference_ms":    "mean of latency/inference_time column (ms)",
    "avg_latency_ms":      "mean of latency/response_time column (ms)",
}


# ── Evaluate ───────────────────────────────────────────────────────────────────

@router.post("/evaluate/{ai_name}")
def evaluate_ai(
    ai_name: str,
    include_blackbox: bool = True,
    current_user=Depends(get_current_user),
):
    sdcc_doc = sdcc_collection.find_one({
        "ai_name":  ai_name,
        "owner_id": str(current_user["_id"]),
    })
    if not sdcc_doc:
        raise HTTPException(
            status_code=404,
            detail="No ingested data found. Please upload logs first via /sdcc/ingest.",
        )

    model_type  = sdcc_doc.get("model_type",  "general_llm")
    logs_count  = sdcc_doc.get("logs_ingested", 0)
    dq_score    = sdcc_doc.get("data_quality_score", 0)
    struct_risk = sdcc_doc.get("structural_risk", "Unknown")
    diagnostics = sdcc_doc.get("diagnostics", {})
    det_conf    = sdcc_doc.get("detection_confidence", 0.0)
    sample_recs = sdcc_doc.get("sample_records", [])
    kb_chunks   = sdcc_doc.get("kb_chunks", [])

    blackbox_rows: list[dict] = []
    blackbox_source_info: dict = {}

    if include_blackbox:
        from app.database import db as _db
        _bb_col = _db["blackbox_audits"]
        bb_doc  = _bb_col.find_one(
            {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
            sort=[("created_at", -1)],
        )
        if bb_doc and bb_doc.get("probe_results"):
            for pr in bb_doc["probe_results"]:
                prompt   = pr.get("prompt", "").strip()
                response = pr.get("response", "").strip()
                if prompt and response and not response.startswith("["):
                    blackbox_rows.append({
                        "input":   prompt,
                        "output":  response,
                        "task_id": pr.get("probe_id", ""),
                        "latency": pr.get("latency_ms", 0),
                        "_source": "blackbox",
                    })
            blackbox_source_info = {
                "audit_id":    bb_doc.get("audit_id", ""),
                "probes_used": len(blackbox_rows),
                "started_at":  str(bb_doc.get("started_at", "")),
            }

    seen_task_ids: set = set()
    combined_recs: list = []
    for row in sample_recs + blackbox_rows:
        tid = row.get("task_id", "") or ""
        if tid and tid in seen_task_ids:
            continue
        if tid:
            seen_task_ids.add(tid)
        combined_recs.append(row)

    logs_count = len(combined_recs)
    df = pd.DataFrame(combined_recs) if combined_recs else pd.DataFrame()

    judge_result: dict = {}
    judge_labels: list = []

    if not df.empty:
        judge_result = run_llm_judge(
            df=df,
            kb_chunks=kb_chunks if kb_chunks else None,
            max_rows=200,
        )
        judge_labels = judge_result.get("labels", [])

        if judge_labels:
            label_series = pd.Series(
                judge_labels + [None] * max(0, len(df) - len(judge_labels)),
                index=df.index[:len(df)]
            )
            df["_judge_label"] = label_series

    computed_values: dict = {}
    computation_notes: dict = {}

    if not df.empty:
        try:
            computed_values = calculate_metrics(
                model_type, df,
                kb_chunks=kb_chunks if kb_chunks else None,
            )

            if judge_result.get("accuracy") is not None:
                computed_values["accuracy"]      = judge_result["accuracy"]
                computed_values["judge_accuracy"] = judge_result["accuracy"]

            for metric_key, value in computed_values.items():
                library = _METRIC_LIBRARY_MAP.get(metric_key, "computed from text/data")
                status  = "computed" if value is not None else "unavailable (missing data)"
                computation_notes[metric_key] = {
                    "library": library,
                    "status":  status,
                    "value":   round(value, 4) if value is not None else None,
                }
        except Exception as exc:
            computation_notes["_error"] = str(exc)

    EvaluatorClass = get_evaluator(model_type)
    evaluator      = EvaluatorClass()

    model_metrics = evaluator.model_metrics(df, computed=computed_values)
    principles = evaluator.taf_principles(diagnostics, logs_count, model_metrics, df=df)
    for name in principles:
        principles[name]["description"] = _PRINCIPLE_DESCRIPTIONS.get(name, "")

    overall = evaluator.clamp(
        sum(p["score"] for p in principles.values()) / max(len(principles), 1)
    )

    risk_analysis = evaluator.compute_risk_analysis(principles, diagnostics, logs_count, model_metrics)
    risk_level = risk_analysis["overall_risk_level"]
    findings   = evaluator.generate_findings(principles, model_metrics)

    thr = _COMPLIANCE_THRESHOLDS.get(model_type, _COMPLIANCE_THRESHOLDS["general_llm"])
    framework_compliance = {
        "EU_AI_Act":   "Compliant"       if overall >= thr["EU_AI_Act"]   else "Conditional",
        "ISO_42001":   "Certified Ready" if overall >= thr["ISO_42001"]   else "Conditional",
        "NIST_AI_RMF": "Aligned"         if overall >= thr["NIST_AI_RMF"] else "Conditional",
        "KPMG_TAF":    "Assessed",
    }

    _ts = datetime.utcnow()
    _safe_name = "".join(c if c.isalnum() else "-" for c in ai_name.strip()).strip("-")
    _safe_name = "-".join(p for p in _safe_name.split("-") if p)[:40]
    report_id  = f"{_safe_name}-{_ts.strftime('%H%M')}"
    report_doc = {
        "report_id":            report_id,
        "ai_name":              ai_name,
        "model_type":           model_type,
        "model_label":          evaluator.LABEL,
        "detection_confidence": det_conf,
        "evaluated_at":         datetime.utcnow().isoformat(),
        "overall_score":        overall,
        "risk_level":           risk_level,
        "structural_risk":      struct_risk,
        "logs_evaluated":       logs_count,
        "data_quality_score":   dq_score,
        "trusted_ai_principles": principles,
        "diagnostics":          diagnostics,
        "model_metrics":        model_metrics,
        "computation_notes":    computation_notes,
        "llm_judge": {
            "rows_judged":     judge_result.get("rows_judged", 0),
            "rows_skipped":    judge_result.get("rows_skipped", 0),
            "accuracy":        judge_result.get("accuracy"),
            "judge_model":     judge_result.get("judge_model", ""),
            "kb_chunks_used":  judge_result.get("kb_chunks_count", 0),
            "kb_grounded":     bool(kb_chunks),
            "error":           judge_result.get("error"),
            "panel_size":      judge_result.get("panel_size", 0),
            "judge_panel":     judge_result.get("judge_panel", []),
            "warnings":        judge_result.get("warnings", []),
        },
        "audit_sources": {
            "uploaded_logs":   len(sample_recs),
            "blackbox_probes": len(blackbox_rows),
            "combined_total":  logs_count,
            "blackbox_info":   blackbox_source_info,
        },
        "findings":             findings,
        "risk_analysis":        risk_analysis,
        "recommendation":       sdcc_doc.get("recommendation", ""),
        "framework_compliance": framework_compliance,
        "column_warnings":      sdcc_doc.get("column_warnings", []),
        "owner_id":             str(current_user["_id"]),
        "created_at":           datetime.utcnow(),
    }

    result = reports_collection.insert_one(report_doc)
    report_doc["_id"] = str(result.inserted_id)

    ai_collection.update_one(
        {"name": ai_name, "owner_id": str(current_user["_id"])},
        {"$inc": {"audit_runs": 1}},
    )

    return report_doc