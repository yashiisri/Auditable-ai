/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerAI } from "../services/api";

const B = "#00338D", M = "#005EB8";
const FF = "'Plus Jakarta Sans', system-ui, sans-serif";

const DOMAIN_OPTS = [
  "Healthcare & Life Sciences","Financial Services & Banking","Legal & Compliance",
  "Education & EdTech","Retail & E-Commerce","Manufacturing & Supply Chain",
  "Government & Public Sector","HR & Talent Management","Cybersecurity",
  "Agriculture & Environment","Other",
];
const CONNECTOR_TYPES = [
  "API (REST / GraphQL)", "OpenAI-compatible endpoint",
  "LangChain", "Custom SDK", "Other",
];
const END_USER_OPTS = [
  "Internal Employees","External Customers (B2C)","Business Clients (B2B)",
  "Healthcare Professionals","Students & Learners","Government Officials",
  "General Public","Developers & Technical Teams",
];
const OVERSIGHT_OPTS = [
  "Human-in-the-loop for every decision",
  "Human review for high-risk outputs only",
  "Human override available but not mandatory",
  "Fully automated — no human review",
];

const STEPS = [
  { id: 1, label: "Context",    sub: "Name, domain, purpose" },
  { id: 2, label: "Connection", sub: "Endpoint & credentials" },
  { id: 3, label: "Governance", sub: "Users, data & oversight" },
  { id: 4, label: "Confirm",    sub: "Review & register" },
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#F8FAFC;}
.rai-inp{width:100%;padding:10px 13px;border-radius:9px;border:1.5px solid #E2E8F0;font-size:13.5px;font-family:${FF};color:#0F172A;background:#fff;outline:none;transition:border 0.15s,box-shadow 0.15s;appearance:none;}
.rai-inp:focus{border-color:${M};box-shadow:0 0 0 3px rgba(0,94,184,0.09);}
.rai-inp::placeholder{color:#B8C8D8;}
.rai-ta{width:100%;padding:10px 13px;border-radius:9px;border:1.5px solid #E2E8F0;font-size:13px;font-family:${FF};color:#0F172A;background:#fff;outline:none;resize:vertical;min-height:90px;line-height:1.6;transition:border 0.15s,box-shadow 0.15s;}
.rai-ta:focus{border-color:${M};box-shadow:0 0 0 3px rgba(0,94,184,0.09);}
.rai-ta::placeholder{color:#B8C8D8;}
.rai-sel-wrap{position:relative;}
.rai-sel{width:100%;padding:10px 36px 10px 13px;border-radius:9px;border:1.5px solid #E2E8F0;font-size:13.5px;font-family:${FF};background:#fff;outline:none;appearance:none;cursor:pointer;transition:border 0.15s,box-shadow 0.15s;}
.rai-sel:focus{border-color:${M};box-shadow:0 0 0 3px rgba(0,94,184,0.09);}
.rai-btn{width:100%;padding:13px;border-radius:10px;border:none;background:linear-gradient(135deg,${B},${M});color:#fff;font-size:14px;font-weight:800;font-family:${FF};cursor:pointer;transition:transform 0.15s,box-shadow 0.15s;box-shadow:0 4px 14px rgba(0,51,141,0.2);}
.rai-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 22px rgba(0,51,141,0.28);}
.rai-btn:disabled{opacity:0.4;cursor:not-allowed;transform:none;}
.rai-btn.sm{width:auto;padding:9px 20px;font-size:13px;font-weight:700;box-shadow:none;}
.rai-card{background:#fff;border:1.5px solid #E2E8F0;border-radius:16px;padding:28px;box-shadow:0 1px 3px rgba(0,0,0,0.05),0 4px 16px rgba(0,0,0,0.04);}
@keyframes raiIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.rai-anim{animation:raiIn 0.3s cubic-bezier(.22,1,.36,1) both;}
.rai-err{padding:10px 14px;background:#F8FAFC;border:1px solid #CBD5E1;border-radius:9px;font-size:12.5px;color:#475569;margin-top:12px;}
`;

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", letterSpacing: "0.3px", marginBottom: 6, textTransform: "uppercase" as const }}>
        {label}{required && <span style={{ color: "#64748B", marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

export default function RegisterAi() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName]         = useState("");
  const [domain, setDomain]     = useState("");
  const [desc, setDesc]         = useState("");
  const [sysPrompt, setSysPr]   = useState("");

  const [connType, setConnType] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [headers, setHeaders]   = useState("{}");

  const [endUsers, setEndUsers]   = useState("");
  const [oversight, setOversight] = useState("");

  const canNext = () => {
    if (step === 1) return name.trim().length > 1 && Boolean(domain);
    if (step === 2) return Boolean(connType) && endpoint.trim().length > 5;
    if (step === 3) return Boolean(endUsers) && Boolean(oversight);
    return true;
  };

  const submit = async () => {
    setError(""); setLoading(true);
    let parsedHeaders: Record<string, string> = {};
    try { parsedHeaders = JSON.parse(headers || "{}"); }
    catch { setError("Headers must be valid JSON — e.g. {\"Authorization\": \"Bearer sk-...\"}"); setLoading(false); return; }
    try {
      await registerAI({
        name: name.trim(),
        description: desc.trim() || `${name} — ${domain} AI agent`,
        domain,
        connector: { type: connType, endpoint: endpoint.trim(), headers: parsedHeaders },
      });
      localStorage.setItem("activeAI", name.trim());
      navigate("/dashboard");
    } catch (e: any) {
      const d = e?.response?.data?.detail;
      if (Array.isArray(d)) setError(d.map((x: any) => `${x.loc?.slice(-1)[0]}: ${x.msg}`).join(" · "));
      else setError(typeof d === "string" ? d : e.message || "Registration failed.");
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: FF, color: "#0F172A" }}>

        {/* Top bar — mirrors the audit page header style */}
        <div style={{ background: `linear-gradient(135deg,${B},${M})`, padding: "20px 40px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Setup · Step {step} of {STEPS.length}</div>
              <div style={{ fontSize: 19, fontWeight: 900, color: "#fff", letterSpacing: "-0.3px" }}>Register AI Agent</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>{STEPS[step-1].sub}</div>
            </div>
            {/* Step dots */}
            <div style={{ display: "flex", gap: 6 }}>
              {STEPS.map(s => (
                <div
                  key={s.id}
                  onClick={() => step > s.id && setStep(s.id)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                    cursor: step > s.id ? "pointer" : "default",
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: step > s.id ? "rgba(255,255,255,0.9)" : step === s.id ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
                    border: `2px solid ${step >= s.id ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800,
                    color: step > s.id ? M : "rgba(255,255,255,0.8)",
                    transition: "all 0.2s",
                  }}>
                    {step > s.id ? (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={M} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : s.id}
                  </div>
                  <div style={{ fontSize: 9.5, color: step >= s.id ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)", fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 24px 80px" }}>
          <div key={step} className="rai-card rai-anim">

            {step === 1 && (
              <>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 18 }}>About the agent</div>
                <Field label="Agent Name" required>
                  <input className="rai-inp" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Acme Customer Support Bot" />
                </Field>
                <Field label="Industry Domain" required>
                  <div className="rai-sel-wrap">
                    <select className="rai-sel" value={domain} onChange={e => setDomain(e.target.value)} style={{ color: domain ? "#0F172A" : "#B8C8D8" }}>
                      <option value="">Select domain…</option>
                      {DOMAIN_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </Field>
                <Field label="Description" hint="What does this agent do? Used as the audit record description.">
                  <textarea className="rai-ta" value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Handles inbound customer queries for billing and returns…" />
                </Field>
                <Field label="System Prompt" hint="Optional but significantly improves LLM analysis accuracy.">
                  <textarea className="rai-ta" value={sysPrompt} onChange={e => setSysPr(e.target.value)} placeholder="You are a helpful assistant for Acme Corp. You help customers with…" style={{ minHeight: 80 }} />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>Connection details</div>
                <div style={{ fontSize: 12.5, color: "#64748B", marginBottom: 18, lineHeight: 1.6 }}>How the audit platform connects to your agent for Black Box probing.</div>
                <Field label="Connection Type" required>
                  <div className="rai-sel-wrap">
                    <select className="rai-sel" value={connType} onChange={e => setConnType(e.target.value)} style={{ color: connType ? "#0F172A" : "#B8C8D8" }}>
                      <option value="">How is the agent exposed?</option>
                      {CONNECTOR_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </Field>
                <Field label="Endpoint URL" required hint="The URL the auditor sends probe requests to.">
                  <input className="rai-inp" value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="https://api.example.com/v1/chat" />
                </Field>
                <Field label="Auth Headers (JSON)" hint='Stored encrypted. e.g. {"Authorization": "Bearer sk-..."}'>
                  <textarea className="rai-ta" value={headers} onChange={e => setHeaders(e.target.value)} placeholder='{"Authorization": "Bearer your-api-key"}' style={{ minHeight: 70, fontFamily: "monospace", fontSize: 12 }} />
                </Field>
              </>
            )}

            {step === 3 && (
              <>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 18 }}>Governance context</div>
                <Field label="Primary End Users" required>
                  <div className="rai-sel-wrap">
                    <select className="rai-sel" value={endUsers} onChange={e => setEndUsers(e.target.value)} style={{ color: endUsers ? "#0F172A" : "#B8C8D8" }}>
                      <option value="">Who uses this agent?</option>
                      {END_USER_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </Field>
                <Field label="Human Oversight Level" required>
                  <div className="rai-sel-wrap">
                    <select className="rai-sel" value={oversight} onChange={e => setOversight(e.target.value)} style={{ color: oversight ? "#0F172A" : "#B8C8D8" }}>
                      <option value="">How much human oversight exists?</option>
                      {OVERSIGHT_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </Field>
              </>
            )}

            {step === 4 && (
              <>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>Review & register</div>
                <div style={{ fontSize: 12.5, color: "#64748B", marginBottom: 18 }}>Confirm the details below before registering your agent.</div>
                <div style={{ background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0", padding: "4px 16px 10px", marginBottom: 18 }}>
                  {[
                    ["Agent name", name], ["Domain", domain], ["Description", desc || `${name} — ${domain} agent`],
                    ["Connector type", connType], ["Endpoint", endpoint],
                    ["End users", endUsers], ["Oversight level", oversight],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: "1px solid #F1F5F9", fontSize: 12.5 }}>
                      <span style={{ color: "#64748B", fontWeight: 500 }}>{k}</span>
                      <span style={{ color: "#0F172A", fontWeight: 600, textAlign: "right", maxWidth: "58%" }}>{v || "—"}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "10px 14px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 9, fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>
                  After registering, go to <strong style={{ color: "#0F172A" }}>Run Audit</strong> to upload logs and start the evaluation pipeline.
                </div>
              </>
            )}

            {error && <div className="rai-err">{error}</div>}
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, gap: 10 }}>
            <button
              className="rai-btn sm"
              onClick={() => step > 1 && setStep(step - 1)}
              style={{ background: "#F1F5F9", color: "#475569", boxShadow: "none", display: step === 1 ? "none" : undefined }}
            >
              ← Back
            </button>
            <div style={{ flex: 1 }} />
            {step < 4 ? (
              <button className="rai-btn sm" onClick={() => canNext() && setStep(step + 1)} disabled={!canNext()}>
                Continue →
              </button>
            ) : (
              <button className="rai-btn sm" onClick={submit} disabled={loading}>
                {loading ? "Registering…" : "Register Agent"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}