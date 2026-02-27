// import { useLocation, useNavigate } from "react-router-dom";

// interface Finding {
//   category: string;
//   severity: "High" | "Medium" | "Low";
//   issue: string;
//   recommendation: string;
// }

// interface GovernanceScores {
//   transparency: number;
//   fairness: number;
//   accountability: number;
//   robustness: number;
//   explainability: number;
// }

// interface Diagnostics {
//   missing_ratio: number;
//   duplicates: number;
//   schema_confidence: number;
//   total_columns: number;
//   text_columns: number;
//   numeric_columns: number;
//   column_names: string[];
// }

// interface ReportData {
//   report_id: string;
//   ai_name: string;
//   model_type: string;
//   evaluated_at: string;
//   overall_score: number;
//   risk_level: string;
//   structural_risk: string;
//   logs_evaluated: number;
//   data_quality_score: number;
//   governance_scores: GovernanceScores;
//   diagnostics: Diagnostics;
//   findings: Finding[];
//   recommendation: string;
// }

// function ScoreGauge({ score, label }: { score: number; label: string }) {
//   const color =
//     score >= 75 ? "#00C896" : score >= 55 ? "#ffb020" : "#ff4d4d";

//   return (
//     <div className="score-gauge">
//       <div className="gauge-ring" style={{ "--score": score, "--color": color } as React.CSSProperties}>
//         <svg viewBox="0 0 80 80">
//           <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
//           <circle
//             cx="40" cy="40" r="34"
//             fill="none"
//             stroke={color}
//             strokeWidth="8"
//             strokeDasharray={`${(score / 100) * 213.6} 213.6`}
//             strokeLinecap="round"
//             transform="rotate(-90 40 40)"
//           />
//         </svg>
//         <span className="gauge-num" style={{ color }}>{score}</span>
//       </div>
//       <p className="gauge-label">{label}</p>
//     </div>
//   );
// }

// function SeverityBadge({ severity }: { severity: string }) {
//   const colors: Record<string, string> = {
//     High: "#ff4d4d",
//     Medium: "#ffb020",
//     Low: "#00C896",
//   };
//   return (
//     <span
//       className="severity-badge"
//       style={{ background: `${colors[severity]}22`, color: colors[severity], border: `1px solid ${colors[severity]}55` }}
//     >
//       {severity}
//     </span>
//   );
// }

// export default function Report() {
//   const { state } = useLocation();
//   const navigate = useNavigate();
//   const r: ReportData = state?.data;

//   if (!r) {
//     return (
//       <div className="no-data">
//         <p>No report data found.</p>
//         <button onClick={() => navigate("/dashboard")}>← Back to Dashboard</button>
//       </div>
//     );
//   }

//   const riskColor =
//     r.risk_level === "Low" ? "#00C896" : r.risk_level === "Moderate" ? "#ffb020" : "#ff4d4d";

//   const govEntries = Object.entries(r.governance_scores) as [string, number][];

//   const formattedDate = new Date(r.evaluated_at).toLocaleString("en-IN", {
//     dateStyle: "medium",
//     timeStyle: "short",
//   });

//   return (
//     <div className="report-root">
//       <style>{CSS}</style>

//       {/* ── Header ── */}
//       <div className="report-header">
//         <div>
//           <h1>AI Audit Report</h1>
//           <p className="report-meta">
//             <span>{r.ai_name}</span> &nbsp;·&nbsp;
//             <span className="model-tag">{r.model_type}</span> &nbsp;·&nbsp;
//             <span>{formattedDate}</span>
//           </p>
//           <p className="report-id">Report ID: {r.report_id}</p>
//         </div>
//         <button className="back-btn" onClick={() => navigate("/dashboard")}>
//           ← Dashboard
//         </button>
//       </div>

//       {/* ── Summary Row ── */}
//       <div className="summary-row">
//         <div className="summary-card big-score">
//           <span className="summary-label">Overall Score</span>
//           <span className="big-num" style={{ color: riskColor }}>{r.overall_score}</span>
//           <span className="out-of">/100</span>
//         </div>

//         <div className="summary-card">
//           <span className="summary-label">Risk Level</span>
//           <span className="risk-badge" style={{ color: riskColor, borderColor: riskColor }}>
//             {r.risk_level}
//           </span>
//         </div>

//         <div className="summary-card">
//           <span className="summary-label">Structural Risk</span>
//           <span className="risk-badge" style={{
//             color: r.structural_risk === "Low" ? "#00C896" : r.structural_risk === "Moderate" ? "#ffb020" : "#ff4d4d",
//             borderColor: r.structural_risk === "Low" ? "#00C896" : r.structural_risk === "Moderate" ? "#ffb020" : "#ff4d4d"
//           }}>
//             {r.structural_risk}
//           </span>
//         </div>

//         <div className="summary-card">
//           <span className="summary-label">Data Quality</span>
//           <span className="big-num" style={{ color: "#4AACDF" }}>{r.data_quality_score}%</span>
//         </div>

//         <div className="summary-card">
//           <span className="summary-label">Logs Evaluated</span>
//           <span className="big-num" style={{ color: "#EAF2FB" }}>{r.logs_evaluated}</span>
//         </div>
//       </div>

//       {/* ── Governance Scores ── */}
//       <div className="section-card">
//         <h2>Governance Dimensions</h2>
//         <div className="gauges-row">
//           {govEntries.map(([key, val]) => (
//             <ScoreGauge key={key} score={val} label={key.charAt(0).toUpperCase() + key.slice(1)} />
//           ))}
//         </div>
//       </div>

//       {/* ── Diagnostics ── */}
//       <div className="section-card">
//         <h2>Data Diagnostics</h2>
//         <div className="diag-grid">
//           <div className="diag-item">
//             <span>Missing Ratio</span>
//             <strong style={{ color: r.diagnostics.missing_ratio > 0.1 ? "#ff4d4d" : "#00C896" }}>
//               {(r.diagnostics.missing_ratio * 100).toFixed(1)}%
//             </strong>
//           </div>
//           <div className="diag-item">
//             <span>Duplicates</span>
//             <strong style={{ color: r.diagnostics.duplicates > 0 ? "#ffb020" : "#00C896" }}>
//               {r.diagnostics.duplicates}
//             </strong>
//           </div>
//           <div className="diag-item">
//             <span>Schema Confidence</span>
//             <strong style={{ color: "#4AACDF" }}>
//               {(r.diagnostics.schema_confidence * 100).toFixed(0)}%
//             </strong>
//           </div>
//           <div className="diag-item">
//             <span>Total Columns</span>
//             <strong>{r.diagnostics.total_columns}</strong>
//           </div>
//           <div className="diag-item">
//             <span>Text Columns</span>
//             <strong>{r.diagnostics.text_columns}</strong>
//           </div>
//           <div className="diag-item">
//             <span>Numeric Columns</span>
//             <strong>{r.diagnostics.numeric_columns}</strong>
//           </div>
//         </div>

//         {r.diagnostics.column_names?.length > 0 && (
//           <div className="column-tags">
//             <span className="tag-label">Detected Columns:</span>
//             {r.diagnostics.column_names.map((col) => (
//               <span key={col} className="col-tag">{col}</span>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* ── Findings ── */}
//       <div className="section-card">
//         <h2>Audit Findings {r.findings.length > 0 && <span className="finding-count">{r.findings.length}</span>}</h2>

//         {r.findings.length === 0 ? (
//           <div className="no-findings">✅ No critical findings. Dataset meets Trusted AI standards.</div>
//         ) : (
//           <div className="findings-list">
//             {r.findings.map((f, i) => (
//               <div key={i} className="finding-card">
//                 <div className="finding-top">
//                   <span className="finding-category">{f.category}</span>
//                   <SeverityBadge severity={f.severity} />
//                 </div>
//                 <p className="finding-issue">{f.issue}</p>
//                 <p className="finding-rec">💡 {f.recommendation}</p>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* ── Recommendation ── */}
//       {r.recommendation && (
//         <div className="section-card recommendation-card">
//           <h2>Recommendation</h2>
//           <p>{r.recommendation}</p>
//         </div>
//       )}

//       {/* ── Footer ── */}
//       <div className="report-footer">
//         <span>Generated by Auditable AI™ Platform</span>
//         <span>Report ID: {r.report_id}</span>
//       </div>
//     </div>
//   );
// }

// const CSS = `
// @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

// .report-root {
//   min-height: 100vh;
//   background: radial-gradient(circle at 20% 20%, #00338D 0%, transparent 40%),
//               radial-gradient(circle at 80% 70%, #00C896 0%, transparent 40%),
//               #030C1E;
//   padding: 50px 40px;
//   font-family: 'IBM Plex Sans', sans-serif;
//   color: #D8E8F5;
//   max-width: 1200px;
//   margin: 0 auto;
// }

// /* Header */
// .report-header {
//   display: flex;
//   justify-content: space-between;
//   align-items: flex-start;
//   margin-bottom: 40px;
// }

// .report-header h1 {
//   font-size: 34px;
//   font-weight: 800;
//   background: linear-gradient(90deg, #00C896, #0091DA);
//   -webkit-background-clip: text;
//   -webkit-text-fill-color: transparent;
//   margin-bottom: 8px;
// }

// .report-meta {
//   font-size: 15px;
//   color: #9DBFE0;
// }

// .report-meta span { margin: 0 4px; }

// .model-tag {
//   background: rgba(0,145,218,0.18);
//   border: 1px solid rgba(0,145,218,0.35);
//   padding: 2px 10px;
//   border-radius: 20px;
//   font-size: 13px;
//   color: #4AACDF;
// }

// .report-id {
//   font-size: 12px;
//   color: rgba(255,255,255,0.3);
//   margin-top: 6px;
// }

// .back-btn {
//   padding: 12px 24px;
//   border-radius: 10px;
//   border: 1px solid rgba(0,145,218,0.4);
//   background: rgba(0,145,218,0.08);
//   color: #4AACDF;
//   font-weight: 600;
//   cursor: pointer;
//   transition: all 0.25s;
//   white-space: nowrap;
// }

// .back-btn:hover {
//   background: rgba(0,145,218,0.18);
//   transform: translateY(-2px);
// }

// /* Summary Row */
// .summary-row {
//   display: flex;
//   gap: 20px;
//   margin-bottom: 30px;
//   flex-wrap: wrap;
// }

// .summary-card {
//   flex: 1;
//   min-width: 140px;
//   background: linear-gradient(135deg, rgba(10,30,66,0.82), rgba(7,21,48,0.75));
//   border: 1px solid rgba(0,145,218,0.28);
//   border-radius: 16px;
//   padding: 24px 20px;
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   gap: 8px;
//   text-align: center;
//   backdrop-filter: blur(12px);
// }

// .summary-label {
//   font-size: 12px;
//   color: #9DBFE0;
//   text-transform: uppercase;
//   letter-spacing: 0.6px;
// }

// .big-num {
//   font-size: 36px;
//   font-weight: 800;
//   line-height: 1;
// }

// .out-of {
//   font-size: 14px;
//   color: #9DBFE0;
//   margin-top: -6px;
// }

// .big-score { border-color: rgba(0,200,150,0.3); }

// .risk-badge {
//   font-size: 22px;
//   font-weight: 700;
//   padding: 4px 14px;
//   border-radius: 20px;
//   border: 1px solid;
// }

// /* Section Cards */
// .section-card {
//   background: linear-gradient(135deg, rgba(10,30,66,0.82), rgba(7,21,48,0.75));
//   border: 1px solid rgba(0,145,218,0.28);
//   border-radius: 20px;
//   padding: 36px;
//   margin-bottom: 28px;
//   backdrop-filter: blur(14px);
// }

// .section-card h2 {
//   font-size: 20px;
//   font-weight: 700;
//   color: #EAF2FB;
//   margin-bottom: 24px;
//   display: flex;
//   align-items: center;
//   gap: 10px;
// }

// /* Gauges */
// .gauges-row {
//   display: flex;
//   gap: 24px;
//   flex-wrap: wrap;
//   justify-content: center;
// }

// .score-gauge {
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   gap: 10px;
//   min-width: 100px;
// }

// .gauge-ring {
//   position: relative;
//   width: 80px;
//   height: 80px;
// }

// .gauge-ring svg {
//   width: 80px;
//   height: 80px;
// }

// .gauge-num {
//   position: absolute;
//   top: 50%;
//   left: 50%;
//   transform: translate(-50%, -50%);
//   font-size: 18px;
//   font-weight: 700;
// }

// .gauge-label {
//   font-size: 13px;
//   color: #9DBFE0;
//   text-align: center;
// }

// /* Diagnostics */
// .diag-grid {
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
//   gap: 16px;
//   margin-bottom: 20px;
// }

// .diag-item {
//   background: rgba(0,145,218,0.07);
//   border: 1px solid rgba(0,145,218,0.2);
//   border-radius: 12px;
//   padding: 16px;
//   display: flex;
//   flex-direction: column;
//   gap: 6px;
// }

// .diag-item span {
//   font-size: 12px;
//   color: #9DBFE0;
//   text-transform: uppercase;
//   letter-spacing: 0.5px;
// }

// .diag-item strong {
//   font-size: 22px;
//   font-weight: 700;
//   color: #EAF2FB;
// }

// .column-tags {
//   display: flex;
//   flex-wrap: wrap;
//   gap: 8px;
//   align-items: center;
//   margin-top: 8px;
// }

// .tag-label {
//   font-size: 13px;
//   color: #9DBFE0;
// }

// .col-tag {
//   background: rgba(0,145,218,0.12);
//   border: 1px solid rgba(0,145,218,0.3);
//   border-radius: 20px;
//   padding: 3px 12px;
//   font-size: 13px;
//   color: #4AACDF;
// }

// /* Findings */
// .finding-count {
//   background: rgba(255,77,77,0.2);
//   color: #ff8787;
//   border-radius: 20px;
//   padding: 2px 10px;
//   font-size: 14px;
//   font-weight: 600;
// }

// .no-findings {
//   padding: 20px;
//   background: rgba(0,200,150,0.08);
//   border: 1px solid rgba(0,200,150,0.25);
//   border-radius: 12px;
//   color: #00E5AB;
//   text-align: center;
//   font-size: 15px;
// }

// .findings-list {
//   display: flex;
//   flex-direction: column;
//   gap: 16px;
// }

// .finding-card {
//   background: rgba(255,255,255,0.03);
//   border: 1px solid rgba(255,255,255,0.1);
//   border-radius: 14px;
//   padding: 20px 24px;
//   transition: all 0.25s;
// }

// .finding-card:hover {
//   background: rgba(255,255,255,0.06);
// }

// .finding-top {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   margin-bottom: 10px;
// }

// .finding-category {
//   font-size: 14px;
//   font-weight: 600;
//   color: #4AACDF;
//   text-transform: uppercase;
//   letter-spacing: 0.5px;
// }

// .severity-badge {
//   font-size: 12px;
//   font-weight: 600;
//   padding: 3px 12px;
//   border-radius: 20px;
// }

// .finding-issue {
//   font-size: 14px;
//   color: #D8E8F5;
//   margin-bottom: 8px;
//   line-height: 1.5;
// }

// .finding-rec {
//   font-size: 13px;
//   color: #9DBFE0;
//   font-style: italic;
//   line-height: 1.4;
// }

// /* Recommendation */
// .recommendation-card {
//   border-color: rgba(0,200,150,0.3);
//   background: linear-gradient(135deg, rgba(0,200,150,0.06), rgba(7,21,48,0.82));
// }

// .recommendation-card p {
//   font-size: 15px;
//   color: #D8E8F5;
//   line-height: 1.7;
// }

// /* Footer */
// .report-footer {
//   display: flex;
//   justify-content: space-between;
//   padding: 20px 0;
//   font-size: 12px;
//   color: rgba(255,255,255,0.3);
//   border-top: 1px solid rgba(255,255,255,0.08);
//   margin-top: 10px;
// }

// /* No data fallback */
// .no-data {
//   min-height: 100vh;
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   background: #030C1E;
//   color: #D8E8F5;
//   gap: 20px;
//   font-family: 'IBM Plex Sans', sans-serif;
// }

// .no-data button {
//   padding: 12px 28px;
//   border-radius: 10px;
//   border: none;
//   background: linear-gradient(135deg, #0091DA, #00C896);
//   color: white;
//   font-weight: 600;
//   cursor: pointer;
// }

// @media (max-width: 768px) {
//   .report-root { padding: 30px 20px; }
//   .report-header { flex-direction: column; gap: 20px; }
//   .summary-row { flex-direction: column; }
//   .gauges-row { gap: 16px; }
// }
// `;


import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

interface Principle { score: number; parameters: Record<string, number>; }
interface ReportData {
  report_id: string; ai_name: string; model_type: string; evaluated_at: string;
  overall_score: number; risk_level: string; structural_risk: string;
  logs_evaluated: number; data_quality_score: number;
  trusted_ai_principles: Record<string, Principle>;
  diagnostics: { missing_ratio: number; duplicates: number; schema_confidence: number; total_columns: number; text_columns: number; numeric_columns: number; column_names: string[]; };
  findings: { category: string; severity: string; issue: string; recommendation: string }[];
  recommendation: string;
  framework_compliance: Record<string, string>;
}

const ICONS: Record<string,string> = { Transparency:"🔍", Explainability:"💡", Fairness:"⚖️", Accountability:"📋", "Data Integrity":"🗄️", Reliability:"⚙️", Security:"🔒", Privacy:"🛡️", Sustainability:"🌱", "Human-Centricity":"👤" };
const COLORS: Record<string,string> = { Transparency:"#00C8FF", Explainability:"#00E5A0", Fairness:"#FF6B9D", Accountability:"#FFB020", "Data Integrity":"#A78BFA", Reliability:"#34D399", Security:"#F87171", Privacy:"#60A5FA", Sustainability:"#4ADE80", "Human-Centricity":"#FBBF24" };
const FW: Record<string,{label:string;icon:string;desc:string}> = {
  EU_AI_Act:{label:"EU AI Act",icon:"🇪🇺",desc:"European Union AI Regulation"},
  ISO_42001:{label:"ISO 42001",icon:"🏅",desc:"AI Management System Standard"},
  NIST_AI_RMF:{label:"NIST AI RMF",icon:"🏛️",desc:"AI Risk Management Framework"},
  KPMG_TAF:{label:"KPMG Trusted AI",icon:"🔷",desc:"Trusted AI Framework"},
};
const CC: Record<string,string> = { Compliant:"#00C896","Certified Ready":"#00C896",Aligned:"#00C896",Conditional:"#ffb020",Assessed:"#60A5FA",Partial:"#ff4d4d" };

function Spider({ principles, onSelect, selected }: { principles: Record<string,Principle>; onSelect:(k:string|null)=>void; selected:string|null }) {
  const keys = Object.keys(principles); const N = keys.length;
  const cx=250,cy=250,R=175;
  const ang=(i:number)=>(Math.PI*2*i)/N - Math.PI/2;
  const pt=(i:number,v:number)=>({ x:cx+(v/100)*R*Math.cos(ang(i)), y:cy+(v/100)*R*Math.sin(ang(i)) });
  const lp=(i:number)=>{ const r=R+38; return {x:cx+r*Math.cos(ang(i)),y:cy+r*Math.sin(ang(i))}; };
  const poly = keys.map((k,i)=>pt(i,principles[k].score));
  const polyStr = poly.map(p=>`${p.x},${p.y}`).join(" ");
  return (
    <svg viewBox="0 0 500 500" style={{width:"100%",maxWidth:500,display:"block",margin:"0 auto"}}>
      {[20,40,60,80,100].map(lvl=>(
        <polygon key={lvl} points={keys.map((_,i)=>pt(i,lvl)).map(p=>`${p.x},${p.y}`).join(" ")}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
      ))}
      {keys.map((_,i)=>{ const e=pt(i,100); return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>; })}
      <polygon points={polyStr} fill="rgba(0,200,150,0.12)" stroke="rgba(0,200,150,0.55)" strokeWidth="2" strokeLinejoin="round"/>
      {[20,40,60,80,100].map(lvl=>(
        <text key={`t${lvl}`} x={cx+4} y={cy-(lvl/100)*R+4} fill="rgba(255,255,255,0.25)" fontSize="8" textAnchor="start">{lvl}</text>
      ))}
      {poly.map((p,i)=>{ const k=keys[i]; const c=COLORS[k]||"#00C896"; const sel=selected===k;
        return <circle key={i} cx={p.x} cy={p.y} r={sel?10:6} fill={c} stroke={sel?"#fff":"rgba(255,255,255,0.3)"} strokeWidth={sel?2.5:1.5} style={{cursor:"pointer",transition:"r 0.2s"}} onClick={()=>onSelect(selected===k?null:k)}/>;
      })}
      {keys.map((k,i)=>{ const lpos=lp(i); const c=COLORS[k]||"#00C896"; const sel=selected===k; const parts=k.split(" "); const sc=principles[k].score;
        return (
          <g key={k} style={{cursor:"pointer"}} onClick={()=>onSelect(selected===k?null:k)}>
            {parts.map((pt2,pi)=>(
              <text key={pi} x={lpos.x} y={lpos.y+(pi-parts.length/2)*13} textAnchor="middle" fill={sel?c:"rgba(255,255,255,0.7)"} fontSize={sel?"11":"9.5"} fontWeight={sel?"700":"400"} fontFamily="'DM Sans',sans-serif" style={{transition:"all 0.2s"}}>{pt2}</text>
            ))}
            <text x={lpos.x} y={lpos.y+(parts.length/2)*13+4} textAnchor="middle" fill={c} fontSize="10" fontWeight="800" fontFamily="'DM Sans',sans-serif">{sc}</text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={40} fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <text x={cx} y={cy-6} textAnchor="middle" fill="white" fontSize="24" fontWeight="900" fontFamily="'DM Sans',sans-serif">
        {Math.round(Object.values(principles).reduce((s,v)=>s+v.score,0)/N)}
      </text>
      <text x={cx} y={cy+13} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="'DM Sans',sans-serif">OVERALL</text>
    </svg>
  );
}

function BarChart({ principles }: { principles: Record<string,Principle> }) {
  const [hov, setHov] = useState<string|null>(null);
  const entries = Object.entries(principles);
  const W = entries.length*60+50;
  return (
    <div style={{overflowX:"auto"}}>
      <svg viewBox={`0 0 ${W} 220`} style={{width:"100%",minWidth:500,display:"block"}}>
        {[0,25,50,75,100].map(lvl=>(
          <g key={lvl}>
            <line x1={35} y1={192-lvl*1.7} x2={W-10} y2={192-lvl*1.7} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
            <text x={30} y={195-lvl*1.7} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="8" fontFamily="'DM Sans',sans-serif">{lvl}</text>
          </g>
        ))}
        {entries.map(([name,data],i)=>{
          const c=COLORS[name]||"#00C896"; const h=(data.score/100)*170; const x=45+i*60; const isHov=hov===name;
          return (
            <g key={name} onMouseEnter={()=>setHov(name)} onMouseLeave={()=>setHov(null)} style={{cursor:"pointer"}}>
              <rect x={x} y={192-h} width={36} height={h} rx={4} fill={isHov?c:`${c}88`} style={{transition:"fill 0.2s"}}/>
              {isHov&&<><rect x={x-5} y={192-h-26} width={46} height={20} rx={4} fill="rgba(0,0,0,0.85)" stroke={`${c}55`} strokeWidth="1"/>
              <text x={x+18} y={192-h-12} textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="'DM Sans',sans-serif">{data.score}</text></>}
              <text x={x+18} y={205} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="7" fontFamily="'DM Sans',sans-serif">{name.split(" ")[0]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Radial({ score, label, color, size=90 }: { score:number; label:string; color:string; size?:number }) {
  const r=size*0.38; const circ=2*Math.PI*r; const dash=(score/100)*circ;
  return (
    <div style={{textAlign:"center"}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={size*0.08}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.08}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:"stroke-dasharray 1s ease"}}/>
        <text x={size/2} y={size/2+4} textAnchor="middle" fill="white" fontSize={size*0.2} fontWeight="800" fontFamily="'DM Sans',sans-serif">{score}</text>
      </svg>
      <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginTop:3,fontFamily:"'DM Sans',sans-serif"}}>{label}</div>
    </div>
  );
}

export default function Report() {
  const location = useLocation(); const navigate = useNavigate();
  const r: ReportData = location.state?.data;
  const [sel, setSel] = useState<string|null>(null);
  const [anim, setAnim] = useState(false);
  useEffect(()=>{ setTimeout(()=>setAnim(true),60); },[]);

  if (!r) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",background:"#050d1a",gap:16}}>
      <p style={{color:"rgba(255,255,255,0.5)"}}>No report data found.</p>
      <button style={S.backBtn} onClick={()=>navigate("/dashboard")}>← Back to Dashboard</button>
    </div>
  );

  const prn = r.trusted_ai_principles || {};
  const pkeys = Object.keys(prn);
  const hasPrn = pkeys.length > 0;
  const rc = r.risk_level==="Low"?"#00C896":r.risk_level==="Moderate"?"#ffb020":"#ff4d4d";
  const fmt=(d:string)=>new Date(d).toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
  const selData = sel ? prn[sel] : null;

  const fadeStyle=(delay:number):React.CSSProperties=>({ opacity:anim?1:0, transform:anim?"none":"translateY(16px)", transition:`all 0.6s ease ${delay}s` });

  return (
    <div style={S.page}>
      <div style={S.bg}/>

      {/* HEADER */}
      <div style={{...S.header,...fadeStyle(0)}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
            <span style={S.logo}>Auditable AI™</span>
            <span style={S.kBadge}>⬡ KPMG Trusted AI Framework</span>
          </div>
          <h1 style={S.title}>Governance Audit Report</h1>
          <div style={S.meta}>
            <span>📌 {r.ai_name}</span><span style={S.dot}>·</span>
            <span>🧠 {r.model_type}</span><span style={S.dot}>·</span>
            <span>📅 {fmt(r.evaluated_at)}</span><span style={S.dot}>·</span>
            <span style={{fontFamily:"monospace",fontSize:11,color:"rgba(255,255,255,0.3)"}}>ID: {r.report_id?.slice(0,12)}…</span>
          </div>
        </div>
        <button style={S.backBtn} onClick={()=>navigate("/dashboard")}>← Dashboard</button>
      </div>

      {/* HERO SCORE */}
      <div style={{...S.heroRow,...fadeStyle(0.1)}}>
        <div style={{...S.heroScore,borderColor:`${rc}44`}}>
          <div style={{fontSize:68,fontWeight:900,color:rc,lineHeight:1,fontFamily:"'DM Sans',sans-serif"}}>{r.overall_score}</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginTop:4}}>/ 100</div>
          <div style={{...S.riskPill,background:`${rc}20`,border:`1px solid ${rc}55`,color:rc}}>{r.risk_level} Risk</div>
        </div>
        <div style={S.statsRow}>
          {[
            {icon:"📂",label:"Logs Evaluated",val:r.logs_evaluated},
            {icon:"📊",label:"Data Quality",val:`${r.data_quality_score}%`},
            {icon:"🏗️",label:"Structural Risk",val:r.structural_risk},
            {icon:"✅",label:"Principles Tested",val:pkeys.length},
            {icon:"⚠️",label:"Findings",val:r.findings?.length||0},
          ].map((s,i)=>(
            <div key={i} style={S.statCard}>
              <span style={{fontSize:22}}>{s.icon}</span>
              <div style={{fontSize:22,fontWeight:800,color:"white",fontFamily:"'DM Sans',sans-serif"}}>{s.val}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FRAMEWORK COMPLIANCE */}
      <section style={{...S.sec,...fadeStyle(0.15)}}>
        <h2 style={S.secTitle}>🏛️ Regulatory & Framework Compliance</h2>
        <p style={S.secSub}>Assessment conducted against the following international AI governance frameworks.</p>
        <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
          {Object.entries(r.framework_compliance||{}).map(([key,status])=>{
            const fw=FW[key]||{label:key,icon:"📋",desc:""};
            const sc=CC[status]||"#aaa";
            return (
              <div key={key} style={{...S.fwCard,borderColor:`${sc}44`}}>
                <div style={{fontSize:30}}>{fw.icon}</div>
                <div style={{fontWeight:700,fontSize:14,color:"white",marginTop:6}}>{fw.label}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2,textAlign:"center"}}>{fw.desc}</div>
                <div style={{...S.fwPill,background:`${sc}20`,border:`1px solid ${sc}55`,color:sc}}>{status}</div>
              </div>
            );
          })}
        </div>
        <div style={S.fwNote}>
          <span style={{opacity:0.4}}>ℹ️</span>
          <span style={{color:"rgba(255,255,255,0.4)",fontSize:12,marginLeft:8}}>
            <b style={{color:"rgba(255,255,255,0.6)"}}>EU AI Act</b> alignment reflects Title III transparency & accountability requirements.&nbsp;
            <b style={{color:"rgba(255,255,255,0.6)"}}>ISO/IEC 42001:2023</b> readiness reflects AI management system controls coverage.&nbsp;
            <b style={{color:"rgba(255,255,255,0.6)"}}>NIST AI RMF</b> alignment reflects GOVERN, MAP, MEASURE, MANAGE function coverage.&nbsp;
            <b style={{color:"rgba(255,255,255,0.6)"}}>KPMG Trusted AI Framework</b> scoring drives all compliance determinations.
          </span>
        </div>
      </section>

      {/* SPIDER CHART */}
      {hasPrn && (
        <section style={{...S.sec,...fadeStyle(0.2)}}>
          <h2 style={S.secTitle}>🕸️ KPMG Trusted AI — 10 Principles Assessment</h2>
          <p style={S.secSub}>Click any principle node or label on the spider chart to drill into its sub-parameters.</p>
          <div style={S.spiderWrap}>
            <div style={{flex:"0 0 auto",width:"min(100%,500px)"}}>
              <Spider principles={prn} onSelect={setSel} selected={sel}/>
              <p style={{textAlign:"center",fontSize:11,color:"rgba(255,255,255,0.25)",marginTop:6}}>Click a node to inspect sub-parameters →</p>
            </div>
            <div style={S.drillPanel}>
              {!sel ? (
                <div style={{width:"100%"}}>
                  <div style={{fontSize:13,color:"rgba(255,255,255,0.35)",textAlign:"center",marginBottom:20}}>Select a principle to view breakdown</div>
                  {pkeys.map(k=>{
                    const c=COLORS[k]||"#00C896"; const sc=prn[k].score;
                    return (
                      <div key={k} style={S.pRow} onClick={()=>setSel(k)}>
                        <span style={{fontSize:16}}>{ICONS[k]}</span>
                        <span style={{flex:1,fontSize:13,color:"rgba(255,255,255,0.7)"}}>{k}</span>
                        <div style={{width:80,height:5,background:"rgba(255,255,255,0.07)",borderRadius:3,overflow:"hidden"}}>
                          <div style={{width:`${sc}%`,height:"100%",background:c,borderRadius:3}}/>
                        </div>
                        <span style={{fontSize:13,fontWeight:700,color:c,minWidth:28,textAlign:"right"}}>{sc}</span>
                      </div>
                    );
                  })}
                </div>
              ) : selData ? (
                <div style={{width:"100%",animation:"fadeIn 0.3s ease"}}>
                  <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:16,paddingBottom:14,borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
                    <span style={{fontSize:26}}>{ICONS[sel]}</span>
                    <div>
                      <div style={{fontSize:17,fontWeight:800,color:"white"}}>{sel}</div>
                      <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>Sub-parameter breakdown</div>
                    </div>
                    <div style={{marginLeft:"auto",fontSize:34,fontWeight:900,color:COLORS[sel]||"#00C896"}}>{selData.score}</div>
                  </div>
                  <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
                    <Radial score={selData.score} label={sel} color={COLORS[sel]||"#00C896"} size={100}/>
                  </div>
                  {Object.entries(selData.parameters).map(([param,val])=>{
                    const v=val as number; const c=COLORS[sel]||"#00C896";
                    const sl=v>=75?"Good":v>=50?"Fair":"Poor"; const sc2=v>=75?"#00C896":v>=50?"#ffb020":"#ff4d4d";
                    return (
                      <div key={param} style={{marginBottom:14}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                          <span style={{fontSize:12,color:"rgba(255,255,255,0.7)",flex:1}}>{param}</span>
                          <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,fontWeight:700,color:sc2,background:`${sc2}18`,border:`1px solid ${sc2}44`}}>{sl}</span>
                          <span style={{fontSize:13,fontWeight:700,color:c,minWidth:28,textAlign:"right"}}>{v}</span>
                        </div>
                        <div style={{height:6,background:"rgba(255,255,255,0.07)",borderRadius:3,overflow:"hidden"}}>
                          <div style={{width:`${v}%`,height:"100%",background:`linear-gradient(90deg,${c}88,${c})`,borderRadius:3,transition:"width 1s ease"}}/>
                        </div>
                      </div>
                    );
                  })}
                  <button style={{...S.backDrillBtn,borderColor:`${COLORS[sel]||"#00C896"}44`,color:COLORS[sel]||"#00C896"}} onClick={()=>setSel(null)}>← Back to Overview</button>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      )}

      {/* BAR CHART */}
      {hasPrn && (
        <section style={{...S.sec,...fadeStyle(0.25)}}>
          <h2 style={S.secTitle}>📊 Principle Score Distribution</h2>
          <p style={S.secSub}>Hover bars for exact scores.</p>
          <BarChart principles={prn}/>
        </section>
      )}

      {/* RADIAL GRID */}
      {hasPrn && (
        <section style={{...S.sec,...fadeStyle(0.3)}}>
          <h2 style={S.secTitle}>🎯 Governance Dimension Overview</h2>
          <div style={{display:"flex",flexWrap:"wrap",gap:18,justifyContent:"center"}}>
            {pkeys.map(k=>(
              <div key={k} style={{...S.radCard,cursor:"pointer"}} onClick={()=>setSel(k)}>
                <Radial score={prn[k].score} label={k} color={COLORS[k]||"#00C896"} size={78}/>
                <div style={{fontSize:18,marginTop:4}}>{ICONS[k]}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DIAGNOSTICS */}
      <section style={{...S.sec,...fadeStyle(0.35)}}>
        <h2 style={S.secTitle}>🔬 Dataset Diagnostics</h2>
        <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
          {[
            {icon:"❌",label:"Missing Ratio",val:`${(r.diagnostics.missing_ratio*100).toFixed(1)}%`,c:r.diagnostics.missing_ratio<0.1?"#00C896":"#ff4d4d"},
            {icon:"🔁",label:"Duplicates",val:r.diagnostics.duplicates,c:r.diagnostics.duplicates===0?"#00C896":"#ffb020"},
            {icon:"🧩",label:"Schema Confidence",val:`${Math.round(r.diagnostics.schema_confidence*100)}%`,c:"#60A5FA"},
            {icon:"📐",label:"Total Columns",val:r.diagnostics.total_columns,c:"#A78BFA"},
            {icon:"📝",label:"Text Columns",val:r.diagnostics.text_columns,c:"#00E5A0"},
            {icon:"🔢",label:"Numeric Columns",val:r.diagnostics.numeric_columns,c:"#FBBF24"},
          ].map((d,i)=>(
            <div key={i} style={{...S.diagCard,borderColor:`${d.c}33`}}>
              <span style={{fontSize:22}}>{d.icon}</span>
              <div style={{fontSize:22,fontWeight:800,color:d.c,fontFamily:"'DM Sans',sans-serif"}}>{d.val}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{d.label}</div>
            </div>
          ))}
        </div>
        {r.diagnostics.column_names?.length>0&&(
          <div style={{marginTop:18,padding:"14px",background:"rgba(0,0,0,0.2)",borderRadius:12}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginBottom:8}}>Detected columns:</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {r.diagnostics.column_names.map((col,i)=>(
                <span key={i} style={{padding:"3px 10px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,fontSize:11,color:"rgba(255,255,255,0.55)"}}>{col}</span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* FINDINGS */}
      <section style={{...S.sec,...fadeStyle(0.4)}}>
        <h2 style={S.secTitle}>
          ⚠️ Audit Findings
          {(r.findings?.length||0)>0&&<span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:24,height:24,background:"#ff4d4d22",border:"1px solid #ff4d4d55",color:"#ff4d4d",borderRadius:"50%",fontSize:12,fontWeight:700,marginLeft:10}}>{r.findings.length}</span>}
        </h2>
        {!r.findings?.length?(
          <div style={{padding:20,background:"rgba(0,200,150,0.06)",border:"1px solid rgba(0,200,150,0.2)",borderRadius:12,color:"#00C896",fontSize:14}}>
            ✅ No critical findings. Dataset meets Trusted AI standards.
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {r.findings.map((f,i)=>{
              const sc=f.severity==="High"?"#ff4d4d":f.severity==="Medium"?"#ffb020":"#00C896";
              return (
                <div key={i} style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${sc}33`,borderRadius:14,padding:20}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <span style={{fontSize:12,fontWeight:700,color:COLORS[f.category]||"#fff",textTransform:"uppercase",letterSpacing:"0.07em"}}>{ICONS[f.category]||"📌"} {f.category}</span>
                    <span style={{padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:700,color:sc,background:`${sc}18`,border:`1px solid ${sc}44`}}>{f.severity}</span>
                  </div>
                  <p style={{fontSize:14,color:"rgba(255,255,255,0.75)",marginBottom:6,lineHeight:1.5}}>{f.issue}</p>
                  <p style={{fontSize:13,color:"rgba(255,255,255,0.4)",fontStyle:"italic",lineHeight:1.5}}>💡 {f.recommendation}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* RECOMMENDATION */}
      {r.recommendation&&(
        <section style={{...S.sec,...fadeStyle(0.45)}}>
          <h2 style={S.secTitle}>📌 Overall Recommendation</h2>
          <div style={{display:"flex",gap:14,padding:20,background:"rgba(255,176,32,0.05)",border:"1px solid rgba(255,176,32,0.2)",borderRadius:14,alignItems:"flex-start"}}>
            <span style={{fontSize:22}}>💡</span>
            <p style={{margin:0,fontSize:14,color:"rgba(255,255,255,0.8)",lineHeight:1.7}}>{r.recommendation}</p>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer style={{textAlign:"center",padding:"40px 48px 20px",marginTop:40,borderTop:"1px solid rgba(255,255,255,0.06)",position:"relative",zIndex:1}}>
        <div style={{display:"flex",gap:16,flexWrap:"wrap",justifyContent:"center",marginBottom:14}}>
          {["EU AI Act","ISO/IEC 42001:2023","NIST AI RMF","KPMG Trusted AI Framework"].map(f=>(
            <span key={f} style={{padding:"4px 14px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,fontSize:11,color:"rgba(255,255,255,0.4)"}}>{f}</span>
          ))}
        </div>
        <div style={{color:"rgba(255,255,255,0.2)",fontSize:11}}>Report ID: {r.report_id} · Auditable AI™ · KPMG Trusted AI Framework</div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        *{box-sizing:border-box;margin:0;padding:0} body{background:#050d1a!important}
      `}</style>
    </div>
  );
}

const S: Record<string,React.CSSProperties> = {
  page:{minHeight:"100vh",background:"#050d1a",fontFamily:"'DM Sans',sans-serif",color:"white",paddingBottom:80,position:"relative",overflowX:"hidden"},
  bg:{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",background:"radial-gradient(ellipse 80% 50% at 20% 10%,rgba(0,100,200,0.1) 0%,transparent 60%),radial-gradient(ellipse 60% 40% at 80% 80%,rgba(0,200,150,0.07) 0%,transparent 60%)"},
  header:{position:"relative",zIndex:1,padding:"32px 48px 24px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16},
  logo:{fontSize:19,fontWeight:900,background:"linear-gradient(135deg,#00C8FF,#00C896)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},
  kBadge:{fontSize:11,padding:"3px 10px",background:"rgba(0,51,141,0.4)",border:"1px solid rgba(0,51,141,0.6)",borderRadius:20,color:"#60A5FA"},
  title:{fontSize:30,fontWeight:900,color:"white",letterSpacing:"-0.02em"},
  meta:{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginTop:8,fontSize:13,color:"rgba(255,255,255,0.5)"},
  dot:{color:"rgba(255,255,255,0.2)"},
  backBtn:{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.65)",padding:"10px 20px",borderRadius:10,cursor:"pointer",fontSize:13,fontFamily:"'DM Sans',sans-serif",fontWeight:600},
  heroRow:{position:"relative",zIndex:1,display:"flex",gap:20,padding:"28px 48px",alignItems:"center",flexWrap:"wrap",borderBottom:"1px solid rgba(255,255,255,0.05)"},
  heroScore:{textAlign:"center",padding:"24px 32px",background:"rgba(255,255,255,0.03)",border:"2px solid",borderRadius:18,flexShrink:0},
  riskPill:{display:"inline-block",padding:"4px 14px",borderRadius:20,fontSize:12,fontWeight:700,marginTop:10},
  statsRow:{display:"flex",gap:12,flexWrap:"wrap",flex:1},
  statCard:{flex:"1 1 105px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:13,padding:"14px",textAlign:"center",display:"flex",flexDirection:"column",gap:4},
  sec:{position:"relative",zIndex:1,margin:"0 48px",marginTop:36,background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:"28px"},
  secTitle:{fontSize:19,fontWeight:800,color:"white",marginBottom:5},
  secSub:{fontSize:12,color:"rgba(255,255,255,0.38)",marginBottom:20},
  fwCard:{flex:"1 1 170px",background:"rgba(255,255,255,0.03)",border:"1px solid",borderRadius:15,padding:"20px 16px",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",gap:3},
  fwPill:{marginTop:10,padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:700},
  fwNote:{marginTop:18,padding:"12px 16px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,display:"flex",alignItems:"flex-start"},
  spiderWrap:{display:"flex",gap:28,flexWrap:"wrap",alignItems:"flex-start"},
  drillPanel:{flex:"1 1 280px",minHeight:420,background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"22px",display:"flex",flexDirection:"column",alignItems:"center"},
  pRow:{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",cursor:"pointer"},
  backDrillBtn:{marginTop:18,background:"transparent",border:"1px solid",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontFamily:"'DM Sans',sans-serif",fontWeight:600},
  radCard:{display:"flex",flexDirection:"column",alignItems:"center",padding:"14px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:13},
  diagCard:{flex:"1 1 115px",background:"rgba(255,255,255,0.03)",border:"1px solid",borderRadius:13,padding:"18px 14px",textAlign:"center",display:"flex",flexDirection:"column",gap:5,alignItems:"center"},
};