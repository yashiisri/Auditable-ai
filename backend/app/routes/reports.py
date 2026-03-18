from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import mm, inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.pdfgen import canvas as rl_canvas
from io import BytesIO
import datetime

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
KPMG_WHITE      = colors.white

PRINCIPLE_COLORS = {
    "Transparency":     "#00C8FF",
    "Explainability":   "#00E5A0",
    "Fairness":         "#FF6B9D",
    "Accountability":   "#FFB020",
    "Data Integrity":   "#A78BFA",
    "Reliability":      "#34D399",
    "Security":         "#F87171",
    "Privacy":          "#60A5FA",
    "Sustainability":   "#4ADE80",
    "Human-Centricity": "#FBBF24",
}

PRINCIPLE_ICONS = {
    "Transparency":     "T",
    "Explainability":   "E",
    "Fairness":         "F",
    "Accountability":   "A",
    "Data Integrity":   "D",
    "Reliability":      "R",
    "Security":         "S",
    "Privacy":          "P",
    "Sustainability":   "Su",
    "Human-Centricity": "H",
}

PRINCIPLE_DESCRIPTIONS = {
    "Transparency": (
        "The AI system should be open about its capabilities, limitations, and how it makes decisions. "
        "Users and stakeholders must be able to understand what the system does and why, including "
        "training data sources, model architecture, known failure modes, and uncertainty levels."
    ),
    "Explainability": (
        "Decisions and outputs produced by the AI system must be interpretable and explainable to "
        "relevant stakeholders, including non-technical users, regulators, and affected individuals. "
        "This includes local explanations, global model behaviour, and confidence quantification."
    ),
    "Fairness": (
        "The AI system must treat all individuals and groups equitably, avoiding discriminatory outcomes "
        "across protected characteristics such as gender, race, age, and socioeconomic status. "
        "Ongoing bias monitoring and equal error rates across groups must be maintained."
    ),
    "Accountability": (
        "Clear lines of responsibility must exist for AI system outcomes. Governance structures, "
        "comprehensive audit trails, human oversight mechanisms, and escalation procedures must be "
        "in place to assign responsibility and enable corrective action when harm occurs."
    ),
    "Data Integrity": (
        "The data used to train and operate the AI must be accurate, complete, representative, "
        "and free from harmful biases. Data provenance tracking, deduplication, schema enforcement, "
        "ground-truth labelling quality, and ongoing quality monitoring must be maintained."
    ),
    "Reliability": (
        "The AI system must perform consistently and predictably under both normal and adversarial "
        "conditions. Performance metrics, degradation detection, and SLA compliance under varying "
        "load and data distributions must be actively monitored and maintained."
    ),
    "Security": (
        "The AI system must be resilient against adversarial attacks, data poisoning, model "
        "extraction, prompt injection, and other cyber threats. A defence-in-depth approach "
        "covering input validation, output filtering, and continuous red-teaming must be maintained."
    ),
    "Privacy": (
        "Personal data used by the AI must be collected, processed, and stored in compliance with "
        "privacy regulations (GDPR, CCPA). Data minimisation, purpose limitation, consent management, "
        "anonymisation techniques, and right-to-erasure capabilities must be embedded by design."
    ),
    "Sustainability": (
        "The AI system should minimise its environmental footprint through efficient model "
        "architectures, optimised training and inference pipelines, carbon-aware scheduling, "
        "dataset efficiency, and responsible resource allocation to reduce climate impact."
    ),
    "Human-Centricity": (
        "AI systems must augment rather than replace human judgment in high-stakes decisions. "
        "Meaningful human oversight, contestability mechanisms, override capabilities, and clear "
        "escalation paths must be maintained to keep humans in control of consequential outcomes."
    ),
}


def score_to_color(score: int) -> colors.Color:
    if score >= 75:
        return colors.HexColor("#00C896")
    elif score >= 55:
        return colors.HexColor("#FFB020")
    else:
        return colors.HexColor("#ff4d4d")


def score_to_label(score: int) -> str:
    if score >= 75:
        return "Compliant"
    elif score >= 55:
        return "Conditional"
    else:
        return "Non-Compliant"


def risk_color(level: str) -> colors.Color:
    return {
        "Low": colors.HexColor("#00C896"),
        "Moderate": colors.HexColor("#FFB020"),
        "High": colors.HexColor("#ff4d4d"),
        "Critical": colors.HexColor("#cc0000"),
    }.get(level, KPMG_GREY)


