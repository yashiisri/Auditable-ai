/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sdccIngest, evaluateAI, runBlackBoxAudit } from "../services/api";

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
  has_input_col?: boolean;
  has_output_col?: boolean;
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

  /* ── Evaluate state ── */
  const [evalLoading, setEvalLoading]         = useState(false);
  const [evalError, setEvalError]             = useState("");
  const [computationNotes, setComputationNotes] = useState<Record<string, ComputationNote> | null>(null);
  const [showNotes, setShowNotes]             = useState(false);

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

    const totalProbes = 14;
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
     EVALUATE HANDLER
  ───────────────────────────────────────────── */
  const handleEvaluate = async () => {
    if (!uploaded) return;
    setEvalLoading(true);
    setEvalError("");
    setComputationNotes(null);
    try {
      const res = await evaluateAI(aiName);
      // Stash computation notes before navigating so user can optionally review
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
  const riskColor = (level: string) =>
    level === "Low" ? "#00C896" : level === "Moderate" ? "#ffb020" : "#ff4d4d";

  const totalProbes = 14;
  const progressPct = Math.round((bbProgress / totalProbes) * 100);

  /* Categorise computation notes */
  const noteEntries = computationNotes
    ? Object.entries(computationNotes).filter(([k]) => k !== "_error")
    : [];
  const computedCount   = noteEntries.filter(([, n]) => n.status === "computed").length;
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
            <button className="profile-btn" onClick={() => navigate("/profile")}>👤 Profile</button>
            <button className="logout-btn" onClick={handleLogout}>Logout →</button>
          </div>
        </div>

        {/* ── ROW 1: Black Box + Ingestion ── */}
        <div className="card-grid">

          {/* BLACK BOX CARD */}
          <div className="glass-card">
            <h2>🛡 Black Box AI Audit</h2>
            <p className="card-desc">
              Connect an external AI system and fire 14 governance probes across
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
                  ℹ UI audits run using secure backend browser automation.
                  Ensure the chatbot URL is publicly accessible.
                </div>
              </>
            )}

            {bbError && <div className="error-inline">{bbError}</div>}

            <button onClick={handleBlackBox} disabled={bbLoading}>
              {bbLoading ? "Probing AI…" : "Run Black Box Audit →"}
            </button>

            {bbLoading && (
              <div className="probe-progress">
                <div className="probe-bar-track">
                  <div className="probe-bar-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <span className="probe-label">
                  Firing probe {bbProgress}/{totalProbes}… ({progressPct}%)
                </span>
              </div>
            )}
          </div>

          {/* INGESTION CARD */}
          <div className="glass-card">
            <h2>📊 Data Ingestion (SDCC)</h2>

            {!aiName && (
              <div className="warn-box">
                ⚠ No AI registered.{" "}
                <span className="link-text" onClick={() => navigate("/register-ai")}>Register one →</span>
              </div>
            )}

            {/* Column hints */}
            <div className="info-box" style={{ fontSize: 12, lineHeight: 1.6 }}>
              <strong style={{ color: "#4AACDF" }}>Required columns:</strong>{" "}
              <code>input</code> (or <code>prompt</code> / <code>query</code>) and{" "}
              <code>output</code> (or <code>response</code> / <code>answer</code>).{" "}
              Optional: <code>reference</code>, <code>context</code>, <code>label</code>, <code>confidence</code>, <code>latency</code>.
              The model type is auto-detected from your data content.
            </div>

            <p className="toggle-desc">SDCC structural analysis + metric computation pipeline</p>

            <label>Select File (.csv or .json)</label>
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
              <div className="success-message">✅ Ingested {logsCount} records successfully.</div>
            )}
            {ingestError && <div className="error-inline">{ingestError}</div>}

            {/* Column warnings from backend */}
            {sdccSummary?.column_warnings && sdccSummary.column_warnings.length > 0 && (
              <div className="warn-box" style={{ marginTop: 4 }}>
                {sdccSummary.column_warnings.map((w, i) => (
                  <div key={i} style={{ marginBottom: i < sdccSummary.column_warnings!.length - 1 ? 6 : 0 }}>
                    ⚠ {w}
                  </div>
                ))}
              </div>
            )}

            {/* Input/output column status */}
            {sdccSummary && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span className={`col-badge ${sdccSummary.has_input_col ? "col-ok" : "col-warn"}`}>
                  {sdccSummary.has_input_col ? "✓" : "✗"} input col
                </span>
                <span className={`col-badge ${sdccSummary.has_output_col ? "col-ok" : "col-warn"}`}>
                  {sdccSummary.has_output_col ? "✓" : "✗"} output col
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── BLACK BOX RESULT SUMMARY ── */}
        {bbResult && bbResult.status !== "manual_required" && (
          <div className="glass-card sdcc-enterprise" style={{ marginBottom: "36px", animation: "fadeInUp 0.5s ease forwards" }}>
            <h2>🔍 Black Box Structural Summary</h2>
            <div className="sdcc-grid">
              <div className="metric-card">
                <span>Probes Run</span>
                <strong>{bbResult.probes_run}</strong>
              </div>
              <div className="metric-card">
                <span>Overall Score</span>
                <strong style={{ color: riskColor(bbResult.risk_level) }}>
                  {bbResult.overall_score}%
                </strong>
              </div>
              <div className="metric-card">
                <span>Findings</span>
                <strong style={{ color: bbResult.findings.length === 0 ? "#00C896" : "#ff4d4d" }}>
                  {bbResult.findings.length}
                </strong>
              </div>
              <div className={`metric-card risk-${bbResult.risk_level.toLowerCase()}`}>
                <span>Risk Level</span>
                <strong>{bbResult.risk_level}</strong>
              </div>
            </div>
            <div className="sdcc-recommendation">
              💡 {bbResult.findings.length === 0
                ? "All governance probes passed. AI system aligns with Trusted AI principles."
                : `${bbResult.findings.length} governance violation(s) detected across ${[...new Set(bbResult.findings.map((f: BlackBoxFinding) => f.category))].join(", ")}.`
              }
            </div>
          </div>
        )}

        {bbResult && bbResult.status === "manual_required" && (
          <div className="glass-card" style={{ marginBottom: "36px", borderColor: "rgba(255,176,32,0.3)" }}>
            <h2>🖥 UI Mode — Manual Review Required</h2>
            <p style={{ color: "#9DBFE0", fontSize: "14px", lineHeight: "1.6" }}>{bbResult.message}</p>
          </div>
        )}

        {/* ── SDCC SUMMARY ── */}
        {sdccSummary && (
          <div className="glass-card sdcc-enterprise">
            <h2>📈 SDCC Structural Summary</h2>
            <div className="sdcc-grid">
              <div className="metric-card">
                <span>Model Type</span>
                <strong>{sdccSummary.model_type}</strong>
              </div>
              <div className="metric-card">
                <span>Logs</span>
                <strong>{sdccSummary.logs_ingested}</strong>
              </div>
              <div className="metric-card">
                <span>Data Quality</span>
                <strong>{sdccSummary.data_quality_score}%</strong>
              </div>
              <div className={`metric-card risk-${sdccSummary.structural_risk?.toLowerCase()}`}>
                <span>Structural Risk</span>
                <strong>{sdccSummary.structural_risk}</strong>
              </div>
              {sdccSummary.detection_confidence !== undefined && (
                <div className="metric-card">
                  <span>Detection Confidence</span>
                  <strong>{Math.round(sdccSummary.detection_confidence * 100)}%</strong>
                </div>
              )}
            </div>
            {sdccSummary.recommendation && (
              <div className="sdcc-recommendation">💡 {sdccSummary.recommendation}</div>
            )}
          </div>
        )}

        {/* ── COMPUTATION NOTES (shown after evaluate returns) ── */}
        {computationNotes && noteEntries.length > 0 && (
          <div className="glass-card sdcc-enterprise" style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>🔬 Metric Computation Summary</h2>
              <button
                className="toggle-notes-btn"
                onClick={() => setShowNotes((v) => !v)}
              >
                {showNotes ? "Hide details ▲" : "Show details ▼"}
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
                💡 {unavailableCount} metric(s) couldn't be computed — missing required columns.
                Add <code>reference</code>, <code>context</code>, <code>label</code>, or <code>confidence</code> columns to enable them.
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
                      {note.status === "computed" ? "✓ computed" : "✗ unavailable"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── RUN FULL EVALUATION ── */}
        <div className="center" style={{ marginTop: "40px" }}>
          <button className="run-btn" onClick={handleEvaluate} disabled={!uploaded || evalLoading}>
            {evalLoading ? "Computing metrics & evaluating…" : "Run Full Evaluation →"}
          </button>
          {evalLoading && (
            <p className="hint-text" style={{ marginTop: 12 }}>
              Computing ROUGE, BLEU, BERTScore, faithfulness, toxicity and other metrics from your data…
            </p>
          )}
          {!uploaded && <p className="hint-text">Upload logs above to enable evaluation</p>}
          {evalError && <div className="error-inline" style={{ marginTop: "16px" }}>{evalError}</div>}
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CSS
───────────────────────────────────────────── */
// const CSS = `
// @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

// * { box-sizing: border-box; }

// .hero {
//   min-height: 100vh;
//   background: #F4F7FB;   /* LIGHT THEME */
//   display: flex;
//   justify-content: center;
//   padding: 40px 20px;
//   font-family: 'Inter', sans-serif;
//   color: #0B1F33;
// }

// .hero-content { width: 100%; max-width: 1200px; }

// .top-bar {
//   display: flex; justify-content: space-between; align-items: center;
//   margin-bottom: 36px; padding-bottom: 20px;
//   border-bottom: 1px solid rgba(0,145,218,0.2);
// }
// .top-bar-left { display: flex; align-items: center; gap: 16px; }
// .brand-title {
//   font-size: 26px; font-weight: 800; margin: 0;
//   background: linear-gradient(90deg, #00C896, #0091DA);
//   -webkit-background-clip: text; -webkit-text-fill-color: transparent;
// }
// .ai-pill {
//   background: rgba(0,145,218,0.15); border: 1px solid rgba(0,145,218,0.35);
//   border-radius: 20px; padding: 4px 14px; font-size: 13px; color: #4AACDF;
// }
// .profile-btn {
//   padding: 10px 22px; border-radius: 10px;
//   border: 1px solid rgba(0,145,218,0.35); background: rgba(0,145,218,0.08);
//   color: #4AACDF; font-weight: 600; font-size: 14px; cursor: pointer;
//   transition: all 0.25s;
// }
// .profile-btn:hover { background: rgba(0,145,218,0.18); transform: translateY(-2px); }
// .logout-btn {
//   padding: 10px 22px; border-radius: 10px;
//   border: 1px solid rgba(255,77,77,0.35); background: rgba(255,77,77,0.08);
//   color: #ff8787; font-weight: 600; font-size: 14px; cursor: pointer;
//   transition: all 0.25s;
// }
// .logout-btn:hover { background: rgba(255,77,77,0.18); transform: translateY(-2px); }

// .card-grid {
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
//   gap: 36px; margin-bottom: 36px;
// }

// .glass-card {
//   background: linear-gradient(135deg, rgba(10,30,66,0.82), rgba(7,21,48,0.75));
//   backdrop-filter: blur(20px);
//   border: 1px solid rgba(0,145,218,0.28);
//   border-radius: 20px; padding: 36px;
//   display: flex; flex-direction: column; gap: 14px;
//   box-shadow: 0 10px 30px rgba(0,0,0,0.35);
//   transition: all 0.3s;
// }
// .glass-card:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(0,145,218,0.2); }
// .glass-card h2 { font-size: 22px; font-weight: 700; color: #EAF2FB; margin: 0; }
// .card-desc { font-size: 13px; color: #9DBFE0; line-height: 1.55; margin: 0; }

// .glass-card label {
//   font-size: 12px; font-weight: 600; color: #4AACDF;
//   text-transform: uppercase; letter-spacing: 0.6px; display: block; margin-bottom: -6px;
// }
// .glass-card input {
//   padding: 13px 16px; border-radius: 10px;
//   border: 1px solid rgba(0,145,218,0.35);
//   background: rgba(3,12,30,0.65); color: #EAF2FB; font-size: 15px;
//   transition: all 0.2s; width: 100%;
// }
// .glass-card input:focus {
//   border-color: #00C896; box-shadow: 0 0 0 3px rgba(0,200,150,0.18); outline: none;
// }
// .glass-card button {
//   padding: 14px; border-radius: 10px; border: none;
//   background: linear-gradient(135deg, #0091DA, #00C896);
//   color: #fff; font-weight: 600; font-size: 15px; cursor: pointer;
//   transition: all 0.3s; margin-top: 4px;
// }
// .glass-card button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,200,150,0.35); }
// .glass-card button:disabled { opacity: 0.5; cursor: not-allowed; }

// .toggle-container { display: flex; align-items: center; justify-content: space-between; }
// .toggle-label { font-size: 15px; font-weight: 600; color: #EAF2FB; }
// .toggle-switch {
//   width: 54px; height: 28px; background: rgba(10,30,66,0.9);
//   border-radius: 14px; position: relative; cursor: pointer;
//   border: 1px solid rgba(0,145,218,0.35);
// }
// .toggle-knob {
//   width: 24px; height: 24px; border-radius: 50%;
//   background: linear-gradient(135deg, #fff, #D8E8F5);
//   position: absolute; top: 1px; transition: all 0.25s;
//   box-shadow: 0 2px 6px rgba(0,0,0,0.25);
// }
// .toggle-knob.off { left: 2px; }
// .toggle-knob.on { left: 28px; background: linear-gradient(135deg, #00C896, #0091DA); }
// .toggle-desc { font-size: 13px; color: #9DBFE0; font-style: italic; }

// .info-box {
//   padding: 10px 14px; background: rgba(0,145,218,0.08);
//   border: 1px solid rgba(0,145,218,0.25); border-radius: 10px;
//   font-size: 13px; color: #9DBFE0; line-height: 1.5;
// }
// .info-box code {
//   background: rgba(0,145,218,0.2); border-radius: 4px; padding: 1px 5px;
//   font-size: 11px; color: #4AACDF; font-family: 'IBM Plex Mono', monospace;
// }
// .warn-box {
//   padding: 10px 14px; background: rgba(255,176,32,0.1);
//   border: 1px solid rgba(255,176,32,0.3); border-radius: 10px;
//   font-size: 13px; color: #ffb020;
// }
// .link-text { cursor: pointer; text-decoration: underline; font-weight: 600; }
// .error-inline {
//   padding: 10px 14px; background: rgba(239,68,68,0.1);
//   border: 1px solid rgba(239,68,68,0.3); border-radius: 10px;
//   font-size: 13px; color: #ff8787;
// }
// .success-message {
//   padding: 12px 16px; background: rgba(0,200,150,0.12);
//   border: 1px solid rgba(0,200,150,0.3); border-radius: 10px;
//   color: #00E5AB; font-size: 14px; text-align: center;
// }

// /* Column status badges */
// .col-badge {
//   font-size: 11px; font-weight: 600; padding: 4px 10px;
//   border-radius: 20px;
// }
// .col-ok   { background: rgba(0,200,150,0.12); border: 1px solid rgba(0,200,150,0.3);  color: #00C896; }
// .col-warn { background: rgba(255,176,32,0.12); border: 1px solid rgba(255,176,32,0.3); color: #ffb020; }

// .probe-progress { display: flex; flex-direction: column; gap: 6px; }
// .probe-bar-track {
//   height: 6px; background: rgba(255,255,255,0.08);
//   border-radius: 3px; overflow: hidden;
// }
// .probe-bar-fill {
//   height: 100%;
//   background: linear-gradient(90deg, #0091DA, #00C896);
//   border-radius: 3px; transition: width 0.35s ease;
// }
// .probe-label { font-size: 12px; color: #9DBFE0; font-style: italic; }

// .sdcc-enterprise { border-color: rgba(0,200,150,0.3); margin-bottom: 36px; }
// .sdcc-grid {
//   display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 14px;
// }
// .metric-card {
//   background: rgba(0,145,218,0.07); padding: 16px; border-radius: 12px;
//   text-align: center; border: 1px solid transparent; transition: 0.3s;
// }
// .metric-card span { font-size: 12px; color: #9DBFE0; text-transform: uppercase; letter-spacing: 0.5px; }
// .metric-card strong { font-size: 20px; display: block; margin-top: 6px; color: #EAF2FB; }
// .risk-low { border-color: rgba(0,200,150,0.4); }
// .risk-moderate { border-color: rgba(255,176,32,0.4); }
// .risk-high { border-color: rgba(255,77,77,0.4); }
// .sdcc-recommendation {
//   padding: 12px 16px; background: rgba(0,200,150,0.07);
//   border-left: 4px solid #00C896; border-radius: 10px;
//   font-size: 14px; color: #D8E8F5;
// }

// /* Computation notes */
// .toggle-notes-btn {
//   background: rgba(0,145,218,0.12); border: 1px solid rgba(0,145,218,0.3);
//   color: #4AACDF; padding: 6px 14px; border-radius: 8px; cursor: pointer;
//   font-size: 12px; font-weight: 600; font-family: 'IBM Plex Sans', sans-serif;
//   transition: 0.2s;
// }
// .toggle-notes-btn:hover { background: rgba(0,145,218,0.22); }

// .notes-grid {
//   display: grid;
//   grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
//   gap: 10px;
// }
// .note-card {
//   padding: 14px; border-radius: 12px;
//   border: 1px solid transparent;
//   background: rgba(255,255,255,0.04);
// }
// .note-ok   { border-color: rgba(0,200,150,0.25); }
// .note-miss { border-color: rgba(255,176,32,0.2); }
// .note-key  { font-size: 11px; color: #9DBFE0; text-transform: capitalize; margin-bottom: 4px; }
// .note-val  { font-size: 20px; font-weight: 800; color: #EAF2FB; margin-bottom: 4px; }
// .note-lib  { font-size: 10px; color: rgba(255,255,255,0.35); margin-bottom: 6px; line-height: 1.4; }
// .note-status { font-size: 11px; font-weight: 600; }
// .note-status.ok   { color: #00C896; }
// .note-status.miss { color: #ffb020; }

// .center { text-align: center; }
// .run-btn {
//   padding: 18px 60px; font-size: 17px; border-radius: 50px; border: none;
//   background: linear-gradient(135deg, #0091DA, #00C896);
//   color: #fff; font-weight: 700; cursor: pointer; transition: all 0.3s;
//   box-shadow: 0 6px 20px rgba(0,145,218,0.25);
// }
// .run-btn:hover:not(:disabled) { transform: scale(1.04); box-shadow: 0 12px 40px rgba(0,200,150,0.4); }
// .run-btn:disabled { opacity: 0.5; cursor: not-allowed; }
// .hint-text { margin-top: 10px; font-size: 13px; color: #9DBFE0; font-style: italic; }

// @keyframes fadeInUp {
//   from { opacity: 0; transform: translateY(20px); }
//   to { opacity: 1; transform: translateY(0); }
// }
// `;

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

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

.hero-content {
  width: 100%;
  max-width: 1200px;
}

/* TOP BAR */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 36px;
  padding-bottom: 20px;
  border-bottom: 1px solid #E3EAF3;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.brand-title {
  font-size: 26px;
  font-weight: 800;
  margin: 0;
  color: #00338D;
}

.ai-pill {
  background: #E6F2FB;
  border: 1px solid #D6E6FF;
  border-radius: 20px;
  padding: 4px 14px;
  font-size: 13px;
  color: #005EB8;
}

/* BUTTONS */
.profile-btn {
  padding: 10px 22px;
  border-radius: 10px;
  border: 1px solid #D6E6FF;
  background: #F8FBFF;
  color: #005EB8;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: 0.25s;
}

.profile-btn:hover {
  transform: translateY(-2px);
  background: #EEF4FF;
}

.logout-btn {
  padding: 10px 22px;
  border-radius: 10px;
  border: 1px solid #FFD6D6;
  background: #FFF5F5;
  color: #E5484D;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: 0.25s;
}

.logout-btn:hover {
  transform: translateY(-2px);
}

/* GRID */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 28px;
  margin-bottom: 36px;
}

