/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerAI } from "../services/api";

/* ── Dropdown options ── */
const DOMAIN_OPTS = ["Healthcare & Life Sciences","Financial Services & Banking","Legal & Compliance","Education & EdTech","Retail & E-Commerce","Manufacturing & Supply Chain","Government & Public Sector","HR & Talent Management","Cybersecurity","Agriculture & Environment","Other"];
const END_USER_OPTS = ["Select who uses this agent…","Internal Employees","External Customers (B2C)","Business Clients (B2B)","Healthcare Professionals / Clinicians","Students & Learners","Government Officials","General Public","Developers & Technical Teams"];
const DECISION_OPTS = ["Select decision type…","Informational only — no action taken","Recommendations — human decides","Approvals / Rejections — agent decides","Automated actions — no human review","Mixed — depends on context"];
const DATA_OPTS = ["Select primary data type…","Personal Identifiable Information (PII)","Financial & Transaction Data","Medical & Health Records","Legal Documents & Contracts","Proprietary Intellectual Property","Biometric Data","Behavioural & Usage Data","No sensitive data processed"];
const JURISDICTION_OPTS = ["Select jurisdiction…","India","European Union (GDPR)","United States","United Kingdom","Multi-region (EU + US)","Global / No specific jurisdiction","Other"];
const OVERSIGHT_OPTS = ["Select oversight level…","Human-in-the-loop for every decision","Human review for high-risk outputs only","Human override available but not mandatory","Fully automated — no human review"];
const DEPLOYMENT_OPTS = ["Select environment…","Cloud (Public)","Cloud (Private / VPC)","On-Premises","Hybrid","Edge / Embedded Device"];
const PROD_STATUS_OPTS = ["Select deployment status…","Not yet deployed — pre-production / testing","Deployed in a limited pilot","Live in production — limited user base","Live in production — full scale","Being replaced / deprecated"];
const BIAS_TESTED_OPTS = ["Select…","Yes — formally tested by a third party","Yes — tested internally by our team","Partially — some informal checks done","No — not tested yet","Not sure"];
const OUTPUT_VISIBILITY_OPTS = ["Select…","Yes — users see the raw output directly","Yes — but with a disclaimer it's AI-generated","No — a human reviews before it reaches users","No — it feeds into another system, not shown to users"];
const REAL_TIME_DATA_OPTS = ["Select…","Yes — it queries live APIs or databases","Yes — it uses a knowledge base updated regularly","No — it only uses its training data","No — it uses a static document set"];

const COMMON_RISKS = [
  { id: "misdiagnosis", label: "Misdiagnosis or wrong medical advice", domain: "Healthcare" },
  { id: "credit_denial", label: "Wrongful credit or loan denial", domain: "Finance" },
  { id: "bias_hiring", label: "Biased screening in hiring decisions", domain: "HR" },
  { id: "hallucination", label: "Hallucinated facts in legal or compliance context", domain: "Legal" },
  { id: "data_leak", label: "Unintended exposure of personal data (PII)", domain: "Privacy" },
  { id: "fraud_miss", label: "Failure to detect fraud or financial crime", domain: "Finance" },
];

/* ── Audit lifecycle phases — plain language, ISO 42001 aligned ── */
const PHASES = [
  { icon: "🔍", title: "Understand the Agent", desc: "Name, version, domain, and purpose." },
  { icon: "👥", title: "Map Usage & Impact", desc: "Users, decisions, data, and oversight." },
  { icon: "⚠️", title: "Surface Key Risks", desc: "Failure scenarios that shape probe focus." },
  { icon: "🌐", title: "Set Compliance Scope", desc: "Jurisdiction, environment, and system prompt." },
  { icon: "🛡️", title: "Run the Audit", desc: "Black Box probes + SDCC pipeline." },
];

