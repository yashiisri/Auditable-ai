/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import AuditContextBar, { LensFooter } from "../components/AuditContextBar";
import { useLocation, useNavigate } from "react-router-dom";

const B = "#00338D", M = "#005EB8";
const FF = "'Plus Jakarta Sans', system-ui, sans-serif";

/* score → colour helpers — slate/grey for critical, NOT brown/red */
const sc  = (s: number) => s >= 75 ? "#059669" : s >= 50 ? "#2563EB" : "#64748B";
const scT = (s: number) => s >= 75 ? "#059669" : s >= 50 ? "#2563EB" : "#475569";
const sb  = (s: number) => s >= 75 ? "#F0FDF4" : s >= 50 ? "#EFF6FF" : "#F1F5F9";
const band = (s: number) => s >= 75 ? "Strong" : s >= 50 ? "Watch" : "Critical";
const fmt = (d: string) => { try { return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return d; } };

/* ── Narrative generator ────────────────────────────────────────────── */
function buildNarrative(r: any, highFindings: number, weakPrinciples: string[]) {
  const name  = r.ai_name || "This agent";
  const score = r.overall_score;
  const ok    = score >= 75 && highFindings === 0;

  const opening = ok
    ? `${name} meets enterprise governance standards with a score of ${score}/100 and no high-severity findings. The agent is cleared for production deployment.`
    : highFindings > 0
    ? `${name} returned a score of ${score}/100 with ${highFindings} high-severity finding${highFindings > 1 ? "s" : ""} that must be resolved before production. These represent active deployment blockers.`
    : `${name} scored ${score}/100, satisfying baseline requirements with identifiable gaps. No deployment blockers detected.`;

  const middle = weakPrinciples.length > 0
    ? `The weakest governance dimensions are ${weakPrinciples.slice(0, 3).join(", ")}${weakPrinciples.length > 3 ? ` and ${weakPrinciples.length - 3} others` : ""}. Targeted remediation in these areas will have the highest impact on the next audit cycle.`
    : `All governance dimensions are performing at acceptable levels, with consistent alignment across the KPMG Trusted AI Framework.`;

  const closing = ok
    ? `Recommended action: Approve for production. Schedule a re-assessment in 90 days to maintain compliance standing.`
    : score >= 60
    ? `Recommended action: Conditional approval — complete the Recommendations actions and re-audit within 30 days.`
    : `Recommended action: Hold deployment. Engage the AI governance team to implement a structured remediation plan.`;

  return { opening, middle, closing };
}

