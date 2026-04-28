// import { useState, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
// import { sdccIngest } from "../services/api";

// // Weights for completeness scoring
// const FIELD_WEIGHTS: Record<string, number> = {
//   aiName: 5, aiVersion: 3, modelProvider: 4, deploymentEnv: 4,
//   useCase: 5, riskTier: 6, audience: 4, dataRegions: 4,
//   hasPolicy: 8, governanceOwner: 5, incidentProcess: 7, changeManagement: 5,
//   safetyControls: 8, humanOversight: 7, outputFiltering: 5,
//   biasTesting: 6, disclosed: 5, dataRetention: 4, piiHandling: 5,
//   regulatoryScope: 5,
// };

// type FormState = Record<keyof typeof FIELD_WEIGHTS, string>;

// const INITIAL: FormState = Object.fromEntries(
//   Object.keys(FIELD_WEIGHTS).map(k => [k, ""])
// ) as FormState;

// export default function SelfReportPage() {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(false);
//   const [success, setSuccess] = useState(false);
//   const [error, setError] = useState("");
//   const [showJson, setShowJson] = useState(false);
//   const aiName = localStorage.getItem("activeAI") || "enterprise-ai";
//   const [form, setForm] = useState<FormState>(INITIAL);
//   const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));

//   const completeness = useMemo(() => {
//     let score = 0;
//     for (const [key, weight] of Object.entries(FIELD_WEIGHTS)) {
//       if (form[key as keyof FormState]?.trim()) score += weight;
//     }
//     return score;
//   }, [form]);

//   const reportJson = useMemo(() => ({
//     report_type: "enterprise_self_attestation",
//     schema_version: "2.0",
//     generated_at: new Date().toISOString(),
//     completeness_pct: completeness,
//     ai_system: {
//       name: form.aiName || null,
//       version: form.aiVersion || null,
//       model_provider: form.modelProvider || null,
//       deployment_environment: form.deploymentEnv || null,
//       use_case: form.useCase || null,
//       risk_tier: form.riskTier || null,
//       audience: form.audience || null,
//       data_regions: form.dataRegions || null,
//     },
//     governance: {
//       written_policy: form.hasPolicy || null,
//       governance_owner: form.governanceOwner || null,
//       incident_process: form.incidentProcess || null,
//       change_management: form.changeManagement || null,
//     },
//     safety_controls: {
//       controls_in_place: form.safetyControls || null,
//       human_oversight: form.humanOversight || null,
//       output_filtering: form.outputFiltering || null,
//     },
//     fairness_transparency: {
//       bias_testing: form.biasTesting || null,
//       ai_disclosed_to_users: form.disclosed || null,
//     },
//     data_privacy: {
//       pii_handling: form.piiHandling || null,
//       data_retention_policy: form.dataRetention || null,
//       regulatory_scope: form.regulatoryScope || null,
//     },
//   }), [form, completeness]);

//   const handleSubmit = async () => {
//     if (completeness < 40) { setError("Please fill in at least a few more fields before submitting."); return; }
//     setLoading(true); setError("");
//     try {
//       const blob = new Blob([JSON.stringify(reportJson, null, 2)], { type: "application/json" });
//       const file = new File([blob], "self_report.json", { type: "application/json" });
//       const res = await sdccIngest(form.aiName || aiName, file);
//       localStorage.setItem("uploaded", "true");
//       localStorage.setItem("sdccSummary", JSON.stringify(res.data));
//       setSuccess(true);
//       setTimeout(() => navigate("/dashboard"), 2200);
//     } catch {
//       setError("Submission failed — please check your connection and try again.");
//     } finally { setLoading(false); }
//   };

//   const scoreColor = completeness >= 80 ? "#059669" : completeness >= 50 ? "#005EB8" : "#DC2626";

//   return (
//     <div style={{ minHeight: "100vh", background: "#F4F7FB", display: "flex", justifyContent: "center", padding: "40px 20px 80px", fontFamily: "'Inter', sans-serif", color: "#0B1F33" }}>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
//         * { box-sizing: border-box; }
//         .sr-card { background: #FFFFFF; border-radius: 20px; padding: 32px; border: 1px solid #E3EAF3; box-shadow: 0 4px 16px rgba(0,51,141,0.05); display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; transition: box-shadow 0.3s; }
//         .sr-card:hover { box-shadow: 0 12px 36px rgba(0,51,141,0.09); }
//         .sr-card h2 { font-size: 16px; font-weight: 700; color: #0B1F33; margin: 0; }
//         .sr-label { font-size: 11px; font-weight: 700; color: #005EB8; text-transform: uppercase; letter-spacing: 0.6px; display: block; margin-bottom: 6px; }
//         .sr-hint { font-size: 11px; color: #94A3B8; margin-top: 4px; }
//         .sr-input, .sr-select, .sr-textarea { width: 100%; padding: 11px 14px; border-radius: 10px; border: 1.5px solid #E3EAF3; background: #FAFBFD; color: #0B1F33; font-size: 14px; font-family: 'Inter', sans-serif; transition: border-color 0.2s, box-shadow 0.2s; outline: none; }
//         .sr-select { appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748B' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; background-color: #FAFBFD; padding-right: 36px; cursor: pointer; }
//         .sr-textarea { resize: vertical; min-height: 80px; line-height: 1.6; }
//         .sr-input:focus, .sr-select:focus, .sr-textarea:focus { border-color: #005EB8; background: #FFFFFF; box-shadow: 0 0 0 3px rgba(0,94,184,0.1); }
//         .sr-input::placeholder, .sr-textarea::placeholder { color: #B0BEC9; }
//         .sr-divider { height: 1px; background: #F1F5F9; margin: 0; }
//         .sr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
//         .sr-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
//         @media (max-width: 600px) { .sr-grid, .sr-grid-3 { grid-template-columns: 1fr; } }
//         .progress-track { height: 8px; background: #E9EFF6; border-radius: 99px; overflow: hidden; }
//         .progress-fill { height: 100%; border-radius: 99px; transition: width 0.5s ease, background 0.5s ease; }
//         .submit-btn { padding: 16px 60px; border-radius: 40px; border: none; background: linear-gradient(135deg, #00338D, #005EB8); color: #fff; font-weight: 700; font-size: 16px; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.3s; box-shadow: 0 6px 20px rgba(0,51,141,0.25); }
//         .submit-btn:hover:not(:disabled) { transform: scale(1.04); box-shadow: 0 12px 32px rgba(0,51,141,0.30); }
//         .submit-btn:disabled { background: #C5D5E8; cursor: not-allowed; box-shadow: none; }
//         .back-btn { padding: 9px 18px; border-radius: 10px; border: 1px solid #E3EAF3; background: #FFFFFF; color: #64748B; font-weight: 600; font-size: 13px; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s; flex-shrink: 0; }
//         .back-btn:hover { background: #F1F5F9; transform: translateX(-2px); }
//         .toggle-json-btn { padding: 7px 16px; border-radius: 8px; border: 1px solid #D0E8F8; background: #E6F2FB; color: #005EB8; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s; }
//         .toggle-json-btn:hover { background: #D0E8F8; }
//         .json-box { background: #0B1120; border-radius: 12px; padding: 20px; font-family: 'Fira Code', monospace; font-size: 12px; line-height: 1.75; max-height: 280px; overflow-y: auto; white-space: pre; border: 1px solid rgba(0,145,218,0.15); }
//         .section-tag { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: #005EB8; background: #E6F2FB; padding: 4px 10px; border-radius: 6px; margin-bottom: 4px; }
//       `}</style>

//       <div style={{ width: "100%", maxWidth: 760 }}>

//         {/* TOP BAR */}
//         <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, paddingBottom: 20, borderBottom: "1px solid #E3EAF3" }}>
//           <button className="back-btn" onClick={() => navigate("/")}>← Dashboard</button>
//           <div>
//             <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "#00338D" }}>Enterprise AI Self-Assessment</h1>
//             <p style={{ fontSize: 13, color: "#6B7C93", margin: "3px 0 0" }}>Complete this form to generate a governance audit score without uploading logs</p>
//           </div>
//         </div>

//         {/* INFO */}
//         <div style={{ padding: "12px 18px", background: "#E6F2FB", border: "1px solid rgba(0,145,218,0.3)", borderRadius: 12, fontSize: 13, color: "#00338D", marginBottom: 20, lineHeight: 1.6 }}>
//           ℹ Your answers compile into a structured JSON log ingested through the SDCC pipeline — giving you a full governance audit score aligned with KPMG Trusted AI Framework.
//         </div>

//         {/* COMPLETENESS */}
//         <div className="sr-card" style={{ padding: "22px 28px" }}>
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
//             <span style={{ fontSize: 13, fontWeight: 600, color: "#0B1F33" }}>Assessment completeness</span>
//             <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, background: completeness >= 80 ? "#DCFCE7" : completeness >= 50 ? "#E6F2FB" : "#FEE2E2", color: scoreColor }}>{completeness}%</span>
//           </div>
//           <div className="progress-track">
//             <div className="progress-fill" style={{ width: `${completeness}%`, background: scoreColor }} />
//           </div>
//           <p style={{ fontSize: 12, color: "#94A3B8", margin: "6px 0 0" }}>
//             {completeness < 40 ? "Fill in more fields to unlock submission" : completeness < 80 ? "Good progress — more fields will improve your score" : "Excellent coverage — ready to submit"}
//           </p>
//         </div>

//         {/* SECTION 1: AI SYSTEM IDENTITY */}
//         <div className="sr-card">
//           <div className="section-tag">🤖 AI System Identity</div>
//           <h2>About your AI system</h2>
//           <div className="sr-divider" />
//           <div className="sr-grid">
//             <div>
//               <label className="sr-label">AI / Product name *</label>
//               <input className="sr-input" type="text" placeholder="e.g. AcmeBot, TitanAI Assist"
//                 value={form.aiName} onChange={e => set("aiName", e.target.value)} />
//             </div>
//             <div>
//               <label className="sr-label">Model version / release</label>
//               <input className="sr-input" type="text" placeholder="e.g. v2.1.0, GPT-4-turbo"
//                 value={form.aiVersion} onChange={e => set("aiVersion", e.target.value)} />
//               <p className="sr-hint">Version tracking is required for audit traceability</p>
//             </div>
//           </div>
//           <div className="sr-grid">
//             <div>
//               <label className="sr-label">Model provider / foundation</label>
//               <select className="sr-select" value={form.modelProvider} onChange={e => set("modelProvider", e.target.value)}>
//                 <option value="">Select…</option>
//                 <option>OpenAI (GPT series)</option>
//                 <option>Anthropic (Claude)</option>
//                 <option>Google (Gemini / PaLM)</option>
//                 <option>Meta (Llama)</option>
//                 <option>Microsoft Azure OpenAI</option>
//                 <option>AWS Bedrock</option>
//                 <option>Proprietary / in-house</option>
//                 <option>Open-source fine-tuned</option>
//                 <option>Other</option>
//               </select>
//             </div>
//             <div>
//               <label className="sr-label">Deployment environment</label>
//               <select className="sr-select" value={form.deploymentEnv} onChange={e => set("deploymentEnv", e.target.value)}>
//                 <option value="">Select…</option>
//                 <option>Cloud (public)</option>
//                 <option>Cloud (private / VPC)</option>
//                 <option>On-premises</option>
//                 <option>Hybrid</option>
//                 <option>Edge / embedded</option>
//               </select>
//             </div>
//           </div>
//           <div className="sr-grid-3">
//             <div>
//               <label className="sr-label">Primary use case *</label>
//               <select className="sr-select" value={form.useCase} onChange={e => set("useCase", e.target.value)}>
//                 <option value="">Select…</option>
//                 <option>Customer support / chatbot</option>
//                 <option>Internal knowledge assistant</option>
//                 <option>Content generation</option>
//                 <option>Decision support / recommendations</option>
//                 <option>Document processing / extraction</option>
//                 <option>Code generation / review</option>
//                 <option>Risk & compliance analysis</option>
//                 <option>HR / recruitment screening</option>
//                 <option>Fraud detection</option>
//                 <option>Other</option>
//               </select>
//             </div>
//             <div>
//               <label className="sr-label">EU AI Act risk tier</label>
//               <select className="sr-select" value={form.riskTier} onChange={e => set("riskTier", e.target.value)}>
//                 <option value="">Select…</option>
//                 <option>Unacceptable risk</option>
//                 <option>High risk</option>
//                 <option>Limited risk</option>
//                 <option>Minimal risk</option>
//                 <option>Not yet assessed</option>
//               </select>
//               <p className="sr-hint">Determines regulatory obligations</p>
//             </div>
//             <div>
//               <label className="sr-label">Primary audience</label>
//               <select className="sr-select" value={form.audience} onChange={e => set("audience", e.target.value)}>
//                 <option value="">Select…</option>
//                 <option>Internal employees only</option>
//                 <option>External customers (B2C)</option>
//                 <option>Business clients (B2B)</option>
//                 <option>Regulated individuals (e.g. patients, applicants)</option>
//                 <option>Mixed</option>
//               </select>
//             </div>
//           </div>
//           <div>
//             <label className="sr-label">Data processing regions</label>
//             <select className="sr-select" value={form.dataRegions} onChange={e => set("dataRegions", e.target.value)}>
//               <option value="">Select…</option>
//               <option>EU / EEA only</option>
//               <option>UK only</option>
//               <option>US only</option>
//               <option>Multi-region (EU + US)</option>
//               <option>Global</option>
//               <option>Unknown / not documented</option>
//             </select>
//             <p className="sr-hint">Affects GDPR, data sovereignty, and cross-border transfer obligations</p>
//           </div>
//         </div>

//         {/* SECTION 2: GOVERNANCE */}
//         <div className="sr-card">
//           <div className="section-tag">🏛 Governance & Accountability</div>
//           <h2>Governance structure</h2>
//           <div className="sr-divider" />
//           <div className="sr-grid">
//             <div>
//               <label className="sr-label">Written AI policy exists? *</label>
//               <select className="sr-select" value={form.hasPolicy} onChange={e => set("hasPolicy", e.target.value)}>
//                 <option value="">Select…</option>
//                 <option>Yes — formally documented and approved</option>
//                 <option>Yes — draft / in review</option>
//                 <option>Informal guidelines only</option>
//                 <option>No policy yet</option>
//               </select>
//             </div>
//             <div>
//               <label className="sr-label">AI governance owner / role</label>
//               <select className="sr-select" value={form.governanceOwner} onChange={e => set("governanceOwner", e.target.value)}>
//                 <option value="">Select…</option>
//                 <option>Chief AI Officer (CAIO)</option>
//                 <option>Chief Risk Officer (CRO)</option>
//                 <option>Chief Data Officer (CDO)</option>
//                 <option>AI Ethics Board</option>
//                 <option>Legal / Compliance team</option>
//                 <option>Product / Engineering owner</option>
//                 <option>No designated owner</option>
//               </select>
//               <p className="sr-hint">Accountability ownership is a key governance signal</p>
//             </div>
//           </div>
//           <div className="sr-grid">
//             <div>
//               <label className="sr-label">Incident response process *</label>
//               <select className="sr-select" value={form.incidentProcess} onChange={e => set("incidentProcess", e.target.value)}>
//                 <option value="">Select…</option>
//                 <option>Formal process with SLAs and escalation paths</option>
//                 <option>Documented but informal</option>
//                 <option>Ad-hoc — no formal process</option>
//                 <option>No process yet</option>
//               </select>
//             </div>
//             <div>
//               <label className="sr-label">Change management for model updates</label>
//               <select className="sr-select" value={form.changeManagement} onChange={e => set("changeManagement", e.target.value)}>
//                 <option value="">Select…</option>
//                 <option>Formal change control with approval gates</option>
//                 <option>Peer review before deployment</option>
//                 <option>Automated CI/CD with tests</option>
//                 <option>Ad-hoc deployments</option>
//                 <option>No process</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* SECTION 3: SAFETY */}
//         <div className="sr-card">
//           <div className="section-tag">🔒 Safety & Human Oversight</div>
//           <h2>Safety controls</h2>
//           <div className="sr-divider" />
//           <div>
//             <label className="sr-label">Safety controls in place *</label>
//             <textarea className="sr-textarea"
//               placeholder="e.g. output filtering, PII redaction, rate limiting, content moderation, prompt injection guards…"
//               value={form.safetyControls} onChange={e => set("safetyControls", e.target.value)} />
//           </div>
//           <div className="sr-grid">
//             <div>
//               <label className="sr-label">Human oversight mechanism *</label>
//               <select className="sr-select" value={form.humanOversight} onChange={e => set("humanOversight", e.target.value)}>
//                 <option value="">Select…</option>
//                 <option>Human-in-the-loop for all decisions</option>
//                 <option>Human review for high-risk outputs only</option>
//                 <option>Human override available but not mandatory</option>
//                 <option>Fully automated — no human review</option>
//               </select>
//               <p className="sr-hint">Required for EU AI Act high-risk systems</p>
//             </div>
//             <div>
//               <label className="sr-label">Output filtering / moderation</label>
//               <select className="sr-select" value={form.outputFiltering} onChange={e => set("outputFiltering", e.target.value)}>
//                 <option value="">Select…</option>
//                 <option>Automated content moderation (e.g. Azure Content Safety)</option>
//                 <option>Rule-based keyword filtering</option>
//                 <option>LLM-based self-moderation</option>
//                 <option>Manual review only</option>
//                 <option>No output filtering</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* SECTION 4: FAIRNESS & TRANSPARENCY */}
//         <div className="sr-card">
//           <div className="section-tag">⚖️ Fairness & Transparency</div>
//           <h2>Fairness and disclosure</h2>
//           <div className="sr-divider" />
//           <div className="sr-grid">
//             <div>
//               <label className="sr-label">Bias testing conducted? *</label>
//               <select className="sr-select" value={form.biasTesting} onChange={e => set("biasTesting", e.target.value)}>
//                 <option value="">Select…</option>
//                 <option>Yes — independent third-party tested</option>
//                 <option>Yes — internal red-team testing</option>
//                 <option>Yes — automated bias evaluation tools</option>
//                 <option>Planned but not yet done</option>
//                 <option>Not tested</option>
//               </select>
//             </div>
//             <div>
//               <label className="sr-label">AI disclosure to end users *</label>
//               <select className="sr-select" value={form.disclosed} onChange={e => set("disclosed", e.target.value)}>
//                 <option value="">Select…</option>
//                 <option>Always disclosed — clear AI labelling</option>
//                 <option>Disclosed on request</option>
//                 <option>Disclosed in terms of service only</option>
//                 <option>Not disclosed</option>
//               </select>
//               <p className="sr-hint">Mandatory under EU AI Act for certain system types</p>
//             </div>
//           </div>
//         </div>

