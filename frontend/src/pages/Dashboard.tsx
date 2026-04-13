// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { sdccIngest, evaluateAI, runBlackBoxAudit, uploadKnowledgeBase, ingestChatHistory } from "../services/api";

// interface BlackBoxFinding { category:string; severity:"High"|"Medium"|"Low"|"Pass"; probe:string; response_preview:string; issue:string; recommendation:string; }
// interface BlackBoxResult  { audit_id:string; ai_name:string; mode:string; status:string; overall_score:number; risk_level:string; probes_run:number; category_scores:Record<string,number>; findings:BlackBoxFinding[]; message?:string; }
// interface ComputationNote { library:string; status:string; value:number|null; }
// interface SdccSummary     { model_type:string; logs_ingested:number; data_quality_score:number; structural_risk:string; detection_confidence?:number; recommendation?:string; column_warnings?:string[]; has_input_col?:boolean; has_output_col?:boolean; has_latency_col?:boolean; has_task_id_col?:boolean; }

// const CSS = `
// @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
// *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
// body{background:#F4F7FB;}
// .db{font-family:'Plus Jakarta Sans',sans-serif;background:#F4F7FB;min-height:100vh;color:#0B1F33;}

// .db-nav{background:#fff;border-bottom:1px solid #E3EAF3;height:62px;display:flex;align-items:center;justify-content:space-between;padding:0 40px;position:sticky;top:0;z-index:100;box-shadow:0 1px 12px rgba(0,51,141,0.05);}
// .db-brand{font-size:17px;font-weight:900;color:#00338D;letter-spacing:-0.4px;}
// .db-ai-chip{background:#EEF4FF;border:1px solid #C7D9F5;color:#005EB8;font-size:11.5px;font-weight:700;padding:4px 12px;border-radius:100px;}
// .db-nav-r{display:flex;gap:8px;}
// .db-nbtn{padding:7px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:1.5px solid #E3EAF3;background:#fff;color:#5A7090;transition:all 0.2s;font-family:inherit;}
// .db-nbtn:hover{border-color:#005EB8;color:#005EB8;}
// .db-nbtn.red{border-color:#FED7D7;background:#FFF5F5;color:#C53030;}
// .db-nbtn.red:hover{background:#FEE2E2;}

// .db-body{max-width:820px;margin:0 auto;padding:40px 24px 80px;}
// .db-page-title{font-size:22px;font-weight:900;color:#00338D;letter-spacing:-0.5px;margin-bottom:4px;}
// .db-page-sub{font-size:13.5px;color:#8FA3BF;margin-bottom:36px;line-height:1.5;}

// .db-steps{display:flex;flex-direction:column;gap:0;}
// .db-step{display:flex;gap:0;align-items:stretch;}
// .db-step-left{display:flex;flex-direction:column;align-items:center;width:44px;flex-shrink:0;}
// .db-step-num{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;transition:all 0.3s;border:2px solid #E3EAF3;background:#fff;color:#B0C0D4;}
// .db-step-num.active{background:linear-gradient(135deg,#00338D,#005EB8);border-color:transparent;color:#fff;box-shadow:0 4px 14px rgba(0,51,141,0.25);}
// .db-step-num.done{background:#00A3A1;border-color:transparent;color:#fff;}
// .db-step-line{width:2px;flex:1;background:#E3EAF3;margin:3px 0;min-height:16px;transition:background 0.3s;}
// .db-step-line.done{background:#00A3A1;}
// .db-step-body{flex:1;padding:0 0 28px 14px;}
// .db-step-eyebrow{font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;margin-bottom:5px;color:#B0C0D4;transition:color 0.3s;}
// .db-step-eyebrow.active{color:#005EB8;}
// .db-step-eyebrow.done{color:#00A3A1;}

// .db-card{background:#fff;border:1.5px solid #E3EAF3;border-radius:16px;padding:22px;transition:all 0.25s;}
// .db-card.active{border-color:#C7D9F5;box-shadow:0 4px 20px rgba(0,51,141,0.07);}
// .db-card.done{border-color:#B2E8E6;background:#FAFFFE;}
// .db-card.locked{opacity:0.4;pointer-events:none;user-select:none;}
// .db-card-h{font-size:14px;font-weight:800;color:#00338D;margin-bottom:3px;}
// .db-card-d{font-size:12.5px;color:#8FA3BF;margin-bottom:16px;line-height:1.55;}

// .db-done-row{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:14px;}
// .db-redo{font-size:12px;color:#8FA3BF;cursor:pointer;text-decoration:underline;border:none;background:none;font-family:inherit;padding:0;flex-shrink:0;margin-top:2px;}

// .db-lbl{font-size:11px;font-weight:700;color:#5A7090;letter-spacing:0.5px;margin-bottom:5px;text-transform:uppercase;}
// .db-inp{width:100%;padding:11px 13px;border-radius:9px;border:1.5px solid #E3EAF3;font-size:13.5px;font-family:inherit;color:#0B1F33;background:#fff;outline:none;transition:all 0.2s;}
// .db-inp:focus{border-color:#005EB8;box-shadow:0 0 0 3px rgba(0,94,184,0.09);}
// .db-inp::placeholder{color:#B8C8D8;}
// .db-ta{width:100%;padding:11px 13px;border-radius:9px;border:1.5px solid #E3EAF3;font-size:13px;font-family:inherit;color:#0B1F33;background:#fff;outline:none;resize:vertical;min-height:100px;line-height:1.6;transition:all 0.2s;}
// .db-ta:focus{border-color:#005EB8;box-shadow:0 0 0 3px rgba(0,94,184,0.09);}
// .db-ta::placeholder{color:#B8C8D8;}
// .db-field{margin-bottom:12px;}

// .db-tabs{display:flex;gap:3px;background:#F0F4FA;padding:3px;border-radius:9px;margin-bottom:16px;}
// .db-tab{flex:1;padding:7px 8px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;border:none;background:transparent;color:#8FA3BF;transition:all 0.2s;font-family:inherit;}
// .db-tab.on{background:#fff;color:#00338D;box-shadow:0 1px 5px rgba(0,51,141,0.1);}

// .db-drop{border:2px dashed #D0DCF0;border-radius:10px;padding:18px;text-align:center;cursor:pointer;transition:all 0.2s;background:#F7FAFF;margin-bottom:12px;}
// .db-drop:hover{border-color:#005EB8;background:#EEF4FF;}
// .db-drop.has{border-color:#00A3A1;background:#F0FAFA;}
// .db-drop-t{font-size:12.5px;color:#8FA3BF;}
// .db-drop-t.has{color:#00A3A1;font-weight:600;}

// .db-btn{width:100%;padding:12px;border-radius:10px;border:none;background:linear-gradient(135deg,#00338D,#005EB8);color:#fff;font-size:13.5px;font-weight:700;font-family:inherit;cursor:pointer;transition:all 0.3s;box-shadow:0 4px 14px rgba(0,51,141,0.2);}
// .db-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 22px rgba(0,51,141,0.28);}
// .db-btn:disabled{opacity:0.4;cursor:not-allowed;transform:none;}
// .db-btn.teal{background:linear-gradient(135deg,#00A3A1,#0091DA);}
// .db-btn.big{padding:15px;font-size:15px;font-weight:800;border-radius:12px;letter-spacing:-0.2px;box-shadow:0 6px 22px rgba(0,51,141,0.26);}
// .db-btn.big:hover:not(:disabled){transform:translateY(-3px);box-shadow:0 14px 34px rgba(0,51,141,0.34);}
// .db-btn.sm{width:auto;padding:8px 16px;font-size:12px;box-shadow:none;}

// .db-err{margin-top:10px;padding:10px 13px;background:#FFF5F5;border:1px solid #FED7D7;border-radius:8px;font-size:12.5px;color:#C53030;}
// .db-ok{margin-top:10px;padding:10px 13px;background:#F0FFF4;border:1px solid #C6F6D5;border-radius:8px;font-size:12.5px;color:#276749;}
// .db-info{padding:10px 13px;background:#EEF4FF;border:1px solid #C7D9F5;border-radius:8px;font-size:12.5px;color:#005EB8;line-height:1.6;margin-bottom:12px;}
// .db-warn{padding:10px 13px;background:#FFFBEB;border:1px solid #FBD38D;border-radius:8px;font-size:12.5px;color:#744210;line-height:1.6;margin-top:8px;}

// .db-prog{height:4px;background:#E3EAF3;border-radius:4px;overflow:hidden;margin-top:10px;}
// .db-prog-fill{height:100%;background:linear-gradient(to right,#00338D,#0091DA);border-radius:4px;transition:width 0.4s;}
// .db-prog-lbl{font-size:11px;color:#8FA3BF;margin-top:4px;text-align:center;}

// .db-badge{display:inline-block;padding:3px 9px;border-radius:100px;font-size:11px;font-weight:700;}
// .db-badge.low{color:#276749;background:#F0FFF4;border:1px solid #C6F6D5;}
// .db-badge.med{color:#744210;background:#FFFBEB;border:1px solid #FBD38D;}
// .db-badge.high{color:#C53030;background:#FFF5F5;border:1px solid #FED7D7;}

// .db-hr{height:1px;background:#E3EAF3;margin:14px 0;}
// .db-section-lbl{font-size:10.5px;font-weight:800;color:#8FA3BF;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;margin-top:16px;}

// /* Score bar */
// .db-score-bar-wrap{display:flex;align-items:center;gap:10px;margin-bottom:6px;}
// .db-score-bar-track{flex:1;height:6px;background:#E3EAF3;border-radius:6px;overflow:hidden;}
// .db-score-bar-fill{height:100%;border-radius:6px;transition:width 0.8s cubic-bezier(.16,1,.3,1);}
// .db-score-bar-lbl{font-size:11.5px;font-weight:700;color:#00338D;min-width:32px;text-align:right;}
// .db-score-bar-name{font-size:12px;color:#5A7090;min-width:110px;}

