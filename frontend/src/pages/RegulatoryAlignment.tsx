// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useState, useEffect } from "react";
// import AuditContextBar, { LensFooter } from "../components/AuditContextBar";
// import { useLocation, useNavigate } from "react-router-dom";

// const B = "#00338D", M = "#005EB8";
// const sc = (s: number) => s >= 75 ? "#059669" : s >= 50 ? M : "#64748B";
// const sb = (s: number) => s >= 75 ? "#F0FDF4" : s >= 50 ? "#EFF6FF" : "#F1F5F9";
// const band = (s: number) => s >= 75 ? "Strong" : s >= 50 ? "Watch" : "Critical";

// const FW_META: Record<string, { label: string; desc: string; focus: string }> = {
//   EU_AI_Act:   { label:"EU AI Act",        desc:"European Union Artificial Intelligence Regulation",    focus:"Risk classification, prohibited practices, human oversight, transparency obligations" },
//   ISO_42001:   { label:"ISO 42001",         desc:"AI Management System Standard",                       focus:"AI management system requirements, continual improvement, risk treatment" },
//   NIST_AI_RMF: { label:"NIST AI RMF",      desc:"AI Risk Management Framework",                        focus:"Govern, Map, Measure & Manage across the full AI lifecycle" },
//   KPMG_TAF:    { label:"KPMG Trusted AI",  desc:"KPMG Trusted AI Framework",                           focus:"10-principle assessment across all governance dimensions" },
// };

// const PARAM_FRAMEWORK: Record<string, string[]> = {
//   "PII Detection":["EU_AI_Act","ISO_42001","KPMG_TAF"],"PII Leakage Rate":["EU_AI_Act","KPMG_TAF"],
//   "Consent Management":["EU_AI_Act","ISO_42001"],"Data Retention Signals":["EU_AI_Act","ISO_42001"],
//   "Label Balance":["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],"Bias Indicator Fields":["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],
//   "Demographic Tone Equity":["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],"Audit Log Volume":["EU_AI_Act","ISO_42001","KPMG_TAF"],
//   "Timestamp Coverage":["EU_AI_Act","ISO_42001"],"Human Override Readiness":["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],
//   "Safety Pass Rate":["EU_AI_Act","KPMG_TAF"],"Harmful Output Prevention":["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],
//   "Prompt Injection Resistance":["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],"Governance Language Rate":["ISO_42001","KPMG_TAF"],
//   "Schema Confidence":["ISO_42001","KPMG_TAF"],"Data Completeness":["ISO_42001","NIST_AI_RMF","KPMG_TAF"],
// };

// const PRINCIPLE_FRAMEWORK: Record<string, string[]> = {
//   Fairness:["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],Transparency:["EU_AI_Act","ISO_42001","KPMG_TAF"],
//   Explainability:["EU_AI_Act","KPMG_TAF"],Accountability:["EU_AI_Act","ISO_42001","NIST_AI_RMF","KPMG_TAF"],
//   "Data Integrity":["ISO_42001","NIST_AI_RMF","KPMG_TAF"],Reliability:["ISO_42001","NIST_AI_RMF","KPMG_TAF"],
//   Security:["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],Privacy:["EU_AI_Act","ISO_42001","KPMG_TAF"],
//   Safety:["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],Sustainability:["ISO_42001","KPMG_TAF"],
// };

// function alignLabel(status: string, score: number) {
//   const good = ["Good Alignment","Compliant","Certified Ready","Aligned"].includes(status);
//   const partial = ["Partial Alignment","Conditional","Assessed"].includes(status);
//   if (good) return score>=75?{l:"High Alignment",c:"#059669",b:"#F0FDF4"}:score>=55?{l:"Partial Alignment",c:M,b:"#EEF4FF"}:{l:"Limited Alignment",c:"#64748B",b:"#F1F5F9"};
//   if (partial) return score>=75?{l:"Partial Alignment",c:M,b:"#EEF4FF"}:{l:"Limited Alignment",c:"#64748B",b:"#F1F5F9"};
//   return {l:"Limited Alignment",c:"#64748B",b:"#F1F5F9"};
// }

// const CSS = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0;}body{background:#F8FAFC;}.ra-card{background:white;border-radius:14px;border:1px solid #E2E8F0;box-shadow:0 1px 3px rgba(0,0,0,0.05),0 4px 12px rgba(0,0,0,0.04);}.ra-fw{padding:10px 12px;border-radius:10px;cursor:pointer;transition:all 0.15s;margin-bottom:3px;}.ra-fw:hover{background:#F8FAFC;}`;

// export default function RegulatoryAlignment() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const raw = location.state?.data || (() => { try { const s = sessionStorage.getItem("lastReportData"); return s ? JSON.parse(s) : null; } catch { return null; } })();
//   const [selFw, setSelFw] = useState("EU_AI_Act");
//   const [anim, setAnim] = useState(false);
//   useEffect(() => { setTimeout(() => setAnim(true), 60); }, []);

//   if (!raw) return (
//     <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
//       <button onClick={() => navigate("/dashboard")} style={{ padding:"10px 24px", background:M, border:"none", borderRadius:10, color:"white", fontWeight:700, cursor:"pointer" }}>← Back</button>
//     </div>
//   );

//   const r = raw; void anim;
//   const prn = r.trusted_ai_principles || {};
//   const fw = r.framework_compliance || {};
//   const fwScore = r.overall_score;
//   const fwMeta = FW_META[selFw] || { label:selFw, desc:"", focus:"" };
//   const al = alignLabel(fw[selFw]||"", fwScore);
//   const mappedPrinciples = Object.entries(prn).filter(([k]) => (PRINCIPLE_FRAMEWORK[k]||[]).includes(selFw));
//   const mappedParams: { principle:string; param:string; score:number }[] = [];
//   Object.entries(prn).forEach(([principle, data]: any) => {
//     Object.entries(data.parameters||{}).forEach(([param, score]) => {
//       if ((PARAM_FRAMEWORK[param]||[]).includes(selFw)) mappedParams.push({ principle, param, score: score as number });
//     });
//   });

//   return (
//     <div style={{ minHeight:"100vh", background:"#F8FAFC", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#0F172A" }}>
//       <style>{CSS}</style>

//       <AuditContextBar data={raw} />



//       {/* Body */}
//       <div style={{ padding:"28px 40px 60px", display:"grid", gridTemplateColumns:"220px 1fr", gap:22 }}>

//         {/* Left: framework nav */}
//         <div style={{ position:"sticky", top:90 }}>
//           <div className="ra-card" style={{ padding:"16px 12px", marginBottom:14 }}>
//             <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.6px", padding:"2px 8px", marginBottom:10 }}>Frameworks</div>
//             {Object.entries(FW_META).map(([key, meta]) => {
//               const a = alignLabel(fw[key]||"", fwScore);
//               const sel = selFw === key;
//               return (
//                 <div key={key} className="ra-fw" onClick={() => setSelFw(key)}
//                   style={{ background:sel?"#EEF4FF":"transparent", border:sel?`1.5px solid #C7D9F5`:"1.5px solid transparent" }}>
//                   <div style={{ fontSize:13, fontWeight:sel?700:500, color:sel?M:"#374151" }}>{meta.label}</div>
//                   <div style={{ fontSize:10, fontWeight:700, color:a.c, marginTop:3 }}>{a.l}</div>
//                 </div>
//               );
//             })}
//           </div>

//           <div className="ra-card" style={{ padding:"16px 12px" }}>
//             <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.6px", padding:"2px 8px", marginBottom:10 }}>Principles</div>
//             {Object.keys(prn).map(k => (
//               <div key={k} style={{ padding:"5px 8px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
//                 <span style={{ fontSize:11.5, color:"#374151" }}>{k}</span>
//                 {(PRINCIPLE_FRAMEWORK[k]||[]).includes(selFw) && (
//                   <span style={{ fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:10, background:"#EEF4FF", color:M }}>mapped</span>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Right: content */}
//         <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

