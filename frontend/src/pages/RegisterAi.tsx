/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerAI } from "../services/api";

const B = "#00338D", M = "#005EB8", T = "#0091DA";
const FF = "'Plus Jakarta Sans', system-ui, sans-serif";

// ── Option lists ──────────────────────────────────────────────────────────────
// Each list below is the GENERIC pool — always available regardless of domain.
// DOMAIN_SPECIFIC_OPTS adds extra, domain-relevant options that get merged in
// front of the generic pool (see `buildOptions()`), so the most relevant
// choices for the selected industry always appear first. "Other (please
// specify)" is appended at render time by `buildOptions()`, not stored here.

const OTHER_OPT = "Other (please specify)";

const DOMAIN_OPTS = [
  "Healthcare & Life Sciences", "Financial Services & Banking", "Legal & Compliance",
  "Education & EdTech", "Retail & E-Commerce", "Manufacturing & Supply Chain",
  "Government & Public Sector", "HR & Talent Management", "Cybersecurity",
  "Agriculture & Environment", "Other",
];

const END_USER_OPTS = [
  "Internal Employees", "External Customers (B2C)", "Business Clients (B2B)",
  "Healthcare Professionals", "Students & Learners", "Government Officials",
  "General Public", "Developers & Technical Teams",
];

const DECISION_INFLUENCE_OPTS = [
  "Informational only — surfaces data, no decisions made",
  "Recommendations — suggests actions, human decides",
  "Approvals — AI approves or denies requests",
  "Automated actions — acts without human sign-off",
];

const DEPLOYMENT_STATUS_OPTS = [
  "In development / internal testing",
  "Pilot — limited live users",
  "Production — full deployment",
  "Decommissioning",
];

const DATA_TYPE_OPTS = [
  "Personal Identifiable Information (PII)",
  "Financial data",
  "Medical / health records",
  "Legal documents",
  "Proprietary IP / trade secrets",
  "Biometric data",
  "None — no sensitive data",
];

const JURISDICTION_OPTS = [
  "European Union (GDPR / EU AI Act)",
  "United States (CCPA / HIPAA / NIST)",
  "United Kingdom (UK GDPR)",
  "India (PDPB / IT Act)",
  "Canada (PIPEDA)",
  "Australia (Privacy Act)",
  "Global / Multiple",
];

const OVERSIGHT_OPTS = [
  "Human-in-the-loop for every decision",
  "Human review for high-risk outputs only",
  "Human override available but not mandatory",
  "Fully automated — no human review",
];

const OUTPUT_VISIBILITY_OPTS = [
  "Internal only — staff-facing outputs",
  "External — end-user / customer facing",
  "Both internal and external",
  "Embedded in a product / third-party platform",
];

const BIAS_TESTED_OPTS = [
  "Yes — formal bias audit completed",
  "Partial — some testing done informally",
  "No — not yet tested for bias",
  "Not applicable",
];

// ── Domain-specific extra options ───────────────────────────────────────────
// Keyed by the exact DOMAIN_OPTS label. Each field lists EXTRA options that
// are prepended ahead of the generic pool for that field when the domain is
// selected. These are additive — the generic pool is never removed, just
// pushed down. Domains not listed here (or "Other") fall back to generic-only.

type FieldKey = "endUsers" | "dataTypes" | "jurisdictions" | "oversight";

