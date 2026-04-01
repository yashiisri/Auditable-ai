import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", background: "#F4F7FB", color: "#0B1F33" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .home-navbar {
          background: white;
          border-bottom: 1px solid #E3EAF3;
          padding: 0 60px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 12px rgba(0,51,141,0.06);
        }

        .home-nav-logo img { height: 80px; }

        .home-nav-links {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-link {
          padding: 9px 18px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #6B7C93;
          cursor: pointer;
          border: none;
          background: transparent;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .nav-link:hover { background: #F0F6FF; color: #005EB8; }

        .nav-cta {
          padding: 10px 22px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          color: white;
          cursor: pointer;
          border: none;
          background: linear-gradient(135deg, #00338D, #005EB8);
          transition: all 0.3s;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 4px 14px rgba(0,51,141,0.25);
        }
        .nav-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(0,51,141,0.3); }

        /* HERO */
        .home-hero {
          padding: 80px 60px 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 80px;
          max-width: 1280px;
          margin: 0 auto;
        }

        .home-hero-left { max-width: 560px; }

        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #E6F2FB;
          color: #005EB8;
          font-size: 12px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 20px;
          margin-bottom: 24px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          border: 1px solid rgba(0,94,184,0.2);
        }

        .hero-title {
          font-size: 3.6rem;
          font-weight: 900;
          line-height: 1.08;
          letter-spacing: -1.5px;
          color: #0B1F33;
          margin-bottom: 22px;
        }

        .hero-title-accent {
          background: linear-gradient(135deg, #00338D, #0091DA);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-desc {
          font-size: 1.1rem;
          color: #6B7C93;
          line-height: 1.75;
          margin-bottom: 40px;
          max-width: 480px;
        }

        .hero-btns { display: flex; gap: 14px; flex-wrap: wrap; }

        .btn-primary {
          padding: 15px 32px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #00338D, #005EB8);
          color: white;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: all 0.3s;
          box-shadow: 0 6px 20px rgba(0,51,141,0.28);
        }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(0,51,141,0.35); }

        .btn-secondary {
          padding: 15px 32px;
          border-radius: 10px;
          border: 2px solid #E3EAF3;
          background: white;
          color: #00338D;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: all 0.3s;
        }
        .btn-secondary:hover { border-color: #0091DA; background: #F0F6FF; transform: translateY(-2px); }

        /* TRUST BADGES */
        .trust-row {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-top: 36px;
          flex-wrap: wrap;
        }
        .trust-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #94A3B8;
          font-weight: 500;
        }
        .trust-badge span:first-child { font-size: 14px; }

        /* RIGHT SIDE — visual panel */
        .hero-right {
          flex-shrink: 0;
          width: 520px;
        }

        .score-panel {
          background: white;
          border-radius: 24px;
          border: 1px solid #E3EAF3;
          box-shadow: 0 20px 60px rgba(0,51,141,0.1);
          overflow: hidden;
        }

        .score-panel-header {
          background: linear-gradient(135deg, #00338D, #005EB8);
          padding: 24px 28px;
          color: white;
        }

        .score-panel-header h3 {
          font-size: 14px;
          font-weight: 700;
          opacity: 0.8;
          margin-bottom: 4px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .score-panel-header .ai-name {
          font-size: 20px;
          font-weight: 800;
        }

        .score-panel-body { padding: 24px 28px; }

        .score-big {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          margin-bottom: 20px;
        }

        .score-number {
          font-size: 72px;
          font-weight: 900;
          color: #00338D;
          line-height: 1;
          letter-spacing: -3px;
        }

        .score-meta { padding-bottom: 8px; }
        .score-meta .score-label { font-size: 13px; color: #94A3B8; }
        .score-meta .score-risk {
          display: inline-block;
          padding: 3px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          background: #DCFCE7;
          color: #059669;
          margin-top: 4px;
        }

        .principle-bars { display: flex; flex-direction: column; gap: 10px; }

        .principle-bar-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .principle-bar-label {
          font-size: 12px;
          color: #6B7C93;
          width: 110px;
          flex-shrink: 0;
          font-weight: 500;
        }

        .principle-bar-track {
          flex: 1;
          height: 8px;
          background: #F1F5F9;
          border-radius: 99px;
          overflow: hidden;
        }

        .principle-bar-fill {
          height: 100%;
          border-radius: 99px;
          background: linear-gradient(90deg, #00338D, #0091DA);
        }

        .principle-bar-val {
          font-size: 12px;
          font-weight: 700;
          color: #00338D;
          width: 28px;
          text-align: right;
          flex-shrink: 0;
        }

        /* FEATURES SECTION */
        .features-section {
          padding: 80px 60px;
          max-width: 1280px;
          margin: 0 auto;
        }

        .section-label {
          font-size: 12px;
          font-weight: 700;
          color: #005EB8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 12px;
        }

        .section-title {
          font-size: 2.2rem;
          font-weight: 800;
          color: #0B1F33;
          letter-spacing: -0.5px;
          margin-bottom: 12px;
        }

        .section-desc {
          font-size: 1rem;
          color: #6B7C93;
          line-height: 1.7;
          max-width: 520px;
          margin-bottom: 48px;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .feature-card {
          background: white;
          border-radius: 20px;
          padding: 32px 28px;
          border: 1.5px solid #E3EAF3;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: default;
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #00338D, #0091DA);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .feature-card:hover {
          border-color: #0091DA;
          transform: translateY(-6px);
          box-shadow: 0 20px 50px rgba(0,51,141,0.12);
        }

        .feature-card:hover::before { opacity: 1; }

        .feature-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #E6F2FB;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          margin-bottom: 18px;
          border: 1px solid rgba(0,94,184,0.15);
        }

        .feature-card h3 {
          font-size: 16px;
          font-weight: 700;
          color: #0B1F33;
          margin-bottom: 10px;
          letter-spacing: -0.02em;
        }

        .feature-card p {
          font-size: 13.5px;
          color: #6B7C93;
          line-height: 1.65;
        }

        /* STATS STRIP */
        .stats-strip {
          background: linear-gradient(135deg, #00338D, #005EB8);
          padding: 48px 60px;
        }

        .stats-inner {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 40px;
        }

        .stat-item { text-align: center; }

        .stat-number {
          font-size: 2.8rem;
          font-weight: 900;
          color: white;
          letter-spacing: -1px;
          line-height: 1;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 13px;
          color: rgba(255,255,255,0.65);
          font-weight: 500;
        }

        /* FRAMEWORKS */
        .frameworks-section {
          padding: 60px 60px;
          max-width: 1280px;
          margin: 0 auto;
        }

        .frameworks-row {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 32px;
        }

        .framework-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 22px;
          background: white;
          border: 1.5px solid #E3EAF3;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          color: #0B1F33;
          transition: all 0.2s;
        }

        .framework-pill:hover {
          border-color: #0091DA;
          background: #F0F6FF;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,51,141,0.1);
        }

        /* FOOTER */
        .home-footer {
          background: #0B1F33;
          padding: 32px 60px;
          text-align: center;
          color: rgba(255,255,255,0.4);
          font-size: 13px;
        }

        .home-footer span { color: rgba(255,255,255,0.7); font-weight: 600; }

        /* RESPONSIVE */
        @media (max-width: 1100px) {
          .home-hero { flex-direction: column; gap: 60px; padding: 60px 40px; }
          .hero-right { width: 100%; max-width: 520px; }
          .features-grid { grid-template-columns: repeat(2, 1fr); }
          .stats-inner { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 640px) {
          .home-navbar { padding: 0 24px; }
          .home-hero { padding: 40px 24px; }
          .hero-title { font-size: 2.6rem; }
          .features-section, .frameworks-section { padding: 60px 24px; }
          .features-grid { grid-template-columns: 1fr; }
          .stats-strip { padding: 40px 24px; }
          .stats-inner { grid-template-columns: repeat(2, 1fr); gap: 24px; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav className="home-navbar">
        <div className="home-nav-logo">
          <img src="/kpmg-logo.png" alt="KPMG" />
        </div>
        <div className="home-nav-links">
          <button className="nav-cta" onClick={() => navigate("/login")}>Access Platform →</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-left">
          <div className="hero-eyebrow">
            <span>🔷</span> KPMG Trusted AI Framework
          </div>
          <h1 className="hero-title">
            AI Governance<br />
            <span className="hero-title-accent">Built for Enterprise.</span>
          </h1>
          <p className="hero-desc">
            Audit, score, and certify your AI systems against EU AI Act, ISO 42001, and NIST AI RMF — with real-time risk intelligence and regulatory-grade reporting.
          </p>
          <div className="hero-btns">
            <button className="btn-primary" onClick={() => navigate("/login")}>Start Audit →</button>
            <button className="btn-secondary" onClick={() => navigate("/register")}>Create Account</button>
          </div>
          <div className="trust-row">
            <div className="trust-badge"><span>🇪🇺</span><span>EU AI Act Ready</span></div>
            <div className="trust-badge"><span>🏅</span><span>ISO 42001 Aligned</span></div>
            <div className="trust-badge"><span>🏛️</span><span>NIST AI RMF</span></div>
          </div>
        </div>

        <div className="hero-right">
          <div className="score-panel">
            <div className="score-panel-header">
              <h3>Why Auditable AI?</h3>
              <div className="ai-name">Enterprise-grade governance, built for scale.</div>
            </div>
            <div className="score-panel-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { icon: "🔍", title: "Detect governance gaps before regulators do", desc: "Proactive auditing across 10 KPMG Trusted AI Principles." },
                  { icon: "📋", title: "EU AI Act & ISO 42001 ready", desc: "Automated compliance mapping against global standards." },
                  { icon: "🛡️", title: "Black-box ", desc: "Audit any AI — with or without access to the model." },
                  { icon: "📄", title: "Regulatory-grade PDF reports", desc: "Client-ready documentation for auditors and boards." },
                  { icon: "🔷", title: "Powered by KPMG Trusted AI Framework", desc: "Built on the same framework used by enterprise clients globally." },
                ].map(item => (
                  <div key={item.title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#E6F2FB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, border: "1px solid rgba(0,94,184,0.15)" }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0B1F33", marginBottom: 2 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: "#6B7C93", lineHeight: 1.5 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="stats-strip">
        <div className="stats-inner">
          {[
            { num: "10", label: "Governance Principles" },
            { num: "4", label: "Regulatory Frameworks" },
            { num: "50+", label: "Sub-parameters Scored" },
            { num: "2", label: "Audit Modes" },
          ].map(s => (
            <div key={s.label} className="stat-item">
              <div className="stat-number">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section className="features-section">
        <div className="section-label">Platform Capabilities</div>
        <h2 className="section-title">Everything you need to govern AI</h2>
        <p className="section-desc">From automated log ingestion to regulatory-grade PDF reports — one platform for your entire AI governance programme.</p>
        <div className="features-grid">
          {[
            { icon: "📋", title: "AI Register", desc: "Centralise all your AI models with metadata, risk classification, and ownership tracking in one place." },
            { icon: "📥", title: "Smart Ingestion", desc: "Upload audit logs or use SDCC for automatic data classification and schema detection." },
            { icon: "🔍", title: "Blackbox Testing", desc: "Generate synthetic probes and run adversarial evaluations when real data is unavailable." },
            { icon: "📊", title: "Full Governance Audit", desc: "Score across 10 Trusted AI principles with 50+ sub-parameters and detailed calculation transparency." },
            { icon: "📑", title: "Regulatory Reports", desc: "Generate professional PDF reports aligned with EU AI Act, ISO 42001, and NIST AI RMF standards." },
            { icon: "📈", title: "Continuous Monitoring", desc: "Track governance scores over time, detect drift, and receive alerts on compliance degradation." },
          ].map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FRAMEWORKS */}
      <section className="frameworks-section">
        <div className="section-label">Regulatory Coverage</div>
        <h2 className="section-title">Aligned with global AI standards</h2>
        <div className="frameworks-row">
          {[
            { icon: "🇪🇺", label: "EU AI Act", desc: "European Union AI Regulation" },
            { icon: "🏅", label: "ISO/IEC 42001:2023", desc: "AI Management System Standard" },
            { icon: "🏛️", label: "NIST AI RMF", desc: "AI Risk Management Framework" },
            { icon: "🔷", label: "KPMG Trusted AI", desc: "Trusted AI Framework" },
          ].map(f => (
            <div key={f.label} className="framework-pill">
              <span style={{ fontSize: 20 }}>{f.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0B1F33" }}>{f.label}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
        <span>Auditable AI™</span> · Powered by KPMG Trusted AI Framework · Built for enterprise governance
      </footer>
    </div>
  );
};

export default Home;
