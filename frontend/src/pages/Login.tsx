
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:8000/api/auth/login",  {
        email,
        password,
      });

      const { access_token } = response.data;
      localStorage.setItem("token", access_token); // Store JWT

      navigate("/register-ai");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <style>{`
        :root {
          --kpmg:      #00338D;
          --kpmg-mid:  #005EB8;
          --kpmg-lt:   #0091DA;
          --success:   #00C896;
          --bg:        #030C1E;
          --surface:   #071530;
          --border-lt: rgba(0,145,218,0.25);
          --text:      #D8E8F5;
          --muted:     #9DBFE0;
        }

        * { margin:0; padding:0; box-sizing:border-box; }

        .auth-layout {
          min-height:100vh;
          background: radial-gradient(circle at 20% 20%, #00338D 0%, transparent 40%),
                      radial-gradient(circle at 80% 70%, #00C896 0%, transparent 40%),
                      #030C1E;
          display:flex; align-items:center; justify-content:center;
          padding:40px 20px; position:relative; overflow:hidden;
          font-family:'IBM Plex Sans',sans-serif; color:var(--text);
        }

        .auth-layout::before {
          content:""; position:absolute; top:-200px; right:-200px;
          width:600px; height:600px;
          background:radial-gradient(circle, #0091DA33, transparent 70%);
          opacity:0.18; filter:blur(120px); pointer-events:none;
        }

        .auth-card {
          width:100%; max-width:440px; padding:56px 42px;
          border-radius:20px;
          background:linear-gradient(135deg, rgba(10,30,66,0.85), rgba(7,21,48,0.80));
          backdrop-filter:blur(22px);
          border:1px solid rgba(0,145,218,0.28);
          box-shadow:0 25px 70px rgba(0,0,0,0.45), inset 0 0 40px rgba(255,255,255,0.03);
          position:relative; z-index:1;
        }

        .auth-card h2 {
          font-size:28px; font-weight:700; text-align:center;
          margin-bottom:8px; color:#EAF2FB;
        }

        .auth-subtext {
          text-align:center; font-size:15px; color:var(--muted);
          margin-bottom:32px; line-height:1.5;
        }

        .auth-card input {
          width:100%; padding:14px 16px; margin-bottom:16px;
          border-radius:10px; border:1px solid rgba(0,145,218,0.35);
          background:rgba(3,12,30,0.65); color:#EAF2FB; font-size:15px;
          transition:all 0.2s;
        }

        .auth-card input::placeholder { color:rgba(255,255,255,0.35); }

        .auth-card input:focus {
          border-color:#00C896; box-shadow:0 0 0 3px rgba(0,200,150,0.18);
          outline:none;
        }

        .primary-btn {
          width:100%; padding:14px; border-radius:10px; border:none;
          background:linear-gradient(135deg, #0091DA, #00C896);
          color:white; font-weight:600; font-size:15px; cursor:pointer;
          transition:all 0.3s; margin:24px 0 16px;
        }

        .primary-btn:hover:not(:disabled) {
          transform:translateY(-2px);
          box-shadow:0 10px 28px rgba(0,200,150,0.35);
        }

        .primary-btn:disabled { opacity:0.6; cursor:not-allowed; }

        .error-message {
          color:#ff8787; font-size:14px; text-align:center;
          margin:12px 0; background:rgba(239,68,68,0.12);
          padding:10px; border-radius:8px; border:1px solid rgba(239,68,68,0.3);
        }

        .auth-footer {
          text-align:center; font-size:14px; color:var(--muted);
        }

        .auth-footer span {
          color:#0091DA; font-weight:600; cursor:pointer; transition:all 0.2s;
        }

        .auth-footer span:hover { color:#00C896; text-decoration:underline; }
      `}</style>

      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p className="auth-subtext">
          Sign in to access the Auditable AI™ platform
        </p>

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        {error && <div className="error-message">{error}</div>}

        <button
          className="primary-btn"
          onClick={handleLogin}
          disabled={loading || !email || !password}
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <div className="auth-footer">
          Don’t have an account?{" "}
          <span onClick={() => navigate("/register")}>Create Account</span>
        </div>
      </div>
    </div>
  );
};

export default Login;