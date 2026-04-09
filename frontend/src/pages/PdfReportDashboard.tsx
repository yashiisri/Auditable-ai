// import { useState } from "react";
// import { useNavigate } from "react-router-dom";

// interface PdfFinding {
//   category: string;
//   severity: string;
//   issue: string;
//   recommendation: string;
// }

// interface PdfReport {
//   ai_name?: string;
//   overall_score?: number;
//   risk_level?: string;
//   model_type?: string;
//   evaluated_at?: string;
//   findings?: PdfFinding[];
//   framework_compliance?: Record<string, string>;
//   trusted_ai_principles?: Record<string, { score: number }>;
//   recommendation?: string;
//   source: "pdf_upload";
// }

// const KPMG = "#00338D";
// const KPMG_MID = "#005EB8";
// const KPMG_LT = "#0091DA";

// function bandColor(s: number) { return s >= 75 ? "#059669" : s >= 50 ? KPMG_MID : "#DC2626"; }
// function bandBg(s: number) { return s >= 75 ? "#DCFCE7" : s >= 50 ? "#E6F2FB" : "#FEE2E2"; }
// function band(s: number) { return s >= 75 ? "Strong" : s >= 50 ? "Watch" : "Critical"; }

// export default function PdfReportDashboard() {
//   const navigate = useNavigate();
//   const [file, setFile] = useState<File | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [report, setReport] = useState<PdfReport | null>(null);
//   const [dragOver, setDragOver] = useState(false);

//   const handleFile = (f: File) => {
//     if (!f.name.endsWith(".pdf") && !f.name.endsWith(".json")) {
//       setError("Please upload a PDF or JSON report file.");
//       return;
//     }
//     setFile(f);
//     setError("");
//   };

//   const handleParse = async () => {
//     if (!file) return;
//     setLoading(true);
//     setError("");

//     try {
//       if (file.name.endsWith(".json")) {
//         const text = await file.text();
//         const data = JSON.parse(text);
//         setReport({ ...data, source: "pdf_upload" });
//       } else {
//         // PDF: extract basic metadata from filename and show structured view
//         // In production this would call a backend PDF parser
//         const mockReport: PdfReport = {
//           ai_name: file.name.replace(".pdf", "").replace(/_/g, " "),
//           overall_score: undefined,
//           risk_level: "Unknown",
//           model_type: "Uploaded Report",
//           evaluated_at: new Date().toISOString(),
//           findings: [],
//           framework_compliance: {},
//           trusted_ai_principles: {},
//           recommendation: "PDF parsing requires backend processing. Upload a JSON report for full dashboard view, or use the platform's built-in audit tools to generate a structured report.",
//           source: "pdf_upload",
//         };
//         setReport(mockReport);
//       }
//     } catch {
//       setError("Could not parse the file. Ensure it is a valid JSON report or PDF.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const prn = report?.trusted_ai_principles || {};
//   const pkeys = Object.keys(prn);

//   return (
//     <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1E293B", paddingBottom: 80 }}>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
//         * { box-sizing: border-box; margin: 0; padding: 0; }
//         .card { background: white; border-radius: 20px; border: 1px solid #E2E8F0; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
//         .hover-lift { transition: transform 0.2s, box-shadow 0.2s; }
//         .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important; }
//       `}</style>

//       {/* NAV */}
//       <div style={{ background: "white", borderBottom: "1px solid #E2E8F0", padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, boxShadow: "0 1px 8px rgba(0,0,0,0.06)", position: "sticky", top: 0, zIndex: 100 }}>
//         <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
//           <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.03em", background: `linear-gradient(135deg, ${KPMG}, ${KPMG_MID})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Auditable AI™</span>
//           <div style={{ width: 1, height: 20, background: "#E2E8F0" }} />
//           <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", background: "#E6F2FB", color: KPMG_MID, borderRadius: 20, border: `1px solid ${KPMG_LT}40` }}>PDF Report Dashboard</span>
//         </div>
//         <button style={{ padding: "8px 20px", background: "white", border: "1px solid #E2E8F0", color: "#64748B", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
//           onClick={() => navigate("/dashboard")}>← Dashboard</button>
//       </div>

//       <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

//         {/* UPLOAD CARD */}
//         {!report && (
//           <div className="card" style={{ padding: "48px", textAlign: "center", marginBottom: 24 }}>
//             <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
//             <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1E293B", marginBottom: 8 }}>Upload Audit Report</h1>
//             <p style={{ color: "#64748B", fontSize: 14, marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
//               Upload a JSON report generated by this platform, or a PDF audit report. JSON files will render a full interactive dashboard.
//             </p>

//             <div
//               onDragOver={e => { e.preventDefault(); setDragOver(true); }}
//               onDragLeave={() => setDragOver(false)}
//               onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
//               style={{
//                 border: `2px dashed ${dragOver ? KPMG_MID : "#E2E8F0"}`,
//                 borderRadius: 16, padding: "40px 24px", marginBottom: 20,
//                 background: dragOver ? "#E6F2FB" : "#F8FAFC",
//                 transition: "all 0.2s", cursor: "pointer",
//               }}
//               onClick={() => document.getElementById("pdf-file-input")?.click()}
//             >
//               <div style={{ fontSize: 32, marginBottom: 10 }}>⬆</div>
//               <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
//                 {file ? file.name : "Drop your report here or click to browse"}
//               </div>
//               <div style={{ fontSize: 12, color: "#94A3B8" }}>Supports .json and .pdf</div>
//               <input id="pdf-file-input" type="file" accept=".pdf,.json" style={{ display: "none" }}
//                 onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
//             </div>

//             {error && <div style={{ padding: "10px 16px", background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 10, color: "#DC2626", fontSize: 13, marginBottom: 16 }}>{error}</div>}

//             <button
//               disabled={!file || loading}
//               onClick={handleParse}
//               style={{ padding: "14px 40px", background: `linear-gradient(135deg, ${KPMG}, ${KPMG_MID})`, border: "none", borderRadius: 12, color: "white", fontWeight: 700, fontSize: 15, cursor: file ? "pointer" : "not-allowed", opacity: file ? 1 : 0.5, boxShadow: `0 6px 20px ${KPMG}30`, transition: "all 0.2s" }}
//             >
//               {loading ? "Parsing…" : "Load Report →"}
//             </button>
//           </div>
//         )}

//         {/* REPORT DASHBOARD */}
//         {report && (
//           <>
//             {/* HEADER */}
//             <div className="card" style={{ padding: "32px 36px", marginBottom: 24, background: `linear-gradient(135deg, ${KPMG} 0%, ${KPMG_MID} 50%, ${KPMG_LT} 100%)`, border: "none", color: "white" }}>
//               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 24 }}>
//                 <div>
//                   <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>Uploaded Report</div>
//                   <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", marginBottom: 10 }}>{report.ai_name || "Audit Report"}</h1>
//                   <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
//                     {report.model_type && <span>🧠 {report.model_type}</span>}
//                     {report.evaluated_at && <span>📅 {new Date(report.evaluated_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>}
//                     <span>📄 {file?.name}</span>
//                   </div>
//                 </div>
//                 {report.overall_score !== undefined && (
//                   <div style={{ textAlign: "center" }}>
//                     <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1, color: "white", letterSpacing: "-0.04em" }}>{report.overall_score}</div>
//                     <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>/ 100 Overall</div>
//                     {report.risk_level && (
//                       <div style={{ marginTop: 10, display: "inline-block", padding: "5px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: bandBg(report.overall_score), color: bandColor(report.overall_score), border: `1px solid ${bandColor(report.overall_score)}40` }}>
//                         {report.risk_level} Risk
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* PRINCIPLES */}
//             {pkeys.length > 0 && (
//               <div className="card" style={{ padding: "32px", marginBottom: 24 }}>
//                 <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Trusted AI Principles</h2>
//                 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
//                   {pkeys.map(k => {
//                     const sc = prn[k].score;
//                     return (
//                       <div key={k} className="hover-lift" style={{ padding: "16px", borderRadius: 14, background: bandBg(sc), border: `1px solid ${bandColor(sc)}20` }}>
//                         <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 8 }}>{k}</div>
//                         <div style={{ height: 6, background: "#E2E8F0", borderRadius: 99, marginBottom: 8 }}>
//                           <div style={{ width: `${sc}%`, height: "100%", background: bandColor(sc), borderRadius: 99 }} />
//                         </div>
//                         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                           <span style={{ fontSize: 22, fontWeight: 900, color: bandColor(sc) }}>{sc}</span>
//                           <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "white", color: bandColor(sc), border: `1px solid ${bandColor(sc)}30`, textTransform: "uppercase" }}>{band(sc)}</span>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             )}

//             {/* FRAMEWORK COMPLIANCE */}
//             {Object.keys(report.framework_compliance || {}).length > 0 && (
//               <div className="card" style={{ padding: "32px", marginBottom: 24 }}>
//                 <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Framework Compliance</h2>
//                 <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
//                   {Object.entries(report.framework_compliance!).map(([key, status]) => {
//                     const sc = status === "Compliant" || status === "Certified Ready" || status === "Aligned" ? "#059669" : status === "Conditional" ? KPMG_MID : "#DC2626";
//                     const scBg = sc === "#059669" ? "#DCFCE7" : sc === KPMG_MID ? "#E6F2FB" : "#FEE2E2";
//                     return (
//                       <div key={key} className="hover-lift" style={{ padding: "16px 20px", borderRadius: 14, background: scBg, border: `1px solid ${sc}25`, minWidth: 160, textAlign: "center" }}>
//                         <div style={{ fontWeight: 700, fontSize: 13, color: "#1E293B", marginBottom: 6 }}>{key.replace(/_/g, " ")}</div>
//                         <div style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: sc, background: "white", border: `1px solid ${sc}40` }}>{status}</div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             )}

//             {/* FINDINGS */}
//             {(report.findings?.length || 0) > 0 && (
//               <div className="card" style={{ padding: "32px", marginBottom: 24 }}>
//                 <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Audit Findings <span style={{ fontSize: 16, fontWeight: 700, color: "#DC2626", background: "#FEE2E2", padding: "2px 10px", borderRadius: 20, marginLeft: 8 }}>{report.findings!.length}</span></h2>
//                 <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
//                   {report.findings!.map((f, i) => {
//                     const sc = f.severity === "High" ? "#DC2626" : f.severity === "Medium" ? KPMG_MID : "#059669";
//                     const scBg = f.severity === "High" ? "#FEE2E2" : f.severity === "Medium" ? "#E6F2FB" : "#DCFCE7";
//                     return (
//                       <div key={i} style={{ borderRadius: 14, background: "white", border: `1.5px solid ${sc}20`, overflow: "hidden" }}>
//                         <div style={{ padding: "12px 18px", background: scBg, borderBottom: `1px solid ${sc}15`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                           <span style={{ fontWeight: 700, fontSize: 13, color: "#1E293B" }}>{f.category}</span>
//                           <span style={{ color: sc, fontWeight: 700, background: "white", padding: "3px 12px", borderRadius: 20, fontSize: 11, border: `1px solid ${sc}30` }}>{f.severity}</span>
//                         </div>
//                         <div style={{ padding: "14px 18px" }}>
//                           <p style={{ margin: "0 0 10px", color: "#1E293B", fontSize: 13, lineHeight: 1.6 }}>{f.issue}</p>
//                           <div style={{ padding: "10px 14px", borderRadius: 8, background: "#E6F2FB", border: `1px solid ${KPMG_LT}30` }}>
//                             <div style={{ fontSize: 10, fontWeight: 700, color: KPMG_MID, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Recommendation</div>
//                             <p style={{ margin: 0, color: KPMG, fontSize: 12, lineHeight: 1.6 }}>{f.recommendation}</p>
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             )}

//             {/* RECOMMENDATION */}
//             {report.recommendation && (
//               <div className="card" style={{ padding: "32px", marginBottom: 24 }}>
//                 <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Overall Recommendation</h2>
//                 <div style={{ padding: "18px 22px", background: `linear-gradient(135deg, ${KPMG}08, ${KPMG_MID}05)`, border: `1.5px solid ${KPMG_MID}25`, borderRadius: 14 }}>
//                   <p style={{ margin: 0, color: "#1E293B", lineHeight: 1.8, fontSize: 14 }}>{report.recommendation}</p>
//                 </div>
//               </div>
//             )}

//             {/* ACTIONS */}
//             <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
//               <button onClick={() => { setReport(null); setFile(null); }}
//                 style={{ padding: "12px 28px", background: "white", border: "1.5px solid #E2E8F0", borderRadius: 12, color: "#374151", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
//                 Upload Another Report
//               </button>
//               <button onClick={() => navigate("/dashboard")}
//                 style={{ padding: "12px 28px", background: `linear-gradient(135deg, ${KPMG}, ${KPMG_MID})`, border: "none", borderRadius: 12, color: "white", cursor: "pointer", fontSize: 14, fontWeight: 700, boxShadow: `0 6px 20px ${KPMG}30` }}>
//                 ← Back to Dashboard
//               </button>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }




/**
 * PdfReportDashboard.tsx
 * ========================
 * Report Audit Module — uploads an existing AI audit report (PDF or JSON)
 * to the backend, which uses Groq LLM to cross-evaluate it against the
 * KPMG Trusted AI Framework and returns a full gap analysis.
 */

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ── Types ────────────────────────────────────────────────────────────────────

interface PrincipleCoverage {
  status:         "covered" | "partial" | "not_covered";
  coverage_score: number;
  evidence:       string;
  gaps:           string[];
  recommendation: string;
}

interface RegulatoryGap {
  mentioned:           boolean;
  articles_referenced: string[];
  missing_controls:    string[];
  compliance_estimate: "Compliant" | "Conditional" | "Non-Compliant" | "Unknown";
}

interface Finding {
  principle:      string;
  severity:       "Critical" | "High" | "Medium" | "Low";
  issue:          string;
  recommendation: string;
}

interface AuditResult {
  file_name:               string;
  file_type:               "pdf" | "json";
  audit_completeness_score: number;
  overall_assessment:      string;
  extracted: {
    ai_name?:            string | null;
    model_type?:         string | null;
    overall_score?:      number | null;
    risk_level?:         string | null;
    evaluated_at?:       string | null;
    frameworks_mentioned?: string[];
  };
  principle_coverage: Record<string, PrincipleCoverage>;
  regulatory_gaps:    Record<string, RegulatoryGap>;
  top_findings:       Finding[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const KPMG     = "#00338D";
const KPMG_MID = "#005EB8";
const KPMG_LT  = "#0091DA";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const PRINCIPLES = [
  "Fairness", "Transparency", "Explainability", "Accountability",
  "Data Integrity", "Reliability", "Security", "Safety", "Privacy", "Sustainability",
];

const PRINCIPLE_ICONS: Record<string, string> = {
  Fairness:       "⚖️", Transparency:  "🔍", Explainability: "💡",
  Accountability: "📋", "Data Integrity": "🛡️", Reliability: "⚙️",
  Security:       "🔒", Safety:        "🦺", Privacy:       "🔐",
  Sustainability: "🌱",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(s: number)  { return s >= 75 ? "#059669" : s >= 50 ? KPMG_MID : s >= 25 ? "#D97706" : "#DC2626"; }
function scoreBg(s: number)     { return s >= 75 ? "#DCFCE7" : s >= 50 ? "#EFF6FF" : s >= 25 ? "#FEF3C7" : "#FEE2E2"; }
function scoreLabel(s: number)  { return s >= 75 ? "Good"    : s >= 50 ? "Partial" : s >= 25 ? "Weak"   : "Missing"; }

function statusColor(st: string) {
  if (st === "covered")     return "#059669";
  if (st === "partial")     return "#D97706";
  return "#DC2626";
}
function statusLabel(st: string) {
  if (st === "covered")     return "Covered";
  if (st === "partial")     return "Partial";
  return "Not Covered";
}
function statusBg(st: string) {
  if (st === "covered")     return "#DCFCE7";
  if (st === "partial")     return "#FEF3C7";
  return "#FEE2E2";
}

function severityColor(s: string) {
  if (s === "Critical") return "#7F1D1D";
  if (s === "High")     return "#DC2626";
  if (s === "Medium")   return "#D97706";
  return KPMG_MID;
}
function severityBg(s: string) {
  if (s === "Critical") return "#FEE2E2";
  if (s === "High")     return "#FEE2E2";
  if (s === "Medium")   return "#FEF3C7";
  return "#EFF6FF";
}

function complianceColor(s: string) {
  if (s === "Compliant")    return "#059669";
  if (s === "Conditional")  return "#D97706";
  if (s === "Non-Compliant") return "#DC2626";
  return "#64748B";
}
function complianceBg(s: string) {
  if (s === "Compliant")    return "#DCFCE7";
  if (s === "Conditional")  return "#FEF3C7";
  if (s === "Non-Compliant") return "#FEE2E2";
  return "#F1F5F9";
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ScoreRing({ score, size = 90 }: { score: number; size?: number }) {
  const r     = (size / 2) - 8;
  const circ  = 2 * Math.PI * r;
  const dash  = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={8} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x={size/2} y={size/2 + 2} textAnchor="middle" dominantBaseline="middle"
        style={{ transform: "rotate(90deg)", transformOrigin: `${size/2}px ${size/2}px`,
          fill: color, fontSize: size * 0.22, fontWeight: 900, fontFamily: "inherit" }}>
        {score}
      </text>
    </svg>
  );
}

function PrincipleCard({ name, data }: { name: string; data: PrincipleCoverage }) {
  const [expanded, setExpanded] = useState(false);
  const col = statusColor(data.status);
  const bg  = statusBg(data.status);
  return (
    <div style={{
      borderRadius: 16, border: `1.5px solid ${col}25`, background: "white",
      overflow: "hidden", transition: "box-shadow 0.2s",
      boxShadow: expanded ? "0 8px 24px rgba(0,0,0,0.10)" : "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          padding: "14px 18px", background: bg, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10,
          borderBottom: expanded ? `1px solid ${col}20` : "none",
        }}
      >
        <span style={{ fontSize: 20 }}>{PRINCIPLE_ICONS[name]}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: "#1E293B" }}>{name}</div>
          <div style={{ marginTop: 4, height: 5, background: "#E2E8F0", borderRadius: 99 }}>
            <div style={{
              width: `${data.coverage_score}%`, height: "100%",
              background: scoreColor(data.coverage_score), borderRadius: 99,
              transition: "width 0.8s ease",
            }} />
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: col, lineHeight: 1 }}>{data.coverage_score}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: col, letterSpacing: "0.05em" }}>
            {statusLabel(data.status).toUpperCase()}
          </div>
        </div>
        <div style={{ color: "#94A3B8", fontSize: 14, transition: "transform 0.2s",
          transform: expanded ? "rotate(180deg)" : "none" }}>▼</div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          {data.evidence && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase",
                letterSpacing: "0.08em", marginBottom: 5 }}>What the report says</div>
              <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.7,
                padding: "10px 14px", background: "#F8FAFC", borderRadius: 10,
                border: "1px solid #E2E8F0" }}>{data.evidence}</p>
            </div>
          )}
          {data.gaps.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", textTransform: "uppercase",
                letterSpacing: "0.08em", marginBottom: 5 }}>Gaps identified</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {data.gaps.map((g, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start",
                    fontSize: 12.5, color: "#374151", lineHeight: 1.6 }}>
                    <span style={{ color: "#DC2626", flexShrink: 0, marginTop: 2 }}>✕</span>
                    <span>{g}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.recommendation && (
            <div style={{ padding: "10px 14px", background: "#EFF6FF", borderRadius: 10,
              border: `1px solid ${KPMG_LT}40` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: KPMG_MID, textTransform: "uppercase",
                letterSpacing: "0.08em", marginBottom: 4 }}>Recommendation</div>
              <p style={{ margin: 0, fontSize: 12.5, color: KPMG, lineHeight: 1.7 }}>{data.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PdfReportDashboard() {
  const navigate    = useNavigate();
  const fileInput   = useRef<HTMLInputElement>(null);
  const [file, setFile]       = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError]     = useState("");
  const [result, setResult]   = useState<AuditResult | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "principles" | "compliance" | "findings">("overview");

  const handleFile = (f: File) => {
    const ok = f.name.endsWith(".pdf") || f.name.endsWith(".json");
    if (!ok) { setError("Only PDF and JSON files are accepted."); return; }
    setFile(f);
    setError("");
  };

  const handleAnalyse = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setProgress("Uploading report…");

    try {
      const formData = new FormData();
      formData.append("file", file);

      setProgress("Extracting content…");
      const res = await fetch(`${API_URL}/audit/report`, {
        method: "POST",
        body: formData,
      });

      setProgress("Running TAF gap analysis…");

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(err.detail || `Server error ${res.status}`);
      }

      const data: AuditResult = await res.json();
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  // ── Score summary stats ─────────────────────────────────────────────────
  const principleScores = result
    ? PRINCIPLES.map(p => result.principle_coverage[p]?.coverage_score ?? 0)
    : [];
  const avgCoverage = principleScores.length
    ? Math.round(principleScores.reduce((a, b) => a + b, 0) / principleScores.length)
    : 0;
  const coveredCount   = result ? Object.values(result.principle_coverage).filter(p => p.status === "covered").length  : 0;
  const partialCount   = result ? Object.values(result.principle_coverage).filter(p => p.status === "partial").length  : 0;
  const missingCount   = result ? Object.values(result.principle_coverage).filter(p => p.status === "not_covered").length : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9",
      fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif", color: "#1E293B" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .card { background: white; border-radius: 20px; border: 1px solid #E2E8F0;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .tab-btn { padding: 8px 20px; border: none; border-radius: 10px; cursor: pointer;
          font-size: 13px; font-weight: 600; font-family: inherit; transition: all 0.2s; }
        .tab-active { background: ${KPMG}; color: white; }
        .tab-inactive { background: white; color: #64748B; border: 1px solid #E2E8F0; }
        .tab-inactive:hover { background: #F8FAFC; color: ${KPMG}; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease; }
      `}</style>

      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <div style={{ background: "white", borderBottom: "1px solid #E2E8F0", padding: "0 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between", height: 64,
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.03em",
            background: `linear-gradient(135deg, ${KPMG}, ${KPMG_MID})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Auditable AI™
          </span>
          <div style={{ width: 1, height: 20, background: "#E2E8F0" }} />
          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", background: "#EFF6FF",
            color: KPMG_MID, borderRadius: 20, border: `1px solid ${KPMG_LT}40` }}>
            Report Audit Module
          </span>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          style={{ padding: "8px 20px", background: "white", border: "1px solid #E2E8F0",
            color: "#64748B", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          ← Dashboard
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 64px" }}>

        {/* ── Upload view ─────────────────────────────────────────────────── */}
        {!result && (
          <div className="fade-in">
            {/* Hero */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>📋</div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1E293B", marginBottom: 10,
                letterSpacing: "-0.02em" }}>
                Report Audit Module
              </h1>
              <p style={{ color: "#64748B", fontSize: 15, maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
                Upload any existing AI audit report — PDF or JSON — and our LLM-powered engine
                will cross-evaluate it against all 10 KPMG Trusted AI Framework principles,
                identify gaps, and generate actionable recommendations.
              </p>
            </div>

            {/* What we check */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
              {[
                { icon: "🔍", title: "TAF Coverage Analysis", desc: "Maps report claims to all 10 KPMG TAF principles and scores each one." },
                { icon: "⚠️", title: "Gap Identification",    desc: "Flags missing or incomplete governance coverage with severity levels." },
                { icon: "📐", title: "Regulatory Alignment",  desc: "Checks EU AI Act, ISO 42001, and NIST AI RMF coverage in the report." },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="card" style={{ padding: "20px 22px" }}>
                  <div style={{ fontSize: 26, marginBottom: 8 }}>{icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: "#1E293B", marginBottom: 5 }}>{title}</div>
                  <div style={{ fontSize: 12.5, color: "#64748B", lineHeight: 1.6 }}>{desc}</div>
                </div>
              ))}
            </div>

            {/* Upload card */}
            <div className="card" style={{ padding: "40px 48px" }}>
              <input
                ref={fileInput} type="file" accept=".pdf,.json" style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onClick={() => fileInput.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? KPMG_MID : file ? "#059669" : "#CBD5E1"}`,
                  borderRadius: 16, padding: "36px 24px", marginBottom: 24, cursor: "pointer",
                  background: dragOver ? "#EFF6FF" : file ? "#F0FDF4" : "#F8FAFC",
                  transition: "all 0.2s", textAlign: "center",
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 10 }}>
                  {file ? "✅" : "📤"}
                </div>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: "#374151", marginBottom: 4 }}>
                  {file ? file.name : "Drop your audit report here, or click to browse"}
                </div>
                <div style={{ fontSize: 12, color: "#94A3B8" }}>
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB · ${file.name.endsWith(".pdf") ? "PDF" : "JSON"}`
                    : "Accepts PDF and JSON formats"}
                </div>
              </div>

              {error && (
                <div style={{ padding: "12px 16px", background: "#FEE2E2", border: "1px solid #FCA5A5",
                  borderRadius: 10, color: "#DC2626", fontSize: 13, marginBottom: 20, fontWeight: 600 }}>
                  ⚠ {error}
                </div>
              )}

              {loading && (
                <div style={{ textAlign: "center", padding: "20px 0", marginBottom: 16 }}>
                  <div style={{ display: "inline-block", width: 28, height: 28, border: `3px solid ${KPMG_LT}40`,
                    borderTop: `3px solid ${KPMG}`, borderRadius: "50%",
                    animation: "spin 0.9s linear infinite", marginBottom: 12 }} />
                  <div style={{ color: "#64748B", fontSize: 13.5, fontWeight: 600 }}>{progress}</div>
                  <div style={{ color: "#94A3B8", fontSize: 12, marginTop: 4 }}>
                    This may take 15–30 seconds for large reports
                  </div>
                </div>
              )}

              <button
                onClick={handleAnalyse}
                disabled={!file || loading}
                style={{
                  width: "100%", padding: "14px 24px",
                  background: (!file || loading)
                    ? "#CBD5E1"
                    : `linear-gradient(135deg, ${KPMG}, ${KPMG_MID})`,
                  border: "none", borderRadius: 12, color: "white", fontSize: 15, fontWeight: 700,
                  cursor: (!file || loading) ? "default" : "pointer",
                  boxShadow: (!file || loading) ? "none" : `0 6px 24px ${KPMG}35`,
                  transition: "all 0.2s",
                }}>
                {loading ? "Analysing…" : "Run TAF Gap Analysis →"}
              </button>
            </div>
          </div>
        )}

        {/* ── Results view ────────────────────────────────────────────────── */}
        {result && (
          <div className="fade-in">

            {/* Hero header */}
            <div className="card" style={{
              padding: "28px 36px", marginBottom: 24,
              background: `linear-gradient(135deg, ${KPMG} 0%, ${KPMG_MID} 55%, ${KPMG_LT} 100%)`,
              border: "none", position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", right: -30, top: -30, width: 140, height: 140,
                borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                flexWrap: "wrap", gap: 20 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>
                    Report Audit — TAF Gap Analysis
                  </div>
                  <h1 style={{ fontSize: 22, fontWeight: 900, color: "white", marginBottom: 8 }}>
                    {result.extracted.ai_name || result.file_name}
                  </h1>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12.5,
                    color: "rgba(255,255,255,0.70)" }}>
                    {result.extracted.model_type && <span>🧠 {result.extracted.model_type}</span>}
                    {result.extracted.overall_score != null && <span>📊 Score: {result.extracted.overall_score}/100</span>}
                    {result.extracted.risk_level   && <span>⚠ {result.extracted.risk_level} Risk</span>}
                    <span>📄 {result.file_name}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <ScoreRing score={result.audit_completeness_score} size={90} />
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 4, fontWeight: 600 }}>
                      COMPLETENESS
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <ScoreRing score={avgCoverage} size={90} />
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 4, fontWeight: 600 }}>
                      TAF COVERAGE
                    </div>
                  </div>
                </div>
              </div>

              {/* Coverage stats row */}
              <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
                {[
                  { label: "Covered",     count: coveredCount, color: "#4ADE80" },
                  { label: "Partial",     count: partialCount, color: "#FCD34D" },
                  { label: "Not Covered", count: missingCount, color: "#F87171" },
                  { label: "Findings",    count: result.top_findings.length, color: "rgba(255,255,255,0.7)" },
                ].map(({ label, count, color }) => (
                  <div key={label} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.12)",
                    borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)",
                    display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color }}>{count}</span>
                    <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {(["overview", "principles", "compliance", "findings"] as const).map(tab => (
                <button key={tab} className={`tab-btn ${activeTab === tab ? "tab-active" : "tab-inactive"}`}
                  onClick={() => setActiveTab(tab)}>
                  {{ overview: "📊 Overview", principles: "🔍 TAF Principles",
                     compliance: "📐 Regulatory", findings: `⚠ Findings (${result.top_findings.length})` }[tab]}
                </button>
              ))}
            </div>

            {/* ── Overview tab ───────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Overall assessment */}
                <div className="card" style={{ padding: "26px 30px" }}>
                  <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>Overall Assessment</h2>
                  <div style={{ padding: "16px 20px", background: `linear-gradient(135deg, ${KPMG}08, ${KPMG_MID}05)`,
                    border: `1.5px solid ${KPMG_MID}25`, borderRadius: 14 }}>
                    <p style={{ margin: 0, color: "#1E293B", lineHeight: 1.8, fontSize: 14 }}>
                      {result.overall_assessment}
                    </p>
                  </div>
                </div>

                {/* Principle heatmap summary */}
                <div className="card" style={{ padding: "26px 30px" }}>
                  <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 18 }}>Principle Coverage Heatmap</h2>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10 }}>
                    {PRINCIPLES.map(p => {
                      const d = result.principle_coverage[p];
                      if (!d) return null;
                      return (
                        <div key={p}
                          onClick={() => setActiveTab("principles")}
                          style={{
                            padding: "14px 16px", borderRadius: 14, cursor: "pointer",
                            background: scoreBg(d.coverage_score),
                            border: `1.5px solid ${scoreColor(d.coverage_score)}20`,
                            transition: "transform 0.15s, box-shadow 0.15s",
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 16px rgba(0,0,0,0.10)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                            <span style={{ fontSize: 16 }}>{PRINCIPLE_ICONS[p]}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#1E293B" }}>{p}</span>
                          </div>
                          <div style={{ height: 5, background: "#E2E8F0", borderRadius: 99, marginBottom: 8 }}>
                            <div style={{ width: `${d.coverage_score}%`, height: "100%",
                              background: scoreColor(d.coverage_score), borderRadius: 99 }} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 18, fontWeight: 900, color: scoreColor(d.coverage_score) }}>
                              {d.coverage_score}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px",
                              borderRadius: 6, background: "white",
                              color: statusColor(d.status), border: `1px solid ${statusColor(d.status)}30` }}>
                              {statusLabel(d.status).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top 3 critical gaps */}
                {result.top_findings.filter(f => f.severity === "Critical" || f.severity === "High").length > 0 && (
                  <div className="card" style={{ padding: "26px 30px" }}>
                    <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 16 }}>Critical Gaps Requiring Attention</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {result.top_findings
                        .filter(f => f.severity === "Critical" || f.severity === "High")
                        .slice(0, 4)
                        .map((f, i) => (
                          <div key={i} style={{ display: "flex", gap: 14, padding: "14px 16px",
                            background: severityBg(f.severity), borderRadius: 12,
                            border: `1px solid ${severityColor(f.severity)}20` }}>
                            <div style={{ padding: "2px 10px", borderRadius: 6, fontSize: 11,
                              fontWeight: 700, color: severityColor(f.severity),
                              background: "white", border: `1px solid ${severityColor(f.severity)}30`,
                              height: "fit-content", flexShrink: 0 }}>
                              {f.severity}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13, color: "#1E293B", marginBottom: 4 }}>
                                [{f.principle}] {f.issue}
                              </div>
                              <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>{f.recommendation}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Principles tab ──────────────────────────────────────────── */}
            {activeTab === "principles" && (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ color: "#64748B", fontSize: 13, marginBottom: 4 }}>
                  Click any principle card to expand the detailed gap analysis.
                </p>
                {PRINCIPLES.map(p => {
                  const d = result.principle_coverage[p];
                  if (!d) return null;
                  return <PrincipleCard key={p} name={p} data={d} />;
                })}
              </div>
            )}

            {/* ── Compliance tab ──────────────────────────────────────────── */}
            {activeTab === "compliance" && (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {Object.entries(result.regulatory_gaps).map(([fw, data]) => (
                  <div key={fw} className="card" style={{ padding: "24px 28px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                      <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>{fw}</h2>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20,
                          background: data.mentioned ? "#DCFCE7" : "#F1F5F9",
                          color: data.mentioned ? "#059669" : "#64748B",
                          fontWeight: 700, border: `1px solid ${data.mentioned ? "#059669" : "#CBD5E1"}30` }}>
                          {data.mentioned ? "Referenced in report" : "Not mentioned"}
                        </span>
                        <span style={{ fontSize: 12, padding: "4px 14px", borderRadius: 20,
                          background: complianceBg(data.compliance_estimate),
                          color: complianceColor(data.compliance_estimate),
                          fontWeight: 700, border: `1px solid ${complianceColor(data.compliance_estimate)}30` }}>
                          {data.compliance_estimate}
                        </span>
                      </div>
                    </div>

                    {data.articles_referenced.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase",
                          letterSpacing: "0.07em", marginBottom: 8 }}>
                          Articles / Controls Referenced
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {data.articles_referenced.map((a, i) => (
                            <span key={i} style={{ padding: "4px 10px", background: "#EFF6FF",
                              color: KPMG_MID, borderRadius: 8, fontSize: 12, fontWeight: 600,
                              border: `1px solid ${KPMG_LT}30` }}>{a}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {data.missing_controls.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", textTransform: "uppercase",
                          letterSpacing: "0.07em", marginBottom: 8 }}>
                          Missing Controls
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {data.missing_controls.map((c, i) => (
                            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start",
                              fontSize: 13, color: "#374151", lineHeight: 1.6,
                              padding: "8px 12px", background: "#FEF2F2", borderRadius: 8,
                              border: "1px solid #FCA5A520" }}>
                              <span style={{ color: "#DC2626", flexShrink: 0 }}>✕</span>
                              <span>{c}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {data.missing_controls.length === 0 && data.mentioned && (
                      <div style={{ padding: "12px 16px", background: "#F0FDF4", borderRadius: 10,
                        border: "1px solid #86EFAC30", color: "#059669", fontSize: 13, fontWeight: 600 }}>
                        ✓ No significant control gaps identified for this framework
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── Findings tab ────────────────────────────────────────────── */}
            {activeTab === "findings" && (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {result.top_findings.length === 0 ? (
                  <div className="card" style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>No significant findings identified</div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>The report appears to cover the key TAF requirements.</div>
                  </div>
                ) : (
                  result.top_findings.map((f, i) => (
                    <div key={i} style={{
                      background: "white", borderRadius: 16, overflow: "hidden",
                      border: `1.5px solid ${severityColor(f.severity)}20`,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                    }}>
                      <div style={{ padding: "12px 18px", background: severityBg(f.severity),
                        borderBottom: `1px solid ${severityColor(f.severity)}15`,
                        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 16 }}>{PRINCIPLE_ICONS[f.principle] || "⚠️"}</span>
                          <span style={{ fontWeight: 700, fontSize: 13.5, color: "#1E293B" }}>{f.principle}</span>
                        </div>
                        <span style={{ padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                          color: severityColor(f.severity), background: "white",
                          border: `1px solid ${severityColor(f.severity)}30` }}>{f.severity}</span>
                      </div>
                      <div style={{ padding: "16px 18px" }}>
                        <p style={{ margin: "0 0 12px", color: "#1E293B", fontSize: 13.5, lineHeight: 1.7 }}>
                          {f.issue}
                        </p>
                        <div style={{ padding: "10px 14px", borderRadius: 10, background: "#EFF6FF",
                          border: `1px solid ${KPMG_LT}30` }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: KPMG_MID, textTransform: "uppercase",
                            letterSpacing: "0.07em", marginBottom: 4 }}>Recommendation</div>
                          <p style={{ margin: 0, color: KPMG, fontSize: 13, lineHeight: 1.7 }}>{f.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── Actions ─────────────────────────────────────────────────── */}
            <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => { setResult(null); setFile(null); setActiveTab("overview"); }}
                style={{ padding: "11px 26px", background: "white", border: "1.5px solid #E2E8F0",
                  borderRadius: 12, color: "#374151", cursor: "pointer", fontSize: 13.5, fontWeight: 600 }}>
                Upload Another Report
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                style={{ padding: "11px 26px",
                  background: `linear-gradient(135deg, ${KPMG}, ${KPMG_MID})`,
                  border: "none", borderRadius: 12, color: "white", cursor: "pointer",
                  fontSize: 13.5, fontWeight: 700, boxShadow: `0 6px 20px ${KPMG}30` }}>
                ← Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}