/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerAI } from "../services/api";

// ── Approach 3: Enriched registration profile options ─────────────────────────
const END_USER_OPTIONS = ["Employees", "Customers", "Clinicians", "Students", "Public", "Developers"];
const DECISION_OPTIONS = ["Informational only", "Recommendations", "Approvals", "Automated actions"];
const DATA_TYPE_OPTIONS = ["PII", "Financial", "Medical", "Legal", "Proprietary IP", "None"];

export default function RegisterAI() {
  const navigate = useNavigate();

  // Core fields
  const [aiName,      setAiName]      = useState("");
  const [description, setDescription] = useState("");
  const [domain,      setDomain]      = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  // Approach 3: Enriched profile fields
  const [showProfile,      setShowProfile]      = useState(false);
  const [endUsers,         setEndUsers]         = useState("");
  const [decisionInfluence,setDecisionInfluence]= useState("");
  const [dataTypes,        setDataTypes]        = useState<string[]>([]);
  const [jurisdictions,    setJurisdictions]    = useState("");
  const [highestStakes,    setHighestStakes]    = useState("");
  const [systemPrompt,     setSystemPrompt]     = useState("");

  const toggleDataType = (dt: string) => {
    setDataTypes(prev =>
      prev.includes(dt) ? prev.filter(d => d !== dt) : [...prev, dt]
    );
  };

  const handleRegister = async () => {
    if (!aiName.trim()) return alert("Please enter AI Name");

    setLoading(true);
    setError("");

    try {
      // Build profile object if any profile fields are filled
      const hasProfile = endUsers || decisionInfluence || dataTypes.length || jurisdictions || highestStakes || systemPrompt;
      const profile = hasProfile ? {
        end_users:              endUsers,
        decision_influence:     decisionInfluence,
        data_types:             dataTypes,
        jurisdictions:          jurisdictions ? jurisdictions.split(",").map(j => j.trim()).filter(Boolean) : [],
        highest_stakes_failure: highestStakes,
        system_prompt:          systemPrompt,
      } : undefined;

      await registerAI({
        name:        aiName,
        description,
        domain,
        connector: { type: "internal", endpoint: "N/A", headers: {} },
        profile,
      });

      localStorage.setItem("activeAI", aiName);
      navigate("/dashboard");

    } catch (e: any) {
      setError(e?.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"'Plus Jakarta Sans','Inter',sans-serif", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .rai{width:100%;padding:14px 16px;border-radius:12px;border:1.5px solid #E3EAF3;font-size:14px;font-family:inherit;color:#0B1F33;background:#fff;transition:all 0.2s;outline:none;resize:none;}
        .rai:focus{border-color:#005EB8;box-shadow:0 0 0 4px rgba(0,94,184,0.1);}
        .rai::placeholder{color:#A0B4CC;}
        .rai-select{width:100%;padding:14px 16px;border-radius:12px;border:1.5px solid #E3EAF3;font-size:14px;font-family:inherit;color:#0B1F33;background:#fff;transition:all 0.2s;outline:none;appearance:none;cursor:pointer;}
        .rai-select:focus{border-color:#005EB8;box-shadow:0 0 0 4px rgba(0,94,184,0.1);}
        .ras{width:100%;padding:15px;border-radius:12px;border:none;background:linear-gradient(135deg,#00338D,#005EB8);color:#fff;font-size:15px;font-weight:700;font-family:inherit;cursor:pointer;transition:all 0.3s;box-shadow:0 6px 20px rgba(0,51,141,0.25);}
        .ras:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(0,51,141,0.35);}
        .ras:disabled{opacity:0.55;cursor:not-allowed;transform:none;}
        .ralp{flex:1;background:linear-gradient(145deg,#00338D 0%,#005EB8 55%,#0091DA 100%);display:flex;flex-direction:column;justify-content:center;padding:64px;position:relative;overflow:hidden;}
        .ralp::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px);background-size:52px 52px;pointer-events:none;}
        .raorb{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;}
        .rarp{width:560px;flex-shrink:0;display:flex;flex-direction:column;justify-content:flex-start;padding:48px 56px;background:#fff;overflow-y:auto;}
        .rapill{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.9);font-size:11px;font-weight:700;padding:6px 14px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;margin-bottom:32px;backdrop-filter:blur(8px);}
        .rapd{width:6px;height:6px;border-radius:50%;background:#00A3A1;animation:rapulse 2s ease-in-out infinite;}
        @keyframes rapulse{0%,100%{transform:scale(1);}50%{transform:scale(1.5);opacity:0.6;}}
        .ra-step{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.08);}
        .ra-step:last-child{border-bottom:none;}
        .ra-step-num{width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,0.15);color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .ra-step-text{font-size:13.5px;color:rgba(255,255,255,0.75);line-height:1.4;}
        .ra-step-text strong{color:#fff;font-weight:700;}
        .ra-label{font-size:11.5px;font-weight:700;color:#5A7090;letter-spacing:0.5px;margin-bottom:6px;text-transform:uppercase;}
        .ra-chip{display:inline-flex;align-items:center;padding:7px 14px;border-radius:100px;border:1.5px solid #E3EAF3;font-size:12.5px;font-weight:600;color:#5A7090;cursor:pointer;transition:all 0.18s;user-select:none;background:#FAFBFC;}
        .ra-chip:hover{border-color:#005EB8;color:#005EB8;}
        .ra-chip.active{background:#EBF2FF;border-color:#005EB8;color:#005EB8;}
        .ra-section-toggle{display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:12px;border:1.5px dashed #C8D8EC;cursor:pointer;font-size:13.5px;font-weight:600;color:#005EB8;transition:all 0.2s;background:#F7FAFF;width:100%;justify-content:space-between;}
        .ra-section-toggle:hover{background:#EBF2FF;border-color:#005EB8;}
        .ra-profile-section{background:#F7FAFF;border:1.5px solid #E3EAF3;border-radius:14px;padding:20px;margin-top:4px;animation:raUp 0.3s ease both;}
        .ra-profile-badge{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;background:#E8F4FF;color:#005EB8;padding:4px 10px;border-radius:6px;letter-spacing:0.5px;margin-bottom:14px;}
        @keyframes raUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        @media(max-width:768px){.ralp{display:none;}.rarp{width:100%;padding:40px 28px;}}
      `}</style>

      {/* LEFT PANEL */}
      <div className="ralp">
        <div className="raorb" style={{ width:420, height:420, background:"rgba(255,255,255,0.05)", top:-100, right:-80 }} />
        <div className="raorb" style={{ width:300, height:300, background:"rgba(0,163,161,0.14)", bottom:-80, left:-60 }} />
        <div style={{ position:"relative" }}>
          <div className="rapill"><div className="rapd" />Step 2 of 3</div>
          <h1 style={{ fontSize:"clamp(28px,3vw,44px)", fontWeight:900, color:"#fff", letterSpacing:"-1.5px", lineHeight:1.1, marginBottom:14 }}>
            Register your<br />AI system.
          </h1>
          <p style={{ fontSize:15, color:"rgba(255,255,255,0.6)", lineHeight:1.75, marginBottom:44, maxWidth:360 }}>
            The more context you give us, the more targeted and relevant your audit probes will be.
          </p>
          <div>
            {[
              ["Name your AI", "Give it a unique identifier for your audit workspace."],
              ["Add context", "Domain and description help calibrate the evaluation."],
              ["Configure profile", "Jurisdiction, user type, and stakes sharpen probe generation."],
              ["Behavioral fingerprinting", "We'll ask your AI a few warm-up questions to extract ground truth before the audit."],
              ["Auto-detection", "Our ML classifier identifies the model type from your logs."],
            ].map(([t, d], i) => (
              <div className="ra-step" key={t}>
                <div className="ra-step-num">{String(i + 1).padStart(2, "0")}</div>
                <div className="ra-step-text"><strong>{t}</strong> — {d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="rarp">
        <div style={{ animation:"raUp 0.7s cubic-bezier(.16,1,.3,1) both" }}>
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:11, fontWeight:800, color:"#005EB8", letterSpacing:"2.5px", textTransform:"uppercase", marginBottom:10 }}>Almost there</div>
            <h2 style={{ fontSize:30, fontWeight:900, color:"#00338D", letterSpacing:"-1px", marginBottom:8 }}>Register AI System</h2>
            <p style={{ fontSize:14, color:"#8FA3BF", lineHeight:1.6 }}>
              Configure your AI before starting the audit pipeline.
            </p>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* ── Core fields ────────────────────────────────────────── */}
            <div>
              <div className="ra-label">AI Name *</div>
              <input className="rai" type="text" placeholder="e.g. Sentinel v2, CreditScore-Bot" value={aiName} onChange={e => setAiName(e.target.value)} />
            </div>
            <div>
              <div className="ra-label">Description <span style={{ color:"#A0B4CC", fontWeight:400, textTransform:"none" }}>(optional)</span></div>
              <input className="rai" type="text" placeholder="What does this AI do?" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div>
              <div className="ra-label">Domain / Use Case <span style={{ color:"#A0B4CC", fontWeight:400, textTransform:"none" }}>(optional)</span></div>
              <input className="rai" type="text" placeholder="e.g. Healthcare, Finance, Legal, Agriculture" value={domain} onChange={e => setDomain(e.target.value)} />
            </div>

            {/* ── Approach 3: Enriched Profile (collapsible) ─────────── */}
            <button
              className="ra-section-toggle"
              onClick={() => setShowProfile(!showProfile)}
              type="button"
            >
              <span style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:16 }}></span>
                <span>Configure audit profile</span>
                <span style={{ fontSize:11, fontWeight:500, color:"#8FA3BF", marginLeft:2 }}>— sharpens probe relevance</span>
              </span>
              <span style={{ fontSize:18, fontWeight:300, color:"#005EB8", lineHeight:1 }}>
                {showProfile ? "−" : "+"}
              </span>
            </button>

            {showProfile && (
              <div className="ra-profile-section">
                <div className="ra-profile-badge">
                  <span></span> Context-Aware Probing
                </div>

                {/* End users */}
                <div style={{ marginBottom:16 }}>
                  <div className="ra-label">Who are the end users?</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {END_USER_OPTIONS.map(opt => (
                      <div
                        key={opt}
                        className={`ra-chip ${endUsers === opt ? "active" : ""}`}
                        onClick={() => setEndUsers(endUsers === opt ? "" : opt)}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Decision influence */}
                <div style={{ marginBottom:16 }}>
                  <div className="ra-label">What decisions does this AI influence?</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {DECISION_OPTIONS.map(opt => (
                      <div
                        key={opt}
                        className={`ra-chip ${decisionInfluence === opt ? "active" : ""}`}
                        onClick={() => setDecisionInfluence(decisionInfluence === opt ? "" : opt)}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Data types */}
                <div style={{ marginBottom:16 }}>
                  <div className="ra-label">What data does it process? <span style={{ fontWeight:400, textTransform:"none" }}>(multi-select)</span></div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {DATA_TYPE_OPTIONS.map(opt => (
                      <div
                        key={opt}
                        className={`ra-chip ${dataTypes.includes(opt) ? "active" : ""}`}
                        onClick={() => toggleDataType(opt)}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Jurisdictions */}
                <div style={{ marginBottom:16 }}>
                  <div className="ra-label">Jurisdictions <span style={{ fontWeight:400, textTransform:"none" }}>(comma-separated, e.g. India, EU, US)</span></div>
                  <input
                    className="rai"
                    type="text"
                    placeholder="e.g. India, EU, United States"
                    value={jurisdictions}
                    onChange={e => setJurisdictions(e.target.value)}
                  />
                </div>

                {/* Highest stakes failure */}
                <div style={{ marginBottom:16 }}>
                  <div className="ra-label">What's the highest-stakes failure mode? <span style={{ fontWeight:400, textTransform:"none" }}>(one sentence)</span></div>
                  <input
                    className="rai"
                    type="text"
                    placeholder="e.g. Misdiagnosis in triage, Wrongful credit denial"
                    value={highestStakes}
                    onChange={e => setHighestStakes(e.target.value)}
                  />
                </div>

                {/* System prompt (optional, private) */}
                <div>
                  <div className="ra-label">
                    System prompt <span style={{ fontWeight:400, textTransform:"none" }}>(optional — stays private, used for probe generation only)</span>
                  </div>
                  <textarea
                    className="rai"
                    rows={3}
                    placeholder="Paste your system prompt here for richer, more targeted audit probes…"
                    value={systemPrompt}
                    onChange={e => setSystemPrompt(e.target.value)}
                  />
                </div>

                <div style={{ marginTop:12, padding:"10px 14px", background:"#EBF2FF", borderRadius:10, fontSize:12.5, color:"#005EB8", lineHeight:1.5 }}>
                  This 2-minute configuration directly shapes which probes are generated. A healthcare AI deployed in rural India gets completely different fairness and language probes than a finance AI in the EU.
                </div>
              </div>
            )}

          </div>

          {error && (
            <div style={{ marginTop:14, padding:"12px 16px", background:"#FFF5F5", border:"1px solid #FED7D7", borderRadius:10, fontSize:13, color:"#C53030" }}>
              {error}
            </div>
          )}

          <button className="ras" style={{ marginTop:24 }} onClick={handleRegister} disabled={loading || !aiName}>
            {loading ? "Registering…" : "Register & Go to Dashboard →"}
          </button>

          <div style={{ marginTop:16, textAlign:"center", fontSize:13, color:"#8FA3BF", lineHeight:1.6 }}>
            Profile config is optional — you can update it later from the dashboard.
          </div>

          <div style={{ marginTop:8, textAlign:"center", fontSize:14, color:"#8FA3BF" }}>
            Already registered an AI?{" "}
            <span style={{ color:"#005EB8", fontWeight:700, cursor:"pointer" }} onClick={() => navigate("/dashboard")}>Go to Dashboard</span>
          </div>
        </div>
      </div>
    </div>
  );
}