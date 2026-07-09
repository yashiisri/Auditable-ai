/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * RerunComparison.tsx
 * ====================
 * Dedicated view for re-run audit results showing:
 *  1. Score delta banner (prior vs current)
 *  2. Principle-by-principle movement table with trend arrows
 *  3. Finding classifier output (resolved / persisting / new)
 *  4. Continuous monitoring timeline chart (recharts LineChart)
 *  5. Fingerprint dimension changes
 *
 * Props:
 *   rerunData  — the full response from /blackbox/rerun
 *   auditHistory — array of all audits for this AI (oldest→newest)
 *                  each item: { audit_id, overall_score, completed_at, rerun_sequence? }
 *   onClose    — callback to close/dismiss this panel
 */

import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend, Area, AreaChart,
} from "recharts";

// ── Palette (matches TrustShield blues) ──────────────────────────────────────
const B  = "#00338D";
const M  = "#005EB8";
const L  = "#0091DA";

const GREEN  = "#059669";
const RED    = "#DC2626";
const AMBER  = "#D97706";
const PURPLE = "#7C3AED";

// ── Types ─────────────────────────────────────────────────────────────────────
interface PrincipleDelta {
  principle: string;
  prior_score: number;
  current_score: number | null;
  score_change: number | null;
  movement_label?: string;
  not_reprobed?: boolean;
}

interface Finding {
  category: string;
  severity: string;
  issue?: string;
  note?: string;
  finding_id?: string;
  status?: "new" | "persisting" | "resolved";
}

interface DeltaSummary {
  overall_score_change: number;
  resolved_count: number;
  regressed_count: number;
  improving_count: number;
  worsening_count: number;
  unchanged_count: number;
  new_finding_count: number;
  principles_improved: string[];
  principles_regressed: string[];
}

interface RerunData {
  audit_id: string;
  parent_audit_id: string;
  ai_name: string;
  overall_score: number;
  risk_level: string;
  rerun_scope: string;
  rerun_sequence: number;
  operator_change_context?: string;
  principle_deltas?: PrincipleDelta[];
  delta_summary?: DeltaSummary;
  resolved_findings?: Finding[];
  persisting_findings?: Finding[];
  new_findings?: Finding[];
  phase1_delta?: {
    conflict_count_prior: number;
    conflict_count_current: number;
    conflict_count_change: number;
    domain_prior: string;
    domain_current: string;
    domain_changed: boolean;
    per_dimension_changes: { dimension: string; prior_status: string; current_status: string }[];
  };
  started_at: string;
  completed_at: string;
}

interface AuditHistoryPoint {
  audit_id: string;
  overall_score: number;
  completed_at: string;
  rerun_sequence?: number;
  risk_level?: string;
}

interface Props {
  rerunData: RerunData;
  auditHistory?: AuditHistoryPoint[];
  priorScore?: number;   // prior overall score if not in auditHistory
  onClose?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function movementColor(label?: string): string {
  switch (label) {
    case "RESOLVED":  return GREEN;
    case "IMPROVING": return "#10B981";
    case "REGRESSED": return RED;
    case "WORSENING": return "#F87171";
    case "UNCHANGED": return "#94A3B8";
    default:          return "#94A3B8";
  }
}

function movementIcon(label?: string): string {
  switch (label) {
    case "RESOLVED":  return "✓✓";
    case "IMPROVING": return "↑";
    case "REGRESSED": return "↓↓";
    case "WORSENING": return "↓";
    case "UNCHANGED": return "→";
    default:          return "—";
  }
}

function scoreColor(score: number): string {
  if (score >= 75) return GREEN;
  if (score >= 50) return M;
  return RED;
}

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
  } catch { return iso; }
}