// /* KV rows */
// .db-kv{display:flex;flex-direction:column;gap:5px;}
// .db-kv-row{display:flex;justify-content:space-between;align-items:center;padding:9px 12px;background:#F7FAFF;border-radius:8px;}
// .db-kv-k{font-size:12.5px;color:#5A7090;}
// .db-kv-v{font-size:12.5px;font-weight:700;color:#00338D;}
// .db-kv-v.green{color:#276749;}
// .db-kv-v.red{color:#C53030;}
// .db-kv-v.amber{color:#D97706;}

// /* Schema pills */
// .db-schema{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}
// .db-schema-pill{padding:4px 10px;border-radius:100px;font-size:11px;font-weight:700;}
// .db-schema-pill.ok{background:#F0FFF4;color:#276749;border:1px solid #C6F6D5;}
// .db-schema-pill.miss{background:#FFF5F5;color:#C53030;border:1px solid #FED7D7;}

// /* Findings */
// .db-finding{padding:12px 14px;border-radius:10px;margin-top:8px;border-left:3px solid #005EB8;background:#F7FAFF;}
// .db-finding.high{border-left-color:#C53030;background:#FFF5F5;}
// .db-finding.med{border-left-color:#D97706;background:#FFFBEB;}
// .db-finding-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;}
// .db-finding-cat{font-size:12px;font-weight:800;color:#00338D;}
// .db-finding.high .db-finding-cat{color:#C53030;}
// .db-finding.med .db-finding-cat{color:#D97706;}
// .db-finding-sev{font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:100px;}
// .db-finding-sev.high{background:#FED7D7;color:#C53030;}
// .db-finding-sev.med{background:#FBD38D;color:#744210;}
// .db-finding-sev.low{background:#C6F6D5;color:#276749;}
// .db-finding-issue{font-size:12.5px;color:#5A7090;margin-bottom:4px;line-height:1.5;}
// .db-finding-rec{font-size:12px;color:#005EB8;line-height:1.5;}
// .db-finding-probe{font-size:11px;color:#B0C0D4;margin-top:4px;font-style:italic;}

// /* Big score */
// .db-big-score{display:flex;align-items:center;gap:16px;padding:16px;background:#F7FAFF;border-radius:12px;margin-bottom:14px;}
// .db-big-score-num{font-size:44px;font-weight:900;color:#00338D;letter-spacing:-2px;line-height:1;}
// .db-big-score-right{flex:1;}
// .db-big-score-label{font-size:12px;color:#8FA3BF;font-weight:600;margin-bottom:4px;}
// .db-big-score-bar{height:8px;background:#E3EAF3;border-radius:8px;overflow:hidden;}
// .db-big-score-fill{height:100%;border-radius:8px;transition:width 1s cubic-bezier(.16,1,.3,1);}

// /* Checklist */
// .db-checklist{display:flex;flex-direction:column;gap:6px;margin-bottom:16px;}
// .db-check-row{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#F7FAFF;border-radius:9px;}
// .db-check-k{font-size:13px;color:#5A7090;}
// .db-check-v{font-size:13px;font-weight:700;color:#00338D;}
// .db-check-v.green{color:#276749;}
// .db-check-v.red{color:#C53030;}

// @media(max-width:640px){.db-body{padding:20px 14px;}.db-nav{padding:0 16px;}.db-score-bar-name{min-width:80px;}}
// `;

// /* ── helper sub-components ── */

// function BlackBoxSummary({ result, tab, onRedo }: { result: BlackBoxResult; tab: string; onRedo: () => void }) {
//   const riskCls = (r="") => r.toLowerCase().includes("low") ? "low" : r.toLowerCase().includes("high") ? "high" : "med";
//   const scoreColor = result.overall_score >= 75 ? "#276749" : result.overall_score >= 50 ? "#D97706" : "#C53030";
//   const scoreCls   = result.overall_score >= 75 ? "green" : result.overall_score >= 50 ? "amber" : "red";

//   const highCount = result.findings?.filter(f => f.severity === "High").length ?? 0;
//   const medCount  = result.findings?.filter(f => f.severity === "Medium").length ?? 0;
//   const passCount = result.findings?.filter(f => f.severity === "Pass").length ?? 0;
//   const topFinding = result.findings?.find(f => f.severity === "High") ?? result.findings?.find(f => f.severity === "Medium");

//   const modeLabel = tab === "chat"
//     ? `${result.probes_run} conversation turns parsed`
//     : `${result.probes_run} governance probes executed`;

//   return (
//     <div className="db-card done">
//       <div className="db-done-row">
//         <div>
//           <div className="db-card-h">Black Box Audit Complete</div>
//           <div style={{ fontSize:12, color:"#8FA3BF", marginTop:2 }}>{modeLabel}</div>
//         </div>
//         <button className="db-redo" onClick={onRedo}>Redo</button>
//       </div>

//       <div className="db-kv">
//         <div className="db-kv-row">
//           <span className="db-kv-k">Overall governance score</span>
//           <span className={`db-kv-v ${scoreCls}`} style={{ color: scoreColor }}>{result.overall_score} / 100</span>
//         </div>
//         <div className="db-kv-row">
//           <span className="db-kv-k">Risk level</span>
//           <span className={`db-badge ${riskCls(result.risk_level)}`}>{result.risk_level} Risk</span>
//         </div>
//         <div className="db-kv-row">
//           <span className="db-kv-k">Findings</span>
//           <span className="db-kv-v">
//             {highCount > 0 && <span style={{ color:"#C53030" }}>{highCount} High</span>}
//             {highCount > 0 && medCount > 0 && " · "}
//             {medCount > 0 && <span style={{ color:"#D97706" }}>{medCount} Medium</span>}
//             {(highCount > 0 || medCount > 0) && passCount > 0 && " · "}
//             {passCount > 0 && <span style={{ color:"#276749" }}>{passCount} Passed</span>}
//             {highCount === 0 && medCount === 0 && passCount === 0 && "—"}
//           </span>
//         </div>
//         <div className="db-kv-row">
//           <span className="db-kv-k">Interpretation</span>
//           <span className="db-kv-v" style={{ fontSize:12, fontWeight:500, color:"#5A7090" }}>
//             {result.overall_score >= 75 ? "Meets enterprise governance standards." : result.overall_score >= 50 ? "Improvement needed before deployment." : "Immediate remediation required."}
//           </span>
//         </div>
//       </div>

//       {topFinding && (
//         <>
//           <div className="db-section-lbl" style={{ marginTop:14 }}>Top Finding</div>
//           <div className={`db-finding ${topFinding.severity === "High" ? "high" : "med"}`}>
//             <div className="db-finding-top">
//               <div className="db-finding-cat">{topFinding.category}</div>
//               <span className={`db-finding-sev ${topFinding.severity.toLowerCase()}`}>{topFinding.severity}</span>
//             </div>
//             <div className="db-finding-issue">{topFinding.issue}</div>
//             {topFinding.recommendation && <div className="db-finding-rec">Fix: {topFinding.recommendation}</div>}
//           </div>
//           {(highCount + medCount) > 1 && (
//             <div style={{ fontSize:12, color:"#8FA3BF", marginTop:8 }}>
//               +{highCount + medCount - 1} more finding{highCount + medCount - 1 > 1 ? "s" : ""} — full breakdown in the report.
//             </div>
//           )}
//         </>
//       )}

//       {tab === "chat" && (
//         <div className="db-info" style={{ marginTop:12 }}>
//           Chat history ingested into the SDCC pipeline. Proceed to Step 4 to run the full governance evaluation.
//         </div>
//       )}
//     </div>
//   );
// }

// function SdccSummaryPanel({ summary, onRedo }: { summary: SdccSummary; onRedo: () => void }) {
//   const qColor = summary.data_quality_score >= 75 ? "#276749" : summary.data_quality_score >= 50 ? "#D97706" : "#C53030";
//   const qCls   = summary.data_quality_score >= 75 ? "green" : summary.data_quality_score >= 50 ? "amber" : "red";
//   const riskCls = (r="") => r.toLowerCase().includes("low") ? "green" : r.toLowerCase().includes("high") ? "red" : "amber";

//   const schemaFields = [
//     { label:"task_id", ok: summary.has_task_id_col !== false },
//     { label:"input",   ok: summary.has_input_col   !== false },
//     { label:"output",  ok: summary.has_output_col  !== false },
//     { label:"latency", ok: summary.has_latency_col !== false },
//   ];

//   return (
//     <div className="db-card done">
//       <div className="db-done-row">
//         <div>
//           <div className="db-card-h">Logs Ingested — SDCC Complete</div>
//           <div style={{ fontSize:12, color:"#8FA3BF", marginTop:2 }}>
//             Structural & Data Completeness Check ran across your inference logs
//           </div>
//         </div>
//         <button className="db-redo" onClick={onRedo}>Upload New</button>
//       </div>

//       {/* Data quality score */}
//       <div className="db-big-score">
//         <div className="db-big-score-num" style={{ color: qColor }}>{summary.data_quality_score}%</div>
//         <div className="db-big-score-right">
//           <div className="db-big-score-label">Data Quality Score</div>
//           <div className="db-big-score-bar">
//             <div className="db-big-score-fill" style={{ width:`${summary.data_quality_score}%`, background:qColor }} />
//           </div>
//           <div style={{ fontSize:11.5, color:"#8FA3BF", marginTop:6 }}>
//             {summary.data_quality_score >= 75 ? "Your data is well-structured and ready for reliable evaluation." : summary.data_quality_score >= 50 ? "Data is usable but some columns are missing or incomplete." : "Low data quality — evaluation results may be less accurate."}
//           </div>
//         </div>
//       </div>

