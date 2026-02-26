import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="app-layout">
      <style>{`
        /* ─────────────────────────────────────────────────────────────
           SHARED KPMG-STYLE GRADIENT & COLORS (same as dashboard)
        ────────────────────────────────────────────────────────────── */
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
          --accent:    #4AACDF;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'IBM Plex Sans', sans-serif;
        }

        .app-layout {
          min-height: 100vh;
          background: radial-gradient(circle at 20% 20%, #00338D 0%, transparent 40%),
                      radial-gradient(circle at 80% 70%, #00C896 0%, transparent 40%),
                      #030C1E;
          display: flex;
        }

        /* Sidebar – matching dashboard feel */
        .sidebar {
          width: 260px;
          background: linear-gradient(180deg, #00338D, #005EB8);
          color: white;
          padding: 40px 24px;
          border-right: 1px solid var(--border-lt);
          backdrop-filter: blur(10px);
          flex-shrink: 0;
        }

        .sidebar-header h2 {
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(90deg, #00C896, #0091DA);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 40px;
        }

        .sidebar-menu {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .menu-item {
          padding: 12px 16px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.25s;
        }

        .menu-item:hover {
          background: rgba(255,255,255,0.12);
        }

        .menu-item.active {
          background: linear-gradient(135deg, rgba(0,200,150,0.22), rgba(0,145,218,0.18));
          font-weight: 600;
          box-shadow: 0 2px 12px rgba(0,200,150,0.15);
        }

        /* Main area */
        .main-area {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        /* Hero panel – glass + same glow as dashboard */
        .hero-panel {
          position: relative;
          width: 100%;
          max-width: 1100px;
          border-radius: 24px;
          padding: 80px 60px;
          display: flex;
          gap: 80px;
          background: linear-gradient(135deg, rgba(10,30,66,0.82), rgba(7,21,48,0.75));
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0,145,218,0.28);
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
          overflow: hidden;
        }

        .hero-glow {
          position: absolute;
          top: -120px;
          right: -180px;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #00C89633, transparent 70%);
          opacity: 0.25;
          filter: blur(100px);
          pointer-events: none;
        }

        .hero-left h1 {
          font-size: 3.8rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 24px;
        }

        .accent-text {
          background: linear-gradient(90deg, #00C896, #0091DA);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-left p {
          font-size: 1.2rem;
          color: var(--muted);
          line-height: 1.6;
          margin-bottom: 40px;
        }

        .hero-buttons {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .primary-btn,
        .outline-btn {
          padding: 14px 32px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .primary-btn {
          background: linear-gradient(135deg, #0091DA, #00C896);
          color: white;
          border: none;
        }

        .primary-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(0,200,150,0.35);
        }

        .outline-btn {
          background: transparent;
          border: 2px solid #0091DA;
          color: #0091DA;
        }

        .outline-btn:hover {
          background: rgba(0,145,218,0.12);
          transform: translateY(-3px);
        }

        /* Feature cards – glass style matching dashboard */
        .hero-right {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .feature-card {
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(0,145,218,0.25);
          border-radius: 16px;
          padding: 28px;
          transition: all 0.3s;
        }

        .feature-card:hover {
          transform: translateY(-6px);
          background: rgba(255,255,255,0.12);
          box-shadow: 0 12px 32px rgba(0,200,150,0.15);
        }

        .feature-card h3 {
          font-size: 1.4rem;
          font-weight: 700;
          color: #EAF2FB;
          margin-bottom: 12px;
        }

        .feature-card p {
          color: var(--muted);
          font-size: 1rem;
          line-height: 1.5;
        }

        /* Responsive adjustments */
        @media (max-width: 1024px) {
          .hero-panel {
            flex-direction: column;
            padding: 60px 40px;
            gap: 60px;
          }
          .hero-left h1 {
            font-size: 3.2rem;
          }
        }

        @media (max-width: 768px) {
          .hero-panel {
            padding: 50px 30px;
          }
          .hero-left h1 {
            font-size: 2.8rem;
          }
          .hero-buttons {
            flex-direction: column;
            gap: 16px;
          }
        }
      `}</style>

      {/* SIDEBAR */}
      <div className="sidebar">
        
        <div className="sidebar-header">
          <h2>Auditable AI</h2>
        </div>

        <div className="sidebar-menu">
          <div className="menu-item active">Home</div>
          <div className="menu-item">AI Audit</div>
          <div className="menu-item">Report Generation</div>
          <div className="menu-item">Profile</div>
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="main-area">
        <div className="hero-panel">

          {/* Glow Layer */}
          <div className="hero-glow"></div>

          <div className="hero-left">
            <h1>
              AI Assurance.
              <br />
              <span className="accent-text">Reimagined.</span>
            </h1>

            <p>
              Enterprise-grade AI governance, risk intelligence,
              transparency validation, and regulatory compliance
              built for high-stakes systems.
            </p>

            <div className="hero-buttons">
              <button
                className="primary-btn"
                onClick={() => navigate("/login")}
              >
                Access Platform
              </button>

              <button
                className="outline-btn"
                onClick={() => navigate("/register")}
              >
                Create Account
              </button>
            </div>
          </div>

          <div className="hero-right">
            <div className="feature-card">
              <h3>Risk Scoring Engine</h3>
              <p>
                Dynamic evaluation across governance principles
                with model-based scoring.
              </p>
            </div>

            <div className="feature-card">
              <h3>Model Transparency</h3>
              <p>
                Explainability, bias detection, and compliance validation.
              </p>
            </div>

            <div className="feature-card">
              <h3>Enterprise Reports</h3>
              <p>
                Structured PDF documentation aligned with audit standards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;