/* ── Reusable styled select ── */
function Select({ value, onChange, options, id }: { value: string; onChange: (v: string) => void; options: string[]; id?: string }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", padding: "10px 36px 10px 13px", borderRadius: 9,
          border: "1.5px solid #E3EAF3", fontSize: 13.5, fontFamily: "inherit",
          color: value && !value.includes("Select") ? "#0B1F33" : "#A0B4CC",
          background: "#fff", outline: "none", appearance: "none",
          cursor: "pointer", transition: "all 0.15s",
        }}
        onFocus={e => { e.target.style.borderColor = "#005EB8"; e.target.style.boxShadow = "0 0 0 3px rgba(0,94,184,0.1)"; }}
        onBlur={e => { e.target.style.borderColor = "#E3EAF3"; e.target.style.boxShadow = "none"; }}
      >
        {options.map(o => <option key={o} value={o} disabled={o.includes("Select")}>{o}</option>)}
      </select>
      <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#7A90AB" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}

/* ── Reusable text input ── */
function Input({ value, onChange, placeholder, id }: { value: string; onChange: (v: string) => void; placeholder: string; id?: string }) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "10px 13px", borderRadius: 9,
        border: "1.5px solid #E3EAF3", fontSize: 13.5, fontFamily: "inherit",
        color: "#0B1F33", background: "#fff", outline: "none", transition: "all 0.15s",
      }}
      onFocus={e => { e.target.style.borderColor = "#005EB8"; e.target.style.boxShadow = "0 0 0 3px rgba(0,94,184,0.1)"; }}
      onBlur={e => { e.target.style.borderColor = "#E3EAF3"; e.target.style.boxShadow = "none"; }}
    />
  );
}

