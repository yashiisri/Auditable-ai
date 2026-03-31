import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { sdccIngest } from "../services/api";

const FIELD_WEIGHTS: Record<string, number> = {
  aiName: 10, useCase: 10, audience: 10,
  hasPolicy: 15, safetyControls: 20, incidentProcess: 15,
  biasTesting: 10, disclosed: 10,
};

export default function SelfReportPage() {
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState("");
  const [showJson, setShowJson] = useState(false);

  const aiName = localStorage.getItem("activeAI") || "enterprise-ai";

  const [form, setForm] = useState({
    aiName:          "",
    useCase:         "",
    audience:        "",
    hasPolicy:       "",
    safetyControls:  "",
    incidentProcess: "",
    biasTesting:     "",
    disclosed:       "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  /* ── Live completeness ── */
  const completeness = useMemo(() => {
    let score = 0;
    for (const [key, weight] of Object.entries(FIELD_WEIGHTS)) {
      if (form[key as keyof typeof form]?.trim()) score += weight;
    }
    return score;
  }, [form]);

  /* ── Live JSON ── */
  const reportJson = useMemo(() => ({
    report_type:      "enterprise_self_attestation",
    schema_version:   "1.0",
    generated_at:     new Date().toISOString(),
    completeness_pct: completeness,
    ai_profile: {
      name:     form.aiName   || null,
      use_case: form.useCase  || null,
      audience: form.audience || null,
    },
    governance: {
      written_policy:   form.hasPolicy       || null,
      safety_controls:  form.safetyControls  || null,
      incident_process: form.incidentProcess || null,
    },
    fairness: {
      bias_testing: form.biasTesting || null,
      disclosed:    form.disclosed   || null,
    },
  }), [form, completeness]);

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (completeness < 40) {
      setError("Please fill in at least a few more fields before submitting.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const blob = new Blob([JSON.stringify(reportJson, null, 2)], { type: "application/json" });
      const file = new File([blob], "self_report.json", { type: "application/json" });
      const res  = await sdccIngest(form.aiName || aiName, file);

      /* Write to localStorage → Dashboard reads on mount */
      localStorage.setItem("uploaded",    "true");
      localStorage.setItem("sdccSummary", JSON.stringify(res.data));

      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2200);
    } catch {
      setError("Submission failed — please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor =
    completeness >= 80 ? "#10B981" :
    completeness >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F4F7FB",
      display: "flex",
      justifyContent: "center",
      padding: "40px 20px 80px",
      fontFamily: "'Inter', sans-serif",
      color: "#0B1F33",
    }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }

        .sr-card {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 32px;
          border: 1px solid #E3EAF3;
          box-shadow: 0 8px 24px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
          transition: box-shadow 0.3s, transform 0.3s;
        }
        .sr-card:hover {
          box-shadow: 0 16px 44px rgba(0,51,141,0.09);
          transform: translateY(-2px);
        }
        .sr-card h2 {
          font-size: 17px;
          font-weight: 700;
          color: #0B1F33;
          margin: 0;
        }
        .sr-label {
          font-size: 11.5px;
          font-weight: 600;
          color: #005EB8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: block;
          margin-bottom: 6px;
        }
        .sr-input, .sr-select, .sr-textarea {
          width: 100%;
          padding: 12px 15px;
          border-radius: 10px;
          border: 1.5px solid #E3EAF3;
          background: #FAFBFD;
          color: #0B1F33;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          outline: none;
        }
        .sr-select {
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748B' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          background-color: #FAFBFD;
          padding-right: 36px;
          cursor: pointer;
        }
        .sr-textarea {
          resize: vertical;
          min-height: 90px;
          line-height: 1.6;
        }
        .sr-input:focus, .sr-select:focus, .sr-textarea:focus {
          border-color: #005EB8;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(0,94,184,0.12);
        }
        .sr-input::placeholder, .sr-textarea::placeholder { color: #B0BEC9; }
        .sr-divider { height: 1px; background: #F1F5F9; margin: 0; }
        .sr-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 560px) { .sr-field-row { grid-template-columns: 1fr; } }

        .json-box {
          background: #0B1120;
          border-radius: 12px;
          padding: 20px;
          font-family: 'Fira Code', 'IBM Plex Mono', monospace;
          font-size: 12px;
          line-height: 1.75;
          max-height: 280px;
          overflow-y: auto;
          white-space: pre;
          border: 1px solid rgba(125,211,252,0.12);
        }
        .progress-track {
          height: 8px;
          background: #E9EFF6;
          border-radius: 99px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 0.5s ease, background 0.5s ease;
        }
        .submit-btn {
          padding: 16px 60px;
          border-radius: 40px;
          border: none;
          background: linear-gradient(135deg, #00338D, #005EB8);
          color: #fff;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: all 0.3s;
          box-shadow: 0 6px 20px rgba(0,51,141,0.25);
        }
        .submit-btn:hover:not(:disabled) {
          transform: scale(1.04);
          box-shadow: 0 12px 32px rgba(0,51,141,0.30);
        }
        .submit-btn:disabled {
          background: #C5D5E8;
          cursor: not-allowed;
          box-shadow: none;
        }
        .back-btn {
          padding: 9px 18px;
          border-radius: 10px;
          border: 1px solid #E3EAF3;
          background: #FFFFFF;
          color: #64748B;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .back-btn:hover { background: #F1F5F9; transform: translateX(-2px); }
        .toggle-json-btn {
          padding: 7px 16px;
          border-radius: 8px;
          border: 1px solid #D6E6FF;
          background: #EFF6FF;
          color: #1D4ED8;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s;
        }
        .toggle-json-btn:hover { background: #DBEAFE; }
        .dl-btn {
          display: inline-block;
          padding: 9px 20px;
          background: #F0F6FF;
          border: 1px solid #D6E6FF;
          border-radius: 9px;
          font-size: 13px;
          color: #1D4ED8;
          font-weight: 600;
          text-decoration: none;
          align-self: flex-start;
          transition: background 0.2s;
        }
        .dl-btn:hover { background: #DBEAFE; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 720 }}>

        {/* TOP BAR */}
        <div style={{
          display: "flex", alignItems: "center", gap: 16,
          marginBottom: 32, paddingBottom: 20, borderBottom: "1px solid #E3EAF3",
        }}>
          <button className="back-btn" onClick={() => navigate("/")}>← Dashboard</button>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "#00338D" }}>
              Enterprise Self-Report
            </h1>
            <p style={{ fontSize: 13, color: "#6B7C93", margin: "3px 0 0" }}>
              No API key or logs needed — fill in your AI details and we'll score it
            </p>
          </div>
        </div>

        {/* INFO STRIP */}
        <div style={{
          padding: "12px 18px", background: "#F0F6FF", border: "1px solid #D6E6FF",
          borderRadius: 12, fontSize: 13, color: "#1D4ED8", marginBottom: 24, lineHeight: 1.6,
        }}>
          ℹ Your answers compile into a structured JSON log ingested through the same SDCC
          pipeline as regular logs — giving you a full governance audit score.
        </div>

        {/* COMPLETENESS BAR */}
        <div className="sr-card" style={{ padding: "22px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0B1F33" }}>Report completeness</span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700,
              background: completeness >= 80 ? "#D1FAE5" : completeness >= 50 ? "#FEF3C7" : "#FEE2E2",
              color: scoreColor,
            }}>
              {completeness}%
            </span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${completeness}%`, background: scoreColor }} />
          </div>
          <p style={{ fontSize: 12, color: "#94A3B8", margin: "6px 0 0" }}>
            {completeness < 40
              ? "Fill in more fields to unlock submission"
              : completeness < 80
              ? "Looking good — a few more fields will improve your score"
              : "Great coverage — ready to submit!"}
          </p>
        </div>

        {/* ABOUT */}
        <div className="sr-card">
          <h2>🤖 About your AI</h2>
          <div className="sr-divider" />
          <div>
            <label className="sr-label">AI / Product name</label>
            <input className="sr-input" type="text" placeholder="e.g. AcmeBot, TitanAI Assist…"
              value={form.aiName} onChange={(e) => set("aiName", e.target.value)} />
          </div>
          <div className="sr-field-row">
            <div>
              <label className="sr-label">Primary use case</label>
              <select className="sr-select" value={form.useCase} onChange={(e) => set("useCase", e.target.value)}>
                <option value="">Select…</option>
                <option>Customer support</option>
                <option>Internal tool</option>
                <option>Content generation</option>
                <option>Decision support</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="sr-label">Who uses it?</label>
              <select className="sr-select" value={form.audience} onChange={(e) => set("audience", e.target.value)}>
                <option value="">Select…</option>
                <option>Internal employees only</option>
                <option>External customers</option>
                <option>Both</option>
              </select>
            </div>
          </div>
        </div>

        {/* GOVERNANCE */}
        <div className="sr-card">
          <h2>🏛 Governance & Safety</h2>
          <div className="sr-divider" />
          <div>
            <label className="sr-label">Written AI policy?</label>
            <select className="sr-select" value={form.hasPolicy} onChange={(e) => set("hasPolicy", e.target.value)}>
              <option value="">Select…</option>
              <option>Yes, formally documented</option>
              <option>Informal / in progress</option>
              <option>No</option>
            </select>
          </div>
          <div>
            <label className="sr-label">Safety controls in place</label>
            <textarea className="sr-textarea"
              placeholder="e.g. output filtering, human review, PII redaction, rate limiting…"
              value={form.safetyControls} onChange={(e) => set("safetyControls", e.target.value)} />
          </div>
          <div>
            <label className="sr-label">How do you handle AI errors / incidents?</label>
            <select className="sr-select" value={form.incidentProcess} onChange={(e) => set("incidentProcess", e.target.value)}>
              <option value="">Select…</option>
              <option>Formal incident response process</option>
              <option>Ad-hoc</option>
              <option>No process yet</option>
            </select>
          </div>
        </div>

        {/* FAIRNESS */}
        <div className="sr-card">
          <h2>⚖️ Fairness & Transparency</h2>
          <div className="sr-divider" />
          <div className="sr-field-row">
            <div>
              <label className="sr-label">Bias testing done?</label>
              <select className="sr-select" value={form.biasTesting} onChange={(e) => set("biasTesting", e.target.value)}>
                <option value="">Select…</option>
                <option>Yes — third-party tested</option>
                <option>Internal testing only</option>
                <option>Not yet</option>
              </select>
            </div>
            <div>
              <label className="sr-label">Users know they're talking to AI?</label>
              <select className="sr-select" value={form.disclosed} onChange={(e) => set("disclosed", e.target.value)}>
                <option value="">Select…</option>
                <option>Always disclosed</option>
                <option>Sometimes</option>
                <option>Not disclosed</option>
              </select>
            </div>
          </div>
        </div>

        {/* LIVE JSON PREVIEW */}
        <div className="sr-card" style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0 }}>📄 Generated Log Preview</h2>
              <p style={{ fontSize: 12, color: "#94A3B8", margin: "4px 0 0" }}>
                This JSON is what gets uploaded to the SDCC pipeline
              </p>
            </div>
            <button className="toggle-json-btn" onClick={() => setShowJson((v) => !v)}>
              {showJson ? "Hide ▲" : "Preview JSON ▼"}
            </button>
          </div>

          {showJson && (
            <div className="json-box">
              {JSON.stringify(reportJson, null, 2).split("\n").map((line, i) => {
                const isKey  = line.match(/^(\s*)"(.*?)":/);
                const isStr  = line.match(/:\s*"(.*?)"/);
                const isNull = line.match(/:\s*null/);
                const isNum  = line.match(/:\s*\d/);
                if (!isKey) return <div key={i} style={{ color: "#7DD3FC" }}>{line}</div>;
                const colonIdx = line.indexOf(":");
                const keyPart = line.substring(0, colonIdx);
                const valPart = line.substring(colonIdx + 1);
                const valColor = isStr ? "#86EFAC" : isNull ? "#9CA3AF" : isNum ? "#FCD34D" : "#E5E7EB";
                return (
                  <div key={i}>
                    <span style={{ color: "#93C5FD" }}>{keyPart}:</span>
                    <span style={{ color: valColor }}>{valPart}</span>
                  </div>
                );
              })}
            </div>
          )}

          <a
            className="dl-btn"
            href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(reportJson, null, 2))}`}
            download="self_report.json"
          >
            ⬇ Download JSON
          </a>
        </div>

        {/* SUBMIT */}
        <div style={{ textAlign: "center" }}>
          {success ? (
            <div style={{
              padding: "18px 28px", background: "#E6FFF6", border: "1px solid #B2F2D7",
              color: "#00A86B", borderRadius: 14, fontSize: 15, fontWeight: 600,
              maxWidth: 420, margin: "0 auto",
            }}>
              ✅ Report ingested! Redirecting to dashboard…
            </div>
          ) : (
            <>
              <button className="submit-btn" onClick={handleSubmit} disabled={loading || completeness < 40}>
                {loading ? "Uploading report…" : "Generate & Upload Report →"}
              </button>
              {completeness < 40 && !loading && (
                <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 10 }}>
                  Complete at least 40% of fields to submit
                </p>
              )}
            </>
          )}
          {error && (
            <div style={{
              marginTop: 16, padding: "12px 18px", background: "#FFF1F1",
              border: "1px solid #FFD6D6", color: "#E5484D", borderRadius: 10,
              fontSize: 13, maxWidth: 420, margin: "16px auto 0",
            }}>
              {error}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
