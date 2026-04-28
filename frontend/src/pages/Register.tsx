// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { loginUser, registerUser } from "../services/api";

// const Register = () => {
//   const navigate = useNavigate();
//   const [name, setName]       = useState("");
//   const [email, setEmail]     = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError]     = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleRegister = async () => {
//     setError("");
//     setLoading(true);

//     if (password.length < 8) {
//       setError("Password must be at least 8 characters long");
//       setLoading(false);
//       return;
//     }

//     try {
//       await registerUser({ name, email, password });

//       // Auto-login after registration
//       const loginRes = await loginUser({ email, password });
//       localStorage.setItem("token", loginRes.data.access_token);

//       navigate("/register-ai");
//     } catch (err: any) {
//       setError(err.response?.data?.detail || "Registration failed.");
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
//           display:flex; align-items:center; justify-content:center;
//           padding:40px 20px; position:relative; overflow:hidden;
//           font-family:'IBM Plex Sans',sans-serif; color:var(--text);
//         }

//         .auth-layout::before {
//           content:""; position:absolute; top:-200px; right:-200px;
//           width:600px; height:600px;
//           background:radial-gradient(circle, #0091DA33, transparent 70%);
//           opacity:0.18; filter:blur(120px); pointer-events:none;
//         }

//         .auth-card {
//           width:100%; max-width:440px; padding:56px 42px;
//           border-radius:20px;
//           background:linear-gradient(135deg, rgba(10,30,66,0.85), rgba(7,21,48,0.80));
//           backdrop-filter:blur(22px);
//           border:1px solid rgba(0,145,218,0.28);
//           box-shadow:0 25px 70px rgba(0,0,0,0.45), inset 0 0 40px rgba(255,255,255,0.03);
//           position:relative; z-index:1;
//         }

//         .auth-card h2 {
//           font-size:28px; font-weight:700; text-align:center;
//           margin-bottom:8px; color:#EAF2FB;
//         }

//         .auth-subtext {
//           text-align:center; font-size:15px; color:var(--muted);
//           margin-bottom:32px; line-height:1.5;
//         }

//         .auth-card input {
//           width:100%; padding:14px 16px; margin-bottom:16px;
//           border-radius:10px; border:1px solid rgba(0,145,218,0.35);
//           background:rgba(3,12,30,0.65); color:#EAF2FB; font-size:15px;
//           transition:all 0.2s;
//         }

//         .auth-card input::placeholder { color:rgba(255,255,255,0.35); }

//         .auth-card input:focus {
//           border-color:#00C896; box-shadow:0 0 0 3px rgba(0,200,150,0.18);
//           outline:none;
//         }

//         .primary-btn {
//           width:100%; padding:14px; border-radius:10px; border:none;
//           background:linear-gradient(135deg, #0091DA, #00C896);
//           color:white; font-weight:600; font-size:15px; cursor:pointer;
//           transition:all 0.3s; margin:24px 0 16px;
//         }

//         .primary-btn:hover:not(:disabled) {
//           transform:translateY(-2px);
//           box-shadow:0 10px 28px rgba(0,200,150,0.35);
//         }

//         .primary-btn:disabled { opacity:0.6; cursor:not-allowed; }

//         .error-message {
//           color:#ff8787; font-size:14px; text-align:center;
//           margin:12px 0; background:rgba(239,68,68,0.12);
//           padding:10px; border-radius:8px; border:1px solid rgba(239,68,68,0.3);
//         }

//         .auth-footer { text-align:center; font-size:14px; color:var(--muted); }

//         .auth-footer span {
//           color:#0091DA; font-weight:600; cursor:pointer; transition:all 0.2s;
//         }

//         .auth-footer span:hover { color:#00C896; text-decoration:underline; }
//       `}</style>

//       <div className="auth-card">
//         <h2>Create Account</h2>
//         <p className="auth-subtext">Join the Auditable AI™ Governance Platform</p>

//         <input
//           placeholder="Full Name"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           disabled={loading}
//         />
//         <input
//           type="email"
//           placeholder="Email Address"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           disabled={loading}
//         />
//         <input
//           type="password"
//           placeholder="Password (min 8 characters)"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           disabled={loading}
//         />

//         {error && <div className="error-message">{error}</div>}

//         <button
//           className="primary-btn"
//           onClick={handleRegister}
//           disabled={loading || !name || !email || !password}
//         >
//           {loading ? "Creating account..." : "Create Account"}
//         </button>

//         <div className="auth-footer">
//           Already have an account?{" "}
//           <span onClick={() => navigate("/login")}>Login</span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Register;