def draw_score_bar(canvas_obj, x, y, width, height, score, color_hex="#00C896"):
    """Draw a filled progress bar on the canvas."""
    bg = colors.HexColor("#E5E7EB")
    canvas_obj.setFillColor(bg)
    canvas_obj.roundRect(x, y, width, height, height / 2, fill=1, stroke=0)
    fill_w = max(4, (score / 100) * width)
    canvas_obj.setFillColor(colors.HexColor(color_hex))
    canvas_obj.roundRect(x, y, fill_w, height, height / 2, fill=1, stroke=0)


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
    c = _derive_parameter_context(report)
    io_bonus = 20 if (c["has_input"] and c["has_output"]) else (10 if (c["has_input"] or c["has_output"]) else 0)
    model_bonus = 80 if c["model_type"] == "classification" else 60
    details = {
        "Schema Confidence": (
            f"schema_confidence ({_pct(c['diagnostics'].get('schema_confidence', 0) or 0)}) x 100 = {c['schema_score']}",
            "Measures how reliably the dataset schema could be inferred.",
        ),
        "Field Documentation": (
            f"clamp(io_bonus {io_bonus} x 4 + schema_score {c['schema_score']} x 0.2)",
            "Rewards clear input/output structure supported by a stable schema.",
        ),
        "Model Version Tracking": (
            "100 if version/model_id field exists, else 30",
            "Checks whether predictions can be tied to a tracked model version.",
        ),
        "Input/Output Coverage": (
            f"clamp(io_bonus {io_bonus} x 4.5)",
            "Measures whether both request and response fields are present in the logs.",
        ),
        "Column Completeness": (
            f"clamp(column_diversity {c['column_diversity']} x 0.8 + schema_score {c['schema_score']} x 0.2)",
            "Blends field breadth with schema quality.",
        ),
        "Model Interpretability": (
            f"{model_bonus} based on model type",
            "Uses the model family as a structural interpretability proxy.",
        ),
        "Prediction Confidence": (
            "100 if confidence/probability field exists, else 40",
            "Checks whether outputs carry explicit confidence scores.",
        ),
        "Reasoning Documentation": (
            "100 with hallucination/faithfulness fields, 60 with ROUGE/BLEU metrics, else 35",
            "Looks for evidence that reasoning quality or output quality is being tracked.",
        ),
        "Feedback Integration": (
            "100 if feedback/rating fields exist, else 30",
            "Measures whether human feedback is captured in the logs.",
        ),
        "Output Traceability": (
            f"clamp(io_bonus {io_bonus} x 4 + {'20' if c['has_score'] else '0'})",
            "Rewards outputs that can be traced back to inputs and scored outputs.",
        ),
        "Data Completeness": (
            f"(1 - missing_ratio {_pct(c['diagnostics'].get('missing_ratio', 0) or 0)}) x 100 = {c['completeness']}",
            "Represents the usable portion of the dataset after missing fields are considered.",
        ),
        "Label Balance": (
            "80 if label/target field exists, else 50",
            "Uses label availability as a proxy for assessing group and class balance.",
        ),
        "Demographic Coverage": (
            f"clamp(60 + (text_columns {c['text_cols']} / total_columns {c['total_cols']}) x 40)",
            "Estimates representational breadth from the share of text-like fields.",
        ),
        "Bias Indicator Fields": (
            "100 with feedback fields, 60 with labels only, else 30",
            "Checks whether fairness monitoring signals are available.",
        ),
        "Missing Data Equity": (
            f"clamp((1 - missing_ratio {_pct(c['diagnostics'].get('missing_ratio', 0) or 0)} x 2) x 100)",
            "Penalizes fairness confidence when missing data becomes materially high.",
        ),
        "Audit Log Volume": (
            f"min(logs_evaluated {c['logs_count']} / 100 x 100, 100) = {c['volume_score']}",
            "Uses record volume as a proxy for accountability coverage.",
        ),
        "Timestamp Coverage": (
            "100 if timestamp/date field exists, else 20",
            "Checks whether events can be ordered chronologically for audit.",
        ),
        "User Attribution": (
            "High score if user/session identifiers exist; lower score otherwise",
            "Checks whether events can be traced to a user or session.",
        ),
        "Model Version Control": (
            "100 if version/model_id field exists, else 30",
            "Measures whether outputs can be linked to a specific deployed model version.",
        ),
        "Error/Exception Logging": (
            "100 if error/exception field exists, else 35",
            "Checks whether system failures are explicitly captured.",
        ),
        "Completeness Score": (
            f"(1 - missing_ratio {_pct(c['diagnostics'].get('missing_ratio', 0) or 0)}) x 100 = {c['completeness']}",
            "Measures how complete the dataset is before integrity checks.",
        ),
        "Duplicate-Free Rate": (
            f"clamp(100 - (duplicates {c['diagnostics'].get('duplicates', 0) or 0} / logs {max(c['logs_count'], 1)}) x 500) = {c['duplicate_penalty']}",
            "Penalizes repeated records that reduce data trustworthiness.",
        ),
        "Schema Consistency": (
            f"schema_confidence ({_pct(c['diagnostics'].get('schema_confidence', 0) or 0)}) x 100 = {c['schema_score']}",
            "Direct structural integrity score derived from schema confidence.",
        ),
        "Data Type Diversity": (
            f"balanced mix of numeric ({c['numeric_cols']}) and text ({c['text_cols']}) columns across {c['total_cols']} total columns",
            "Rewards datasets that are not overly one-dimensional.",
        ),
        "Ground Truth Availability": (
            "100 if labels or text-evaluation metrics exist, else 40",
            "Checks whether outputs can be compared against an expected result.",
        ),
        "Consistency Score": (
            f"(1 - missing_ratio {_pct(c['diagnostics'].get('missing_ratio', 0) or 0)}) x 90",
            "A reliability proxy derived from dataset completeness.",
        ),
        "Performance Metrics": (
            "100 if quality/confidence metrics exist, else 40",
            "Checks for explicit quality metrics that support reliability tracking.",
        ),
        "Latency Monitoring": (
            "100 if latency/duration field exists, else 30",
            "Checks whether response time is monitored.",
        ),
        "Error Rate Tracking": (
            "100 if error/exception field exists, else 35",
            "Checks whether failures can be counted and monitored.",
        ),
        "Volume Sufficiency": (
            f"min(logs_evaluated {c['logs_count']} / 100 x 100, 100) = {c['volume_score']}",
            "Uses log volume to estimate statistical stability.",
        ),
        "Safety Flagging": (
            "100 if safety/moderation field exists, else 25",
            "Checks whether unsafe content outcomes are captured.",
        ),
        "Input Validation": (
            f"clamp(schema_score {c['schema_score']} x {'0.8 + 20' if c['has_input'] else '0.6'})",
            "Uses schema quality and input presence as a security proxy.",
        ),
        "Adversarial Robustness": (
            "40 for general_llm, 55 for other model types",
            "Applies a conservative baseline because direct red-team evidence is not available structurally.",
        ),
        "Content Moderation": (
            "100 if moderation fields exist, else 30",
            "Checks whether moderated outcomes are logged.",
        ),
        "PII Detection": (
            "100 if PII-related field exists, else 20",
            "Checks whether personal-data indicators are present.",
        ),
        "PII Field Tracking": (
            "100 if PII-related field exists, else 20",
            "Measures whether records containing personal data are explicitly marked.",
        ),
        "Data Minimisation": (
            f"clamp(100 - (total_columns {c['total_cols']} / 20) x 40)",
            "Penalizes overly broad schemas that may collect more than necessary.",
        ),
        "User Anonymisation": (
            "50 if direct user identifiers exist, else 70",
            "Rewards schemas that avoid direct user identifiers.",
        ),
        "Consent Management": (
            "Fixed structural estimate of 40",
            "Placeholder until explicit runtime consent signals are captured.",
        ),
        "Data Retention Signals": (
            "100 if timestamp/date field exists, else 30",
            "Checks whether retention windows can be enforced using time fields.",
        ),
        "Dataset Efficiency": (
            f"clamp(100 - (logs_evaluated {c['logs_count']} / 10000) x 30)",
            "Rewards leaner datasets with lower storage and processing burden.",
        ),
        "Feature Engineering": (
            f"clamp(column_diversity {c['column_diversity']} x 0.7 + 30)",
            "Uses schema breadth as a proxy for purposeful feature coverage.",
        ),
        "Compute Proxy Score": (
            "80 for classification, 55 for other model types",
            "Applies a lighter-compute bonus to structurally simpler model families.",
        ),
        "Redundancy Elimination": (
            f"same duplicate penalty as integrity: {c['duplicate_penalty']}",
            "Measures how effectively duplicated records are avoided.",
        ),
        "Resource Optimisation": (
            f"clamp(schema_score {c['schema_score']} x 0.6 + 40)",
            "Uses schema quality as a proxy for operational efficiency.",
        ),
        "Human Feedback Integration": (
            "100 if feedback/rating field exists, else 25",
            "Checks whether humans can review and influence outputs.",
        ),
        "Override/Escalation Fields": (
            "60 if feedback/escalation style fields exist, else 20",
            "Uses logged feedback signals as a proxy for human override paths.",
        ),
        "Decision Explainability": (
            f"{model_bonus} based on model type",
            "Uses the model family as a proxy for explainability in high-stakes decisions.",
        ),
        "Safety Override Signals": (
            "100 if safety/moderation field exists, else 35",
            "Checks whether safety interventions can be detected in logs.",
        ),
    }
    return details.get(param, ("Derived from audit heuristics", "This sub-parameter is calculated from structural signals in the uploaded dataset."))