//         {/* SECTION 5: DATA & PRIVACY */}
//         <div className="sr-card">
//           <div className="section-tag">🛡️ Data & Privacy</div>
//           <h2>Data governance and privacy</h2>
//           <div className="sr-divider" />
//           <div className="sr-grid">
//             <div>
//               <label className="sr-label">PII / personal data handling *</label>
//               <select className="sr-select" value={form.piiHandling} onChange={e => set("piiHandling", e.target.value)}>
//                 <option value="">Select…</option>
//                 <option>No PII processed</option>
//                 <option>PII anonymised before processing</option>
//                 <option>PII pseudonymised</option>
//                 <option>PII processed with explicit consent</option>
//                 <option>PII processed — consent status unclear</option>
//               </select>
//             </div>
//             <div>
//               <label className="sr-label">Data retention policy</label>
//               <select className="sr-select" value={form.dataRetention} onChange={e => set("dataRetention", e.target.value)}>
//                 <option value="">Select…</option>
//                 <option>Defined retention periods with automated deletion</option>
//                 <option>Defined periods — manual deletion</option>
//                 <option>Retained indefinitely</option>
//                 <option>No retention policy defined</option>
//               </select>
//             </div>
//           </div>
//           <div>
//             <label className="sr-label">Applicable regulatory scope</label>
//             <select className="sr-select" value={form.regulatoryScope} onChange={e => set("regulatoryScope", e.target.value)}>
//               <option value="">Select…</option>
//               <option>GDPR (EU)</option>
//               <option>UK GDPR</option>
//               <option>CCPA (California)</option>
//               <option>HIPAA (US healthcare)</option>
//               <option>Multiple jurisdictions</option>
//               <option>Not yet assessed</option>
//               <option>Not applicable</option>
//             </select>
//             <p className="sr-hint">Determines which data protection obligations apply</p>
//           </div>
//         </div>

//         {/* PDF UPLOAD SECTION */}
//         <div className="sr-card" style={{ marginBottom: 20, borderColor: "rgba(0,94,184,0.2)" }}>
//           <div className="section-tag">📄 Already have a report?</div>
//           <h2>Upload existing PDF report</h2>
//           <div className="sr-divider" />
//           <p style={{ fontSize: 13, color: "#6B7C93", lineHeight: 1.6 }}>
//             If you already have an audit report in PDF or JSON format, upload it to view an interactive dashboard without running a new audit.
//           </p>
//           <button
//             onClick={() => navigate("/pdf-report")}
//             style={{ padding: "12px 24px", background: "linear-gradient(135deg, #00338D, #005EB8)", border: "none", borderRadius: 10, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.2s", boxShadow: "0 4px 14px rgba(0,51,141,0.2)", alignSelf: "flex-start" }}
//           >
//             Upload PDF / JSON Report →
//           </button>
//         </div>

//         {/* JSON PREVIEW */}
//         <div className="sr-card" style={{ marginBottom: 28 }}>          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//             <div>
//               <h2 style={{ margin: 0 }}>📄 Generated Log Preview</h2>
//               <p style={{ fontSize: 12, color: "#94A3B8", margin: "4px 0 0" }}>This JSON is ingested through the SDCC pipeline</p>
//             </div>
//             <button className="toggle-json-btn" onClick={() => setShowJson(v => !v)}>{showJson ? "Hide ▲" : "Preview JSON ▼"}</button>
//           </div>
//           {showJson && (
//             <div className="json-box">
//               {JSON.stringify(reportJson, null, 2).split("\n").map((line, i) => {
//                 const isKey = line.match(/^(\s*)"(.*?)":/);
//                 const isStr = line.match(/:\s*"(.*?)"/);
//                 const isNull = line.match(/:\s*null/);
//                 const isNum = line.match(/:\s*\d/);
//                 if (!isKey) return <div key={i} style={{ color: "#7DD3FC" }}>{line}</div>;
//                 const colonIdx = line.indexOf(":");
//                 const keyPart = line.substring(0, colonIdx);
//                 const valPart = line.substring(colonIdx + 1);
//                 const valColor = isStr ? "#86EFAC" : isNull ? "#9CA3AF" : isNum ? "#93C5FD" : "#E5E7EB";
//                 return (
//                   <div key={i}>
//                     <span style={{ color: "#93C5FD" }}>{keyPart}:</span>
//                     <span style={{ color: valColor }}>{valPart}</span>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//           <a className="dl-btn" style={{ display: "inline-block", padding: "9px 20px", background: "#E6F2FB", border: "1px solid rgba(0,145,218,0.3)", borderRadius: 9, fontSize: 13, color: "#005EB8", fontWeight: 600, textDecoration: "none", alignSelf: "flex-start" }}
//             href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(reportJson, null, 2))}`}
//             download="self_report.json">⬇ Download JSON</a>
//         </div>

//         {/* SUBMIT */}
//         <div style={{ textAlign: "center" }}>
//           {success ? (
//             <div style={{ padding: "18px 28px", background: "#DCFCE7", border: "1px solid #86EFAC", color: "#166534", borderRadius: 14, fontSize: 15, fontWeight: 600, maxWidth: 420, margin: "0 auto" }}>
//               ✅ Report ingested! Redirecting to dashboard…
//             </div>
//           ) : (
//             <>
//               <button className="submit-btn" onClick={handleSubmit} disabled={loading || completeness < 40}>
//                 {loading ? "Uploading report…" : "Generate & Upload Report →"}
//               </button>
//               {completeness < 40 && !loading && (
//                 <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 10 }}>Complete at least 40% of fields to submit</p>
//               )}
//             </>
//           )}
//           {error && (
//             <div style={{ marginTop: 16, padding: "12px 18px", background: "#FEE2E2", border: "1px solid #FECACA", color: "#DC2626", borderRadius: 10, fontSize: 13, maxWidth: 420, margin: "16px auto 0" }}>{error}</div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }



/**
 * SelfReportPage.tsx  —  Complete Rewrite
 * =========================================
 * Three modes in one page:
 *   1. Tabbed entry: "Self-Assessment Form" | "Upload Existing Report"
 *   2. Self-assessment form submits JSON → POST /audit/report
 *   3. PDF or JSON upload → POST /audit/report
 *   4. Full audit result dashboard after analysis
 *
 * Removed unnecessary fields: modelProvider (redundant with AI name/type),
 * dataRegions (too technical for self-assessment), changeManagement (covered
 * by incidentProcess). Kept only fields with direct TAF principle impact.
 */

import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// ── Brand colours ────────────────────────────────────────────────────────────
const C = {
  blue:    "#00338D",
  mid:     "#005EB8",
  lt:      "#0091DA",
  teal:    "#00C896",
  bg:      "#F0F4FA",
  white:   "#FFFFFF",
  border:  "#DDE3EE",
  text:    "#1A2B4A",
  muted:   "#64748B",
  red:     "#DC2626",
  amber:   "#D97706",
  green:   "#059669",
};

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// ── Types ────────────────────────────────────────────────────────────────────