//       {/* Key metrics */}
//       <div className="db-section-lbl">Log Details</div>
//       <div className="db-kv">
//         <div className="db-kv-row">
//           <span className="db-kv-k">Rows ingested</span>
//           <span className="db-kv-v">{summary.logs_ingested.toLocaleString()} inference records</span>
//         </div>
//         <div className="db-kv-row">
//           <span className="db-kv-k">Detected model type</span>
//           <span className="db-kv-v">{summary.model_type?.replace(/_/g," ") || "Unknown"}{summary.detection_confidence ? ` (${Math.round(summary.detection_confidence * 100)}% confidence)` : ""}</span>
//         </div>
//         <div className="db-kv-row">
//           <span className="db-kv-k">Structural risk</span>
//           <span className={`db-kv-v ${riskCls(summary.structural_risk)}`}>{summary.structural_risk || "Unknown"}</span>
//         </div>
//         <div className="db-kv-row">
//           <span className="db-kv-k">Data quality</span>
//           <span className={`db-kv-v ${qCls}`}>{summary.data_quality_score}% — {qCls === "green" ? "Good" : qCls === "amber" ? "Moderate" : "Poor"}</span>
//         </div>
//       </div>

//       {/* Schema coverage */}
//       <div className="db-section-lbl">Schema Coverage</div>
//       <div style={{ fontSize:12.5, color:"#5A7090", marginBottom:8, lineHeight:1.5 }}>
//         These are the columns we look for in your logs. Missing columns reduce evaluation accuracy.
//       </div>
//       <div className="db-schema">
//         {schemaFields.map(f => (
//           <span key={f.label} className={`db-schema-pill ${f.ok ? "ok" : "miss"}`}>
//             {f.ok ? "✓" : "✗"} {f.label}
//           </span>
//         ))}
//       </div>

//       {/* Column warnings */}
//       {summary.column_warnings && summary.column_warnings.length > 0 && (
//         <div className="db-warn">
//           <strong>Column warnings:</strong> {summary.column_warnings.join(" · ")}
//         </div>
//       )}

//       {/* Recommendation */}
//       {summary.recommendation && (
//         <>
//           <div className="db-section-lbl">Recommendation</div>
//           <div className="db-info" style={{ marginTop:0 }}>{summary.recommendation}</div>
//         </>
//       )}
//     </div>
//   );
// }

// export default function Dashboard() {
//   const navigate = useNavigate();
//   const aiName = localStorage.getItem("activeAI") || "";

//   const [bbTab, setBbTab]           = useState<"api"|"ui"|"chat">("api");
//   const [bbEndpoint, setBbEndpoint] = useState("");
//   const [bbApiKey, setBbApiKey]     = useState("");
//   const [bbUiUrl, setBbUiUrl]       = useState("");
//   const [bbChatText, setBbChatText] = useState("");
//   const [bbChatSrc, setBbChatSrc]   = useState("chatgpt");
//   const [bbLoading, setBbLoading]   = useState(false);
//   const [bbResult, setBbResult]     = useState<BlackBoxResult|null>(null);
//   const [bbError, setBbError]       = useState("");
//   const [bbProgress, setBbProgress] = useState(0);
//   const [bbDone, setBbDone]         = useState(false);

//   const [file, setFile]                   = useState<File|null>(null);
//   const [ingestLoading, setIngestLoading] = useState(false);
//   const [sdccSummary, setSdccSummary]     = useState<SdccSummary|null>(null);
//   const [ingestError, setIngestError]     = useState("");
//   const [logsDone, setLogsDone]           = useState(false);

//   const [kbFiles, setKbFiles]   = useState<FileList|null>(null);
//   const [kbLoading, setKbLoading] = useState(false);
//   const [kbSuccess, setKbSuccess] = useState(false);
//   const [kbChunks, setKbChunks]   = useState<number|null>(null);
//   const [kbError, setKbError]     = useState("");
//   const [kbDone, setKbDone]       = useState(false);

//   const [evalLoading, setEvalLoading]   = useState(false);
//   const [evalError, setEvalError]       = useState("");
//   const [computationNotes, setComputationNotes] = useState<Record<string,ComputationNote>|null>(null);

//   const uploaded = logsDone || bbDone;
//   const extractErr = (e: any) => e?.response?.data?.detail || e?.message || "Operation failed.";
//   const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("activeAI"); navigate("/login"); };

//   const handleBlackBox = async () => {
//     if (bbTab==="api"  && (!bbEndpoint||!bbApiKey)) { setBbError("Provide both endpoint and API key."); return; }
//     if (bbTab==="ui"   && !bbUiUrl)                 { setBbError("Provide the deployed UI URL."); return; }
//     if (bbTab==="chat" && !bbChatText.trim())        { setBbError("Paste your chat history first."); return; }
//     setBbLoading(true); setBbError(""); setBbResult(null); setBbProgress(0);

//     if (bbTab==="chat") {
//       try {
//         const res = await ingestChatHistory(aiName||"external-ai", bbChatText, bbChatSrc);
//         setSdccSummary(res.data); setLogsDone(true); setBbDone(true);
//         setBbResult({ audit_id:"chat", ai_name:aiName, mode:"chat", status:"completed",
//           overall_score:res.data.data_quality_score??0, risk_level:res.data.structural_risk??"Unknown",
//           probes_run:res.data.turns_parsed??0, category_scores:{}, findings:[] });
//       } catch(e:any) { setBbError(extractErr(e)); }
//       finally { setBbLoading(false); }
//       return;
//     }

//     const iv = setInterval(() => setBbProgress(p => p>=39?p:p+1), 400);
//     try {
//       const res = await runBlackBoxAudit({ ai_name:aiName||"external-ai", mode:bbTab, endpoint:bbEndpoint, api_key:bbApiKey, ui_url:bbUiUrl });
//       clearInterval(iv); setBbProgress(40); setBbResult(res.data); setBbDone(true);
//       const probes: any[] = res.data?.probe_results??[];
//       if (probes.length>0 && aiName) {
//         try {
//           const esc=(v:string)=>`"${String(v??"").replace(/"/g,'""')}"`;
//           const rows=probes.map((p:any)=>[esc(p.probe_id||""),esc(p.prompt||""),esc(p.response||""),p.latency_ms||0].join(","));
//           const blob=new Blob([["task_id,input,output,latency",...rows].join("\n")],{type:"text/csv"});
//           const ir=await sdccIngest(aiName,new File([blob],"bb.csv",{type:"text/csv"}));
//           setSdccSummary(ir.data); setLogsDone(true);
//         } catch {}
//       }
//     } catch(e:any) { clearInterval(iv); setBbError(extractErr(e)); }
//     finally { setBbLoading(false); }
//   };

//   const handleUpload = async () => {
//     if (!aiName) { navigate("/register-ai"); return; }
//     if (!file)   { setIngestError("Select a file first."); return; }
//     setIngestLoading(true); setIngestError(""); setSdccSummary(null);
//     try {
//       const res = await sdccIngest(aiName, file);
//       setSdccSummary(res.data); setLogsDone(true);
//     } catch(e) { setIngestError(extractErr(e)); }
//     finally { setIngestLoading(false); }
//   };

//   const handleKb = async () => {
//     if (!aiName||!kbFiles?.length) { setKbError("Select at least one file."); return; }
//     setKbLoading(true); setKbError(""); setKbSuccess(false);
//     try {
//       const res = await uploadKnowledgeBase(aiName, Array.from(kbFiles));
//       setKbChunks(res.data?.chunks_stored??null); setKbSuccess(true); setKbDone(true);
//     } catch(e:any) { setKbError(extractErr(e)); }
//     finally { setKbLoading(false); }
//   };

//   const handleEvaluate = async () => {
//     if (!uploaded) return;
//     setEvalLoading(true); setEvalError("");
//     try {
//       const res = await evaluateAI(aiName);
//       if (res.data.computation_notes) setComputationNotes(res.data.computation_notes);
//       navigate("/report", { state: { data: res.data } });
//     } catch(e) { setEvalError(extractErr(e)); }
//     finally { setEvalLoading(false); }
//   };

//   const progressPct = Math.round((bbProgress/40)*100);
//   const stepNum = (done: boolean, active: boolean) => done ? "done" : active ? "active" : "";

//   return (
//     <div className="db">
//       <style>{CSS}</style>

//       <div className="db-nav">
//         <div style={{ display:"flex", alignItems:"center", gap:12 }}>
//           <span className="db-brand">Auditable AI™</span>
//           {aiName && <span className="db-ai-chip">Auditing: {aiName}</span>}
//         </div>
//         <div className="db-nav-r">
//           <button className="db-nbtn" onClick={() => navigate("/profile")}>Profile</button>
//           <button className="db-nbtn red" onClick={handleLogout}>Sign Out</button>
//         </div>
//       </div>

//       <div className="db-body">
//         <div className="db-page-title">Audit Pipeline</div>
//         <div className="db-page-sub">Complete each step to run a full KPMG Trusted AI Framework governance evaluation on your AI system.</div>

//         <div className="db-steps">

//           {/* ── STEP 1: BLACK BOX ── */}
//           <div className="db-step">
//             <div className="db-step-left">
//               <div className={`db-step-num ${stepNum(bbDone, true)}`}>{bbDone?"✓":"1"}</div>
//               <div className={`db-step-line ${bbDone?"done":""}`} />
//             </div>
//             <div className="db-step-body">
//               <div className={`db-step-eyebrow ${stepNum(bbDone, true)}`}>Step 1 — Black Box Audit</div>

//               {bbDone && bbResult ? (
//                 <BlackBoxSummary result={bbResult} tab={bbTab} onRedo={() => { setBbDone(false); setBbResult(null); }} />
//               ) : (
//                 <div className="db-card active">
//                   <div className="db-card-h">Black Box Audit</div>
//                   <div className="db-card-d">Connect your AI via API endpoint, deployed URL, or paste a chat history. Governance probes are fired automatically and responses are ingested into the SDCC pipeline.</div>

//                   <div className="db-tabs">
//                     {(["api","ui","chat"] as const).map(t => (
//                       <button key={t} className={`db-tab${bbTab===t?" on":""}`} onClick={() => { setBbTab(t); setBbError(""); }}>
//                         {t==="api"?"API Key":t==="ui"?"Deployed URL":"Chat History"}
//                       </button>
//                     ))}
//                   </div>

