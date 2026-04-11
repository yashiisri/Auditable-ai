// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { registerAI } from "../services/api";

// export default function RegisterAI() {
//   const navigate = useNavigate();

//   const [aiName, setAiName] = useState("");
//   const [description, setDescription] = useState("");
//   const [domain, setDomain] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleRegister = async () => {
//     if (!aiName.trim()) return alert("Please enter AI Name");

//     setLoading(true);
//     setError("");

//     try {
//       await registerAI({
//         name: aiName,
//         description,
//         domain,
//         connector: {
//           type: "internal",
//           endpoint: "N/A",
//           headers: {}
//         }
//       });

//       localStorage.setItem("activeAI", aiName);
//       navigate("/dashboard");

//     } catch (e: any) {
//       setError(e?.response?.data?.detail || "Registration failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="auth-layout">
//       <style>{`
//         :root {
//           --kpmg:      #00338D;
//           --kpmg-mid:  #005EB8;
//           --kpmg-lt:   #0091DA;
//           --success:   #00C896;
//           --bg:        #030C1E;
//           --surface:   #071530;
//           --border-lt: rgba(0,145,218,0.25);
//           --text:      #D8E8F5;
//           --muted:     #9DBFE0;
//         }

//         * { margin:0; padding:0; box-sizing:border-box; }

//         .auth-layout {
//           min-height:100vh;
//           background: radial-gradient(circle at 20% 20%, #00338D 0%, transparent 40%),
//                       radial-gradient(circle at 80% 70%, #00C896 0%, transparent 40%),
//                       #030C1E;
//           display:flex;
//           align-items:center;
//           justify-content:center;
//           padding:40px 20px;
//           position:relative;
//           overflow:hidden;
//           font-family:'IBM Plex Sans',sans-serif;
//           color:var(--text);
//         }

//         .auth-layout::before {
//           content:"";
//           position:absolute;
//           top:-200px;
//           right:-200px;
//           width:600px;
//           height:600px;
//           background:radial-gradient(circle, #0091DA33, transparent 70%);
//           opacity:0.18;
//           filter:blur(120px);
//           pointer-events:none;
//         }

//         .auth-card {
//           width:100%;
//           max-width:460px;
//           padding:56px 42px;
//           border-radius:20px;
//           background:linear-gradient(135deg, rgba(10,30,66,0.85), rgba(7,21,48,0.80));
//           backdrop-filter:blur(22px);
//           border:1px solid rgba(0,145,218,0.28);
//           box-shadow:0 25px 70px rgba(0,0,0,0.45),
//                      inset 0 0 40px rgba(255,255,255,0.03);
//           position:relative;
//           z-index:1;
//         }

//         .auth-card h2 {
//           font-size:28px;
//           font-weight:700;
//           text-align:center;
//           margin-bottom:8px;
//           color:#EAF2FB;
//         }

//         .auth-subtext {
//           text-align:center;
//           font-size:15px;
//           color:var(--muted);
//           margin-bottom:32px;
//           line-height:1.5;
//         }

//         .auth-card input {
//           width:100%;
//           padding:14px 16px;
//           margin-bottom:16px;
//           border-radius:10px;
//           border:1px solid rgba(0,145,218,0.35);
//           background:rgba(3,12,30,0.65);
//           color:#EAF2FB;
//           font-size:15px;
//           transition:all 0.2s ease;
//         }

//         .auth-card input::placeholder {
//           color:rgba(255,255,255,0.35);
//         }

//         .auth-card input:focus {
//           border-color:#00C896;
//           box-shadow:0 0 0 3px rgba(0,200,150,0.18);
//           outline:none;
//         }

//         .primary-btn {
//           width:100%;
//           padding:14px;
//           border-radius:10px;
//           border:none;
//           background:linear-gradient(135deg, #0091DA, #00C896);
//           color:white;
//           font-weight:600;
//           font-size:15px;
//           cursor:pointer;
//           transition:all 0.3s ease;
//           margin:24px 0 16px;
//         }

//         .primary-btn:hover:not(:disabled) {
//           transform:translateY(-2px);
//           box-shadow:0 10px 28px rgba(0,200,150,0.35);
//         }

