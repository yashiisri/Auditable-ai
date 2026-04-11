// // // // /* eslint-disable @typescript-eslint/no-explicit-any */
// // // // import { useState } from "react";
// // // // import { useNavigate } from "react-router-dom";
// // // // import { sdccIngest, evaluateAI, runBlackBoxAudit } from "../services/api";

// // // // /* ─────────────────────────────────────────────
// // // //    Types
// // // // ───────────────────────────────────────────── */
// // // // interface BlackBoxFinding {
// // // //   category: string;
// // // //   severity: "High" | "Medium" | "Low" | "Pass";
// // // //   probe: string;
// // // //   response_preview: string;
// // // //   issue: string;
// // // //   recommendation: string;
// // // // }

// // // // interface BlackBoxResult {
// // // //   audit_id: string;
// // // //   ai_name: string;
// // // //   mode: string;
// // // //   status: string;
// // // //   overall_score: number;
// // // //   risk_level: string;
// // // //   probes_run: number;
// // // //   category_scores: Record<string, number>;
// // // //   findings: BlackBoxFinding[];
// // // //   message?: string;
// // // // }

// // // // interface ComputationNote {
// // // //   library: string;
// // // //   status: string;
// // // //   value: number | null;
// // // // }

// // // // interface SdccSummary {
// // // //   model_type: string;
// // // //   logs_ingested: number;
// // // //   data_quality_score: number;
// // // //   structural_risk: string;
// // // //   detection_confidence?: number;
// // // //   recommendation?: string;
// // // //   column_warnings?: string[];
// // // //   has_task_id_col?: boolean;
// // // //   has_input_col?: boolean;
// // // //   has_output_col?: boolean;
// // // //   has_latency_col?: boolean;
// // // //   has_kb_col?: boolean;
// // // //   schema_complete?: boolean;
// // // // }

// // // // /* ─────────────────────────────────────────────
// // // //    Component
// // // // ───────────────────────────────────────────── */
// // // // export default function Dashboard() {
// // // //   const navigate = useNavigate();

// // // //   /* ── Black Box state ── */
// // // //   const [bbMode, setBbMode]         = useState<"api" | "ui">("api");
// // // //   const [bbEndpoint, setBbEndpoint] = useState("");
// // // //   const [bbApiKey, setBbApiKey]     = useState("");
// // // //   const [bbUiUrl, setBbUiUrl]       = useState("");
// // // //   const [bbLoading, setBbLoading]   = useState(false);
// // // //   const [bbResult, setBbResult]     = useState<BlackBoxResult | null>(null);
// // // //   const [bbError, setBbError]       = useState("");
// // // //   const [bbProgress, setBbProgress] = useState(0);

// // // //   /* ── Ingestion state ── */
// // // //   const [file, setFile]                   = useState<File | null>(null);
// // // //   const [ingestLoading, setIngestLoading] = useState(false);
// // // //   const [uploaded, setUploaded]           = useState(false);
// // // //   const [logsCount, setLogsCount]         = useState<number | null>(null);
// // // //   const [uploadSuccess, setUploadSuccess] = useState(false);
// // // //   const [sdccSummary, setSdccSummary]     = useState<SdccSummary | null>(null);
// // // //   const [ingestError, setIngestError]     = useState("");

// // // //   /* ── KB upload state ── */
// // // //   const [kbFiles, setKbFiles]           = useState<FileList | null>(null);
// // // //   const [kbLoading, setKbLoading]       = useState(false);
// // // //   const [kbSuccess, setKbSuccess]       = useState(false);
// // // //   const [kbChunksCount, setKbChunksCount] = useState<number | null>(null);
// // // //   const [kbError, setKbError]           = useState("");

// // // //   /* ── Evaluate state ── */
// // // //   const [evalLoading, setEvalLoading]         = useState(false);
// // // //   const [evalError, setEvalError]             = useState("");
// // // //   const [computationNotes, setComputationNotes] = useState<Record<string, ComputationNote> | null>(null);
// // // //   const [showNotes, setShowNotes]             = useState(false);

// // // //   const aiName = localStorage.getItem("activeAI") || "";

// // // //   /* ── Helpers ── */
// // // //   const extractErr = (e: any): string => {
// // // //     if (!e?.response) return "Cannot reach backend. Ensure the server is running.";
// // // //     return e.response?.data?.detail || "Operation failed.";
// // // //   };

// // // //   const handleLogout = () => {
// // // //     localStorage.removeItem("token");
// // // //     localStorage.removeItem("activeAI");
// // // //     navigate("/login");
// // // //   };

// // // //   /* ─────────────────────────────────────────────
// // // //      BLACK BOX HANDLER
// // // //   ───────────────────────────────────────────── */
// // // //   const handleBlackBox = async () => {
// // // //     if (bbMode === "api" && (!bbEndpoint || !bbApiKey)) {
// // // //       setBbError("Please provide both API Endpoint and API Key.");
// // // //       return;
// // // //     }
// // // //     if (bbMode === "ui" && !bbUiUrl) {
// // // //       setBbError("Please provide the deployed UI URL.");
// // // //       return;
// // // //     }

// // // //     setBbLoading(true);
// // // //     setBbError("");
// // // //     setBbResult(null);
// // // //     setBbProgress(0);

// // // //     const totalProbes = 14;
// // // //     const interval = setInterval(() => {
// // // //       setBbProgress((p) => {
// // // //         if (p >= totalProbes - 1) { clearInterval(interval); return p; }
// // // //         return p + 1;
// // // //       });
// // // //     }, 350);

// // // //     try {
// // // //       const res = await runBlackBoxAudit({
// // // //         ai_name:  aiName || "external-ai",
// // // //         mode:     bbMode,
// // // //         endpoint: bbEndpoint,
// // // //         api_key:  bbApiKey,
// // // //         ui_url:   bbUiUrl,
// // // //       });
// // // //       clearInterval(interval);
// // // //       setBbProgress(totalProbes);
// // // //       setBbResult(res.data);
// // // //     } catch (e: any) {
// // // //       clearInterval(interval);
// // // //       setBbError(extractErr(e));
// // // //     } finally {
// // // //       setBbLoading(false);
// // // //     }
// // // //   };

// // // //   /* ─────────────────────────────────────────────
// // // //      INGESTION HANDLER
// // // //   ───────────────────────────────────────────── */
// // // //   const handleUpload = async () => {
// // // //     if (!aiName) { navigate("/register-ai"); return; }
// // // //     if (!file)   { setIngestError("Select a file first."); return; }

// // // //     setIngestLoading(true);
// // // //     setIngestError("");
// // // //     setUploadSuccess(false);
// // // //     setSdccSummary(null);
// // // //     setComputationNotes(null);

// // // //     try {
// // // //       const res = await sdccIngest(aiName, file);
// // // //       setSdccSummary(res.data);
// // // //       setLogsCount(res.data.logs_ingested ?? null);
// // // //       setUploaded(true);
// // // //       setUploadSuccess(true);
// // // //     } catch (e) {
// // // //       setIngestError(extractErr(e));
// // // //     } finally {
// // // //       setIngestLoading(false);
// // // //     }
// // // //   };

// // // //   /* ─────────────────────────────────────────────
// // // //      KB UPLOAD HANDLER
// // // //   ───────────────────────────────────────────── */


// // // //   const handleKbUpload = async () => {
// // // //   if (!aiName) {
// // // //     alert("No AI selected. Go to Register AI first.");
// // // //     return;
// // // //   }
// // // //   if (!kbFiles || kbFiles.length === 0) {
// // // //     setKbError("Please select at least one KB file.");
// // // //     return;
// // // //   }

// // // //   setKbLoading(true);
// // // //   setKbError("");
// // // //   setKbSuccess(false);

// // // //   const formData = new FormData();
// // // //   for (let i = 0; i < kbFiles.length; i++) {
// // // //     formData.append("files", kbFiles[i]);   // ← must match backend: files: List[UploadFile]
// // // //   }

// // // //   try {
// // // //     const res = await api.post(`/sdcc/upload-kb/${aiName}`, formData, {
// // // //       headers: {
// // // //         "Content-Type": "multipart/form-data",
// // // //       },
// // // //     });

// // // //     setKbChunksCount(res.data.chunks_stored || 0);
// // // //     setKbSuccess(true);
// // // //     setKbError("");

// // // //     // Optional: refresh SDCC status
// // // //     // const statusRes = await api.get(`/sdcc/status/${aiName}`);
// // // //     // setSdccSummary(statusRes.data);

// // // //   } catch (err: any) {
// // // //     console.error(err);
// // // //     const msg = err.response?.data?.detail || err.message || "Failed to upload knowledge base";
// // // //     setKbError(msg);
// // // //     setKbSuccess(false);
// // // //   } finally {
// // // //     setKbLoading(false);
// // // //   }
// // // // };
// // // //   // const handleKbUpload = async () => {
// // // //   //   if (!aiName) { navigate("/register-ai"); return; }
// // // //   //   if (!kbFiles || kbFiles.length === 0) {
// // // //   //     setKbError("Select at least one knowledge base file.");
// // // //   //     return;
// // // //   //   }

// // // //   //   setKbLoading(true);
// // // //   //   setKbError("");
// // // //   //   setKbSuccess(false);

// // // //   //   try {
// // // //   //     const formData = new FormData();
// // // //   //     // Field name MUST be 'files' — matches FastAPI `files: List[UploadFile] = File(...)`
// // // //   //     Array.from(kbFiles).forEach((f) => formData.append("files", f));

// // // //   //     const token = localStorage.getItem("token");

// // // //   //     // Use the project's configured axios instance (same one sdccIngest uses).
// // // //   //     // This ensures baseURL, interceptors, and auth headers are inherited.
// // // //   //     const { default: axios } = await import("axios");

// // // //   //     // Build URL relative — Vite/CRA proxy will forward to FastAPI.
// // // //   //     // Matches the router prefix used by sdccIngest (/api/v1/ai/...)
// // // //   //     const url = `/api/v1/ai/sdcc/upload-kb/${encodeURIComponent(aiName)}`;

// // // //   //     const res = await axios.post(url, formData, {
// // // //   //       headers: {
// // // //   //         Authorization: `Bearer ${token}`,
// // // //   //         // Do NOT set Content-Type — axios sets multipart/form-data + boundary automatically
// // // //   //       },
// // // //   //     });

// // // //   //     setKbChunksCount(res.data?.chunks_stored ?? null);
// // // //   //     setKbSuccess(true);

// // // //   //     // Show any per-file extraction warnings as a non-blocking error message
// // // //   //     if (res.data?.errors?.length) {
// // // //   //       setKbError(`Uploaded with warnings: ${res.data.errors.join("; ")}`);
// // // //   //     }
// // // //   //   } catch (e: any) {
// // // //   //     const detail =
// // // //   //       e?.response?.data?.detail ||
// // // //   //       e?.response?.data?.message ||
// // // //   //       (typeof e?.response?.data === "string" ? e.response.data : null) ||
// // // //   //       e?.message ||
// // // //   //       "KB upload failed. Check that the server is running and the route /api/v1/ai/sdcc/upload-kb is registered.";
// // // //   //     setKbError(detail);
// // // //   //   } finally {
// // // //   //     setKbLoading(false);
// // // //   //   }
// // // //   // };

// // // //   /* ─────────────────────────────────────────────
// // // //      EVALUATE HANDLER
// // // //   ───────────────────────────────────────────── */
// // // //   const handleEvaluate = async () => {
// // // //     if (!uploaded) return;
// // // //     setEvalLoading(true);
// // // //     setEvalError("");
// // // //     setComputationNotes(null);
// // // //     try {
// // // //       const res = await evaluateAI(aiName);
// // // //       if (res.data.computation_notes) {
// // // //         setComputationNotes(res.data.computation_notes);
// // // //       }
// // // //       navigate("/report", { state: { data: res.data } });
// // // //     } catch (e) {
// // // //       setEvalError(extractErr(e));
// // // //     } finally {
// // // //       setEvalLoading(false);
// // // //     }
// // // //   };

// // // //   /* ── Render helpers ── */
// // // //   const totalProbes  = 14;
// // // //   const progressPct  = Math.round((bbProgress / totalProbes) * 100);

// // // //   const noteEntries      = computationNotes
// // // //     ? Object.entries(computationNotes).filter(([k]) => k !== "_error")
// // // //     : [];
// // // //   const computedCount    = noteEntries.filter(([, n]) => n.status === "computed").length;
// // // //   const unavailableCount = noteEntries.filter(([, n]) => n.status !== "computed").length;

// // // //   /* ─────────────────────────────────────────────
// // // //      JSX
// // // //   ───────────────────────────────────────────── */
// // // //   return (
// // // //     <div className="hero">
// // // //       <style>{CSS}</style>

// // // //       <div className="hero-content">

// // // //         {/* TOP BAR */}
// // // //         <div className="top-bar">
// // // //           <div className="top-bar-left">
// // // //             <h1 className="brand-title">Auditable AI™</h1>
// // // //             {aiName && <span className="ai-pill">Auditing: {aiName}</span>}
// // // //           </div>
// // // //           <div style={{ display: "flex", gap: 12 }}>
// // // //             <button className="profile-btn" onClick={() => navigate("/profile")}> Profile</button>
// // // //             <button className="logout-btn" onClick={handleLogout}>Logout →</button>
// // // //           </div>
// // // //         </div>

// // // //         {/* ── ROW 1: Black Box + Ingestion ── */}
// // // //         <div className="card-grid">

// // // //           {/* BLACK BOX CARD */}
// // // //           <div className="glass-card">
// // // //             <h2> Black Box AI Audit</h2>
// // // //             <p className="card-desc">
// // // //               Connect an external AI system and fire 14 governance probes across
// // // //               Safety, Fairness, Accuracy, Transparency, Robustness, and Explainability.
// // // //             </p>

// // // //             {/* Mode toggle */}
// // // //             <div className="toggle-container">
// // // //               <span className="toggle-label">Connection Mode</span>
// // // //               <div
// // // //                 className="toggle-switch"
// // // //                 onClick={() => { setBbMode(bbMode === "api" ? "ui" : "api"); setBbResult(null); setBbError(""); }}
// // // //               >
// // // //                 <div className={`toggle-knob ${bbMode === "api" ? "on" : "off"}`} />
// // // //               </div>
// // // //             </div>
// // // //             <p className="toggle-desc">{bbMode === "api" ? "API Key + Endpoint Mode" : "Deployed UI Mode"}</p>

// // // //             {bbMode === "api" ? (
// // // //               <>
// // // //                 <label>External API Endpoint</label>
// // // //                 <input
// // // //                   type="url" name="bb-endpoint"
// // // //                   autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
// // // //                   placeholder="https://api.openai.com/v1/chat/completions"
// // // //                   value={bbEndpoint} onChange={(e) => setBbEndpoint(e.target.value)}
// // // //                   disabled={bbLoading}
// // // //                 />
// // // //                 <label>API Key</label>
// // // //                 <input
// // // //                   type="text" name="bb-apikey"
// // // //                   autoComplete="new-password" autoCorrect="off" autoCapitalize="off" spellCheck={false}
// // // //                   value={bbApiKey} onChange={(e) => setBbApiKey(e.target.value)}
// // // //                   placeholder="sk-xxxx…"
// // // //                   disabled={bbLoading}
// // // //                 />
// // // //               </>
// // // //             ) : (
// // // //               <>
// // // //                 <label>Deployed UI URL</label>
// // // //                 <input
// // // //                   type="url" name="bb-uiurl" autoComplete="off"
// // // //                   value={bbUiUrl} onChange={(e) => setBbUiUrl(e.target.value)}
// // // //                   placeholder="https://your-chatbot.vercel.app"
// // // //                   disabled={bbLoading}
// // // //                 />
// // // //                 <div className="info-box">
// // // //                   ℹ UI audits run using secure backend browser automation.
// // // //                   Ensure the chatbot URL is publicly accessible.
// // // //                 </div>
// // // //               </>
// // // //             )}

// // // //             {bbError && <div className="error-inline">{bbError}</div>}

// // // //             <button onClick={handleBlackBox} disabled={bbLoading}>
// // // //               {bbLoading ? "Probing AI…" : "Run Black Box Audit →"}
// // // //             </button>

// // // //             {bbLoading && (
// // // //               <div className="probe-progress">
// // // //                 <div className="probe-bar-track">
// // // //                   <div className="probe-bar-fill" style={{ width: `${progressPct}%` }} />
// // // //                 </div>
// // // //                 <span className="probe-label">
// // // //                   Firing probe {bbProgress}/{totalProbes}… ({progressPct}%)
// // // //                 </span>
// // // //               </div>
// // // //             )}
// // // //           </div>

// // // //           {/* INGESTION CARD */}
// // // //           <div className="glass-card">
// // // //             <h2> Data Ingestion (SDCC)</h2>

// // // //             {!aiName && (
// // // //               <div className="warn-box">
// // // //                  No AI registered.{" "}
// // // //                 <span className="link-text" onClick={() => navigate("/register-ai")}>Register one →</span>
// // // //               </div>
// // // //             )}

// // // //             {/* Required schema hint */}
// // // //             <div className="info-box" style={{ fontSize: 12, lineHeight: 1.7 }}>
// // // //               <strong style={{ color: "#4AACDF" }}>Required columns:</strong>{" "}
// // // //               <code>task_id</code> · <code>input</code> · <code>output</code> · <code>latency</code>
// // // //               <br />
// // // //               <span style={{ color: "#64748B" }}>
// // // //                 The AI judges each response for correctness automatically.
// // // //                 Upload a knowledge base below to ground the evaluation in your own documents.
// // // //               </span>
// // // //             </div>

// // // //             <p className="toggle-desc">SDCC structural analysis + LLM-as-a-Judge pipeline</p>

// // // //             <label>Select Log File (.csv or .json)</label>
// // // //             <input
// // // //               type="file"
// // // //               accept=".csv,.json"
// // // //               onChange={(e) => {
// // // //                 setFile(e.target.files?.[0] || null);
// // // //                 setUploaded(false);
// // // //                 setUploadSuccess(false);
// // // //                 setSdccSummary(null);
// // // //                 setComputationNotes(null);
// // // //               }}
// // // //             />

// // // //             <button onClick={handleUpload} disabled={ingestLoading || !file}>
// // // //               {ingestLoading ? "Uploading…" : "Upload Logs"}
// // // //             </button>

// // // //             {uploadSuccess && logsCount !== null && (
// // // //               <div className="success-message"> Ingested {logsCount} records successfully.</div>
// // // //             )}
// // // //             {ingestError && <div className="error-inline">{ingestError}</div>}

// // // //             {/* Column warnings */}
// // // //             {sdccSummary?.column_warnings && sdccSummary.column_warnings.length > 0 && (
// // // //               <div className="warn-box" style={{ marginTop: 4 }}>
// // // //                 {sdccSummary.column_warnings.map((w, i) => (
// // // //                   <div key={i} style={{ marginBottom: i < sdccSummary.column_warnings!.length - 1 ? 6 : 0 }}>
// // // //                      {w}
// // // //                   </div>
// // // //                 ))}
// // // //               </div>
// // // //             )}

// // // //             {/* Schema column status badges */}
// // // //             {sdccSummary && (
// // // //               <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
// // // //                 {[
// // // //                   { key: "has_task_id_col", label: "task_id" },
// // // //                   { key: "has_input_col",   label: "input"   },
// // // //                   { key: "has_output_col",  label: "output"  },
// // // //                   { key: "has_latency_col", label: "latency" },
// // // //                 ].map(({ key, label }) => {
// // // //                   const ok = (sdccSummary as any)[key];
// // // //                   return (
// // // //                     <span key={key} className={`col-badge ${ok ? "col-ok" : "col-warn"}`}>
// // // //                       {ok ? "" : ""} {label}
// // // //                     </span>
// // // //                   );
// // // //                 })}
// // // //               </div>
// // // //             )}

// // // //             {/* KB upload section */}
// // // //             <div style={{
// // // //               marginTop: 8,
// // // //               padding: "16px",
// // // //               background: "#F8FBFF",
// // // //               border: "1px dashed #D6E6FF",
// // // //               borderRadius: 12,
// // // //               display: "flex",
// // // //               flexDirection: "column",
// // // //               gap: 10,
// // // //             }}>
// // // //               <div style={{ fontSize: 13, fontWeight: 600, color: "#005EB8" }}>
// // // //                  Knowledge Base (Optional)
// // // //               </div>
// // // //               <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>
// // // //                 Upload PDF, TXT, MD, DOCX, or CSV files. The LLM judge will first
// // // //                 search your KB before using its own knowledge to assess correctness.
// // // //                 Multiple files accepted.
// // // //               </div>
// // // //               <input
// // // //                 type="file"
// // // //                 accept=".pdf,.txt,.md,.docx,.csv"
// // // //                 multiple
// // // //                 onChange={(e) => {
// // // //                   setKbFiles(e.target.files);
// // // //                   setKbSuccess(false);
// // // //                   setKbError("");
// // // //                 }}
// // // //                 style={{ fontSize: 12 }}
// // // //               />
// // // //               <button
// // // //                 onClick={handleKbUpload}
// // // //                 disabled={kbLoading || !kbFiles || kbFiles.length === 0}
// // // //                 style={{
// // // //                   padding: "10px 0",
// // // //                   background: "linear-gradient(135deg, #1D4ED8, #3B82F6)",
// // // //                   fontSize: 13,
// // // //                 }}
// // // //               >
// // // //                 {kbLoading ? "Uploading KB…" : "Upload Knowledge Base →"}
// // // //               </button>
// // // //               {kbSuccess && kbChunksCount !== null && (
// // // //                 <div className="success-message" style={{ fontSize: 12 }}>
// // // //                    {kbChunksCount} KB chunks stored. Judge will use these for evaluation.
// // // //                 </div>
// // // //               )}
// // // //               {kbError && <div className="error-inline" style={{ fontSize: 12 }}>{kbError}</div>}
// // // //             </div>
// // // //           </div>
// // // //         </div>

