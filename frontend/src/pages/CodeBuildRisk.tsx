/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import AuditContextBar, { LensFooter } from "../components/AuditContextBar";
import { useLocation, useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const M = "#005EB8", B = "#00338D";
const FF = "'Plus Jakarta Sans', system-ui, sans-serif";

/* Same banding language as the other tabs */
const sc   = (s: number) => s >= 75 ? "#059669" : s >= 50 ? "#2563EB" : "#64748B";
const sbg  = (s: number) => s >= 75 ? "#F0FDF4" : s >= 50 ? "#EFF6FF" : "#F1F5F9";
const band = (s: number) => s >= 75 ? "Strong"  : s >= 50 ? "Watch"   : "Weak";

const CONF_COLOR: Record<string, string> = { high: "#059669", medium: "#D97706", low: "#DC2626", none: "#94A3B8" };
const CONF_TIP: Record<string, string> = {
  high:   "Strong evidence — the check ran cleanly across multiple probes with consistent results.",
  medium: "Reasonable evidence — the result is likely accurate but based on fewer or partially conclusive probes.",
  low:    "Weak evidence — treat this result as a starting point, not a final verdict. Worth a manual look.",
  none:   "No usable evidence was collected for this check.",
};
const TIER_LABEL: Record<string, string> = {
  llm_judged: "Judged by AI panel",
  regex:      "Pattern scan",
  structural: "Structural check",
};
const TIER_TIP: Record<string, string> = {
  llm_judged: "An AI panel reviewed the system's actual responses and judged whether they met the bar for this check.",
  regex:      "Responses were scanned for known unsafe patterns (e.g. exposed keys, stack traces) using pattern matching.",
  structural: "Inferred from how the system is set up and configured, rather than from individual responses.",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}body{background:#F8FAFC;}
.cbr-card{background:#fff;border-radius: 0px;border:1px solid #E2E8F0;box-shadow:0 1px 3px rgba(0,0,0,0.05),0 4px 12px rgba(0,0,0,0.04);}
@keyframes cbrIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.cbr-in{animation:cbrIn 0.32s cubic-bezier(.22,1,.36,1) both;}
`;

/* ── Small "i" info tooltip — hover to see an explanation ──────────────── */
function InfoTooltip({ text, width = 210 }: { text: string; width?: number }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", verticalAlign: "middle", marginLeft: 5, cursor: "help" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
      {show && (
        <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
          background: "#0F172A", color: "white", fontSize: 11.5, lineHeight: 1.5, padding: "8px 12px", borderRadius: 0,
          width, pointerEvents: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.25)", zIndex: 200, whiteSpace: "normal" }}>
          {text}
          <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", borderWidth: 5, borderStyle: "solid", borderColor: "#0F172A transparent transparent transparent" }}/>
        </div>
      )}
    </span>
  );
}

/* ── Status dot — quick visual read without expanding the card ─────────── */
function StatusDot({ score, unavailable }: { score: number; unavailable: boolean }) {
  const color = unavailable ? "#CBD5E1" : sc(score);
  return (
    <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: unavailable ? "#F1F5F9" : sbg(score), border: `1.5px solid ${color}` }}>
      {unavailable ? (
        <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 700 }}>–</span>
      ) : score >= 75 ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      ) : score >= 50 ? (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16.5" x2="12.01" y2="16.5"/></svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      )}
    </div>
  );
}

/* ── Expandable check card ─────────────────────────────────────────────── */
function CheckCard({ c }: { c: any }) {
  const [open, setOpen] = useState(false);
  const unavailable = c.status !== "evaluated";
  const color = unavailable ? "#94A3B8" : sc(c.score);

  return (
    <div className="cbr-card" style={{ padding: "15px 18px", marginBottom: 10 }}>
      <div
        onClick={() => !unavailable && setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 14, cursor: unavailable ? "default" : "pointer" }}
      >
        <StatusDot score={c.score} unavailable={unavailable} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.2px" }}>{c.title}</div>
          <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 4, lineHeight: 1.5 }}>{c.summary}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {unavailable ? (
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", background: "#F1F5F9", padding: "4px 11px", borderRadius: 0 }}>Not evaluated</span>
          ) : (
            <span style={{ fontSize: 11.5, fontWeight: 800, color, background: sbg(c.score), padding: "4px 11px", borderRadius: 0 }}>{band(c.score)} · {c.score}</span>
          )}
          {!unavailable && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.18s" }}>
              <polyline points="9 6 15 12 9 18" />
            </svg>
          )}
        </div>
      </div>

      {open && !unavailable && (
        <div style={{ borderTop: "1px solid #EEF2F7", marginTop: 13, paddingTop: 13, display: "grid", gap: 11, paddingLeft: 40 }}>
          {[
            { k: "How we tested", v: c.how, col: "#64748B" },
            { k: "Why it matters", v: c.why, col: "#64748B" },
            { k: "A good result",  v: c.good, col: "#059669" },
          ].map((row, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 12, alignItems: "start" }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: row.col, textTransform: "uppercase" as const, letterSpacing: "0.4px" }}>{row.k}</div>
              <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.55 }}>{row.v}</div>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 3 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: "#475569", background: "#F1F5F9", padding: "3px 9px", borderRadius: 0, display: "inline-flex", alignItems: "center" }}>
              {TIER_LABEL[c.evidence_tier] || c.evidence_tier}
              <InfoTooltip text={TIER_TIP[c.evidence_tier] || "How this check's evidence was gathered."} />
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: "#475569", background: "#F1F5F9", padding: "3px 9px", borderRadius: 0 }}>
              {c.probes_run} probes run
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: CONF_COLOR[c.confidence], background: "#F8FAFC", padding: "3px 9px", borderRadius: 0, border: `1px solid ${CONF_COLOR[c.confidence]}22`, display: "inline-flex", alignItems: "center" }}>
              Confidence: {c.confidence}
              <InfoTooltip text={CONF_TIP[c.confidence] || "How reliable this result is."} />
            </span>
            <span style={{ fontSize: 10.5, color: "#94A3B8" }}>→ becomes {c.future_tier} in production</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CodeBuildRisk() {
  const location = useLocation();
  const navigate = useNavigate();
  const raw = location.state?.data || (() => { try { const s = sessionStorage.getItem("lastReportData"); return s ? JSON.parse(s) : null; } catch { return null; } })();
  const [, setAnim] = useState(false);
  useEffect(() => { setTimeout(() => setAnim(true), 100); }, []);

  if (!raw) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: FF }}>
      <button onClick={() => navigate("/dashboard")} style={{ padding: "10px 24px", background: M, border: "none", borderRadius: 0, color: "white", fontWeight: 700, cursor: "pointer" }}>← Back</button>
    </div>
  );

  const cbr = raw.code_build_risk;

  /* Not applicable / not present — graceful state */
  if (!cbr || !cbr.applicable) return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: FF, color: "#0F172A" }}>
      <style>{CSS}</style>
      <AuditContextBar data={raw} />
      <div style={{ padding: "24px 40px" }}>
        <div className="cbr-card" style={{ padding: "40px", textAlign: "center", maxWidth: 640, margin: "40px auto" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>Build Vulnerabilities not applicable</div>
          <div style={{ fontSize: 13.5, color: "#64748B", lineHeight: 1.65 }}>
            This system wasn't registered as built with AI code-generation tools, so vulnerability checks weren't run.
            You can enable them by setting the "built with AI tools" option when registering the agent.
          </div>
        </div>
        <LensFooter data={raw} currentPath="/code-build-risk" />
      </div>
    </div>
  );

  const checks: any[] = cbr.checks || [];
  const overall = cbr.overall_score;

  /* Group checks by their `group` field, preserving order */
  const groups: { name: string; items: any[] }[] = [];
  for (const c of checks) {
    let g = groups.find(x => x.name === c.group);
    if (!g) { g = { name: c.group, items: [] }; groups.push(g); }
    g.items.push(c);
  }

  const evaluated = checks.filter(c => c.status === "evaluated");
  const chartData = evaluated.map(c => ({ name: c.title, score: c.score }));
  const strong = evaluated.filter(c => c.score >= 75).length;
  const watch  = evaluated.filter(c => c.score >= 50 && c.score < 75).length;
  const weak   = evaluated.filter(c => c.score < 50).length;

  // Weakest checks — used to make the verdict specific instead of generic
  const weakest = [...evaluated].sort((a, b) => a.score - b.score).slice(0, 2).map(c => c.title);

  const verdict = overall == null
    ? { headline: "Not enough evidence to score this build.", detail: "Run more probes or check back once the agent has more traffic to evaluate against.", color: "#94A3B8", bg: "#F1F5F9", icon: "–" }
    : overall >= 75
    ? { headline: "No significant vulnerabilities found.", detail: `${strong} of ${evaluated.length} checks came back clean${watch > 0 ? `, ${watch} worth a light look` : ""}.`, color: "#059669", bg: "#F0FDF4", icon: "✓" }
    : overall >= 50
    ? { headline: `${watch + weak} of ${evaluated.length} checks need attention.`, detail: weakest.length ? `Most urgent: ${weakest.join(" and ")}.` : "Review the flagged checks below.", color: "#D97706", bg: "#FFFBEB", icon: "!" }
    : { headline: `${weak} vulnerabilit${weak === 1 ? "y" : "ies"} found in how this app was built.`, detail: weakest.length ? `Start with ${weakest.join(" and ")} — these are the most exposed.` : "Review the flagged checks below.", color: "#DC2626", bg: "#FEF2F2", icon: "✗" };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: FF, color: "#0F172A" }}>
      <style>{CSS}</style>
      <AuditContextBar data={raw} />

      <div style={{ padding: "24px 40px 60px", maxWidth: 1080, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div className="cbr-in" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.5px" }}>Build Vulnerabilities</div>
            <InfoTooltip
              width={260}
              text="Checks the assembled application — the code and integration layer around the AI model — for common pitfalls seen in AI-generated apps: exposed secrets, missing auth, unvalidated input, and similar. Assessed entirely by probing the live system's responses; no source code access is used."
            />
          </div>
          <div style={{ fontSize: 13.5, color: "#64748B", marginTop: 4, maxWidth: 560, lineHeight: 1.55 }}>
            How carefully the app around the AI was built — measured only by talking to it, no source code needed.
          </div>
        </div>

        {/* ── Verdict summary ── */}
        <div className="cbr-card cbr-in" style={{ padding: "20px 24px", marginBottom: 18, background: verdict.bg, border: `1px solid ${verdict.color}30` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" as const }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: verdict.color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 19, fontWeight: 900, flexShrink: 0 }}>
              {verdict.icon}
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 15.5, fontWeight: 800, color: verdict.color, marginBottom: 3 }}>{verdict.headline}</div>
              <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.6 }}>{verdict.detail}</div>
            </div>
            {overall != null && (
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  Build score
                  <InfoTooltip text="A composite of every check below, weighted by how severe a failure would be. Shown for awareness only — see the banner below." />
                </div>
                <div style={{ fontSize: 34, fontWeight: 900, color: sc(overall), lineHeight: 1.05 }}>{overall}</div>
                <span style={{ fontSize: 11, fontWeight: 800, color: sc(overall), background: "white", padding: "3px 12px", borderRadius: 0 }}>{band(overall)}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Display-only banner ── */}
        <div className="cbr-in" style={{ display: "flex", gap: 10, alignItems: "center", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 0, padding: "11px 14px", marginBottom: 18 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={M} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
          </svg>
          <span style={{ fontSize: 12.5, color: "#1E40AF", lineHeight: 1.5 }}>
            Shown for awareness only. This score is referenced under Security and Reliability but does <strong>not</strong> change the overall governance score.
          </span>
        </div>

        {/* ── Context strip ── */}
        <div className="cbr-in" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Built with",                    val: cbr.context?.built_with,        danger: false,
              tip: "What tools or process were used to generate/assemble this application, as declared at registration." },
            { label: "Human reviewed before launch",   val: cbr.context?.human_review_gate, danger: /no|unknown/i.test(cbr.context?.human_review_gate || ""),
              tip: "Whether a person reviewed the AI-generated code before it went live. \"No\" or \"Unknown\" raises the risk of unnoticed issues shipping to production." },
            { label: "Matches what it claims",         val: cbr.context?.reconciliation,    danger: /conflict/i.test(cbr.context?.reconciliation || ""),
              tip: "Whether what the system does in practice lines up with what was declared at registration. A conflict here means the checks below may be under- or over-estimating real risk." },
          ].map((s, i) => (
            <div key={i} className="cbr-card" style={{ padding: "13px 15px" }}>
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, display: "flex", alignItems: "center" }}>
                {s.label}
                <InfoTooltip text={s.tip} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 3, color: s.danger ? "#DC2626" : "#0F172A" }}>{s.val || "—"}</div>
            </div>
          ))}
        </div>

        {/* ── Overview: bar chart + tally ── */}
        {evaluated.length > 0 && (
          <div className="cbr-card cbr-in" style={{ padding: "20px 22px", marginBottom: 22 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0F172A", marginBottom: 2, display: "flex", alignItems: "center" }}>
              Check overview
              <InfoTooltip text="Every build-quality check that returned a result, side by side. Green (75+) is strong, amber (50–74) is worth a look, red (below 50) is a vulnerability worth fixing." />
            </div>
            <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 14 }}>Score per build-quality check (higher is better)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 150px", gap: 20, alignItems: "center" }}>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10.5, fill: "#475569" }} />
                    <Tooltip cursor={{ fill: "#F8FAFC" }} contentStyle={{ borderRadius: 0, border: "1px solid #E2E8F0", fontSize: 12 }} />
                    <Bar dataKey="score" radius={[0, 5, 5, 0]} barSize={16}>
                      {chartData.map((d, i) => <Cell key={i} fill={sc(d.score)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  { label: "Strong", n: strong, col: "#059669", tip: "Scored 75 or above — no action needed." },
                  { label: "Watch",  n: watch,  col: "#D97706", tip: "Scored 50–74 — worth a look, not urgent." },
                  { label: "Weak",   n: weak,   col: "#DC2626", tip: "Scored below 50 — a vulnerability worth fixing." },
                ].map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 0, background: sbg(t.label === "Strong" ? 80 : t.label === "Watch" ? 60 : 30) }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: t.col, display: "flex", alignItems: "center" }}>
                      {t.label}
                      <InfoTooltip text={t.tip} width={170} />
                    </span>
                    <span style={{ fontSize: 18, fontWeight: 900, color: t.col }}>{t.n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Grouped check cards ── */}
        {groups.map((g, gi) => {
          const gEval = g.items.filter(c => c.status === "evaluated");
          const gAvg  = gEval.length ? Math.round(gEval.reduce((s, c) => s + c.score, 0) / gEval.length) : null;
          return (
            <div key={gi} className="cbr-in" style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "6px 0 10px" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#64748B", textTransform: "uppercase" as const, letterSpacing: "0.7px" }}>
                  {g.name} <span style={{ fontWeight: 600, textTransform: "none" as const, letterSpacing: 0 }}>· {g.items.length} check{g.items.length !== 1 ? "s" : ""}</span>
                </div>
                {gAvg != null && (
                  <span style={{ fontSize: 11, fontWeight: 800, color: sc(gAvg), background: sbg(gAvg), padding: "3px 10px", borderRadius: 0 }}>Avg {gAvg}</span>
                )}
              </div>
              {g.items.map((c, ci) => <CheckCard key={ci} c={c} />)}
            </div>
          );
        })}

        {/* ── Guardrail footnote ── */}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 20, paddingTop: 14, borderTop: "1px solid #E2E8F0" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span style={{ fontSize: 11.5, color: "#94A3B8", lineHeight: 1.55 }}>
            Every test here uses the same authorization, rate, and scope limits as the rest of the audit — nothing new or riskier is done to the system.
          </span>
        </div>

        <LensFooter data={raw} currentPath="/code-build-risk" />
      </div>
    </div>
  );
}