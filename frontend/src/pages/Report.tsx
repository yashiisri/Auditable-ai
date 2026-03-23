// import { useLocation, useNavigate } from "react-router-dom";
// import { useState, useEffect } from "react";
// import {
//   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
//   ResponsiveContainer, Cell,
// } from "recharts";

// interface Principle {
//   score: number;
//   parameters: Record<string, number>;
//   description?: string;
// }
// interface ComputationNote {
//   library: string;
//   status: string;
//   value: number | null;
// }

// interface ReportData {
//   report_id: string;
//   ai_name: string;
//   model_type: string;
//   model_label?: string;
//   detection_confidence?: number;
//   evaluated_at: string;
//   overall_score: number;
//   risk_level: string;
//   structural_risk: string;
//   logs_evaluated: number;
//   data_quality_score: number;
//   trusted_ai_principles: Record<string, Principle>;
//   diagnostics: {
//     missing_ratio: number;
//     duplicates: number;
//     schema_confidence: number;
//     total_columns: number;
//     text_columns: number;
//     numeric_columns: number;
//     column_names: string[];
//   };
//   model_metrics?: Record<string, {
//     value: number | null;
//     risk_level: string;
//     description: string;
//     unit: string;
//     threshold_low?: number;
//     threshold_moderate?: number;
//     higher_is_better?: boolean;
//   }>;
//   /** Populated by the new metrics_calculator pipeline — shows which library
//    *  computed each metric and whether it succeeded. */
//   computation_notes?: Record<string, ComputationNote>;
//   /** Column validation warnings emitted at ingest time. */
//   column_warnings?: string[];
//   findings: { category: string; severity: string; issue: string; recommendation: string; type?: string }[];
//   recommendation: string;
//   framework_compliance: Record<string, string>;
// }

// interface ParameterInsight {
//   detail: string;
//   calculation: string;
// }

// const ICONS: Record<string, string> = {
//   Transparency: "🔍", Explainability: "💡", Fairness: "⚖️", Accountability: "📋",
//   "Data Integrity": "🗄️", Reliability: "⚙️", Security: "🔒", Privacy: "🛡️",
//   Sustainability: "🌱", "Safety": "🛡️"
// };

// const COLORS: Record<string, string> = {
//   Transparency: "#00C8FF", Explainability: "#00E5A0", Fairness: "#FF6B9D",
//   Accountability: "#FFB020", "Data Integrity": "#A78BFA", Reliability: "#34D399",
//   Security: "#F87171", Privacy: "#60A5FA", Sustainability: "#4ADE80",
//   "Safety": "#FBBF24"
// };

// const FW: Record<string, { label: string; icon: string; desc: string }> = {
//   EU_AI_Act: { label: "EU AI Act", icon: "🇪🇺", desc: "European Union AI Regulation" },
//   ISO_42001: { label: "ISO 42001", icon: "🏅", desc: "AI Management System Standard" },
//   NIST_AI_RMF: { label: "NIST AI RMF", icon: "🏛️", desc: "AI Risk Management Framework" },
//   KPMG_TAF: { label: "KPMG Trusted AI", icon: "🔷", desc: "Trusted AI Framework" },
// };

// const CC: Record<string, string> = {
//   Compliant: "#00C896", "Certified Ready": "#00C896", Aligned: "#00C896",
//   Conditional: "#ffb020", Assessed: "#60A5FA", Partial: "#ff4d4d"
// };

// function pct(value: number) {
//   return `${Math.round(value * 100)}%`;
// }

// function band(score: number) {
//   if (score >= 75) return "Strong";
//   if (score >= 50) return "Watch";
//   return "Critical";
// }

// function deriveSignals(report: ReportData) {
//   const diagnostics = report.diagnostics || {
//     missing_ratio: 0,
//     duplicates: 0,
//     schema_confidence: 0,
//     total_columns: 0,
//     text_columns: 0,
//     numeric_columns: 0,
//     column_names: [],
//   };
//   const logsCount = report.logs_evaluated || 0;
//   const totalCols = diagnostics.total_columns || 1;
//   const textCols = diagnostics.text_columns || 0;
//   const numericCols = diagnostics.numeric_columns || 0;
//   const schemaScore = Math.max(0, Math.min(100, Math.round((diagnostics.schema_confidence || 0) * 100)));
//   const completeness = Math.max(0, Math.min(100, Math.round((1 - (diagnostics.missing_ratio || 0)) * 100)));
//   const duplicatePenalty = Math.max(0, Math.min(100, Math.round(Math.max(0, 100 - ((diagnostics.duplicates || 0) / Math.max(logsCount, 1)) * 500))));
//   const volumeScore = Math.max(0, Math.min(100, Math.round(Math.min(logsCount / 100 * 100, 100))));
//   const columnDiversity = Math.max(0, Math.min(100, Math.round(Math.min(totalCols / 10 * 100, 100))));
//   const cols = (diagnostics.column_names || []).map(c => String(c).toLowerCase());
//   const hasAny = (keys: string[]) => keys.some(k => cols.includes(k));

//   const hasInput = hasAny(["input", "prompt", "query", "text", "question"]);
//   const hasOutput = hasAny(["output", "response", "answer", "prediction", "result"]);
//   const hasLabel = hasAny(["label", "class", "target", "ground_truth"]);
//   const hasTimestamp = hasAny(["timestamp", "date", "time", "created_at"]);
//   const hasUserId = hasAny(["user_id", "user", "session_id", "session"]);
//   const hasScore = hasAny(["score", "confidence", "probability", "prob"]);
//   const hasFeedback = hasAny(["feedback", "rating", "review", "human_eval"]);
//   const hasSafety = hasAny(["is_safe", "safety", "flagged", "moderated"]);
//   const hasPii = hasAny(["contains_pii", "pii", "personal"]);
//   const hasVersion = hasAny(["model_version", "version", "model_id"]);
//   const hasLatency = hasAny(["latency", "response_time", "duration"]);
//   const hasError = hasAny(["error", "exception", "failed"]);
//   const hasHalluc  = hasAny(["hallucination", "faithfulness", "groundedness"]);
//   const hasRouge   = hasAny(["rouge", "bleu", "meteor", "bertscore"]);
//   const hasOverride = hasAny(["human_override", "escalated", "manual_intervention", "human_review"]);
//   const ioBonus    = hasInput && hasOutput ? 20 : (hasInput || hasOutput ? 10 : 0);
//   const modelBonus = report.model_type === "classification" ? 80 : 60;

//   return {
//     diagnostics,
//     logsCount,
//     totalCols,
//     textCols,
//     numericCols,
//     schemaScore,
//     completeness,
//     duplicatePenalty,
//     volumeScore,
//     columnDiversity,
//     hasInput,
//     hasOutput,
//     hasLabel,
//     hasTimestamp,
//     hasUserId,
//     hasScore,
//     hasFeedback,
//     hasSafety,
//     hasPii,
//     hasVersion,
//     hasLatency,
//     hasError,
//     hasHalluc,
//     hasRouge,
//     hasOverride,
//     ioBonus,
//     modelBonus,
//   };
// }

// function getParameterInsight(param: string, report: ReportData, selData?: Principle | null): ParameterInsight {
//   const s = deriveSignals(report);
//   const map: Record<string, ParameterInsight> = {
//     "Schema Confidence": {
//       detail: "Reflects how confidently the dataset structure was detected and normalized.",
//       calculation: `Calculated as schema_confidence (${pct(s.diagnostics.schema_confidence || 0)}) x 100 = ${s.schemaScore}.`,
//     },
//     "Field Documentation": {
//       detail: "Rewards datasets that expose clear input/output fields on top of a stable schema.",
//       calculation: `Calculated as clamp(io_bonus ${s.ioBonus} x 4 + schema_score ${s.schemaScore} x 0.2) = ${Math.max(0, Math.min(100, Math.round(s.ioBonus * 4 + s.schemaScore * 0.2)))}.`,
//     },
//     "Model Version Tracking": {
//       detail: "Checks whether model version identifiers are present for traceability.",
//       calculation: `Set to ${s.hasVersion ? "100 because a version/model_id column was detected" : "30 because no version-tracking column was detected"}.`,
//     },
//     "Input/Output Coverage": {
//       detail: "Measures whether both request and response fields exist in the logs.",
//       calculation: `Calculated as clamp(io_bonus ${s.ioBonus} x 4.5) = ${Math.max(0, Math.min(100, Math.round(s.ioBonus * 4.5)))}.`,
//     },
//     "Column Completeness": {
//       detail: "Blends field breadth with schema quality to estimate documentation coverage.",
//       calculation: `Calculated as clamp(column_diversity ${s.columnDiversity} x 0.8 + schema_score ${s.schemaScore} x 0.2) = ${Math.max(0, Math.min(100, Math.round(s.columnDiversity * 0.8 + s.schemaScore * 0.2)))}.`,
//     },
//     "Model Interpretability": {
//       detail: "Uses the model family as a structural proxy for interpretability.",
//       calculation: `Set to ${s.modelBonus}: classification models score 80, other detected model types score 60.`,
//     },
//     "Prediction Confidence": {
//       detail: "Checks whether the logs include explicit confidence or probability outputs.",
//       calculation: `Set to ${s.hasScore ? "100 because a score/confidence column was detected" : "40 because no confidence field was detected"}.`,
//     },
//     "Reasoning Documentation": {
//       detail: "Looks for reasoning, hallucination, or text-evaluation fields that support explainability.",
//       calculation: `Set to ${s.hasHalluc ? "100 because hallucination/faithfulness fields exist" : s.hasRouge ? "60 because ROUGE/BLEU-style metrics exist" : "35 because no reasoning-quality fields were detected"}.`,
//     },
//     "Feedback Integration": {
//       detail: "Measures whether human feedback signals are captured in the dataset.",
//       calculation: `Set to ${s.hasFeedback ? "100 because feedback/rating columns were detected" : "30 because no feedback signals were detected"}.`,
//     },
//     "Output Traceability": {
//       detail: "Rewards datasets where outputs can be tied back to inputs and scored outputs.",
//       calculation: `Calculated as clamp(io_bonus ${s.ioBonus} x 4 + ${s.hasScore ? 20 : 0}) = ${Math.max(0, Math.min(100, Math.round(s.ioBonus * 4 + (s.hasScore ? 20 : 0))))}.`,
//     },
//     "Data Completeness": {
//       detail: "Represents how much of the dataset is present rather than missing.",
//       calculation: `Calculated as (1 - missing_ratio ${pct(s.diagnostics.missing_ratio || 0)}) x 100 = ${s.completeness}.`,
//     },
//     "Label Balance": {
//       detail: "Uses label availability as a proxy for whether group and class balance can be assessed.",
//       calculation: `Set to ${s.hasLabel ? 80 : 50} based on whether label/target fields were detected.`,
//     },
//     "Demographic Coverage": {
//       detail: "Estimates representational breadth using the share of text-like columns in the dataset.",
//       calculation: `Calculated as clamp(60 + (text_columns ${s.textCols} / total_columns ${s.totalCols}) x 40) = ${Math.max(0, Math.min(100, Math.round(60 + (s.textCols / Math.max(s.totalCols, 1)) * 40)))}.`,
//     },
//     "Bias Indicator Fields": {
//       detail: "Checks whether fairness-related labels or feedback signals exist for bias monitoring.",
//       calculation: `Set to ${s.hasFeedback ? 100 : s.hasLabel ? 60 : 30} based on detected feedback and label fields.`,
//     },
//     "Missing Data Equity": {
//       detail: "Penalizes fairness risk when missing data becomes materially high.",
//       calculation: `Calculated as clamp((1 - missing_ratio ${pct(s.diagnostics.missing_ratio || 0)} x 2) x 100) = ${Math.max(0, Math.min(100, Math.round((1 - (s.diagnostics.missing_ratio || 0) * 2) * 100)))}.`,
//     },
//     "Audit Log Volume": {
//       detail: "Uses audit record volume as a proxy for accountability coverage.",
//       calculation: `Calculated as min(logs_evaluated ${s.logsCount} / 100 x 100, 100) = ${s.volumeScore}.`,
//     },
//     "Timestamp Coverage": {
//       detail: "Checks whether logs can be ordered and reviewed chronologically.",
//       calculation: `Set to ${s.hasTimestamp ? "100 because timestamp/date fields were detected" : "20 because no timestamp field was detected"}.`,
//     },
//     "User Attribution": {
//       detail: "Checks whether events can be traced to a user or session.",
//       calculation: `Set to ${s.hasUserId ? "100 because user/session identifiers were detected" : "25 or 30 fallback depending on the principle-specific formula"}.`,
//     },
//     "Model Version Control": {
//       detail: "Measures whether each prediction can be tied to a specific model version.",
//       calculation: `Set to ${s.hasVersion ? "100 because version-tracking fields were detected" : "30 because version-tracking fields were absent"}.`,
//     },
//     "Error/Exception Logging": {
//       detail: "Checks whether operational failures are explicitly captured in logs.",
//       calculation: `Set to ${s.hasError ? "100 because error/exception fields were detected" : "35 because no explicit error logging field was detected"}.`,
//     },
//     "Completeness Score": {
//       detail: "Measures the usable portion of the dataset after missing values are considered.",
//       calculation: `Calculated as (1 - missing_ratio ${pct(s.diagnostics.missing_ratio || 0)}) x 100 = ${s.completeness}.`,
//     },
//     "Duplicate-Free Rate": {
//       detail: "Penalizes repeated records that reduce dataset trustworthiness.",
//       calculation: `Calculated as clamp(100 - (duplicates ${s.diagnostics.duplicates || 0} / logs ${Math.max(s.logsCount, 1)}) x 500) = ${s.duplicatePenalty}.`,
//     },
//     "Schema Consistency": {
//       detail: "Uses schema confidence as the direct structural integrity score.",
//       calculation: `Calculated as schema_confidence (${pct(s.diagnostics.schema_confidence || 0)}) x 100 = ${s.schemaScore}.`,
//     },
//     "Data Type Diversity": {
//       detail: "Balances numeric and text field coverage to avoid one-dimensional logging.",
//       calculation: `Calculated as clamp((numeric_columns ${s.numericCols} / total_columns ${s.totalCols}) x 50 + (text_columns ${s.textCols} / total_columns ${s.totalCols}) x 50) = ${Math.max(0, Math.min(100, Math.round((s.numericCols / Math.max(s.totalCols, 1)) * 50 + (s.textCols / Math.max(s.totalCols, 1)) * 50)))}.`,
//     },
//     "Ground Truth Availability": {
//       detail: "Checks whether labels or evaluation metrics exist to compare outputs against expected results.",
//       calculation: `Set to ${s.hasLabel || s.hasRouge ? "100 because labels or text-eval metrics were detected" : "40 because no ground-truth proxy was detected"}.`,
//     },
//     "Consistency Score": {
//       detail: "A reliability proxy based on how complete the logs are.",
//       calculation: `Calculated as (1 - missing_ratio ${pct(s.diagnostics.missing_ratio || 0)}) x 90 = ${Math.max(0, Math.min(100, Math.round((1 - (s.diagnostics.missing_ratio || 0)) * 90)))}.`,
//     },
//     "Performance Metrics": {
//       detail: "Checks for metrics that can track model quality over time.",
//       calculation: `Set to ${s.hasRouge || s.hasScore ? "100 because metric/confidence fields were detected" : "40 because no performance metrics were detected"}.`,
//     },
//     "Latency Monitoring": {
//       detail: "Checks whether operational responsiveness is measured in the logs.",
//       calculation: `Set to ${s.hasLatency ? "100 because latency/duration fields were detected" : "30 because no latency field was detected"}.`,
//     },
//     "Error Rate Tracking": {
//       detail: "Checks whether failures can be quantified and monitored.",
//       calculation: `Set to ${s.hasError ? "100 because error/exception fields were detected" : "35 because no error-rate proxy was detected"}.`,
//     },
//     "Volume Sufficiency": {
//       detail: "Uses log volume to estimate the statistical stability of the reliability assessment.",
//       calculation: `Calculated as min(logs_evaluated ${s.logsCount} / 100 x 100, 100) = ${s.volumeScore}.`,
//     },
//     "Safety Flagging": {
//       detail: "Checks whether unsafe content or policy flags are recorded.",
//       calculation: `Set to ${s.hasSafety ? "100 because safety/moderation fields were detected" : "25 because no safety flagging fields were detected"}.`,
//     },
//     "Input Validation": {
//       detail: "Uses schema quality and input-field presence as a structural security proxy.",
//       calculation: `Calculated as clamp(schema_score ${s.schemaScore} x ${s.hasInput ? "0.8 + 20" : "0.6"}) = ${Math.max(0, Math.min(100, Math.round(s.hasInput ? s.schemaScore * 0.8 + 20 : s.schemaScore * 0.6)))}.`,
//     },
//     "Adversarial Robustness": {
//       detail: "Applies a model-type baseline because adversarial testing evidence is not available structurally.",
//       calculation: `Set to ${report.model_type === "general_llm" ? 40 : 55}: general LLMs receive 40, other model types receive 55.`,
//     },
//     "Content Moderation": {
//       detail: "Checks whether moderated outcomes are explicitly logged.",
//       calculation: `Set to ${s.hasSafety ? "100 because moderation fields were detected" : "30 because no moderation fields were detected"}.`,
//     },
//     "PII Detection": {
//       detail: "Checks whether personal-data indicators are present in the dataset.",
//       calculation: `Set to ${s.hasPii ? "100 because PII-related fields were detected" : "20 because no PII indicator field was detected"}.`,
//     },
//     "PII Field Tracking": {
//       detail: "Measures whether the logs explicitly mark records containing personal data.",
//       calculation: `Set to ${s.hasPii ? "100 because PII-related fields were detected" : "20 because no PII tracking field was detected"}.`,
//     },
//     "Data Minimisation": {
//       detail: "Penalizes broad schemas that may collect more columns than necessary.",
//       calculation: `Calculated as clamp(100 - (total_columns ${s.totalCols} / 20) x 40) = ${Math.max(0, Math.min(100, Math.round(100 - (s.totalCols / 20) * 40)))}.`,
//     },
//     "User Anonymisation": {
//       detail: "Rewards schemas without direct user identifiers, since anonymisation appears stronger structurally.",
//       calculation: `Set to ${s.hasUserId ? "50 because user/session identifiers were detected" : "70 because no direct user identifier was detected"}.`,
//     },
//     "Consent Management": {
//       detail: "Static placeholder score because consent evidence is not inferred from dataset structure alone.",
//       calculation: "Set to 40 as a structural estimate until explicit runtime consent signals are captured.",
//     },
//     "Data Retention Signals": {
//       detail: "Checks whether timestamp data exists to support retention and deletion rules.",
//       calculation: `Set to ${s.hasTimestamp ? "100 because timestamp fields were detected" : "30 because retention-related time fields were absent"}.`,
//     },
//     "Dataset Efficiency": {
//       detail: "Rewards leaner datasets by reducing the sustainability score as log volume grows.",
//       calculation: `Calculated as clamp(100 - (logs_evaluated ${s.logsCount} / 10000) x 30) = ${Math.max(0, Math.min(100, Math.round(100 - (s.logsCount / 10000) * 30)))}.`,
//     },
//     "Feature Engineering": {
//       detail: "Uses dataset breadth as a proxy for thoughtful feature coverage.",
//       calculation: `Calculated as clamp(column_diversity ${s.columnDiversity} x 0.7 + 30) = ${Math.max(0, Math.min(100, Math.round(s.columnDiversity * 0.7 + 30)))}.`,
//     },
//     "Compute Proxy Score": {
//       detail: "Applies a lighter-compute bonus to structurally simpler model families.",
//       calculation: `Set to ${report.model_type === "classification" ? 80 : 55}: classification models receive 80, others receive 55.`,
//     },
//     "Redundancy Elimination": {
//       detail: "Measures how effectively duplicated records are avoided.",
//       calculation: `Calculated as clamp(100 - (duplicates ${s.diagnostics.duplicates || 0} / logs ${Math.max(s.logsCount, 1)}) x 500) = ${s.duplicatePenalty}.`,
//     },
//     "Resource Optimisation": {
//       detail: "Uses schema quality as a loose proxy for operational efficiency and maintainability.",
//       calculation: `Calculated as clamp(schema_score ${s.schemaScore} x 0.6 + 40) = ${Math.max(0, Math.min(100, Math.round(s.schemaScore * 0.6 + 40)))}.`,
//     },
//     "Harm Prevention Logging": {
//       detail: "Checks whether outputs that could harm people, businesses, or property are explicitly flagged and logged.",
//       calculation: `Set to ${s.hasSafety ? "100 because safety/moderation fields were detected" : "20 because no harm-prevention logging field was detected"}.`,
//     },
//     "Safety Test Coverage": {
//       detail: "Checks whether structured safety evaluations have been run and their results are stored in the audit log.",
//       calculation: `Set to ${s.hasFeedback ? "100 because feedback/evaluation fields were detected" : "30 because no safety test result fields were detected"}.`,
//     },
//     "Human Override Capability": {
//       detail: "Checks whether a human override mechanism exists and is logged — critical for preventing AI-caused harm.",
//       calculation: `Set to ${s.hasOverride ? "100 because override/escalation fields were detected" : s.hasFeedback ? "60 based on feedback-adjacent signals" : "20 because no override capability signals were detected"}.`,
//     },
//     "Incident Response Signals": {
//       detail: "Checks whether safety incidents, near-misses, and escalations are captured in logs for post-incident review.",
//       calculation: `Set to ${s.hasError ? "100 because error/exception fields were detected" : "30 because no incident response fields were detected"}.`,
//     },
//     "Safeguard Effectiveness": {
//       detail: "Measures the proportion of flagged outputs that were successfully identified and mitigated by safety controls.",
//       calculation: `Set to ${s.hasSafety ? "100 because safety/moderation fields were detected" : "25 because no safeguard effectiveness data was found"}.`,
//     },
//   };