//                   {bbTab==="api" && <>
//                     <div className="db-field">
//                       <div className="db-lbl">API Endpoint</div>
//                       <input className="db-inp" type="url" placeholder="https://api.openai.com/v1/chat/completions" value={bbEndpoint} onChange={e=>setBbEndpoint(e.target.value)} disabled={bbLoading} />
//                     </div>
//                     <div className="db-field">
//                       <div className="db-lbl">API Key</div>
//                       <input className="db-inp" type="password" placeholder="sk-xxxx…" value={bbApiKey} onChange={e=>setBbApiKey(e.target.value)} disabled={bbLoading} />
//                     </div>
//                   </>}

//                   {bbTab==="ui" && <>
//                     <div className="db-field">
//                       <div className="db-lbl">Deployed UI URL</div>
//                       <input className="db-inp" type="url" placeholder="https://your-chatbot.vercel.app" value={bbUiUrl} onChange={e=>setBbUiUrl(e.target.value)} disabled={bbLoading} />
//                     </div>
//                     <div className="db-info">The backend opens a headless browser, navigates to your URL, and runs governance probes automatically. The URL must be publicly accessible.</div>
//                   </>}

//                   {bbTab==="chat" && <>
//                     <div className="db-field">
//                       <div className="db-lbl">Source</div>
//                       <select className="db-inp" value={bbChatSrc} onChange={e=>setBbChatSrc(e.target.value)} style={{ cursor:"pointer" }}>
//                         <option value="chatgpt">ChatGPT</option>
//                         <option value="claude">Claude</option>
//                         <option value="gemini">Gemini</option>
//                         <option value="copilot">Microsoft Copilot</option>
//                         <option value="other">Other</option>
//                       </select>
//                     </div>
//                     <div className="db-field">
//                       <div className="db-lbl">Paste Chat History</div>
//                       <textarea className="db-ta" placeholder={"You\nWhat is the capital of France?\n\nChatGPT\nThe capital of France is Paris."} value={bbChatText} onChange={e=>setBbChatText(e.target.value)} disabled={bbLoading} />
//                     </div>
//                     <div className="db-info">Open any AI chat, select all the conversation text, copy and paste it here. We'll parse the turns and run a full governance audit.</div>
//                   </>}

//                   {bbError && <div className="db-err">{bbError}</div>}
//                   <button className="db-btn" style={{ marginTop:4 }} onClick={handleBlackBox} disabled={bbLoading}>
//                     {bbLoading?(bbTab==="chat"?"Parsing & Ingesting…":"Running Audit…"):(bbTab==="chat"?"Audit Chat History":"Run Black Box Audit")}
//                   </button>
//                   {bbLoading && bbTab!=="chat" && <>
//                     <div className="db-prog"><div className="db-prog-fill" style={{ width:`${progressPct}%` }} /></div>
//                     <div className="db-prog-lbl">Probe {bbProgress} of 40 — {progressPct}%</div>
//                   </>}
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* ── STEP 2: UPLOAD LOGS ── */}
//           <div className="db-step">
//             <div className="db-step-left">
//               <div className={`db-step-num ${stepNum(logsDone, true)}`}>{logsDone?"✓":"2"}</div>
//               <div className={`db-step-line ${logsDone?"done":""}`} />
//             </div>
//             <div className="db-step-body">
//               <div className={`db-step-eyebrow ${stepNum(logsDone, true)}`}>Step 2 — Upload Inference Logs <span style={{ fontWeight:400, letterSpacing:0 }}>(Optional if Black Box ran)</span></div>

//               {/* SDCC summary always shown when available */}
//               {logsDone && sdccSummary && (
//                 <SdccSummaryPanel summary={sdccSummary} onRedo={() => { setLogsDone(false); setSdccSummary(null); setFile(null); }} />
//               )}

//               {/* Upload form — always visible */}
//               <div className={`db-card${logsDone?" ":" active"}`} style={{ marginTop: logsDone ? 12 : 0 }}>
//                 <div className="db-card-h">
//                   {logsDone ? "Upload Additional Logs" : "Upload Inference Logs"}
//                   {!logsDone && bbDone && <span style={{ fontSize:11, fontWeight:600, color:"#00A3A1", marginLeft:8, background:"#F0FAFA", border:"1px solid #B2E8E6", padding:"2px 8px", borderRadius:100 }}>Auto-ingested from Black Box</span>}
//                 </div>
//                 <div className="db-card-d">
//                   {bbDone && !logsDone
//                     ? "Black Box probe responses were automatically ingested into the SDCC pipeline — you can skip this step and go straight to Step 4. Or upload your own production logs here to replace them."
//                     : logsDone
//                     ? "You can upload a new or updated log file to replace the current ingestion."
//                     : "Upload a CSV of your AI's production inference logs. We'll parse inputs, outputs, latency, and task IDs automatically. No fixed schema required."}
//                 </div>
//                 <div className={`db-drop${file?" has":""}`}
//                   onClick={() => document.getElementById("log-inp")?.click()}
//                   onDragOver={e=>e.preventDefault()}
//                   onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)setFile(f);}}>
//                   <input id="log-inp" type="file" accept=".csv,.json" style={{ display:"none" }} onChange={e=>{if(e.target.files?.[0])setFile(e.target.files[0]);}} />
//                   <div className={`db-drop-t${file?" has":""}`}>{file?file.name:"Click or drag a CSV / JSON file here"}</div>
//                 </div>
//                 {ingestError && <div className="db-err">{ingestError}</div>}
//                 <button className="db-btn" onClick={handleUpload} disabled={ingestLoading||!file}>
//                   {ingestLoading?"Ingesting…":"Upload & Ingest"}
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* ── STEP 3: KNOWLEDGE BASE ── */}
//           <div className="db-step">
//             <div className="db-step-left">
//               <div className={`db-step-num ${stepNum(kbDone, uploaded)}`}>{kbDone?"✓":"3"}</div>
//               <div className={`db-step-line ${kbDone?"done":""}`} />
//             </div>
//             <div className="db-step-body">
//               <div className={`db-step-eyebrow ${stepNum(kbDone, uploaded)}`}>Step 3 — Knowledge Base <span style={{ fontWeight:400, letterSpacing:0 }}>(Optional)</span></div>
//               <div className={`db-card${uploaded?"":" locked"}`}>
//                 <div className="db-card-h">Upload Knowledge Base</div>
//                 <div className="db-card-d">Upload reference documents (PDF, TXT, DOCX, MD) to ground the LLM Judge evaluation against your own material. When provided, the three judges compare AI responses against your KB instead of using only their world knowledge — significantly improving accuracy scoring for RAG and domain-specific systems.</div>
//                 {kbDone && kbSuccess && (
//                   <div className="db-ok" style={{ marginBottom:12 }}>
//                     {kbChunks} chunks stored. The LLM Judge will use these as reference during evaluation.
//                   </div>
//                 )}
//                 <div className={`db-drop${kbFiles&&kbFiles.length>0?" has":""}`}
//                   onClick={() => document.getElementById("kb-inp")?.click()}
//                   onDragOver={e=>e.preventDefault()}
//                   onDrop={e=>{e.preventDefault();if(e.dataTransfer.files.length)setKbFiles(e.dataTransfer.files);}}>
//                   <input id="kb-inp" type="file" accept=".pdf,.txt,.md,.docx,.csv" multiple style={{ display:"none" }} onChange={e=>{if(e.target.files?.length)setKbFiles(e.target.files);}} />
//                   <div className={`db-drop-t${kbFiles&&kbFiles.length>0?" has":""}`}>
//                     {kbFiles&&kbFiles.length>0?`${kbFiles.length} file${kbFiles.length>1?"s":""} selected`:"Click or drag files here (PDF, TXT, DOCX, MD)"}
//                   </div>
//                 </div>
//                 {kbError && <div className="db-err">{kbError}</div>}
//                 <button className="db-btn teal" onClick={handleKb} disabled={kbLoading||!kbFiles?.length}>
//                   {kbLoading?"Uploading…":"Upload Knowledge Base"}
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* ── STEP 4: EVALUATE ── */}
//           <div className="db-step">
//             <div className="db-step-left">
//               <div className={`db-step-num ${uploaded?"active":""}`}>4</div>
//             </div>
//             <div className="db-step-body">
//               <div className={`db-step-eyebrow ${uploaded?"active":""}`}>Step 4 — Run Full Evaluation</div>
//               <div className={`db-card${uploaded?"":" locked"}`}>
//                 <div className="db-card-h">Run Full Governance Evaluation</div>
//                 <div className="db-card-d">
//                   Runs the complete KPMG TAF pipeline: SDCC structural analysis → Triple LLM Judge accuracy scoring → 10-principle TAF scoring → risk classification → compliance mapping → PDF report generation. This is the final step.
//                 </div>

//                 {uploaded && sdccSummary && (
//                   <div className="db-checklist">
//                     <div className="db-check-row">
//                       <span className="db-check-k">Inference logs</span>
//                       <span className="db-check-v green">{sdccSummary.logs_ingested.toLocaleString()} rows ready</span>
//                     </div>
//                     <div className="db-check-row">
//                       <span className="db-check-k">Model type detected</span>
//                       <span className="db-check-v">{sdccSummary.model_type?.replace(/_/g," ")||"Auto-detect"}</span>
//                     </div>
//                     <div className="db-check-row">
//                       <span className="db-check-k">Data quality</span>
//                       <span className={`db-check-v ${sdccSummary.data_quality_score>=70?"green":"red"}`}>{sdccSummary.data_quality_score}%</span>
//                     </div>
//                     <div className="db-check-row">
//                       <span className="db-check-k">Knowledge base</span>
//                       <span className={`db-check-v ${kbDone?"green":""}`}>{kbDone?`${kbChunks} chunks loaded`:"Not uploaded (optional)"}</span>
//                     </div>
//                   </div>
//                 )}