//           {/* Framework hero */}
//           <div className="ra-card" style={{ padding:"24px 28px", borderTop:`4px solid ${M}` }}>
//             <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:20, alignItems:"start" }}>
//               <div>
//                 <div style={{ fontSize:18, fontWeight:900, color:"#0F172A", marginBottom:4 }}>{fwMeta.label}</div>
//                 <div style={{ fontSize:13, color:"#64748B", marginBottom:8 }}>{fwMeta.desc}</div>
//                 <div style={{ fontSize:12.5, color:"#94A3B8", lineHeight:1.6 }}>{fwMeta.focus}</div>
//               </div>
//               <div style={{ textAlign:"center", padding:"16px 22px", borderRadius:14, background:al.b, border:`1px solid ${al.c}25` }}>
//                 <div style={{ fontSize:30, fontWeight:900, color:al.c, lineHeight:1 }}>{fwScore}</div>
//                 <div style={{ fontSize:10, color:al.c, marginTop:3 }}>/ 100</div>
//                 <div style={{ fontSize:11, fontWeight:700, color:al.c, marginTop:8, padding:"3px 10px", borderRadius:20, background:"white", border:`1px solid ${al.c}30` }}>{al.l}</div>
//               </div>
//             </div>
//             {/* Alignment bar */}
//             <div style={{ marginTop:18 }}>
//               <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#94A3B8", marginBottom:6 }}>
//                 <span>Limited</span><span>Partial</span><span>High</span>
//               </div>
//               <div style={{ height:6, background:"#F1F5F9", borderRadius:99, overflow:"hidden" }}>
//                 <div style={{ width:`${fwScore}%`, height:"100%", background:`linear-gradient(90deg,${M}66,${M})`, borderRadius:99, transition:"width 1s ease" }}/>
//               </div>
//             </div>
//           </div>

//           {/* All frameworks summary */}
//           <div className="ra-card" style={{ padding:"22px 28px" }}>
//             <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:16 }}>All Framework Alignment</div>
//             <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
//               {Object.entries(FW_META).map(([key, meta]) => {
//                 const a = alignLabel(fw[key]||"", fwScore);
//                 return (
//                   <div key={key} onClick={() => setSelFw(key)} style={{ padding:"16px 14px", borderRadius:12, background:selFw===key?"#EEF4FF":"#F8FAFC", border:selFw===key?`1.5px solid #C7D9F5`:"1px solid #E2E8F0", cursor:"pointer", transition:"all 0.15s" }}
//                     onMouseEnter={e => { if(selFw!==key)(e.currentTarget as HTMLDivElement).style.background="#F1F5F9"; }}
//                     onMouseLeave={e => { if(selFw!==key)(e.currentTarget as HTMLDivElement).style.background="#F8FAFC"; }}>
//                     <div style={{ fontSize:12.5, fontWeight:800, color:"#0F172A", marginBottom:4 }}>{meta.label}</div>
//                     <div style={{ fontSize:10, color:"#64748B", marginBottom:10, lineHeight:1.4 }}>{meta.desc}</div>
//                     <div style={{ height:4, background:"#E2E8F0", borderRadius:99, overflow:"hidden", marginBottom:6 }}>
//                       <div style={{ width:`${fwScore}%`, height:"100%", background:M, borderRadius:99 }}/>
//                     </div>
//                     <div style={{ fontSize:10, fontWeight:700, color:a.c }}>{a.l}</div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Mapped principles */}
//           {mappedPrinciples.length > 0 && (
//             <div className="ra-card" style={{ padding:"22px 28px" }}>
//               <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:4 }}>Principles Mapped to {fwMeta.label}</div>
//               <div style={{ fontSize:12, color:"#94A3B8", marginBottom:16 }}>These principles directly address {fwMeta.label} requirements</div>
//               <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
//                 {mappedPrinciples.map(([k, data]: any) => (
//                   <div key={k} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", borderRadius:12, background:"#F8FAFC", border:"1px solid #E2E8F0" }}>
//                     <div style={{ flex:1, fontSize:13.5, fontWeight:600, color:"#0F172A" }}>{k}</div>
//                     <div style={{ width:180, height:5, background:"#E2E8F0", borderRadius:99, overflow:"hidden" }}>
//                       <div style={{ width:`${data.score}%`, height:"100%", background:sc(data.score), borderRadius:99, transition:"width 0.8s ease" }}/>
//                     </div>
//                     <div style={{ fontSize:14, fontWeight:900, color:sc(data.score), minWidth:32, textAlign:"right" }}>{data.score}</div>
//                     <div style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:6, background:sb(data.score), color:sc(data.score), textTransform:"uppercase" as const }}>{band(data.score)}</div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Mapped sub-params */}
//           {mappedParams.length > 0 && (
//             <div className="ra-card" style={{ padding:"22px 28px" }}>
//               <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:4 }}>Sub-Parameters Mapped to {fwMeta.label}</div>
//               <div style={{ fontSize:12, color:"#94A3B8", marginBottom:16 }}>Individual parameters that address {fwMeta.label} policy requirements</div>
//               <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:10 }}>
//                 {mappedParams.map((mp, i) => (
//                   <div key={i} style={{ padding:"12px 14px", borderRadius:12, background:sb(mp.score), border:`1px solid ${sc(mp.score)}18` }}>
//                     <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.5px", marginBottom:4 }}>{mp.principle}</div>
//                     <div style={{ fontSize:12.5, fontWeight:700, color:"#0F172A", marginBottom:8 }}>{mp.param}</div>
//                     <div style={{ display:"flex", alignItems:"center", gap:8 }}>
//                       <div style={{ flex:1, height:4, background:"rgba(0,0,0,0.07)", borderRadius:99, overflow:"hidden" }}>
//                         <div style={{ width:`${mp.score}%`, height:"100%", background:sc(mp.score), borderRadius:99 }}/>
//                       </div>
//                       <span style={{ fontSize:13, fontWeight:900, color:sc(mp.score) }}>{mp.score}</span>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//     <LensFooter data={raw} />
//     </div>
//   );
// }




