/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import AuditContextBar, { LensFooter } from "../components/AuditContextBar";
import { useLocation, useNavigate } from "react-router-dom";

const B = "#00338D", M = "#005EB8";
const sc = (s: number) => s >= 75 ? "#059669" : s >= 50 ? M : "#64748B";
const sb = (s: number) => s >= 75 ? "#F0FDF4" : s >= 50 ? "#EFF6FF" : "#F1F5F9";

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0;}body{background:#F8FAFC;}.ri-card{background:white;border-radius:14px;border:1px solid #E2E8F0;box-shadow:0 1px 3px rgba(0,0,0,0.05),0 4px 12px rgba(0,0,0,0.04);}.ri-exp{overflow:hidden;transition:max-height 0.3s ease;}`;

export default function RiskIntelligence() {
  const location = useLocation();
  const navigate = useNavigate();
  const raw = location.state?.data || (() => { try { const s = sessionStorage.getItem("lastReportData"); return s ? JSON.parse(s) : null; } catch { return null; } })();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [anim, setAnim] = useState(false);
  useEffect(() => { setTimeout(() => setAnim(true), 60); }, []);

  if (!raw) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <button onClick={() => navigate("/dashboard")} style={{ padding:"10px 24px", background:M, border:"none", borderRadius:10, color:"white", fontWeight:700, cursor:"pointer" }}>← Back</button>
    </div>
  );

  const r = raw; void anim;
  const findings: any[] = r.findings || [];
  const high   = findings.filter((f: any) => f.severity === "High");
  const medium = findings.filter((f: any) => f.severity === "Medium");
  const low    = findings.filter((f: any) => f.severity === "Low");
  const prn    = r.trusted_ai_principles || {};
  const weakPrinciples = Object.entries(prn).filter(([, v]: any) => v.score < 60).sort((a: any, b: any) => a[1].score - b[1].score);
  const rc = r.risk_level === "Low" ? "#059669" : r.risk_level === "Moderate" ? M : "#64748B";

  return (
    <div style={{ minHeight:"100vh", background:"#F8FAFC", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#0F172A" }}>
      <style>{CSS}</style>

      <AuditContextBar data={raw} />


      {/* Body */}
      <div style={{ padding:"28px 40px 60px" }}>

        {/* KPI row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:14, marginBottom:28 }}>
          {[
            { label:"Overall Risk",     val:r.risk_level,         color:rc },
            { label:"Structural Risk",  val:r.structural_risk,    color:r.structural_risk==="Low"?"#059669":r.structural_risk==="Moderate"?M:"#64748B" },
            { label:"High Severity",    val:String(high.length),  color:"#64748B" },
            { label:"Medium Severity",  val:String(medium.length),color:"#D97706" },
            { label:"Low Severity",     val:String(low.length),   color:"#059669" },
            { label:"Governance Score", val:`${r.overall_score}/100`, color:sc(r.overall_score) },
          ].map((k,i) => (
            <div key={i} style={{ background:"white", borderRadius:12, border:"1px solid #E2E8F0", padding:"16px 14px", borderTop:`3px solid ${k.color}` }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.5px", marginBottom:8 }}>{k.label}</div>
              <div style={{ fontSize:20, fontWeight:900, color:k.color }}>{k.val}</div>
            </div>
          ))}
        </div>

        {/* Main 2-col */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:20 }}>

          {/* Left: findings */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {findings.length === 0 && (
              <div className="ri-card" style={{ padding:"48px 32px", textAlign:"center" }}>
                <div style={{ width:56, height:56, borderRadius:16, background:"#F0FDF4", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{ fontSize:16, fontWeight:800, color:"#059669", marginBottom:6 }}>No Findings</div>
                <div style={{ fontSize:13, color:"#94A3B8" }}>All governance checks passed. No issues were identified.</div>
              </div>
            )}

            {/* High severity */}
            {high.length > 0 && (
              <div className="ri-card" style={{ overflow:"hidden" }}>
                <div style={{ padding:"16px 20px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:"#64748B" }}/>
                  <div style={{ fontSize:14, fontWeight:800, color:"#0F172A" }}>Deployment Blockers — {high.length} High Severity</div>
                  <div style={{ marginLeft:"auto", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:"#F1F5F9", color:"#64748B" }}>Must fix before deployment</div>
                </div>
                {high.map((f: any, i: number) => (
                  <div key={i} style={{ borderBottom: i < high.length-1 ? "1px solid #F8FAFC" : "none" }}>
                    <div style={{ padding:"14px 20px", display:"flex", alignItems:"center", gap:12, cursor:"pointer", background:expanded===`h${i}`?"#F1F5F9":"white" }}
                      onClick={() => setExpanded(expanded===`h${i}`?null:`h${i}`)}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:"#64748B", flexShrink:0 }}/>
                      <div style={{ flex:1, fontSize:13.5, fontWeight:600, color:"#0F172A" }}>{f.category}</div>
                      <span style={{ fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:20, background:"#F1F5F9", color:"#64748B" }}>High</span>
                      <span style={{ fontSize:12, color:"#CBD5E1", transition:"transform 0.2s", transform:expanded===`h${i}`?"rotate(180deg)":"none" }}>▾</span>
                    </div>
                    {expanded===`h${i}` && (
                      <div style={{ padding:"0 20px 16px" }}>
                        <p style={{ fontSize:13, color:"#374151", lineHeight:1.7, marginBottom:10 }}>{f.issue}</p>
                        <div style={{ padding:"10px 14px", borderRadius:10, background:"#EEF4FF", border:"1px solid #C7D9F5" }}>
                          <div style={{ fontSize:10, fontWeight:700, color:M, textTransform:"uppercase" as const, letterSpacing:"0.5px", marginBottom:4 }}>Recommended Action</div>
                          <p style={{ fontSize:12.5, color:B, lineHeight:1.6, margin:0 }}>{f.recommendation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Medium severity */}
            {medium.length > 0 && (
              <div className="ri-card" style={{ overflow:"hidden" }}>
                <div style={{ padding:"16px 20px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:"#D97706" }}/>
                  <div style={{ fontSize:14, fontWeight:800, color:"#0F172A" }}>Medium Severity — {medium.length} Issues</div>
                  <div style={{ marginLeft:"auto", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:"#FFF7ED", color:"#D97706" }}>Address within 60 days</div>
                </div>
                {medium.map((f: any, i: number) => (
                  <div key={i} style={{ borderBottom: i < medium.length-1 ? "1px solid #F8FAFC" : "none" }}>
                    <div style={{ padding:"12px 20px", display:"flex", alignItems:"center", gap:12, cursor:"pointer", background:expanded===`m${i}`?"#FFFBEB":"white" }}
                      onClick={() => setExpanded(expanded===`m${i}`?null:`m${i}`)}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:"#D97706", flexShrink:0 }}/>
                      <div style={{ flex:1, fontSize:13, fontWeight:600, color:"#0F172A" }}>{f.category}</div>
                      <span style={{ fontSize:12, color:"#CBD5E1", transition:"transform 0.2s", transform:expanded===`m${i}`?"rotate(180deg)":"none" }}>▾</span>
                    </div>
                    {expanded===`m${i}` && (
                      <div style={{ padding:"0 20px 14px" }}>
                        <p style={{ fontSize:13, color:"#374151", lineHeight:1.7, marginBottom:8 }}>{f.issue}</p>
                        <p style={{ fontSize:12.5, color:M, lineHeight:1.5, margin:0 }}><strong>Fix:</strong> {f.recommendation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Low severity */}
            {low.length > 0 && (
              <div className="ri-card" style={{ padding:"20px 24px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:"#059669" }}/>
                  <div style={{ fontSize:14, fontWeight:800, color:"#0F172A" }}>Low Severity — {low.length} Issues</div>
                  <div style={{ marginLeft:"auto", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:"#F0FDF4", color:"#059669" }}>Monitor &amp; review</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {low.map((f: any, i: number) => (
                    <div key={i} style={{ padding:"10px 12px", borderRadius:10, background:"#F8FAFC", border:"1px solid #E2E8F0", display:"flex", gap:10 }}>
                      <div style={{ width:5, height:5, borderRadius:"50%", background:"#059669", marginTop:5, flexShrink:0 }}/>
                      <div>
                        <div style={{ fontSize:12.5, fontWeight:700, color:"#0F172A", marginBottom:2 }}>{f.category}</div>
                        <div style={{ fontSize:12, color:"#64748B", lineHeight:1.5 }}>{f.issue}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: heatmap + exposure */}
          <div style={{ display:"flex", flexDirection:"column", gap:14, position:"sticky", top:80 }}>

            {/* Risk heatmap */}
            <div className="ri-card" style={{ padding:"18px 16px" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.6px", marginBottom:14 }}>Risk Heatmap</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[
                  { label:"High",           count:high.length,           color:"#64748B", bg:"#F1F5F9" },
                  { label:"Medium",         count:medium.length,         color:"#D97706", bg:"#FFFBEB" },
                  { label:"Low",            count:low.length,            color:"#059669", bg:"#F0FDF4" },
                  { label:"Weak Principles",count:weakPrinciples.length, color:M,         bg:"#EEF4FF" },
                ].map((h,i) => (
                  <div key={i} style={{ padding:"14px 12px", borderRadius:12, background:h.bg, textAlign:"center" }}>
                    <div style={{ fontSize:26, fontWeight:900, color:h.color, lineHeight:1 }}>{h.count}</div>
                    <div style={{ fontSize:10, color:h.color, fontWeight:700, marginTop:4 }}>{h.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weak principles */}
            {weakPrinciples.length > 0 && (
              <div className="ri-card" style={{ padding:"18px 16px" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.6px", marginBottom:14 }}>Governance Exposure</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {weakPrinciples.map(([k, v]: any) => (
                    <div key={k} style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>{k}</div>
                        <div style={{ height:4, background:"#F1F5F9", borderRadius:99, overflow:"hidden" }}>
                          <div style={{ width:`${v.score}%`, height:"100%", background:sc(v.score), borderRadius:99 }}/>
                        </div>
                      </div>
                      <div style={{ fontSize:14, fontWeight:900, color:sc(v.score), minWidth:28, textAlign:"right" }}>{v.score}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regulatory note */}
            <div className="ri-card" style={{ padding:"18px 16px" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.6px", marginBottom:12 }}>Regulatory Exposure</div>
              <div style={{ padding:"12px 14px", borderRadius:10, background:sb(r.overall_score), border:`1px solid ${sc(r.overall_score)}25` }}>
                <div style={{ fontSize:12, fontWeight:700, color:sc(r.overall_score), marginBottom:4 }}>
                  {r.overall_score >= 75 ? "Compliant Posture" : r.overall_score >= 50 ? "Conditional Compliance" : "Non-Compliant"}
                </div>
                <div style={{ fontSize:11.5, color:"#64748B", lineHeight:1.5 }}>
                  {r.overall_score >= 75
                    ? "Score meets baseline requirements across major regulatory frameworks."
                    : r.overall_score >= 50
                    ? "Partial alignment — address medium findings to achieve full compliance."
                    : "Score below acceptable thresholds. Immediate remediation required before deployment."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    <LensFooter data={raw} />
    </div>
  );
}