// // // //         {/* ── BLACK BOX RESULT SUMMARY ── */}
// // // //         {bbResult && bbResult.status !== "manual_required" && (
// // // //           <div className="blackbox-summary glass-card" style={{ marginBottom: "36px" }}>
// // // //             <h2> Black Box Audit Summary</h2>
// // // //             <div className="sdcc-grid">
// // // //               <div className="metric-item">
// // // //                 <span>Probes Run</span>
// // // //                 <strong>{bbResult.probes_run}</strong>
// // // //               </div>
// // // //               <div className="metric-item">
// // // //                 <span>Findings</span>
// // // //                 <strong style={{ color: bbResult.findings.length === 0 ? "#10B981" : "#EF4444" }}>
// // // //                   {bbResult.findings.length}
// // // //                 </strong>
// // // //               </div>
// // // //               <div className={`metric-item risk-${bbResult.risk_level.toLowerCase()}`}>
// // // //                 <span>Risk Level</span>
// // // //                 <strong>{bbResult.risk_level}</strong>
// // // //               </div>
// // // //             </div>
// // // //             <div className="sdcc-recommendation">
// // // //                {bbResult.findings.length === 0
// // // //                 ? `${bbResult.ai_name || "The AI system"} passed all ${bbResult.probes_run} governance probes. No violations detected.`
// // // //                 : `${bbResult.findings.length} governance violation(s) detected across ${[...new Set(bbResult.findings.map((f: BlackBoxFinding) => f.category))].join(", ")}. Immediate remediation recommended.`
// // // //               }
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {bbResult && bbResult.status === "manual_required" && (
// // // //           <div className="glass-card" style={{ marginBottom: "36px", borderColor: "rgba(255,176,32,0.3)" }}>
// // // //             <h2> UI Mode — Manual Review Required</h2>
// // // //             <p style={{ color: "#9DBFE0", fontSize: "14px", lineHeight: "1.6" }}>{bbResult.message}</p>
// // // //           </div>
// // // //         )}

// // // //         {/* ── SDCC SUMMARY ── */}
// // // //         {sdccSummary && (
// // // //           <div className="sdcc-summary glass-card">
// // // //             <h2> SDCC Structural Summary</h2>
// // // //             <div className="sdcc-grid">
// // // //               <div className="metric-item">
// // // //                 <span>Model Type</span>
// // // //                 <strong>{sdccSummary.model_type}</strong>
// // // //               </div>
// // // //               <div className="metric-item">
// // // //                 <span>Logs Ingested</span>
// // // //                 <strong>{sdccSummary.logs_ingested}</strong>
// // // //               </div>
// // // //               <div className="metric-item">
// // // //                 <span>Data Quality</span>
// // // //                 <strong>{sdccSummary.data_quality_score}%</strong>
// // // //               </div>
// // // //               <div className={`metric-item risk-${sdccSummary.structural_risk.toLowerCase()}`}>
// // // //                 <span>Structural Risk</span>
// // // //                 <strong>{sdccSummary.structural_risk}</strong>
// // // //               </div>
// // // //               {sdccSummary.detection_confidence !== undefined && (
// // // //                 <div className="metric-item">
// // // //                   <span>Detection Confidence</span>
// // // //                   <strong>{Math.round(sdccSummary.detection_confidence * 100)}%</strong>
// // // //                 </div>
// // // //               )}
// // // //               <div className={`metric-item ${sdccSummary.schema_complete ? "risk-low" : "risk-moderate"}`}>
// // // //                 <span>Schema</span>
// // // //                 <strong>{sdccSummary.schema_complete ? "Complete " : "Partial "}</strong>
// // // //               </div>
// // // //             </div>

// // // //             {sdccSummary.recommendation && (
// // // //               <div className="sdcc-recommendation">
// // // //                  {(() => {
// // // //                   const mt   = sdccSummary.model_type || "AI system";
// // // //                   const risk = sdccSummary.structural_risk || "Unknown";
// // // //                   const dq   = sdccSummary.data_quality_score || 0;
// // // //                   if (risk === "Low" && dq >= 75)
// // // //                     return `${mt} shows strong structural integrity. Proceed to full evaluation to generate your governance audit report.`;
// // // //                   if (risk === "High" || dq < 50)
// // // //                     return `${mt} has structural risk indicators. Ensure task_id, input, output, and latency columns are present.`;
// // // //                   return `${mt} ingested with ${risk.toLowerCase()} structural risk. Run the full evaluation below to score across all 10 KPMG Trusted AI principles.`;
// // // //                 })()}
// // // //               </div>
// // // //             )}
// // // //           </div>
// // // //         )}

// // // //         {/* ── COMPUTATION NOTES ── */}
// // // //         {computationNotes && noteEntries.length > 0 && (
// // // //           <div className="glass-card sdcc-enterprise" style={{ marginBottom: 36 }}>
// // // //             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
// // // //               <h2 style={{ margin: 0 }}> Metric Computation Summary</h2>
// // // //               <button className="toggle-notes-btn" onClick={() => setShowNotes((v) => !v)}>
// // // //                 {showNotes ? "Hide details ▲" : "Show details ▼"}
// // // //               </button>
// // // //             </div>
// // // //             <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
// // // //               <div className="metric-card" style={{ flex: 1 }}>
// // // //                 <span>Computed</span>
// // // //                 <strong style={{ color: "#00C896" }}>{computedCount}</strong>
// // // //               </div>
// // // //               <div className="metric-card" style={{ flex: 1 }}>
// // // //                 <span>Unavailable</span>
// // // //                 <strong style={{ color: "#ffb020" }}>{unavailableCount}</strong>
// // // //               </div>
// // // //               <div className="metric-card" style={{ flex: 1 }}>
// // // //                 <span>Total Metrics</span>
// // // //                 <strong>{noteEntries.length}</strong>
// // // //               </div>
// // // //             </div>

// // // //             {unavailableCount > 0 && (
// // // //               <div className="info-box" style={{ marginTop: 8, fontSize: 12 }}>
// // // //                  {unavailableCount} metric(s) couldn't be computed — missing required columns.
// // // //                 Ensure your CSV has <code>task_id</code>, <code>input</code>, <code>output</code>, and <code>latency</code>.
// // // //               </div>
// // // //             )}

// // // //             {showNotes && (
// // // //               <div className="notes-grid" style={{ marginTop: 16 }}>
// // // //                 {noteEntries.map(([key, note]) => (
// // // //                   <div key={key} className={`note-card ${note.status === "computed" ? "note-ok" : "note-miss"}`}>
// // // //                     <div className="note-key">{key.replace(/_/g, " ")}</div>
// // // //                     <div className="note-val">
// // // //                       {note.value !== null ? note.value.toFixed(4) : "—"}
// // // //                     </div>
// // // //                     <div className="note-lib">{note.library}</div>
// // // //                     <div className={`note-status ${note.status === "computed" ? "ok" : "miss"}`}>
// // // //                       {note.status === "computed" ? " computed" : " unavailable"}
// // // //                     </div>
// // // //                   </div>
// // // //                 ))}
// // // //               </div>
// // // //             )}
// // // //           </div>
// // // //         )}

// // // //         {/* ── RUN FULL EVALUATION ── */}
// // // //         <div className="center" style={{ marginTop: "40px" }}>
// // // //           <button className="run-btn" onClick={handleEvaluate} disabled={!uploaded || evalLoading}>
// // // //             {evalLoading ? "Running LLM Judge & evaluating…" : "Run Full Evaluation →"}
// // // //           </button>
// // // //           {evalLoading && (
// // // //             <p className="hint-text" style={{ marginTop: 12 }}>
// // // //               The LLM judge is assessing each response for correctness — this may take a moment…
// // // //             </p>
// // // //           )}
// // // //           {!uploaded && <p className="hint-text">Upload logs above to enable evaluation</p>}
// // // //           {evalError && <div className="error-inline" style={{ marginTop: "16px" }}>{evalError}</div>}
// // // //         </div>

// // // //       </div>
// // // //     </div>
// // // //   );
// // // // }

// // // // /* ─────────────────────────────────────────────
// // // //    CSS
// // // // ───────────────────────────────────────────── */
// // // // const CSS=`
// // // // @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

// // // // * { box-sizing: border-box; }

// // // // .hero {
// // // //   min-height: 100vh;
// // // //   background: #F4F7FB;
// // // //   display: flex;
// // // //   justify-content: center;
// // // //   padding: 40px 20px;
// // // //   font-family: 'Inter', sans-serif;
// // // //   color: #0B1F33;
// // // // }

// // // // .hero-content { width: 100%; max-width: 1200px; }

// // // // /* TOP BAR */
// // // // .top-bar {
// // // //   display: flex; justify-content: space-between; align-items: center;
// // // //   margin-bottom: 36px; padding-bottom: 20px;
// // // //   border-bottom: 1px solid #E3EAF3;
// // // // }
// // // // .top-bar-left { display: flex; align-items: center; gap: 16px; }
// // // // .brand-title { font-size: 26px; font-weight: 800; margin: 0; color: #00338D; }
// // // // .ai-pill {
// // // //   background: #E6F2FB; border: 1px solid #D6E6FF;
// // // //   border-radius: 20px; padding: 4px 14px; font-size: 13px; color: #005EB8;
// // // // }
// // // // .profile-btn {
// // // //   padding: 10px 22px; border-radius: 10px; border: 1px solid #D6E6FF;
// // // //   background: #F8FBFF; color: #005EB8; font-weight: 600; font-size: 14px;
// // // //   cursor: pointer; transition: 0.25s;
// // // // }
// // // // .profile-btn:hover { transform: translateY(-2px); background: #EEF4FF; }
// // // // .logout-btn {
// // // //   padding: 10px 22px; border-radius: 10px; border: 1px solid #FFD6D6;
// // // //   background: #FFF5F5; color: #E5484D; font-weight: 600; font-size: 14px;
// // // //   cursor: pointer; transition: 0.25s;
// // // // }
// // // // .logout-btn:hover { transform: translateY(-2px); }

// // // // /* GRID */
// // // // .card-grid {
// // // //   display: grid;
// // // //   grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
// // // //   gap: 28px; margin-bottom: 36px;
// // // // }

// // // // /* GLASS CARD */
// // // // .glass-card {
// // // //   background: #FFFFFF; border-radius: 18px; padding: 32px;
// // // //   border: 1px solid #E3EAF3; box-shadow: 0 12px 30px rgba(0,0,0,0.06);
// // // //   display: flex; flex-direction: column; gap: 14px; transition: all 0.3s ease;
// // // // }
// // // // .glass-card:hover { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(0,51,141,0.1); }
// // // // .glass-card h2 { font-size: 20px; font-weight: 700; color: #0B1F33; margin: 0; }
// // // // .card-desc { font-size: 13px; color: #6B7C93; line-height: 1.55; margin: 0; }

// // // // /* INPUTS */
// // // // .glass-card label { font-size: 12px; font-weight: 600; color: #005EB8; }
// // // // .glass-card input[type="text"],
// // // // .glass-card input[type="url"],
// // // // .glass-card input[type="file"] {
// // // //   padding: 13px 16px; border-radius: 10px; border: 1px solid #E3EAF3;
// // // //   background: #FFFFFF; color: #0B1F33; font-size: 14px; width: 100%;
// // // // }
// // // // .glass-card input[type="file"] { padding: 10px; font-size: 13px; }
// // // // .glass-card input:focus {
// // // //   border-color: #005EB8; box-shadow: 0 0 0 3px rgba(0,94,184,0.15); outline: none;
// // // // }

// // // // /* BUTTON */
// // // // .glass-card button {
// // // //   padding: 14px; border-radius: 10px; border: none;
// // // //   background: linear-gradient(135deg, #00338D, #005EB8);
// // // //   color: white; font-weight: 600; font-size: 14px; cursor: pointer; transition: 0.25s;
// // // // }
// // // // .glass-card button:hover:not(:disabled) {
// // // //   transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,51,141,0.25);
// // // // }
// // // // .glass-card button:disabled { opacity: 0.5; cursor: not-allowed; }

// // // // /* TOGGLE */
// // // // .toggle-container { display: flex; justify-content: space-between; align-items: center; }
// // // // .toggle-label { font-size: 14px; font-weight: 600; color: #0B1F33; }
// // // // .toggle-switch {
// // // //   width: 50px; height: 26px; background: #E3EAF3;
// // // //   border-radius: 13px; position: relative; cursor: pointer;
// // // // }
// // // // .toggle-knob {
// // // //   width: 22px; height: 22px; border-radius: 50%; background: white;
// // // //   position: absolute; top: 2px; transition: 0.25s;
// // // // }
// // // // .toggle-knob.off { left: 2px; }
// // // // .toggle-knob.on  { left: 26px; background: #005EB8; }
// // // // .toggle-desc { font-size: 12px; color: #6B7C93; }

// // // // /* INFO / WARN / ERROR */
// // // // .info-box {
// // // //   padding: 10px 14px; background: #F0F6FF; border: 1px solid #D6E6FF;
// // // //   border-radius: 10px; font-size: 13px; color: #005EB8;
// // // // }
// // // // .info-box code {
// // // //   background: rgba(0,94,184,0.12); border-radius: 4px; padding: 1px 5px;
// // // //   font-size: 11px; color: #00338D; font-family: monospace;
// // // // }
// // // // .warn-box {
// // // //   padding: 10px 14px; background: rgba(255,176,32,0.08);
// // // //   border: 1px solid rgba(255,176,32,0.3); border-radius: 10px;
// // // //   font-size: 13px; color: #b45309;
// // // // }
// // // // .link-text { cursor: pointer; text-decoration: underline; font-weight: 600; }
// // // // .error-inline {
// // // //   background: #FFF1F1; border: 1px solid #FFD6D6;
// // // //   color: #E5484D; padding: 10px; border-radius: 10px; font-size: 13px;
// // // // }
// // // // .success-message {
// // // //   background: #E6FFF6; border: 1px solid #B2F2D7;
// // // //   color: #00A86B; padding: 10px; border-radius: 10px; font-size: 13px;
// // // // }

// // // // /* PROGRESS */
// // // // .probe-progress { display: flex; flex-direction: column; gap: 6px; }
// // // // .probe-bar-track { height: 6px; background: #E3EAF3; border-radius: 3px; overflow: hidden; }
// // // // .probe-bar-fill {
// // // //   height: 100%; background: linear-gradient(90deg, #00338D, #005EB8);
// // // //   border-radius: 3px; transition: width 0.35s ease;
// // // // }
// // // // .probe-label { font-size: 12px; color: #6B7C93; font-style: italic; }

// // // // /* COL BADGES */
// // // // .col-badge { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
// // // // .col-ok   { background: rgba(0,168,107,0.1); border: 1px solid rgba(0,168,107,0.3); color: #00A86B; }
// // // // .col-warn { background: rgba(255,176,32,0.1); border: 1px solid rgba(255,176,32,0.3); color: #b45309; }

// // // // /* SDCC + BLACKBOX SUMMARIES */
// // // // .blackbox-summary, .sdcc-summary {
// // // //   background: white; border-radius: 20px; padding: 36px;
// // // //   border: 1px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0,0,0,0.06); margin-bottom: 40px;
// // // // }
// // // // .blackbox-summary h2, .sdcc-summary h2 { font-size: 21px; font-weight: 700; color: #1E2937; margin-bottom: 28px; }

// // // // .sdcc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 20px; }
// // // // .metric-item {
// // // //   background: #F8FAFC; padding: 20px 22px; border-radius: 16px;
// // // //   border: 1px solid #E2E8F0; text-align: center; transition: all 0.3s ease;
// // // // }
// // // // .metric-item:hover { background: #F0F7FF; border-color: #BFDBFE; }
// // // // .metric-item span { font-size: 12.5px; color: #64748B; display: block; margin-bottom: 8px; font-weight: 500; }
// // // // .metric-item strong { font-size: 23px; font-weight: 700; color: #1E2937; }

// // // // .risk-low    { color: #059669 !important; }
// // // // .risk-moderate { color: #005EB8 !important; }
// // // // .risk-high   { color: #DC2626 !important; }

// // // // .sdcc-recommendation {
// // // //   margin-top: 28px; padding: 18px 22px; background: #E6F2FB;
// // // //   border-left: 5px solid #005EB8; border-radius: 12px;
// // // //   font-size: 15px; color: #00338D; line-height: 1.6;
// // // // }

// // // // /* COMPUTATION NOTES */
// // // // .sdcc-enterprise { border-color: rgba(0,200,150,0.3); margin-bottom: 36px; }
// // // // .metric-card {
// // // //   background: #F8FAFC; padding: 16px; border-radius: 12px;
// // // //   text-align: center; border: 1px solid #E2E8F0;
// // // // }
// // // // .metric-card span { font-size: 12px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }
// // // // .metric-card strong { font-size: 20px; display: block; margin-top: 6px; color: #1E2937; }
// // // // .toggle-notes-btn {
// // // //   background: #F0F6FF; border: 1px solid #D6E6FF; color: #005EB8;
// // // //   padding: 6px 14px; border-radius: 8px; cursor: pointer;
// // // //   font-size: 12px; font-weight: 600; transition: 0.2s;
// // // // }
// // // // .toggle-notes-btn:hover { background: #E0EDFF; }
// // // // .notes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
// // // // .note-card { padding: 14px; border-radius: 12px; border: 1px solid transparent; background: #F8FAFC; }
// // // // .note-ok   { border-color: rgba(0,168,107,0.25); }
// // // // .note-miss { border-color: rgba(255,176,32,0.2); }
// // // // .note-key  { font-size: 11px; color: #64748B; text-transform: capitalize; margin-bottom: 4px; }
// // // // .note-val  { font-size: 20px; font-weight: 800; color: #1E2937; margin-bottom: 4px; }
// // // // .note-lib  { font-size: 10px; color: #94A3B8; margin-bottom: 6px; line-height: 1.4; }
// // // // .note-status { font-size: 11px; font-weight: 600; }
// // // // .note-status.ok   { color: #00A86B; }
// // // // .note-status.miss { color: #b45309; }

// // // // /* RUN BUTTON */
// // // // .center { text-align: center; }
// // // // .run-btn {
// // // //   padding: 16px 50px; border-radius: 40px; border: none;
// // // //   background: linear-gradient(135deg, #00338D, #005EB8);
// // // //   color: white; font-weight: 700; cursor: pointer; transition: 0.3s;
// // // //   font-size: 16px;
// // // // }
// // // // .run-btn:hover:not(:disabled) { transform: scale(1.04); box-shadow: 0 12px 30px rgba(0,51,141,0.25); }
// // // // .run-btn:disabled { opacity: 0.5; cursor: not-allowed; }
// // // // .hint-text { margin-top: 10px; font-size: 13px; color: #6B7C93; }
// // // // `;



// // // /* eslint-disable @typescript-eslint/no-explicit-any */
// // // import { useState } from "react";
// // // import { useNavigate } from "react-router-dom";
// // // import axios from "axios";
// // // import { sdccIngest, evaluateAI, runBlackBoxAudit } from "../services/api";

// // // /* ─────────────────────────────────────────────
// // //    Types
// // // ───────────────────────────────────────────── */
// // // interface BlackBoxFinding {
// // //   category: string;
// // //   severity: "High" | "Medium" | "Low" | "Pass";
// // //   probe: string;
// // //   response_preview: string;
// // //   issue: string;
// // //   recommendation: string;
// // // }

// // // interface BlackBoxResult {
// // //   audit_id: string;
// // //   ai_name: string;
// // //   mode: string;
// // //   status: string;
// // //   overall_score: number;
// // //   risk_level: string;
// // //   probes_run: number;
// // //   category_scores: Record<string, number>;
// // //   findings: BlackBoxFinding[];
// // //   message?: string;
// // // }

// // // interface ComputationNote {
// // //   library: string;
// // //   status: string;
// // //   value: number | null;
// // // }

// // // interface SdccSummary {
// // //   model_type: string;
// // //   logs_ingested: number;
// // //   data_quality_score: number;
// // //   structural_risk: string;
// // //   detection_confidence?: number;
// // //   recommendation?: string;
// // //   column_warnings?: string[];
// // //   has_task_id_col?: boolean;
// // //   has_input_col?: boolean;
// // //   has_output_col?: boolean;
// // //   has_latency_col?: boolean;
// // //   has_kb_col?: boolean;
// // //   schema_complete?: boolean;
// // // }

// // // /* ─────────────────────────────────────────────
// // //    Component
// // // ───────────────────────────────────────────── */
// // // export default function Dashboard() {
// // //   const navigate = useNavigate();

// // //   /* ── Black Box state ── */
// // //   const [bbMode, setBbMode]         = useState<"api" | "ui">("api");
// // //   const [bbEndpoint, setBbEndpoint] = useState("");
// // //   const [bbApiKey, setBbApiKey]     = useState("");
// // //   const [bbUiUrl, setBbUiUrl]       = useState("");
// // //   const [bbLoading, setBbLoading]   = useState(false);
// // //   const [bbResult, setBbResult]     = useState<BlackBoxResult | null>(null);
// // //   const [bbError, setBbError]       = useState("");
// // //   const [bbProgress, setBbProgress] = useState(0);

// // //   /* ── Ingestion state ── */
// // //   const [file, setFile]                   = useState<File | null>(null);
// // //   const [ingestLoading, setIngestLoading] = useState(false);
// // //   const [uploaded, setUploaded]           = useState(false);
// // //   const [logsCount, setLogsCount]         = useState<number | null>(null);
// // //   const [uploadSuccess, setUploadSuccess] = useState(false);
// // //   const [sdccSummary, setSdccSummary]     = useState<SdccSummary | null>(null);
// // //   const [ingestError, setIngestError]     = useState("");

// // //   /* ── KB upload state ── */
// // //   const [kbFiles, setKbFiles]             = useState<FileList | null>(null);
// // //   const [kbLoading, setKbLoading]         = useState(false);
// // //   const [kbSuccess, setKbSuccess]         = useState(false);
// // //   const [kbChunksCount, setKbChunksCount] = useState<number | null>(null);
// // //   const [kbError, setKbError]             = useState("");

// // //   /* ── Evaluate state ── */
// // //   const [evalLoading, setEvalLoading]           = useState(false);
// // //   const [evalError, setEvalError]               = useState("");
// // //   const [computationNotes, setComputationNotes] = useState<Record<string, ComputationNote> | null>(null);
// // //   const [showNotes, setShowNotes]               = useState(false);

// // //   const aiName = localStorage.getItem("activeAI") || "";

// // //   /* ── Helpers ── */
// // //   const extractErr = (e: any): string => {
// // //     if (!e?.response) return "Cannot reach backend. Ensure the server is running.";
// // //     return e.response?.data?.detail || "Operation failed.";
// // //   };

// // //   const handleLogout = () => {
// // //     localStorage.removeItem("token");
// // //     localStorage.removeItem("activeAI");
// // //     navigate("/login");
// // //   };

// // //   /* ─────────────────────────────────────────────
// // //      BLACK BOX HANDLER
// // //   ───────────────────────────────────────────── */
// // //   const handleBlackBox = async () => {
// // //     if (bbMode === "api" && (!bbEndpoint || !bbApiKey)) {
// // //       setBbError("Please provide both API Endpoint and API Key.");
// // //       return;
// // //     }
// // //     if (bbMode === "ui" && !bbUiUrl) {
// // //       setBbError("Please provide the deployed UI URL.");
// // //       return;
// // //     }

// // //     setBbLoading(true);
// // //     setBbError("");
// // //     setBbResult(null);
// // //     setBbProgress(0);

// // //     const totalProbes = 14;
// // //     const interval = setInterval(() => {
// // //       setBbProgress((p) => {
// // //         if (p >= totalProbes - 1) { clearInterval(interval); return p; }
// // //         return p + 1;
// // //       });
// // //     }, 350);

// // //     try {
// // //       const res = await runBlackBoxAudit({
// // //         ai_name:  aiName || "external-ai",
// // //         mode:     bbMode,
// // //         endpoint: bbEndpoint,
// // //         api_key:  bbApiKey,
// // //         ui_url:   bbUiUrl,
// // //       });
// // //       clearInterval(interval);
// // //       setBbProgress(totalProbes);
// // //       setBbResult(res.data);
// // //     } catch (e: any) {
// // //       clearInterval(interval);
// // //       setBbError(extractErr(e));
// // //     } finally {
// // //       setBbLoading(false);
// // //     }
// // //   };

// // //   /* ─────────────────────────────────────────────
// // //      INGESTION HANDLER
// // //   ───────────────────────────────────────────── */
// // //   const handleUpload = async () => {
// // //     if (!aiName) { navigate("/register-ai"); return; }
// // //     if (!file)   { setIngestError("Select a file first."); return; }

// // //     setIngestLoading(true);
// // //     setIngestError("");
// // //     setUploadSuccess(false);
// // //     setSdccSummary(null);
// // //     setComputationNotes(null);

// // //     try {
// // //       const res = await sdccIngest(aiName, file);
// // //       setSdccSummary(res.data);
// // //       setLogsCount(res.data.logs_ingested ?? null);
// // //       setUploaded(true);
// // //       setUploadSuccess(true);
// // //     } catch (e) {
// // //       setIngestError(extractErr(e));
// // //     } finally {
// // //       setIngestLoading(false);
// // //     }
// // //   };

// // //   /* ─────────────────────────────────────────────
// // //      KB UPLOAD HANDLER  — FIX: use imported `api` instance
// // //   ───────────────────────────────────────────── */
// // //   const handleKbUpload = async () => {
// // //     if (!aiName) {
// // //       alert("No AI selected. Go to Register AI first.");
// // //       return;
// // //     }
// // //     if (!kbFiles || kbFiles.length === 0) {
// // //       setKbError("Please select at least one KB file.");
// // //       return;
// // //     }

// // //     setKbLoading(true);
// // //     setKbError("");
// // //     setKbSuccess(false);

// // //     const formData = new FormData();
// // //     for (let i = 0; i < kbFiles.length; i++) {
// // //       formData.append("files", kbFiles[i]);
// // //     }

// // //     try {
// // //       const token = localStorage.getItem("token");
// // //       const res = await axios.post(
// // //         `http://localhost:8000/sdcc/upload-kb/${encodeURIComponent(aiName)}`,
// // //         formData,
// // //         {
// // //           headers: {
// // //             "Content-Type": "multipart/form-data",
// // //             ...(token ? { Authorization: `Bearer ${token}` } : {}),
// // //           },
// // //         }
// // //       );

// // //       setKbChunksCount(res.data.chunks_stored ?? 0);
// // //       setKbSuccess(true);
// // //       setKbError("");

// // //       if (res.data?.errors?.length) {
// // //         setKbError(`Uploaded with warnings: ${res.data.errors.join("; ")}`);
// // //       }
// // //     } catch (err: any) {
// // //       const msg =
// // //         err.response?.data?.detail ||
// // //         err.message ||
// // //         "Failed to upload knowledge base. Check that the server is running.";
// // //       setKbError(msg);
// // //       setKbSuccess(false);
// // //     } finally {
// // //       setKbLoading(false);
// // //     }
// // //   };

// // //   /* ─────────────────────────────────────────────
// // //      EVALUATE HANDLER
// // //   ───────────────────────────────────────────── */
// // //   const handleEvaluate = async () => {
// // //     if (!uploaded) return;
// // //     setEvalLoading(true);
// // //     setEvalError("");
// // //     setComputationNotes(null);
// // //     try {
// // //       const res = await evaluateAI(aiName);
// // //       if (res.data.computation_notes) {
// // //         setComputationNotes(res.data.computation_notes);
// // //       }
// // //       navigate("/report", { state: { data: res.data } });
// // //     } catch (e) {
// // //       setEvalError(extractErr(e));
// // //     } finally {
// // //       setEvalLoading(false);
// // //     }
// // //   };

// // //   /* ── Render helpers ── */
// // //   const totalProbes  = 14;
// // //   const progressPct  = Math.round((bbProgress / totalProbes) * 100);

// // //   const noteEntries      = computationNotes
// // //     ? Object.entries(computationNotes).filter(([k]) => k !== "_error")
// // //     : [];
// // //   const computedCount    = noteEntries.filter(([, n]) => n.status === "computed").length;
// // //   const unavailableCount = noteEntries.filter(([, n]) => n.status !== "computed").length;

// // //   /* ─────────────────────────────────────────────
// // //      JSX
// // //   ───────────────────────────────────────────── */
// // //   return (
// // //     <div className="hero">
// // //       <style>{CSS}</style>

// // //       <div className="hero-content">

// // //         {/* TOP BAR */}
// // //         <div className="top-bar">
// // //           <div className="top-bar-left">
// // //             <h1 className="brand-title">Auditable AI™</h1>
// // //             {aiName && <span className="ai-pill">Auditing: {aiName}</span>}
// // //           </div>
// // //           <div style={{ display: "flex", gap: 12 }}>
// // //             <button className="profile-btn" onClick={() => navigate("/profile")}>Profile</button>
// // //             <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
// // //           </div>
// // //         </div>

// // //         {/* ── HERO BANNER ── */}
// // //         <div className="hero-banner">
// // //           <div className="hero-banner-inner">
// // //             <div className="hero-badge">KPMG Trusted AI Framework</div>
// // //             <h2 className="hero-heading">Enterprise AI Governance, Automated.</h2>
// // //             <p className="hero-subheading">
// // //               Upload your AI system's inference logs to receive a comprehensive governance audit
// // //               scored across 10 Trusted AI principles — Transparency, Fairness, Accountability,
// // //               Data Integrity, Reliability, Security, Privacy, Sustainability, Explainability, and Safety.
// // //               Assess regulatory alignment with the EU AI Act, ISO 42001, and NIST AI RMF in minutes.
// // //             </p>
// // //             <div className="hero-stats">
// // //               <div className="hero-stat">
// // //                 <span className="hero-stat-num">10</span>
// // //                 <span className="hero-stat-label">AI Principles</span>
// // //               </div>
// // //               <div className="hero-stat-divider" />
// // //               <div className="hero-stat">
// // //                 <span className="hero-stat-num">14</span>
// // //                 <span className="hero-stat-label">Governance Probes</span>
// // //               </div>
// // //               <div className="hero-stat-divider" />
// // //               <div className="hero-stat">
// // //                 <span className="hero-stat-num">4</span>
// // //                 <span className="hero-stat-label">Regulatory Frameworks</span>
// // //               </div>
// // //             </div>
// // //           </div>
// // //         </div>

// // //         {/* ── ROW 1: Black Box + Ingestion ── */}
// // //         <div className="section-label">Audit Modules</div>
// // //         <div className="card-grid">

// // //           {/* BLACK BOX CARD */}
// // //           <div className="glass-card">
// // //             <div className="card-header">
// // //               <div className="card-icon card-icon--blue">
// // //                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
// // //               </div>
// // //               <div>
// // //                 <h2>Black Box Audit</h2>
// // //                 <p className="card-desc">
// // //                   Connect any external AI via API or deployed URL. The system fires 14 governance
// // //                   probes across Safety, Fairness, Accuracy, Transparency, Robustness, and
// // //                   Explainability — no access to model internals required.
// // //                 </p>
// // //               </div>
// // //             </div>

// // //             {/* Mode toggle */}
// // //             <div className="toggle-container">
// // //               <span className="toggle-label">Connection Mode</span>
// // //               <div
// // //                 className="toggle-switch"
// // //                 onClick={() => { setBbMode(bbMode === "api" ? "ui" : "api"); setBbResult(null); setBbError(""); }}
// // //               >
// // //                 <div className={`toggle-knob ${bbMode === "api" ? "on" : "off"}`} />
// // //               </div>
// // //             </div>
// // //             <p className="toggle-desc">{bbMode === "api" ? "API Key + Endpoint Mode" : "Deployed UI Mode"}</p>

// // //             {bbMode === "api" ? (
// // //               <>
// // //                 <label>External API Endpoint</label>
// // //                 <input
// // //                   type="url" name="bb-endpoint"
// // //                   autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
// // //                   placeholder="https://api.openai.com/v1/chat/completions"
// // //                   value={bbEndpoint} onChange={(e) => setBbEndpoint(e.target.value)}
// // //                   disabled={bbLoading}
// // //                 />
// // //                 <label>API Key</label>
// // //                 <input
// // //                   type="text" name="bb-apikey"
// // //                   autoComplete="new-password" autoCorrect="off" autoCapitalize="off" spellCheck={false}
// // //                   value={bbApiKey} onChange={(e) => setBbApiKey(e.target.value)}
// // //                   placeholder="sk-xxxx…"
// // //                   disabled={bbLoading}
// // //                 />
// // //               </>
// // //             ) : (
// // //               <>
// // //                 <label>Deployed UI URL</label>
// // //                 <input
// // //                   type="url" name="bb-uiurl" autoComplete="off"
// // //                   value={bbUiUrl} onChange={(e) => setBbUiUrl(e.target.value)}
// // //                   placeholder="https://your-chatbot.vercel.app"
// // //                   disabled={bbLoading}
// // //                 />
// // //                 <div className="info-box">
// // //                   UI audits use secure backend browser automation. Ensure the chatbot URL is publicly accessible.
// // //                 </div>
// // //               </>
// // //             )}

// // //             {bbError && <div className="error-inline">{bbError}</div>}

// // //             <button onClick={handleBlackBox} disabled={bbLoading}>
// // //               {bbLoading ? "Running probes…" : "Run Black Box Audit"}
// // //             </button>

// // //             {bbLoading && (
// // //               <div className="probe-progress">
// // //                 <div className="probe-bar-track">
// // //                   <div className="probe-bar-fill" style={{ width: `${progressPct}%` }} />
// // //                 </div>
// // //                 <span className="probe-label">
// // //                   Firing probe {bbProgress}/{totalProbes} ({progressPct}%)
// // //                 </span>
// // //               </div>
// // //             )}
// // //           </div>

// // //           {/* INGESTION CARD */}
// // //           <div className="glass-card">
// // //             <div className="card-header">
// // //               <div className="card-icon card-icon--green">
// // //                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
// // //               </div>
// // //               <div>
// // //                 <h2>Log Ingestion &amp; Analysis</h2>
// // //               </div>
// // //             </div>

// // //             {!aiName && (
// // //               <div className="warn-box">
// // //                 No AI system registered.{" "}
// // //                 <span className="link-text" onClick={() => navigate("/register-ai")}>Register one to continue</span>
// // //               </div>
// // //             )}

// // //             {/* Required schema hint */}
// // //             <div className="info-box" style={{ fontSize: 12, lineHeight: 1.7 }}>
// // //               <strong style={{ color: "#4AACDF" }}>Required columns:</strong>{" "}
// // //               <code>task_id</code> · <code>input</code> · <code>output</code> · <code>latency</code>
// // //               <br />
// // //               <span style={{ color: "#64748B" }}>
// // //                 Each response is automatically assessed for correctness using an LLM judge.
// // //                 Upload a knowledge base below to ground the evaluation in your own documents.
// // //               </span>
// // //             </div>

// // //             <p className="toggle-desc">SDCC structural analysis + LLM-as-a-Judge pipeline</p>

// // //             <label>Select Log File (.csv or .json)</label>
// // //             <input
// // //               type="file"
// // //               accept=".csv,.json"
// // //               onChange={(e) => {
// // //                 setFile(e.target.files?.[0] || null);
// // //                 setUploaded(false);
// // //                 setUploadSuccess(false);
// // //                 setSdccSummary(null);
// // //                 setComputationNotes(null);
// // //               }}
// // //             />

// // //             <button onClick={handleUpload} disabled={ingestLoading || !file}>
// // //               {ingestLoading ? "Uploading…" : "Upload Logs"}
// // //             </button>

// // //             {uploadSuccess && logsCount !== null && (
// // //               <div className="success-message">{logsCount} records ingested successfully.</div>
// // //             )}
// // //             {ingestError && <div className="error-inline">{ingestError}</div>}

// // //             {/* Column warnings */}
// // //             {sdccSummary?.column_warnings && sdccSummary.column_warnings.length > 0 && (
// // //               <div className="warn-box" style={{ marginTop: 4 }}>
// // //                 {sdccSummary.column_warnings.map((w, i) => (
// // //                   <div key={i} style={{ marginBottom: i < sdccSummary.column_warnings!.length - 1 ? 6 : 0 }}>
// // //                     {w}
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //             )}

// // //             {/* Schema column status badges */}
// // //             {sdccSummary && (
// // //               <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
// // //                 {[
// // //                   { key: "has_task_id_col", label: "task_id" },
// // //                   { key: "has_input_col",   label: "input"   },
// // //                   { key: "has_output_col",  label: "output"  },
// // //                   { key: "has_latency_col", label: "latency" },
// // //                 ].map(({ key, label }) => {
// // //                   const ok = (sdccSummary as any)[key];
// // //                   return (
// // //                     <span key={key} className={`col-badge ${ok ? "col-ok" : "col-warn"}`}>
// // //                       {ok ? "" : ""} {label}
// // //                     </span>
// // //                   );
// // //                 })}
// // //               </div>
// // //             )}

// // //             {/* KB upload section */}
// // //             <div className="kb-section">
// // //               <div className="kb-header">
// // //                 <div className="kb-icon">
// // //                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
// // //                 </div>
// // //                 <span>Knowledge Base <span className="optional-badge">Optional</span></span>
// // //               </div>
// // //               <div className="kb-desc">
// // //                 Upload PDF, TXT, MD, DOCX, or CSV files. The LLM judge will search your knowledge
// // //                 base before using its own knowledge to assess response correctness. Multiple files accepted.
// // //               </div>
// // //               <input
// // //                 type="file"
// // //                 accept=".pdf,.txt,.md,.docx,.csv"
// // //                 multiple
// // //                 onChange={(e) => {
// // //                   setKbFiles(e.target.files);
// // //                   setKbSuccess(false);
// // //                   setKbError("");
// // //                 }}
// // //                 style={{ fontSize: 12 }}
// // //               />
// // //               <button
// // //                 onClick={handleKbUpload}
// // //                 disabled={kbLoading || !kbFiles || kbFiles.length === 0}
// // //                 className="kb-upload-btn"
// // //               >
// // //                 {kbLoading ? "Uploading knowledge base…" : "Upload Knowledge Base"}
// // //               </button>
// // //               {kbSuccess && kbChunksCount !== null && (
// // //                 <div className="success-message" style={{ fontSize: 12 }}>
// // //                   {kbChunksCount} knowledge base chunks stored. The judge will use these during evaluation.
// // //                 </div>
// // //               )}
// // //               {kbError && <div className="error-inline" style={{ fontSize: 12 }}>{kbError}</div>}
// // //             </div>
// // //           </div>
// // //         </div>

// // //         {/* ── BLACK BOX RESULT SUMMARY ── */}
// // //         {bbResult && bbResult.status !== "manual_required" && (
// // //           <div className="blackbox-summary glass-card" style={{ marginBottom: "36px" }}>
// // //             <h2>Black Box Audit Summary</h2>
// // //             <div className="sdcc-grid">
// // //               <div className="metric-item">
// // //                 <span>Probes Run</span>
// // //                 <strong>{bbResult.probes_run}</strong>
// // //               </div>
// // //               <div className="metric-item">
// // //                 <span>Findings</span>
// // //                 <strong style={{ color: bbResult.findings.length === 0 ? "#10B981" : "#EF4444" }}>
// // //                   {bbResult.findings.length}
// // //                 </strong>
// // //               </div>
// // //               <div className={`metric-item risk-${bbResult.risk_level.toLowerCase()}`}>
// // //                 <span>Risk Level</span>
// // //                 <strong>{bbResult.risk_level}</strong>
// // //               </div>
// // //             </div>
// // //             <div className="sdcc-recommendation">
// // //               {bbResult.findings.length === 0
// // //                 ? `${bbResult.ai_name || "The AI system"} passed all ${bbResult.probes_run} governance probes. No violations detected.`
// // //                 : `${bbResult.findings.length} governance violation(s) detected across ${[...new Set(bbResult.findings.map((f: BlackBoxFinding) => f.category))].join(", ")}. Immediate remediation recommended.`
// // //               }
// // //             </div>
// // //           </div>
// // //         )}

// // //         {bbResult && bbResult.status === "manual_required" && (
// // //           <div className="glass-card" style={{ marginBottom: "36px", borderColor: "rgba(255,176,32,0.3)" }}>
// // //             <h2>UI Mode — Manual Review Required</h2>
// // //             <p style={{ color: "#9DBFE0", fontSize: "14px", lineHeight: "1.6" }}>{bbResult.message}</p>
// // //           </div>
// // //         )}

// // //         {/* ── SDCC SUMMARY ── */}
// // //         {sdccSummary && (
// // //           <div className="sdcc-summary glass-card">
// // //             <h2>Structural Analysis Summary</h2>
// // //             <div className="sdcc-grid">
// // //               <div className="metric-item">
// // //                 <span>Model Type</span>
// // //                 <strong>{sdccSummary.model_type}</strong>
// // //               </div>
// // //               <div className="metric-item">
// // //                 <span>Logs Ingested</span>
// // //                 <strong>{sdccSummary.logs_ingested}</strong>
// // //               </div>
// // //               <div className="metric-item">
// // //                 <span>Data Quality</span>
// // //                 <strong>{sdccSummary.data_quality_score}%</strong>
// // //               </div>
// // //               <div className={`metric-item risk-${sdccSummary.structural_risk.toLowerCase()}`}>
// // //                 <span>Structural Risk</span>
// // //                 <strong>{sdccSummary.structural_risk}</strong>
// // //               </div>
// // //               {sdccSummary.detection_confidence !== undefined && (
// // //                 <div className="metric-item">
// // //                   <span>Detection Confidence</span>
// // //                   <strong>{Math.round(sdccSummary.detection_confidence * 100)}%</strong>
// // //                 </div>
// // //               )}
// // //               <div className={`metric-item ${sdccSummary.schema_complete ? "risk-low" : "risk-moderate"}`}>
// // //                 <span>Schema</span>
// // //                 <strong>{sdccSummary.schema_complete ? "Complete" : "Partial"}</strong>
// // //               </div>
// // //             </div>

// // //             {sdccSummary.recommendation && (
// // //               <div className="sdcc-recommendation">
// // //                 {(() => {
// // //                   const mt   = sdccSummary.model_type || "AI system";
// // //                   const risk = sdccSummary.structural_risk || "Unknown";
// // //                   const dq   = sdccSummary.data_quality_score || 0;
// // //                   if (risk === "Low" && dq >= 75)
// // //                     return `${mt} shows strong structural integrity. Proceed to full evaluation to generate your governance audit report.`;
// // //                   if (risk === "High" || dq < 50)
// // //                     return `${mt} has structural risk indicators. Ensure task_id, input, output, and latency columns are present.`;
// // //                   return `${mt} ingested with ${risk.toLowerCase()} structural risk. Run the full evaluation below to score across all 10 KPMG Trusted AI principles.`;
// // //                 })()}
// // //               </div>
// // //             )}
// // //           </div>
// // //         )}

// // //         {/* ── COMPUTATION NOTES ── */}
// // //         {computationNotes && noteEntries.length > 0 && (
// // //           <div className="glass-card sdcc-enterprise" style={{ marginBottom: 36 }}>
// // //             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
// // //               <h2 style={{ margin: 0 }}>Metric Computation Summary</h2>
// // //               <button className="toggle-notes-btn" onClick={() => setShowNotes((v) => !v)}>
// // //                 {showNotes ? "Hide details" : "Show details"}
// // //               </button>
// // //             </div>
// // //             <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
// // //               <div className="metric-card" style={{ flex: 1 }}>
// // //                 <span>Computed</span>
// // //                 <strong style={{ color: "#00C896" }}>{computedCount}</strong>
// // //               </div>
// // //               <div className="metric-card" style={{ flex: 1 }}>
// // //                 <span>Unavailable</span>
// // //                 <strong style={{ color: "#ffb020" }}>{unavailableCount}</strong>
// // //               </div>
// // //               <div className="metric-card" style={{ flex: 1 }}>
// // //                 <span>Total Metrics</span>
// // //                 <strong>{noteEntries.length}</strong>
// // //               </div>
// // //             </div>

// // //             {unavailableCount > 0 && (
// // //               <div className="info-box" style={{ marginTop: 8, fontSize: 12 }}>
// // //                 {unavailableCount} metric(s) could not be computed — missing required columns.
// // //                 Ensure your CSV has <code>task_id</code>, <code>input</code>, <code>output</code>, and <code>latency</code>.
// // //               </div>
// // //             )}

// // //             {showNotes && (
// // //               <div className="notes-grid" style={{ marginTop: 16 }}>
// // //                 {noteEntries.map(([key, note]) => (
// // //                   <div key={key} className={`note-card ${note.status === "computed" ? "note-ok" : "note-miss"}`}>
// // //                     <div className="note-key">{key.replace(/_/g, " ")}</div>
// // //                     <div className="note-val">
// // //                       {note.value !== null ? note.value.toFixed(4) : "—"}
// // //                     </div>
// // //                     <div className="note-lib">{note.library}</div>
// // //                     <div className={`note-status ${note.status === "computed" ? "ok" : "miss"}`}>
// // //                       {note.status === "computed" ? "computed" : "unavailable"}
// // //                     </div>
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //             )}
// // //           </div>
// // //         )}

// // //         {/* ── RUN FULL EVALUATION ── */}
// // //         <div className="center" style={{ marginTop: "40px" }}>
// // //           <button className="run-btn" onClick={handleEvaluate} disabled={!uploaded || evalLoading}>
// // //             {evalLoading ? "Running LLM Judge & evaluating…" : "Run Full Evaluation"}
// // //           </button>
// // //           {evalLoading && (
// // //             <p className="hint-text" style={{ marginTop: 12 }}>
// // //               The LLM judge is assessing each response for correctness — this may take a moment…
// // //             </p>
// // //           )}
// // //           {!uploaded && <p className="hint-text">Upload logs above to enable evaluation</p>}
// // //           {evalError && <div className="error-inline" style={{ marginTop: "16px" }}>{evalError}</div>}
// // //         </div>

// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // /* ─────────────────────────────────────────────
// // //    CSS
// // // ───────────────────────────────────────────── */
// // // const CSS=`
// // // @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

// // // * { box-sizing: border-box; }

// // // .hero {
// // //   min-height: 100vh;
// // //   background: #F4F7FB;
// // //   display: flex;
// // //   justify-content: center;
// // //   padding: 40px 20px;
// // //   font-family: 'Inter', sans-serif;
// // //   color: #0B1F33;
// // // }

// // // .hero-content { width: 100%; max-width: 1200px; }

// // // /* TOP BAR */
// // // .top-bar {
// // //   display: flex; justify-content: space-between; align-items: center;
// // //   margin-bottom: 32px; padding-bottom: 20px;
// // //   border-bottom: 1px solid #E3EAF3;
// // // }
// // // .top-bar-left { display: flex; align-items: center; gap: 16px; }
// // // .brand-title { font-size: 22px; font-weight: 800; margin: 0; color: #00338D; letter-spacing: -0.02em; }
// // // .ai-pill {
// // //   background: #E6F2FB; border: 1px solid #D6E6FF;
// // //   border-radius: 20px; padding: 4px 14px; font-size: 12px; color: #005EB8; font-weight: 500;
// // // }
// // // .profile-btn {
// // //   padding: 9px 20px; border-radius: 10px; border: 1px solid #D6E6FF;
// // //   background: #F8FBFF; color: #005EB8; font-weight: 600; font-size: 13px;
// // //   cursor: pointer; transition: 0.2s;
// // // }
// // // .profile-btn:hover { background: #EEF4FF; }
// // // .logout-btn {
// // //   padding: 9px 20px; border-radius: 10px; border: 1px solid #FFD6D6;
// // //   background: #FFF5F5; color: #E5484D; font-weight: 600; font-size: 13px;
// // //   cursor: pointer; transition: 0.2s;
// // // }
// // // .logout-btn:hover { background: #FFEEEE; }

// // // /* HERO BANNER */
// // // .hero-banner {
// // //   margin-bottom: 36px;
// // //   border-radius: 20px;
// // //   background: linear-gradient(135deg, #00338D 0%, #005EB8 60%, #0091DA 100%);
// // //   padding: 44px 48px;
// // //   color: white;
// // //   position: relative;
// // //   overflow: hidden;
// // // }
// // // .hero-banner::before {
// // //   content: '';
// // //   position: absolute;
// // //   top: -60px; right: -60px;
// // //   width: 280px; height: 280px;
// // //   background: rgba(255,255,255,0.04);
// // //   border-radius: 50%;
// // // }
// // // .hero-banner::after {
// // //   content: '';
// // //   position: absolute;
// // //   bottom: -40px; right: 100px;
// // //   width: 160px; height: 160px;
// // //   background: rgba(255,255,255,0.03);
// // //   border-radius: 50%;
// // // }
// // // .hero-banner-inner { position: relative; z-index: 1; }
// // // .hero-badge {
// // //   display: inline-block;
// // //   font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
// // //   background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25);
// // //   border-radius: 20px; padding: 5px 14px; color: rgba(255,255,255,0.9);
// // //   margin-bottom: 18px;
// // // }
// // // .hero-heading {
// // //   font-size: 30px; font-weight: 800; letter-spacing: -0.03em; color: white;
// // //   margin: 0 0 14px; line-height: 1.2;
// // // }
// // // .hero-subheading {
// // //   font-size: 14px; color: rgba(255,255,255,0.75); line-height: 1.75;
// // //   max-width: 700px; margin: 0 0 28px;
// // // }
// // // .hero-stats {
// // //   display: flex; align-items: center; gap: 28px; flex-wrap: wrap;
// // // }
// // // .hero-stat { display: flex; flex-direction: column; gap: 3px; }
// // // .hero-stat-num { font-size: 28px; font-weight: 900; color: white; line-height: 1; }
// // // .hero-stat-label { font-size: 11px; color: rgba(255,255,255,0.6); font-weight: 500; letter-spacing: 0.03em; }
// // // .hero-stat-divider { width: 1px; height: 36px; background: rgba(255,255,255,0.2); }

// // // /* SECTION LABEL */
// // // .section-label {
// // //   font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
// // //   color: #94A3B8; margin-bottom: 16px; padding-left: 2px;
// // // }

// // // /* GRID */
// // // .card-grid {
// // //   display: grid;
// // //   grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
// // //   gap: 24px; margin-bottom: 32px;
// // // }

// // // /* GLASS CARD */
// // // .glass-card {
// // //   background: #FFFFFF; border-radius: 18px; padding: 28px;
// // //   border: 1px solid #E3EAF3; box-shadow: 0 1px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,51,141,0.06);
// // //   display: flex; flex-direction: column; gap: 14px; transition: all 0.25s ease;
// // // }
// // // .glass-card:hover { box-shadow: 0 4px 20px rgba(0,51,141,0.1); }
// // // .glass-card h2 { font-size: 18px; font-weight: 700; color: #0B1F33; margin: 0; }

// // // /* CARD HEADER */
// // // .card-header { display: flex; gap: 14px; align-items: flex-start; }
// // // .card-icon {
// // //   width: 38px; height: 38px; border-radius: 10px;
// // //   display: flex; align-items: center; justify-content: center;
// // //   flex-shrink: 0; margin-top: 1px;
// // // }
// // // .card-icon--blue { background: #E6F2FB; color: #005EB8; }
// // // .card-icon--green { background: #DCFCE7; color: #059669; }
// // // .card-desc { font-size: 13px; color: #6B7C93; line-height: 1.6; margin: 6px 0 0; }

// // // /* INPUTS */
// // // .glass-card label { font-size: 12px; font-weight: 600; color: #005EB8; margin-bottom: -6px; }
// // // .glass-card input[type="text"],
// // // .glass-card input[type="url"],
// // // .glass-card input[type="file"] {
// // //   padding: 12px 14px; border-radius: 10px; border: 1px solid #E3EAF3;
// // //   background: #FAFBFD; color: #0B1F33; font-size: 13px; width: 100%; transition: 0.2s;
// // // }
// // // .glass-card input[type="file"] { padding: 10px; font-size: 12px; }
// // // .glass-card input:focus {
// // //   border-color: #005EB8; box-shadow: 0 0 0 3px rgba(0,94,184,0.12); outline: none;
// // //   background: #FFFFFF;
// // // }

// // // /* BUTTON */
// // // .glass-card button {
// // //   padding: 13px; border-radius: 10px; border: none;
// // //   background: linear-gradient(135deg, #00338D, #005EB8);
// // //   color: white; font-weight: 600; font-size: 13px; cursor: pointer; transition: 0.2s;
// // // }
// // // .glass-card button:hover:not(:disabled) {
// // //   transform: translateY(-1px); box-shadow: 0 8px 20px rgba(0,51,141,0.2);
// // // }
// // // .glass-card button:disabled { opacity: 0.45; cursor: not-allowed; }

// // // /* KB SECTION */
// // // .kb-section {
// // //   margin-top: 4px; padding: 18px;
// // //   background: #F8FBFF;
// // //   border: 1.5px dashed #C5DCFA;
// // //   border-radius: 14px;
// // //   display: flex; flex-direction: column; gap: 10px;
// // // }
// // // .kb-header {
// // //   display: flex; align-items: center; gap: 8px;
// // //   font-size: 13px; font-weight: 700; color: #00338D;
// // // }
// // // .kb-icon {
// // //   width: 26px; height: 26px; background: #E6F2FB; border-radius: 7px;
// // //   display: flex; align-items: center; justify-content: center; color: #005EB8; flex-shrink: 0;
// // // }
// // // .optional-badge {
// // //   font-size: 10px; font-weight: 600; color: #94A3B8;
// // //   background: #F1F5F9; border: 1px solid #E2E8F0;
// // //   padding: 2px 8px; border-radius: 10px; margin-left: 4px; text-transform: uppercase;
// // //   letter-spacing: 0.04em;
// // // }
// // // .kb-desc { font-size: 12px; color: #64748B; line-height: 1.55; }
// // // .kb-upload-btn {
// // //   padding: 11px 0 !important;
// // //   background: linear-gradient(135deg, #1D4ED8, #3B82F6) !important;
// // //   font-size: 13px !important;
// // // }

// // // /* TOGGLE */
// // // .toggle-container { display: flex; justify-content: space-between; align-items: center; }
// // // .toggle-label { font-size: 13px; font-weight: 600; color: #0B1F33; }
// // // .toggle-switch {
// // //   width: 48px; height: 25px; background: #E3EAF3;
// // //   border-radius: 13px; position: relative; cursor: pointer; transition: background 0.2s;
// // // }
// // // .toggle-knob {
// // //   width: 21px; height: 21px; border-radius: 50%; background: white;
// // //   position: absolute; top: 2px; transition: 0.25s;
// // //   box-shadow: 0 1px 4px rgba(0,0,0,0.15);
// // // }
// // // .toggle-knob.off { left: 2px; }
// // // .toggle-knob.on  { left: 25px; background: #005EB8; }
// // // .toggle-desc { font-size: 12px; color: #94A3B8; }

// // // /* INFO / WARN / ERROR */
// // // .info-box {
// // //   padding: 10px 14px; background: #F0F6FF; border: 1px solid #D6E6FF;
// // //   border-radius: 10px; font-size: 13px; color: #005EB8; line-height: 1.55;
// // // }
// // // .info-box code {
// // //   background: rgba(0,94,184,0.1); border-radius: 4px; padding: 1px 5px;
// // //   font-size: 11px; color: #00338D; font-family: monospace;
// // // }
// // // .warn-box {
// // //   padding: 10px 14px; background: rgba(255,176,32,0.07);
// // //   border: 1px solid rgba(255,176,32,0.25); border-radius: 10px;
// // //   font-size: 13px; color: #92400E; line-height: 1.55;
// // // }
// // // .link-text { cursor: pointer; text-decoration: underline; font-weight: 600; }
// // // .error-inline {
// // //   background: #FFF1F1; border: 1px solid #FECACA;
// // //   color: #DC2626; padding: 10px 14px; border-radius: 10px; font-size: 13px; line-height: 1.5;
// // // }
// // // .success-message {
// // //   background: #ECFDF5; border: 1px solid #A7F3D0;
// // //   color: #065F46; padding: 10px 14px; border-radius: 10px; font-size: 13px;
// // // }

// // // /* PROGRESS */
// // // .probe-progress { display: flex; flex-direction: column; gap: 7px; }
// // // .probe-bar-track { height: 5px; background: #E3EAF3; border-radius: 3px; overflow: hidden; }
// // // .probe-bar-fill {
// // //   height: 100%; background: linear-gradient(90deg, #00338D, #0091DA);
// // //   border-radius: 3px; transition: width 0.35s ease;
// // // }
// // // .probe-label { font-size: 12px; color: #94A3B8; }

// // // /* COL BADGES */
// // // .col-badge { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
// // // .col-ok   { background: rgba(0,168,107,0.08); border: 1px solid rgba(0,168,107,0.25); color: #065F46; }
// // // .col-warn { background: rgba(255,176,32,0.08); border: 1px solid rgba(255,176,32,0.25); color: #92400E; }

// // // /* SDCC + BLACKBOX SUMMARIES */
// // // .blackbox-summary, .sdcc-summary {
// // //   background: white; border-radius: 18px; padding: 32px;
// // //   border: 1px solid #E2E8F0; box-shadow: 0 1px 4px rgba(0,0,0,0.04); margin-bottom: 36px;
// // // }
// // // .blackbox-summary h2, .sdcc-summary h2 {
// // //   font-size: 18px; font-weight: 700; color: #1E2937; margin-bottom: 22px;
// // // }

// // // .sdcc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }
// // // .metric-item {
// // //   background: #F8FAFC; padding: 18px 20px; border-radius: 14px;
// // //   border: 1px solid #E2E8F0; text-align: center; transition: all 0.2s ease;
// // // }
// // // .metric-item:hover { background: #F0F7FF; border-color: #BFDBFE; }
// // // .metric-item span { font-size: 12px; color: #64748B; display: block; margin-bottom: 8px; font-weight: 500; }
// // // .metric-item strong { font-size: 22px; font-weight: 800; color: #1E2937; }

// // // .risk-low    { color: #065F46 !important; }
// // // .risk-moderate { color: #005EB8 !important; }
// // // .risk-high   { color: #DC2626 !important; }

// // // .sdcc-recommendation {
// // //   margin-top: 22px; padding: 16px 20px; background: #EEF6FF;
// // //   border-left: 4px solid #005EB8; border-radius: 10px;
// // //   font-size: 13.5px; color: #1E3A5F; line-height: 1.65;
// // // }

// // // /* COMPUTATION NOTES */
// // // .sdcc-enterprise { border-color: rgba(0,168,107,0.2); margin-bottom: 32px; }
// // // .metric-card {
// // //   background: #F8FAFC; padding: 16px; border-radius: 12px;
// // //   text-align: center; border: 1px solid #E2E8F0;
// // // }
// // // .metric-card span { font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }
// // // .metric-card strong { font-size: 20px; display: block; margin-top: 6px; color: #1E2937; }
// // // .toggle-notes-btn {
// // //   background: #F0F6FF; border: 1px solid #D6E6FF; color: #005EB8;
// // //   padding: 6px 14px; border-radius: 8px; cursor: pointer;
// // //   font-size: 12px; font-weight: 600; transition: 0.2s;
// // // }
// // // .toggle-notes-btn:hover { background: #E0EDFF; }
// // // .notes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px; }
// // // .note-card { padding: 13px; border-radius: 12px; border: 1px solid transparent; background: #F8FAFC; }
// // // .note-ok   { border-color: rgba(0,168,107,0.2); }
// // // .note-miss { border-color: rgba(255,176,32,0.18); }
// // // .note-key  { font-size: 11px; color: #64748B; text-transform: capitalize; margin-bottom: 4px; }
// // // .note-val  { font-size: 20px; font-weight: 800; color: #1E2937; margin-bottom: 4px; }
// // // .note-lib  { font-size: 10px; color: #94A3B8; margin-bottom: 6px; line-height: 1.4; }
// // // .note-status { font-size: 11px; font-weight: 600; }
// // // .note-status.ok   { color: #065F46; }
// // // .note-status.miss { color: #92400E; }

// // // /* RUN BUTTON */
// // // .center { text-align: center; }
// // // .run-btn {
// // //   padding: 15px 50px; border-radius: 40px; border: none;
// // //   background: linear-gradient(135deg, #00338D, #005EB8);
// // //   color: white; font-weight: 700; cursor: pointer; transition: 0.25s;
// // //   font-size: 15px; letter-spacing: -0.01em;
// // // }
// // // .run-btn:hover:not(:disabled) { transform: scale(1.03); box-shadow: 0 10px 28px rgba(0,51,141,0.22); }
// // // .run-btn:disabled { opacity: 0.45; cursor: not-allowed; }
// // // .hint-text { margin-top: 10px; font-size: 13px; color: #94A3B8; }
// // // `;



// // /* eslint-disable @typescript-eslint/no-explicit-any */
// // import { useState } from "react";
// // import { useNavigate } from "react-router-dom";
// // import { sdccIngest, evaluateAI, runBlackBoxAudit, uploadKnowledgeBase } from "../services/api";

// // /* ─────────────────────────────────────────────
// //    Types
// // ───────────────────────────────────────────── */
// // interface BlackBoxFinding {
// //   category: string;
// //   severity: "High" | "Medium" | "Low" | "Pass";
// //   probe: string;
// //   response_preview: string;
// //   issue: string;
// //   recommendation: string;
// // }

// // interface BlackBoxResult {
// //   audit_id: string;
// //   ai_name: string;
// //   mode: string;
// //   status: string;
// //   overall_score: number;
// //   risk_level: string;
// //   probes_run: number;
// //   category_scores: Record<string, number>;
// //   findings: BlackBoxFinding[];
// //   message?: string;
// // }

// // interface ComputationNote {
// //   library: string;
// //   status: string;
// //   value: number | null;
// // }

// // interface SdccSummary {
// //   model_type: string;
// //   logs_ingested: number;
// //   data_quality_score: number;
// //   structural_risk: string;
// //   detection_confidence?: number;
// //   recommendation?: string;
// //   column_warnings?: string[];
// //   has_task_id_col?: boolean;
// //   has_input_col?: boolean;
// //   has_output_col?: boolean;
// //   has_latency_col?: boolean;
// //   has_kb_col?: boolean;
// //   schema_complete?: boolean;
// // }

// // /* ─────────────────────────────────────────────
// //    Component
// // ───────────────────────────────────────────── */
// // export default function Dashboard() {
// //   const navigate = useNavigate();

// //   /* ── Black Box state ── */
// //   const [bbMode, setBbMode]         = useState<"api" | "ui">("api");
// //   const [bbEndpoint, setBbEndpoint] = useState("");
// //   const [bbApiKey, setBbApiKey]     = useState("");
// //   const [bbUiUrl, setBbUiUrl]       = useState("");
// //   const [bbLoading, setBbLoading]   = useState(false);
// //   const [bbResult, setBbResult]     = useState<BlackBoxResult | null>(null);
// //   const [bbError, setBbError]       = useState("");
// //   const [bbProgress, setBbProgress] = useState(0);

// //   /* ── Ingestion state ── */
// //   const [file, setFile]                   = useState<File | null>(null);
// //   const [ingestLoading, setIngestLoading] = useState(false);
// //   const [uploaded, setUploaded]           = useState(false);
// //   const [logsCount, setLogsCount]         = useState<number | null>(null);
// //   const [uploadSuccess, setUploadSuccess] = useState(false);
// //   const [sdccSummary, setSdccSummary]     = useState<SdccSummary | null>(null);
// //   const [ingestError, setIngestError]     = useState("");

// //   /* ── KB upload state ── */
// //   const [kbFiles, setKbFiles]           = useState<FileList | null>(null);
// //   const [kbLoading, setKbLoading]       = useState(false);
// //   const [kbSuccess, setKbSuccess]       = useState(false);
// //   const [kbChunksCount, setKbChunksCount] = useState<number | null>(null);
// //   const [kbError, setKbError]           = useState("");

// //   /* ── Evaluate state ── */
// //   const [evalLoading, setEvalLoading]         = useState(false);
// //   const [evalError, setEvalError]             = useState("");
// //   const [computationNotes, setComputationNotes] = useState<Record<string, ComputationNote> | null>(null);
// //   const [showNotes, setShowNotes]             = useState(false);

// //   const aiName = localStorage.getItem("activeAI") || "";

// //   /* ── Helpers ── */
// //   const extractErr = (e: any): string => {
// //     if (!e?.response) return "Cannot reach backend. Ensure the server is running.";
// //     return e.response?.data?.detail || "Operation failed.";
// //   };

// //   const handleLogout = () => {
// //     localStorage.removeItem("token");
// //     localStorage.removeItem("activeAI");
// //     navigate("/login");
// //   };

// //   /* ─────────────────────────────────────────────
// //      BLACK BOX HANDLER
// //   ───────────────────────────────────────────── */
// //   const handleBlackBox = async () => {
// //     if (bbMode === "api" && (!bbEndpoint || !bbApiKey)) {
// //       setBbError("Please provide both API Endpoint and API Key.");
// //       return;
// //     }
// //     if (bbMode === "ui" && !bbUiUrl) {
// //       setBbError("Please provide the deployed UI URL.");
// //       return;
// //     }

// //     setBbLoading(true);
// //     setBbError("");
// //     setBbResult(null);
// //     setBbProgress(0);

// //     const totalProbes = 14;
// //     const interval = setInterval(() => {
// //       setBbProgress((p) => {
// //         if (p >= totalProbes - 1) { clearInterval(interval); return p; }
// //         return p + 1;
// //       });
// //     }, 350);

// //     try {
// //       const res = await runBlackBoxAudit({
// //         ai_name:  aiName || "external-ai",
// //         mode:     bbMode,
// //         endpoint: bbEndpoint,
// //         api_key:  bbApiKey,
// //         ui_url:   bbUiUrl,
// //       });
// //       clearInterval(interval);
// //       setBbProgress(totalProbes);
// //       setBbResult(res.data);
// //     } catch (e: any) {
// //       clearInterval(interval);
// //       setBbError(extractErr(e));
// //     } finally {
// //       setBbLoading(false);
// //     }
// //   };

// //   /* ─────────────────────────────────────────────
// //      INGESTION HANDLER
// //   ───────────────────────────────────────────── */
// //   const handleUpload = async () => {
// //     if (!aiName) { navigate("/register-ai"); return; }
// //     if (!file)   { setIngestError("Select a file first."); return; }

// //     setIngestLoading(true);
// //     setIngestError("");
// //     setUploadSuccess(false);
// //     setSdccSummary(null);
// //     setComputationNotes(null);

// //     try {
// //       const res = await sdccIngest(aiName, file);
// //       setSdccSummary(res.data);
// //       setLogsCount(res.data.logs_ingested ?? null);
// //       setUploaded(true);
// //       setUploadSuccess(true);
// //     } catch (e) {
// //       setIngestError(extractErr(e));
// //     } finally {
// //       setIngestLoading(false);
// //     }
// //   };

// //   /* ─────────────────────────────────────────────
// //      KB UPLOAD HANDLER
// //   ───────────────────────────────────────────── */
// //   const handleKbUpload = async () => {
// //     if (!aiName) { navigate("/register-ai"); return; }
// //     if (!kbFiles || kbFiles.length === 0) {
// //       setKbError("Select at least one knowledge base file.");
// //       return;
// //     }
// //     setKbLoading(true);
// //     setKbError("");
// //     setKbSuccess(false);
// //     try {
// //       const res = await uploadKnowledgeBase(aiName, Array.from(kbFiles));
// //       setKbChunksCount(res.data?.chunks_stored ?? null);
// //       setKbSuccess(true);
// //       if (res.data?.errors?.length) {
// //         setKbError(`Uploaded with warnings: ${res.data.errors.join("; ")}`);
// //       }
// //     } catch (e: any) {
// //       const detail =
// //         e?.response?.data?.detail ||
// //         e?.response?.data?.message ||
// //         e?.message ||
// //         "KB upload failed.";
// //       setKbError(detail);
// //     } finally {
// //       setKbLoading(false);
// //     }
// //   };

// //   /* ─────────────────────────────────────────────
// //      EVALUATE HANDLER
// //   ───────────────────────────────────────────── */
// //   const handleEvaluate = async () => {
// //     if (!uploaded) return;
// //     setEvalLoading(true);
// //     setEvalError("");
// //     setComputationNotes(null);
// //     try {
// //       const res = await evaluateAI(aiName);
// //       if (res.data.computation_notes) {
// //         setComputationNotes(res.data.computation_notes);
// //       }
// //       navigate("/report", { state: { data: res.data } });
// //     } catch (e) {
// //       setEvalError(extractErr(e));
// //     } finally {
// //       setEvalLoading(false);
// //     }
// //   };

// //   /* ── Render helpers ── */
// //   const totalProbes  = 14;
// //   const progressPct  = Math.round((bbProgress / totalProbes) * 100);

// //   const noteEntries      = computationNotes
// //     ? Object.entries(computationNotes).filter(([k]) => k !== "_error")
// //     : [];
// //   const computedCount    = noteEntries.filter(([, n]) => n.status === "computed").length;
// //   const unavailableCount = noteEntries.filter(([, n]) => n.status !== "computed").length;

// //   /* ─────────────────────────────────────────────
// //      JSX
// //   ───────────────────────────────────────────── */
// //   return (
// //     <div className="hero">
// //       <style>{CSS}</style>

// //       <div className="hero-content">

// //         {/* TOP BAR */}
// //         <div className="top-bar">
// //           <div className="top-bar-left">
// //             <h1 className="brand-title">Auditable AI™</h1>
// //             {aiName && <span className="ai-pill">Auditing: {aiName}</span>}
// //           </div>
// //           <div style={{ display: "flex", gap: 12 }}>
// //             <button className="profile-btn" onClick={() => navigate("/profile")}> Profile</button>
// //             <button className="logout-btn" onClick={handleLogout}>Logout →</button>
// //           </div>
// //         </div>

// //         {/* ── ROW 1: Black Box + Ingestion ── */}
// //         <div className="card-grid">

// //           {/* BLACK BOX CARD */}
// //           <div className="glass-card">
// //             <h2> Black Box AI Audit</h2>
// //             <p className="card-desc">
// //               Connect an external AI system and fire 14 governance probes across
// //               Safety, Fairness, Accuracy, Transparency, Robustness, and Explainability.
// //             </p>

// //             {/* Mode toggle */}
// //             <div className="toggle-container">
// //               <span className="toggle-label">Connection Mode</span>
// //               <div
// //                 className="toggle-switch"
// //                 onClick={() => { setBbMode(bbMode === "api" ? "ui" : "api"); setBbResult(null); setBbError(""); }}
// //               >
// //                 <div className={`toggle-knob ${bbMode === "api" ? "on" : "off"}`} />
// //               </div>
// //             </div>
// //             <p className="toggle-desc">{bbMode === "api" ? "API Key + Endpoint Mode" : "Deployed UI Mode"}</p>

// //             {bbMode === "api" ? (
// //               <>
// //                 <label>External API Endpoint</label>
// //                 <input
// //                   type="url" name="bb-endpoint"
// //                   autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
// //                   placeholder="https://api.openai.com/v1/chat/completions"
// //                   value={bbEndpoint} onChange={(e) => setBbEndpoint(e.target.value)}
// //                   disabled={bbLoading}
// //                 />
// //                 <label>API Key</label>
// //                 <input
// //                   type="text" name="bb-apikey"
// //                   autoComplete="new-password" autoCorrect="off" autoCapitalize="off" spellCheck={false}
// //                   value={bbApiKey} onChange={(e) => setBbApiKey(e.target.value)}
// //                   placeholder="sk-xxxx…"
// //                   disabled={bbLoading}
// //                 />
// //               </>
// //             ) : (
// //               <>
// //                 <label>Deployed UI URL</label>
// //                 <input
// //                   type="url" name="bb-uiurl" autoComplete="off"
// //                   value={bbUiUrl} onChange={(e) => setBbUiUrl(e.target.value)}
// //                   placeholder="https://your-chatbot.vercel.app"
// //                   disabled={bbLoading}
// //                 />
// //                 <div className="info-box">
// //                   ℹ UI audits run using secure backend browser automation.
// //                   Ensure the chatbot URL is publicly accessible.
// //                 </div>
// //               </>
// //             )}

// //             {bbError && <div className="error-inline">{bbError}</div>}

// //             <button onClick={handleBlackBox} disabled={bbLoading}>
// //               {bbLoading ? "Probing AI…" : "Run Black Box Audit →"}
// //             </button>

// //             {bbLoading && (
// //               <div className="probe-progress">
// //                 <div className="probe-bar-track">
// //                   <div className="probe-bar-fill" style={{ width: `${progressPct}%` }} />
// //                 </div>
// //                 <span className="probe-label">
// //                   Firing probe {bbProgress}/{totalProbes}… ({progressPct}%)
// //                 </span>
// //               </div>
// //             )}
// //           </div>

// //           {/* INGESTION CARD */}
// //           <div className="glass-card">
// //             <h2> Data Ingestion (SDCC)</h2>

// //             {!aiName && (
// //               <div className="warn-box">
// //                  No AI registered.{" "}
// //                 <span className="link-text" onClick={() => navigate("/register-ai")}>Register one →</span>
// //               </div>
// //             )}

// //             {/* Required schema hint */}
// //             <div className="info-box" style={{ fontSize: 12, lineHeight: 1.7 }}>
// //               <strong style={{ color: "#4AACDF" }}>Required columns:</strong>{" "}
// //               <code>task_id</code> · <code>input</code> · <code>output</code> · <code>latency</code>
// //               <br />
// //               <span style={{ color: "#64748B" }}>
// //                 The AI judges each response for correctness automatically.
// //                 Upload a knowledge base below to ground the evaluation in your own documents.
// //               </span>
// //             </div>

// //             <p className="toggle-desc">SDCC structural analysis + LLM-as-a-Judge pipeline</p>

// //             <label>Select Log File (.csv or .json)</label>
// //             <input
// //               type="file"
// //               accept=".csv,.json"
// //               onChange={(e) => {
// //                 setFile(e.target.files?.[0] || null);
// //                 setUploaded(false);
// //                 setUploadSuccess(false);
// //                 setSdccSummary(null);
// //                 setComputationNotes(null);
// //               }}
// //             />

// //             <button onClick={handleUpload} disabled={ingestLoading || !file}>
// //               {ingestLoading ? "Uploading…" : "Upload Logs"}
// //             </button>

// //             {uploadSuccess && logsCount !== null && (
// //               <div className="success-message"> Ingested {logsCount} records successfully.</div>
// //             )}
// //             {ingestError && <div className="error-inline">{ingestError}</div>}

// //             {/* Column warnings */}
// //             {sdccSummary?.column_warnings && sdccSummary.column_warnings.length > 0 && (
// //               <div className="warn-box" style={{ marginTop: 4 }}>
// //                 {sdccSummary.column_warnings.map((w, i) => (
// //                   <div key={i} style={{ marginBottom: i < sdccSummary.column_warnings!.length - 1 ? 6 : 0 }}>
// //                      {w}
// //                   </div>
// //                 ))}
// //               </div>
// //             )}

// //             {/* Schema column status badges */}
// //             {sdccSummary && (
// //               <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
// //                 {[
// //                   { key: "has_task_id_col", label: "task_id" },
// //                   { key: "has_input_col",   label: "input"   },
// //                   { key: "has_output_col",  label: "output"  },
// //                   { key: "has_latency_col", label: "latency" },
// //                 ].map(({ key, label }) => {
// //                   const ok = (sdccSummary as any)[key];
// //                   return (
// //                     <span key={key} className={`col-badge ${ok ? "col-ok" : "col-warn"}`}>
// //                       {ok ? "" : ""} {label}
// //                     </span>
// //                   );
// //                 })}
// //               </div>
// //             )}

// //             {/* KB upload section */}
// //             <div style={{
// //               marginTop: 8,
// //               padding: "16px",
// //               background: "#F8FBFF",
// //               border: "1px dashed #D6E6FF",
// //               borderRadius: 12,
// //               display: "flex",
// //               flexDirection: "column",
// //               gap: 10,
// //             }}>
// //               <div style={{ fontSize: 13, fontWeight: 600, color: "#005EB8" }}>
// //                  Knowledge Base (Optional)
// //               </div>
// //               <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>
// //                 Upload PDF, TXT, MD, DOCX, or CSV files. The LLM judge will first
// //                 search your KB before using its own knowledge to assess correctness.
// //                 Multiple files accepted.
// //               </div>
// //               <input
// //                 type="file"
// //                 accept=".pdf,.txt,.md,.docx,.csv"
// //                 multiple
// //                 onChange={(e) => {
// //                   setKbFiles(e.target.files);
// //                   setKbSuccess(false);
// //                   setKbError("");
// //                 }}
// //                 style={{ fontSize: 12 }}
// //               />
// //               <button
// //                 onClick={handleKbUpload}
// //                 disabled={kbLoading || !kbFiles || kbFiles.length === 0}
// //                 style={{
// //                   padding: "10px 0",
// //                   background: "linear-gradient(135deg, #1D4ED8, #3B82F6)",
// //                   fontSize: 13,
// //                 }}
// //               >
// //                 {kbLoading ? "Uploading KB…" : "Upload Knowledge Base →"}
// //               </button>
// //               {kbSuccess && kbChunksCount !== null && (
// //                 <div className="success-message" style={{ fontSize: 12 }}>
// //                    {kbChunksCount} KB chunks stored. Judge will use these for evaluation.
// //                 </div>
// //               )}
// //               {kbError && <div className="error-inline" style={{ fontSize: 12 }}>{kbError}</div>}
// //             </div>
// //           </div>
// //         </div>

// //         {/* ── BLACK BOX RESULT SUMMARY ── */}
// //         {bbResult && bbResult.status !== "manual_required" && (
// //           <div className="blackbox-summary glass-card" style={{ marginBottom: "36px" }}>
// //             <h2> Black Box Audit Summary</h2>
// //             <div className="sdcc-grid">
// //               <div className="metric-item">
// //                 <span>Probes Run</span>
// //                 <strong>{bbResult.probes_run}</strong>
// //               </div>
// //               <div className="metric-item">
// //                 <span>Findings</span>
// //                 <strong style={{ color: bbResult.findings.length === 0 ? "#10B981" : "#EF4444" }}>
// //                   {bbResult.findings.length}
// //                 </strong>
// //               </div>
// //               <div className={`metric-item risk-${bbResult.risk_level.toLowerCase()}`}>
// //                 <span>Risk Level</span>
// //                 <strong>{bbResult.risk_level}</strong>
// //               </div>
// //             </div>
// //             <div className="sdcc-recommendation">
// //                {bbResult.findings.length === 0
// //                 ? `${bbResult.ai_name || "The AI system"} passed all ${bbResult.probes_run} governance probes. No violations detected.`
// //                 : `${bbResult.findings.length} governance violation(s) detected across ${[...new Set(bbResult.findings.map((f: BlackBoxFinding) => f.category))].join(", ")}. Immediate remediation recommended.`
// //               }
// //             </div>
// //           </div>
// //         )}

// //         {bbResult && bbResult.status === "manual_required" && (
// //           <div className="glass-card" style={{ marginBottom: "36px", borderColor: "rgba(255,176,32,0.3)" }}>
// //             <h2> UI Mode — Manual Review Required</h2>
// //             <p style={{ color: "#9DBFE0", fontSize: "14px", lineHeight: "1.6" }}>{bbResult.message}</p>
// //           </div>
// //         )}

// //         {/* ── SDCC SUMMARY ── */}
// //         {sdccSummary && (
// //           <div className="sdcc-summary glass-card">
// //             <h2> SDCC Structural Summary</h2>
// //             <div className="sdcc-grid">
// //               <div className="metric-item">
// //                 <span>Model Type</span>
// //                 <strong>{sdccSummary.model_type}</strong>
// //               </div>
// //               <div className="metric-item">
// //                 <span>Logs Ingested</span>
// //                 <strong>{sdccSummary.logs_ingested}</strong>
// //               </div>
// //               <div className="metric-item">
// //                 <span>Data Quality</span>
// //                 <strong>{sdccSummary.data_quality_score}%</strong>
// //               </div>
// //               <div className={`metric-item risk-${sdccSummary.structural_risk.toLowerCase()}`}>
// //                 <span>Structural Risk</span>
// //                 <strong>{sdccSummary.structural_risk}</strong>
// //               </div>
// //               {sdccSummary.detection_confidence !== undefined && (
// //                 <div className="metric-item">
// //                   <span>Detection Confidence</span>
// //                   <strong>{Math.round(sdccSummary.detection_confidence * 100)}%</strong>
// //                 </div>
// //               )}
// //               <div className={`metric-item ${sdccSummary.schema_complete ? "risk-low" : "risk-moderate"}`}>
// //                 <span>Schema</span>
// //                 <strong>{sdccSummary.schema_complete ? "Complete " : "Partial "}</strong>
// //               </div>
// //             </div>

// //             {sdccSummary.recommendation && (
// //               <div className="sdcc-recommendation">
// //                  {(() => {
// //                   const mt   = sdccSummary.model_type || "AI system";
// //                   const risk = sdccSummary.structural_risk || "Unknown";
// //                   const dq   = sdccSummary.data_quality_score || 0;
// //                   if (risk === "Low" && dq >= 75)
// //                     return `${mt} shows strong structural integrity. Proceed to full evaluation to generate your governance audit report.`;
// //                   if (risk === "High" || dq < 50)
// //                     return `${mt} has structural risk indicators. Ensure task_id, input, output, and latency columns are present.`;
// //                   return `${mt} ingested with ${risk.toLowerCase()} structural risk. Run the full evaluation below to score across all 10 KPMG Trusted AI principles.`;
// //                 })()}
// //               </div>
// //             )}
// //           </div>
// //         )}

// //         {/* ── COMPUTATION NOTES ── */}
// //         {computationNotes && noteEntries.length > 0 && (
// //           <div className="glass-card sdcc-enterprise" style={{ marginBottom: 36 }}>
// //             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
// //               <h2 style={{ margin: 0 }}> Metric Computation Summary</h2>
// //               <button className="toggle-notes-btn" onClick={() => setShowNotes((v) => !v)}>
// //                 {showNotes ? "Hide details ▲" : "Show details ▼"}
// //               </button>
// //             </div>
// //             <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
// //               <div className="metric-card" style={{ flex: 1 }}>
// //                 <span>Computed</span>
// //                 <strong style={{ color: "#00C896" }}>{computedCount}</strong>
// //               </div>
// //               <div className="metric-card" style={{ flex: 1 }}>
// //                 <span>Unavailable</span>
// //                 <strong style={{ color: "#ffb020" }}>{unavailableCount}</strong>
// //               </div>
// //               <div className="metric-card" style={{ flex: 1 }}>
// //                 <span>Total Metrics</span>
// //                 <strong>{noteEntries.length}</strong>
// //               </div>
// //             </div>

// //             {unavailableCount > 0 && (
// //               <div className="info-box" style={{ marginTop: 8, fontSize: 12 }}>
// //                  {unavailableCount} metric(s) couldn't be computed — missing required columns.
// //                 Ensure your CSV has <code>task_id</code>, <code>input</code>, <code>output</code>, and <code>latency</code>.
// //               </div>
// //             )}

// //             {showNotes && (
// //               <div className="notes-grid" style={{ marginTop: 16 }}>
// //                 {noteEntries.map(([key, note]) => (
// //                   <div key={key} className={`note-card ${note.status === "computed" ? "note-ok" : "note-miss"}`}>
// //                     <div className="note-key">{key.replace(/_/g, " ")}</div>
// //                     <div className="note-val">
// //                       {note.value !== null ? note.value.toFixed(4) : "—"}
// //                     </div>
// //                     <div className="note-lib">{note.library}</div>
// //                     <div className={`note-status ${note.status === "computed" ? "ok" : "miss"}`}>
// //                       {note.status === "computed" ? " computed" : " unavailable"}
// //                     </div>
// //                   </div>
// //                 ))}
// //               </div>
// //             )}
// //           </div>
// //         )}

// //         {/* ── RUN FULL EVALUATION ── */}
// //         <div className="center" style={{ marginTop: "40px" }}>
// //           <button className="run-btn" onClick={handleEvaluate} disabled={!uploaded || evalLoading}>
// //             {evalLoading ? "Running LLM Judge & evaluating…" : "Run Full Evaluation →"}
// //           </button>
// //           {evalLoading && (
// //             <p className="hint-text" style={{ marginTop: 12 }}>
// //               The LLM judge is assessing each response for correctness — this may take a moment…
// //             </p>
// //           )}
// //           {!uploaded && <p className="hint-text">Upload logs above to enable evaluation</p>}
// //           {evalError && <div className="error-inline" style={{ marginTop: "16px" }}>{evalError}</div>}
// //         </div>

// //       </div>
// //     </div>
// //   );
// // }

// // /* ─────────────────────────────────────────────
// //    CSS
// // ───────────────────────────────────────────── */
// // const CSS=`
// // @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

// // * { box-sizing: border-box; }

// // .hero {
// //   min-height: 100vh;
// //   background: #F4F7FB;
// //   display: flex;
// //   justify-content: center;
// //   padding: 40px 20px;
// //   font-family: 'Inter', sans-serif;
// //   color: #0B1F33;
// // }

// // .hero-content { width: 100%; max-width: 1200px; }

// // /* TOP BAR */
// // .top-bar {
// //   display: flex; justify-content: space-between; align-items: center;
// //   margin-bottom: 36px; padding-bottom: 20px;
// //   border-bottom: 1px solid #E3EAF3;
// // }
// // .top-bar-left { display: flex; align-items: center; gap: 16px; }
// // .brand-title { font-size: 26px; font-weight: 800; margin: 0; color: #00338D; }
// // .ai-pill {
// //   background: #E6F2FB; border: 1px solid #D6E6FF;
// //   border-radius: 20px; padding: 4px 14px; font-size: 13px; color: #005EB8;
// // }
// // .profile-btn {
// //   padding: 10px 22px; border-radius: 10px; border: 1px solid #D6E6FF;
// //   background: #F8FBFF; color: #005EB8; font-weight: 600; font-size: 14px;
// //   cursor: pointer; transition: 0.25s;
// // }
// // .profile-btn:hover { transform: translateY(-2px); background: #EEF4FF; }
// // .logout-btn {
// //   padding: 10px 22px; border-radius: 10px; border: 1px solid #FFD6D6;
// //   background: #FFF5F5; color: #E5484D; font-weight: 600; font-size: 14px;
// //   cursor: pointer; transition: 0.25s;
// // }
// // .logout-btn:hover { transform: translateY(-2px); }

// // /* GRID */
// // .card-grid {
// //   display: grid;
// //   grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
// //   gap: 28px; margin-bottom: 36px;
// // }

// // /* GLASS CARD */
// // .glass-card {
// //   background: #FFFFFF; border-radius: 18px; padding: 32px;
// //   border: 1px solid #E3EAF3; box-shadow: 0 12px 30px rgba(0,0,0,0.06);
// //   display: flex; flex-direction: column; gap: 14px; transition: all 0.3s ease;
// // }
// // .glass-card:hover { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(0,51,141,0.1); }
// // .glass-card h2 { font-size: 20px; font-weight: 700; color: #0B1F33; margin: 0; }
// // .card-desc { font-size: 13px; color: #6B7C93; line-height: 1.55; margin: 0; }

// // /* INPUTS */
// // .glass-card label { font-size: 12px; font-weight: 600; color: #005EB8; }
// // .glass-card input[type="text"],
// // .glass-card input[type="url"],
// // .glass-card input[type="file"] {
// //   padding: 13px 16px; border-radius: 10px; border: 1px solid #E3EAF3;
// //   background: #FFFFFF; color: #0B1F33; font-size: 14px; width: 100%;
// // }
// // .glass-card input[type="file"] { padding: 10px; font-size: 13px; }
// // .glass-card input:focus {
// //   border-color: #005EB8; box-shadow: 0 0 0 3px rgba(0,94,184,0.15); outline: none;
// // }

// // /* BUTTON */
// // .glass-card button {
// //   padding: 14px; border-radius: 10px; border: none;
// //   background: linear-gradient(135deg, #00338D, #005EB8);
// //   color: white; font-weight: 600; font-size: 14px; cursor: pointer; transition: 0.25s;
// // }
// // .glass-card button:hover:not(:disabled) {
// //   transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,51,141,0.25);
// // }
// // .glass-card button:disabled { opacity: 0.5; cursor: not-allowed; }

// // /* TOGGLE */
// // .toggle-container { display: flex; justify-content: space-between; align-items: center; }
// // .toggle-label { font-size: 14px; font-weight: 600; color: #0B1F33; }
// // .toggle-switch {
// //   width: 50px; height: 26px; background: #E3EAF3;
// //   border-radius: 13px; position: relative; cursor: pointer;
// // }
// // .toggle-knob {
// //   width: 22px; height: 22px; border-radius: 50%; background: white;
// //   position: absolute; top: 2px; transition: 0.25s;
// // }
// // .toggle-knob.off { left: 2px; }
// // .toggle-knob.on  { left: 26px; background: #005EB8; }
// // .toggle-desc { font-size: 12px; color: #6B7C93; }

// // /* INFO / WARN / ERROR */
// // .info-box {
// //   padding: 10px 14px; background: #F0F6FF; border: 1px solid #D6E6FF;
// //   border-radius: 10px; font-size: 13px; color: #005EB8;
// // }
// // .info-box code {
// //   background: rgba(0,94,184,0.12); border-radius: 4px; padding: 1px 5px;
// //   font-size: 11px; color: #00338D; font-family: monospace;
// // }
// // .warn-box {
// //   padding: 10px 14px; background: rgba(255,176,32,0.08);
// //   border: 1px solid rgba(255,176,32,0.3); border-radius: 10px;
// //   font-size: 13px; color: #b45309;
// // }
// // .link-text { cursor: pointer; text-decoration: underline; font-weight: 600; }
// // .error-inline {
// //   background: #FFF1F1; border: 1px solid #FFD6D6;
// //   color: #E5484D; padding: 10px; border-radius: 10px; font-size: 13px;
// // }
// // .success-message {
// //   background: #E6FFF6; border: 1px solid #B2F2D7;
// //   color: #00A86B; padding: 10px; border-radius: 10px; font-size: 13px;
// // }

// // /* PROGRESS */
// // .probe-progress { display: flex; flex-direction: column; gap: 6px; }
// // .probe-bar-track { height: 6px; background: #E3EAF3; border-radius: 3px; overflow: hidden; }
// // .probe-bar-fill {
// //   height: 100%; background: linear-gradient(90deg, #00338D, #005EB8);
// //   border-radius: 3px; transition: width 0.35s ease;
// // }
// // .probe-label { font-size: 12px; color: #6B7C93; font-style: italic; }

// // /* COL BADGES */
// // .col-badge { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
// // .col-ok   { background: rgba(0,168,107,0.1); border: 1px solid rgba(0,168,107,0.3); color: #00A86B; }
// // .col-warn { background: rgba(255,176,32,0.1); border: 1px solid rgba(255,176,32,0.3); color: #b45309; }

// // /* SDCC + BLACKBOX SUMMARIES */
// // .blackbox-summary, .sdcc-summary {
// //   background: white; border-radius: 20px; padding: 36px;
// //   border: 1px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0,0,0,0.06); margin-bottom: 40px;
// // }
// // .blackbox-summary h2, .sdcc-summary h2 { font-size: 21px; font-weight: 700; color: #1E2937; margin-bottom: 28px; }

// // .sdcc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 20px; }
// // .metric-item {
// //   background: #F8FAFC; padding: 20px 22px; border-radius: 16px;
// //   border: 1px solid #E2E8F0; text-align: center; transition: all 0.3s ease;
// // }
// // .metric-item:hover { background: #F0F7FF; border-color: #BFDBFE; }
// // .metric-item span { font-size: 12.5px; color: #64748B; display: block; margin-bottom: 8px; font-weight: 500; }
// // .metric-item strong { font-size: 23px; font-weight: 700; color: #1E2937; }

// // .risk-low    { color: #059669 !important; }
// // .risk-moderate { color: #005EB8 !important; }
// // .risk-high   { color: #DC2626 !important; }

// // .sdcc-recommendation {
// //   margin-top: 28px; padding: 18px 22px; background: #E6F2FB;
// //   border-left: 5px solid #005EB8; border-radius: 12px;
// //   font-size: 15px; color: #00338D; line-height: 1.6;
// // }

// // /* COMPUTATION NOTES */
// // .sdcc-enterprise { border-color: rgba(0,200,150,0.3); margin-bottom: 36px; }
// // .metric-card {
// //   background: #F8FAFC; padding: 16px; border-radius: 12px;
// //   text-align: center; border: 1px solid #E2E8F0;
// // }
// // .metric-card span { font-size: 12px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }
// // .metric-card strong { font-size: 20px; display: block; margin-top: 6px; color: #1E2937; }
// // .toggle-notes-btn {
// //   background: #F0F6FF; border: 1px solid #D6E6FF; color: #005EB8;
// //   padding: 6px 14px; border-radius: 8px; cursor: pointer;
// //   font-size: 12px; font-weight: 600; transition: 0.2s;
// // }
// // .toggle-notes-btn:hover { background: #E0EDFF; }
// // .notes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
// // .note-card { padding: 14px; border-radius: 12px; border: 1px solid transparent; background: #F8FAFC; }
// // .note-ok   { border-color: rgba(0,168,107,0.25); }
// // .note-miss { border-color: rgba(255,176,32,0.2); }
// // .note-key  { font-size: 11px; color: #64748B; text-transform: capitalize; margin-bottom: 4px; }
// // .note-val  { font-size: 20px; font-weight: 800; color: #1E2937; margin-bottom: 4px; }
// // .note-lib  { font-size: 10px; color: #94A3B8; margin-bottom: 6px; line-height: 1.4; }
// // .note-status { font-size: 11px; font-weight: 600; }
// // .note-status.ok   { color: #00A86B; }
// // .note-status.miss { color: #b45309; }

// // /* RUN BUTTON */
// // .center { text-align: center; }
// // .run-btn {
// //   padding: 16px 50px; border-radius: 40px; border: none;
// //   background: linear-gradient(135deg, #00338D, #005EB8);
// //   color: white; font-weight: 700; cursor: pointer; transition: 0.3s;
// //   font-size: 16px;
// // }
// // .run-btn:hover:not(:disabled) { transform: scale(1.04); box-shadow: 0 12px 30px rgba(0,51,141,0.25); }
// // .run-btn:disabled { opacity: 0.5; cursor: not-allowed; }
// // .hint-text { margin-top: 10px; font-size: 13px; color: #6B7C93; }
// // `;





// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { sdccIngest, evaluateAI, runBlackBoxAudit, uploadKnowledgeBase } from "../services/api";

// /* ─────────────────────────────────────────────
//    Types
// ───────────────────────────────────────────── */
// interface BlackBoxFinding {
//   category: string;
//   severity: "High" | "Medium" | "Low" | "Pass";
//   probe: string;
//   response_preview: string;
//   issue: string;
//   recommendation: string;
// }

// interface BlackBoxResult {
//   audit_id: string;
//   ai_name: string;
//   mode: string;
//   status: string;
//   overall_score: number;
//   risk_level: string;
//   probes_run: number;
//   category_scores: Record<string, number>;
//   findings: BlackBoxFinding[];
//   message?: string;
// }

// interface ComputationNote {
//   library: string;
//   status: string;
//   value: number | null;
// }

// interface SdccSummary {
//   model_type: string;
//   logs_ingested: number;
//   data_quality_score: number;
//   structural_risk: string;
//   detection_confidence?: number;
//   recommendation?: string;
//   column_warnings?: string[];
//   has_task_id_col?: boolean;
//   has_input_col?: boolean;
//   has_output_col?: boolean;
//   has_latency_col?: boolean;
//   has_kb_col?: boolean;
//   schema_complete?: boolean;
// }

// /* ─────────────────────────────────────────────
//    Component
// ───────────────────────────────────────────── */
// export default function Dashboard() {
//   const navigate = useNavigate();

//   /* ── Black Box state ── */
//   const [bbMode, setBbMode]         = useState<"api" | "ui">("api");
//   const [bbEndpoint, setBbEndpoint] = useState("");
//   const [bbApiKey, setBbApiKey]     = useState("");
//   const [bbUiUrl, setBbUiUrl]       = useState("");
//   const [bbLoading, setBbLoading]   = useState(false);
//   const [bbResult, setBbResult]     = useState<BlackBoxResult | null>(null);
//   const [bbError, setBbError]       = useState("");
//   const [bbProgress, setBbProgress] = useState(0);

//   /* ── Ingestion state ── */
//   const [file, setFile]                   = useState<File | null>(null);
//   const [ingestLoading, setIngestLoading] = useState(false);
//   const [uploaded, setUploaded]           = useState(false);
//   const [logsCount, setLogsCount]         = useState<number | null>(null);
//   const [uploadSuccess, setUploadSuccess] = useState(false);
//   const [sdccSummary, setSdccSummary]     = useState<SdccSummary | null>(null);
//   const [ingestError, setIngestError]     = useState("");

//   /* ── KB upload state ── */
//   const [kbFiles, setKbFiles]             = useState<FileList | null>(null);
//   const [kbLoading, setKbLoading]         = useState(false);
//   const [kbSuccess, setKbSuccess]         = useState(false);
//   const [kbChunksCount, setKbChunksCount] = useState<number | null>(null);
//   const [kbError, setKbError]             = useState("");

//   /* ── Evaluate state ── */
//   const [evalLoading, setEvalLoading]           = useState(false);
//   const [evalError, setEvalError]               = useState("");
//   const [computationNotes, setComputationNotes] = useState<Record<string, ComputationNote> | null>(null);
//   const [showNotes, setShowNotes]               = useState(false);

//   const aiName = localStorage.getItem("activeAI") || "";

//   /* ── Helpers ── */
//   const extractErr = (e: any): string => {
//     if (!e?.response) return "Cannot reach backend. Ensure the server is running.";
//     return e.response?.data?.detail || "Operation failed.";
//   };

//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("activeAI");
//     navigate("/login");
//   };

//   /* ─────────────────────────────────────────────
//      BLACK BOX HANDLER
//   ───────────────────────────────────────────── */
//   const handleBlackBox = async () => {
//     if (bbMode === "api" && (!bbEndpoint || !bbApiKey)) {
//       setBbError("Please provide both API Endpoint and API Key.");
//       return;
//     }
//     if (bbMode === "ui" && !bbUiUrl) {
//       setBbError("Please provide the deployed UI URL.");
//       return;
//     }

//     setBbLoading(true);
//     setBbError("");
//     setBbResult(null);
//     setBbProgress(0);

//     const totalProbes = 14;
//     const interval = setInterval(() => {
//       setBbProgress((p) => {
//         if (p >= totalProbes - 1) { clearInterval(interval); return p; }
//         return p + 1;
//       });
//     }, 350);

//     try {
//       const res = await runBlackBoxAudit({
//         ai_name:  aiName || "external-ai",
//         mode:     bbMode,
//         endpoint: bbEndpoint,
//         api_key:  bbApiKey,
//         ui_url:   bbUiUrl,
//       });
//       clearInterval(interval);
//       setBbProgress(totalProbes);
//       setBbResult(res.data);
//     } catch (e: any) {
//       clearInterval(interval);
//       setBbError(extractErr(e));
//     } finally {
//       setBbLoading(false);
//     }
//   };

//   /* ─────────────────────────────────────────────
//      INGESTION HANDLER
//   ───────────────────────────────────────────── */
//   const handleUpload = async () => {
//     if (!aiName) { navigate("/register-ai"); return; }
//     if (!file)   { setIngestError("Select a file first."); return; }

//     setIngestLoading(true);
//     setIngestError("");
//     setUploadSuccess(false);
//     setSdccSummary(null);
//     setComputationNotes(null);

//     try {
//       const res = await sdccIngest(aiName, file);
//       setSdccSummary(res.data);
//       setLogsCount(res.data.logs_ingested ?? null);
//       setUploaded(true);
//       setUploadSuccess(true);
//     } catch (e) {
//       setIngestError(extractErr(e));
//     } finally {
//       setIngestLoading(false);
//     }
//   };

//   /* ─────────────────────────────────────────────
//      KB UPLOAD HANDLER
//   ───────────────────────────────────────────── */
//   const handleKbUpload = async () => {
//     if (!aiName) { navigate("/register-ai"); return; }
//     if (!kbFiles || kbFiles.length === 0) {
//       setKbError("Select at least one knowledge base file.");
//       return;
//     }
//     setKbLoading(true);
//     setKbError("");
//     setKbSuccess(false);
//     try {
//       const res = await uploadKnowledgeBase(aiName, Array.from(kbFiles));
//       setKbChunksCount(res.data?.chunks_stored ?? null);
//       setKbSuccess(true);
//       if (res.data?.errors?.length) {
//         setKbError(`Uploaded with warnings: ${res.data.errors.join("; ")}`);
//       }
//     } catch (e: any) {
//       const detail =
//         e?.response?.data?.detail ||
//         e?.response?.data?.message ||
//         e?.message ||
//         "KB upload failed.";
//       setKbError(detail);
//     } finally {
//       setKbLoading(false);
//     }
//   };

//   /* ─────────────────────────────────────────────
//      EVALUATE HANDLER
//   ───────────────────────────────────────────── */
//   const handleEvaluate = async () => {
//     if (!uploaded) return;
//     setEvalLoading(true);
//     setEvalError("");
//     setComputationNotes(null);
//     try {
//       const res = await evaluateAI(aiName);
//       if (res.data.computation_notes) {
//         setComputationNotes(res.data.computation_notes);
//       }
//       navigate("/report", { state: { data: res.data } });
//     } catch (e) {
//       setEvalError(extractErr(e));
//     } finally {
//       setEvalLoading(false);
//     }
//   };

//   /* ── Render helpers ── */
//   const totalProbes  = 14;
//   const progressPct  = Math.round((bbProgress / totalProbes) * 100);

//   const noteEntries      = computationNotes
//     ? Object.entries(computationNotes).filter(([k]) => k !== "_error")
//     : [];
//   const computedCount    = noteEntries.filter(([, n]) => n.status === "computed").length;
//   const unavailableCount = noteEntries.filter(([, n]) => n.status !== "computed").length;

//   /* ─────────────────────────────────────────────
//      JSX
//   ───────────────────────────────────────────── */
//   return (
//     <div className="hero">
//       <style>{CSS}</style>

//       <div className="hero-content">

//         {/* TOP BAR */}
//         <div className="top-bar">
//           <div className="top-bar-left">
//             <h1 className="brand-title">Auditable AI™</h1>
//             {aiName && <span className="ai-pill">Auditing: {aiName}</span>}
//           </div>
//           <div style={{ display: "flex", gap: 12 }}>
//             <button className="profile-btn" onClick={() => navigate("/profile")}>Profile</button>
//             <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
//           </div>
//         </div>

//         {/* ── ROW 1: Black Box + Ingestion ── */}
//         <div className="card-grid">

//           {/* BLACK BOX CARD */}
//           <div className="glass-card">
//             <div className="card-header-row">
//               <div className="card-icon-shield">
//                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
//               </div>
//               <h2>Black Box AI Audit</h2>
//             </div>
//             <p className="card-desc">
//               Connect an external AI system and execute 14 governance probes across
//               Safety, Fairness, Accuracy, Transparency, Robustness, and Explainability.
//             </p>

//             {/* Mode toggle */}
//             <div className="toggle-container">
//               <span className="toggle-label">Connection Mode</span>
//               <div
//                 className="toggle-switch"
//                 onClick={() => { setBbMode(bbMode === "api" ? "ui" : "api"); setBbResult(null); setBbError(""); }}
//               >
//                 <div className={`toggle-knob ${bbMode === "api" ? "on" : "off"}`} />
//               </div>
//             </div>
//             <p className="toggle-desc">{bbMode === "api" ? "API Key + Endpoint Mode" : "Deployed UI Mode"}</p>

//             {bbMode === "api" ? (
//               <>
//                 <label>External API Endpoint</label>
//                 <input
//                   type="url" name="bb-endpoint"
//                   autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
//                   placeholder="https://api.openai.com/v1/chat/completions"
//                   value={bbEndpoint} onChange={(e) => setBbEndpoint(e.target.value)}
//                   disabled={bbLoading}
//                 />
//                 <label>API Key</label>
//                 <input
//                   type="text" name="bb-apikey"
//                   autoComplete="new-password" autoCorrect="off" autoCapitalize="off" spellCheck={false}
//                   value={bbApiKey} onChange={(e) => setBbApiKey(e.target.value)}
//                   placeholder="sk-xxxx…"
//                   disabled={bbLoading}
//                 />
//               </>
//             ) : (
//               <>
//                 <label>Deployed UI URL</label>
//                 <input
//                   type="url" name="bb-uiurl" autoComplete="off"
//                   value={bbUiUrl} onChange={(e) => setBbUiUrl(e.target.value)}
//                   placeholder="https://your-chatbot.vercel.app"
//                   disabled={bbLoading}
//                 />
//                 <div className="info-box">
//                   UI audits use secure backend browser automation. Ensure the chatbot URL is publicly accessible.
//                 </div>
//               </>
//             )}

//             {bbError && <div className="error-inline">{bbError}</div>}

//             <button onClick={handleBlackBox} disabled={bbLoading}>
//               {bbLoading ? "Executing Probes…" : "Run Black Box Audit"}
//             </button>

//             {bbLoading && (
//               <div className="probe-progress">
//                 <div className="probe-bar-track">
//                   <div className="probe-bar-fill" style={{ width: `${progressPct}%` }} />
//                 </div>
//                 <span className="probe-label">
//                   Probe {bbProgress} of {totalProbes} — {progressPct}% complete
//                 </span>
//               </div>
//             )}
//           </div>

//           {/* INGESTION CARD */}
//           <div className="glass-card">
//             <div className="card-header-row">
//               <div className="card-icon-data">
//                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
//               </div>
//               <h2>Data Ingestion</h2>
//             </div>

//             {!aiName && (
//               <div className="warn-box">
//                 No AI system registered.{" "}
//                 <span className="link-text" onClick={() => navigate("/register-ai")}>Register one to continue</span>
//               </div>
//             )}

//             <div className="info-box" style={{ fontSize: 12, lineHeight: 1.7 }}>
//               <strong style={{ color: "#005EB8" }}>Required columns:</strong>{" "}
//               <code>task_id</code> · <code>input</code> · <code>output</code> · <code>latency</code>
//               <br />
//               <span style={{ color: "#64748B" }}>
//                 Each response is automatically assessed for correctness using a multi-layer evaluation pipeline.
//                 Upload a knowledge base below to ground evaluation in your own documents.
//               </span>
//             </div>

//             <p className="toggle-desc">Structural Dataset Compliance Check (SDCC) + Evaluation Pipeline</p>

//             <label>Select Log File (.csv or .json)</label>
//             <input
//               type="file"
//               accept=".csv,.json"
//               onChange={(e) => {
//                 setFile(e.target.files?.[0] || null);
//                 setUploaded(false);
//                 setUploadSuccess(false);
//                 setSdccSummary(null);
//                 setComputationNotes(null);
//               }}
//             />

//             <button onClick={handleUpload} disabled={ingestLoading || !file}>
//               {ingestLoading ? "Uploading…" : "Upload Logs"}
//             </button>

//             {uploadSuccess && logsCount !== null && (
//               <div className="success-message">{logsCount} records ingested successfully.</div>
//             )}
//             {ingestError && <div className="error-inline">{ingestError}</div>}

//             {/* Column warnings */}
//             {sdccSummary?.column_warnings && sdccSummary.column_warnings.length > 0 && (
//               <div className="warn-box" style={{ marginTop: 4 }}>
//                 {sdccSummary.column_warnings.map((w, i) => (
//                   <div key={i} style={{ marginBottom: i < sdccSummary.column_warnings!.length - 1 ? 6 : 0 }}>
//                     {w}
//                   </div>
//                 ))}
//               </div>
//             )}

//             {/* Schema column status badges */}
//             {sdccSummary && (
//               <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//                 {[
//                   { key: "has_task_id_col", label: "task_id" },
//                   { key: "has_input_col",   label: "input"   },
//                   { key: "has_output_col",  label: "output"  },
//                   { key: "has_latency_col", label: "latency" },
//                 ].map(({ key, label }) => {
//                   const ok = (sdccSummary as any)[key];
//                   return (
//                     <span key={key} className={`col-badge ${ok ? "col-ok" : "col-warn"}`}>
//                       {ok ? "" : ""} {label}
//                     </span>
//                   );
//                 })}
//               </div>
//             )}

//             {/* KB upload section */}
//             <div style={{
//               marginTop: 8,
//               padding: "16px",
//               background: "#F8FBFF",
//               border: "1px dashed #D6E6FF",
//               borderRadius: 12,
//               display: "flex",
//               flexDirection: "column",
//               gap: 10,
//             }}>
//               <div style={{ fontSize: 13, fontWeight: 600, color: "#005EB8" }}>
//                 Knowledge Base <span style={{ fontWeight: 400, fontSize: 11, color: "#94A3B8", marginLeft: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Optional</span>
//               </div>
//               <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>
//                 Upload PDF, TXT, MD, DOCX, or CSV files. The evaluation engine will search your
//                 knowledge base before using its own knowledge to assess response correctness.
//                 Multiple files accepted.
//               </div>
//               <input
//                 type="file"
//                 accept=".pdf,.txt,.md,.docx,.csv"
//                 multiple
//                 onChange={(e) => {
//                   setKbFiles(e.target.files);
//                   setKbSuccess(false);
//                   setKbError("");
//                 }}
//                 style={{ fontSize: 12 }}
//               />
//               <button
//                 onClick={handleKbUpload}
//                 disabled={kbLoading || !kbFiles || kbFiles.length === 0}
//                 style={{
//                   padding: "10px 0",
//                   background: "linear-gradient(135deg, #1D4ED8, #3B82F6)",
//                   fontSize: 13,
//                 }}
//               >
//                 {kbLoading ? "Uploading Knowledge Base…" : "Upload Knowledge Base"}
//               </button>
//               {kbSuccess && kbChunksCount !== null && (
//                 <div className="success-message" style={{ fontSize: 12 }}>
//                   {kbChunksCount} knowledge base chunks stored. Evaluation engine will reference these documents.
//                 </div>
//               )}
//               {kbError && <div className="error-inline" style={{ fontSize: 12 }}>{kbError}</div>}
//             </div>
//           </div>
//         </div>

//         {/* ── BLACK BOX RESULT SUMMARY ── */}
//         {bbResult && bbResult.status !== "manual_required" && (
//           <div className="blackbox-summary glass-card" style={{ marginBottom: "36px" }}>
//             <h2>Black Box Audit Summary</h2>
//             <div className="sdcc-grid">
//               <div className="metric-item">
//                 <span>Probes Executed</span>
//                 <strong>{bbResult.probes_run}</strong>
//               </div>
//               <div className="metric-item">
//                 <span>Findings</span>
//                 <strong style={{ color: bbResult.findings.length === 0 ? "#10B981" : "#EF4444" }}>
//                   {bbResult.findings.length}
//                 </strong>
//               </div>
//               <div className={`metric-item risk-${bbResult.risk_level.toLowerCase()}`}>
//                 <span>Risk Level</span>
//                 <strong>{bbResult.risk_level}</strong>
//               </div>
//             </div>
//             <div className="sdcc-recommendation">
//               {bbResult.findings.length === 0
//                 ? `${bbResult.ai_name || "The AI system"} passed all ${bbResult.probes_run} governance probes. No violations detected.`
//                 : `${bbResult.findings.length} governance violation(s) detected across ${[...new Set(bbResult.findings.map((f: BlackBoxFinding) => f.category))].join(", ")}. Immediate remediation recommended.`
//               }
//             </div>
//           </div>
//         )}

//         {bbResult && bbResult.status === "manual_required" && (
//           <div className="glass-card" style={{ marginBottom: "36px", borderColor: "rgba(255,176,32,0.3)" }}>
//             <h2>UI Mode — Manual Review Required</h2>
//             <p style={{ color: "#9DBFE0", fontSize: "14px", lineHeight: "1.6" }}>{bbResult.message}</p>
//           </div>
//         )}

//         {/* ── SDCC SUMMARY ── */}
//         {sdccSummary && (
//           <div className="sdcc-summary glass-card">
//             <h2>Structural Dataset Compliance Summary</h2>
//             <div className="sdcc-grid">
//               <div className="metric-item">
//                 <span>Model Type</span>
//                 <strong>{sdccSummary.model_type}</strong>
//               </div>
//               <div className="metric-item">
//                 <span>Logs Ingested</span>
//                 <strong>{sdccSummary.logs_ingested}</strong>
//               </div>
//               <div className="metric-item">
//                 <span>Data Quality</span>
//                 <strong>{sdccSummary.data_quality_score}%</strong>
//               </div>
//               <div className={`metric-item risk-${sdccSummary.structural_risk.toLowerCase()}`}>
//                 <span>Structural Risk</span>
//                 <strong>{sdccSummary.structural_risk}</strong>
//               </div>
//               {sdccSummary.detection_confidence !== undefined && (
//                 <div className="metric-item">
//                   <span>Detection Confidence</span>
//                   <strong>{Math.round(sdccSummary.detection_confidence * 100)}%</strong>
//                 </div>
//               )}
//               <div className={`metric-item ${sdccSummary.schema_complete ? "risk-low" : "risk-moderate"}`}>
//                 <span>Schema</span>
//                 <strong>{sdccSummary.schema_complete ? "Complete" : "Partial"}</strong>
//               </div>
//             </div>

//             {sdccSummary.recommendation && (
//               <div className="sdcc-recommendation">
//                 {(() => {
//                   const mt   = sdccSummary.model_type || "AI system";
//                   const risk = sdccSummary.structural_risk || "Unknown";
//                   const dq   = sdccSummary.data_quality_score || 0;
//                   if (risk === "Low" && dq >= 75)
//                     return `${mt} shows strong structural integrity. Proceed to full evaluation to generate your governance audit report.`;
//                   if (risk === "High" || dq < 50)
//                     return `${mt} has structural risk indicators. Ensure task_id, input, output, and latency columns are present.`;
//                   return `${mt} ingested with ${risk.toLowerCase()} structural risk. Run the full evaluation below to score across all 10 KPMG Trusted AI principles.`;
//                 })()}
//               </div>
//             )}
//           </div>
//         )}

//         {/* ── COMPUTATION NOTES ── */}
//         {computationNotes && noteEntries.length > 0 && (
//           <div className="glass-card sdcc-enterprise" style={{ marginBottom: 36 }}>
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//               <h2 style={{ margin: 0 }}>Metric Computation Summary</h2>
//               <button className="toggle-notes-btn" onClick={() => setShowNotes((v) => !v)}>
//                 {showNotes ? "Hide details" : "Show details"}
//               </button>
//             </div>
//             <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
//               <div className="metric-card" style={{ flex: 1 }}>
//                 <span>Computed</span>
//                 <strong style={{ color: "#00C896" }}>{computedCount}</strong>
//               </div>
//               <div className="metric-card" style={{ flex: 1 }}>
//                 <span>Unavailable</span>
//                 <strong style={{ color: "#ffb020" }}>{unavailableCount}</strong>
//               </div>
//               <div className="metric-card" style={{ flex: 1 }}>
//                 <span>Total Metrics</span>
//                 <strong>{noteEntries.length}</strong>
//               </div>
//             </div>

//             {unavailableCount > 0 && (
//               <div className="info-box" style={{ marginTop: 8, fontSize: 12 }}>
//                 {unavailableCount} metric(s) could not be computed — missing required columns.
//                 Ensure your CSV has <code>task_id</code>, <code>input</code>, <code>output</code>, and <code>latency</code>.
//               </div>
//             )}

//             {showNotes && (
//               <div className="notes-grid" style={{ marginTop: 16 }}>
//                 {noteEntries.map(([key, note]) => (
//                   <div key={key} className={`note-card ${note.status === "computed" ? "note-ok" : "note-miss"}`}>
//                     <div className="note-key">{key.replace(/_/g, " ")}</div>
//                     <div className="note-val">
//                       {note.value !== null ? note.value.toFixed(4) : "—"}
//                     </div>
//                     <div className="note-lib">{note.library}</div>
//                     <div className={`note-status ${note.status === "computed" ? "ok" : "miss"}`}>
//                       {note.status === "computed" ? "Computed" : "Unavailable"}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         )}

//         {/* ── RUN FULL EVALUATION ── */}
//         <div className="eval-section" style={{ marginTop: "40px" }}>
//           <button className="run-btn" onClick={handleEvaluate} disabled={!uploaded || evalLoading}>
//             {evalLoading ? (
//               <span className="run-btn-inner">
//                 <span className="eval-spinner" />
//                 Evaluating…
//               </span>
//             ) : (
//               "Run Full Governance Evaluation"
//             )}
//           </button>

//           {evalLoading && (
//             <div className="eval-status-block">
//               <div className="eval-pulse-row">
//                 {["Structural Analysis", "Principle Scoring", "Risk Assessment", "Generating Report"].map((step, i) => (
//                   <div key={i} className="eval-step" style={{ animationDelay: `${i * 0.4}s` }}>
//                     <div className="eval-step-dot" style={{ animationDelay: `${i * 0.4}s` }} />
//                     <span>{step}</span>
//                   </div>
//                 ))}
//               </div>
//               <p className="hint-text" style={{ marginTop: 16 }}>
//                 Multi-layer evaluation in progress — applying KPMG Trusted AI Framework across all 10 governance principles.
//               </p>
//             </div>
//           )}

//           {!uploaded && <p className="hint-text" style={{ marginTop: 12 }}>Upload log data above to enable full governance evaluation</p>}
//           {evalError && <div className="error-inline" style={{ marginTop: "16px" }}>{evalError}</div>}
//         </div>

//       </div>
//     </div>
//   );
// }

// /* ─────────────────────────────────────────────
//    CSS
// ───────────────────────────────────────────── */
// const CSS = `
// @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

// * { box-sizing: border-box; }

// .hero {
//   min-height: 100vh;
//   background: #F4F7FB;
//   display: flex;
//   justify-content: center;
//   padding: 40px 20px;
//   font-family: 'Inter', sans-serif;
//   color: #0B1F33;
// }

// .hero-content { width: 100%; max-width: 1200px; }

// /* TOP BAR */
// .top-bar {
//   display: flex; justify-content: space-between; align-items: center;
//   margin-bottom: 36px; padding-bottom: 20px;
//   border-bottom: 1px solid #E3EAF3;
// }
// .top-bar-left { display: flex; align-items: center; gap: 16px; }
// .brand-title { font-size: 26px; font-weight: 800; margin: 0; color: #00338D; letter-spacing: -0.03em; }
// .ai-pill {
//   background: #E6F2FB; border: 1px solid #D6E6FF;
//   border-radius: 20px; padding: 4px 14px; font-size: 12px; color: #005EB8; font-weight: 500;
// }
// .profile-btn {
//   padding: 9px 20px; border-radius: 10px; border: 1px solid #D6E6FF;
//   background: #F8FBFF; color: #005EB8; font-weight: 600; font-size: 13px;
//   cursor: pointer; transition: 0.2s;
// }
// .profile-btn:hover { background: #EEF4FF; }
// .logout-btn {
//   padding: 9px 20px; border-radius: 10px; border: 1px solid #FFD6D6;
//   background: #FFF5F5; color: #E5484D; font-weight: 600; font-size: 13px;
//   cursor: pointer; transition: 0.2s;
// }
// .logout-btn:hover { background: #FFEEEE; }

// /* CARD HEADER ROW */
// .card-header-row {
//   display: flex; align-items: center; gap: 12px; margin-bottom: 2px;
// }
// .card-icon-shield {
//   width: 34px; height: 34px; border-radius: 10px;
//   background: linear-gradient(135deg, #00338D15, #005EB820);
//   border: 1px solid #D6E6FF; display: flex; align-items: center;
//   justify-content: center; color: #005EB8; flex-shrink: 0;
// }
// .card-icon-data {
//   width: 34px; height: 34px; border-radius: 10px;
//   background: linear-gradient(135deg, #05965615, #00C89620);
//   border: 1px solid #B2F0D9; display: flex; align-items: center;
//   justify-content: center; color: #059669; flex-shrink: 0;
// }

// /* GRID */
// .card-grid {
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
//   gap: 28px; margin-bottom: 36px;
// }

// /* GLASS CARD */
// .glass-card {
//   background: #FFFFFF; border-radius: 18px; padding: 32px;
//   border: 1px solid #E3EAF3; box-shadow: 0 12px 30px rgba(0,0,0,0.06);
//   display: flex; flex-direction: column; gap: 14px; transition: all 0.3s ease;
// }
// .glass-card:hover { transform: translateY(-3px); box-shadow: 0 20px 50px rgba(0,51,141,0.09); }
// .glass-card h2 { font-size: 17px; font-weight: 700; color: #0B1F33; margin: 0; letter-spacing: -0.02em; }
// .card-desc { font-size: 13px; color: #6B7C93; line-height: 1.6; margin: 0; }

// /* INPUTS */
// .glass-card label { font-size: 11.5px; font-weight: 600; color: #005EB8; text-transform: uppercase; letter-spacing: 0.04em; }
// .glass-card input[type="text"],
// .glass-card input[type="url"],
// .glass-card input[type="file"] {
//   padding: 12px 16px; border-radius: 10px; border: 1px solid #E3EAF3;
//   background: #FAFBFD; color: #0B1F33; font-size: 13.5px; width: 100%;
//   font-family: 'Inter', sans-serif;
// }
// .glass-card input[type="file"] { padding: 10px; font-size: 13px; }
// .glass-card input:focus {
//   border-color: #005EB8; box-shadow: 0 0 0 3px rgba(0,94,184,0.12); outline: none;
//   background: #FFFFFF;
// }

// /* BUTTON */
// .glass-card button {
//   padding: 13px; border-radius: 10px; border: none;
//   background: linear-gradient(135deg, #00338D, #005EB8);
//   color: white; font-weight: 600; font-size: 13.5px; cursor: pointer; transition: 0.25s;
//   font-family: 'Inter', sans-serif; letter-spacing: -0.01em;
// }
// .glass-card button:hover:not(:disabled) {
//   transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,51,141,0.25);
// }
// .glass-card button:disabled { opacity: 0.45; cursor: not-allowed; }

// /* TOGGLE */
// .toggle-container { display: flex; justify-content: space-between; align-items: center; }
// .toggle-label { font-size: 13.5px; font-weight: 600; color: #0B1F33; }
// .toggle-switch {
//   width: 48px; height: 25px; background: #E3EAF3;
//   border-radius: 13px; position: relative; cursor: pointer;
// }
// .toggle-knob {
//   width: 21px; height: 21px; border-radius: 50%; background: white;
//   position: absolute; top: 2px; transition: 0.25s;
//   box-shadow: 0 1px 4px rgba(0,0,0,0.15);
// }
// .toggle-knob.off { left: 2px; }
// .toggle-knob.on  { left: 25px; background: #005EB8; }
// .toggle-desc { font-size: 11.5px; color: #94A3B8; }

// /* INFO / WARN / ERROR */
// .info-box {
//   padding: 10px 14px; background: #F0F6FF; border: 1px solid #D6E6FF;
//   border-radius: 10px; font-size: 12.5px; color: #005EB8;
// }
// .info-box code {
//   background: rgba(0,94,184,0.1); border-radius: 4px; padding: 1px 5px;
//   font-size: 11px; color: #00338D; font-family: monospace;
// }
// .warn-box {
//   padding: 10px 14px; background: rgba(255,176,32,0.07);
//   border: 1px solid rgba(255,176,32,0.25); border-radius: 10px;
//   font-size: 12.5px; color: #92400E;
// }
// .link-text { cursor: pointer; text-decoration: underline; font-weight: 600; }
// .error-inline {
//   background: #FFF1F1; border: 1px solid #FFD6D6;
//   color: #E5484D; padding: 10px; border-radius: 10px; font-size: 13px;
// }
// .success-message {
//   background: #E6FFF6; border: 1px solid #B2F2D7;
//   color: #059669; padding: 10px; border-radius: 10px; font-size: 13px;
// }

// /* PROGRESS */
// .probe-progress { display: flex; flex-direction: column; gap: 6px; }
// .probe-bar-track { height: 5px; background: #E3EAF3; border-radius: 3px; overflow: hidden; }
// .probe-bar-fill {
//   height: 100%; background: linear-gradient(90deg, #00338D, #005EB8);
//   border-radius: 3px; transition: width 0.35s ease;
// }
// .probe-label { font-size: 11.5px; color: #94A3B8; }

// /* COL BADGES */
// .col-badge { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
// .col-ok   { background: rgba(5,150,105,0.08); border: 1px solid rgba(5,150,105,0.25); color: #059669; }
// .col-warn { background: rgba(255,176,32,0.08); border: 1px solid rgba(255,176,32,0.25); color: #92400E; }

// /* SDCC + BLACKBOX SUMMARIES */
// .blackbox-summary, .sdcc-summary {
//   background: white; border-radius: 20px; padding: 36px;
//   border: 1px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0,0,0,0.06); margin-bottom: 40px;
// }
// .blackbox-summary h2, .sdcc-summary h2 {
//   font-size: 18px; font-weight: 700; color: #0B1F33; margin-bottom: 24px; letter-spacing: -0.02em;
// }

// .sdcc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }
// .metric-item {
//   background: #F8FAFC; padding: 18px 20px; border-radius: 14px;
//   border: 1px solid #E2E8F0; text-align: center; transition: all 0.25s ease;
// }
// .metric-item:hover { background: #F0F7FF; border-color: #BFDBFE; }
// .metric-item span { font-size: 11px; color: #64748B; display: block; margin-bottom: 8px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }
// .metric-item strong { font-size: 22px; font-weight: 800; color: #0B1F33; }

// .risk-low    { color: #059669 !important; }
// .risk-moderate { color: #005EB8 !important; }
// .risk-high   { color: #DC2626 !important; }

// .sdcc-recommendation {
//   margin-top: 22px; padding: 15px 20px; background: #EEF6FF;
//   border-left: 4px solid #005EB8; border-radius: 10px;
//   font-size: 13.5px; color: #1E3A5F; line-height: 1.65;
// }

// /* COMPUTATION NOTES */
// .sdcc-enterprise { border-color: rgba(5,150,105,0.18); margin-bottom: 32px; }
// .metric-card {
//   background: #F8FAFC; padding: 16px; border-radius: 12px;
//   text-align: center; border: 1px solid #E2E8F0;
// }
// .metric-card span { font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.04em; }
// .metric-card strong { font-size: 20px; display: block; margin-top: 6px; color: #0B1F33; }
// .toggle-notes-btn {
//   background: #F0F6FF; border: 1px solid #D6E6FF; color: #005EB8;
//   padding: 6px 14px; border-radius: 8px; cursor: pointer;
//   font-size: 12px; font-weight: 600; transition: 0.2s;
//   font-family: 'Inter', sans-serif;
// }
// .toggle-notes-btn:hover { background: #E0EDFF; }
// .notes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px; }
// .note-card { padding: 13px; border-radius: 12px; border: 1px solid transparent; background: #F8FAFC; }
// .note-ok   { border-color: rgba(5,150,105,0.18); }
// .note-miss { border-color: rgba(255,176,32,0.16); }
// .note-key  { font-size: 11px; color: #64748B; text-transform: capitalize; margin-bottom: 4px; }
// .note-val  { font-size: 20px; font-weight: 800; color: #0B1F33; margin-bottom: 4px; }
// .note-lib  { font-size: 10px; color: #94A3B8; margin-bottom: 6px; line-height: 1.4; }
// .note-status { font-size: 11px; font-weight: 600; }
// .note-status.ok   { color: #059669; }
// .note-status.miss { color: #92400E; }

// /* EVALUATION SECTION */
// .eval-section { text-align: center; padding-bottom: 60px; }

// .run-btn {
//   padding: 16px 52px; border-radius: 40px; border: none;
//   background: linear-gradient(135deg, #00338D, #005EB8);
//   color: white; font-weight: 700; cursor: pointer; transition: 0.3s;
//   font-size: 15px; font-family: 'Inter', sans-serif; letter-spacing: -0.01em;
//   display: inline-flex; align-items: center; justify-content: center; gap: 10px;
// }
// .run-btn:hover:not(:disabled) { transform: scale(1.03); box-shadow: 0 14px 32px rgba(0,51,141,0.28); }
// .run-btn:disabled { opacity: 0.45; cursor: not-allowed; }

// .run-btn-inner { display: flex; align-items: center; gap: 10px; }

// /* SPINNER */
// @keyframes spin { to { transform: rotate(360deg); } }
// .eval-spinner {
//   width: 16px; height: 16px; border-radius: 50%;
//   border: 2px solid rgba(255,255,255,0.3);
//   border-top-color: white;
//   animation: spin 0.75s linear infinite;
//   flex-shrink: 0;
// }

// /* EVALUATION PROGRESS STEPS */
// .eval-status-block {
//   margin-top: 28px;
//   display: flex;
//   flex-direction: column;
//   align-items: center;
// }

// .eval-pulse-row {
//   display: flex;
//   align-items: center;
//   gap: 0;
//   justify-content: center;
// }

// @keyframes stepFade {
//   0%, 100% { opacity: 0.3; transform: translateY(2px); }
//   50%       { opacity: 1;   transform: translateY(0px); }
// }

// .eval-step {
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   gap: 8px;
//   min-width: 130px;
//   position: relative;
//   animation: stepFade 2s ease-in-out infinite;
// }

// .eval-step:not(:last-child)::after {
//   content: '';
//   position: absolute;
//   top: 9px;
//   right: -26px;
//   width: 50px;
//   height: 1px;
//   background: linear-gradient(90deg, #D1D5DB, #E5E7EB);
// }

// @keyframes dotPulse {
//   0%, 100% { transform: scale(0.85); background: #BFDBFE; }
//   50%       { transform: scale(1.2); background: #005EB8; }
// }

// .eval-step-dot {
//   width: 18px; height: 18px; border-radius: 50%;
//   background: #BFDBFE; border: 2px solid #005EB840;
//   animation: dotPulse 2s ease-in-out infinite;
// }

// .eval-step span {
//   font-size: 11px; font-weight: 500; color: #64748B;
//   white-space: nowrap; letter-spacing: 0.01em;
// }

// .hint-text { font-size: 12.5px; color: #94A3B8; margin-top: 8px; line-height: 1.6; }
// `;





// // // /* eslint-disable @typescript-eslint/no-explicit-any */
// // // import { useState } from "react";
// // // import { useNavigate } from "react-router-dom";
// // // import { sdccIngest, evaluateAI, runBlackBoxAudit } from "../services/api";

// // // /* ─────────────────────────────────────────────
// // //    Types
// // // ───────────────────────────────────────────── */
// // // interface BlackBoxFinding {
// // //   category: string;
// // //   severity: "High" | "Medium" | "Low" | "Pass";
// // //   probe: string;
// // //   response_preview: string;
// // //   issue: string;
// // //   recommendation: string;
// // // }

// // // interface BlackBoxResult {
// // //   audit_id: string;
// // //   ai_name: string;
// // //   mode: string;
// // //   status: string;
// // //   overall_score: number;
// // //   risk_level: string;
// // //   probes_run: number;
// // //   category_scores: Record<string, number>;
// // //   findings: BlackBoxFinding[];
// // //   message?: string;
// // // }

// // // interface ComputationNote {
// // //   library: string;
// // //   status: string;
// // //   value: number | null;
// // // }

// // // interface SdccSummary {
// // //   model_type: string;
// // //   logs_ingested: number;
// // //   data_quality_score: number;
// // //   structural_risk: string;
// // //   detection_confidence?: number;
// // //   recommendation?: string;
// // //   column_warnings?: string[];
// // //   has_task_id_col?: boolean;
// // //   has_input_col?: boolean;
// // //   has_output_col?: boolean;
// // //   has_latency_col?: boolean;
// // //   has_kb_col?: boolean;
// // //   schema_complete?: boolean;
// // // }

// // // /* ─────────────────────────────────────────────
// // //    Component
// // // ───────────────────────────────────────────── */
// // // export default function Dashboard() {
// // //   const navigate = useNavigate();

// // //   /* ── Black Box state ── */
// // //   const [bbMode, setBbMode]         = useState<"api" | "ui">("api");
// // //   const [bbEndpoint, setBbEndpoint] = useState("");
// // //   const [bbApiKey, setBbApiKey]     = useState("");
// // //   const [bbUiUrl, setBbUiUrl]       = useState("");
// // //   const [bbLoading, setBbLoading]   = useState(false);
// // //   const [bbResult, setBbResult]     = useState<BlackBoxResult | null>(null);
// // //   const [bbError, setBbError]       = useState("");
// // //   const [bbProgress, setBbProgress] = useState(0);

// // //   /* ── Ingestion state ── */
// // //   const [file, setFile]                   = useState<File | null>(null);
// // //   const [ingestLoading, setIngestLoading] = useState(false);
// // //   const [uploaded, setUploaded]           = useState(false);
// // //   const [logsCount, setLogsCount]         = useState<number | null>(null);
// // //   const [uploadSuccess, setUploadSuccess] = useState(false);
// // //   const [sdccSummary, setSdccSummary]     = useState<SdccSummary | null>(null);
// // //   const [ingestError, setIngestError]     = useState("");

// // //   /* ── KB upload state ── */
// // //   const [kbFiles, setKbFiles]           = useState<FileList | null>(null);
// // //   const [kbLoading, setKbLoading]       = useState(false);
// // //   const [kbSuccess, setKbSuccess]       = useState(false);
// // //   const [kbChunksCount, setKbChunksCount] = useState<number | null>(null);
// // //   const [kbError, setKbError]           = useState("");

// // //   /* ── Evaluate state ── */
// // //   const [evalLoading, setEvalLoading]         = useState(false);
// // //   const [evalError, setEvalError]             = useState("");
// // //   const [computationNotes, setComputationNotes] = useState<Record<string, ComputationNote> | null>(null);
// // //   const [showNotes, setShowNotes]             = useState(false);

// // //   const aiName = localStorage.getItem("activeAI") || "";

// // //   /* ── Helpers ── */
// // //   const extractErr = (e: any): string => {
// // //     if (!e?.response) return "Cannot reach backend. Ensure the server is running.";
// // //     return e.response?.data?.detail || "Operation failed.";
// // //   };

// // //   const handleLogout = () => {
// // //     localStorage.removeItem("token");
// // //     localStorage.removeItem("activeAI");
// // //     navigate("/login");
// // //   };

// // //   /* ─────────────────────────────────────────────
// // //      BLACK BOX HANDLER
// // //   ───────────────────────────────────────────── */
// // //   const handleBlackBox = async () => {
// // //     if (bbMode === "api" && (!bbEndpoint || !bbApiKey)) {
// // //       setBbError("Please provide both API Endpoint and API Key.");
// // //       return;
// // //     }
// // //     if (bbMode === "ui" && !bbUiUrl) {
// // //       setBbError("Please provide the deployed UI URL.");
// // //       return;
// // //     }

// // //     setBbLoading(true);
// // //     setBbError("");
// // //     setBbResult(null);
// // //     setBbProgress(0);

// // //     const totalProbes = 14;
// // //     const interval = setInterval(() => {
// // //       setBbProgress((p) => {
// // //         if (p >= totalProbes - 1) { clearInterval(interval); return p; }
// // //         return p + 1;
// // //       });
// // //     }, 350);

// // //     try {
// // //       const res = await runBlackBoxAudit({
// // //         ai_name:  aiName || "external-ai",
// // //         mode:     bbMode,
// // //         endpoint: bbEndpoint,
// // //         api_key:  bbApiKey,
// // //         ui_url:   bbUiUrl,
// // //       });
// // //       clearInterval(interval);
// // //       setBbProgress(totalProbes);
// // //       setBbResult(res.data);
// // //     } catch (e: any) {
// // //       clearInterval(interval);
// // //       setBbError(extractErr(e));
// // //     } finally {
// // //       setBbLoading(false);
// // //     }
// // //   };

// // //   /* ─────────────────────────────────────────────
// // //      INGESTION HANDLER
// // //   ───────────────────────────────────────────── */
// // //   const handleUpload = async () => {
// // //     if (!aiName) { navigate("/register-ai"); return; }
// // //     if (!file)   { setIngestError("Select a file first."); return; }

// // //     setIngestLoading(true);
// // //     setIngestError("");
// // //     setUploadSuccess(false);
// // //     setSdccSummary(null);
// // //     setComputationNotes(null);

// // //     try {
// // //       const res = await sdccIngest(aiName, file);
// // //       setSdccSummary(res.data);
// // //       setLogsCount(res.data.logs_ingested ?? null);
// // //       setUploaded(true);
// // //       setUploadSuccess(true);
// // //     } catch (e) {
// // //       setIngestError(extractErr(e));
// // //     } finally {
// // //       setIngestLoading(false);
// // //     }
// // //   };

// // //   /* ─────────────────────────────────────────────
// // //      KB UPLOAD HANDLER
// // //   ───────────────────────────────────────────── */


// // //   const handleKbUpload = async () => {
// // //   if (!aiName) {
// // //     alert("No AI selected. Go to Register AI first.");
// // //     return;
// // //   }
// // //   if (!kbFiles || kbFiles.length === 0) {
// // //     setKbError("Please select at least one KB file.");
// // //     return;
// // //   }

// // //   setKbLoading(true);
// // //   setKbError("");
// // //   setKbSuccess(false);

// // //   const formData = new FormData();
// // //   for (let i = 0; i < kbFiles.length; i++) {
// // //     formData.append("files", kbFiles[i]);   // ← must match backend: files: List[UploadFile]
// // //   }

// // //   try {
// // //     const res = await api.post(`/sdcc/upload-kb/${aiName}`, formData, {
// // //       headers: {
// // //         "Content-Type": "multipart/form-data",
// // //       },
// // //     });

// // //     setKbChunksCount(res.data.chunks_stored || 0);
// // //     setKbSuccess(true);
// // //     setKbError("");

// // //     // Optional: refresh SDCC status
// // //     // const statusRes = await api.get(`/sdcc/status/${aiName}`);
// // //     // setSdccSummary(statusRes.data);

// // //   } catch (err: any) {
// // //     console.error(err);
// // //     const msg = err.response?.data?.detail || err.message || "Failed to upload knowledge base";
// // //     setKbError(msg);
// // //     setKbSuccess(false);
// // //   } finally {
// // //     setKbLoading(false);
// // //   }
// // // };
// // //   // const handleKbUpload = async () => {
// // //   //   if (!aiName) { navigate("/register-ai"); return; }
// // //   //   if (!kbFiles || kbFiles.length === 0) {
// // //   //     setKbError("Select at least one knowledge base file.");
// // //   //     return;
// // //   //   }

// // //   //   setKbLoading(true);
// // //   //   setKbError("");
// // //   //   setKbSuccess(false);

// // //   //   try {
// // //   //     const formData = new FormData();
// // //   //     // Field name MUST be 'files' — matches FastAPI `files: List[UploadFile] = File(...)`
// // //   //     Array.from(kbFiles).forEach((f) => formData.append("files", f));

// // //   //     const token = localStorage.getItem("token");

// // //   //     // Use the project's configured axios instance (same one sdccIngest uses).
// // //   //     // This ensures baseURL, interceptors, and auth headers are inherited.
// // //   //     const { default: axios } = await import("axios");

// // //   //     // Build URL relative — Vite/CRA proxy will forward to FastAPI.
// // //   //     // Matches the router prefix used by sdccIngest (/api/v1/ai/...)
// // //   //     const url = `/api/v1/ai/sdcc/upload-kb/${encodeURIComponent(aiName)}`;

// // //   //     const res = await axios.post(url, formData, {
// // //   //       headers: {
// // //   //         Authorization: `Bearer ${token}`,
// // //   //         // Do NOT set Content-Type — axios sets multipart/form-data + boundary automatically
// // //   //       },
// // //   //     });

// // //   //     setKbChunksCount(res.data?.chunks_stored ?? null);
// // //   //     setKbSuccess(true);

// // //   //     // Show any per-file extraction warnings as a non-blocking error message
// // //   //     if (res.data?.errors?.length) {
// // //   //       setKbError(`Uploaded with warnings: ${res.data.errors.join("; ")}`);
// // //   //     }
// // //   //   } catch (e: any) {
// // //   //     const detail =
// // //   //       e?.response?.data?.detail ||
// // //   //       e?.response?.data?.message ||
// // //   //       (typeof e?.response?.data === "string" ? e.response.data : null) ||
// // //   //       e?.message ||
// // //   //       "KB upload failed. Check that the server is running and the route /api/v1/ai/sdcc/upload-kb is registered.";
// // //   //     setKbError(detail);
// // //   //   } finally {
// // //   //     setKbLoading(false);
// // //   //   }
// // //   // };

// // //   /* ─────────────────────────────────────────────
// // //      EVALUATE HANDLER
// // //   ───────────────────────────────────────────── */
// // //   const handleEvaluate = async () => {
// // //     if (!uploaded) return;
// // //     setEvalLoading(true);
// // //     setEvalError("");
// // //     setComputationNotes(null);
// // //     try {
// // //       const res = await evaluateAI(aiName);
// // //       if (res.data.computation_notes) {
// // //         setComputationNotes(res.data.computation_notes);
// // //       }
// // //       navigate("/report", { state: { data: res.data } });
// // //     } catch (e) {
// // //       setEvalError(extractErr(e));
// // //     } finally {
// // //       setEvalLoading(false);
// // //     }
// // //   };

// // //   /* ── Render helpers ── */
// // //   const totalProbes  = 14;
// // //   const progressPct  = Math.round((bbProgress / totalProbes) * 100);

// // //   const noteEntries      = computationNotes
// // //     ? Object.entries(computationNotes).filter(([k]) => k !== "_error")
// // //     : [];
// // //   const computedCount    = noteEntries.filter(([, n]) => n.status === "computed").length;
// // //   const unavailableCount = noteEntries.filter(([, n]) => n.status !== "computed").length;

// // //   /* ─────────────────────────────────────────────
// // //      JSX
// // //   ───────────────────────────────────────────── */
// // //   return (
// // //     <div className="hero">
// // //       <style>{CSS}</style>

// // //       <div className="hero-content">

// // //         {/* TOP BAR */}
// // //         <div className="top-bar">
// // //           <div className="top-bar-left">
// // //             <h1 className="brand-title">Auditable AI™</h1>
// // //             {aiName && <span className="ai-pill">Auditing: {aiName}</span>}
// // //           </div>
// // //           <div style={{ display: "flex", gap: 12 }}>
// // //             <button className="profile-btn" onClick={() => navigate("/profile")}> Profile</button>
// // //             <button className="logout-btn" onClick={handleLogout}>Logout →</button>
// // //           </div>
// // //         </div>

// // //         {/* ── ROW 1: Black Box + Ingestion ── */}
// // //         <div className="card-grid">

// // //           {/* BLACK BOX CARD */}
// // //           <div className="glass-card">
// // //             <h2> Black Box AI Audit</h2>
// // //             <p className="card-desc">
// // //               Connect an external AI system and fire 14 governance probes across
// // //               Safety, Fairness, Accuracy, Transparency, Robustness, and Explainability.
// // //             </p>

// // //             {/* Mode toggle */}
// // //             <div className="toggle-container">
// // //               <span className="toggle-label">Connection Mode</span>
// // //               <div
// // //                 className="toggle-switch"
// // //                 onClick={() => { setBbMode(bbMode === "api" ? "ui" : "api"); setBbResult(null); setBbError(""); }}
// // //               >
// // //                 <div className={`toggle-knob ${bbMode === "api" ? "on" : "off"}`} />
// // //               </div>
// // //             </div>
// // //             <p className="toggle-desc">{bbMode === "api" ? "API Key + Endpoint Mode" : "Deployed UI Mode"}</p>

// // //             {bbMode === "api" ? (
// // //               <>
// // //                 <label>External API Endpoint</label>
// // //                 <input
// // //                   type="url" name="bb-endpoint"
// // //                   autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
// // //                   placeholder="https://api.openai.com/v1/chat/completions"
// // //                   value={bbEndpoint} onChange={(e) => setBbEndpoint(e.target.value)}
// // //                   disabled={bbLoading}
// // //                 />
// // //                 <label>API Key</label>
// // //                 <input
// // //                   type="text" name="bb-apikey"
// // //                   autoComplete="new-password" autoCorrect="off" autoCapitalize="off" spellCheck={false}
// // //                   value={bbApiKey} onChange={(e) => setBbApiKey(e.target.value)}
// // //                   placeholder="sk-xxxx…"
// // //                   disabled={bbLoading}
// // //                 />
// // //               </>
// // //             ) : (
// // //               <>
// // //                 <label>Deployed UI URL</label>
// // //                 <input
// // //                   type="url" name="bb-uiurl" autoComplete="off"
// // //                   value={bbUiUrl} onChange={(e) => setBbUiUrl(e.target.value)}
// // //                   placeholder="https://your-chatbot.vercel.app"
// // //                   disabled={bbLoading}
// // //                 />
// // //                 <div className="info-box">
// // //                   ℹ UI audits run using secure backend browser automation.
// // //                   Ensure the chatbot URL is publicly accessible.
// // //                 </div>
// // //               </>
// // //             )}

// // //             {bbError && <div className="error-inline">{bbError}</div>}

// // //             <button onClick={handleBlackBox} disabled={bbLoading}>
// // //               {bbLoading ? "Probing AI…" : "Run Black Box Audit →"}
// // //             </button>

// // //             {bbLoading && (
// // //               <div className="probe-progress">
// // //                 <div className="probe-bar-track">
// // //                   <div className="probe-bar-fill" style={{ width: `${progressPct}%` }} />
// // //                 </div>
// // //                 <span className="probe-label">
// // //                   Firing probe {bbProgress}/{totalProbes}… ({progressPct}%)
// // //                 </span>
// // //               </div>
// // //             )}
// // //           </div>

// // //           {/* INGESTION CARD */}
// // //           <div className="glass-card">
// // //             <h2> Data Ingestion (SDCC)</h2>

// // //             {!aiName && (
// // //               <div className="warn-box">
// // //                  No AI registered.{" "}
// // //                 <span className="link-text" onClick={() => navigate("/register-ai")}>Register one →</span>
// // //               </div>
// // //             )}

// // //             {/* Required schema hint */}
// // //             <div className="info-box" style={{ fontSize: 12, lineHeight: 1.7 }}>
// // //               <strong style={{ color: "#4AACDF" }}>Required columns:</strong>{" "}
// // //               <code>task_id</code> · <code>input</code> · <code>output</code> · <code>latency</code>
// // //               <br />
// // //               <span style={{ color: "#64748B" }}>
// // //                 The AI judges each response for correctness automatically.
// // //                 Upload a knowledge base below to ground the evaluation in your own documents.
// // //               </span>
// // //             </div>

// // //             <p className="toggle-desc">SDCC structural analysis + LLM-as-a-Judge pipeline</p>

// // //             <label>Select Log File (.csv or .json)</label>
// // //             <input
// // //               type="file"
// // //               accept=".csv,.json"
// // //               onChange={(e) => {
// // //                 setFile(e.target.files?.[0] || null);
// // //                 setUploaded(false);
// // //                 setUploadSuccess(false);
// // //                 setSdccSummary(null);
// // //                 setComputationNotes(null);
// // //               }}
// // //             />

// // //             <button onClick={handleUpload} disabled={ingestLoading || !file}>
// // //               {ingestLoading ? "Uploading…" : "Upload Logs"}
// // //             </button>

// // //             {uploadSuccess && logsCount !== null && (
// // //               <div className="success-message"> Ingested {logsCount} records successfully.</div>
// // //             )}
// // //             {ingestError && <div className="error-inline">{ingestError}</div>}

// // //             {/* Column warnings */}
// // //             {sdccSummary?.column_warnings && sdccSummary.column_warnings.length > 0 && (
// // //               <div className="warn-box" style={{ marginTop: 4 }}>
// // //                 {sdccSummary.column_warnings.map((w, i) => (
// // //                   <div key={i} style={{ marginBottom: i < sdccSummary.column_warnings!.length - 1 ? 6 : 0 }}>
// // //                      {w}
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //             )}

// // //             {/* Schema column status badges */}
// // //             {sdccSummary && (
// // //               <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
// // //                 {[
// // //                   { key: "has_task_id_col", label: "task_id" },
// // //                   { key: "has_input_col",   label: "input"   },
// // //                   { key: "has_output_col",  label: "output"  },
// // //                   { key: "has_latency_col", label: "latency" },
// // //                 ].map(({ key, label }) => {
// // //                   const ok = (sdccSummary as any)[key];
// // //                   return (
// // //                     <span key={key} className={`col-badge ${ok ? "col-ok" : "col-warn"}`}>
// // //                       {ok ? "" : ""} {label}
// // //                     </span>
// // //                   );
// // //                 })}
// // //               </div>
// // //             )}

// // //             {/* KB upload section */}
// // //             <div style={{
// // //               marginTop: 8,
// // //               padding: "16px",
// // //               background: "#F8FBFF",
// // //               border: "1px dashed #D6E6FF",
// // //               borderRadius: 12,
// // //               display: "flex",
// // //               flexDirection: "column",
// // //               gap: 10,
// // //             }}>
// // //               <div style={{ fontSize: 13, fontWeight: 600, color: "#005EB8" }}>
// // //                  Knowledge Base (Optional)
// // //               </div>
// // //               <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>
// // //                 Upload PDF, TXT, MD, DOCX, or CSV files. The LLM judge will first
// // //                 search your KB before using its own knowledge to assess correctness.
// // //                 Multiple files accepted.
// // //               </div>
// // //               <input
// // //                 type="file"
// // //                 accept=".pdf,.txt,.md,.docx,.csv"
// // //                 multiple
// // //                 onChange={(e) => {
// // //                   setKbFiles(e.target.files);
// // //                   setKbSuccess(false);
// // //                   setKbError("");
// // //                 }}
// // //                 style={{ fontSize: 12 }}
// // //               />
// // //               <button
// // //                 onClick={handleKbUpload}
// // //                 disabled={kbLoading || !kbFiles || kbFiles.length === 0}
// // //                 style={{
// // //                   padding: "10px 0",
// // //                   background: "linear-gradient(135deg, #1D4ED8, #3B82F6)",
// // //                   fontSize: 13,
// // //                 }}
// // //               >
// // //                 {kbLoading ? "Uploading KB…" : "Upload Knowledge Base →"}
// // //               </button>
// // //               {kbSuccess && kbChunksCount !== null && (
// // //                 <div className="success-message" style={{ fontSize: 12 }}>
// // //                    {kbChunksCount} KB chunks stored. Judge will use these for evaluation.
// // //                 </div>
// // //               )}
// // //               {kbError && <div className="error-inline" style={{ fontSize: 12 }}>{kbError}</div>}
// // //             </div>
// // //           </div>
// // //         </div>

// // //         {/* ── BLACK BOX RESULT SUMMARY ── */}
// // //         {bbResult && bbResult.status !== "manual_required" && (
// // //           <div className="blackbox-summary glass-card" style={{ marginBottom: "36px" }}>
// // //             <h2> Black Box Audit Summary</h2>
// // //             <div className="sdcc-grid">
// // //               <div className="metric-item">
// // //                 <span>Probes Run</span>
// // //                 <strong>{bbResult.probes_run}</strong>
// // //               </div>
// // //               <div className="metric-item">
// // //                 <span>Findings</span>
// // //                 <strong style={{ color: bbResult.findings.length === 0 ? "#10B981" : "#EF4444" }}>
// // //                   {bbResult.findings.length}
// // //                 </strong>
// // //               </div>
// // //               <div className={`metric-item risk-${bbResult.risk_level.toLowerCase()}`}>
// // //                 <span>Risk Level</span>
// // //                 <strong>{bbResult.risk_level}</strong>
// // //               </div>
// // //             </div>
// // //             <div className="sdcc-recommendation">
// // //                {bbResult.findings.length === 0
// // //                 ? `${bbResult.ai_name || "The AI system"} passed all ${bbResult.probes_run} governance probes. No violations detected.`
// // //                 : `${bbResult.findings.length} governance violation(s) detected across ${[...new Set(bbResult.findings.map((f: BlackBoxFinding) => f.category))].join(", ")}. Immediate remediation recommended.`
// // //               }
// // //             </div>
// // //           </div>
// // //         )}

// // //         {bbResult && bbResult.status === "manual_required" && (
// // //           <div className="glass-card" style={{ marginBottom: "36px", borderColor: "rgba(255,176,32,0.3)" }}>
// // //             <h2> UI Mode — Manual Review Required</h2>
// // //             <p style={{ color: "#9DBFE0", fontSize: "14px", lineHeight: "1.6" }}>{bbResult.message}</p>
// // //           </div>
// // //         )}

// // //         {/* ── SDCC SUMMARY ── */}
// // //         {sdccSummary && (
// // //           <div className="sdcc-summary glass-card">
// // //             <h2> SDCC Structural Summary</h2>
// // //             <div className="sdcc-grid">
// // //               <div className="metric-item">
// // //                 <span>Model Type</span>
// // //                 <strong>{sdccSummary.model_type}</strong>
// // //               </div>
// // //               <div className="metric-item">
// // //                 <span>Logs Ingested</span>
// // //                 <strong>{sdccSummary.logs_ingested}</strong>
// // //               </div>
// // //               <div className="metric-item">
// // //                 <span>Data Quality</span>
// // //                 <strong>{sdccSummary.data_quality_score}%</strong>
// // //               </div>
// // //               <div className={`metric-item risk-${sdccSummary.structural_risk.toLowerCase()}`}>
// // //                 <span>Structural Risk</span>
// // //                 <strong>{sdccSummary.structural_risk}</strong>
// // //               </div>
// // //               {sdccSummary.detection_confidence !== undefined && (
// // //                 <div className="metric-item">
// // //                   <span>Detection Confidence</span>
// // //                   <strong>{Math.round(sdccSummary.detection_confidence * 100)}%</strong>
// // //                 </div>
// // //               )}
// // //               <div className={`metric-item ${sdccSummary.schema_complete ? "risk-low" : "risk-moderate"}`}>
// // //                 <span>Schema</span>
// // //                 <strong>{sdccSummary.schema_complete ? "Complete " : "Partial "}</strong>
// // //               </div>
// // //             </div>

// // //             {sdccSummary.recommendation && (
// // //               <div className="sdcc-recommendation">
// // //                  {(() => {
// // //                   const mt   = sdccSummary.model_type || "AI system";
// // //                   const risk = sdccSummary.structural_risk || "Unknown";
// // //                   const dq   = sdccSummary.data_quality_score || 0;
// // //                   if (risk === "Low" && dq >= 75)
// // //                     return `${mt} shows strong structural integrity. Proceed to full evaluation to generate your governance audit report.`;
// // //                   if (risk === "High" || dq < 50)
// // //                     return `${mt} has structural risk indicators. Ensure task_id, input, output, and latency columns are present.`;
// // //                   return `${mt} ingested with ${risk.toLowerCase()} structural risk. Run the full evaluation below to score across all 10 KPMG Trusted AI principles.`;
// // //                 })()}
// // //               </div>
// // //             )}
// // //           </div>
// // //         )}

// // //         {/* ── COMPUTATION NOTES ── */}
// // //         {computationNotes && noteEntries.length > 0 && (
// // //           <div className="glass-card sdcc-enterprise" style={{ marginBottom: 36 }}>
// // //             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
// // //               <h2 style={{ margin: 0 }}> Metric Computation Summary</h2>
// // //               <button className="toggle-notes-btn" onClick={() => setShowNotes((v) => !v)}>
// // //                 {showNotes ? "Hide details ▲" : "Show details ▼"}
// // //               </button>
// // //             </div>
// // //             <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
// // //               <div className="metric-card" style={{ flex: 1 }}>
// // //                 <span>Computed</span>
// // //                 <strong style={{ color: "#00C896" }}>{computedCount}</strong>
// // //               </div>
// // //               <div className="metric-card" style={{ flex: 1 }}>
// // //                 <span>Unavailable</span>
// // //                 <strong style={{ color: "#ffb020" }}>{unavailableCount}</strong>
// // //               </div>
// // //               <div className="metric-card" style={{ flex: 1 }}>
// // //                 <span>Total Metrics</span>
// // //                 <strong>{noteEntries.length}</strong>
// // //               </div>
// // //             </div>

// // //             {unavailableCount > 0 && (
// // //               <div className="info-box" style={{ marginTop: 8, fontSize: 12 }}>
// // //                  {unavailableCount} metric(s) couldn't be computed — missing required columns.
// // //                 Ensure your CSV has <code>task_id</code>, <code>input</code>, <code>output</code>, and <code>latency</code>.
// // //               </div>
// // //             )}

// // //             {showNotes && (
// // //               <div className="notes-grid" style={{ marginTop: 16 }}>
// // //                 {noteEntries.map(([key, note]) => (
// // //                   <div key={key} className={`note-card ${note.status === "computed" ? "note-ok" : "note-miss"}`}>
// // //                     <div className="note-key">{key.replace(/_/g, " ")}</div>
// // //                     <div className="note-val">
// // //                       {note.value !== null ? note.value.toFixed(4) : "—"}
// // //                     </div>
// // //                     <div className="note-lib">{note.library}</div>
// // //                     <div className={`note-status ${note.status === "computed" ? "ok" : "miss"}`}>
// // //                       {note.status === "computed" ? " computed" : " unavailable"}
// // //                     </div>
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //             )}
// // //           </div>
// // //         )}

// // //         {/* ── RUN FULL EVALUATION ── */}
// // //         <div className="center" style={{ marginTop: "40px" }}>
// // //           <button className="run-btn" onClick={handleEvaluate} disabled={!uploaded || evalLoading}>
// // //             {evalLoading ? "Running LLM Judge & evaluating…" : "Run Full Evaluation →"}
// // //           </button>
// // //           {evalLoading && (
// // //             <p className="hint-text" style={{ marginTop: 12 }}>
// // //               The LLM judge is assessing each response for correctness — this may take a moment…
// // //             </p>
// // //           )}
// // //           {!uploaded && <p className="hint-text">Upload logs above to enable evaluation</p>}
// // //           {evalError && <div className="error-inline" style={{ marginTop: "16px" }}>{evalError}</div>}
// // //         </div>

// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // /* ─────────────────────────────────────────────
// // //    CSS
// // // ───────────────────────────────────────────── */
// // // const CSS=`
// // // @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

// // // * { box-sizing: border-box; }

// // // .hero {
// // //   min-height: 100vh;
// // //   background: #F4F7FB;
// // //   display: flex;
// // //   justify-content: center;
// // //   padding: 40px 20px;
// // //   font-family: 'Inter', sans-serif;
// // //   color: #0B1F33;
// // // }

// // // .hero-content { width: 100%; max-width: 1200px; }

// // // /* TOP BAR */
// // // .top-bar {
// // //   display: flex; justify-content: space-between; align-items: center;
// // //   margin-bottom: 36px; padding-bottom: 20px;
// // //   border-bottom: 1px solid #E3EAF3;
// // // }
// // // .top-bar-left { display: flex; align-items: center; gap: 16px; }
// // // .brand-title { font-size: 26px; font-weight: 800; margin: 0; color: #00338D; }
// // // .ai-pill {
// // //   background: #E6F2FB; border: 1px solid #D6E6FF;
// // //   border-radius: 20px; padding: 4px 14px; font-size: 13px; color: #005EB8;
// // // }
// // // .profile-btn {
// // //   padding: 10px 22px; border-radius: 10px; border: 1px solid #D6E6FF;
// // //   background: #F8FBFF; color: #005EB8; font-weight: 600; font-size: 14px;
// // //   cursor: pointer; transition: 0.25s;
// // // }
// // // .profile-btn:hover { transform: translateY(-2px); background: #EEF4FF; }
// // // .logout-btn {
// // //   padding: 10px 22px; border-radius: 10px; border: 1px solid #FFD6D6;
// // //   background: #FFF5F5; color: #E5484D; font-weight: 600; font-size: 14px;
// // //   cursor: pointer; transition: 0.25s;
// // // }
// // // .logout-btn:hover { transform: translateY(-2px); }

// // // /* GRID */
// // // .card-grid {
// // //   display: grid;
// // //   grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
// // //   gap: 28px; margin-bottom: 36px;
// // // }

// // // /* GLASS CARD */
// // // .glass-card {
// // //   background: #FFFFFF; border-radius: 18px; padding: 32px;
// // //   border: 1px solid #E3EAF3; box-shadow: 0 12px 30px rgba(0,0,0,0.06);
// // //   display: flex; flex-direction: column; gap: 14px; transition: all 0.3s ease;
// // // }
// // // .glass-card:hover { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(0,51,141,0.1); }
// // // .glass-card h2 { font-size: 20px; font-weight: 700; color: #0B1F33; margin: 0; }
// // // .card-desc { font-size: 13px; color: #6B7C93; line-height: 1.55; margin: 0; }

// // // /* INPUTS */
// // // .glass-card label { font-size: 12px; font-weight: 600; color: #005EB8; }
// // // .glass-card input[type="text"],
// // // .glass-card input[type="url"],
// // // .glass-card input[type="file"] {
// // //   padding: 13px 16px; border-radius: 10px; border: 1px solid #E3EAF3;
// // //   background: #FFFFFF; color: #0B1F33; font-size: 14px; width: 100%;
// // // }
// // // .glass-card input[type="file"] { padding: 10px; font-size: 13px; }
// // // .glass-card input:focus {
// // //   border-color: #005EB8; box-shadow: 0 0 0 3px rgba(0,94,184,0.15); outline: none;
// // // }

// // // /* BUTTON */
// // // .glass-card button {
// // //   padding: 14px; border-radius: 10px; border: none;
// // //   background: linear-gradient(135deg, #00338D, #005EB8);
// // //   color: white; font-weight: 600; font-size: 14px; cursor: pointer; transition: 0.25s;
// // // }
// // // .glass-card button:hover:not(:disabled) {
// // //   transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,51,141,0.25);
// // // }
// // // .glass-card button:disabled { opacity: 0.5; cursor: not-allowed; }

// // // /* TOGGLE */
// // // .toggle-container { display: flex; justify-content: space-between; align-items: center; }
// // // .toggle-label { font-size: 14px; font-weight: 600; color: #0B1F33; }
// // // .toggle-switch {
// // //   width: 50px; height: 26px; background: #E3EAF3;
// // //   border-radius: 13px; position: relative; cursor: pointer;
// // // }
// // // .toggle-knob {
// // //   width: 22px; height: 22px; border-radius: 50%; background: white;
// // //   position: absolute; top: 2px; transition: 0.25s;
// // // }
// // // .toggle-knob.off { left: 2px; }
// // // .toggle-knob.on  { left: 26px; background: #005EB8; }
// // // .toggle-desc { font-size: 12px; color: #6B7C93; }

// // // /* INFO / WARN / ERROR */
// // // .info-box {
// // //   padding: 10px 14px; background: #F0F6FF; border: 1px solid #D6E6FF;
// // //   border-radius: 10px; font-size: 13px; color: #005EB8;
// // // }
// // // .info-box code {
// // //   background: rgba(0,94,184,0.12); border-radius: 4px; padding: 1px 5px;
// // //   font-size: 11px; color: #00338D; font-family: monospace;
// // // }
// // // .warn-box {
// // //   padding: 10px 14px; background: rgba(255,176,32,0.08);
// // //   border: 1px solid rgba(255,176,32,0.3); border-radius: 10px;
// // //   font-size: 13px; color: #b45309;
// // // }
// // // .link-text { cursor: pointer; text-decoration: underline; font-weight: 600; }
// // // .error-inline {
// // //   background: #FFF1F1; border: 1px solid #FFD6D6;
// // //   color: #E5484D; padding: 10px; border-radius: 10px; font-size: 13px;
// // // }
// // // .success-message {
// // //   background: #E6FFF6; border: 1px solid #B2F2D7;
// // //   color: #00A86B; padding: 10px; border-radius: 10px; font-size: 13px;
// // // }

// // // /* PROGRESS */
// // // .probe-progress { display: flex; flex-direction: column; gap: 6px; }
// // // .probe-bar-track { height: 6px; background: #E3EAF3; border-radius: 3px; overflow: hidden; }
// // // .probe-bar-fill {
// // //   height: 100%; background: linear-gradient(90deg, #00338D, #005EB8);
// // //   border-radius: 3px; transition: width 0.35s ease;
// // // }
// // // .probe-label { font-size: 12px; color: #6B7C93; font-style: italic; }

// // // /* COL BADGES */
// // // .col-badge { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
// // // .col-ok   { background: rgba(0,168,107,0.1); border: 1px solid rgba(0,168,107,0.3); color: #00A86B; }
// // // .col-warn { background: rgba(255,176,32,0.1); border: 1px solid rgba(255,176,32,0.3); color: #b45309; }

// // // /* SDCC + BLACKBOX SUMMARIES */
// // // .blackbox-summary, .sdcc-summary {
// // //   background: white; border-radius: 20px; padding: 36px;
// // //   border: 1px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0,0,0,0.06); margin-bottom: 40px;
// // // }
// // // .blackbox-summary h2, .sdcc-summary h2 { font-size: 21px; font-weight: 700; color: #1E2937; margin-bottom: 28px; }

// // // .sdcc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 20px; }
// // // .metric-item {
// // //   background: #F8FAFC; padding: 20px 22px; border-radius: 16px;
// // //   border: 1px solid #E2E8F0; text-align: center; transition: all 0.3s ease;
// // // }
// // // .metric-item:hover { background: #F0F7FF; border-color: #BFDBFE; }
// // // .metric-item span { font-size: 12.5px; color: #64748B; display: block; margin-bottom: 8px; font-weight: 500; }
// // // .metric-item strong { font-size: 23px; font-weight: 700; color: #1E2937; }

// // // .risk-low    { color: #059669 !important; }
// // // .risk-moderate { color: #005EB8 !important; }
// // // .risk-high   { color: #DC2626 !important; }

// // // .sdcc-recommendation {
// // //   margin-top: 28px; padding: 18px 22px; background: #E6F2FB;
// // //   border-left: 5px solid #005EB8; border-radius: 12px;
// // //   font-size: 15px; color: #00338D; line-height: 1.6;
// // // }

// // // /* COMPUTATION NOTES */
// // // .sdcc-enterprise { border-color: rgba(0,200,150,0.3); margin-bottom: 36px; }
// // // .metric-card {
// // //   background: #F8FAFC; padding: 16px; border-radius: 12px;
// // //   text-align: center; border: 1px solid #E2E8F0;
// // // }
// // // .metric-card span { font-size: 12px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }
// // // .metric-card strong { font-size: 20px; display: block; margin-top: 6px; color: #1E2937; }
// // // .toggle-notes-btn {
// // //   background: #F0F6FF; border: 1px solid #D6E6FF; color: #005EB8;
// // //   padding: 6px 14px; border-radius: 8px; cursor: pointer;
// // //   font-size: 12px; font-weight: 600; transition: 0.2s;
// // // }
// // // .toggle-notes-btn:hover { background: #E0EDFF; }
// // // .notes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
// // // .note-card { padding: 14px; border-radius: 12px; border: 1px solid transparent; background: #F8FAFC; }
// // // .note-ok   { border-color: rgba(0,168,107,0.25); }
// // // .note-miss { border-color: rgba(255,176,32,0.2); }
// // // .note-key  { font-size: 11px; color: #64748B; text-transform: capitalize; margin-bottom: 4px; }
// // // .note-val  { font-size: 20px; font-weight: 800; color: #1E2937; margin-bottom: 4px; }
// // // .note-lib  { font-size: 10px; color: #94A3B8; margin-bottom: 6px; line-height: 1.4; }
// // // .note-status { font-size: 11px; font-weight: 600; }
// // // .note-status.ok   { color: #00A86B; }
// // // .note-status.miss { color: #b45309; }

// // // /* RUN BUTTON */
// // // .center { text-align: center; }
// // // .run-btn {
// // //   padding: 16px 50px; border-radius: 40px; border: none;
// // //   background: linear-gradient(135deg, #00338D, #005EB8);
// // //   color: white; font-weight: 700; cursor: pointer; transition: 0.3s;
// // //   font-size: 16px;
// // // }
// // // .run-btn:hover:not(:disabled) { transform: scale(1.04); box-shadow: 0 12px 30px rgba(0,51,141,0.25); }
// // // .run-btn:disabled { opacity: 0.5; cursor: not-allowed; }
// // // .hint-text { margin-top: 10px; font-size: 13px; color: #6B7C93; }
// // // `;



// // /* eslint-disable @typescript-eslint/no-explicit-any */
// // import { useState } from "react";
// // import { useNavigate } from "react-router-dom";
// // import axios from "axios";
// // import { sdccIngest, evaluateAI, runBlackBoxAudit } from "../services/api";

// // /* ─────────────────────────────────────────────
// //    Types
// // ───────────────────────────────────────────── */
// // interface BlackBoxFinding {
// //   category: string;
// //   severity: "High" | "Medium" | "Low" | "Pass";
// //   probe: string;
// //   response_preview: string;
// //   issue: string;
// //   recommendation: string;
// // }

// // interface BlackBoxResult {
// //   audit_id: string;
// //   ai_name: string;
// //   mode: string;
// //   status: string;
// //   overall_score: number;
// //   risk_level: string;
// //   probes_run: number;
// //   category_scores: Record<string, number>;
// //   findings: BlackBoxFinding[];
// //   message?: string;
// // }

// // interface ComputationNote {
// //   library: string;
// //   status: string;
// //   value: number | null;
// // }

// // interface SdccSummary {
// //   model_type: string;
// //   logs_ingested: number;
// //   data_quality_score: number;
// //   structural_risk: string;
// //   detection_confidence?: number;
// //   recommendation?: string;
// //   column_warnings?: string[];
// //   has_task_id_col?: boolean;
// //   has_input_col?: boolean;
// //   has_output_col?: boolean;
// //   has_latency_col?: boolean;
// //   has_kb_col?: boolean;
// //   schema_complete?: boolean;
// // }

// // /* ─────────────────────────────────────────────
// //    Component
// // ───────────────────────────────────────────── */
// // export default function Dashboard() {
// //   const navigate = useNavigate();

// //   /* ── Black Box state ── */
// //   const [bbMode, setBbMode]         = useState<"api" | "ui">("api");
// //   const [bbEndpoint, setBbEndpoint] = useState("");
// //   const [bbApiKey, setBbApiKey]     = useState("");
// //   const [bbUiUrl, setBbUiUrl]       = useState("");
// //   const [bbLoading, setBbLoading]   = useState(false);
// //   const [bbResult, setBbResult]     = useState<BlackBoxResult | null>(null);
// //   const [bbError, setBbError]       = useState("");
// //   const [bbProgress, setBbProgress] = useState(0);

// //   /* ── Ingestion state ── */
// //   const [file, setFile]                   = useState<File | null>(null);
// //   const [ingestLoading, setIngestLoading] = useState(false);
// //   const [uploaded, setUploaded]           = useState(false);
// //   const [logsCount, setLogsCount]         = useState<number | null>(null);
// //   const [uploadSuccess, setUploadSuccess] = useState(false);
// //   const [sdccSummary, setSdccSummary]     = useState<SdccSummary | null>(null);
// //   const [ingestError, setIngestError]     = useState("");

// //   /* ── KB upload state ── */
// //   const [kbFiles, setKbFiles]             = useState<FileList | null>(null);
// //   const [kbLoading, setKbLoading]         = useState(false);
// //   const [kbSuccess, setKbSuccess]         = useState(false);
// //   const [kbChunksCount, setKbChunksCount] = useState<number | null>(null);
// //   const [kbError, setKbError]             = useState("");

// //   /* ── Evaluate state ── */
// //   const [evalLoading, setEvalLoading]           = useState(false);
// //   const [evalError, setEvalError]               = useState("");
// //   const [computationNotes, setComputationNotes] = useState<Record<string, ComputationNote> | null>(null);
// //   const [showNotes, setShowNotes]               = useState(false);

// //   const aiName = localStorage.getItem("activeAI") || "";

// //   /* ── Helpers ── */
// //   const extractErr = (e: any): string => {
// //     if (!e?.response) return "Cannot reach backend. Ensure the server is running.";
// //     return e.response?.data?.detail || "Operation failed.";
// //   };

// //   const handleLogout = () => {
// //     localStorage.removeItem("token");
// //     localStorage.removeItem("activeAI");
// //     navigate("/login");
// //   };

// //   /* ─────────────────────────────────────────────
// //      BLACK BOX HANDLER
// //   ───────────────────────────────────────────── */
// //   const handleBlackBox = async () => {
// //     if (bbMode === "api" && (!bbEndpoint || !bbApiKey)) {
// //       setBbError("Please provide both API Endpoint and API Key.");
// //       return;
// //     }
// //     if (bbMode === "ui" && !bbUiUrl) {
// //       setBbError("Please provide the deployed UI URL.");
// //       return;
// //     }

// //     setBbLoading(true);
// //     setBbError("");
// //     setBbResult(null);
// //     setBbProgress(0);

// //     const totalProbes = 14;
// //     const interval = setInterval(() => {
// //       setBbProgress((p) => {
// //         if (p >= totalProbes - 1) { clearInterval(interval); return p; }
// //         return p + 1;
// //       });
// //     }, 350);

// //     try {
// //       const res = await runBlackBoxAudit({
// //         ai_name:  aiName || "external-ai",
// //         mode:     bbMode,
// //         endpoint: bbEndpoint,
// //         api_key:  bbApiKey,
// //         ui_url:   bbUiUrl,
// //       });
// //       clearInterval(interval);
// //       setBbProgress(totalProbes);
// //       setBbResult(res.data);
// //     } catch (e: any) {
// //       clearInterval(interval);
// //       setBbError(extractErr(e));
// //     } finally {
// //       setBbLoading(false);
// //     }
// //   };

// //   /* ─────────────────────────────────────────────
// //      INGESTION HANDLER
// //   ───────────────────────────────────────────── */
// //   const handleUpload = async () => {
// //     if (!aiName) { navigate("/register-ai"); return; }
// //     if (!file)   { setIngestError("Select a file first."); return; }

// //     setIngestLoading(true);
// //     setIngestError("");
// //     setUploadSuccess(false);
// //     setSdccSummary(null);
// //     setComputationNotes(null);

// //     try {
// //       const res = await sdccIngest(aiName, file);
// //       setSdccSummary(res.data);
// //       setLogsCount(res.data.logs_ingested ?? null);
// //       setUploaded(true);
// //       setUploadSuccess(true);
// //     } catch (e) {
// //       setIngestError(extractErr(e));
// //     } finally {
// //       setIngestLoading(false);
// //     }
// //   };

// //   /* ─────────────────────────────────────────────
// //      KB UPLOAD HANDLER  — FIX: use imported `api` instance
// //   ───────────────────────────────────────────── */
// //   const handleKbUpload = async () => {
// //     if (!aiName) {
// //       alert("No AI selected. Go to Register AI first.");
// //       return;
// //     }
// //     if (!kbFiles || kbFiles.length === 0) {
// //       setKbError("Please select at least one KB file.");
// //       return;
// //     }

// //     setKbLoading(true);
// //     setKbError("");
// //     setKbSuccess(false);

// //     const formData = new FormData();
// //     for (let i = 0; i < kbFiles.length; i++) {
// //       formData.append("files", kbFiles[i]);
// //     }

// //     try {
// //       const token = localStorage.getItem("token");
// //       const res = await axios.post(
// //         `http://localhost:8000/sdcc/upload-kb/${encodeURIComponent(aiName)}`,
// //         formData,
// //         {
// //           headers: {
// //             "Content-Type": "multipart/form-data",
// //             ...(token ? { Authorization: `Bearer ${token}` } : {}),
// //           },
// //         }
// //       );

// //       setKbChunksCount(res.data.chunks_stored ?? 0);
// //       setKbSuccess(true);
// //       setKbError("");

// //       if (res.data?.errors?.length) {
// //         setKbError(`Uploaded with warnings: ${res.data.errors.join("; ")}`);
// //       }
// //     } catch (err: any) {
// //       const msg =
// //         err.response?.data?.detail ||
// //         err.message ||
// //         "Failed to upload knowledge base. Check that the server is running.";
// //       setKbError(msg);
// //       setKbSuccess(false);
// //     } finally {
// //       setKbLoading(false);
// //     }
// //   };

// //   /* ─────────────────────────────────────────────
// //      EVALUATE HANDLER
// //   ───────────────────────────────────────────── */
// //   const handleEvaluate = async () => {
// //     if (!uploaded) return;
// //     setEvalLoading(true);
// //     setEvalError("");
// //     setComputationNotes(null);
// //     try {
// //       const res = await evaluateAI(aiName);
// //       if (res.data.computation_notes) {
// //         setComputationNotes(res.data.computation_notes);
// //       }
// //       navigate("/report", { state: { data: res.data } });
// //     } catch (e) {
// //       setEvalError(extractErr(e));
// //     } finally {
// //       setEvalLoading(false);
// //     }
// //   };

// //   /* ── Render helpers ── */
// //   const totalProbes  = 14;
// //   const progressPct  = Math.round((bbProgress / totalProbes) * 100);

// //   const noteEntries      = computationNotes
// //     ? Object.entries(computationNotes).filter(([k]) => k !== "_error")
// //     : [];
// //   const computedCount    = noteEntries.filter(([, n]) => n.status === "computed").length;
// //   const unavailableCount = noteEntries.filter(([, n]) => n.status !== "computed").length;

// //   /* ─────────────────────────────────────────────
// //      JSX
// //   ───────────────────────────────────────────── */
// //   return (
// //     <div className="hero">
// //       <style>{CSS}</style>

// //       <div className="hero-content">

// //         {/* TOP BAR */}
// //         <div className="top-bar">
// //           <div className="top-bar-left">
// //             <h1 className="brand-title">Auditable AI™</h1>
// //             {aiName && <span className="ai-pill">Auditing: {aiName}</span>}
// //           </div>
// //           <div style={{ display: "flex", gap: 12 }}>
// //             <button className="profile-btn" onClick={() => navigate("/profile")}>Profile</button>
// //             <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
// //           </div>
// //         </div>

// //         {/* ── HERO BANNER ── */}
// //         <div className="hero-banner">
// //           <div className="hero-banner-inner">
// //             <div className="hero-badge">KPMG Trusted AI Framework</div>
// //             <h2 className="hero-heading">Enterprise AI Governance, Automated.</h2>
// //             <p className="hero-subheading">
// //               Upload your AI system's inference logs to receive a comprehensive governance audit
// //               scored across 10 Trusted AI principles — Transparency, Fairness, Accountability,
// //               Data Integrity, Reliability, Security, Privacy, Sustainability, Explainability, and Safety.
// //               Assess regulatory alignment with the EU AI Act, ISO 42001, and NIST AI RMF in minutes.
// //             </p>
// //             <div className="hero-stats">
// //               <div className="hero-stat">
// //                 <span className="hero-stat-num">10</span>
// //                 <span className="hero-stat-label">AI Principles</span>
// //               </div>
// //               <div className="hero-stat-divider" />
// //               <div className="hero-stat">
// //                 <span className="hero-stat-num">14</span>
// //                 <span className="hero-stat-label">Governance Probes</span>
// //               </div>
// //               <div className="hero-stat-divider" />
// //               <div className="hero-stat">
// //                 <span className="hero-stat-num">4</span>
// //                 <span className="hero-stat-label">Regulatory Frameworks</span>
// //               </div>
// //             </div>
// //           </div>
// //         </div>

// //         {/* ── ROW 1: Black Box + Ingestion ── */}
// //         <div className="section-label">Audit Modules</div>
// //         <div className="card-grid">

// //           {/* BLACK BOX CARD */}
// //           <div className="glass-card">
// //             <div className="card-header">
// //               <div className="card-icon card-icon--blue">
// //                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
// //               </div>
// //               <div>
// //                 <h2>Black Box Audit</h2>
// //                 <p className="card-desc">
// //                   Connect any external AI via API or deployed URL. The system fires 14 governance
// //                   probes across Safety, Fairness, Accuracy, Transparency, Robustness, and
// //                   Explainability — no access to model internals required.
// //                 </p>
// //               </div>
// //             </div>

// //             {/* Mode toggle */}
// //             <div className="toggle-container">
// //               <span className="toggle-label">Connection Mode</span>
// //               <div
// //                 className="toggle-switch"
// //                 onClick={() => { setBbMode(bbMode === "api" ? "ui" : "api"); setBbResult(null); setBbError(""); }}
// //               >
// //                 <div className={`toggle-knob ${bbMode === "api" ? "on" : "off"}`} />
// //               </div>
// //             </div>
// //             <p className="toggle-desc">{bbMode === "api" ? "API Key + Endpoint Mode" : "Deployed UI Mode"}</p>

// //             {bbMode === "api" ? (
// //               <>
// //                 <label>External API Endpoint</label>
// //                 <input
// //                   type="url" name="bb-endpoint"
// //                   autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
// //                   placeholder="https://api.openai.com/v1/chat/completions"
// //                   value={bbEndpoint} onChange={(e) => setBbEndpoint(e.target.value)}
// //                   disabled={bbLoading}
// //                 />
// //                 <label>API Key</label>
// //                 <input
// //                   type="text" name="bb-apikey"
// //                   autoComplete="new-password" autoCorrect="off" autoCapitalize="off" spellCheck={false}
// //                   value={bbApiKey} onChange={(e) => setBbApiKey(e.target.value)}
// //                   placeholder="sk-xxxx…"
// //                   disabled={bbLoading}
// //                 />
// //               </>
// //             ) : (
// //               <>
// //                 <label>Deployed UI URL</label>
// //                 <input
// //                   type="url" name="bb-uiurl" autoComplete="off"
// //                   value={bbUiUrl} onChange={(e) => setBbUiUrl(e.target.value)}
// //                   placeholder="https://your-chatbot.vercel.app"
// //                   disabled={bbLoading}
// //                 />
// //                 <div className="info-box">
// //                   UI audits use secure backend browser automation. Ensure the chatbot URL is publicly accessible.
// //                 </div>
// //               </>
// //             )}

// //             {bbError && <div className="error-inline">{bbError}</div>}

// //             <button onClick={handleBlackBox} disabled={bbLoading}>
// //               {bbLoading ? "Running probes…" : "Run Black Box Audit"}
// //             </button>

// //             {bbLoading && (
// //               <div className="probe-progress">
// //                 <div className="probe-bar-track">
// //                   <div className="probe-bar-fill" style={{ width: `${progressPct}%` }} />
// //                 </div>
// //                 <span className="probe-label">
// //                   Firing probe {bbProgress}/{totalProbes} ({progressPct}%)
// //                 </span>
// //               </div>
// //             )}
// //           </div>

// //           {/* INGESTION CARD */}
// //           <div className="glass-card">
// //             <div className="card-header">
// //               <div className="card-icon card-icon--green">
// //                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
// //               </div>
// //               <div>
// //                 <h2>Log Ingestion &amp; Analysis</h2>
// //               </div>
// //             </div>

// //             {!aiName && (
// //               <div className="warn-box">
// //                 No AI system registered.{" "}
// //                 <span className="link-text" onClick={() => navigate("/register-ai")}>Register one to continue</span>
// //               </div>
// //             )}

// //             {/* Required schema hint */}
// //             <div className="info-box" style={{ fontSize: 12, lineHeight: 1.7 }}>
// //               <strong style={{ color: "#4AACDF" }}>Required columns:</strong>{" "}
// //               <code>task_id</code> · <code>input</code> · <code>output</code> · <code>latency</code>
// //               <br />
// //               <span style={{ color: "#64748B" }}>
// //                 Each response is automatically assessed for correctness using an LLM judge.
// //                 Upload a knowledge base below to ground the evaluation in your own documents.
// //               </span>
// //             </div>

// //             <p className="toggle-desc">SDCC structural analysis + LLM-as-a-Judge pipeline</p>

// //             <label>Select Log File (.csv or .json)</label>
// //             <input
// //               type="file"
// //               accept=".csv,.json"
// //               onChange={(e) => {
// //                 setFile(e.target.files?.[0] || null);
// //                 setUploaded(false);
// //                 setUploadSuccess(false);
// //                 setSdccSummary(null);
// //                 setComputationNotes(null);
// //               }}
// //             />

// //             <button onClick={handleUpload} disabled={ingestLoading || !file}>
// //               {ingestLoading ? "Uploading…" : "Upload Logs"}
// //             </button>

// //             {uploadSuccess && logsCount !== null && (
// //               <div className="success-message">{logsCount} records ingested successfully.</div>
// //             )}
// //             {ingestError && <div className="error-inline">{ingestError}</div>}

// //             {/* Column warnings */}
// //             {sdccSummary?.column_warnings && sdccSummary.column_warnings.length > 0 && (
// //               <div className="warn-box" style={{ marginTop: 4 }}>
// //                 {sdccSummary.column_warnings.map((w, i) => (
// //                   <div key={i} style={{ marginBottom: i < sdccSummary.column_warnings!.length - 1 ? 6 : 0 }}>
// //                     {w}
// //                   </div>
// //                 ))}
// //               </div>
// //             )}

// //             {/* Schema column status badges */}
// //             {sdccSummary && (
// //               <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
// //                 {[
// //                   { key: "has_task_id_col", label: "task_id" },
// //                   { key: "has_input_col",   label: "input"   },
// //                   { key: "has_output_col",  label: "output"  },
// //                   { key: "has_latency_col", label: "latency" },
// //                 ].map(({ key, label }) => {
// //                   const ok = (sdccSummary as any)[key];
// //                   return (
// //                     <span key={key} className={`col-badge ${ok ? "col-ok" : "col-warn"}`}>
// //                       {ok ? "" : ""} {label}
// //                     </span>
// //                   );
// //                 })}
// //               </div>
// //             )}

// //             {/* KB upload section */}
// //             <div className="kb-section">
// //               <div className="kb-header">
// //                 <div className="kb-icon">
// //                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
// //                 </div>
// //                 <span>Knowledge Base <span className="optional-badge">Optional</span></span>
// //               </div>
// //               <div className="kb-desc">
// //                 Upload PDF, TXT, MD, DOCX, or CSV files. The LLM judge will search your knowledge
// //                 base before using its own knowledge to assess response correctness. Multiple files accepted.
// //               </div>
// //               <input
// //                 type="file"
// //                 accept=".pdf,.txt,.md,.docx,.csv"
// //                 multiple
// //                 onChange={(e) => {
// //                   setKbFiles(e.target.files);
// //                   setKbSuccess(false);
// //                   setKbError("");
// //                 }}
// //                 style={{ fontSize: 12 }}
// //               />
// //               <button
// //                 onClick={handleKbUpload}
// //                 disabled={kbLoading || !kbFiles || kbFiles.length === 0}
// //                 className="kb-upload-btn"
// //               >
// //                 {kbLoading ? "Uploading knowledge base…" : "Upload Knowledge Base"}
// //               </button>
// //               {kbSuccess && kbChunksCount !== null && (
// //                 <div className="success-message" style={{ fontSize: 12 }}>
// //                   {kbChunksCount} knowledge base chunks stored. The judge will use these during evaluation.
// //                 </div>
// //               )}
// //               {kbError && <div className="error-inline" style={{ fontSize: 12 }}>{kbError}</div>}
// //             </div>
// //           </div>
// //         </div>

// //         {/* ── BLACK BOX RESULT SUMMARY ── */}
// //         {bbResult && bbResult.status !== "manual_required" && (
// //           <div className="blackbox-summary glass-card" style={{ marginBottom: "36px" }}>
// //             <h2>Black Box Audit Summary</h2>
// //             <div className="sdcc-grid">
// //               <div className="metric-item">
// //                 <span>Probes Run</span>
// //                 <strong>{bbResult.probes_run}</strong>
// //               </div>
// //               <div className="metric-item">
// //                 <span>Findings</span>
// //                 <strong style={{ color: bbResult.findings.length === 0 ? "#10B981" : "#EF4444" }}>
// //                   {bbResult.findings.length}
// //                 </strong>
// //               </div>
// //               <div className={`metric-item risk-${bbResult.risk_level.toLowerCase()}`}>
// //                 <span>Risk Level</span>
// //                 <strong>{bbResult.risk_level}</strong>
// //               </div>
// //             </div>
// //             <div className="sdcc-recommendation">
// //               {bbResult.findings.length === 0
// //                 ? `${bbResult.ai_name || "The AI system"} passed all ${bbResult.probes_run} governance probes. No violations detected.`
// //                 : `${bbResult.findings.length} governance violation(s) detected across ${[...new Set(bbResult.findings.map((f: BlackBoxFinding) => f.category))].join(", ")}. Immediate remediation recommended.`
// //               }
// //             </div>
// //           </div>
// //         )}

// //         {bbResult && bbResult.status === "manual_required" && (
// //           <div className="glass-card" style={{ marginBottom: "36px", borderColor: "rgba(255,176,32,0.3)" }}>
// //             <h2>UI Mode — Manual Review Required</h2>
// //             <p style={{ color: "#9DBFE0", fontSize: "14px", lineHeight: "1.6" }}>{bbResult.message}</p>
// //           </div>
// //         )}

// //         {/* ── SDCC SUMMARY ── */}
// //         {sdccSummary && (
// //           <div className="sdcc-summary glass-card">
// //             <h2>Structural Analysis Summary</h2>
// //             <div className="sdcc-grid">
// //               <div className="metric-item">
// //                 <span>Model Type</span>
// //                 <strong>{sdccSummary.model_type}</strong>
// //               </div>
// //               <div className="metric-item">
// //                 <span>Logs Ingested</span>
// //                 <strong>{sdccSummary.logs_ingested}</strong>
// //               </div>
// //               <div className="metric-item">
// //                 <span>Data Quality</span>
// //                 <strong>{sdccSummary.data_quality_score}%</strong>
// //               </div>
// //               <div className={`metric-item risk-${sdccSummary.structural_risk.toLowerCase()}`}>
// //                 <span>Structural Risk</span>
// //                 <strong>{sdccSummary.structural_risk}</strong>
// //               </div>
// //               {sdccSummary.detection_confidence !== undefined && (
// //                 <div className="metric-item">
// //                   <span>Detection Confidence</span>
// //                   <strong>{Math.round(sdccSummary.detection_confidence * 100)}%</strong>
// //                 </div>
// //               )}
// //               <div className={`metric-item ${sdccSummary.schema_complete ? "risk-low" : "risk-moderate"}`}>
// //                 <span>Schema</span>
// //                 <strong>{sdccSummary.schema_complete ? "Complete" : "Partial"}</strong>
// //               </div>
// //             </div>

// //             {sdccSummary.recommendation && (
// //               <div className="sdcc-recommendation">
// //                 {(() => {
// //                   const mt   = sdccSummary.model_type || "AI system";
// //                   const risk = sdccSummary.structural_risk || "Unknown";
// //                   const dq   = sdccSummary.data_quality_score || 0;
// //                   if (risk === "Low" && dq >= 75)
// //                     return `${mt} shows strong structural integrity. Proceed to full evaluation to generate your governance audit report.`;
// //                   if (risk === "High" || dq < 50)
// //                     return `${mt} has structural risk indicators. Ensure task_id, input, output, and latency columns are present.`;
// //                   return `${mt} ingested with ${risk.toLowerCase()} structural risk. Run the full evaluation below to score across all 10 KPMG Trusted AI principles.`;
// //                 })()}
// //               </div>
// //             )}
// //           </div>
// //         )}

// //         {/* ── COMPUTATION NOTES ── */}
// //         {computationNotes && noteEntries.length > 0 && (
// //           <div className="glass-card sdcc-enterprise" style={{ marginBottom: 36 }}>
// //             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
// //               <h2 style={{ margin: 0 }}>Metric Computation Summary</h2>
// //               <button className="toggle-notes-btn" onClick={() => setShowNotes((v) => !v)}>
// //                 {showNotes ? "Hide details" : "Show details"}
// //               </button>
// //             </div>
// //             <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
// //               <div className="metric-card" style={{ flex: 1 }}>
// //                 <span>Computed</span>
// //                 <strong style={{ color: "#00C896" }}>{computedCount}</strong>
// //               </div>
// //               <div className="metric-card" style={{ flex: 1 }}>
// //                 <span>Unavailable</span>
// //                 <strong style={{ color: "#ffb020" }}>{unavailableCount}</strong>
// //               </div>
// //               <div className="metric-card" style={{ flex: 1 }}>
// //                 <span>Total Metrics</span>
// //                 <strong>{noteEntries.length}</strong>
// //               </div>
// //             </div>

// //             {unavailableCount > 0 && (
// //               <div className="info-box" style={{ marginTop: 8, fontSize: 12 }}>
// //                 {unavailableCount} metric(s) could not be computed — missing required columns.
// //                 Ensure your CSV has <code>task_id</code>, <code>input</code>, <code>output</code>, and <code>latency</code>.
// //               </div>
// //             )}

// //             {showNotes && (
// //               <div className="notes-grid" style={{ marginTop: 16 }}>
// //                 {noteEntries.map(([key, note]) => (
// //                   <div key={key} className={`note-card ${note.status === "computed" ? "note-ok" : "note-miss"}`}>
// //                     <div className="note-key">{key.replace(/_/g, " ")}</div>
// //                     <div className="note-val">
// //                       {note.value !== null ? note.value.toFixed(4) : "—"}
// //                     </div>
// //                     <div className="note-lib">{note.library}</div>
// //                     <div className={`note-status ${note.status === "computed" ? "ok" : "miss"}`}>
// //                       {note.status === "computed" ? "computed" : "unavailable"}
// //                     </div>
// //                   </div>
// //                 ))}
// //               </div>
// //             )}
// //           </div>
// //         )}

// //         {/* ── RUN FULL EVALUATION ── */}
// //         <div className="center" style={{ marginTop: "40px" }}>
// //           <button className="run-btn" onClick={handleEvaluate} disabled={!uploaded || evalLoading}>
// //             {evalLoading ? "Running LLM Judge & evaluating…" : "Run Full Evaluation"}
// //           </button>
// //           {evalLoading && (
// //             <p className="hint-text" style={{ marginTop: 12 }}>
// //               The LLM judge is assessing each response for correctness — this may take a moment…
// //             </p>
// //           )}
// //           {!uploaded && <p className="hint-text">Upload logs above to enable evaluation</p>}
// //           {evalError && <div className="error-inline" style={{ marginTop: "16px" }}>{evalError}</div>}
// //         </div>

// //       </div>
// //     </div>
// //   );
// // }

// // /* ─────────────────────────────────────────────
// //    CSS
// // ───────────────────────────────────────────── */
// // const CSS=`
// // @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

// // * { box-sizing: border-box; }

// // .hero {
// //   min-height: 100vh;
// //   background: #F4F7FB;
// //   display: flex;
// //   justify-content: center;
// //   padding: 40px 20px;
// //   font-family: 'Inter', sans-serif;
// //   color: #0B1F33;
// // }

// // .hero-content { width: 100%; max-width: 1200px; }

// // /* TOP BAR */
// // .top-bar {
// //   display: flex; justify-content: space-between; align-items: center;
// //   margin-bottom: 32px; padding-bottom: 20px;
// //   border-bottom: 1px solid #E3EAF3;
// // }
// // .top-bar-left { display: flex; align-items: center; gap: 16px; }
// // .brand-title { font-size: 22px; font-weight: 800; margin: 0; color: #00338D; letter-spacing: -0.02em; }
// // .ai-pill {
// //   background: #E6F2FB; border: 1px solid #D6E6FF;
// //   border-radius: 20px; padding: 4px 14px; font-size: 12px; color: #005EB8; font-weight: 500;
// // }
// // .profile-btn {
// //   padding: 9px 20px; border-radius: 10px; border: 1px solid #D6E6FF;
// //   background: #F8FBFF; color: #005EB8; font-weight: 600; font-size: 13px;
// //   cursor: pointer; transition: 0.2s;
// // }
// // .profile-btn:hover { background: #EEF4FF; }
// // .logout-btn {
// //   padding: 9px 20px; border-radius: 10px; border: 1px solid #FFD6D6;
// //   background: #FFF5F5; color: #E5484D; font-weight: 600; font-size: 13px;
// //   cursor: pointer; transition: 0.2s;
// // }
// // .logout-btn:hover { background: #FFEEEE; }

// // /* HERO BANNER */
// // .hero-banner {
// //   margin-bottom: 36px;
// //   border-radius: 20px;
// //   background: linear-gradient(135deg, #00338D 0%, #005EB8 60%, #0091DA 100%);
// //   padding: 44px 48px;
// //   color: white;
// //   position: relative;
// //   overflow: hidden;
// // }
// // .hero-banner::before {
// //   content: '';
// //   position: absolute;
// //   top: -60px; right: -60px;
// //   width: 280px; height: 280px;
// //   background: rgba(255,255,255,0.04);
// //   border-radius: 50%;
// // }
// // .hero-banner::after {
// //   content: '';
// //   position: absolute;
// //   bottom: -40px; right: 100px;
// //   width: 160px; height: 160px;
// //   background: rgba(255,255,255,0.03);
// //   border-radius: 50%;
// // }
// // .hero-banner-inner { position: relative; z-index: 1; }
// // .hero-badge {
// //   display: inline-block;
// //   font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
// //   background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25);
// //   border-radius: 20px; padding: 5px 14px; color: rgba(255,255,255,0.9);
// //   margin-bottom: 18px;
// // }
// // .hero-heading {
// //   font-size: 30px; font-weight: 800; letter-spacing: -0.03em; color: white;
// //   margin: 0 0 14px; line-height: 1.2;
// // }
// // .hero-subheading {
// //   font-size: 14px; color: rgba(255,255,255,0.75); line-height: 1.75;
// //   max-width: 700px; margin: 0 0 28px;
// // }
// // .hero-stats {
// //   display: flex; align-items: center; gap: 28px; flex-wrap: wrap;
// // }
// // .hero-stat { display: flex; flex-direction: column; gap: 3px; }
// // .hero-stat-num { font-size: 28px; font-weight: 900; color: white; line-height: 1; }
// // .hero-stat-label { font-size: 11px; color: rgba(255,255,255,0.6); font-weight: 500; letter-spacing: 0.03em; }
// // .hero-stat-divider { width: 1px; height: 36px; background: rgba(255,255,255,0.2); }

// // /* SECTION LABEL */
// // .section-label {
// //   font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
// //   color: #94A3B8; margin-bottom: 16px; padding-left: 2px;
// // }

// // /* GRID */
// // .card-grid {
// //   display: grid;
// //   grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
// //   gap: 24px; margin-bottom: 32px;
// // }

// // /* GLASS CARD */
// // .glass-card {
// //   background: #FFFFFF; border-radius: 18px; padding: 28px;
// //   border: 1px solid #E3EAF3; box-shadow: 0 1px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,51,141,0.06);
// //   display: flex; flex-direction: column; gap: 14px; transition: all 0.25s ease;
// // }
// // .glass-card:hover { box-shadow: 0 4px 20px rgba(0,51,141,0.1); }
// // .glass-card h2 { font-size: 18px; font-weight: 700; color: #0B1F33; margin: 0; }

// // /* CARD HEADER */
// // .card-header { display: flex; gap: 14px; align-items: flex-start; }
// // .card-icon {
// //   width: 38px; height: 38px; border-radius: 10px;
// //   display: flex; align-items: center; justify-content: center;
// //   flex-shrink: 0; margin-top: 1px;
// // }
// // .card-icon--blue { background: #E6F2FB; color: #005EB8; }
// // .card-icon--green { background: #DCFCE7; color: #059669; }
// // .card-desc { font-size: 13px; color: #6B7C93; line-height: 1.6; margin: 6px 0 0; }

// // /* INPUTS */
// // .glass-card label { font-size: 12px; font-weight: 600; color: #005EB8; margin-bottom: -6px; }
// // .glass-card input[type="text"],
// // .glass-card input[type="url"],
// // .glass-card input[type="file"] {
// //   padding: 12px 14px; border-radius: 10px; border: 1px solid #E3EAF3;
// //   background: #FAFBFD; color: #0B1F33; font-size: 13px; width: 100%; transition: 0.2s;
// // }
// // .glass-card input[type="file"] { padding: 10px; font-size: 12px; }
// // .glass-card input:focus {
// //   border-color: #005EB8; box-shadow: 0 0 0 3px rgba(0,94,184,0.12); outline: none;
// //   background: #FFFFFF;
// // }

// // /* BUTTON */
// // .glass-card button {
// //   padding: 13px; border-radius: 10px; border: none;
// //   background: linear-gradient(135deg, #00338D, #005EB8);
// //   color: white; font-weight: 600; font-size: 13px; cursor: pointer; transition: 0.2s;
// // }
// // .glass-card button:hover:not(:disabled) {
// //   transform: translateY(-1px); box-shadow: 0 8px 20px rgba(0,51,141,0.2);
// // }
// // .glass-card button:disabled { opacity: 0.45; cursor: not-allowed; }

// // /* KB SECTION */
// // .kb-section {
// //   margin-top: 4px; padding: 18px;
// //   background: #F8FBFF;
// //   border: 1.5px dashed #C5DCFA;
// //   border-radius: 14px;
// //   display: flex; flex-direction: column; gap: 10px;
// // }
// // .kb-header {
// //   display: flex; align-items: center; gap: 8px;
// //   font-size: 13px; font-weight: 700; color: #00338D;
// // }
// // .kb-icon {
// //   width: 26px; height: 26px; background: #E6F2FB; border-radius: 7px;
// //   display: flex; align-items: center; justify-content: center; color: #005EB8; flex-shrink: 0;
// // }
// // .optional-badge {
// //   font-size: 10px; font-weight: 600; color: #94A3B8;
// //   background: #F1F5F9; border: 1px solid #E2E8F0;
// //   padding: 2px 8px; border-radius: 10px; margin-left: 4px; text-transform: uppercase;
// //   letter-spacing: 0.04em;
// // }
// // .kb-desc { font-size: 12px; color: #64748B; line-height: 1.55; }
// // .kb-upload-btn {
// //   padding: 11px 0 !important;
// //   background: linear-gradient(135deg, #1D4ED8, #3B82F6) !important;
// //   font-size: 13px !important;
// // }

// // /* TOGGLE */
// // .toggle-container { display: flex; justify-content: space-between; align-items: center; }
// // .toggle-label { font-size: 13px; font-weight: 600; color: #0B1F33; }
// // .toggle-switch {
// //   width: 48px; height: 25px; background: #E3EAF3;
// //   border-radius: 13px; position: relative; cursor: pointer; transition: background 0.2s;
// // }
// // .toggle-knob {
// //   width: 21px; height: 21px; border-radius: 50%; background: white;
// //   position: absolute; top: 2px; transition: 0.25s;
// //   box-shadow: 0 1px 4px rgba(0,0,0,0.15);
// // }
// // .toggle-knob.off { left: 2px; }
// // .toggle-knob.on  { left: 25px; background: #005EB8; }
// // .toggle-desc { font-size: 12px; color: #94A3B8; }

// // /* INFO / WARN / ERROR */
// // .info-box {
// //   padding: 10px 14px; background: #F0F6FF; border: 1px solid #D6E6FF;
// //   border-radius: 10px; font-size: 13px; color: #005EB8; line-height: 1.55;
// // }
// // .info-box code {
// //   background: rgba(0,94,184,0.1); border-radius: 4px; padding: 1px 5px;
// //   font-size: 11px; color: #00338D; font-family: monospace;
// // }
// // .warn-box {
// //   padding: 10px 14px; background: rgba(255,176,32,0.07);
// //   border: 1px solid rgba(255,176,32,0.25); border-radius: 10px;
// //   font-size: 13px; color: #92400E; line-height: 1.55;
// // }
// // .link-text { cursor: pointer; text-decoration: underline; font-weight: 600; }
// // .error-inline {
// //   background: #FFF1F1; border: 1px solid #FECACA;
// //   color: #DC2626; padding: 10px 14px; border-radius: 10px; font-size: 13px; line-height: 1.5;
// // }
// // .success-message {
// //   background: #ECFDF5; border: 1px solid #A7F3D0;
// //   color: #065F46; padding: 10px 14px; border-radius: 10px; font-size: 13px;
// // }

// // /* PROGRESS */
// // .probe-progress { display: flex; flex-direction: column; gap: 7px; }
// // .probe-bar-track { height: 5px; background: #E3EAF3; border-radius: 3px; overflow: hidden; }
// // .probe-bar-fill {
// //   height: 100%; background: linear-gradient(90deg, #00338D, #0091DA);
// //   border-radius: 3px; transition: width 0.35s ease;
// // }
// // .probe-label { font-size: 12px; color: #94A3B8; }

// // /* COL BADGES */
// // .col-badge { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
// // .col-ok   { background: rgba(0,168,107,0.08); border: 1px solid rgba(0,168,107,0.25); color: #065F46; }
// // .col-warn { background: rgba(255,176,32,0.08); border: 1px solid rgba(255,176,32,0.25); color: #92400E; }

// // /* SDCC + BLACKBOX SUMMARIES */
// // .blackbox-summary, .sdcc-summary {
// //   background: white; border-radius: 18px; padding: 32px;
// //   border: 1px solid #E2E8F0; box-shadow: 0 1px 4px rgba(0,0,0,0.04); margin-bottom: 36px;
// // }
// // .blackbox-summary h2, .sdcc-summary h2 {
// //   font-size: 18px; font-weight: 700; color: #1E2937; margin-bottom: 22px;
// // }

// // .sdcc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }
// // .metric-item {
// //   background: #F8FAFC; padding: 18px 20px; border-radius: 14px;
// //   border: 1px solid #E2E8F0; text-align: center; transition: all 0.2s ease;
// // }
// // .metric-item:hover { background: #F0F7FF; border-color: #BFDBFE; }
// // .metric-item span { font-size: 12px; color: #64748B; display: block; margin-bottom: 8px; font-weight: 500; }
// // .metric-item strong { font-size: 22px; font-weight: 800; color: #1E2937; }

// // .risk-low    { color: #065F46 !important; }
// // .risk-moderate { color: #005EB8 !important; }
// // .risk-high   { color: #DC2626 !important; }

// // .sdcc-recommendation {
// //   margin-top: 22px; padding: 16px 20px; background: #EEF6FF;
// //   border-left: 4px solid #005EB8; border-radius: 10px;
// //   font-size: 13.5px; color: #1E3A5F; line-height: 1.65;
// // }

// // /* COMPUTATION NOTES */
// // .sdcc-enterprise { border-color: rgba(0,168,107,0.2); margin-bottom: 32px; }
// // .metric-card {
// //   background: #F8FAFC; padding: 16px; border-radius: 12px;
// //   text-align: center; border: 1px solid #E2E8F0;
// // }
// // .metric-card span { font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }
// // .metric-card strong { font-size: 20px; display: block; margin-top: 6px; color: #1E2937; }
// // .toggle-notes-btn {
// //   background: #F0F6FF; border: 1px solid #D6E6FF; color: #005EB8;
// //   padding: 6px 14px; border-radius: 8px; cursor: pointer;
// //   font-size: 12px; font-weight: 600; transition: 0.2s;
// // }
// // .toggle-notes-btn:hover { background: #E0EDFF; }
// // .notes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px; }
// // .note-card { padding: 13px; border-radius: 12px; border: 1px solid transparent; background: #F8FAFC; }
// // .note-ok   { border-color: rgba(0,168,107,0.2); }
// // .note-miss { border-color: rgba(255,176,32,0.18); }
// // .note-key  { font-size: 11px; color: #64748B; text-transform: capitalize; margin-bottom: 4px; }
// // .note-val  { font-size: 20px; font-weight: 800; color: #1E2937; margin-bottom: 4px; }
// // .note-lib  { font-size: 10px; color: #94A3B8; margin-bottom: 6px; line-height: 1.4; }
// // .note-status { font-size: 11px; font-weight: 600; }
// // .note-status.ok   { color: #065F46; }
// // .note-status.miss { color: #92400E; }

// // /* RUN BUTTON */
// // .center { text-align: center; }
// // .run-btn {
// //   padding: 15px 50px; border-radius: 40px; border: none;
// //   background: linear-gradient(135deg, #00338D, #005EB8);
// //   color: white; font-weight: 700; cursor: pointer; transition: 0.25s;
// //   font-size: 15px; letter-spacing: -0.01em;
// // }
// // .run-btn:hover:not(:disabled) { transform: scale(1.03); box-shadow: 0 10px 28px rgba(0,51,141,0.22); }
// // .run-btn:disabled { opacity: 0.45; cursor: not-allowed; }
// // .hint-text { margin-top: 10px; font-size: 13px; color: #94A3B8; }
// // `;



// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { sdccIngest, evaluateAI, runBlackBoxAudit, uploadKnowledgeBase } from "../services/api";

// /* ─────────────────────────────────────────────
//    Types
// ───────────────────────────────────────────── */
// interface BlackBoxFinding {
//   category: string;
//   severity: "High" | "Medium" | "Low" | "Pass";
//   probe: string;
//   response_preview: string;
//   issue: string;
//   recommendation: string;
// }

// interface BlackBoxResult {
//   audit_id: string;
//   ai_name: string;
//   mode: string;
//   status: string;
//   overall_score: number;
//   risk_level: string;
//   probes_run: number;
//   category_scores: Record<string, number>;
//   findings: BlackBoxFinding[];
//   message?: string;
// }

// interface ComputationNote {
//   library: string;
//   status: string;
//   value: number | null;
// }

// interface SdccSummary {
//   model_type: string;
//   logs_ingested: number;
//   data_quality_score: number;
//   structural_risk: string;
//   detection_confidence?: number;
//   recommendation?: string;
//   column_warnings?: string[];
//   has_task_id_col?: boolean;
//   has_input_col?: boolean;
//   has_output_col?: boolean;
//   has_latency_col?: boolean;
//   has_kb_col?: boolean;
//   schema_complete?: boolean;
// }

// /* ─────────────────────────────────────────────
//    Component
// ───────────────────────────────────────────── */
// export default function Dashboard() {
//   const navigate = useNavigate();

//   /* ── Black Box state ── */
//   const [bbMode, setBbMode]         = useState<"api" | "ui">("api");
//   const [bbEndpoint, setBbEndpoint] = useState("");
//   const [bbApiKey, setBbApiKey]     = useState("");
//   const [bbUiUrl, setBbUiUrl]       = useState("");
//   const [bbLoading, setBbLoading]   = useState(false);
//   const [bbResult, setBbResult]     = useState<BlackBoxResult | null>(null);
//   const [bbError, setBbError]       = useState("");
//   const [bbProgress, setBbProgress] = useState(0);

//   /* ── Ingestion state ── */
//   const [file, setFile]                   = useState<File | null>(null);
//   const [ingestLoading, setIngestLoading] = useState(false);
//   const [uploaded, setUploaded]           = useState(false);
//   const [logsCount, setLogsCount]         = useState<number | null>(null);
//   const [uploadSuccess, setUploadSuccess] = useState(false);
//   const [sdccSummary, setSdccSummary]     = useState<SdccSummary | null>(null);
//   const [ingestError, setIngestError]     = useState("");

//   /* ── KB upload state ── */
//   const [kbFiles, setKbFiles]           = useState<FileList | null>(null);
//   const [kbLoading, setKbLoading]       = useState(false);
//   const [kbSuccess, setKbSuccess]       = useState(false);
//   const [kbChunksCount, setKbChunksCount] = useState<number | null>(null);
//   const [kbError, setKbError]           = useState("");

//   /* ── Evaluate state ── */
//   const [evalLoading, setEvalLoading]         = useState(false);
//   const [evalError, setEvalError]             = useState("");
//   const [computationNotes, setComputationNotes] = useState<Record<string, ComputationNote> | null>(null);
//   const [showNotes, setShowNotes]             = useState(false);

//   const aiName = localStorage.getItem("activeAI") || "";

//   /* ── Helpers ── */
//   const extractErr = (e: any): string => {
//     if (!e?.response) return "Cannot reach backend. Ensure the server is running.";
//     return e.response?.data?.detail || "Operation failed.";
//   };

//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("activeAI");
//     navigate("/login");
//   };

//   /* ─────────────────────────────────────────────
//      BLACK BOX HANDLER
//   ───────────────────────────────────────────── */
//   const handleBlackBox = async () => {
//     if (bbMode === "api" && (!bbEndpoint || !bbApiKey)) {
//       setBbError("Please provide both API Endpoint and API Key.");
//       return;
//     }
//     if (bbMode === "ui" && !bbUiUrl) {
//       setBbError("Please provide the deployed UI URL.");
//       return;
//     }

//     setBbLoading(true);
//     setBbError("");
//     setBbResult(null);
//     setBbProgress(0);

//     const totalProbes = 14;
//     const interval = setInterval(() => {
//       setBbProgress((p) => {
//         if (p >= totalProbes - 1) { clearInterval(interval); return p; }
//         return p + 1;
//       });
//     }, 350);

//     try {
//       const res = await runBlackBoxAudit({
//         ai_name:  aiName || "external-ai",
//         mode:     bbMode,
//         endpoint: bbEndpoint,
//         api_key:  bbApiKey,
//         ui_url:   bbUiUrl,
//       });
//       clearInterval(interval);
//       setBbProgress(totalProbes);
//       setBbResult(res.data);
//     } catch (e: any) {
//       clearInterval(interval);
//       setBbError(extractErr(e));
//     } finally {
//       setBbLoading(false);
//     }
//   };

//   /* ─────────────────────────────────────────────
//      INGESTION HANDLER
//   ───────────────────────────────────────────── */
//   const handleUpload = async () => {
//     if (!aiName) { navigate("/register-ai"); return; }
//     if (!file)   { setIngestError("Select a file first."); return; }

//     setIngestLoading(true);
//     setIngestError("");
//     setUploadSuccess(false);
//     setSdccSummary(null);
//     setComputationNotes(null);

//     try {
//       const res = await sdccIngest(aiName, file);
//       setSdccSummary(res.data);
//       setLogsCount(res.data.logs_ingested ?? null);
//       setUploaded(true);
//       setUploadSuccess(true);
//     } catch (e) {
//       setIngestError(extractErr(e));
//     } finally {
//       setIngestLoading(false);
//     }
//   };

//   /* ─────────────────────────────────────────────
//      KB UPLOAD HANDLER
//   ───────────────────────────────────────────── */
//   const handleKbUpload = async () => {
//     if (!aiName) { navigate("/register-ai"); return; }
//     if (!kbFiles || kbFiles.length === 0) {
//       setKbError("Select at least one knowledge base file.");
//       return;
//     }
//     setKbLoading(true);
//     setKbError("");
//     setKbSuccess(false);
//     try {
//       const res = await uploadKnowledgeBase(aiName, Array.from(kbFiles));
//       setKbChunksCount(res.data?.chunks_stored ?? null);
//       setKbSuccess(true);
//       if (res.data?.errors?.length) {
//         setKbError(`Uploaded with warnings: ${res.data.errors.join("; ")}`);
//       }
//     } catch (e: any) {
//       const detail =
//         e?.response?.data?.detail ||
//         e?.response?.data?.message ||
//         e?.message ||
//         "KB upload failed.";
//       setKbError(detail);
//     } finally {
//       setKbLoading(false);
//     }
//   };

//   /* ─────────────────────────────────────────────
//      EVALUATE HANDLER
//   ───────────────────────────────────────────── */
//   const handleEvaluate = async () => {
//     if (!uploaded) return;
//     setEvalLoading(true);
//     setEvalError("");
//     setComputationNotes(null);
//     try {
//       const res = await evaluateAI(aiName);
//       if (res.data.computation_notes) {
//         setComputationNotes(res.data.computation_notes);
//       }
//       navigate("/report", { state: { data: res.data } });
//     } catch (e) {
//       setEvalError(extractErr(e));
//     } finally {
//       setEvalLoading(false);
//     }
//   };

//   /* ── Render helpers ── */
//   const totalProbes  = 14;
//   const progressPct  = Math.round((bbProgress / totalProbes) * 100);

//   const noteEntries      = computationNotes
//     ? Object.entries(computationNotes).filter(([k]) => k !== "_error")
//     : [];
//   const computedCount    = noteEntries.filter(([, n]) => n.status === "computed").length;
//   const unavailableCount = noteEntries.filter(([, n]) => n.status !== "computed").length;

//   /* ─────────────────────────────────────────────
//      JSX
//   ───────────────────────────────────────────── */
//   return (
//     <div className="hero">
//       <style>{CSS}</style>

//       <div className="hero-content">

//         {/* TOP BAR */}
//         <div className="top-bar">
//           <div className="top-bar-left">
//             <h1 className="brand-title">Auditable AI™</h1>
//             {aiName && <span className="ai-pill">Auditing: {aiName}</span>}
//           </div>
//           <div style={{ display: "flex", gap: 12 }}>
//             <button className="profile-btn" onClick={() => navigate("/profile")}> Profile</button>
//             <button className="logout-btn" onClick={handleLogout}>Logout →</button>
//           </div>
//         </div>

//         {/* ── ROW 1: Black Box + Ingestion ── */}
//         <div className="card-grid">

//           {/* BLACK BOX CARD */}
//           <div className="glass-card">
//             <h2> Black Box AI Audit</h2>
//             <p className="card-desc">
//               Connect an external AI system and fire 14 governance probes across
//               Safety, Fairness, Accuracy, Transparency, Robustness, and Explainability.
//             </p>

//             {/* Mode toggle */}
//             <div className="toggle-container">
//               <span className="toggle-label">Connection Mode</span>
//               <div
//                 className="toggle-switch"
//                 onClick={() => { setBbMode(bbMode === "api" ? "ui" : "api"); setBbResult(null); setBbError(""); }}
//               >
//                 <div className={`toggle-knob ${bbMode === "api" ? "on" : "off"}`} />
//               </div>
//             </div>
//             <p className="toggle-desc">{bbMode === "api" ? "API Key + Endpoint Mode" : "Deployed UI Mode"}</p>

//             {bbMode === "api" ? (
//               <>
//                 <label>External API Endpoint</label>
//                 <input
//                   type="url" name="bb-endpoint"
//                   autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
//                   placeholder="https://api.openai.com/v1/chat/completions"
//                   value={bbEndpoint} onChange={(e) => setBbEndpoint(e.target.value)}
//                   disabled={bbLoading}
//                 />
//                 <label>API Key</label>
//                 <input
//                   type="text" name="bb-apikey"
//                   autoComplete="new-password" autoCorrect="off" autoCapitalize="off" spellCheck={false}
//                   value={bbApiKey} onChange={(e) => setBbApiKey(e.target.value)}
//                   placeholder="sk-xxxx…"
//                   disabled={bbLoading}
//                 />
//               </>
//             ) : (
//               <>
//                 <label>Deployed UI URL</label>
//                 <input
//                   type="url" name="bb-uiurl" autoComplete="off"
//                   value={bbUiUrl} onChange={(e) => setBbUiUrl(e.target.value)}
//                   placeholder="https://your-chatbot.vercel.app"
//                   disabled={bbLoading}
//                 />
//                 <div className="info-box">
//                   ℹ UI audits run using secure backend browser automation.
//                   Ensure the chatbot URL is publicly accessible.
//                 </div>
//               </>
//             )}

//             {bbError && <div className="error-inline">{bbError}</div>}

//             <button onClick={handleBlackBox} disabled={bbLoading}>
//               {bbLoading ? "Probing AI…" : "Run Black Box Audit →"}
//             </button>

//             {bbLoading && (
//               <div className="probe-progress">
//                 <div className="probe-bar-track">
//                   <div className="probe-bar-fill" style={{ width: `${progressPct}%` }} />
//                 </div>
//                 <span className="probe-label">
//                   Firing probe {bbProgress}/{totalProbes}… ({progressPct}%)
//                 </span>
//               </div>
//             )}
//           </div>

//           {/* INGESTION CARD */}
//           <div className="glass-card">
//             <h2> Data Ingestion (SDCC)</h2>

//             {!aiName && (
//               <div className="warn-box">
//                  No AI registered.{" "}
//                 <span className="link-text" onClick={() => navigate("/register-ai")}>Register one →</span>
//               </div>
//             )}

//             {/* Required schema hint */}
//             <div className="info-box" style={{ fontSize: 12, lineHeight: 1.7 }}>
//               <strong style={{ color: "#4AACDF" }}>Required columns:</strong>{" "}
//               <code>task_id</code> · <code>input</code> · <code>output</code> · <code>latency</code>
//               <br />
//               <span style={{ color: "#64748B" }}>
//                 The AI judges each response for correctness automatically.
//                 Upload a knowledge base below to ground the evaluation in your own documents.
//               </span>
//             </div>

//             <p className="toggle-desc">SDCC structural analysis + LLM-as-a-Judge pipeline</p>

//             <label>Select Log File (.csv or .json)</label>
//             <input
//               type="file"
//               accept=".csv,.json"
//               onChange={(e) => {
//                 setFile(e.target.files?.[0] || null);
//                 setUploaded(false);
//                 setUploadSuccess(false);
//                 setSdccSummary(null);
//                 setComputationNotes(null);
//               }}
//             />

//             <button onClick={handleUpload} disabled={ingestLoading || !file}>
//               {ingestLoading ? "Uploading…" : "Upload Logs"}
//             </button>

//             {uploadSuccess && logsCount !== null && (
//               <div className="success-message"> Ingested {logsCount} records successfully.</div>
//             )}
//             {ingestError && <div className="error-inline">{ingestError}</div>}

//             {/* Column warnings */}
//             {sdccSummary?.column_warnings && sdccSummary.column_warnings.length > 0 && (
//               <div className="warn-box" style={{ marginTop: 4 }}>
//                 {sdccSummary.column_warnings.map((w, i) => (
//                   <div key={i} style={{ marginBottom: i < sdccSummary.column_warnings!.length - 1 ? 6 : 0 }}>
//                      {w}
//                   </div>
//                 ))}
//               </div>
//             )}

//             {/* Schema column status badges */}
//             {sdccSummary && (
//               <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//                 {[
//                   { key: "has_task_id_col", label: "task_id" },
//                   { key: "has_input_col",   label: "input"   },
//                   { key: "has_output_col",  label: "output"  },
//                   { key: "has_latency_col", label: "latency" },
//                 ].map(({ key, label }) => {
//                   const ok = (sdccSummary as any)[key];
//                   return (
//                     <span key={key} className={`col-badge ${ok ? "col-ok" : "col-warn"}`}>
//                       {ok ? "" : ""} {label}
//                     </span>
//                   );
//                 })}
//               </div>
//             )}

//             {/* KB upload section */}
//             <div style={{
//               marginTop: 8,
//               padding: "16px",
//               background: "#F8FBFF",
//               border: "1px dashed #D6E6FF",
//               borderRadius: 12,
//               display: "flex",
//               flexDirection: "column",
//               gap: 10,
//             }}>
//               <div style={{ fontSize: 13, fontWeight: 600, color: "#005EB8" }}>
//                  Knowledge Base (Optional)
//               </div>
//               <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>
//                 Upload PDF, TXT, MD, DOCX, or CSV files. The LLM judge will first
//                 search your KB before using its own knowledge to assess correctness.
//                 Multiple files accepted.
//               </div>
//               <input
//                 type="file"
//                 accept=".pdf,.txt,.md,.docx,.csv"
//                 multiple
//                 onChange={(e) => {
//                   setKbFiles(e.target.files);
//                   setKbSuccess(false);
//                   setKbError("");
//                 }}
//                 style={{ fontSize: 12 }}
//               />
//               <button
//                 onClick={handleKbUpload}
//                 disabled={kbLoading || !kbFiles || kbFiles.length === 0}
//                 style={{
//                   padding: "10px 0",
//                   background: "linear-gradient(135deg, #1D4ED8, #3B82F6)",
//                   fontSize: 13,
//                 }}
//               >
//                 {kbLoading ? "Uploading KB…" : "Upload Knowledge Base →"}
//               </button>
//               {kbSuccess && kbChunksCount !== null && (
//                 <div className="success-message" style={{ fontSize: 12 }}>
//                    {kbChunksCount} KB chunks stored. Judge will use these for evaluation.
//                 </div>
//               )}
//               {kbError && <div className="error-inline" style={{ fontSize: 12 }}>{kbError}</div>}
//             </div>
//           </div>
//         </div>

//         {/* ── BLACK BOX RESULT SUMMARY ── */}
//         {bbResult && bbResult.status !== "manual_required" && (
//           <div className="blackbox-summary glass-card" style={{ marginBottom: "36px" }}>
//             <h2> Black Box Audit Summary</h2>
//             <div className="sdcc-grid">
//               <div className="metric-item">
//                 <span>Probes Run</span>
//                 <strong>{bbResult.probes_run}</strong>
//               </div>
//               <div className="metric-item">
//                 <span>Findings</span>
//                 <strong style={{ color: bbResult.findings.length === 0 ? "#10B981" : "#EF4444" }}>
//                   {bbResult.findings.length}
//                 </strong>
//               </div>
//               <div className={`metric-item risk-${bbResult.risk_level.toLowerCase()}`}>
//                 <span>Risk Level</span>
//                 <strong>{bbResult.risk_level}</strong>
//               </div>
//             </div>
//             <div className="sdcc-recommendation">
//                {bbResult.findings.length === 0
//                 ? `${bbResult.ai_name || "The AI system"} passed all ${bbResult.probes_run} governance probes. No violations detected.`
//                 : `${bbResult.findings.length} governance violation(s) detected across ${[...new Set(bbResult.findings.map((f: BlackBoxFinding) => f.category))].join(", ")}. Immediate remediation recommended.`
//               }
//             </div>
//           </div>
//         )}

//         {bbResult && bbResult.status === "manual_required" && (
//           <div className="glass-card" style={{ marginBottom: "36px", borderColor: "rgba(255,176,32,0.3)" }}>
//             <h2> UI Mode — Manual Review Required</h2>
//             <p style={{ color: "#9DBFE0", fontSize: "14px", lineHeight: "1.6" }}>{bbResult.message}</p>
//           </div>
//         )}

//         {/* ── SDCC SUMMARY ── */}
//         {sdccSummary && (
//           <div className="sdcc-summary glass-card">
//             <h2> SDCC Structural Summary</h2>
//             <div className="sdcc-grid">
//               <div className="metric-item">
//                 <span>Model Type</span>
//                 <strong>{sdccSummary.model_type}</strong>
//               </div>
//               <div className="metric-item">
//                 <span>Logs Ingested</span>
//                 <strong>{sdccSummary.logs_ingested}</strong>
//               </div>
//               <div className="metric-item">
//                 <span>Data Quality</span>
//                 <strong>{sdccSummary.data_quality_score}%</strong>
//               </div>
//               <div className={`metric-item risk-${sdccSummary.structural_risk.toLowerCase()}`}>
//                 <span>Structural Risk</span>
//                 <strong>{sdccSummary.structural_risk}</strong>
//               </div>
//               {sdccSummary.detection_confidence !== undefined && (
//                 <div className="metric-item">
//                   <span>Detection Confidence</span>
//                   <strong>{Math.round(sdccSummary.detection_confidence * 100)}%</strong>
//                 </div>
//               )}
//               <div className={`metric-item ${sdccSummary.schema_complete ? "risk-low" : "risk-moderate"}`}>
//                 <span>Schema</span>
//                 <strong>{sdccSummary.schema_complete ? "Complete " : "Partial "}</strong>
//               </div>
//             </div>

//             {sdccSummary.recommendation && (
//               <div className="sdcc-recommendation">
//                  {(() => {
//                   const mt   = sdccSummary.model_type || "AI system";
//                   const risk = sdccSummary.structural_risk || "Unknown";
//                   const dq   = sdccSummary.data_quality_score || 0;
//                   if (risk === "Low" && dq >= 75)
//                     return `${mt} shows strong structural integrity. Proceed to full evaluation to generate your governance audit report.`;
//                   if (risk === "High" || dq < 50)
//                     return `${mt} has structural risk indicators. Ensure task_id, input, output, and latency columns are present.`;
//                   return `${mt} ingested with ${risk.toLowerCase()} structural risk. Run the full evaluation below to score across all 10 KPMG Trusted AI principles.`;
//                 })()}
//               </div>
//             )}
//           </div>
//         )}

//         {/* ── COMPUTATION NOTES ── */}
//         {computationNotes && noteEntries.length > 0 && (
//           <div className="glass-card sdcc-enterprise" style={{ marginBottom: 36 }}>
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//               <h2 style={{ margin: 0 }}> Metric Computation Summary</h2>
//               <button className="toggle-notes-btn" onClick={() => setShowNotes((v) => !v)}>
//                 {showNotes ? "Hide details ▲" : "Show details ▼"}
//               </button>
//             </div>
//             <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
//               <div className="metric-card" style={{ flex: 1 }}>
//                 <span>Computed</span>
//                 <strong style={{ color: "#00C896" }}>{computedCount}</strong>
//               </div>
//               <div className="metric-card" style={{ flex: 1 }}>
//                 <span>Unavailable</span>
//                 <strong style={{ color: "#ffb020" }}>{unavailableCount}</strong>
//               </div>
//               <div className="metric-card" style={{ flex: 1 }}>
//                 <span>Total Metrics</span>
//                 <strong>{noteEntries.length}</strong>
//               </div>
//             </div>

//             {unavailableCount > 0 && (
//               <div className="info-box" style={{ marginTop: 8, fontSize: 12 }}>
//                  {unavailableCount} metric(s) couldn't be computed — missing required columns.
//                 Ensure your CSV has <code>task_id</code>, <code>input</code>, <code>output</code>, and <code>latency</code>.
//               </div>
//             )}

//             {showNotes && (
//               <div className="notes-grid" style={{ marginTop: 16 }}>
//                 {noteEntries.map(([key, note]) => (
//                   <div key={key} className={`note-card ${note.status === "computed" ? "note-ok" : "note-miss"}`}>
//                     <div className="note-key">{key.replace(/_/g, " ")}</div>
//                     <div className="note-val">
//                       {note.value !== null ? note.value.toFixed(4) : "—"}
//                     </div>
//                     <div className="note-lib">{note.library}</div>
//                     <div className={`note-status ${note.status === "computed" ? "ok" : "miss"}`}>
//                       {note.status === "computed" ? " computed" : " unavailable"}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         )}

//         {/* ── RUN FULL EVALUATION ── */}
//         <div className="center" style={{ marginTop: "40px" }}>
//           <button className="run-btn" onClick={handleEvaluate} disabled={!uploaded || evalLoading}>
//             {evalLoading ? "Running LLM Judge & evaluating…" : "Run Full Evaluation →"}
//           </button>
//           {evalLoading && (
//             <p className="hint-text" style={{ marginTop: 12 }}>
//               The LLM judge is assessing each response for correctness — this may take a moment…
//             </p>
//           )}
//           {!uploaded && <p className="hint-text">Upload logs above to enable evaluation</p>}
//           {evalError && <div className="error-inline" style={{ marginTop: "16px" }}>{evalError}</div>}
//         </div>

//       </div>
//     </div>
//   );
// }

// /* ─────────────────────────────────────────────
//    CSS
// ───────────────────────────────────────────── */
// const CSS=`
// @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

// * { box-sizing: border-box; }

// .hero {
//   min-height: 100vh;
//   background: #F4F7FB;
//   display: flex;
//   justify-content: center;
//   padding: 40px 20px;
//   font-family: 'Inter', sans-serif;
//   color: #0B1F33;
// }

// .hero-content { width: 100%; max-width: 1200px; }

// /* TOP BAR */
// .top-bar {
//   display: flex; justify-content: space-between; align-items: center;
//   margin-bottom: 36px; padding-bottom: 20px;
//   border-bottom: 1px solid #E3EAF3;
// }
// .top-bar-left { display: flex; align-items: center; gap: 16px; }
// .brand-title { font-size: 26px; font-weight: 800; margin: 0; color: #00338D; }
// .ai-pill {
//   background: #E6F2FB; border: 1px solid #D6E6FF;
//   border-radius: 20px; padding: 4px 14px; font-size: 13px; color: #005EB8;
// }
// .profile-btn {
//   padding: 10px 22px; border-radius: 10px; border: 1px solid #D6E6FF;
//   background: #F8FBFF; color: #005EB8; font-weight: 600; font-size: 14px;
//   cursor: pointer; transition: 0.25s;
// }
// .profile-btn:hover { transform: translateY(-2px); background: #EEF4FF; }
// .logout-btn {
//   padding: 10px 22px; border-radius: 10px; border: 1px solid #FFD6D6;
//   background: #FFF5F5; color: #E5484D; font-weight: 600; font-size: 14px;
//   cursor: pointer; transition: 0.25s;
// }
// .logout-btn:hover { transform: translateY(-2px); }

// /* GRID */
// .card-grid {
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
//   gap: 28px; margin-bottom: 36px;
// }

// /* GLASS CARD */
// .glass-card {
//   background: #FFFFFF; border-radius: 18px; padding: 32px;
//   border: 1px solid #E3EAF3; box-shadow: 0 12px 30px rgba(0,0,0,0.06);
//   display: flex; flex-direction: column; gap: 14px; transition: all 0.3s ease;
// }
// .glass-card:hover { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(0,51,141,0.1); }
// .glass-card h2 { font-size: 20px; font-weight: 700; color: #0B1F33; margin: 0; }
// .card-desc { font-size: 13px; color: #6B7C93; line-height: 1.55; margin: 0; }

// /* INPUTS */
// .glass-card label { font-size: 12px; font-weight: 600; color: #005EB8; }
// .glass-card input[type="text"],
// .glass-card input[type="url"],
// .glass-card input[type="file"] {
//   padding: 13px 16px; border-radius: 10px; border: 1px solid #E3EAF3;
//   background: #FFFFFF; color: #0B1F33; font-size: 14px; width: 100%;
// }
// .glass-card input[type="file"] { padding: 10px; font-size: 13px; }
// .glass-card input:focus {
//   border-color: #005EB8; box-shadow: 0 0 0 3px rgba(0,94,184,0.15); outline: none;
// }

// /* BUTTON */
// .glass-card button {
//   padding: 14px; border-radius: 10px; border: none;
//   background: linear-gradient(135deg, #00338D, #005EB8);
//   color: white; font-weight: 600; font-size: 14px; cursor: pointer; transition: 0.25s;
// }
// .glass-card button:hover:not(:disabled) {
//   transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,51,141,0.25);
// }
// .glass-card button:disabled { opacity: 0.5; cursor: not-allowed; }

// /* TOGGLE */
// .toggle-container { display: flex; justify-content: space-between; align-items: center; }
// .toggle-label { font-size: 14px; font-weight: 600; color: #0B1F33; }
// .toggle-switch {
//   width: 50px; height: 26px; background: #E3EAF3;
//   border-radius: 13px; position: relative; cursor: pointer;
// }
// .toggle-knob {
//   width: 22px; height: 22px; border-radius: 50%; background: white;
//   position: absolute; top: 2px; transition: 0.25s;
// }
// .toggle-knob.off { left: 2px; }
// .toggle-knob.on  { left: 26px; background: #005EB8; }
// .toggle-desc { font-size: 12px; color: #6B7C93; }

// /* INFO / WARN / ERROR */
// .info-box {
//   padding: 10px 14px; background: #F0F6FF; border: 1px solid #D6E6FF;
//   border-radius: 10px; font-size: 13px; color: #005EB8;
// }
// .info-box code {
//   background: rgba(0,94,184,0.12); border-radius: 4px; padding: 1px 5px;
//   font-size: 11px; color: #00338D; font-family: monospace;
// }
// .warn-box {
//   padding: 10px 14px; background: rgba(255,176,32,0.08);
//   border: 1px solid rgba(255,176,32,0.3); border-radius: 10px;
//   font-size: 13px; color: #b45309;
// }
// .link-text { cursor: pointer; text-decoration: underline; font-weight: 600; }
// .error-inline {
//   background: #FFF1F1; border: 1px solid #FFD6D6;
//   color: #E5484D; padding: 10px; border-radius: 10px; font-size: 13px;
// }
// .success-message {
//   background: #E6FFF6; border: 1px solid #B2F2D7;
//   color: #00A86B; padding: 10px; border-radius: 10px; font-size: 13px;
// }

// /* PROGRESS */
// .probe-progress { display: flex; flex-direction: column; gap: 6px; }
// .probe-bar-track { height: 6px; background: #E3EAF3; border-radius: 3px; overflow: hidden; }
// .probe-bar-fill {
//   height: 100%; background: linear-gradient(90deg, #00338D, #005EB8);
//   border-radius: 3px; transition: width 0.35s ease;
// }
// .probe-label { font-size: 12px; color: #6B7C93; font-style: italic; }

// /* COL BADGES */
// .col-badge { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
// .col-ok   { background: rgba(0,168,107,0.1); border: 1px solid rgba(0,168,107,0.3); color: #00A86B; }
// .col-warn { background: rgba(255,176,32,0.1); border: 1px solid rgba(255,176,32,0.3); color: #b45309; }

// /* SDCC + BLACKBOX SUMMARIES */
// .blackbox-summary, .sdcc-summary {
//   background: white; border-radius: 20px; padding: 36px;
//   border: 1px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0,0,0,0.06); margin-bottom: 40px;
// }
// .blackbox-summary h2, .sdcc-summary h2 { font-size: 21px; font-weight: 700; color: #1E2937; margin-bottom: 28px; }

// .sdcc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 20px; }
// .metric-item {
//   background: #F8FAFC; padding: 20px 22px; border-radius: 16px;
//   border: 1px solid #E2E8F0; text-align: center; transition: all 0.3s ease;
// }
// .metric-item:hover { background: #F0F7FF; border-color: #BFDBFE; }
// .metric-item span { font-size: 12.5px; color: #64748B; display: block; margin-bottom: 8px; font-weight: 500; }
// .metric-item strong { font-size: 23px; font-weight: 700; color: #1E2937; }

// .risk-low    { color: #059669 !important; }
// .risk-moderate { color: #005EB8 !important; }
// .risk-high   { color: #DC2626 !important; }

// .sdcc-recommendation {
//   margin-top: 28px; padding: 18px 22px; background: #E6F2FB;
//   border-left: 5px solid #005EB8; border-radius: 12px;
//   font-size: 15px; color: #00338D; line-height: 1.6;
// }

// /* COMPUTATION NOTES */
// .sdcc-enterprise { border-color: rgba(0,200,150,0.3); margin-bottom: 36px; }
// .metric-card {
//   background: #F8FAFC; padding: 16px; border-radius: 12px;
//   text-align: center; border: 1px solid #E2E8F0;
// }
// .metric-card span { font-size: 12px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }
// .metric-card strong { font-size: 20px; display: block; margin-top: 6px; color: #1E2937; }
// .toggle-notes-btn {
//   background: #F0F6FF; border: 1px solid #D6E6FF; color: #005EB8;
//   padding: 6px 14px; border-radius: 8px; cursor: pointer;
//   font-size: 12px; font-weight: 600; transition: 0.2s;
// }
// .toggle-notes-btn:hover { background: #E0EDFF; }
// .notes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
// .note-card { padding: 14px; border-radius: 12px; border: 1px solid transparent; background: #F8FAFC; }
// .note-ok   { border-color: rgba(0,168,107,0.25); }
// .note-miss { border-color: rgba(255,176,32,0.2); }
// .note-key  { font-size: 11px; color: #64748B; text-transform: capitalize; margin-bottom: 4px; }
// .note-val  { font-size: 20px; font-weight: 800; color: #1E2937; margin-bottom: 4px; }
// .note-lib  { font-size: 10px; color: #94A3B8; margin-bottom: 6px; line-height: 1.4; }
// .note-status { font-size: 11px; font-weight: 600; }
// .note-status.ok   { color: #00A86B; }
// .note-status.miss { color: #b45309; }

// /* RUN BUTTON */
// .center { text-align: center; }
// .run-btn {
//   padding: 16px 50px; border-radius: 40px; border: none;
//   background: linear-gradient(135deg, #00338D, #005EB8);
//   color: white; font-weight: 700; cursor: pointer; transition: 0.3s;
//   font-size: 16px;
// }
// .run-btn:hover:not(:disabled) { transform: scale(1.04); box-shadow: 0 12px 30px rgba(0,51,141,0.25); }
// .run-btn:disabled { opacity: 0.5; cursor: not-allowed; }
// .hint-text { margin-top: 10px; font-size: 13px; color: #6B7C93; }
// `;





/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sdccIngest, evaluateAI, runBlackBoxAudit, uploadKnowledgeBase } from "../services/api";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface BlackBoxFinding {
  category: string;
  severity: "High" | "Medium" | "Low" | "Pass";
  probe: string;
  response_preview: string;
  issue: string;
  recommendation: string;
}

interface BlackBoxResult {
  audit_id: string;
  ai_name: string;
  mode: string;
  status: string;
  overall_score: number;
  risk_level: string;
  probes_run: number;
  category_scores: Record<string, number>;
  findings: BlackBoxFinding[];
  message?: string;
}

interface ComputationNote {
  library: string;
  status: string;
  value: number | null;
}

interface SdccSummary {
  model_type: string;
  logs_ingested: number;
  data_quality_score: number;
  structural_risk: string;
  detection_confidence?: number;
  recommendation?: string;
  column_warnings?: string[];
  has_task_id_col?: boolean;
  has_input_col?: boolean;
  has_output_col?: boolean;
  has_latency_col?: boolean;
  has_kb_col?: boolean;
  schema_complete?: boolean;
}

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate();

  /* ── Black Box state ── */
  const [bbMode, setBbMode]         = useState<"api" | "ui">("api");
  const [bbEndpoint, setBbEndpoint] = useState("");
  const [bbApiKey, setBbApiKey]     = useState("");
  const [bbUiUrl, setBbUiUrl]       = useState("");
  const [bbLoading, setBbLoading]   = useState(false);
  const [bbResult, setBbResult]     = useState<BlackBoxResult | null>(null);
  const [bbError, setBbError]       = useState("");
  const [bbProgress, setBbProgress] = useState(0);

  /* ── Ingestion state ── */
  const [file, setFile]                   = useState<File | null>(null);
  const [ingestLoading, setIngestLoading] = useState(false);
  const [uploaded, setUploaded]           = useState(false);
  const [logsCount, setLogsCount]         = useState<number | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [sdccSummary, setSdccSummary]     = useState<SdccSummary | null>(null);
  const [ingestError, setIngestError]     = useState("");

  /* ── KB upload state ── */
  const [kbFiles, setKbFiles]             = useState<FileList | null>(null);
  const [kbLoading, setKbLoading]         = useState(false);
  const [kbSuccess, setKbSuccess]         = useState(false);
  const [kbChunksCount, setKbChunksCount] = useState<number | null>(null);
  const [kbError, setKbError]             = useState("");

  /* ── Evaluate state ── */
  const [evalLoading, setEvalLoading]           = useState(false);
  const [evalError, setEvalError]               = useState("");
  const [computationNotes, setComputationNotes] = useState<Record<string, ComputationNote> | null>(null);
  const [showNotes, setShowNotes]               = useState(false);

  const aiName = localStorage.getItem("activeAI") || "";

  /* ── Helpers ── */
  const extractErr = (e: any): string => {
    if (!e?.response) return "Cannot reach backend. Ensure the server is running.";
    return e.response?.data?.detail || "Operation failed.";
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("activeAI");
    navigate("/login");
  };

  /* ─────────────────────────────────────────────
     BLACK BOX HANDLER
  ───────────────────────────────────────────── */
  const handleBlackBox = async () => {
    if (bbMode === "api" && (!bbEndpoint || !bbApiKey)) {
      setBbError("Please provide both API Endpoint and API Key.");
      return;
    }
    if (bbMode === "ui" && !bbUiUrl) {
      setBbError("Please provide the deployed UI URL.");
      return;
    }

    setBbLoading(true);
    setBbError("");
    setBbResult(null);
    setBbProgress(0);

    const totalProbes = 50;
    const interval = setInterval(() => {
      setBbProgress((p) => {
        if (p >= totalProbes - 1) { clearInterval(interval); return p; }
        return p + 1;
      });
    }, 350);

    try {
      const res = await runBlackBoxAudit({
        ai_name:  aiName || "external-ai",
        mode:     bbMode,
        endpoint: bbEndpoint,
        api_key:  bbApiKey,
        ui_url:   bbUiUrl,
      });
      clearInterval(interval);
      setBbProgress(totalProbes);
      setBbResult(res.data);

      // ── Auto-ingest probe results into SDCC ────────────────────────────
      // Build a CSV blob directly from probe_results (already in memory).
      // Columns: task_id, input, output, latency — exact SDCC schema.
      const probes: any[] = res.data?.probe_results ?? [];
      if (probes.length > 0 && aiName) {
        try {
          const header = "task_id,input,output,latency";
          const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
          const rows   = probes.map((p: any) =>
            [escape(p.probe_id ?? p.id ?? ""),
             escape(p.prompt   ?? p.input   ?? ""),
             escape(p.response ?? p.output  ?? ""),
             p.latency_ms ?? p.latency ?? ""].join(",")
          );
          const csvBlob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
          const csvFile = new File([csvBlob], "blackbox_probes.csv", { type: "text/csv" });

          const ingestRes = await sdccIngest(aiName, csvFile);
          setSdccSummary(ingestRes.data);
          setLogsCount(ingestRes.data?.logs_ingested ?? probes.length);
          setUploaded(true);
          setUploadSuccess(true);
        } catch {
          // Non-fatal — blackbox result is still shown even if SDCC ingest fails
        }
      }
    } catch (e: any) {
      clearInterval(interval);
      setBbError(extractErr(e));
    } finally {
      setBbLoading(false);
    }
  };

  /* ─────────────────────────────────────────────
     INGESTION HANDLER
  ───────────────────────────────────────────── */
  const handleUpload = async () => {
    if (!aiName) { navigate("/register-ai"); return; }
    if (!file)   { setIngestError("Select a file first."); return; }

    setIngestLoading(true);
    setIngestError("");
    setUploadSuccess(false);
    setSdccSummary(null);
    setComputationNotes(null);

    try {
      const res = await sdccIngest(aiName, file);
      setSdccSummary(res.data);
      setLogsCount(res.data.logs_ingested ?? null);
      setUploaded(true);
      setUploadSuccess(true);
    } catch (e) {
      setIngestError(extractErr(e));
    } finally {
      setIngestLoading(false);
    }
  };

  /* ─────────────────────────────────────────────
     KB UPLOAD HANDLER
  ───────────────────────────────────────────── */
  const handleKbUpload = async () => {
    if (!aiName) { navigate("/register-ai"); return; }
    if (!kbFiles || kbFiles.length === 0) {
      setKbError("Select at least one knowledge base file.");
      return;
    }
    setKbLoading(true);
    setKbError("");
    setKbSuccess(false);
    try {
      const res = await uploadKnowledgeBase(aiName, Array.from(kbFiles));
      setKbChunksCount(res.data?.chunks_stored ?? null);
      setKbSuccess(true);
      if (res.data?.errors?.length) {
        setKbError(`Uploaded with warnings: ${res.data.errors.join("; ")}`);
      }
    } catch (e: any) {
      const detail =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.message ||
        "KB upload failed.";
      setKbError(detail);
    } finally {
      setKbLoading(false);
    }
  };

  /* ─────────────────────────────────────────────
     EVALUATE HANDLER
  ───────────────────────────────────────────── */
  const handleEvaluate = async () => {
    if (!uploaded) return;
    setEvalLoading(true);
    setEvalError("");
    setComputationNotes(null);
    try {
      const res = await evaluateAI(aiName);
      if (res.data.computation_notes) {
        setComputationNotes(res.data.computation_notes);
      }
      navigate("/report", { state: { data: res.data } });
    } catch (e) {
      setEvalError(extractErr(e));
    } finally {
      setEvalLoading(false);
    }
  };

  /* ── Render helpers ── */
  const totalProbes  = 50;
  const progressPct  = Math.round((bbProgress / totalProbes) * 100);

  const noteEntries      = computationNotes
    ? Object.entries(computationNotes).filter(([k]) => k !== "_error")
    : [];
  const computedCount    = noteEntries.filter(([, n]) => n.status === "computed").length;
  const unavailableCount = noteEntries.filter(([, n]) => n.status !== "computed").length;

  /* ─────────────────────────────────────────────
     JSX
  ───────────────────────────────────────────── */
  return (
    <div className="hero">
      <style>{CSS}</style>

      <div className="hero-content">

        {/* TOP BAR */}
        <div className="top-bar">
          <div className="top-bar-left">
            <h1 className="brand-title">Auditable AI™</h1>
            {aiName && <span className="ai-pill">Auditing: {aiName}</span>}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="profile-btn" onClick={() => navigate("/profile")}>Profile</button>
            <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
          </div>
        </div>

        {/* ── ROW 1: Black Box + Ingestion ── */}
        <div className="card-grid">

          {/* BLACK BOX CARD */}
          <div className="glass-card">
            <div className="card-header-row">
              <div className="card-icon-shield">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h2>Black Box AI Audit</h2>
            </div>
            <p className="card-desc">
              Connect an external AI system and execute 14 governance probes across
              Safety, Fairness, Accuracy, Transparency, Robustness, and Explainability.
            </p>

            {/* Mode toggle */}
            <div className="toggle-container">
              <span className="toggle-label">Connection Mode</span>
              <div
                className="toggle-switch"
                onClick={() => { setBbMode(bbMode === "api" ? "ui" : "api"); setBbResult(null); setBbError(""); }}
              >
                <div className={`toggle-knob ${bbMode === "api" ? "on" : "off"}`} />
              </div>
            </div>
            <p className="toggle-desc">{bbMode === "api" ? "API Key + Endpoint Mode" : "Deployed UI Mode"}</p>

            {bbMode === "api" ? (
              <>
                <label>External API Endpoint</label>
                <input
                  type="url" name="bb-endpoint"
                  autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                  placeholder="https://api.openai.com/v1/chat/completions"
                  value={bbEndpoint} onChange={(e) => setBbEndpoint(e.target.value)}
                  disabled={bbLoading}
                />
                <label>API Key</label>
                <input
                  type="text" name="bb-apikey"
                  autoComplete="new-password" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                  value={bbApiKey} onChange={(e) => setBbApiKey(e.target.value)}
                  placeholder="sk-xxxx…"
                  disabled={bbLoading}
                />
              </>
            ) : (
              <>
                <label>Deployed UI URL</label>
                <input
                  type="url" name="bb-uiurl" autoComplete="off"
                  value={bbUiUrl} onChange={(e) => setBbUiUrl(e.target.value)}
                  placeholder="https://your-chatbot.vercel.app"
                  disabled={bbLoading}
                />
                <div className="info-box">
                  UI audits use secure backend browser automation. Ensure the chatbot URL is publicly accessible.
                </div>
              </>
            )}

            {bbError && <div className="error-inline">{bbError}</div>}

            <button onClick={handleBlackBox} disabled={bbLoading}>
              {bbLoading ? "Executing Probes…" : "Run Black Box Audit"}
            </button>

            {bbLoading && (
              <div className="probe-progress">
                <div className="probe-bar-track">
                  <div className="probe-bar-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <span className="probe-label">
                  Probe {bbProgress} of {totalProbes} — {progressPct}% complete
                </span>
              </div>
            )}
          </div>

          {/* INGESTION CARD */}
          <div className="glass-card">
            <div className="card-header-row">
              <div className="card-icon-data">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <h2>Data Ingestion</h2>
            </div>

            {!aiName && (
              <div className="warn-box">
                No AI system registered.{" "}
                <span className="link-text" onClick={() => navigate("/register-ai")}>Register one to continue</span>
              </div>
            )}

            <div className="info-box" style={{ fontSize: 12, lineHeight: 1.7 }}>
              <strong style={{ color: "#005EB8" }}>Required columns:</strong>{" "}
              <code>task_id</code> · <code>input</code> · <code>output</code> · <code>latency</code>
              <br />
              <span style={{ color: "#64748B" }}>
                Each response is automatically assessed for correctness using a multi-layer evaluation pipeline.
                Upload a knowledge base below to ground evaluation in your own documents.
              </span>
            </div>

            <p className="toggle-desc">Structural Dataset Compliance Check (SDCC) + Evaluation Pipeline</p>

            <label>Select Log File (.csv or .json)</label>
            <input
              type="file"
              accept=".csv,.json"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setUploaded(false);
                setUploadSuccess(false);
                setSdccSummary(null);
                setComputationNotes(null);
              }}
            />

            <button onClick={handleUpload} disabled={ingestLoading || !file}>
              {ingestLoading ? "Uploading…" : "Upload Logs"}
            </button>

            {uploadSuccess && logsCount !== null && (
              <div className="success-message">{logsCount} records ingested successfully.</div>
            )}
            {ingestError && <div className="error-inline">{ingestError}</div>}

            {/* Column warnings */}
            {sdccSummary?.column_warnings && sdccSummary.column_warnings.length > 0 && (
              <div className="warn-box" style={{ marginTop: 4 }}>
                {sdccSummary.column_warnings.map((w, i) => (
                  <div key={i} style={{ marginBottom: i < sdccSummary.column_warnings!.length - 1 ? 6 : 0 }}>
                    {w}
                  </div>
                ))}
              </div>
            )}

            {/* Schema column status badges */}
            {sdccSummary && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { key: "has_task_id_col", label: "task_id" },
                  { key: "has_input_col",   label: "input"   },
                  { key: "has_output_col",  label: "output"  },
                  { key: "has_latency_col", label: "latency" },
                ].map(({ key, label }) => {
                  const ok = (sdccSummary as any)[key];
                  return (
                    <span key={key} className={`col-badge ${ok ? "col-ok" : "col-warn"}`}>
                      {ok ? "" : ""} {label}
                    </span>
                  );
                })}
              </div>
            )}

            {/* KB upload section */}
            <div style={{
              marginTop: 8,
              padding: "16px",
              background: "#F8FBFF",
              border: "1px dashed #D6E6FF",
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#005EB8" }}>
                Knowledge Base <span style={{ fontWeight: 400, fontSize: 11, color: "#94A3B8", marginLeft: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Optional</span>
              </div>
              <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>
                Upload PDF, TXT, MD, DOCX, or CSV files. The evaluation engine will search your
                knowledge base before using its own knowledge to assess response correctness.
                Multiple files accepted.
              </div>
              <input
                type="file"
                accept=".pdf,.txt,.md,.docx,.csv"
                multiple
                onChange={(e) => {
                  setKbFiles(e.target.files);
                  setKbSuccess(false);
                  setKbError("");
                }}
                style={{ fontSize: 12 }}
              />
              <button
                onClick={handleKbUpload}
                disabled={kbLoading || !kbFiles || kbFiles.length === 0}
                style={{
                  padding: "10px 0",
                  background: "linear-gradient(135deg, #1D4ED8, #3B82F6)",
                  fontSize: 13,
                }}
              >
                {kbLoading ? "Uploading Knowledge Base…" : "Upload Knowledge Base"}
              </button>
              {kbSuccess && kbChunksCount !== null && (
                <div className="success-message" style={{ fontSize: 12 }}>
                  {kbChunksCount} knowledge base chunks stored. Evaluation engine will reference these documents.
                </div>
              )}
              {kbError && <div className="error-inline" style={{ fontSize: 12 }}>{kbError}</div>}
            </div>
          </div>
        </div>

        {/* ── BLACK BOX RESULT SUMMARY ── */}
        {bbResult && bbResult.status !== "manual_required" && (
          <div className="blackbox-summary glass-card" style={{ marginBottom: "36px" }}>
            <h2>Black Box Audit Summary</h2>
            <div className="sdcc-grid">
              <div className="metric-item">
                <span>Probes Executed</span>
                <strong>{bbResult.probes_run}</strong>
              </div>
              <div className="metric-item">
                <span>Findings</span>
                <strong style={{ color: bbResult.findings.length === 0 ? "#10B981" : "#EF4444" }}>
                  {bbResult.findings.length}
                </strong>
              </div>
              <div className={`metric-item risk-${bbResult.risk_level.toLowerCase()}`}>
                <span>Risk Level</span>
                <strong>{bbResult.risk_level}</strong>
              </div>
            </div>
            <div className="sdcc-recommendation">
              {bbResult.findings.length === 0
                ? `${bbResult.ai_name || "The AI system"} passed all ${bbResult.probes_run} governance probes. No violations detected.`
                : `${bbResult.findings.length} governance violation(s) detected across ${[...new Set(bbResult.findings.map((f: BlackBoxFinding) => f.category))].join(", ")}. Immediate remediation recommended.`
              }
            </div>
          </div>
        )}

        {bbResult && bbResult.status === "manual_required" && (
          <div className="glass-card" style={{ marginBottom: "36px", borderColor: "rgba(255,176,32,0.3)" }}>
            <h2>UI Mode — Manual Review Required</h2>
            <p style={{ color: "#9DBFE0", fontSize: "14px", lineHeight: "1.6" }}>{bbResult.message}</p>
          </div>
        )}

        {/* ── SDCC SUMMARY ── */}
        {sdccSummary && (
          <div className="sdcc-summary glass-card">
            <h2>Structural Dataset Compliance Summary</h2>
            <div className="sdcc-grid">
              <div className="metric-item">
                <span>Model Type</span>
                <strong>{sdccSummary.model_type}</strong>
              </div>
              <div className="metric-item">
                <span>Logs Ingested</span>
                <strong>{sdccSummary.logs_ingested}</strong>
              </div>
              <div className="metric-item">
                <span>Data Quality</span>
                <strong>{sdccSummary.data_quality_score}%</strong>
              </div>
              <div className={`metric-item risk-${sdccSummary.structural_risk.toLowerCase()}`}>
                <span>Structural Risk</span>
                <strong>{sdccSummary.structural_risk}</strong>
              </div>
              {sdccSummary.detection_confidence !== undefined && (
                <div className="metric-item">
                  <span>Detection Confidence</span>
                  <strong>{Math.round(sdccSummary.detection_confidence * 100)}%</strong>
                </div>
              )}
              <div className={`metric-item ${sdccSummary.schema_complete ? "risk-low" : "risk-moderate"}`}>
                <span>Schema</span>
                <strong>{sdccSummary.schema_complete ? "Complete" : "Partial"}</strong>
              </div>
            </div>

            {sdccSummary.recommendation && (
              <div className="sdcc-recommendation">
                {(() => {
                  const mt   = sdccSummary.model_type || "AI system";
                  const risk = sdccSummary.structural_risk || "Unknown";
                  const dq   = sdccSummary.data_quality_score || 0;
                  if (risk === "Low" && dq >= 75)
                    return `${mt} shows strong structural integrity. Proceed to full evaluation to generate your governance audit report.`;
                  if (risk === "High" || dq < 50)
                    return `${mt} has structural risk indicators. Ensure task_id, input, output, and latency columns are present.`;
                  return `${mt} ingested with ${risk.toLowerCase()} structural risk. Run the full evaluation below to score across all 10 KPMG Trusted AI principles.`;
                })()}
              </div>
            )}
          </div>
        )}

        {/* ── COMPUTATION NOTES ── */}
        {computationNotes && noteEntries.length > 0 && (
          <div className="glass-card sdcc-enterprise" style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>Metric Computation Summary</h2>
              <button className="toggle-notes-btn" onClick={() => setShowNotes((v) => !v)}>
                {showNotes ? "Hide details" : "Show details"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
              <div className="metric-card" style={{ flex: 1 }}>
                <span>Computed</span>
                <strong style={{ color: "#00C896" }}>{computedCount}</strong>
              </div>
              <div className="metric-card" style={{ flex: 1 }}>
                <span>Unavailable</span>
                <strong style={{ color: "#ffb020" }}>{unavailableCount}</strong>
              </div>
              <div className="metric-card" style={{ flex: 1 }}>
                <span>Total Metrics</span>
                <strong>{noteEntries.length}</strong>
              </div>
            </div>

            {unavailableCount > 0 && (
              <div className="info-box" style={{ marginTop: 8, fontSize: 12 }}>
                {unavailableCount} metric(s) could not be computed — missing required columns.
                Ensure your CSV has <code>task_id</code>, <code>input</code>, <code>output</code>, and <code>latency</code>.
              </div>
            )}

            {showNotes && (
              <div className="notes-grid" style={{ marginTop: 16 }}>
                {noteEntries.map(([key, note]) => (
                  <div key={key} className={`note-card ${note.status === "computed" ? "note-ok" : "note-miss"}`}>
                    <div className="note-key">{key.replace(/_/g, " ")}</div>
                    <div className="note-val">
                      {note.value !== null ? note.value.toFixed(4) : "—"}
                    </div>
                    <div className="note-lib">{note.library}</div>
                    <div className={`note-status ${note.status === "computed" ? "ok" : "miss"}`}>
                      {note.status === "computed" ? "Computed" : "Unavailable"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── RUN FULL EVALUATION ── */}
        <div className="eval-section" style={{ marginTop: "40px" }}>
          <button className="run-btn" onClick={handleEvaluate} disabled={!uploaded || evalLoading}>
            {evalLoading ? (
              <span className="run-btn-inner">
                <span className="eval-spinner" />
                Evaluating…
              </span>
            ) : (
              "Run Full Governance Evaluation"
            )}
          </button>

          {evalLoading && (
            <div className="eval-status-block">

              {/* Shield + orbital rings */}
              <div className="eval-orbit-wrapper">
                <div className="eval-orbit-ring eval-orbit-ring-1" />
                <div className="eval-orbit-ring eval-orbit-ring-2" />
                <div className="eval-orbit-ring eval-orbit-ring-3" />
                <div className="eval-shield-core">
                  <svg width="32" height="36" viewBox="0 0 32 36" fill="none">
                    <path d="M16 0L0 6v10c0 9.4 6.8 18.2 16 20.5C25.2 34.2 32 25.4 32 16V6L16 0z"
                      fill="url(#shieldGrad)" />
                    <path d="M10 18l4 4 8-8" stroke="white" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round" />
                    <defs>
                      <linearGradient id="shieldGrad" x1="0" y1="0" x2="32" y2="36" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#0091DA" />
                        <stop offset="1" stopColor="#00C896" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                {/* Orbiting dots */}
                <div className="eval-orbit-dot eval-orbit-dot-1" />
                <div className="eval-orbit-dot eval-orbit-dot-2" />
                <div className="eval-orbit-dot eval-orbit-dot-3" />
              </div>

              {/* Title */}
              <p className="eval-main-label">Governance Evaluation In Progress</p>
              <p className="eval-sub-label">
                Applying KPMG Trusted AI Framework — 10 principles · 40+ sub-parameters
              </p>

              {/* Progress bar */}
              <div className="eval-progress-track">
                <div className="eval-progress-fill" />
                <div className="eval-progress-shimmer" />
              </div>

              {/* Step pipeline */}
              <div className="eval-pipeline">
                {[
                  { label: "Structural Analysis",   sub: "Schema · completeness · duplicates",      delay: "0s",    dur: "5s"   },
                  { label: "Dataset Diagnostics",   sub: "Column types · data quality score",        delay: "1.2s",  dur: "4s"   },
                  { label: "Principle Scoring",     sub: "10 KPMG Trusted AI principles",            delay: "2.4s",  dur: "6s"   },
                  { label: "Risk Classification",   sub: "Severity · framework compliance",          delay: "3.6s",  dur: "5s"   },
                  { label: "LLM Judge Evaluation",  sub: "Accuracy · faithfulness · grounding",      delay: "4.8s",  dur: "7s"   },
                  { label: "Generating Report",     sub: "PDF compilation · audit reference ID",     delay: "6.0s",  dur: "4s"   },
                ].map((step, i) => (
                  <div key={i} className="eval-pipeline-step"
                    style={{ animationDelay: step.delay, animationDuration: step.dur }}>
                    <div className="eval-pipeline-dot" style={{ animationDelay: step.delay }} />
                    <div className="eval-pipeline-text">
                      <span className="eval-pipeline-label">{step.label}</span>
                      <span className="eval-pipeline-sub">{step.sub}</span>
                    </div>
                    <div className="eval-pipeline-bar">
                      <div className="eval-pipeline-bar-fill"
                        style={{ animationDelay: step.delay, animationDuration: step.dur }} />
                    </div>
                  </div>
                ))}
              </div>

              <p className="hint-text" style={{ marginTop: 24 }}>
                This may take 30–90 seconds depending on dataset size and LLM evaluation depth.
              </p>
            </div>
          )}

          {!uploaded && <p className="hint-text" style={{ marginTop: 12 }}>Upload log data above to enable full governance evaluation</p>}
          {evalError && <div className="error-inline" style={{ marginTop: "16px" }}>{evalError}</div>}
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CSS
───────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

* { box-sizing: border-box; }

.hero {
  min-height: 100vh;
  background: #F4F7FB;
  display: flex;
  justify-content: center;
  padding: 40px 20px;
  font-family: 'Inter', sans-serif;
  color: #0B1F33;
}

.hero-content { width: 100%; max-width: 1200px; }

/* TOP BAR */
.top-bar {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 36px; padding-bottom: 20px;
  border-bottom: 1px solid #E3EAF3;
}
.top-bar-left { display: flex; align-items: center; gap: 16px; }
.brand-title { font-size: 26px; font-weight: 800; margin: 0; color: #00338D; letter-spacing: -0.03em; }
.ai-pill {
  background: #E6F2FB; border: 1px solid #D6E6FF;
  border-radius: 20px; padding: 4px 14px; font-size: 12px; color: #005EB8; font-weight: 500;
}
.profile-btn {
  padding: 9px 20px; border-radius: 10px; border: 1px solid #D6E6FF;
  background: #F8FBFF; color: #005EB8; font-weight: 600; font-size: 13px;
  cursor: pointer; transition: 0.2s;
}
.profile-btn:hover { background: #EEF4FF; }
.logout-btn {
  padding: 9px 20px; border-radius: 10px; border: 1px solid #FFD6D6;
  background: #FFF5F5; color: #E5484D; font-weight: 600; font-size: 13px;
  cursor: pointer; transition: 0.2s;
}
.logout-btn:hover { background: #FFEEEE; }

/* CARD HEADER ROW */
.card-header-row {
  display: flex; align-items: center; gap: 12px; margin-bottom: 2px;
}
.card-icon-shield {
  width: 34px; height: 34px; border-radius: 10px;
  background: linear-gradient(135deg, #00338D15, #005EB820);
  border: 1px solid #D6E6FF; display: flex; align-items: center;
  justify-content: center; color: #005EB8; flex-shrink: 0;
}
.card-icon-data {
  width: 34px; height: 34px; border-radius: 10px;
  background: linear-gradient(135deg, #05965615, #00C89620);
  border: 1px solid #B2F0D9; display: flex; align-items: center;
  justify-content: center; color: #059669; flex-shrink: 0;
}

/* GRID */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 28px; margin-bottom: 36px;
}

/* GLASS CARD */
.glass-card {
  background: #FFFFFF; border-radius: 18px; padding: 32px;
  border: 1px solid #E3EAF3; box-shadow: 0 12px 30px rgba(0,0,0,0.06);
  display: flex; flex-direction: column; gap: 14px; transition: all 0.3s ease;
}
.glass-card:hover { transform: translateY(-3px); box-shadow: 0 20px 50px rgba(0,51,141,0.09); }
.glass-card h2 { font-size: 17px; font-weight: 700; color: #0B1F33; margin: 0; letter-spacing: -0.02em; }
.card-desc { font-size: 13px; color: #6B7C93; line-height: 1.6; margin: 0; }

/* INPUTS */
.glass-card label { font-size: 11.5px; font-weight: 600; color: #005EB8; text-transform: uppercase; letter-spacing: 0.04em; }
.glass-card input[type="text"],
.glass-card input[type="url"],
.glass-card input[type="file"] {
  padding: 12px 16px; border-radius: 10px; border: 1px solid #E3EAF3;
  background: #FAFBFD; color: #0B1F33; font-size: 13.5px; width: 100%;
  font-family: 'Inter', sans-serif;
}
.glass-card input[type="file"] { padding: 10px; font-size: 13px; }
.glass-card input:focus {
  border-color: #005EB8; box-shadow: 0 0 0 3px rgba(0,94,184,0.12); outline: none;
  background: #FFFFFF;
}

/* BUTTON */
.glass-card button {
  padding: 13px; border-radius: 10px; border: none;
  background: linear-gradient(135deg, #00338D, #005EB8);
  color: white; font-weight: 600; font-size: 13.5px; cursor: pointer; transition: 0.25s;
  font-family: 'Inter', sans-serif; letter-spacing: -0.01em;
}
.glass-card button:hover:not(:disabled) {
  transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,51,141,0.25);
}
.glass-card button:disabled { opacity: 0.45; cursor: not-allowed; }

/* TOGGLE */
.toggle-container { display: flex; justify-content: space-between; align-items: center; }
.toggle-label { font-size: 13.5px; font-weight: 600; color: #0B1F33; }
.toggle-switch {
  width: 48px; height: 25px; background: #E3EAF3;
  border-radius: 13px; position: relative; cursor: pointer;
}
.toggle-knob {
  width: 21px; height: 21px; border-radius: 50%; background: white;
  position: absolute; top: 2px; transition: 0.25s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}
.toggle-knob.off { left: 2px; }
.toggle-knob.on  { left: 25px; background: #005EB8; }
.toggle-desc { font-size: 11.5px; color: #94A3B8; }

/* INFO / WARN / ERROR */
.info-box {
  padding: 10px 14px; background: #F0F6FF; border: 1px solid #D6E6FF;
  border-radius: 10px; font-size: 12.5px; color: #005EB8;
}
.info-box code {
  background: rgba(0,94,184,0.1); border-radius: 4px; padding: 1px 5px;
  font-size: 11px; color: #00338D; font-family: monospace;
}
.warn-box {
  padding: 10px 14px; background: rgba(255,176,32,0.07);
  border: 1px solid rgba(255,176,32,0.25); border-radius: 10px;
  font-size: 12.5px; color: #92400E;
}
.link-text { cursor: pointer; text-decoration: underline; font-weight: 600; }
.error-inline {
  background: #FFF1F1; border: 1px solid #FFD6D6;
  color: #E5484D; padding: 10px; border-radius: 10px; font-size: 13px;
}
.success-message {
  background: #E6FFF6; border: 1px solid #B2F2D7;
  color: #059669; padding: 10px; border-radius: 10px; font-size: 13px;
}

/* PROGRESS */
.probe-progress { display: flex; flex-direction: column; gap: 6px; }
.probe-bar-track { height: 5px; background: #E3EAF3; border-radius: 3px; overflow: hidden; }
.probe-bar-fill {
  height: 100%; background: linear-gradient(90deg, #00338D, #005EB8);
  border-radius: 3px; transition: width 0.35s ease;
}
.probe-label { font-size: 11.5px; color: #94A3B8; }

/* COL BADGES */
.col-badge { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
.col-ok   { background: rgba(5,150,105,0.08); border: 1px solid rgba(5,150,105,0.25); color: #059669; }
.col-warn { background: rgba(255,176,32,0.08); border: 1px solid rgba(255,176,32,0.25); color: #92400E; }

/* SDCC + BLACKBOX SUMMARIES */
.blackbox-summary, .sdcc-summary {
  background: white; border-radius: 20px; padding: 36px;
  border: 1px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0,0,0,0.06); margin-bottom: 40px;
}
.blackbox-summary h2, .sdcc-summary h2 {
  font-size: 18px; font-weight: 700; color: #0B1F33; margin-bottom: 24px; letter-spacing: -0.02em;
}

.sdcc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }
.metric-item {
  background: #F8FAFC; padding: 18px 20px; border-radius: 14px;
  border: 1px solid #E2E8F0; text-align: center; transition: all 0.25s ease;
}
.metric-item:hover { background: #F0F7FF; border-color: #BFDBFE; }
.metric-item span { font-size: 11px; color: #64748B; display: block; margin-bottom: 8px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }
.metric-item strong { font-size: 22px; font-weight: 800; color: #0B1F33; }

.risk-low    { color: #059669 !important; }
.risk-moderate { color: #005EB8 !important; }
.risk-high   { color: #DC2626 !important; }

.sdcc-recommendation {
  margin-top: 22px; padding: 15px 20px; background: #EEF6FF;
  border-left: 4px solid #005EB8; border-radius: 10px;
  font-size: 13.5px; color: #1E3A5F; line-height: 1.65;
}

/* COMPUTATION NOTES */
.sdcc-enterprise { border-color: rgba(5,150,105,0.18); margin-bottom: 32px; }
.metric-card {
  background: #F8FAFC; padding: 16px; border-radius: 12px;
  text-align: center; border: 1px solid #E2E8F0;
}
.metric-card span { font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.04em; }
.metric-card strong { font-size: 20px; display: block; margin-top: 6px; color: #0B1F33; }
.toggle-notes-btn {
  background: #F0F6FF; border: 1px solid #D6E6FF; color: #005EB8;
  padding: 6px 14px; border-radius: 8px; cursor: pointer;
  font-size: 12px; font-weight: 600; transition: 0.2s;
  font-family: 'Inter', sans-serif;
}
.toggle-notes-btn:hover { background: #E0EDFF; }
.notes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px; }
.note-card { padding: 13px; border-radius: 12px; border: 1px solid transparent; background: #F8FAFC; }
.note-ok   { border-color: rgba(5,150,105,0.18); }
.note-miss { border-color: rgba(255,176,32,0.16); }
.note-key  { font-size: 11px; color: #64748B; text-transform: capitalize; margin-bottom: 4px; }
.note-val  { font-size: 20px; font-weight: 800; color: #0B1F33; margin-bottom: 4px; }
.note-lib  { font-size: 10px; color: #94A3B8; margin-bottom: 6px; line-height: 1.4; }
.note-status { font-size: 11px; font-weight: 600; }
.note-status.ok   { color: #059669; }
.note-status.miss { color: #92400E; }

/* ═══════════════════════════════════════════════════
   EVALUATION SECTION
═══════════════════════════════════════════════════ */
.eval-section { text-align: center; padding-bottom: 80px; }

.run-btn {
  padding: 17px 56px; border-radius: 40px; border: none;
  background: linear-gradient(135deg, #00338D, #005EB8);
  color: white; font-weight: 700; cursor: pointer; transition: 0.3s;
  font-size: 15px; font-family: 'Inter', sans-serif; letter-spacing: -0.01em;
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  box-shadow: 0 8px 24px rgba(0,51,141,0.22);
}
.run-btn:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 16px 36px rgba(0,51,141,0.32);
}
.run-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
.run-btn-inner { display: flex; align-items: center; gap: 10px; }

/* SPINNER */
@keyframes spin { to { transform: rotate(360deg); } }
.eval-spinner {
  width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  animation: spin 0.75s linear infinite;
  flex-shrink: 0;
}

/* ── EVAL STATUS BLOCK ────────────────────────────── */
.eval-status-block {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

/* ORBITAL WRAPPER */
.eval-orbit-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

/* Orbital rings */
@keyframes orbitSpin1 { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
@keyframes orbitSpin2 { from { transform: rotate(0deg);   } to { transform: rotate(-360deg); } }
@keyframes orbitSpin3 { from { transform: rotate(45deg);  } to { transform: rotate(405deg);  } }

.eval-orbit-ring {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid transparent;
}
.eval-orbit-ring-1 {
  width: 120px; height: 120px;
  border-color: rgba(0,145,218,0.20);
  border-top-color: rgba(0,145,218,0.7);
  animation: orbitSpin1 2.4s linear infinite;
}
.eval-orbit-ring-2 {
  width: 90px; height: 90px;
  border-color: rgba(0,200,150,0.15);
  border-right-color: rgba(0,200,150,0.65);
  animation: orbitSpin2 1.8s linear infinite;
}
.eval-orbit-ring-3 {
  width: 60px; height: 60px;
  border-color: rgba(0,51,141,0.12);
  border-bottom-color: rgba(0,51,141,0.5);
  animation: orbitSpin3 3.2s linear infinite;
}

/* Shield core */
@keyframes shieldPulse {
  0%, 100% { transform: scale(1);    filter: drop-shadow(0 0 6px rgba(0,145,218,0.4)); }
  50%       { transform: scale(1.06); filter: drop-shadow(0 0 14px rgba(0,200,150,0.6)); }
}
.eval-shield-core {
  position: relative;
  z-index: 2;
  animation: shieldPulse 2s ease-in-out infinite;
}

/* Orbiting dots */
@keyframes dot1Orbit {
  from { transform: rotate(0deg)   translateX(60px) rotate(0deg);   }
  to   { transform: rotate(360deg) translateX(60px) rotate(-360deg); }
}
@keyframes dot2Orbit {
  from { transform: rotate(120deg) translateX(45px) rotate(-120deg);   }
  to   { transform: rotate(480deg) translateX(45px) rotate(-480deg); }
}
@keyframes dot3Orbit {
  from { transform: rotate(240deg) translateX(30px) rotate(-240deg);   }
  to   { transform: rotate(600deg) translateX(30px) rotate(-600deg); }
}
.eval-orbit-dot {
  position: absolute;
  border-radius: 50%;
  top: 50%; left: 50%;
  margin: -4px 0 0 -4px;
}
.eval-orbit-dot-1 {
  width: 8px; height: 8px;
  background: linear-gradient(135deg, #0091DA, #00C896);
  animation: dot1Orbit 2.4s linear infinite;
  box-shadow: 0 0 6px rgba(0,145,218,0.6);
}
.eval-orbit-dot-2 {
  width: 6px; height: 6px;
  background: #00C896;
  animation: dot2Orbit 1.8s linear infinite;
  box-shadow: 0 0 6px rgba(0,200,150,0.6);
}
.eval-orbit-dot-3 {
  width: 5px; height: 5px;
  background: #005EB8;
  animation: dot3Orbit 3.2s linear infinite;
  box-shadow: 0 0 4px rgba(0,94,184,0.5);
}

/* Labels */
.eval-main-label {
  font-size: 17px; font-weight: 700; color: #0B1F33;
  margin: 0 0 6px; letter-spacing: -0.02em;
}
.eval-sub-label {
  font-size: 12.5px; color: #6B7C93; margin: 0 0 24px;
  line-height: 1.5;
}

/* PROGRESS BAR */
.eval-progress-track {
  width: 480px; max-width: 90vw; height: 6px;
  background: #E3EAF3; border-radius: 6px;
  overflow: hidden; position: relative;
  margin-bottom: 32px;
}

@keyframes progressFill {
  0%   { width: 0%; }
  15%  { width: 18%; }
  35%  { width: 40%; }
  55%  { width: 58%; }
  70%  { width: 72%; }
  85%  { width: 86%; }
  95%  { width: 93%; }
  100% { width: 95%; }
}
.eval-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00338D, #0091DA, #00C896);
  border-radius: 6px;
  animation: progressFill 90s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes shimmerSlide {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}
.eval-progress-shimmer {
  position: absolute; top: 0; left: 0;
  width: 25%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
  animation: shimmerSlide 1.6s ease-in-out infinite;
}

/* STEP PIPELINE */
.eval-pipeline {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 520px;
  max-width: 92vw;
  text-align: left;
}

@keyframes stepActivate {
  0%   { opacity: 0.28; }
  15%  { opacity: 1; }
  80%  { opacity: 1; }
  100% { opacity: 0.55; }
}
.eval-pipeline-step {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 11px 16px;
  border-radius: 12px;
  background: #F8FAFC;
  border: 1px solid #E3EAF3;
  animation: stepActivate 5s ease-in-out infinite;
  opacity: 0.28;
}

/* Dot per step */
@keyframes dotActive {
  0%, 10% { background: #D1D5DB; transform: scale(1); box-shadow: none; }
  20%, 70% {
    background: linear-gradient(135deg, #0091DA, #00C896);
    transform: scale(1.25);
    box-shadow: 0 0 8px rgba(0,145,218,0.5);
  }
  90%, 100% { background: #059669; transform: scale(1); box-shadow: none; }
}
.eval-pipeline-dot {
  width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0;
  background: #D1D5DB;
  animation: dotActive 5s ease-in-out infinite;
}

.eval-pipeline-text {
  flex: 1;
  display: flex; flex-direction: column; gap: 2px;
}
.eval-pipeline-label {
  font-size: 13px; font-weight: 600; color: #0B1F33; letter-spacing: -0.01em;
}
.eval-pipeline-sub {
  font-size: 11px; color: #94A3B8; font-weight: 400;
}

/* Mini progress bar inside each step */
.eval-pipeline-bar {
  width: 80px; height: 4px;
  background: #E3EAF3; border-radius: 4px;
  overflow: hidden; flex-shrink: 0;
}
@keyframes stepBarFill {
  0%   { width: 0%; }
  20%  { width: 10%; }
  50%  { width: 65%; }
  80%  { width: 90%; }
  100% { width: 100%; }
}
.eval-pipeline-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #0091DA, #00C896);
  border-radius: 4px;
  animation: stepBarFill 5s ease-in-out infinite;
  width: 0%;
}

.hint-text { font-size: 12.5px; color: #94A3B8; margin-top: 8px; line-height: 1.6; }
`;