interface PrincipleCoverage {
  status:         "covered" | "partial" | "not_covered";
  coverage_score: number;
  confidence:     number;
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
  audit_id:                string;
  file_name?:              string;
  file_type?:              string;
  audit_completeness_score: number;
  overall_assessment:      string;
  analysed_at:             string;
  word_count?:             number;
  extracted: {
    ai_name?:             string | null;
    model_type?:          string | null;
    overall_score?:       number | null;
    risk_level?:          string | null;
    evaluated_at?:        string | null;
    document_type?:       string | null;
    frameworks_mentioned?: string[];
  };
  principle_coverage:  Record<string, PrincipleCoverage>;
  regulatory_gaps:     Record<string, RegulatoryGap>;
  top_findings:        Finding[];
}

// ── Self-assessment form fields (trimmed to what matters for TAF) ─────────────

interface FormState {
  aiName:          string;
  aiVersion:       string;
  useCase:         string;
  riskTier:        string;
  audience:        string;
  hasPolicy:       string;
  governanceOwner: string;
  incidentProcess: string;
  safetyControls:  string;
  humanOversight:  string;
  outputFiltering: string;
  biasTesting:     string;
  disclosed:       string;
  piiHandling:     string;
  dataRetention:   string;
  regulatoryScope: string;
}

const INITIAL: FormState = {
  aiName: "", aiVersion: "", useCase: "", riskTier: "", audience: "",
  hasPolicy: "", governanceOwner: "", incidentProcess: "",
  safetyControls: "", humanOversight: "", outputFiltering: "",
  biasTesting: "", disclosed: "", piiHandling: "", dataRetention: "",
  regulatoryScope: "",
};

// Weights used for live completeness bar (higher = more TAF-critical)
const WEIGHTS: Record<keyof FormState, number> = {
  aiName: 4, aiVersion: 2, useCase: 5, riskTier: 6, audience: 3,
  hasPolicy: 9, governanceOwner: 6, incidentProcess: 8,
  safetyControls: 9, humanOversight: 8, outputFiltering: 5,
  biasTesting: 7, disclosed: 5, piiHandling: 6, dataRetention: 4,
  regulatoryScope: 5,
};

const MAX_COMPLETENESS = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);

// ── Constants ─────────────────────────────────────────────────────────────────

const PRINCIPLES = [
  "Fairness", "Transparency", "Explainability", "Accountability",
  "Data Integrity", "Reliability", "Security", "Safety", "Privacy", "Sustainability",
];

