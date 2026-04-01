// chatbot/knowledgeBase.ts
// ========================
// Comprehensive knowledge base for Auditable AI™ RAG chatbot.
// Each entry has: id, topic tags, content (what the LLM retrieves),
// and aliases (used for fuzzy matching / spelling tolerance).

export interface KBEntry {
  id: string;
  tags: string[];
  aliases: string[];
  content: string;
}

export const KNOWLEDGE_BASE: KBEntry[] = [

  // ─── PLATFORM OVERVIEW ────────────────────────────────────────────────────

  {
    id: "platform_overview",
    tags: ["platform", "auditable ai", "overview", "what is", "system", "tool"],
    aliases: ["auditable ai", "platform", "system", "tool", "what is this"],
    content: `Auditable AI™ is an enterprise-grade AI governance and audit platform built on the KPMG Trusted AI Framework.
It allows organisations to continuously monitor, evaluate, and audit their AI systems across 10 governance dimensions.
The platform has six core capabilities:
1. SDCC (Smart Data Classification & Characterisation) — automated log ingestion, model-type detection, and data quality scoring
2. Full Evaluation Engine — computes TAF principle scores across 10 KPMG Trusted AI dimensions with weighted, production-grade scoring
3. Black Box Audit — probes any external AI via API or browser UI without model access
4. Chrome Extension — real-time governance probing of ChatGPT, Gemini, Copilot, Claude, and Grok
5. Enterprise Self-Assessment — structured questionnaire-based governance scoring without log uploads
6. Report Audit Module — ingests existing audit reports (PDF/JSON) and cross-evaluates them against TAF standards
The platform currently supports six AI model types: Classification, RAG, General LLM/Chatbot, Summarization, Automation/Agentic AI, and Computer Vision.`
  },

  // ─── SDCC ─────────────────────────────────────────────────────────────────

  {
    id: "sdcc_overview",
    tags: ["sdcc", "ingest", "upload", "logs", "pipeline", "data quality", "detection"],
    aliases: ["sdcc", "smart data", "classification characterisation", "log upload", "ingest logs", "upload logs"],
    content: `SDCC stands for Smart Data Classification & Characterisation. It is the automated data ingestion and preparation pipeline.
When you upload AI logs (CSV or JSON), SDCC performs four things automatically:
1. Model Type Detection — uses a weighted multi-signal column-name and value-pattern scoring system to classify your dataset as one of six model types (classification, RAG, summarization, general_llm, automation, image_classification). Confidence is reported from 0 to 1.
2. Data Quality Scoring — computes a score (0–100) based on: missing value ratio (70% weight), schema confidence (30% weight), duplicate records, schema naming quality, and per-column fill rates.
3. Structural Risk Assessment — Low (DQ ≥ 85), Moderate (65–84), High (< 65).
4. Schema Validator — after ingest, you can call /validate/{ai_name} to get a pre-evaluation report listing which metric and governance columns are missing and a readiness score.
SDCC stores up to 2,000 sample rows for the evaluation engine to reuse without re-uploading.`
  },

  {
    id: "sdcc_columns",
    tags: ["columns", "csv", "json", "required columns", "what columns", "file format", "upload format"],
    aliases: ["columns needed", "required columns", "what to include", "csv format", "json format", "file format"],
    content: `For best audit results, include the following columns in your uploaded log file:

UNIVERSAL (all model types):
- timestamp / created_at — for chronological auditability
- user_id / session_id — for user attribution
- model_version / version — for traceability
- error / exception / failed — for error logging
- is_safe / safety / moderated — for safety flagging
- contains_pii / pii — for privacy tracking
- human_override / escalated — for human oversight signals
- feedback / rating / human_eval — for feedback integration

CLASSIFICATION: roc_auc, f1_score, precision, recall, probability/confidence, label/class/target
RAG: faithfulness, hallucination_rate, context_recall, answer_relevance, context/retrieved_chunks
GENERAL LLM: toxicity_rate, is_safe, hallucination_rate, coherence, perplexity, latency_ms
SUMMARIZATION: rouge_l, rouge_1, bertscore, faithfulness, reference_summary
AUTOMATION: step_success, task_complete, error, retry_count, latency/step_duration
COMPUTER VISION: map_score, iou/mean_iou, top_k_accuracy, confidence_score, label/annotation

Minimum: input/prompt/query and output/response/answer. More columns = more accurate scores.`
  },

  // ─── EVALUATION ENGINE ────────────────────────────────────────────────────

  {
    id: "evaluation_overview",
    tags: ["evaluation", "evaluate", "scoring", "how scoring works", "taf score", "calculate score"],
    aliases: ["how does scoring work", "evaluation", "how is score calculated", "scoring", "how scores"],
    content: `The Evaluation Engine computes TAF (Trusted AI Framework) scores for all 10 KPMG principles.
The process works in four stages:
1. Model-Specific Metrics — extracts metrics relevant to the detected model type (e.g. ROC-AUC for classification, faithfulness for RAG)
2. Structural Signals — fill-rate-aware column signals: presence of a column contributes 35%, fill rate contributes 65%. A half-null timestamp scores ~52, not 100.
3. Weighted Parameter Scoring — each principle has 5 sub-parameters with explicit importance weights. ROC-AUC contributes 35% to Reliability; Latency Monitoring contributes only 10%.
4. Metric-to-Principle Boost — each metric boosts only the specific principles it evidences. ROC-AUC boosts Reliability (45%), Data Integrity (25%), Transparency (10%).
The overall score is importance-weighted: Accountability and Safety carry 1.20×, Fairness and Security 1.15×, Sustainability only 0.80×.
Unavailable metrics default to a floor of 12 (not 35 like in older versions) — systems cannot score Moderate by logging nothing.`
  },

  {
    id: "overall_score",
    tags: ["overall score", "score", "0-100", "governance score", "what is score"],
    aliases: ["overall score", "what does score mean", "score meaning", "governance score", "score out of 100"],
    content: `The Overall Governance Score is a single number from 0 to 100 representing the AI system's trust and governance posture.
Score bands:
- 75–100: Compliant / Strong governance. Meets KPMG TAF standards. Continue monitoring.
- 55–74: Conditional / Watch. Partial compliance. Remediation recommended within 90 days.
- 0–54: Non-Compliant / Critical. Significant gaps. Immediate remediation required.
The score is NOT a simple average — it is importance-weighted across all 10 principles (Accountability and Safety carry higher weight than Sustainability).
The score also comes with a confidence band (e.g. ±12 pts) and a confidence percentage. Low log volume or few metric columns means a wider uncertainty band.`
  },

  {
    id: "confidence_band",
    tags: ["confidence", "uncertainty", "confidence band", "score reliability", "how reliable"],
    aliases: ["confidence band", "uncertainty", "how reliable is score", "score confidence", "plus minus"],
    content: `Every audit report includes a confidence band showing ±uncertainty around the overall score.
The uncertainty is computed from three factors:
1. Log Volume — more logs = narrower band. 100 logs → ±15, 1,000 → ±8, 10,000 → ±4
2. Metric Availability — proportion of model-specific metric columns present in the uploaded data
3. Data Quality — higher missing ratio = wider uncertainty band
The confidence_pct value shows how reliable the score is:
- ≥75%: High confidence
- 50–74%: Moderate — interpret with caution
- <50%: Low — upload more logs with richer metric columns
This is displayed on every report card so auditors know when to trust the number.`
  },

  {
    id: "trend_analysis",
    tags: ["trend", "delta", "regression", "improvement", "history", "over time", "previous audit"],
    aliases: ["trend", "delta", "previous audit", "getting worse", "improved", "regression", "history"],
    content: `The platform automatically compares each new audit against the most recent prior audit for the same AI system.
Trend analysis produces:
- Per-principle delta (current score minus prior score)
- Regression alerts: principles that dropped by more than 5 points are flagged
- Improvement highlights: principles that improved by more than 5 points
- Overall delta: weighted average change across all principles
- Trend summary: plain-English interpretation (e.g. "Reliability regressed significantly — review immediately")
This appears on the report as the trend_analysis section and on the /reports/{ai_name} history endpoint for chart rendering.`
  },

  // ─── 10 TAF PRINCIPLES ────────────────────────────────────────────────────

  {
    id: "principles_all",
    tags: ["10 principles", "all principles", "taf", "kpmg principles", "trusted ai"],
    aliases: ["10 principles", "kpmg principles", "all principles", "taf principles", "list principles"],
    content: `The KPMG Trusted AI Framework defines 10 principles organised around three core values:

VALUES-LED:
1. Fairness — AI must treat all individuals and groups equitably, eliminating bias across protected characteristics
2. Accountability — Clear governance structures, audit trails, and human oversight must exist for all AI outcomes
3. Privacy — Personal data must comply with GDPR/CCPA: data minimisation, purpose limitation, consent management
4. Sustainability — AI should minimise environmental impact through efficient architectures and carbon-aware operations

TRUSTWORTHY:
5. Transparency — AI must be open about capabilities, limitations, and decision logic for all stakeholders
6. Explainability — Decisions must be interpretable by non-technical users, regulators, and affected individuals
7. Data Integrity — Training and operational data must be accurate, complete, representative, and free from harmful biases
8. Reliability — Consistent performance under normal and adversarial conditions, monitored continuously
9. Security — Resilience against adversarial attacks, data poisoning, prompt injection, and cyber threats

HUMAN-CENTRIC:
10. Safety — Proactive safeguarding against harm to people, businesses, and property with human override mechanisms`
  },

  {
    id: "transparency",
    tags: ["transparency", "transparent", "open", "disclosure"],
    aliases: ["transparency", "transparent", "openness", "what is transparency principle"],
    content: `Transparency (importance weight: 1.0×) measures whether the AI system is open about its capabilities, limitations, and decision logic.
Sub-parameters and their weights:
- Schema Confidence (15%): how reliably the dataset schema was inferred
- Field Documentation (15%): whether input/output fields are consistently present and documented
- Model Version Tracking (25%): whether the model version is logged with every prediction — highest weight because traceability requires versioning
- Input/Output Coverage (25%): whether both request and response fields are present in logs
- Label Column Present (20%): whether ground truth labels are available (for verifiable outputs)
Regulatory mapping: EU AI Act Art.13 (transparency obligations), ISO 42001 6.1.2, NIST GOVERN-1.1
Compliance threshold: EU AI Act ≥70, ISO 42001 ≥72, NIST ≥68`
  },

  {
    id: "explainability",
    tags: ["explainability", "explainable", "interpretable", "shap", "lime", "explain"],
    aliases: ["explainability", "explainable ai", "xai", "interpretability", "shap", "lime"],
    content: `Explainability (importance weight: 1.0×) measures how interpretable the AI's decisions are to all stakeholders.
Sub-parameters:
- Model Interpretability (varies by type): baseline based on model family — classification ~70, general LLM ~40, CV models ~38 (inherently opaque)
- Prediction Confidence (35%): whether a confidence/probability score is logged per output
- SHAP/Feature Importance (25%): whether explainability artefacts are present
- Feedback Integration (10%): whether human ratings or corrections are captured
- Output Traceability (10%): whether outputs can be traced back to inputs and model version
For classification models, prediction confidence is the primary explainability signal (35% weight).
For RAG, faithfulness score is the primary signal (40% weight) since context citations enable explanation.
Regulatory mapping: EU AI Act Art.13(3)(b), ISO 42001 8.4.1, NIST EXPLAIN-1.1`
  },

  {
    id: "fairness",
    tags: ["fairness", "bias", "discrimination", "equity", "class balance", "imbalance"],
    aliases: ["fairness", "bias", "discrimination", "equity", "class imbalance", "demographic"],
    content: `Fairness (importance weight: 1.15×) measures equitable treatment across all individuals and groups.
Sub-parameters:
- Data Completeness (15%): missing data below 5% ensures equitable representation
- Class Balance (40%): PRIMARY signal for classification — minority/majority class ratio; 1.0 = perfectly balanced
- Demographic Coverage (20%): estimated from text column proportion as a proxy for dataset diversity
- Bias Indicator Fields (15%): whether explicit fairness monitoring columns exist (feedback, demographic labels)
- Missing Data Equity (10%): whether missing data is disproportionate across subgroups
For classification models, class balance carries 40% weight — severe imbalance (e.g. 10:1 ratio) will tank the Fairness score significantly.
Recommended fix: apply SMOTE, class weighting, or collect more minority-class samples.
Regulatory mapping: EU AI Act Art.10(2), ISO 42001 8.3, NIST BIAS-1.1`
  },

  {
    id: "accountability",
    tags: ["accountability", "audit trail", "logging", "governance", "oversight", "responsible"],
    aliases: ["accountability", "audit trail", "logging", "who is responsible", "governance", "human oversight"],
    content: `Accountability (importance weight: 1.20× — highest weighted principle alongside Safety) measures whether clear governance structures and audit trails exist.
Sub-parameters:
- Audit Log Volume (25%): log volume on a log-scale — 10 records scores 33, 100 scores 67, 1,000 scores 100
- Timestamp Coverage (25%): timestamps enable chronological auditability — fill-rate aware, not just presence
- User/Workflow Attribution (20–30%): user_id or session_id enables tracing outputs to actors
- Model Version Control (20%): every prediction must be linked to a specific model version
- Error/Exception Logging (10%): structured error logging for all failed predictions
Accountability is highest-weighted because agentic and automation systems take real-world actions that must be traceable.
Regulatory mapping: EU AI Act Art.9, Art.17, Art.29; ISO 42001 5.1; NIST GOVERN-1.2, GOVERN-6.1`
  },

  {
    id: "data_integrity",
    tags: ["data integrity", "data quality", "completeness", "duplicates", "ground truth", "schema"],
    aliases: ["data integrity", "data quality", "completeness", "duplicates", "ground truth", "schema consistency"],
    content: `Data Integrity (importance weight: 1.05×) measures accuracy, completeness, and representativeness of AI training and operational data.
Sub-parameters:
- Completeness Score (20%): proportion of non-missing values across all fields
- Duplicate-Free Rate (15%): penalises repeated records — 1% duplicates → -3 points, 10% → -30 points
- Schema Consistency (15%): schema confidence derived from missing ratio and column naming quality
- Ground Truth Labels/References (30%): PRIMARY for most types — without labels you cannot verify outputs
- Performance Metric Logs (20%): presence of logged quality metrics (ROC-AUC, ROUGE, faithfulness)
For Computer Vision models, Ground Truth Coverage carries 40% — unlabelled images cannot be validated.
For RAG, Context Logged Rate carries 30% — missing context makes RAG completely unauditable.
Regulatory mapping: EU AI Act Art.10, ISO 42001 8.2, NIST MAP-3.5`
  },

  {
    id: "reliability",
    tags: ["reliability", "performance", "consistent", "latency", "error rate", "degradation"],
    aliases: ["reliability", "performance", "consistent performance", "latency", "error rate", "uptime", "stability"],
    content: `Reliability (importance weight: 1.10×) measures consistent and predictable performance under normal and adversarial conditions.
Sub-parameters and weights by model type:
- CLASSIFICATION: ROC-AUC Score (35%), F1 Score (30%), Latency Monitoring (10%), Error Rate Tracking (10%), Volume Sufficiency (15%)
- RAG: Faithfulness Score (35%), Hallucination Rate (30%), Latency Monitoring (15%)
- AUTOMATION: Step Success Rate (40%), Task Completion Rate (30%), Error Rate (15%)
- COMPUTER VISION: mAP Score (40%), Mean IoU (30%), Top-K Accuracy (15%)
- GENERAL LLM: Safety Pass Rate (30%), Coherence Score (30%)
- SUMMARIZATION: ROUGE-L Score (35%), BERTScore F1 (25%), Faithfulness (25%)
Reliability is the most directly tied to model-specific performance metrics — it scores low when logged metrics are absent.
Regulatory mapping: EU AI Act Art.15, ISO 42001 9.1, NIST MEASURE-1.1, MEASURE-2.1`
  },

  {
    id: "security",
    tags: ["security", "adversarial", "attack", "injection", "prompt injection", "robustness", "cyber"],
    aliases: ["security", "adversarial attacks", "prompt injection", "red team", "cyber security", "robustness"],
    content: `Security (importance weight: 1.15×) measures resilience against adversarial attacks, data poisoning, prompt injection, and cyber threats.
Sub-parameters:
- Toxicity Rate / Safety Pass Rate (30% for LLMs): direct security signal from content moderation
- Input Validation (20–25%): schema quality and input column presence as proxy for validation
- Adversarial Robustness (20%): baseline score by model type — CV models score 40 (highly vulnerable to adversarial patches), classification scores 50, summarization 52, automation 58
- Content Moderation Log (15–20%): presence of moderation/safety columns
- PII Detection (10–15%): whether PII is being detected and flagged
For RAG systems, Hallucination Control (30%) and Prompt Injection Risk (25%) are the primary security signals — injected context manipulation is a key RAG attack vector (baseline: 45).
Regulatory mapping: EU AI Act Art.15(3), ISO 42001 8.7, NIST GOVERN-4.1, MEASURE-2.7`
  },

  {
    id: "privacy",
    tags: ["privacy", "gdpr", "pii", "personal data", "data minimisation", "consent", "anonymisation"],
    aliases: ["privacy", "gdpr", "pii", "personal data", "data protection", "ccpa", "anonymisation", "consent"],
    content: `Privacy (importance weight: 1.10×) measures GDPR/CCPA compliance and data protection practices.
Sub-parameters:
- PII Field Tracking (30%): PRIMARY — whether records containing personal data are explicitly marked
- Data Minimisation (20%): penalises overly broad schemas (too many columns = collecting more than necessary)
- User Anonymisation (20%): rewards schemas that hash or pseudonymise user identifiers
- Consent Management (15%): fixed at 35 until explicit runtime consent signals are captured in logs
- Data Retention Signals (15%): timestamps enable automated data retention policy enforcement
For Computer Vision, the privacy sub-parameters are renamed: PII/Biometric Field Tracking (35%), Face/Biometric Anonymisation (30%) — images carry inherent biometric risk so the thresholds are stricter.
The Consent Management score of 35 is intentionally conservative — it will only increase when consent fields are added to log data.
Regulatory mapping: EU AI Act Art.10(5), Recital 41, ISO 42001 8.8, NIST GOVERN-4.2`
  },

  {
    id: "sustainability",
    tags: ["sustainability", "environment", "carbon", "compute", "resource", "energy", "efficiency"],
    aliases: ["sustainability", "environment", "carbon footprint", "energy", "compute cost", "efficiency", "green ai"],
    content: `Sustainability (importance weight: 0.80× — lowest weighted) measures the AI system's environmental and compute footprint.
Sub-parameters:
- Dataset Efficiency (20%): rewards leaner datasets — very large datasets get a small penalty
- Feature Engineering (20%): schema breadth as a proxy for purposeful feature coverage
- Compute Proxy Score (25–35%): fixed baseline by model family — CV inference scores 32 (GPU-intensive), General LLMs score 35 (very compute-heavy), Classification scores 75 (lightweight)
- Redundancy Elimination (15%): same as duplicate penalty — avoids redundant compute on repeated records
- Resource Optimisation (15–25%): schema quality as a proxy for operational efficiency
Sustainability is weighted lowest (0.80×) in the overall score because governance, safety, and fairness are prioritised higher.
Regulatory mapping: EU AI Act Recital 48, ISO 42001 7.5.3, NIST GOVERN-5.1`
  },

  {
    id: "safety",
    tags: ["safety", "harm", "human override", "escalation", "safeguard", "incident", "harm prevention"],
    aliases: ["safety", "harm prevention", "human override", "safeguard", "incident response", "safety controls"],
    content: `Safety (importance weight: 1.20× — joint highest with Accountability) measures proactive harm prevention for people, businesses, and property.
Sub-parameters and weights by model type:
- AUTOMATION: Human Override Logged (35%) — CRITICAL. Agentic systems taking real-world actions MUST have logged human override capability
- ALL TYPES: Harm Prevention Logging (15–20%), Incident Response Signals (15%), Safeguard Effectiveness (10–15%)
- CLASSIFICATION: Human Override Capability (30%), Safeguard Effectiveness = recall score (recall directly measures missed harm events — false negatives in high-stakes domains)
- RAG: Hallucination Containment (35%) — hallucinated answers in medical/legal/financial domains cause direct harm
- COMPUTER VISION: Misidentification Controls (35%) — misidentification in surveillance/medical/autonomous vehicles causes direct harm
- SUMMARIZATION: Faithfulness as Safety (35%) — misleading summaries in high-stakes domains are a primary safety risk
Regulatory mapping: EU AI Act Art.9, Art.15(4), ISO 42001 8.9, NIST GOVERN-2.2, MAP-1.1`
  },

  // ─── MODEL TYPES ──────────────────────────────────────────────────────────

  {
    id: "model_types_overview",
    tags: ["model types", "supported models", "types of ai", "which models", "classification type"],
    aliases: ["model types", "supported models", "types of ai", "which ai types", "what models supported"],
    content: `The platform currently supports six AI model types:
1. Classification — binary or multi-class prediction models (tabular, NLP, image-based). Key metrics: ROC-AUC, F1, precision, recall, class balance, confidence. EU AI Act threshold: 75.
2. RAG (Retrieval-Augmented Generation) — LLMs with external knowledge retrieval. Key metrics: faithfulness, hallucination_rate, context_recall, answer_relevance. EU AI Act threshold: 70.
3. General LLM/Chatbot — open-ended conversational models. Key metrics: toxicity_rate, safety_pass_rate, hallucination_rate, coherence, perplexity. EU AI Act threshold: 70.
4. Summarization — models that condense documents. Key metrics: ROUGE-L, ROUGE-1, BERTScore, faithfulness, reference_coverage. EU AI Act threshold: 70.
5. Automation/Agentic AI — multi-step workflow agents, RPA, tool-calling pipelines. Key metrics: step_success_rate, task_completion_rate, error_rate, retry_rate, latency. EU AI Act threshold: 80 (highest — real-world actions).
6. Computer Vision — object detection, image classification, segmentation. Key metrics: mAP, IoU, top_k_accuracy, confidence, label_coverage. EU AI Act threshold: 75.
Model type is automatically detected from column names and value patterns using the SDCC detector.`
  },

  {
    id: "classification_model",
    tags: ["classification", "binary", "multiclass", "roc auc", "f1 score", "precision", "recall"],
    aliases: ["classification model", "binary classification", "multiclass", "roc auc", "f1", "precision recall"],
    content: `Classification evaluator covers binary and multi-class prediction models.
Key model metrics:
- ROC-AUC (threshold: Low risk ≥0.85, Moderate ≥0.70) — primary reliability metric, 35% weight
- F1 Score (threshold: Low ≥0.80, Moderate ≥0.65) — 30% weight in Reliability
- Precision (threshold: ≥0.75) and Recall (threshold: ≥0.75)
- Class Balance — minority/majority ratio; 1.0 = balanced. Below 0.50 = severe imbalance. 40% weight in Fairness
- Average Confidence — mean prediction probability. Below 0.65 = Moderate risk
- Confidence Std Dev (NEW) — high spread indicates poor model calibration
Primary risks: class imbalance → Fairness; low ROC-AUC → Reliability; mispredictions in high-stakes domains → Safety
Compliance thresholds: EU AI Act 75, ISO 42001 80, NIST 70`
  },

  {
    id: "rag_model",
    tags: ["rag", "retrieval", "vector", "knowledge base", "chunks", "hallucination", "faithfulness"],
    aliases: ["rag", "retrieval augmented", "vector database", "knowledge base", "retrieved context", "hallucination"],
    content: `RAG (Retrieval-Augmented Generation) evaluator covers LLMs augmented with external knowledge retrieval.
Key model metrics:
- Faithfulness (threshold: ≥0.80) — factual consistency of generated answer with retrieved context; 35% weight in Reliability
- Hallucination Rate (threshold: ≤0.05 Low risk, ≤0.15 Moderate) — rate of ungrounded claims; inverted metric (lower is better)
- Answer Relevance (threshold: ≥0.75) — how relevant the answer is to the query
- Context Recall (threshold: ≥0.75) — proportion of relevant information successfully retrieved
- Context Coverage — proportion of records where retrieved context was logged; 30% weight in Data Integrity (missing = unauditable)
- Average Latency (threshold: ≤1500ms Low, ≤3000ms Moderate)
Primary risks: hallucination → Security + Safety; missing context logs → Data Integrity; prompt injection → Security (baseline: 45)
Compliance thresholds: EU AI Act 70, ISO 42001 75, NIST 65`
  },

  {
    id: "automation_model",
    tags: ["automation", "agentic", "agent", "workflow", "rpa", "pipeline", "step", "tool call"],
    aliases: ["automation", "agentic ai", "agent", "workflow automation", "rpa", "multi-step", "tool calling"],
    content: `Automation/Agentic AI evaluator covers multi-step workflow agents, RPA systems, and tool-calling pipelines.
Key model metrics:
- Step Success Rate (threshold: ≥0.95 Low, ≥0.85 Moderate) — 40% weight in Reliability (primary)
- Task Completion Rate (threshold: ≥0.90 Low, ≥0.75 Moderate) — 30% weight in Reliability
- Error Rate (threshold: ≤0.02 Low, ≤0.10 Moderate; inverted) — 15% weight in Reliability
- Average Retry Rate (threshold: ≤0.10 Low, ≤0.30 Moderate; inverted) — high retries = fragile steps
- Average Step Latency (threshold: ≤500ms Low, ≤2000ms Moderate; inverted)
Safety is critical for automation: Human Override Logged carries 35% weight in Safety. Without logged human override capability, the Safety score will be very low.
Primary risks: missing human override → Safety; high error rate → Reliability + Security; unlogged steps → Accountability
Compliance thresholds: EU AI Act 80 (highest of all model types), ISO 42001 85, NIST 75`
  },

  {
    id: "llm_model",
    tags: ["llm", "chatbot", "language model", "gpt", "gemini", "claude", "toxicity", "coherence"],
    aliases: ["general llm", "chatbot", "language model", "conversational ai", "toxicity", "coherence", "perplexity"],
    content: `General LLM/Chatbot evaluator covers open-ended conversational or instruction-following language models.
Key model metrics:
- Toxicity Rate (threshold: ≤0.01 Low, ≤0.05 Moderate; inverted) — 30% weight in Security, 35% in Safety
- Safety Pass Rate (threshold: ≥0.98 Low, ≥0.90 Moderate) — 30% weight in both Security and Reliability
- Hallucination Rate (threshold: ≤0.05 Low, ≤0.15 Moderate; inverted) — 35% weight in Explainability
- Average Coherence (threshold: ≥0.75 Low, ≥0.60 Moderate) — 30% weight in Reliability
- Average Perplexity (threshold: ≤20.0 Low, ≤50.0 Moderate; inverted) — lower = more confident outputs
- Average Latency (threshold: ≤2000ms Low, ≤5000ms Moderate)
Primary risks: toxicity → Security + Safety; hallucination → Explainability + Safety; high perplexity → Reliability
Compute baseline: 35 (very compute-intensive)
Compliance thresholds: EU AI Act 70, ISO 42001 75, NIST 65`
  },

  {
    id: "cv_model",
    tags: ["computer vision", "image", "object detection", "segmentation", "map", "iou", "bounding box"],
    aliases: ["computer vision", "image classification", "object detection", "cv model", "map score", "iou", "bounding box"],
    content: `Computer Vision evaluator covers object detection, image classification, and segmentation models.
Key model metrics:
- mAP Score (threshold: ≥0.60 Low, ≥0.40 Moderate) — Mean Average Precision; 40% weight in Reliability (primary)
- Mean IoU (threshold: ≥0.75 Low, ≥0.50 Moderate) — Intersection-over-Union for bounding boxes; 30% Reliability
- Top-K Accuracy (threshold: ≥0.85 Low, ≥0.70 Moderate) — 15% Reliability
- Average Confidence (threshold: ≥0.80 Low, ≥0.65 Moderate) — 35% weight in Explainability
- Label Coverage (threshold: ≥0.95 Low, ≥0.80 Moderate) — 40% weight in Data Integrity (PRIMARY — unlabelled images cannot be validated)
- Average Inference Time (threshold: ≤100ms Low, ≤500ms Moderate; inverted)
Privacy note: Computer Vision has stricter privacy defaults — images carry inherent biometric data risk. Consent Management baseline is 30 (vs 35 for other types).
Adversarial Robustness baseline: 40 (CV models are highly vulnerable to adversarial patches).
Compute baseline: 32 (GPU-intensive inference).
Compliance thresholds: EU AI Act 75, ISO 42001 80, NIST 70`
  },

  {
    id: "summarization_model",
    tags: ["summarization", "summary", "rouge", "bleu", "bertscore", "abstractive", "extractive"],
    aliases: ["summarization", "summary model", "rouge score", "bleu score", "bertscore", "abstractive summarization"],
    content: `Summarization evaluator covers models that condense documents or conversations into shorter summaries.
Key model metrics (thresholds based on CNN/DailyMail and XSum benchmarks):
- ROUGE-L (threshold: ≥0.40 Low, ≥0.25 Moderate) — 35% weight in Reliability (primary); 200× multiplier applied (ROUGE-L of 0.40 → score of 80)
- ROUGE-1 (threshold: ≥0.45 Low, ≥0.30 Moderate) — unigram overlap
- ROUGE-2 (threshold: ≥0.18 Low, ≥0.10 Moderate) — bigram overlap
- BLEU Score (threshold: ≥0.25 Low, ≥0.12 Moderate)
- BERTScore (threshold: ≥0.85 Low, ≥0.75 Moderate) — semantic similarity; 25% Reliability
- Faithfulness (threshold: ≥0.75 Low, ≥0.60 Moderate) — factual consistency with source; 35% Safety weight (misleading summaries in medical/legal/financial = harm)
- Reference Coverage — proportion of records with reference summaries; 35% Data Integrity weight
Primary safety risk: misleading summaries in high-stakes domains (medical, legal, financial) cause direct harm — faithfulness is treated as a safety signal.
Compliance thresholds: EU AI Act 70, ISO 42001 75, NIST 65`
  },

  // ─── BLACK BOX AUDIT ──────────────────────────────────────────────────────

  {
    id: "blackbox_overview",
    tags: ["black box", "blackbox", "external audit", "api audit", "probe", "governance probe"],
    aliases: ["black box", "blackbox audit", "external ai audit", "probe external", "api testing", "audit external"],
    content: `Black Box Audit tests any external AI system without requiring access to its internal model, weights, or architecture.
Two modes:
1. API Mode — requires an API endpoint URL + API key. The platform sends governance probes as structured HTTP requests and analyses the responses.
2. UI Mode — requires the publicly accessible UI URL of the AI system. Uses Playwright browser automation to interact with the UI and capture responses. Requires cookies for authenticated interfaces (export using Cookie-Editor browser extension).
The platform uses Groq to dynamically generate 50+ governance probes tailored to your AI system's name, description, and domain — not generic questions.
Results include: overall_score, risk_level, per-category scores (one per TAF principle), and detailed probe_results with pass/fail and severity for each probe.
Platform detection: enterprise AI platforms (ChatGPT, Gemini, Copilot, Grok, Claude, etc.) are automatically detected and the correct CSS selectors are used.`
  },

  {
    id: "groq_integration",
    tags: ["groq", "groq api", "probe generation", "llm probes", "dynamic probes"],
    aliases: ["groq", "groq api", "probe generation", "why groq", "llm for probes"],
    content: `Groq is used in two places in the platform:
1. Black Box Probe Generation — when you register an AI system with a name, description, and domain, Groq generates contextualised governance probes specific to your system type. For a healthcare classification model, probes test medical bias; for a financial chatbot, they test regulatory compliance.
2. Report Audit Module — Groq powers the LLM-based analysis when re-evaluating existing audit reports against TAF standards.
Groq was chosen for its extremely low latency inference — probe generation happens in seconds even for 50+ probes.
The chatbot assistant you are currently talking to also uses Groq for natural language understanding and response generation.`
  },

  // ─── CHROME EXTENSION ─────────────────────────────────────────────────────

  {
    id: "chrome_extension",
    tags: ["chrome extension", "browser extension", "chatgpt", "gemini", "copilot", "claude", "grok", "real time"],
    aliases: ["chrome extension", "browser", "chatgpt audit", "gemini audit", "real time audit", "extension"],
    content: `The Chrome Extension (available from the Chrome Web Store) enables real-time governance auditing of AI chat interfaces directly in your browser.
Supported platforms: ChatGPT, Gemini, Google AI Studio, Microsoft Copilot, Claude, Grok, and other chat-based AI interfaces.
How it works:
1. Navigate to the target AI interface in Chrome
2. Click the extension icon and configure the AI system name
3. The extension sends 50 governance probes one by one through the actual chat interface
4. Responses are captured and analysed in real time
5. Results are submitted to the /api/v1/audit/score endpoint for scoring
6. A full governance report is generated with per-principle scores and findings
The extension uses the same probe analysis and scoring engine as the API-based black box audit. No model access required.`
  },

  // ─── ENTERPRISE SELF-ASSESSMENT ───────────────────────────────────────────

  {
    id: "self_assessment",
    tags: ["self assessment", "self report", "questionnaire", "enterprise form", "no logs", "manual assessment"],
    aliases: ["self assessment", "self report", "questionnaire", "enterprise form", "without logs", "manual"],
    content: `The Enterprise Self-Assessment module allows organisations to get a governance score without uploading AI logs.
Instead of data-driven evaluation, you fill out a structured questionnaire covering:
- Governance policies (accountability frameworks, responsible AI policies)
- Safety controls (harm prevention processes, human oversight mechanisms)
- Fairness testing (bias testing methodologies, demographic fairness checks)
- Data practices (data governance, privacy controls, consent management)
- Security measures (adversarial testing, red-teaming, incident response)
- Transparency practices (model documentation, explainability methods)
The responses are scored against TAF sub-parameters and produce the same output format as a full evaluation — overall score, per-principle scores, findings, and framework compliance.
Best for: early-stage AI governance, systems where log collection hasn't started, or quick compliance checks.`
  },

  // ─── REPORT AUDIT MODULE ──────────────────────────────────────────────────

  {
    id: "report_audit",
    tags: ["report audit", "audit report", "pdf audit", "existing report", "re-evaluate", "report module", "document audit"],
    aliases: ["report audit", "audit existing report", "pdf report audit", "re-evaluate report", "report module", "cross evaluate"],
    content: `The Report Audit Module is a newer feature that allows organisations to submit an existing AI audit report (PDF or JSON format) and have it cross-evaluated against the KPMG Trusted AI Framework standards.
What it does:
1. Ingests an existing audit document (from any auditor, internal team, or third-party firm)
2. Extracts the governance claims, scores, and findings from the document
3. Re-evaluates those claims against TAF principle requirements and regulatory controls
4. Identifies gaps where the existing report does not cover TAF obligations
5. Produces a gap analysis comparing the submitted report's coverage against EU AI Act, ISO 42001, and NIST AI RMF requirements
Use cases:
- Validating a third-party AI audit against KPMG TAF standards before accepting it
- Cross-referencing internal audits with regulatory requirements
- Identifying what a current audit is missing before submission to regulators
- Benchmarking an existing governance report against best-practice TAF scoring
Groq LLM is used to extract and analyse content from the submitted report documents.`
  },

  // ─── REGULATORY FRAMEWORKS ────────────────────────────────────────────────

  {
    id: "eu_ai_act",
    tags: ["eu ai act", "european ai", "eu regulation", "ai act", "risk categories", "compliance eu"],
    aliases: ["eu ai act", "european ai act", "eu regulation", "ai act compliance", "risk categories"],
    content: `The EU AI Act is the European Union's comprehensive AI regulation, which came into force in 2024.
Risk classification:
- Unacceptable Risk (BANNED): social scoring, real-time biometric surveillance in public, subliminal manipulation
- High Risk: AI in critical infrastructure, education, employment, essential services, law enforcement, migration, administration of justice
- Limited Risk: chatbots (must disclose AI nature), emotion recognition systems (disclosure required)
- Minimal Risk: spam filters, AI in games — no specific obligations
Key obligations for HIGH RISK systems:
- Risk management system (Art.9)
- Data governance and quality (Art.10)
- Technical documentation (Art.11)
- Transparency to users (Art.13)
- Human oversight (Art.14)
- Accuracy, robustness, cybersecurity (Art.15)
The platform evaluates against specific EU AI Act articles per principle. For example: Accountability maps to Art.9, Art.17, Art.29; Privacy maps to Art.10(5), Recital 41.
Compliance thresholds vary by principle: Privacy and Safety require ≥80, Transparency requires ≥70.`
  },

  {
    id: "iso_42001",
    tags: ["iso 42001", "iso standard", "ai management system", "isms", "iso certification"],
    aliases: ["iso 42001", "iso standard", "ai management", "certification", "iso compliance"],
    content: `ISO/IEC 42001:2023 is the first international standard for AI Management Systems (AIMS).
Structure: Based on the Plan-Do-Check-Act management system approach (similar to ISO 27001 for security, ISO 9001 for quality).
Key clauses relevant to our scoring:
- 5.1: Leadership accountability for AI governance
- 6.1.1: Security risk assessment for AI
- 6.1.2: AI system transparency obligations
- 6.1.3: Harm prevention and safety planning
- 8.2: Data for AI systems — quality management
- 8.3: Bias and fairness in AI systems
- 8.4: Documentation and explainability requirements
- 8.7: AI security controls
- 8.8: Privacy in AI systems
- 8.9: Safety of AI systems
- 9.1: Monitoring, measurement, analysis and evaluation
Compliance thresholds on our platform: Safety and Privacy require ≥82, Accountability requires ≥80, Fairness requires ≥78.
ISO 42001 certification can be pursued by organisations to demonstrate AI governance maturity to clients and regulators.`
  },

  {
    id: "nist_ai_rmf",
    tags: ["nist", "nist ai rmf", "risk management framework", "govern map measure manage", "nist compliance"],
    aliases: ["nist", "nist ai rmf", "nist framework", "risk management", "govern measure manage map"],
    content: `The NIST AI Risk Management Framework (AI RMF 1.0) was published by the US National Institute of Standards and Technology in January 2023.
Four core functions:
- GOVERN: Establishes accountability, culture, and processes for AI risk management
- MAP: Categorises AI risks and their context, enables risk identification
- MEASURE: Analyses, assesses, benchmarks, and monitors AI risks
- MANAGE: Prioritises and addresses AI risks; plans for response and recovery
Specific controls mapped to our TAF principles:
- Transparency: GOVERN-1.1, MAP-1.6, MANAGE-2.2
- Fairness: BIAS-1.1, MEASURE-2.2, MANAGE-1.3
- Accountability: GOVERN-1.2, GOVERN-6.1, MANAGE-4.1
- Data Integrity: MAP-3.5, MEASURE-2.6, MANAGE-2.1
- Reliability: MEASURE-1.1, MEASURE-2.1, MANAGE-1.1
- Security: GOVERN-4.1, MEASURE-2.7, MANAGE-2.4
NIST AI RMF thresholds on our platform: Safety and Security require ≥75–78, Transparency requires ≥68.`
  },

  // ─── COMPLIANCE FRAMEWORK ─────────────────────────────────────────────────

  {
    id: "compliance_evaluation",
    tags: ["compliance", "framework compliance", "compliant", "conditional", "non compliant", "failing controls"],
    aliases: ["compliance", "framework compliance", "regulatory compliance", "compliant status", "failing controls"],
    content: `The platform evaluates regulatory compliance per principle against specific regulatory controls — not a single numeric overall threshold.
Compliance status per framework:
- Compliant: 0 principles failing their threshold
- Conditional: 1–2 principles failing their threshold
- Non-Compliant: 3+ principles failing their threshold
Each principle has different thresholds per framework. For example, Safety:
- EU AI Act requires ≥80 for compliance
- ISO 42001 requires ≥82
- NIST AI RMF requires ≥78
The failing_controls field in the report lists up to 15 specific regulatory controls that are not being met, ordered by gap size (largest gap first).
For example: a Safety score of 55 means EU AI Act Art.9 (Risk management system) and ISO 42001 8.9 (Safety of AI systems) are both failing — these are shown explicitly so auditors know exactly what to fix.`
  },

  // ─── FINDINGS & RECOMMENDATIONS ───────────────────────────────────────────

  {
    id: "findings",
    tags: ["findings", "recommendations", "remediation", "fix score", "improve score", "what to do"],
    aliases: ["findings", "recommendations", "how to fix", "improve score", "remediation", "what to improve"],
    content: `Findings are prioritised governance gaps that need addressing. Unlike v1 (threshold of 60 = finding), findings are now priority-ranked:
Priority = severity_weight × principle_importance × gap_ratio
This means a Critical Accountability gap always outranks a Low Sustainability gap regardless of absolute score.
Finding types:
1. Structural findings — principle score below 60 triggers a finding with recommendation targeting the worst-scoring sub-parameter
2. Model metric findings — when a logged metric is in the "High risk" band (e.g. ROC-AUC = 0.55), a specific metric-level finding is generated
Each finding includes:
- Category (principle name or metric name)
- Type (structural or model_metric)
- Severity (Critical < 40, High 40–50, Medium 50–60)
- Issue description with the actual score and threshold
- Specific recommendation (e.g. "ROC-AUC below threshold. Review feature quality, class separation, and model architecture.")
Common quick wins to improve scores: add timestamp column, add model_version column, add error/exception column, add user_id column.`
  },

  // ─── REPORTS & PDF ────────────────────────────────────────────────────────

  {
    id: "reports_pdf",
    tags: ["report", "pdf", "download report", "pdf report", "audit report", "generate report"],
    aliases: ["report", "pdf report", "download pdf", "generate pdf", "audit report", "full report"],
    content: `The platform generates comprehensive PDF audit reports using the KPMG brand design system.
Report sections:
1. Cover page — AI system name, model type, overall score, risk level, evaluated date
2. Executive Summary — overall score, confidence band, risk level, framework compliance overview
3. TAF Principle Scores — radar chart + per-principle scores with sub-parameter breakdowns
4. Model-Specific Metrics — actual computed metrics with risk classifications and thresholds
5. Key Findings — prioritised list with severity, issue description, and specific recommendations
6. Framework Compliance — per-principle compliance table for EU AI Act, ISO 42001, NIST AI RMF
7. KPMG TAF Reference — framework overview, principle descriptions, score interpretation legend
To download: navigate to the Report page after evaluation, click "Download Full PDF Report". Must be logged in.
Reports can also be uploaded to the Report Audit Module for cross-evaluation.`
  },

  // ─── PLATFORM PAGES ───────────────────────────────────────────────────────

  {
    id: "page_dashboard",
    tags: ["dashboard", "home", "main page", "overview page", "landing"],
    aliases: ["dashboard", "home page", "main page", "where to start", "landing page"],
    content: `The Dashboard is the main hub of the platform. From the dashboard you can:
- View all registered AI systems with their last audit score and risk level
- Register a new AI system (name, description, domain, connector details)
- Navigate to individual AI system pages to run or view audits
- See your audit history count and account status
- Access the quick-start guide for uploading logs
The dashboard shows all AI systems you have registered, with status indicators for whether they have been audited, the last audit date, and current risk level.`
  },

  {
    id: "page_report",
    tags: ["report page", "radar chart", "spider chart", "principle scores", "view report"],
    aliases: ["report page", "radar chart", "principle visualization", "view scores", "spider chart"],
    content: `The Report page is the main output view after running an evaluation. It shows:
- Overall governance score (large number in the centre of the radar chart)
- Radar/spider chart with all 10 TAF principle scores plotted
- Confidence band and confidence percentage
- Risk level badge (Low/Moderate/High/Critical)
- Trend indicators comparing to the previous audit
- Model type and detection confidence
- Per-principle score cards with sub-parameter breakdowns
- Key findings with severity and recommendations
- Framework compliance table (EU AI Act, ISO 42001, NIST)
- Download PDF button
From this page you can also see the AI Governance Assistant chat widget (the one you're using now) for contextual help.`
  },

  {
    id: "page_blackbox",
    tags: ["blackbox page", "audit page", "probe page", "run blackbox", "start audit"],
    aliases: ["blackbox page", "audit page", "run audit", "start blackbox", "probe results page"],
    content: `The Black Box Audit page allows you to run external AI audits. Steps:
1. Enter the AI system name (must be registered first)
2. Select mode: API (needs endpoint URL + API key) or UI (needs the target URL)
3. For UI mode: optionally paste cookies from Cookie-Editor to authenticate
4. Click Run Audit — Groq generates probes, they are sent to the target system, responses are analysed
5. Results show: overall_score, risk_level, per-principle scores, and individual probe results
6. Past audits are saved and accessible from /blackbox/history/{ai_name}
The platform automatically detects the target platform (ChatGPT, Gemini, Copilot, etc.) and adjusts interaction selectors accordingly.`
  },

  {
    id: "page_register",
    tags: ["register", "register ai", "add ai system", "new system", "create ai"],
    aliases: ["register ai system", "add new ai", "create ai system", "register new", "add ai"],
    content: `Registering an AI system is the first step before running any audit. Steps:
1. Log in to the platform
2. Navigate to Register AI System
3. Fill in: name (unique per account), description (used by Groq to generate contextualised probes), domain (healthcare, finance, legal, etc.), connector details
4. The AI system is saved with status: active and audit_runs: 0
After registration you can:
- Upload logs via /sdcc/ingest/{ai_name}
- Check schema readiness via /validate/{ai_name}
- Run full evaluation via /evaluate/{ai_name}
- Run black box audit via /blackbox/audit
- View audit history via /reports/{ai_name}
The description and domain fields are crucial for Black Box audit quality — the more specific, the better the Groq-generated probes.`
  },

  // ─── TROUBLESHOOTING ──────────────────────────────────────────────────────

  {
    id: "troubleshooting_score",
    tags: ["score 0", "low score", "wrong score", "score too low", "bad score", "score problem", "why score"],
    aliases: ["score is 0", "low score", "score problem", "wrong score", "score 0", "why is score bad"],
    content: `Common reasons for unexpectedly low scores and how to fix them:
Score is 0: Probes all failed or the AI refused to respond. Check API endpoint URL, verify API key is valid and has sufficient credits, confirm the model is accessible from the server, verify the model type is correctly registered.
Score is very low (<30): Dataset has too few columns with model-specific metrics. All unavailable metrics default to a floor of 12 — add relevant metric columns to your logs.
Accountability is 0: No timestamp, user_id, model_version, or error columns present. Add at least timestamp and model_version.
Safety is very low: No human_override or escalated column; no safety/is_safe column. For automation models this is critical.
Privacy is low: No contains_pii or pii column. Even if you have no PII, add a contains_pii: false column.
Fairness is low for classification: Severe class imbalance detected (minority/majority < 0.50). Apply SMOTE or collect more minority samples.
Reliability is low: Model-specific metric columns are absent (e.g. no roc_auc column for classification). Add logged metrics.`
  },

  {
    id: "troubleshooting_detection",
    tags: ["wrong model type", "detection wrong", "detected wrong", "misclassified", "model type wrong"],
    aliases: ["wrong model type", "detected wrong type", "misclassified", "model type incorrect", "wrong detection"],
    content: `If the model type was detected incorrectly:
The detector uses column names AND actual data values. Generic column names like 'input', 'output', 'score' may not trigger a specific model type — they may fall through to general_llm.
To improve detection accuracy:
- Classification: add roc_auc, f1_score, or predicted_class column
- RAG: add faithfulness, context, or hallucination column
- Summarization: add rouge_l or reference_summary column
- Automation: add step_success, task_complete, or workflow_id column
- Computer Vision: add iou, map_score, or image_id column
Detection confidence < 0.25 means the detection was ambiguous — the fallback general_llm is used. If detection was wrong, rename your columns to include model-type-specific terms.
Note: the detector now also checks actual values (e.g. status column with 'success/fail' vocabulary → automation; low-cardinality label column → classification).`
  },

  // ─── API REFERENCE ────────────────────────────────────────────────────────

  {
    id: "api_endpoints",
    tags: ["api", "endpoints", "rest api", "http", "backend", "routes"],
    aliases: ["api endpoints", "rest api", "api routes", "http endpoints", "backend api"],
    content: `Key API endpoints:
Authentication:
- POST /api/auth/register — register a new user account
- POST /api/auth/login — login and get JWT token
- GET /api/auth/me — get current user profile
- PATCH /api/auth/me — update profile (name)

AI Systems:
- POST /register-ai — register a new AI system
- GET /ai-systems — list all registered AI systems

SDCC Pipeline:
- POST /sdcc/ingest/{ai_name} — upload CSV/JSON log file
- GET /sdcc/status/{ai_name} — check ingestion status and data quality
- GET /validate/{ai_name} — pre-evaluation schema readiness check (NEW)

Evaluation:
- POST /evaluate/{ai_name} — run full TAF evaluation, produces report
- GET /reports/{ai_name} — get audit history for trend charts (NEW)

Black Box:
- POST /blackbox/audit — run API or UI mode black box audit
- GET /blackbox/history/{ai_name} — audit history by AI name
- GET /blackbox/history-all — all audits for current user
- GET /blackbox/audit/{audit_id} — full audit detail

Reports:
- GET /reports/{report_id}/pdf — download full PDF audit report

Extension:
- POST /api/v1/audit/score — submit Chrome extension probe results for scoring

Health:
- GET /health — load balancer health check`
  },

  // ─── SCORING MATH ─────────────────────────────────────────────────────────

  {
    id: "scoring_math_detail",
    tags: ["scoring formula", "how calculated", "math", "formula", "weighted average", "param weights"],
    aliases: ["scoring formula", "how is it calculated", "math behind", "formula", "weights", "calculation"],
    content: `Detailed scoring methodology:

1. STRUCTURAL SIGNALS (fill-rate-aware):
   col_score = 0.35 × (column_present ? 1 : 0) + 0.65 × fill_rate
   Example: timestamp column present but 60% null → score = 0.35 + 0.65 × 0.40 = 0.61 → 61 (not 100)

2. WEIGHTED PARAMETER SCORING:
   principle_score = Σ(param_score × weight) / Σ(weights)
   Each principle has 5 sub-parameters with explicit weights summing to 1.0

3. METRIC BOOST:
   Each model metric is routed to specific principles with influence weights.
   boost = sum(metric_quality × influence_weight) × 20 pts max
   Example: ROC-AUC = 0.91 (Low risk = 1.0 quality pts) → Reliability boost += 1.0 × 0.45 × 20 = 9 pts

4. UNAVAILABILITY FLOOR:
   Missing metric columns default to 12 (not 30-35 as in older versions)
   
5. IMPORTANCE-WEIGHTED OVERALL:
   overall = Σ(principle_score × importance_weight) / Σ(importance_weights)
   Safety/Accountability: 1.20×, Fairness/Security: 1.15×, Sustainability: 0.80×

6. CONFIDENCE BAND:
   uncertainty = volume_factor + metric_availability_factor + data_quality_factor
   confidence_pct = 100 - 2 × uncertainty, clamped to [20, 95]`
  },

  // ─── ACCOUNT & AUTH ───────────────────────────────────────────────────────

  {
    id: "account_auth",
    tags: ["login", "register", "account", "jwt", "authentication", "password", "sign up", "sign in"],
    aliases: ["login", "sign in", "register account", "create account", "authentication", "jwt", "password reset"],
    content: `Account management:
- Registration: POST /api/auth/register with name, email, and password (min 8 characters)
- Login: POST /api/auth/login returns a JWT bearer token; store in localStorage/sessionStorage for subsequent requests
- All protected endpoints require "Authorization: Bearer {token}" header
- The JWT contains: user email (sub), user_id, and role (currently all users are "auditor" role)
- Profile: GET /api/auth/me returns id, name, email, role, audit_count, created_at, last_login
- Update: PATCH /api/auth/me allows updating name
Password security: passwords are stored as bcrypt hashes. Corrupted/unhashed passwords trigger a "Please re-register" error.
Audit count: increments each time you run a black box audit.`
  },

  // ─── GENERIC CONVERSATIONAL ───────────────────────────────────────────────

  {
    id: "greetings",
    tags: ["hi", "hello", "hey", "greetings", "howdy", "sup", "wassup", "what's up", "how are you", "how r u"],
    aliases: ["hi", "hello", "hey", "howdy", "whats up", "wassup", "sup", "how are you", "how r u", "hiya", "yo"],
    content: `GREETING_RESPONSE`
  },

  // ─── GETTING STARTED ──────────────────────────────────────────────────────

  {
    id: "getting_started",
    tags: ["getting started", "first steps", "how to start", "new user", "quickstart", "begin", "setup"],
    aliases: ["getting started", "how do i start", "where do i begin", "first time", "new to this", "setup guide"],
    content: `Getting started with Auditable AI™ — step by step:
1. Create an account at the platform login page
2. Register your AI system: give it a name, description, and domain (this is used to generate targeted audit probes)
3. Choose your audit path:
   - Have logs? → Upload via SDCC (CSV or JSON) → run Evaluate
   - No logs yet? → Use Enterprise Self-Assessment for a questionnaire-based score
   - Want to audit an external AI? → Use Black Box Audit (API or UI mode)
   - Want to audit in your browser? → Install the Chrome Extension
4. View your Report — overall score, per-principle breakdown, findings, and PDF download
5. Address findings and re-audit to track improvement over time
The most impactful first step for log-based evaluation: make sure your log file includes timestamp, model_version, user_id, and any model-specific metrics.`
  },

  {
    id: "probes_vs_evaluation",
    tags: ["difference", "probes vs evaluation", "black box vs evaluate", "which to use", "audit type"],
    aliases: ["difference between", "probes vs logs", "black box vs full eval", "which audit", "compare audit types"],
    content: `The platform has two distinct audit approaches:
1. Log-Based Evaluation (SDCC + Evaluate): You upload historical AI logs → SDCC processes them → the evaluation engine scores all 10 TAF principles based on actual logged data. Best for: production AI systems you own and operate.
2. Black Box Audit: The platform sends live governance probes to an external AI system and scores the responses. No log access needed. Best for: auditing AI systems you don't own, third-party models, or vendor AI APIs.
3. Self-Assessment: Questionnaire-based — no logs, no live probing. Best for: early-stage systems or quick compliance checks.
4. Chrome Extension: Same as Black Box but runs directly in your browser against chat interfaces like ChatGPT or Gemini.
You can use multiple approaches for the same AI system — they each produce independent reports.`
  },

  {
    id: "improve_score_guide",
    tags: ["improve score", "increase score", "fix score", "better score", "how to improve", "quick wins"],
    aliases: ["improve my score", "increase governance score", "fix governance", "better audit score", "quick wins"],
    content: `Fastest ways to improve your governance score, roughly in order of impact:
1. Add a timestamp column — boosts Accountability (25% weight), Privacy, and Reliability
2. Add model_version column — boosts Transparency and Accountability
3. Add user_id or session_id — boosts Accountability (User Attribution sub-parameter)
4. Add error/exception column — Accountability's Error Logging sub-parameter
5. Add is_safe or safety column — boosts Security and Safety
6. Add contains_pii column — even if always false, boosts Privacy significantly
7. For classification models: fix class imbalance — Fairness drops hard with severe imbalance
8. Upload more records — low log volume widens the confidence band and limits Accountability score
9. For RAG: add faithfulness and hallucination_rate columns — critical for Reliability and Safety
10. For automation: log human_override — Safety will score very low without it
The schema validator at /validate/{ai_name} will tell you exactly which columns you're missing and their impact.`
  },

  {
    id: "enterprise_pricing",
    tags: ["pricing", "cost", "enterprise", "plan", "subscription", "how much"],
    aliases: ["pricing", "how much does it cost", "enterprise plan", "subscription cost", "plans"],
    content: `Pricing and commercial details for the Auditable AI™ platform are managed separately from this assistant. For pricing, enterprise licensing, or commercial enquiries, you'd need to contact the Auditable AI™ team directly. What I can help with is understanding the platform features so you know what you'd be paying for.`
  },

  {
    id: "data_security",
    tags: ["data security", "is my data safe", "where is data stored", "data storage", "upload security"],
    aliases: ["data security", "data safe", "data stored", "upload security", "is data private", "data protection platform"],
    content: `Regarding platform data security: uploaded log files are processed server-side for evaluation and stored for up to 2,000 sample rows to avoid re-uploading. Authentication uses JWT bearer tokens. Passwords are stored as bcrypt hashes. For detailed data retention, residency, and security certifications for your specific compliance requirements, contact the platform team directly — I can answer technical questions about how the scoring works, but not contractual or infrastructure-level data handling specifics.`
  },

  {
    id: "validate_endpoint",
    tags: ["validate", "schema check", "readiness", "pre evaluation", "schema validator", "ready to evaluate"],
    aliases: ["validate", "schema validator", "check schema", "pre eval", "readiness check", "am i ready to evaluate"],
    content: `Before running a full evaluation, you can check if your uploaded data is ready using the schema validator:
GET /validate/{ai_name}
This returns:
- readiness_score (0–100): overall schema readiness
- missing_metric_columns: which model-specific columns are absent
- missing_governance_columns: which universal governance columns are missing
- column_coverage: fill-rate per detected column
- recommendation: plain-English description of what to add
A readiness score below 50 means your evaluation results will have wide confidence bands and many scores near the unavailability floor of 12. Adding the suggested columns before evaluating will significantly improve score accuracy.`
  },

  {
    id: "trend_history",
    tags: ["history", "previous audit", "audit history", "compare audits", "trend", "over time", "how am i doing"],
    aliases: ["audit history", "previous scores", "trend over time", "compare to last", "how have i improved", "history chart"],
    content: `The platform tracks all evaluations for each registered AI system over time.
- GET /reports/{ai_name} returns the full audit history as a list of scored reports, used to render trend charts
- Each new evaluation automatically compares against the most recent prior audit and produces a delta per principle
- Principles that dropped by 5+ points trigger regression alerts
- Principles that improved by 5+ points are highlighted
- The overall weighted delta is shown in the report header
To view trend history in the UI: navigate to your AI system on the Dashboard → select View Reports → the trend chart shows score evolution across all past audits.`
  },

  {
    id: "what_is_taf",
    tags: ["taf", "trusted ai framework", "kpmg taf", "what is taf", "framework"],
    aliases: ["taf", "trusted ai framework", "kpmg framework", "what does taf stand for", "kpmg taf"],
    content: `TAF stands for Trusted AI Framework — it's KPMG's proprietary standard for evaluating and governing AI systems responsibly. It defines 10 governance principles grouped into three value clusters: Values-Led (Fairness, Accountability, Privacy, Sustainability), Trustworthy (Transparency, Explainability, Data Integrity, Reliability, Security), and Human-Centric (Safety). The Auditable AI™ platform operationalises TAF by scoring AI systems across all 10 principles using actual log data, black box probing, or self-assessment questionnaires. Each principle maps to specific regulatory controls in EU AI Act, ISO 42001, and NIST AI RMF.`
  },

  {
    id: "cookie_editor",
    tags: ["cookie", "cookie editor", "authentication", "ui mode", "login cookies", "session cookies"],
    aliases: ["cookie editor", "cookies", "how to get cookies", "authenticated ui audit", "session"],
    content: `For Black Box UI Mode auditing of authenticated interfaces (e.g. a company's internal AI tool behind a login), you can provide session cookies to allow the audit to interact with the authenticated session.
How to get cookies:
1. Install the Cookie-Editor browser extension (available for Chrome and Firefox)
2. Log in to the target AI interface in your browser
3. Open Cookie-Editor and click Export → Copy All
4. Paste the JSON cookie string into the Black Box Audit UI Mode cookies field
The platform uses Playwright browser automation to interact with the UI, injecting the cookies to maintain the authenticated session during probing. Note: only use cookies from systems you are authorised to audit.`
  },

  {
    id: "score_is_35",
    tags: ["score 35", "score floor", "minimum score", "default score", "unavailability floor"],
    aliases: ["score stuck at 35", "floor score", "why 35", "why default", "unavailability floor", "minimum baseline"],
    content: `If your scores seem stuck around 12–35 for most principles, you're hitting the unavailability floor. When a metric column is completely absent from your uploaded data, the platform defaults it to a floor score of 12 (this was increased from earlier versions where it was 30–35). This prevents systems from scoring Moderate just by logging nothing. The fix is straightforward: add the relevant columns to your log file. Run /validate/{ai_name} first — it will tell you exactly which columns are missing and which principles they affect. Even adding just timestamp, model_version, and user_id can push the score from the 20s to the 50–60 range.`
  },
];