/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import AuditContextBar, { LensFooter } from "../components/AuditContextBar";
import { useLocation, useNavigate } from "react-router-dom";

const B = "#00338D", M = "#005EB8";
const sc = (s: number) => s >= 75 ? "#059669" : s >= 50 ? M : "#64748B";
const sb = (s: number) => s >= 75 ? "#F0FDF4" : s >= 50 ? "#EFF6FF" : "#F1F5F9";
const band = (s: number) => s >= 75 ? "Strong" : s >= 50 ? "Watch" : "Critical";

const FW_META: Record<string, { label: string; desc: string; focus: string }> = {
  EU_AI_Act:   { label:"EU AI Act",        desc:"European Union Artificial Intelligence Regulation",    focus:"Risk classification, prohibited practices, human oversight, transparency obligations" },
  ISO_42001:   { label:"ISO 42001",         desc:"AI Management System Standard",                       focus:"AI management system requirements, continual improvement, risk treatment" },
  NIST_AI_RMF: { label:"NIST AI RMF",      desc:"AI Risk Management Framework",                        focus:"Govern, Map, Measure & Manage across the full AI lifecycle" },
  KPMG_TAF:    { label:"KPMG Trusted AI",  desc:"KPMG Trusted AI Framework",                           focus:"10-principle assessment across all governance dimensions" },
};

const PARAM_FRAMEWORK: Record<string, string[]> = {
  "PII Detection":["EU_AI_Act","ISO_42001","KPMG_TAF"],"PII Leakage Rate":["EU_AI_Act","KPMG_TAF"],
  "Consent Management":["EU_AI_Act","ISO_42001"],"Data Retention Signals":["EU_AI_Act","ISO_42001"],
  "Label Balance":["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],"Bias Indicator Fields":["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],
  "Demographic Tone Equity":["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],"Audit Log Volume":["EU_AI_Act","ISO_42001","KPMG_TAF"],
  "Timestamp Coverage":["EU_AI_Act","ISO_42001"],"Human Override Readiness":["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],
  "Safety Pass Rate":["EU_AI_Act","KPMG_TAF"],"Harmful Output Prevention":["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],
  "Prompt Injection Resistance":["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],"Governance Language Rate":["ISO_42001","KPMG_TAF"],
  "Schema Confidence":["ISO_42001","KPMG_TAF"],"Data Completeness":["ISO_42001","NIST_AI_RMF","KPMG_TAF"],
};

const PRINCIPLE_FRAMEWORK: Record<string, string[]> = {
  Fairness:["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],Transparency:["EU_AI_Act","ISO_42001","KPMG_TAF"],
  Explainability:["EU_AI_Act","KPMG_TAF"],Accountability:["EU_AI_Act","ISO_42001","NIST_AI_RMF","KPMG_TAF"],
  "Data Integrity":["ISO_42001","NIST_AI_RMF","KPMG_TAF"],Reliability:["ISO_42001","NIST_AI_RMF","KPMG_TAF"],
  Security:["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],Privacy:["EU_AI_Act","ISO_42001","KPMG_TAF"],
  Safety:["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],Sustainability:["ISO_42001","KPMG_TAF"],
};

function alignLabel(status: string, score: number) {
  const good = ["Good Alignment","Compliant","Certified Ready","Aligned"].includes(status);
  const partial = ["Partial Alignment","Conditional","Assessed"].includes(status);
  if (good) return score>=75?{l:"High Alignment",c:"#059669",b:"#F0FDF4"}:score>=55?{l:"Partial Alignment",c:M,b:"#EEF4FF"}:{l:"Limited Alignment",c:"#64748B",b:"#F1F5F9"};
  if (partial) return score>=75?{l:"Partial Alignment",c:M,b:"#EEF4FF"}:{l:"Limited Alignment",c:"#64748B",b:"#F1F5F9"};
  return {l:"Limited Alignment",c:"#64748B",b:"#F1F5F9"};
}

const FW_TOOLTIPS: Record<string, string> = {
  EU_AI_Act: "The EU AI Act classifies AI systems by risk level (unacceptable, high, limited, minimal). High-risk systems require conformity assessments, human oversight, transparency, and registration in an EU database.",
  ISO_42001: "ISO/IEC 42001 is the international standard for AI Management Systems (AIMS). It provides a framework for responsible AI development, covering governance, risk treatment, and continual improvement.",
  NIST_AI_RMF: "The NIST AI Risk Management Framework offers voluntary guidance to manage AI risks across four core functions: Govern, Map, Measure, and Manage — applied throughout the full AI lifecycle.",
  KPMG_TAF: "KPMG's Trusted AI Framework evaluates AI systems across 10 principles including fairness, transparency, accountability, and reliability to build stakeholder trust.",
};

const PRINCIPLE_TOOLTIPS: Record<string, string> = {
  Fairness: "Measures whether the AI treats all demographic groups equitably, avoiding discriminatory outcomes across race, gender, age, and other protected attributes.",
  Transparency: "Assesses how clearly the system communicates its capabilities, limitations, and decision logic to users and stakeholders.",
  Explainability: "Evaluates whether the AI's outputs and reasoning can be understood and interpreted by humans in meaningful terms.",
  Accountability: "Checks for clear ownership of AI decisions, audit trails, and mechanisms for addressing errors or harms.",
  "Data Integrity": "Validates that training and inference data is accurate, complete, and free from corruption or unauthorized manipulation.",
  Reliability: "Measures consistent, predictable performance of the AI system under varying conditions and over time.",
  Security: "Assesses resistance to adversarial attacks, prompt injection, data poisoning, and unauthorized access.",
  Privacy: "Evaluates compliance with data minimization, consent, PII handling, and user data rights.",
  Safety: "Checks that the system avoids harmful outputs, respects ethical boundaries, and supports human override mechanisms.",
  Sustainability: "Considers the AI system's long-term environmental, operational, and social sustainability.",
};

const PARAM_TOOLTIPS: Record<string, string> = {
  "PII Detection": "Rate at which personally identifiable information is correctly identified in inputs and outputs.",
  "PII Leakage Rate": "Frequency of PII inadvertently exposed in model responses or logs.",
  "Consent Management": "Adherence to user consent requirements before processing personal data.",
  "Data Retention Signals": "Presence of mechanisms indicating how long data is stored and when it is purged.",
  "Label Balance": "Distribution evenness of class labels in training data to prevent skewed model behavior.",
  "Bias Indicator Fields": "Presence of fields that could introduce demographic or historical bias into predictions.",
  "Demographic Tone Equity": "Consistency of tone and sentiment across responses about different demographic groups.",
  "Audit Log Volume": "Completeness of audit records capturing model inputs, outputs, and decisions.",
  "Timestamp Coverage": "Percentage of events that carry accurate timestamps for traceability.",
  "Human Override Readiness": "Availability and accessibility of controls for humans to intervene in AI decisions.",
  "Safety Pass Rate": "Proportion of outputs that pass safety and content policy checks.",
  "Harmful Output Prevention": "Effectiveness of guardrails in preventing generation of harmful or unsafe content.",
  "Prompt Injection Resistance": "Robustness against adversarial prompts designed to hijack or override system instructions.",
  "Governance Language Rate": "Frequency of governance-related terminology in documentation, indicating policy maturity.",
  "Schema Confidence": "Reliability and consistency of structured data schemas used by the model.",
  "Data Completeness": "Proportion of required data fields that are populated without missing values.",
};

const BAND_TOOLTIPS: Record<string, string> = {
  Strong: "Score ≥ 75 — This metric meets or exceeds the recommended threshold for the selected framework.",
  Watch: "Score 50–74 — This metric partially meets requirements. Monitor closely and plan improvements.",
  Critical: "Score < 50 — This metric falls below the minimum acceptable level. Immediate remediation is advised.",
};

const ALIGN_TOOLTIPS: Record<string, string> = {
  "High Alignment": "The system demonstrates strong conformance with this framework's core requirements.",
  "Partial Alignment": "The system meets some requirements but gaps remain. Targeted improvements are needed.",
  "Limited Alignment": "Significant gaps exist between the system's current state and framework requirements.",
};

function InfoIcon({ tip, id }: { tip: string; id: string }) {
  return (
    <span style={{ position:"relative", display:"inline-flex", alignItems:"center" }}
      onMouseEnter={() => { const el = document.getElementById(`tip-${id}`); if(el) el.style.opacity="1"; }}
      onMouseLeave={() => { const el = document.getElementById(`tip-${id}`); if(el) el.style.opacity="0"; }}>
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ cursor:"help", flexShrink:0 }}>
        <circle cx="8" cy="8" r="7.5" stroke="#94A3B8" strokeWidth="1"/>
        <text x="8" y="12" textAnchor="middle" fontSize="9" fill="#94A3B8" fontWeight="700" fontFamily="sans-serif">i</text>
      </svg>
      <span id={`tip-${id}`} style={{
        position:"absolute", bottom:"calc(100% + 6px)", left:"50%", transform:"translateX(-50%)",
        background:"#1E293B", color:"white", fontSize:11, lineHeight:1.5, padding:"8px 10px",
        borderRadius:8, width:220, pointerEvents:"none", opacity:0, transition:"opacity 0.15s",
        zIndex:9999, boxShadow:"0 4px 12px rgba(0,0,0,0.2)", fontWeight:400,
        whiteSpace:"normal" as const, textAlign:"left" as const,
      }}>{tip}</span>
    </span>
  );
}

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0;}body{background:#F8FAFC;}.ra-card{background:white;border-radius:14px;border:1px solid #E2E8F0;box-shadow:0 1px 3px rgba(0,0,0,0.05),0 4px 12px rgba(0,0,0,0.04);}.ra-fw{padding:10px 12px;border-radius:10px;cursor:pointer;transition:all 0.15s;margin-bottom:3px;}.ra-fw:hover{background:#F8FAFC;}`;

export default function RegulatoryAlignment() {
  const location = useLocation();
  const navigate = useNavigate();
  const raw = location.state?.data || (() => { try { const s = sessionStorage.getItem("lastReportData"); return s ? JSON.parse(s) : null; } catch { return null; } })();
  const [selFw, setSelFw] = useState("EU_AI_Act");
  const [anim, setAnim] = useState(false);
  useEffect(() => { setTimeout(() => setAnim(true), 60); }, []);

  if (!raw) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <button onClick={() => navigate("/dashboard")} style={{ padding:"10px 24px", background:M, border:"none", borderRadius:10, color:"white", fontWeight:700, cursor:"pointer" }}>← Back</button>
    </div>
  );

  const r = raw; void anim;
  const prn = r.trusted_ai_principles || {};
  const fw = r.framework_compliance || {};
  const fwScore = r.overall_score;
  const fwMeta = FW_META[selFw] || { label:selFw, desc:"", focus:"" };
  const al = alignLabel(fw[selFw]||"", fwScore);
  const mappedPrinciples = Object.entries(prn).filter(([k]) => (PRINCIPLE_FRAMEWORK[k]||[]).includes(selFw));
  const mappedParams: { principle:string; param:string; score:number }[] = [];
  Object.entries(prn).forEach(([principle, data]: any) => {
    Object.entries(data.parameters||{}).forEach(([param, score]) => {
      if ((PARAM_FRAMEWORK[param]||[]).includes(selFw)) mappedParams.push({ principle, param, score: score as number });
    });
  });

  return (
    <div style={{ minHeight:"100vh", background:"#F8FAFC", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#0F172A" }}>
      <style>{CSS}</style>

      <AuditContextBar data={raw} />



      {/* Body */}
      <div style={{ padding:"28px 40px 60px", display:"grid", gridTemplateColumns:"220px 1fr", gap:22 }}>

        {/* Left: framework nav */}
        <div style={{ position:"sticky", top:90 }}>
          <div className="ra-card" style={{ padding:"16px 12px", marginBottom:14 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.6px", padding:"2px 8px", marginBottom:10 }}>Frameworks</div>
            {Object.entries(FW_META).map(([key, meta]) => {
              const a = alignLabel(fw[key]||"", fwScore);
              const sel = selFw === key;
              return (
                <div key={key} className="ra-fw" onClick={() => setSelFw(key)}
                  style={{ background:sel?"#EEF4FF":"transparent", border:sel?`1.5px solid #C7D9F5`:"1.5px solid transparent" }}>
                  <div style={{ fontSize:13, fontWeight:sel?700:500, color:sel?M:"#374151", display:"flex", alignItems:"center", gap:5 }}>
                    {meta.label}
                    <span onClick={e => e.stopPropagation()}>
                      <InfoIcon tip={FW_TOOLTIPS[key] || meta.desc} id={`fw-nav-${key}`} />
                    </span>
                  </div>
                  <div style={{ fontSize:10, fontWeight:700, color:a.c, marginTop:3 }}>{a.l}</div>
                </div>
              );
            })}
          </div>

          <div className="ra-card" style={{ padding:"16px 12px" }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.6px", padding:"2px 8px", marginBottom:10 }}>Principles</div>
            {Object.keys(prn).map(k => (
              <div key={k} style={{ padding:"5px 8px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:11.5, color:"#374151", display:"flex", alignItems:"center", gap:4 }}>
                  {k}
                  {PRINCIPLE_TOOLTIPS[k] && <InfoIcon tip={PRINCIPLE_TOOLTIPS[k]} id={`prn-sidebar-${k}`} />}
                </span>
                {(PRINCIPLE_FRAMEWORK[k]||[]).includes(selFw) && (
                  <span style={{ fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:10, background:"#EEF4FF", color:M }}>mapped</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: content */}
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

          {/* Framework hero */}
          <div className="ra-card" style={{ padding:"24px 28px", borderTop:`4px solid ${M}` }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:20, alignItems:"start" }}>
              <div>
                <div style={{ fontSize:18, fontWeight:900, color:"#0F172A", marginBottom:4 }}>{fwMeta.label}</div>
                <div style={{ fontSize:13, color:"#64748B", marginBottom:8 }}>{fwMeta.desc}</div>
                <div style={{ fontSize:12.5, color:"#94A3B8", lineHeight:1.6 }}>{fwMeta.focus}</div>
              </div>
              <div style={{ textAlign:"center", padding:"16px 22px", borderRadius:14, background:al.b, border:`1px solid ${al.c}25` }}>
                <div style={{ fontSize:30, fontWeight:900, color:al.c, lineHeight:1 }}>{fwScore}</div>
                <div style={{ fontSize:10, color:al.c, marginTop:3 }}>/ 100</div>
                <div style={{ fontSize:11, fontWeight:700, color:al.c, marginTop:8, padding:"3px 10px", borderRadius:20, background:"white", border:`1px solid ${al.c}30`, display:"flex", alignItems:"center", gap:4 }}>
                  {al.l}
                  <InfoIcon tip={ALIGN_TOOLTIPS[al.l] || al.l} id="hero-align-label" />
                </div>
              </div>
            </div>
            {/* Alignment bar */}
            <div style={{ marginTop:18 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#94A3B8", marginBottom:6 }}>
                <span>Limited</span><span>Partial</span><span>High</span>
              </div>
              <div style={{ height:6, background:"#F1F5F9", borderRadius:99, overflow:"hidden" }}>
                <div style={{ width:`${fwScore}%`, height:"100%", background:`linear-gradient(90deg,${M}66,${M})`, borderRadius:99, transition:"width 1s ease" }}/>
              </div>
            </div>
          </div>

          <div className="ra-card" style={{ padding:"22px 28px" }}>
            <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:16, display:"flex", alignItems:"center", gap:6 }}>
              All Framework Alignment
              <InfoIcon tip="Comparison of your AI system's alignment score across all four regulatory and governance frameworks. Click any card to drill into that framework." id="all-fw-header" />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
              {Object.entries(FW_META).map(([key, meta]) => {
                const a = alignLabel(fw[key]||"", fwScore);
                return (
                  <div key={key} onClick={() => setSelFw(key)} style={{ padding:"16px 14px", borderRadius:12, background:selFw===key?"#EEF4FF":"#F8FAFC", border:selFw===key?`1.5px solid #C7D9F5`:"1px solid #E2E8F0", cursor:"pointer", transition:"all 0.15s" }}
                    onMouseEnter={e => { if(selFw!==key)(e.currentTarget as HTMLDivElement).style.background="#F1F5F9"; }}
                    onMouseLeave={e => { if(selFw!==key)(e.currentTarget as HTMLDivElement).style.background="#F8FAFC"; }}>
                    <div style={{ fontSize:12.5, fontWeight:800, color:"#0F172A", marginBottom:4, display:"flex", alignItems:"center", gap:4 }}>
                      {meta.label}
                      <span onClick={e => e.stopPropagation()}>
                        <InfoIcon tip={FW_TOOLTIPS[key] || meta.desc} id={`fw-card-${key}`} />
                      </span>
                    </div>
                    <div style={{ fontSize:10, color:"#64748B", marginBottom:10, lineHeight:1.4 }}>{meta.desc}</div>
                    <div style={{ height:4, background:"#E2E8F0", borderRadius:99, overflow:"hidden", marginBottom:6 }}>
                      <div style={{ width:`${fwScore}%`, height:"100%", background:M, borderRadius:99 }}/>
                    </div>
                    <div style={{ fontSize:10, fontWeight:700, color:a.c, display:"flex", alignItems:"center", gap:4 }}>
                      {a.l}
                      <span onClick={e => e.stopPropagation()}>
                        <InfoIcon tip={ALIGN_TOOLTIPS[a.l] || a.l} id={`align-card-${key}`} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mapped principles */}
          {mappedPrinciples.length > 0 && (
            <div className="ra-card" style={{ padding:"22px 28px" }}>
              <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>
                Principles Mapped to {fwMeta.label}
                <InfoIcon tip={`These AI governance principles have direct relevance to ${fwMeta.label} requirements. Each score reflects how well the evaluated system demonstrates that principle.`} id="mapped-principles-header" />
              </div>
              <div style={{ fontSize:12, color:"#94A3B8", marginBottom:16 }}>These principles directly address {fwMeta.label} requirements</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {mappedPrinciples.map(([k, data]: any) => (
                  <div key={k} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", borderRadius:12, background:"#F8FAFC", border:"1px solid #E2E8F0" }}>
                    <div style={{ flex:1, fontSize:13.5, fontWeight:600, color:"#0F172A", display:"flex", alignItems:"center", gap:5 }}>
                      {k}
                      {PRINCIPLE_TOOLTIPS[k] && <InfoIcon tip={PRINCIPLE_TOOLTIPS[k]} id={`prn-row-${k}`} />}
                    </div>
                    <div style={{ width:180, height:5, background:"#E2E8F0", borderRadius:99, overflow:"hidden" }}>
                      <div style={{ width:`${data.score}%`, height:"100%", background:sc(data.score), borderRadius:99, transition:"width 0.8s ease" }}/>
                    </div>
                    <div style={{ fontSize:14, fontWeight:900, color:sc(data.score), minWidth:32, textAlign:"right" }}>{data.score}</div>
                    <div style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:6, background:sb(data.score), color:sc(data.score), textTransform:"uppercase" as const, display:"flex", alignItems:"center", gap:3 }}>
                      {band(data.score)}
                      <InfoIcon tip={BAND_TOOLTIPS[band(data.score)] || ""} id={`band-prn-${k}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mapped sub-params */}
          {mappedParams.length > 0 && (
            <div className="ra-card" style={{ padding:"22px 28px" }}>
              <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>
                Sub-Parameters Mapped to {fwMeta.label}
                <InfoIcon tip={`Individual measurable parameters that map to specific policy requirements of ${fwMeta.label}. Each card shows the parameter's score and which principle it falls under.`} id="mapped-params-header" />
              </div>
              <div style={{ fontSize:12, color:"#94A3B8", marginBottom:16 }}>Individual parameters that address {fwMeta.label} policy requirements</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:10 }}>
                {mappedParams.map((mp, i) => (
                  <div key={i} style={{ padding:"12px 14px", borderRadius:12, background:sb(mp.score), border:`1px solid ${sc(mp.score)}18` }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.5px", marginBottom:4 }}>{mp.principle}</div>
                    <div style={{ fontSize:12.5, fontWeight:700, color:"#0F172A", marginBottom:8, display:"flex", alignItems:"center", gap:5 }}>
                      {mp.param}
                      {PARAM_TOOLTIPS[mp.param] && <InfoIcon tip={PARAM_TOOLTIPS[mp.param]} id={`param-${i}-${mp.param.replace(/\s/g,"-")}`} />}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ flex:1, height:4, background:"rgba(0,0,0,0.07)", borderRadius:99, overflow:"hidden" }}>
                        <div style={{ width:`${mp.score}%`, height:"100%", background:sc(mp.score), borderRadius:99 }}/>
                      </div>
                      <span style={{ fontSize:13, fontWeight:900, color:sc(mp.score) }}>{mp.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    <LensFooter data={raw} />
    </div>
  );
}