function fmtFull(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

function ScoreDeltaBanner({ rerunData, priorScore }: { rerunData: RerunData; priorScore?: number }) {
  const ds      = rerunData.delta_summary;
  const current = rerunData.overall_score;
  // Derive prior score: explicit prop > back-calc from delta > 0
  const prior   = (priorScore != null && priorScore > 0)
    ? priorScore
    : ds
      ? Math.round(current - ds.overall_score_change)
      : 0;
  const delta    = ds?.overall_score_change ?? (current - prior);
  const positive = delta >= 0;

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 0,
      background: "white", borderRadius: 16, border: "1px solid #E2E8F0",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden", marginBottom: 20,
    }}>
      {/* Prior */}
      <div style={{ padding: "28px 32px", textAlign: "center", background: "#F8FAFC" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#94A3B8", marginBottom: 10 }}>
          Baseline Audit
        </div>
        <div style={{ fontSize: 52, fontWeight: 900, color: scoreColor(prior), lineHeight: 1, marginBottom: 6 }}>{prior}</div>
        <div style={{ fontSize: 12, color: "#64748B" }}>/ 100</div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 8, fontFamily: "monospace" }}>
          {rerunData.parent_audit_id?.slice(0, 12)}…
        </div>
      </div>

      {/* Delta */}
      <div style={{
        padding: "28px 24px", textAlign: "center", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", minWidth: 120,
        background: positive ? "#F0FDF4" : "#FEF2F2",
        borderLeft: `1px solid ${positive ? "#BBF7D0" : "#FECACA"}`,
        borderRight: `1px solid ${positive ? "#BBF7D0" : "#FECACA"}`,
      }}>
        <div style={{ fontSize: 36, marginBottom: 6 }}>{positive ? "📈" : "📉"}</div>
        <div style={{
          fontSize: 28, fontWeight: 900, lineHeight: 1,
          color: positive ? GREEN : RED,
        }}>
          {positive ? "+" : ""}{delta.toFixed(1)}
        </div>
        <div style={{ fontSize: 11, color: positive ? GREEN : RED, marginTop: 4, fontWeight: 700 }}>
          {positive ? "IMPROVED" : "REGRESSED"}
        </div>
        <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 8 }}>
          Run #{rerunData.rerun_sequence ?? "—"}
        </div>
      </div>

      {/* Current */}
      <div style={{ padding: "28px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#94A3B8", marginBottom: 10 }}>
          This Re-run
        </div>
        <div style={{ fontSize: 52, fontWeight: 900, color: scoreColor(current), lineHeight: 1, marginBottom: 6 }}>{current}</div>
        <div style={{ fontSize: 12, color: "#64748B" }}>/ 100 · <span style={{ color: scoreColor(current) }}>{rerunData.risk_level} Risk</span></div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 8 }}>
          {fmtFull(rerunData.completed_at)}
        </div>
      </div>
    </div>
  );
}


function DeltaSummaryBar({ ds }: { ds: DeltaSummary }) {
  const pills = [
    { label: "Resolved",  val: ds.resolved_count,  color: GREEN,  bg: "#F0FDF4" },
    { label: "Improving", val: ds.improving_count,  color: "#10B981", bg: "#ECFDF5" },
    { label: "Unchanged", val: ds.unchanged_count,  color: "#94A3B8", bg: "#F8FAFC" },
    { label: "Worsening", val: ds.worsening_count,  color: AMBER,  bg: "#FFFBEB" },
    { label: "Regressed", val: ds.regressed_count,  color: RED,    bg: "#FEF2F2" },
    { label: "New Findings", val: ds.new_finding_count, color: PURPLE, bg: "#F5F3FF" },
  ];

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20,
      padding: "16px 20px", background: "white", borderRadius: 14,
      border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      {pills.map(p => (
        <div key={p.label} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px", borderRadius: 10,
          background: p.bg, border: `1px solid ${p.color}22`,
        }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: p.color, lineHeight: 1 }}>{p.val}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: p.color }}>{p.label}</span>
        </div>
      ))}
    </div>
  );
}


