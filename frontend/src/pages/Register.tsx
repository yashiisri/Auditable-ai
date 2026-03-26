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

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");
    setLoading(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      await registerUser({ name, email, password });

      const loginRes = await loginUser({ email, password });
      localStorage.setItem("token", loginRes.data.access_token);

      navigate("/register-ai");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout">
      <style>{`
:root {
  --kpmg-dark: #00338D;
  --kpmg-mid: #005EB8;
  --kpmg-light: #0091DA;

  --bg: #F4F7FB;
  --surface: #FFFFFF;

  --text: #0B1F33;
  --muted: #6B7C93;
  --border: #E3EAF3;
}

/* LAYOUT (NO SCROLL) */
.layout {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  font-family: 'Inter', system-ui, sans-serif;

  background:
    radial-gradient(circle at 20% 20%, #E6F2FB, transparent 40%),
    radial-gradient(circle at 80% 70%, #E0ECFF, transparent 40%),
    var(--bg);
}

/* NAVBAR (SAME AS LOGIN — NO CHANGE) */
.navbar {
  padding: 16px 60px;
  display: flex;
  align-items: center;
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  height: 76px;
}

.logo img {
  height: 90px;
}

/* CENTER */
.auth-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* CARD */
.auth-card {
  width: 100%;
  max-width: 460px;
  min-height: 560px;

  background: white;
  padding: 60px 42px;

  border-radius: 22px;
  border: 1px solid var(--border);

  box-shadow: 0 25px 60px rgba(0,51,141,0.12);

  display: flex;
  flex-direction: column;
  justify-content: center;

  animation: fadeUp 0.6s ease;
}

.auth-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 30px 70px rgba(0,51,141,0.18);
}

/* ANIMATION */
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* TEXT */
.auth-card h2 {
  font-size: 30px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 14px;
}

.auth-subtext {
  text-align: center;
  font-size: 14px;
  color: var(--muted);
  margin-bottom: 30px;
}

/* INPUT */
.auth-card input {
  width: 100%;
  padding: 14px;
  margin-bottom: 18px;
  border-radius: 10px;
  border: 1px solid var(--border);
  font-size: 14px;
  transition: 0.2s;
}

.auth-card input:focus {
  border-color: var(--kpmg-mid);
  outline: none;
  box-shadow: 0 0 0 3px rgba(0,94,184,0.15);
}

/* BUTTON */
.primary-btn {
  width: 100%;
  padding: 14px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #00338D, #005EB8);
  color: white;
  font-weight: 600;
  cursor: pointer;
  margin-top: 14px;
  transition: 0.3s;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(0,51,141,0.3);
}

.primary-btn:disabled {
  opacity: 0.6;
}

/* ERROR */
.error-message {
  color: #e5484d;
  font-size: 13px;
  text-align: center;
  margin-bottom: 12px;
}

/* FOOTER */
.auth-footer {
  text-align: center;
  font-size: 14px;
  color: var(--muted);
  margin-top: 18px;
}

.auth-footer span {
  color: var(--kpmg-mid);
  font-weight: 600;
  cursor: pointer;
}

.auth-footer span:hover {
  text-decoration: underline;
}
      `}</style>

      {/* NAVBAR */}
      <div className="navbar">
        <div className="logo">
          <img src="/kpmg-logo.png" alt="KPMG Logo" />
        </div>
      </div>

      {/* FORM */}
      <div className="auth-container">
        <div className="auth-card">

          <h2>Create Account</h2>
          <p className="auth-subtext">
            Join the AI Audit Platform
          </p>

          <input
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <div className="error-message">{error}</div>}

          <button
            className="primary-btn"
            onClick={handleRegister}
            disabled={!name || !email || !password || loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <div className="auth-footer">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>
              Sign In
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;