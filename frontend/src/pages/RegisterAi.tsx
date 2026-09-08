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

// ── TAF Risk Category capabilities ──────────────────────────────────────────
// GAI (Generative AI) is always included — we only audit generative systems.
// The user picks which additional risk categories apply based on what the AI
// system does. Each option maps 1-to-1 with a category in taf_taxonomy.json.
// The code values (PAI, PD, DM, DP) are what gets stored and sent to the backend.

const TAF_CAPABILITY_OPTS: { code: string; label: string; sublabel: string; icon: string }[] = [
  {
    code:     "PAI",
    label:    "Predictive AI",
    sublabel: "Classifies, scores, or forecasts outcomes (e.g. credit scoring, fraud detection, churn prediction)",
    icon:     "M3 3h18v4H3zM3 10h12v4H3zM3 17h8v4H3z",  // bar-chart shape
  },
  {
    code:     "PD",
    label:    "Pattern Discovery",
    sublabel: "Clusters, segments, or detects anomalies without predefined labels (e.g. customer segmentation, anomaly detection)",
    icon:     "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 4v4l3 3",  // search / discover
  },
  {
    code:     "DM",
    label:    "Decision-Making / Agentic AI",
    sublabel: "Takes autonomous actions, routes workflows, or makes binding decisions (e.g. booking agents, approval systems)",
    icon:     "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  },
  {
    code:     "DP",
    label:    "Data Personalisation",
    sublabel: "Recommends or personalises content, products, or experiences for individual users",
    icon:     "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  },
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

// ── Build provenance (feeds the Code & Build Risk tab) ──────────────────────
const AI_GENERATED_OPTS = [
  "Yes — mostly built with AI code-gen tools",
  "Partially — some parts AI-generated",
  "No — hand-written",
  "Unknown",
];
const REVIEW_GATE_OPTS = [
  "Yes — a human reviews code before deploy",
  "No — code ships without human review",
  "Unknown",
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
  { id: 1, label: "Basic info",         sub: "Name, domain & description"        },
  { id: 2, label: "Users & data",       sub: "Who uses it and what it handles"   },
  { id: 3, label: "Capabilities",       sub: "What else does it do?"             },
  { id: 4, label: "Risk & oversight",   sub: "Controls and worst-case scenarios" },
  { id: 5, label: "Review & register",  sub: "Confirm and submit"                },
];

const SIDEBAR_CONTENT: Record<number, { heading: string; body: string; facts: string[] }> = {
  1: {
    heading: "Start with the basics",
    body:    "The name and description travel with your agent through the whole audit — they show up on the final PDF report and help the AI judge panel understand what the system is supposed to do. Domain helps us tailor the probes. System prompt is optional but makes the judge noticeably sharper.",
    facts:   ["Name appears on your final PDF report", "Domain tailors which probes are generated", "System prompt boosts judge accuracy by ~20%"],
  },
  2: {
    heading: "Context shapes the whole audit",
    body:    "Who's on the receiving end of this AI, what data it handles, and where it's deployed directly affects which checks get run and how strict the thresholds are. A chatbot handling medical records gets very different tests than one answering FAQs.",
    facts:   ["End-user type adjusts safety probe intensity", "Data types activate privacy-specific probes", "Jurisdictions trigger regulation-specific checks"],
  },
  3: {
    heading: "What risk controls apply?",
    body:    "Generative AI risk checks run for every system — that's automatic. This step is about telling us if your system also does anything extra: predicting outcomes, making autonomous decisions, personalising content, or finding patterns in data. Each one unlocks its own set of additional audit controls.",
    facts:   ["Generative AI controls always run — already included", "Each capability adds its own TAF risk controls", "You can pick multiple if the system does several things"],
  },
  4: {
    heading: "What's the worst that could happen?",
    body:    "The oversight level and worst-case failure description let us target the exact risk scenarios that matter — instead of running generic tests. The build provenance section powers the Code & Build Risk tab.",
    facts:   ["Oversight level affects 3 of 10 TAF principles", "Failure description sharpens probe targeting", "Build provenance enables Code & Build Risk checks"],
  },
  5: {
    heading: "Almost there",
    body:    "Your agent gets added to the AI Register right away. To run the audit, head to the Dashboard — you'll enter your API key and endpoint there each time. Credentials are never stored here.",
    facts:   ["Appears in your AI Register immediately", "Run the Black Box Audit from the Dashboard", "Connection details entered fresh each time — never stored"],
  },
};

// ── Styles ────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body{height:100%;}
body{background:#F0F4FA;}

.rai-inp{
  width:100%;padding:12px 14px;border-radius: 0;
  border:1.5px solid #DDE5EF;font-size:14px;font-family:${FF};
  color:#0F172A;background:#FAFBFD;outline:none;
  transition:border 0.18s,box-shadow 0.18s,background 0.18s;
}
.rai-inp:focus{border-color:${M};box-shadow:0 0 0 4px rgba(0,94,184,0.1);background:#fff;}
.rai-inp::placeholder{color:#B0C0D4;}

.rai-ta{
  width:100%;padding:12px 14px;border-radius: 0;
  border:1.5px solid #DDE5EF;font-size:13.5px;font-family:${FF};
  color:#0F172A;background:#FAFBFD;outline:none;resize:vertical;
  min-height:96px;line-height:1.65;transition:border 0.18s,box-shadow 0.18s,background 0.18s;
}
.rai-ta:focus{border-color:${M};box-shadow:0 0 0 4px rgba(0,94,184,0.1);background:#fff;}
.rai-ta::placeholder{color:#B0C0D4;}

.rai-sel-wrap{position:relative;}
.rai-sel{
  width:100%;padding:12px 38px 12px 14px;border-radius: 0;
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
  padding:13px 26px;border-radius: 0;border:none;
  background:linear-gradient(135deg,${B},${M});
  color:#fff;font-size:14px;font-weight:800;font-family:${FF};
  cursor:pointer;transition:transform 0.18s,box-shadow 0.18s;
  box-shadow:0 4px 16px rgba(0,51,141,0.22);
}
.rai-btn-p:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 28px rgba(0,51,141,0.3);}
.rai-btn-p:disabled{opacity:0.38;cursor:not-allowed;transform:none;box-shadow:none;}

.rai-btn-g{
  display:inline-flex;align-items:center;gap:8px;
  padding:13px 22px;border-radius: 0;
  border:1.5px solid #D0DCEA;background:#fff;
  color:#4A6080;font-size:14px;font-weight:700;font-family:${FF};
  cursor:pointer;transition:all 0.18s;
}
.rai-btn-g:hover{border-color:${M};color:${M};background:#F0F6FF;}

.rai-step-item{
  display:flex;align-items:flex-start;gap:14px;
  padding:14px 16px;border-radius: 0;cursor:default;
  transition:background 0.2s;
}
.rai-step-item.done{cursor:pointer;}
.rai-step-item.done:hover{background:rgba(0,94,184,0.06);}
.rai-step-item.active{background:rgba(0,94,184,0.07);}

.rai-step-circle{
  width:34px;height:34px;border-radius: 50%;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  font-size:12px;font-weight:800;transition:all 0.22s;
  border:2px solid transparent;
}
.rai-step-circle.done{background:${B};color:#fff;border-color:${B};}
.rai-step-circle.active{background:#fff;color:${M};border-color:${M};box-shadow:0 0 0 4px rgba(0,94,184,0.12);}
.rai-step-circle.future{background:#F1F5F9;color:#B0C0D4;border-color:#E2E8F0;}

.rai-step-connector{
  width:2px;height:28px;margin-left:16px;border-radius: 0;
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
  padding:13px 16px;border-radius: 0 !important;border:1.5px solid #DDE5EF;
  background:#FAFBFD;cursor:pointer;transition:all 0.18s;
  font-size:12.5px;font-family:${FF};text-align:left;
  color:#344054;width:100%;
}
.rai-opt-card:hover{border-color:${M};background:#F0F6FF;}
.rai-opt-card.selected{border-color:${M};background:rgba(0,94,184,0.06);color:${B};font-weight:700;}
.rai-opt-radio{
  width:18px;height:18px;border-radius: 50%;border:2px solid #CBD5E1;
  flex-shrink:0;display:flex;align-items:center;justify-content:center;
  transition:all 0.18s;
}
.rai-opt-card.selected .rai-opt-radio{border-color:${M};background:${M};}
.rai-opt-radio-dot{width:7px;height:7px;border-radius: 50%;background:#fff;}

/* multi-select checkbox cards */
.rai-chk-card{
  display:flex;align-items:center;gap:10px;
  padding:10px 14px;border-radius: 0 !important;border:1.5px solid #DDE5EF;
  background:#FAFBFD;cursor:pointer;transition:all 0.18s;
  font-size:12.5px;font-family:${FF};text-align:left;color:#344054;
}
.rai-chk-card:hover{border-color:${M};background:#F0F6FF;}
.rai-chk-card.checked{border-color:${M};background:rgba(0,94,184,0.06);color:${B};font-weight:600;}
.rai-chk-box{
  width:17px;height:17px;border-radius: 50%;border:2px solid #CBD5E1;
  flex-shrink:0;display:flex;align-items:center;justify-content:center;
  transition:all 0.18s;
}
.rai-chk-card.checked .rai-chk-box{border-color:${M};background:${M};}

.rai-fact{
  display:flex;align-items:center;gap:8px;
  font-size:12.5px;color:#3D5880;padding:8px 12px;
  background:rgba(0,94,184,0.06);border-radius: 0;
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
  const [name, setName]             = useState("");
  const [domain, setDomain]         = useState("");
  const [desc, setDesc]             = useState("");
  const [sysPrompt, setSysPr]       = useState("");
  // TAF risk category scope (GAI always implicit; user picks extras here)
  const [tafCategories, setTafCategories] = useState<string[]>([]);

  // Step 3 — Users & data
  const [endUsers, setEndUsers]                 = useState("");
  const [dataTypes, setDataTypes]               = useState<string[]>([]);
  const [jurisdictions, setJurisdictions]       = useState<string[]>([]);
  const [deploymentStatus, setDeploymentStatus] = useState("");
  // Merged field: what the AI can do autonomously (real-time data + actions)
  const [agentCapabilities, setAgentCapabilities] = useState("");

  // Step 4 — Risk & oversight
  const [decisionInfluence, setDecisionInfl]    = useState("");
  const [oversight, setOversight]               = useState("");
  const [highestStakes, setHighestStakes]       = useState("");
  const [biasTested, setBiasTested]             = useState("");

  // Build provenance — feeds the (display-only) Code & Build Risk tab
  const [aiGenerated, setAiGenerated]           = useState("");
  const [aiCodegenTools, setAiCodegenTools]     = useState("");
  const [reviewGate, setReviewGate]             = useState("");

  const canNext = () => {
    if (step === 1) return name.trim().length > 1 && Boolean(domain);
    if (step === 2) return Boolean(endUsers) && Boolean(deploymentStatus);
    if (step === 3) return true; // capability picker — all optional beyond GAI
    if (step === 4) return Boolean(oversight);
    return true;
  };

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      await registerAI({
        name:        name.trim(),
        description: desc.trim() || `${name} — ${domain} AI agent`,
        domain,
        connector: { type: "", endpoint: "", headers: {} },
        profile: {
          end_users:              endUsers,
          decision_influence:     decisionInfluence,
          data_types:             dataTypes,
          jurisdictions,
          deployment_status:      deploymentStatus,
          // agentCapabilities is a merged free-text field covering both what
          // the agent can access (real-time data/tools) and what it can act on.
          // We send the same value to both backend slots so existing fingerprinter
          // logic that reads either field continues to work.
          real_time_data:         agentCapabilities,
          autonomous_actions:     agentCapabilities,
          oversight_model:        oversight,
          output_visibility:      "",   // removed from UI — no longer collected
          highest_stakes_failure: highestStakes,
          bias_tested:            biasTested,
          ai_generated:           aiGenerated.startsWith("Yes") ? "Yes"
                                 : aiGenerated.startsWith("Partially") ? "Partially"
                                 : aiGenerated.startsWith("No") ? "No" : "Unknown",
          ai_codegen_tools:       aiCodegenTools,
          human_review_gate:      reviewGate.startsWith("Yes") ? "Yes"
                                 : reviewGate.startsWith("No") ? "No" : "Unknown",
          taf_applicable_categories: tafCategories,
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
                  {step === 1 && "Tell us about your AI agent"}
                  {step === 2 && "Who uses it and what data does it handle?"}
                  {step === 3 && "What else does it do?"}
                  {step === 4 && "Risk, oversight & build context"}
                  {step === 5 && "Review & confirm"}
                </div>
                <div style={{ fontSize:14, color:"#7A90A8", lineHeight:1.6 }}>
                  {step === 1 && "Give it a name, pick the industry, and describe what it does. This is the foundation of your audit record."}
                  {step === 2 && "This shapes which probes get generated and how hard the thresholds are. Be as specific as you can."}
                  {step === 3 && "Generative AI controls always run automatically. Tick anything extra that applies — each one adds its own risk controls to the audit."}
                  {step === 4 && "A few questions about oversight, failure modes, and how the system was built. These directly affect accountability and safety scoring."}
                  {step === 5 && "Everything looks good? Hit register — you can always update details later from the Dashboard."}
                </div>
              </div>

              {/* ── STEP 1: Basic info ── */}
              {step === 1 && (
                <div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 20px" }}>
                    <Field label="Agent name" required hint="What do you call it? This appears on your audit report.">
                      <input className="rai-inp" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Acme Customer Support Bot" />
                    </Field>
                    <Field label="Industry" required hint="Pick the sector this agent operates in.">
                      <div className="rai-sel-wrap">
                        <select className="rai-sel" value={domain} onChange={e => setDomain(e.target.value)} style={{ color: domain ? "#0F172A" : "#B0C0D4" }}>
                          <option value="">Select industry…</option>
                          {DOMAIN_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <ChevronDown />
                      </div>
                    </Field>
                  </div>
                  <Field label="What does it do?" hint="Plain English is fine — one or two sentences. This description goes into the audit record and helps the judge panel understand the agent's purpose.">
                    <textarea className="rai-ta" value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Answers billing and returns questions for Acme's online store. Escalates to a human agent if it can't resolve the query." />
                  </Field>
                  <Field label="System prompt" hint="Optional, but it makes the AI judge panel noticeably more accurate. Paste the actual prompt if you have it.">
                    <textarea className="rai-ta" value={sysPrompt} onChange={e => setSysPr(e.target.value)}
                      placeholder="You are a helpful assistant for Acme Corp. You help customers with…"
                      style={{ minHeight:80, fontFamily:"'Fira Code', 'JetBrains Mono', monospace", fontSize:12.5 }} />
                  </Field>
                </div>
              )}

              {/* ── STEP 2: Users & data ── */}
              {step === 2 && (
                <div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 32px" }}>
                    <Field label="Who uses this agent?" required hint="Pick the closest match. This adjusts how hard the safety probes hit.">
                      <OptionCards options={buildOptions(domain, "endUsers", END_USER_OPTS)} value={endUsers} onChange={setEndUsers} />
                    </Field>
                    <Field label="Where is it deployed?" required hint="Affects how risk thresholds are weighted.">
                      <OptionCards options={[...DEPLOYMENT_STATUS_OPTS, OTHER_OPT]} value={deploymentStatus} onChange={setDeploymentStatus} />
                    </Field>
                  </div>

                  <Field label="What kind of data does it process?" hint="Tick everything that applies — this activates the relevant privacy and data-protection probes.">
                    <CheckCards options={buildOptions(domain, "dataTypes", DATA_TYPE_OPTS)} values={dataTypes} onChange={setDataTypes} />
                  </Field>

                  <Field label="Which regulations apply?" hint="Tick all that apply. Each one triggers its own compliance checks.">
                    <CheckCards options={buildOptions(domain, "jurisdictions", JURISDICTION_OPTS)} values={jurisdictions} onChange={setJurisdictions} />
                  </Field>

                  <Field label="Can it take actions on its own?" hint="e.g. sending emails, querying live databases, booking appointments, calling external APIs. Leave blank if it only reads and responds.">
                    <input className="rai-inp" value={agentCapabilities} onChange={e => setAgentCapabilities(e.target.value)}
                      placeholder="e.g. Queries the CRM, sends confirmation emails, books appointments" />
                  </Field>
                </div>
              )}

              {/* ── STEP 3: Capability picker (TAF risk scope) ── */}
              {step === 3 && (
                <div>
                  {/* Intro strip */}
                  <div style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"14px 18px", background:"#F0F6FF", border:"1.5px solid rgba(0,94,184,0.15)", marginBottom:24 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={M} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:1 }}><polyline points="20 6 9 17 4 12"/></svg>
                    <span style={{ fontSize:13, color:"#1E3A5F", lineHeight:1.65 }}>
                      <strong>Generative AI risk controls are already included for every audit.</strong>{" "}
                      If your system also predicts outcomes, makes autonomous decisions, recommends content, or spots patterns in data — tick those below. Each one adds its own set of audit controls. Leave everything blank if it's purely a generative assistant.
                    </span>
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {TAF_CAPABILITY_OPTS.map(opt => {
                      const checked = tafCategories.includes(opt.code);
                      return (
                        <button key={opt.code} type="button"
                          onClick={() => setTafCategories(prev =>
                            prev.includes(opt.code) ? prev.filter(c => c !== opt.code) : [...prev, opt.code]
                          )}
                          style={{
                            display:"flex", alignItems:"center", gap:16,
                            padding:"16px 20px", border:`1.5px solid ${checked ? M : "#DDE5EF"}`,
                            background: checked ? "rgba(0,94,184,0.04)" : "#FAFBFD",
                            cursor:"pointer", textAlign:"left", width:"100%",
                            transition:"all 0.18s", fontFamily:FF,
                          }}
                        >
                          {/* Checkbox */}
                          <div style={{
                            width:22, height:22, borderRadius:"50%", flexShrink:0,
                            border:`2px solid ${checked ? M : "#CBD5E1"}`,
                            background: checked ? M : "transparent",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            transition:"all 0.18s",
                          }}>
                            {checked && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>

                          {/* Text */}
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:14, fontWeight:700, color: checked ? B : "#1E293B", marginBottom:3 }}>{opt.label}</div>
                            <div style={{ fontSize:12.5, color:"#64748B", lineHeight:1.55 }}>{opt.sublabel}</div>
                          </div>

                          {/* Code badge */}
                          <div style={{
                            padding:"3px 9px", fontSize:10.5, fontWeight:800,
                            letterSpacing:"0.5px", fontFamily:"'Fira Code', monospace",
                            color: checked ? M : "#94A3B8",
                            border:`1.5px solid ${checked ? M : "#E2E8F0"}`,
                            background: checked ? "rgba(0,94,184,0.06)" : "#F8FAFC",
                            transition:"all 0.18s", flexShrink:0,
                          }}>{opt.code}</div>
                        </button>
                      );
                    })}
                  </div>

                  {tafCategories.length === 0 && (
                    <div style={{ marginTop:16, fontSize:12.5, color:"#94A3B8", textAlign:"center", padding:"10px 0" }}>
                      Nothing selected — only Generative AI controls will run. That's fine for a pure chatbot or assistant.
                    </div>
                  )}
                  {tafCategories.length > 0 && (
                    <div style={{ marginTop:16, padding:"10px 16px", background:"#F0FDF4", border:"1px solid #BBF7D0", fontSize:12.5, color:"#065F46" }}>
                      {tafCategories.length} additional {tafCategories.length === 1 ? "category" : "categories"} selected — those controls will be included in your audit alongside the Generative AI baseline.
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 4: Risk & oversight ── */}
              {step === 4 && (
                <div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 32px" }}>
                    <Field label="How much human oversight is there?" required hint="This directly affects Accountability and Safety scores in your TAF report.">
                      <OptionCards options={buildOptions(domain, "oversight", OVERSIGHT_OPTS)} value={oversight} onChange={setOversight} />
                    </Field>
                    <div>
                      <Field label="How does it influence decisions?" hint="Pick the option that best describes what happens when the AI produces an output.">
                        <OptionCards options={[...DECISION_INFLUENCE_OPTS, OTHER_OPT]} value={decisionInfluence} onChange={setDecisionInfl} />
                      </Field>
                    </div>
                  </div>

                  <Field label="What's the worst realistic failure?" hint="One sentence is enough. This is used to generate targeted adversarial probes — the more specific, the better.">
                    <textarea className="rai-ta" value={highestStakes} onChange={e => setHighestStakes(e.target.value)}
                      placeholder="e.g. Marks a legitimate transaction as fraud and locks a customer's account without human review"
                      style={{ minHeight:80 }} />
                  </Field>

                  <Field label="Has bias testing been done?" hint="Affects how the Fairness principle is scored.">
                    <OptionCards options={[...BIAS_TESTED_OPTS, OTHER_OPT]} value={biasTested} onChange={setBiasTested} />
                  </Field>

                  {/* Build provenance */}
                  <div style={{ marginTop:24, paddingTop:20, borderTop:"1.5px solid #EEF2F7" }}>
                    <div style={{ fontSize:14, fontWeight:800, color:"#0B1F33", marginBottom:4 }}>How was this system built?</div>
                    <div style={{ fontSize:13, color:"#7A90A8", marginBottom:18, lineHeight:1.6 }}>
                      Powers the Code &amp; Build Risk tab. Skip this section (leave as No / Unknown) if it's not relevant.
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 32px" }}>
                      <Field label="Was AI used to write the code?">
                        <OptionCards options={AI_GENERATED_OPTS} value={aiGenerated} onChange={setAiGenerated} />
                      </Field>
                      <div>
                        <Field label="Which tools?" hint="Optional — just for context on the report.">
                          <input className="rai-inp" value={aiCodegenTools} onChange={e => setAiCodegenTools(e.target.value)}
                            placeholder="e.g. Cursor + GitHub Copilot" />
                        </Field>
                        <Field label="Is there a human code review before deploy?">
                          <OptionCards options={REVIEW_GATE_OPTS} value={reviewGate} onChange={setReviewGate} />
                        </Field>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop:12, display:"flex", gap:12, padding:"14px 18px", background:"#F0F6FF", border:"1.5px solid rgba(0,94,184,0.18)", fontSize:13, color:"#1E3A5F", lineHeight:1.7 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={M} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:2 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span><strong>API keys and endpoint URLs aren't stored here.</strong> You enter them each time you kick off a Black Box Audit from the Dashboard.</span>
                  </div>
                </div>
              )}

              {/* ── STEP 5: Review ── */}
              {step === 5 && (
                <div>
                  <div style={{ borderRadius:0, border:"1.5px solid #E2EAF4", overflow:"hidden", marginBottom:22 }}>
                    <div style={{ background:B, padding:"12px 20px" }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.55)", letterSpacing:"1.5px", textTransform:"uppercase" as const }}>Agent Summary</div>
                      <div style={{ fontSize:17, fontWeight:900, color:"#fff", marginTop:2 }}>{name || "—"}</div>
                    </div>
                    <div style={{ padding:"4px 20px 12px", background:"#FAFBFD" }}>
                      {([
                        ["Industry",          domain],
                        ["Description",       desc || `${name} — ${domain} agent`],
                        ["Who uses it",       endUsers],
                        ["Deployed",          deploymentStatus],
                        ["Data processed",    dataTypes.join(", ") || "—"],
                        ["Regulations",       jurisdictions.join(", ") || "—"],
                        ["Agent actions",     agentCapabilities || "—"],
                        ["Risk categories",   ["Generative AI (always)", ...tafCategories.map(c => TAF_CAPABILITY_OPTS.find(o => o.code === c)?.label ?? c)].join(", ")],
                        ["Decision influence",decisionInfluence || "—"],
                        ["Human oversight",   oversight],
                        ["Worst-case failure",highestStakes || "—"],
                        ["Bias testing",      biasTested || "—"],
                      ] as [string, string][]).map(([k, v]) => (
                        <div className="rai-review-row" key={k}>
                          <span style={{ color:"#64748B", fontWeight:500, flexShrink:0 }}>{k}</span>
                          <span style={{ color:"#0F172A", fontWeight:600, textAlign:"right", maxWidth:"60%", wordBreak:"break-word" }}>{v || "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:12, padding:"14px 18px", background:"#F0F6FF", border:"1.5px solid rgba(0,94,184,0.18)", fontSize:13, color:"#1E3A5F", lineHeight:1.7 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={M} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:2 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>After registering, go to <strong style={{ color:B }}>Run Audit</strong> on the Dashboard. You'll enter your API key and endpoint there to kick off the Black Box Audit.</span>
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
              {step < 5 ? (
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
                  Boolean(deploymentStatus),
                  dataTypes.length > 0,
                  jurisdictions.length > 0,
                  agentCapabilities.trim().length > 0,
                  tafCategories.length > 0,
                  Boolean(decisionInfluence),
                  Boolean(oversight),
                  highestStakes.trim().length > 0,
                  Boolean(biasTested),
                ].filter(Boolean).length;
                const total = 14;
                const pct = Math.round((answered / total) * 100);
                return (
                  <>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:7 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", letterSpacing:"0.4px" }}>
                        {answered} of {total} answered
                      </div>
                      <div style={{ fontSize:12, fontWeight:800, color:M }}>{pct}%</div>
                    </div>
                    <div style={{ height:5, borderRadius:0, background:"#EEF2F8", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${B},${T})`, borderRadius:0, transition:"width 0.35s cubic-bezier(.16,1,.3,1)" }} />
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