/* ── Inline progress arc ────────────────────────────────────────────── */
function Arc({ score, size = 100 }: { score: number; size?: number }) {
  const cx = size / 2, cy = size / 2, r = size * 0.36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = sc(score);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth={size * 0.08}/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={size * 0.08}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: "stroke-dasharray 1.2s ease" }}/>
      <text x={cx} y={cy + 5} textAnchor="middle" fill="#0F172A" fontSize={size * 0.21} fontWeight="900" fontFamily={FF}>{score}</text>
    </svg>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}body{background:#F8FAFC;}
.es-card{background:#fff;border-radius:14px;border:1px solid #E2E8F0;box-shadow:0 1px 2px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.04);}
.es-bar{height:4px;background:#F1F5F9;border-radius:99px;overflow:hidden;}
.es-bar-fill{height:100%;border-radius:99px;transition:width 1s ease;}
.es-lens{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:9px;cursor:pointer;transition:background 0.12s;font-size:13px;font-weight:500;color:#374151;}
.es-lens:hover{background:#F1F5F9;}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.es-in{animation:fadeUp 0.35s cubic-bezier(.22,1,.36,1) both;}
`;

export default function ExecutiveSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const raw = location.state?.data || (() => { try { const s = sessionStorage.getItem("lastReportData"); return s ? JSON.parse(s) : null; } catch { return null; } })();
  const [, setAnim] = useState(false);
  useEffect(() => { setTimeout(() => setAnim(true), 60); }, []);

  if (!raw) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 14, fontFamily: FF, background: "#F8FAFC" }}>
      <div style={{ fontSize: 15, color: "#64748B" }}>No audit data. Run a governance evaluation first.</div>
      <button onClick={() => navigate("/dashboard")} style={{ padding: "10px 24px", background: M, border: "none", borderRadius: 10, color: "white", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>← Go to Audit Pipeline</button>
    </div>
  );

  const r = raw;
  const prn          = r.trusted_ai_principles || {};
  const pkeys        = Object.keys(prn);
  const avgPrn       = pkeys.length ? Math.round(pkeys.reduce((s: number, k: string) => s + prn[k].score, 0) / pkeys.length) : 0;
  const highF        = (r.findings || []).filter((f: any) => f.severity === "High").length;
  const medF         = (r.findings || []).filter((f: any) => f.severity === "Medium").length;
  const lowF         = (r.findings || []).filter((f: any) => f.severity === "Low").length;
  const weakPrn      = pkeys.filter(k => prn[k].score < 60);
  const deployReady  = r.overall_score >= 75 && highF === 0;
  const narrative    = buildNarrative(r, highF, weakPrn);

  const LENS_LINKS = [
    { label: "Data Quality",         path: "/agent-behaviour",       desc: "Dataset completeness, schema confidence, NLP metrics" },
    { label: "LLM Analysis",         path: "/llm-analysis",          desc: "Accuracy probe results and safety scoring"            },
    { label: "Governance Principles",path: "/governance-principles", desc: "10-dimension KPMG Trusted AI assessment"              },
    { label: "Regulatory Alignment", path: "/regulatory-alignment",  desc: "EU AI Act, ISO 42001, NIST framework compliance"     },
    { label: "Risk & Actions",       path: "/risk-intelligence",     desc: "Severity breakdown and remediation actions"          },
  ];
  const nav = (path: string) => navigate(path, { state: { data: r } });

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: FF, color: "#0F172A" }}>
      <style>{CSS}</style>
      <AuditContextBar data={r} />

      {/* ── Page title bar (no score here — already in navbar) ───── */}
      <div style={{ background: `linear-gradient(135deg, ${B}, ${M})`, padding: "18px 40px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "22px 22px", pointerEvents: "none" }}/>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 3 }}>Audit Report · Executive Summary</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.3px" }}>{r.ai_name}</div>
          <div style={{ display: "flex", gap: 14, marginTop: 4, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
            <span>{r.model_label || r.model_type || "AI Model"}</span>
            {r.evaluated_at && <><span>·</span><span>{fmt(r.evaluated_at)}</span></>}
            {r.report_id && <><span>·</span><span style={{ fontFamily: "monospace" }}>#{r.report_id.slice(0, 10)}</span></>}
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 40px 0" }}>

        {/* ── VERDICT NARRATIVE — score shown ONCE here in big type ── */}
        <div className="es-card es-in" style={{ padding: "24px 28px", marginBottom: 20, display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "start" }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Audit Verdict</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: "#0F172A", marginBottom: 16, letterSpacing: "-0.3px" }}>
              {deployReady ? "Approved for Deployment" : r.overall_score >= 60 ? "Conditional — Remediation Required" : "Hold — Significant Gaps Identified"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[narrative.opening, narrative.middle, narrative.closing].map((text, i) => (
                <p key={i} style={{
                  margin: 0, fontSize: 13.5, lineHeight: 1.8,
                  color: i === 2 ? "#0F172A" : "#475569",
                  fontWeight: i === 2 ? 600 : 400,
                  paddingTop: i > 0 ? 10 : 0,
                  borderTop: i > 0 ? "1px solid #F1F5F9" : "none",
                }}>
                  {text}
                </p>
              ))}
            </div>
          </div>

          {/* Score arc — the ONE place the overall number appears on this page */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <Arc score={r.overall_score} size={96} />
            <div style={{ fontSize: 11, fontWeight: 700, color: scT(r.overall_score), textTransform: "uppercase", letterSpacing: "0.5px" }}>{band(r.overall_score)}</div>
            <div style={{ padding: "3px 10px", borderRadius: 20, background: sb(r.overall_score), fontSize: 10.5, fontWeight: 600, color: scT(r.overall_score) }}>
              {deployReady ? "Deploy ready" : "Needs work"}
            </div>
          </div>
        </div>

        {/* ── TWO-COLUMN BODY ──────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 252px", gap: 20, alignItems: "start" }}>

          {/* LEFT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Data metrics — NOT the overall score again, just supporting metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {[
                { label: "Data Quality",  val: `${r.data_quality_score}%`, sub: `${r.logs_evaluated || 0} records`,      color: sc(r.data_quality_score) },
                { label: "Avg Principle", val: `${avgPrn}/100`,            sub: `${pkeys.length} dimensions`,             color: sc(avgPrn) },
                { label: "Findings",      val: `${(r.findings||[]).length}`, sub: `${highF} critical · ${medF} watch`,    color: highF > 0 ? "#64748B" : medF > 0 ? "#D97706" : "#059669" },
              ].map((k, i) => (
                <div key={i} className="es-card" style={{ padding: "16px 18px", borderTop: `3px solid ${k.color}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 7 }}>{k.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: k.color, lineHeight: 1, marginBottom: 4 }}>{k.val}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Findings */}
            <div className="es-card" style={{ padding: "20px 24px" }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0F172A", marginBottom: 14 }}>Findings Breakdown</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: highF + medF > 0 ? 16 : 0 }}>
                {[
                  { sev: "High",   count: highF, color: "#64748B", bg: "#F1F5F9" },
                  { sev: "Medium", count: medF,  color: "#D97706", bg: "#FFF7ED" },
                  { sev: "Low",    count: lowF,  color: "#059669", bg: "#F0FDF4" },
                ].map(s => (
                  <div key={s.sev} style={{ padding: "12px", borderRadius: 10, background: s.bg, textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.count}</div>
                    <div style={{ fontSize: 10.5, color: s.color, fontWeight: 700, marginTop: 3 }}>{s.sev}</div>
                  </div>
                ))}
              </div>
              {/* Top findings — only High + Medium, capped at 4 */}
              {(r.findings || []).filter((f: any) => f.severity === "High" || f.severity === "Medium").slice(0, 4).map((f: any, i: number) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 9, background: "#F8FAFC", border: "1px solid #E2E8F0", marginBottom: 6, alignItems: "flex-start" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, marginTop: 5, background: f.severity === "High" ? "#64748B" : "#D97706" }} />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0F172A", marginBottom: 1 }}>{f.category || f.probe}</div>
                    <div style={{ fontSize: 11.5, color: "#64748B", lineHeight: 1.5 }}>{(f.issue || f.recommendation || "").slice(0, 120)}{(f.issue||"").length > 120 ? "…" : ""}</div>
                  </div>
                </div>
              ))}
              {(r.findings||[]).length > 4 && (
                <div style={{ fontSize: 12, color: M, fontWeight: 600, cursor: "pointer", marginTop: 4 }} onClick={() => nav("/risk-intelligence")}>
                  View all {(r.findings||[]).length} findings →
                </div>
              )}
            </div>

            {/* Principle bars — sorted weakest first */}
            {pkeys.length > 0 && (
              <div className="es-card" style={{ padding: "20px 24px" }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0F172A", marginBottom: 14 }}>Governance Dimensions</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[...pkeys].sort((a, b) => prn[a].score - prn[b].score).map(k => {
                    const s = prn[k].score;
                    return (
                      <div key={k} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: "#374151", minWidth: 128, flexShrink: 0 }}>{k}</div>
                        <div className="es-bar" style={{ flex: 1 }}>
                          <div className="es-bar-fill" style={{ width: `${s}%`, background: sc(s) }}/>
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: 800, color: sc(s), minWidth: 28, textAlign: "right" }}>{s}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: sb(s), color: sc(s), minWidth: 52, textAlign: "center" }}>{band(s)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Framework compliance */}
            {Object.keys(r.framework_compliance || {}).length > 0 && (
              <div className="es-card" style={{ padding: "20px 24px", marginBottom: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0F172A", marginBottom: 14 }}>Framework Compliance</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {Object.entries(r.framework_compliance || {}).map(([key, status]: any) => {
                    const labels: Record<string, string> = { EU_AI_Act: "EU AI Act", ISO_42001: "ISO 42001", NIST_AI_RMF: "NIST AI RMF", KPMG_TAF: "KPMG Trusted AI" };
                    const comp    = ["Compliant","Aligned","Good","Certified"].some(x => status?.includes(x));
                    const partial = ["Conditional","Partial","Assessed"].some(x => status?.includes(x));
                    const fc = comp ? "#059669" : partial ? "#2563EB" : "#64748B";
                    const fbg = comp ? "#F0FDF4" : partial ? "#EFF6FF" : "#F1F5F9";
                    return (
                      <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{labels[key] || key}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: fbg, color: fc }}>{comp ? "Aligned" : partial ? "Partial" : "Limited"}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — navigation only, no score repetition */}
          <div style={{ position: "sticky", top: 70 }}>
            <div className="es-card" style={{ padding: "16px 14px", marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>Audit Sections</div>
              {LENS_LINKS.map((l, i) => (
                <div key={i} className="es-lens" onClick={() => nav(l.path)}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0F172A", marginBottom: 1 }}>{l.label}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.4 }}>{l.desc}</div>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 6 15 12 9 18"/>
                  </svg>
                </div>
              ))}
            </div>

            {/* Audit metadata only — no score */}
            <div className="es-card" style={{ padding: "16px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>Audit Info</div>
              {[
                { l: "Model",       v: (r.model_label || r.model_type || "—").replace(/_/g, " ") },
                { l: "Evaluated",   v: r.evaluated_at ? fmt(r.evaluated_at).split(",")[0] : "—" },
                { l: "Logs",        v: `${r.logs_evaluated || 0}` },
                { l: "Report ID",   v: r.report_id ? `#${r.report_id.slice(0, 10)}` : "—" },
                { l: "Dimensions",  v: `${pkeys.length}` },
              ].map(({ l, v }) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 12, padding: "6px 0", borderBottom: "1px solid #F8FAFC" }}>
                  <span style={{ color: "#94A3B8", fontWeight: 500 }}>{l}</span>
                  <span style={{ color: "#334155", fontWeight: 600, textAlign: "right", maxWidth: "55%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── BOTTOM NAV ───────────────────────────────────────────────── */}
      <div style={{ marginTop: 40 }}>
        <LensFooter data={r} />
      </div>
    </div>
  );
}