/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../services/api";
import axios from "axios";

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");
    setLoading(true);
    if (password.length < 8) { setError("Password must be at least 8 characters."); setLoading(false); return; }
    try {
      if (isAdminMode) {
        await axios.post("http://localhost:8000/api/auth/register-admin", { name, email, password });
        const loginRes = await loginUser({ email, password });
        const token = loginRes.data.access_token;
        localStorage.setItem("token", token);
        navigate("/admin");
      } else {
        await registerUser({ name, email, password });
        const loginRes = await loginUser({ email, password });
        localStorage.setItem("token", loginRes.data.access_token);
        navigate("/register-ai");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"'Plus Jakarta Sans','Inter',sans-serif", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .ri{width:100%;padding:14px 16px;border-radius:12px;border:1.5px solid #E3EAF3;font-size:14px;font-family:inherit;color:#0B1F33;background:#fff;transition:all 0.2s;outline:none;}
        .ri:focus{border-color:#005EB8;box-shadow:0 0 0 4px rgba(0,94,184,0.1);}
        .ri::placeholder{color:#A0B4CC;}
        .rs{width:100%;padding:15px;border-radius:12px;border:none;background:linear-gradient(135deg,#00338D,#005EB8);color:#fff;font-size:15px;font-weight:700;font-family:inherit;cursor:pointer;transition:all 0.3s;box-shadow:0 6px 20px rgba(0,51,141,0.25);}
        .rs:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(0,51,141,0.35);}
        .rs:disabled{opacity:0.55;cursor:not-allowed;transform:none;}
        .rlp{flex:1;background:linear-gradient(145deg,#00338D 0%,#005EB8 55%,#0091DA 100%);display:flex;flex-direction:column;justify-content:center;padding:64px;position:relative;overflow:hidden;}
        .rlp::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px);background-size:52px 52px;pointer-events:none;}
        .rorb{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;}
        .rrp{width:500px;flex-shrink:0;display:flex;flex-direction:column;justify-content:center;padding:56px;background:#fff;overflow-y:auto;}
        .rpill{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.9);font-size:11px;font-weight:700;padding:6px 14px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;margin-bottom:32px;backdrop-filter:blur(8px);}
        .rpd{width:6px;height:6px;border-radius:50%;background:#00A3A1;animation:rpulse 2s ease-in-out infinite;}
        @keyframes rpulse{0%,100%{transform:scale(1);}50%{transform:scale(1.5);opacity:0.6;}}
        @keyframes regUp{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);}}
        @media(max-width:768px){.rlp{display:none;}.rrp{width:100%;padding:40px 28px;}}
      `}</style>

      {/* LEFT */}
      <div className="rlp">
        <div className="rorb" style={{ width:420, height:420, background:"rgba(255,255,255,0.05)", top:-100, right:-80 }} />
        <div className="rorb" style={{ width:300, height:300, background:"rgba(0,163,161,0.14)", bottom:-80, left:-60 }} />
        <div style={{ position:"relative" }}>
          <div className="rpill"><div className="rpd" />KPMG Trusted AI Framework</div>
          <h1 style={{ fontSize:"clamp(30px,3vw,46px)", fontWeight:900, color:"#fff", letterSpacing:"-1.5px", lineHeight:1.1, marginBottom:14 }}>
            Start auditing<br />your AI today.
          </h1>
          <p style={{ fontSize:15, color:"rgba(255,255,255,0.6)", lineHeight:1.75, maxWidth:360 }}>
            Join organisations using TrustShield AI to achieve trusted, explainable, and well-governed AI.
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="rrp">
        <div style={{ animation:"regUp 0.7s cubic-bezier(.16,1,.3,1) both" }}>
          <div style={{ marginBottom:32 }}>
            <div style={{ fontSize:11, fontWeight:800, color:"#005EB8", letterSpacing:"2.5px", textTransform:"uppercase", marginBottom:10 }}>Get started</div>
            <h2 style={{ fontSize:32, fontWeight:900, color:"#00338D", letterSpacing:"-1px", marginBottom:8 }}>Create account</h2>
            <p style={{ fontSize:14, color:"#8FA3BF", lineHeight:1.6 }}>Set up your audit workspace in under a minute.</p>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <input className="ri" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
            <input className="ri" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
            <input className="ri" type="password" placeholder="Password (min. 8 characters)" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !(!name || !email || !password || loading) && handleRegister()} />
          </div>
          <div style={{ marginTop:14, display:"flex", alignItems:"center", gap:10 }}>
            <button type="button" onClick={() => setIsAdminMode(!isAdminMode)}
              style={{ width:36, height:20, borderRadius:10, border:"none", cursor:"pointer", padding:2, background:isAdminMode?"#00338D":"#E3EAF3", transition:"background 0.2s", position:"relative", flexShrink:0 }}>
              <div style={{ width:16, height:16, borderRadius:"50%", background:"white", boxShadow:"0 1px 4px rgba(0,0,0,0.2)", transition:"transform 0.2s", transform:isAdminMode?"translateX(16px)":"translateX(0)" }} />
            </button>
            <span style={{ fontSize:13, color:"#6B7C93", fontWeight:500 }}>Register as Admin</span>
          </div>

          {error && (
            <div style={{ marginTop:14, padding:"12px 16px", background:"#FFF5F5", border:"1px solid #FED7D7", borderRadius:10, fontSize:13, color:"#C53030" }}>
              {error}
            </div>
          )}

          <button className="rs" style={{ marginTop:24 }} onClick={handleRegister} disabled={!name || !email || !password || loading}>
            {loading ? "Creating account…" : isAdminMode ? "Create Admin Account →" : "Create Account →"}
          </button>

          <p style={{ fontSize:12, color:"#A0B4CC", textAlign:"center", marginTop:14, lineHeight:1.6 }}>
            By creating an account you agree to our terms of service.
          </p>

          <div style={{ marginTop:20, textAlign:"center", fontSize:14, color:"#8FA3BF" }}>
            Already have an account?{" "}
            <span style={{ color:"#005EB8", fontWeight:700, cursor:"pointer" }} onClick={() => navigate("/login")}>Sign in</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;