//   if (map[param]) return map[param];

//   // Dynamic fallback — derive insight from parameter name semantics
//   const pLow = param.toLowerCase();
//   const structGroups: [string[], string][] = [
//     [["timestamp","audit log","version","session","user attribution"],
//       "Structural metadata signal — based on presence of governance fields (timestamps, user IDs, model versions)."],
//     [["pii","anonymi","data minim","retention"],
//       "Privacy control signal — based on PII-related columns or data minimisation indicators."],
//     [["safety","harm","override","escalat","incident"],
//       "Safety signal — based on safety flagging, human override or incident-response columns."],
//     [["injection","adversari","moderat","anomaly","input valid"],
//       "Security signal — based on input validation, content moderation or adversarial robustness indicators."],
//     [["faithfulness","hallucin","rouge","bleu","bert","coherence","abstractiv","coverage","density"],
//       "NLP quality signal — computed from text content using semantic similarity or n-gram overlap metrics."],
//     [["class balance","f1","precision","recall","roc","auc"],
//       "Classification accuracy — computed using sklearn metrics against ground-truth labels."],
//     [["latency","carbon","efficiency","token economy","compute"],
//       "Performance & sustainability — based on inference latency or token economy measurements."],
//     [["completeness","duplicate","schema","volume"],
//       "Data integrity signal — derived from missing-value rate, duplicate count and schema confidence."],
//   ];
//   for (const [kws, detail] of structGroups) {
//     if (kws.some(kw => pLow.includes(kw))) {
//       const sv = selData?.parameters?.[param];
//       return {
//         detail,
//         calculation: sv !== undefined
//           ? `Score: ${sv}/100. ${sv >= 75 ? "Strong signal detected in the dataset." : sv >= 50 ? "Moderate signal — consider enriching logs." : "Weak/absent signal — governance gap detected."}`
//           : "Derived from dataset structural analysis.",
//       };
//     }
//   }

//   // Absolute fallback with actual score value
//   const pv = selData?.parameters?.[param];
//   return {
//     detail: `${param} measures a governance dimension specific to this model type.`,
//     calculation: pv !== undefined
//       ? `Score: ${pv}/100. ${pv >= 75 ? "Strong posture." : pv >= 50 ? "Moderate — improvement recommended." : "Low score — governance gap detected."}`
//       : "Calculated from dataset structure and model-specific audit heuristics.",
//   };
// }

// function Spider({ principles, onSelect, selected }: { principles: Record<string, Principle>; onSelect: (k: string | null) => void; selected: string | null }) {
//   const keys = Object.keys(principles);
//   const N = keys.length;
//   // Larger canvas so labels have generous room on all sides
//   const cx = 340, cy = 340, R = 200;
//   const W = 680, H = 680;

//   const ang = (i: number) => (Math.PI * 2 * i) / N - Math.PI / 2;

//   const pt = (i: number, v: number) => ({
//     x: cx + (v / 100) * R * Math.cos(ang(i)),
//     y: cy + (v / 100) * R * Math.sin(ang(i)),
//   });

//   // Label position — further out with per-axis anchor adjustment
//   const labelPos = (i: number) => {
//     const LABEL_R = R + 72;
//     const a = ang(i);
//     const x = cx + LABEL_R * Math.cos(a);
//     const y = cy + LABEL_R * Math.sin(a);
//     // Horizontal anchor: left side → end, right side → start, top/bottom → middle
//     const anchor =
//       Math.cos(a) > 0.3 ? "start" :
//       Math.cos(a) < -0.3 ? "end" : "middle";
//     return { x, y, anchor };
//   };

//   const poly = keys.map((k, i) => pt(i, principles[k].score));
//   const polyStr = poly.map(p => `${p.x},${p.y}`).join(" ");
//   const avgScore = Math.round(Object.values(principles).reduce((s, v) => s + v.score, 0) / N);

//   return (
//     <svg
//       viewBox={`0 0 ${W} ${H}`}
//       style={{ width: "100%", maxWidth: W, display: "block", margin: "0 auto" }}
//     >
//       {/* Background rings */}
//       {[20, 40, 60, 80, 100].map(lvl => (
//         <polygon
//           key={lvl}
//           points={keys.map((_, i) => { const p = pt(i, lvl); return `${p.x},${p.y}`; }).join(" ")}
//           fill="none"
//           stroke={lvl === 100 ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)"}
//           strokeWidth={lvl === 100 ? 1.5 : 1}
//         />
//       ))}

//       {/* Axis spokes */}
//       {keys.map((_, i) => {
//         const e = pt(i, 100);
//         return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
//       })}

//       {/* Ring level labels — positioned along the top axis */}
//       {[20, 40, 60, 80].map(lvl => {
//         const p = pt(0, lvl);
//         return (
//           <text key={lvl} x={p.x + 6} y={p.y} fill="rgba(255,255,255,0.28)" fontSize="9.5" textAnchor="start" dominantBaseline="middle">
//             {lvl}
//           </text>
//         );
//       })}

//       {/* Score polygon — filled area */}
//       <polygon
//         points={polyStr}
//         fill="rgba(0,200,150,0.12)"
//         stroke="none"
//       />
//       {/* Score polygon — border with glow */}
//       <polygon
//         points={polyStr}
//         fill="none"
//         stroke="rgba(0,200,150,0.7)"
//         strokeWidth="2.5"
//         strokeLinejoin="round"
//         style={{ filter: "drop-shadow(0 0 6px rgba(0,200,150,0.4))" }}
//       />

//       {/* Data point dots */}
//       {poly.map((p, i) => {
//         const k = keys[i];
//         const c = COLORS[k] || "#00C896";
//         const sel = selected === k;
//         return (
//           <circle
//             key={i}
//             cx={p.x} cy={p.y}
//             r={sel ? 12 : 6}
//             fill={sel ? c : "rgba(0,200,150,0.8)"}
//             stroke={sel ? "#fff" : c}
//             strokeWidth={sel ? 3 : 1.5}
//             style={{ cursor: "pointer", transition: "all 0.25s ease",
//               filter: sel ? `drop-shadow(0 0 10px ${c})` : "none" }}
//             onClick={() => onSelect(sel ? null : k)}
//             onMouseEnter={() => onSelect(k)}
//             onMouseLeave={() => { if (!sel) onSelect(null); }}
//           />
//         );
//       })}

//       {/* Axis labels with score — dynamically anchored */}
//       {keys.map((k, i) => {
//         const { x, y, anchor } = labelPos(i);
//         const c = COLORS[k] || "#00C896";
//         const sel = selected === k;
//         const sc = principles[k].score;
//         const parts = k.split(" ");
//         const lineH = 15;
//         const totalH = parts.length * lineH + 14;
//         // Vertically center the label group
//         const startY = y - totalH / 2 + lineH * 0.5;

//         return (
//           <g
//             key={k}
//             style={{ cursor: "pointer" }}
//             onClick={() => onSelect(sel ? null : k)}
//             onMouseEnter={() => onSelect(k)}
//             onMouseLeave={() => { if (!sel) onSelect(null); }}
//           >
//             {parts.map((word, pi) => (
//               <text
//                 key={pi}
//                 x={x} y={startY + pi * lineH}
//                 textAnchor={anchor}
//                 fill={sel ? c : "rgba(255,255,255,0.82)"}
//                 fontSize={sel ? "12.5" : "11"}
//                 fontWeight={sel ? "700" : "500"}
//                 fontFamily="'DM Sans',sans-serif"
//                 style={{ transition: "fill 0.2s, font-size 0.2s" }}
//               >
//                 {word}
//               </text>
//             ))}
//             {/* Score badge below label */}
//             <text
//               x={x} y={startY + parts.length * lineH + 3}
//               textAnchor={anchor}
//               fill={sel ? c : "rgba(255,255,255,0.5)"}
//               fontSize="11"
//               fontWeight="800"
//               fontFamily="'DM Sans',sans-serif"
//               style={{ transition: "fill 0.2s" }}
//             >
//               {sc}
//             </text>
//           </g>
//         );
//       })}

//       {/* Centre badge */}
//       <circle cx={cx} cy={cy} r={48} fill="rgba(4,17,31,0.85)" stroke="rgba(0,200,150,0.25)" strokeWidth="1.5" />
//       <text x={cx} y={cy - 7} textAnchor="middle" fill="white" fontSize="30" fontWeight="900" fontFamily="'DM Sans',sans-serif">
//         {avgScore}
//       </text>
//       <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.38)" fontSize="9" fontFamily="'DM Sans',sans-serif" letterSpacing="1.5">
//         OVERALL
//       </text>
//     </svg>
//   );
// }

// function ImprovedBarChart({ principles }: { principles: Record<string, Principle> }) {
//   const [hovered, setHovered] = useState<string | null>(null);
//   const entries = Object.entries(principles).map(([name, data]) => ({
//     name,
//     score: data.score,
//     color: COLORS[name] || "#00C896",
//   }));