//                 {!uploaded && <div className="db-info">Complete Step 1 (Black Box Audit) to auto-ingest logs and enable evaluation — or upload your own logs in Step 2.</div>}
//                 {uploaded && !sdccSummary && bbDone && (
//                   <div className="db-info" style={{ marginBottom:16 }}>Black Box probe responses were auto-ingested. You're ready to run the full evaluation.</div>
//                 )}
//                 {evalError && <div className="db-err">{evalError}</div>}
//                 {computationNotes && (
//                   <div className="db-ok" style={{ marginBottom:12 }}>
//                     {Object.values(computationNotes).filter((n:any)=>n.status==="computed").length} metrics computed successfully.
//                   </div>
//                 )}

//                 <button className="db-btn big" onClick={handleEvaluate} disabled={!uploaded||evalLoading}>
//                   {evalLoading?"Generating Report…":"Run Full Governance Evaluation →"}
//                 </button>
//               </div>
//             </div>
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// }



/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sdccIngest, evaluateAI, runBlackBoxAudit, uploadKnowledgeBase, ingestChatHistory } from "../services/api";

interface BlackBoxFinding { category:string; severity:"High"|"Medium"|"Low"|"Pass"; probe:string; response_preview:string; issue:string; recommendation:string; }
interface BlackBoxResult  { audit_id:string; ai_name:string; mode:string; status:string; overall_score:number; risk_level:string; probes_run:number; category_scores:Record<string,number>; findings:BlackBoxFinding[]; message?:string; }
interface ComputationNote { library:string; status:string; value:number|null; }
interface SdccSummary     { model_type:string; logs_ingested:number; data_quality_score:number; structural_risk:string; detection_confidence?:number; recommendation?:string; column_warnings?:string[]; has_input_col?:boolean; has_output_col?:boolean; has_latency_col?:boolean; has_task_id_col?:boolean; }

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:#F4F7FB;}
.db{font-family:'Plus Jakarta Sans',sans-serif;background:#F4F7FB;min-height:100vh;color:#0B1F33;}

.db-nav{background:#fff;border-bottom:1px solid #E3EAF3;height:62px;display:flex;align-items:center;justify-content:space-between;padding:0 40px;position:sticky;top:0;z-index:100;box-shadow:0 1px 12px rgba(0,51,141,0.05);}
.db-brand{font-size:17px;font-weight:900;color:#00338D;letter-spacing:-0.4px;}
.db-ai-chip{background:#EEF4FF;border:1px solid #C7D9F5;color:#005EB8;font-size:11.5px;font-weight:700;padding:4px 12px;border-radius:100px;}
.db-nav-r{display:flex;gap:8px;}
.db-nbtn{padding:7px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:1.5px solid #E3EAF3;background:#fff;color:#5A7090;transition:all 0.2s;font-family:inherit;}
.db-nbtn:hover{border-color:#005EB8;color:#005EB8;}
.db-nbtn.red{border-color:#FED7D7;background:#FFF5F5;color:#C53030;}
.db-nbtn.red:hover{background:#FEE2E2;}

.db-body{max-width:820px;margin:0 auto;padding:40px 24px 80px;}
.db-page-title{font-size:22px;font-weight:900;color:#00338D;letter-spacing:-0.5px;margin-bottom:4px;}
.db-page-sub{font-size:13.5px;color:#8FA3BF;margin-bottom:36px;line-height:1.5;}

.db-steps{display:flex;flex-direction:column;gap:0;}
.db-step{display:flex;gap:0;align-items:stretch;}
.db-step-left{display:flex;flex-direction:column;align-items:center;width:44px;flex-shrink:0;}
.db-step-num{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;transition:all 0.3s;border:2px solid #E3EAF3;background:#fff;color:#B0C0D4;}
.db-step-num.active{background:linear-gradient(135deg,#00338D,#005EB8);border-color:transparent;color:#fff;box-shadow:0 4px 14px rgba(0,51,141,0.25);}
.db-step-num.done{background:#00A3A1;border-color:transparent;color:#fff;}
.db-step-line{width:2px;flex:1;background:#E3EAF3;margin:3px 0;min-height:16px;transition:background 0.3s;}
.db-step-line.done{background:#00A3A1;}
.db-step-body{flex:1;padding:0 0 28px 14px;}
.db-step-eyebrow{font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;margin-bottom:5px;color:#B0C0D4;transition:color 0.3s;}
.db-step-eyebrow.active{color:#005EB8;}
.db-step-eyebrow.done{color:#00A3A1;}

.db-card{background:#fff;border:1.5px solid #E3EAF3;border-radius:16px;padding:22px;transition:all 0.25s;}
.db-card.active{border-color:#C7D9F5;box-shadow:0 4px 20px rgba(0,51,141,0.07);}
.db-card.done{border-color:#B2E8E6;background:#FAFFFE;}
.db-card.locked{opacity:0.4;pointer-events:none;user-select:none;}
.db-card-h{font-size:14px;font-weight:800;color:#00338D;margin-bottom:3px;}
.db-card-d{font-size:12.5px;color:#8FA3BF;margin-bottom:16px;line-height:1.55;}

.db-done-row{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:14px;}
.db-redo{font-size:12px;color:#8FA3BF;cursor:pointer;text-decoration:underline;border:none;background:none;font-family:inherit;padding:0;flex-shrink:0;margin-top:2px;}

.db-lbl{font-size:11px;font-weight:700;color:#5A7090;letter-spacing:0.5px;margin-bottom:5px;text-transform:uppercase;}
.db-inp{width:100%;padding:11px 13px;border-radius:9px;border:1.5px solid #E3EAF3;font-size:13.5px;font-family:inherit;color:#0B1F33;background:#fff;outline:none;transition:all 0.2s;}
.db-inp:focus{border-color:#005EB8;box-shadow:0 0 0 3px rgba(0,94,184,0.09);}
.db-inp::placeholder{color:#B8C8D8;}
.db-ta{width:100%;padding:11px 13px;border-radius:9px;border:1.5px solid #E3EAF3;font-size:13px;font-family:inherit;color:#0B1F33;background:#fff;outline:none;resize:vertical;min-height:100px;line-height:1.6;transition:all 0.2s;}
.db-ta:focus{border-color:#005EB8;box-shadow:0 0 0 3px rgba(0,94,184,0.09);}
.db-ta::placeholder{color:#B8C8D8;}
.db-field{margin-bottom:12px;}

.db-tabs{display:flex;gap:3px;background:#F0F4FA;padding:3px;border-radius:9px;margin-bottom:16px;}
.db-tab{flex:1;padding:7px 8px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;border:none;background:transparent;color:#8FA3BF;transition:all 0.2s;font-family:inherit;}
.db-tab.on{background:#fff;color:#00338D;box-shadow:0 1px 5px rgba(0,51,141,0.1);}

.db-drop{border:2px dashed #D0DCF0;border-radius:10px;padding:18px;text-align:center;cursor:pointer;transition:all 0.2s;background:#F7FAFF;margin-bottom:12px;}
.db-drop:hover{border-color:#005EB8;background:#EEF4FF;}
.db-drop.has{border-color:#00A3A1;background:#F0FAFA;}
.db-drop-t{font-size:12.5px;color:#8FA3BF;}
.db-drop-t.has{color:#00A3A1;font-weight:600;}

.db-btn{width:100%;padding:12px;border-radius:10px;border:none;background:linear-gradient(135deg,#00338D,#005EB8);color:#fff;font-size:13.5px;font-weight:700;font-family:inherit;cursor:pointer;transition:all 0.3s;box-shadow:0 4px 14px rgba(0,51,141,0.2);}
.db-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 22px rgba(0,51,141,0.28);}
.db-btn:disabled{opacity:0.4;cursor:not-allowed;transform:none;}
.db-btn.teal{background:linear-gradient(135deg,#00A3A1,#0091DA);}
.db-btn.big{padding:15px;font-size:15px;font-weight:800;border-radius:12px;letter-spacing:-0.2px;box-shadow:0 6px 22px rgba(0,51,141,0.26);}
.db-btn.big:hover:not(:disabled){transform:translateY(-3px);box-shadow:0 14px 34px rgba(0,51,141,0.34);}
.db-btn.sm{width:auto;padding:8px 16px;font-size:12px;box-shadow:none;}

.db-err{margin-top:10px;padding:10px 13px;background:#FFF5F5;border:1px solid #FED7D7;border-radius:8px;font-size:12.5px;color:#C53030;}
.db-ok{margin-top:10px;padding:10px 13px;background:#F0FFF4;border:1px solid #C6F6D5;border-radius:8px;font-size:12.5px;color:#276749;}
.db-info{padding:10px 13px;background:#EEF4FF;border:1px solid #C7D9F5;border-radius:8px;font-size:12.5px;color:#005EB8;line-height:1.6;margin-bottom:12px;}
.db-warn{padding:10px 13px;background:#FFFBEB;border:1px solid #FBD38D;border-radius:8px;font-size:12.5px;color:#744210;line-height:1.6;margin-top:8px;}

.db-prog{height:4px;background:#E3EAF3;border-radius:4px;overflow:hidden;margin-top:10px;}
.db-prog-fill{height:100%;background:linear-gradient(to right,#00338D,#0091DA);border-radius:4px;transition:width 0.4s;}
.db-prog-lbl{font-size:11px;color:#8FA3BF;margin-top:4px;text-align:center;}

.db-badge{display:inline-block;padding:3px 9px;border-radius:100px;font-size:11px;font-weight:700;}
.db-badge.low{color:#276749;background:#F0FFF4;border:1px solid #C6F6D5;}
.db-badge.med{color:#744210;background:#FFFBEB;border:1px solid #FBD38D;}
.db-badge.high{color:#C53030;background:#FFF5F5;border:1px solid #FED7D7;}

.db-hr{height:1px;background:#E3EAF3;margin:14px 0;}
.db-section-lbl{font-size:10.5px;font-weight:800;color:#8FA3BF;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;margin-top:16px;}

/* Score bar */
.db-score-bar-wrap{display:flex;align-items:center;gap:10px;margin-bottom:6px;}
.db-score-bar-track{flex:1;height:6px;background:#E3EAF3;border-radius:6px;overflow:hidden;}
.db-score-bar-fill{height:100%;border-radius:6px;transition:width 0.8s cubic-bezier(.16,1,.3,1);}
.db-score-bar-lbl{font-size:11.5px;font-weight:700;color:#00338D;min-width:32px;text-align:right;}
.db-score-bar-name{font-size:12px;color:#5A7090;min-width:110px;}

/* KV rows */
.db-kv{display:flex;flex-direction:column;gap:5px;}
.db-kv-row{display:flex;justify-content:space-between;align-items:center;padding:9px 12px;background:#F7FAFF;border-radius:8px;}
.db-kv-k{font-size:12.5px;color:#5A7090;}
.db-kv-v{font-size:12.5px;font-weight:700;color:#00338D;}
.db-kv-v.green{color:#276749;}
.db-kv-v.red{color:#C53030;}
.db-kv-v.amber{color:#D97706;}

/* Schema pills */
.db-schema{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}
.db-schema-pill{padding:4px 10px;border-radius:100px;font-size:11px;font-weight:700;}
.db-schema-pill.ok{background:#F0FFF4;color:#276749;border:1px solid #C6F6D5;}
.db-schema-pill.miss{background:#FFF5F5;color:#C53030;border:1px solid #FED7D7;}

/* Findings */
.db-finding{padding:12px 14px;border-radius:10px;margin-top:8px;border-left:3px solid #005EB8;background:#F7FAFF;}
.db-finding.high{border-left-color:#C53030;background:#FFF5F5;}
.db-finding.med{border-left-color:#D97706;background:#FFFBEB;}
.db-finding-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;}
.db-finding-cat{font-size:12px;font-weight:800;color:#00338D;}
.db-finding.high .db-finding-cat{color:#C53030;}
.db-finding.med .db-finding-cat{color:#D97706;}
.db-finding-sev{font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:100px;}
.db-finding-sev.high{background:#FED7D7;color:#C53030;}
.db-finding-sev.med{background:#FBD38D;color:#744210;}
.db-finding-sev.low{background:#C6F6D5;color:#276749;}
.db-finding-issue{font-size:12.5px;color:#5A7090;margin-bottom:4px;line-height:1.5;}
.db-finding-rec{font-size:12px;color:#005EB8;line-height:1.5;}
.db-finding-probe{font-size:11px;color:#B0C0D4;margin-top:4px;font-style:italic;}

/* Big score */
.db-big-score{display:flex;align-items:center;gap:16px;padding:16px;background:#F7FAFF;border-radius:12px;margin-bottom:14px;}
.db-big-score-num{font-size:44px;font-weight:900;color:#00338D;letter-spacing:-2px;line-height:1;}
.db-big-score-right{flex:1;}
.db-big-score-label{font-size:12px;color:#8FA3BF;font-weight:600;margin-bottom:4px;}
.db-big-score-bar{height:8px;background:#E3EAF3;border-radius:8px;overflow:hidden;}
.db-big-score-fill{height:100%;border-radius:8px;transition:width 1s cubic-bezier(.16,1,.3,1);}

/* Checklist */
.db-checklist{display:flex;flex-direction:column;gap:6px;margin-bottom:16px;}
.db-check-row{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#F7FAFF;border-radius:9px;}
.db-check-k{font-size:13px;color:#5A7090;}
.db-check-v{font-size:13px;font-weight:700;color:#00338D;}
.db-check-v.green{color:#276749;}
.db-check-v.red{color:#C53030;}

@media(max-width:640px){.db-body{padding:20px 14px;}.db-nav{padding:0 16px;}.db-score-bar-name{min-width:80px;}}
`;

/* ── helper sub-components ── */

function BlackBoxSummary({ result, tab, onRedo }: { result: BlackBoxResult; tab: string; onRedo: () => void }) {
  const riskCls = (r="") => r.toLowerCase().includes("low") ? "low" : r.toLowerCase().includes("high") ? "high" : "med";
  const scoreColor = result.overall_score >= 75 ? "#276749" : result.overall_score >= 50 ? "#D97706" : "#C53030";
  const scoreCls   = result.overall_score >= 75 ? "green" : result.overall_score >= 50 ? "amber" : "red";

  const highCount = result.findings?.filter(f => f.severity === "High").length ?? 0;
  const medCount  = result.findings?.filter(f => f.severity === "Medium").length ?? 0;
  const passCount = result.findings?.filter(f => f.severity === "Pass").length ?? 0;
  const topFinding = result.findings?.find(f => f.severity === "High") ?? result.findings?.find(f => f.severity === "Medium");

  const modeLabel = tab === "chat"
    ? `${result.probes_run} conversation turns parsed`
    : `${result.probes_run} governance probes executed`;

  return (
    <div className="db-card done">
      <div className="db-done-row">
        <div>
          <div className="db-card-h">Black Box Audit Complete</div>
          <div style={{ fontSize:12, color:"#8FA3BF", marginTop:2 }}>{modeLabel}</div>
        </div>
        <button className="db-redo" onClick={onRedo}>Redo</button>
      </div>

      <div className="db-kv">
        <div className="db-kv-row">
          <span className="db-kv-k">Overall governance score</span>
          <span className={`db-kv-v ${scoreCls}`} style={{ color: scoreColor }}>{result.overall_score} / 100</span>
        </div>
        <div className="db-kv-row">
          <span className="db-kv-k">Risk level</span>
          <span className={`db-badge ${riskCls(result.risk_level)}`}>{result.risk_level} Risk</span>
        </div>
        <div className="db-kv-row">
          <span className="db-kv-k">Findings</span>
          <span className="db-kv-v">
            {highCount > 0 && <span style={{ color:"#C53030" }}>{highCount} High</span>}
            {highCount > 0 && medCount > 0 && " · "}
            {medCount > 0 && <span style={{ color:"#D97706" }}>{medCount} Medium</span>}
            {(highCount > 0 || medCount > 0) && passCount > 0 && " · "}
            {passCount > 0 && <span style={{ color:"#276749" }}>{passCount} Passed</span>}
            {highCount === 0 && medCount === 0 && passCount === 0 && "—"}
          </span>
        </div>
        <div className="db-kv-row">
          <span className="db-kv-k">Interpretation</span>
          <span className="db-kv-v" style={{ fontSize:12, fontWeight:500, color:"#5A7090" }}>
            {result.overall_score >= 75 ? "Meets enterprise governance standards." : result.overall_score >= 50 ? "Improvement needed before deployment." : "Immediate remediation required."}
          </span>
        </div>
      </div>

      {topFinding && (
        <>
          <div className="db-section-lbl" style={{ marginTop:14 }}>Top Finding</div>
          <div className={`db-finding ${topFinding.severity === "High" ? "high" : "med"}`}>
            <div className="db-finding-top">
              <div className="db-finding-cat">{topFinding.category}</div>
              <span className={`db-finding-sev ${topFinding.severity.toLowerCase()}`}>{topFinding.severity}</span>
            </div>
            <div className="db-finding-issue">{topFinding.issue}</div>
            {topFinding.recommendation && <div className="db-finding-rec">Fix: {topFinding.recommendation}</div>}
          </div>
          {(highCount + medCount) > 1 && (
            <div style={{ fontSize:12, color:"#8FA3BF", marginTop:8 }}>
              +{highCount + medCount - 1} more finding{highCount + medCount - 1 > 1 ? "s" : ""} — full breakdown in the report.
            </div>
          )}
        </>
      )}

      {tab === "chat" && (
        <div className="db-info" style={{ marginTop:12 }}>
          Chat history ingested into the SDCC pipeline. Proceed to Step 4 to run the full governance evaluation.
        </div>
      )}
    </div>
  );
}

function SdccSummaryPanel({ summary, onRedo }: { summary: SdccSummary; onRedo: () => void }) {
  const qColor = summary.data_quality_score >= 75 ? "#276749" : summary.data_quality_score >= 50 ? "#D97706" : "#C53030";
  const qCls   = summary.data_quality_score >= 75 ? "green" : summary.data_quality_score >= 50 ? "amber" : "red";
  const riskCls = (r="") => r.toLowerCase().includes("low") ? "green" : r.toLowerCase().includes("high") ? "red" : "amber";

  const schemaFields = [
    { label:"task_id", ok: summary.has_task_id_col !== false },
    { label:"input",   ok: summary.has_input_col   !== false },
    { label:"output",  ok: summary.has_output_col  !== false },
    { label:"latency", ok: summary.has_latency_col !== false },
  ];

  return (
    <div className="db-card done">
      <div className="db-done-row">
        <div>
          <div className="db-card-h">Logs Ingested — SDCC Complete</div>
          <div style={{ fontSize:12, color:"#8FA3BF", marginTop:2 }}>
            Structural & Data Completeness Check ran across your inference logs
          </div>
        </div>
        <button className="db-redo" onClick={onRedo}>Upload New</button>
      </div>

      {/* Data quality score */}
      <div className="db-big-score">
        <div className="db-big-score-num" style={{ color: qColor }}>{summary.data_quality_score}%</div>
        <div className="db-big-score-right">
          <div className="db-big-score-label">Data Quality Score</div>
          <div className="db-big-score-bar">
            <div className="db-big-score-fill" style={{ width:`${summary.data_quality_score}%`, background:qColor }} />
          </div>
          <div style={{ fontSize:11.5, color:"#8FA3BF", marginTop:6 }}>
            {summary.data_quality_score >= 75 ? "Your data is well-structured and ready for reliable evaluation." : summary.data_quality_score >= 50 ? "Data is usable but some columns are missing or incomplete." : "Low data quality — evaluation results may be less accurate."}
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="db-section-lbl">Log Details</div>
      <div className="db-kv">
        <div className="db-kv-row">
          <span className="db-kv-k">Rows ingested</span>
          <span className="db-kv-v">{summary.logs_ingested.toLocaleString()} inference records</span>
        </div>
        <div className="db-kv-row">
          <span className="db-kv-k">Detected model type</span>
          <span className="db-kv-v">{summary.model_type?.replace(/_/g," ") || "Unknown"}{summary.detection_confidence ? ` (${Math.round(summary.detection_confidence * 100)}% confidence)` : ""}</span>
        </div>
        <div className="db-kv-row">
          <span className="db-kv-k">Structural risk</span>
          <span className={`db-kv-v ${riskCls(summary.structural_risk)}`}>{summary.structural_risk || "Unknown"}</span>
        </div>
        <div className="db-kv-row">
          <span className="db-kv-k">Data quality</span>
          <span className={`db-kv-v ${qCls}`}>{summary.data_quality_score}% — {qCls === "green" ? "Good" : qCls === "amber" ? "Moderate" : "Poor"}</span>
        </div>
      </div>

      {/* Schema coverage */}
      <div className="db-section-lbl">Schema Coverage</div>
      <div style={{ fontSize:12.5, color:"#5A7090", marginBottom:8, lineHeight:1.5 }}>
        These are the columns we look for in your logs. Missing columns reduce evaluation accuracy.
      </div>
      <div className="db-schema">
        {schemaFields.map(f => (
          <span key={f.label} className={`db-schema-pill ${f.ok ? "ok" : "miss"}`}>
            {f.ok ? "✓" : "✗"} {f.label}
          </span>
        ))}
      </div>

      {/* Column warnings */}
      {summary.column_warnings && summary.column_warnings.length > 0 && (
        <div className="db-warn">
          <strong>Column warnings:</strong> {summary.column_warnings.join(" · ")}
        </div>
      )}

      {/* Recommendation */}
      {summary.recommendation && (
        <>
          <div className="db-section-lbl">Recommendation</div>
          <div className="db-info" style={{ marginTop:0 }}>{summary.recommendation}</div>
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const aiName = localStorage.getItem("activeAI") || "";

  const [bbTab, setBbTab]           = useState<"api"|"ui"|"chat">("api");
  const [bbEndpoint, setBbEndpoint] = useState("");
  const [bbApiKey, setBbApiKey]     = useState("");
  const [bbUiUrl, setBbUiUrl]       = useState("");
  const [bbChatText, setBbChatText] = useState("");
  const [bbChatSrc, setBbChatSrc]   = useState("chatgpt");
  const [bbLoading, setBbLoading]   = useState(false);
  const [bbResult, setBbResult]     = useState<BlackBoxResult|null>(null);
  const [bbError, setBbError]       = useState("");
  const [bbProgress, setBbProgress] = useState(0);
  const [bbDone, setBbDone]         = useState(false);

  const [file, setFile]                   = useState<File|null>(null);
  const [ingestLoading, setIngestLoading] = useState(false);
  const [sdccSummary, setSdccSummary]     = useState<SdccSummary|null>(null);
  const [ingestError, setIngestError]     = useState("");
  const [logsDone, setLogsDone]           = useState(false);

  const [kbFiles, setKbFiles]   = useState<FileList|null>(null);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbSuccess, setKbSuccess] = useState(false);
  const [kbChunks, setKbChunks]   = useState<number|null>(null);
  const [kbError, setKbError]     = useState("");
  const [kbDone, setKbDone]       = useState(false);

  const [evalLoading, setEvalLoading]   = useState(false);
  const [evalError, setEvalError]       = useState("");
  const [computationNotes, setComputationNotes] = useState<Record<string,ComputationNote>|null>(null);

  const uploaded = logsDone || bbDone;
  const extractErr = (e: any) => e?.response?.data?.detail || e?.message || "Operation failed.";
  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("activeAI"); navigate("/login"); };

  const handleBlackBox = async () => {
    if (bbTab==="api"  && (!bbEndpoint||!bbApiKey)) { setBbError("Provide both endpoint and API key."); return; }
    if (bbTab==="ui"   && !bbUiUrl)                 { setBbError("Provide the deployed UI URL."); return; }
    if (bbTab==="chat" && !bbChatText.trim())        { setBbError("Paste your chat history first."); return; }
    setBbLoading(true); setBbError(""); setBbResult(null); setBbProgress(0);

    if (bbTab==="chat") {
      try {
        const res = await ingestChatHistory(aiName||"external-ai", bbChatText, bbChatSrc);
        setSdccSummary(res.data); setLogsDone(true); setBbDone(true);
        setBbResult({ audit_id:"chat", ai_name:aiName, mode:"chat", status:"completed",
          overall_score:res.data.data_quality_score??0, risk_level:res.data.structural_risk??"Unknown",
          probes_run:res.data.turns_parsed??0, category_scores:{}, findings:[] });
      } catch(e:any) { setBbError(extractErr(e)); }
      finally { setBbLoading(false); }
      return;
    }

    const iv = setInterval(() => setBbProgress(p => p>=39?p:p+1), 400);
    try {
      const res = await runBlackBoxAudit({ ai_name:aiName||"external-ai", mode:bbTab, endpoint:bbEndpoint, api_key:bbApiKey, ui_url:bbUiUrl });
      clearInterval(iv); setBbProgress(40); setBbResult(res.data); setBbDone(true);
      const probes: any[] = res.data?.probe_results??[];
      if (probes.length>0 && aiName) {
        try {
          const esc=(v:string)=>`"${String(v??"").replace(/"/g,'""')}"`;
          const rows=probes.map((p:any)=>[esc(p.probe_id||""),esc(p.prompt||""),esc(p.response||""),p.latency_ms||0].join(","));
          const blob=new Blob([["task_id,input,output,latency",...rows].join("\n")],{type:"text/csv"});
          const ir=await sdccIngest(aiName,new File([blob],"bb.csv",{type:"text/csv"}));
          setSdccSummary(ir.data); setLogsDone(true);
        } catch {}
      }
    } catch(e:any) { clearInterval(iv); setBbError(extractErr(e)); }
    finally { setBbLoading(false); }
  };

  const handleUpload = async () => {
    if (!aiName) { navigate("/register-ai"); return; }
    if (!file)   { setIngestError("Select a file first."); return; }
    setIngestLoading(true); setIngestError(""); setSdccSummary(null);
    try {
      const res = await sdccIngest(aiName, file);
      setSdccSummary(res.data); setLogsDone(true);
    } catch(e) { setIngestError(extractErr(e)); }
    finally { setIngestLoading(false); }
  };

  const handleKb = async () => {
    if (!aiName||!kbFiles?.length) { setKbError("Select at least one file."); return; }
    setKbLoading(true); setKbError(""); setKbSuccess(false);
    try {
      const res = await uploadKnowledgeBase(aiName, Array.from(kbFiles));
      setKbChunks(res.data?.chunks_stored??null); setKbSuccess(true); setKbDone(true);
    } catch(e:any) { setKbError(extractErr(e)); }
    finally { setKbLoading(false); }
  };

  const handleEvaluate = async () => {
    if (!uploaded) return;
    setEvalLoading(true); setEvalError("");
    try {
      const res = await evaluateAI(aiName);
      if (res.data.computation_notes) setComputationNotes(res.data.computation_notes);
      navigate("/report", { state: { data: res.data } });
    } catch(e) { setEvalError(extractErr(e)); }
    finally { setEvalLoading(false); }
  };

  const progressPct = Math.round((bbProgress/40)*100);
  const stepNum = (done: boolean, active: boolean) => done ? "done" : active ? "active" : "";

  return (
    <div className="db">
      <style>{CSS}</style>

      <div className="db-nav">
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span className="db-brand">Auditable AI™</span>
          {aiName && <span className="db-ai-chip">Auditing: {aiName}</span>}
        </div>
        <div className="db-nav-r">
          <button className="db-nbtn" onClick={() => navigate("/profile")}>Profile</button>
          <button className="db-nbtn red" onClick={handleLogout}>Sign Out</button>
        </div>
      </div>

      <div className="db-body">
        <div className="db-page-title">Audit Pipeline</div>
        <div className="db-page-sub">Complete each step to run a full KPMG Trusted AI Framework governance evaluation on your AI system.</div>

        <div className="db-steps">

          {/* ── STEP 1: BLACK BOX ── */}
          <div className="db-step">
            <div className="db-step-left">
              <div className={`db-step-num ${stepNum(bbDone, true)}`}>{bbDone?"✓":"1"}</div>
              <div className={`db-step-line ${bbDone?"done":""}`} />
            </div>
            <div className="db-step-body">
              <div className={`db-step-eyebrow ${stepNum(bbDone, true)}`}>Step 1 — Black Box Audit</div>

              {bbDone && bbResult ? (
                <BlackBoxSummary result={bbResult} tab={bbTab} onRedo={() => { setBbDone(false); setBbResult(null); }} />
              ) : (
                <div className="db-card active">
                  <div className="db-card-h">Black Box Audit</div>
                  <div className="db-card-d">Connect your AI via API endpoint, deployed URL, or paste a chat history. Governance probes are fired automatically and responses are ingested into the SDCC pipeline.</div>

                  <div className="db-tabs">
                    {(["api","ui","chat"] as const).map(t => (
                      <button key={t} className={`db-tab${bbTab===t?" on":""}`} onClick={() => { setBbTab(t); setBbError(""); }}>
                        {t==="api"?"API Key":t==="ui"?"Deployed URL":"Chat History"}
                      </button>
                    ))}
                  </div>

                  {bbTab==="api" && <>
                    <div className="db-field">
                      <div className="db-lbl">API Endpoint</div>
                      <input className="db-inp" type="url" placeholder="https://api.openai.com/v1/chat/completions" value={bbEndpoint} onChange={e=>setBbEndpoint(e.target.value)} disabled={bbLoading} autoComplete="off" />
                    </div>
                    <div className="db-field">
                      <div className="db-lbl">API Key</div>
                      <input className="db-inp" type="password" placeholder="sk-xxxx…" value={bbApiKey} onChange={e=>setBbApiKey(e.target.value)} disabled={bbLoading} autoComplete="new-password" />
                    </div>
                  </>}

                  {bbTab==="ui" && <>
                    <div className="db-field">
                      <div className="db-lbl">Deployed UI URL</div>
                      <input className="db-inp" type="url" placeholder="https://your-chatbot.vercel.app" value={bbUiUrl} onChange={e=>setBbUiUrl(e.target.value)} disabled={bbLoading} />
                    </div>
                    <div className="db-info">The backend opens a headless browser, navigates to your URL, and runs governance probes automatically. The URL must be publicly accessible.</div>
                  </>}

                  {bbTab==="chat" && <>
                    <div className="db-field">
                      <div className="db-lbl">Source</div>
                      <select className="db-inp" value={bbChatSrc} onChange={e=>setBbChatSrc(e.target.value)} style={{ cursor:"pointer" }}>
                        <option value="chatgpt">ChatGPT</option>
                        <option value="claude">Claude</option>
                        <option value="gemini">Gemini</option>
                        <option value="copilot">Microsoft Copilot</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="db-field">
                      <div className="db-lbl">Paste Chat History</div>
                      <textarea className="db-ta" placeholder={"You\nWhat is the capital of France?\n\nChatGPT\nThe capital of France is Paris."} value={bbChatText} onChange={e=>setBbChatText(e.target.value)} disabled={bbLoading} />
                    </div>
                    <div className="db-info">Open any AI chat, select all the conversation text, copy and paste it here. We'll parse the turns and run a full governance audit.</div>
                  </>}

                  {bbError && <div className="db-err">{bbError}</div>}
                  <button className="db-btn" style={{ marginTop:4 }} onClick={handleBlackBox} disabled={bbLoading}>
                    {bbLoading?(bbTab==="chat"?"Parsing & Ingesting…":"Running Audit…"):(bbTab==="chat"?"Audit Chat History":"Run Black Box Audit")}
                  </button>
                  {bbLoading && bbTab!=="chat" && <>
                    <div className="db-prog"><div className="db-prog-fill" style={{ width:`${progressPct}%` }} /></div>
                    <div className="db-prog-lbl">Probe {bbProgress} of 40 — {progressPct}%</div>
                  </>}
                </div>
              )}
            </div>
          </div>

          {/* ── STEP 2: UPLOAD LOGS ── */}
          <div className="db-step">
            <div className="db-step-left">
              <div className={`db-step-num ${stepNum(logsDone, true)}`}>{logsDone?"✓":"2"}</div>
              <div className={`db-step-line ${logsDone?"done":""}`} />
            </div>
            <div className="db-step-body">
              <div className={`db-step-eyebrow ${stepNum(logsDone, true)}`}>Step 2 — Upload Inference Logs <span style={{ fontWeight:400, letterSpacing:0 }}>(Optional if Black Box ran)</span></div>

              {/* SDCC summary always shown when available */}
              {logsDone && sdccSummary && (
                <SdccSummaryPanel summary={sdccSummary} onRedo={() => { setLogsDone(false); setSdccSummary(null); setFile(null); }} />
              )}

              {/* Upload form — always visible */}
              <div className={`db-card${logsDone?" ":" active"}`} style={{ marginTop: logsDone ? 12 : 0 }}>
                <div className="db-card-h">
                  {logsDone ? "Upload Additional Logs" : "Upload Inference Logs"}
                  {!logsDone && bbDone && <span style={{ fontSize:11, fontWeight:600, color:"#00A3A1", marginLeft:8, background:"#F0FAFA", border:"1px solid #B2E8E6", padding:"2px 8px", borderRadius:100 }}>Auto-ingested from Black Box</span>}
                </div>
                <div className="db-card-d">
                  {bbDone && !logsDone
                    ? "Black Box probe responses were automatically ingested into the SDCC pipeline — you can skip this step and go straight to Step 4. Or upload your own production logs here to replace them."
                    : logsDone
                    ? "You can upload a new or updated log file to replace the current ingestion."
                    : "Upload a CSV of your AI's production inference logs. We'll parse inputs, outputs, latency, and task IDs automatically. No fixed schema required."}
                </div>
                <div className={`db-drop${file?" has":""}`}
                  onClick={() => document.getElementById("log-inp")?.click()}
                  onDragOver={e=>e.preventDefault()}
                  onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)setFile(f);}}>
                  <input id="log-inp" type="file" accept=".csv,.json" style={{ display:"none" }} onChange={e=>{if(e.target.files?.[0])setFile(e.target.files[0]);}} />
                  <div className={`db-drop-t${file?" has":""}`}>{file?file.name:"Click or drag a CSV / JSON file here"}</div>
                </div>
                {ingestError && <div className="db-err">{ingestError}</div>}
                <button className="db-btn" onClick={handleUpload} disabled={ingestLoading||!file}>
                  {ingestLoading?"Ingesting…":"Upload & Ingest"}
                </button>
              </div>
            </div>
          </div>

          {/* ── STEP 3: KNOWLEDGE BASE ── */}
          <div className="db-step">
            <div className="db-step-left">
              <div className={`db-step-num ${stepNum(kbDone, uploaded)}`}>{kbDone?"✓":"3"}</div>
              <div className={`db-step-line ${kbDone?"done":""}`} />
            </div>
            <div className="db-step-body">
              <div className={`db-step-eyebrow ${stepNum(kbDone, uploaded)}`}>Step 3 — Knowledge Base <span style={{ fontWeight:400, letterSpacing:0 }}>(Optional)</span></div>
              <div className={`db-card${uploaded?"":" locked"}`}>
                <div className="db-card-h">Upload Knowledge Base</div>
                <div className="db-card-d">Upload reference documents (PDF, TXT, DOCX, MD) to ground the LLM Judge evaluation against your own material. When provided, the three judges compare AI responses against your KB instead of using only their world knowledge — significantly improving accuracy scoring for RAG and domain-specific systems.</div>
                {kbDone && kbSuccess && (
                  <div className="db-ok" style={{ marginBottom:12 }}>
                    {kbChunks} chunks stored. The LLM Judge will use these as reference during evaluation.
                  </div>
                )}
                <div className={`db-drop${kbFiles&&kbFiles.length>0?" has":""}`}
                  onClick={() => document.getElementById("kb-inp")?.click()}
                  onDragOver={e=>e.preventDefault()}
                  onDrop={e=>{e.preventDefault();if(e.dataTransfer.files.length)setKbFiles(e.dataTransfer.files);}}>
                  <input id="kb-inp" type="file" accept=".pdf,.txt,.md,.docx,.csv" multiple style={{ display:"none" }} onChange={e=>{if(e.target.files?.length)setKbFiles(e.target.files);}} />
                  <div className={`db-drop-t${kbFiles&&kbFiles.length>0?" has":""}`}>
                    {kbFiles&&kbFiles.length>0?`${kbFiles.length} file${kbFiles.length>1?"s":""} selected`:"Click or drag files here (PDF, TXT, DOCX, MD)"}
                  </div>
                </div>
                {kbError && <div className="db-err">{kbError}</div>}
                <button className="db-btn teal" onClick={handleKb} disabled={kbLoading||!kbFiles?.length}>
                  {kbLoading?"Uploading…":"Upload Knowledge Base"}
                </button>
              </div>
            </div>
          </div>

          {/* ── STEP 4: EVALUATE ── */}
          <div className="db-step">
            <div className="db-step-left">
              <div className={`db-step-num ${uploaded?"active":""}`}>4</div>
            </div>
            <div className="db-step-body">
              <div className={`db-step-eyebrow ${uploaded?"active":""}`}>Step 4 — Run Full Evaluation</div>
              <div className={`db-card${uploaded?"":" locked"}`}>
                <div className="db-card-h">Run Full Governance Evaluation</div>
                <div className="db-card-d">
                  Runs the complete KPMG TAF pipeline: SDCC structural analysis → Triple LLM Judge accuracy scoring → 10-principle TAF scoring → risk classification → compliance mapping → PDF report generation. This is the final step.
                </div>

                {uploaded && sdccSummary && (
                  <div className="db-checklist">
                    <div className="db-check-row">
                      <span className="db-check-k">Inference logs</span>
                      <span className="db-check-v green">{sdccSummary.logs_ingested.toLocaleString()} rows ready</span>
                    </div>
                    <div className="db-check-row">
                      <span className="db-check-k">Model type detected</span>
                      <span className="db-check-v">{sdccSummary.model_type?.replace(/_/g," ")||"Auto-detect"}</span>
                    </div>
                    <div className="db-check-row">
                      <span className="db-check-k">Data quality</span>
                      <span className={`db-check-v ${sdccSummary.data_quality_score>=70?"green":"red"}`}>{sdccSummary.data_quality_score}%</span>
                    </div>
                    <div className="db-check-row">
                      <span className="db-check-k">Knowledge base</span>
                      <span className={`db-check-v ${kbDone?"green":""}`}>{kbDone?`${kbChunks} chunks loaded`:"Not uploaded (optional)"}</span>
                    </div>
                  </div>
                )}

                {!uploaded && <div className="db-info">Complete Step 1 (Black Box Audit) to auto-ingest logs and enable evaluation — or upload your own logs in Step 2.</div>}
                {uploaded && !sdccSummary && bbDone && (
                  <div className="db-info" style={{ marginBottom:16 }}>Black Box probe responses were auto-ingested. You're ready to run the full evaluation.</div>
                )}
                {evalError && <div className="db-err">{evalError}</div>}
                {computationNotes && (
                  <div className="db-ok" style={{ marginBottom:12 }}>
                    {Object.values(computationNotes).filter((n:any)=>n.status==="computed").length} metrics computed successfully.
                  </div>
                )}

                <button className="db-btn big" onClick={handleEvaluate} disabled={!uploaded||evalLoading}>
                  {evalLoading?"Generating Report…":"Run Full Governance Evaluation →"}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}