/* 🔥 FIXED CARD */
.glass-card {
  background: #FFFFFF;
  border-radius: 18px;
  padding: 32px;
  border: 1px solid #E3EAF3;
  box-shadow: 0 12px 30px rgba(0,0,0,0.06);

  display: flex;
  flex-direction: column;
  gap: 14px;

  transition: all 0.3s ease;
}

.glass-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 50px rgba(0,51,141,0.12);
}

.glass-card h2 {
  font-size: 20px;
  font-weight: 700;
  color: #0B1F33;
}

.card-desc {
  font-size: 13px;
  color: #6B7C93;
}

/* INPUTS */
.glass-card label {
  font-size: 12px;
  font-weight: 600;
  color: #005EB8;
}

.glass-card input {
  padding: 13px 16px;
  border-radius: 10px;
  border: 1px solid #E3EAF3;
  background: #FFFFFF;
  color: #0B1F33;
  font-size: 14px;
}

.glass-card input:focus {
  border-color: #005EB8;
  box-shadow: 0 0 0 3px rgba(0,94,184,0.15);
  outline: none;
}

/* BUTTON */
.glass-card button {
  padding: 14px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #00338D, #005EB8);
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: 0.25s;
}

.glass-card button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0,51,141,0.25);
}

.glass-card button:disabled {
  opacity: 0.5;
}