/* ── Field wrapper ── */
function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#4B5E78", marginBottom: 6, letterSpacing: "0.2px" }}>
        {label} {required && <span style={{ color: "#DC2626" }}>*</span>}
        {!required && <span style={{ color: "#A0B4CC", fontWeight: 400, fontSize: 11 }}> (optional)</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: "#A0B4CC", marginTop: 5, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

/* ── Section card — no numbered phases, uses icon + semantic title ── */
function SectionCard({ icon, title, subtitle, children, accentColor = "#005EB8" }: {
  icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode; accentColor?: string;
}) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #E8EFF7", borderRadius: 16,
      padding: "24px 26px", position: "relative", overflow: "hidden",
      transition: "box-shadow 0.2s, border-color 0.2s",
      boxShadow: "0 2px 12px rgba(0,51,141,0.04)",
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 6px 28px rgba(0,51,141,0.08)`;
        (e.currentTarget as HTMLDivElement).style.borderColor = `${accentColor}33`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,51,141,0.04)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "#E8EFF7";
      }}
    >
      {/* Accent top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)`, borderRadius: "16px 16px 0 0" }} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: `linear-gradient(135deg, ${accentColor}18, ${accentColor}0a)`,
          border: `1.5px solid ${accentColor}28`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: accentColor,
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0B1F33", letterSpacing: "-0.3px", lineHeight: 1.2 }}>{title}</div>
          <div style={{ fontSize: 12, color: "#7A90AB", marginTop: 3, lineHeight: 1.5 }}>{subtitle}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function RegisterAI() {
  const navigate = useNavigate();

  /* ── Core ── */
  const [agentName,    setAgentName]    = useState("");
  const [description,  setDescription]  = useState("");
  const [domain,       setDomain]       = useState("");
  const [agentVersion, setAgentVersion] = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  /* ── Context ── */
  const [endUsers,          setEndUsers]          = useState("");
  const [decisionInfluence, setDecisionInfluence] = useState("");
  const [dataType,          setDataType]          = useState("");
  const [jurisdiction,      setJurisdiction]      = useState("");
  const [oversight,         setOversight]         = useState("");
  const [deployment,        setDeployment]        = useState("");

  /* ── Agent capability questions (directly configure audit probes) ── */
  const [canActAutonomously,   setCanActAutonomously]   = useState(false);
  const [hasRealTimeData,      setHasRealTimeData]      = useState("");
  const [outputVisibility,     setOutputVisibility]     = useState("");
  const [biasTested,           setBiasTested]           = useState("");
  const [productionStatus,     setProductionStatus]     = useState("");

  /* ── Risk ── */
  const [selectedRisk,  setSelectedRisk]  = useState("");
  const [customRisk,    setCustomRisk]    = useState("");

  /* ── Advanced ── */
  const [systemPrompt, setSystemPrompt] = useState("");

  const finalRisk = selectedRisk === "custom" ? customRisk : selectedRisk;

  const handleRegister = async () => {
    if (!agentName.trim()) { setError("Agent Name is required."); return; }
    setLoading(true);
    setError("");
    try {
      const profile = {
        end_users:              endUsers,
        decision_influence:     decisionInfluence,
        data_types:             dataType ? [dataType] : [],
        jurisdictions:          jurisdiction ? [jurisdiction] : [],
        highest_stakes_failure: finalRisk,
        system_prompt:          systemPrompt,
        oversight_model:        oversight,
        deployment_environment: deployment,
        agent_version:          agentVersion,
        can_act_autonomously:   canActAutonomously,
        has_real_time_data:     hasRealTimeData,
        output_visibility:      outputVisibility,
        bias_tested:            biasTested,
        production_status:      productionStatus,
      };
      await registerAI({
        name: agentName, description, domain,
        connector: { type: "internal", endpoint: "N/A", headers: {} },
        profile,
      } as any);
      localStorage.setItem("activeAI", agentName);
      navigate("/dashboard");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isReady = agentName.trim().length > 0;

  return (
    <div style={{ minHeight: "100vh", background: "#F4F7FB", padding: "32px 36px 80px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        .rai-page * { box-sizing: border-box; }
        .rai-page { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 0 0 rgba(0,94,184,0.15)} 50%{box-shadow:0 0 0 6px rgba(0,94,184,0.05)} }
        .glow-card:focus-within { animation: glowPulse 2s ease-in-out infinite; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.45s cubic-bezier(.16,1,.3,1) both; }
        .fade-up-1 { animation: fadeUp 0.45s 0.05s cubic-bezier(.16,1,.3,1) both; }
        .fade-up-2 { animation: fadeUp 0.45s 0.1s cubic-bezier(.16,1,.3,1) both; }
        .fade-up-3 { animation: fadeUp 0.45s 0.15s cubic-bezier(.16,1,.3,1) both; }
        .fade-up-4 { animation: fadeUp 0.45s 0.2s cubic-bezier(.16,1,.3,1) both; }
        .risk-chip { padding:8px 14px; border-radius:10px; border:1.5px solid #E3EAF3; background:#FAFBFC; color:#5A7090; font-size:12.5px; font-weight:600; cursor:pointer; transition:all 0.15s; user-select:none; display:flex; align-items:center; gap:7px; }
        .risk-chip:hover { border-color:#005EB8; color:#005EB8; background:#F0F6FF; }
        .risk-chip.selected { border-color:#005EB8; background:linear-gradient(135deg,#EEF4FF,#E8F0FD); color:#005EB8; box-shadow:0 2px 8px rgba(0,94,184,0.12); }
      `}</style>

      <div className="rai-page">
        {/* ── Page header ── */}
        <div className="fade-up" style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase",
              color: "#005EB8", background: "linear-gradient(135deg,#EEF4FF,#E8F0FD)",
              padding: "4px 10px", borderRadius: 6, border: "1px solid #C7D9F5",
            }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#005EB8" }} />
              Getting Started
            </div>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#00338D", letterSpacing: "-0.6px", margin: "0 0 6px" }}>
            Register Your AI Agent
          </h1>
          <p style={{ fontSize: 13.5, color: "#7A90AB", lineHeight: 1.7, maxWidth: 560, margin: 0 }}>
            Before running an audit, tell us about your AI agent. The more context you provide, the more precise and relevant your governance evaluation will be.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, maxWidth: 1020, alignItems: "start" }}>

          {/* ── LEFT: Form sections ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* ── SECTION 1: Agent Identity (ISO 42001 §4 — Context of Organisation) ── */}
            <div className="fade-up glow-card">
              <SectionCard
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>}
                title="About Your AI Agent"
                subtitle="Name and describe the agent — this scopes the entire audit"
                accentColor="#005EB8"
              >
                <Field label="AI Agent Name" required hint="This is the unique identifier used across your entire audit workspace. Use a clear, recognisable name.">
                  <Input value={agentName} onChange={setAgentName} placeholder="e.g. LoanAdvisor Bot, MedAssist v2, HR Screener" />
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Field label="Agent Version / Release" hint="Helps track which version was audited.">
                    <Input value={agentVersion} onChange={setAgentVersion} placeholder="e.g. v2.1.0, GPT-4-turbo, Q2-2025" />
                  </Field>
                  <Field label="Industry / Domain">
                    <Select value={domain} onChange={setDomain} options={["Select industry domain…", ...DOMAIN_OPTS]} />
                  </Field>
                </div>
                <Field label="What does this agent do?" hint="Describe the agent's purpose in plain language. This helps calibrate the audit probes.">
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="e.g. Assists loan officers by scoring applicants and recommending approval or rejection based on financial history and risk profile."
                    rows={3}
                    style={{
                      width: "100%", padding: "10px 13px", borderRadius: 9,
                      border: "1.5px solid #E3EAF3", fontSize: 13.5, fontFamily: "inherit",
                      color: "#0B1F33", background: "#fff", outline: "none",
                      resize: "vertical", minHeight: 80, lineHeight: 1.6, transition: "all 0.15s",
                    }}
                    onFocus={e => { e.target.style.borderColor = "#005EB8"; e.target.style.boxShadow = "0 0 0 3px rgba(0,94,184,0.1)"; }}
                    onBlur={e => { e.target.style.borderColor = "#E3EAF3"; e.target.style.boxShadow = "none"; }}
                  />
                </Field>
              </SectionCard>
            </div>

            {/* ── SECTION 2: Usage Context (ISO 42001 §4.1 — Understanding the organisation and its context) ── */}
            <div className="fade-up-1 glow-card">
              <SectionCard
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                title="Who Uses It & What It Does"
                subtitle="Define the users, decisions, and data — this determines which governance checks run"
                accentColor="#0091DA"
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Field label="Who are the end users?" hint="Determines fairness and accessibility probes.">
                    <Select value={endUsers} onChange={setEndUsers} options={END_USER_OPTS} />
                  </Field>
                  <Field label="What decisions does it influence?" hint="Shapes accountability and oversight probes.">
                    <Select value={decisionInfluence} onChange={setDecisionInfluence} options={DECISION_OPTS} />
                  </Field>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Field label="Primary data type processed" hint="Drives privacy and data integrity checks.">
                    <Select value={dataType} onChange={setDataType} options={DATA_OPTS} />
                  </Field>
                  <Field label="Human oversight model" hint="Required for safety and reliability scoring.">
                    <Select value={oversight} onChange={setOversight} options={OVERSIGHT_OPTS} />
                  </Field>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: "#F0F4FA", margin: "6px 0 18px" }} />
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#4B5E78", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Agent Capability Questions
                  <span style={{ fontSize: 10.5, fontWeight: 500, color: "#A0B4CC", textTransform: "none", letterSpacing: 0, marginLeft: 6 }}>— these directly configure which audit probes run</span>
                </div>

                {/* Q1: Autonomous actions */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "#4B5E78", marginBottom: 8 }}>
                    Can this agent take autonomous actions? <span style={{ color: "#A0B4CC", fontWeight: 400 }}>(e.g. send emails, execute transactions, modify records)</span>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[{ val: true, label: "Yes — it can act", sub: "Triggers agentic safety probes" }, { val: false, label: "No — output only", sub: "Standard response probes" }].map(opt => (
                      <div key={String(opt.val)} onClick={() => setCanActAutonomously(opt.val)}
                        style={{
                          flex: 1, padding: "10px 14px", borderRadius: 10, border: "1.5px solid",
                          borderColor: canActAutonomously === opt.val ? "#005EB8" : "#E3EAF3",
                          background: canActAutonomously === opt.val ? "linear-gradient(135deg,#EEF4FF,#E8F0FD)" : "#FAFBFC",
                          cursor: "pointer", transition: "all 0.15s", userSelect: "none",
                        }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: canActAutonomously === opt.val ? "#005EB8" : "#0B1F33" }}>{opt.label}</div>
                        <div style={{ fontSize: 11, color: canActAutonomously === opt.val ? "#5B8DD9" : "#A0B4CC", marginTop: 2 }}>{opt.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Q2: Real-time data */}
                <Field label="Does this agent have access to real-time or external data?" hint="Agents with live data access need hallucination and data freshness probes.">
                  <Select value={hasRealTimeData} onChange={setHasRealTimeData} options={REAL_TIME_DATA_OPTS} />
                </Field>

                {/* Q3: Output visibility */}
                <Field label="Is the agent's output shown directly to end users without human review?" hint="Direct-to-user output triggers transparency and explainability probes.">
                  <Select value={outputVisibility} onChange={setOutputVisibility} options={OUTPUT_VISIBILITY_OPTS} />
                </Field>

                {/* Q4: Bias testing */}
                <Field label="Has this agent been tested for bias or fairness issues before?" hint="Tells us whether to run baseline bias probes or advanced differential testing.">
                  <Select value={biasTested} onChange={setBiasTested} options={BIAS_TESTED_OPTS} />
                </Field>

                {/* Q5: Production status */}
                <Field label="What is the current deployment status of this agent?" hint="Production agents get stricter probe intensity than pre-production ones.">
                  <Select value={productionStatus} onChange={setProductionStatus} options={PROD_STATUS_OPTS} />
                </Field>
              </SectionCard>
            </div>

            {/* ── SECTION 3: Risk Scenarios (ISO 42001 §6.1 — Actions to address risks) ── */}
            <div className="fade-up-2 glow-card">
              <SectionCard
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
                title="What Could Go Wrong?"
                subtitle="Select the failure scenario most relevant to your agent — this focuses the audit on what matters most"
                accentColor="#DC2626"
              >
                <div style={{ marginBottom: 14, padding: "10px 14px", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 9, fontSize: 12.5, color: "#92400E", lineHeight: 1.6 }}>
                  💡 Selecting a risk scenario tells the audit engine which failure modes to probe hardest. A healthcare agent gets different safety probes than a finance agent.
                </div>

                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#4B5E78", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  Common risk scenarios — select one or describe your own
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                  {COMMON_RISKS.map(risk => (
                    <div
                      key={risk.id}
                      className={`risk-chip${selectedRisk === risk.id ? " selected" : ""}`}
                      onClick={() => setSelectedRisk(selectedRisk === risk.id ? "" : risk.id)}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                        background: selectedRisk === risk.id ? "#005EB8" : "#E8EFF7",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s",
                      }}>
                        {selectedRisk === risk.id && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13 }}>{risk.label}</span>
                        <span style={{
                          marginLeft: 8, fontSize: 10, fontWeight: 700, padding: "1px 7px",
                          borderRadius: 20, background: selectedRisk === risk.id ? "#005EB822" : "#F0F4FA",
                          color: selectedRisk === risk.id ? "#005EB8" : "#7A90AB",
                        }}>{risk.domain}</span>
                      </div>
                    </div>
                  ))}

                  {/* Custom risk option */}
                  <div
                    className={`risk-chip${selectedRisk === "custom" ? " selected" : ""}`}
                    onClick={() => setSelectedRisk(selectedRisk === "custom" ? "" : "custom")}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                      background: selectedRisk === "custom" ? "#005EB8" : "#E8EFF7",
                      display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
                    }}>
                      {selectedRisk === "custom" ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7A90AB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      )}
                    </div>
                    <span style={{ fontSize: 13 }}>Describe a custom risk scenario</span>
                  </div>
                </div>

                {selectedRisk === "custom" && (
                  <Field label="Describe the critical failure scenario" hint="One sentence is enough — e.g. 'Agent approves fraudulent transactions without flagging them'">
                    <Input value={customRisk} onChange={setCustomRisk} placeholder="e.g. Agent provides incorrect dosage recommendations to clinicians" />
                  </Field>
                )}
              </SectionCard>
            </div>

            {/* ── SECTION 4: Deployment & Compliance (ISO 42001 §8 — Operation) ── */}
            <div className="fade-up-3 glow-card">
              <SectionCard
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
                title="Deployment & Compliance Context"
                subtitle="Where is this agent running and which regulations apply — shapes the regulatory coverage of the audit"
                accentColor="#00A37A"
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Field label="Operating jurisdiction" hint="Determines which regulatory frameworks apply.">
                    <Select value={jurisdiction} onChange={setJurisdiction} options={JURISDICTION_OPTS} />
                  </Field>
                  <Field label="Deployment environment" hint="Affects security and infrastructure probes.">
                    <Select value={deployment} onChange={setDeployment} options={DEPLOYMENT_OPTS} />
                  </Field>
                </div>

                <Field label="System prompt" hint="Stays completely private — used only to generate more targeted audit probes. Never stored or shared.">
                  <textarea
                    value={systemPrompt}
                    onChange={e => setSystemPrompt(e.target.value)}
                    placeholder="Paste your agent's system prompt here. This helps us generate probes that match your agent's actual behaviour and constraints…"
                    rows={4}
                    style={{
                      width: "100%", padding: "10px 13px", borderRadius: 9,
                      border: "1.5px solid #E3EAF3", fontSize: 13.5, fontFamily: "inherit",
                      color: "#0B1F33", background: "#fff", outline: "none",
                      resize: "vertical", minHeight: 90, lineHeight: 1.6, transition: "all 0.15s",
                    }}
                    onFocus={e => { e.target.style.borderColor = "#00A37A"; e.target.style.boxShadow = "0 0 0 3px rgba(0,163,122,0.1)"; }}
                    onBlur={e => { e.target.style.borderColor = "#E3EAF3"; e.target.style.boxShadow = "none"; }}
                  />
                </Field>

                <div style={{ padding: "10px 14px", background: "#F0FDF9", border: "1px solid #A7F3D0", borderRadius: 9, fontSize: 12, color: "#065F46", lineHeight: 1.6, display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Your system prompt is encrypted in transit and never stored. It is used solely to improve probe relevance during this audit session.
                </div>
              </SectionCard>
            </div>

            {/* ── Error ── */}
            {error && (
              <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontSize: 13, color: "#DC2626", display: "flex", gap: 8, alignItems: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {error}
              </div>
            )}

            {/* ── Submit ── */}
            <div className="fade-up-4">
              <button
                onClick={handleRegister}
                disabled={loading || !isReady}
                style={{
                  width: "100%", padding: "14px 24px", borderRadius: 12, border: "none",
                  background: !isReady || loading
                    ? "#C8D5E3"
                    : "linear-gradient(135deg, #00338D 0%, #005EB8 60%, #0091DA 100%)",
                  color: "#fff", fontSize: 15, fontWeight: 800, fontFamily: "inherit",
                  cursor: !isReady || loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  boxShadow: !isReady || loading ? "none" : "0 6px 24px rgba(0,51,141,0.28), 0 2px 8px rgba(0,51,141,0.15)",
                  letterSpacing: "-0.2px",
                }}
                onMouseEnter={e => { if (isReady && !loading) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 0.8s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                    Registering Agent…
                  </span>
                ) : "Register Agent & Start Audit →"}
              </button>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

              {!isReady && (
                <div style={{ textAlign: "center", fontSize: 12, color: "#A0B4CC", marginTop: 8 }}>
                  Enter an agent name above to continue
                </div>
              )}

              <div style={{ textAlign: "center", fontSize: 12.5, color: "#7A90AB", marginTop: 10 }}>
                Already registered an agent?{" "}
                <span style={{ color: "#005EB8", fontWeight: 700, cursor: "pointer" }} onClick={() => navigate("/dashboard")}>
                  Go to Audit Dashboard →
                </span>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Live audit scope preview ── */}
          {(() => {
            // Compute which probe categories will run based on answers
            const probes: { label: string; reason: string; color: string; active: boolean }[] = [
              { label: "Fairness & Bias", reason: endUsers ? `Testing for ${endUsers.toLowerCase()} demographic equity` : "Demographic fairness probes", color: "#7C3AED", active: true },
              { label: "Transparency", reason: outputVisibility && outputVisibility.includes("Yes") ? "Direct user output — explainability required" : "Output traceability checks", color: "#005EB8", active: true },
              { label: "Agentic Safety", reason: "Autonomous action boundary testing", color: "#DC2626", active: canActAutonomously },
              { label: "Hallucination Detection", reason: hasRealTimeData && hasRealTimeData.includes("Yes") ? "Live data access — factual accuracy probes" : "Knowledge boundary probes", color: "#D97706", active: hasRealTimeData.includes("Yes") || decisionInfluence.includes("Approvals") },
              { label: "Privacy & PII", reason: dataType && dataType.includes("PII") ? "PII data detected — GDPR probes active" : "Data handling checks", color: "#059669", active: dataType.includes("PII") || dataType.includes("Medical") || dataType.includes("Financial") },
              { label: "Regulatory Compliance", reason: jurisdiction ? `${jurisdiction} regulatory framework` : "Framework alignment checks", color: "#0091DA", active: Boolean(jurisdiction) },
              { label: "Accountability", reason: oversight && oversight.includes("Fully automated") ? "No human review — accountability probes elevated" : "Decision trail verification", color: "#92400E", active: decisionInfluence.includes("Approvals") || decisionInfluence.includes("Automated") || (oversight && oversight.includes("Fully automated")) },
              { label: "Bias Baseline", reason: biasTested && biasTested.includes("No") ? "No prior testing — full bias baseline run" : "Differential fairness testing", color: "#7C3AED", active: biasTested.includes("No") || biasTested.includes("Not sure") },
              { label: "Production Stress", reason: "Higher probe intensity for live systems", color: "#DC2626", active: productionStatus.includes("production") },
            ];
            const activeProbes = probes.filter(p => p.active);
            const inactiveProbes = probes.filter(p => !p.active);
            const completedFields = [agentName, domain, endUsers, decisionInfluence, dataType, oversight, jurisdiction, deployment, hasRealTimeData, outputVisibility, biasTested, productionStatus].filter(Boolean).length;
            const totalFields = 12;
            const pct = Math.round((completedFields / totalFields) * 100);

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 24 }}>

                {/* Audit scope preview card */}
                <div style={{
                  background: "#fff", border: "1px solid #E8EFF7", borderRadius: 16,
                  overflow: "hidden", boxShadow: "0 4px 20px rgba(0,51,141,0.07)",
                }}>
                  {/* Header */}
                  <div style={{ padding: "16px 18px 14px", borderBottom: "1px solid #F0F4FA" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#0B1F33" }}>Your Audit Scope</div>
                      <div style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
                        background: pct >= 70 ? "#F0FDF4" : pct >= 40 ? "#EEF4FF" : "#FFFBEB",
                        color: pct >= 70 ? "#059669" : pct >= 40 ? "#005EB8" : "#D97706",
                        border: `1px solid ${pct >= 70 ? "#A7F3D0" : pct >= 40 ? "#C7D9F5" : "#FDE68A"}`,
                      }}>
                        {pct}% configured
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: 5, background: "#F0F4FA", borderRadius: 10, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 10, transition: "width 0.4s ease",
                        width: `${pct}%`,
                        background: pct >= 70 ? "linear-gradient(90deg,#059669,#00A37A)" : pct >= 40 ? "linear-gradient(90deg,#005EB8,#0091DA)" : "linear-gradient(90deg,#D97706,#F59E0B)",
                      }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#A0B4CC", marginTop: 6 }}>
                      {pct < 40 ? "Fill in more fields to activate targeted probes" : pct < 70 ? "Good — a few more fields will sharpen the audit" : "Great coverage — your audit will be highly targeted"}
                    </div>
                  </div>

                  {/* Active probes */}
                  <div style={{ padding: "14px 18px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#7A90AB", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 10 }}>
                      Active probe categories ({activeProbes.length})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {activeProbes.map(p => (
                        <div key={p.label} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: p.color, flexShrink: 0, marginTop: 4 }} />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#0B1F33" }}>{p.label}</div>
                            <div style={{ fontSize: 11, color: "#7A90AB", lineHeight: 1.4 }}>{p.reason}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {inactiveProbes.length > 0 && (
                      <>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#C8D5E3", textTransform: "uppercase", letterSpacing: "0.7px", margin: "12px 0 8px" }}>
                          Unlocks with more context ({inactiveProbes.length})
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {inactiveProbes.map(p => (
                            <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.45 }}>
                              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#C8D5E3", flexShrink: 0 }} />
                              <div style={{ fontSize: 11.5, color: "#A0B4CC" }}>{p.label}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Audit lifecycle */}
                <div style={{
                  background: "linear-gradient(160deg, #00338D 0%, #005EB8 55%, #0091DA 100%)",
                  borderRadius: 16, padding: "20px 18px",
                  boxShadow: "0 6px 24px rgba(0,51,141,0.2)",
                  position: "relative", overflow: "hidden",
                }}>
                  <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />
                  <div style={{ position: "relative" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 14 }}>Audit Lifecycle</div>
                    {PHASES.map((p, i) => (
                      <div key={p.title} style={{ display: "flex", gap: 10, marginBottom: i < PHASES.length - 1 ? 12 : 0 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 6, background: i <= 3 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)", border: i <= 3 ? "1.5px solid rgba(255,255,255,0.35)" : "1.5px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{p.icon}</div>
                          {i < PHASES.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 8, background: "rgba(255,255,255,0.1)", margin: "2px 0" }} />}
                        </div>
                        <div style={{ paddingBottom: i < PHASES.length - 1 ? 2 : 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: i <= 3 ? "#fff" : "rgba(255,255,255,0.5)" }}>{p.title}</div>
                          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.45)", lineHeight: 1.4, marginTop: 1 }}>{p.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Governance frameworks */}
                <div style={{ background: "#F5F8FC", border: "1px solid #E8EFF7", borderRadius: 14, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#7A90AB", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>Governance Coverage</div>
                  {[
                    { label: "EU AI Act", color: "#005EB8", bg: "#EEF4FF" },
                    { label: "NIST AI RMF", color: "#059669", bg: "#F0FDF4" },
                    { label: "KPMG Trusted AI", color: "#7C3AED", bg: "#F3E8FF" },
                    { label: "GDPR / Data Privacy", color: "#D97706", bg: "#FFFBEB" },
                  ].map(fw => (
                    <div key={fw.label} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: fw.bg, color: fw.color, fontSize: 11, fontWeight: 700, marginRight: 6, marginBottom: 6 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: fw.color }} />
                      {fw.label}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
