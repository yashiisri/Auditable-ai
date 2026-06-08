/**
 * AuditContextBar
 * ─ Sticky blue navbar on every audit workspace page
 * ─ White text throughout; active tab is white pill, inactive is translucent white
 * ─ Score shown once here only — remove from page headers
 * ─ Prev/Next now live at the BOTTOM of each page via <LensFooter> (exported separately)
 */
import { useNavigate, useLocation } from "react-router-dom";

const B9 = "#00338D";
const BM = "#005EB8";
const FF = "'Plus Jakarta Sans', system-ui, sans-serif";

export const LENS_ORDER = [
  { label: "Executive Summary", path: "/audit-overview"        },
  { label: "Data Quality",      path: "/agent-behaviour"       },
  { label: "LLM Analysis",      path: "/llm-analysis"          },
  { label: "Governance",        path: "/governance-principles"  },
  { label: "Regulatory",        path: "/regulatory-alignment"  },
  { label: "Risk & Actions",    path: "/risk-intelligence"     },
  { label: "Export",            path: "/download-report"       },
];

function bandLabel(s: number) {
  return s >= 75 ? "Strong" : s >= 50 ? "Watch" : "Critical";
}
/* slate-grey for critical — clean, not brown, not red */
function bandColor(s: number) {
  return s >= 75 ? "#34D399" : s >= 50 ? "#FCD34D" : "#94A3B8";
}

function getState() {
  try { const s = sessionStorage.getItem("lastReportData"); return s ? { state: { data: JSON.parse(s) } } : {}; }
  catch { return {}; }
}

/* ── Sticky top navbar ─────────────────────────────────────────────── */
export default function AuditContextBar({ data }: { data: Record<string, unknown> | null }) {
  const navigate    = useNavigate();
  const location    = useLocation();

  const score     = (data as any)?.overall_score ?? 0;
  const agentName = (data as any)?.ai_name ?? localStorage.getItem("activeAI") ?? "AI Agent";
  const navTo     = (path: string) => navigate(path, getState());

  return (
    <>
      <style>{`
        .acb-tab { border: none; cursor: pointer; font-family: ${FF}; transition: background 0.14s, color 0.14s; }
        .acb-tab:hover { background: rgba(255,255,255,0.18) !important; }
      `}</style>
      <div style={{
        position: "sticky", top: 0, zIndex: 40,
        background: `linear-gradient(90deg, ${B9} 0%, ${BM} 100%)`,
        fontFamily: FF, boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
      }}>
        {/* Subtle dot-grid texture */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }} />

        <div style={{ position: "relative", display: "flex", alignItems: "center", padding: "0 24px", height: 52 }}>

          {/* Agent chip */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 22, flexShrink: 0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.25 }}>
                {agentName}
              </div>
              {score > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 800, color: bandColor(score), letterSpacing: "-0.3px" }}>
                    {score}
                  </span>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: bandColor(score), textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {bandLabel(score)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 26, background: "rgba(255,255,255,0.16)", marginRight: 18, flexShrink: 0 }} />

          {/* Lens tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, overflow: "hidden" }}>
            {LENS_ORDER.map(lens => {
              const active = location.pathname === lens.path;
              return (
                <button
                  key={lens.path}
                  className="acb-tab"
                  onClick={() => navTo(lens.path)}
                  style={{
                    padding: "5px 12px", borderRadius: 6,
                    fontSize: 12, fontWeight: active ? 700 : 400,
                    background: active ? "rgba(255,255,255,0.95)" : "transparent",
                    color: active ? B9 : "rgba(255,255,255,0.78)",
                    whiteSpace: "nowrap",
                    letterSpacing: active ? "-0.1px" : "0",
                  }}
                >
                  {lens.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Bottom page-turner — import and place at the end of every lens page ── */
export function LensFooter({ data }: { data: Record<string, unknown> | null }) {
  const navigate    = useNavigate();
  const location    = useLocation();
  const currentIdx  = LENS_ORDER.findIndex(l => l.path === location.pathname);
  const prev        = currentIdx > 0 ? LENS_ORDER[currentIdx - 1] : null;
  const next        = currentIdx >= 0 && currentIdx < LENS_ORDER.length - 1 ? LENS_ORDER[currentIdx + 1] : null;
  const navTo       = (path: string) => navigate(path, getState());

  const agentName   = (data as any)?.ai_name ?? localStorage.getItem("activeAI") ?? "AI Agent";
  const currentLabel = LENS_ORDER[currentIdx]?.label ?? "";

  return (
    <div style={{
      borderTop: "1px solid #E2E8F0",
      background: "#F8FAFC",
      padding: "20px 40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      fontFamily: FF,
      gap: 12,
    }}>
      {/* Left: prev */}
      <button
        onClick={() => prev && navTo(prev.path)}
        disabled={!prev}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 20px", borderRadius: 10,
          border: "1.5px solid #E2E8F0", background: prev ? "#fff" : "#F8FAFC",
          cursor: prev ? "pointer" : "default", opacity: prev ? 1 : 0,
          transition: "all 0.15s", fontFamily: FF,
          boxShadow: prev ? "0 1px 3px rgba(0,0,0,0.04)" : "none",
        }}
        onMouseEnter={e => { if (prev) { (e.currentTarget as HTMLButtonElement).style.borderColor = BM; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(0,94,184,0.1)"; } }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#E2E8F0"; (e.currentTarget as HTMLButtonElement).style.boxShadow = prev ? "0 1px 3px rgba(0,0,0,0.04)" : "none"; }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={prev ? BM : "#CBD5E1"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 1 }}>Previous</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: BM }}>{prev?.label}</div>
        </div>
      </button>

      {/* Centre: breadcrumb */}
      <div style={{ textAlign: "center", flex: 1 }}>
        <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>{agentName} · Audit Report</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginTop: 2 }}>{currentLabel}</div>
        {/* Dot progress */}
        <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 8 }}>
          {LENS_ORDER.map((l, i) => (
            <div
              key={l.path}
              onClick={() => navTo(l.path)}
              style={{
                width: i === currentIdx ? 20 : 6, height: 6, borderRadius: 3,
                background: i < currentIdx ? BM : i === currentIdx ? B9 : "#CBD5E1",
                cursor: "pointer", transition: "all 0.25s",
              }}
            />
          ))}
        </div>
      </div>

      {/* Right: next */}
      <button
        onClick={() => next && navTo(next.path)}
        disabled={!next}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 20px", borderRadius: 10,
          border: `1.5px solid ${next ? BM : "#E2E8F0"}`,
          background: next ? `linear-gradient(135deg, ${B9}, ${BM})` : "#F8FAFC",
          cursor: next ? "pointer" : "default", opacity: next ? 1 : 0,
          transition: "all 0.15s", fontFamily: FF,
          boxShadow: next ? "0 4px 14px rgba(0,51,141,0.2)" : "none",
        }}
        onMouseEnter={e => { if (next) { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 18px rgba(0,51,141,0.28)"; } }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "none"; (e.currentTarget as HTMLButtonElement).style.boxShadow = next ? "0 4px 14px rgba(0,51,141,0.2)" : "none"; }}
      >
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 1 }}>Next</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>{next?.label}</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 6 15 12 9 18"/>
        </svg>
      </button>
    </div>
  );
}