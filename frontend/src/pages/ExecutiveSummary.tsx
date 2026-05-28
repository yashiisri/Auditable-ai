/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const B = "#00338D", M = "#005EB8", L = "#0091DA";
const sc = (s: number) => s >= 75 ? "#059669" : s >= 50 ? M : "#DC2626";
const sb = (s: number) => s >= 75 ? "#DCFCE7" : s >= 50 ? "#EEF4FF" : "#FEE2E2";
const band = (s: number) => s >= 75 ? "Strong" : s >= 50 ? "Watch" : "Critical";
const fmt = (d: string) => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function Radial({ score, size = 110, color }: { score: number; size?: number; color: string }) {
  const r = size * 0.38, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={size*0.09}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.09}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dasharray 1.4s ease" }}/>
      <text x={size/2} y={size/2+5} textAnchor="middle" fill="#0F172A" fontSize={size*0.22} fontWeight="900" fontFamily="'Plus Jakarta Sans',sans-serif">{score}</text>
    </svg>
  );
}

export default function AuditOverview() {
  const location = useLocation();
  const navigate = useNavigate();
  const raw = location.state?.data;
  const [anim, setAnim] = useState(false);
  useEffect(() => { setTimeout(() => setAnim(true), 100); }, []);

  if (!raw) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", gap:16, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <p style={{ color:"#64748B", fontSize:16 }}>No audit data found.</p>
      <button onClick={() => navigate("/dashboard")} style={{ padding:"10px 24px", background:M, border:"none", borderRadius:10, color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>← Back to Audit Pipeline</button>
    </div>
  );

  const r = raw;
  const prn = r.trusted_ai_principles || {};
  const pkeys = Object.keys(prn);
  const avgPrn = pkeys.length ? Math.round(pkeys.reduce((s: number, k: string) => s + prn[k].score, 0) / pkeys.length) : 0;
  const highFindings = (r.findings || []).filter((f: any) => f.severity === "High").length;
  const rc = r.risk_level === "Low" ? "#059669" : r.risk_level === "Moderate" ? M : "#DC2626";
  const rcBg = r.risk_level === "Low" ? "#DCFCE7" : r.risk_level === "Moderate" ? "#EEF4FF" : "#FEE2E2";

  const deploymentReady = r.overall_score >= 75 && highFindings === 0;
  const trustIndex = Math.round((r.overall_score * 0.5) + (r.data_quality_score * 0.3) + (avgPrn * 0.2));
  const opConfidence = r.data_quality_score >= 75 ? "High" : r.data_quality_score >= 50 ? "Moderate" : "Low";

  const fade = (d: number): React.CSSProperties => ({
    opacity: anim ? 1 : 0, transform: anim ? "translateY(0)" : "translateY(16px)",
    transition: `all 0.6s cubic-bezier(.22,1,.36,1) ${d}s`,
  });

  return (
    <div style={{ minHeight:"100vh", background:"#F4F7FB", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#0F172A", paddingBottom:80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .ao-card{background:white;border-radius:16px;border:1px solid #E2E8F0;box-shadow:0 1px 4px rgba(0,0,0,0.05),0 4px 16px rgba(0,0,0,0.04);}
        .ao-kpi{background:white;border-radius:14px;border:1px solid #E2E8F0;padding:22px 20px;transition:all 0.2s;}
        .ao-kpi:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,51,141,0.1);border-color:#C7D9F5;}
        @keyframes aoFade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .ao-in{animation:aoFade 0.5s cubic-bezier(.22,1,.36,1) both;}
      `}</style>

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${B} 0%,${M} 55%,${L} 100%)`, padding:"32px 36px 28px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize:"32px 32px", pointerEvents:"none" }}/>
        <div style={{ position:"relative", maxWidth:1160, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.55)", background:"rgba(255,255,255,0.1)", padding:"3px 10px", borderRadius:20, border:"1px solid rgba(255,255,255,0.15)" }}>Audit Overview</span>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>·</span>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>{fmt(r.evaluated_at)}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:20 }}>
            <div>
              <h1 style={{ fontSize:28, fontWeight:900, color:"white", letterSpacing:"-0.5px", marginBottom:8 }}>{r.ai_name}</h1>
              <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
                {[
                  { label:"Model", val: r.model_label || r.model_type?.replace(/_/g," ") },
                  { label:"Report ID", val: r.report_id?.slice(0,12)+"…" },
                  ...(r.detection_confidence !== undefined ? [{ label:"Detection", val:`${Math.round(r.detection_confidence*100)}% confidence` }] : []),
                ].map(m => (
                  <div key={m.label} style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"rgba(255,255,255,0.7)" }}>
                    <span style={{ color:"rgba(255,255,255,0.4)" }}>{m.label}:</span>
                    <span style={{ fontWeight:600 }}>{m.val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:16, background:"rgba(255,255,255,0.1)", borderRadius:16, padding:"16px 24px", border:"1px solid rgba(255,255,255,0.15)", backdropFilter:"blur(8px)" }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:48, fontWeight:900, color:"white", lineHeight:1, letterSpacing:"-2px" }}>{r.overall_score}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", marginTop:2, letterSpacing:"0.5px" }}>/ 100 OVERALL</div>
              </div>
              <div style={{ width:1, height:48, background:"rgba(255,255,255,0.2)" }}/>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:13, fontWeight:800, padding:"5px 14px", borderRadius:20, background:rcBg, color:rc }}>{r.risk_level} Risk</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", marginTop:6 }}>Risk Level</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1160, margin:"0 auto", padding:"28px 24px" }}>

        {/* KPI row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16, marginBottom:24, ...fade(0.05) }}>
          {[
            { label:"AI Governance Readiness", val:`${r.overall_score}%`, sub: r.overall_score>=75?"Deployment ready":"Needs improvement", color:sc(r.overall_score), bg:sb(r.overall_score) },
            { label:"Enterprise Trust Index",  val:`${trustIndex}%`,      sub:"Composite governance score",                              color:sc(trustIndex),       bg:sb(trustIndex) },
            { label:"Operational Confidence",  val:opConfidence,          sub:`Data quality: ${r.data_quality_score}%`,                  color:r.data_quality_score>=75?"#059669":r.data_quality_score>=50?M:"#DC2626", bg:r.data_quality_score>=75?"#DCFCE7":r.data_quality_score>=50?"#EEF4FF":"#FEE2E2" },
            { label:"Deployment Recommendation", val:deploymentReady?"Approved":"Review Required", sub:deploymentReady?"No high-severity findings":`${highFindings} high-severity issue${highFindings!==1?"s":""}`, color:deploymentReady?"#059669":"#DC2626", bg:deploymentReady?"#DCFCE7":"#FEE2E2" },
          ].map((k,i) => (
            <div key={i} className="ao-kpi" style={{ borderTop:`3px solid ${k.color}` }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.7px", marginBottom:10 }}>{k.label}</div>
              <div style={{ fontSize:26, fontWeight:900, color:k.color, lineHeight:1, marginBottom:6 }}>{k.val}</div>
              <div style={{ fontSize:11, color:"#64748B" }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20, alignItems:"start", ...fade(0.1) }}>

          {/* Left: Score breakdown */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Governance score card */}
            <div className="ao-card" style={{ padding:"28px 32px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:"#EEF4FF", display:"grid", placeItems:"center", color:M }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <div style={{ fontSize:16, fontWeight:800, color:"#0F172A" }}>Governance Score Breakdown</div>
                  <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>How the overall score was computed across all dimensions</div>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12, marginBottom:24 }}>
                {[
                  { label:"Overall Score",    val:r.overall_score,       unit:"/100" },
                  { label:"Data Quality",     val:r.data_quality_score,  unit:"%" },
                  { label:"Logs Evaluated",   val:r.logs_evaluated,      unit:" records" },
                  { label:"Principles Tested",val:pkeys.length,          unit:" principles" },
                  { label:"Avg Principle",    val:avgPrn,                unit:"/100" },
                  { label:"Findings",         val:(r.findings||[]).length, unit:" total" },
                ].map((m,i) => (
                  <div key={i} style={{ padding:"14px 16px", borderRadius:12, background:"#F8FAFC", border:"1px solid #E2E8F0" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:6 }}>{m.label}</div>
                    <div style={{ fontSize:22, fontWeight:900, color:B, lineHeight:1 }}>{m.val}<span style={{ fontSize:11, color:"#94A3B8", fontWeight:500 }}>{m.unit}</span></div>
                  </div>
                ))}
              </div>

              {/* Principle score bars */}
              {pkeys.length > 0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.7px", marginBottom:14 }}>Principle Scores</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {pkeys.map(k => {
                      const s = prn[k].score;
                      return (
                        <div key={k} style={{ display:"flex", alignItems:"center", gap:12 }}>
                          <div style={{ fontSize:12.5, fontWeight:600, color:"#374151", minWidth:130, flexShrink:0 }}>{k}</div>
                          <div style={{ flex:1, height:7, background:"#F1F5F9", borderRadius:99, overflow:"hidden" }}>
                            <div style={{ width:`${s}%`, height:"100%", background:`linear-gradient(90deg,${sc(s)}88,${sc(s)})`, borderRadius:99, transition:"width 1s ease" }}/>
                          </div>
                          <div style={{ fontSize:13, fontWeight:800, color:sc(s), minWidth:36, textAlign:"right" }}>{s}</div>
                          <div style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:6, background:sb(s), color:sc(s), minWidth:52, textAlign:"center", textTransform:"uppercase" }}>{band(s)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Executive Summary */}
            <div className="ao-card" style={{ padding:"28px 32px" }} id="executive-summary">
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:"#F0FDF4", display:"grid", placeItems:"center", color:"#059669" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
                <div>
                  <div style={{ fontSize:16, fontWeight:800, color:"#0F172A" }}>Executive Summary</div>
                  <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>AI governance posture at a glance</div>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
                {[
                  { label:"Structural Risk",    val:r.structural_risk,    color:r.structural_risk==="Low"?"#059669":r.structural_risk==="Moderate"?M:"#DC2626" },
                  { label:"Risk Level",         val:r.risk_level,         color:rc },
                  { label:"Model Type",         val:(r.model_label||r.model_type||"—").replace(/_/g," "), color:B },
                  { label:"Evaluated",          val:fmt(r.evaluated_at),  color:"#374151" },
                ].map((row,i) => (
                  <div key={i} style={{ padding:"12px 14px", borderRadius:10, background:"#F8FAFC", border:"1px solid #E2E8F0" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:5 }}>{row.label}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:row.color }}>{row.val}</div>
                  </div>
                ))}
              </div>
              {/* Findings summary */}
              {(r.findings||[]).length > 0 && (
                <div style={{ padding:"14px 16px", borderRadius:12, background:"#FEF2F2", border:"1px solid #FECACA" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#DC2626", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:10 }}>Findings Summary</div>
                  <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                    {[
                      { sev:"High",   color:"#DC2626", bg:"#FEE2E2" },
                      { sev:"Medium", color:"#D97706", bg:"#FFF7ED" },
                      { sev:"Low",    color:"#059669", bg:"#DCFCE7" },
                    ].map(s => {
                      const cnt = (r.findings||[]).filter((f: any) => f.severity===s.sev).length;
                      return (
                        <div key={s.sev} style={{ padding:"8px 14px", borderRadius:10, background:s.bg, border:`1px solid ${s.color}30` }}>
                          <div style={{ fontSize:20, fontWeight:900, color:s.color, lineHeight:1 }}>{cnt}</div>
                          <div style={{ fontSize:10, color:s.color, fontWeight:700, marginTop:3 }}>{s.sev}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Methodology */}
            <div className="ao-card" style={{ padding:"28px 32px" }} id="methodology">
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:"#EEF4FF", display:"grid", placeItems:"center", color:M }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </div>
                <div>
                  <div style={{ fontSize:16, fontWeight:800, color:"#0F172A" }}>Audit Methodology</div>
                  <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>How this governance evaluation was conducted</div>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:12 }}>
                {[
                  { step:"1", title:"Data Ingestion",       desc:"CSV/log file parsed. Schema confidence, column types, missing ratio, and duplicate rate computed." },
                  { step:"2", title:"Signal Extraction",    desc:"Structural signals derived from dataset shape and column names." },
                  { step:"3", title:"Sub-parameter Scoring",desc:"Each sub-parameter formula runs against extracted signals. Scores clamped to 0–100." },
                  { step:"4", title:"Principle Aggregation",desc:"Sub-parameter scores averaged to produce each of the 10 KPMG TAF principle scores." },
                  { step:"5", title:"Overall Score",        desc:"Weighted average of all principle scores. Risk level derived: ≥75 = Low, ≥50 = Moderate, <50 = High." },
                  { step:"6", title:"LLM Judge Panel",      desc:"Three independent AI judges vote on each input/output pair for accuracy and safety." },
                ].map(s => (
                  <div key={s.step} style={{ display:"flex", gap:12, padding:"14px 16px", borderRadius:12, background:"#F8FAFC", border:"1px solid #E2E8F0" }}>
                    <div style={{ width:26, height:26, borderRadius:"50%", background:B, color:"white", display:"grid", placeItems:"center", fontSize:11, fontWeight:800, flexShrink:0 }}>{s.step}</div>
                    <div>
                      <div style={{ fontSize:12.5, fontWeight:700, color:"#0F172A", marginBottom:3 }}>{s.title}</div>
                      <div style={{ fontSize:11, color:"#64748B", lineHeight:1.6 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Radial gauges + quick nav */}
          <div style={{ display:"flex", flexDirection:"column", gap:16, position:"sticky", top:24 }}>
            <div className="ao-card" style={{ padding:"24px 20px" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.7px", marginBottom:18 }}>Score Gauges</div>
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                {[
                  { label:"Overall Governance", score:r.overall_score },
                  { label:"Data Quality",        score:r.data_quality_score },
                  { label:"Avg Principle",       score:avgPrn },
                  { label:"Trust Index",         score:trustIndex },
                ].map(g => (
                  <div key={g.label} style={{ display:"flex", alignItems:"center", gap:14 }}>
                    <Radial score={g.score} size={64} color={sc(g.score)} />
                    <div>
                      <div style={{ fontSize:12.5, fontWeight:700, color:"#0F172A" }}>{g.label}</div>
                      <div style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:6, background:sb(g.score), color:sc(g.score), marginTop:4, display:"inline-block", textTransform:"uppercase" }}>{band(g.score)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="ao-card" style={{ padding:"20px" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.7px", marginBottom:14 }}>Navigate Report</div>
              {[
                { label:"Regulatory Alignment", path:"/regulatory-alignment", color:M },
                { label:"Risk Intelligence",    path:"/risk-intelligence",    color:"#DC2626" },
                { label:"LLM Analysis",         path:"/llm-analysis",         color:"#7C3AED" },
                { label:"Governance Principles",path:"/governance-principles", color:B },
                { label:"Agent Behaviour",      path:"/agent-behaviour",      color:"#059669" },
                { label:"Recommendations",      path:"/recommendations",      color:"#D97706" },
                { label:"Download Report",      path:"/download-report",      color:"#374151" },
              ].map(nav => (
                <div key={nav.path} onClick={() => navigate(nav.path, { state: { data: raw } })}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 12px", borderRadius:9, cursor:"pointer", marginBottom:4, transition:"all 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background="#F8FAFC"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background="transparent"; }}
                >
                  <span style={{ fontSize:12.5, fontWeight:600, color:nav.color }}>{nav.label}</span>
                  <span style={{ fontSize:14, color:"#CBD5E1" }}>›</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