//         .primary-btn:disabled {
//           opacity:0.6;
//           cursor:not-allowed;
//         }

//         .error-message {
//           color:#ff8787;
//           font-size:14px;
//           text-align:center;
//           margin:12px 0;
//           background:rgba(239,68,68,0.12);
//           padding:10px;
//           border-radius:8px;
//           border:1px solid rgba(239,68,68,0.3);
//         }

//         .auth-footer {
//           text-align:center;
//           font-size:14px;
//           color:var(--muted);
//         }

//         .auth-footer span {
//           color:#0091DA;
//           font-weight:600;
//           cursor:pointer;
//           transition:all 0.2s;
//         }

//         .auth-footer span:hover {
//           color:#00C896;
//           text-decoration:underline;
//         }

//         @media (max-width:480px) {
//           .auth-card {
//             padding:42px 24px;
//           }

//           .auth-card h2 {
//             font-size:24px;
//           }
//         }
//       `}</style>

//       <div className="auth-card">
//         <h2>Register AI System</h2>
//         <p className="auth-subtext">
//           Configure your AI model before starting the audit process
//         </p>

//         <input
//           type="text"
//           placeholder="AI Name (e.g. Sentiment Analyzer v2)"
//           value={aiName}
//           onChange={(e) => setAiName(e.target.value)}
//           disabled={loading}
//         />

//         <input
//           type="text"
//           placeholder="Description (Optional)"
//           value={description}
//           onChange={(e) => setDescription(e.target.value)}
//           disabled={loading}
//         />

//         <input
//           type="text"
//           placeholder="Domain / Use Case (e.g. Healthcare)"
//           value={domain}
//           onChange={(e) => setDomain(e.target.value)}
//           disabled={loading}
//         />

//         {error && <div className="error-message">{error}</div>}

//         <button
//           className="primary-btn"
//           onClick={handleRegister}
//           disabled={loading || !aiName}
//         >
//           {loading ? "Registering..." : "Register AI"}
//         </button>

//         <div className="auth-footer">
//           Already configured?{" "}
//           <span onClick={() => navigate("/dashboard")}>
//             Go to Dashboard
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// }



/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerAI } from "../services/api";

