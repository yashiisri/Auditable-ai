import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { sdccIngest } from "../services/api";

// Weights for completeness scoring
const FIELD_WEIGHTS: Record<string, number> = {
  aiName: 5, aiVersion: 3, modelProvider: 4, deploymentEnv: 4,
  useCase: 5, riskTier: 6, audience: 4, dataRegions: 4,
  hasPolicy: 8, governanceOwner: 5, incidentProcess: 7, changeManagement: 5,
  safetyControls: 8, humanOversight: 7, outputFiltering: 5,
  biasTesting: 6, disclosed: 5, dataRetention: 4, piiHandling: 5,
  regulatoryScope: 5,
};

type FormState = Record<keyof typeof FIELD_WEIGHTS, string>;

const INITIAL: FormState = Object.fromEntries(
  Object.keys(FIELD_WEIGHTS).map(k => [k, ""])
) as FormState;

export default function SelfReportPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showJson, setShowJson] = useState(false);
  const aiName = localStorage.getItem("activeAI") || "enterprise-ai";
  const [form, setForm] = useState<FormState>(INITIAL);
  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));

  const completeness = useMemo(() => {
    let score = 0;
    for (const [key, weight] of Object.entries(FIELD_WEIGHTS)) {
      if (form[key as keyof FormState]?.trim()) score += weight;
    }
    return score;
  }, [form]);

  const reportJson = useMemo(() => ({
    report_type: "enterprise_self_attestation",
    schema_version: "2.0",
    generated_at: new Date().toISOString(),
    completeness_pct: completeness,
    ai_system: {
      name: form.aiName || null,
      version: form.aiVersion || null,
      model_provider: form.modelProvider || null,
      deployment_environment: form.deploymentEnv || null,
      use_case: form.useCase || null,
      risk_tier: form.riskTier || null,
      audience: form.audience || null,
      data_regions: form.dataRegions || null,
    },
    governance: {
      written_policy: form.hasPolicy || null,
      governance_owner: form.governanceOwner || null,
      incident_process: form.incidentProcess || null,
      change_management: form.changeManagement || null,
    },
    safety_controls: {
      controls_in_place: form.safetyControls || null,
      human_oversight: form.humanOversight || null,
      output_filtering: form.outputFiltering || null,
    },
    fairness_transparency: {
      bias_testing: form.biasTesting || null,
      ai_disclosed_to_users: form.disclosed || null,
    },
    data_privacy: {
      pii_handling: form.piiHandling || null,
      data_retention_policy: form.dataRetention || null,
      regulatory_scope: form.regulatoryScope || null,
    },
  }), [form, completeness]);

  const handleSubmit = async () => {
    if (completeness < 40) { setError("Please fill in at least a few more fields before submitting."); return; }
    setLoading(true); setError("");
    try {
      const blob = new Blob([JSON.stringify(reportJson, null, 2)], { type: "application/json" });
      const file = new File([blob], "self_report.json", { type: "application/json" });
      const res = await sdccIngest(form.aiName || aiName, file);
      localStorage.setItem("uploaded", "true");
      localStorage.setItem("sdccSummary", JSON.stringify(res.data));
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2200);
    } catch {
      setError("Submission failed — please check your connection and try again.");
    } finally { setLoading(false); }
  };

  const scoreColor = completeness >= 80 ? "#059669" : completeness >= 50 ? "#005EB8" : "#DC2626";

  return (
    <div style={{ minHeight: "100vh", background: "#F4F7FB", display: "flex", justifyContent: "center", padding: "40px 20px 80px", fontFamily: "'Inter', sans-serif", color: "#0B1F33" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .sr-card { background: #FFFFFF; border-radius: 20px; padding: 32px; border: 1px solid #E3EAF3; box-shadow: 0 4px 16px rgba(0,51,141,0.05); display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; transition: box-shadow 0.3s; }
        .sr-card:hover { box-shadow: 0 12px 36px rgba(0,51,141,0.09); }
        .sr-card h2 { font-size: 16px; font-weight: 700; color: #0B1F33; margin: 0; }
        .sr-label { font-size: 11px; font-weight: 700; color: #005EB8; text-transform: uppercase; letter-spacing: 0.6px; display: block; margin-bottom: 6px; }
        .sr-hint { font-size: 11px; color: #94A3B8; margin-top: 4px; }
        .sr-input, .sr-select, .sr-textarea { width: 100%; padding: 11px 14px; border-radius: 10px; border: 1.5px solid #E3EAF3; background: #FAFBFD; color: #0B1F33; font-size: 14px; font-family: 'Inter', sans-serif; transition: border-color 0.2s, box-shadow 0.2s; outline: none; }
        .sr-select { appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748B' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; background-color: #FAFBFD; padding-right: 36px; cursor: pointer; }
        .sr-textarea { resize: vertical; min-height: 80px; line-height: 1.6; }
        .sr-input:focus, .sr-select:focus, .sr-textarea:focus { border-color: #005EB8; background: #FFFFFF; box-shadow: 0 0 0 3px rgba(0,94,184,0.1); }
        .sr-input::placeholder, .sr-textarea::placeholder { color: #B0BEC9; }
        .sr-divider { height: 1px; background: #F1F5F9; margin: 0; }
        .sr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .sr-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        @media (max-width: 600px) { .sr-grid, .sr-grid-3 { grid-template-columns: 1fr; } }
        .progress-track { height: 8px; background: #E9EFF6; border-radius: 99px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 99px; transition: width 0.5s ease, background 0.5s ease; }
        .submit-btn { padding: 16px 60px; border-radius: 40px; border: none; background: linear-gradient(135deg, #00338D, #005EB8); color: #fff; font-weight: 700; font-size: 16px; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.3s; box-shadow: 0 6px 20px rgba(0,51,141,0.25); }
        .submit-btn:hover:not(:disabled) { transform: scale(1.04); box-shadow: 0 12px 32px rgba(0,51,141,0.30); }
        .submit-btn:disabled { background: #C5D5E8; cursor: not-allowed; box-shadow: none; }
        .back-btn { padding: 9px 18px; border-radius: 10px; border: 1px solid #E3EAF3; background: #FFFFFF; color: #64748B; font-weight: 600; font-size: 13px; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s; flex-shrink: 0; }
        .back-btn:hover { background: #F1F5F9; transform: translateX(-2px); }
        .toggle-json-btn { padding: 7px 16px; border-radius: 8px; border: 1px solid #D0E8F8; background: #E6F2FB; color: #005EB8; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s; }
        .toggle-json-btn:hover { background: #D0E8F8; }
        .json-box { background: #0B1120; border-radius: 12px; padding: 20px; font-family: 'Fira Code', monospace; font-size: 12px; line-height: 1.75; max-height: 280px; overflow-y: auto; white-space: pre; border: 1px solid rgba(0,145,218,0.15); }
        .section-tag { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: #005EB8; background: #E6F2FB; padding: 4px 10px; border-radius: 6px; margin-bottom: 4px; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 760 }}>

        {/* TOP BAR */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, paddingBottom: 20, borderBottom: "1px solid #E3EAF3" }}>
          <button className="back-btn" onClick={() => navigate("/")}>← Dashboard</button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "#00338D" }}>Enterprise AI Self-Assessment</h1>
            <p style={{ fontSize: 13, color: "#6B7C93", margin: "3px 0 0" }}>Complete this form to generate a governance audit score without uploading logs</p>
          </div>
        </div>

        {/* INFO */}
        <div style={{ padding: "12px 18px", background: "#E6F2FB", border: "1px solid rgba(0,145,218,0.3)", borderRadius: 12, fontSize: 13, color: "#00338D", marginBottom: 20, lineHeight: 1.6 }}>
          ℹ Your answers compile into a structured JSON log ingested through the SDCC pipeline — giving you a full governance audit score aligned with KPMG Trusted AI Framework.
        </div>

        {/* COMPLETENESS */}
        <div className="sr-card" style={{ padding: "22px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0B1F33" }}>Assessment completeness</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, background: completeness >= 80 ? "#DCFCE7" : completeness >= 50 ? "#E6F2FB" : "#FEE2E2", color: scoreColor }}>{completeness}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${completeness}%`, background: scoreColor }} />
          </div>
          <p style={{ fontSize: 12, color: "#94A3B8", margin: "6px 0 0" }}>
            {completeness < 40 ? "Fill in more fields to unlock submission" : completeness < 80 ? "Good progress — more fields will improve your score" : "Excellent coverage — ready to submit"}
          </p>
        </div>

        {/* SECTION 1: AI SYSTEM IDENTITY */}
        <div className="sr-card">
          <div className="section-tag">🤖 AI System Identity</div>
          <h2>About your AI system</h2>
          <div className="sr-divider" />
          <div className="sr-grid">
            <div>
              <label className="sr-label">AI / Product name *</label>
              <input className="sr-input" type="text" placeholder="e.g. AcmeBot, TitanAI Assist"
                value={form.aiName} onChange={e => set("aiName", e.target.value)} />
            </div>
            <div>
              <label className="sr-label">Model version / release</label>
              <input className="sr-input" type="text" placeholder="e.g. v2.1.0, GPT-4-turbo"
                value={form.aiVersion} onChange={e => set("aiVersion", e.target.value)} />
              <p className="sr-hint">Version tracking is required for audit traceability</p>
            </div>
          </div>
          <div className="sr-grid">
            <div>
              <label className="sr-label">Model provider / foundation</label>
              <select className="sr-select" value={form.modelProvider} onChange={e => set("modelProvider", e.target.value)}>
                <option value="">Select…</option>
                <option>OpenAI (GPT series)</option>
                <option>Anthropic (Claude)</option>
                <option>Google (Gemini / PaLM)</option>
                <option>Meta (Llama)</option>
                <option>Microsoft Azure OpenAI</option>
                <option>AWS Bedrock</option>
                <option>Proprietary / in-house</option>
                <option>Open-source fine-tuned</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="sr-label">Deployment environment</label>
              <select className="sr-select" value={form.deploymentEnv} onChange={e => set("deploymentEnv", e.target.value)}>
                <option value="">Select…</option>
                <option>Cloud (public)</option>
                <option>Cloud (private / VPC)</option>
                <option>On-premises</option>
                <option>Hybrid</option>
                <option>Edge / embedded</option>
              </select>
            </div>
          </div>
          <div className="sr-grid-3">
            <div>
              <label className="sr-label">Primary use case *</label>
              <select className="sr-select" value={form.useCase} onChange={e => set("useCase", e.target.value)}>
                <option value="">Select…</option>
                <option>Customer support / chatbot</option>
                <option>Internal knowledge assistant</option>
                <option>Content generation</option>
                <option>Decision support / recommendations</option>
                <option>Document processing / extraction</option>
                <option>Code generation / review</option>
                <option>Risk & compliance analysis</option>
                <option>HR / recruitment screening</option>
                <option>Fraud detection</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="sr-label">EU AI Act risk tier</label>
              <select className="sr-select" value={form.riskTier} onChange={e => set("riskTier", e.target.value)}>
                <option value="">Select…</option>
                <option>Unacceptable risk</option>
                <option>High risk</option>
                <option>Limited risk</option>
                <option>Minimal risk</option>
                <option>Not yet assessed</option>
              </select>
              <p className="sr-hint">Determines regulatory obligations</p>
            </div>
            <div>
              <label className="sr-label">Primary audience</label>
              <select className="sr-select" value={form.audience} onChange={e => set("audience", e.target.value)}>
                <option value="">Select…</option>
                <option>Internal employees only</option>
                <option>External customers (B2C)</option>
                <option>Business clients (B2B)</option>
                <option>Regulated individuals (e.g. patients, applicants)</option>
                <option>Mixed</option>
              </select>
            </div>
          </div>
          <div>
            <label className="sr-label">Data processing regions</label>
            <select className="sr-select" value={form.dataRegions} onChange={e => set("dataRegions", e.target.value)}>
              <option value="">Select…</option>
              <option>EU / EEA only</option>
              <option>UK only</option>
              <option>US only</option>
              <option>Multi-region (EU + US)</option>
              <option>Global</option>
              <option>Unknown / not documented</option>
            </select>
            <p className="sr-hint">Affects GDPR, data sovereignty, and cross-border transfer obligations</p>
          </div>
        </div>

        {/* SECTION 2: GOVERNANCE */}
        <div className="sr-card">
          <div className="section-tag">🏛 Governance & Accountability</div>
          <h2>Governance structure</h2>
          <div className="sr-divider" />
          <div className="sr-grid">
            <div>
              <label className="sr-label">Written AI policy exists? *</label>
              <select className="sr-select" value={form.hasPolicy} onChange={e => set("hasPolicy", e.target.value)}>
                <option value="">Select…</option>
                <option>Yes — formally documented and approved</option>
                <option>Yes — draft / in review</option>
                <option>Informal guidelines only</option>
                <option>No policy yet</option>
              </select>
            </div>
            <div>
              <label className="sr-label">AI governance owner / role</label>
              <select className="sr-select" value={form.governanceOwner} onChange={e => set("governanceOwner", e.target.value)}>
                <option value="">Select…</option>
                <option>Chief AI Officer (CAIO)</option>
                <option>Chief Risk Officer (CRO)</option>
                <option>Chief Data Officer (CDO)</option>
                <option>AI Ethics Board</option>
                <option>Legal / Compliance team</option>
                <option>Product / Engineering owner</option>
                <option>No designated owner</option>
              </select>
              <p className="sr-hint">Accountability ownership is a key governance signal</p>
            </div>
          </div>
          <div className="sr-grid">
            <div>
              <label className="sr-label">Incident response process *</label>
              <select className="sr-select" value={form.incidentProcess} onChange={e => set("incidentProcess", e.target.value)}>
                <option value="">Select…</option>
                <option>Formal process with SLAs and escalation paths</option>
                <option>Documented but informal</option>
                <option>Ad-hoc — no formal process</option>
                <option>No process yet</option>
              </select>
            </div>
            <div>
              <label className="sr-label">Change management for model updates</label>
              <select className="sr-select" value={form.changeManagement} onChange={e => set("changeManagement", e.target.value)}>
                <option value="">Select…</option>
                <option>Formal change control with approval gates</option>
                <option>Peer review before deployment</option>
                <option>Automated CI/CD with tests</option>
                <option>Ad-hoc deployments</option>
                <option>No process</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: SAFETY */}
        <div className="sr-card">
          <div className="section-tag">🔒 Safety & Human Oversight</div>
          <h2>Safety controls</h2>
          <div className="sr-divider" />
          <div>
            <label className="sr-label">Safety controls in place *</label>
            <textarea className="sr-textarea"
              placeholder="e.g. output filtering, PII redaction, rate limiting, content moderation, prompt injection guards…"
              value={form.safetyControls} onChange={e => set("safetyControls", e.target.value)} />
          </div>
          <div className="sr-grid">
            <div>
              <label className="sr-label">Human oversight mechanism *</label>
              <select className="sr-select" value={form.humanOversight} onChange={e => set("humanOversight", e.target.value)}>
                <option value="">Select…</option>
                <option>Human-in-the-loop for all decisions</option>
                <option>Human review for high-risk outputs only</option>
                <option>Human override available but not mandatory</option>
                <option>Fully automated — no human review</option>
              </select>
              <p className="sr-hint">Required for EU AI Act high-risk systems</p>
            </div>
            <div>
              <label className="sr-label">Output filtering / moderation</label>
              <select className="sr-select" value={form.outputFiltering} onChange={e => set("outputFiltering", e.target.value)}>
                <option value="">Select…</option>
                <option>Automated content moderation (e.g. Azure Content Safety)</option>
                <option>Rule-based keyword filtering</option>
                <option>LLM-based self-moderation</option>
                <option>Manual review only</option>
                <option>No output filtering</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 4: FAIRNESS & TRANSPARENCY */}
        <div className="sr-card">
          <div className="section-tag">⚖️ Fairness & Transparency</div>
          <h2>Fairness and disclosure</h2>
          <div className="sr-divider" />
          <div className="sr-grid">
            <div>
              <label className="sr-label">Bias testing conducted? *</label>
              <select className="sr-select" value={form.biasTesting} onChange={e => set("biasTesting", e.target.value)}>
                <option value="">Select…</option>
                <option>Yes — independent third-party tested</option>
                <option>Yes — internal red-team testing</option>
                <option>Yes — automated bias evaluation tools</option>
                <option>Planned but not yet done</option>
                <option>Not tested</option>
              </select>
            </div>
            <div>
              <label className="sr-label">AI disclosure to end users *</label>
              <select className="sr-select" value={form.disclosed} onChange={e => set("disclosed", e.target.value)}>
                <option value="">Select…</option>
                <option>Always disclosed — clear AI labelling</option>
                <option>Disclosed on request</option>
                <option>Disclosed in terms of service only</option>
                <option>Not disclosed</option>
              </select>
              <p className="sr-hint">Mandatory under EU AI Act for certain system types</p>
            </div>
          </div>
        </div>

        {/* SECTION 5: DATA & PRIVACY */}
        <div className="sr-card">
          <div className="section-tag">🛡️ Data & Privacy</div>
          <h2>Data governance and privacy</h2>
          <div className="sr-divider" />
          <div className="sr-grid">
            <div>
              <label className="sr-label">PII / personal data handling *</label>
              <select className="sr-select" value={form.piiHandling} onChange={e => set("piiHandling", e.target.value)}>
                <option value="">Select…</option>
                <option>No PII processed</option>
                <option>PII anonymised before processing</option>
                <option>PII pseudonymised</option>
                <option>PII processed with explicit consent</option>
                <option>PII processed — consent status unclear</option>
              </select>
            </div>
            <div>
              <label className="sr-label">Data retention policy</label>
              <select className="sr-select" value={form.dataRetention} onChange={e => set("dataRetention", e.target.value)}>
                <option value="">Select…</option>
                <option>Defined retention periods with automated deletion</option>
                <option>Defined periods — manual deletion</option>
                <option>Retained indefinitely</option>
                <option>No retention policy defined</option>
              </select>
            </div>
          </div>
          <div>
            <label className="sr-label">Applicable regulatory scope</label>
            <select className="sr-select" value={form.regulatoryScope} onChange={e => set("regulatoryScope", e.target.value)}>
              <option value="">Select…</option>
              <option>GDPR (EU)</option>
              <option>UK GDPR</option>
              <option>CCPA (California)</option>
              <option>HIPAA (US healthcare)</option>
              <option>Multiple jurisdictions</option>
              <option>Not yet assessed</option>
              <option>Not applicable</option>
            </select>
            <p className="sr-hint">Determines which data protection obligations apply</p>
          </div>
        </div>

        {/* PDF UPLOAD SECTION */}
        <div className="sr-card" style={{ marginBottom: 20, borderColor: "rgba(0,94,184,0.2)" }}>
          <div className="section-tag">📄 Already have a report?</div>
          <h2>Upload existing PDF report</h2>
          <div className="sr-divider" />
          <p style={{ fontSize: 13, color: "#6B7C93", lineHeight: 1.6 }}>
            If you already have an audit report in PDF or JSON format, upload it to view an interactive dashboard without running a new audit.
          </p>
          <button
            onClick={() => navigate("/pdf-report")}
            style={{ padding: "12px 24px", background: "linear-gradient(135deg, #00338D, #005EB8)", border: "none", borderRadius: 10, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.2s", boxShadow: "0 4px 14px rgba(0,51,141,0.2)", alignSelf: "flex-start" }}
          >
            Upload PDF / JSON Report →
          </button>
        </div>

        {/* JSON PREVIEW */}
        <div className="sr-card" style={{ marginBottom: 28 }}>          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0 }}>📄 Generated Log Preview</h2>
              <p style={{ fontSize: 12, color: "#94A3B8", margin: "4px 0 0" }}>This JSON is ingested through the SDCC pipeline</p>
            </div>
            <button className="toggle-json-btn" onClick={() => setShowJson(v => !v)}>{showJson ? "Hide ▲" : "Preview JSON ▼"}</button>
          </div>
          {showJson && (
            <div className="json-box">
              {JSON.stringify(reportJson, null, 2).split("\n").map((line, i) => {
                const isKey = line.match(/^(\s*)"(.*?)":/);
                const isStr = line.match(/:\s*"(.*?)"/);
                const isNull = line.match(/:\s*null/);
                const isNum = line.match(/:\s*\d/);
                if (!isKey) return <div key={i} style={{ color: "#7DD3FC" }}>{line}</div>;
                const colonIdx = line.indexOf(":");
                const keyPart = line.substring(0, colonIdx);
                const valPart = line.substring(colonIdx + 1);
                const valColor = isStr ? "#86EFAC" : isNull ? "#9CA3AF" : isNum ? "#93C5FD" : "#E5E7EB";
                return (
                  <div key={i}>
                    <span style={{ color: "#93C5FD" }}>{keyPart}:</span>
                    <span style={{ color: valColor }}>{valPart}</span>
                  </div>
                );
              })}
            </div>
          )}
          <a className="dl-btn" style={{ display: "inline-block", padding: "9px 20px", background: "#E6F2FB", border: "1px solid rgba(0,145,218,0.3)", borderRadius: 9, fontSize: 13, color: "#005EB8", fontWeight: 600, textDecoration: "none", alignSelf: "flex-start" }}
            href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(reportJson, null, 2))}`}
            download="self_report.json">⬇ Download JSON</a>
        </div>

        {/* SUBMIT */}
        <div style={{ textAlign: "center" }}>
          {success ? (
            <div style={{ padding: "18px 28px", background: "#DCFCE7", border: "1px solid #86EFAC", color: "#166534", borderRadius: 14, fontSize: 15, fontWeight: 600, maxWidth: 420, margin: "0 auto" }}>
              ✅ Report ingested! Redirecting to dashboard…
            </div>
          ) : (
            <>
              <button className="submit-btn" onClick={handleSubmit} disabled={loading || completeness < 40}>
                {loading ? "Uploading report…" : "Generate & Upload Report →"}
              </button>
              {completeness < 40 && !loading && (
                <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 10 }}>Complete at least 40% of fields to submit</p>
              )}
            </>
          )}
          {error && (
            <div style={{ marginTop: 16, padding: "12px 18px", background: "#FEE2E2", border: "1px solid #FECACA", color: "#DC2626", borderRadius: 10, fontSize: 13, maxWidth: 420, margin: "16px auto 0" }}>{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}