const DOMAIN_SPECIFIC_OPTS: Record<string, Partial<Record<FieldKey, string[]>>> = {
  "Healthcare & Life Sciences": {
    endUsers: ["Patients & Caregivers", "Clinicians & Care Teams", "Health Insurers / Payers"],
    dataTypes: ["Genetic / genomic data", "Clinical trial data", "Electronic Health Records (EHR)"],
    jurisdictions: ["United States (HIPAA)", "EU Medical Device Regulation (MDR)"],
    oversight: ["Licensed clinician sign-off required before action"],
  },
  "Financial Services & Banking": {
    endUsers: ["Retail Banking Customers", "Institutional / Wealth Clients", "Loan & Credit Applicants"],
    dataTypes: ["Transaction / account data", "Credit history & scores", "KYC / AML identity records"],
    jurisdictions: ["United States (SEC / FINRA / GLBA)", "Basel Committee (BCBS) standards", "Payment Card Industry (PCI-DSS)"],
    oversight: ["Compliance officer review for flagged transactions"],
  },
  "Legal & Compliance": {
    endUsers: ["Attorneys & Paralegals", "Corporate Legal/Compliance Teams", "Litigants / Self-Represented Parties"],
    dataTypes: ["Privileged attorney-client communications", "Case files & litigation records", "Contract & IP documentation"],
    jurisdictions: ["Bar association / professional conduct rules", "eDiscovery & court evidentiary rules"],
    oversight: ["Licensed attorney review before client-facing output"],
  },
  "Education & EdTech": {
    endUsers: ["K-12 Students (minors)", "Higher-Ed Students", "Teachers & Faculty", "Parents / Guardians"],
    dataTypes: ["Student records (FERPA-protected)", "Minor / child data (under 18)", "Academic performance data"],
    jurisdictions: ["United States (FERPA / COPPA)", "EU (GDPR-K / minors' data provisions)"],
    oversight: ["Educator review for any content reaching minors"],
  },
  "Retail & E-Commerce": {
    endUsers: ["Online Shoppers", "Loyalty Program Members", "Marketplace Sellers"],
    dataTypes: ["Purchase & browsing history", "Payment card data", "Customer loyalty / behavioral profiles"],
    jurisdictions: ["Payment Card Industry (PCI-DSS)", "State consumer-protection statutes (e.g. CCPA)"],
    oversight: [],
  },
  "Manufacturing & Supply Chain": {
    endUsers: ["Plant / Floor Operators", "Supply Chain Planners", "Quality & Safety Inspectors"],
    dataTypes: ["Equipment telemetry / IoT sensor data", "Supplier & logistics records", "Proprietary process / trade secrets"],
    jurisdictions: ["ISO 9001 / industry quality standards", "OSHA / workplace safety regulations"],
    oversight: ["Safety engineer sign-off before automated action on equipment"],
  },
  "Government & Public Sector": {
    endUsers: ["Government Officials", "Citizens / Constituents", "Public Benefits Applicants"],
    dataTypes: ["Citizen identity records", "Public benefits / welfare data", "Law enforcement / public safety data"],
    jurisdictions: ["Freedom of Information / public records law", "EU AI Act (high-risk public sector use)"],
    oversight: ["Public official accountable for all automated decisions"],
  },
  "HR & Talent Management": {
    endUsers: ["Job Applicants & Candidates", "Employees", "HR / Talent Acquisition Teams"],
    dataTypes: ["Resume / candidate screening data", "Employee performance records", "Compensation & benefits data"],
    jurisdictions: ["EEOC / anti-discrimination employment law", "NYC Local Law 144 (AEDT bias audits)", "EU AI Act (employment = high-risk)"],
    oversight: ["HR reviewer sign-off on any hiring/firing-adjacent decision"],
  },
  "Cybersecurity": {
    endUsers: ["Security Analysts (SOC)", "IT / Infrastructure Teams", "Incident Responders"],
    dataTypes: ["Threat intelligence / vulnerability data", "Network & endpoint telemetry", "Credentials / access-control data"],
    jurisdictions: ["NIST Cybersecurity Framework", "Breach notification statutes"],
    oversight: ["Analyst confirmation required before any automated containment action"],
  },
  "Agriculture & Environment": {
    endUsers: ["Farmers / Agricultural Operators", "Environmental Regulators", "Agronomists & Field Researchers"],
    dataTypes: ["Field / sensor & remote-sensing data", "Crop yield & soil data", "Environmental compliance records"],
    jurisdictions: ["Environmental protection regulations", "Agricultural commodity / trade regulations"],
    oversight: [],
  },
};

// ── Option-building helper ──────────────────────────────────────────────────
// Builds the final option list shown for a given field: domain-specific
// options first (deduped, in the order defined above), then the generic pool
// (minus anything already pulled in by the domain) filling any remaining
// slots, capped at MAX_VISIBLE_OPTIONS total — then "Other" last (uncapped,
// always present). Domain-specific options are never trimmed by the cap;
// only generic-pool overflow gets cut, since the domain ones are already the
// most relevant and should never be pushed out to make room for generic ones.
const MAX_VISIBLE_OPTIONS = 8;

function buildOptions(domain: string, field: FieldKey, generic: string[]): string[] {
  const extra = DOMAIN_SPECIFIC_OPTS[domain]?.[field] ?? [];
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const o of [...extra, ...generic]) {
    if (!seen.has(o)) { seen.add(o); ordered.push(o); }
  }
  const capped = ordered.slice(0, MAX_VISIBLE_OPTIONS);
  capped.push(OTHER_OPT);
  return capped;
}

// ── Steps ─────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "About the Agent",   sub: "Name, domain & system prompt", icon: "◈" },
  { id: 2, label: "Target Users",        sub: "Define Scope and users",  icon: "⊕" },
  { id: 3, label: "Risk & Oversight",  sub: "Controls, stakes & compliance", icon: "⬡" },
  { id: 4, label: "Review & Register", sub: "Confirm and submit",            icon: "✦" },
];