//   return (
//     <div style={{ padding: "20px 0", overflowX: "auto" }}>
//       <ResponsiveContainer width="100%" height={Math.max(entries.length * 70 + 60, 260)}>
//         <BarChart
//           data={entries}
//           layout="vertical"
//           margin={{ top: 20, right: 50, left: 160, bottom: 20 }}
//         >
//           <CartesianGrid strokeDasharray="5 5" stroke="rgba(255,255,255,0.08)" horizontal={false} />
//           <XAxis type="number" domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }} />
//           <YAxis
//             type="category"
//             dataKey="name"
//             tick={{ fill: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 500 }}
//             width={150}
//             axisLine={false}
//             tickLine={false}
//           />
//           <Tooltip
//             cursor={{ fill: "rgba(0,200,150,0.1)" }}
//             contentStyle={{
//               background: "rgba(10,30,66,0.96)",
//               border: "1px solid rgba(0,200,150,0.45)",
//               borderRadius: 12,
//               padding: "14px 18px",
//               color: "white",
//               boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
//             }}
//           />
//           <Bar
//             dataKey="score"
//             radius={[0, 10, 10, 0]}
//             barSize={28}
//             animationDuration={1600}
//             animationEasing="ease-out"
//           >
//             {entries.map((entry, index) => (
//               <Cell
//                 key={`cell-${index}`}
//                 fill={`url(#grad-${index})`}
//                 style={{
//                   transition: "all 0.35s ease",
//                   filter: hovered === entry.name ? "brightness(1.3) drop-shadow(0 0 14px currentColor)" : "none",
//                   transform: hovered === entry.name ? "scale(1.08)" : "scale(1)",
//                   transformOrigin: "left center",
//                 }}
//                 onMouseEnter={() => setHovered(entry.name)}
//                 onMouseLeave={() => setHovered(null)}
//               />
//             ))}
//           </Bar>
//           <defs>
//             {entries.map((entry, i) => (
//               <linearGradient key={`grad-${i}`} id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
//                 <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
//                 <stop offset="100%" stopColor={entry.color} stopOpacity={0.65} />
//               </linearGradient>
//             ))}
//           </defs>
//         </BarChart>
//       </ResponsiveContainer>
//     </div>
//   );
// }

// function Radial({ score, label, color, size = 90 }: { score: number; label: string; color: string; size?: number }) {
//   const r = size * 0.38;
//   const circ = 2 * Math.PI * r;
//   const dash = (score / 100) * circ;
//   return (
//     <div style={{ textAlign: "center", padding: "10px" }}>
//       <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
//         <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={size * 0.09} />
//         <circle
//           cx={size / 2}
//           cy={size / 2}
//           r={r}
//           fill="none"
//           stroke={color}
//           strokeWidth={size * 0.09}
//           strokeDasharray={`${dash} ${circ}`}
//           strokeLinecap="round"
//           transform={`rotate(-90 ${size / 2} ${size / 2})`}
//           style={{ transition: "stroke-dasharray 1.4s ease" }}
//         />
//         <text x={size / 2} y={size / 2 + 6} textAnchor="middle" fill="white" fontSize={size * 0.24} fontWeight="900" fontFamily="'DM Sans',sans-serif">
//           {score}
//         </text>
//       </svg>
//       <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 8, fontWeight: 500 }}>{label}</div>
//     </div>
//   );
// }

// export default function Report() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const raw = location.state?.data;

//   // ── Normalise: blackbox audit data → ReportData shape ─────────────────
//   // When coming from the Profile "My Projects" click, the data is a
//   // BlackBox audit record (keys: audit_id, category_scores, probe_results…).
//   // When coming from Dashboard "Run Full Evaluation", it is already a
//   // full ReportData record. We detect by presence of audit_id vs report_id.
//   const r: ReportData = (() => {
//     if (!raw) return null as any;

//     // Already a full evaluation report — pass through unchanged
//     if (raw.report_id || raw.trusted_ai_principles) return raw as ReportData;

//     // ── It's a BlackBox audit record — map it ──────────────────────────
//     const catScores: Record<string, number> = raw.category_scores || {};

//     // Convert category_scores → trusted_ai_principles format
//     const trusted_ai_principles: Record<string, { score: number; parameters: Record<string, number> }> = {};
//     for (const [cat, score] of Object.entries(catScores)) {
//       trusted_ai_principles[cat] = {
//         score: score as number,
//         parameters: { Score: score as number },
//       };
//     }

//     // Map BlackBox findings to ReportData findings shape
//     const findings = (raw.findings || []).map((f: any) => ({
//       category:       f.category       || "Unknown",
//       severity:       f.severity       || "Medium",
//       issue:          f.issue          || f.note || "See probe response",
//       recommendation: f.recommendation || "Review model behaviour",
//     }));

//     // Derive framework compliance from overall score
//     const s = raw.overall_score || 0;
//     const complianceStatus = s >= 75 ? "Compliant" : s >= 50 ? "Conditional" : "Partial";

//     return {
//       report_id:             raw.audit_id          || "N/A",
//       ai_name:               raw.ai_name            || "External AI",
//       model_type:            raw.mode               ? `BlackBox (${raw.mode.toUpperCase()})` : "BlackBox",
//       evaluated_at:          raw.completed_at       || raw.created_at || new Date().toISOString(),
//       overall_score:         raw.overall_score      || 0,
//       risk_level:            raw.risk_level         || "Unknown",
//       structural_risk:       raw.risk_level         || "Unknown",
//       logs_evaluated:        raw.probes_run         || 0,
//       data_quality_score:    raw.overall_score      || 0,
//       trusted_ai_principles,
//       diagnostics: {
//         missing_ratio:     0,
//         duplicates:        0,
//         schema_confidence: 1,
//         total_columns:     0,
//         text_columns:      0,
//         numeric_columns:   0,
//         column_names:      [],
//       },
//       findings,
//       recommendation:
//         findings.length === 0
//           ? "All governance probes passed. AI system aligns with Trusted AI principles."
//           : `${findings.length} governance violation(s) detected. Review findings and recommendations.`,
//       framework_compliance: {
//         EU_AI_Act:   complianceStatus,
//         ISO_42001:   complianceStatus,
//         NIST_AI_RMF: complianceStatus,
//         KPMG_TAF:    complianceStatus,
//       },
//     } as ReportData;
//   })();
//   const [sel, setSel] = useState<string | null>(null);
//   const [hoveredParam, setHoveredParam] = useState<string | null>(null);
//   const [anim, setAnim] = useState(false);
//   const [pdfLoading, setPdfLoading] = useState(false);

//   useEffect(() => {
//     setTimeout(() => setAnim(true), 150);
//   }, []);

//   useEffect(() => {
//     setHoveredParam(null);
//   }, [sel]);

//   if (!r) {
//     return (
//       <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#050d1a", gap: 20 }}>
//         <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 18 }}>No report data found.</p>
//         <button
//           style={{
//             padding: "14px 32px",
//             background: "rgba(255,255,255,0.08)",
//             border: "1px solid rgba(255,255,255,0.15)",
//             color: "white",
//             borderRadius: 12,
//             cursor: "pointer",
//             fontSize: 15,
//             fontWeight: 600,
//           }}
//           onClick={() => navigate("/dashboard")}
//         >
//           ← Back to Dashboard
//         </button>
//       </div>
//     );
//   }

//   const prn = r.trusted_ai_principles || {};
//   const pkeys = Object.keys(prn);
//   const hasPrn = pkeys.length > 0;
//   const rc = r.risk_level === "Low" ? "#00C896" : r.risk_level === "Moderate" ? "#ffb020" : "#ff4d4d";
//   const fmt = (d: string) => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
//   const selData = sel ? prn[sel] : null;
//   const selectedEntries = selData ? Object.entries(selData.parameters || {}) : [];
//   const activeParam = hoveredParam && selData?.parameters?.[hoveredParam] !== undefined
//     ? hoveredParam
//     : (selData ? Object.keys(selData.parameters || {})[0] || null : null);
//   const activeInsight = activeParam ? getParameterInsight(activeParam, r, selData) : null;
//   const strongestParam = selectedEntries.length
//     ? selectedEntries.reduce((best, entry) => ((entry[1] as number) > (best[1] as number) ? entry : best))
//     : null;
//   const weakestParam = selectedEntries.length
//     ? selectedEntries.reduce((worst, entry) => ((entry[1] as number) < (worst[1] as number) ? entry : worst))
//     : null;

//   const fadeStyle = (delay: number): React.CSSProperties => ({
//     opacity: anim ? 1 : 0,
//     transform: anim ? "translateY(0)" : "translateY(24px)",
//     transition: `all 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
//   });

//  const handleDownloadPDF = async () => {
//   setPdfLoading(true);

//   try {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       alert("You need to be logged in to download reports. Redirecting to login...");
//       navigate("/login");
//       return;
//     }

//     if (!r.report_id) {
//       alert("No report ID found. Please complete an evaluation first.");
//       return;
//     }

//     const response = await fetch(`http://localhost:8000/reports/${r.report_id}/pdf`, {
//       method: "GET",
//       headers: {
//         "Authorization": `Bearer ${token}`,
//         "Accept": "application/pdf",
//       },
//     });

//     if (!response.ok) {
//       let errorDetail = "Unknown error";
//       try {
//         const errJson = await response.json();
//         errorDetail = errJson.detail || errorDetail;
//       } catch {}
//       throw new Error(`Download failed: ${response.status} - ${errorDetail}`);
//     }

//     const blob = await response.blob();
//     const downloadUrl = window.URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.href = downloadUrl;
//     link.download = `Audit_Report_${r.report_id || "Unknown"}_${new Date().toISOString().split("T")[0]}.pdf`;
//     document.body.appendChild(link);
//     link.click();
//     link.remove();
//     window.URL.revokeObjectURL(downloadUrl);

//   } catch (err: any) {
//     console.error("PDF download error:", err);
//     alert(err.message || "Failed to download PDF. Check if you're logged in and report exists.");
//   } finally {
//     setPdfLoading(false);
//   }
// };

//   const S: Record<string, React.CSSProperties> = {
//     page: {
//       minHeight: "100vh",
//       background: "linear-gradient(180deg, #04111f 0%, #071525 38%, #091a2e 100%)",
//       fontFamily: "'DM Sans',sans-serif",
//       color: "white",
//       padding: "40px 20px 100px",
//       position: "relative",
//       overflowX: "hidden",
//     },
//     bg: {
//       position: "fixed",
//       inset: 0,
//       zIndex: 0,
//       pointerEvents: "none",
//       background: "radial-gradient(ellipse 90% 60% at 15% 10%, rgba(0,145,218,0.18) 0%, transparent 60%), radial-gradient(ellipse 70% 50% at 85% 82%, rgba(0,200,150,0.16) 0%, transparent 62%), radial-gradient(circle at 50% 25%, rgba(255,255,255,0.05) 0%, transparent 30%)",
//     },
//     header: {
//       position: "relative",
//       zIndex: 1,
//       padding: "32px 40px 24px",
//       borderBottom: "1px solid rgba(255,255,255,0.08)",
//       display: "flex",
//       justifyContent: "space-between",
//       alignItems: "flex-start",
//       flexWrap: "wrap",
//       gap: 20,
//       background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
//       backdropFilter: "blur(18px)",
//       borderRadius: 28,
//       boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
//     },
//     logo: {
//       fontSize: 20,
//       fontWeight: 900,
//       background: "linear-gradient(135deg, #00C8FF, #00C896)",
//       WebkitBackgroundClip: "text",
//       WebkitTextFillColor: "transparent",
//     },
//     kBadge: {
//       fontSize: 11,
//       padding: "3px 12px",
//       background: "rgba(0,51,141,0.45)",
//       border: "1px solid rgba(0,51,141,0.65)",
//       borderRadius: 20,
//       color: "#60A5FA",
//     },
//     title: {
//       fontSize: 32,
//       fontWeight: 900,
//       color: "white",
//       letterSpacing: "-0.02em",
//       margin: "6px 0 10px",
//     },
//     meta: {
//       display: "flex",
//       gap: 10,
//       flexWrap: "wrap",
//       alignItems: "center",
//       fontSize: 13,
//       color: "rgba(255,255,255,0.55)",
//     },
//     dot: { color: "rgba(255,255,255,0.25)" },
//     backBtn: {
//       background: "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05))",
//       border: "1px solid rgba(255,255,255,0.14)",
//       color: "rgba(255,255,255,0.75)",
//       padding: "10px 24px",
//       borderRadius: 14,
//       cursor: "pointer",
//       fontSize: 14,
//       fontWeight: 600,
//       transition: "all 0.3s",
//       boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
//     },
//     heroRow: {
//       position: "relative",
//       zIndex: 1,
//       display: "flex",
//       gap: 24,
//       padding: "32px 40px",
//       alignItems: "stretch",
//       flexWrap: "wrap",
//       borderBottom: "1px solid rgba(255,255,255,0.06)",
//     },
//     heroScore: {
//       textAlign: "center",
//       padding: "32px 40px",
//       background: "linear-gradient(160deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))",
//       border: "2px solid",
//       borderRadius: 26,
//       minWidth: 200,
//       flexShrink: 0,
//       boxShadow: "0 20px 40px rgba(0,0,0,0.28)",
//       backdropFilter: "blur(16px)",
//     },
//     riskPill: {
//       display: "inline-block",
//       padding: "5px 16px",
//       borderRadius: 20,
//       fontSize: 13,
//       fontWeight: 700,
//       marginTop: 12,
//     },
//     statsRow: {
//       display: "flex",
//       gap: 12,
//       flexWrap: "wrap",
//       flex: 1,
//     },
//     statCard: {
//       flex: "1 1 130px",
//       background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))",
//       border: "1px solid rgba(255,255,255,0.1)",
//       borderRadius: 18,
//       padding: "18px 16px",
//       textAlign: "center",
//       display: "flex",
//       flexDirection: "column",
//       gap: 6,
//       boxShadow: "0 16px 32px rgba(0,0,0,0.2)",
//       backdropFilter: "blur(14px)",
//     },
//     sec: {
//       position: "relative",
//       zIndex: 1,
//       margin: "32px 40px",
//       background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))",
//       border: "1px solid rgba(255,255,255,0.09)",
//       borderRadius: 24,
//       padding: "32px",
//       boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
//       backdropFilter: "blur(18px)",
//       overflow: "hidden",
//     },
//     secTitle: {
//       fontSize: 22,
//       fontWeight: 800,
//       color: "white",
//       marginBottom: 10,
//     },
//     secSub: {
//       fontSize: 13,
//       color: "rgba(255,255,255,0.45)",
//       marginBottom: 24,
//       lineHeight: 1.5,
//     },
//     spiderWrap: {
//       display: "flex",
//       gap: 32,
//       flexWrap: "wrap",
//       alignItems: "flex-start",
//       justifyContent: "center",
//     },
//     drillPanel: {
//       flex: "1 1 320px",
//       minHeight: 420,
//       background: "linear-gradient(180deg, rgba(6,16,31,0.92), rgba(8,19,34,0.74))",
//       border: "1px solid rgba(255,255,255,0.08)",
//       borderRadius: 22,
//       padding: "26px",
//       display: "flex",
//       flexDirection: "column",
//       alignItems: "center",
//       boxShadow: "0 28px 70px rgba(0,0,0,0.28)",
//       backdropFilter: "blur(18px)",
//     },
//     fwCard: {
//       background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
//       border: "1px solid rgba(255,255,255,0.1)",
//       borderRadius: 18,
//       padding: "18px",
//       boxShadow: "0 16px 36px rgba(0,0,0,0.18)",
//       backdropFilter: "blur(14px)",
//       textAlign: "center",
//     },
//     fwPill: {
//       display: "inline-flex",
//       alignItems: "center",
//       justifyContent: "center",
//       minHeight: 32,
//       padding: "6px 12px",
//       borderRadius: 999,
//       fontSize: 12,
//       fontWeight: 700,
//       marginTop: 8,
//     },
//     fwNote: {
//       padding: "14px 16px",
//       borderRadius: 16,
//       background: "rgba(255,255,255,0.04)",
//       border: "1px solid rgba(255,255,255,0.08)",
//     },
//     diagCard: {
//       background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))",
//       border: "1px solid rgba(255,255,255,0.08)",
//       borderRadius: 18,
//       padding: "18px",
//       textAlign: "center",
//       boxShadow: "0 14px 32px rgba(0,0,0,0.18)",
//       backdropFilter: "blur(14px)",
//     },
//   };

//   return (
//     <div style={S.page}>
//       <div style={S.bg} />

//       {/* HEADER */}
//       <div style={{ ...S.header, ...fadeStyle(0) }}>
//         <div>
//           <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
//             <span style={S.logo}>Auditable AI™</span>
//             <span style={S.kBadge}>⬡ KPMG Trusted AI Framework</span>
//           </div>
//           <h1 style={S.title}>Governance Audit Report</h1>
//           <div style={S.meta}>
//             <span>📌 {r.ai_name}</span><span style={S.dot}> · </span>
//             <span>🧠 {r.model_label || r.model_type}</span>
//             {r.detection_confidence !== undefined && (
//               <><span style={S.dot}> · </span><span style={{ color: r.detection_confidence >= 0.6 ? "#00C896" : "#ffb020" }}>
//                 {Math.round(r.detection_confidence * 100)}% detection confidence
//               </span></>
//             )}
//             <span style={S.dot}> · </span>
//             <span>📅 {fmt(r.evaluated_at)}</span><span style={S.dot}> · </span>
//             <span style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
//               ID: {r.report_id?.slice(0, 12)}…
//             </span>
//           </div>
//         </div>
//         <button
//           style={S.backBtn}
//           onClick={() => navigate("/dashboard")}
//         >
//           ← Dashboard
//         </button>
//       </div>

//       {/* HERO SCORE */}
//       <div style={{ ...S.heroRow, ...fadeStyle(0.1) }}>
//         <div style={{ ...S.heroScore, borderColor: `${rc}55` }}>
//           <div style={{ fontSize: 72, fontWeight: 900, color: rc, lineHeight: 1 }}>
//             {r.overall_score}
//           </div>
//           <div style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", marginTop: 6 }}>/ 100</div>
//           <div style={{ ...S.riskPill, background: `${rc}22`, border: `1px solid ${rc}66`, color: rc }}>
//             {r.risk_level} Risk
//           </div>
//         </div>

//         <div style={S.statsRow}>
//           {[
//             { icon: "📂", label: "Logs Evaluated", val: r.logs_evaluated },
//             { icon: "📊", label: "Data Quality", val: `${r.data_quality_score}%` },
//             { icon: "🏗️", label: "Structural Risk", val: r.structural_risk },
//             { icon: "✅", label: "Principles Tested", val: pkeys.length },
//             { icon: "⚠️", label: "Findings", val: r.findings?.length || 0 },
//           ].map((s, i) => (
//             <div key={i} style={S.statCard}>
//               <span style={{ fontSize: 26 }}>{s.icon}</span>
//               <div style={{ fontSize: 26, fontWeight: 900, color: "white" }}>{s.val}</div>
//               <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{s.label}</div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* COLUMN WARNINGS */}
//       {r.column_warnings && r.column_warnings.length > 0 && (
//         <div style={{
//           position: "relative", zIndex: 1,
//           margin: "0 40px 8px",
//           padding: "14px 20px",
//           borderRadius: 16,
//           background: "rgba(255,176,32,0.08)",
//           border: "1px solid rgba(255,176,32,0.3)",
//           display: "flex", flexDirection: "column", gap: 6,
//           ...fadeStyle(0.12),
//         }}>
//           {r.column_warnings.map((w, i) => (
//             <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "#ffb020", lineHeight: 1.5 }}>
//               <span style={{ flexShrink: 0 }}>⚠</span>
//               <span>{w}</span>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* FRAMEWORK COMPLIANCE */}
//       <section style={{ ...S.sec, ...fadeStyle(0.15) }}>
//         <h2 style={S.secTitle}>🏛️ Regulatory & Framework Compliance</h2>
//         <p style={S.secSub}>Assessment against major AI governance standards.</p>
//         <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
//           {Object.entries(r.framework_compliance || {}).map(([key, status]) => {
//             const fw = FW[key] || { label: key, icon: "📋", desc: "" };
//             const sc = CC[status] || "#aaa";
//             return (
//               <div key={key} style={{ ...S.fwCard, borderColor: `${sc}55`, minWidth: 180 }}>
//                 <div style={{ fontSize: 32, marginBottom: 10 }}>{fw.icon}</div>
//                 <div style={{ fontWeight: 700, fontSize: 15, color: "white" }}>{fw.label}</div>
//                 <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: "6px 0" }}>{fw.desc}</div>
//                 <div style={{ ...S.fwPill, background: `${sc}22`, border: `1px solid ${sc}66`, color: sc }}>
//                   {status}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//         <div style={{ ...S.fwNote, marginTop: 24, fontSize: 12 }}>
//           <span style={{ opacity: 0.5 }}>ℹ️</span>
//           <span style={{ marginLeft: 10, lineHeight: 1.6 }}>
//             EU AI Act • ISO/IEC 42001:2023 • NIST AI RMF • KPMG Trusted AI Framework
//           </span>
//         </div>
//       </section>

//       {/* SIDE-BY-SIDE PRINCIPLES ASSESSMENT */}
//       {hasPrn && (
//         <section style={{ ...S.sec, ...fadeStyle(0.2), padding: "40px" }}>
//           <h2 style={{ ...S.secTitle, fontSize: 26, marginBottom: 16 }}>🕸️ Trusted AI Principles Assessment</h2>
//           <p style={{ ...S.secSub, marginBottom: 32 }}>Hover or click any principle to see sub-parameter details.</p>

//           <div style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
//             gap: 14,
//             marginBottom: 28,
//           }}>
//             {[
//               { label: "Average Principle Score", value: `${Math.round(Object.values(prn).reduce((sum, item) => sum + item.score, 0) / Math.max(pkeys.length, 1))}`, tone: "#00C896" },
//               { label: "Strong Principles", value: `${Object.values(prn).filter(item => item.score >= 75).length}/${pkeys.length}`, tone: "#60A5FA" },
//               { label: "Needs Attention", value: `${Object.values(prn).filter(item => item.score < 60).length}`, tone: "#FFB020" },
//             ].map((item) => (
//               <div key={item.label} style={{
//                 padding: "18px 18px 16px",
//                 borderRadius: 18,
//                 background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
//                 border: `1px solid ${item.tone}33`,
//                 boxShadow: "0 16px 34px rgba(0,0,0,0.16)",
//               }}>
//                 <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.42)", marginBottom: 8 }}>
//                   {item.label}
//                 </div>
//                 <div style={{ fontSize: 28, fontWeight: 900, color: item.tone }}>{item.value}</div>
//               </div>
//             ))}
//           </div>

//           {/* Spider Chart — full width */}
//           <div style={{ width: "100%", maxWidth: 720, margin: "0 auto 36px" }}>
//             <Spider principles={prn} onSelect={setSel} selected={sel} />
//           </div>

//           {/* Drill-down panel — full width below spider */}
//           <div style={{ width: "100%" }}>
//             <div style={{
//               ...S.drillPanel,
//               width: "100%",
//               minHeight: "auto",
//               alignItems: "stretch",
//             }}>
//               {!sel ? (
//                 <div style={{ width: "100%" }}>
//                   <div style={{
//                     fontSize: 12, color: "rgba(255,255,255,0.42)", textAlign: "center",
//                     marginBottom: 20, padding: "10px 14px", borderRadius: 12,
//                     background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
//                   }}>
//                     Click any principle to inspect sub-parameters and formulas
//                   </div>
//                   <div style={{
//                     display: "grid",
//                     gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
//                     gap: 10,
//                   }}>
//                     {pkeys.map(k => {
//                       const c = COLORS[k] || "#00C896";
//                       const sc = prn[k].score;
//                       const scoreColor = sc >= 75 ? "#00C896" : sc >= 50 ? "#ffb020" : "#ff4d4d";
//                       return (
//                         <div
//                           key={k}
//                           style={{
//                             display: "flex", alignItems: "center", gap: 12,
//                             padding: "14px 16px", borderRadius: 16,
//                             background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
//                             border: `1px solid ${c}28`,
//                             cursor: "pointer", transition: "all 0.2s",
//                           }}
//                           onClick={() => setSel(k)}
//                           onMouseEnter={e => (e.currentTarget.style.background = `linear-gradient(135deg, ${c}15, ${c}08)`)}
//                           onMouseLeave={e => (e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))")}
//                         >
//                           <div style={{
//                             width: 40, height: 40, borderRadius: 12, flexShrink: 0,
//                             background: `${c}18`, border: `1px solid ${c}35`,
//                             display: "grid", placeItems: "center", fontSize: 18,
//                           }}>{ICONS[k]}</div>
//                           <div style={{ flex: 1, minWidth: 0 }}>
//                             <div style={{ fontSize: 13, fontWeight: 700, color: "#EAF2FB", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{k}</div>
//                             <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 99, marginTop: 7 }}>
//                               <div style={{ width: `${sc}%`, height: "100%", background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}99)`, borderRadius: 99, transition: "width 0.8s ease" }} />
//                             </div>
//                           </div>
//                           <div style={{ textAlign: "right", flexShrink: 0 }}>
//                             <div style={{ fontSize: 20, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{sc}</div>
//                             <div style={{ fontSize: 9, color: scoreColor, marginTop: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{band(sc)}</div>
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 </div>
//               ) : selData ? (
//                 <div style={{ width: "100%" }}>
//                   <div style={{
//                     display: "flex",
//                     gap: 14,
//                     alignItems: "center",
//                     marginBottom: 20,
//                     padding: "18px",
//                     borderRadius: 20,
//                     background: `radial-gradient(circle at top right, ${(COLORS[sel] || "#00C896")}22, transparent 35%), linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))`,
//                     border: `1px solid ${(COLORS[sel] || "#00C896")}33`,
//                     boxShadow: `0 18px 44px ${(COLORS[sel] || "#00C896")}18`,
//                   }}>
//                     <div style={{
//                       width: 56,
//                       height: 56,
//                       borderRadius: 18,
//                       display: "grid",
//                       placeItems: "center",
//                       fontSize: 28,
//                       background: `${COLORS[sel] || "#00C896"}20`,
//                       border: `1px solid ${(COLORS[sel] || "#00C896")}44`,
//                     }}>
//                       {ICONS[sel]}
//                     </div>
//                     <div style={{ flex: 1 }}>
//                       <div style={{ fontSize: 18, fontWeight: 700 }}>{sel}</div>
//                       <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Sub-parameters · {band(selData.score)} posture</div>
//                     </div>
//                     <div style={{ fontSize: 32, fontWeight: 900, color: COLORS[sel] || "#00C896" }}>
//                       {selData.score}
//                     </div>
//                   </div>

//                   <div style={{
//                     display: "grid",
//                     gridTemplateColumns: "140px 1fr",
//                     gap: 18,
//                     alignItems: "center",
//                     margin: "22px 0 20px",
//                     padding: "16px 18px",
//                     borderRadius: 18,
//                     background: "rgba(255,255,255,0.03)",
//                     border: "1px solid rgba(255,255,255,0.06)",
//                   }}>
//                     <div style={{ textAlign: "center" }}>
//                       <Radial score={selData.score} label={sel} color={COLORS[sel] || "#00C896"} size={110} />
//                     </div>
//                     <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
//                       <div style={{ padding: "12px", borderRadius: 14, background: "rgba(255,255,255,0.04)" }}>
//                         <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 6 }}>Strongest Parameter</div>
//                         <div style={{ fontSize: 13, fontWeight: 700 }}>{strongestParam?.[0] || "N/A"}</div>
//                         <div style={{ fontSize: 18, fontWeight: 900, color: "#00C896", marginTop: 6 }}>{strongestParam?.[1] ?? "-"}</div>
//                       </div>
//                       <div style={{ padding: "12px", borderRadius: 14, background: "rgba(255,255,255,0.04)" }}>
//                         <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 6 }}>Weakest Parameter</div>
//                         <div style={{ fontSize: 13, fontWeight: 700 }}>{weakestParam?.[0] || "N/A"}</div>
//                         <div style={{ fontSize: 18, fontWeight: 900, color: "#FFB020", marginTop: 6 }}>{weakestParam?.[1] ?? "-"}</div>
//                       </div>
//                     </div>
//                   </div>

//                   {selData.description && (
//                     <div style={{
//                       marginBottom: 18,
//                       fontSize: 13,
//                       lineHeight: 1.75,
//                       color: "rgba(255,255,255,0.7)",
//                       padding: "14px 16px",
//                       borderRadius: 16,
//                       background: "rgba(255,255,255,0.035)",
//                       border: "1px solid rgba(255,255,255,0.06)",
//                     }}>
//                       {selData.description}
//                     </div>
//                   )}

//                   {activeParam && activeInsight && (
//                     <div style={{
//                       marginBottom: 22,
//                       padding: "18px 18px 16px",
//                       borderRadius: 20,
//                       background: `radial-gradient(circle at top right, ${(COLORS[sel] || "#00C896")}1a, transparent 38%), linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))`,
//                       border: `1px solid ${(COLORS[sel] || "#00C896")}33`,
//                       boxShadow: "0 20px 44px rgba(0,0,0,0.22)",
//                     }}>
//                       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10 }}>
//                         <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
//                           Live Parameter Drill-down
//                         </div>
//                         <div style={{
//                           padding: "5px 10px",
//                           borderRadius: 999,
//                           background: `${COLORS[sel] || "#00C896"}18`,
//                           border: `1px solid ${(COLORS[sel] || "#00C896")}44`,
//                           color: COLORS[sel] || "#00C896",
//                           fontSize: 11,
//                           fontWeight: 700,
//                         }}>
//                           {band(selData.parameters[activeParam] as number)}
//                         </div>
//                       </div>
//                       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 10 }}>
//                         <div>
//                           <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{activeParam}</div>
//                           <div style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,0.78)" }}>
//                             {activeInsight.detail}
//                           </div>
//                         </div>
//                         <div style={{
//                           minWidth: 58,
//                           textAlign: "center",
//                           padding: "10px 8px",
//                           borderRadius: 16,
//                           background: "rgba(255,255,255,0.05)",
//                           border: "1px solid rgba(255,255,255,0.08)",
//                         }}>
//                           <div style={{ fontSize: 22, fontWeight: 900, color: COLORS[sel] || "#00C896", lineHeight: 1 }}>
//                             {selData.parameters[activeParam]}
//                           </div>
//                           <div style={{ fontSize: 10, color: "rgba(255,255,255,0.42)", marginTop: 6 }}>score</div>
//                         </div>
//                       </div>
//                       <div style={{
//                         display: "grid",
//                         gridTemplateColumns: "1fr",
//                         gap: 10,
//                       }}>
//                         <div style={{
//                           height: 10,
//                           background: "rgba(255,255,255,0.08)",
//                           borderRadius: 99,
//                           overflow: "hidden",
//                         }}>
//                           <div style={{
//                             width: `${selData.parameters[activeParam]}%`,
//                             height: "100%",
//                             background: `linear-gradient(90deg, ${COLORS[sel] || "#00C896"}, rgba(255,255,255,0.92))`,
//                             borderRadius: 99,
//                             boxShadow: `0 0 24px ${(COLORS[sel] || "#00C896")}66`,
//                           }} />
//                         </div>
//                       </div>
//                       <div style={{
//                         fontSize: 12,
//                         lineHeight: 1.65,
//                         color: "rgba(255,255,255,0.62)",
//                         padding: "12px 14px",
//                         borderRadius: 14,
//                         background: "rgba(2,10,21,0.55)",
//                         border: "1px solid rgba(255,255,255,0.06)",
//                         marginTop: 12,
//                       }}>
//                         <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", marginBottom: 6 }}>
//                           Calculation Logic
//                         </div>
//                         {activeInsight.detail}
//                       </div>
//                       <div style={{
//                         fontSize: 12,
//                         lineHeight: 1.65,
//                         color: "rgba(255,255,255,0.62)",
//                         padding: "12px 14px",
//                         borderRadius: 14,
//                         background: "rgba(0,0,0,0.24)",
//                         border: "1px solid rgba(255,255,255,0.06)",
//                         marginTop: 12,
//                       }}>
//                         <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", marginBottom: 6 }}>
//                           Formula
//                         </div>
//                         {activeInsight.calculation}
//                       </div>
//                     </div>
//                   )}

//                   {Object.entries(selData.parameters).map(([param, val]) => {
//                     const v = val as number;
//                     const c = COLORS[sel] || "#00C896";
//                     const sl = v >= 75 ? "Good" : v >= 50 ? "Fair" : "Poor";
//                     const sc2 = v >= 75 ? "#00C896" : v >= 50 ? "#ffb020" : "#ff4d4d";
//                     const isActive = activeParam === param;
//                     return (
//                       <div
//                         key={param}
//                         style={{
//                           marginBottom: 16,
//                           padding: "14px 14px 12px",
//                           borderRadius: 16,
//                           background: isActive
//                             ? `linear-gradient(180deg, ${c}1c, rgba(255,255,255,0.05))`
//                             : "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
//                           border: isActive ? `1px solid ${c}50` : "1px solid rgba(255,255,255,0.06)",
//                           transition: "all 0.2s ease",
//                           cursor: "pointer",
//                           boxShadow: isActive ? `0 18px 36px ${c}18` : "0 10px 24px rgba(0,0,0,0.12)",
//                         }}
//                         onMouseEnter={() => setHoveredParam(param)}
//                         onMouseLeave={() => setHoveredParam(null)}
//                       >
//                         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
//                           <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{param}</span>
//                           <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, color: sc2, background: `${sc2}15`, border: `1px solid ${sc2}40` }}>
//                             {sl}
//                           </span>
//                         </div>
//                         <div style={{ height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 4 }}>
//                           <div style={{ width: `${v}%`, height: "100%", background: `linear-gradient(90deg, ${c}, rgba(255,255,255,0.92))`, borderRadius: 4 }} />
//                         </div>
//                         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
//                           <span style={{ fontSize: 11, color: "rgba(255,255,255,0.42)" }}>{isActive ? "Currently inspected" : "Hover for calculation"}</span>
//                           <div style={{ textAlign: "right", fontSize: 12, color: c }}>{v}</div>
//                         </div>
//                       </div>
//                     );
//                   })}

//                   <button
//                     style={{
//                       marginTop: 24,
//                       width: "100%",
//                       padding: "12px",
//                       background: `linear-gradient(180deg, ${(COLORS[sel] || "#00C896")}18, rgba(255,255,255,0.03))`,
//                       border: `1px solid ${COLORS[sel] || "#00C896"}50`,
//                       color: COLORS[sel] || "#00C896",
//                       borderRadius: 14,
//                       cursor: "pointer",
//                       fontSize: 13,
//                       fontWeight: 600,
//                       boxShadow: `0 14px 32px ${(COLORS[sel] || "#00C896")}12`,
//                     }}
//                     onClick={() => setSel(null)}
//                   >
//                     ← Back to All Principles
//                   </button>
//                 </div>
//               ) : null}
//             </div>
//           </div>
//         </section>
//       )}

//       {/* BAR CHART */}
//       {hasPrn && (
//         <section style={{ ...S.sec, ...fadeStyle(0.25) }}>
//           <h2 style={S.secTitle}>📊 Principle Score Distribution</h2>
//           <p style={S.secSub}>Hover bars for details.</p>
//           <ImprovedBarChart principles={prn} />
//         </section>
//       )}

//       {/* MODEL-SPECIFIC METRICS */}
//       {r.model_metrics && Object.values(r.model_metrics).some(m => m.value !== null) && (
//         <section style={{ ...S.sec, ...fadeStyle(0.33) }}>
//           <h2 style={S.secTitle}>🧪 Model-Specific Metrics</h2>
//           <p style={S.secSub}>
//             Measured metrics for <strong style={{ color: "#EAF2FB" }}>{r.model_label || r.model_type}</strong> — evaluated against model-appropriate thresholds.
//           </p>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
//             {Object.entries(r.model_metrics)
//               .filter(([, m]) => m.value !== null)
//               .map(([key, m]) => {
//                 const rc2 = m.risk_level === "Low" ? "#00C896" : m.risk_level === "Moderate" ? "#ffb020" : "#ff4d4d";
//                 const displayVal = m.unit === "ms"
//                   ? `${Math.round(m.value!)}ms`
//                   : m.unit === "ratio" || m.unit === "score"
//                     ? m.value!.toFixed(3)
//                     : m.value!.toFixed(3);
//                 return (
//                   <div key={key} style={{
//                     background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))",
//                     border: `1px solid ${rc2}44`,
//                     borderRadius: 16, padding: "18px 16px",
//                     display: "flex", flexDirection: "column", gap: 8,
//                   }}>
//                     <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
//                       {key.replace(/_/g, " ")}
//                     </div>
//                     <div style={{ fontSize: 26, fontWeight: 800, color: rc2 }}>{displayVal}</div>
//                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                       <span style={{ fontSize: 11, color: rc2, background: `${rc2}15`, border: `1px solid ${rc2}33`, padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
//                         {m.risk_level}
//                       </span>
//                       {m.threshold_low !== undefined && (
//                         <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
//                           threshold: {m.threshold_low}{m.unit ? ` ${m.unit}` : ""}
//                         </span>
//                       )}
//                     </div>
//                     <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{m.description}</div>
//                   </div>
//                 );
//               })}
//           </div>
//         </section>
//       )}

//       {/* COMPUTATION NOTES */}
//       {r.computation_notes && Object.keys(r.computation_notes).filter(k => k !== "_error").length > 0 && (() => {
//         const notes       = Object.entries(r.computation_notes!).filter(([k]) => k !== "_error");
//         const computed    = notes.filter(([, n]) => n.status === "computed");
//         const unavailable = notes.filter(([, n]) => n.status !== "computed");
//         return (
//           <section style={{ ...S.sec, ...fadeStyle(0.38) }}>
//             <h2 style={S.secTitle}>🔬 Metric Computation Transparency</h2>
//             <p style={S.secSub}>
//               Every metric was computed directly from your <strong style={{ color: "#EAF2FB" }}>input/output</strong> data using
//               real NLP/ML libraries — not pre-logged values. This section shows exactly how each metric was produced.
//             </p>

//             {/* Summary pills */}
//             <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
//               {[
//                 { label: "Computed", count: computed.length, color: "#00C896" },
//                 { label: "Unavailable", count: unavailable.length, color: "#ffb020" },
//                 { label: "Total Metrics", count: notes.length, color: "#60A5FA" },
//               ].map(({ label, count, color }) => (
//                 <div key={label} style={{
//                   padding: "12px 20px", borderRadius: 14,
//                   background: `${color}10`, border: `1px solid ${color}33`,
//                   textAlign: "center", minWidth: 120,
//                 }}>
//                   <div style={{ fontSize: 26, fontWeight: 900, color }}>{count}</div>
//                   <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>{label}</div>
//                 </div>
//               ))}
//             </div>

//             {unavailable.length > 0 && (
//               <div style={{
//                 padding: "12px 16px", borderRadius: 14, marginBottom: 20,
//                 background: "rgba(255,176,32,0.08)", border: "1px solid rgba(255,176,32,0.25)",
//                 fontSize: 13, color: "#ffb020", lineHeight: 1.6,
//               }}>
//                 💡 <strong>{unavailable.length}</strong> metric(s) couldn't be computed — add{" "}
//                 <code style={{ background: "rgba(255,176,32,0.15)", borderRadius: 4, padding: "1px 5px", fontSize: 11 }}>reference</code>,{" "}
//                 <code style={{ background: "rgba(255,176,32,0.15)", borderRadius: 4, padding: "1px 5px", fontSize: 11 }}>context</code>,{" "}
//                 <code style={{ background: "rgba(255,176,32,0.15)", borderRadius: 4, padding: "1px 5px", fontSize: 11 }}>label</code>, or{" "}
//                 <code style={{ background: "rgba(255,176,32,0.15)", borderRadius: 4, padding: "1px 5px", fontSize: 11 }}>confidence</code>{" "}
//                 columns to your dataset to enable them.
//               </div>
//             )}

//             <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
//               {notes.map(([key, note]) => {
//                 const ok = note.status === "computed";
//                 const nc = ok ? "#00C896" : "#ffb020";
//                 return (
//                   <div key={key} style={{
//                     padding: "16px", borderRadius: 16,
//                     background: ok ? "rgba(0,200,150,0.05)" : "rgba(255,176,32,0.04)",
//                     border: `1px solid ${nc}33`,
//                     display: "flex", flexDirection: "column", gap: 6,
//                   }}>
//                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                       <span style={{ fontSize: 12, fontWeight: 700, color: "#EAF2FB", textTransform: "capitalize" }}>
//                         {key.replace(/_/g, " ")}
//                       </span>
//                       <span style={{
//                         fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12,
//                         color: nc, background: `${nc}15`, border: `1px solid ${nc}33`,
//                       }}>
//                         {ok ? "✓ computed" : "✗ unavailable"}
//                       </span>
//                     </div>
//                     <div style={{ fontSize: 22, fontWeight: 900, color: nc }}>
//                       {note.value !== null ? note.value.toFixed(4) : "—"}
//                     </div>
//                     <div style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", lineHeight: 1.5 }}>
//                       {note.library}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>

//             {r.computation_notes!._error && (
//               <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 12, color: "#ff8787" }}>
//                 ⚠ Computation error: {(r.computation_notes!._error as any)}
//               </div>
//             )}
//           </section>
//         );
//       })()}

//       {/* DIAGNOSTICS */}
//       <section style={{ ...S.sec, ...fadeStyle(0.35) }}>
//         <h2 style={S.secTitle}>🔬 Dataset Diagnostics</h2>
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
//           {[
//             { icon: "❌", label: "Missing Ratio", val: `${(r.diagnostics.missing_ratio * 100).toFixed(1)}%`, c: r.diagnostics.missing_ratio < 0.1 ? "#00C896" : "#ff4d4d" },
//             { icon: "🔁", label: "Duplicates", val: r.diagnostics.duplicates, c: r.diagnostics.duplicates === 0 ? "#00C896" : "#ffb020" },
//             { icon: "🧩", label: "Schema Confidence", val: `${Math.round(r.diagnostics.schema_confidence * 100)}%`, c: "#60A5FA" },
//             { icon: "📐", label: "Total Columns", val: r.diagnostics.total_columns, c: "#A78BFA" },
//             { icon: "📝", label: "Text Columns", val: r.diagnostics.text_columns, c: "#00E5A0" },
//             { icon: "🔢", label: "Numeric Columns", val: r.diagnostics.numeric_columns, c: "#FBBF24" },
//           ].map((d, i) => (
//             <div key={i} style={{ ...S.diagCard, borderColor: `${d.c}44` }}>
//               <span style={{ fontSize: 26 }}>{d.icon}</span>
//               <div style={{ fontSize: 22, fontWeight: 800, color: d.c }}>{d.val}</div>
//               <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{d.label}</div>
//             </div>
//           ))}
//         </div>
//         {r.diagnostics.column_names?.length > 0 && (
//           <div style={{ marginTop: 24, padding: "18px", background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))", borderRadius: 18, border: "1px solid rgba(255,255,255,0.08)" }}>
//             <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Detected columns:</div>
//             <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
//               {r.diagnostics.column_names.map((col, i) => (
//                 <span key={i} style={{ padding: "6px 12px", background: "rgba(255,255,255,0.06)", borderRadius: 999, fontSize: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
//                   {col}
//                 </span>
//               ))}
//             </div>
//           </div>
//         )}
//       </section>

//       {/* FINDINGS */}
//       <section style={{ ...S.sec, ...fadeStyle(0.4) }}>
//         <h2 style={S.secTitle}>
//           ⚠️ Audit Findings {(r.findings?.length || 0) > 0 && <span style={{ color: "#ff4d4d", fontWeight: 700 }}>({r.findings.length})</span>}
//         </h2>
//         {!r.findings?.length ? (
//           <div style={{ padding: 24, background: "linear-gradient(180deg, rgba(0,200,150,0.16), rgba(0,200,150,0.06))", border: "1px solid rgba(0,200,150,0.28)", borderRadius: 18, color: "#00C896", boxShadow: "0 18px 38px rgba(0,0,0,0.14)" }}>
//             ✅ No critical findings. Dataset aligns well with standards.
//           </div>
//         ) : (
//           <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//             {r.findings.map((f, i) => {
//               const sc = f.severity === "High" ? "#ff4d4d" : f.severity === "Medium" ? "#ffb020" : "#00C896";
//               return (
//                 <div key={i} style={{ background: `radial-gradient(circle at top right, ${sc}12, transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))`, border: `1px solid ${sc}33`, borderRadius: 18, padding: 20, boxShadow: "0 18px 38px rgba(0,0,0,0.14)" }}>
//                   <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
//                     <span style={{ color: COLORS[f.category] || "white", fontWeight: 600 }}>
//                       {ICONS[f.category] || "•"} {f.category}
//                     </span>
//                     <span style={{ color: sc, fontWeight: 700, background: `${sc}15`, border: `1px solid ${sc}33`, padding: "5px 10px", borderRadius: 999, fontSize: 12 }}>{f.severity}</span>
//                   </div>
//                   <p style={{ margin: "8px 0", color: "rgba(255,255,255,0.85)" }}>{f.issue}</p>
//                   <p style={{ color: "rgba(255,255,255,0.62)", fontStyle: "italic", lineHeight: 1.6 }}>💡 {f.recommendation}</p>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </section>

//       {/* RECOMMENDATION */}
//       {r.recommendation && (
//         <section style={{ ...S.sec, ...fadeStyle(0.45) }}>
//           <h2 style={S.secTitle}>📌 Overall Recommendation</h2>
//           <div style={{ padding: 22, background: "linear-gradient(180deg, rgba(255,176,32,0.14), rgba(255,176,32,0.05))", border: "1px solid rgba(255,176,32,0.25)", borderRadius: 18, boxShadow: "0 18px 36px rgba(0,0,0,0.14)" }}>
//             <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>{r.recommendation}</p>
//           </div>
//         </section>
//       )}

//       {/* PDF DOWNLOAD SECTION */}
//       <section style={{ ...S.sec, ...fadeStyle(0.5), textAlign: "center", background: "radial-gradient(circle at top center, rgba(0,145,218,0.12), transparent 38%), linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))" }}>
//         <h2 style={{ fontSize: 24, marginBottom: 16 }}>Need a Comprehensive Report?</h2>
//         <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 24 }}>
//           Download full PDF with summary, evidence, and roadmap.
//         </p>
//         <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
//           <button
//             style={{
//               padding: "12px 36px",
//               background: pdfLoading ? "rgba(0,200,150,0.4)" : "linear-gradient(135deg, #00C896, #0091DA)",
//               border: "none",
//               borderRadius: 14,
//               color: "white",
//               fontWeight: 600,
//               cursor: pdfLoading ? "not-allowed" : "pointer",
//               minWidth: 220,
//               boxShadow: "0 18px 36px rgba(0,145,218,0.24)",
//             }}
//             onClick={handleDownloadPDF}
//             disabled={pdfLoading}
//           >
//             {pdfLoading ? "Preparing PDF..." : "Download Full PDF Report"}
//           </button>
//           <button
//             style={{
//               padding: "12px 36px",
//               background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
//               border: "1px solid rgba(255,255,255,0.18)",
//               borderRadius: 14,
//               color: "rgba(255,255,255,0.85)",
//               cursor: "pointer",
//               boxShadow: "0 16px 34px rgba(0,0,0,0.14)",
//             }}
//             onClick={() => navigate("/dashboard")}
//           >
//             Back to Dashboard
//           </button>
//         </div>
//       </section>

//       {/* FOOTER */}
//       <footer style={{ textAlign: "center", padding: "40px 20px 60px", color: "rgba(255,255,255,0.34)", fontSize: 13, letterSpacing: "0.03em" }}>
//         Report ID: {r.report_id} · Auditable AI™ · KPMG Trusted AI Framework
//       </footer>

