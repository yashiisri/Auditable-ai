
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

interface Principle {
  score: number;
  parameters: Record<string, number>;
  description?: string;
}
interface ComputationNote {
  library: string;
  status: string;
  value: number | null;
}

interface ReportData {
  report_id: string;
  ai_name: string;
  model_type: string;
  model_label?: string;
  detection_confidence?: number;
  evaluated_at: string;
  overall_score: number;
  risk_level: string;
  structural_risk: string;
  logs_evaluated: number;
  data_quality_score: number;
  trusted_ai_principles: Record<string, Principle>;
  diagnostics: {
    missing_ratio: number;
    duplicates: number;
    schema_confidence: number;
    total_columns: number;
    text_columns: number;
    numeric_columns: number;
    column_names: string[];
  };
  model_metrics?: Record<string, {
    value: number | null;
    risk_level: string;
    description: string;
    unit: string;
    threshold_low?: number;
    threshold_moderate?: number;
    higher_is_better?: boolean;
  }>;
  computation_notes?: Record<string, ComputationNote>;
  column_warnings?: string[];
  findings: { category: string; severity: string; issue: string; recommendation: string; type?: string }[];
  recommendation: string;
  framework_compliance: Record<string, string>;
}

interface ParameterInsight {
  detail: string;
  calculation: string;
  computed_value?: string;
}

// KPMG colour palette only — no yellows
const KPMG_BLUE = "#00338D";
const KPMG_MID  = "#005EB8";
const KPMG_LIGHT = "#0091DA";

const ICONS: Record<string, string> = {
  Transparency: "🔍", Explainability: "💡", Fairness: "⚖️", Accountability: "📋",
  "Data Integrity": "🗄️", Reliability: "⚙️", Security: "🔒", Privacy: "🛡️",
  Sustainability: "🌱", "Safety": "🛡️"
};

const COLORS: Record<string, string> = {
  Transparency: KPMG_LIGHT, Explainability: KPMG_MID, Fairness: "#0078C8",
  Accountability: KPMG_BLUE, "Data Integrity": "#004F9F", Reliability: KPMG_LIGHT,
  Security: "#003087", Privacy: KPMG_MID, Sustainability: "#006B8F",
  "Safety": KPMG_BLUE,
};

const FW: Record<string, { label: string; icon: string; desc: string }> = {
  EU_AI_Act: { label: "EU AI Act", icon: "🇪🇺", desc: "European Union AI Regulation" },
  ISO_42001: { label: "ISO 42001", icon: "🏅", desc: "AI Management System Standard" },
  NIST_AI_RMF: { label: "NIST AI RMF", icon: "🏛️", desc: "AI Risk Management Framework" },
  KPMG_TAF: { label: "KPMG Trusted AI", icon: "🔷", desc: "Trusted AI Framework" },
};

const CC: Record<string, string> = {
  Compliant: "#059669", "Certified Ready": "#059669", Aligned: "#059669",
  Conditional: KPMG_MID, Assessed: KPMG_LIGHT, Partial: "#DC2626"
};

function pct(value: number) { return `${Math.round(value * 100)}%`; }
function band(score: number) {
  if (score >= 75) return "Strong";
  if (score >= 50) return "Watch";
  return "Critical";
}
function bandColor(score: number) {
  if (score >= 75) return "#059669";
  if (score >= 50) return KPMG_MID;
  return "#DC2626";
}
function bandBg(score: number) {
  if (score >= 75) return "#DCFCE7";
  if (score >= 50) return "#E6F2FB";
  return "#FEE2E2";
}

function deriveSignals(report: ReportData) {
  const diagnostics = report.diagnostics || {
    missing_ratio: 0, duplicates: 0, schema_confidence: 0,
    total_columns: 0, text_columns: 0, numeric_columns: 0, column_names: [],
  };
  const logsCount = report.logs_evaluated || 0;
  const totalCols = diagnostics.total_columns || 1;
  const textCols = diagnostics.text_columns || 0;
  const numericCols = diagnostics.numeric_columns || 0;
  const schemaScore = Math.max(0, Math.min(100, Math.round((diagnostics.schema_confidence || 0) * 100)));
  const completeness = Math.max(0, Math.min(100, Math.round((1 - (diagnostics.missing_ratio || 0)) * 100)));
  const duplicatePenalty = Math.max(0, Math.min(100, Math.round(Math.max(0, 100 - ((diagnostics.duplicates || 0) / Math.max(logsCount, 1)) * 500))));
  const volumeScore = Math.max(0, Math.min(100, Math.round(Math.min(logsCount / 100 * 100, 100))));
  const columnDiversity = Math.max(0, Math.min(100, Math.round(Math.min(totalCols / 10 * 100, 100))));
  const cols = (diagnostics.column_names || []).map(c => String(c).toLowerCase());
  const hasAny = (keys: string[]) => keys.some(k => cols.includes(k));
  const hasInput = hasAny(["input", "prompt", "query", "text", "question"]);
  const hasOutput = hasAny(["output", "response", "answer", "prediction", "result"]);
  const hasLabel = hasAny(["label", "class", "target", "ground_truth"]);
  const hasTimestamp = hasAny(["timestamp", "date", "time", "created_at"]);
  const hasUserId = hasAny(["user_id", "user", "session_id", "session"]);
  const hasScore = hasAny(["score", "confidence", "probability", "prob"]);
  const hasFeedback = hasAny(["feedback", "rating", "review", "human_eval"]);
  const hasSafety = hasAny(["is_safe", "safety", "flagged", "moderated"]);
  const hasPii = hasAny(["contains_pii", "pii", "personal"]);
  const hasVersion = hasAny(["model_version", "version", "model_id"]);
  const hasLatency = hasAny(["latency", "response_time", "duration"]);
  const hasError = hasAny(["error", "exception", "failed"]);
  const hasHalluc = hasAny(["hallucination", "faithfulness", "groundedness"]);
  const hasRouge = hasAny(["rouge", "bleu", "meteor", "bertscore"]);
  const hasOverride = hasAny(["human_override", "escalated", "manual_intervention", "human_review"]);
  const ioBonus = hasInput && hasOutput ? 20 : (hasInput || hasOutput ? 10 : 0);
  const modelBonus = report.model_type === "classification" ? 80 : 60;
  return {
    diagnostics, logsCount, totalCols, textCols, numericCols, schemaScore,
    completeness, duplicatePenalty, volumeScore, columnDiversity,
    hasInput, hasOutput, hasLabel, hasTimestamp, hasUserId, hasScore,
    hasFeedback, hasSafety, hasPii, hasVersion, hasLatency, hasError,
    hasHalluc, hasRouge, hasOverride, ioBonus, modelBonus,
  };
}

