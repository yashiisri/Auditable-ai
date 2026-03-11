

import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

interface Principle { score: number; parameters: Record<string, number>; }
interface ReportData {
  report_id: string;
  ai_name: string;
  model_type: string;
  evaluated_at: string;
  overall_score: number;
  risk_level: string;
  structural_risk: string;
  logs_evaluated: number;
  data_quality_score: number;
  trusted_ai_principles: Record<string, Principle>;
  diagnostics: {
    missing_ratio: number;
    duplicates: number;
    schema_confidence: number;
    total_columns: number;
    text_columns: number;
    numeric_columns: number;
    column_names: string[];
  };
  findings: { category: string; severity: string; issue: string; recommendation: string }[];
  recommendation: string;
  framework_compliance: Record<string, string>;
}

const ICONS: Record<string, string> = {
  Transparency: "🔍", Explainability: "💡", Fairness: "⚖️", Accountability: "📋",
  "Data Integrity": "🗄️", Reliability: "⚙️", Security: "🔒", Privacy: "🛡️",
  Sustainability: "🌱", "Human-Centricity": "👤"
};

const COLORS: Record<string, string> = {
  Transparency: "#00C8FF", Explainability: "#00E5A0", Fairness: "#FF6B9D",
  Accountability: "#FFB020", "Data Integrity": "#A78BFA", Reliability: "#34D399",
  Security: "#F87171", Privacy: "#60A5FA", Sustainability: "#4ADE80",
  "Human-Centricity": "#FBBF24"
};

const FW: Record<string, { label: string; icon: string; desc: string }> = {
  EU_AI_Act: { label: "EU AI Act", icon: "🇪🇺", desc: "European Union AI Regulation" },
  ISO_42001: { label: "ISO 42001", icon: "🏅", desc: "AI Management System Standard" },
  NIST_AI_RMF: { label: "NIST AI RMF", icon: "🏛️", desc: "AI Risk Management Framework" },
  KPMG_TAF: { label: "KPMG Trusted AI", icon: "🔷", desc: "Trusted AI Framework" },
};

const CC: Record<string, string> = {
  Compliant: "#00C896", "Certified Ready": "#00C896", Aligned: "#00C896",
  Conditional: "#ffb020", Assessed: "#60A5FA", Partial: "#ff4d4d"
};