function PrincipleDeltaTable({ deltas }: { deltas: PrincipleDelta[] }) {
  return (
    <div style={{
      background: "white", borderRadius: 14, border: "1px solid #E2E8F0",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden", marginBottom: 20,
    }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>Principle Score Movement</div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Per-principle comparison between baseline and this re-run</div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              {["Principle", "Baseline", "Now", "Change", "Status"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: h === "Principle" ? "left" : "center", fontWeight: 700, color: "#64748B", fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deltas.map((d, i) => {
              const change = d.score_change ?? 0;
              const color  = movementColor(d.movement_label);
              return (
                <tr key={i} style={{ borderBottom: "1px solid #F1F5F9", background: i % 2 === 0 ? "white" : "#FAFAFA" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1E293B" }}>{d.principle}</td>
                  <td style={{ padding: "12px 16px", textAlign: "center", color: d.prior_score >= 70 ? GREEN : d.prior_score >= 50 ? M : RED, fontWeight: 700 }}>{d.prior_score}</td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    {d.not_reprobed
                      ? <span style={{ color: "#94A3B8", fontSize: 11 }}>Not re-probed</span>
                      : <span style={{ color: d.current_score! >= 70 ? GREEN : d.current_score! >= 50 ? M : RED, fontWeight: 700 }}>{d.current_score}</span>
                    }
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700, color: change > 0 ? GREEN : change < 0 ? RED : "#94A3B8" }}>
                    {d.not_reprobed ? "—" : `${change > 0 ? "+" : ""}${change}`}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "3px 10px", borderRadius: 20,
                      background: `${color}18`, color, fontSize: 11, fontWeight: 700,
                    }}>
                      {movementIcon(d.movement_label)} {d.not_reprobed ? "SKIPPED" : d.movement_label ?? "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function FindingsPanel({ resolved, persisting, newFindings }: {
  resolved: Finding[];
  persisting: Finding[];
  newFindings: Finding[];
}) {
  const [tab, setTab] = useState<"new" | "persisting" | "resolved">("new");

  const tabs = [
    { id: "new",        label: "New",        count: newFindings.length,   color: PURPLE },
    { id: "persisting", label: "Persisting", count: persisting.length,    color: AMBER  },
    { id: "resolved",   label: "Resolved",   count: resolved.length,      color: GREEN  },
  ] as const;

  const active = tab === "new" ? newFindings : tab === "persisting" ? persisting : resolved;

  return (
    <div style={{
      background: "white", borderRadius: 14, border: "1px solid #E2E8F0",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden", marginBottom: 20,
    }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>Finding Tracker</div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Classified against baseline findings</div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #F1F5F9" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: "12px 8px", border: "none", cursor: "pointer",
              background: tab === t.id ? `${t.color}0F` : "white",
              borderBottom: tab === t.id ? `2px solid ${t.color}` : "2px solid transparent",
              fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "all 0.15s",
            }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: t.color }}>{t.count}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: tab === t.id ? t.color : "#94A3B8" }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Finding list */}
      <div style={{ maxHeight: 280, overflowY: "auto" }}>
        {active.length === 0 ? (
          <div style={{ padding: "32px 20px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
            {tab === "resolved" ? "✓ No resolved findings" : tab === "new" ? "No new findings" : "No persisting findings"}
          </div>
        ) : active.map((f, i) => {
          const color = tab === "new" ? PURPLE : tab === "persisting" ? AMBER : GREEN;
          const sevColor = f.severity === "High" ? RED : f.severity === "Medium" ? AMBER : "#64748B";
          return (
            <div key={i} style={{
              padding: "12px 20px", borderBottom: "1px solid #F8FAFC",
              display: "flex", gap: 12, alignItems: "flex-start",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, marginTop: 6, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>{f.category}</span>
                  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 8, background: `${sevColor}18`, color: sevColor, fontWeight: 700 }}>{f.severity}</span>
                  {f.finding_id && <span style={{ fontSize: 10, color: "#94A3B8", fontFamily: "monospace" }}>{f.finding_id.slice(0, 8)}</span>}
                </div>
                <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{f.issue || f.note || "—"}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


function ContinuousMonitoringChart({ history, currentScore, currentDate }: {
  history: AuditHistoryPoint[];
  currentScore: number;
  currentDate: string;
}) {
  // Build chart data: history points + ensure current run is included
  // auditChain from Report.tsx already contains the current run, so we just
  // dedupe by (date + score) to avoid rendering it twice.
  const historyPoints = history.map((h, idx) => ({
    date:      fmt(h.completed_at),
    score:     h.overall_score,
    seq:       h.rerun_sequence ?? idx,
    risk:      h.risk_level ?? "",
    isCurrent: Math.abs(h.overall_score - currentScore) < 0.5 && fmt(h.completed_at) === fmt(currentDate),
  }));

  // If the current run isn't already represented in history, append it
  const alreadyIncluded = historyPoints.some(p => p.isCurrent);
  const allPoints = alreadyIncluded
    ? historyPoints
    : [
        ...historyPoints,
        {
          date:      fmt(currentDate),
          score:     currentScore,
          seq:       (history.at(-1)?.rerun_sequence ?? history.length),
          risk:      "",
          isCurrent: true,
        },
      ];

  // Dedupe by date+score key
  const seen = new Set<string>();
  const chartData = allPoints.filter(p => {
    const k = `${p.date}-${p.score}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const minScore = Math.max(0,  Math.min(...chartData.map(d => d.score)) - 10);
  const maxScore = Math.min(100, Math.max(...chartData.map(d => d.score)) + 10);

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;
    const color = payload.isCurrent ? M : payload.score >= 75 ? GREEN : payload.score >= 50 ? AMBER : RED;
    return (
      <circle cx={cx} cy={cy} r={payload.isCurrent ? 7 : 5}
        fill={color} stroke="white" strokeWidth={2} />
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{
        background: "white", border: "1px solid #E2E8F0", borderRadius: 10,
        padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        <div style={{ fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>{d.date}</div>
        <div style={{ color: scoreColor(d.score), fontWeight: 700, fontSize: 16 }}>Score: {d.score}</div>
        {d.isCurrent && <div style={{ color: M, fontSize: 11, marginTop: 2 }}>← Current re-run</div>}
        {d.risk && <div style={{ color: "#64748B", fontSize: 11 }}>{d.risk} Risk</div>}
      </div>
    );
  };

  return (
    <div style={{
      background: "white", borderRadius: 14, border: "1px solid #E2E8F0",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)", padding: "20px 24px", marginBottom: 20,
    }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>Continuous Monitoring Timeline</div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
          Overall governance score across all audits — {chartData.length} data point{chartData.length !== 1 ? "s" : ""}
        </div>
      </div>

      {chartData.length < 2 ? (
        /* Only one data point — show a single-score summary instead of a blank chart */
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 0" }}>
          <div style={{ textAlign: "center", padding: "16px 24px", borderRadius: 14,
            background: "#F0F9FF", border: "1px solid #BAE6FD" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#0369A1", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 4 }}>
              Current Score
            </div>
            <div style={{ fontSize: 40, fontWeight: 900, color: scoreColor(currentScore), lineHeight: 1 }}>
              {currentScore}
            </div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>{fmt(currentDate)}</div>
          </div>
          <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.6 }}>
            Run more re-audits to build<br />the monitoring trend chart.
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={M} stopOpacity={0.15} />
                <stop offset="95%" stopColor={M} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis domain={[minScore, maxScore]} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={32} />
            <Tooltip content={<CustomTooltip />} />
            {/* Threshold lines */}
            <ReferenceLine y={75} stroke={GREEN}  strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: "Good", fill: GREEN,  fontSize: 10, position: "right" }} />
            <ReferenceLine y={50} stroke={AMBER}  strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: "Fair", fill: AMBER,  fontSize: 10, position: "right" }} />
            <Area
              type="monotone" dataKey="score"
              stroke={M} strokeWidth={2.5}
              fill="url(#scoreGrad)"
              dot={<CustomDot />}
              activeDot={{ r: 8, fill: B, stroke: "white", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Legend row */}
      <div style={{ display: "flex", gap: 20, marginTop: 12, flexWrap: "wrap" }}>
        {[
          { color: GREEN, label: "Good (≥75)" },
          { color: AMBER, label: "Fair (50-74)" },
          { color: RED,   label: "Poor (<50)" },
          { color: M,     label: "This re-run" },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748B" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}


function FingerprintDeltaPanel({ phase1Delta }: { phase1Delta: RerunData["phase1_delta"] }) {
  if (!phase1Delta) return null;

  const conflictChange = phase1Delta.conflict_count_change;
  const improved = conflictChange < 0;

  return (
    <div style={{
      background: "white", borderRadius: 14, border: "1px solid #E2E8F0",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden", marginBottom: 20,
    }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>Behavioural Fingerprint Changes</div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Phase 1 identity reconciliation delta</div>
      </div>

      <div style={{ padding: "16px 20px" }}>
        {/* Conflict count */}
        <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 140, padding: "12px 16px", borderRadius: 12, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, marginBottom: 4 }}>Conflicts (Baseline)</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: RED }}>{phase1Delta.conflict_count_prior}</div>
          </div>
          <div style={{ flex: 1, minWidth: 140, padding: "12px 16px", borderRadius: 12, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, marginBottom: 4 }}>Conflicts (Now)</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: phase1Delta.conflict_count_current === 0 ? GREEN : RED }}>
              {phase1Delta.conflict_count_current}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 140, padding: "12px 16px", borderRadius: 12, background: improved ? "#F0FDF4" : "#FEF2F2", border: `1px solid ${improved ? "#BBF7D0" : "#FECACA"}` }}>
            <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, marginBottom: 4 }}>Change</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: improved ? GREEN : RED }}>
              {conflictChange > 0 ? "+" : ""}{conflictChange}
            </div>
          </div>
          {phase1Delta.domain_changed && (
            <div style={{ flex: 1, minWidth: 160, padding: "12px 16px", borderRadius: 12, background: "#FFFBEB", border: "1px solid #FDE68A" }}>
              <div style={{ fontSize: 11, color: "#92400E", fontWeight: 700, marginBottom: 4 }}>⚠ Domain Changed</div>
              <div style={{ fontSize: 11, color: "#92400E" }}>{phase1Delta.domain_prior} → {phase1Delta.domain_current}</div>
            </div>
          )}
        </div>

        {/* Per-dimension changes */}
        {phase1Delta.per_dimension_changes.length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
              Dimensions that changed status ({phase1Delta.per_dimension_changes.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {phase1Delta.per_dimension_changes.map((c, i) => {
                const wasGood = c.prior_status === "AGREE";
                const isGood  = c.current_status === "AGREE";
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                    borderRadius: 8, background: isGood ? "#F0FDF4" : "#FEF2F2",
                    border: `1px solid ${isGood ? "#BBF7D0" : "#FECACA"}`,
                    fontSize: 12,
                  }}>
                    <span style={{ fontWeight: 700, color: "#374151", flex: 1 }}>{c.dimension}</span>
                    <span style={{ padding: "2px 8px", borderRadius: 6, background: wasGood ? "#F0FDF4" : "#FEF2F2", color: wasGood ? GREEN : RED, fontWeight: 700, fontSize: 11 }}>
                      {c.prior_status}
                    </span>
                    <span style={{ color: "#94A3B8" }}>→</span>
                    <span style={{ padding: "2px 8px", borderRadius: 6, background: isGood ? "#F0FDF4" : "#FEF2F2", color: isGood ? GREEN : RED, fontWeight: 700, fontSize: 11 }}>
                      {c.current_status}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {phase1Delta.per_dimension_changes.length === 0 && (
          <div style={{ fontSize: 12, color: "#94A3B8", padding: "12px 0" }}>
            ✓ No dimension status changes detected — behavioural fingerprint is stable.
          </div>
        )}
      </div>
    </div>
  );
}


// ── Main export ───────────────────────────────────────────────────────────────
export default function RerunComparison({ rerunData, auditHistory = [], priorScore, onClose }: Props) {
  const ds       = rerunData.delta_summary;
  const deltas   = rerunData.principle_deltas ?? [];
  const resolved = rerunData.resolved_findings ?? [];
  const persist  = rerunData.persisting_findings ?? [];
  const newF     = rerunData.new_findings ?? [];

  // Derive prior score from history or prop
  const derivedPrior = priorScore
    ?? auditHistory.find(h => h.audit_id === rerunData.parent_audit_id)?.overall_score
    ?? (rerunData.overall_score - (ds?.overall_score_change ?? 0));

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#0F172A" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        marginBottom: 20, gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#94A3B8", marginBottom: 6 }}>
            Re-run #{rerunData.rerun_sequence} · {rerunData.rerun_scope?.replace("_", " ").toUpperCase()} scope
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.3px" }}>
            {rerunData.ai_name} — Comparison Report
          </h2>
          {rerunData.operator_change_context && (
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 6, fontStyle: "italic" }}>
              "{rerunData.operator_change_context}"
            </div>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} style={{
            padding: "8px 16px", borderRadius: 10, border: "1px solid #E2E8F0",
            background: "white", color: "#64748B", fontWeight: 600, fontSize: 12,
            cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
          }}>✕ Close</button>
        )}
      </div>

      {/* Score delta banner */}
      <ScoreDeltaBanner rerunData={rerunData} priorScore={derivedPrior} />

      {/* Delta summary pills */}
      {ds && <DeltaSummaryBar ds={ds} />}

      {/* Continuous monitoring chart */}
      <ContinuousMonitoringChart
        history={auditHistory}
        currentScore={rerunData.overall_score}
        currentDate={rerunData.completed_at}
      />

      {/* Principle delta table */}
      {deltas.length > 0 && <PrincipleDeltaTable deltas={deltas} />}

      {/* Findings tracker */}
      {(resolved.length > 0 || persist.length > 0 || newF.length > 0) && (
        <FindingsPanel resolved={resolved} persisting={persist} newFindings={newF} />
      )}

      {/* Fingerprint delta */}
      <FingerprintDeltaPanel phase1Delta={rerunData.phase1_delta} />

      {/* Scope note */}
      <div style={{
        padding: "14px 18px", borderRadius: 12,
        background: "#EEF4FF", border: `1px solid ${M}25`,
        fontSize: 12, color: "#1E3A5F", lineHeight: 1.7,
      }}>
        <strong>Scope: {rerunData.rerun_scope}</strong> —
        {rerunData.rerun_scope === "full" && " Full re-audit triggered due to detected behavioural drift or domain change."}
        {rerunData.rerun_scope === "targeted" && " Targeted re-audit focused on previously failing principles only."}
        {rerunData.rerun_scope === "phase1_only" && " Phase 1 fingerprint re-check only — no adversarial probes fired."}
        {" "}Completed {fmtFull(rerunData.completed_at)}.
      </div>
    </div>
  );
}