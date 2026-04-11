

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether, Image as RLImage
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import mm, inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Circle, Wedge
from reportlab.graphics import renderPDF, renderPM


def _drawing_to_image(drawing, width, height, scale=2):
    """Render a Drawing to a PNG BytesIO at 2x scale for crispness."""
    buf = BytesIO()
    renderPM.drawToFile(drawing, buf, fmt='PNG', dpi=144)
    buf.seek(0)
    return RLImage(buf, width=width, height=height)
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
from io import BytesIO
import datetime
import math

from app.database import reports_collection
from app.dependencies import get_current_user

router = APIRouter(tags=["reports"])

# ─── KPMG Brand Colours ──────────────────────────────────────────────────────
KPMG_BLUE       = colors.HexColor("#00338D")
KPMG_TEAL       = colors.HexColor("#00C896")
KPMG_LIGHT_BLUE = colors.HexColor("#0091DA")
KPMG_DARK       = colors.HexColor("#050d1a")
KPMG_GREY       = colors.HexColor("#6B7280")
KPMG_LIGHT_GREY = colors.HexColor("#F3F4F6")
KPMG_MID_GREY   = colors.HexColor("#E5E7EB")
KPMG_WHITE      = colors.white
KPMG_RED        = colors.HexColor("#DC2626")
KPMG_AMBER      = colors.HexColor("#D97706")
KPMG_GREEN      = colors.HexColor("#059669")

PRINCIPLE_COLORS = {
    "Fairness":       "#00338D",
    "Transparency":   "#005EB8",
    "Explainability": "#0091DA",
    "Accountability": "#00338D",
    "Data Integrity": "#005EB8",
    "Reliability":    "#0091DA",
    "Security":       "#00338D",
    "Safety":         "#005EB8",
    "Privacy":        "#0091DA",
    "Sustainability":  "#00338D",
}

PRINCIPLE_ICONS = {
    "Fairness":       "F",
    "Transparency":   "T",
    "Explainability": "E",
    "Accountability": "A",
    "Data Integrity": "D",
    "Reliability":    "R",
    "Security":       "Se",
    "Safety":         "Sa",
    "Privacy":        "P",
    "Sustainability":  "Su",
}