const PRINCIPLE_ICONS: Record<string, string> = {
  Fairness: "⚖️", Transparency: "🔍", Explainability: "💡",
  Accountability: "📋", "Data Integrity": "🛡️", Reliability: "⚙️",
  Security: "🔒", Safety: "🦺", Privacy: "🔐", Sustainability: "🌱",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreCol(s: number)  { return s >= 75 ? C.green : s >= 50 ? C.mid  : s >= 25 ? C.amber : C.red; }
function scoreBg(s: number)   { return s >= 75 ? "#DCFCE7" : s >= 50 ? "#EFF6FF" : s >= 25 ? "#FEF3C7" : "#FEE2E2"; }
function scoreLabel(s: number){ return s >= 75 ? "Good" : s >= 50 ? "Partial" : s >= 25 ? "Weak" : "Missing"; }

function statusCol(st: string)  { return st === "covered" ? C.green : st === "partial" ? C.amber : C.red; }
function statusBg(st: string)   { return st === "covered" ? "#DCFCE7" : st === "partial" ? "#FEF3C7" : "#FEE2E2"; }
function statusLabel(st: string){ return st === "covered" ? "Covered" : st === "partial" ? "Partial" : "Not Covered"; }

function sevCol(s: string)  { return s === "Critical" ? "#7F1D1D" : s === "High" ? C.red : s === "Medium" ? C.amber : C.mid; }
function sevBg(s: string)   { return s === "Critical" || s === "High" ? "#FEE2E2" : s === "Medium" ? "#FEF3C7" : "#EFF6FF"; }

function compCol(s: string) { return s === "Compliant" ? C.green : s === "Conditional" ? C.amber : s === "Non-Compliant" ? C.red : C.muted; }
function compBg(s: string)  { return s === "Compliant" ? "#DCFCE7" : s === "Conditional" ? "#FEF3C7" : s === "Non-Compliant" ? "#FEE2E2" : "#F1F5F9"; }

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 88 }: { score: number; size?: number }) {
  const r    = (size / 2) - 9;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const col  = scoreCol(score);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={8}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={8}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }}/>
      <text x={size/2} y={size/2 + 2} textAnchor="middle" dominantBaseline="middle"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size/2}px ${size/2}px`,
          fill: col, fontSize: size * 0.22, fontWeight: 900, fontFamily: "inherit" }}>
        {score}
      </text>
    </svg>
  );
}

function PrincipleCard({ name, data }: { name: string; data: PrincipleCoverage }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderRadius: 14, border: `1.5px solid ${statusCol(data.status)}20`,
      background: C.white, overflow: "hidden",
      boxShadow: open ? "0 6px 20px rgba(0,0,0,0.09)" : "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding: "13px 16px",
        background: statusBg(data.status), cursor: "pointer",
        display: "flex", alignItems: "center", gap: 10,
        borderBottom: open ? `1px solid ${statusCol(data.status)}20` : "none" }}>
        <span style={{ fontSize: 20 }}>{PRINCIPLE_ICONS[name]}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: C.text }}>{name}</div>
          <div style={{ marginTop: 4, height: 5, background: "#E2E8F0", borderRadius: 99 }}>
            <div style={{ width: `${data.coverage_score}%`, height: "100%",
              background: scoreCol(data.coverage_score), borderRadius: 99,
              transition: "width 0.8s ease" }}/>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: statusCol(data.status), lineHeight: 1 }}>
            {data.coverage_score}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: statusCol(data.status), letterSpacing: "0.05em" }}>
            {statusLabel(data.status).toUpperCase()}
          </div>
        </div>
        <div style={{ color: "#94A3B8", fontSize: 14, transition: "transform 0.2s",
          transform: open ? "rotate(180deg)" : "none" }}>▼</div>
      </div>
      {open && (
        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {data.evidence && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase",
                letterSpacing: "0.08em", marginBottom: 5 }}>What was found</div>
              <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.7,
                padding: "9px 12px", background: "#F8FAFC", borderRadius: 8,
                border: "1px solid #E2E8F0" }}>{data.evidence}</p>
            </div>
          )}
          {data.gaps.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.red, textTransform: "uppercase",
                letterSpacing: "0.08em", marginBottom: 5 }}>Gaps identified</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {data.gaps.map((g, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, fontSize: 12.5, color: "#374151",
                    lineHeight: 1.6, alignItems: "flex-start" }}>
                    <span style={{ color: C.red, flexShrink: 0, marginTop: 2 }}>✕</span>
                    <span>{g}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.recommendation && (
            <div style={{ padding: "9px 12px", background: "#EFF6FF", borderRadius: 8,
              border: `1px solid ${C.lt}30` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.mid, textTransform: "uppercase",
                letterSpacing: "0.08em", marginBottom: 4 }}>Recommendation</div>
              <p style={{ margin: 0, fontSize: 12.5, color: C.blue, lineHeight: 1.7 }}>{data.recommendation}</p>
            </div>
          )}
          {data.confidence != null && (
            <div style={{ fontSize: 11, color: C.muted, textAlign: "right" }}>
              Analysis confidence: {Math.round(data.confidence * 100)}%
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Form field helper ─────────────────────────────────────────────────────────

function Field({
  label, hint, required, children,
}: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 5 }}>
        {label}{required && <span style={{ color: C.red }}> *</span>}
      </label>
      {hint && <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>{hint}</div>}
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 13px", border: `1.5px solid ${C.border}`,
  borderRadius: 10, fontSize: 13.5, fontFamily: "inherit", color: C.text,
  background: "#FAFBFD", boxSizing: "border-box",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

function Input({ value, onChange, placeholder, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input value={value} onChange={onChange} placeholder={placeholder}
      style={inputStyle}
      onFocus={e => { e.currentTarget.style.borderColor = C.mid; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,94,184,0.1)"; }}
      onBlur={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
      {...rest}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 } as React.CSSProperties}
      onFocus={e => { e.currentTarget.style.borderColor = C.mid; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,94,184,0.1)"; }}
      onBlur={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
    />
  );
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { label: string; value: string }[];
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ ...inputStyle, cursor: "pointer" }}>
      <option value="">— Select —</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SelfReportPage() {
  const navigate = useNavigate();
  const fileRef  = useRef<HTMLInputElement>(null);

  // Tab: "form" | "upload"
  const [tab, setTab]         = useState<"form" | "upload">("form");

  // Shared
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [result, setResult]   = useState<AuditResult | null>(null);
  const [activeSection, setActiveSection] = useState<"overview" | "principles" | "regulatory" | "findings">("overview");

  // Form state
  const [form, setForm]       = useState<FormState>(INITIAL);
  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [dragOver, setDragOver]     = useState(false);

  // Live completeness
  const completeness = useMemo(() => {
    let score = 0;
    for (const [k, w] of Object.entries(WEIGHTS)) {
      if (form[k as keyof FormState]?.trim()) score += w;
    }
    return Math.round((score / MAX_COMPLETENESS) * 100);
  }, [form]);

  // Build JSON from form
  const formJson = useMemo(() => ({
    report_type:      "enterprise_self_attestation",
    schema_version:   "2.0",
    generated_at:     new Date().toISOString(),
    completeness_pct: completeness,
    ai_system: {
      name:                    form.aiName   || null,
      version:                 form.aiVersion || null,
      use_case:                form.useCase   || null,
      risk_tier:               form.riskTier  || null,
      audience:                form.audience  || null,
    },
    governance: {
      written_policy:    form.hasPolicy        || null,
      governance_owner:  form.governanceOwner  || null,
      incident_process:  form.incidentProcess  || null,
    },
    safety_controls: {
      controls_in_place: form.safetyControls  || null,
      human_oversight:   form.humanOversight  || null,
      output_filtering:  form.outputFiltering || null,
    },
    fairness_transparency: {
      bias_testing:          form.biasTesting || null,
      ai_disclosed_to_users: form.disclosed   || null,
    },
    data_privacy: {
      pii_handling:          form.piiHandling   || null,
      data_retention_policy: form.dataRetention || null,
      regulatory_scope:      form.regulatoryScope || null,
    },
  }), [form, completeness]);

  // ── Submit self-assessment form ────────────────────────────────────────────
  const submitForm = async () => {
    if (!form.aiName.trim()) { setError("AI system name is required."); return; }
    if (completeness < 30)   { setError("Please fill in at least a few more fields for a meaningful analysis."); return; }
    setLoading(true); setError("");
    try {
      const blob = new Blob([JSON.stringify(formJson, null, 2)], { type: "application/json" });
      const fd   = new FormData();
      fd.append("file", blob, `${form.aiName.replace(/\s+/g, "_")}_self_assessment.json`);
      const res  = await fetch(`${API}/audit/report`, { method: "POST", body: fd });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail || `HTTP ${res.status}`);
      }
      setResult(await res.json());
      setActiveSection("overview");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Submit uploaded file ───────────────────────────────────────────────────
  const submitUpload = async () => {
    if (!uploadFile) { setError("Please select a file first."); return; }
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      const res = await fetch(`${API}/audit/report`, { method: "POST", body: fd });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail || `HTTP ${res.status}`);
      }
      setResult(await res.json());
      setActiveSection("overview");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (f: File) => {
    const name = f.name.toLowerCase();
    if (!name.endsWith(".pdf") && !name.endsWith(".json")) {
      setError("Only PDF and JSON files are supported.");
      return;
    }
    setUploadFile(f);
    setError("");
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const reset = () => {
    setResult(null); setError(""); setUploadFile(null);
    setForm(INITIAL); setTab("form"); setActiveSection("overview");
  };

  // ── Render: audit result dashboard ────────────────────────────────────────
  if (result) {
    const ext       = result.extracted || {};
    const cov       = result.principle_coverage || {};
    const regs      = result.regulatory_gaps || {};
    const findings  = result.top_findings || [];
    const compl     = result.audit_completeness_score ?? 0;
    const aiName    = ext.ai_name || result.file_name?.replace(/\.(pdf|json)$/i, "") || "Uploaded Report";
    const docType   = ext.document_type || result.file_type || "document";

    const coveredCount  = PRINCIPLES.filter(p => cov[p]?.status === "covered").length;
    const partialCount  = PRINCIPLES.filter(p => cov[p]?.status === "partial").length;
    const missingCount  = PRINCIPLES.filter(p => !cov[p] || cov[p].status === "not_covered").length;
    const avgCoverage   = Math.round(PRINCIPLES.reduce((s, p) => s + (cov[p]?.coverage_score || 0), 0) / PRINCIPLES.length);

    const TABS = [
      { key: "overview",   label: "Overview" },
      { key: "principles", label: `Principles (${PRINCIPLES.length})` },
      { key: "regulatory", label: "Regulatory" },
      { key: "findings",   label: `Findings (${findings.length})` },
    ] as const;

    return (
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif", paddingBottom: 80 }}>
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }
          .card { background: ${C.white}; border-radius: 18px; border: 1px solid ${C.border};
            box-shadow: 0 2px 8px rgba(0,30,90,0.07); }
          .tab-btn { padding: 9px 20px; border-radius: 10px; border: none; cursor: pointer;
            font-size: 13.5px; font-weight: 700; font-family: inherit; transition: all 0.18s; }
          .tab-btn:hover { background: #E6F0FB !important; }
          .tab-active { background: ${C.blue} !important; color: white !important; }
          .tab-inactive { background: transparent !important; color: ${C.muted} !important; }
          @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
          .fade-in { animation: fadeIn 0.3s ease; }
        `}</style>

        {/* ── Header ── */}
        <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 40px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 60, position: "sticky", top: 0, zIndex: 100,
          boxShadow: "0 1px 6px rgba(0,30,90,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.03em",
              background: `linear-gradient(135deg, ${C.blue}, ${C.mid})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>TrustShield AI</span>
            <div style={{ width: 1, height: 18, background: C.border }}/>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", background: "#E6F2FB",
              color: C.mid, borderRadius: 20, border: `1px solid ${C.lt}40` }}>TAF Gap Analysis</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={reset}
              style={{ padding: "8px 18px", background: C.white, border: `1px solid ${C.border}`,
                color: C.muted, borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              ← New Analysis
            </button>
            <button onClick={() => navigate("/dashboard")}
              style={{ padding: "8px 18px", background: `linear-gradient(135deg, ${C.blue}, ${C.mid})`,
                border: "none", color: C.white, borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
              Dashboard
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 20px" }}>

          {/* ── Banner ── */}
          <div className="card fade-in" style={{ padding: "28px 32px", marginBottom: 22,
            background: `linear-gradient(135deg, ${C.blue} 0%, ${C.mid} 60%, ${C.lt} 100%)`, border: "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              flexWrap: "wrap", gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>
                  TAF Gap Analysis · {docType === "self_assessment" ? "Self-Assessment" : "Uploaded Report"}
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: C.white, marginBottom: 8 }}>{aiName}</h1>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                  {ext.model_type && <span>🧠 {ext.model_type}</span>}
                  {result.file_name && <span>📄 {result.file_name}</span>}
                  <span>🕒 {new Date(result.analysed_at).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  {result.word_count && <span>📝 {result.word_count.toLocaleString()} words</span>}
                </div>
              </div>
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 54, fontWeight: 900, lineHeight: 1, color: C.white, letterSpacing: "-0.04em" }}>
                  {compl}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>/ 100 Completeness</div>
                <div style={{ marginTop: 8, display: "inline-block", padding: "4px 14px", borderRadius: 20,
                  fontSize: 12, fontWeight: 700,
                  background: compl >= 75 ? "#DCFCE7" : compl >= 50 ? "#FEF3C7" : "#FEE2E2",
                  color: compl >= 75 ? C.green : compl >= 50 ? C.amber : C.red,
                  border: `1px solid ${(compl >= 75 ? C.green : compl >= 50 ? C.amber : C.red)}40` }}>
                  {compl >= 75 ? "Comprehensive" : compl >= 50 ? "Moderate Coverage" : "Significant Gaps"}
                </div>
              </div>
            </div>
          </div>

          {/* ── Stat cards ── */}
          <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
            {[
              { label: "Principles Covered",  value: coveredCount,          color: C.green },
              { label: "Partially Covered",   value: partialCount,          color: C.amber },
              { label: "Not Covered",         value: missingCount,          color: C.red   },
              { label: "Avg Coverage Score",  value: `${avgCoverage}/100`,  color: C.blue  },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: "18px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Overall assessment ── */}
          <div className="card fade-in" style={{ padding: "20px 24px", marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: "uppercase",
              letterSpacing: "0.08em", marginBottom: 8 }}>Overall Assessment</div>
            <p style={{ fontSize: 14, color: C.text, lineHeight: 1.8, margin: 0 }}>{result.overall_assessment}</p>
          </div>

          {/* ── Tab bar ── */}
          <div className="card fade-in" style={{ padding: "8px", marginBottom: 22, display: "flex", gap: 4 }}>
            {TABS.map(t => (
              <button key={t.key}
                className={`tab-btn ${activeSection === t.key ? "tab-active" : "tab-inactive"}`}
                onClick={() => setActiveSection(t.key as typeof activeSection)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Overview ── */}
          {activeSection === "overview" && (
            <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              {/* Principle score rings */}
              <div className="card" style={{ padding: "24px" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 16 }}>
                  Principle Coverage
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {PRINCIPLES.map(p => {
                    const d = cov[p];
                    const s = d?.coverage_score ?? 0;
                    return (
                      <div key={p} style={{ padding: "10px 12px", borderRadius: 10,
                        background: scoreBg(s), border: `1px solid ${scoreCol(s)}20`,
                        display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 16 }}>{PRINCIPLE_ICONS[p]}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: C.text,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p}</div>
                          <div style={{ marginTop: 3, height: 4, background: "#E2E8F0", borderRadius: 99 }}>
                            <div style={{ width: `${s}%`, height: "100%",
                              background: scoreCol(s), borderRadius: 99 }}/>
                          </div>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: scoreCol(s), flexShrink: 0 }}>{s}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Regulatory overview */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="card" style={{ padding: "24px" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 14 }}>
                    Regulatory Alignment
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {Object.entries(regs).map(([fw, data]) => (
                      <div key={fw} style={{ display: "flex", justifyContent: "space-between",
                        alignItems: "center", padding: "10px 14px", borderRadius: 10,
                        background: compBg(data.compliance_estimate),
                        border: `1px solid ${compCol(data.compliance_estimate)}25` }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{fw}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 20,
                          background: C.white, color: compCol(data.compliance_estimate),
                          border: `1px solid ${compCol(data.compliance_estimate)}30` }}>
                          {data.compliance_estimate}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top findings preview */}
                {findings.length > 0 && (
                  <div className="card" style={{ padding: "24px" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 14 }}>
                      Top Findings
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {findings.slice(0, 4).map((f, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start",
                          padding: "8px 12px", borderRadius: 8, background: sevBg(f.severity),
                          border: `1px solid ${sevCol(f.severity)}20` }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px",
                            borderRadius: 20, color: sevCol(f.severity), background: C.white,
                            border: `1px solid ${sevCol(f.severity)}30`, flexShrink: 0, marginTop: 1 }}>
                            {f.severity}
                          </span>
                          <span style={{ fontSize: 12.5, color: C.text, lineHeight: 1.5 }}>
                            <strong>{f.principle}:</strong> {f.issue.substring(0, 90)}{f.issue.length > 90 ? "…" : ""}
                          </span>
                        </div>
                      ))}
                      {findings.length > 4 && (
                        <button onClick={() => setActiveSection("findings")}
                          style={{ fontSize: 12.5, color: C.mid, background: "none", border: "none",
                            cursor: "pointer", fontWeight: 600, textAlign: "left", padding: "2px 0" }}>
                          +{findings.length - 4} more findings →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Principles ── */}
          {activeSection === "principles" && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {PRINCIPLES.map(p => {
                const d = cov[p];
                if (!d) return null;
                return <PrincipleCard key={p} name={p} data={d}/>;
              })}
            </div>
          )}

          {/* ── Regulatory ── */}
          {activeSection === "regulatory" && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {Object.entries(regs).map(([fw, data]) => (
                <div key={fw} className="card" style={{ padding: "24px 28px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>{fw}</h2>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 12, padding: "3px 12px", borderRadius: 20,
                        background: data.mentioned ? "#DCFCE7" : "#F1F5F9",
                        color: data.mentioned ? C.green : C.muted, fontWeight: 700,
                        border: `1px solid ${data.mentioned ? C.green : "#CBD5E1"}30` }}>
                        {data.mentioned ? "Referenced" : "Not mentioned"}
                      </span>
                      <span style={{ fontSize: 12, padding: "3px 14px", borderRadius: 20,
                        background: compBg(data.compliance_estimate),
                        color: compCol(data.compliance_estimate), fontWeight: 700,
                        border: `1px solid ${compCol(data.compliance_estimate)}30` }}>
                        {data.compliance_estimate}
                      </span>
                    </div>
                  </div>

                  {data.articles_referenced.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase",
                        letterSpacing: "0.07em", marginBottom: 8 }}>Controls Referenced</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {data.articles_referenced.map((a, i) => (
                          <span key={i} style={{ padding: "3px 10px", background: "#EFF6FF",
                            color: C.mid, borderRadius: 8, fontSize: 12, fontWeight: 600,
                            border: `1px solid ${C.lt}30` }}>{a}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.missing_controls.length > 0 ? (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.red, textTransform: "uppercase",
                        letterSpacing: "0.07em", marginBottom: 8 }}>Missing Controls</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {data.missing_controls.map((ctrl, i) => (
                          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start",
                            fontSize: 13, color: "#374151", lineHeight: 1.6, padding: "8px 12px",
                            background: "#FEF2F2", borderRadius: 8, border: "1px solid #FCA5A520" }}>
                            <span style={{ color: C.red, flexShrink: 0 }}>✕</span>
                            <span>{ctrl}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : data.mentioned ? (
                    <div style={{ padding: "10px 14px", background: "#F0FDF4", borderRadius: 8,
                      border: "1px solid #86EFAC30", color: C.green, fontSize: 13, fontWeight: 600 }}>
                      ✓ No significant control gaps identified
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {/* ── Findings ── */}
          {activeSection === "findings" && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {findings.length === 0 ? (
                <div className="card" style={{ padding: "48px", textAlign: "center", color: C.muted }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>No significant findings identified</div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>The report appears to cover the key TAF requirements.</div>
                </div>
              ) : findings.map((f, i) => (
                <div key={i} style={{ background: C.white, borderRadius: 14,
                  border: `1.5px solid ${sevCol(f.severity)}20`, overflow: "hidden",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  <div style={{ padding: "11px 18px", background: sevBg(f.severity),
                    borderBottom: `1px solid ${sevCol(f.severity)}15`,
                    display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 16 }}>{PRINCIPLE_ICONS[f.principle] || "⚠️"}</span>
                      <span style={{ fontWeight: 700, fontSize: 13.5, color: C.text }}>{f.principle}</span>
                    </div>
                    <span style={{ padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                      color: sevCol(f.severity), background: C.white,
                      border: `1px solid ${sevCol(f.severity)}30` }}>{f.severity}</span>
                  </div>
                  <div style={{ padding: "15px 18px" }}>
                    <p style={{ margin: "0 0 11px", color: C.text, fontSize: 13.5, lineHeight: 1.7 }}>{f.issue}</p>
                    <div style={{ padding: "10px 14px", borderRadius: 10, background: "#EFF6FF",
                      border: `1px solid ${C.lt}30` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.mid, textTransform: "uppercase",
                        letterSpacing: "0.07em", marginBottom: 4 }}>Recommendation</div>
                      <p style={{ margin: 0, color: C.blue, fontSize: 13, lineHeight: 1.7 }}>{f.recommendation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Actions ── */}
          <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={reset}
              style={{ padding: "11px 26px", background: C.white, border: `1.5px solid ${C.border}`,
                borderRadius: 12, color: "#374151", cursor: "pointer", fontSize: 13.5, fontWeight: 600 }}>
              Run Another Analysis
            </button>
            <button onClick={() => navigate("/dashboard")}
              style={{ padding: "11px 26px",
                background: `linear-gradient(135deg, ${C.blue}, ${C.mid})`,
                border: "none", borderRadius: 12, color: C.white, cursor: "pointer",
                fontSize: 13.5, fontWeight: 700, boxShadow: `0 6px 20px ${C.blue}30` }}>
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: input page ─────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif", paddingBottom: 80 }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }
        .card { background: ${C.white}; border-radius: 18px; border: 1px solid ${C.border};
          box-shadow: 0 2px 8px rgba(0,30,90,0.07); }
        .mode-tab { flex: 1; padding: 13px 10px; border: none; cursor: pointer;
          font-size: 14px; font-weight: 700; font-family: inherit; transition: all 0.2s;
          border-radius: 12px; }
      `}</style>

      {/* Nav */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 60, position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 1px 6px rgba(0,30,90,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.03em",
            background: `linear-gradient(135deg, ${C.blue}, ${C.mid})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>TrustShield AI</span>
          <div style={{ width: 1, height: 18, background: C.border }}/>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", background: "#E6F2FB",
            color: C.mid, borderRadius: 20, border: `1px solid ${C.lt}40` }}>Self-Assessment & Report Audit</span>
        </div>
        <button onClick={() => navigate("/dashboard")}
          style={{ padding: "8px 18px", background: C.white, border: `1px solid ${C.border}`,
            color: C.muted, borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          ← Dashboard
        </button>
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "36px 20px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-block", padding: "5px 14px", background: "#E6F2FB",
            color: C.mid, borderRadius: 20, fontSize: 11, fontWeight: 700,
            border: `1px solid ${C.lt}40`, marginBottom: 14, letterSpacing: "0.07em",
            textTransform: "uppercase" }}>KPMG Trusted AI Framework</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: C.text, lineHeight: 1.2, marginBottom: 12 }}>
            AI Governance Gap Analysis
          </h1>
          <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, maxWidth: 540, margin: "0 auto" }}>
            Self-assess your AI system or upload an existing audit report.
            Receive a full KPMG TAF coverage analysis across all 10 governance principles.
          </p>
        </div>

        {/* Mode tabs */}
        <div className="card" style={{ padding: 8, display: "flex", gap: 6, marginBottom: 24 }}>
          <button className="mode-tab"
            onClick={() => setTab("form")}
            style={{ background: tab === "form" ? `linear-gradient(135deg, ${C.blue}, ${C.mid})` : "transparent",
              color: tab === "form" ? C.white : C.muted }}>
            📝 Self-Assessment Form
          </button>
          <button className="mode-tab"
            onClick={() => setTab("upload")}
            style={{ background: tab === "upload" ? `linear-gradient(135deg, ${C.blue}, ${C.mid})` : "transparent",
              color: tab === "upload" ? C.white : C.muted }}>
            📄 Upload Existing Report
          </button>
        </div>

        {/* ══ UPLOAD TAB ══ */}
        {tab === "upload" && (
          <div className="card" style={{ padding: "36px 40px" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 6 }}>
              Upload AI Audit Report
            </h2>
            <p style={{ fontSize: 13.5, color: C.muted, marginBottom: 28, lineHeight: 1.6 }}>
              Upload any existing AI audit document — a PDF audit report, a JSON governance report, or a
              self-assessment JSON. Our system will analyse it against all 10 KPMG TAF principles and
              identify coverage gaps and missing regulatory controls.
            </p>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? C.mid : uploadFile ? C.teal : C.border}`,
                borderRadius: 14, padding: "44px 24px", marginBottom: 20,
                background: dragOver ? "#E6F2FB" : uploadFile ? "#F0FDF4" : "#FAFBFD",
                transition: "all 0.2s", cursor: "pointer", textAlign: "center",
              }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>
                {uploadFile ? "✅" : "⬆️"}
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: uploadFile ? C.green : C.text, marginBottom: 4 }}>
                {uploadFile ? uploadFile.name : "Drop your report here or click to browse"}
              </div>
              {uploadFile ? (
                <div style={{ fontSize: 12.5, color: C.green }}>
                  {(uploadFile.size / 1024).toFixed(1)} KB · Ready to analyse
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: C.muted }}>
                  Supports .pdf (text-based) and .json — max 20 MB for PDF, 5 MB for JSON
                </div>
              )}
              <input ref={fileRef} type="file" accept=".pdf,.json" style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}/>
            </div>

            {uploadFile && (
              <div style={{ padding: "12px 16px", background: "#EFF6FF", borderRadius: 10,
                border: `1px solid ${C.lt}30`, marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.mid, marginBottom: 4 }}>WHAT HAPPENS NEXT</div>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>
                  The report content will be extracted and analysed by our Groq LLM engine
                  against all 10 KPMG Trusted AI principles. You will receive a full gap analysis
                  with principle coverage scores, regulatory alignment, and prioritised findings.
                </div>
              </div>
            )}

            {error && (
              <div style={{ padding: "10px 14px", background: "#FEE2E2", border: "1px solid #FECACA",
                borderRadius: 10, color: C.red, fontSize: 13, marginBottom: 16 }}>{error}</div>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              {uploadFile && (
                <button onClick={() => { setUploadFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                  style={{ padding: "12px 20px", background: C.white, border: `1.5px solid ${C.border}`,
                    borderRadius: 12, color: C.muted, cursor: "pointer", fontSize: 13.5, fontWeight: 600 }}>
                  Clear
                </button>
              )}
              <button
                disabled={!uploadFile || loading}
                onClick={submitUpload}
                style={{ flex: 1, padding: "14px 32px",
                  background: (!uploadFile || loading) ? "#C8D4E8" : `linear-gradient(135deg, ${C.blue}, ${C.mid})`,
                  border: "none", borderRadius: 12, color: C.white, fontWeight: 700,
                  fontSize: 15, cursor: (!uploadFile || loading) ? "default" : "pointer",
                  boxShadow: (!uploadFile || loading) ? "none" : `0 6px 20px ${C.blue}30`,
                  transition: "all 0.2s" }}>
                {loading ? "Analysing… (this may take 20–40s)" : "Analyse Report →"}
              </button>
            </div>
          </div>
        )}

        {/* ══ FORM TAB ══ */}
        {tab === "form" && (
          <div>
            {/* Completeness bar */}
            <div className="card" style={{ padding: "16px 20px", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Form Completeness</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: completeness >= 60 ? C.green : completeness >= 30 ? C.amber : C.red }}>
                  {completeness}%
                </span>
              </div>
              <div style={{ height: 8, background: "#E2E8F0", borderRadius: 99 }}>
                <div style={{
                  width: `${completeness}%`, height: "100%", borderRadius: 99,
                  background: completeness >= 60 ? C.teal : completeness >= 30 ? C.amber : C.red,
                  transition: "width 0.4s ease, background 0.3s",
                }}/>
              </div>
              <div style={{ fontSize: 11.5, color: C.muted, marginTop: 6 }}>
                {completeness >= 60 ? "Good coverage — ready for a comprehensive analysis."
                  : completeness >= 30 ? "Moderate — fill in more fields for a more accurate result."
                  : "Fill in at least a few fields to enable meaningful analysis."}
              </div>
            </div>

            <div className="card" style={{ padding: "32px 36px" }}>

              {/* ── Section 1: AI System ── */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
                  paddingBottom: 12, borderBottom: `2px solid #EEF2F9` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8,
                    background: `linear-gradient(135deg, ${C.blue}, ${C.mid})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, color: C.white }}>🤖</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>AI System Identity</div>
                    <div style={{ fontSize: 12, color: C.muted }}>Core information about the AI being assessed</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                  <Field label="AI System Name" required>
                    <Input value={form.aiName} onChange={e => set("aiName", e.target.value)}
                      placeholder="e.g. Customer Support Chatbot, CreditRisk Classifier"/>
                  </Field>
                  <Field label="Version / Build" hint="Optional — helps with traceability">
                    <Input value={form.aiVersion} onChange={e => set("aiVersion", e.target.value)}
                      placeholder="e.g. v2.4.1, 2024-Q4 release"/>
                  </Field>
                </div>

                <Field label="Use Case / Description" required
                  hint="Describe what this AI system does — used to generate contextual probe questions">
                  <Textarea value={form.useCase} onChange={e => set("useCase", e.target.value)}
                    placeholder="e.g. Automates initial screening of job applications by scoring candidate CVs against role requirements and generating a shortlist for HR review."
                    rows={3}/>
                </Field>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                  <Field label="EU AI Act Risk Tier" hint="Determines regulatory obligations">
                    <Select value={form.riskTier} onChange={v => set("riskTier", v)} options={[
                      { value: "Minimal Risk",       label: "Minimal Risk — e.g. spam filters, games" },
                      { value: "Limited Risk",        label: "Limited Risk — e.g. chatbots, emotion recognition" },
                      { value: "High Risk",           label: "High Risk — e.g. hiring, credit, medical, law enforcement" },
                      { value: "Unacceptable Risk",   label: "Unacceptable Risk — prohibited use cases" },
                      { value: "GPAI / Foundation",   label: "GPAI / Foundation Model" },
                    ]}/>
                  </Field>
                  <Field label="Primary Audience" hint="Who uses the AI output">
                    <Select value={form.audience} onChange={v => set("audience", v)} options={[
                      { value: "Internal employees",        label: "Internal employees only" },
                      { value: "Business customers (B2B)",  label: "Business customers (B2B)" },
                      { value: "End consumers (B2C)",       label: "End consumers (B2C)" },
                      { value: "Regulated individuals",     label: "Regulated individuals (patients, applicants, etc.)" },
                      { value: "Government / public sector",label: "Government / public sector" },
                    ]}/>
                  </Field>
                </div>
              </div>

              {/* ── Section 2: Governance ── */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
                  paddingBottom: 12, borderBottom: "2px solid #EEF2F9" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8,
                    background: "linear-gradient(135deg, #FFB020, #F59E0B)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>📋</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Governance & Accountability</div>
                    <div style={{ fontSize: 12, color: C.muted }}>Policies, ownership, and incident response (maps to Accountability principle)</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                  <Field label="Written Responsible AI Policy" hint="Does a formal governance policy exist?">
                    <Select value={form.hasPolicy} onChange={v => set("hasPolicy", v)} options={[
                      { value: "Yes — approved and published",  label: "Yes — approved and published" },
                      { value: "Yes — draft in progress",       label: "Yes — draft in progress" },
                      { value: "No — planned for this quarter", label: "No — planned for this quarter" },
                      { value: "No — not yet started",         label: "No — not yet started" },
                    ]}/>
                  </Field>
                  <Field label="AI Governance Owner" hint="Named individual or team responsible">
                    <Input value={form.governanceOwner} onChange={e => set("governanceOwner", e.target.value)}
                      placeholder="e.g. Chief AI Officer, Head of Responsible AI, CTO"/>
                  </Field>
                </div>

                <Field label="Incident & Escalation Process"
                  hint="How are AI errors, biases, or harms identified and escalated?">
                  <Textarea value={form.incidentProcess} onChange={e => set("incidentProcess", e.target.value)}
                    placeholder="e.g. AI incidents reported via JIRA to Head of AI Engineering within 24 hours. Critical issues escalated to CPO and Legal. Post-incident reports mandatory within 5 business days. Quarterly model performance reviews."
                    rows={3}/>
                </Field>
              </div>

              {/* ── Section 3: Safety ── */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
                  paddingBottom: 12, borderBottom: "2px solid #EEF2F9" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8,
                    background: "linear-gradient(135deg, #FBBF24, #F59E0B)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🦺</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Safety Controls & Human Oversight</div>
                    <div style={{ fontSize: 12, color: C.muted }}>Maps to Safety and Reliability principles</div>
                  </div>
                </div>

                <Field label="Safety Controls in Place"
                  hint="What mechanisms prevent harmful, incorrect, or biased outputs?">
                  <Textarea value={form.safetyControls} onChange={e => set("safetyControls", e.target.value)}
                    placeholder="e.g. Confidence threshold of 0.75 — low-confidence outputs routed to human review. Prohibited content filter on all outputs. Monthly red-team exercises. Adversarial input testing before each release."
                    rows={3}/>
                </Field>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                  <Field label="Human Oversight Mechanism"
                    hint="Can humans review, override, or reject AI decisions?">
                    <Select value={form.humanOversight} onChange={v => set("humanOversight", v)} options={[
                      { value: "Full human review of all decisions",       label: "Full human review of all decisions" },
                      { value: "Human review for high-risk decisions only",label: "Human review for high-risk decisions only" },
                      { value: "Human can override at any time",           label: "Human can override at any time" },
                      { value: "Automated with exception reporting",       label: "Automated with exception reporting only" },
                      { value: "Fully automated — no human review",       label: "Fully automated — no human review" },
                    ]}/>
                  </Field>
                  <Field label="Output Filtering / Moderation">
                    <Select value={form.outputFiltering} onChange={v => set("outputFiltering", v)} options={[
                      { value: "Automated content safety classifier",  label: "Automated content safety classifier" },
                      { value: "Rule-based keyword filtering",         label: "Rule-based keyword filtering" },
                      { value: "Human editorial review of outputs",    label: "Human editorial review of outputs" },
                      { value: "Multiple layers of filtering",         label: "Multiple layers (automated + human)" },
                      { value: "No output filtering currently",        label: "No output filtering currently" },
                    ]}/>
                  </Field>
                </div>
              </div>

              {/* ── Section 4: Fairness ── */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
                  paddingBottom: 12, borderBottom: "2px solid #EEF2F9" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8,
                    background: "linear-gradient(135deg, #FF6B9D, #EC4899)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>⚖️</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Fairness & Transparency</div>
                    <div style={{ fontSize: 12, color: C.muted }}>Maps to Fairness, Transparency, and Explainability principles</div>
                  </div>
                </div>

                <Field label="Bias Testing Methodology"
                  hint="How do you test for discriminatory outcomes?">
                  <Textarea value={form.biasTesting} onChange={e => set("biasTesting", e.target.value)}
                    placeholder="e.g. Quarterly bias audits using synthetic test profiles across gender, age, and ethnicity proxies. Equal Opportunity Ratio monitored per demographic group. Threshold: max 5% disparity in decision rates between groups."
                    rows={3}/>
                </Field>

                <Field label="AI Disclosure to Users"
                  hint="Are users informed they are interacting with or being evaluated by AI?">
                  <Select value={form.disclosed} onChange={v => set("disclosed", v)} options={[
                    { value: "Yes — explicit disclosure at point of interaction", label: "Yes — explicit disclosure at point of interaction" },
                    { value: "Yes — disclosed in terms and privacy policy",       label: "Yes — disclosed in terms and privacy policy" },
                    { value: "Yes — disclosed on request only",                  label: "Yes — disclosed on request only" },
                    { value: "No — not currently disclosed",                     label: "No — not currently disclosed" },
                  ]}/>
                </Field>
              </div>

              {/* ── Section 5: Privacy ── */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
                  paddingBottom: 12, borderBottom: "2px solid #EEF2F9" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8,
                    background: "linear-gradient(135deg, #60A5FA, #3B82F6)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🔐</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Data & Privacy</div>
                    <div style={{ fontSize: 12, color: C.muted }}>Maps to Privacy, Data Integrity, and Security principles</div>
                  </div>
                </div>

                <Field label="PII Handling & Data Minimisation"
                  hint="How is personal data managed within the AI system?">
                  <Textarea value={form.piiHandling} onChange={e => set("piiHandling", e.target.value)}
                    placeholder="e.g. All input data classified for PII before ingestion. Sensitive fields pseudonymised. Raw input deleted after processing. AI system receives minimum data needed for the decision — no unnecessary personal attributes included."
                    rows={3}/>
                </Field>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                  <Field label="Data Retention Policy">
                    <Select value={form.dataRetention} onChange={v => set("dataRetention", v)} options={[
                      { value: "Automated retention enforcement (DLP tool)", label: "Automated enforcement (DLP tool)" },
                      { value: "Manual deletion process with documented schedule", label: "Manual process, documented schedule" },
                      { value: "Retention policy defined but not yet enforced", label: "Defined but not yet enforced" },
                      { value: "No formal retention policy",                  label: "No formal retention policy" },
                    ]}/>
                  </Field>
                  <Field label="Applicable Regulations"
                    hint="Which data protection regulations apply?">
                    <Input value={form.regulatoryScope} onChange={e => set("regulatoryScope", e.target.value)}
                      placeholder="e.g. GDPR (EU), UK GDPR, CCPA (California), HIPAA (healthcare)"/>
                  </Field>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ padding: "10px 14px", background: "#FEE2E2", border: "1px solid #FECACA",
                  borderRadius: 10, color: C.red, fontSize: 13, marginBottom: 16 }}>{error}</div>
              )}

              {/* Submit */}
              <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
                <button
                  onClick={submitForm}
                  disabled={loading}
                  style={{ flex: 1, padding: "15px 32px",
                    background: loading ? "#C8D4E8" : `linear-gradient(135deg, ${C.blue}, ${C.mid})`,
                    border: "none", borderRadius: 12, color: C.white, fontWeight: 700,
                    fontSize: 15, cursor: loading ? "default" : "pointer",
                    boxShadow: loading ? "none" : `0 6px 20px ${C.blue}30`,
                    transition: "all 0.2s" }}>
                  {loading ? "Analysing… (this may take 20–40s)" : "Run TAF Gap Analysis →"}
                </button>
              </div>
              <div style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 10 }}>
                Your responses are converted to a structured JSON and analysed by Groq LLM against all 10 KPMG TAF principles
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}