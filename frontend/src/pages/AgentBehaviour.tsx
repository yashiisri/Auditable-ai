/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const M = "#005EB8", B = "#00338D";
const sc = (s: number) => s >= 75 ? "#059669" : s >= 50 ? M : "#DC2626";
const sb = (s: number) => s >= 75 ? "#DCFCE7" : s >= 50 ? "#EEF4FF" : "#FEE2E2";
const band = (s: number) => s >= 75 ? "Strong" : s >= 50 ? "Watch" : "Critical";

export default function AgentBehaviour() {
  const location = useLocation();
  const navigate = useNavigate();
  const raw = location.state?.data || (() => { try { const s = sessionStorage.getItem("lastReportData"); return s ? JSON.parse(s) : null; } catch { return null; } })();
  const [anim, setAnim] = useState(false);
  useEffect(() => { setTimeout(() => setAnim(true), 100); }, []);

  if (!raw) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <button onClick={() => navigate("/dashboard")} style={{ padding:"10px 24px", background:M, border:"none", borderRadius:10, color:"white", fontWeight:700, cursor:"pointer" }}>← Back</button>
    </div>
  );

  const r = raw;
  const d = r.diagnostics || {};
  const dq = r.data_quality_score || 0;
  const missing = d.missing_ratio || 0;
  const completeness = Math.round((1 - missing) * 100);
  const schemaScore = Math.round((d.schema_confidence || 0) * 100);
  const dupPenalty = Math.max(0, Math.min(100, Math.round(Math.max(0, 100 - ((d.duplicates||0) / Math.max(r.logs_evaluated||1, 1)) * 500))));
  const volScore = Math.min(100, Math.round((r.logs_evaluated||0) / 100 * 100));
  const notes = r.computation_notes ? Object.entries(r.computation_notes).filter(([k]) => k !== "_error") : [];
  const computed = notes.filter(([, n]: any) => n.status === "computed");
  const unavailable = notes.filter(([, n]: any) => n.status !== "computed");
  const _ = anim;

  return (
    <div style={{ minHeight:"100vh", background:"#F4F7FB", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#0F172A", paddingBottom:80 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0;}.ab-card{background:white;border-radius:16px;border:1px solid #E2E8F0;box-shadow:0 1px 4px rgba(0,0,0,0.05),0 4px 16px rgba(0,0,0,0.04);}`}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#00338D,#005EB8)", padding:"28px 36px 24px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize:"32px 32px", pointerEvents:"none" }}/>
        <div style={{ position:"relative", maxWidth:1160, margin:"0 auto" }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.5)", marginBottom:10 }}>Agent Behaviour · {r.ai_name}</div>
          <h1 style={{ fontSize:24, fontWeight:900, color:"white", letterSpacing:"-0.4px", marginBottom:6 }}>Agent Behaviour &amp; Data Quality</h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.65)" }}>Model metrics, structural integrity, and metric computation transparency</p>
        </div>
      </div>

      <div style={{ maxWidth:1160, margin:"0 auto", padding:"28px 24px", display:"flex", flexDirection:"column", gap:20 }}>

        {/* Data quality KPIs */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:14 }}>
          {[
            { label:"Data Quality Score",  val:`${dq}%`,          score:dq },
            { label:"Completeness",        val:`${completeness}%`, score:completeness },
            { label:"Duplicate-Free Rate", val:`${dupPenalty}%`,   score:dupPenalty },
            { label:"Schema Confidence",   val:`${schemaScore}%`,  score:schemaScore },
            { label:"Log Volume",          val:`${r.logs_evaluated||0}`, score:volScore },
            { label:"Structural Risk",     val:r.structural_risk||"—", score:r.structural_risk==="Low"?80:r.structural_risk==="Moderate"?55:30 },
          ].map((k,i) => (
            <div key={i} style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", padding:"18px 16px", borderTop:`3px solid ${sc(k.score)}` }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.6px", marginBottom:8 }}>{k.label}</div>
              <div style={{ fontSize:22, fontWeight:900, color:sc(k.score) }}>{k.val}</div>
              <div style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:6, background:sb(k.score), color:sc(k.score), marginTop:6, display:"inline-block", textTransform:"uppercase" as const }}>{band(k.score)}</div>
            </div>
          ))}
        </div>

        {/* Data Structural Integrity */}
        <div className="ab-card" style={{ padding:"28px 32px" }} id="evidence-logs">
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"#EEF4FF", display:"grid", placeItems:"center", color:M }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:"#0F172A" }}>Data Structural Integrity</div>
              <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Why each structural metric received its score — based on your uploaded dataset</div>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { label:"Data Quality Score",  val:`${dq}%`,          score:dq,          formula:"(1 − missing_ratio) × 70 + schema_confidence × 30", why:dq>=75?`Score of ${dq}% reflects high completeness and strong schema confidence. Dataset is structurally sound.`:`Score of ${dq}% reflects moderate quality. Missing data ratio of ${(missing*100).toFixed(1)}% reduces reliability.` },
              { label:"Data Completeness",   val:`${completeness}%`, score:completeness, formula:"(1 − missing_ratio) × 100",                          why:completeness>=90?`${completeness}% of all values are present — excellent completeness.`:`${completeness}% completeness. ${(missing*100).toFixed(1)}% of values are missing.` },
              { label:"Duplicate-Free Rate", val:`${dupPenalty}%`,   score:dupPenalty,   formula:"clamp(100 − (duplicates / total) × 500)",             why:d.duplicates===0?"No duplicate records detected. Clean data prevents inflated metrics.":`${d.duplicates} duplicate record(s) detected. Remove before re-running the audit.` },
              { label:"Schema Confidence",   val:`${schemaScore}%`,  score:schemaScore,  formula:"(1 − missing_ratio × 0.5) × 100",                    why:schemaScore>=85?`Schema confidence of ${schemaScore}% indicates a well-structured dataset.`:`Schema confidence of ${schemaScore}% reflects structural inconsistency.` },
              { label:"Log Volume",          val:`${r.logs_evaluated||0} records`, score:volScore, formula:"min(logs_evaluated / 100 × 100, 100)",      why:(r.logs_evaluated||0)>=100?`${r.logs_evaluated} records — sufficient for reliable governance scoring.`:`Only ${r.logs_evaluated} records. Consider uploading a larger log sample.` },
            ].map((row,i) => (
              <div key={i} style={{ padding:"16px 18px", borderRadius:12, background:"#F8FAFC", border:`1.5px solid ${row.score>=75?"rgba(5,150,105,0.2)":row.score>=50?"rgba(0,94,184,0.2)":"rgba(220,38,38,0.2)"}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:13.5, fontWeight:700, color:"#0F172A", marginBottom:4 }}>{row.label}</div>
                    <div style={{ fontSize:11, fontFamily:"monospace", background:"white", border:"1px solid #E2E8F0", borderRadius:6, padding:"3px 8px", display:"inline-block", color:"#64748B" }}>{row.formula}</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:22, fontWeight:900, color:sc(row.score), lineHeight:1 }}>{row.val}</div>
                    <div style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:6, background:sb(row.score), color:sc(row.score), marginTop:4, display:"inline-block", textTransform:"uppercase" as const }}>{band(row.score)}</div>
                  </div>
                </div>
                <div style={{ height:5, background:"#E2E8F0", borderRadius:99, marginBottom:10 }}>
                  <div style={{ width:`${Math.min(row.score,100)}%`, height:"100%", borderRadius:99, background:`linear-gradient(90deg,${sc(row.score)}80,${sc(row.score)})`, transition:"width 0.8s ease" }}/>
                </div>
                <div style={{ fontSize:12.5, color:"#475569", lineHeight:1.7, padding:"10px 12px", background:"white", borderRadius:9, border:"1px solid #E2E8F0" }}>{row.why}</div>
              </div>
            ))}
          </div>
          {d.column_names && d.column_names.length > 0 && (
            <div style={{ marginTop:16, padding:"16px 18px", borderRadius:12, background:"white", border:"1px solid #E2E8F0" }}>
              <div style={{ fontSize:11, fontWeight:700, color:M, textTransform:"uppercase" as const, letterSpacing:"0.08em", marginBottom:10 }}>Detected Columns ({d.column_names.length})</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {d.column_names.map((col: string) => {
                  const req = ["task_id","input","output","latency"].some(r2 => col.toLowerCase().includes(r2));
                  return <span key={col} style={{ padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:500, background:req?"#DCFCE7":"#F1F5F9", color:req?"#065F46":"#475569", border:req?"1px solid rgba(5,150,105,0.3)":"1px solid #E2E8F0", fontFamily:"monospace" }}>{col}</span>;
                })}
              </div>
            </div>
          )}
        </div>

        {/* Model metrics */}
        {r.model_metrics && Object.values(r.model_metrics).some((m: any) => m.value !== null) && (
          <div className="ab-card" style={{ padding:"28px 32px" }}>
            <div style={{ fontSize:16, fontWeight:800, color:"#0F172A", marginBottom:4 }}>Model-Specific Metrics</div>
            <div style={{ fontSize:12, color:"#94A3B8", marginBottom:20 }}>Measured for {r.model_label||r.model_type} — evaluated against model-appropriate thresholds</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14 }}>
              {Object.entries(r.model_metrics).filter(([, m]: any) => m.value !== null).map(([key, m]: any) => {
                const mc = m.risk_level==="Low"?"#059669":m.risk_level==="Moderate"?M:"#DC2626";
                const mcBg = m.risk_level==="Low"?"#DCFCE7":m.risk_level==="Moderate"?"#EEF4FF":"#FEE2E2";
                const dv = m.unit==="ms"?`${Math.round(m.value)}ms`:m.value.toFixed(3);
                const dk = key.replace(/_/g," ").replace(/\b\w/g, (c: string) => c.toUpperCase());
                return (
                  <div key={key} style={{ padding:"18px 16px", borderRadius:16, background:mcBg, border:`1px solid ${mc}25` }}>
                    <div style={{ fontSize:11, color:"#64748B", textTransform:"uppercase" as const, letterSpacing:"0.06em", fontWeight:600, marginBottom:8 }}>{dk}</div>
                    <div style={{ fontSize:26, fontWeight:800, color:mc, marginBottom:8 }}>{dv}</div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:11, color:mc, background:"white", border:`1px solid ${mc}40`, padding:"2px 8px", borderRadius:20, fontWeight:700 }}>{m.risk_level}</span>
                      {m.threshold_low !== undefined && <span style={{ fontSize:10, color:"#94A3B8" }}>threshold: {m.threshold_low}{m.unit?` ${m.unit}`:""}</span>}
                    </div>
                    <div style={{ fontSize:11, color:"#64748B", lineHeight:1.5, marginTop:8 }}>{m.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Computation notes */}
        {notes.length > 0 && (
          <div className="ab-card" style={{ padding:"28px 32px" }}>
            <div style={{ fontSize:16, fontWeight:800, color:"#0F172A", marginBottom:4 }}>Metric Computation Transparency</div>
            <div style={{ fontSize:12, color:"#94A3B8", marginBottom:16 }}>Every metric computed directly from your input/output data using real NLP/ML libraries</div>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:20 }}>
              {[
                { label:"Computed",      count:computed.length,    color:"#059669", bg:"#DCFCE7" },
                { label:"Unavailable",   count:unavailable.length, color:M,         bg:"#EEF4FF" },
                { label:"Total Metrics", count:notes.length,       color:B,         bg:"#EEF4FF" },
              ].map(({ label, count, color, bg }) => (
                <div key={label} style={{ padding:"14px 22px", borderRadius:14, background:bg, border:`1px solid ${color}20`, textAlign:"center", minWidth:120 }}>
                  <div style={{ fontSize:26, fontWeight:900, color }}>{count}</div>
                  <div style={{ fontSize:11, color:"#64748B", marginTop:4 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:10 }}>
              {notes.map(([key, note]: any) => {
                const ok = note.status === "computed";
                const nc = ok ? "#059669" : M;
                const ncBg = ok ? "#DCFCE7" : "#EEF4FF";
                const dk = key.replace(/_/g," ").replace(/\b\w/g, (c: string) => c.toUpperCase());
                return (
                  <div key={key} style={{ padding:"14px", borderRadius:14, background:ncBg, border:`1px solid ${nc}20` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:"#0F172A" }}>{dk}</span>
                      <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10, color:nc, background:"white", border:`1px solid ${nc}30` }}>{ok?"computed":"unavailable"}</span>
                    </div>
                    <div style={{ fontSize:22, fontWeight:900, color:nc }}>{note.value !== null ? note.value.toFixed(4) : "—"}</div>
                    <div style={{ fontSize:10, color:"#94A3B8", lineHeight:1.5, marginTop:4 }}>{note.library}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
