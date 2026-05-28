import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isAdmin, useAuth } from "../hooks/useAuth";

const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const NAV_ITEMS = [
  {
    section: "Setup",
    items: [
      {
        label: "Register AI Agent",
        path: "/register-ai",
        requiresAgent: false,
        subLabel: "Start here",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            <line x1="12" y1="14" x2="12" y2="20" />
            <line x1="9" y1="17" x2="15" y2="17" />
          </svg>
        ),
      },
    ],
  },
  {
    section: "Audit Pipeline",
    items: [
      {
        label: "Run Audit",
        path: "/dashboard",
        requiresAgent: true,
        subLabel: "Black Box & SDCC",
        isHeader: false,
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        ),
      },
      {
        label: "Audit Overview",
        path: "",
        requiresAgent: true,
        isHeader: true,
        icon: null,
      },
      { label: "Executive Summary",    path: "/audit-overview",        requiresAgent: true, isHeader: false, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
      { label: "Regulatory Alignment", path: "/regulatory-alignment",  requiresAgent: true, isHeader: false, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
      { label: "Risk Intelligence",    path: "/risk-intelligence",     requiresAgent: true, isHeader: false, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
      { label: "LLM Analysis",         path: "/llm-analysis",          requiresAgent: true, isHeader: false, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
      { label: "Governance Principles",path: "/governance-principles", requiresAgent: true, isHeader: false, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
      { label: "Agent Behaviour",      path: "/agent-behaviour",       requiresAgent: true, isHeader: false, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> },
      { label: "Recommendations",      path: "/recommendations",       requiresAgent: true, isHeader: false, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
      { label: "Download Report",      path: "/download-report",       requiresAgent: true, isHeader: false, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> },
    ],
  },
];

const RESPONSIVE_CSS = (
  "@media (max-width: 768px) {" +
  "  .sb-nav { width: 56px !important; }" +
  "  .sb-texts { display: none !important; }" +
  "  .sb-brand { justify-content: center !important; padding: 14px 10px !important; }" +
  "  .sb-item { justify-content: center !important; padding: 10px !important; }" +
  "  .sb-footer { padding: 8px 6px !important; }" +
  "  .sb-user-row { justify-content: center !important; padding: 8px 6px !important; }" +
  "  .sb-chip { display: none !important; }" +
  "}"
);

export default function Sidebar() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const isActive   = (path: string) => location.pathname === path;
  const activeAI   = localStorage.getItem("activeAI");
  const hasAgent   = Boolean(activeAI);
  const admin      = isAdmin();
  const authUser   = useAuth();

  const displayName = authUser?.displayName || authUser?.email?.split("@")[0] || "User";
  const initials    = displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => {
    const id = "sb-responsive";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = RESPONSIVE_CSS;
      document.head.appendChild(el);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("activeAI");
    navigate("/login");
  };

  return (
    <div
      className="sb-nav"
      style={{
        width: 236, minHeight: "100vh", background: "#fff",
        borderRight: "1px solid #E8EFF7", display: "flex",
        flexDirection: "column", flexShrink: 0,
        position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      }}
    >
      {/* Brand */}
      <div className="sb-brand" style={{ padding: "18px 16px 14px", borderBottom: "1px solid #E8EFF7", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          background: "linear-gradient(135deg, #00338D 0%, #005EB8 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,51,141,0.25)",
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div className="sb-texts">
          <div style={{ fontSize: 14, fontWeight: 800, color: "#00338D", letterSpacing: "-0.4px", lineHeight: 1.2 }}>TrustShield AI</div>
          <div style={{ fontSize: 10.5, color: "#7A90AB", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginTop: 1 }}>Audit Platform</div>
        </div>
      </div>

      {/* Active Agent chip */}
      <div className="sb-chip" style={{ padding: "10px 12px", borderBottom: "1px solid #E8EFF7" }}>
        {hasAgent ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
            background: "linear-gradient(135deg, #EEF4FF, #F0F7FF)",
            borderRadius: 9, border: "1px solid #C7D9F5",
          }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00A37A", flexShrink: 0, boxShadow: "0 0 0 2px rgba(0,163,122,0.2)" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9.5, color: "#7A90AB", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Active Agent</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#005EB8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeAI}</div>
            </div>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00A37A", animation: "pulse 2s infinite", flexShrink: 0 }} />
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#FFFBEB", borderRadius: 9, border: "1px solid #FDE68A" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div style={{ fontSize: 11.5, color: "#92400E", fontWeight: 600, lineHeight: 1.4 }}>
              Register an agent to unlock all features
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 8px" }}>
        <style dangerouslySetInnerHTML={{ __html: "@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }" }} />

        {NAV_ITEMS.map((group) => (
          <div key={group.section} style={{ marginBottom: 2 }}>
            <div className="sb-texts" style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.9px",
              textTransform: "uppercase", color: "#A0B4CC", padding: "8px 8px 3px",
            }}>
              {group.section}
            </div>

            {group.items.map((item) => {
              const active = isActive(item.path);
              const locked = item.requiresAgent && !hasAgent;
              const isAnchorItem = "anchor" in item;
              const isHeader = (item as any).isHeader === true;

              // Non-clickable section divider
              if (isHeader) {
                return (
                  <div key={item.label} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 9px 4px", marginTop: 6,
                  }}>
                    <div style={{ flex: 1, height: 1, background: "#E8EFF7" }} />
                    <div className="sb-texts" style={{
                      fontSize: 10, fontWeight: 800, letterSpacing: "0.9px",
                      textTransform: "uppercase", color: "#A0B4CC", whiteSpace: "nowrap",
                    }}>
                      {item.label}
                    </div>
                    <div style={{ flex: 1, height: 1, background: "#E8EFF7" }} />
                  </div>
                );
              }

              const handleClick = () => {
                if (locked) return;
                if (isHeader) return; // non-clickable
                // All audit workspace pages need report data from sessionStorage
                const needsReportData = item.path.startsWith("/audit-overview") ||
                  item.path.startsWith("/regulatory") ||
                  item.path.startsWith("/risk-intelligence") ||
                  item.path.startsWith("/llm-analysis") ||
                  item.path.startsWith("/governance-principles") ||
                  item.path.startsWith("/agent-behaviour") ||
                  item.path.startsWith("/recommendations") ||
                  item.path.startsWith("/download-report");

                if (needsReportData) {
                  const stored = sessionStorage.getItem("lastReportData");
                  const reportData = stored ? JSON.parse(stored) : null;
                  navigate(item.path, reportData ? { state: { data: reportData } } : {});
                } else {
                  navigate(item.path);
                }
              };

              return (
                <div key={item.label}>
                  <div
                    className="sb-item"
                    onClick={handleClick}
                    title={locked ? "Register an AI Agent first to unlock this" : undefined}
                    style={{
                      display: "flex", alignItems: "center", gap: 9,
                      padding: "8px 9px", borderRadius: 8,
                      cursor: locked ? "not-allowed" : "pointer",
                      marginBottom: 1,
                      background: active ? "linear-gradient(135deg, #EEF4FF, #E8F0FD)" : "transparent",
                      color: locked ? "#C8D5E3" : active ? "#005EB8" : "#4B5E78",
                      opacity: locked ? 0.55 : 1,
                      transition: "all 0.15s ease",
                      userSelect: "none", position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      if (!locked) {
                        (e.currentTarget as HTMLDivElement).style.background = "#F5F8FC";
                        (e.currentTarget as HTMLDivElement).style.color = "#005EB8";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!locked) {
                        (e.currentTarget as HTMLDivElement).style.background =
                          active ? "linear-gradient(135deg, #EEF4FF, #E8F0FD)" : "transparent";
                        (e.currentTarget as HTMLDivElement).style.color =
                          active ? "#005EB8" : "#4B5E78";
                      }
                    }}
                  >
                    {active && !isAnchorItem && (
                      <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 3, borderRadius: 3, background: "#005EB8" }} />
                    )}
                    {(item as any).icon && (
                      <span style={{ opacity: locked ? 0.4 : active ? 1 : 0.6, flexShrink: 0, display: "flex" }}>
                        {(item as any).icon}
                      </span>
                    )}
                    <div className="sb-texts" style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: active ? 700 : 500, lineHeight: 1.3 }}>
                        {item.label}
                      </div>
                      {"subLabel" in item && (item as any).subLabel && (
                        <div style={{ fontSize: 11, color: locked ? "#C8D5E3" : active ? "#5B8DD9" : "#A0B4CC", marginTop: 1 }}>
                          {(item as any).subLabel}
                        </div>
                      )}
                    </div>
                    {locked ? (
                      <span style={{ color: "#C8D5E3", flexShrink: 0 }}><LockIcon /></span>
                    ) : active && !isAnchorItem ? (
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#005EB8", flexShrink: 0 }} />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Admin section */}
        {admin && (
          <div style={{ marginBottom: 2 }}>
            <div className="sb-texts" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.9px", textTransform: "uppercase", color: "#A0B4CC", padding: "8px 8px 3px" }}>
              Admin
            </div>
            {(() => {
              const active = isActive("/admin");
              return (
                <div
                  className="sb-item"
                  onClick={() => navigate("/admin")}
                  style={{
                    display: "flex", alignItems: "center", gap: 9, padding: "8px 9px",
                    borderRadius: 8, cursor: "pointer", marginBottom: 1,
                    background: active ? "#F3E8FF" : "transparent",
                    color: active ? "#7C3AED" : "#4B5E78",
                    transition: "all 0.15s ease", userSelect: "none", position: "relative",
                  }}
                  onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLDivElement).style.background = "#F5F8FC"; (e.currentTarget as HTMLDivElement).style.color = "#1A2236"; } }}
                  onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLDivElement).style.background = "transparent"; (e.currentTarget as HTMLDivElement).style.color = "#4B5E78"; } }}
                >
                  {active && <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 3, borderRadius: 3, background: "#7C3AED" }} />}
                  <span style={{ opacity: active ? 1 : 0.6, flexShrink: 0, display: "flex" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </span>
                  <div className="sb-texts" style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: active ? 700 : 500 }}>Admin Panel</div>
                    <div style={{ fontSize: 11, color: active ? "#9F67E8" : "#A0B4CC", marginTop: 1 }}>Users &amp; audits</div>
                  </div>
                  {active && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#7C3AED", flexShrink: 0 }} />}
                </div>
              );
            })()}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="sb-footer" style={{ padding: "10px 10px 12px", borderTop: "1px solid #E8EFF7" }}>
        {/* User row */}
        <div
          className="sb-user-row"
          onClick={() => navigate("/profile")}
          style={{
            display: "flex", alignItems: "center", gap: 9, padding: "8px 9px",
            borderRadius: 9, cursor: "pointer", marginBottom: 4,
            background: isActive("/profile") ? "linear-gradient(135deg,#EEF4FF,#E8F0FD)" : "transparent",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { if (!isActive("/profile")) (e.currentTarget as HTMLDivElement).style.background = "#F5F8FC"; }}
          onMouseLeave={e => { if (!isActive("/profile")) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: "linear-gradient(135deg, #00338D, #005EB8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px",
          }}>
            {initials}
          </div>
          <div className="sb-texts" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: isActive("/profile") ? "#005EB8" : "#0B1F33", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {displayName}
            </div>
            <div style={{ fontSize: 11, color: "#A0B4CC", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {authUser?.email || ""}
            </div>
          </div>
          {authUser?.role && (
            <div className="sb-texts" style={{
              fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, flexShrink: 0,
              background: authUser.role === "admin" ? "#F3E8FF" : "#EEF4FF",
              color: authUser.role === "admin" ? "#7C3AED" : "#005EB8",
              textTransform: "uppercase", letterSpacing: "0.4px",
            }}>
              {authUser.role}
            </div>
          )}
        </div>

        {/* Sign out */}
        <div
          onClick={handleLogout}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "7px 9px",
            borderRadius: 8, cursor: "pointer", color: "#94A3B8", fontSize: 13,
            fontWeight: 500, transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.background = "#FEF2F2";
            (e.currentTarget as HTMLDivElement).style.color = "#DC2626";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.background = "transparent";
            (e.currentTarget as HTMLDivElement).style.color = "#94A3B8";
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="sb-texts">Sign out</span>
        </div>
      </div>
    </div>
  );
}