// Sub-parameter definitions with what is being calculated
const SUB_PARAM_META: Record<string, { what: string; formula: string; why: string }> = {
  "Schema Confidence": {
    what: "Structural integrity of the dataset schema",
    formula: "schema_confidence × 100",
    why: "A well-defined schema ensures data is consistently typed and interpretable by the audit engine.",
  },
  "Field Documentation": {
    what: "Presence of documented input/output fields",
    formula: "clamp(io_bonus × 4 + schema_score × 0.2)",
    why: "Documented fields enable traceability of model decisions back to specific inputs and outputs.",
  },
  "Model Version Tracking": {
    what: "Whether model version identifiers exist in logs",
    formula: "100 if version/model_id column detected, else 30",
    why: "Version tracking is essential for reproducibility and post-incident root cause analysis.",
  },
  "Input/Output Coverage": {
    what: "Completeness of request-response pairs in logs",
    formula: "clamp(io_bonus × 4.5)",
    why: "Full I/O coverage is required to audit model behaviour and detect output drift.",
  },
  "Column Completeness": {
    what: "Breadth of documented fields relative to schema quality",
    formula: "clamp(column_diversity × 0.8 + schema_score × 0.2)",
    why: "Wider column coverage enables more governance dimensions to be assessed.",
  },
  "Model Interpretability": {
    what: "Structural proxy for how interpretable the model family is",
    formula: "80 for classification, 60 for other model types",
    why: "Classification models have well-understood decision boundaries; LLMs require additional explainability tooling.",
  },
  "Prediction Confidence": {
    what: "Whether confidence or probability scores are logged",
    formula: "100 if score/confidence column detected, else 40",
    why: "Confidence scores allow auditors to assess calibration and flag low-certainty predictions.",
  },
  "Reasoning Documentation": {
    what: "Presence of reasoning, faithfulness, or NLP evaluation fields",
    formula: "100 if hallucination/faithfulness fields, 60 if ROUGE/BLEU, else 35",
    why: "Reasoning documentation is critical for LLM explainability and detecting hallucinations.",
  },
  "Feedback Integration": {
    what: "Whether human feedback signals are captured",
    formula: "100 if feedback/rating columns detected, else 30",
    why: "Human feedback closes the loop between model output and real-world quality assessment.",
  },
  "Output Traceability": {
    what: "Ability to trace outputs back to inputs and confidence scores",
    formula: "clamp(io_bonus × 4 + 20 if score detected)",
    why: "Traceable outputs are a prerequisite for accountability and regulatory audit trails.",
  },
  "Data Completeness": {
    what: "Proportion of non-missing values in the dataset",
    formula: "(1 − missing_ratio) × 100",
    why: "Missing data reduces the statistical reliability of all downstream governance scores.",
  },
  "Label Balance": {
    what: "Availability of class labels for fairness assessment",
    formula: "80 if label/target detected, else 50",
    why: "Labels are required to measure class imbalance and demographic disparity.",
  },
  "Demographic Coverage": {
    what: "Representational breadth estimated from text column ratio",
    formula: "clamp(60 + (text_cols / total_cols) × 40)",
    why: "Text-rich datasets are more likely to capture diverse demographic signals.",
  },
  "Bias Indicator Fields": {
    what: "Presence of fairness-related labels or feedback for bias monitoring",
    formula: "100 if feedback, 60 if label, else 30",
    why: "Explicit bias indicators are required to run statistical fairness tests.",
  },
  "Missing Data Equity": {
    what: "Fairness risk introduced by high missing-data rates",
    formula: "clamp((1 − missing_ratio × 2) × 100)",
    why: "Uneven missingness across groups can introduce systematic bias in model outputs.",
  },
  "Audit Log Volume": {
    what: "Volume of audit records as a proxy for accountability coverage",
    formula: "min(logs_evaluated / 100 × 100, 100)",
    why: "Sufficient log volume is required for statistically meaningful governance assessments.",
  },
  "Timestamp Coverage": {
    what: "Whether logs can be ordered and reviewed chronologically",
    formula: "100 if timestamp/date detected, else 20",
    why: "Timestamps enable temporal auditing, drift detection, and incident reconstruction.",
  },
  "User Attribution": {
    what: "Whether events can be traced to a user or session",
    formula: "100 if user/session ID detected, else 25",
    why: "User attribution is required for accountability and GDPR data subject requests.",
  },
  "Model Version Control": {
    what: "Whether each prediction is tied to a specific model version",
    formula: "100 if version fields detected, else 30",
    why: "Version control enables rollback, A/B comparison, and regulatory evidence.",
  },
  "Error/Exception Logging": {
    what: "Whether operational failures are explicitly captured",
    formula: "100 if error/exception fields detected, else 35",
    why: "Error logs are essential for incident response and system reliability auditing.",
  },
  "Completeness Score": {
    what: "Usable proportion of the dataset after missing values",
    formula: "(1 − missing_ratio) × 100",
    why: "Completeness directly impacts the confidence of all computed governance metrics.",
  },
  "Duplicate-Free Rate": {
    what: "Proportion of unique records in the dataset",
    formula: "clamp(100 − (duplicates / logs) × 500)",
    why: "Duplicate records inflate metrics and distort fairness and reliability assessments.",
  },
  "Schema Consistency": {
    what: "Structural integrity score from schema detection",
    formula: "schema_confidence × 100",
    why: "Consistent schemas ensure the audit engine can reliably parse and evaluate all records.",
  },
  "Data Type Diversity": {
    what: "Balance of numeric and text field coverage",
    formula: "clamp((numeric_cols / total_cols) × 50 + (text_cols / total_cols) × 50)",
    why: "Diverse data types enable both quantitative metrics and qualitative NLP evaluations.",
  },
  "Ground Truth Availability": {
    what: "Whether labels or evaluation metrics exist for output comparison",
    formula: "100 if labels or text-eval metrics detected, else 40",
    why: "Ground truth is required to compute accuracy, F1, and fairness metrics.",
  },
  "Consistency Score": {
    what: "Reliability proxy based on dataset completeness",
    formula: "(1 − missing_ratio) × 90",
    why: "Consistent data reduces variance in repeated audit runs.",
  },
  "Performance Metrics": {
    what: "Presence of metrics that track model quality over time",
    formula: "100 if ROUGE/confidence fields detected, else 40",
    why: "Performance metrics enable trend analysis and SLA compliance monitoring.",
  },
  "Latency Monitoring": {
    what: "Whether operational response times are measured",
    formula: "100 if latency/duration fields detected, else 30",
    why: "Latency monitoring is required for SLA compliance and user experience auditing.",
  },
  "Error Rate Tracking": {
    what: "Whether failures can be quantified and monitored",
    formula: "100 if error/exception fields detected, else 35",
    why: "Error rate tracking enables proactive reliability management and incident prevention.",
  },
  "Volume Sufficiency": {
    what: "Statistical stability of the reliability assessment",
    formula: "min(logs_evaluated / 100 × 100, 100)",
    why: "Low log volume produces unreliable reliability estimates with high variance.",
  },
  "Safety Flagging": {
    what: "Whether unsafe content or policy violations are recorded",
    formula: "100 if safety/moderation fields detected, else 25",
    why: "Safety flags are the primary signal for detecting harmful model outputs.",
  },
  "Input Validation": {
    what: "Structural security proxy from schema quality and input presence",
    formula: "clamp(schema_score × 0.8 + 20 if input detected)",
    why: "Input validation prevents prompt injection and malformed request attacks.",
  },
  "Adversarial Robustness": {
    what: "Model-type baseline for adversarial testing readiness",
    formula: "40 for general LLMs, 55 for other model types",
    why: "LLMs are more susceptible to adversarial prompts; classification models have more established defences.",
  },
  "Content Moderation": {
    what: "Whether moderated outcomes are explicitly logged",
    formula: "100 if moderation fields detected, else 30",
    why: "Content moderation logs provide evidence of policy enforcement for regulatory review.",
  },
  "PII Detection": {
    what: "Whether personal-data indicators are present in the dataset",
    formula: "100 if PII-related fields detected, else 20",
    why: "PII detection is a GDPR and data protection requirement for AI systems.",
  },
  "PII Field Tracking": {
    what: "Whether records containing personal data are explicitly marked",
    formula: "100 if PII fields detected, else 20",
    why: "Explicit PII tracking enables data subject access requests and deletion workflows.",
  },
  "Data Minimisation": {
    what: "Whether the schema collects only necessary columns",
    formula: "clamp(100 − (total_cols / 20) × 40)",
    why: "Data minimisation is a core GDPR principle reducing privacy exposure.",
  },
  "User Anonymisation": {
    what: "Structural evidence of anonymisation (absence of direct identifiers)",
    formula: "50 if user/session IDs detected, 70 if absent",
    why: "Anonymised datasets reduce re-identification risk and regulatory liability.",
  },
  "Consent Management": {
    what: "Structural estimate of consent signal availability",
    formula: "40 (static baseline — consent requires runtime signals)",
    why: "Consent management is a legal requirement under GDPR and similar regulations.",
  },
  "Data Retention Signals": {
    what: "Whether timestamp data supports retention and deletion rules",
    formula: "100 if timestamp fields detected, else 30",
    why: "Retention signals enable automated data lifecycle management and compliance.",
  },
  "Dataset Efficiency": {
    what: "Sustainability score penalising unnecessarily large datasets",
    formula: "clamp(100 − (logs_evaluated / 10000) × 30)",
    why: "Leaner datasets reduce compute costs and carbon footprint of AI operations.",
  },
  "Feature Engineering": {
    what: "Dataset breadth as a proxy for thoughtful feature coverage",
    formula: "clamp(column_diversity × 0.7 + 30)",
    why: "Well-engineered features improve model accuracy and reduce bias from proxy variables.",
  },
  "Compute Proxy Score": {
    what: "Lighter-compute bonus for structurally simpler model families",
    formula: "80 for classification, 55 for other model types",
    why: "Classification models typically require less compute than large generative models.",
  },
  "Redundancy Elimination": {
    what: "Effectiveness of duplicate record avoidance",
    formula: "clamp(100 − (duplicates / logs) × 500)",
    why: "Redundant data wastes storage and compute while distorting audit metrics.",
  },
  "Resource Optimisation": {
    what: "Schema quality as a proxy for operational efficiency",
    formula: "clamp(schema_score × 0.6 + 40)",
    why: "Well-structured schemas reduce parsing overhead and improve pipeline efficiency.",
  },
  "Harm Prevention Logging": {
    what: "Whether outputs that could cause harm are explicitly flagged",
    formula: "100 if safety/moderation fields detected, else 20",
    why: "Harm prevention logs are required for EU AI Act high-risk system compliance.",
  },
  "Safety Test Coverage": {
    what: "Whether structured safety evaluations are stored in audit logs",
    formula: "100 if feedback/evaluation fields detected, else 30",
    why: "Safety test coverage demonstrates due diligence for regulatory and insurance purposes.",
  },
  "Human Override Capability": {
    what: "Whether a human override mechanism is logged",
    formula: "100 if override/escalation fields detected, 60 if feedback signals, else 20",
    why: "Human override is a mandatory control for high-risk AI systems under EU AI Act.",
  },
  "Incident Response Signals": {
    what: "Whether safety incidents and escalations are captured for post-incident review",
    formula: "100 if error/exception fields detected, else 30",
    why: "Incident response signals enable root cause analysis and regulatory reporting.",
  },
  "Safeguard Effectiveness": {
    what: "Proportion of flagged outputs successfully mitigated by safety controls",
    formula: "100 if safety/moderation fields detected, else 25",
    why: "Safeguard effectiveness is the primary KPI for AI safety programme maturity.",
  },
};

function getParameterInsight(param: string, report: ReportData, selData?: Principle | null): ParameterInsight {
  const s = deriveSignals(report);
  const meta = SUB_PARAM_META[param];
  if (meta) {
    const pv = selData?.parameters?.[param];
    const computed = pv !== undefined ? `Computed value: ${pv}/100` : "";
    return {
      detail: meta.what,
      calculation: `Formula: ${meta.formula}. ${computed}`,
      computed_value: pv !== undefined ? String(pv) : undefined,
    };
  }
  const pv = selData?.parameters?.[param];
  return {
    detail: `${param} measures a governance dimension specific to this model type.`,
    calculation: pv !== undefined
      ? `Computed value: ${pv}/100. ${pv >= 75 ? "Strong posture." : pv >= 50 ? "Moderate — improvement recommended." : "Low score — governance gap detected."}`
      : "Calculated from dataset structure and model-specific audit heuristics.",
    computed_value: pv !== undefined ? String(pv) : undefined,
  };
  void s; // suppress unused warning
}

function Spider({ principles, onSelect, selected }: { principles: Record<string, Principle>; onSelect: (k: string | null) => void; selected: string | null }) {
  const keys = Object.keys(principles);
  const N = keys.length;
  const cx = 340, cy = 340, R = 200;
  const W = 680, H = 680;
  const ang = (i: number) => (Math.PI * 2 * i) / N - Math.PI / 2;
  const pt = (i: number, v: number) => ({
    x: cx + (v / 100) * R * Math.cos(ang(i)),
    y: cy + (v / 100) * R * Math.sin(ang(i)),
  });
  const labelPos = (i: number) => {
    const LABEL_R = R + 72;
    const a = ang(i);
    const x = cx + LABEL_R * Math.cos(a);
    const y = cy + LABEL_R * Math.sin(a);
    const anchor = Math.cos(a) > 0.3 ? "start" : Math.cos(a) < -0.3 ? "end" : "middle";
    return { x, y, anchor };
  };
  const poly = keys.map((k, i) => pt(i, principles[k].score));
  const polyStr = poly.map(p => `${p.x},${p.y}`).join(" ");
  const avgScore = Math.round(Object.values(principles).reduce((s, v) => s + v.score, 0) / N);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, display: "block", margin: "0 auto" }}>
      {[20, 40, 60, 80, 100].map(lvl => (
        <polygon key={lvl}
          points={keys.map((_, i) => { const p = pt(i, lvl); return `${p.x},${p.y}`; }).join(" ")}
          fill={lvl % 40 === 0 ? "rgba(0,51,141,0.04)" : "none"}
          stroke={lvl === 100 ? "rgba(0,51,141,0.25)" : "rgba(0,51,141,0.12)"}
          strokeWidth={lvl === 100 ? 1.5 : 1}
        />
      ))}
      {keys.map((_, i) => {
        const e = pt(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="rgba(0,51,141,0.12)" strokeWidth="1" />;
      })}
      {[20, 40, 60, 80].map(lvl => {
        const p = pt(0, lvl);
        return (
          <text key={lvl} x={p.x + 6} y={p.y} fill="rgba(100,116,139,0.7)" fontSize="9.5" textAnchor="start" dominantBaseline="middle">{lvl}</text>
        );
      })}
      <polygon points={polyStr} fill="rgba(0,94,184,0.08)" stroke="none" />
      <polygon points={polyStr} fill="none" stroke="rgba(0,94,184,0.7)" strokeWidth="2.5" strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 0 6px rgba(0,94,184,0.3))" }} />
      {poly.map((p, i) => {
        const k = keys[i];
        const c = COLORS[k] || KPMG_MID;
        const sel = selected === k;
        return (
          <circle key={i} cx={p.x} cy={p.y} r={sel ? 12 : 6}
            fill={sel ? c : "rgba(0,94,184,0.85)"} stroke={sel ? "#fff" : c}
            strokeWidth={sel ? 3 : 1.5}
            style={{ cursor: "pointer", transition: "all 0.25s ease", filter: sel ? `drop-shadow(0 0 10px ${c})` : "none" }}
            onClick={() => onSelect(sel ? null : k)}
            onMouseEnter={() => onSelect(k)}
            onMouseLeave={() => { if (!sel) onSelect(null); }}
          />
        );
      })}
      {keys.map((k, i) => {
        const { x, y, anchor } = labelPos(i);
        const c = COLORS[k] || KPMG_MID;
        const sel = selected === k;
        const sc = principles[k].score;
        const parts = k.split(" ");
        const lineH = 15;
        const totalH = parts.length * lineH + 14;
        const startY = y - totalH / 2 + lineH * 0.5;
        return (
          <g key={k} style={{ cursor: "pointer" }}
            onClick={() => onSelect(sel ? null : k)}
            onMouseEnter={() => onSelect(k)}
            onMouseLeave={() => { if (!sel) onSelect(null); }}>
            {parts.map((word, pi) => (
              <text key={pi} x={x} y={startY + pi * lineH} textAnchor={anchor}
                fill={sel ? c : "#374151"} fontSize={sel ? "12.5" : "11"}
                fontWeight={sel ? "700" : "500"} fontFamily="'Plus Jakarta Sans',sans-serif"
                style={{ transition: "fill 0.2s, font-size 0.2s" }}>{word}</text>
            ))}
            <text x={x} y={startY + parts.length * lineH + 3} textAnchor={anchor}
              fill={sel ? c : "#6B7280"} fontSize="11" fontWeight="800"
              fontFamily="'Plus Jakarta Sans',sans-serif" style={{ transition: "fill 0.2s" }}>{sc}</text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={48} fill="white" stroke="rgba(0,51,141,0.2)" strokeWidth="1.5"
        style={{ filter: "drop-shadow(0 4px 12px rgba(0,51,141,0.12))" }} />
      <text x={cx} y={cy - 7} textAnchor="middle" fill="#00338D" fontSize="30" fontWeight="900" fontFamily="'Plus Jakarta Sans',sans-serif">{avgScore}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="'Plus Jakarta Sans',sans-serif" letterSpacing="1.5">OVERALL</text>
    </svg>
  );
}

function ImprovedBarChart({ principles }: { principles: Record<string, Principle> }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const entries = Object.entries(principles).map(([name, data]) => ({
    name, score: data.score, color: COLORS[name] || KPMG_MID,
  }));
  return (
    <div style={{ padding: "20px 0", overflowX: "auto" }}>
      <ResponsiveContainer width="100%" height={Math.max(entries.length * 70 + 60, 260)}>
        <BarChart data={entries} layout="vertical" margin={{ top: 20, right: 50, left: 160, bottom: 20 }}>
          <CartesianGrid strokeDasharray="5 5" stroke="rgba(0,0,0,0.06)" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: "#94A3B8", fontSize: 12 }} />
          <YAxis type="category" dataKey="name" tick={{ fill: "#374151", fontSize: 13, fontWeight: 500 }} width={150} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "rgba(0,51,141,0.05)" }}
            contentStyle={{ background: "white", border: "1px solid rgba(0,51,141,0.2)", borderRadius: 12, padding: "14px 18px", color: "#1E293B", boxShadow: "0 10px 30px rgba(0,0,0,0.12)" }} />
          <Bar dataKey="score" radius={[0, 10, 10, 0]} barSize={28} animationDuration={1600} animationEasing="ease-out">
            {entries.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={`url(#lgrad-${index})`}
                style={{ transition: "all 0.35s ease", filter: hovered === entry.name ? "brightness(1.1) drop-shadow(0 2px 8px rgba(0,0,0,0.2))" : "none" }}
                onMouseEnter={() => setHovered(entry.name)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </Bar>
          <defs>
            {entries.map((entry, i) => (
              <linearGradient key={`lgrad-${i}`} id={`lgrad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={entry.color} stopOpacity={0.9} />
                <stop offset="100%" stopColor={entry.color} stopOpacity={0.5} />
              </linearGradient>
            ))}
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Radial({ score, label, color, size = 90 }: { score: number; label: string; color: string; size?: number }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ textAlign: "center", padding: "10px" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={size * 0.09} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={size * 0.09}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 1.4s ease" }} />
        <text x={size / 2} y={size / 2 + 6} textAnchor="middle" fill="#1E293B" fontSize={size * 0.24} fontWeight="900" fontFamily="'Plus Jakarta Sans',sans-serif">{score}</text>
      </svg>
      <div style={{ fontSize: 12, color: "#64748B", marginTop: 8, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// Generate tool-based recommendation from findings and scores
function generateToolRecommendation(report: ReportData): string {
  const modelType = report.model_label || report.model_type || "AI system";
  const score = report.overall_score;
  const findings = report.findings || [];
  const highFindings = findings.filter(f => f.severity === "High");
  const medFindings = findings.filter(f => f.severity === "Medium");
  const prn = report.trusted_ai_principles || {};

  const weakPrinciples = Object.entries(prn)
    .filter(([, v]) => v.score < 60)
    .sort((a, b) => a[1].score - b[1].score)
    .slice(0, 3)
    .map(([k]) => k);

  if (score >= 80 && highFindings.length === 0) {
    return `${modelType} demonstrates strong governance posture with an overall score of ${score}/100. The audit found no high-severity findings. Continue monitoring ${weakPrinciples.length > 0 ? weakPrinciples.join(", ") : "all principles"} and schedule quarterly re-assessments to maintain compliance with EU AI Act and KPMG Trusted AI Framework standards.`;
  }

  if (highFindings.length > 0) {
    const cats = [...new Set(highFindings.map(f => f.category))].join(", ");
    return `${modelType} has ${highFindings.length} high-severity finding(s) in ${cats} that require immediate remediation before production deployment. ${medFindings.length > 0 ? `Additionally, ${medFindings.length} medium-severity issue(s) should be addressed within 30 days. ` : ""}${weakPrinciples.length > 0 ? `Priority governance gaps identified in: ${weakPrinciples.join(", ")}. ` : ""}Implement the recommended controls, re-run the audit, and obtain sign-off from your AI Risk Officer before proceeding.`;
  }

  if (score >= 60) {
    return `${modelType} meets baseline governance requirements with a score of ${score}/100 and ${medFindings.length} medium-severity finding(s). ${weakPrinciples.length > 0 ? `Focus remediation efforts on ${weakPrinciples.join(", ")} to improve your compliance posture. ` : ""}Address the identified gaps within 60 days and re-assess to achieve full alignment with ISO 42001 and NIST AI RMF standards.`;
  }

  return `${modelType} requires significant governance improvements before deployment. Score of ${score}/100 indicates critical gaps across ${weakPrinciples.length > 0 ? weakPrinciples.join(", ") : "multiple principles"}. Engage your AI governance team to implement a structured remediation plan covering all ${findings.length} identified findings. A full re-audit is recommended after remediation.`;
}

export default function Report() {
  const location = useLocation();
  const navigate = useNavigate();
  const raw = location.state?.data;

  const r: ReportData = (() => {
    if (!raw) return null as any;
    if (raw.report_id || raw.trusted_ai_principles) return raw as ReportData;
    const catScores: Record<string, number> = raw.category_scores || {};
    const trusted_ai_principles: Record<string, { score: number; parameters: Record<string, number> }> = {};
    for (const [cat, score] of Object.entries(catScores)) {
      trusted_ai_principles[cat] = { score: score as number, parameters: { Score: score as number } };
    }
    const findings = (raw.findings || []).map((f: any) => ({
      category: f.category || "Unknown", severity: f.severity || "Medium",
      issue: f.issue || f.note || "See probe response", recommendation: f.recommendation || "Review model behaviour",
    }));
    const s = raw.overall_score || 0;
    const complianceStatus = s >= 75 ? "Compliant" : s >= 50 ? "Conditional" : "Partial";
    return {
      report_id: raw.audit_id || "N/A", ai_name: raw.ai_name || "External AI",
      model_type: raw.mode ? `BlackBox (${raw.mode.toUpperCase()})` : "BlackBox",
      evaluated_at: raw.completed_at || raw.created_at || new Date().toISOString(),
      overall_score: raw.overall_score || 0, risk_level: raw.risk_level || "Unknown",
      structural_risk: raw.risk_level || "Unknown", logs_evaluated: raw.probes_run || 0,
      data_quality_score: raw.overall_score || 0, trusted_ai_principles,
      diagnostics: { missing_ratio: 0, duplicates: 0, schema_confidence: 1, total_columns: 0, text_columns: 0, numeric_columns: 0, column_names: [] },
      findings, recommendation: "",
      framework_compliance: { EU_AI_Act: complianceStatus, ISO_42001: complianceStatus, NIST_AI_RMF: complianceStatus, KPMG_TAF: complianceStatus },
    } as ReportData;
  })();

  const [sel, setSel] = useState<string | null>(null);
  const [hoveredParam, setHoveredParam] = useState<string | null>(null);
  const [anim, setAnim] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => { setTimeout(() => setAnim(true), 150); }, []);
  useEffect(() => { setHoveredParam(null); }, [sel]);

  if (!r) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F8FAFC", gap: 20 }}>
        <p style={{ color: "#64748B", fontSize: 18 }}>No report data found.</p>
        <button style={{ padding: "14px 32px", background: "white", border: "1px solid #E2E8F0", color: "#374151", borderRadius: 12, cursor: "pointer", fontSize: 15, fontWeight: 600 }} onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const prn = r.trusted_ai_principles || {};
  const pkeys = Object.keys(prn);
  const hasPrn = pkeys.length > 0;
  const rc = r.risk_level === "Low" ? "#059669" : r.risk_level === "Moderate" ? KPMG_MID : "#DC2626";
  const rcBg = r.risk_level === "Low" ? "#DCFCE7" : r.risk_level === "Moderate" ? "#E6F2FB" : "#FEE2E2";
  const fmt = (d: string) => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const selData = sel ? prn[sel] : null;
  const selectedEntries = selData ? Object.entries(selData.parameters || {}) : [];
  const activeParam = hoveredParam && selData?.parameters?.[hoveredParam] !== undefined
    ? hoveredParam : (selData ? Object.keys(selData.parameters || {})[0] || null : null);
  const activeInsight = activeParam ? getParameterInsight(activeParam, r, selData) : null;
  const strongestParam = selectedEntries.length ? selectedEntries.reduce((best, entry) => ((entry[1] as number) > (best[1] as number) ? entry : best)) : null;
  const weakestParam = selectedEntries.length ? selectedEntries.reduce((worst, entry) => ((entry[1] as number) < (worst[1] as number) ? entry : worst)) : null;

  const toolRecommendation = generateToolRecommendation(r);

  const fade = (delay: number): React.CSSProperties => ({
    opacity: anim ? 1 : 0,
    transform: anim ? "translateY(0)" : "translateY(20px)",
    transition: `all 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
  });

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) { alert("You need to be logged in to download reports."); navigate("/login"); return; }
      if (!r.report_id) { alert("No report ID found."); return; }
      const response = await fetch(`http://localhost:8000/reports/${r.report_id}/pdf`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/pdf" },
      });
      if (!response.ok) {
        let errorDetail = "Unknown error";
        try { const errJson = await response.json(); errorDetail = errJson.detail || errorDetail; } catch {}
        throw new Error(`Download failed: ${response.status} - ${errorDetail}`);
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `Audit_Report_${r.report_id || "Unknown"}_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert(err.message || "Failed to download PDF.");
    } finally { setPdfLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1E293B", paddingBottom: 80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .card { background: white; border-radius: 20px; border: 1px solid #E2E8F0; box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04); }
        .hover-lift { transition: transform 0.2s, box-shadow 0.2s; }
        .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important; }
        .param-row { transition: all 0.18s ease; }
        .param-row:hover { background: rgba(0,94,184,0.06) !important; border-color: rgba(0,94,184,0.3) !important; }
      `}</style>

      {/* NAV */}
      <div style={{ background: "white", borderBottom: "1px solid #E2E8F0", padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, boxShadow: "0 1px 8px rgba(0,0,0,0.06)", position: "sticky", top: 0, zIndex: 100, ...fade(0) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.03em", background: `linear-gradient(135deg, ${KPMG_BLUE}, ${KPMG_MID})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Auditable AI™</span>
          <div style={{ width: 1, height: 20, background: "#E2E8F0" }} />
          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", background: "#E6F2FB", color: KPMG_MID, borderRadius: 20, border: `1px solid ${KPMG_LIGHT}40`, letterSpacing: "0.03em" }}>⬡ KPMG Trusted AI Framework</span>
        </div>
        <button style={{ padding: "8px 20px", background: "white", border: "1px solid #E2E8F0", color: "#64748B", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = KPMG_MID; (e.currentTarget as HTMLButtonElement).style.color = KPMG_MID; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#E2E8F0"; (e.currentTarget as HTMLButtonElement).style.color = "#64748B"; }}
          onClick={() => navigate("/dashboard")}>← Dashboard</button>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>

        {/* HEADER */}
        <div className="card" style={{ padding: "32px 36px", marginBottom: 24, background: `linear-gradient(135deg, ${KPMG_BLUE} 0%, ${KPMG_MID} 50%, ${KPMG_LIGHT} 100%)`, border: "none", color: "white", ...fade(0.05) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 24 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>Governance Audit Report</div>
              <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em", color: "white", marginBottom: 14 }}>{r.ai_name}</h1>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
                {[
                  { icon: "🧠", val: r.model_label || r.model_type },
                  { icon: "📅", val: fmt(r.evaluated_at) },
                  { icon: "🔑", val: `ID: ${r.report_id?.slice(0, 12)}…` },
                  ...(r.detection_confidence !== undefined ? [{ icon: "🎯", val: `${Math.round(r.detection_confidence * 100)}% confidence` }] : []),
                ].map((m, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}><span>{m.icon}</span><span>{m.val}</span></span>
                ))}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, color: "white", letterSpacing: "-0.04em" }}>{r.overall_score}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>/ 100 Overall</div>
              <div style={{ marginTop: 10, display: "inline-block", padding: "5px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: rcBg, color: rc, border: `1px solid ${rc}40` }}>{r.risk_level} Risk</div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 24, ...fade(0.1) }}>
          {[
            { icon: "📂", label: "Logs Evaluated", val: r.logs_evaluated, color: KPMG_MID },
            { icon: "📊", label: "Data Quality", val: `${r.data_quality_score}%`, color: "#059669" },
            { icon: "🏗️", label: "Structural Risk", val: r.structural_risk, color: r.structural_risk === "Low" ? "#059669" : r.structural_risk === "Moderate" ? KPMG_MID : "#DC2626" },
            { icon: "✅", label: "Principles Tested", val: pkeys.length, color: KPMG_BLUE },
            { icon: "⚠️", label: "Findings", val: r.findings?.length || 0, color: (r.findings?.length || 0) > 0 ? "#DC2626" : "#059669" },
          ].map((s, i) => (
            <div key={i} className="card hover-lift" style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 6, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* COLUMN WARNINGS */}
        {r.column_warnings && r.column_warnings.length > 0 && (
          <div style={{ marginBottom: 24, padding: "14px 20px", borderRadius: 14, background: "#E6F2FB", border: `1px solid ${KPMG_LIGHT}40`, display: "flex", flexDirection: "column", gap: 6, ...fade(0.12) }}>
            {r.column_warnings.map((w, i) => (
              <div key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: KPMG_BLUE, lineHeight: 1.5 }}><span>ℹ</span><span>{w}</span></div>
            ))}
          </div>
        )}

        {/* FRAMEWORK COMPLIANCE */}
        <div className="card" style={{ padding: "32px", marginBottom: 24, ...fade(0.15) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#E6F2FB", display: "grid", placeItems: "center", fontSize: 18 }}>🏛️</div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B" }}>Regulatory & Framework Compliance</h2>
              <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>Assessment against major AI governance standards</p>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #F1F5F9", marginTop: 20, paddingTop: 24 }}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "flex-start" }}>
              {Object.entries(r.framework_compliance || {}).map(([key, status]) => {
                const fw = FW[key] || { label: key, icon: "📋", desc: "" };
                const sc = CC[status] || "#94A3B8";
                const scBg = sc === "#059669" ? "#DCFCE7" : sc === KPMG_MID ? "#E6F2FB" : sc === KPMG_LIGHT ? "#E6F2FB" : "#FEE2E2";
                return (
                  <div key={key} className="hover-lift" style={{ padding: "20px 24px", borderRadius: 16, minWidth: 180, flex: "1 1 180px", maxWidth: 240, background: scBg, border: `1px solid ${sc}30`, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{fw.icon}</div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#1E293B", marginBottom: 4 }}>{fw.label}</div>
                    <div style={{ fontSize: 11, color: "#64748B", marginBottom: 10 }}>{fw.desc}</div>
                    <div style={{ display: "inline-block", padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, color: sc, background: "white", border: `1px solid ${sc}40` }}>{status}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 20, padding: "12px 16px", borderRadius: 12, background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 12, color: "#94A3B8" }}>
              ℹ️ EU AI Act • ISO/IEC 42001:2023 • NIST AI RMF • KPMG Trusted AI Framework
            </div>
          </div>
        </div>

        {/* TRUSTED AI PRINCIPLES */}
        {hasPrn && (
          <div className="card" style={{ padding: "32px", marginBottom: 24, ...fade(0.2) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#E6F2FB", display: "grid", placeItems: "center", fontSize: 18 }}>🕸️</div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B" }}>Trusted AI Principles Assessment</h2>
                <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>Click any principle to drill into sub-parameters and see exactly what was calculated</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 22, marginBottom: 28 }}>
              {[
                { label: "Avg. Principle Score", value: `${Math.round(Object.values(prn).reduce((s, v) => s + v.score, 0) / Math.max(pkeys.length, 1))}`, color: KPMG_MID, bg: "#E6F2FB" },
                { label: "Strong Principles", value: `${Object.values(prn).filter(v => v.score >= 75).length}/${pkeys.length}`, color: "#059669", bg: "#DCFCE7" },
                { label: "Needs Attention", value: `${Object.values(prn).filter(v => v.score < 60).length}`, color: "#DC2626", bg: "#FEE2E2" },
              ].map(item => (
                <div key={item.label} style={{ padding: "16px 18px", borderRadius: 14, background: item.bg, border: `1px solid ${item.color}20` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: item.color, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 28, marginBottom: 28 }}>
              <div style={{ width: "100%", maxWidth: 680, margin: "0 auto" }}>
                <Spider principles={prn} onSelect={setSel} selected={sel} />
              </div>
            </div>

            {/* DRILL-DOWN */}
            <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 24 }}>
              {!sel ? (
                <div>
                  <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "#F8FAFC", border: "1px solid #E2E8F0", textAlign: "center" }}>
                    Click any principle above to inspect sub-parameters and see what was calculated
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                    {pkeys.map(k => {
                      const c = COLORS[k] || KPMG_MID;
                      const sc = prn[k].score;
                      return (
                        <div key={k} className="hover-lift" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, background: "white", border: "1px solid #E2E8F0", cursor: "pointer" }} onClick={() => setSel(k)}>
                          <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: `${c}15`, border: `1px solid ${c}30`, display: "grid", placeItems: "center", fontSize: 18 }}>{ICONS[k]}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{k}</div>
                            <div style={{ height: 5, background: "#F1F5F9", borderRadius: 99, marginTop: 7 }}>
                              <div style={{ width: `${sc}%`, height: "100%", background: bandColor(sc), borderRadius: 99, transition: "width 0.8s ease", opacity: 0.8 }} />
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: 20, fontWeight: 900, color: bandColor(sc), lineHeight: 1 }}>{sc}</div>
                            <div style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 6, background: bandBg(sc), color: bandColor(sc), marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{band(sc)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : selData ? (
                <div>
                  {/* Principle header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, padding: "20px 22px", borderRadius: 16, background: `linear-gradient(135deg, ${(COLORS[sel] || KPMG_MID)}10, ${(COLORS[sel] || KPMG_MID)}05)`, border: `1.5px solid ${(COLORS[sel] || KPMG_MID)}30` }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 26, background: `${COLORS[sel] || KPMG_MID}15`, border: `1px solid ${(COLORS[sel] || KPMG_MID)}30` }}>{ICONS[sel]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#1E293B" }}>{sel}</div>
                      {selData.description && <div style={{ fontSize: 12, color: "#64748B", marginTop: 3, lineHeight: 1.5 }}>{selData.description}</div>}
                      <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>{Object.keys(selData.parameters).length} sub-parameters evaluated</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 40, fontWeight: 900, color: COLORS[sel] || KPMG_MID, lineHeight: 1 }}>{selData.score}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 8, background: bandBg(selData.score), color: bandColor(selData.score), marginTop: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{band(selData.score)}</div>
                    </div>
                  </div>

                  {/* Summary stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
                    {[
                      { label: "Sub-parameters", val: Object.keys(selData.parameters).length, color: KPMG_MID, bg: "#E6F2FB" },
                      { label: "Strongest", val: strongestParam?.[0]?.split(" ")[0] || "—", sub: strongestParam?.[1] ?? "", color: "#059669", bg: "#DCFCE7" },
                      { label: "Weakest", val: weakestParam?.[0]?.split(" ")[0] || "—", sub: weakestParam?.[1] ?? "", color: "#DC2626", bg: "#FEE2E2" },
                    ].map(s => (
                      <div key={s.label} style={{ padding: "14px 16px", borderRadius: 12, background: s.bg, textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: s.color, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, marginBottom: 6 }}>{s.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</div>
                        {s.sub !== undefined && s.sub !== "" && <div style={{ fontSize: 12, color: s.color, marginTop: 2, fontWeight: 700 }}>{s.sub}</div>}
                      </div>
                    ))}
                  </div>

                  {/* Sub-parameters + insight panel */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
                    {/* Left: params */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: KPMG_MID, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, padding: "8px 12px", background: "#E6F2FB", borderRadius: 8 }}>
                        Sub-parameters — hover to inspect calculations
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {Object.entries(selData.parameters).map(([param, val]) => {
                          const v = val as number;
                          const c = COLORS[sel] || KPMG_MID;
                          const sc2 = bandColor(v);
                          const isActive = activeParam === param;
                          const meta = SUB_PARAM_META[param];
                          return (
                            <div key={param} className="param-row"
                              style={{ padding: "14px 16px", borderRadius: 12, background: isActive ? `${c}08` : "#F8FAFC", border: isActive ? `2px solid ${c}50` : "1.5px solid #E2E8F0", cursor: "pointer" }}
                              onMouseEnter={() => setHoveredParam(param)}
                              onMouseLeave={() => setHoveredParam(null)}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                <div style={{ flex: 1, marginRight: 8 }}>
                                  <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 600, color: isActive ? "#1E293B" : "#374151", lineHeight: 1.3 }}>{param}</div>
                                  {meta && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3, lineHeight: 1.4 }}>{meta.what}</div>}
                                </div>
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                  <div style={{ fontSize: 20, fontWeight: 900, color: sc2 }}>{v}</div>
                                  <div style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 6, background: bandBg(v), color: sc2, textTransform: "uppercase" }}>{band(v)}</div>
                                </div>
                              </div>
                              <div style={{ height: 6, background: "#E2E8F0", borderRadius: 99 }}>
                                <div style={{ width: `${v}%`, height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${c}, ${sc2})`, transition: "width 0.5s ease" }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: insight */}
                    <div style={{ position: "sticky", top: 80, padding: "24px", borderRadius: 18, background: "#F8FAFC", border: `2px solid ${(COLORS[sel] || KPMG_MID)}30`, minHeight: 280 }}>
                      {activeParam && activeInsight ? (
                        <>
                          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, paddingBottom: 16, borderBottom: "1px solid #E2E8F0" }}>
                            <Radial score={selData.parameters[activeParam] as number} label="" color={COLORS[sel] || KPMG_MID} size={80} />
                            <div>
                              <div style={{ fontSize: 15, fontWeight: 800, color: "#1E293B", lineHeight: 1.3, marginBottom: 6 }}>{activeParam}</div>
                              <div style={{ display: "inline-flex", alignItems: "center", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, color: bandColor(selData.parameters[activeParam] as number), background: bandBg(selData.parameters[activeParam] as number), textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                {band(selData.parameters[activeParam] as number)} posture
                              </div>
                            </div>
                          </div>

                          <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: KPMG_MID, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>What this measures</div>
                            <div style={{ fontSize: 13, lineHeight: 1.7, color: "#475569" }}>{activeInsight.detail}</div>
                          </div>

                          {SUB_PARAM_META[activeParam] && (
                            <div style={{ marginBottom: 14 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: KPMG_MID, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Why it matters</div>
                              <div style={{ fontSize: 12, lineHeight: 1.7, color: "#475569" }}>{SUB_PARAM_META[activeParam].why}</div>
                            </div>
                          )}

                          <div style={{ padding: "14px 16px", borderRadius: 12, background: "white", border: `1px solid ${(COLORS[sel] || KPMG_MID)}20` }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: KPMG_MID, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Calculation</div>
                            <div style={{ fontSize: 12, lineHeight: 1.7, color: "#64748B", fontFamily: "monospace", background: "#F8FAFC", padding: "8px 10px", borderRadius: 8 }}>
                              {SUB_PARAM_META[activeParam]?.formula || activeInsight.calculation}
                            </div>
                            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ fontSize: 11, color: "#94A3B8" }}>Computed result:</div>
                              <div style={{ fontSize: 18, fontWeight: 900, color: bandColor(selData.parameters[activeParam] as number) }}>{selData.parameters[activeParam]}</div>
                              <div style={{ fontSize: 11, color: "#94A3B8" }}>/ 100</div>
                            </div>
                          </div>

                          {(selData.parameters[activeParam] as number) < 60 && (
                            <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 10, background: "#FEE2E2", border: "1px solid #FECACA" }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>⚠ Governance Gap</div>
                              <div style={{ fontSize: 11, lineHeight: 1.65, color: "#7F1D1D" }}>
                                {(selData.parameters[activeParam] as number) < 30
                                  ? `${activeParam} is critically low. Add the relevant data column to your logs to enable this signal.`
                                  : `${activeParam} is below threshold. Enriching your dataset logs will improve this score.`}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 240, gap: 12, opacity: 0.5 }}>
                          <div style={{ fontSize: 32 }}>👆</div>
                          <div style={{ fontSize: 13, color: "#94A3B8", textAlign: "center", lineHeight: 1.6 }}>Hover a sub-parameter to see what it measures, why it matters, and how it was calculated</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button style={{ marginTop: 20, width: "100%", padding: "12px", background: "#E6F2FB", border: `1px solid ${KPMG_LIGHT}40`, color: KPMG_MID, borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all 0.2s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#D0E8F8"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#E6F2FB"; }}
                    onClick={() => setSel(null)}>← All Principles</button>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* BAR CHART */}
        {hasPrn && (
          <div className="card" style={{ padding: "32px", marginBottom: 24, ...fade(0.25) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#E6F2FB", display: "grid", placeItems: "center", fontSize: 18 }}>📊</div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B" }}>Principle Score Distribution</h2>
                <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>Hover bars for detailed score</p>
              </div>
            </div>
            <ImprovedBarChart principles={prn} />
          </div>
        )}

        {/* MODEL METRICS */}
        {r.model_metrics && Object.values(r.model_metrics).some(m => m.value !== null) && (
          <div className="card" style={{ padding: "32px", marginBottom: 24, ...fade(0.3) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#E6F2FB", display: "grid", placeItems: "center", fontSize: 18 }}>🧪</div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B" }}>Model-Specific Metrics</h2>
                <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>Measured for <strong style={{ color: "#1E293B" }}>{r.model_label || r.model_type}</strong> — evaluated against model-appropriate thresholds</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              {Object.entries(r.model_metrics).filter(([, m]) => m.value !== null).map(([key, m]) => {
                const mc = m.risk_level === "Low" ? "#059669" : m.risk_level === "Moderate" ? KPMG_MID : "#DC2626";
                const mcBg = m.risk_level === "Low" ? "#DCFCE7" : m.risk_level === "Moderate" ? "#E6F2FB" : "#FEE2E2";
                const displayVal = m.unit === "ms" ? `${Math.round(m.value!)}ms` : m.value!.toFixed(3);
                return (
                  <div key={key} className="hover-lift" style={{ padding: "18px 16px", borderRadius: 16, background: mcBg, border: `1px solid ${mc}25`, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{key.replace(/_/g, " ")}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: mc }}>{displayVal}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: mc, background: "white", border: `1px solid ${mc}40`, padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>{m.risk_level}</span>
                      {m.threshold_low !== undefined && <span style={{ fontSize: 10, color: "#94A3B8" }}>threshold: {m.threshold_low}{m.unit ? ` ${m.unit}` : ""}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>{m.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* COMPUTATION NOTES */}
        {r.computation_notes && Object.keys(r.computation_notes).filter(k => k !== "_error").length > 0 && (() => {
          const notes = Object.entries(r.computation_notes!).filter(([k]) => k !== "_error");
          const computed = notes.filter(([, n]) => n.status === "computed");
          const unavailable = notes.filter(([, n]) => n.status !== "computed");
          return (
            <div className="card" style={{ padding: "32px", marginBottom: 24, ...fade(0.33) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#DCFCE7", display: "grid", placeItems: "center", fontSize: 18 }}>🔬</div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B" }}>Metric Computation Transparency</h2>
                  <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>Every metric computed directly from your input/output data using real NLP/ML libraries</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
                {[
                  { label: "Computed", count: computed.length, color: "#059669", bg: "#DCFCE7" },
                  { label: "Unavailable", count: unavailable.length, color: KPMG_MID, bg: "#E6F2FB" },
                  { label: "Total Metrics", count: notes.length, color: KPMG_BLUE, bg: "#E6F2FB" },
                ].map(({ label, count, color, bg }) => (
                  <div key={label} style={{ padding: "14px 22px", borderRadius: 14, background: bg, border: `1px solid ${color}20`, textAlign: "center", minWidth: 120 }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color }}>{count}</div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>
              {unavailable.length > 0 && (
                <div style={{ padding: "12px 16px", borderRadius: 12, marginBottom: 20, background: "#E6F2FB", border: `1px solid ${KPMG_LIGHT}40`, fontSize: 13, color: KPMG_BLUE, lineHeight: 1.6 }}>
                  ℹ <strong>{unavailable.length}</strong> metric(s) couldn't be computed — add{" "}
                  {["reference", "context", "label", "confidence"].map((c, i) => (
                    <span key={c}><code style={{ background: `${KPMG_LIGHT}20`, borderRadius: 4, padding: "1px 5px", fontSize: 11 }}>{c}</code>{i < 3 ? ", " : ""}</span>
                  ))} columns to enable them.
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                {notes.map(([key, note]) => {
                  const ok = note.status === "computed";
                  const nc = ok ? "#059669" : KPMG_MID;
                  const ncBg = ok ? "#DCFCE7" : "#E6F2FB";
                  return (
                    <div key={key} className="hover-lift" style={{ padding: "16px", borderRadius: 14, background: ncBg, border: `1px solid ${nc}20`, display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1E293B", textTransform: "capitalize" }}>{key.replace(/_/g, " ")}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, color: nc, background: "white", border: `1px solid ${nc}30` }}>{ok ? "✓ computed" : "✗ unavailable"}</span>
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: nc }}>{note.value !== null ? note.value.toFixed(4) : "—"}</div>
                      <div style={{ fontSize: 10, color: "#94A3B8", lineHeight: 1.5 }}>{note.library}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* AUDIT FINDINGS — detailed */}
        <div className="card" style={{ padding: "32px", marginBottom: 24, ...fade(0.4) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FEE2E2", display: "grid", placeItems: "center", fontSize: 18 }}>⚠️</div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B" }}>
                Audit Findings
                {(r.findings?.length || 0) > 0 && (
                  <span style={{ marginLeft: 10, fontSize: 16, fontWeight: 700, color: "#DC2626", background: "#FEE2E2", padding: "2px 10px", borderRadius: 20 }}>{r.findings.length}</span>
                )}
              </h2>
              <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>Detailed governance issues identified during the audit</p>
            </div>
          </div>

          {/* Severity summary */}
          {(r.findings?.length || 0) > 0 && (
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              {[
                { label: "High", color: "#DC2626", bg: "#FEE2E2", count: r.findings.filter(f => f.severity === "High").length },
                { label: "Medium", color: KPMG_MID, bg: "#E6F2FB", count: r.findings.filter(f => f.severity === "Medium").length },
                { label: "Low", color: "#059669", bg: "#DCFCE7", count: r.findings.filter(f => f.severity === "Low").length },
              ].map(s => (
                <div key={s.label} style={{ padding: "10px 18px", borderRadius: 10, background: s.bg, border: `1px solid ${s.color}20`, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label} Severity</div>
                </div>
              ))}
            </div>
          )}

          {!r.findings?.length ? (
            <div style={{ padding: "20px 24px", background: "#DCFCE7", border: "1px solid #86EFAC", borderRadius: 14, color: "#166534", fontWeight: 600, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <span>No critical findings. Dataset aligns well with Trusted AI standards.</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {r.findings.map((f, i) => {
                const sc = f.severity === "High" ? "#DC2626" : f.severity === "Medium" ? KPMG_MID : "#059669";
                const scBg = f.severity === "High" ? "#FEE2E2" : f.severity === "Medium" ? "#E6F2FB" : "#DCFCE7";
                const catColor = COLORS[f.category] || KPMG_MID;
                return (
                  <div key={i} style={{ borderRadius: 16, background: "white", border: `1.5px solid ${sc}25`, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    {/* Finding header */}
                    <div style={{ padding: "14px 20px", background: scBg, borderBottom: `1px solid ${sc}20`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{ICONS[f.category] || "•"}</span>
                        <span style={{ color: catColor, fontWeight: 700, fontSize: 14 }}>{f.category}</span>
                        {f.type && <span style={{ fontSize: 11, color: "#94A3B8", background: "white", padding: "2px 8px", borderRadius: 10, border: "1px solid #E2E8F0" }}>{f.type}</span>}
                      </div>
                      <span style={{ color: sc, fontWeight: 700, background: "white", padding: "4px 14px", borderRadius: 20, fontSize: 12, border: `1px solid ${sc}30` }}>{f.severity}</span>
                    </div>
                    {/* Finding body */}
                    <div style={{ padding: "18px 20px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Issue Identified</div>
                      <p style={{ margin: "0 0 14px", color: "#1E293B", lineHeight: 1.7, fontSize: 14, fontWeight: 500 }}>{f.issue}</p>
                      <div style={{ padding: "12px 16px", borderRadius: 10, background: "#E6F2FB", border: `1px solid ${KPMG_LIGHT}30` }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: KPMG_MID, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Recommended Action</div>
                        <p style={{ margin: 0, color: KPMG_BLUE, lineHeight: 1.65, fontSize: 13 }}>{f.recommendation}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* OVERALL RECOMMENDATION — tool-based */}
        <div className="card" style={{ padding: "32px", marginBottom: 24, ...fade(0.43) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#E6F2FB", display: "grid", placeItems: "center", fontSize: 18 }}>📌</div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B" }}>Overall Recommendation</h2>
              <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>Based on audit results for {r.model_label || r.model_type}</p>
            </div>
          </div>
          <div style={{ padding: "20px 24px", background: `linear-gradient(135deg, ${KPMG_BLUE}08, ${KPMG_MID}05)`, border: `1.5px solid ${KPMG_MID}25`, borderRadius: 14 }}>
            <p style={{ margin: 0, color: "#1E293B", lineHeight: 1.8, fontSize: 14 }}>{toolRecommendation}</p>
          </div>
          {/* Action items */}
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { icon: "📋", label: "Next Step", val: r.overall_score >= 75 ? "Schedule quarterly re-audit" : r.overall_score >= 50 ? "Address medium findings within 60 days" : "Immediate remediation required", color: KPMG_MID },
              { icon: "🎯", label: "Target Score", val: `${Math.min(r.overall_score + 15, 100)}/100`, color: "#059669" },
              { icon: "⚖️", label: "Compliance Status", val: r.overall_score >= 75 ? "Compliant" : r.overall_score >= 50 ? "Conditional" : "Non-Compliant", color: r.overall_score >= 75 ? "#059669" : r.overall_score >= 50 ? KPMG_MID : "#DC2626" },
            ].map(item => (
              <div key={item.label} style={{ padding: "14px 16px", borderRadius: 12, background: "white", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 18, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* DOWNLOAD CTA */}
        <div className="card" style={{ padding: "40px", textAlign: "center", marginBottom: 24, background: `linear-gradient(135deg, #E6F2FB, #EFF6FF)`, border: `1px solid ${KPMG_LIGHT}40`, ...fade(0.47) }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>📄</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1E293B", marginBottom: 8 }}>Need a Comprehensive Report?</h2>
          <p style={{ color: "#64748B", marginBottom: 28, fontSize: 14 }}>Download the full PDF with evidence, scoring breakdown, and improvement roadmap.</p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button style={{ padding: "13px 36px", background: `linear-gradient(135deg, ${KPMG_BLUE}, ${KPMG_MID})`, border: "none", borderRadius: 14, color: "white", fontWeight: 700, cursor: pdfLoading ? "not-allowed" : "pointer", fontSize: 14, minWidth: 220, boxShadow: `0 8px 24px ${KPMG_BLUE}40`, opacity: pdfLoading ? 0.7 : 1, transition: "all 0.2s" }}
              onClick={handleDownloadPDF} disabled={pdfLoading}>
              {pdfLoading ? "⏳ Preparing PDF…" : "⬇ Download Full PDF Report"}
            </button>
            <button style={{ padding: "13px 36px", background: "white", border: "1.5px solid #E2E8F0", borderRadius: 14, color: "#374151", cursor: "pointer", fontSize: 14, fontWeight: 600, transition: "all 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = KPMG_MID; (e.currentTarget as HTMLButtonElement).style.color = KPMG_MID; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#E2E8F0"; (e.currentTarget as HTMLButtonElement).style.color = "#374151"; }}
              onClick={() => navigate("/dashboard")}>← Back to Dashboard</button>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ textAlign: "center", padding: "24px 20px 20px", color: "#94A3B8", fontSize: 12, letterSpacing: "0.03em", ...fade(0.5) }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, alignItems: "center" }}>
            <span style={{ fontWeight: 700, color: KPMG_MID }}>Auditable AI™</span>
            <span>·</span>
            <span>KPMG Trusted AI Framework</span>
            <span>·</span>
            <span>Report ID: {r.report_id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