const SIDEBAR_CONTENT: Record<number, { heading: string; body: string; facts: string[] }> = {
  1: {
    heading: "What are we registering?",
    body:    "Your agent's name and domain set the context for the entire audit. The description and system prompt are used directly by the LLM Judge panel to understand the agent's intended behaviour.",
    facts:   ["Domain shapes which probes are generated", "System prompt improves LLM Judge accuracy by ~20%", "Name appears on your final PDF report"],
  },
  2: {
    heading: "Why does deployment context matter?",
    body:    "Who uses the agent, what data it touches, and how it influences decisions directly shapes which governance probes are generated — and how hard they are. An agent processing medical records gets different adversarial scenarios than one answering FAQs.",
    facts:   ["End-user type adjusts safety probe intensity", "Data types activate privacy-specific probes", "Decision influence sets the accountability bar", "Jurisdictions trigger regulation-specific checks"],
  },
  3: {
    heading: "What's the highest-stakes failure?",
    body:    "Describing the worst realistic failure case lets the auditor target the exact risk scenarios that matter for your agent — rather than generic adversarial tests. Oversight level directly affects Accountability and Safety TAF scores.",
    facts:   ["Stakes description improves probe specificity", "Oversight level influences 3 of 10 TAF principles", "Bias testing history affects Fairness scoring", "Autonomous actions activate agentic safety probes"],
  },
  4: {
    heading: "What happens after registration?",
    body:    "Your agent is added to the AI Register. From the dashboard you can upload inference logs or trigger a black box audit to begin the full evaluation pipeline. You'll provide connection credentials there — they're audit-time secrets, not stored config.",
    facts:   ["Appears in your AI Register immediately", "Upload logs or run Black Box Audit from dashboard", "Full TAF report generated in minutes", "Connection details entered fresh per audit (never stored)"],
  },
};