/* TOGGLE */
.toggle-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toggle-label {
  font-size: 14px;
  font-weight: 600;
  color: #0B1F33;
}

.toggle-switch {
  width: 50px;
  height: 26px;
  background: #E3EAF3;
  border-radius: 13px;
  position: relative;
  cursor: pointer;
}

.toggle-knob {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: white;
  position: absolute;
  top: 2px;
  transition: 0.25s;
}

.toggle-knob.off { left: 2px; }
.toggle-knob.on  { left: 26px; background: #005EB8; }

.toggle-desc {
  font-size: 12px;
  color: #6B7C93;
}

/* INFO BOX */
.info-box {
  padding: 10px 14px;
  background: #F0F6FF;
  border: 1px solid #D6E6FF;
  border-radius: 10px;
  font-size: 13px;
  color: #005EB8;
}

/* STATES */
.error-inline {
  background: #FFF1F1;
  border: 1px solid #FFD6D6;
  color: #E5484D;
  padding: 10px;
  border-radius: 10px;
}

.success-message {
  background: #E6FFF6;
  border: 1px solid #B2F2D7;
  color: #00A86B;
  padding: 10px;
  border-radius: 10px;
}

/* RUN BUTTON */
.center {
  text-align: center;
}

.run-btn {
  padding: 16px 50px;
  border-radius: 40px;
  border: none;
  background: linear-gradient(135deg, #00338D, #005EB8);
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: 0.3s;
}

.run-btn:hover {
  transform: scale(1.04);
  box-shadow: 0 12px 30px rgba(0,51,141,0.25);
}

.hint-text {
  margin-top: 10px;
  font-size: 13px;
  color: #6B7C93;
}`