PRINCIPLE_DESCRIPTIONS = {
    "Fairness": (
        "AI solutions should be designed to reduce or eliminate bias against individuals, "
        "communities, and groups. Ongoing bias monitoring and equal error rates across groups "
        "must be maintained across the full AI model lifecycle."
    ),
    "Transparency": (
        "AI solutions should include responsible disclosure to provide stakeholders with a "
        "clear understanding of what is happening in each solution across the AI lifecycle, "
        "including training data, model architecture, known failure modes, and uncertainty levels."
    ),
    "Explainability": (
        "AI solutions should be developed and delivered in a way that answers the questions of how "
        "and why a conclusion was drawn from the solution. This includes local explanations, global "
        "model behaviour, and confidence quantification for all relevant stakeholders."
    ),
    "Accountability": (
        "Human oversight and responsibility should be embedded across the AI lifecycle to manage "
        "risk and comply with applicable laws and regulations. Clear governance structures, "
        "comprehensive audit trails, and escalation procedures must assign and enforce accountability."
    ),
    "Data Integrity": (
        "Data used in AI solutions should be acquired in compliance with applicable laws and "
        "assessed for accuracy, completeness, appropriateness, and quality to drive trusted "
        "decisions. Data provenance, deduplication, and schema enforcement must be maintained."
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

# ─── Extended sub-parameter definitions ──────────────────────────────────────
SUB_PARAMETER_DEFINITIONS = {
    # Fairness
    "Compression Equity Across Topics": (
        "Measures whether the AI model applies consistent summarisation depth and quality across "
        "different subject domains and topic categories. A high score confirms that no topic area "
        "receives preferential treatment or is systematically under-served in the model's outputs."
    ),
    "Output Length Equity": (
        "Evaluates whether responses are proportionally sized relative to input complexity, "
        "regardless of which user group or query type initiated the request. Disparate output "
        "lengths may signal that certain inputs are deprioritised or under-resourced."
    ),
    "Source Representativeness": (
        "Assesses the diversity and breadth of training or reference data sources. A high score "
        "indicates that the AI draws from a wide range of representative corpora, reducing the "
        "risk of encoded historical bias or skewed world-views in generated content."
    ),
    "Fairness Monitoring Signals": (
        "Checks for the presence of active runtime mechanisms that detect and flag unfair outcomes "
        "during live inference. This includes bias dashboards, disparity alerts, periodic sampling "
        "audits, and automated equalised-odds checks across demographic dimensions."
    ),
    # Transparency
    "Source Document Coverage": (
        "Quantifies what percentage of input documents or data sources are explicitly acknowledged "
        "and cited in the AI's outputs. High coverage ensures stakeholders can trace claims back "
        "to their origin, supporting audit trails and reducing the risk of unverifiable assertions."
    ),
    "Compression Ratio Transparency": (
        "Evaluates whether the system discloses how much information reduction occurs between "
        "source material and generated output. This is critical for users to understand the risk "
        "of information loss and to calibrate their reliance on AI-generated summaries."
    ),
    "Reference Summary Logging": (
        "Checks whether human-authored reference summaries are stored alongside model outputs for "
        "supervised quality evaluation. Without reference logs, it is impossible to quantify "
        "abstraction quality or validate that the model meets accuracy benchmarks over time."
    ),
    "Model Versioning": (
        "Verifies that every inference output is tagged with the specific model version that "
        "produced it. Version tracking is essential for reproducing results, conducting root-cause "
        "analysis on regressions, and ensuring compliance with audit obligations."
    ),
    # Explainability
    "Faithfulness to Source": (
        "Measures the semantic alignment between model outputs and the factual content of source "
        "documents. Faithful outputs do not introduce hallucinated facts, unsupported inferences, "
        "or misleading paraphrases. This is calculated using entailment scoring and ROUGE overlap."
    ),
    "Abstractiveness Balance": (
        "Evaluates the optimal trade-off between extractive quotation (copying verbatim) and "
        "abstractive paraphrasing. A well-balanced model produces outputs that are readable and "
        "novel while remaining factually grounded in the source material."
    ),
    "ROUGE-L Alignment": (
        "Recall-Oriented Understudy for Gisting Evaluation — Longest Common Subsequence (ROUGE-L) "
        "measures the longest matching token sequence between generated and reference text. "
        "Higher scores correlate with better information preservation and structural similarity."
    ),
    "Summary Readability": (
        "Assesses the linguistic accessibility of AI-generated outputs using readability metrics "
        "such as Flesch Reading Ease, Gunning Fog Index, and sentence length distribution. "
        "Outputs should be comprehensible to the intended audience without specialist knowledge."
    ),
    # Accountability
    "Reference Summary Coverage": (
        "Measures the proportion of model outputs that have a paired human-authored reference "
        "for quality benchmarking. Without reference coverage, there is no mechanism for "
        "systematically identifying errors, establishing performance baselines, or running "
        "comparative evaluations across model versions."
    ),
    "Human Review Escalation": (
        "Verifies that formal pathways exist for escalating AI outputs to human reviewers when "
        "confidence falls below a threshold, when sensitive topics are detected, or when outputs "
        "have high-stakes downstream consequences. Clear escalation procedures are a governance "
        "requirement under EU AI Act Article 14."
    ),
    "Error & Limitation Logging": (
        "Checks whether system errors, model limitations, and known failure modes are systematically "
        "recorded in a structured log accessible to governance teams. Comprehensive error logging "
        "is fundamental to incident management, continuous improvement, and regulatory audit readiness."
    ),
    "Audit Trail Coverage": (
        "Evaluates the completeness of the end-to-end audit trail, from data ingestion through "
        "inference to output delivery. A complete audit trail records who initiated each request, "
        "what data was used, which model version responded, and what output was delivered — "
        "enabling full accountability reconstruction."
    ),
    # Data Integrity
    "Summary Completeness": (
        "Measures whether AI-generated outputs capture all key information points from the source "
        "material without critical omissions. Evaluated against ROUGE-1 recall scores and "
        "information coverage metrics. Incomplete summaries risk misleading downstream decisions."
    ),
    "ROUGE-1 Quality": (
        "ROUGE-1 measures unigram (single-word) overlap between generated and reference text. "
        "It is a proxy for information recall at the lexical level. Low ROUGE-1 scores indicate "
        "that key terms and concepts from the source are being systematically omitted."
    ),
    "BLEU Score Quality": (
        "Bilingual Evaluation Understudy (BLEU) measures n-gram precision between model outputs "
        "and human references. Originally designed for machine translation, BLEU in summarisation "
        "contexts rewards outputs that closely match reference phrasing and vocabulary patterns."
    ),
    "Format Consistency": (
        "Assesses whether model outputs consistently adhere to expected structural formats — "
        "including length constraints, section headings, bullet structures, and schema compliance. "
        "Inconsistent formatting impairs downstream automation and user trust."
    ),
    # Reliability
    "Faithfulness Stability": (
        "Evaluates whether the model produces consistently faithful outputs across repeated runs "
        "on identical inputs. High variance in faithfulness indicates non-deterministic behaviour "
        "that undermines reliability guarantees and makes SLA commitments difficult to enforce."
    ),
    "Summary Output Consistency": (
        "Measures the degree to which the model produces structurally and semantically similar "
        "outputs when presented with equivalent inputs across different sessions, time periods, "
        "or deployment environments. Consistency is foundational for production reliability."
    ),
    "ROUGE-L Consistency": (
        "Tracks the variance in ROUGE-L scores across inference runs on a fixed test set. "
        "Low variance indicates that the model's token-sequence alignment with references is "
        "stable and predictable, supporting performance SLA management."
    ),
    "BERTScore Semantic Consistency": (
        "Uses BERT contextual embeddings to measure semantic similarity between generated and "
        "reference outputs. BERTScore captures meaning-level alignment beyond surface lexical "
        "overlap, providing a more robust reliability signal for paraphrastic or abstractive models."
    ),
    # Security
    "Source Document Injection Rate": (
        "Measures the frequency of successful prompt injection attempts via maliciously crafted "
        "input documents. A low injection rate confirms that the model and its surrounding "
        "infrastructure apply robust input sanitisation and output filtering."
    ),
    "Harmful Content in Summaries": (
        "Evaluates the rate at which model outputs contain harmful, offensive, defamatory, or "
        "policy-violating content. Assessed using content moderation classifiers, keyword blocklists, "
        "and human spot-checking protocols. High scores require zero-tolerance guardrails."
    ),
    "PII in Summaries": (
        "Checks whether personally identifiable information (PII) from source documents is "
        "inadvertently reproduced in model outputs. PII leakage represents a privacy and security "
        "breach with direct regulatory consequences under GDPR, CCPA, and DPDP Act 2023."
    ),
    "Input Anomaly Rate": (
        "Monitors the proportion of incoming requests that exhibit anomalous patterns — such as "
        "unusually long inputs, repeated adversarial sequences, encoding exploits, or statistical "
        "outliers. High anomaly rates may indicate active attacks or systematic misuse."
    ),
    # Safety
    "Faithfulness as Safety Guard": (
        "Treats high faithfulness scores as a safety proxy: a model that stays close to source "
        "material is less likely to generate dangerous hallucinations, fabricated medical advice, "
        "or misleading factual claims. Faithfulness monitoring therefore serves a dual governance role."
    ),
    "Hallucinated Facts Prevention": (
        "Measures the rate at which the model generates factual claims not supported by source "
        "documents. Hallucination detection employs NLI (Natural Language Inference) models, "
        "entity verification, and knowledge-base cross-referencing. Zero-tolerance is required "
        "in high-stakes domains such as healthcare, legal, and financial services."
    ),
    "Human Override Capability": (
        "Verifies that human operators can intervene to halt, modify, or reverse AI decisions "
        "at any point in the inference pipeline. Override mechanisms must be accessible without "
        "specialist knowledge and must take effect within operationally acceptable timeframes."
    ),
    "Harmful Summary Rate": (
        "Tracks the proportion of outputs that could cause direct or indirect harm if acted upon "
        "by end users. Harm categories include: medical misinformation, legal misrepresentation, "
        "financial fraud facilitation, and content that could endanger vulnerable individuals."
    ),
    # Privacy
    "PII Leakage from Source Docs": (
        "Quantifies how frequently source document PII (names, addresses, identification numbers, "
        "biometric references) appears in generated outputs. Even partial PII reproduction can "
        "constitute a data breach. Requires differential privacy techniques or pre-processing "
        "anonymisation pipelines before documents enter the inference system."
    ),
    "Summary Data Minimisation": (
        "Evaluates whether AI outputs contain only the minimum personal data necessary to fulfil "
        "the stated purpose. Data minimisation is a foundational GDPR principle (Article 5(1)(c)) "
        "and must be actively enforced through output filtering, not assumed by default."
    ),
    "Anonymisation in Summaries": (
        "Checks the effectiveness of anonymisation techniques applied to personal data before "
        "or during summarisation. Evaluates k-anonymity, l-diversity, and pseudonymisation "
        "mechanisms. Ineffective anonymisation may be re-identifiable and remains subject to "
        "data protection obligations."
    ),
    "Sensitive Content Retention": (
        "Measures how long sensitive or personal content is retained within the AI system's "
        "processing pipeline, caches, and logs after a request is completed. Retention beyond "
        "the stated purpose violates data minimisation principles and creates unnecessary breach risk."
    ),
    # Sustainability
    "Compression Efficiency": (
        "Evaluates the ratio of meaningful information preserved relative to computational "
        "resources expended during inference. High compression efficiency means the model "
        "delivers high information density per GPU cycle, reducing both cost and carbon footprint."
    ),
    "Non-Redundancy Score": (
        "Measures the degree to which generated outputs avoid unnecessary repetition of "
        "information already stated. Redundant outputs consume storage, bandwidth, and reader "
        "attention — all of which have environmental and economic costs at scale."
    ),
    "Intra-Summary Redundancy": (
        "Evaluates whether individual outputs contain self-referential repetition within a single "
        "document. High intra-summary redundancy degrades user experience and inflates token "
        "consumption, increasing inference costs and emissions."
    ),
    "Cross-Summary Deduplication": (
        "Checks whether the system eliminates duplicate content across multiple outputs generated "
        "from overlapping source documents. Effective deduplication reduces storage requirements "
        "and prevents the same information being processed multiple times unnecessarily."
    ),
}


def score_to_color(score: int) -> colors.Color:
    if score >= 75:
        return KPMG_GREEN
    elif score >= 55:
        return KPMG_AMBER
    else:
        return KPMG_RED


def score_to_label(score: int) -> str:
    if score >= 75:
        return "High"
    elif score >= 55:
        return "Medium"
    else:
        return "Low"


def risk_color(level: str) -> colors.Color:
    return {
        "Low": KPMG_GREEN,
        "Moderate": KPMG_AMBER,
        "High": KPMG_RED,
        "Critical": colors.HexColor("#7F1D1D"),
    }.get(level, KPMG_GREY)


def _pct(value: float) -> str:
    return f"{round(value * 100)}%"


def _derive_parameter_context(report: dict) -> dict:
    diagnostics = report.get("diagnostics", {}) or {}
    logs_count = report.get("logs_evaluated", 0) or 0
    total_cols = diagnostics.get("total_columns", 1) or 1
    text_cols = diagnostics.get("text_columns", 0) or 0
    numeric_cols = diagnostics.get("numeric_columns", 0) or 0
    schema_conf = diagnostics.get("schema_confidence", 0) or 0
    missing_ratio = diagnostics.get("missing_ratio", 0) or 0
    duplicates = diagnostics.get("duplicates", 0) or 0
    column_names = [str(c).lower() for c in diagnostics.get("column_names", [])]

    def has_any(keys):
        return any(k in column_names for k in keys)

    def clamp(v: float) -> int:
        return max(0, min(100, int(round(v))))

    return {
        "diagnostics": diagnostics,
        "logs_count": logs_count,
        "total_cols": total_cols,
        "text_cols": text_cols,
        "numeric_cols": numeric_cols,
        "schema_score": clamp(schema_conf * 100),
        "completeness": clamp((1 - missing_ratio) * 100),
        "duplicate_penalty": clamp(max(0, 100 - (duplicates / max(logs_count, 1)) * 500)),
        "volume_score": clamp(min(logs_count / 100 * 100, 100)),
        "column_diversity": clamp(min(total_cols / 10 * 100, 100)),
        "has_input": has_any(["input", "prompt", "query", "text", "question"]),
        "has_output": has_any(["output", "response", "answer", "prediction", "result"]),
        "has_label": has_any(["label", "class", "target", "ground_truth"]),
        "has_timestamp": has_any(["timestamp", "date", "time", "created_at"]),
        "has_user_id": has_any(["user_id", "user", "session_id", "session"]),
        "has_score": has_any(["score", "confidence", "probability", "prob"]),
        "has_feedback": has_any(["feedback", "rating", "review", "human_eval"]),
        "has_safety": has_any(["is_safe", "safety", "flagged", "moderated"]),
        "has_pii": has_any(["contains_pii", "pii", "personal"]),
        "has_version": has_any(["model_version", "version", "model_id"]),
        "has_latency": has_any(["latency", "response_time", "duration"]),
        "has_error": has_any(["error", "exception", "failed"]),
        "has_halluc": has_any(["hallucination", "faithfulness", "groundedness"]),
        "has_rouge": has_any(["rouge", "bleu", "meteor", "bertscore"]),
        "model_type": report.get("model_type", "N/A"),
    }


def _parameter_explanation(param: str, report: dict) -> tuple[str, str]:
    """
    Returns (definition, calculation) for each sub-parameter.
    Definition: a rich governance explanation for a CEO-level reader.
    Calculation: the formula used to derive the score from the dataset.
    """
    c = _derive_parameter_context(report)
    io_bonus = 20 if (c["has_input"] and c["has_output"]) else (10 if (c["has_input"] or c["has_output"]) else 0)
    model_bonus = 80 if c["model_type"] == "classification" else 60
    missing_pct = _pct(c['diagnostics'].get('missing_ratio', 0) or 0)
    details = {
        # ── FAIRNESS ─────────────────────────────────────────────────────────────
        "Class Balance in Detections": (
            "Measures whether the AI system produces outputs that are proportionally distributed across all target classes "
            "or categories. Imbalanced class detections can indicate systemic bias, where the model disproportionately "
            "favours or penalises certain groups. Sustained imbalance in production can lead to regulatory scrutiny under "
            "the EU AI Act and discriminatory outcomes in high-stakes decisions.",
            "Derived from class distribution analysis across detection outputs in the ingested dataset."
        ),
        "Detection Equity Across Groups": (
            "Evaluates whether the AI system's detection accuracy, precision, and recall are statistically consistent "
            "across identifiable demographic or categorical groups. Unequal error rates across groups constitute "
            "algorithmic discrimination. This parameter is directly referenced in the EU AI Act Article 10 and ISO/IEC "
            "42001 Clause 6.1.2 as a mandatory governance check before deployment.",
            "Derived from error-rate and detection-rate stratification across available group signals in the dataset."
        ),
        "Label Class Representativeness": (
            "Assesses whether the training or evaluation labels adequately represent the real-world distribution of "
            "outcomes the AI system is intended to address. Under-representation of minority classes leads to systematic "
            "underperformance on those groups, often invisible in aggregate accuracy metrics. Organisations must ensure "
            "training data diversity is documented and verifiable for audit purposes.",
            "Computed from label class distribution entropy and comparison against expected population-level baselines."
        ),
        "Fairness Monitoring Signals": (
            "Determines whether the deployed system has active mechanisms for continuous bias monitoring post-deployment. "
            "Point-in-time fairness assessments are insufficient — regulatory frameworks now require ongoing monitoring "
            "with automated alerting when fairness drift exceeds defined thresholds. Absence of monitoring signals is "
            "treated as a critical governance gap by KPMG Trusted AI auditors.",
            "100 if fairness monitoring fields (feedback, demographic_group, protected_attribute) are present; else 0."
        ),
        "Bias Indicator Fields": (
            "Checks for the presence of structured fields that enable bias tracking over time — including demographic "
            "identifiers, group labels, protected attributes, or human evaluation feedback. Without these fields, it is "
            "impossible to retrospectively investigate discriminatory outcomes or respond to regulatory enquiries. Their "
            "presence demonstrates proactive governance rather than reactive compliance.",
            "100 with feedback/demographic fields; 60 with labels only; 30 with no identifiable bias-tracking fields."
        ),
        "Missing Data Equity": (
            "Examines whether missing data is distributed uniformly across the dataset or whether it is concentrated "
            "in specific groups or categories. Non-random missingness (MNAR — Missing Not At Random) disproportionately "
            "impacts underrepresented groups and can introduce silent bias into model outputs. This parameter penalises "
            "datasets where high overall missingness compromises fairness confidence.",
            f"clamp((1 - missing_ratio {missing_pct} x 2) x 100) — heavy missing data reduces fairness assurance."
        ),
        "Label Balance": (
            "Measures whether ground truth labels are available and balanced across the dataset. Datasets without "
            "labels cannot be audited for bias, accuracy, or fairness. Labelled data with extreme class imbalance "
            "(e.g., 95%/5% splits) requires resampling, class weighting, or stratified evaluation to prevent "
            "misleading aggregate metrics from masking poor performance on minority classes.",
            "80 if label/target field is present; 50 otherwise. Penalised for extreme imbalance if detected."
        ),
        "Demographic Coverage": (
            "Estimates the breadth of demographic or categorical coverage in the dataset, using the ratio of "
            "text-type columns as a structural proxy for group-level metadata. Rich text fields often encode "
            "demographic context that supports fairness analysis. Low coverage signals that the dataset may "
            "be insufficiently diverse for equitable governance assessment.",
            f"clamp(60 + (text_columns {c['text_cols']} / total_columns {c['total_cols']}) x 40)"
        ),
        # ── TRANSPARENCY ─────────────────────────────────────────────────────────
        "Schema Confidence": (
            "Quantifies how reliably the dataset's structure could be inferred — including field types, naming "
            "conventions, and column consistency. High schema confidence indicates a well-governed data pipeline "
            "with enforced contracts. Low schema confidence suggests ad-hoc or undocumented data flows, making "
            "it difficult to trace model inputs and provide meaningful stakeholder disclosure.",
            f"schema_confidence ({_pct(c['diagnostics'].get('schema_confidence', 0) or 0)}) x 100 = {c['schema_score']}"
        ),
        "Field Documentation": (
            "Assesses whether the dataset includes clearly defined input, output, and contextual fields — the "
            "minimum documentation required to explain AI behaviour to stakeholders. Undocumented fields impede "
            "the creation of model cards, data sheets, and regulatory disclosures. Well-documented schemas "
            "directly support EU AI Act Article 13 transparency obligations.",
            f"clamp(io_bonus {io_bonus} x 4 + schema_score {c['schema_score']} x 0.2)"
        ),
        "Confidence Score Disclosure": (
            "Determines whether the AI system exposes its output confidence or probability scores to downstream "
            "stakeholders. Confidence disclosure is foundational to transparent AI — it allows users to calibrate "
            "their trust in individual predictions and enables human-in-the-loop review for borderline decisions. "
            "Concealing confidence scores from users is considered a transparency violation under NIST AI RMF.",
            "100 if confidence/probability score field is present in the dataset; 40 otherwise."
        ),
        "Bounding Box / Label Visibility": (
            "For object detection and image classification systems, this parameter verifies that spatial detection "
            "results (bounding boxes, segmentation masks, class labels) are explicitly included in the output record. "
            "Without visible, structured output representations, it is impossible for users or auditors to validate "
            "what the model detected, where, and with what degree of confidence.",
            "100 if bounding box / label output fields are present in the evaluation records; else 0."
        ),
        "Detection Result Logging": (
            "Verifies that each inference event is systematically logged with sufficient detail to support post-hoc "
            "auditing. Logging must capture input identifiers, output predictions, confidence levels, model version, "
            "and timestamp at minimum. Incomplete logs prevent incident investigation, regulatory response, and "
            "continuous improvement. EU AI Act Article 12 mandates automatic logging for high-risk AI systems.",
            "100 if a comprehensive result log structure is detected in the dataset; 0 if logging is absent."
        ),
        "Model Version Tracking": (
            "Checks whether model predictions can be traced back to a specific, versioned model deployment. "
            "Version tracking is essential for reproducibility — if a model is updated, historical predictions "
            "must remain linkable to the version that produced them. Without this linkage, post-deployment "
            "incident investigation and regulatory accountability become impossible.",
            "100 if version/model_id field is present in the dataset; 30 otherwise."
        ),
        "Input/Output Coverage": (
            "Measures whether both the request (input) and response (output) of each AI interaction are captured "
            "in the logs. Complete input-output pairs are the minimum evidential standard for AI auditability. "
            "Systems that log only outputs cannot verify whether observed failures originated from input quality "
            "issues or model behaviour, complicating root-cause analysis and regulatory disclosure.",
            f"clamp(io_bonus {io_bonus} x 4.5) — based on presence of both input and output fields."
        ),
        "Column Completeness": (
            "Evaluates the breadth of documented fields relative to the full population of fields required for "
            "governance-grade logging. A narrow dataset with few columns may omit critical governance signals "
            "such as timestamps, user identifiers, or model metadata. This parameter blends field breadth with "
            "schema quality to reward well-structured, comprehensive logging designs.",
            f"clamp(column_diversity {c['column_diversity']} x 0.8 + schema_score {c['schema_score']} x 0.2)"
        ),
        # ── EXPLAINABILITY ────────────────────────────────────────────────────────
        "Model Interpretability": (
            "Uses the model family and architecture type as a structural proxy for inherent interpretability. "
            "Linear models, decision trees, and rule-based systems provide native explainability; deep learning "
            "and ensemble methods require additional explainability tooling (SHAP, LIME, attention maps) to "
            "satisfy governance requirements. Model type is a critical disclosure item for all stakeholder levels.",
            f"{model_bonus} based on detected model type — higher for interpretable architectures."
        ),
        "Prediction Confidence": (
            "Verifies that each AI prediction is accompanied by a machine-readable confidence or probability score "
            "that quantifies the model's certainty. Confidence scores enable human reviewers to identify borderline "
            "predictions warranting closer inspection and allow downstream systems to implement dynamic thresholds "
            "for human escalation. Their absence forces binary pass/fail decisions without nuance.",
            "100 if confidence/probability field exists in the dataset; 40 otherwise."
        ),
        "Reasoning Documentation": (
            "Assesses whether the AI system produces or logs structured reasoning artefacts — such as attention "
            "weights, feature importance scores, chain-of-thought outputs, hallucination scores, or faithfulness "
            "metrics. These artefacts allow technical and non-technical stakeholders to understand why a specific "
            "prediction was made, meeting explainability obligations under ISO/IEC 42001 Clause 9.1.",
            "100 with hallucination/faithfulness fields; 60 with ROUGE/BLEU metrics; 35 otherwise."
        ),
        "Feedback Integration": (
            "Checks whether structured human feedback (ratings, corrections, binary approval signals) is captured "
            "alongside model predictions. Human feedback loops are the primary mechanism for continuous explainability "
            "improvement — they surface cases where model outputs are plausible but incorrect, enabling targeted "
            "retraining and governance-level evidence of quality assurance.",
            "100 if feedback/rating field is present; 30 otherwise."
        ),
        "Output Traceability": (
            "Measures whether each AI output can be traced end-to-end from input through prediction to the "
            "downstream action taken. Full traceability creates an evidential chain that regulators, auditors, "
            "and affected parties can follow. Without it, organisations cannot demonstrate that AI-influenced "
            "decisions were made transparently, undermining both compliance and public trust.",
            f"clamp(io_bonus {io_bonus} x 4 + {'20' if c['has_score'] else '0'} confidence bonus)"
        ),
        "Confidence Calibration": (
            "Evaluates whether the AI system's stated confidence scores accurately reflect its empirical accuracy — "
            "a property known as calibration. A well-calibrated model that reports 80% confidence should be correct "
            "approximately 80% of the time across a large sample. Poorly calibrated systems produce overconfident "
            "or underconfident predictions, misguiding human reviewers and causing systematic decision errors.",
            "Derived from comparison of confidence score distribution against observed accuracy in the dataset."
        ),
        "mAP-IoU Alignment": (
            "For object detection systems, Mean Average Precision (mAP) and Intersection over Union (IoU) must be "
            "aligned — high mAP with low IoU indicates the model detects correct categories but localises them "
            "imprecisely. Misalignment between these metrics signals a calibration issue that can undermine "
            "safety-critical applications such as medical imaging, surveillance, and autonomous systems.",
            "Computed from structural alignment between mAP and IoU score fields in the evaluation records."
        ),
        "Label Coverage for Validation": (
            "Measures the percentage of dataset records that carry a ground truth label usable for validation. "
            "Unlabelled records cannot contribute to accuracy, fairness, or safety assessments — they represent "
            "a governance blind spot. High label coverage provides confidence that evaluation metrics are "
            "computed on a representative, complete sample rather than a biased subset.",
            "Proportion of records with non-null label/ground_truth fields relative to total records evaluated."
        ),
        "Detection Output Readability": (
            "Assesses whether detection outputs are structured in a human-readable format that non-technical "
            "stakeholders can interpret without specialist tooling. Outputs must include plain-language labels, "
            "bounding box coordinates (where applicable), and confidence scores in standard units. Cryptic "
            "or numeric-only outputs block effective human oversight and violate EU AI Act Article 13.",
            "Derived from output field structure — penalised for numeric-only or unstructured output formats."
        ),
        # ── ACCOUNTABILITY ────────────────────────────────────────────────────────
        "Ground Truth Annotation Coverage": (
            "Measures whether the dataset contains verified ground truth annotations for a sufficient proportion "
            "of records. Ground truth is the foundational evidence required to demonstrate model accuracy, detect "
            "errors, and assign accountability for incorrect outputs. Without it, no meaningful performance claim "
            "can be substantiated — and no regulatory audit can be completed with confidence.",
            "100 if ground_truth/annotation field is present and >80% populated; proportional score otherwise."
        ),
        "Human Review on Low Confidence": (
            "Checks whether the system has a defined, enforced pathway for routing low-confidence predictions to "
            "human reviewers before any consequential action is taken. This is one of the most critical accountability "
            "controls — automated systems must know their limits and escalate appropriately. Its absence means "
            "the model operates autonomously even when its own outputs are uncertain.",
            "100 if human_review/escalation field is present alongside confidence threshold fields; 0 otherwise."
        ),
        "Error & Misdetection Logging": (
            "Verifies that system errors, false positives, false negatives, and misdetections are explicitly "
            "captured in a dedicated, structured log. Error logging is the primary mechanism for accountability "
            "— it creates an immutable record of system failures that can be reviewed by auditors, regulators, "
            "and affected parties. It also supports root-cause analysis and continuous improvement cycles.",
            "100 if error/exception/misdetection field is present and populated; 0 if absent."
        ),
        "Audit Trail Coverage": (
            "Assesses the completeness of the system's end-to-end audit trail — the chronological record of all "
            "AI-driven decisions, including timestamps, user identifiers, model versions, inputs, and outputs. "
            "A complete audit trail is mandated by the EU AI Act for high-risk systems and is the primary "
            "mechanism by which organisations demonstrate accountability to external regulators.",
            "Derived from timestamp, user_id, and model_version field coverage across the dataset records."
        ),
        "Audit Log Volume": (
            "Uses the volume of logged records as a proxy for the operational maturity of the audit function. "
            "Organisations that log comprehensively generate large, structured datasets that can support robust "
            "statistical analysis, trend detection, and anomaly identification. Small log volumes may indicate "
            "selective logging — a red flag for governance auditors.",
            f"min(logs_evaluated {c['logs_count']} / 100 x 100, 100) = {c['volume_score']}"
        ),
        "Timestamp Coverage": (
            "Verifies that each AI event in the dataset is timestamped with sufficient precision to reconstruct "
            "the sequence of decisions over time. Timestamps are a prerequisite for chronological audit trails, "
            "regulatory incident reporting, and root-cause analysis. Missing timestamps make it impossible to "
            "determine when a specific AI decision was made — a fundamental accountability failure.",
            "100 if timestamp/date/created_at field is present; 20 otherwise."
        ),
        "User Attribution": (
            "Checks whether each AI event can be attributed to an identifiable user session, user ID, or "
            "organisational entity. Attribution is essential for accountability — it allows organisations to "
            "determine who initiated an AI-influenced decision, which system processed it, and which model "
            "version produced the output. Without attribution, accountability chains cannot be established.",
            "High score if user_id/session_id fields exist; graduated penalty for partial or absent attribution."
        ),
        "Model Version Control": (
            "Verifies that the model version or deployment identifier is recorded alongside each prediction. "
            "As models are updated, version control ensures that historical predictions remain traceable to the "
            "specific model that produced them. This is essential for post-deployment incident investigation, "
            "regulatory evidence submission, and comparing performance across model generations.",
            "100 if version/model_id field exists in the dataset; 30 otherwise."
        ),
        "Error/Exception Logging": (
            "Checks whether system exceptions, runtime errors, and processing failures are systematically "
            "captured in a structured format. Exception logging is not merely a technical best practice — "
            "it is a governance requirement. Unlogged failures create invisible accountability gaps and "
            "prevent organisations from demonstrating that error handling was in place at the time of an incident.",
            "100 if error/exception field is present and populated in the dataset; 35 otherwise."
        ),
        # ── DATA INTEGRITY ────────────────────────────────────────────────────────
        "Data Completeness": (
            "Measures the proportion of dataset records that are fully populated — with no missing values in "
            "critical fields. Incomplete records degrade model performance, introduce hidden biases, and "
            "undermine the reliability of any governance assessment performed on the data. High data "
            "completeness is a prerequisite for credible audit evidence and defensible regulatory submissions.",
            f"(1 - missing_ratio {missing_pct}) x 100 = {c['completeness']}"
        ),
        "Completeness Score": (
            "Measures the proportion of dataset records that are fully populated across all schema fields. "
            "Completeness is the most fundamental dimension of data quality — incomplete records cannot "
            "be reliably used for training, evaluation, or governance assessment. Organisations must "
            "implement automated completeness checks as part of their data pipeline governance.",
            f"(1 - missing_ratio {missing_pct}) x 100 = {c['completeness']}"
        ),
        "Duplicate-Free Rate": (
            "Quantifies the proportion of unique records in the dataset — penalising datasets with high "
            "rates of exact or near-exact duplicates. Duplicate records skew frequency-based metrics, "
            "inflate apparent data volume, and can introduce systematic bias if duplicates are concentrated "
            "in specific classes or groups. Deduplication is a mandatory step in governance-grade data pipelines.",
            f"clamp(100 - (duplicates {c['diagnostics'].get('duplicates', 0) or 0} / logs {max(c['logs_count'], 1)}) x 500) = {c['duplicate_penalty']}"
        ),
        "Schema Consistency": (
            "Evaluates whether the dataset adheres to a consistent, enforced schema across all records — "
            "including consistent field naming, data types, and value formats. Inconsistent schemas indicate "
            "weak data governance and can cause silent failures during model inference. Schema enforcement "
            "is a foundational requirement for defensible AI governance under ISO/IEC 42001.",
            f"schema_confidence ({_pct(c['diagnostics'].get('schema_confidence', 0) or 0)}) x 100 = {c['schema_score']}"
        ),
        "Data Type Diversity": (
            "Assesses whether the dataset contains a balanced mix of numeric and text-type fields — indicating "
            "a rich, multi-dimensional data structure capable of capturing the full complexity of the AI system's "
            "inputs and outputs. Datasets dominated by a single data type may lack the contextual richness "
            "required for comprehensive governance assessment.",
            f"balanced mix of numeric ({c['numeric_cols']}) and text ({c['text_cols']}) across {c['total_cols']} total columns"
        ),
        "Label Coverage Rate": (
            "Determines what proportion of records in the dataset carry a ground truth label or annotation. "
            "Label coverage directly constrains the scope of any evaluation — unlabelled records cannot "
            "contribute to accuracy, fairness, or bias assessments. A high label coverage rate signals "
            "a mature, well-governed annotation pipeline with rigorous quality assurance.",
            "Proportion of records with non-null label/class/ground_truth fields."
        ),
        "Annotation Quality Score": (
            "Evaluates the structural quality and consistency of annotations in the dataset, using field "
            "completeness, value distribution, and annotation schema adherence as proxies for quality. "
            "Poor annotation quality — including inconsistent labelling, ambiguous categories, or "
            "annotator disagreement — directly degrades model quality and governance defensibility.",
            "Derived from annotation field completeness, consistency, and schema adherence metrics."
        ),
        "Ground Truth Accuracy": (
            "Assesses how accurately the ground truth labels in the dataset reflect real-world reality — "
            "using statistical proxies such as label confidence distributions and cross-validation consistency. "
            "Ground truth errors propagate directly into model training and evaluation, creating invisible "
            "performance ceilings that cannot be overcome through model architecture improvements alone.",
            "Derived from label confidence distribution and cross-validation consistency signals."
        ),
        "Dataset Schema Consistency": (
            "Evaluates whether the dataset schema is uniformly applied across all records, time periods, "
            "and data sources contributing to the evaluation set. Schema drift — where field definitions "
            "or formats change across dataset versions — is a major source of silent data quality failures "
            "and a common root cause of model degradation in production environments.",
            "Derived from schema confidence score and field-level consistency analysis."
        ),
        # ── RELIABILITY ───────────────────────────────────────────────────────────
        "Consistency Score": (
            "Measures the overall consistency of the AI system's outputs — evaluating whether identical or "
            "near-identical inputs produce stable, predictable predictions over time. Inconsistency in "
            "production is a reliability failure that erodes user trust, complicates accountability, and "
            "may indicate underlying model instability, infrastructure issues, or data drift.",
            f"(1 - missing_ratio {missing_pct}) x 90 — completeness as a structural consistency proxy."
        ),
        "Performance Metrics": (
            "Verifies whether explicit performance metrics — such as accuracy, F1 score, precision, recall, "
            "or AUC — are recorded in the dataset. Performance metrics are the primary evidence used to "
            "demonstrate that the AI system meets its intended specifications. Their absence makes it "
            "impossible to objectively assess whether the system is operating within acceptable parameters.",
            "100 if performance/quality metrics fields exist in the dataset; 40 otherwise."
        ),
        "Latency Monitoring": (
            "Checks whether AI system response time (latency) is systematically measured and logged for "
            "each inference event. Latency is a critical reliability indicator — degraded response times "
            "can indicate infrastructure strain, model complexity issues, or approaching capacity limits. "
            "SLA compliance for AI systems typically requires latency monitoring at the inference level.",
            "100 if latency/response_time/duration field is present; 30 otherwise."
        ),
        "Error Rate Tracking": (
            "Measures whether the AI system maintains a structured record of error rates — including "
            "inference failures, timeout events, and output quality degradation events. Continuous error "
            "rate tracking enables proactive reliability management and provides the evidential basis "
            "for SLA compliance reporting and incident root-cause analysis.",
            "100 if error/failure rate tracking fields are present; derived from dataset structure otherwise."
        ),
        "Ground Truth Availability": (
            "Assesses whether sufficient ground truth data is available to evaluate the AI system's "
            "reliability against objective benchmarks. Without ground truth, reliability assessments "
            "are limited to proxy metrics — and cannot definitively establish whether the system "
            "is meeting its intended accuracy or recall targets in production.",
            "100 if labels or text-evaluation metrics exist; 40 otherwise."
        ),
        "Mean Average Precision (mAP)": (
            "Mean Average Precision is the primary accuracy metric for object detection systems, "
            "measuring the model's ability to correctly identify and localise objects across all "
            "categories and confidence thresholds. mAP integrates both precision and recall into "
            "a single score, making it the industry standard for comparing detection models. "
            "Low mAP in production indicates unacceptable detection quality for deployment.",
            "Computed from precision-recall curves across all detection classes at standard IoU thresholds."
        ),
        "Mean IoU Score": (
            "Mean Intersection over Union quantifies the spatial accuracy of object detection — "
            "measuring the overlap between predicted bounding boxes and ground truth annotations. "
            "An IoU of 1.0 represents a perfect match; values below 0.5 indicate imprecise "
            "localisation that may be unsafe for applications requiring precise spatial awareness, "
            "such as autonomous systems, medical image analysis, or document processing.",
            "Average IoU computed across all matched detection pairs in the evaluation dataset."
        ),
        "Top-K Accuracy": (
            "Top-K Accuracy measures whether the correct class appears among the model's top K "
            "predictions — a more lenient metric than top-1 accuracy appropriate for complex "
            "multi-class scenarios. High Top-K Accuracy with low Top-1 Accuracy may indicate "
            "that the model is directionally correct but insufficiently decisive, which can be "
            "problematic in automated decision pipelines that rely on single-best predictions.",
            "Proportion of records where the ground truth label appears in the top-K predicted classes."
        ),
        "Inference Consistency": (
            "Measures whether the AI system produces stable, reproducible outputs when presented "
            "with equivalent inputs under consistent conditions. Inconsistent inference — where "
            "the same input produces different outputs across calls — indicates non-determinism "
            "in the inference pipeline, which undermines auditability, reproducibility, and "
            "regulatory compliance for high-risk AI deployments.",
            "Derived from variance analysis of repeated inference outputs across the dataset."
        ),
        # ── SECURITY ──────────────────────────────────────────────────────────────
        "Adversarial Input Resistance": (
            "Evaluates the AI system's robustness against adversarial inputs — carefully crafted "
            "perturbations designed to cause the model to produce incorrect, harmful, or unintended "
            "outputs. Adversarial attacks are a primary threat vector for deployed AI systems, "
            "particularly in high-stakes domains such as financial fraud detection, medical diagnosis, "
            "and content moderation. Resistance must be validated through structured red-team testing.",
            "Derived from presence of adversarial input validation fields and input sanitisation controls."
        ),
        "PII/Biometric in Images": (
            "Checks whether the dataset or model outputs contain personally identifiable information "
            "or biometric data (faces, fingerprints, gait patterns) that could expose individuals "
            "to privacy violations or enable surveillance. AI systems processing biometric data are "
            "classified as high-risk under the EU AI Act and subject to mandatory DPIA requirements "
            "and heightened data protection obligations under GDPR Article 9.",
            "100 if no PII/biometric indicators detected in the dataset; scaled penalty if detected."
        ),
        "Harmful Image Content Rate": (
            "Measures whether the AI system's inputs or outputs contain harmful, illegal, or policy-"
            "violating image content — including CSAM, graphic violence, or content that could "
            "facilitate harm. AI systems must implement content filtering at both the input and "
            "output layers, with automated detection, human review queues, and mandatory reporting "
            "protocols for identified harmful content.",
            "100 if harmful content rate is 0%; scaled penalty applied for any detected harmful content."
        ),
        "Input Validation Rate": (
            "Assesses whether the AI system performs structured validation on all inputs before "
            "processing — including format checks, schema validation, range constraints, and "
            "injection attack detection. Unvalidated inputs are a critical security vulnerability "
            "that can enable prompt injection, data poisoning, and model extraction attacks. "
            "100% input validation is the minimum acceptable standard for production AI systems.",
            "100 if input validation/sanitisation controls are evidenced in the dataset; 0 otherwise."
        ),
        # ── SAFETY ────────────────────────────────────────────────────────────────
        "Misidentification Risk Control": (
            "Evaluates the degree to which the AI system has implemented controls to prevent "
            "or mitigate the consequences of misidentification — incorrectly identifying a person, "
            "object, or situation. Misidentification in high-stakes contexts (medical, legal, "
            "security) can cause direct harm. Controls include confidence thresholds, human review "
            "queues, uncertainty quantification, and fallback to human decision-making.",
            "Derived from presence of confidence threshold, review queue, and fallback mechanism fields."
        ),
        "Human Override on Low Confidence": (
            "Verifies whether the system enforces a mandatory human review pathway for predictions "
            "below a defined confidence threshold. This is a fundamental safety control for high-"
            "risk AI — it prevents the system from acting autonomously when its own certainty is "
            "insufficient. Absence of this control means the AI operates without a safety net, "
            "directly contradicting human-centric AI governance principles.",
            "100 if human_review/override field is present alongside confidence threshold; 0 otherwise."
        ),
        "Safety-Critical Recall": (
            "For AI systems in safety-critical applications, recall (the ability to detect all "
            "relevant positive instances) is often more important than precision. Missing a genuine "
            "positive (false negative) in medical, safety, or security contexts can have severe "
            "consequences. This parameter ensures the system's recall in safety-critical categories "
            "meets the elevated thresholds required for high-risk deployments.",
            "Derived from recall analysis on safety-critical class labels in the evaluation dataset."
        ),
        "Incident Response Signals": (
            "Checks whether the AI system is integrated with an incident response workflow — "
            "including automated alerting, structured incident logging, escalation pathways, "
            "and post-incident review processes. EU AI Act Article 62 mandates serious incident "
            "reporting for high-risk AI systems. Without incident response infrastructure, "
            "organisations cannot demonstrate compliance with mandatory notification obligations.",
            "100 if incident_response/alert/escalation fields are present in the dataset; 0 otherwise."
        ),
        # ── PRIVACY ───────────────────────────────────────────────────────────────
        "Biometric PII Leakage Rate": (
            "Measures the rate at which biometric personal data (facial embeddings, fingerprint "
            "data, voiceprints, gait data) appears in AI system outputs or logs in a form that "
            "could identify individuals. Biometric data receives the highest level of protection "
            "under GDPR Article 9 as a special category. Any leakage constitutes a serious data "
            "breach with mandatory regulatory notification within 72 hours.",
            "100 if biometric data leakage rate is 0%; penalty scaled by detected leakage rate."
        ),
        "Image Data Minimisation": (
            "Assesses whether the AI system collects, processes, and retains only the minimum "
            "image data necessary for its stated purpose — a core principle of Privacy by Design "
            "under GDPR Article 25. Systems that capture and store high-resolution images, "
            "facial data, or scene content beyond operational necessity create disproportionate "
            "privacy risks and are exposed to regulatory sanctions.",
            "100 if data minimisation controls are evidenced; penalty for excessive data collection signals."
        ),
        "Biometric Anonymisation": (
            "Verifies whether biometric data captured or processed by the AI system is subject "
            "to appropriate anonymisation or pseudonymisation techniques before storage or "
            "transmission. Techniques include facial blurring, embedding encryption, and k-"
            "anonymity. Effective anonymisation reduces re-identification risk and may exempt "
            "the organisation from certain GDPR Article 9 obligations.",
            "100 if anonymisation controls are evidenced in the dataset processing pipeline; 0 otherwise."
        ),
        "Image Retention Compliance": (
            "Checks whether the AI system enforces defined retention periods for image data — "
            "ensuring that images are automatically deleted after their legitimate purpose has "
            "been fulfilled, in accordance with GDPR Article 5(1)(e) (storage limitation). "
            "Indefinite image retention is a common compliance failure and a significant "
            "regulatory risk, particularly for systems processing public-space imagery.",
            "100 if retention_period/deletion_schedule fields are present; 0 if absent."
        ),
        # ── SUSTAINABILITY ────────────────────────────────────────────────────────
        "Inference Latency Efficiency": (
            "Measures the energy and compute efficiency of the AI system's inference pipeline — "
            "using latency as a proxy for computational intensity. High-latency inference indicates "
            "an inefficient model architecture or infrastructure configuration that consumes "
            "disproportionate energy. Organisations are increasingly required to report AI system "
            "carbon footprints under ESG disclosure frameworks and the EU Corporate Sustainability Reporting Directive.",
            "100 if latency meets efficiency benchmarks; 0 if latency field is absent or exceeds threshold."
        ),
        "Detection Compute Efficiency": (
            "Evaluates whether the AI system's detection pipeline is optimised for compute "
            "efficiency — using techniques such as model pruning, quantisation, knowledge "
            "distillation, or hardware-accelerated inference. Inefficient detection pipelines "
            "scale poorly, incur high operational costs, and generate significant carbon emissions "
            "at scale. Compute efficiency is increasingly a board-level ESG concern.",
            "Derived from compute utilisation signals and model architecture complexity indicators."
        ),
        "Dataset Redundancy Rate": (
            "Measures the proportion of redundant or duplicate records in the training and "
            "evaluation dataset — a direct proxy for computational waste. Processing redundant "
            "data consumes compute, energy, and storage without contributing to model quality. "
            "Deduplication and dataset distillation are sustainability best practices that also "
            "improve training efficiency and governance auditability.",
            "Derived from duplicate detection analysis — penalised for high redundancy rates."
        ),
        "Carbon Footprint Proxy": (
            "Provides an estimated proxy measure of the AI system's operational carbon footprint "
            "— derived from model complexity, inference volume, hardware type, and geographic "
            "data centre location. While exact carbon measurement requires infrastructure-level "
            "instrumentation, this proxy supports initial ESG reporting and identifies high-"
            "impact optimisation targets for sustainability governance programmes.",
            "Composite score from model complexity, inference volume, and infrastructure efficiency signals."
        ),
        "Volume Sufficiency": (
            "Measures whether the dataset contains a sufficient volume of records to produce "
            "statistically reliable governance assessments. Small datasets produce high-variance "
            "metric estimates that cannot be generalised to production behaviour. Volume sufficiency "
            "thresholds vary by model type and application domain — this parameter provides a "
            "structural baseline assessment.",
            f"min(logs_evaluated {c['logs_count']} / 100 x 100, 100) = {c['volume_score']}"
        ),
        "Dataset Efficiency": (
            "Evaluates whether the dataset size is proportionate to the complexity of the AI "
            "task — penalising unnecessarily large datasets that could be reduced through "
            "intelligent sampling, active learning, or dataset distillation. Right-sizing "
            "datasets reduces compute, storage, and energy consumption while maintaining "
            "governance-grade evaluation quality.",
            f"clamp(100 - (logs_evaluated {c['logs_count']} / 10000) x 30)"
        ),
    }
    default = (
        "This sub-parameter is evaluated from structural signals present in the ingested dataset, "
        "including field presence, completeness, volume, value distributions, and schema consistency. "
        "Scores reflect the governance readiness of the dataset relative to KPMG Trusted AI Framework "
        "requirements and applicable regulatory standards.",
        "Derived from structural analysis of the uploaded dataset."
    )
    return details.get(param, default)


# ─── Chart Generators ─────────────────────────────────────────────────────────

def _build_radar_chart(principles: dict, width: float, height: float) -> Drawing:
    """Build a spider/radar chart of the 10 principle scores."""
    d = Drawing(width, height)
    cx, cy = width / 2, height / 2
    r = min(width, height) * 0.38

    names = list(principles.keys())
    scores = [principles[n].get("score", 0) for n in names]
    n = len(names)

    if n == 0:
        return d

    angles = [2 * math.pi * i / n - math.pi / 2 for i in range(n)]

    # Grid circles
    for level in [0.25, 0.5, 0.75, 1.0]:
        pts = []
        for a in angles:
            pts.append(cx + r * level * math.cos(a))
            pts.append(cy + r * level * math.sin(a))
        pts.append(pts[0])
        pts.append(pts[1])
        from reportlab.graphics.shapes import PolyLine
        grid_line = PolyLine(pts, strokeColor=colors.HexColor("#E5E7EB"), strokeWidth=0.5, fillColor=None)
        d.add(grid_line)
        # Level label
        label_str = str(int(level * 100))
        lbl = String(cx + 3, cy + r * level + 2, label_str,
                     fontSize=5, fillColor=colors.HexColor("#9CA3AF"), fontName="Helvetica")
        d.add(lbl)

    # Spokes
    for a in angles:
        spoke = Line(cx, cy, cx + r * math.cos(a), cy + r * math.sin(a),
                     strokeColor=colors.HexColor("#D1D5DB"), strokeWidth=0.5)
        d.add(spoke)

    # Data polygon
    pts = []
    for i, (score, a) in enumerate(zip(scores, angles)):
        ratio = score / 100.0
        pts.append(cx + r * ratio * math.cos(a))
        pts.append(cy + r * ratio * math.sin(a))
    pts.append(pts[0])
    pts.append(pts[1])

    from reportlab.graphics.shapes import Polygon
    poly = Polygon(pts[:-2],
                   fillColor=colors.HexColor("#00338D"),
                   fillOpacity=0.25,
                   strokeColor=KPMG_BLUE,
                   strokeWidth=1.5)
    d.add(poly)

    # Data points
    for i, (score, a) in enumerate(zip(scores, angles)):
        ratio = score / 100.0
        px = cx + r * ratio * math.cos(a)
        py = cy + r * ratio * math.sin(a)
        dot_color = score_to_color(score)
        dot = Circle(px, py, 3, fillColor=dot_color, strokeColor=KPMG_WHITE, strokeWidth=0.5)
        d.add(dot)

    # Labels
    for i, (name, a) in enumerate(zip(names, angles)):
        lx = cx + (r + 14) * math.cos(a)
        ly = cy + (r + 14) * math.sin(a)
        short = name.split()[0] if " " in name else name
        score_val = scores[i]
        sc = score_to_color(score_val)
        lbl = String(lx, ly - 3, f"{short}: {score_val}",
                     fontSize=5.5, fillColor=sc, fontName="Helvetica-Bold", textAnchor="middle")
        d.add(lbl)

    return d


def _build_bar_chart(principles: dict, width: float, height: float) -> Drawing:
    """Build a horizontal bar chart for principle scores."""
    d = Drawing(width, height)
    names = list(principles.keys())
    scores = [principles[n].get("score", 0) for n in names]
    n = len(names)

    bar_h = (height - 10) / n
    label_w = 72
    bar_area_w = width - label_w - 30

    for i, (name, score) in enumerate(zip(names, scores)):
        y = height - (i + 1) * bar_h + 2
        # Background bar
        bg = Rect(label_w, y, bar_area_w, bar_h - 4,
                  fillColor=colors.HexColor("#F3F4F6"), strokeColor=None)
        d.add(bg)
        # Filled bar
        fill_w = max(4, (score / 100) * bar_area_w)
        col = score_to_color(score)
        fill = Rect(label_w, y, fill_w, bar_h - 4,
                    fillColor=col, strokeColor=None)
        d.add(fill)
        # Principle name
        lbl = String(label_w - 3, y + (bar_h - 4) / 2 - 3, name,
                     fontSize=5.5, fillColor=colors.HexColor("#111827"),
                     fontName="Helvetica", textAnchor="end")
        d.add(lbl)
        # Score label
        score_lbl = String(label_w + fill_w + 3, y + (bar_h - 4) / 2 - 3,
                           str(score),
                           fontSize=5.5, fillColor=col, fontName="Helvetica-Bold")
        d.add(score_lbl)

    return d


def _build_compliance_donut(score: int, width: float, height: float) -> Drawing:
    """Build a donut chart showing overall compliance score."""
    d = Drawing(width, height)
    cx, cy = width / 2, height / 2
    outer_r = min(width, height) * 0.42
    inner_r = outer_r * 0.62

    # Background circle
    bg = Circle(cx, cy, outer_r, fillColor=colors.HexColor("#F3F4F6"), strokeColor=None)
    d.add(bg)

    # Score arc (using multiple thin wedges)
    col = score_to_color(score)
    num_segs = 60
    filled_segs = int(score / 100 * num_segs)

    for i in range(num_segs):
        start_angle = 90 - (i * 360 / num_segs)
        end_angle = start_angle - (360 / num_segs) + 0.5
        fill = col if i < filled_segs else colors.HexColor("#E5E7EB")
        w = Wedge(cx, cy, outer_r, start_angle, start_angle - 360 / num_segs + 0.5,
                  fillColor=fill, strokeColor=None)
        d.add(w)

    # Inner white circle (donut hole)
    hole = Circle(cx, cy, inner_r, fillColor=KPMG_WHITE, strokeColor=None)
    d.add(hole)

    # Score text
    score_text = String(cx, cy + 4, str(score),
                        fontSize=22, fillColor=col, fontName="Helvetica-Bold",
                        textAnchor="middle")
    d.add(score_text)
    label_text = String(cx, cy - 10, "/100",
                        fontSize=8, fillColor=KPMG_GREY, fontName="Helvetica",
                        textAnchor="middle")
    d.add(label_text)

    return d


def _build_subparam_minibar(score: int, width: float, height: float) -> Drawing:
    """Build a tiny horizontal progress bar for sub-parameters."""
    d = Drawing(width, height)
    col = score_to_color(score)
    # Background
    bg = Rect(0, 1, width, height - 2, fillColor=colors.HexColor("#E5E7EB"), strokeColor=None)
    d.add(bg)
    # Fill
    fill_w = max(2, score / 100 * width)
    fill = Rect(0, 1, fill_w, height - 2, fillColor=col, strokeColor=None)
    d.add(fill)
    return d


# ─── Page Template ───────────────────────────────────────────────────────────
class KPMGPageTemplate:
    def __init__(self, report_id: str, ai_name: str, home_url: str = "/dashboard"):
        self.report_id = report_id
        self.ai_name = ai_name
        self.home_url = home_url

    def on_page(self, canvas_obj, doc):
        canvas_obj.saveState()
        W, H = A4

        # ── Header bar ──────────────────────────────────────────────────────
        canvas_obj.setFillColor(KPMG_BLUE)
        canvas_obj.rect(0, H - 20 * mm, W, 20 * mm, fill=1, stroke=0)

        # Teal accent stripe
        canvas_obj.setFillColor(KPMG_TEAL)
        canvas_obj.rect(0, H - 21.5 * mm, W, 1.5 * mm, fill=1, stroke=0)

        # Left: clickable "Auditable AI" logo — links to home/dashboard
        canvas_obj.setFillColor(KPMG_WHITE)
        canvas_obj.setFont("Helvetica-Bold", 12)
        canvas_obj.drawString(14 * mm, H - 10 * mm, "Auditable AI")
        canvas_obj.setFont("Helvetica", 7.5)
        canvas_obj.drawString(14 * mm, H - 15 * mm, "KPMG Trusted AI Framework")

        # Make the logo area a clickable link to home
        canvas_obj.linkURL(
            self.home_url,
            (14 * mm, H - 18 * mm, 65 * mm, H - 6 * mm),
            relative=0
        )

        # Subtle underline to hint it's clickable
        canvas_obj.setStrokeColor(KPMG_TEAL)
        canvas_obj.setLineWidth(0.5)
        canvas_obj.line(14 * mm, H - 16 * mm, 55 * mm, H - 16 * mm)

        # Right: AI system name + confidential
        canvas_obj.setFillColor(colors.HexColor("#9DBFE0"))
        canvas_obj.setFont("Helvetica", 7.5)
        canvas_obj.drawRightString(W - 14 * mm, H - 10 * mm, f"AI System: {self.ai_name}")
        canvas_obj.drawRightString(W - 14 * mm, H - 15 * mm, "CONFIDENTIAL")

        # ── Footer bar ──────────────────────────────────────────────────────
        canvas_obj.setFillColor(KPMG_BLUE)
        canvas_obj.rect(0, 0, W, 11 * mm, fill=1, stroke=0)

        canvas_obj.setFillColor(KPMG_TEAL)
        canvas_obj.rect(0, 11 * mm, W, 0.8 * mm, fill=1, stroke=0)

        canvas_obj.setFillColor(KPMG_WHITE)
        canvas_obj.setFont("Helvetica", 6.5)
        canvas_obj.drawString(14 * mm, 4 * mm, f"Report ID: {self.report_id}")
        canvas_obj.drawCentredString(W / 2, 4 * mm, "Auditable AI\u2122 Governance Audit Report")
        canvas_obj.drawRightString(W - 14 * mm, 4 * mm, f"Page {doc.page}")

        canvas_obj.restoreState()


# ─── Dynamic Report Helpers ───────────────────────────────────────────────────

def _finding_why_it_matters(category: str, severity: str) -> str:
    """Return a contextual 'why this matters' sentence for a finding category."""
    cat = category.lower()
    severity_phrase = {
        "High":   "This is a critical governance gap that directly undermines stakeholder trust and regulatory standing.",
        "Medium": "Left unaddressed, this gap will compound over time and may escalate into a higher-severity risk.",
        "Low":    "While lower priority, resolving this finding improves overall governance maturity.",
    }.get(severity, "This finding affects the overall governance posture of the AI system.")

    category_context = {
        "fairness":       "Fairness gaps can lead to discriminatory outcomes affecting real users and triggering regulatory action under the EU AI Act and existing anti-discrimination law.",
        "transparency":   "Lack of transparency prevents stakeholders from understanding AI decisions, eroding trust and making it impossible to challenge incorrect outcomes.",
        "explainability": "Without explainability, affected individuals cannot exercise their right to explanation under GDPR Article 22, and audit teams cannot validate model behaviour.",
        "accountability": "Accountability gaps mean that when something goes wrong, no clear ownership path exists — making incident response, regulatory reporting, and remediation significantly harder.",
        "data integrity": "Poor data quality directly degrades every downstream metric, making all governance assessments unreliable and potentially misleading to decision-makers.",
        "reliability":    "Reliability failures translate directly into user-facing errors, missed SLAs, and compounding reputational risk with each production incident.",
        "security":       "Security weaknesses expose the AI system to adversarial manipulation, data exfiltration, and model extraction attacks that can compromise the entire pipeline.",
        "safety":         "Safety gaps mean the AI system could cause real-world harm without adequate safeguards, creating direct liability exposure for the deploying organisation.",
        "privacy":        "Privacy failures carry mandatory notification obligations under GDPR, DPDP Act, and CCPA, with potential fines up to 4% of global annual turnover.",
        "sustainability": "Sustainability inefficiencies translate into higher operational costs, increased carbon footprint, and growing ESG reporting obligations under CSRD and similar frameworks.",
    }
    for key, ctx in category_context.items():
        if key in cat:
            return f"{ctx} {severity_phrase}"
    return f"This governance gap affects the AI system's alignment with the KPMG Trusted AI Framework. {severity_phrase}"


def _principle_score_narrative(pname: str, score: int, params: dict) -> str:
    """Generate a plain-English narrative explaining what the principle score means."""
    n_params = len(params)
    n_strong  = sum(1 for v in params.values() if int(v) >= 75)
    n_partial = sum(1 for v in params.values() if 55 <= int(v) < 75)
    n_weak    = sum(1 for v in params.values() if int(v) < 55)

    weakest = min(params, key=lambda k: int(params[k])) if params else None
    strongest = max(params, key=lambda k: int(params[k])) if params else None

    if score >= 75:
        narrative = (
            f"Of the {n_params} sub-parameters evaluated, {n_strong} demonstrate strong governance "
            f"practices (≥75/100). "
        )
        if n_partial:
            narrative += f"{n_partial} sub-parameter(s) show partial alignment and represent opportunities for further improvement. "
        if n_weak:
            narrative += f"{n_weak} sub-parameter(s) need attention to sustain this level of alignment. "
    elif score >= 55:
        narrative = (
            f"Of the {n_params} sub-parameters evaluated, {n_strong} are performing well, "
            f"{n_partial} show partial alignment, and {n_weak} require active remediation. "
        )
        if weakest:
            narrative += f"The weakest area is '{weakest}' ({params[weakest]}/100), which should be prioritised in the next governance cycle. "
    else:
        narrative = (
            f"This principle has significant gaps: only {n_strong} of {n_params} sub-parameters "
            f"demonstrate adequate governance. {n_weak} sub-parameter(s) score below 55, indicating "
            f"material governance deficiencies that require immediate attention. "
        )
        if weakest:
            narrative += f"'{weakest}' ({params[weakest]}/100) is the most critical area to address. "

    if strongest and int(params[strongest]) >= 70:
        narrative += f"The strongest area is '{strongest}' ({params[strongest]}/100), which can serve as a model for improving other sub-parameters."
    return narrative


def _subparam_score_meaning(param: str, score: int) -> str:
    """Generate a plain-English sentence explaining what this sub-parameter score means for the system."""
    if score >= 90:
        tier = "excellent — this area is a governance strength and requires only routine monitoring"
    elif score >= 75:
        tier = "good — governance practices are in place and functioning, with minor room for improvement"
    elif score >= 60:
        tier = "moderate — basic controls exist but there are identifiable gaps that should be addressed in the next review cycle"
    elif score >= 40:
        tier = "below expectations — controls are inconsistent or partially absent, creating meaningful governance risk"
    else:
        tier = "poor — this area has significant deficiencies and represents an active governance risk requiring prompt remediation"

    param_lower = param.lower()
    context = ""
    if any(k in param_lower for k in ["pii", "privacy", "biometric"]):
        context = " In a privacy context, this directly affects data protection compliance."
    elif any(k in param_lower for k in ["safety", "harm", "override"]):
        context = " Given the safety implications, this score warrants particular attention."
    elif any(k in param_lower for k in ["audit", "trail", "logging", "accountability"]):
        context = " Without strong audit coverage, regulatory accountability obligations cannot be demonstrated."
    elif any(k in param_lower for k in ["fairness", "equity", "bias", "balance"]):
        context = " Fairness gaps can translate directly into discriminatory outcomes at scale."
    elif any(k in param_lower for k in ["security", "injection", "adversarial"]):
        context = " Security weaknesses may be actively exploitable in production."

    return f"A score of {score}/100 is {tier}.{context}"


def _subparam_improvement(param: str, score: int) -> str:
    """Return an actionable improvement suggestion for a sub-parameter based on its score."""
    param_lower = param.lower()

    # Priority lookup — specific param names first
    specific = {
        "audit trail coverage":        "Ensure every AI event is logged with timestamp, user ID, model version, input, and output. Implement structured logging from day one rather than retrofitting.",
        "human oversight":             "Define and test a formal escalation pathway. Route uncertain or high-stakes outputs to human reviewers before action is taken.",
        "pii":                         "Deploy a PII scanning layer (regex + NER) on all outputs. Implement automatic redaction for detected personal identifiers.",
        "class balance":               "Apply SMOTE oversampling or class-weighted loss to address minority class underrepresentation. Monitor class distribution drift in production.",
        "fairness":                    "Run stratified bias tests across demographic segments. Use equalised-odds or demographic-parity constraints during model fine-tuning.",
        "hallucination":               "Add a self-consistency check — run the same query multiple times and flag divergent answers. Use retrieval-augmented generation to ground responses in source documents.",
        "toxicity":                    "Implement a multi-layer content filter: a fast keyword blocker as the first layer, and an NLI-based classifier as the second. Review flagged outputs weekly.",
        "latency":                     "Profile inference bottlenecks using a tracing tool. Consider model quantisation, caching of frequent queries, or switching to a lighter model variant.",
        "schema":                      "Enforce a schema contract at the data ingestion layer. Reject or quarantine records that do not conform before they enter the evaluation pipeline.",
        "completeness":                "Audit your data pipeline for fields that are frequently null or missing. Add validation checks at the source system to prevent incomplete records.",
        "version":                     "Tag every prediction record with the model version that produced it. Use a model registry (MLflow, W&B) to manage version metadata.",
        "injection":                   "Implement an input sanitisation layer that detects and blocks known injection patterns. Run regular red-team exercises against the production endpoint.",
        "transparency":                "Add confidence scores and uncertainty indicators to model outputs. Document known failure modes and limitations in a public model card.",
        "explainability":              "Integrate SHAP or LIME for local feature importance. Provide natural-language explanations alongside predictions for non-technical stakeholders.",
        "sustainability":              "Measure and report inference energy consumption per 1,000 requests. Explore model distillation or pruning to reduce compute without sacrificing accuracy.",
        "data minimisation":           "Audit what data fields are actually used at inference time. Remove any fields collected but not needed — collect less, store less, expose less.",
        "reliability":                 "Implement automated regression testing after every model update. Set up alerting for production metric degradation beyond defined thresholds.",
        "safety":                      "Implement a multi-stage output review for safety-critical applications. Define and test a kill-switch procedure that can halt the system within minutes.",
        "privacy":                     "Conduct a Data Protection Impact Assessment (DPIA). Implement privacy-by-design controls — anonymisation, data minimisation, and access controls — before deployment.",
    }
    for key, suggestion in specific.items():
        if key in param_lower:
            return suggestion

    # Score-tier fallback
    if score >= 60:
        return f"This area is performing reasonably well. Focus on formalising existing informal practices into documented governance controls, and set up automated monitoring to detect regression."
    elif score >= 40:
        return f"Prioritise a targeted improvement sprint for this area. Identify the root cause of the score gap — missing data fields, absent controls, or process failures — and address each in turn."
    else:
        return f"This area requires immediate remediation planning. Assign ownership, define a timeline, and treat it as a governance action item in the next audit cycle. Do not wait for the next scheduled audit to address this."


# ─── Main PDF Builder ─────────────────────────────────────────────────────────
def build_pdf(report: dict) -> BytesIO:
    buffer = BytesIO()
    W, H = A4
    margin = 16 * mm

    report_id  = report.get("report_id", "N/A")
    ai_name    = report.get("ai_name", "N/A")
    model_type = report.get("model_type", "N/A")
    evaluated  = report.get("evaluated_at", "N/A")
    try:
        dt = datetime.datetime.fromisoformat(evaluated)
        evaluated_fmt = dt.strftime("%d %B %Y, %H:%M UTC")
    except Exception:
        evaluated_fmt = evaluated

    overall_score  = report.get("overall_score", 0)
    risk_level     = report.get("risk_level", "N/A")
    struct_risk    = report.get("structural_risk", "N/A")
    logs_evaluated = report.get("logs_evaluated", 0)
    dq_score       = report.get("data_quality_score", 0)
    principles     = report.get("trusted_ai_principles", {})
    diagnostics    = report.get("diagnostics", {})
    findings       = report.get("findings", [])
    recommendation = report.get("recommendation", "")
    framework      = report.get("framework_compliance", {})

    template = KPMGPageTemplate(report_id, ai_name, home_url="/dashboard")

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=margin,
        leftMargin=margin,
        topMargin=26 * mm,
        bottomMargin=17 * mm,
        title=f"Auditable AI Governance Report — {ai_name}",
        author="Auditable AI",
        subject="KPMG Trusted AI Framework Governance Audit",
    )

    # ── Style Definitions ─────────────────────────────────────────────────
    def S(name, **kwargs):
        return ParagraphStyle(name, **kwargs)

    usable_w = W - 2 * margin

    cover_title_s = S("CoverTitle", fontSize=30, leading=36, textColor=KPMG_WHITE,
                      fontName="Helvetica-Bold", alignment=TA_LEFT)
    cover_sub_s   = S("CoverSub", fontSize=12, leading=17, textColor=colors.HexColor("#9DBFE0"),
                      fontName="Helvetica", alignment=TA_LEFT)

    sec_title_s   = S("SecTitle", fontSize=14, leading=19, textColor=KPMG_BLUE,
                      fontName="Helvetica-Bold", spaceBefore=10, spaceAfter=4)
    sec_sub_s     = S("SecSub", fontSize=8.5, leading=13, textColor=KPMG_GREY,
                      fontName="Helvetica", spaceAfter=8, alignment=TA_JUSTIFY)
    body_s        = S("Body", fontSize=8.5, leading=13, textColor=colors.HexColor("#1F2937"),
                      fontName="Helvetica", spaceAfter=4)
    body_bold_s   = S("BodyBold", fontSize=8.5, leading=13, textColor=colors.HexColor("#111827"),
                      fontName="Helvetica-Bold")
    small_s       = S("Small", fontSize=7, leading=10, textColor=KPMG_GREY,
                      fontName="Helvetica")
    label_s       = S("Label", fontSize=7.5, leading=10, textColor=KPMG_GREY,
                      fontName="Helvetica-Bold", spaceAfter=2)
    finding_txt_s = S("FindTxt", fontSize=8, leading=12, textColor=colors.HexColor("#374151"),
                      fontName="Helvetica", spaceAfter=3, alignment=TA_JUSTIFY)
    rec_txt_s     = S("RecTxt", fontSize=8, leading=12, textColor=colors.HexColor("#1D4ED8"),
                      fontName="Helvetica-Oblique", spaceAfter=0)
    def_txt_s     = S("DefTxt", fontSize=7.5, leading=11.5, textColor=colors.HexColor("#374151"),
                      fontName="Helvetica", spaceAfter=2, alignment=TA_JUSTIFY)
    calc_txt_s    = S("CalcTxt", fontSize=6.5, leading=10, textColor=KPMG_GREY,
                      fontName="Helvetica-Oblique", spaceAfter=4)

    elements = []

    # ══════════════════════════════════════════════════════════════════════════
    # COVER PAGE
    # ══════════════════════════════════════════════════════════════════════════
    def build_cover():
        cover = []

        # ── Dark hero banner ────────────────────────────────────────────────
        hero_data = [[
            Paragraph("Auditable AI\u2122", S("hero_brand", fontSize=28, leading=32,
                textColor=KPMG_TEAL, fontName="Helvetica-Bold")),
        ]]
        hero = Table(hero_data, colWidths=[usable_w])
        hero.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), KPMG_BLUE),
            ("LEFTPADDING",   (0, 0), (-1, -1), 16),
            ("TOPPADDING",    (0, 0), (-1, -1), 14),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ]))
        cover.append(hero)
        cover.append(Spacer(1, 1 * mm))

        # Teal strip
        cover.append(HRFlowable(width="100%", thickness=3, color=KPMG_TEAL, spaceAfter=0))

        # ── Report title block ───────────────────────────────────────────────
        title_data = [
            [Paragraph("Governance Audit Report",
                        S("gt", fontSize=20, leading=26, textColor=colors.HexColor("#111827"),
                          fontName="Helvetica-Bold"))],
            [Paragraph("KPMG Trusted AI Framework — Comprehensive Assessment",
                        S("gs", fontSize=10, leading=14, textColor=KPMG_BLUE, fontName="Helvetica"))],
        ]
        title_tbl = Table(title_data, colWidths=[usable_w])
        title_tbl.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), KPMG_LIGHT_GREY),
            ("LEFTPADDING",   (0, 0), (-1, -1), 16),
            ("TOPPADDING",    (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ]))
        cover.append(title_tbl)
        cover.append(Spacer(1, 6 * mm))

        # ── Metadata grid ────────────────────────────────────────────────────
        info_rows = [
            [Paragraph("AI System",  label_s), Paragraph(f"<b>{ai_name}</b>",       body_bold_s)],
            [Paragraph("Model Type", label_s), Paragraph(model_type,               body_s)],
            [Paragraph("Evaluated",  label_s), Paragraph(evaluated_fmt,             body_s)],
            [Paragraph("Report ID",  label_s), Paragraph(
                f'<font color="#6B7280" size="7">{report_id}</font>', body_s)],
        ]
        info_tbl = Table(info_rows, colWidths=[36 * mm, usable_w - 36 * mm])
        info_tbl.setStyle(TableStyle([
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING",   (0, 0), (-1, -1), 0),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
            ("TOPPADDING",    (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LINEBELOW",     (0, 0), (-1, -2), 0.5, KPMG_MID_GREY),
        ]))
        cover.append(info_tbl)
        cover.append(Spacer(1, 8 * mm))

        # ── Score hero: full-width KPMG blue banner with score + risk ─────
        rc = risk_color(risk_level)
        rc_bg = colors.HexColor("#FEF2F2") if rc == KPMG_RED else colors.HexColor("#FFFBEB") if rc == KPMG_AMBER else colors.HexColor("#F0FDF4")

        score_data = [[
            Paragraph(
                f'<font color="#FFFFFF" size="36"><b>{overall_score}</b></font>',
                S("sc_num", fontSize=36, leading=42, fontName="Helvetica-Bold",
                  textColor=KPMG_WHITE, alignment=TA_CENTER)),
            Table([[
                Paragraph("<font color=\"#9DBFE0\" size=\"9\">Overall Score / 100</font>",
                    S("sc_lbl", fontSize=9, leading=12, textColor=colors.HexColor("#9DBFE0"),
                      fontName="Helvetica", alignment=TA_LEFT)),
            ],[
                Paragraph(f'<b>{risk_level} Risk</b>',
                    S("sc_risk", fontSize=13, leading=17, textColor=rc,
                      fontName="Helvetica-Bold", alignment=TA_LEFT)),
            ],[
                Paragraph(f'KPMG Trusted AI Framework Assessment',
                    S("sc_fw", fontSize=7.5, leading=11, textColor=colors.HexColor("#9DBFE0"),
                      fontName="Helvetica", alignment=TA_LEFT)),
            ]], colWidths=[usable_w - 50 * mm]),
        ]]
        score_banner = Table(score_data, colWidths=[50 * mm, usable_w - 50 * mm])
        score_banner.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), KPMG_BLUE),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING",   (0, 0), (-1, -1), 16),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 16),
            ("TOPPADDING",    (0, 0), (-1, -1), 12),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
            ("LINEBELOW",     (0, 0), (-1, -1), 3, colors.HexColor("#0091DA")),
        ]))
        cover.append(score_banner)
        cover.append(Spacer(1, 6 * mm))

        # ── Stats strip ──────────────────────────────────────────────────────
        stats = [
            ("Logs Evaluated", str(logs_evaluated)),
            ("Data Quality",   f"{dq_score}%"),
            ("Structural Risk", struct_risk),
            ("Principles",     str(len(principles))),
            ("Findings",       str(len(findings))),
        ]
        stat_vals = [Paragraph(f"<b>{v}</b>", S(f"sv{i}", fontSize=15, leading=18,
                        textColor=KPMG_BLUE, fontName="Helvetica-Bold", alignment=TA_CENTER))
                     for i, (_, v) in enumerate(stats)]
        stat_keys = [Paragraph(k, S(f"sk{i}", fontSize=7, leading=10, textColor=KPMG_GREY,
                        fontName="Helvetica", alignment=TA_CENTER))
                     for i, (k, _) in enumerate(stats)]
        col_w = usable_w / len(stats)
        stat_tbl = Table([stat_vals, stat_keys], colWidths=[col_w] * len(stats))
        stat_tbl.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), colors.HexColor("#E8EEF7")),
            ("TOPPADDING",    (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("LINEAFTER",     (0, 0), (-2, -1), 0.5, colors.HexColor("#B8C9E4")),
            ("LINEBEFORE",    (0, 0), (0, -1),  3, KPMG_BLUE),
        ]))
        cover.append(stat_tbl)
        cover.append(Spacer(1, 8 * mm))

        # ── Mini radar chart preview ─────────────────────────────────────────
        if principles:
            radar_d = _build_radar_chart(principles, 180, 160)
            bar_d   = _build_bar_chart(principles, usable_w - 195, 160)

            chart_row = Table([[
                _drawing_to_image(radar_d, 180, 160),
                _drawing_to_image(bar_d, usable_w - 195, 160),
            ]], colWidths=[185, usable_w - 185])
            chart_row.setStyle(TableStyle([
                ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING",  (0, 0), (-1, -1), 0),
                ("TOPPADDING",   (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING",(0, 0), (-1, -1), 0),
            ]))
            cover.append(Paragraph("<b>Principles at a Glance</b>",
                                   S("gl", fontSize=8, leading=10, textColor=KPMG_GREY,
                                     fontName="Helvetica-Bold")))
            cover.append(Spacer(1, 2))
            cover.append(chart_row)
            cover.append(Spacer(1, 6 * mm))

        # ── Disclaimer ───────────────────────────────────────────────────────
        cover.append(HRFlowable(width="100%", thickness=0.5, color=KPMG_MID_GREY, spaceAfter=4))
        cover.append(Paragraph(
            "This report was generated by Auditable AI\u2122 using the KPMG Trusted AI Framework. "
            "All scores are derived from structural analysis of the provided dataset and should be "
            "reviewed in conjunction with qualitative governance assessments. This document is "
            "confidential and intended solely for authorised stakeholders.",
            small_s))

        return cover

    elements.extend(build_cover())
    elements.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 1 — REGULATORY COMPLIANCE
    # ══════════════════════════════════════════════════════════════════════════
    elements.append(Paragraph("1. Regulatory &amp; Framework Alignment", sec_title_s))
    elements.append(HRFlowable(width="100%", thickness=2, color=KPMG_TEAL, spaceAfter=5))
    elements.append(Paragraph(
        "This AI system was assessed against four major international AI governance frameworks. "
        "Alignment status is derived from the overall Trusted AI score and individual principle "
        "scores. Each framework defines specific governance expectations mapped to the principles evaluated.",
        sec_sub_s))

    FW_META = {
        "EU_AI_Act":   ("EU AI Act",         "European Union Artificial Intelligence Regulation (2024)"),
        "ISO_42001":   ("ISO/IEC 42001:2023", "International AI Management System Standard"),
        "NIST_AI_RMF": ("NIST AI RMF",        "US National Institute of Standards AI Risk Management Framework"),
        "KPMG_TAF":    ("KPMG Trusted AI",    "KPMG Trusted AI Framework — 10 Principle Assessment"),
    }
    FW_FOCUS = {
        "EU_AI_Act":   "Risk classification, human oversight, transparency obligations, and prohibited AI practices.",
        "ISO_42001":   "AI management system requirements, risk treatment, and continual improvement.",
        "NIST_AI_RMF": "Govern, Map, Measure, and Manage functions across the full AI lifecycle.",
        "KPMG_TAF":    "10-principle assessment across Values-led, Trustworthy, and Human-centric dimensions.",
    }

    def _fw_alignment_label(status: str) -> tuple:
        if status in ("Compliant", "Certified Ready", "Aligned", "Assessed"):
            if overall_score >= 75:
                return "Good Alignment", "#059669"
            elif overall_score >= 55:
                return "Partial Alignment", "#D97706"
            else:
                return "Limited Alignment", "#DC2626"
        if overall_score >= 75:
            return "Good Alignment", "#059669"
        elif overall_score >= 55:
            return "Partial Alignment", "#D97706"
        return "Limited Alignment", "#DC2626"

    fw_data = [[
        Paragraph("Framework",         S("fwh0", fontSize=8, fontName="Helvetica-Bold", textColor=KPMG_WHITE)),
        Paragraph("Standard",          S("fwh1", fontSize=8, fontName="Helvetica-Bold", textColor=KPMG_WHITE)),
        Paragraph("Alignment",         S("fwh2", fontSize=8, fontName="Helvetica-Bold", textColor=KPMG_WHITE)),
        Paragraph("Key Governance Focus", S("fwh3", fontSize=8, fontName="Helvetica-Bold", textColor=KPMG_WHITE)),
    ]]
    for key, status in framework.items():
        meta = FW_META.get(key, (key, ""))
        align_label, align_hex = _fw_alignment_label(status)
        fw_data.append([
            Paragraph(f"<b>{meta[0]}</b>", body_bold_s),
            Paragraph(meta[1], small_s),
            Paragraph(f'<font color="{align_hex}"><b>{align_label}</b></font>', body_bold_s),
            Paragraph(FW_FOCUS.get(key, "\u2014"), small_s),
        ])

    fw_tbl = Table(fw_data, colWidths=[36 * mm, 58 * mm, 36 * mm, usable_w - 130 * mm])
    fw_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  KPMG_BLUE),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  KPMG_WHITE),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [KPMG_WHITE, KPMG_LIGHT_GREY]),
        ("GRID",          (0, 0), (-1, -1), 0.5, KPMG_MID_GREY),
        ("TOPPADDING",    (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(fw_tbl)
    elements.append(Spacer(1, 6 * mm))

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 2 — PRINCIPLES OVERVIEW + CHARTS
    # ══════════════════════════════════════════════════════════════════════════
    elements.append(Paragraph("2. KPMG Trusted AI — 10 Principles Overview", sec_title_s))
    elements.append(HRFlowable(width="100%", thickness=2, color=KPMG_TEAL, spaceAfter=5))
    elements.append(Paragraph(
        "Each of the 10 KPMG Trusted AI principles was evaluated across multiple sub-parameters "
        "derived from the structure and content of the ingested dataset. The radar chart provides "
        "an executive overview; the bar chart shows each principle's individual score "
        "(green \u2265 75: Strong Alignment, amber 55\u201374: Partial Alignment, red &lt; 55: Needs Improvement).",
        sec_sub_s))

    # Full-width charts
    if principles:
        radar_large = _build_radar_chart(principles, 220, 200)
        bar_large   = _build_bar_chart(principles, usable_w - 230, 200)

        chart_row2 = Table([[
            _drawing_to_image(radar_large, 220, 200),
            _drawing_to_image(bar_large, usable_w - 230, 200),
        ]], colWidths=[225, usable_w - 225])
        chart_row2.setStyle(TableStyle([
            ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING",  (0, 0), (-1, -1), 0),
            ("TOPPADDING",   (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 0),
        ]))
        elements.append(chart_row2)
        elements.append(Spacer(1, 5 * mm))

    # Summary table
    p_summary_data = [[
        Paragraph("#",                      S("psh0", fontSize=7.5, fontName="Helvetica-Bold", textColor=KPMG_WHITE)),
        Paragraph("Principle",              S("psh1", fontSize=7.5, fontName="Helvetica-Bold", textColor=KPMG_WHITE)),
        Paragraph("Score",                  S("psh2", fontSize=7.5, fontName="Helvetica-Bold", textColor=KPMG_WHITE)),
        Paragraph("Status",                 S("psh3", fontSize=7.5, fontName="Helvetica-Bold", textColor=KPMG_WHITE)),
        Paragraph("Sub-Parameters Evaluated", S("psh4", fontSize=7.5, fontName="Helvetica-Bold", textColor=KPMG_WHITE)),
    ]]
    for i, (pname, pdata) in enumerate(principles.items(), 1):
        sc = pdata.get("score", 0)
        params = pdata.get("parameters", {})
        sc_color = score_to_color(sc)
        label = score_to_label(sc)
        p_hex = PRINCIPLE_COLORS.get(pname, "#00C896")
        minibar = _build_subparam_minibar(sc, 28, 8)
        p_summary_data.append([
            Paragraph(str(i), small_s),
            Paragraph(f'<b>{pname}</b>', body_bold_s),
            Table([[
                _drawing_to_image(minibar, 28, 8),
                Paragraph(f'<font color="{"#059669" if sc>=75 else "#D97706" if sc>=55 else "#DC2626"}"><b> {sc}/100</b></font>',
                          S(f"psscore{i}", fontSize=7.5, fontName="Helvetica-Bold")),
            ]], colWidths=[30, 22]),
            Paragraph(label, small_s),
            Paragraph(", ".join(params.keys()), small_s),
        ])

    p_tbl = Table(p_summary_data, colWidths=[7 * mm, 36 * mm, 55 * mm, 22 * mm, 48 * mm])
    p_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  KPMG_BLUE),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  KPMG_WHITE),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [KPMG_WHITE, KPMG_LIGHT_GREY]),
        ("GRID",          (0, 0), (-1, -1), 0.4, KPMG_MID_GREY),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 5),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(p_tbl)
    elements.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 3 — AUDIT FINDINGS & RECOMMENDATIONS
    # ══════════════════════════════════════════════════════════════════════════
    elements.append(Paragraph("3. Audit Findings &amp; Recommendations", sec_title_s))
    elements.append(HRFlowable(width="100%", thickness=2, color=KPMG_TEAL, spaceAfter=5))

    if not findings:
        elements.append(Paragraph(
            "No critical governance findings were identified during this evaluation. "
            "The dataset demonstrates good alignment with the KPMG Trusted AI Framework. "
            "Continued monitoring and periodic re-evaluation are recommended to maintain this standard.",
            body_s))
    else:
        elements.append(Paragraph(
            f"{len(findings)} governance gap(s) were identified across the evaluated principles. "
            "Each finding is classified by severity — High, Medium, or Low — and includes a targeted, "
            "actionable recommendation. Findings are listed in order of priority, with High severity "
            "items requiring the most immediate attention.",
            sec_sub_s))

        for idx, f in enumerate(findings, 1):
            cat      = f.get("category", "N/A")
            severity = f.get("severity", "Medium")
            issue    = f.get("issue", "")
            rec      = f.get("recommendation", "")

            # Determine principle score for context
            principle_score = None
            for pname, pdata in principles.items():
                if pname.lower() in cat.lower() or cat.lower() in pname.lower():
                    principle_score = pdata.get("score")
                    break

            sev_bg     = colors.HexColor("#FEF2F2") if severity == "High" else colors.HexColor("#E8EEF7") if severity == "Low" else colors.HexColor("#FFFBEB")
            sev_border = KPMG_RED if severity == "High" else KPMG_BLUE if severity == "Low" else KPMG_AMBER

            score_context = f" (Principle Score: {principle_score}/100)" if principle_score is not None else ""

            f_hdr = Table([[
                Paragraph(f"<b>{idx}. {cat}{score_context}</b>",
                          S(f"fcat{idx}", fontSize=10, leading=14, textColor=sev_border,
                            fontName="Helvetica-Bold")),
                Paragraph(f"<b>{severity} Severity</b>",
                          S(f"fsev{idx}", fontSize=9, leading=12, textColor=sev_border,
                            fontName="Helvetica-Bold", alignment=TA_RIGHT)),
            ]], colWidths=[usable_w - 35 * mm, 35 * mm])
            f_hdr.setStyle(TableStyle([
                ("BACKGROUND",    (0, 0), (-1, -1), sev_bg),
                ("TOPPADDING",    (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING",   (0, 0), (-1, -1), 10),
                ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
                ("LINEBELOW",     (0, 0), (-1, -1), 2, sev_border),
            ]))

            # Build rich finding body with What/Why/How structure
            finding_body_rows = [
                [Paragraph("<b>What was found:</b>", S(f"fwhat{idx}", fontSize=8,
                    fontName="Helvetica-Bold", textColor=colors.HexColor("#374151")))],
                [Paragraph(issue, finding_txt_s)],
                [Spacer(1, 4)],
                [Paragraph("<b>Why this matters:</b>", S(f"fwhy{idx}", fontSize=8,
                    fontName="Helvetica-Bold", textColor=colors.HexColor("#374151")))],
                [Paragraph(
                    _finding_why_it_matters(cat, severity),
                    S(f"fwhytxt{idx}", fontSize=8, leading=12,
                      textColor=colors.HexColor("#4B5563"), fontName="Helvetica",
                      spaceAfter=3, alignment=TA_JUSTIFY))],
                [Spacer(1, 4)],
                [Paragraph("<b>Recommended Action:</b>", S(f"frech{idx}", fontSize=8,
                    fontName="Helvetica-Bold", textColor=colors.HexColor("#1D4ED8")))],
                [Paragraph(rec, rec_txt_s)],
            ]
            f_body = Table(finding_body_rows, colWidths=[usable_w])
            f_body.setStyle(TableStyle([
                ("BACKGROUND",    (0, 0), (-1, -1), KPMG_WHITE),
                ("TOPPADDING",    (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("LEFTPADDING",   (0, 0), (-1, -1), 12),
                ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
                ("BOX",           (0, 0), (-1, -1), 0.5, KPMG_MID_GREY),
                ("LINEBEFORE",    (0, 0), (0, -1),  3, sev_border),
            ]))

            elements.append(KeepTogether([f_hdr, f_body, Spacer(1, 4 * mm)]))

    # Overall recommendation
    if recommendation:
        elements.append(Spacer(1, 4 * mm))
        elements.append(Paragraph("Overall Assessment &amp; Recommendation", sec_title_s))
        elements.append(HRFlowable(width="100%", thickness=1, color=KPMG_AMBER, spaceAfter=5))
        rec_tbl = Table([[Paragraph(recommendation,
            S("ov_rec", fontSize=8.5, leading=13, textColor=colors.HexColor("#1F2937"),
              fontName="Helvetica", alignment=TA_JUSTIFY))]],
            colWidths=[usable_w])
        rec_tbl.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (-1, -1), colors.HexColor("#E8EEF7")),
            ("LEFTPADDING",  (0, 0), (-1, -1), 14),
            ("TOPPADDING",   (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 10),
            ("LINEBEFORE",   (0, 0), (0, -1), 4, KPMG_BLUE),
            ("BOX",          (0, 0), (-1, -1), 0.5, colors.HexColor("#B8C9E4")),
        ]))
        elements.append(rec_tbl)

    elements.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 4 — DETAILED PRINCIPLE BREAKDOWN
    # ══════════════════════════════════════════════════════════════════════════
    elements.append(Paragraph("4. Detailed Principle Assessment", sec_title_s))
    elements.append(HRFlowable(width="100%", thickness=2, color=KPMG_TEAL, spaceAfter=5))
    elements.append(Paragraph(
        "Each principle is evaluated across multiple sub-parameters reflecting structural signals "
        "in the dataset. For each sub-parameter, this section explains: what it measures, "
        "what the score actually means for this AI system, and — where improvement is needed — "
        "a specific, actionable recommendation. Scores below 75 indicate areas with governance gaps.",
        sec_sub_s))

    for i, (pname, pdata) in enumerate(principles.items(), 1):
        sc = pdata.get("score", 0)
        params = pdata.get("parameters", {})
        p_color_hex = PRINCIPLE_COLORS.get(pname, "#00C896")
        p_color = colors.HexColor(p_color_hex)
        sc_color = score_to_color(sc)
        label = score_to_label(sc)
        desc = PRINCIPLE_DESCRIPTIONS.get(pname, "")

        # Principle donut (small)
        p_donut = _build_compliance_donut(sc, 60, 60)
        p_donut_img = _drawing_to_image(p_donut, 60, 60)

        # Principle header — KPMG blue background, all text readable on dark
        sc_color_hex = "#059669" if sc >= 75 else "#D97706" if sc >= 55 else "#DC2626"
        # Score pill background: lighter tint so coloured score is readable
        score_pill_bg = colors.HexColor("#0D47A1")  # slightly lighter than KPMG_BLUE for contrast
        hdr_left = Paragraph(
            f'<b>{i}. {pname}</b>',
            S(f"ph{i}", fontSize=12, leading=16, textColor=KPMG_WHITE, fontName="Helvetica-Bold"))
        hdr_mid = Paragraph(
            f'{label}',
            S(f"ps{i}", fontSize=8, leading=12, textColor=colors.HexColor("#C7DCF0"),
              fontName="Helvetica", alignment=TA_RIGHT))
        # Score rendered on a white pill so colour is visible regardless of score
        hdr_score = Paragraph(
            f'<font color="{sc_color_hex}"><b>{sc}</b></font>',
            S(f"psc{i}", fontSize=20, leading=24, textColor=colors.HexColor(sc_color_hex),
              fontName="Helvetica-Bold", alignment=TA_CENTER))
        score_sub = Paragraph(
            "/100",
            S(f"psub{i}", fontSize=7, leading=9, textColor=colors.HexColor("#C7DCF0"),
              fontName="Helvetica", alignment=TA_CENTER))

        score_cell = Table([[hdr_score],[score_sub]], colWidths=[22*mm])
        score_cell.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), colors.HexColor("#FFFFFF")),
            ("TOPPADDING",    (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING",   (0, 0), (-1, -1), 0),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
        ]))

        hdr_tbl = Table([[hdr_left, hdr_mid, score_cell]],
                        colWidths=[usable_w - 35*mm - 22*mm, 25*mm, 22*mm])
        hdr_tbl.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), KPMG_BLUE),
            ("TOPPADDING",    (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ("LEFTPADDING",   (0, 0), (-1, -1), 10),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
            ("LINEBELOW",     (0, 0), (-1, -1), 2.5, colors.HexColor("#0091DA")),
        ]))

        hdr_with_donut = hdr_tbl

        # Description
        desc_para = Paragraph(desc, S(f"pd{i}", fontSize=8, leading=12.5,
            textColor=colors.HexColor("#374151"), fontName="Helvetica",
            leftIndent=4, rightIndent=4, spaceBefore=5, spaceAfter=6,
            alignment=TA_JUSTIFY))

        # Sub-parameters table with definitions + mini progress bars
        sub_rows = [[
            Paragraph("Sub-Parameter", S(f"sph0_{i}", fontSize=7.5, fontName="Helvetica-Bold", textColor=KPMG_WHITE)),
            Paragraph("Score &amp; Progress", S(f"sph1_{i}", fontSize=7.5, fontName="Helvetica-Bold", textColor=KPMG_WHITE)),
            Paragraph("Status", S(f"sph2_{i}", fontSize=7.5, fontName="Helvetica-Bold", textColor=KPMG_WHITE)),
        ]]

        for param, val in params.items():
            v = int(val)
            vc = score_to_color(v)
            vl = score_to_label(v)
            vhex = "#059669" if v >= 75 else "#D97706" if v >= 55 else "#DC2626"
            bar_d = _build_subparam_minibar(v, 55, 8)
            bar_img = _drawing_to_image(bar_d, 55, 8)

            sub_rows.append([
                Paragraph(param, body_s),
                Table([[
                    bar_img,
                    Paragraph(f'<font color="{vhex}"><b> {v}</b></font>',
                              S(f"spv_{i}_{param}", fontSize=8, fontName="Helvetica-Bold")),
                ]], colWidths=[58, 22]),
                Paragraph(vl, small_s),
            ])

        sub_tbl = Table(sub_rows, colWidths=[80 * mm, 83, usable_w - 80 * mm - 83])
        sub_tbl.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, 0),  colors.HexColor("#F3F4F6")),
            ("FONTNAME",      (0, 0), (-1, 0),  "Helvetica-Bold"),
            ("FONTSIZE",      (0, 0), (-1, 0),  7.5),
            ("BACKGROUND",    (0, 0), (-1, 0),  KPMG_BLUE),
            ("ROWBACKGROUNDS",(0, 1), (-1, -1), [KPMG_WHITE, colors.HexColor("#FAFAFA")]),
            ("GRID",          (0, 0), (-1, -1), 0.4, KPMG_MID_GREY),
            ("TOPPADDING",    (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING",   (0, 0), (-1, -1), 7),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ]))

        # Sub-parameter definitions drill-down — rich version with score interpretation
        drill_items = [Paragraph("<b>Sub-Parameter Definitions, Score Interpretation &amp; Improvement Guidance</b>",
                                  S(f"dh_{i}", fontSize=8.5, fontName="Helvetica-Bold",
                                    textColor=KPMG_BLUE, spaceBefore=8, spaceAfter=4))]

        drill_items.append(Paragraph(
            f"The {pname} principle scored <b>{sc}/100</b>, indicating "
            f"<b>{score_to_label(sc)}</b> with KPMG Trusted AI standards. "
            + _principle_score_narrative(pname, sc, params),
            S(f"pnarr_{i}", fontSize=8, leading=12.5, textColor=colors.HexColor("#374151"),
              fontName="Helvetica", spaceAfter=6, alignment=TA_JUSTIFY)))

        for param, val in params.items():
            v = int(val)
            vhex = "#059669" if v >= 75 else "#D97706" if v >= 55 else "#DC2626"
            expl = _parameter_explanation(param, report)
            if isinstance(expl, tuple):
                rich_def, calc_note = expl
            else:
                rich_def, calc_note = "", str(expl)
            if not rich_def:
                rich_def = SUB_PARAMETER_DEFINITIONS.get(param, "")

            # Score meaning sentence
            score_meaning = _subparam_score_meaning(param, v)
            # Improvement guidance
            improvement = _subparam_improvement(param, v)

            # Param name line with inline score badge
            drill_items.append(Table([[
                Paragraph(f"<b>{param}</b>",
                    S(f"dn_{i}_{param}", fontSize=7.5, fontName="Helvetica-Bold",
                      textColor=colors.HexColor("#111827"))),
                Paragraph(f'<font color="{vhex}"><b>{v}/100 — {score_to_label(v)}</b></font>',
                    S(f"dnscore_{i}_{param}", fontSize=7.5, fontName="Helvetica-Bold",
                      alignment=TA_RIGHT)),
            ]], colWidths=[usable_w * 0.62, usable_w * 0.38],
            style=[
                ("TOPPADDING",    (0,0),(-1,-1), 5),
                ("BOTTOMPADDING", (0,0),(-1,-1), 2),
                ("LEFTPADDING",   (0,0),(-1,-1), 0),
                ("BACKGROUND",    (0,0),(-1,-1), colors.HexColor("#F0F4FA")),
                ("LINEBELOW",     (0,0),(-1,-1), 0.5, colors.HexColor("#CBD5E1")),
            ]))

            if rich_def:
                drill_items.append(Paragraph(rich_def, def_txt_s))

            # What this score means for this system
            drill_items.append(Paragraph(
                f"<b>What this score means:</b> {score_meaning}",
                S(f"dsm_{i}_{param}", fontSize=7.5, leading=11.5,
                  textColor=colors.HexColor("#374151"), fontName="Helvetica",
                  spaceAfter=2, leftIndent=8, alignment=TA_JUSTIFY)))

            # How to improve (only show if not already strong)
            if v < 85:
                drill_items.append(Paragraph(
                    f"<b>How to improve:</b> {improvement}",
                    S(f"dimp_{i}_{param}", fontSize=7.5, leading=11.5,
                      textColor=colors.HexColor("#1D4ED8"), fontName="Helvetica-Oblique",
                      spaceAfter=2, leftIndent=8, alignment=TA_JUSTIFY)))

            drill_items.append(Paragraph(
                f"<i>Calculation method: {calc_note}</i>", calc_txt_s))

        block = KeepTogether([
            hdr_with_donut,
            Spacer(1, 2),
            desc_para,
            sub_tbl,
            Spacer(1, 3),
            *drill_items,
            Spacer(1, 6 * mm),
        ])
        elements.append(block)

    elements.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 5 — DATASET DIAGNOSTICS
    # ══════════════════════════════════════════════════════════════════════════
    elements.append(Paragraph("5. Dataset Diagnostics", sec_title_s))
    elements.append(HRFlowable(width="100%", thickness=2, color=KPMG_TEAL, spaceAfter=5))
    elements.append(Paragraph(
        "Structural analysis of the ingested dataset underpins every score in this report. "
        "The metrics below reflect data completeness, schema consistency, and volume adequacy. "
        "Organisations are advised to address any gaps before the next audit cycle.",
        sec_sub_s))

    missing  = diagnostics.get("missing_ratio", 0)
    dupes    = diagnostics.get("duplicates", 0)
    schema_c = diagnostics.get("schema_confidence", 0)
    total_c  = diagnostics.get("total_columns", 0)
    text_c   = diagnostics.get("text_columns", 0)
    num_c    = diagnostics.get("numeric_columns", 0)
    col_names = diagnostics.get("column_names", [])

    def diag_status(val, good_thresh, warn_thresh, invert=False):
        if invert:
            return ("Good", KPMG_GREEN) if val <= good_thresh else ("Moderate", KPMG_AMBER) if val <= warn_thresh else ("High", KPMG_RED)
        return ("Good", KPMG_GREEN) if val >= good_thresh else ("Moderate", KPMG_AMBER) if val >= warn_thresh else ("Low", KPMG_RED)

    diag_data = [[
        Paragraph("Metric",         S("dgh0", fontSize=8, fontName="Helvetica-Bold", textColor=KPMG_WHITE)),
        Paragraph("Value",          S("dgh1", fontSize=8, fontName="Helvetica-Bold", textColor=KPMG_WHITE)),
        Paragraph("Status",         S("dgh2", fontSize=8, fontName="Helvetica-Bold", textColor=KPMG_WHITE)),
        Paragraph("Interpretation", S("dgh3", fontSize=8, fontName="Helvetica-Bold", textColor=KPMG_WHITE)),
    ]]

    diag_rows = [
        ("Total Records",     str(logs_evaluated),          ("Ingested", KPMG_BLUE),
         "Number of log entries processed by the audit pipeline."),
        ("Missing Data Ratio", f"{missing * 100:.1f}%",
         diag_status(missing, 0.05, 0.15, invert=True),
         "Proportion of fields with no value. Below 5% is acceptable."),
        ("Duplicate Records",  str(dupes),
         ("None detected", KPMG_GREEN) if dupes == 0 else ("Duplicates found", KPMG_RED),
         "Repeated records reduce data diversity and inflate volume metrics."),
        ("Schema Confidence",  f"{schema_c * 100:.1f}%",
         diag_status(schema_c, 0.85, 0.6),
         "Reliability of automated schema inference. >85% indicates a well-structured dataset."),
        ("Total Columns",      str(total_c),  ("\u2014", KPMG_GREY),
         "Total number of data fields in the uploaded dataset."),
        ("Text Columns",       str(text_c),   ("\u2014", KPMG_GREY),
         "String/text fields used for NLP and semantic analysis."),
        ("Numeric Columns",    str(num_c),    ("\u2014", KPMG_GREY),
         "Quantitative fields used for statistical scoring."),
        ("Data Quality Score", f"{dq_score}%",
         diag_status(dq_score, 80, 60),
         "Composite quality score combining completeness, schema confidence, and deduplication."),
    ]

    for label, val, (status_txt, status_col), interp in diag_rows:
        color_hex = status_col.hexval()[2:].upper()
        html = f'<font color="#{color_hex}"><b>{status_txt}</b></font>'
        diag_data.append([
            Paragraph(label, body_s),
            Paragraph(f"<b>{val}</b>", body_bold_s),
            Paragraph(html, small_s),
            Paragraph(interp, small_s),
        ])

    diag_tbl = Table(diag_data, colWidths=[46 * mm, 28 * mm, 28 * mm, usable_w - 102 * mm])
    diag_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  KPMG_BLUE),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  KPMG_WHITE),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [KPMG_WHITE, KPMG_LIGHT_GREY]),
        ("GRID",          (0, 0), (-1, -1), 0.5, KPMG_MID_GREY),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(diag_tbl)

    if col_names:
        elements.append(Spacer(1, 5 * mm))
        elements.append(Paragraph("<b>Detected Column Schema</b>", body_bold_s))
        elements.append(Spacer(1, 2))
        col_text = "  \u2502  ".join(col_names)
        elements.append(Paragraph(col_text,
            S("cols", fontSize=7.5, leading=12, textColor=KPMG_GREY,
              fontName="Helvetica", backColor=colors.HexColor("#F9FAFB"),
              borderPadding=(5, 8, 5, 8))))

    elements.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 6 — FRAMEWORK REFERENCE
    # ══════════════════════════════════════════════════════════════════════════
    elements.append(Paragraph("6. KPMG Trusted AI Framework — Reference Guide", sec_title_s))
    elements.append(HRFlowable(width="100%", thickness=2, color=KPMG_TEAL, spaceAfter=5))
    elements.append(Paragraph(
        "The KPMG Trusted AI Framework defines 10 interconnected principles organised around "
        "three core values: Values-led, Trustworthy, and Human-centric. These principles cover "
        "the full AI lifecycle from strategy and development through to deployment and monitoring. "
        "Each principle maps to specific governance requirements across the EU AI Act, ISO 42001, and NIST AI RMF.",
        sec_sub_s))

    core_values = {
        "Fairness":       "Values-led",
        "Transparency":   "Trustworthy",
        "Explainability": "Trustworthy",
        "Accountability": "Values-led",
        "Data Integrity": "Trustworthy",
        "Reliability":    "Trustworthy",
        "Security":       "Trustworthy",
        "Safety":         "Human-centric",
        "Privacy":        "Values-led",
        "Sustainability":  "Values-led",
    }
    focus_areas = {
        "Fairness":       "Equitable treatment across all demographic groups; bias monitoring and equal error rates",
        "Transparency":   "Openness about model capabilities, training data, limitations, and decision logic",
        "Explainability": "Interpretable outputs and confidence scores accessible to all stakeholder levels",
        "Accountability": "Clear governance structures, comprehensive audit trails, and escalation procedures",
        "Data Integrity": "Accurate, complete, and representative data pipelines with provenance tracking",
        "Reliability":    "Consistent performance under normal and adverse conditions with SLA compliance",
        "Security":       "Resilience against adversarial attacks, prompt injection, and cyber threats",
        "Safety":         "Proactive safeguarding against harm to people, businesses, and property",
        "Privacy":        "GDPR/CCPA compliance, data minimisation, and right-to-erasure by design",
        "Sustainability":  "Minimised environmental and compute footprint; energy-efficient architectures",
    }

    ref_data = [[
        Paragraph("Principle",    S("rh0", fontSize=8, fontName="Helvetica-Bold", textColor=KPMG_WHITE)),
        Paragraph("Core Value",   S("rh1", fontSize=8, fontName="Helvetica-Bold", textColor=KPMG_WHITE)),
        Paragraph("Key Focus Area", S("rh2", fontSize=8, fontName="Helvetica-Bold", textColor=KPMG_WHITE)),
    ]]
    for pname in principles.keys():
        ref_data.append([
            Paragraph(f'<b>{pname}</b>', body_bold_s),
            Paragraph(core_values.get(pname, "\u2014"), small_s),
            Paragraph(focus_areas.get(pname, "\u2014"), small_s),
        ])

    ref_tbl = Table(ref_data, colWidths=[40 * mm, 30 * mm, usable_w - 70 * mm])
    ref_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  KPMG_BLUE),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  KPMG_WHITE),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [KPMG_WHITE, KPMG_LIGHT_GREY]),
        ("GRID",          (0, 0), (-1, -1), 0.5, KPMG_MID_GREY),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(ref_tbl)
    elements.append(Spacer(1, 6 * mm))

    # Score legend
    elements.append(Paragraph("<b>Score Interpretation Guide</b>", body_bold_s))
    elements.append(Spacer(1, 3))
    legend_rows = [
        ("75 \u2013 100", "Strong",   KPMG_GREEN, "The AI system demonstrates strong governance practices aligned with this framework. Continue monitoring and document evidence for stakeholder reporting."),
        ("55 \u2013 74",  "Medium",  KPMG_AMBER, "Moderate alignment detected with identifiable gaps. Targeted remediation is recommended within the next governance cycle."),
        ("0 \u2013 54",   "Low",  KPMG_RED,   "Significant gaps identified. Remediation actions should be prioritised before expanded deployment or regulatory review."),
    ]
    leg_data = []
    for rng, lbl, col, desc in legend_rows:
        leg_data.append([
            Paragraph(f'<font color="#{col.hexval()[2:]}"><b>{rng}</b></font>',
                      S(f"lg_{lbl}", fontSize=9, leading=12, fontName="Helvetica-Bold")),
            Paragraph(f'<font color="#{col.hexval()[2:]}"><b>{lbl}</b></font>',
                      S(f"lgl_{lbl}", fontSize=9, leading=12, fontName="Helvetica-Bold")),
            Paragraph(desc, small_s),
        ])
    leg_tbl = Table(leg_data, colWidths=[24 * mm, 30 * mm, usable_w - 54 * mm])
    leg_tbl.setStyle(TableStyle([
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW",     (0, 0), (-1, -2), 0.5, KPMG_MID_GREY),
        ("LEFTPADDING",   (0, 0), (-1, -1), 4),
    ]))
    elements.append(leg_tbl)

    # ── Build ─────────────────────────────────────────────────────────────
    doc.build(elements,
              onFirstPage=template.on_page,
              onLaterPages=template.on_page)

    buffer.seek(0)
    return buffer