# ─── Page Template ───────────────────────────────────────────────────────────
class KPMGPageTemplate:
    def __init__(self, report_id: str, ai_name: str):
        self.report_id = report_id
        self.ai_name = ai_name

    def on_page(self, canvas_obj, doc):
        canvas_obj.saveState()
        W, H = A4

        # Header bar
        canvas_obj.setFillColor(KPMG_BLUE)
        canvas_obj.rect(0, H - 18 * mm, W, 18 * mm, fill=1, stroke=0)

        # Header logo text
        canvas_obj.setFillColor(KPMG_WHITE)
        canvas_obj.setFont("Helvetica-Bold", 11)
        canvas_obj.drawString(14 * mm, H - 12 * mm, "Auditable AI")
        canvas_obj.setFont("Helvetica", 8)
        canvas_obj.drawString(14 * mm, H - 16.5 * mm, "KPMG Trusted AI Framework")

        # Header right — AI name
        canvas_obj.setFont("Helvetica", 8)
        canvas_obj.drawRightString(W - 14 * mm, H - 12 * mm, f"AI System: {self.ai_name}")
        canvas_obj.drawRightString(W - 14 * mm, H - 16.5 * mm, f"Confidential")

        # Footer bar
        canvas_obj.setFillColor(KPMG_BLUE)
        canvas_obj.rect(0, 0, W, 10 * mm, fill=1, stroke=0)

        # Footer text
        canvas_obj.setFillColor(KPMG_WHITE)
        canvas_obj.setFont("Helvetica", 7)
        canvas_obj.drawString(14 * mm, 3.5 * mm, f"Report ID: {self.report_id}")
        canvas_obj.drawCentredString(W / 2, 3.5 * mm, "Auditable AI\u2122 Governance Audit Report")
        canvas_obj.drawRightString(W - 14 * mm, 3.5 * mm, f"Page {doc.page}")

        # Thin teal accent line under header
        canvas_obj.setStrokeColor(KPMG_TEAL)
        canvas_obj.setLineWidth(2)
        canvas_obj.line(0, H - 18 * mm, W, H - 18 * mm)

        canvas_obj.restoreState()


# ─── Main PDF Builder ─────────────────────────────────────────────────────────
def build_pdf(report: dict) -> BytesIO:
    buffer = BytesIO()
    W, H = A4
    margin = 18 * mm

    report_id  = report.get("report_id", "N/A")
    ai_name    = report.get("ai_name", "N/A")
    model_type = report.get("model_type", "N/A")
    evaluated  = report.get("evaluated_at", "N/A")
    try:
        dt = datetime.datetime.fromisoformat(evaluated)
        evaluated = dt.strftime("%d %B %Y, %H:%M UTC")
    except Exception:
        pass

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

    template = KPMGPageTemplate(report_id, ai_name)

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=margin,
        leftMargin=margin,
        topMargin=25 * mm,
        bottomMargin=16 * mm,
        title=f"Auditable AI Governance Report — {ai_name}",
        author="Auditable AI",
        subject="KPMG Trusted AI Framework Audit",
    )

    # ── Styles ──────────────────────────────────────────────────────────────
    styles = getSampleStyleSheet()

    def S(name, **kwargs):
        return ParagraphStyle(name, **kwargs)

    cover_title = S("CoverTitle", fontSize=28, leading=34, textColor=KPMG_WHITE,
                    fontName="Helvetica-Bold", alignment=TA_LEFT, spaceAfter=6)
    cover_sub   = S("CoverSub",   fontSize=13, leading=18, textColor=colors.HexColor("#9DBFE0"),
                    fontName="Helvetica", alignment=TA_LEFT)
    cover_meta  = S("CoverMeta",  fontSize=10, leading=14, textColor=colors.HexColor("#6B91B0"),
                    fontName="Helvetica", alignment=TA_LEFT)

    sec_title   = S("SecTitle",   fontSize=15, leading=20, textColor=KPMG_BLUE,
                    fontName="Helvetica-Bold", spaceBefore=14, spaceAfter=6)
    sec_sub     = S("SecSub",     fontSize=9,  leading=13, textColor=KPMG_GREY,
                    fontName="Helvetica", spaceAfter=10)
    body        = S("Body",       fontSize=9,  leading=14, textColor=colors.HexColor("#1F2937"),
                    fontName="Helvetica", spaceAfter=6)
    body_bold   = S("BodyBold",   fontSize=9,  leading=14, textColor=colors.HexColor("#1F2937"),
                    fontName="Helvetica-Bold")
    small       = S("Small",      fontSize=7.5, leading=11, textColor=KPMG_GREY,
                    fontName="Helvetica")
    label_style = S("Label",      fontSize=8,  leading=10, textColor=KPMG_GREY,
                    fontName="Helvetica-Bold", spaceAfter=2)
    finding_txt = S("FindTxt",    fontSize=8.5, leading=13, textColor=colors.HexColor("#374151"),
                    fontName="Helvetica", spaceAfter=3)
    rec_txt     = S("RecTxt",     fontSize=8.5, leading=13, textColor=colors.HexColor("#1D4ED8"),
                    fontName="Helvetica-Oblique", spaceAfter=0)

    elements = []

    # ══════════════════════════════════════════════════════════════════════════
    # COVER PAGE
    # ══════════════════════════════════════════════════════════════════════════
    def build_cover():
        cover_elems = []

        # Dark background block (simulated via table)
        cover_header_data = [[
            Paragraph("Auditable AI\u2122", S("ch1", fontSize=32, leading=38,
                textColor=KPMG_TEAL, fontName="Helvetica-Bold")),
        ]]
        cover_header = Table(cover_header_data,
                             colWidths=[W - 2 * margin],
                             rowHeights=[45])
        cover_header.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), KPMG_BLUE),
            ("LEFTPADDING",  (0, 0), (-1, -1), 16),
            ("TOPPADDING",   (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 10),
        ]))
        cover_elems.append(cover_header)
        cover_elems.append(Spacer(1, 4 * mm))

        # Report title block
        title_block_data = [[
            Paragraph("Governance Audit Report", S("gt", fontSize=22, leading=28,
                textColor=colors.HexColor("#111827"), fontName="Helvetica-Bold")),
        ], [
            Paragraph("KPMG Trusted AI Framework — Comprehensive Assessment",
                       S("gsub", fontSize=11, leading=16, textColor=KPMG_BLUE,
                         fontName="Helvetica")),
        ]]
        title_block = Table(title_block_data, colWidths=[W - 2 * margin])
        title_block.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (-1, -1), KPMG_LIGHT_GREY),
            ("LEFTPADDING",  (0, 0), (-1, -1), 16),
            ("TOPPADDING",   (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 10),
        ]))
        cover_elems.append(title_block)
        cover_elems.append(Spacer(1, 8 * mm))

        # AI info table
        info_data = [
            [Paragraph("AI System",    label_style), Paragraph(ai_name,    body_bold)],
            [Paragraph("Model Type",   label_style), Paragraph(model_type,  body)],
            [Paragraph("Evaluated",    label_style), Paragraph(evaluated,   body)],
            [Paragraph("Report ID",    label_style), Paragraph(f'<font size="8" color="#9CA3AF">{report_id}</font>', body)],
        ]
        info_tbl = Table(info_data, colWidths=[40 * mm, W - 2 * margin - 40 * mm])
        info_tbl.setStyle(TableStyle([
            ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING",  (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING",   (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
            ("LINEBELOW",    (0, 0), (-1, -2), 0.5, colors.HexColor("#E5E7EB")),
        ]))
        cover_elems.append(info_tbl)
        cover_elems.append(Spacer(1, 10 * mm))

        # Overall score hero
        rc = risk_color(risk_level)
        score_bg = colors.HexColor("#F9FAFB")
        score_data = [[
            Paragraph(f'<font size="42" color="{rc.hexval() if hasattr(rc,"hexval") else "#00C896"}">'
                      f'<b>{overall_score}</b></font>',
                      S("sc", fontSize=42, leading=50, textColor=rc,
                        fontName="Helvetica-Bold", alignment=TA_CENTER)),
            Paragraph(f"<b>{risk_level} Risk</b>",
                      S("rl", fontSize=13, leading=18, textColor=rc,
                        fontName="Helvetica-Bold", alignment=TA_CENTER)),
        ]]
        score_tbl = Table([[
            Table(score_data, colWidths=[35 * mm, 35 * mm])
        ]], colWidths=[W - 2 * margin])
        score_tbl.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (-1, -1), score_bg),
            ("BOX",          (0, 0), (-1, -1), 1.5, rc),
            ("LEFTPADDING",  (0, 0), (-1, -1), 20),
            ("TOPPADDING",   (0, 0), (-1, -1), 14),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 14),
            ("ALIGN",        (0, 0), (-1, -1), "CENTER"),
        ]))
        cover_elems.append(score_tbl)
        cover_elems.append(Spacer(1, 8 * mm))

        # Stats strip
        stats = [
            ("Logs Evaluated", str(logs_evaluated)),
            ("Data Quality",   f"{dq_score}%"),
            ("Structural Risk", struct_risk),
            ("Principles",     str(len(principles))),
            ("Findings",       str(len(findings))),
        ]
        stat_data = [[Paragraph(f"<b>{v}</b>", S(f"sv{si}", fontSize=16, leading=20,
                        textColor=KPMG_BLUE, fontName="Helvetica-Bold", alignment=TA_CENTER))
                      for si, (_, v) in enumerate(stats)],
                     [Paragraph(k, S(f"sk{si}", fontSize=7.5, leading=10, textColor=KPMG_GREY,
                        fontName="Helvetica", alignment=TA_CENTER))
                      for si, (k, _) in enumerate(stats)]]
        col_w = (W - 2 * margin) / len(stats)
        stat_tbl = Table(stat_data, colWidths=[col_w] * len(stats))
        stat_tbl.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (-1, -1), KPMG_LIGHT_GREY),
            ("TOPPADDING",   (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 8),
            ("LINEAFTER",    (0, 0), (-2, -1), 0.5, colors.HexColor("#D1D5DB")),
        ]))
        cover_elems.append(stat_tbl)
        cover_elems.append(Spacer(1, 10 * mm))

        # Disclaimer
        cover_elems.append(Paragraph(
            "This report was generated by Auditable AI\u2122 using the KPMG Trusted AI Framework. "
            "All scores are derived from structural analysis of the provided dataset and should be "
            "reviewed in conjunction with qualitative governance assessments. This document is "
            "confidential and intended solely for authorised stakeholders.",
            small))

        return cover_elems

    elements.extend(build_cover())
    elements.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 1 — FRAMEWORK COMPLIANCE
    # ══════════════════════════════════════════════════════════════════════════
    elements.append(Paragraph("1. Regulatory & Framework Compliance", sec_title))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=KPMG_TEAL, spaceAfter=6))
    elements.append(Paragraph(
        "This AI system was assessed against four major international AI governance frameworks. "
        "Compliance status is derived from the overall Trusted AI score and individual principle scores.",
        sec_sub))

    FW_META = {
        "EU_AI_Act":   ("EU AI Act",          "European Union Artificial Intelligence Regulation (2024)"),
        "ISO_42001":   ("ISO/IEC 42001:2023",  "International AI Management System Standard"),
        "NIST_AI_RMF": ("NIST AI RMF",         "US National Institute of Standards AI Risk Management Framework"),
        "KPMG_TAF":    ("KPMG Trusted AI",     "KPMG Trusted AI Framework — 10 Principle Assessment"),
    }
    fw_data = [["Framework", "Standard", "Status", "Threshold"]]
    thresholds = {
        "EU_AI_Act":   "Score >= 75",
        "ISO_42001":   "Score >= 80",
        "NIST_AI_RMF": "Score >= 70",
        "KPMG_TAF":    "All audits",
    }
    for key, status in framework.items():
        meta = FW_META.get(key, (key, ""))
        sc = colors.HexColor("#00C896") if status in ("Compliant", "Certified Ready", "Aligned", "Assessed") else colors.HexColor("#FFB020")
        fw_data.append([
            Paragraph(f"<b>{meta[0]}</b>", body_bold),
            Paragraph(meta[1], small),
            Paragraph(f'<font color="{sc.hexval() if hasattr(sc,"hexval") else "#00C896"}"><b>{status}</b></font>', body_bold),
            Paragraph(thresholds.get(key, "—"), small),
        ])

    fw_tbl = Table(fw_data, colWidths=[35 * mm, 65 * mm, 32 * mm, 30 * mm])
    fw_tbl.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0),  KPMG_BLUE),
        ("TEXTCOLOR",    (0, 0), (-1, 0),  KPMG_WHITE),
        ("FONTNAME",     (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1, 0),  9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [KPMG_WHITE, KPMG_LIGHT_GREY]),
        ("GRID",         (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
        ("TOPPADDING",   (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 7),
        ("LEFTPADDING",  (0, 0), (-1, -1), 8),
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(fw_tbl)
    elements.append(Spacer(1, 6 * mm))

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 2 — PRINCIPLES SUMMARY TABLE
    # ══════════════════════════════════════════════════════════════════════════
    elements.append(Paragraph("2. KPMG Trusted AI — 10 Principles Overview", sec_title))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=KPMG_TEAL, spaceAfter=6))
    elements.append(Paragraph(
        "Each of the 10 KPMG Trusted AI principles was evaluated across multiple sub-parameters "
        "derived from the structure and content of the ingested dataset.",
        sec_sub))

    # Summary table
    p_summary_data = [["#", "Principle", "Score", "Status", "Sub-Parameters Evaluated"]]
    for i, (pname, pdata) in enumerate(principles.items(), 1):
        sc = pdata.get("score", 0)
        params = pdata.get("parameters", {})
        sc_color = score_to_color(sc)
        label = score_to_label(sc)
        p_summary_data.append([
            Paragraph(str(i), small),
            Paragraph(f"<b>{pname}</b>", body_bold),
            Paragraph(f'<font color="{sc_color.hexval() if hasattr(sc_color,"hexval") else "#00C896"}"><b>{sc}/100</b></font>', body_bold),
            Paragraph(label, small),
            Paragraph(", ".join(params.keys()), small),
        ])

    p_tbl = Table(p_summary_data, colWidths=[8 * mm, 38 * mm, 20 * mm, 24 * mm, 72 * mm])
    p_tbl.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0),  KPMG_BLUE),
        ("TEXTCOLOR",    (0, 0), (-1, 0),  KPMG_WHITE),
        ("FONTNAME",     (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1, 0),  8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [KPMG_WHITE, KPMG_LIGHT_GREY]),
        ("GRID",         (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
        ("TOPPADDING",   (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
        ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(p_tbl)
    elements.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 3 — DETAILED PRINCIPLE BREAKDOWN
    # ══════════════════════════════════════════════════════════════════════════
    elements.append(Paragraph("3. Detailed Principle Assessment", sec_title))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=KPMG_TEAL, spaceAfter=6))
    elements.append(Paragraph(
        "Each principle is evaluated across five sub-parameters. Scores reflect structural "
        "signals present in the dataset such as field presence, completeness, volume, and diversity. "
        "Each sub-parameter below now includes how it was calculated and what the score means.",
        sec_sub))

    for i, (pname, pdata) in enumerate(principles.items(), 1):
        sc = pdata.get("score", 0)
        params = pdata.get("parameters", {})
        p_color_hex = PRINCIPLE_COLORS.get(pname, "#00C896")
        p_color = colors.HexColor(p_color_hex)
        sc_color = score_to_color(sc)
        label = score_to_label(sc)
        desc = PRINCIPLE_DESCRIPTIONS.get(pname, "")

        # Principle header
        hdr_data = [[
            Paragraph(f'<b>{i}. {pname}</b>',
                      S(f"ph{i}", fontSize=12, leading=16, textColor=KPMG_WHITE,
                        fontName="Helvetica-Bold")),
            Paragraph(f'<b>{sc}/100  {label}</b>',
                      S(f"ps{i}", fontSize=11, leading=14, textColor=KPMG_WHITE,
                        fontName="Helvetica-Bold", alignment=TA_RIGHT)),
        ]]
        hdr_tbl = Table(hdr_data, colWidths=[W - 2 * margin - 40 * mm, 40 * mm])
        hdr_tbl.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (-1, -1), p_color),
            ("TOPPADDING",   (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 8),
            ("LEFTPADDING",  (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
        ]))

        # Description
        desc_para = Paragraph(desc, S(f"pd{i}", fontSize=8.5, leading=13,
            textColor=colors.HexColor("#374151"), fontName="Helvetica",
            leftIndent=4, rightIndent=4, spaceBefore=4, spaceAfter=8))

        # Sub-parameters table
        sub_data = [["Sub-Parameter", "Score", "Status"]]
        for param, val in params.items():
            v = int(val)
            vc = score_to_color(v)
            vl = score_to_label(v)
            sub_data.append([
                Paragraph(param, body),
                Paragraph(f'<font color="{vc.hexval() if hasattr(vc,"hexval") else "#00C896"}"><b>{v}</b></font>', body_bold),
                Paragraph(vl, small),
            ])

        sub_tbl = Table(sub_data, colWidths=[95 * mm, 20 * mm, 30 * mm + (W - 2 * margin - 145 * mm)])
        sub_tbl.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (-1, 0),  colors.HexColor("#F3F4F6")),
            ("FONTNAME",     (0, 0), (-1, 0),  "Helvetica-Bold"),
            ("FONTSIZE",     (0, 0), (-1, 0),  8),
            ("TEXTCOLOR",    (0, 0), (-1, 0),  KPMG_GREY),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [KPMG_WHITE, colors.HexColor("#FAFAFA")]),
            ("GRID",         (0, 0), (-1, -1), 0.4, colors.HexColor("#E5E7EB")),
            ("TOPPADDING",   (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
            ("LEFTPADDING",  (0, 0), (-1, -1), 8),
            ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
        ]))

        block = KeepTogether([
            hdr_tbl,
            Spacer(1, 2),
            desc_para,
            sub_tbl,
            Spacer(1, 4),
            Paragraph("<b>Sub-parameter drill-down</b>", body_bold),
            *[
                Paragraph(
                    f"<b>{param}:</b> {detail} <font color='#6B7280'>Calculated as {calc}.</font>",
                    small,
                )
                for param, (calc, detail) in [
                    (param, _parameter_explanation(param, report))
                    for param in params.keys()
                ]
            ],
            Spacer(1, 6 * mm),
        ])
        elements.append(block)

    elements.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 4 — DATASET DIAGNOSTICS
    # ══════════════════════════════════════════════════════════════════════════
    elements.append(Paragraph("4. Dataset Diagnostics", sec_title))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=KPMG_TEAL, spaceAfter=6))
    elements.append(Paragraph(
        "Structural analysis of the ingested dataset used as the basis for this evaluation.",
        sec_sub))

    missing  = diagnostics.get("missing_ratio", 0)
    dupes    = diagnostics.get("duplicates", 0)
    schema_c = diagnostics.get("schema_confidence", 0)
    total_c  = diagnostics.get("total_columns", 0)
    text_c   = diagnostics.get("text_columns", 0)
    num_c    = diagnostics.get("numeric_columns", 0)
    col_names = diagnostics.get("column_names", [])

    diag_data = [
        ["Metric", "Value", "Status"],
        ["Total Records",       str(logs_evaluated),                  "Ingested"],
        ["Missing Data Ratio",  f"{missing * 100:.1f}%",             "Good" if missing < 0.05 else "Moderate" if missing < 0.15 else "High"],
        ["Duplicate Records",   str(dupes),                           "None detected" if dupes == 0 else "Found"],
        ["Schema Confidence",   f"{schema_c * 100:.1f}%",            "High" if schema_c > 0.85 else "Moderate"],
        ["Total Columns",       str(total_c),                         "—"],
        ["Text Columns",        str(text_c),                          "—"],
        ["Numeric Columns",     str(num_c),                           "—"],
        ["Data Quality Score",  f"{dq_score}%",                       "Good" if dq_score >= 80 else "Moderate" if dq_score >= 60 else "Low"],
    ]

    diag_tbl = Table(diag_data, colWidths=[70 * mm, 50 * mm, 42 * mm])
    diag_tbl.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0),  KPMG_BLUE),
        ("TEXTCOLOR",    (0, 0), (-1, 0),  KPMG_WHITE),
        ("FONTNAME",     (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [KPMG_WHITE, KPMG_LIGHT_GREY]),
        ("GRID",         (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
        ("TOPPADDING",   (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 6),
        ("LEFTPADDING",  (0, 0), (-1, -1), 8),
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(diag_tbl)

    if col_names:
        elements.append(Spacer(1, 5 * mm))
        elements.append(Paragraph("<b>Detected Columns</b>", body_bold))
        elements.append(Spacer(1, 2))
        col_text = "  |  ".join(col_names)
        elements.append(Paragraph(col_text,
            S("cols", fontSize=8, leading=13, textColor=KPMG_GREY,
              fontName="Helvetica", backColor=colors.HexColor("#F9FAFB"),
              borderPadding=(4, 8, 4, 8))))

    elements.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 5 — AUDIT FINDINGS
    # ══════════════════════════════════════════════════════════════════════════
    elements.append(Paragraph("5. Audit Findings & Recommendations", sec_title))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=KPMG_TEAL, spaceAfter=6))

    if not findings:
        elements.append(Paragraph(
            "No critical governance findings were identified. The dataset aligns well with "
            "the KPMG Trusted AI Framework standards based on the structural analysis performed.",
            body))
    else:
        elements.append(Paragraph(
            f"{len(findings)} governance gap(s) were identified during this evaluation. "
            "Each finding includes a targeted recommendation for remediation.",
            sec_sub))

        for idx, f in enumerate(findings, 1):
            cat      = f.get("category", "N/A")
            severity = f.get("severity", "Medium")
            issue    = f.get("issue", "")
            rec      = f.get("recommendation", "")

            sev_bg = colors.HexColor("#FEF2F2") if severity == "High" else colors.HexColor("#FFFBEB")
            sev_border = colors.HexColor("#ff4d4d") if severity == "High" else colors.HexColor("#FFB020")

            finding_data = [[
                Paragraph(f"<b>{idx}. {cat}</b>",
                          S(f"fcat{idx}", fontSize=10, leading=14, textColor=sev_border,
                            fontName="Helvetica-Bold")),
                Paragraph(f"<b>{severity}</b>",
                          S(f"fsev{idx}", fontSize=9, leading=12, textColor=sev_border,
                            fontName="Helvetica-Bold", alignment=TA_RIGHT)),
            ]]
            f_hdr = Table(finding_data, colWidths=[W - 2 * margin - 25 * mm, 25 * mm])
            f_hdr.setStyle(TableStyle([
                ("BACKGROUND",   (0, 0), (-1, -1), sev_bg),
                ("TOPPADDING",   (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING",(0, 0), (-1, -1), 7),
                ("LEFTPADDING",  (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("LINEBELOW",    (0, 0), (-1, -1), 1.5, sev_border),
            ]))

            issue_para = Paragraph(issue, finding_txt)
            rec_para   = Paragraph(f"Recommendation: {rec}", rec_txt)

            detail_data = [[issue_para], [Spacer(1, 2)], [rec_para]]
            f_body = Table(detail_data, colWidths=[W - 2 * margin])
            f_body.setStyle(TableStyle([
                ("BACKGROUND",   (0, 0), (-1, -1), KPMG_WHITE),
                ("TOPPADDING",   (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING",(0, 0), (-1, -1), 6),
                ("LEFTPADDING",  (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("BOX",          (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
            ]))

            elements.append(KeepTogether([f_hdr, f_body, Spacer(1, 4 * mm)]))

    # ──────────────────────────────────────────────────────────────────────────
    # Overall recommendation
    if recommendation:
        elements.append(Spacer(1, 4 * mm))
        elements.append(Paragraph("Overall Recommendation", sec_title))
        elements.append(HRFlowable(width="100%", thickness=1, color=KPMG_TEAL, spaceAfter=6))
        rec_data = [[Paragraph(recommendation,
            S("ov_rec", fontSize=9, leading=14, textColor=colors.HexColor("#1F2937"),
              fontName="Helvetica"))]]
        rec_tbl = Table(rec_data, colWidths=[W - 2 * margin])
        rec_tbl.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (-1, -1), colors.HexColor("#FFFBEB")),
            ("LEFTPADDING",  (0, 0), (-1, -1), 14),
            ("TOPPADDING",   (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 10),
            ("LINEBEFORE",   (0, 0), (0, -1), 4, colors.HexColor("#FFB020")),
            ("BOX",          (0, 0), (-1, -1), 0.5, colors.HexColor("#FDE68A")),
        ]))
        elements.append(rec_tbl)

    elements.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # SECTION 6 — KPMG TRUSTED AI FRAMEWORK REFERENCE
    # ══════════════════════════════════════════════════════════════════════════
    elements.append(Paragraph("6. KPMG Trusted AI Framework — Reference", sec_title))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=KPMG_TEAL, spaceAfter=6))
    elements.append(Paragraph(
        "The KPMG Trusted AI Framework defines 10 interconnected principles organised around "
        "three core values: Values-led, Trustworthy, and Human-centric. These principles cover "
        "the full AI lifecycle from strategy and development to deployment and monitoring.",
        sec_sub))

    # Principles reference table
    ref_data = [["Principle", "Core Value", "Key Focus Area"]]
    core_values = {
        "Transparency":     "Trustworthy",
        "Explainability":   "Trustworthy",
        "Fairness":         "Values-led",
        "Accountability":   "Values-led",
        "Data Integrity":   "Trustworthy",
        "Reliability":      "Trustworthy",
        "Security":         "Trustworthy",
        "Privacy":          "Values-led",
        "Sustainability":   "Values-led",
        "Human-Centricity": "Human-centric",
    }
    focus_areas = {
        "Transparency":     "Openness about capabilities, data, and decision logic",
        "Explainability":   "Interpretable outputs for all stakeholder levels",
        "Fairness":         "Equitable treatment across demographic groups",
        "Accountability":   "Clear governance, audit trails, and responsibility chains",
        "Data Integrity":   "Accurate, complete, and representative data pipelines",
        "Reliability":      "Consistent performance under normal and adverse conditions",
        "Security":         "Resilience against adversarial and cyber threats",
        "Privacy":          "GDPR/CCPA compliance and data minimisation",
        "Sustainability":   "Minimised environmental and compute footprint",
        "Human-Centricity": "Human oversight and contestability in high-stakes decisions",
    }

    for pname in principles.keys():
        p_hex = PRINCIPLE_COLORS.get(pname, "#00C896")
        ref_data.append([
            Paragraph(f'<font color="{p_hex}"><b>{pname}</b></font>', body_bold),
            Paragraph(core_values.get(pname, "—"), small),
            Paragraph(focus_areas.get(pname, "—"), small),
        ])

    ref_tbl = Table(ref_data, colWidths=[42 * mm, 32 * mm, 88 * mm])
    ref_tbl.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0),  KPMG_BLUE),
        ("TEXTCOLOR",    (0, 0), (-1, 0),  KPMG_WHITE),
        ("FONTNAME",     (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1, 0),  9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [KPMG_WHITE, KPMG_LIGHT_GREY]),
        ("GRID",         (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
        ("TOPPADDING",   (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 6),
        ("LEFTPADDING",  (0, 0), (-1, -1), 8),
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(ref_tbl)
    elements.append(Spacer(1, 6 * mm))

    # Score legend
    elements.append(Paragraph("<b>Score Interpretation</b>", body_bold))
    elements.append(Spacer(1, 2))
    legend_data = [
        ["75 – 100", "Compliant",     "Meets KPMG Trusted AI standards. Continue monitoring."],
        ["55 – 74",  "Conditional",   "Partial compliance. Remediation required within 90 days."],
        ["0 – 54",   "Non-Compliant", "Critical gaps identified. Immediate remediation required."],
    ]
    leg_tbl = Table([[
        Paragraph(r[0], S(f"lg{i}s", fontSize=9, leading=12, fontName="Helvetica-Bold",
            textColor=score_to_color(int(r[0].split("–")[0].strip())))),
        Paragraph(f"<b>{r[1]}</b>", S(f"lg{i}l", fontSize=9, leading=12, fontName="Helvetica-Bold",
            textColor=score_to_color(int(r[0].split("–")[0].strip())))),
        Paragraph(r[2], small),
    ] for i, r in enumerate(legend_data)],
        colWidths=[22 * mm, 30 * mm, 110 * mm])
    leg_tbl.setStyle(TableStyle([
        ("TOPPADDING",   (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
        ("LINEBELOW",    (0, 0), (-1, -2), 0.5, colors.HexColor("#E5E7EB")),
    ]))
    elements.append(leg_tbl)

    # ── Build PDF ────────────────────────────────────────────────────────────
    doc.build(elements,
              onFirstPage=template.on_page,
              onLaterPages=template.on_page)

    buffer.seek(0)
    return buffer


# ─── List reports for current user ────────────────────────────────────────────
@router.get("")
def list_reports(current_user=Depends(get_current_user)):
    """Return all evaluate-pipeline reports owned by the current user,
    newest first, without the heavy trusted_ai_principles sub-parameter
    detail (to keep payloads small for the list view)."""
    docs = list(
        reports_collection.find(
            {"owner_id": str(current_user["_id"])},
            {
                "_id": 0,
                "sample_records": 0,
                # Omit large nested blobs from the list view
                "trusted_ai_principles": 0,
                "risk_analysis.risk_items": 0,
            },
        ).sort("created_at", -1).limit(50)
    )
    for d in docs:
        if isinstance(d.get("created_at"), datetime.datetime):
            d["created_at"] = d["created_at"].isoformat()
    return {"reports": docs}


# ─── Single report by report_id ───────────────────────────────────────────────
@router.get("/{report_id}")
def get_report(report_id: str, current_user=Depends(get_current_user)):
    """Return a single full report by its report_id.
    Ownership is enforced — users can only fetch their own reports."""
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

    filename = f"AuditReport_{report.get('ai_name','AI')}_{report_id[:8]}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )