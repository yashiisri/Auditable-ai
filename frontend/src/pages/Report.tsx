

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
}

const ICONS: Record<string, string> = {
  Transparency: "🔍", Explainability: "💡", Fairness: "⚖️", Accountability: "📋",
  "Data Integrity": "🗄️", Reliability: "⚙️", Security: "🔒", Privacy: "🛡️",
  Sustainability: "🌱", "Safety": "🛡️"
};

const COLORS: Record<string, string> = {
  Transparency: "#0284C7", Explainability: "#059669", Fairness: "#DB2777",
  Accountability: "#D97706", "Data Integrity": "#7C3AED", Reliability: "#0D9488",
  Security: "#DC2626", Privacy: "#2563EB", Sustainability: "#16A34A",
  "Safety": "#B45309"
};

const FW: Record<string, { label: string; icon: string; desc: string }> = {
  EU_AI_Act: { label: "EU AI Act", icon: "🇪🇺", desc: "European Union AI Regulation" },
  ISO_42001: { label: "ISO 42001", icon: "🏅", desc: "AI Management System Standard" },
  NIST_AI_RMF: { label: "NIST AI RMF", icon: "🏛️", desc: "AI Risk Management Framework" },
  KPMG_TAF: { label: "KPMG Trusted AI", icon: "🔷", desc: "Trusted AI Framework" },
};

const CC: Record<string, string> = {
  Compliant: "#059669", "Certified Ready": "#059669", Aligned: "#059669",
  Conditional: "#D97706", Assessed: "#2563EB", Partial: "#DC2626"
};

function pct(value: number) { return `${Math.round(value * 100)}%`; }
function band(score: number) {
  if (score >= 75) return "Strong";
  if (score >= 50) return "Watch";
  return "Critical";
}
function bandColor(score: number) {
  if (score >= 75) return "#059669";
  if (score >= 50) return "#D97706";
  return "#DC2626";
}
function bandBg(score: number) {
  if (score >= 75) return "#DCFCE7";
  if (score >= 50) return "#FEF3C7";
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

function getParameterInsight(param: string, report: ReportData, selData?: Principle | null): ParameterInsight {
  const s = deriveSignals(report);
  const map: Record<string, ParameterInsight> = {
    "Schema Confidence": {
      detail: "Reflects how confidently the dataset structure was detected and normalized.",
      calculation: `Calculated as schema_confidence (${pct(s.diagnostics.schema_confidence || 0)}) x 100 = ${s.schemaScore}.`,
    },
    "Field Documentation": {
      detail: "Rewards datasets that expose clear input/output fields on top of a stable schema.",
      calculation: `Calculated as clamp(io_bonus ${s.ioBonus} x 4 + schema_score ${s.schemaScore} x 0.2) = ${Math.max(0, Math.min(100, Math.round(s.ioBonus * 4 + s.schemaScore * 0.2)))}.`,
    },
    "Model Version Tracking": {
      detail: "Checks whether model version identifiers are present for traceability.",
      calculation: `Set to ${s.hasVersion ? "100 because a version/model_id column was detected" : "30 because no version-tracking column was detected"}.`,
    },
    "Input/Output Coverage": {
      detail: "Measures whether both request and response fields exist in the logs.",
      calculation: `Calculated as clamp(io_bonus ${s.ioBonus} x 4.5) = ${Math.max(0, Math.min(100, Math.round(s.ioBonus * 4.5)))}.`,
    },
    "Column Completeness": {
      detail: "Blends field breadth with schema quality to estimate documentation coverage.",
      calculation: `Calculated as clamp(column_diversity ${s.columnDiversity} x 0.8 + schema_score ${s.schemaScore} x 0.2) = ${Math.max(0, Math.min(100, Math.round(s.columnDiversity * 0.8 + s.schemaScore * 0.2)))}.`,
    },
    "Model Interpretability": {
      detail: "Uses the model family as a structural proxy for interpretability.",
      calculation: `Set to ${s.modelBonus}: classification models score 80, other detected model types score 60.`,
    },
    "Prediction Confidence": {
      detail: "Checks whether the logs include explicit confidence or probability outputs.",
      calculation: `Set to ${s.hasScore ? "100 because a score/confidence column was detected" : "40 because no confidence field was detected"}.`,
    },
    "Reasoning Documentation": {
      detail: "Looks for reasoning, hallucination, or text-evaluation fields that support explainability.",
      calculation: `Set to ${s.hasHalluc ? "100 because hallucination/faithfulness fields exist" : s.hasRouge ? "60 because ROUGE/BLEU-style metrics exist" : "35 because no reasoning-quality fields were detected"}.`,
    },
    "Feedback Integration": {
      detail: "Measures whether human feedback signals are captured in the dataset.",
      calculation: `Set to ${s.hasFeedback ? "100 because feedback/rating columns were detected" : "30 because no feedback signals were detected"}.`,
    },
    "Output Traceability": {
      detail: "Rewards datasets where outputs can be tied back to inputs and scored outputs.",
      calculation: `Calculated as clamp(io_bonus ${s.ioBonus} x 4 + ${s.hasScore ? 20 : 0}) = ${Math.max(0, Math.min(100, Math.round(s.ioBonus * 4 + (s.hasScore ? 20 : 0))))}.`,
    },
    "Data Completeness": {
      detail: "Represents how much of the dataset is present rather than missing.",
      calculation: `Calculated as (1 - missing_ratio ${pct(s.diagnostics.missing_ratio || 0)}) x 100 = ${s.completeness}.`,
    },
    "Label Balance": {
      detail: "Uses label availability as a proxy for whether group and class balance can be assessed.",
      calculation: `Set to ${s.hasLabel ? 80 : 50} based on whether label/target fields were detected.`,
    },
    "Demographic Coverage": {
      detail: "Estimates representational breadth using the share of text-like columns in the dataset.",
      calculation: `Calculated as clamp(60 + (text_columns ${s.textCols} / total_columns ${s.totalCols}) x 40) = ${Math.max(0, Math.min(100, Math.round(60 + (s.textCols / Math.max(s.totalCols, 1)) * 40)))}.`,
    },
    "Bias Indicator Fields": {
      detail: "Checks whether fairness-related labels or feedback signals exist for bias monitoring.",
      calculation: `Set to ${s.hasFeedback ? 100 : s.hasLabel ? 60 : 30} based on detected feedback and label fields.`,
    },
    "Missing Data Equity": {
      detail: "Penalizes fairness risk when missing data becomes materially high.",
      calculation: `Calculated as clamp((1 - missing_ratio ${pct(s.diagnostics.missing_ratio || 0)} x 2) x 100) = ${Math.max(0, Math.min(100, Math.round((1 - (s.diagnostics.missing_ratio || 0) * 2) * 100)))}.`,
    },
    "Audit Log Volume": {
      detail: "Uses audit record volume as a proxy for accountability coverage.",
      calculation: `Calculated as min(logs_evaluated ${s.logsCount} / 100 x 100, 100) = ${s.volumeScore}.`,
    },
    "Timestamp Coverage": {
      detail: "Checks whether logs can be ordered and reviewed chronologically.",
      calculation: `Set to ${s.hasTimestamp ? "100 because timestamp/date fields were detected" : "20 because no timestamp field was detected"}.`,
    },
    "User Attribution": {
      detail: "Checks whether events can be traced to a user or session.",
      calculation: `Set to ${s.hasUserId ? "100 because user/session identifiers were detected" : "25 or 30 fallback depending on the principle-specific formula"}.`,
    },
    "Model Version Control": {
      detail: "Measures whether each prediction can be tied to a specific model version.",
      calculation: `Set to ${s.hasVersion ? "100 because version-tracking fields were detected" : "30 because version-tracking fields were absent"}.`,
    },
    "Error/Exception Logging": {
      detail: "Checks whether operational failures are explicitly captured in logs.",
      calculation: `Set to ${s.hasError ? "100 because error/exception fields were detected" : "35 because no explicit error logging field was detected"}.`,
    },
    "Completeness Score": {
      detail: "Measures the usable portion of the dataset after missing values are considered.",
      calculation: `Calculated as (1 - missing_ratio ${pct(s.diagnostics.missing_ratio || 0)}) x 100 = ${s.completeness}.`,
    },
    "Duplicate-Free Rate": {
      detail: "Penalizes repeated records that reduce dataset trustworthiness.",
      calculation: `Calculated as clamp(100 - (duplicates ${s.diagnostics.duplicates || 0} / logs ${Math.max(s.logsCount, 1)}) x 500) = ${s.duplicatePenalty}.`,
    },
    "Schema Consistency": {
      detail: "Uses schema confidence as the direct structural integrity score.",
      calculation: `Calculated as schema_confidence (${pct(s.diagnostics.schema_confidence || 0)}) x 100 = ${s.schemaScore}.`,
    },
    "Data Type Diversity": {
      detail: "Balances numeric and text field coverage to avoid one-dimensional logging.",
      calculation: `Calculated as clamp((numeric_columns ${s.numericCols} / total_columns ${s.totalCols}) x 50 + (text_columns ${s.textCols} / total_columns ${s.totalCols}) x 50) = ${Math.max(0, Math.min(100, Math.round((s.numericCols / Math.max(s.totalCols, 1)) * 50 + (s.textCols / Math.max(s.totalCols, 1)) * 50)))}.`,
    },
    "Ground Truth Availability": {
      detail: "Checks whether labels or evaluation metrics exist to compare outputs against expected results.",
      calculation: `Set to ${s.hasLabel || s.hasRouge ? "100 because labels or text-eval metrics were detected" : "40 because no ground-truth proxy was detected"}.`,
    },
    "Consistency Score": {
      detail: "A reliability proxy based on how complete the logs are.",
      calculation: `Calculated as (1 - missing_ratio ${pct(s.diagnostics.missing_ratio || 0)}) x 90 = ${Math.max(0, Math.min(100, Math.round((1 - (s.diagnostics.missing_ratio || 0)) * 90)))}.`,
    },
    "Performance Metrics": {
      detail: "Checks for metrics that can track model quality over time.",
      calculation: `Set to ${s.hasRouge || s.hasScore ? "100 because metric/confidence fields were detected" : "40 because no performance metrics were detected"}.`,
    },
    "Latency Monitoring": {
      detail: "Checks whether operational responsiveness is measured in the logs.",
      calculation: `Set to ${s.hasLatency ? "100 because latency/duration fields were detected" : "30 because no latency field was detected"}.`,
    },
    "Error Rate Tracking": {
      detail: "Checks whether failures can be quantified and monitored.",
      calculation: `Set to ${s.hasError ? "100 because error/exception fields were detected" : "35 because no error-rate proxy was detected"}.`,
    },
    "Volume Sufficiency": {
      detail: "Uses log volume to estimate the statistical stability of the reliability assessment.",
      calculation: `Calculated as min(logs_evaluated ${s.logsCount} / 100 x 100, 100) = ${s.volumeScore}.`,
    },
    "Safety Flagging": {
      detail: "Checks whether unsafe content or policy flags are recorded.",
      calculation: `Set to ${s.hasSafety ? "100 because safety/moderation fields were detected" : "25 because no safety flagging fields were detected"}.`,
    },
    "Input Validation": {
      detail: "Uses schema quality and input-field presence as a structural security proxy.",
      calculation: `Calculated as clamp(schema_score ${s.schemaScore} x ${s.hasInput ? "0.8 + 20" : "0.6"}) = ${Math.max(0, Math.min(100, Math.round(s.hasInput ? s.schemaScore * 0.8 + 20 : s.schemaScore * 0.6)))}.`,
    },
    "Adversarial Robustness": {
      detail: "Applies a model-type baseline because adversarial testing evidence is not available structurally.",
      calculation: `Set to ${report.model_type === "general_llm" ? 40 : 55}: general LLMs receive 40, other model types receive 55.`,
    },
    "Content Moderation": {
      detail: "Checks whether moderated outcomes are explicitly logged.",
      calculation: `Set to ${s.hasSafety ? "100 because moderation fields were detected" : "30 because no moderation fields were detected"}.`,
    },
    "PII Detection": {
      detail: "Checks whether personal-data indicators are present in the dataset.",
      calculation: `Set to ${s.hasPii ? "100 because PII-related fields were detected" : "20 because no PII indicator field was detected"}.`,
    },
    "PII Field Tracking": {
      detail: "Measures whether the logs explicitly mark records containing personal data.",
      calculation: `Set to ${s.hasPii ? "100 because PII-related fields were detected" : "20 because no PII tracking field was detected"}.`,
    },
    "Data Minimisation": {
      detail: "Penalizes broad schemas that may collect more columns than necessary.",
      calculation: `Calculated as clamp(100 - (total_columns ${s.totalCols} / 20) x 40) = ${Math.max(0, Math.min(100, Math.round(100 - (s.totalCols / 20) * 40)))}.`,
    },
    "User Anonymisation": {
      detail: "Rewards schemas without direct user identifiers, since anonymisation appears stronger structurally.",
      calculation: `Set to ${s.hasUserId ? "50 because user/session identifiers were detected" : "70 because no direct user identifier was detected"}.`,
    },
    "Consent Management": {
      detail: "Static placeholder score because consent evidence is not inferred from dataset structure alone.",
      calculation: "Set to 40 as a structural estimate until explicit runtime consent signals are captured.",
    },
    "Data Retention Signals": {
      detail: "Checks whether timestamp data exists to support retention and deletion rules.",
      calculation: `Set to ${s.hasTimestamp ? "100 because timestamp fields were detected" : "30 because retention-related time fields were absent"}.`,
    },
    "Dataset Efficiency": {
      detail: "Rewards leaner datasets by reducing the sustainability score as log volume grows.",
      calculation: `Calculated as clamp(100 - (logs_evaluated ${s.logsCount} / 10000) x 30) = ${Math.max(0, Math.min(100, Math.round(100 - (s.logsCount / 10000) * 30)))}.`,
    },
    "Feature Engineering": {
      detail: "Uses dataset breadth as a proxy for thoughtful feature coverage.",
      calculation: `Calculated as clamp(column_diversity ${s.columnDiversity} x 0.7 + 30) = ${Math.max(0, Math.min(100, Math.round(s.columnDiversity * 0.7 + 30)))}.`,
    },
    "Compute Proxy Score": {
      detail: "Applies a lighter-compute bonus to structurally simpler model families.",
      calculation: `Set to ${report.model_type === "classification" ? 80 : 55}: classification models receive 80, others receive 55.`,
    },
    "Redundancy Elimination": {
      detail: "Measures how effectively duplicated records are avoided.",
      calculation: `Calculated as clamp(100 - (duplicates ${s.diagnostics.duplicates || 0} / logs ${Math.max(s.logsCount, 1)}) x 500) = ${s.duplicatePenalty}.`,
    },
    "Resource Optimisation": {
      detail: "Uses schema quality as a loose proxy for operational efficiency and maintainability.",
      calculation: `Calculated as clamp(schema_score ${s.schemaScore} x 0.6 + 40) = ${Math.max(0, Math.min(100, Math.round(s.schemaScore * 0.6 + 40)))}.`,
    },
    "Harm Prevention Logging": {
      detail: "Checks whether outputs that could harm people, businesses, or property are explicitly flagged and logged.",
      calculation: `Set to ${s.hasSafety ? "100 because safety/moderation fields were detected" : "20 because no harm-prevention logging field was detected"}.`,
    },
    "Safety Test Coverage": {
      detail: "Checks whether structured safety evaluations have been run and their results are stored in the audit log.",
      calculation: `Set to ${s.hasFeedback ? "100 because feedback/evaluation fields were detected" : "30 because no safety test result fields were detected"}.`,
    },
    "Human Override Capability": {
      detail: "Checks whether a human override mechanism exists and is logged — critical for preventing AI-caused harm.",
      calculation: `Set to ${s.hasOverride ? "100 because override/escalation fields were detected" : s.hasFeedback ? "60 based on feedback-adjacent signals" : "20 because no override capability signals were detected"}.`,
    },
    "Incident Response Signals": {
      detail: "Checks whether safety incidents, near-misses, and escalations are captured in logs for post-incident review.",
      calculation: `Set to ${s.hasError ? "100 because error/exception fields were detected" : "30 because no incident response fields were detected"}.`,
    },
    "Safeguard Effectiveness": {
      detail: "Measures the proportion of flagged outputs that were successfully identified and mitigated by safety controls.",
      calculation: `Set to ${s.hasSafety ? "100 because safety/moderation fields were detected" : "25 because no safeguard effectiveness data was found"}.`,
    },
  };
  if (map[param]) return map[param];
  const pLow = param.toLowerCase();
  const structGroups: [string[], string][] = [
    [["timestamp","audit log","version","session","user attribution"], "Structural metadata signal — based on presence of governance fields (timestamps, user IDs, model versions)."],
    [["pii","anonymi","data minim","retention"], "Privacy control signal — based on PII-related columns or data minimisation indicators."],
    [["safety","harm","override","escalat","incident"], "Safety signal — based on safety flagging, human override or incident-response columns."],
    [["injection","adversari","moderat","anomaly","input valid"], "Security signal — based on input validation, content moderation or adversarial robustness indicators."],
    [["faithfulness","hallucin","rouge","bleu","bert","coherence","abstractiv","coverage","density"], "NLP quality signal — computed from text content using semantic similarity or n-gram overlap metrics."],
    [["class balance","f1","precision","recall","roc","auc"], "Classification accuracy — computed using sklearn metrics against ground-truth labels."],
    [["latency","carbon","efficiency","token economy","compute"], "Performance & sustainability — based on inference latency or token economy measurements."],
    [["completeness","duplicate","schema","volume"], "Data integrity signal — derived from missing-value rate, duplicate count and schema confidence."],
  ];
  for (const [kws, detail] of structGroups) {
    if (kws.some(kw => pLow.includes(kw))) {
      const sv = selData?.parameters?.[param];
      return {
        detail,
        calculation: sv !== undefined
          ? `Score: ${sv}/100. ${sv >= 75 ? "Strong signal detected in the dataset." : sv >= 50 ? "Moderate signal — consider enriching logs." : "Weak/absent signal — governance gap detected."}`
          : "Derived from dataset structural analysis.",
      };
    }
  }
  const pv = selData?.parameters?.[param];
  return {
    detail: `${param} measures a governance dimension specific to this model type.`,
    calculation: pv !== undefined
      ? `Score: ${pv}/100. ${pv >= 75 ? "Strong posture." : pv >= 50 ? "Moderate — improvement recommended." : "Low score — governance gap detected."}`
      : "Calculated from dataset structure and model-specific audit heuristics.",
  };
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
        <polygon
          key={lvl}
          points={keys.map((_, i) => { const p = pt(i, lvl); return `${p.x},${p.y}`; }).join(" ")}
          fill={lvl % 40 === 0 ? "rgba(37,99,235,0.04)" : "none"}
          stroke={lvl === 100 ? "rgba(37,99,235,0.25)" : "rgba(37,99,235,0.12)"}
          strokeWidth={lvl === 100 ? 1.5 : 1}
        />
      ))}
      {keys.map((_, i) => {
        const e = pt(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="rgba(37,99,235,0.12)" strokeWidth="1" />;
      })}
      {[20, 40, 60, 80].map(lvl => {
        const p = pt(0, lvl);
        return (
          <text key={lvl} x={p.x + 6} y={p.y} fill="rgba(100,116,139,0.7)" fontSize="9.5" textAnchor="start" dominantBaseline="middle">
            {lvl}
          </text>
        );
      })}
      <polygon points={polyStr} fill="rgba(37,99,235,0.08)" stroke="none" />
      <polygon
        points={polyStr} fill="none"
        stroke="rgba(37,99,235,0.7)" strokeWidth="2.5" strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 0 6px rgba(37,99,235,0.3))" }}
      />
      {poly.map((p, i) => {
        const k = keys[i];
        const c = COLORS[k] || "#2563EB";
        const sel = selected === k;
        return (
          <circle
            key={i} cx={p.x} cy={p.y} r={sel ? 12 : 6}
            fill={sel ? c : "rgba(37,99,235,0.85)"} stroke={sel ? "#fff" : c}
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
        const c = COLORS[k] || "#2563EB";
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
                style={{ transition: "fill 0.2s, font-size 0.2s" }}>
                {word}
              </text>
            ))}
            <text x={x} y={startY + parts.length * lineH + 3} textAnchor={anchor}
              fill={sel ? c : "#6B7280"} fontSize="11" fontWeight="800"
              fontFamily="'Plus Jakarta Sans',sans-serif" style={{ transition: "fill 0.2s" }}>
              {sc}
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={48} fill="white" stroke="rgba(37,99,235,0.2)" strokeWidth="1.5"
        style={{ filter: "drop-shadow(0 4px 12px rgba(37,99,235,0.12))" }} />
      <text x={cx} y={cy - 7} textAnchor="middle" fill="#1E3A5F" fontSize="30" fontWeight="900" fontFamily="'Plus Jakarta Sans',sans-serif">
        {avgScore}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="'Plus Jakarta Sans',sans-serif" letterSpacing="1.5">
        OVERALL
      </text>
    </svg>
  );
}

function ImprovedBarChart({ principles }: { principles: Record<string, Principle> }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const entries = Object.entries(principles).map(([name, data]) => ({
    name, score: data.score, color: COLORS[name] || "#2563EB",
  }));
  return (
    <div style={{ padding: "20px 0", overflowX: "auto" }}>
      <ResponsiveContainer width="100%" height={Math.max(entries.length * 70 + 60, 260)}>
        <BarChart data={entries} layout="vertical" margin={{ top: 20, right: 50, left: 160, bottom: 20 }}>
          <CartesianGrid strokeDasharray="5 5" stroke="rgba(0,0,0,0.06)" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: "#94A3B8", fontSize: 12 }} />
          <YAxis type="category" dataKey="name"
            tick={{ fill: "#374151", fontSize: 13, fontWeight: 500 }}
            width={150} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(37,99,235,0.05)" }}
            contentStyle={{
              background: "white", border: "1px solid rgba(37,99,235,0.2)",
              borderRadius: 12, padding: "14px 18px", color: "#1E293B",
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            }}
          />
          <Bar dataKey="score" radius={[0, 10, 10, 0]} barSize={28} animationDuration={1600} animationEasing="ease-out">
            {entries.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={`url(#lgrad-${index})`}
                style={{
                  transition: "all 0.35s ease",
                  filter: hovered === entry.name ? "brightness(1.1) drop-shadow(0 2px 8px rgba(0,0,0,0.2))" : "none",
                }}
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
        <text x={size / 2} y={size / 2 + 6} textAnchor="middle" fill="#1E293B" fontSize={size * 0.24} fontWeight="900" fontFamily="'Plus Jakarta Sans',sans-serif">
          {score}
        </text>
      </svg>
      <div style={{ fontSize: 12, color: "#64748B", marginTop: 8, fontWeight: 500 }}>{label}</div>
    </div>
  );
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
      findings, recommendation: findings.length === 0
        ? "All governance probes passed. AI system aligns with Trusted AI principles."
        : `${findings.length} governance violation(s) detected. Review findings and recommendations.`,
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
        <button style={{ padding: "14px 32px", background: "white", border: "1px solid #E2E8F0", color: "#374151", borderRadius: 12, cursor: "pointer", fontSize: 15, fontWeight: 600, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }} onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const prn = r.trusted_ai_principles || {};
  const pkeys = Object.keys(prn);
  const hasPrn = pkeys.length > 0;
  const rc = r.risk_level === "Low" ? "#059669" : r.risk_level === "Moderate" ? "#D97706" : "#DC2626";
  const rcBg = r.risk_level === "Low" ? "#DCFCE7" : r.risk_level === "Moderate" ? "#FEF3C7" : "#FEE2E2";
  const fmt = (d: string) => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const selData = sel ? prn[sel] : null;
  const selectedEntries = selData ? Object.entries(selData.parameters || {}) : [];
  const activeParam = hoveredParam && selData?.parameters?.[hoveredParam] !== undefined
    ? hoveredParam : (selData ? Object.keys(selData.parameters || {})[0] || null : null);
  const activeInsight = activeParam ? getParameterInsight(activeParam, r, selData) : null;
  const strongestParam = selectedEntries.length ? selectedEntries.reduce((best, entry) => ((entry[1] as number) > (best[1] as number) ? entry : best)) : null;
  const weakestParam = selectedEntries.length ? selectedEntries.reduce((worst, entry) => ((entry[1] as number) < (worst[1] as number) ? entry : worst)) : null;

  const fade = (delay: number): React.CSSProperties => ({
    opacity: anim ? 1 : 0,
    transform: anim ? "translateY(0)" : "translateY(20px)",
    transition: `all 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
  });

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) { alert("You need to be logged in to download reports. Redirecting to login..."); navigate("/login"); return; }
      if (!r.report_id) { alert("No report ID found. Please complete an evaluation first."); return; }
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
      console.error("PDF download error:", err);
      alert(err.message || "Failed to download PDF. Check if you're logged in and report exists.");
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
      `}</style>

      {/* ── TOP NAVIGATION BAR ── */}
      <div style={{
        background: "white", borderBottom: "1px solid #E2E8F0",
        padding: "0 40px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 64,
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)", position: "sticky", top: 0, zIndex: 100,
        ...fade(0),
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{
            fontSize: 18, fontWeight: 900, letterSpacing: "-0.03em",
            background: "linear-gradient(135deg, #1E3A8A, #2563EB)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Auditable AI™</span>
          <div style={{ width: 1, height: 20, background: "#E2E8F0" }} />
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "4px 10px",
            background: "#EFF6FF", color: "#2563EB", borderRadius: 20,
            border: "1px solid #BFDBFE", letterSpacing: "0.03em",
          }}>⬡ KPMG Trusted AI Framework</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            style={{
              padding: "8px 20px", background: "white", border: "1px solid #E2E8F0",
              color: "#64748B", borderRadius: 10, cursor: "pointer", fontSize: 13,
              fontWeight: 600, transition: "all 0.2s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#2563EB"; (e.currentTarget as HTMLButtonElement).style.color = "#2563EB"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#E2E8F0"; (e.currentTarget as HTMLButtonElement).style.color = "#64748B"; }}
            onClick={() => navigate("/dashboard")}
          >← Dashboard</button>
         
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>

        {/* ── REPORT HEADER CARD ── */}
        <div className="card" style={{
          padding: "32px 36px", marginBottom: 24,
          background: "linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 50%, #2563EB 100%)",
          border: "none", color: "white",
          ...fade(0.05),
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 24 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>
                Governance Audit Report
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em", color: "white", marginBottom: 14 }}>
                {r.ai_name}
              </h1>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
                {[
                  { icon: "🧠", val: r.model_label || r.model_type },
                  { icon: "📅", val: fmt(r.evaluated_at) },
                  { icon: "🔑", val: `ID: ${r.report_id?.slice(0, 12)}…` },
                  ...(r.detection_confidence !== undefined ? [{ icon: "🎯", val: `${Math.round(r.detection_confidence * 100)}% confidence` }] : []),
                ].map((m, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span>{m.icon}</span><span>{m.val}</span>
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, color: "white", letterSpacing: "-0.04em" }}>
                  {r.overall_score}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>/ 100 Overall</div>
                <div style={{
                  marginTop: 10, display: "inline-block",
                  padding: "5px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                  background: `${rcBg}`, color: rc, border: `1px solid ${rc}40`,
                }}>
                  {r.risk_level} Risk
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 24, ...fade(0.1) }}>
          {[
            { icon: "📂", label: "Logs Evaluated", val: r.logs_evaluated, color: "#2563EB" },
            { icon: "📊", label: "Data Quality", val: `${r.data_quality_score}%`, color: "#059669" },
            { icon: "🏗️", label: "Structural Risk", val: r.structural_risk, color: r.structural_risk === "Low" ? "#059669" : r.structural_risk === "Moderate" ? "#D97706" : "#DC2626" },
            { icon: "✅", label: "Principles Tested", val: pkeys.length, color: "#7C3AED" },
            { icon: "⚠️", label: "Findings", val: r.findings?.length || 0, color: (r.findings?.length || 0) > 0 ? "#DC2626" : "#059669" },
          ].map((s, i) => (
            <div key={i} className="card hover-lift" style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 6, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── COLUMN WARNINGS ── */}
        {r.column_warnings && r.column_warnings.length > 0 && (
          <div style={{
            marginBottom: 24, padding: "14px 20px", borderRadius: 14,
            background: "#FFFBEB", border: "1px solid #FCD34D",
            display: "flex", flexDirection: "column", gap: 6,
            ...fade(0.12),
          }}>
            {r.column_warnings.map((w, i) => (
              <div key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "#92400E", lineHeight: 1.5 }}>
                <span>⚠</span><span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── FRAMEWORK COMPLIANCE ── */}
        <div className="card" style={{ padding: "32px", marginBottom: 24, ...fade(0.15) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EFF6FF", display: "grid", placeItems: "center", fontSize: 18 }}>🏛️</div>
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
                const scBg = sc === "#059669" ? "#DCFCE7" : sc === "#D97706" ? "#FEF3C7" : sc === "#2563EB" ? "#EFF6FF" : "#FEE2E2";
                return (
                  <div key={key} className="hover-lift" style={{
                    padding: "20px 24px", borderRadius: 16, minWidth: 180, flex: "1 1 180px", maxWidth: 240,
                    background: scBg, border: `1px solid ${sc}30`, textAlign: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{fw.icon}</div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#1E293B", marginBottom: 4 }}>{fw.label}</div>
                    <div style={{ fontSize: 11, color: "#64748B", marginBottom: 10 }}>{fw.desc}</div>
                    <div style={{
                      display: "inline-block", padding: "4px 14px", borderRadius: 20,
                      fontSize: 12, fontWeight: 700, color: sc, background: "white",
                      border: `1px solid ${sc}40`,
                    }}>{status}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 20, padding: "12px 16px", borderRadius: 12, background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 12, color: "#94A3B8" }}>
              ℹ️ EU AI Act • ISO/IEC 42001:2023 • NIST AI RMF • KPMG Trusted AI Framework
            </div>
          </div>
        </div>

        {/* ── TRUSTED AI PRINCIPLES ── */}
        {hasPrn && (
          <div className="card" style={{ padding: "32px", marginBottom: 24, ...fade(0.2) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EFF6FF", display: "grid", placeItems: "center", fontSize: 18 }}>🕸️</div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B" }}>Trusted AI Principles Assessment</h2>
                <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>Hover or click any principle to inspect sub-parameters and formulas</p>
              </div>
            </div>

            {/* Summary stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 22, marginBottom: 28 }}>
              {[
                { label: "Avg. Principle Score", value: `${Math.round(Object.values(prn).reduce((s, v) => s + v.score, 0) / Math.max(pkeys.length, 1))}`, color: "#2563EB", bg: "#EFF6FF" },
                { label: "Strong Principles", value: `${Object.values(prn).filter(v => v.score >= 75).length}/${pkeys.length}`, color: "#059669", bg: "#DCFCE7" },
                { label: "Needs Attention", value: `${Object.values(prn).filter(v => v.score < 60).length}`, color: "#D97706", bg: "#FEF3C7" },
              ].map(item => (
                <div key={item.label} style={{ padding: "16px 18px", borderRadius: 14, background: item.bg, border: `1px solid ${item.color}20` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: item.color, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Spider chart */}
            <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 28, marginBottom: 28 }}>
              <div style={{ width: "100%", maxWidth: 680, margin: "0 auto" }}>
                <Spider principles={prn} onSelect={setSel} selected={sel} />
              </div>
            </div>

            {/* Drill panel */}
            <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 24 }}>
              {!sel ? (
                <div>
                  <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "#F8FAFC", border: "1px solid #E2E8F0", textAlign: "center" }}>
                    Click any principle above to inspect sub-parameters and calculation formulas
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                    {pkeys.map(k => {
                      const c = COLORS[k] || "#2563EB";
                      const sc = prn[k].score;
                      const scoreColor = bandColor(sc);
                      const scoreBg = bandBg(sc);
                      return (
                        <div key={k} className="hover-lift"
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, background: "white", border: "1px solid #E2E8F0", cursor: "pointer" }}
                          onClick={() => setSel(k)}
                        >
                          <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: `${c}15`, border: `1px solid ${c}30`, display: "grid", placeItems: "center", fontSize: 18 }}>
                            {ICONS[k]}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{k}</div>
                            <div style={{ height: 5, background: "#F1F5F9", borderRadius: 99, marginTop: 7 }}>
                              <div style={{ width: `${sc}%`, height: "100%", background: scoreColor, borderRadius: 99, transition: "width 0.8s ease", opacity: 0.8 }} />
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: 20, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{sc}</div>
                            <div style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 6, background: scoreBg, color: scoreColor, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              {band(sc)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : selData ? (
                <div>
                  {/* Principle header */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 14, marginBottom: 20,
                    padding: "16px 18px", borderRadius: 16,
                    background: `${(COLORS[sel] || "#2563EB")}08`,
                    border: `1px solid ${(COLORS[sel] || "#2563EB")}25`,
                  }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 24, background: `${COLORS[sel] || "#2563EB"}15`, border: `1px solid ${(COLORS[sel] || "#2563EB")}30` }}>
                      {ICONS[sel]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 17, fontWeight: 800, color: "#1E293B" }}>{sel}</div>
                      {selData.description && <div style={{ fontSize: 12, color: "#64748B", marginTop: 3, lineHeight: 1.5 }}>{selData.description}</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 34, fontWeight: 900, color: COLORS[sel] || "#2563EB", lineHeight: 1 }}>{selData.score}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8, background: bandBg(selData.score), color: bandColor(selData.score), marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {band(selData.score)}
                      </div>
                    </div>
                  </div>

                  {/* Summary stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
                    {[
                      { label: "Parameters", val: Object.keys(selData.parameters).length, color: "#2563EB", bg: "#EFF6FF" },
                      { label: "Strongest", val: strongestParam?.[0]?.split(" ")[0] || "—", sub: strongestParam?.[1] ?? "", color: "#059669", bg: "#DCFCE7" },
                      { label: "Weakest", val: weakestParam?.[0]?.split(" ")[0] || "—", sub: weakestParam?.[1] ?? "", color: "#D97706", bg: "#FEF3C7" },
                    ].map(s => (
                      <div key={s.label} style={{ padding: "12px 14px", borderRadius: 12, background: s.bg, textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: s.color, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, marginBottom: 6 }}>{s.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.val}</div>
                        {s.sub !== undefined && s.sub !== "" && <div style={{ fontSize: 11, color: s.color, marginTop: 2, fontWeight: 700 }}>{s.sub}</div>}
                      </div>
                    ))}
                  </div>

                  {/* Side-by-side params + insight */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
                    {/* Left: params */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                        Sub-parameters — hover to inspect
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {Object.entries(selData.parameters).map(([param, val]) => {
                          const v = val as number;
                          const c = COLORS[sel] || "#2563EB";
                          const sc2 = bandColor(v);
                          const sc2bg = bandBg(v);
                          const isActive = activeParam === param;
                          return (
                            <div key={param}
                              style={{
                                padding: "11px 13px", borderRadius: 12,
                                background: isActive ? `${c}08` : "#F8FAFC",
                                border: isActive ? `1.5px solid ${c}40` : "1px solid #E2E8F0",
                                cursor: "pointer", transition: "all 0.18s ease",
                              }}
                              onMouseEnter={() => setHoveredParam(param)}
                              onMouseLeave={() => setHoveredParam(null)}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                                <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? "#1E293B" : "#374151", lineHeight: 1.3 }}>{param}</span>
                                <span style={{ fontSize: 12, fontWeight: 800, color: sc2, flexShrink: 0, marginLeft: 8 }}>{v}</span>
                              </div>
                              <div style={{ height: 4, background: "#E2E8F0", borderRadius: 99 }}>
                                <div style={{ width: `${v}%`, height: "100%", borderRadius: 99, background: sc2, opacity: 0.75, transition: "width 0.5s ease" }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: insight */}
                    <div style={{
                      position: "sticky", top: 80, padding: "20px", borderRadius: 16,
                      background: "#F8FAFC", border: `1.5px solid ${(COLORS[sel] || "#2563EB")}25`,
                      minHeight: 240,
                    }}>
                      {activeParam && activeInsight ? (
                        <>
                          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #E2E8F0" }}>
                            <Radial score={selData.parameters[activeParam] as number} label="" color={COLORS[sel] || "#2563EB"} size={72} />
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", lineHeight: 1.3, marginBottom: 6 }}>{activeParam}</div>
                              <div style={{
                                display: "inline-flex", alignItems: "center", fontSize: 10, fontWeight: 700,
                                padding: "3px 9px", borderRadius: 20,
                                color: bandColor(selData.parameters[activeParam] as number),
                                background: bandBg(selData.parameters[activeParam] as number),
                                textTransform: "uppercase", letterSpacing: "0.06em",
                              }}>
                                {band(selData.parameters[activeParam] as number)} posture
                              </div>
                            </div>
                          </div>
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>What this measures</div>
                            <div style={{ fontSize: 12, lineHeight: 1.7, color: "#475569" }}>{activeInsight.detail}</div>
                          </div>
                          <div style={{ padding: "11px 13px", borderRadius: 10, background: "white", border: "1px solid #E2E8F0" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>How it was calculated</div>
                            <div style={{ fontSize: 12, lineHeight: 1.7, color: "#64748B", fontFamily: "monospace" }}>{activeInsight.calculation}</div>
                          </div>
                          {(selData.parameters[activeParam] as number) < 60 && (
                            <div style={{ marginTop: 10, padding: "10px 13px", borderRadius: 10, background: "#FFFBEB", border: "1px solid #FCD34D" }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#D97706", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>💡 How to improve</div>
                              <div style={{ fontSize: 11, lineHeight: 1.65, color: "#92400E" }}>
                                {(selData.parameters[activeParam] as number) < 30
                                  ? `${activeParam} is critically low. Add the relevant data column to your logs to enable this signal.`
                                  : `${activeParam} is below threshold. Enriching your dataset logs will improve this score.`}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 200, gap: 10, opacity: 0.5 }}>
                          <div style={{ fontSize: 28 }}>👆</div>
                          <div style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", lineHeight: 1.6 }}>Hover a parameter on the left to see what it measures and how it was calculated</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    style={{ marginTop: 18, width: "100%", padding: "11px", background: "#F1F5F9", border: "1px solid #E2E8F0", color: "#64748B", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.2s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#E2E8F0"; (e.currentTarget as HTMLButtonElement).style.color = "#1E293B"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#F1F5F9"; (e.currentTarget as HTMLButtonElement).style.color = "#64748B"; }}
                    onClick={() => setSel(null)}
                  >← All Principles</button>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ── BAR CHART ── */}
        {hasPrn && (
          <div className="card" style={{ padding: "32px", marginBottom: 24, ...fade(0.25) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EFF6FF", display: "grid", placeItems: "center", fontSize: 18 }}>📊</div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B" }}>Principle Score Distribution</h2>
                <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>Hover bars for detailed score</p>
              </div>
            </div>
            <ImprovedBarChart principles={prn} />
          </div>
        )}

        {/* ── MODEL-SPECIFIC METRICS ── */}
        {r.model_metrics && Object.values(r.model_metrics).some(m => m.value !== null) && (
          <div className="card" style={{ padding: "32px", marginBottom: 24, ...fade(0.3) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F3E8FF", display: "grid", placeItems: "center", fontSize: 18 }}>🧪</div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B" }}>Model-Specific Metrics</h2>
                <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>
                  Measured for <strong style={{ color: "#1E293B" }}>{r.model_label || r.model_type}</strong> — evaluated against model-appropriate thresholds
                </p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              {Object.entries(r.model_metrics)
                .filter(([, m]) => m.value !== null)
                .map(([key, m]) => {
                  const mc = m.risk_level === "Low" ? "#059669" : m.risk_level === "Moderate" ? "#D97706" : "#DC2626";
                  const mcBg = m.risk_level === "Low" ? "#DCFCE7" : m.risk_level === "Moderate" ? "#FEF3C7" : "#FEE2E2";
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

        {/* ── COMPUTATION NOTES ── */}
        {r.computation_notes && Object.keys(r.computation_notes).filter(k => k !== "_error").length > 0 && (() => {
          const notes = Object.entries(r.computation_notes!).filter(([k]) => k !== "_error");
          const computed = notes.filter(([, n]) => n.status === "computed");
          const unavailable = notes.filter(([, n]) => n.status !== "computed");
          return (
            <div className="card" style={{ padding: "32px", marginBottom: 24, ...fade(0.33) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#ECFDF5", display: "grid", placeItems: "center", fontSize: 18 }}>🔬</div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B" }}>Metric Computation Transparency</h2>
                  <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>Every metric was computed directly from your input/output data using real NLP/ML libraries</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
                {[
                  { label: "Computed", count: computed.length, color: "#059669", bg: "#DCFCE7" },
                  { label: "Unavailable", count: unavailable.length, color: "#D97706", bg: "#FEF3C7" },
                  { label: "Total Metrics", count: notes.length, color: "#2563EB", bg: "#EFF6FF" },
                ].map(({ label, count, color, bg }) => (
                  <div key={label} style={{ padding: "14px 22px", borderRadius: 14, background: bg, border: `1px solid ${color}20`, textAlign: "center", minWidth: 120 }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color }}>{count}</div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>
              {unavailable.length > 0 && (
                <div style={{ padding: "12px 16px", borderRadius: 12, marginBottom: 20, background: "#FFFBEB", border: "1px solid #FCD34D", fontSize: 13, color: "#92400E", lineHeight: 1.6 }}>
                  💡 <strong>{unavailable.length}</strong> metric(s) couldn't be computed — add{" "}
                  {["reference", "context", "label", "confidence"].map((c, i) => (
                    <span key={c}><code style={{ background: "rgba(217,119,6,0.1)", borderRadius: 4, padding: "1px 5px", fontSize: 11 }}>{c}</code>{i < 3 ? ", " : ""}</span>
                  ))} columns to enable them.
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                {notes.map(([key, note]) => {
                  const ok = note.status === "computed";
                  const nc = ok ? "#059669" : "#D97706";
                  const ncBg = ok ? "#DCFCE7" : "#FEF3C7";
                  return (
                    <div key={key} className="hover-lift" style={{ padding: "16px", borderRadius: 14, background: ncBg, border: `1px solid ${nc}20`, display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1E293B", textTransform: "capitalize" }}>{key.replace(/_/g, " ")}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, color: nc, background: "white", border: `1px solid ${nc}30` }}>
                          {ok ? "✓ computed" : "✗ unavailable"}
                        </span>
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: nc }}>{note.value !== null ? note.value.toFixed(4) : "—"}</div>
                      <div style={{ fontSize: 10, color: "#94A3B8", lineHeight: 1.5 }}>{note.library}</div>
                    </div>
                  );
                })}
              </div>
              {r.computation_notes!._error && (
                <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "#FEE2E2", border: "1px solid #FECACA", fontSize: 12, color: "#DC2626" }}>
                  ⚠ Computation error: {(r.computation_notes!._error as any)}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── DIAGNOSTICS ── */}
        <div className="card" style={{ padding: "32px", marginBottom: 24, ...fade(0.35) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EFF6FF", display: "grid", placeItems: "center", fontSize: 18 }}>🔬</div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B" }}>Dataset Diagnostics</h2>
              <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>Structural quality signals from your uploaded dataset</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
            {[
              { icon: "❌", label: "Missing Ratio", val: `${(r.diagnostics.missing_ratio * 100).toFixed(1)}%`, c: r.diagnostics.missing_ratio < 0.1 ? "#059669" : "#DC2626", bg: r.diagnostics.missing_ratio < 0.1 ? "#DCFCE7" : "#FEE2E2" },
              { icon: "🔁", label: "Duplicates", val: r.diagnostics.duplicates, c: r.diagnostics.duplicates === 0 ? "#059669" : "#D97706", bg: r.diagnostics.duplicates === 0 ? "#DCFCE7" : "#FEF3C7" },
              { icon: "🧩", label: "Schema Confidence", val: `${Math.round(r.diagnostics.schema_confidence * 100)}%`, c: "#2563EB", bg: "#EFF6FF" },
              { icon: "📐", label: "Total Columns", val: r.diagnostics.total_columns, c: "#7C3AED", bg: "#F3E8FF" },
              { icon: "📝", label: "Text Columns", val: r.diagnostics.text_columns, c: "#059669", bg: "#DCFCE7" },
              { icon: "🔢", label: "Numeric Columns", val: r.diagnostics.numeric_columns, c: "#D97706", bg: "#FEF3C7" },
            ].map((d, i) => (
              <div key={i} className="hover-lift" style={{ padding: "18px", borderRadius: 14, background: d.bg, border: `1px solid ${d.c}20`, textAlign: "center" }}>
                <span style={{ fontSize: 26 }}>{d.icon}</span>
                <div style={{ fontSize: 22, fontWeight: 800, color: d.c, marginTop: 8 }}>{d.val}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 4, fontWeight: 500 }}>{d.label}</div>
              </div>
            ))}
          </div>
          {r.diagnostics.column_names?.length > 0 && (
            <div style={{ marginTop: 20, padding: "16px 18px", background: "#F8FAFC", borderRadius: 14, border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Detected columns</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {r.diagnostics.column_names.map((col, i) => (
                  <span key={i} style={{ padding: "5px 12px", background: "white", borderRadius: 20, fontSize: 12, border: "1px solid #E2E8F0", color: "#374151", fontWeight: 500 }}>
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── FINDINGS ── */}
        <div className="card" style={{ padding: "32px", marginBottom: 24, ...fade(0.4) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FEF2F2", display: "grid", placeItems: "center", fontSize: 18 }}>⚠️</div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B" }}>
                Audit Findings{(r.findings?.length || 0) > 0 && (
                  <span style={{ marginLeft: 10, fontSize: 16, fontWeight: 700, color: "#DC2626", background: "#FEE2E2", padding: "2px 10px", borderRadius: 20 }}>
                    {r.findings.length}
                  </span>
                )}
              </h2>
              <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>Issues found during the governance audit</p>
            </div>
          </div>
          {!r.findings?.length ? (
            <div style={{ padding: "20px 24px", background: "#DCFCE7", border: "1px solid #86EFAC", borderRadius: 14, color: "#166534", fontWeight: 600, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <span>No critical findings. Dataset aligns well with Trusted AI standards.</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {r.findings.map((f, i) => {
                const sc = f.severity === "High" ? "#DC2626" : f.severity === "Medium" ? "#D97706" : "#059669";
                const scBg = f.severity === "High" ? "#FEE2E2" : f.severity === "Medium" ? "#FEF3C7" : "#DCFCE7";
                return (
                  <div key={i} style={{ padding: "20px", borderRadius: 16, background: "white", border: `1px solid ${sc}25`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ color: COLORS[f.category] || "#1E293B", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>{ICONS[f.category] || "•"}</span><span>{f.category}</span>
                      </span>
                      <span style={{ color: sc, fontWeight: 700, background: scBg, padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>{f.severity}</span>
                    </div>
                    <p style={{ margin: "0 0 10px", color: "#374151", lineHeight: 1.6, fontSize: 14 }}>{f.issue}</p>
                    <p style={{ margin: 0, color: "#64748B", fontStyle: "italic", lineHeight: 1.6, fontSize: 13 }}>💡 {f.recommendation}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── RECOMMENDATION ── */}
        {r.recommendation && (
          <div className="card" style={{ padding: "32px", marginBottom: 24, ...fade(0.43) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FFFBEB", display: "grid", placeItems: "center", fontSize: 18 }}>📌</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B" }}>Overall Recommendation</h2>
            </div>
            <div style={{ padding: "18px 22px", background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 14 }}>
              <p style={{ margin: 0, color: "#78350F", lineHeight: 1.7, fontSize: 14 }}>{r.recommendation}</p>
            </div>
          </div>
        )}

        {/* ── DOWNLOAD CTA ── */}
        <div className="card" style={{
          padding: "40px", textAlign: "center", marginBottom: 24,
          background: "linear-gradient(135deg, #EFF6FF, #F0FDF4)",
          border: "1px solid #BFDBFE",
          ...fade(0.47),
        }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>📄</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1E293B", marginBottom: 8 }}>Need a Comprehensive Report?</h2>
          <p style={{ color: "#64748B", marginBottom: 28, fontSize: 14 }}>Download the full PDF with evidence, scoring breakdown, and improvement roadmap.</p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              style={{
                padding: "13px 36px", background: "linear-gradient(135deg, #1E3A8A, #2563EB)", border: "none",
                borderRadius: 14, color: "white", fontWeight: 700, cursor: pdfLoading ? "not-allowed" : "pointer",
                fontSize: 14, minWidth: 220, boxShadow: "0 8px 24px rgba(37,99,235,0.3)",
                opacity: pdfLoading ? 0.7 : 1, transition: "all 0.2s",
              }}
              onClick={handleDownloadPDF} disabled={pdfLoading}
            >
              {pdfLoading ? "⏳ Preparing PDF…" : "⬇ Download Full PDF Report"}
            </button>
            <button
              style={{
                padding: "13px 36px", background: "white", border: "1.5px solid #E2E8F0",
                borderRadius: 14, color: "#374151", cursor: "pointer", fontSize: 14, fontWeight: 600, transition: "all 0.2s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#2563EB"; (e.currentTarget as HTMLButtonElement).style.color = "#2563EB"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#E2E8F0"; (e.currentTarget as HTMLButtonElement).style.color = "#374151"; }}
              onClick={() => navigate("/dashboard")}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ textAlign: "center", padding: "24px 20px 20px", color: "#94A3B8", fontSize: 12, letterSpacing: "0.03em", ...fade(0.5) }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, alignItems: "center" }}>
            <span style={{ fontWeight: 700, color: "#2563EB" }}>Auditable AI™</span>
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