# ─── Helpers ──────────────────────────────────────────────────────────────────
def _friendly_report_id(ai_name: str, evaluated_at: str) -> str:
    """Generate a human-readable report ID: <AIName>_<YYYYMMDD>_<HHMM>"""
    try:
        dt = datetime.datetime.fromisoformat(evaluated_at)
        date_part = dt.strftime("%Y%m%d_%H%M")
    except Exception:
        date_part = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M")

    safe_name = "".join(c if c.isalnum() else "_" for c in ai_name.strip()).strip("_")
    safe_name = safe_name[:30]
    return f"{safe_name}_{date_part}"


# ─── List reports for current user ───────────────────────────────────────────
@router.get("")
def list_reports(current_user=Depends(get_current_user)):
    docs = list(
        reports_collection.find(
            {"owner_id": str(current_user["_id"])},
            {
                "_id": 0,
                "sample_records": 0,
                "trusted_ai_principles": 0,
                "risk_analysis.risk_items": 0,
            },
        ).sort("created_at", -1).limit(50)
    )
    for d in docs:
        if isinstance(d.get("created_at"), datetime.datetime):
            d["created_at"] = d["created_at"].isoformat()
    return {"reports": docs}


# ─── Single report by report_id ──────────────────────────────────────────────
@router.get("/{report_id}")
def get_report(report_id: str, current_user=Depends(get_current_user)):
    doc = reports_collection.find_one(
        {"report_id": report_id, "owner_id": str(current_user["_id"])},
        {"_id": 0, "sample_records": 0},
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Report not found.")
    if isinstance(doc.get("created_at"), datetime.datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    return doc


# ─── PDF download ──────────────────────────────────────────────────────────────
@router.get("/{report_id}/pdf")
async def download_report_pdf(report_id: str, current_user=Depends(get_current_user)):
    report = reports_collection.find_one({"report_id": report_id})

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    buffer = build_pdf(report)

    # Friendly filename: <AIName>_<YYYYMMDD>_<HHMM>_AuditReport.pdf
    ai_name = report.get("ai_name", "AI")
    evaluated_at = report.get("evaluated_at", "")
    friendly_id = _friendly_report_id(ai_name, evaluated_at)
    filename = f"{friendly_id}_AuditReport.pdf"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )