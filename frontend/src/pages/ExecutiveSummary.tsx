/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const B = "#00338D", M = "#005EB8";
const sc = (s: number) => s >= 75 ? "#059669" : s >= 50 ? M : "#DC2626";
const sb = (s: number) => s >= 75 ? "#F0FDF4" : s >= 50 ? "#EEF4FF" : "#FEF2F2";
const band = (s: number) => s >= 75 ? "Strong" : s >= 50 ? "Watch" : "Critical";
const fmt = (d: string) => new Date(d).toLocaleString("en-GB", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });

function Radial({ score, size = 90, color }: { score: number; size?: number; color: string }) {
  const r = size * 0.38, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={size*0.09}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.09}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition:"stroke-dasharray 1.2s ease" }}/>
      <text x={size/2} y={size/2+5} textAnchor="middle" fill="#0F172A" fontSize={size*0.22} fontWeight="900" fontFamily="'Plus Jakarta Sans',sans-serif">{score}</text>
    </svg>
  );
}

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#F8FAFC;}
.es-card{background:white;border-radius:14px;border:1px solid #E2E8F0;box-shadow:0 1px 3px rgba(0,0,0,0.05),0 4px 12px rgba(0,0,0,0.04);}
.es-kpi{background:white;border-radius:12px;border:1px solid #E2E8F0;padding:20px 18px;transition:all 0.2s;}
.es-kpi:hover{box-shadow:0 4px 16px rgba(0,51,141,0.08);border-color:#C7D9F5;transform:translateY(-1px);}
.es-nav-link{display:flex;align-items:center;justify-content:space-between;padding:9px 12px;border-radius:9px;cursor:pointer;transition:all 0.15s;font-size:13px;font-weight:500;color:#374151;}
.es-nav-link:hover{background:#F8FAFC;color:#005EB8;}
.es-bar{height:5px;background:#F1F5F9;border-radius:99px;overflow:hidden;}
.es-bar-fill{height:100%;border-radius:99px;transition:width 0.8s ease;}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.es-in{animation:fadeUp 0.4s cubic-bezier(.22,1,.36,1) both;}
`;

export default function ExecutiveSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const raw = location.state?.data || (() => { try { const s = sessionStorage.getItem("lastReportData"); return s ? JSON.parse(s) : null; } catch { return null; } })();
  const [anim, setAnim] = useState(false);
  useEffect(() => { setTimeout(() => setAnim(true), 60); }, []);

  if (!raw) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", gap:14, fontFamily:"'Plus Jakarta Sans',sans-serif", background:"#F8FAFC" }}>
      <div style={{ fontSize:15, color:"#64748B" }}>No audit data found. Run a governance evaluation first.</div>
      <button onClick={() => navigate("/dashboard")} style={{ padding:"10px 24px", background:M, border:"none", borderRadius:10, color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>← Go to Audit Pipeline</button>
    </div>
  );

  const r = raw;
  const prn = r.trusted_ai_principles || {};
  const pkeys = Object.keys(prn);
  const avgPrn = pkeys.length ? Math.round(pkeys.reduce((s: number, k: string) => s + prn[k].score, 0) / pkeys.length) : 0;
  const highFindings = (r.findings || []).filter((f: any) => f.severity === "High").length;
  const medFindings  = (r.findings || []).filter((f: any) => f.severity === "Medium").length;
  const rc = r.risk_level === "Low" ? "#059669" : r.risk_level === "Moderate" ? M : "#DC2626";
  const rcBg = r.risk_level === "Low" ? "#F0FDF4" : r.risk_level === "Moderate" ? "#EEF4FF" : "#FEF2F2";
  const trustIndex = Math.round((r.overall_score * 0.5) + (r.data_quality_score * 0.3) + (avgPrn * 0.2));
  const deploymentReady = r.overall_score >= 75 && highFindings === 0;
  const opConfidence = r.data_quality_score >= 75 ? "High" : r.data_quality_score >= 50 ? "Moderate" : "Low";
  const _ = anim;

  const AUDIT_PAGES = [
    { label:"Regulatory Alignment", path:"/regulatory-alignment" },
    { label:"Risk Intelligence",    path:"/risk-intelligence" },
    { label:"LLM Analysis",         path:"/llm-analysis" },
    { label:"Governance Principles",path:"/governance-principles" },
    { label:"Agent Behaviour",      path:"/agent-behaviour" },
    { label:"Recommendations",      path:"/recommendations" },
    { label:"Download Report",      path:"/download-report" },
  ];

  const nav = (path: string) => {
    navigate(path, { state: { data: r } });
  };

  return (
    <div style={{ minHeight:"100vh", background:"#F8FAFC", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#0F172A" }}>
      <style>{STYLE}</style>

      {/* ── STICKY BLUE BANNER ── */}
      <div style={{ background:`linear-gradient(135deg,${B},${M})`, padding:"22px 40px", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize:"28px 28px", pointerEvents:"none" }}/>
        <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:14 }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:"1.4px", textTransform:"uppercase", color:"rgba(255,255,255,0.5)", marginBottom:4 }}>Executive Summary · Governance Audit</div>
            <div style={{ fontSize:20, fontWeight:900, color:"white", letterSpacing:"-0.3px" }}>{r.ai_name}</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:14, marginTop:5, fontSize:12, color:"rgba(255,255,255,0.65)" }}>
              <span>{r.model_label || r.model_type}</span>
              <span>·</span><span>{fmt(r.evaluated_at)}</span>
              <span>·</span><span style={{ fontFamily:"monospace" }}>#{r.report_id?.slice(0,10)}</span>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ textAlign:"center", padding:"10px 18px", background:"rgba(255,255,255,0.12)", borderRadius:12, border:"1px solid rgba(255,255,255,0.18)" }}>
              <div style={{ fontSize:36, fontWeight:900, color:"white", lineHeight:1, letterSpacing:"-1px" }}>{r.overall_score}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", marginTop:2, letterSpacing:"0.4px" }}>/ 100</div>
            </div>
            <div style={{ padding:"6px 14px", borderRadius:20, background:rcBg, color:rc, fontSize:12, fontWeight:700 }}>{r.risk_level} Risk</div>
          </div>
        </div>
      </div>

      {/* ── PAGE BODY ── */}
      <div style={{ padding:"28px 40px 60px" }}>

        {/* KPI row — full width */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
          {[
            { label:"AI Governance Readiness", val:`${r.overall_score}%`,    sub:r.overall_score>=75?"Meets enterprise standards":"Improvement required",   color:sc(r.overall_score) },
            { label:"Enterprise Trust Index",  val:`${trustIndex}%`,         sub:"Composite governance score",                                             color:sc(trustIndex) },
            { label:"Operational Confidence",  val:opConfidence,             sub:`Data quality: ${r.data_quality_score}%`,                                 color:r.data_quality_score>=75?"#059669":r.data_quality_score>=50?M:"#DC2626" },
            { label:"Deployment Readiness",    val:deploymentReady?"Approved":"Review Required", sub:deploymentReady?"No high-severity findings":`${highFindings} blocker${highFindings!==1?"s":""}`, color:deploymentReady?"#059669":"#DC2626" },
          ].map((k,i) => (
            <div key={i} className="es-kpi" style={{ borderTop:`3px solid ${k.color}` }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.6px", marginBottom:10 }}>{k.label}</div>
              <div style={{ fontSize:26, fontWeight:900, color:k.color, lineHeight:1, marginBottom:5 }}>{k.val}</div>
              <div style={{ fontSize:11.5, color:"#64748B" }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Main 3-column layout */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 260px", gap:20, alignItems:"start" }}>

          {/* Column 1: Score + Findings */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Governance scores */}
            <div className="es-card" style={{ padding:"22px 24px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
                <div style={{ width:32, height:32, borderRadius:9, background:"#EEF4FF", display:"grid", placeItems:"center", color:M }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:800, color:"#0F172A" }}>Governance Score Breakdown</div>
                  <div style={{ fontSize:11.5, color:"#94A3B8" }}>How the overall score was computed</div>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
                {[
                  { label:"Overall",   val:r.overall_score,      unit:"/100" },
                  { label:"Data Quality",   val:r.data_quality_score, unit:"%" },
                  { label:"Logs Evaluated",    val:r.logs_evaluated||0, unit:" records" },
                  { label:"Principles Tested", val:pkeys.length,        unit:" dims" },
                ].map((m,i) => (
                  <div key={i} style={{ padding:"12px 14px", borderRadius:10, background:"#F8FAFC", border:"1px solid #E2E8F0" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.5px", marginBottom:5 }}>{m.label}</div>
                    <div style={{ fontSize:20, fontWeight:900, color:B, lineHeight:1 }}>{m.val}<span style={{ fontSize:10, color:"#94A3B8", fontWeight:500 }}>{m.unit}</span></div>
                  </div>
                ))}
              </div>
              {/* Principle bars */}
              {pkeys.length > 0 && (
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.6px", marginBottom:12 }}>Principle Scores</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {pkeys.map(k => {
                      const s = prn[k].score;
                      return (
                        <div key={k} style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ fontSize:12, fontWeight:500, color:"#374151", minWidth:120, flexShrink:0 }}>{k}</div>
                          <div className="es-bar" style={{ flex:1 }}>
                            <div className="es-bar-fill" style={{ width:`${s}%`, background:sc(s) }}/>
                          </div>
                          <div style={{ fontSize:12, fontWeight:800, color:sc(s), minWidth:28, textAlign:"right" }}>{s}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Methodology */}
            <div className="es-card" style={{ padding:"22px 24px" }}>
              <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:4 }}>Audit Methodology</div>
              <div style={{ fontSize:11.5, color:"#94A3B8", marginBottom:16 }}>How this governance evaluation was conducted</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {[
                  { n:"1", t:"Data Ingestion",        d:"Schema, missing ratio, duplicates and column types parsed." },
                  { n:"2", t:"Signal Extraction",     d:"Structural signals derived from dataset shape and column names." },
                  { n:"3", t:"Sub-parameter Scoring", d:"Each formula runs against extracted signals, clamped to 0–100." },
                  { n:"4", t:"Principle Aggregation", d:"Sub-parameters averaged into each of the 10 KPMG TAF principles." },
                  { n:"5", t:"Overall Score",         d:"Weighted average of all principles. Risk derived: ≥75=Low, ≥50=Moderate." },
                  { n:"6", t:"LLM Judge Panel",       d:"Three independent AI judges vote on each response for accuracy." },
                ].map(s => (
                  <div key={s.n} style={{ display:"flex", gap:10, padding:"12px 13px", borderRadius:10, background:"#F8FAFC", border:"1px solid #E2E8F0" }}>
                    <div style={{ width:22, height:22, borderRadius:"50%", background:B, color:"white", display:"grid", placeItems:"center", fontSize:10, fontWeight:800, flexShrink:0 }}>{s.n}</div>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:"#0F172A", marginBottom:2 }}>{s.t}</div>
                      <div style={{ fontSize:11, color:"#64748B", lineHeight:1.5 }}>{s.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Summary + Findings */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Executive summary */}
            <div className="es-card" style={{ padding:"22px 24px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
                <div style={{ width:32, height:32, borderRadius:9, background:"#F0FDF4", display:"grid", placeItems:"center", color:"#059669" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:800, color:"#0F172A" }}>Executive Summary</div>
                  <div style={{ fontSize:11.5, color:"#94A3B8" }}>Governance posture at a glance</div>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                {[
                  { label:"Structural Risk", val:r.structural_risk,                                      color:r.structural_risk==="Low"?"#059669":r.structural_risk==="Moderate"?M:"#DC2626" },
                  { label:"Risk Level",      val:r.risk_level,                                           color:rc },
                  { label:"Model Type",      val:(r.model_label||r.model_type||"—").replace(/_/g," "),   color:"#374151" },
                  { label:"Strong Principles",val:`${pkeys.filter(k=>prn[k]?.score>=75).length}/${pkeys.length}`, color:"#059669" },
                ].map((row,i) => (
                  <div key={i} style={{ padding:"12px 14px", borderRadius:10, background:"#F8FAFC", border:"1px solid #E2E8F0" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.5px", marginBottom:5 }}>{row.label}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:row.color }}>{row.val}</div>
                  </div>
                ))}
              </div>

              {/* Findings */}
              <div style={{ padding:"14px 16px", borderRadius:12, background: highFindings>0?"#FEF2F2":medFindings>0?"#FFFBEB":"#F0FDF4", border:`1px solid ${highFindings>0?"#FECACA":medFindings>0?"#FDE68A":"#A7F3D0"}` }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.6px", marginBottom:10 }}>Findings Breakdown</div>
                <div style={{ display:"flex", gap:10 }}>
                  {[
                    { sev:"High",   count:(r.findings||[]).filter((f:any)=>f.severity==="High").length,   color:"#DC2626", bg:"white" },
                    { sev:"Medium", count:(r.findings||[]).filter((f:any)=>f.severity==="Medium").length, color:"#D97706", bg:"white" },
                    { sev:"Low",    count:(r.findings||[]).filter((f:any)=>f.severity==="Low").length,    color:"#059669", bg:"white" },
                  ].map(s => (
                    <div key={s.sev} style={{ flex:1, padding:"10px 12px", borderRadius:9, background:s.bg, border:"1px solid #E2E8F0", textAlign:"center" }}>
                      <div style={{ fontSize:22, fontWeight:900, color:s.color, lineHeight:1 }}>{s.count}</div>
                      <div style={{ fontSize:10, color:s.color, fontWeight:700, marginTop:3 }}>{s.sev}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Score gauges */}
            <div className="es-card" style={{ padding:"22px 24px" }}>
              <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:16 }}>Score Gauges</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {[
                  { label:"Overall Governance", score:r.overall_score },
                  { label:"Data Quality",        score:r.data_quality_score },
                  { label:"Avg Principle",       score:avgPrn },
                  { label:"Trust Index",         score:trustIndex },
                ].map(g => (
                  <div key={g.label} style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"14px 10px", borderRadius:12, background:"#F8FAFC", border:"1px solid #E2E8F0" }}>
                    <Radial score={g.score} size={72} color={sc(g.score)} />
                    <div style={{ fontSize:11.5, fontWeight:600, color:"#374151", marginTop:6, textAlign:"center" }}>{g.label}</div>
                    <div style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:6, background:sb(g.score), color:sc(g.score), marginTop:4, textTransform:"uppercase" as const }}>{band(g.score)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Framework compliance */}
            <div className="es-card" style={{ padding:"22px 24px" }}>
              <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:16 }}>Framework Compliance</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {Object.entries(r.framework_compliance||{}).map(([key, status]: any) => {
                  const labels: Record<string,string> = { EU_AI_Act:"EU AI Act", ISO_42001:"ISO 42001", NIST_AI_RMF:"NIST AI RMF", KPMG_TAF:"KPMG Trusted AI" };
                  const comp = status?.includes("Compliant")||status?.includes("Aligned")||status?.includes("Good");
                  const partial = status?.includes("Conditional")||status?.includes("Partial");
                  const fc = comp?"#059669":partial?M:"#DC2626";
                  const fb = comp?"#F0FDF4":partial?"#EEF4FF":"#FEF2F2";
                  return (
                    <div key={key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", borderRadius:10, background:"#F8FAFC", border:"1px solid #E2E8F0" }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"#0F172A" }}>{labels[key]||key}</div>
                      <div style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:fb, color:fc }}>{comp?"High Alignment":partial?"Partial":"Limited"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 3: Navigation */}
          <div style={{ position:"sticky", top:90 }}>
            <div className="es-card" style={{ padding:"18px 14px" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.6px", marginBottom:12 }}>Audit Sections</div>
              {AUDIT_PAGES.map((p,i) => (
                <div key={i} className="es-nav-link" onClick={() => nav(p.path)}>
                  <span>{p.label}</span>
                  <span style={{ fontSize:14, color:"#CBD5E1" }}>›</span>
                </div>
              ))}
            </div>

            {/* Quick stats */}
            <div className="es-card" style={{ padding:"18px 14px", marginTop:14 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.6px", marginBottom:12 }}>Quick Stats</div>
              {[
                { label:"Logs Evaluated",   val:r.logs_evaluated||0 },
                { label:"Principles",       val:pkeys.length },
                { label:"Findings",         val:(r.findings||[]).length },
                { label:"Data Quality",     val:`${r.data_quality_score}%` },
              ].map((s,i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:i<3?"1px solid #F1F5F9":"none" }}>
                  <span style={{ fontSize:12.5, color:"#64748B" }}>{s.label}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:B }}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
