/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  audit_count: number;
  created_at: string | null;
  last_login: string | null;
}

interface AuditRecord {
  audit_id: string;
  ai_name: string;
  overall_score: number;
  risk_level: string;
  status: string;
  created_at: string;
  probes_run?: number;
  mode?: string;
  findings?: any[];
}

const BASE_URL = "http://localhost:8000";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const riskColor = (level: string) =>
  level === "Low" ? "#00C896" : level === "Moderate" ? "#ffb020" : "#ff4d4d";

const scoreGrade = (score: number) => {
  if (score >= 80) return { label: "Excellent", color: "#00C896" };
  if (score >= 65) return { label: "Good", color: "#4AACDF" };
  if (score >= 50) return { label: "Fair", color: "#ffb020" };
  return { label: "Poor", color: "#ff4d4d" };
};

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const fmtDateTime = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const getInitials = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

/* ─────────────────────────────────────────────
   SVG Score Ring
───────────────────────────────────────────── */
function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const { color } = scoreGrade(score);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(255,255,255,0.07)" strokeWidth={size * 0.1} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={size * 0.1}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dasharray 1.2s ease" }} />
      <text x={size/2} y={size/2 + 5} textAnchor="middle"
        fill="white" fontSize={size * 0.26} fontWeight="800"
        fontFamily="'IBM Plex Sans',sans-serif">
        {score}
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
export default function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile]       = useState<UserProfile | null>(null);
  const [audits, setAudits]         = useState<AuditRecord[]>([]);
  const [loading, setLoading]       = useState(true);
  const [auditsLoading, setAuditsLoading] = useState(true);
  const [profileError, setProfileError]   = useState("");

  const [editMode, setEditMode]     = useState(false);
  const [editName, setEditName]     = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg]       = useState<{ text: string; ok: boolean } | null>(null);

  const [mounted, setMounted]       = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 60);
    loadProfile();
    loadAuditHistory();
  }, []);

  const authHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadProfile = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/auth/me`, { headers: authHeader() });
      setProfile(res.data);
      setEditName(res.data.name);
    } catch {
      setProfileError("Could not load profile. Please log in again.");
    } finally {
      setLoading(false);
    }
  };

  const loadAuditHistory = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/blackbox/history-all`, { headers: authHeader() });
      setAudits(res.data.history || []);
    } catch {
      setAudits([]);
    } finally {
      setAuditsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) return;
    setSaveLoading(true);
    setSaveMsg(null);
    try {
      await axios.patch(
        `${BASE_URL}/api/auth/me`,
        { name: editName.trim() },
        { headers: authHeader() }
      );
      setProfile((p) => p ? { ...p, name: editName.trim() } : p);
      setEditMode(false);
      setSaveMsg({ text: "Name updated successfully.", ok: true });
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {
      setSaveMsg({ text: "Failed to update. Try again.", ok: false });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAuditClick = async (audit: AuditRecord) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/blackbox/audit/${audit.audit_id}`,
        { headers: authHeader() }
      );
      navigate("/report", { state: { data: res.data } });
    } catch {
      navigate("/report", { state: { data: audit } });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("activeAI");
    navigate("/login");
  };

  /* Derived stats */
  const completedAudits = audits.filter((a) => a.status === "completed");
  const avgScore =
    completedAudits.length > 0
      ? Math.round(completedAudits.reduce((s, a) => s + (a.overall_score || 0), 0) / completedAudits.length)
      : null;
  const highRiskCount = audits.filter((a) => a.risk_level === "High").length;

  const fade = (delay: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(18px)",
    transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
  });

  /* ── Loading screen ── */
  if (loading) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#030C1E" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:38, height:38, border:"3px solid rgba(0,145,218,0.2)", borderTop:"3px solid #0091DA", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 14px" }} />
          <p style={{ color:"#9DBFE0", fontSize:13, fontFamily:"'IBM Plex Sans',sans-serif" }}>Loading profile…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  /* ── Error screen ── */
  if (profileError) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", background:"#030C1E", gap:18, fontFamily:"'IBM Plex Sans',sans-serif" }}>
        <div style={{ fontSize:38 }}>⚠️</div>
        <p style={{ color:"#ff8787", fontSize:14 }}>{profileError}</p>
        <button onClick={() => navigate("/login")} style={{ padding:"11px 26px", background:"linear-gradient(135deg,#0091DA,#00C896)", border:"none", borderRadius:10, color:"white", fontWeight:600, cursor:"pointer", fontSize:13 }}>
          Back to Login
        </button>
      </div>
    );
  }

  const initials = profile ? getInitials(profile.name) : "??";

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at 15% 15%, rgba(0,51,141,0.55) 0%, transparent 45%), radial-gradient(circle at 85% 80%, rgba(0,200,150,0.18) 0%, transparent 45%), #030C1E",
      color: "#D8E8F5",
      fontFamily: "'IBM Plex Sans', sans-serif",
      padding: "36px 40px 80px",
    }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,145,218,0.3); border-radius: 3px; }

        .p-panel {
          background: rgba(8,22,52,0.75);
          border: 1px solid rgba(0,145,218,0.22);
          border-radius: 18px;
          padding: 28px 30px;
          backdrop-filter: blur(18px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.28);
        }
        .p-input {
          padding: 11px 15px;
          border-radius: 10px;
          border: 1px solid rgba(0,145,218,0.35);
          background: rgba(3,12,30,0.7);
          color: #EAF2FB;
          font-size: 14px;
          font-family: 'IBM Plex Sans', sans-serif;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .p-input:focus {
          border-color: #00C896;
          box-shadow: 0 0 0 3px rgba(0,200,150,0.15);
        }
        .p-input::placeholder { color: rgba(255,255,255,0.3); }

        .btn-primary {
          padding: 10px 20px; border-radius: 9px; border: none;
          background: linear-gradient(135deg, #0091DA, #00C896);
          color: white; font-weight: 600; font-size: 13px; cursor: pointer;
          font-family: 'IBM Plex Sans', sans-serif;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
        }
        .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,200,150,0.3); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-ghost {
          padding: 10px 20px; border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.18);
          background: transparent; color: rgba(255,255,255,0.65);
          font-weight: 600; font-size: 13px; cursor: pointer;
          font-family: 'IBM Plex Sans', sans-serif;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.3); color: white; }

        .btn-danger {
          padding: 10px 20px; border-radius: 9px;
          border: 1px solid rgba(255,77,77,0.3); background: rgba(255,77,77,0.07);
          color: #ff8787; font-weight: 600; font-size: 13px; cursor: pointer;
          font-family: 'IBM Plex Sans', sans-serif; transition: background 0.2s, transform 0.2s;
        }
        .btn-danger:hover { background: rgba(255,77,77,0.16); transform: translateY(-1px); }

        .audit-item {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 18px; border-radius: 12px;
          border: 1px solid rgba(0,145,218,0.14);
          background: rgba(255,255,255,0.03);
          cursor: pointer;
          transition: background 0.22s, border-color 0.22s, transform 0.22s;
          flex-wrap: wrap;
        }
        .audit-item:hover {
          background: rgba(0,145,218,0.09);
          border-color: rgba(0,145,218,0.3);
          transform: translateX(5px);
        }

        .stat-pill {
          text-align: center; padding: 16px 18px;
          border-radius: 14px; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(0,145,218,0.18);
          flex: 1; min-width: 80px;
        }

        .info-row {
          display: flex; flex-direction: column; gap: 4px;
          padding: 13px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .info-row:last-child { border-bottom: none; }
        .info-label {
          font-size: 10px; font-weight: 600; color: #4AACDF;
          text-transform: uppercase; letter-spacing: 0.7px;
        }
        .info-value { font-size: 13px; color: #D8E8F5; font-weight: 500; }

        .sec-heading {
          font-size: 15px; font-weight: 700; color: #EAF2FB;
          margin: 0 0 18px; display: flex; align-items: center; gap: 8px;
        }

        .avatar {
          width: 78px; height: 78px; border-radius: 50%;
          background: linear-gradient(135deg, #00338D 0%, #0091DA 60%, #00C896 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 26px; font-weight: 800; color: white;
          letter-spacing: -1px; flex-shrink: 0;
          box-shadow: 0 0 0 3px rgba(0,200,150,0.35), 0 4px 20px rgba(0,0,0,0.3);
        }

        .tag {
          display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;
        }

        .quick-action-btn {
          padding: 14px 16px; border-radius: 12px;
          border: 1px solid rgba(0,145,218,0.2);
          background: rgba(255,255,255,0.03);
          color: #D8E8F5; font-size: 13px; font-weight: 600;
          cursor: pointer; text-align: left; font-family: inherit;
          transition: background 0.22s, border-color 0.22s, transform 0.22s;
          display: flex; align-items: center; gap: 10px;
        }
        .quick-action-btn:hover {
          background: rgba(0,145,218,0.1);
          border-color: rgba(0,145,218,0.35);
          transform: translateY(-2px);
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── TOP BAR ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:32, paddingBottom:18, borderBottom:"1px solid rgba(0,145,218,0.18)", ...fade(0) }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <span style={{ fontSize:22, fontWeight:800, background:"linear-gradient(90deg,#00C896,#0091DA)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            Auditable AI™
          </span>
          <span style={{ fontSize:11, color:"#4AACDF", background:"rgba(0,145,218,0.1)", border:"1px solid rgba(0,145,218,0.25)", borderRadius:20, padding:"3px 12px" }}>
            Profile
          </span>
        </div>
        <button className="btn-danger" onClick={handleLogout}>Sign Out →</button>
      </div>

      <div style={{ maxWidth:1060, margin:"0 auto", display:"flex", flexDirection:"column", gap:22 }}>

        {/* ── IDENTITY HERO ── */}
        <div className="p-panel" style={{ ...fade(0.06), display:"flex", gap:26, alignItems:"center", flexWrap:"wrap" }}>

          <div className="avatar">{initials}</div>

          <div style={{ flex:1, minWidth:200 }}>
            {editMode ? (
              <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                <input
                  className="p-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Full name"
                  style={{ width:210 }}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  autoFocus
                />
                <button className="btn-primary" onClick={handleSave} disabled={saveLoading}>
                  {saveLoading ? "Saving…" : "Save"}
                </button>
                <button className="btn-ghost" onClick={() => { setEditMode(false); setEditName(profile?.name || ""); }}>
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                <h1 style={{ margin:0, fontSize:24, fontWeight:700, color:"#EAF2FB" }}>{profile?.name}</h1>
                <button
                  onClick={() => setEditMode(true)}
                  style={{ background:"none", border:"none", color:"#4AACDF", fontSize:13, cursor:"pointer", fontFamily:"inherit", padding:"4px 8px", borderRadius:6 }}
                >
                  ✎ Edit
                </button>
              </div>
            )}

            <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
              <span className="tag" style={{ background:"rgba(0,200,150,0.12)", border:"1px solid rgba(0,200,150,0.3)", color:"#00C896" }}>
                ✓ 
              </span>
              <span className="tag" style={{ background:"rgba(0,145,218,0.12)", border:"1px solid rgba(0,145,218,0.3)", color:"#4AACDF", textTransform:"capitalize" }}>
                {profile?.role || "Auditor"}
              </span>
            </div>

            {saveMsg && (
              <p style={{ margin:"10px 0 0", fontSize:12, color: saveMsg.ok ? "#00C896" : "#ff8787" }}>
                {saveMsg.ok ? "✓" : "✗"} {saveMsg.text}
              </p>
            )}
          </div>

          {/* Stats */}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {[
              { val: profile?.audit_count ?? 0,   label: "Total Audits",  color: "#00C896" },
              { val: completedAudits.length,        label: "Completed",     color: "#0091DA" },
              { val: avgScore ?? "—",               label: "Avg Score",     color: avgScore !== null ? scoreGrade(avgScore).color : "#9DBFE0" },
              { val: highRiskCount,                 label: "High Risk",     color: highRiskCount > 0 ? "#ff4d4d" : "#00C896" },
            ].map((s) => (
              <div key={s.label} className="stat-pill">
                <div style={{ fontSize:26, fontWeight:800, color: s.color as string }}>{s.val}</div>
                <div style={{ fontSize:10, color:"#9DBFE0", marginTop:3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TWO COLUMN ── */}
        <div style={{ display:"grid", gridTemplateColumns:"320px 1fr", gap:22, alignItems:"start", ...fade(0.12) }}>

          {/* LEFT – Account info */}
          <div className="p-panel" style={{ margin:0 }}>
            <p className="sec-heading">👤 Account Details</p>

            {[
              { label:"Email",        value: profile?.email },
              { label:"Role",         value: profile?.role, capitalize: true },
              { label:"Organisation", value: "KPMG Assurance and Consulting Services LLP" },
              { label:"Member Since", value: fmtDate(profile?.created_at ?? null) },
              { label:"Last Login",   value: fmtDateTime(profile?.last_login ?? null) },
            ].map((row) => (
              <div key={row.label} className="info-row">
                <span className="info-label">{row.label}</span>
                <span className="info-value" style={row.capitalize ? { textTransform:"capitalize" } : undefined}>
                  {row.value ?? "—"}
                </span>
              </div>
            ))}

            <div className="info-row">
              <span className="info-label">Platform Access</span>
              <div style={{ display:"flex", flexDirection:"column", gap:5, marginTop:5 }}>
                {["Black Box Audit", "SDCC Pipeline", "Report Generation"].map((f) => (
                  <span key={f} style={{ fontSize:12, color:"#00C896", display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ width:5, height:5, borderRadius:"50%", background:"#00C896", display:"inline-block", flexShrink:0 }} />
                    {f}
                  </span>
                ))}
              </div>
            </div>

            <button className="btn-primary" style={{ width:"100%", marginTop:20 }} onClick={() => navigate("/dashboard")}>
              ← Back to Dashboard
            </button>
          </div>

          {/* RIGHT – Audit history */}
          <div className="p-panel" style={{ margin:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
              <p className="sec-heading" style={{ margin:0 }}>📁 My Projects</p>
              <button className="btn-ghost" style={{ fontSize:12, padding:"7px 14px" }} onClick={() => navigate("/dashboard")}>
                + New Audit
              </button>
            </div>

            {auditsLoading ? (
              <div style={{ textAlign:"center", padding:"48px 0" }}>
                <div style={{ width:30, height:30, border:"3px solid rgba(0,145,218,0.15)", borderTop:"3px solid #0091DA", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 14px" }} />
                <p style={{ color:"#9DBFE0", fontSize:13 }}>Loading audits…</p>
              </div>
            ) : audits.length === 0 ? (
              <div style={{ textAlign:"center", padding:"52px 20px" }}>
                <div style={{ fontSize:42, marginBottom:14 }}>🔍</div>
                <p style={{ color:"#9DBFE0", fontSize:13, margin:"0 0 14px" }}>No audits run yet.</p>
                <button className="btn-primary" onClick={() => navigate("/dashboard")}>Run your first audit →</button>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:9, maxHeight:430, overflowY:"auto", paddingRight:2 }}>
                {audits.map((audit) => {
                  const rc = riskColor(audit.risk_level);
                  const { color: sc, label: grade } = scoreGrade(audit.overall_score ?? 0);
                  return (
                    <div key={audit.audit_id} className="audit-item" onClick={() => handleAuditClick(audit)}>

                      <ScoreRing score={audit.overall_score ?? 0} size={52} />

                      <div style={{ flex:1, minWidth:110 }}>
                        <div style={{ fontWeight:700, fontSize:14, color:"#EAF2FB", marginBottom:3 }}>
                          {audit.ai_name}
                        </div>
                        <div style={{ fontSize:11, color:"#9DBFE0" }}>
                          {fmtDate(audit.created_at)}
                          {audit.probes_run ? ` · ${audit.probes_run} probes` : ""}
                          {audit.mode ? ` · ${audit.mode.toUpperCase()}` : ""}
                        </div>
                      </div>

                      <span style={{ fontSize:11, fontWeight:700, color:sc, background:`${sc}15`, border:`1px solid ${sc}40`, padding:"3px 9px", borderRadius:20, flexShrink:0 }}>
                        {grade}
                      </span>

                      <span style={{ fontSize:11, fontWeight:600, color:rc, background:`${rc}12`, border:`1px solid ${rc}40`, padding:"3px 9px", borderRadius:20, flexShrink:0 }}>
                        {audit.risk_level}
                      </span>

                      <span style={{ fontSize:11, color: audit.status === "completed" ? "#00C896" : "#ffb020", fontWeight:600, flexShrink:0 }}>
                        {audit.status === "completed" ? "✓ Done" : "⏳ " + audit.status}
                      </span>

                      <span style={{ color:"#4AACDF", fontSize:18, flexShrink:0 }}>›</span>
                    </div>
                  );
                })}
              </div>
            )}

            {audits.length > 0 && (
              <p style={{ margin:"12px 0 0", fontSize:11, color:"#4AACDF", textAlign:"center", fontStyle:"italic" }}>
                Click any row to open its full report →
              </p>
            )}
          </div>
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div className="p-panel" style={{ ...fade(0.18) }}>
          <p className="sec-heading">⚡ Quick Actions</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(185px, 1fr))", gap:10 }}>
            {[
              { icon:"🛡", label:"New Black Box Audit",  path:"/dashboard"    },
              { icon:"📊", label:"Upload Logs (SDCC)",   path:"/dashboard"    },
              { icon:"📄", label:"Report Generation",    path:"/report"       },
              { icon:"🤖", label:"Register AI System",   path:"/register-ai"  },
            ].map((a) => (
              <button key={a.label} className="quick-action-btn" onClick={() => navigate(a.path)}>
                <span style={{ fontSize:18 }}>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}