//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
//         @keyframes fadeIn { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:none } }
//         * { box-sizing:border-box; margin:0; padding:0; }
//       `}</style>
//     </div>
//   );
// }





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
  /** Populated by the new metrics_calculator pipeline — shows which library
   *  computed each metric and whether it succeeded. */
  computation_notes?: Record<string, ComputationNote>;
  /** Column validation warnings emitted at ingest time. */
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
  Transparency: "#00C8FF", Explainability: "#00E5A0", Fairness: "#FF6B9D",
  Accountability: "#FFB020", "Data Integrity": "#A78BFA", Reliability: "#34D399",
  Security: "#F87171", Privacy: "#60A5FA", Sustainability: "#4ADE80",
  "Safety": "#FBBF24"
};

const FW: Record<string, { label: string; icon: string; desc: string }> = {
  EU_AI_Act: { label: "EU AI Act", icon: "🇪🇺", desc: "European Union AI Regulation" },
  ISO_42001: { label: "ISO 42001", icon: "🏅", desc: "AI Management System Standard" },
  NIST_AI_RMF: { label: "NIST AI RMF", icon: "🏛️", desc: "AI Risk Management Framework" },
  KPMG_TAF: { label: "KPMG Trusted AI", icon: "🔷", desc: "Trusted AI Framework" },
};

const CC: Record<string, string> = {
  Compliant: "#00C896", "Certified Ready": "#00C896", Aligned: "#00C896",
  Conditional: "#ffb020", Assessed: "#60A5FA", Partial: "#ff4d4d"
};

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function band(score: number) {
  if (score >= 75) return "Strong";
  if (score >= 50) return "Watch";
  return "Critical";
}

function deriveSignals(report: ReportData) {
  const diagnostics = report.diagnostics || {
    missing_ratio: 0,
    duplicates: 0,
    schema_confidence: 0,
    total_columns: 0,
    text_columns: 0,
    numeric_columns: 0,
    column_names: [],
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
  const hasHalluc  = hasAny(["hallucination", "faithfulness", "groundedness"]);
  const hasRouge   = hasAny(["rouge", "bleu", "meteor", "bertscore"]);
  const hasOverride = hasAny(["human_override", "escalated", "manual_intervention", "human_review"]);
  const ioBonus    = hasInput && hasOutput ? 20 : (hasInput || hasOutput ? 10 : 0);
  const modelBonus = report.model_type === "classification" ? 80 : 60;

  return {
    diagnostics,
    logsCount,
    totalCols,
    textCols,
    numericCols,
    schemaScore,
    completeness,
    duplicatePenalty,
    volumeScore,
    columnDiversity,
    hasInput,
    hasOutput,
    hasLabel,
    hasTimestamp,
    hasUserId,
    hasScore,
    hasFeedback,
    hasSafety,
    hasPii,
    hasVersion,
    hasLatency,
    hasError,
    hasHalluc,
    hasRouge,
    hasOverride,
    ioBonus,
    modelBonus,
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

  // Dynamic fallback — derive insight from parameter name semantics
  const pLow = param.toLowerCase();
  const structGroups: [string[], string][] = [
    [["timestamp","audit log","version","session","user attribution"],
      "Structural metadata signal — based on presence of governance fields (timestamps, user IDs, model versions)."],
    [["pii","anonymi","data minim","retention"],
      "Privacy control signal — based on PII-related columns or data minimisation indicators."],
    [["safety","harm","override","escalat","incident"],
      "Safety signal — based on safety flagging, human override or incident-response columns."],
    [["injection","adversari","moderat","anomaly","input valid"],
      "Security signal — based on input validation, content moderation or adversarial robustness indicators."],
    [["faithfulness","hallucin","rouge","bleu","bert","coherence","abstractiv","coverage","density"],
      "NLP quality signal — computed from text content using semantic similarity or n-gram overlap metrics."],
    [["class balance","f1","precision","recall","roc","auc"],
      "Classification accuracy — computed using sklearn metrics against ground-truth labels."],
    [["latency","carbon","efficiency","token economy","compute"],
      "Performance & sustainability — based on inference latency or token economy measurements."],
    [["completeness","duplicate","schema","volume"],
      "Data integrity signal — derived from missing-value rate, duplicate count and schema confidence."],
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

  // Absolute fallback with actual score value
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
  // Larger canvas so labels have generous room on all sides
  const cx = 340, cy = 340, R = 200;
  const W = 680, H = 680;

  const ang = (i: number) => (Math.PI * 2 * i) / N - Math.PI / 2;

  const pt = (i: number, v: number) => ({
    x: cx + (v / 100) * R * Math.cos(ang(i)),
    y: cy + (v / 100) * R * Math.sin(ang(i)),
  });

  // Label position — further out with per-axis anchor adjustment
  const labelPos = (i: number) => {
    const LABEL_R = R + 72;
    const a = ang(i);
    const x = cx + LABEL_R * Math.cos(a);
    const y = cy + LABEL_R * Math.sin(a);
    // Horizontal anchor: left side → end, right side → start, top/bottom → middle
    const anchor =
      Math.cos(a) > 0.3 ? "start" :
      Math.cos(a) < -0.3 ? "end" : "middle";
    return { x, y, anchor };
  };

  const poly = keys.map((k, i) => pt(i, principles[k].score));
  const polyStr = poly.map(p => `${p.x},${p.y}`).join(" ");
  const avgScore = Math.round(Object.values(principles).reduce((s, v) => s + v.score, 0) / N);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", maxWidth: W, display: "block", margin: "0 auto" }}
    >
      {/* Background rings */}
      {[20, 40, 60, 80, 100].map(lvl => (
        <polygon
          key={lvl}
          points={keys.map((_, i) => { const p = pt(i, lvl); return `${p.x},${p.y}`; }).join(" ")}
          fill="none"
          stroke={lvl === 100 ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)"}
          strokeWidth={lvl === 100 ? 1.5 : 1}
        />
      ))}

      {/* Axis spokes */}
      {keys.map((_, i) => {
        const e = pt(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
      })}

      {/* Ring level labels — positioned along the top axis */}
      {[20, 40, 60, 80].map(lvl => {
        const p = pt(0, lvl);
        return (
          <text key={lvl} x={p.x + 6} y={p.y} fill="rgba(255,255,255,0.28)" fontSize="9.5" textAnchor="start" dominantBaseline="middle">
            {lvl}
          </text>
        );
      })}

      {/* Score polygon — filled area */}
      <polygon
        points={polyStr}
        fill="rgba(0,200,150,0.12)"
        stroke="none"
      />
      {/* Score polygon — border with glow */}
      <polygon
        points={polyStr}
        fill="none"
        stroke="rgba(0,200,150,0.7)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 0 6px rgba(0,200,150,0.4))" }}
      />

      {/* Data point dots */}
      {poly.map((p, i) => {
        const k = keys[i];
        const c = COLORS[k] || "#00C896";
        const sel = selected === k;
        return (
          <circle
            key={i}
            cx={p.x} cy={p.y}
            r={sel ? 12 : 6}
            fill={sel ? c : "rgba(0,200,150,0.8)"}
            stroke={sel ? "#fff" : c}
            strokeWidth={sel ? 3 : 1.5}
            style={{ cursor: "pointer", transition: "all 0.25s ease",
              filter: sel ? `drop-shadow(0 0 10px ${c})` : "none" }}
            onClick={() => onSelect(sel ? null : k)}
            onMouseEnter={() => onSelect(k)}
            onMouseLeave={() => { if (!sel) onSelect(null); }}
          />
        );
      })}

      {/* Axis labels with score — dynamically anchored */}
      {keys.map((k, i) => {
        const { x, y, anchor } = labelPos(i);
        const c = COLORS[k] || "#00C896";
        const sel = selected === k;
        const sc = principles[k].score;
        const parts = k.split(" ");
        const lineH = 15;
        const totalH = parts.length * lineH + 14;
        // Vertically center the label group
        const startY = y - totalH / 2 + lineH * 0.5;

        return (
          <g
            key={k}
            style={{ cursor: "pointer" }}
            onClick={() => onSelect(sel ? null : k)}
            onMouseEnter={() => onSelect(k)}
            onMouseLeave={() => { if (!sel) onSelect(null); }}
          >
            {parts.map((word, pi) => (
              <text
                key={pi}
                x={x} y={startY + pi * lineH}
                textAnchor={anchor}
                fill={sel ? c : "rgba(255,255,255,0.82)"}
                fontSize={sel ? "12.5" : "11"}
                fontWeight={sel ? "700" : "500"}
                fontFamily="'DM Sans',sans-serif"
                style={{ transition: "fill 0.2s, font-size 0.2s" }}
              >
                {word}
              </text>
            ))}
            {/* Score badge below label */}
            <text
              x={x} y={startY + parts.length * lineH + 3}
              textAnchor={anchor}
              fill={sel ? c : "rgba(255,255,255,0.5)"}
              fontSize="11"
              fontWeight="800"
              fontFamily="'DM Sans',sans-serif"
              style={{ transition: "fill 0.2s" }}
            >
              {sc}
            </text>
          </g>
        );
      })}

      {/* Centre badge */}
      <circle cx={cx} cy={cy} r={48} fill="rgba(4,17,31,0.85)" stroke="rgba(0,200,150,0.25)" strokeWidth="1.5" />
      <text x={cx} y={cy - 7} textAnchor="middle" fill="white" fontSize="30" fontWeight="900" fontFamily="'DM Sans',sans-serif">
        {avgScore}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.38)" fontSize="9" fontFamily="'DM Sans',sans-serif" letterSpacing="1.5">
        OVERALL
      </text>
    </svg>
  );
}

function ImprovedBarChart({ principles }: { principles: Record<string, Principle> }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const entries = Object.entries(principles).map(([name, data]) => ({
    name,
    score: data.score,
    color: COLORS[name] || "#00C896",
  }));

  return (
    <div style={{ padding: "20px 0", overflowX: "auto" }}>
      <ResponsiveContainer width="100%" height={Math.max(entries.length * 70 + 60, 260)}>
        <BarChart
          data={entries}
          layout="vertical"
          margin={{ top: 20, right: 50, left: 160, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="5 5" stroke="rgba(255,255,255,0.08)" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 500 }}
            width={150}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(0,200,150,0.1)" }}
            contentStyle={{
              background: "rgba(10,30,66,0.96)",
              border: "1px solid rgba(0,200,150,0.45)",
              borderRadius: 12,
              padding: "14px 18px",
              color: "white",
              boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
            }}
          />
          <Bar
            dataKey="score"
            radius={[0, 10, 10, 0]}
            barSize={28}
            animationDuration={1600}
            animationEasing="ease-out"
          >
            {entries.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`url(#grad-${index})`}
                style={{
                  transition: "all 0.35s ease",
                  filter: hovered === entry.name ? "brightness(1.3) drop-shadow(0 0 14px currentColor)" : "none",
                  transform: hovered === entry.name ? "scale(1.08)" : "scale(1)",
                  transformOrigin: "left center",
                }}
                onMouseEnter={() => setHovered(entry.name)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </Bar>
          <defs>
            {entries.map((entry, i) => (
              <linearGradient key={`grad-${i}`} id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                <stop offset="100%" stopColor={entry.color} stopOpacity={0.65} />
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
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={size * 0.09} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.09}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 1.4s ease" }}
        />
        <text x={size / 2} y={size / 2 + 6} textAnchor="middle" fill="white" fontSize={size * 0.24} fontWeight="900" fontFamily="'DM Sans',sans-serif">
          {score}
        </text>
      </svg>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 8, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export default function Report() {
  const location = useLocation();
  const navigate = useNavigate();
  const raw = location.state?.data;

  // ── Normalise: blackbox audit data → ReportData shape ─────────────────
  // When coming from the Profile "My Projects" click, the data is a
  // BlackBox audit record (keys: audit_id, category_scores, probe_results…).
  // When coming from Dashboard "Run Full Evaluation", it is already a
  // full ReportData record. We detect by presence of audit_id vs report_id.
  const r: ReportData = (() => {
    if (!raw) return null as any;

    // Already a full evaluation report — pass through unchanged
    if (raw.report_id || raw.trusted_ai_principles) return raw as ReportData;

    // ── It's a BlackBox audit record — map it ──────────────────────────
    const catScores: Record<string, number> = raw.category_scores || {};

    // Convert category_scores → trusted_ai_principles format
    const trusted_ai_principles: Record<string, { score: number; parameters: Record<string, number> }> = {};
    for (const [cat, score] of Object.entries(catScores)) {
      trusted_ai_principles[cat] = {
        score: score as number,
        parameters: { Score: score as number },
      };
    }

    // Map BlackBox findings to ReportData findings shape
    const findings = (raw.findings || []).map((f: any) => ({
      category:       f.category       || "Unknown",
      severity:       f.severity       || "Medium",
      issue:          f.issue          || f.note || "See probe response",
      recommendation: f.recommendation || "Review model behaviour",
    }));

    // Derive framework compliance from overall score
    const s = raw.overall_score || 0;
    const complianceStatus = s >= 75 ? "Compliant" : s >= 50 ? "Conditional" : "Partial";

    return {
      report_id:             raw.audit_id          || "N/A",
      ai_name:               raw.ai_name            || "External AI",
      model_type:            raw.mode               ? `BlackBox (${raw.mode.toUpperCase()})` : "BlackBox",
      evaluated_at:          raw.completed_at       || raw.created_at || new Date().toISOString(),
      overall_score:         raw.overall_score      || 0,
      risk_level:            raw.risk_level         || "Unknown",
      structural_risk:       raw.risk_level         || "Unknown",
      logs_evaluated:        raw.probes_run         || 0,
      data_quality_score:    raw.overall_score      || 0,
      trusted_ai_principles,
      diagnostics: {
        missing_ratio:     0,
        duplicates:        0,
        schema_confidence: 1,
        total_columns:     0,
        text_columns:      0,
        numeric_columns:   0,
        column_names:      [],
      },
      findings,
      recommendation:
        findings.length === 0
          ? "All governance probes passed. AI system aligns with Trusted AI principles."
          : `${findings.length} governance violation(s) detected. Review findings and recommendations.`,
      framework_compliance: {
        EU_AI_Act:   complianceStatus,
        ISO_42001:   complianceStatus,
        NIST_AI_RMF: complianceStatus,
        KPMG_TAF:    complianceStatus,
      },
    } as ReportData;
  })();
  const [sel, setSel] = useState<string | null>(null);
  const [hoveredParam, setHoveredParam] = useState<string | null>(null);
  const [anim, setAnim] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnim(true), 150);
  }, []);

  useEffect(() => {
    setHoveredParam(null);
  }, [sel]);

  if (!r) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#050d1a", gap: 20 }}>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 18 }}>No report data found.</p>
        <button
          style={{
            padding: "14px 32px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "white",
            borderRadius: 12,
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 600,
          }}
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const prn = r.trusted_ai_principles || {};
  const pkeys = Object.keys(prn);
  const hasPrn = pkeys.length > 0;
  const rc = r.risk_level === "Low" ? "#00C896" : r.risk_level === "Moderate" ? "#ffb020" : "#ff4d4d";
  const fmt = (d: string) => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const selData = sel ? prn[sel] : null;
  const selectedEntries = selData ? Object.entries(selData.parameters || {}) : [];
  const activeParam = hoveredParam && selData?.parameters?.[hoveredParam] !== undefined
    ? hoveredParam
    : (selData ? Object.keys(selData.parameters || {})[0] || null : null);
  const activeInsight = activeParam ? getParameterInsight(activeParam, r, selData) : null;
  const strongestParam = selectedEntries.length
    ? selectedEntries.reduce((best, entry) => ((entry[1] as number) > (best[1] as number) ? entry : best))
    : null;
  const weakestParam = selectedEntries.length
    ? selectedEntries.reduce((worst, entry) => ((entry[1] as number) < (worst[1] as number) ? entry : worst))
    : null;

  const fadeStyle = (delay: number): React.CSSProperties => ({
    opacity: anim ? 1 : 0,
    transform: anim ? "translateY(0)" : "translateY(24px)",
    transition: `all 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
  });

 const handleDownloadPDF = async () => {
  setPdfLoading(true);

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You need to be logged in to download reports. Redirecting to login...");
      navigate("/login");
      return;
    }

    if (!r.report_id) {
      alert("No report ID found. Please complete an evaluation first.");
      return;
    }

    const response = await fetch(`http://localhost:8000/reports/${r.report_id}/pdf`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/pdf",
      },
    });

    if (!response.ok) {
      let errorDetail = "Unknown error";
      try {
        const errJson = await response.json();
        errorDetail = errJson.detail || errorDetail;
      } catch {}
      throw new Error(`Download failed: ${response.status} - ${errorDetail}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `Audit_Report_${r.report_id || "Unknown"}_${new Date().toISOString().split("T")[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

  } catch (err: any) {
    console.error("PDF download error:", err);
    alert(err.message || "Failed to download PDF. Check if you're logged in and report exists.");
  } finally {
    setPdfLoading(false);
  }
};

  const S: Record<string, React.CSSProperties> = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(180deg, #04111f 0%, #071525 38%, #091a2e 100%)",
      fontFamily: "'DM Sans',sans-serif",
      color: "white",
      padding: "40px 20px 100px",
      position: "relative",
      overflowX: "hidden",
    },
    bg: {
      position: "fixed",
      inset: 0,
      zIndex: 0,
      pointerEvents: "none",
      background: "radial-gradient(ellipse 90% 60% at 15% 10%, rgba(0,145,218,0.18) 0%, transparent 60%), radial-gradient(ellipse 70% 50% at 85% 82%, rgba(0,200,150,0.16) 0%, transparent 62%), radial-gradient(circle at 50% 25%, rgba(255,255,255,0.05) 0%, transparent 30%)",
    },
    header: {
      position: "relative",
      zIndex: 1,
      padding: "32px 40px 24px",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      flexWrap: "wrap",
      gap: 20,
      background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
      backdropFilter: "blur(18px)",
      borderRadius: 28,
      boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
    },
    logo: {
      fontSize: 20,
      fontWeight: 900,
      background: "linear-gradient(135deg, #00C8FF, #00C896)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    kBadge: {
      fontSize: 11,
      padding: "3px 12px",
      background: "rgba(0,51,141,0.45)",
      border: "1px solid rgba(0,51,141,0.65)",
      borderRadius: 20,
      color: "#60A5FA",
    },
    title: {
      fontSize: 32,
      fontWeight: 900,
      color: "white",
      letterSpacing: "-0.02em",
      margin: "6px 0 10px",
    },
    meta: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "center",
      fontSize: 13,
      color: "rgba(255,255,255,0.55)",
    },
    dot: { color: "rgba(255,255,255,0.25)" },
    backBtn: {
      background: "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05))",
      border: "1px solid rgba(255,255,255,0.14)",
      color: "rgba(255,255,255,0.75)",
      padding: "10px 24px",
      borderRadius: 14,
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 600,
      transition: "all 0.3s",
      boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
    },
    heroRow: {
      position: "relative",
      zIndex: 1,
      display: "flex",
      gap: 24,
      padding: "32px 40px",
      alignItems: "stretch",
      flexWrap: "wrap",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    },
    heroScore: {
      textAlign: "center",
      padding: "32px 40px",
      background: "linear-gradient(160deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))",
      border: "2px solid",
      borderRadius: 26,
      minWidth: 200,
      flexShrink: 0,
      boxShadow: "0 20px 40px rgba(0,0,0,0.28)",
      backdropFilter: "blur(16px)",
    },
    riskPill: {
      display: "inline-block",
      padding: "5px 16px",
      borderRadius: 20,
      fontSize: 13,
      fontWeight: 700,
      marginTop: 12,
    },
    statsRow: {
      display: "flex",
      gap: 12,
      flexWrap: "wrap",
      flex: 1,
    },
    statCard: {
      flex: "1 1 130px",
      background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 18,
      padding: "18px 16px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      boxShadow: "0 16px 32px rgba(0,0,0,0.2)",
      backdropFilter: "blur(14px)",
    },
    sec: {
      position: "relative",
      zIndex: 1,
      margin: "32px 40px",
      background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))",
      border: "1px solid rgba(255,255,255,0.09)",
      borderRadius: 24,
      padding: "32px",
      boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
      backdropFilter: "blur(18px)",
      overflow: "hidden",
    },
    secTitle: {
      fontSize: 22,
      fontWeight: 800,
      color: "white",
      marginBottom: 10,
    },
    secSub: {
      fontSize: 13,
      color: "rgba(255,255,255,0.45)",
      marginBottom: 24,
      lineHeight: 1.5,
    },
    spiderWrap: {
      display: "flex",
      gap: 32,
      flexWrap: "wrap",
      alignItems: "flex-start",
      justifyContent: "center",
    },
    drillPanel: {
      flex: "1 1 320px",
      minHeight: 420,
      background: "linear-gradient(180deg, rgba(6,16,31,0.92), rgba(8,19,34,0.74))",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 22,
      padding: "26px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      boxShadow: "0 28px 70px rgba(0,0,0,0.28)",
      backdropFilter: "blur(18px)",
    },
    fwCard: {
      background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 18,
      padding: "18px",
      boxShadow: "0 16px 36px rgba(0,0,0,0.18)",
      backdropFilter: "blur(14px)",
      textAlign: "center",
    },
    fwPill: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 32,
      padding: "6px 12px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 700,
      marginTop: 8,
    },
    fwNote: {
      padding: "14px 16px",
      borderRadius: 16,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
    },
    diagCard: {
      background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 18,
      padding: "18px",
      textAlign: "center",
      boxShadow: "0 14px 32px rgba(0,0,0,0.18)",
      backdropFilter: "blur(14px)",
    },
  };

  return (
    <div style={S.page}>
      <div style={S.bg} />

      {/* HEADER */}
      <div style={{ ...S.header, ...fadeStyle(0) }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
            <span style={S.logo}>Auditable AI™</span>
            <span style={S.kBadge}>⬡ KPMG Trusted AI Framework</span>
          </div>
          <h1 style={S.title}>Governance Audit Report</h1>
          <div style={S.meta}>
            <span>📌 {r.ai_name}</span><span style={S.dot}> · </span>
            <span>🧠 {r.model_label || r.model_type}</span>
            {r.detection_confidence !== undefined && (
              <><span style={S.dot}> · </span><span style={{ color: r.detection_confidence >= 0.6 ? "#00C896" : "#ffb020" }}>
                {Math.round(r.detection_confidence * 100)}% detection confidence
              </span></>
            )}
            <span style={S.dot}> · </span>
            <span>📅 {fmt(r.evaluated_at)}</span><span style={S.dot}> · </span>
            <span style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              ID: {r.report_id?.slice(0, 12)}…
            </span>
          </div>
        </div>
        <button
          style={S.backBtn}
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>
      </div>

      {/* HERO SCORE */}
      <div style={{ ...S.heroRow, ...fadeStyle(0.1) }}>
        <div style={{ ...S.heroScore, borderColor: `${rc}55` }}>
          <div style={{ fontSize: 72, fontWeight: 900, color: rc, lineHeight: 1 }}>
            {r.overall_score}
          </div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", marginTop: 6 }}>/ 100</div>
          <div style={{ ...S.riskPill, background: `${rc}22`, border: `1px solid ${rc}66`, color: rc }}>
            {r.risk_level} Risk
          </div>
        </div>

        <div style={S.statsRow}>
          {[
            { icon: "📂", label: "Logs Evaluated", val: r.logs_evaluated },
            { icon: "📊", label: "Data Quality", val: `${r.data_quality_score}%` },
            { icon: "🏗️", label: "Structural Risk", val: r.structural_risk },
            { icon: "✅", label: "Principles Tested", val: pkeys.length },
            { icon: "⚠️", label: "Findings", val: r.findings?.length || 0 },
          ].map((s, i) => (
            <div key={i} style={S.statCard}>
              <span style={{ fontSize: 26 }}>{s.icon}</span>
              <div style={{ fontSize: 26, fontWeight: 900, color: "white" }}>{s.val}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* COLUMN WARNINGS */}
      {r.column_warnings && r.column_warnings.length > 0 && (
        <div style={{
          position: "relative", zIndex: 1,
          margin: "0 40px 8px",
          padding: "14px 20px",
          borderRadius: 16,
          background: "rgba(255,176,32,0.08)",
          border: "1px solid rgba(255,176,32,0.3)",
          display: "flex", flexDirection: "column", gap: 6,
          ...fadeStyle(0.12),
        }}>
          {r.column_warnings.map((w, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "#ffb020", lineHeight: 1.5 }}>
              <span style={{ flexShrink: 0 }}>⚠</span>
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* FRAMEWORK COMPLIANCE */}
      <section style={{ ...S.sec, ...fadeStyle(0.15) }}>
        <h2 style={S.secTitle}>🏛️ Regulatory & Framework Compliance</h2>
        <p style={S.secSub}>Assessment against major AI governance standards.</p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          {Object.entries(r.framework_compliance || {}).map(([key, status]) => {
            const fw = FW[key] || { label: key, icon: "📋", desc: "" };
            const sc = CC[status] || "#aaa";
            return (
              <div key={key} style={{ ...S.fwCard, borderColor: `${sc}55`, minWidth: 180 }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{fw.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "white" }}>{fw.label}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: "6px 0" }}>{fw.desc}</div>
                <div style={{ ...S.fwPill, background: `${sc}22`, border: `1px solid ${sc}66`, color: sc }}>
                  {status}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ ...S.fwNote, marginTop: 24, fontSize: 12 }}>
          <span style={{ opacity: 0.5 }}>ℹ️</span>
          <span style={{ marginLeft: 10, lineHeight: 1.6 }}>
            EU AI Act • ISO/IEC 42001:2023 • NIST AI RMF • KPMG Trusted AI Framework
          </span>
        </div>
      </section>

      {/* SIDE-BY-SIDE PRINCIPLES ASSESSMENT */}
      {hasPrn && (
        <section style={{ ...S.sec, ...fadeStyle(0.2), padding: "40px" }}>
          <h2 style={{ ...S.secTitle, fontSize: 26, marginBottom: 16 }}>🕸️ Trusted AI Principles Assessment</h2>
          <p style={{ ...S.secSub, marginBottom: 32 }}>Hover or click any principle to see sub-parameter details.</p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14,
            marginBottom: 28,
          }}>
            {[
              { label: "Average Principle Score", value: `${Math.round(Object.values(prn).reduce((sum, item) => sum + item.score, 0) / Math.max(pkeys.length, 1))}`, tone: "#00C896" },
              { label: "Strong Principles", value: `${Object.values(prn).filter(item => item.score >= 75).length}/${pkeys.length}`, tone: "#60A5FA" },
              { label: "Needs Attention", value: `${Object.values(prn).filter(item => item.score < 60).length}`, tone: "#FFB020" },
            ].map((item) => (
              <div key={item.label} style={{
                padding: "18px 18px 16px",
                borderRadius: 18,
                background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
                border: `1px solid ${item.tone}33`,
                boxShadow: "0 16px 34px rgba(0,0,0,0.16)",
              }}>
                <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.42)", marginBottom: 8 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: item.tone }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Spider Chart — full width */}
          <div style={{ width: "100%", maxWidth: 720, margin: "0 auto 36px" }}>
            <Spider principles={prn} onSelect={setSel} selected={sel} />
          </div>

          {/* Drill-down panel — full width below spider */}
          <div style={{ width: "100%" }}>
            <div style={{
              ...S.drillPanel,
              width: "100%",
              minHeight: "auto",
              alignItems: "stretch",
            }}>
              {!sel ? (
                <div style={{ width: "100%" }}>
                  <div style={{
                    fontSize: 12, color: "rgba(255,255,255,0.42)", textAlign: "center",
                    marginBottom: 20, padding: "10px 14px", borderRadius: 12,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                  }}>
                    Click any principle to inspect sub-parameters and formulas
                  </div>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: 10,
                  }}>
                    {pkeys.map(k => {
                      const c = COLORS[k] || "#00C896";
                      const sc = prn[k].score;
                      const scoreColor = sc >= 75 ? "#00C896" : sc >= 50 ? "#ffb020" : "#ff4d4d";
                      return (
                        <div
                          key={k}
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "14px 16px", borderRadius: 16,
                            background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
                            border: `1px solid ${c}28`,
                            cursor: "pointer", transition: "all 0.2s",
                          }}
                          onClick={() => setSel(k)}
                          onMouseEnter={e => (e.currentTarget.style.background = `linear-gradient(135deg, ${c}15, ${c}08)`)}
                          onMouseLeave={e => (e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))")}
                        >
                          <div style={{
                            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                            background: `${c}18`, border: `1px solid ${c}35`,
                            display: "grid", placeItems: "center", fontSize: 18,
                          }}>{ICONS[k]}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#EAF2FB", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{k}</div>
                            <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 99, marginTop: 7 }}>
                              <div style={{ width: `${sc}%`, height: "100%", background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}99)`, borderRadius: 99, transition: "width 0.8s ease" }} />
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: 20, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{sc}</div>
                            <div style={{ fontSize: 9, color: scoreColor, marginTop: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{band(sc)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : selData ? (
                <div style={{ width: "100%" }}>

                  {/* ── Principle header row ── */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 14, marginBottom: 20,
                    padding: "16px 18px", borderRadius: 18,
                    background: `linear-gradient(135deg, ${(COLORS[sel] || "#00C896")}18, rgba(255,255,255,0.04))`,
                    border: `1px solid ${(COLORS[sel] || "#00C896")}30`,
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                      display: "grid", placeItems: "center", fontSize: 24,
                      background: `${COLORS[sel] || "#00C896"}20`,
                      border: `1px solid ${(COLORS[sel] || "#00C896")}40`,
                    }}>{ICONS[sel]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 17, fontWeight: 700 }}>{sel}</div>
                      {selData.description && (
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 3, lineHeight: 1.5 }}>
                          {selData.description}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 34, fontWeight: 900, color: COLORS[sel] || "#00C896", lineHeight: 1 }}>{selData.score}</div>
                      <div style={{ fontSize: 10, color: COLORS[sel] || "#00C896", marginTop: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{band(selData.score)}</div>
                    </div>
                  </div>

                  {/* ── Summary stats row ── */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
                    {[
                      { label: "Parameters", val: Object.keys(selData.parameters).length, color: "#60A5FA" },
                      { label: "Strongest", val: strongestParam?.[0]?.split(" ")[0] || "—", sub: strongestParam?.[1] ?? "", color: "#00C896" },
                      { label: "Weakest",   val: weakestParam?.[0]?.split(" ")[0]   || "—", sub: weakestParam?.[1]   ?? "", color: "#ffb020" },
                    ].map((s) => (
                      <div key={s.label} style={{
                        padding: "12px 14px", borderRadius: 14,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        textAlign: "center",
                      }}>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{s.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
                        {s.sub !== undefined && s.sub !== "" && (
                          <div style={{ fontSize: 11, color: s.color, marginTop: 4, fontWeight: 700 }}>{s.sub}</div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* ── Side-by-side: parameter list (left) + insight panel (right) ── */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }}>

                    {/* Left: parameter list */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                        Sub-parameters — hover to inspect
                      </div>
                      {Object.entries(selData.parameters).map(([param, val]) => {
                        const v = val as number;
                        const c = COLORS[sel] || "#00C896";
                        const sc2 = v >= 75 ? "#00C896" : v >= 50 ? "#ffb020" : "#ff4d4d";
                        const isActive = activeParam === param;
                        return (
                          <div
                            key={param}
                            style={{
                              padding: "11px 13px",
                              borderRadius: 12,
                              background: isActive
                                ? `linear-gradient(135deg, ${c}20, ${c}08)`
                                : "rgba(255,255,255,0.03)",
                              border: isActive ? `1px solid ${c}55` : "1px solid rgba(255,255,255,0.06)",
                              cursor: "pointer",
                              transition: "all 0.18s ease",
                            }}
                            onMouseEnter={() => setHoveredParam(param)}
                            onMouseLeave={() => setHoveredParam(null)}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                              <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? "#EAF2FB" : "rgba(255,255,255,0.75)", lineHeight: 1.3 }}>{param}</span>
                              <span style={{ fontSize: 12, fontWeight: 800, color: sc2, flexShrink: 0, marginLeft: 8 }}>{v}</span>
                            </div>
                            <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 99 }}>
                              <div style={{
                                width: `${v}%`, height: "100%", borderRadius: 99,
                                background: `linear-gradient(90deg, ${sc2}, ${sc2}88)`,
                                transition: "width 0.5s ease",
                              }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Right: insight panel — updates on hover */}
                    <div style={{
                      position: "sticky",
                      top: 0,
                      padding: "18px",
                      borderRadius: 16,
                      background: "rgba(4,14,28,0.9)",
                      border: `1px solid ${(COLORS[sel] || "#00C896")}30`,
                      backdropFilter: "blur(12px)",
                      minHeight: 240,
                    }}>
                      {activeParam && activeInsight ? (
                        <>
                          {/* Score ring + name */}
                          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                            <Radial score={selData.parameters[activeParam] as number} label="" color={COLORS[sel] || "#00C896"} size={72} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: "#EAF2FB", lineHeight: 1.3, marginBottom: 4 }}>{activeParam}</div>
                              <div style={{
                                display: "inline-flex", alignItems: "center",
                                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                                color: (selData.parameters[activeParam] as number) >= 75 ? "#00C896" : (selData.parameters[activeParam] as number) >= 50 ? "#ffb020" : "#ff4d4d",
                                background: (selData.parameters[activeParam] as number) >= 75 ? "rgba(0,200,150,0.15)" : (selData.parameters[activeParam] as number) >= 50 ? "rgba(255,176,32,0.15)" : "rgba(255,77,77,0.15)",
                                border: `1px solid ${(selData.parameters[activeParam] as number) >= 75 ? "rgba(0,200,150,0.3)" : (selData.parameters[activeParam] as number) >= 50 ? "rgba(255,176,32,0.3)" : "rgba(255,77,77,0.3)"}`,
                                textTransform: "uppercase", letterSpacing: "0.06em",
                              }}>
                                {band(selData.parameters[activeParam] as number)} posture
                              </div>
                            </div>
                          </div>

                          {/* What this measures */}
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                              What this measures
                            </div>
                            <div style={{ fontSize: 12, lineHeight: 1.7, color: "rgba(255,255,255,0.72)" }}>
                              {activeInsight.detail}
                            </div>
                          </div>

                          {/* How it was calculated */}
                          <div style={{
                            padding: "11px 13px",
                            borderRadius: 12,
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.07)",
                          }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                              How it was calculated
                            </div>
                            <div style={{ fontSize: 12, lineHeight: 1.7, color: "rgba(255,255,255,0.65)", fontFamily: "monospace" }}>
                              {activeInsight.calculation}
                            </div>
                          </div>

                          {/* Improvement tip when score is low */}
                          {(selData.parameters[activeParam] as number) < 60 && (
                            <div style={{
                              marginTop: 12, padding: "10px 13px",
                              borderRadius: 12,
                              background: "rgba(255,176,32,0.07)",
                              border: "1px solid rgba(255,176,32,0.22)",
                            }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#ffb020", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
                                💡 How to improve
                              </div>
                              <div style={{ fontSize: 11, lineHeight: 1.65, color: "rgba(255,200,80,0.85)" }}>
                                {(selData.parameters[activeParam] as number) < 30
                                  ? `${activeParam} is critically low. Add the relevant data column to your logs to enable this signal.`
                                  : `${activeParam} is below the governance threshold. Enriching your dataset logs will improve this score.`}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 200, gap: 12, opacity: 0.5 }}>
                          <div style={{ fontSize: 28 }}>👆</div>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.6 }}>
                            Hover a parameter on the left to see what it measures and how it was calculated
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    style={{
                      marginTop: 20,
                      width: "100%",
                      padding: "11px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.6)",
                      borderRadius: 12,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "white"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)"; }}
                    onClick={() => setSel(null)}
                  >
                    ← All Principles
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      )}

      {/* BAR CHART */}
      {hasPrn && (
        <section style={{ ...S.sec, ...fadeStyle(0.25) }}>
          <h2 style={S.secTitle}>📊 Principle Score Distribution</h2>
          <p style={S.secSub}>Hover bars for details.</p>
          <ImprovedBarChart principles={prn} />
        </section>
      )}

      {/* MODEL-SPECIFIC METRICS */}
      {r.model_metrics && Object.values(r.model_metrics).some(m => m.value !== null) && (
        <section style={{ ...S.sec, ...fadeStyle(0.33) }}>
          <h2 style={S.secTitle}>🧪 Model-Specific Metrics</h2>
          <p style={S.secSub}>
            Measured metrics for <strong style={{ color: "#EAF2FB" }}>{r.model_label || r.model_type}</strong> — evaluated against model-appropriate thresholds.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {Object.entries(r.model_metrics)
              .filter(([, m]) => m.value !== null)
              .map(([key, m]) => {
                const rc2 = m.risk_level === "Low" ? "#00C896" : m.risk_level === "Moderate" ? "#ffb020" : "#ff4d4d";
                const displayVal = m.unit === "ms"
                  ? `${Math.round(m.value!)}ms`
                  : m.unit === "ratio" || m.unit === "score"
                    ? m.value!.toFixed(3)
                    : m.value!.toFixed(3);
                return (
                  <div key={key} style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))",
                    border: `1px solid ${rc2}44`,
                    borderRadius: 16, padding: "18px 16px",
                    display: "flex", flexDirection: "column", gap: 8,
                  }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {key.replace(/_/g, " ")}
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: rc2 }}>{displayVal}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: rc2, background: `${rc2}15`, border: `1px solid ${rc2}33`, padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
                        {m.risk_level}
                      </span>
                      {m.threshold_low !== undefined && (
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                          threshold: {m.threshold_low}{m.unit ? ` ${m.unit}` : ""}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{m.description}</div>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* COMPUTATION NOTES */}
      {r.computation_notes && Object.keys(r.computation_notes).filter(k => k !== "_error").length > 0 && (() => {
        const notes       = Object.entries(r.computation_notes!).filter(([k]) => k !== "_error");
        const computed    = notes.filter(([, n]) => n.status === "computed");
        const unavailable = notes.filter(([, n]) => n.status !== "computed");
        return (
          <section style={{ ...S.sec, ...fadeStyle(0.38) }}>
            <h2 style={S.secTitle}>🔬 Metric Computation Transparency</h2>
            <p style={S.secSub}>
              Every metric was computed directly from your <strong style={{ color: "#EAF2FB" }}>input/output</strong> data using
              real NLP/ML libraries — not pre-logged values. This section shows exactly how each metric was produced.
            </p>

            {/* Summary pills */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
              {[
                { label: "Computed", count: computed.length, color: "#00C896" },
                { label: "Unavailable", count: unavailable.length, color: "#ffb020" },
                { label: "Total Metrics", count: notes.length, color: "#60A5FA" },
              ].map(({ label, count, color }) => (
                <div key={label} style={{
                  padding: "12px 20px", borderRadius: 14,
                  background: `${color}10`, border: `1px solid ${color}33`,
                  textAlign: "center", minWidth: 120,
                }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color }}>{count}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            {unavailable.length > 0 && (
              <div style={{
                padding: "12px 16px", borderRadius: 14, marginBottom: 20,
                background: "rgba(255,176,32,0.08)", border: "1px solid rgba(255,176,32,0.25)",
                fontSize: 13, color: "#ffb020", lineHeight: 1.6,
              }}>
                💡 <strong>{unavailable.length}</strong> metric(s) couldn't be computed — add{" "}
                <code style={{ background: "rgba(255,176,32,0.15)", borderRadius: 4, padding: "1px 5px", fontSize: 11 }}>reference</code>,{" "}
                <code style={{ background: "rgba(255,176,32,0.15)", borderRadius: 4, padding: "1px 5px", fontSize: 11 }}>context</code>,{" "}
                <code style={{ background: "rgba(255,176,32,0.15)", borderRadius: 4, padding: "1px 5px", fontSize: 11 }}>label</code>, or{" "}
                <code style={{ background: "rgba(255,176,32,0.15)", borderRadius: 4, padding: "1px 5px", fontSize: 11 }}>confidence</code>{" "}
                columns to your dataset to enable them.
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {notes.map(([key, note]) => {
                const ok = note.status === "computed";
                const nc = ok ? "#00C896" : "#ffb020";
                return (
                  <div key={key} style={{
                    padding: "16px", borderRadius: 16,
                    background: ok ? "rgba(0,200,150,0.05)" : "rgba(255,176,32,0.04)",
                    border: `1px solid ${nc}33`,
                    display: "flex", flexDirection: "column", gap: 6,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#EAF2FB", textTransform: "capitalize" }}>
                        {key.replace(/_/g, " ")}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12,
                        color: nc, background: `${nc}15`, border: `1px solid ${nc}33`,
                      }}>
                        {ok ? "✓ computed" : "✗ unavailable"}
                      </span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: nc }}>
                      {note.value !== null ? note.value.toFixed(4) : "—"}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", lineHeight: 1.5 }}>
                      {note.library}
                    </div>
                  </div>
                );
              })}
            </div>

            {r.computation_notes!._error && (
              <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 12, color: "#ff8787" }}>
                ⚠ Computation error: {(r.computation_notes!._error as any)}
              </div>
            )}
          </section>
        );
      })()}

      {/* DIAGNOSTICS */}
      <section style={{ ...S.sec, ...fadeStyle(0.35) }}>
        <h2 style={S.secTitle}>🔬 Dataset Diagnostics</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
          {[
            { icon: "❌", label: "Missing Ratio", val: `${(r.diagnostics.missing_ratio * 100).toFixed(1)}%`, c: r.diagnostics.missing_ratio < 0.1 ? "#00C896" : "#ff4d4d" },
            { icon: "🔁", label: "Duplicates", val: r.diagnostics.duplicates, c: r.diagnostics.duplicates === 0 ? "#00C896" : "#ffb020" },
            { icon: "🧩", label: "Schema Confidence", val: `${Math.round(r.diagnostics.schema_confidence * 100)}%`, c: "#60A5FA" },
            { icon: "📐", label: "Total Columns", val: r.diagnostics.total_columns, c: "#A78BFA" },
            { icon: "📝", label: "Text Columns", val: r.diagnostics.text_columns, c: "#00E5A0" },
            { icon: "🔢", label: "Numeric Columns", val: r.diagnostics.numeric_columns, c: "#FBBF24" },
          ].map((d, i) => (
            <div key={i} style={{ ...S.diagCard, borderColor: `${d.c}44` }}>
              <span style={{ fontSize: 26 }}>{d.icon}</span>
              <div style={{ fontSize: 22, fontWeight: 800, color: d.c }}>{d.val}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{d.label}</div>
            </div>
          ))}
        </div>
        {r.diagnostics.column_names?.length > 0 && (
          <div style={{ marginTop: 24, padding: "18px", background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))", borderRadius: 18, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Detected columns:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {r.diagnostics.column_names.map((col, i) => (
                <span key={i} style={{ padding: "6px 12px", background: "rgba(255,255,255,0.06)", borderRadius: 999, fontSize: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
                  {col}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* FINDINGS */}
      <section style={{ ...S.sec, ...fadeStyle(0.4) }}>
        <h2 style={S.secTitle}>
          ⚠️ Audit Findings {(r.findings?.length || 0) > 0 && <span style={{ color: "#ff4d4d", fontWeight: 700 }}>({r.findings.length})</span>}
        </h2>
        {!r.findings?.length ? (
          <div style={{ padding: 24, background: "linear-gradient(180deg, rgba(0,200,150,0.16), rgba(0,200,150,0.06))", border: "1px solid rgba(0,200,150,0.28)", borderRadius: 18, color: "#00C896", boxShadow: "0 18px 38px rgba(0,0,0,0.14)" }}>
            ✅ No critical findings. Dataset aligns well with standards.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {r.findings.map((f, i) => {
              const sc = f.severity === "High" ? "#ff4d4d" : f.severity === "Medium" ? "#ffb020" : "#00C896";
              return (
                <div key={i} style={{ background: `radial-gradient(circle at top right, ${sc}12, transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))`, border: `1px solid ${sc}33`, borderRadius: 18, padding: 20, boxShadow: "0 18px 38px rgba(0,0,0,0.14)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: COLORS[f.category] || "white", fontWeight: 600 }}>
                      {ICONS[f.category] || "•"} {f.category}
                    </span>
                    <span style={{ color: sc, fontWeight: 700, background: `${sc}15`, border: `1px solid ${sc}33`, padding: "5px 10px", borderRadius: 999, fontSize: 12 }}>{f.severity}</span>
                  </div>
                  <p style={{ margin: "8px 0", color: "rgba(255,255,255,0.85)" }}>{f.issue}</p>
                  <p style={{ color: "rgba(255,255,255,0.62)", fontStyle: "italic", lineHeight: 1.6 }}>💡 {f.recommendation}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* RECOMMENDATION */}
      {r.recommendation && (
        <section style={{ ...S.sec, ...fadeStyle(0.45) }}>
          <h2 style={S.secTitle}>📌 Overall Recommendation</h2>
          <div style={{ padding: 22, background: "linear-gradient(180deg, rgba(255,176,32,0.14), rgba(255,176,32,0.05))", border: "1px solid rgba(255,176,32,0.25)", borderRadius: 18, boxShadow: "0 18px 36px rgba(0,0,0,0.14)" }}>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>{r.recommendation}</p>
          </div>
        </section>
      )}

      {/* PDF DOWNLOAD SECTION */}
      <section style={{ ...S.sec, ...fadeStyle(0.5), textAlign: "center", background: "radial-gradient(circle at top center, rgba(0,145,218,0.12), transparent 38%), linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))" }}>
        <h2 style={{ fontSize: 24, marginBottom: 16 }}>Need a Comprehensive Report?</h2>
        <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 24 }}>
          Download full PDF with summary, evidence, and roadmap.
        </p>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            style={{
              padding: "12px 36px",
              background: pdfLoading ? "rgba(0,200,150,0.4)" : "linear-gradient(135deg, #00C896, #0091DA)",
              border: "none",
              borderRadius: 14,
              color: "white",
              fontWeight: 600,
              cursor: pdfLoading ? "not-allowed" : "pointer",
              minWidth: 220,
              boxShadow: "0 18px 36px rgba(0,145,218,0.24)",
            }}
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
          >
            {pdfLoading ? "Preparing PDF..." : "Download Full PDF Report"}
          </button>
          <button
            style={{
              padding: "12px 36px",
              background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 14,
              color: "rgba(255,255,255,0.85)",
              cursor: "pointer",
              boxShadow: "0 16px 34px rgba(0,0,0,0.14)",
            }}
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ textAlign: "center", padding: "40px 20px 60px", color: "rgba(255,255,255,0.34)", fontSize: 13, letterSpacing: "0.03em" }}>
        Report ID: {r.report_id} · Auditable AI™ · KPMG Trusted AI Framework
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeIn { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:none } }
        * { box-sizing:border-box; margin:0; padding:0; }
      `}</style>
    </div>
  );
}