// ── Styles ────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body{height:100%;}
body{background:#F0F4FA;}

.rai-inp{
  width:100%;padding:12px 14px;border-radius:0;
  border:1.5px solid #DDE5EF;font-size:14px;font-family:${FF};
  color:#0F172A;background:#FAFBFD;outline:none;
  transition:border 0.18s,box-shadow 0.18s,background 0.18s;
}
.rai-inp:focus{border-color:${M};box-shadow:0 0 0 4px rgba(0,94,184,0.1);background:#fff;}
.rai-inp::placeholder{color:#B0C0D4;}

.rai-ta{
  width:100%;padding:12px 14px;border-radius:0;
  border:1.5px solid #DDE5EF;font-size:13.5px;font-family:${FF};
  color:#0F172A;background:#FAFBFD;outline:none;resize:vertical;
  min-height:96px;line-height:1.65;transition:border 0.18s,box-shadow 0.18s,background 0.18s;
}
.rai-ta:focus{border-color:${M};box-shadow:0 0 0 4px rgba(0,94,184,0.1);background:#fff;}
.rai-ta::placeholder{color:#B0C0D4;}

.rai-sel-wrap{position:relative;}
.rai-sel{
  width:100%;padding:12px 38px 12px 14px;border-radius:0;
  border:1.5px solid #DDE5EF;font-size:14px;font-family:${FF};
  background:#FAFBFD;outline:none;appearance:none;cursor:pointer;
  color:#0F172A;transition:border 0.18s,box-shadow 0.18s,background 0.18s;
}
.rai-sel:focus{border-color:${M};box-shadow:0 0 0 4px rgba(0,94,184,0.1);background:#fff;}

.rai-label{
  display:block;font-size:11.5px;font-weight:700;color:#5A7090;
  letter-spacing:0.5px;margin-bottom:7px;text-transform:uppercase;
}
.rai-hint{font-size:11.5px;color:#94A3B8;margin-top:5px;line-height:1.55;}

.rai-btn-p{
  display:inline-flex;align-items:center;gap:8px;
  padding:13px 26px;border-radius:0;border:none;
  background:linear-gradient(135deg,${B},${M});
  color:#fff;font-size:14px;font-weight:800;font-family:${FF};
  cursor:pointer;transition:transform 0.18s,box-shadow 0.18s;
  box-shadow:0 4px 16px rgba(0,51,141,0.22);
}
.rai-btn-p:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 28px rgba(0,51,141,0.3);}
.rai-btn-p:disabled{opacity:0.38;cursor:not-allowed;transform:none;box-shadow:none;}

.rai-btn-g{
  display:inline-flex;align-items:center;gap:8px;
  padding:13px 22px;border-radius:0;
  border:1.5px solid #D0DCEA;background:#fff;
  color:#4A6080;font-size:14px;font-weight:700;font-family:${FF};
  cursor:pointer;transition:all 0.18s;
}
.rai-btn-g:hover{border-color:${M};color:${M};background:#F0F6FF;}

.rai-step-item{
  display:flex;align-items:flex-start;gap:14px;
  padding:14px 16px;border-radius:0;cursor:default;
  transition:background 0.2s;
}
.rai-step-item.done{cursor:pointer;}
.rai-step-item.done:hover{background:rgba(0,94,184,0.06);}
.rai-step-item.active{background:rgba(0,94,184,0.07);}

.rai-step-circle{
  width:34px;height:34px;border-radius:50%;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  font-size:12px;font-weight:800;transition:all 0.22s;
  border:2px solid transparent;
}
.rai-step-circle.done{background:${B};color:#fff;border-color:${B};}
.rai-step-circle.active{background:#fff;color:${M};border-color:${M};box-shadow:0 0 0 4px rgba(0,94,184,0.12);}
.rai-step-circle.future{background:#F1F5F9;color:#B0C0D4;border-color:#E2E8F0;}

.rai-step-connector{
  width:2px;height:28px;margin-left:16px;border-radius:0;
  background:linear-gradient(to bottom,${M}60,#E2E8F0);
  transition:background 0.3s;
}
.rai-step-connector.done{background:linear-gradient(to bottom,${B},${M});}

.rai-review-row{
  display:flex;justify-content:space-between;gap:16px;
  padding:11px 0;border-bottom:1px solid #F1F5F9;font-size:13.5px;
}
.rai-review-row:last-child{border-bottom:none;}

@keyframes raiSlideIn{
  from{opacity:0;transform:translateY(10px);}
  to  {opacity:1;transform:translateY(0);}
}
.rai-anim{animation:raiSlideIn 0.35s cubic-bezier(.22,1,.36,1) both;}

/* single-select option cards */
.rai-opt-card{
  display:flex;align-items:center;gap:12px;
  padding:13px 16px;border-radius:0 !important;border:1.5px solid #DDE5EF;
  background:#FAFBFD;cursor:pointer;transition:all 0.18s;
  font-size:12.5px;font-family:${FF};text-align:left;
  color:#344054;width:100%;
}
.rai-opt-card:hover{border-color:${M};background:#F0F6FF;}
.rai-opt-card.selected{border-color:${M};background:rgba(0,94,184,0.06);color:${B};font-weight:700;}
.rai-opt-radio{
  width:18px;height:18px;border-radius:50%;border:2px solid #CBD5E1;
  flex-shrink:0;display:flex;align-items:center;justify-content:center;
  transition:all 0.18s;
}
.rai-opt-card.selected .rai-opt-radio{border-color:${M};background:${M};}
.rai-opt-radio-dot{width:7px;height:7px;border-radius:50%;background:#fff;}

/* multi-select checkbox cards */
.rai-chk-card{
  display:flex;align-items:center;gap:10px;
  padding:10px 14px;border-radius:0 !important;border:1.5px solid #DDE5EF;
  background:#FAFBFD;cursor:pointer;transition:all 0.18s;
  font-size:12.5px;font-family:${FF};text-align:left;color:#344054;
}
.rai-chk-card:hover{border-color:${M};background:#F0F6FF;}
.rai-chk-card.checked{border-color:${M};background:rgba(0,94,184,0.06);color:${B};font-weight:600;}
.rai-chk-box{
  width:17px;height:17px;border-radius:50%;border:2px solid #CBD5E1;
  flex-shrink:0;display:flex;align-items:center;justify-content:center;
  transition:all 0.18s;
}
.rai-chk-card.checked .rai-chk-box{border-color:${M};background:${M};}

.rai-fact{
  display:flex;align-items:center;gap:8px;
  font-size:12.5px;color:#3D5880;padding:8px 12px;
  background:rgba(0,94,184,0.06);border-radius:0;
  border:1px solid rgba(0,94,184,0.12);
}
`;

// ── Sub-components ────────────────────────────────────────────────────────────

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label className="rai-label">
        {label}{required && <span style={{ color: "#64748B", marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <div className="rai-hint">{hint}</div>}
    </div>
  );
}

// `OptionCards` — single-select. Detects when the current value is a "custom"
// one (i.e. not in `options`, ignoring the literal OTHER_OPT marker) and keeps
// the Other card selected + its text field populated in that case, so a value
// typed earlier survives re-renders (e.g. navigating Back then Continue again).
function OptionCards({ options, value, onChange }: {
  options: string[]; value: string; onChange: (v: string) => void;
}) {
  const knownValues = options.filter(o => o !== OTHER_OPT);
  const isCustomValue = value !== "" && !knownValues.includes(value);
  const [otherActive, setOtherActive] = useState(isCustomValue);
  const [otherText, setOtherText] = useState(isCustomValue ? value : "");

  const selectOther = () => {
    setOtherActive(true);
    onChange(otherText); // may be "" initially — Continue stays disabled until typed
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {options.map(opt => {
        if (opt === OTHER_OPT) {
          const selected = otherActive || isCustomValue;
          return (
            <div key={opt} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button type="button"
                className={`rai-opt-card${selected ? " selected" : ""}`}
                onClick={selectOther}
              >
                <div className="rai-opt-radio">{selected && <div className="rai-opt-radio-dot" />}</div>
                {opt}
              </button>
              {selected && (
                <input
                  className="rai-inp"
                  style={{ marginLeft: 30, width: "calc(100% - 30px)" }}
                  placeholder="Type your own answer…"
                  value={otherText}
                  onChange={e => { setOtherText(e.target.value); onChange(e.target.value); }}
                  autoFocus
                />
              )}
            </div>
          );
        }
        return (
          <button key={opt} type="button"
            className={`rai-opt-card${value === opt ? " selected" : ""}`}
            onClick={() => { setOtherActive(false); onChange(opt); }}
          >
            <div className="rai-opt-radio">
              {value === opt && <div className="rai-opt-radio-dot" />}
            </div>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// `CheckCards` — multi-select. "Other" stores its typed text as one entry in
// the `values` array (alongside any other checked options), so multiple
// custom entries aren't supported — one free-text slot, same as the rest of
// the app's multi-selects.
function CheckCards({ options, values, onChange }: {
  options: string[]; values: string[]; onChange: (v: string[]) => void;
}) {
  const knownValues = options.filter(o => o !== OTHER_OPT);
  const customValue = values.find(v => !knownValues.includes(v)) ?? "";
  const [otherActive, setOtherActive] = useState(Boolean(customValue));
  const [otherText, setOtherText] = useState(customValue);

  const toggle = (opt: string) =>
    onChange(values.includes(opt) ? values.filter(v => v !== opt) : [...values, opt]);

  const toggleOther = () => {
    if (otherActive) {
      setOtherActive(false);
      onChange(values.filter(v => v !== otherText));
      setOtherText("");
    } else {
      setOtherActive(true);
    }
  };

  const updateOtherText = (text: string) => {
    onChange([...values.filter(v => v !== otherText), ...(text ? [text] : [])]);
    setOtherText(text);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {options.map(opt => {
        if (opt === OTHER_OPT) {
          return (
            <div key={opt} style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 8 }}>
              <button type="button"
                className={`rai-chk-card${otherActive ? " checked" : ""}`}
                style={{ width: "calc(50% - 4px)" }}
                onClick={toggleOther}
              >
                <div className="rai-chk-box">
                  {otherActive && (
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                </div>
                {opt}
              </button>
              {otherActive && (
                <input
                  className="rai-inp"
                  placeholder="Type your own answer…"
                  value={otherText}
                  onChange={e => updateOtherText(e.target.value)}
                  autoFocus
                />
              )}
            </div>
          );
        }
        return (
          <button key={opt} type="button"
            className={`rai-chk-card${values.includes(opt) ? " checked" : ""}`}
            onClick={() => toggle(opt)}
          >
            <div className="rai-chk-box">
              {values.includes(opt) && (
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              )}
            </div>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

const ChevronDown = () => (
  <svg style={{ position:"absolute", right:13, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}
    width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
);

// ── Main component ────────────────────────────────────────────────────────────

export default function RegisterAi() {
  const navigate = useNavigate();
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // Step 1 — Identity
  const [name, setName]       = useState("");
  const [domain, setDomain]   = useState("");
  const [desc, setDesc]       = useState("");
  const [sysPrompt, setSysPr] = useState("");

  // Step 2 — Deployment context
  //   These map directly to the fields _extract_registration_value() reads:
  //   end_users → "users" dimension
  //   decision_influence → enriched description context
  //   data_types → "sensitive_data" dimension (multi-select)
  //   jurisdictions → "jurisdiction" dimension (multi-select)
  //   deployment_status → enriched description context
  //   real_time_data → "data_access" dimension
  //   autonomous_actions → "autonomous_actions" dimension
  const [endUsers, setEndUsers]                 = useState("");
  const [decisionInfluence, setDecisionInfl]    = useState("");
  const [dataTypes, setDataTypes]               = useState<string[]>([]);
  const [jurisdictions, setJurisdictions]       = useState<string[]>([]);
  const [deploymentStatus, setDeploymentStatus] = useState("");
  const [realTimeData, setRealTimeData]         = useState("");
  const [autonomousActions, setAutonomousActions] = useState("");

  // Step 3 — Governance
  //   oversight_model → Accountability / Safety TAF scores
  //   highestStakes → "refusals" dimension in fingerprinter
  //   outputVisibility → transparency probes
  //   biasTested → Fairness scoring context
  const [oversight, setOversight]               = useState("");
  const [outputVisibility, setOutputVisibility] = useState("");
  const [highestStakes, setHighestStakes]       = useState("");
  const [biasTested, setBiasTested]             = useState("");

  const canNext = () => {
    if (step === 1) return name.trim().length > 1 && Boolean(domain);
    if (step === 2) return Boolean(endUsers) && Boolean(decisionInfluence) && Boolean(deploymentStatus);
    if (step === 3) return Boolean(oversight);
    return true;
  };

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      await registerAI({
        name:        name.trim(),
        description: desc.trim() || `${name} — ${domain} AI agent`,
        domain,
        // Connector is a stub — real credentials are entered per-audit in the Dashboard.
        // The backend schema requires the field, so we send an empty placeholder.
        connector: { type: "", endpoint: "", headers: {} },
        // All context fields feed into the behavioral fingerprinter and probe generator.
        profile: {
          end_users:              endUsers,
          decision_influence:     decisionInfluence,
          data_types:             dataTypes,
          jurisdictions,
          deployment_status:      deploymentStatus,
          real_time_data:         realTimeData,
          autonomous_actions:     autonomousActions,
          oversight_model:        oversight,
          output_visibility:      outputVisibility,
          highest_stakes_failure: highestStakes,
          bias_tested:            biasTested,
        },
      });
      localStorage.setItem("activeAI", name.trim());
      navigate("/dashboard");
    } catch (e: any) {
      const d = e?.response?.data?.detail;
      if (Array.isArray(d)) setError(d.map((x: any) => `${x.loc?.slice(-1)[0]}: ${x.msg}`).join(" · "));
      else setError(typeof d === "string" ? d : e.message || "Registration failed.");
    } finally { setLoading(false); }
  };

  const sidebar = SIDEBAR_CONTENT[step];

  return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight:"100vh", background:"#F0F4FA", fontFamily:FF, color:"#0F172A", display:"flex", flexDirection:"column" }}>

        {/* ── HEADER ── */}
        <div style={{ background:`linear-gradient(135deg,${B},${M})`, flexShrink:0, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize:"28px 28px", pointerEvents:"none" }} />
          <div style={{ maxWidth:1260, margin:"0 auto", padding:"22px 40px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <img src="/kpmg-logo.png" alt="KPMG" style={{ height:38 }} />
              <div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase" as const, color:"rgba(255,255,255,0.45)", marginBottom:2 }}>AI Register · New Agent</div>
                <div style={{ fontSize:18, fontWeight:900, color:"#fff", letterSpacing:"-0.3px" }}>Register AI Agent</div>
              </div>
            </div>
            <button onClick={() => navigate("/dashboard")}
              style={{ padding:"8px 18px", borderRadius:0, border:"1.5px solid rgba(255,255,255,0.25)", background:"rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.85)", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:FF, backdropFilter:"blur(8px)", transition:"all 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.background="rgba(255,255,255,0.18)")}
              onMouseLeave={e => (e.currentTarget.style.background="rgba(255,255,255,0.1)")}
            >← Back to Dashboard</button>
          </div>
        </div>

        {/* ── BODY ── */}
        <div style={{ flex:1, maxWidth:1260, margin:"0 auto", width:"100%", padding:"36px 40px 80px", display:"grid", gridTemplateColumns:"280px 1fr 280px", gap:28, alignItems:"start" }}>

          {/* LEFT: step navigator */}
          <div style={{ position:"sticky", top:28 }}>
            <div style={{ background:"#fff", borderRadius:0, border:"1.5px solid #E2EAF4", padding:"24px 20px", boxShadow:"0 2px 12px rgba(0,51,141,0.06)" }}>
              <div style={{ fontSize:11, fontWeight:800, color:"#94A3B8", letterSpacing:"1.8px", textTransform:"uppercase" as const, marginBottom:18 }}>Progress</div>
              {STEPS.map((s, i) => (
                <div key={s.id}>
                  <div className={`rai-step-item${step === s.id ? " active" : ""}${step > s.id ? " done" : ""}`}
                    onClick={() => step > s.id && setStep(s.id)}>
                    <div className={`rai-step-circle${step > s.id ? " done" : step === s.id ? " active" : " future"}`}>
                      {step > s.id ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : s.id}
                    </div>
                    <div>
                      <div style={{ fontSize:13.5, fontWeight:step === s.id ? 800 : 600, color: step === s.id ? M : step > s.id ? "#374151" : "#B0C0D4", lineHeight:1.2, marginBottom:2 }}>{s.label}</div>
                      <div style={{ fontSize:11.5, color: step === s.id ? "#5A7090" : "#C4CFDA", fontWeight:500 }}>{s.sub}</div>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && <div className={`rai-step-connector${step > s.id ? " done" : ""}`} />}
                </div>
              ))}
            </div>
          </div>

          {/* MAIN FORM */}
          <div>
            <div key={step} className="rai-anim" style={{ background:"#fff", borderRadius:0, border:"1.5px solid #E2EAF4", padding:"36px 36px 32px", boxShadow:"0 2px 20px rgba(0,51,141,0.07)", minHeight:440 }}>

              {/* Step header */}
              <div style={{ marginBottom:28 }}>
                <div style={{ fontSize:11, fontWeight:800, color:M, letterSpacing:"2px", textTransform:"uppercase" as const, marginBottom:8 }}>Step {step} of {STEPS.length}</div>
                <div style={{ fontSize:22, fontWeight:900, color:"#0B1F33", letterSpacing:"-0.4px", marginBottom:6 }}>
                  {step === 1 && "About your AI agent"}
                  {step === 2 && "Deployment & risk scope"}
                  {step === 3 && "Governance & oversight"}
                  {step === 4 && "Review & confirm"}
                </div>
                <div style={{ fontSize:14, color:"#7A90A8", lineHeight:1.6 }}>
                  {step === 1 && "Give your agent a name and context. This shapes the probes and informs the LLM Judge panel."}
                  {step === 2 && "Who uses this agent, what data it handles, and how it makes decisions. This determines the probe types and risk thresholds."}
                  {step === 3 && "Oversight model, highest-stakes failure mode, and compliance context. These directly affect Accountability and Safety scores."}
                  {step === 4 && "Confirm all details before registering your agent. Connection credentials are provided fresh at audit time from the Dashboard."}
                </div>
              </div>

              {/* ── STEP 1: Identity ── */}
              {step === 1 && (
                <div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 20px" }}>
                    <Field label="Agent Name" required>
                      <input className="rai-inp" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Acme Customer Support Bot" />
                    </Field>
                    <Field label="Industry Domain" required>
                      <div className="rai-sel-wrap">
                        <select className="rai-sel" value={domain} onChange={e => setDomain(e.target.value)} style={{ color: domain ? "#0F172A" : "#B0C0D4" }}>
                          <option value="">Select domain…</option>
                          {DOMAIN_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <ChevronDown />
                      </div>
                    </Field>
                  </div>
                  <Field label="Description" hint="What does this agent do? Used as the audit record description and fed to the LLM Judge.">
                    <textarea className="rai-ta" value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Handles inbound customer queries for billing and returns…" />
                  </Field>
                  <Field label="System Prompt" hint="Optional — but significantly improves LLM Judge accuracy. Paste the actual system prompt your agent uses.">
                    <textarea className="rai-ta" value={sysPrompt} onChange={e => setSysPr(e.target.value)}
                      placeholder="You are a helpful assistant for Acme Corp. You help customers with…"
                      style={{ minHeight:80, fontFamily:"'Fira Code', 'JetBrains Mono', monospace", fontSize:12.5 }} />
                  </Field>
                </div>
              )}

              {/* ── STEP 2: Deployment & risk scope ── */}
              {step === 2 && (
                <div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 32px" }}>
                    <Field label="Primary End Users" required hint="Affects safety probe intensity and vulnerability risk classification.">
                      <OptionCards options={buildOptions(domain, "endUsers", END_USER_OPTS)} value={endUsers} onChange={setEndUsers} />
                    </Field>
                    <Field label="Decision Influence" required hint="How much does this agent influence real decisions? Sets the accountability bar.">
                      <OptionCards options={[...DECISION_INFLUENCE_OPTS, OTHER_OPT]} value={decisionInfluence} onChange={setDecisionInfl} />
                    </Field>
                  </div>

                  <Field label="Sensitive Data Processed" hint="Select all that apply. Activates privacy and data protection probes.">
                    <CheckCards options={buildOptions(domain, "dataTypes", DATA_TYPE_OPTS)} values={dataTypes} onChange={setDataTypes} />
                  </Field>

                  <Field label="Regulatory Jurisdictions" hint="Select all that apply. Triggers regulation-specific compliance probes.">
                    <CheckCards options={buildOptions(domain, "jurisdictions", JURISDICTION_OPTS)} values={jurisdictions} onChange={setJurisdictions} />
                  </Field>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 32px" }}>
                    <Field label="Deployment Status" required hint="Affects how audit results are weighted for production risk.">
                      <OptionCards options={[...DEPLOYMENT_STATUS_OPTS, OTHER_OPT]} value={deploymentStatus} onChange={setDeploymentStatus} />
                    </Field>
                    <Field label="Output Visibility" hint="Who sees this agent's outputs?">
                      <OptionCards options={[...OUTPUT_VISIBILITY_OPTS, OTHER_OPT]} value={outputVisibility} onChange={setOutputVisibility} />
                    </Field>
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 20px" }}>
                    <Field label="Real-time Data / Tool Access" hint="Does it query live APIs, databases, or search? Activates agentic data-access probes.">
                      <input className="rai-inp" value={realTimeData} onChange={e => setRealTimeData(e.target.value)} placeholder="e.g. Queries customer CRM, weather API, internal KB" />
                    </Field>
                    <Field label="Autonomous Actions" hint="Can it send emails, modify records, make payments, or call external services?">
                      <input className="rai-inp" value={autonomousActions} onChange={e => setAutonomousActions(e.target.value)} placeholder="e.g. Books appointments, sends confirmation emails" />
                    </Field>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Governance ── */}
              {step === 3 && (
                <div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 32px" }}>
                    <Field label="Human Oversight Level" required hint="Directly affects Accountability and Safety TAF scores.">
                      <OptionCards options={buildOptions(domain, "oversight", OVERSIGHT_OPTS)} value={oversight} onChange={setOversight} />
                    </Field>
                    <div>
                      <Field label="Highest-Stakes Failure Mode" hint="One sentence: what's the worst realistic failure? Used to generate targeted adversarial probes.">
                        <textarea className="rai-ta" value={highestStakes} onChange={e => setHighestStakes(e.target.value)}
                          placeholder="e.g. Misclassifies a fraud case as legitimate, causing financial loss to a customer"
                          style={{ minHeight:90 }} />
                      </Field>
                      <Field label="Has Bias Testing Been Done?" hint="Affects how the Fairness principle is scored.">
                        <OptionCards options={[...BIAS_TESTED_OPTS, OTHER_OPT]} value={biasTested} onChange={setBiasTested} />
                      </Field>
                    </div>
                  </div>

                  {/* Connection callout — explains where credentials go */}
                  <div style={{ marginTop:8, display:"flex", gap:12, padding:"14px 18px", background:"#F0F6FF", border:"1.5px solid rgba(0,94,184,0.18)", borderRadius:0, fontSize:13, color:"#1E3A5F", lineHeight:1.7 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={M} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:2 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span><strong>Connection details (API key, endpoint URL) are not stored here.</strong> You'll enter them each time you run a Black Box Audit from the Dashboard — keeping credentials out of the registration record entirely.</span>
                  </div>
                </div>
              )}

              {/* ── STEP 4: Review ── */}
              {step === 4 && (
                <div>
                  <div style={{ borderRadius:0, border:"1.5px solid #E2EAF4", overflow:"hidden", marginBottom:22 }}>
                    <div style={{ background:B, padding:"12px 20px" }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.55)", letterSpacing:"1.5px", textTransform:"uppercase" as const }}>Agent Summary</div>
                      <div style={{ fontSize:17, fontWeight:900, color:"#fff", marginTop:2 }}>{name || "—"}</div>
                    </div>
                    <div style={{ padding:"4px 20px 12px", background:"#FAFBFD" }}>
                      {([
                        ["Domain",               domain],
                        ["Description",          desc || `${name} — ${domain} agent`],
                        ["End Users",            endUsers],
                        ["Decision Influence",   decisionInfluence],
                        ["Data Types",           dataTypes.join(", ") || "—"],
                        ["Jurisdictions",        jurisdictions.join(", ") || "—"],
                        ["Deployment Status",    deploymentStatus],
                        ["Real-time Data",       realTimeData || "—"],
                        ["Autonomous Actions",   autonomousActions || "—"],
                        ["Output Visibility",    outputVisibility || "—"],
                        ["Human Oversight",      oversight],
                        ["Highest-Stakes Risk",  highestStakes || "—"],
                        ["Bias Testing",         biasTested || "—"],
                      ] as [string, string][]).map(([k, v]) => (
                        <div className="rai-review-row" key={k}>
                          <span style={{ color:"#64748B", fontWeight:500, flexShrink:0 }}>{k}</span>
                          <span style={{ color:"#0F172A", fontWeight:600, textAlign:"right", maxWidth:"60%", wordBreak:"break-all" }}>{v || "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:12, padding:"14px 18px", background:"#F0F6FF", border:"1.5px solid rgba(0,94,184,0.18)", borderRadius:0, fontSize:13, color:"#1E3A5F", lineHeight:1.7 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={M} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:2 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>After registering, go to <strong style={{ color:B }}>Run Audit</strong> on the Dashboard. You'll enter your API key and endpoint there to start the Black Box Audit.</span>
                  </div>
                </div>
              )}

              {error && (
                <div style={{ marginTop:16, padding:"12px 16px", background:"#FFF5F5", border:"1px solid #FED7D7", borderRadius:0, fontSize:13, color:"#C53030" }}>
                  {error}
                </div>
              )}
            </div>

            {/* NAV BUTTONS */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:16, gap:10 }}>
              {step > 1 ? (
                <button className="rai-btn-g" onClick={() => setStep(step - 1)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Back
                </button>
              ) : <div />}
              {step < 4 ? (
                <button className="rai-btn-p" onClick={() => canNext() && setStep(step + 1)} disabled={!canNext()}>
                  Continue
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              ) : (
                <button className="rai-btn-p" onClick={submit} disabled={loading}>
                  {loading ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation:"spin 1s linear infinite" }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                      Registering…
                    </>
                  ) : (
                    <>
                      Register Agent
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div key={`help-${step}`} className="rai-anim" style={{ position:"sticky", top:28 }}>
            <div style={{ background:"#fff", borderRadius:0, border:"1.5px solid #E2EAF4", padding:"24px 22px", boxShadow:"0 2px 12px rgba(0,51,141,0.06)" }}>
              <div style={{ width:36, height:36, borderRadius:0, background:`linear-gradient(135deg,${B},${M})`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div style={{ fontSize:14, fontWeight:800, color:"#0B1F33", marginBottom:8, lineHeight:1.3 }}>{sidebar.heading}</div>
              <div style={{ fontSize:13, color:"#5A7090", lineHeight:1.72, marginBottom:16 }}>{sidebar.body}</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {sidebar.facts.map((f, i) => (
                  <div key={i} className="rai-fact">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={M} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop:14, padding:"12px 16px", background:"#fff", borderRadius:0, border:"1.5px solid #E2EAF4" }}>
              {(() => {
                const answered = [
                  name.trim().length > 1,
                  Boolean(domain),
                  desc.trim().length > 0,
                  sysPrompt.trim().length > 0,
                  Boolean(endUsers),
                  Boolean(decisionInfluence),
                  dataTypes.length > 0,
                  jurisdictions.length > 0,
                  Boolean(deploymentStatus),
                  Boolean(outputVisibility),
                  realTimeData.trim().length > 0,
                  autonomousActions.trim().length > 0,
                  Boolean(oversight),
                  highestStakes.trim().length > 0,
                  Boolean(biasTested),
                ].filter(Boolean).length;
                const total = 15;
                const pct = Math.round((answered / total) * 100);
                return (
                  <>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:7 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", letterSpacing:"0.4px" }}>
                        {answered} of {total} answered
                      </div>
                      <div style={{ fontSize:12, fontWeight:800, color:M }}>{pct}%</div>
                    </div>
                    <div style={{ height:5, borderRadius:99, background:"#EEF2F8", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${B},${T})`, borderRadius:99, transition:"width 0.35s cubic-bezier(.16,1,.3,1)" }} />
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </>
  );
}