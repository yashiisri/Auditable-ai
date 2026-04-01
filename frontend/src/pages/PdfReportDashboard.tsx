import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface PdfFinding {
  category: string;
  severity: string;
  issue: string;
  recommendation: string;
}

interface PdfReport {
  ai_name?: string;
  overall_score?: number;
  risk_level?: string;
  model_type?: string;
  evaluated_at?: string;
  findings?: PdfFinding[];
  framework_compliance?: Record<string, string>;
  trusted_ai_principles?: Record<string, { score: number }>;
  recommendation?: string;
  source: "pdf_upload";
}

const KPMG = "#00338D";
const KPMG_MID = "#005EB8";
const KPMG_LT = "#0091DA";

function bandColor(s: number) { return s >= 75 ? "#059669" : s >= 50 ? KPMG_MID : "#DC2626"; }
function bandBg(s: number) { return s >= 75 ? "#DCFCE7" : s >= 50 ? "#E6F2FB" : "#FEE2E2"; }
function band(s: number) { return s >= 75 ? "Strong" : s >= 50 ? "Watch" : "Critical"; }

export default function PdfReportDashboard() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<PdfReport | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f: File) => {
    if (!f.name.endsWith(".pdf") && !f.name.endsWith(".json")) {
      setError("Please upload a PDF or JSON report file.");
      return;
    }
    setFile(f);
    setError("");
  };

  const handleParse = async () => {
    if (!file) return;
    setLoading(true);
    setError("");

    try {
      if (file.name.endsWith(".json")) {
        const text = await file.text();
        const data = JSON.parse(text);
        setReport({ ...data, source: "pdf_upload" });
      } else {
        // PDF: extract basic metadata from filename and show structured view
        // In production this would call a backend PDF parser
        const mockReport: PdfReport = {
          ai_name: file.name.replace(".pdf", "").replace(/_/g, " "),
          overall_score: undefined,
          risk_level: "Unknown",
          model_type: "Uploaded Report",
          evaluated_at: new Date().toISOString(),
          findings: [],
          framework_compliance: {},
          trusted_ai_principles: {},
          recommendation: "PDF parsing requires backend processing. Upload a JSON report for full dashboard view, or use the platform's built-in audit tools to generate a structured report.",
          source: "pdf_upload",
        };
        setReport(mockReport);
      }
    } catch {
      setError("Could not parse the file. Ensure it is a valid JSON report or PDF.");
    } finally {
      setLoading(false);
    }
  };

  const prn = report?.trusted_ai_principles || {};
  const pkeys = Object.keys(prn);

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1E293B", paddingBottom: 80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .card { background: white; border-radius: 20px; border: 1px solid #E2E8F0; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .hover-lift { transition: transform 0.2s, box-shadow 0.2s; }
        .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important; }
      `}</style>

      {/* NAV */}
      <div style={{ background: "white", borderBottom: "1px solid #E2E8F0", padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, boxShadow: "0 1px 8px rgba(0,0,0,0.06)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.03em", background: `linear-gradient(135deg, ${KPMG}, ${KPMG_MID})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Auditable AI™</span>
          <div style={{ width: 1, height: 20, background: "#E2E8F0" }} />
          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", background: "#E6F2FB", color: KPMG_MID, borderRadius: 20, border: `1px solid ${KPMG_LT}40` }}>PDF Report Dashboard</span>
        </div>
        <button style={{ padding: "8px 20px", background: "white", border: "1px solid #E2E8F0", color: "#64748B", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          onClick={() => navigate("/dashboard")}>← Dashboard</button>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* UPLOAD CARD */}
        {!report && (
          <div className="card" style={{ padding: "48px", textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1E293B", marginBottom: 8 }}>Upload Audit Report</h1>
            <p style={{ color: "#64748B", fontSize: 14, marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
              Upload a JSON report generated by this platform, or a PDF audit report. JSON files will render a full interactive dashboard.
            </p>

            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              style={{
                border: `2px dashed ${dragOver ? KPMG_MID : "#E2E8F0"}`,
                borderRadius: 16, padding: "40px 24px", marginBottom: 20,
                background: dragOver ? "#E6F2FB" : "#F8FAFC",
                transition: "all 0.2s", cursor: "pointer",
              }}
              onClick={() => document.getElementById("pdf-file-input")?.click()}
            >
              <div style={{ fontSize: 32, marginBottom: 10 }}>⬆</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                {file ? file.name : "Drop your report here or click to browse"}
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8" }}>Supports .json and .pdf</div>
              <input id="pdf-file-input" type="file" accept=".pdf,.json" style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>

            {error && <div style={{ padding: "10px 16px", background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 10, color: "#DC2626", fontSize: 13, marginBottom: 16 }}>{error}</div>}

            <button
              disabled={!file || loading}
              onClick={handleParse}
              style={{ padding: "14px 40px", background: `linear-gradient(135deg, ${KPMG}, ${KPMG_MID})`, border: "none", borderRadius: 12, color: "white", fontWeight: 700, fontSize: 15, cursor: file ? "pointer" : "not-allowed", opacity: file ? 1 : 0.5, boxShadow: `0 6px 20px ${KPMG}30`, transition: "all 0.2s" }}
            >
              {loading ? "Parsing…" : "Load Report →"}
            </button>
          </div>
        )}

        {/* REPORT DASHBOARD */}
        {report && (
          <>
            {/* HEADER */}
            <div className="card" style={{ padding: "32px 36px", marginBottom: 24, background: `linear-gradient(135deg, ${KPMG} 0%, ${KPMG_MID} 50%, ${KPMG_LT} 100%)`, border: "none", color: "white" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 24 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>Uploaded Report</div>
                  <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", marginBottom: 10 }}>{report.ai_name || "Audit Report"}</h1>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
                    {report.model_type && <span>🧠 {report.model_type}</span>}
                    {report.evaluated_at && <span>📅 {new Date(report.evaluated_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>}
                    <span>📄 {file?.name}</span>
                  </div>
                </div>
                {report.overall_score !== undefined && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1, color: "white", letterSpacing: "-0.04em" }}>{report.overall_score}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>/ 100 Overall</div>
                    {report.risk_level && (
                      <div style={{ marginTop: 10, display: "inline-block", padding: "5px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: bandBg(report.overall_score), color: bandColor(report.overall_score), border: `1px solid ${bandColor(report.overall_score)}40` }}>
                        {report.risk_level} Risk
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* PRINCIPLES */}
            {pkeys.length > 0 && (
              <div className="card" style={{ padding: "32px", marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Trusted AI Principles</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                  {pkeys.map(k => {
                    const sc = prn[k].score;
                    return (
                      <div key={k} className="hover-lift" style={{ padding: "16px", borderRadius: 14, background: bandBg(sc), border: `1px solid ${bandColor(sc)}20` }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 8 }}>{k}</div>
                        <div style={{ height: 6, background: "#E2E8F0", borderRadius: 99, marginBottom: 8 }}>
                          <div style={{ width: `${sc}%`, height: "100%", background: bandColor(sc), borderRadius: 99 }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 22, fontWeight: 900, color: bandColor(sc) }}>{sc}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "white", color: bandColor(sc), border: `1px solid ${bandColor(sc)}30`, textTransform: "uppercase" }}>{band(sc)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FRAMEWORK COMPLIANCE */}
            {Object.keys(report.framework_compliance || {}).length > 0 && (
              <div className="card" style={{ padding: "32px", marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Framework Compliance</h2>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  {Object.entries(report.framework_compliance!).map(([key, status]) => {
                    const sc = status === "Compliant" || status === "Certified Ready" || status === "Aligned" ? "#059669" : status === "Conditional" ? KPMG_MID : "#DC2626";
                    const scBg = sc === "#059669" ? "#DCFCE7" : sc === KPMG_MID ? "#E6F2FB" : "#FEE2E2";
                    return (
                      <div key={key} className="hover-lift" style={{ padding: "16px 20px", borderRadius: 14, background: scBg, border: `1px solid ${sc}25`, minWidth: 160, textAlign: "center" }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#1E293B", marginBottom: 6 }}>{key.replace(/_/g, " ")}</div>
                        <div style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: sc, background: "white", border: `1px solid ${sc}40` }}>{status}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FINDINGS */}
            {(report.findings?.length || 0) > 0 && (
              <div className="card" style={{ padding: "32px", marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Audit Findings <span style={{ fontSize: 16, fontWeight: 700, color: "#DC2626", background: "#FEE2E2", padding: "2px 10px", borderRadius: 20, marginLeft: 8 }}>{report.findings!.length}</span></h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {report.findings!.map((f, i) => {
                    const sc = f.severity === "High" ? "#DC2626" : f.severity === "Medium" ? KPMG_MID : "#059669";
                    const scBg = f.severity === "High" ? "#FEE2E2" : f.severity === "Medium" ? "#E6F2FB" : "#DCFCE7";
                    return (
                      <div key={i} style={{ borderRadius: 14, background: "white", border: `1.5px solid ${sc}20`, overflow: "hidden" }}>
                        <div style={{ padding: "12px 18px", background: scBg, borderBottom: `1px solid ${sc}15`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: "#1E293B" }}>{f.category}</span>
                          <span style={{ color: sc, fontWeight: 700, background: "white", padding: "3px 12px", borderRadius: 20, fontSize: 11, border: `1px solid ${sc}30` }}>{f.severity}</span>
                        </div>
                        <div style={{ padding: "14px 18px" }}>
                          <p style={{ margin: "0 0 10px", color: "#1E293B", fontSize: 13, lineHeight: 1.6 }}>{f.issue}</p>
                          <div style={{ padding: "10px 14px", borderRadius: 8, background: "#E6F2FB", border: `1px solid ${KPMG_LT}30` }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: KPMG_MID, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Recommendation</div>
                            <p style={{ margin: 0, color: KPMG, fontSize: 12, lineHeight: 1.6 }}>{f.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RECOMMENDATION */}
            {report.recommendation && (
              <div className="card" style={{ padding: "32px", marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Overall Recommendation</h2>
                <div style={{ padding: "18px 22px", background: `linear-gradient(135deg, ${KPMG}08, ${KPMG_MID}05)`, border: `1.5px solid ${KPMG_MID}25`, borderRadius: 14 }}>
                  <p style={{ margin: 0, color: "#1E293B", lineHeight: 1.8, fontSize: 14 }}>{report.recommendation}</p>
                </div>
              </div>
            )}

            {/* ACTIONS */}
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => { setReport(null); setFile(null); }}
                style={{ padding: "12px 28px", background: "white", border: "1.5px solid #E2E8F0", borderRadius: 12, color: "#374151", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                Upload Another Report
              </button>
              <button onClick={() => navigate("/dashboard")}
                style={{ padding: "12px 28px", background: `linear-gradient(135deg, ${KPMG}, ${KPMG_MID})`, border: "none", borderRadius: 12, color: "white", cursor: "pointer", fontSize: 14, fontWeight: 700, boxShadow: `0 6px 20px ${KPMG}30` }}>
                ← Back to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