export default function RegisterAI() {
  const navigate = useNavigate();

  const [aiName, setAiName] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!aiName.trim()) return alert("Please enter AI Name");

    setLoading(true);
    setError("");

    try {
      await registerAI({
        name: aiName,
        description,
        domain,
        connector: {
          type: "internal",
          endpoint: "N/A",
          headers: {}
        }
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
        .ras{width:100%;padding:15px;border-radius:12px;border:none;background:linear-gradient(135deg,#00338D,#005EB8);color:#fff;font-size:15px;font-weight:700;font-family:inherit;cursor:pointer;transition:all 0.3s;box-shadow:0 6px 20px rgba(0,51,141,0.25);}
        .ras:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(0,51,141,0.35);}
        .ras:disabled{opacity:0.55;cursor:not-allowed;transform:none;}
        .ralp{flex:1;background:linear-gradient(145deg,#00338D 0%,#005EB8 55%,#0091DA 100%);display:flex;flex-direction:column;justify-content:center;padding:64px;position:relative;overflow:hidden;}
        .ralp::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px);background-size:52px 52px;pointer-events:none;}
        .raorb{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;}
        .rarp{width:520px;flex-shrink:0;display:flex;flex-direction:column;justify-content:center;padding:56px;background:#fff;overflow-y:auto;}
        .rapill{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.9);font-size:11px;font-weight:700;padding:6px 14px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;margin-bottom:32px;backdrop-filter:blur(8px);}
        .rapd{width:6px;height:6px;border-radius:50%;background:#00A3A1;animation:rapulse 2s ease-in-out infinite;}
        @keyframes rapulse{0%,100%{transform:scale(1);}50%{transform:scale(1.5);opacity:0.6;}}
        .ra-step{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.08);}
        .ra-step:last-child{border-bottom:none;}
        .ra-step-num{width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,0.15);color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .ra-step-text{font-size:13.5px;color:rgba(255,255,255,0.75);line-height:1.4;}
        .ra-step-text strong{color:#fff;font-weight:700;}
        .ra-label{font-size:11.5px;font-weight:700;color:#5A7090;letter-spacing:0.5px;margin-bottom:6px;}
        @keyframes raUp{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);}}
        @media(max-width:768px){.ralp{display:none;}.rarp{width:100%;padding:40px 28px;}}
      `}</style>

      {/* LEFT */}
      <div className="ralp">
        <div className="raorb" style={{ width:420, height:420, background:"rgba(255,255,255,0.05)", top:-100, right:-80 }} />
        <div className="raorb" style={{ width:300, height:300, background:"rgba(0,163,161,0.14)", bottom:-80, left:-60 }} />
        <div style={{ position:"relative" }}>
          <div className="rapill"><div className="rapd" />Step 2 of 3</div>
          <h1 style={{ fontSize:"clamp(28px,3vw,44px)", fontWeight:900, color:"#fff", letterSpacing:"-1.5px", lineHeight:1.1, marginBottom:14 }}>
            Register your<br />AI system.
          </h1>
          <p style={{ fontSize:15, color:"rgba(255,255,255,0.6)", lineHeight:1.75, marginBottom:44, maxWidth:360 }}>
            Tell us about your AI. We'll detect its type automatically from your logs.
          </p>
          <div>
            {[
              ["Name your AI", "Give it a unique identifier for your audit workspace."],
              ["Add context", "Domain and description help calibrate the evaluation."],
              ["Auto-detection", "Our ML classifier identifies the model type from your logs."],
              ["Go to Dashboard", "Start uploading logs and running your first audit."],
            ].map(([t, d], i) => (
              <div className="ra-step" key={t}>
                <div className="ra-step-num">{String(i + 1).padStart(2, "0")}</div>
                <div className="ra-step-text"><strong>{t}</strong> — {d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="rarp">
        <div style={{ animation:"raUp 0.7s cubic-bezier(.16,1,.3,1) both" }}>
          <div style={{ marginBottom:32 }}>
            <div style={{ fontSize:11, fontWeight:800, color:"#005EB8", letterSpacing:"2.5px", textTransform:"uppercase", marginBottom:10 }}>Almost there</div>
            <h2 style={{ fontSize:32, fontWeight:900, color:"#00338D", letterSpacing:"-1px", marginBottom:8 }}>Register AI System</h2>
            <p style={{ fontSize:14, color:"#8FA3BF", lineHeight:1.6 }}>Configure your AI before starting the audit pipeline.</p>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <div className="ra-label">AI Name *</div>
              <input className="rai" type="text" placeholder="e.g. Sentiment Analyzer v2" value={aiName} onChange={e => setAiName(e.target.value)} />
            </div>
            <div>
              <div className="ra-label">Description <span style={{ color:"#A0B4CC", fontWeight:400 }}>(optional)</span></div>
              <input className="rai" type="text" placeholder="What does this AI do?" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div>
              <div className="ra-label">Domain / Use Case <span style={{ color:"#A0B4CC", fontWeight:400 }}>(optional)</span></div>
              <input className="rai" type="text" placeholder="e.g. Healthcare, Finance, Legal" value={domain} onChange={e => setDomain(e.target.value)} />
            </div>
          </div>

          {error && (
            <div style={{ marginTop:14, padding:"12px 16px", background:"#FFF5F5", border:"1px solid #FED7D7", borderRadius:10, fontSize:13, color:"#C53030" }}>
              {error}
            </div>
          )}

          <button className="ras" style={{ marginTop:24 }} onClick={handleRegister} disabled={loading || !aiName}>
            {loading ? "Registering…" : "Register & Go to Dashboard →"}
          </button>

          <div style={{ marginTop:20, textAlign:"center", fontSize:14, color:"#8FA3BF" }}>
            Already registered an AI?{" "}
            <span style={{ color:"#005EB8", fontWeight:700, cursor:"pointer" }} onClick={() => navigate("/dashboard")}>Go to Dashboard</span>
          </div>
        </div>
      </div>
    </div>
  );
}