function fmt(k: string) {
  return String(k ?? "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function Spider({ principles, onSelect, selected }: { principles: Record<string, Principle>; onSelect: (k: string | null) => void; selected: string | null }) {
  const keys = Object.keys(principles);
  const N = keys.length;
  const cx = 280, cy = 280, R = 200;

  const ang = (i: number) => (Math.PI * 2 * i) / N - Math.PI / 2;
  const pt = (i: number, v: number) => ({
    x: cx + (v / 100) * R * Math.cos(ang(i)),
    y: cy + (v / 100) * R * Math.sin(ang(i)),
  });
  const lp = (i: number) => {
    const r = R + 50;
    return { x: cx + r * Math.cos(ang(i)), y: cy + r * Math.sin(ang(i)) };
  };

  const poly = keys.map((k, i) => pt(i, principles[k].score));
  const polyStr = poly.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox="0 0 600 600" style={{ width: "100%", maxWidth: 600, display: "block", margin: "0 auto" }}>
      {[20, 40, 60, 80, 100].map(lvl => (
        <polygon
          key={lvl}
          points={keys.map((_, i) => pt(i, lvl)).map(p => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1.5"
        />
      ))}
      {keys.map((_, i) => {
        const e = pt(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />;
      })}
      <polygon points={polyStr} fill="rgba(0,200,150,0.15)" stroke="rgba(0,200,150,0.65)" strokeWidth="3" strokeLinejoin="round" />
      {[20, 40, 60, 80, 100].map(lvl => (
        <text key={`t${lvl}`} x={cx + 8} y={cy - (lvl / 100) * R + 5} fill="rgba(255,255,255,0.35)" fontSize="10" textAnchor="start">{lvl}</text>
      ))}
      {poly.map((p, i) => {
        const k = keys[i];
        const c = COLORS[k] || "#00C896";
        const sel = selected === k;
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={sel ? 14 : 7}
            fill={c}
            stroke={sel ? "#fff" : "rgba(255,255,255,0.4)"}
            strokeWidth={sel ? 4 : 2}
            style={{
              cursor: "pointer",
              transition: "all 0.3s ease",
              filter: sel ? "drop-shadow(0 0 12px #00C896)" : "drop-shadow(0 0 4px rgba(0,200,150,0.3))",
            }}
            onClick={() => onSelect(sel ? null : k)}
            onMouseEnter={() => onSelect(k)}
            onMouseLeave={() => sel || onSelect(null)}
          />
        );
      })}
      {keys.map((k, i) => {
        const lpos = lp(i);
        const c = COLORS[k] || "#00C896";
        const sel = selected === k;
        const parts = k.split(" ");
        const sc = principles[k].score;
        return (
          <g
            key={k}
            style={{ cursor: "pointer" }}
            onClick={() => onSelect(sel ? null : k)}
            onMouseEnter={() => onSelect(k)}
            onMouseLeave={() => sel || onSelect(null)}
          >
            {parts.map((pt2, pi) => (
              <text
                key={pi}
                x={lpos.x}
                y={lpos.y + (pi - parts.length / 2) * 16}
                textAnchor="middle"
                fill={sel ? c : "rgba(255,255,255,0.8)"}
                fontSize={sel ? "13" : "11"}
                fontWeight={sel ? "800" : "500"}
                fontFamily="'DM Sans',sans-serif"
                style={{ transition: "all 0.3s ease" }}
              >
                {pt2}
              </text>
            ))}
            <text
              x={lpos.x}
              y={lpos.y + (parts.length / 2) * 16 + 6}
              textAnchor="middle"
              fill={c}
              fontSize="12"
              fontWeight="900"
              fontFamily="'DM Sans',sans-serif"
            >
              {sc}
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={50} fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
      <text x={cx} y={cy - 8} textAnchor="middle" fill="white" fontSize="28" fontWeight="900" fontFamily="'DM Sans',sans-serif">
        {Math.round(Object.values(principles).reduce((s, v) => s + v.score, 0) / N)}
      </text>
      <text x={cx} y={cy + 18} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="10" fontFamily="'DM Sans',sans-serif">
        OVERALL
      </text>
    </svg>
  );
}

function ImprovedBarChart({ principles }: { principles: Record<string, Principle> }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const entries = Object.entries(principles).map(([name, data]) => ({
    name,
    score: data.score,
    color: COLORS[name] || "#00C896",
  }));

  return (
    <div style={{ padding: "20px 0", overflowX: "auto" }}>
      <ResponsiveContainer width="100%" height={Math.max(entries.length * 70 + 60, 260)}>
        <BarChart
          data={entries}
          layout="vertical"
          margin={{ top: 20, right: 50, left: 160, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="5 5" stroke="rgba(255,255,255,0.08)" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 500 }}
            width={150}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(0,200,150,0.1)" }}
            contentStyle={{
              background: "rgba(10,30,66,0.96)",
              border: "1px solid rgba(0,200,150,0.45)",
              borderRadius: 12,
              padding: "14px 18px",
              color: "white",
              boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
            }}
          />
          <Bar
            dataKey="score"
            radius={[0, 10, 10, 0]}
            barSize={28}
            animationDuration={1600}
            animationEasing="easeOutCubic"
          >
            {entries.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`url(#grad-${index})`}
                style={{
                  transition: "all 0.35s ease",
                  filter: hovered === entry.name ? "brightness(1.3) drop-shadow(0 0 14px currentColor)" : "none",
                  transform: hovered === entry.name ? "scale(1.08)" : "scale(1)",
                  transformOrigin: "left center",
                }}
                onMouseEnter={() => setHovered(entry.name)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </Bar>
          <defs>
            {entries.map((entry, i) => (
              <linearGradient key={`grad-${i}`} id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                <stop offset="100%" stopColor={entry.color} stopOpacity={0.65} />
              </linearGradient>
            ))}
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Radial({ score, label, color, size = 90 }: { score: number; label: string; color: string; size?: number }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ textAlign: "center", padding: "10px" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={size * 0.09} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.09}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 1.4s ease" }}
        />
        <text x={size / 2} y={size / 2 + 6} textAnchor="middle" fill="white" fontSize={size * 0.24} fontWeight="900" fontFamily="'DM Sans',sans-serif">
          {score}
        </text>
      </svg>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 8, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export default function Report() {
  const location = useLocation();
  const navigate = useNavigate();
  const raw = location.state?.data;

  // ── Normalise: blackbox audit data → ReportData shape ─────────────────
  // When coming from the Profile "My Projects" click, the data is a
  // BlackBox audit record (keys: audit_id, category_scores, probe_results…).
  // When coming from Dashboard "Run Full Evaluation", it is already a
  // full ReportData record. We detect by presence of audit_id vs report_id.
  const r: ReportData = (() => {
    if (!raw) return null as any;

    // Already a full evaluation report — pass through unchanged
    if (raw.report_id || raw.trusted_ai_principles) return raw as ReportData;

    // ── It's a BlackBox audit record — map it ──────────────────────────
    const catScores: Record<string, number> = raw.category_scores || {};

    // Convert category_scores → trusted_ai_principles format
    const trusted_ai_principles: Record<string, { score: number; parameters: Record<string, number> }> = {};
    for (const [cat, score] of Object.entries(catScores)) {
      trusted_ai_principles[cat] = {
        score: score as number,
        parameters: { Score: score as number },
      };
    }

    // Map BlackBox findings to ReportData findings shape
    const findings = (raw.findings || []).map((f: any) => ({
      category:       f.category       || "Unknown",
      severity:       f.severity       || "Medium",
      issue:          f.issue          || f.note || "See probe response",
      recommendation: f.recommendation || "Review model behaviour",
    }));

    // Derive framework compliance from overall score
    const s = raw.overall_score || 0;
    const complianceStatus = s >= 75 ? "Compliant" : s >= 50 ? "Conditional" : "Partial";

    return {
      report_id:             raw.audit_id          || "N/A",
      ai_name:               raw.ai_name            || "External AI",
      model_type:            raw.mode               ? `BlackBox (${raw.mode.toUpperCase()})` : "BlackBox",
      evaluated_at:          raw.completed_at       || raw.created_at || new Date().toISOString(),
      overall_score:         raw.overall_score      || 0,
      risk_level:            raw.risk_level         || "Unknown",
      structural_risk:       raw.risk_level         || "Unknown",
      logs_evaluated:        raw.probes_run         || 0,
      data_quality_score:    raw.overall_score      || 0,
      trusted_ai_principles,
      diagnostics: {
        missing_ratio:     0,
        duplicates:        0,
        schema_confidence: 1,
        total_columns:     0,
        text_columns:      0,
        numeric_columns:   0,
        column_names:      [],
      },
      findings,
      recommendation:
        findings.length === 0
          ? "All governance probes passed. AI system aligns with Trusted AI principles."
          : `${findings.length} governance violation(s) detected. Review findings and recommendations.`,
      framework_compliance: {
        EU_AI_Act:   complianceStatus,
        ISO_42001:   complianceStatus,
        NIST_AI_RMF: complianceStatus,
        KPMG_TAF:    complianceStatus,
      },
    } as ReportData;
  })();
  const [sel, setSel] = useState<string | null>(null);
  const [anim, setAnim] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnim(true), 150);
  }, []);

  if (!r) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#050d1a", gap: 20 }}>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 18 }}>No report data found.</p>
        <button
          style={{
            padding: "14px 32px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "white",
            borderRadius: 12,
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 600,
          }}
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const prn = r.trusted_ai_principles || {};
  const pkeys = Object.keys(prn);
  const hasPrn = pkeys.length > 0;
  const rc = r.risk_level === "Low" ? "#00C896" : r.risk_level === "Moderate" ? "#ffb020" : "#ff4d4d";
  const fmt = (d: string) => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const selData = sel ? prn[sel] : null;

  const fadeStyle = (delay: number): React.CSSProperties => ({
    opacity: anim ? 1 : 0,
    transform: anim ? "translateY(0)" : "translateY(24px)",
    transition: `all 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
  });

 const handleDownloadPDF = async () => {
  setPdfLoading(true);

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You need to be logged in to download reports. Redirecting to login...");
      navigate("/login");
      return;
    }

    if (!r.report_id) {
      alert("No report ID found. Please complete an evaluation first.");
      return;
    }

    const response = await fetch(`http://localhost:8000/reports/${r.report_id}/pdf`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/pdf",
      },
    });

    if (!response.ok) {
      let errorDetail = "Unknown error";
      try {
        const errJson = await response.json();
        errorDetail = errJson.detail || errorDetail;
      } catch {}
      throw new Error(`Download failed: ${response.status} - ${errorDetail}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `Audit_Report_${r.report_id || "Unknown"}_${new Date().toISOString().split("T")[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

  } catch (err: any) {
    console.error("PDF download error:", err);
    alert(err.message || "Failed to download PDF. Check if you're logged in and report exists.");
  } finally {
    setPdfLoading(false);
  }
};

  const S: Record<string, React.CSSProperties> = {
    page: {
      minHeight: "100vh",
      background: "#050d1a",
      fontFamily: "'DM Sans',sans-serif",
      color: "white",
      padding: "40px 20px 100px",
      position: "relative",
      overflowX: "hidden",
    },
    bg: {
      position: "fixed",
      inset: 0,
      zIndex: 0,
      pointerEvents: "none",
      background: "radial-gradient(ellipse 90% 60% at 15% 10%, rgba(0,100,200,0.12) 0%, transparent 65%), radial-gradient(ellipse 70% 50% at 85% 85%, rgba(0,200,150,0.09) 0%, transparent 65%)",
    },
    header: {
      position: "relative",
      zIndex: 1,
      padding: "32px 40px 24px",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      flexWrap: "wrap",
      gap: 20,
    },
    logo: {
      fontSize: 20,
      fontWeight: 900,
      background: "linear-gradient(135deg, #00C8FF, #00C896)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    kBadge: {
      fontSize: 11,
      padding: "3px 12px",
      background: "rgba(0,51,141,0.45)",
      border: "1px solid rgba(0,51,141,0.65)",
      borderRadius: 20,
      color: "#60A5FA",
    },
    title: {
      fontSize: 32,
      fontWeight: 900,
      color: "white",
      letterSpacing: "-0.02em",
      margin: "6px 0 10px",
    },
    meta: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "center",
      fontSize: 13,
      color: "rgba(255,255,255,0.55)",
    },
    dot: { color: "rgba(255,255,255,0.25)" },
    backBtn: {
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.12)",
      color: "rgba(255,255,255,0.75)",
      padding: "10px 24px",
      borderRadius: 10,
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 600,
      transition: "all 0.3s",
    },
    heroRow: {
      position: "relative",
      zIndex: 1,
      display: "flex",
      gap: 24,
      padding: "32px 40px",
      alignItems: "stretch",
      flexWrap: "wrap",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    },
    heroScore: {
      textAlign: "center",
      padding: "32px 40px",
      background: "rgba(255,255,255,0.04)",
      border: "2px solid",
      borderRadius: 20,
      minWidth: 200,
      flexShrink: 0,
      boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
    },
    riskPill: {
      display: "inline-block",
      padding: "5px 16px",
      borderRadius: 20,
      fontSize: 13,
      fontWeight: 700,
      marginTop: 12,
    },
    statsRow: {
      display: "flex",
      gap: 12,
      flexWrap: "wrap",
      flex: 1,
    },
    statCard: {
      flex: "1 1 130px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.09)",
      borderRadius: 14,
      padding: "16px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
    },
    sec: {
      position: "relative",
      zIndex: 1,
      margin: "32px 40px",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 18,
      padding: "32px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
    },
    secTitle: {
      fontSize: 22,
      fontWeight: 800,
      color: "white",
      marginBottom: 10,
    },
    secSub: {
      fontSize: 13,
      color: "rgba(255,255,255,0.45)",
      marginBottom: 24,
      lineHeight: 1.5,
    },
    spiderWrap: {
      display: "flex",
      gap: 32,
      flexWrap: "wrap",
      alignItems: "flex-start",
      justifyContent: "center",
    },
    drillPanel: {
      flex: "1 1 320px",
      minHeight: 420,
      background: "rgba(0,0,0,0.22)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 14,
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    },
  };

  return (
    <div style={S.page}>
      <div style={S.bg} />

      {/* HEADER */}
      <div style={{ ...S.header, ...fadeStyle(0) }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
            <span style={S.logo}>Auditable AI™</span>
            <span style={S.kBadge}>⬡ KPMG Trusted AI Framework</span>
          </div>
          <h1 style={S.title}>Governance Audit Report</h1>
          <div style={S.meta}>
            <span>📌 {r.ai_name}</span><span style={S.dot}> · </span>
            <span>🧠 {r.model_type}</span><span style={S.dot}> · </span>
            <span>📅 {fmt(r.evaluated_at)}</span><span style={S.dot}> · </span>
            <span style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              ID: {r.report_id?.slice(0, 12)}…
            </span>
          </div>
        </div>
        <button
          style={S.backBtn}
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>
      </div>

      {/* HERO SCORE */}
      <div style={{ ...S.heroRow, ...fadeStyle(0.1) }}>
        <div style={{ ...S.heroScore, borderColor: `${rc}55` }}>
          <div style={{ fontSize: 72, fontWeight: 900, color: rc, lineHeight: 1 }}>
            {r.overall_score}
          </div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", marginTop: 6 }}>/ 100</div>
          <div style={{ ...S.riskPill, background: `${rc}22`, border: `1px solid ${rc}66`, color: rc }}>
            {r.risk_level} Risk
          </div>
        </div>

        <div style={S.statsRow}>
          {[
            { icon: "📂", label: "Logs Evaluated", val: r.logs_evaluated },
            { icon: "📊", label: "Data Quality", val: `${r.data_quality_score}%` },
            { icon: "🏗️", label: "Structural Risk", val: r.structural_risk },
            { icon: "✅", label: "Principles Tested", val: pkeys.length },
            { icon: "⚠️", label: "Findings", val: r.findings?.length || 0 },
          ].map((s, i) => (
            <div key={i} style={S.statCard}>
              <span style={{ fontSize: 26 }}>{s.icon}</span>
              <div style={{ fontSize: 26, fontWeight: 900, color: "white" }}>{s.val}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FRAMEWORK COMPLIANCE */}
      <section style={{ ...S.sec, ...fadeStyle(0.15) }}>
        <h2 style={S.secTitle}>🏛️ Regulatory & Framework Compliance</h2>
        <p style={S.secSub}>Assessment against major AI governance standards.</p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          {Object.entries(r.framework_compliance || {}).map(([key, status]) => {
            const fw = FW[key] || { label: key, icon: "📋", desc: "" };
            const sc = CC[status] || "#aaa";
            return (
              <div key={key} style={{ ...S.fwCard, borderColor: `${sc}55`, minWidth: 180 }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{fw.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "white" }}>{fw.label}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: "6px 0" }}>{fw.desc}</div>
                <div style={{ ...S.fwPill, background: `${sc}22`, border: `1px solid ${sc}66`, color: sc }}>
                  {status}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ ...S.fwNote, marginTop: 24, fontSize: 12 }}>
          <span style={{ opacity: 0.5 }}>ℹ️</span>
          <span style={{ marginLeft: 10, lineHeight: 1.6 }}>
            EU AI Act • ISO/IEC 42001:2023 • NIST AI RMF • KPMG Trusted AI Framework
          </span>
        </div>
      </section>

      {/* SIDE-BY-SIDE PRINCIPLES ASSESSMENT */}
      {hasPrn && (
        <section style={{ ...S.sec, ...fadeStyle(0.2), padding: "40px" }}>
          <h2 style={{ ...S.secTitle, fontSize: 26, marginBottom: 16 }}>🕸️ Trusted AI Principles Assessment</h2>
          <p style={{ ...S.secSub, marginBottom: 32 }}>Hover or click any principle to see sub-parameter details.</p>

          <div style={{
            display: "flex",
            gap: 32,
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "center",
          }}>
            {/* Left: Spider Chart */}
            <div style={{ flex: "1 1 500px", minWidth: 320 }}>
              <Spider principles={prn} onSelect={setSel} selected={sel} />
            </div>

            {/* Right: Drill-down / List */}
            <div style={{
              flex: "1 1 360px",
              minWidth: 320,
              background: "rgba(0,0,0,0.22)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: "28px",
              minHeight: 460,
            }}>
              {!sel ? (
                <div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", textAlign: "center", marginBottom: 20 }}>
                    Select a principle to view breakdown
                  </div>
                  {pkeys.map(k => {
                    const c = COLORS[k] || "#00C896";
                    const sc = prn[k].score;
                    return (
                      <div
                        key={k}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 0",
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onClick={() => setSel(k)}
                      >
                        <span style={{ fontSize: 18 }}>{ICONS[k]}</span>
                        <span style={{ flex: 1, fontSize: 14 }}>{k}</span>
                        <div style={{ width: 80, height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3 }}>
                          <div style={{ width: `${sc}%`, height: "100%", background: c, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: c }}>{sc}</span>
                      </div>
                    );
                  })}
                </div>
              ) : selData ? (
                <div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
                    <span style={{ fontSize: 28 }}>{ICONS[sel]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{sel}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Sub-parameters</div>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: COLORS[sel] || "#00C896" }}>
                      {selData.score}
                    </div>
                  </div>

                  <div style={{ margin: "24px 0", textAlign: "center" }}>
                    <Radial score={selData.score} label={sel} color={COLORS[sel] || "#00C896"} size={110} />
                  </div>

                  {Object.entries(selData.parameters).map(([param, val]) => {
                    const v = val as number;
                    const c = COLORS[sel] || "#00C896";
                    const sl = v >= 75 ? "Good" : v >= 50 ? "Fair" : "Poor";
                    const sc2 = v >= 75 ? "#00C896" : v >= 50 ? "#ffb020" : "#ff4d4d";
                    return (
                      <div key={param} style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{param}</span>
                          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, color: sc2, background: `${sc2}15`, border: `1px solid ${sc2}40` }}>
                            {sl}
                          </span>
                        </div>
                        <div style={{ height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 4 }}>
                          <div style={{ width: `${v}%`, height: "100%", background: c, borderRadius: 4 }} />
                        </div>
                        <div style={{ textAlign: "right", fontSize: 12, color: c, marginTop: 4 }}>{v}</div>
                      </div>
                    );
                  })}

                  <button
                    style={{
                      marginTop: 24,
                      width: "100%",
                      padding: "10px",
                      background: "transparent",
                      border: `1px solid ${COLORS[sel] || "#00C896"}50`,
                      color: COLORS[sel] || "#00C896",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                    onClick={() => setSel(null)}
                  >
                    ← Back to All Principles
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      )}

      {/* BAR CHART */}
      {hasPrn && (
        <section style={{ ...S.sec, ...fadeStyle(0.25) }}>
          <h2 style={S.secTitle}>📊 Principle Score Distribution</h2>
          <p style={S.secSub}>Hover bars for details.</p>
          <ImprovedBarChart principles={prn} />
        </section>
      )}

      {/* RADIAL GRID */}
      

      {/* DIAGNOSTICS */}
      <section style={{ ...S.sec, ...fadeStyle(0.35) }}>
        <h2 style={S.secTitle}>🔬 Dataset Diagnostics</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
          {[
            { icon: "❌", label: "Missing Ratio", val: `${(r.diagnostics.missing_ratio * 100).toFixed(1)}%`, c: r.diagnostics.missing_ratio < 0.1 ? "#00C896" : "#ff4d4d" },
            { icon: "🔁", label: "Duplicates", val: r.diagnostics.duplicates, c: r.diagnostics.duplicates === 0 ? "#00C896" : "#ffb020" },
            { icon: "🧩", label: "Schema Confidence", val: `${Math.round(r.diagnostics.schema_confidence * 100)}%`, c: "#60A5FA" },
            { icon: "📐", label: "Total Columns", val: r.diagnostics.total_columns, c: "#A78BFA" },
            { icon: "📝", label: "Text Columns", val: r.diagnostics.text_columns, c: "#00E5A0" },
            { icon: "🔢", label: "Numeric Columns", val: r.diagnostics.numeric_columns, c: "#FBBF24" },
          ].map((d, i) => (
            <div key={i} style={{ ...S.diagCard, borderColor: `${d.c}44` }}>
              <span style={{ fontSize: 26 }}>{d.icon}</span>
              <div style={{ fontSize: 22, fontWeight: 800, color: d.c }}>{d.val}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{d.label}</div>
            </div>
          ))}
        </div>
        {r.diagnostics.column_names?.length > 0 && (
          <div style={{ marginTop: 24, padding: "16px", background: "rgba(0,0,0,0.2)", borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Detected columns:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {r.diagnostics.column_names.map((col, i) => (
                <span key={i} style={{ padding: "4px 12px", background: "rgba(255,255,255,0.06)", borderRadius: 20, fontSize: 12 }}>
                  {col}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* FINDINGS */}
      <section style={{ ...S.sec, ...fadeStyle(0.4) }}>
        <h2 style={S.secTitle}>
          ⚠️ Audit Findings {(r.findings?.length || 0) > 0 && <span style={{ color: "#ff4d4d", fontWeight: 700 }}>({r.findings.length})</span>}
        </h2>
        {!r.findings?.length ? (
          <div style={{ padding: 24, background: "rgba(0,200,150,0.08)", border: "1px solid rgba(0,200,150,0.25)", borderRadius: 12, color: "#00C896" }}>
            ✅ No critical findings. Dataset aligns well with standards.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {r.findings.map((f, i) => {
              const sc = f.severity === "High" ? "#ff4d4d" : f.severity === "Medium" ? "#ffb020" : "#00C896";
              return (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${sc}33`, borderRadius: 12, padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: COLORS[f.category] || "white", fontWeight: 600 }}>
                      {ICONS[f.category] || "•"} {f.category}
                    </span>
                    <span style={{ color: sc, fontWeight: 700 }}>{f.severity}</span>
                  </div>
                  <p style={{ margin: "8px 0", color: "rgba(255,255,255,0.85)" }}>{f.issue}</p>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>💡 {f.recommendation}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* RECOMMENDATION */}
      {r.recommendation && (
        <section style={{ ...S.sec, ...fadeStyle(0.45) }}>
          <h2 style={S.secTitle}>📌 Overall Recommendation</h2>
          <div style={{ padding: 20, background: "rgba(255,176,32,0.06)", border: "1px solid rgba(255,176,32,0.25)", borderRadius: 12 }}>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>{r.recommendation}</p>
          </div>
        </section>
      )}

      {/* PDF DOWNLOAD SECTION */}
      <section style={{ ...S.sec, ...fadeStyle(0.5), textAlign: "center" }}>
        <h2 style={{ fontSize: 24, marginBottom: 16 }}>Need a Comprehensive Report?</h2>
        <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 24 }}>
          Download full PDF with summary, evidence, and roadmap.
        </p>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            style={{
              padding: "12px 36px",
              background: pdfLoading ? "rgba(0,200,150,0.4)" : "linear-gradient(135deg, #00C896, #0091DA)",
              border: "none",
              borderRadius: 10,
              color: "white",
              fontWeight: 600,
              cursor: pdfLoading ? "not-allowed" : "pointer",
              minWidth: 220,
            }}
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
          >
            {pdfLoading ? "Preparing PDF..." : "Download Full PDF Report"}
          </button>
          <button
            style={{
              padding: "12px 36px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 10,
              color: "rgba(255,255,255,0.85)",
              cursor: "pointer",
            }}
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ textAlign: "center", padding: "40px 20px 60px", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
        Report ID: {r.report_id} · Auditable AI™ · KPMG Trusted AI Framework
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeIn { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:none } }
        * { box-sizing:border-box; margin:0; padding:0; }
      `}</style>
    </div>
  );
}