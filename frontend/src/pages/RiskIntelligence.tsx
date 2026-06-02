/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const M = "#005EB8", B = "#00338D";

export default function RiskIntelligence() {
  const location = useLocation();
  const navigate = useNavigate();
  const raw = location.state?.data || (() => { try { const s = sessionStorage.getItem("lastReportData"); return s ? JSON.parse(s) : null; } catch { return null; } })();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [anim, setAnim] = useState(false);
  useEffect(() => { setTimeout(() => setAnim(true), 100); }, []);

  if (!raw) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <button onClick={() => navigate("/dashboard")} style={{ padding:"10px 24px", background:M, border:"none", borderRadius:10, color:"white", fontWeight:700, cursor:"pointer" }}>← Back</button>
    </div>
  );

  const r = raw;
  const findings: any[] = r.findings || [];
  const high   = findings.filter((f: any) => f.severity === "High");
  const medium = findings.filter((f: any) => f.severity === "Medium");
  const low    = findings.filter((f: any) => f.severity === "Low");
  const prn    = r.trusted_ai_principles || {};

  // Weak principles (score < 60)
  const weakPrinciples = Object.entries(prn)
    .filter(([, v]: [string, any]) => v.score < 60)
    .sort((a: any, b: any) => a[1].score - b[1].score);

  const riskColor = r.risk_level === "Low" ? "#059669" : r.risk_level === "Moderate" ? M : "#DC2626";
  const riskBg    = r.risk_level === "Low" ? "#DCFCE7" : r.risk_level === "Moderate" ? "#EEF4FF" : "#FEE2E2";

  const _ = anim;

  return (
    <div style={{ minHeight:"100vh", background:"#F4F7FB", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#0F172A", paddingBottom:80 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0;}.ri-card{background:white;border-radius:16px;border:1px solid #E2E8F0;box-shadow:0 1px 4px rgba(0,0,0,0.05),0 4px 16px rgba(0,0,0,0.04);}`}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#00338D,#005EB8)", padding:"28px 36px 24px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize:"32px 32px", pointerEvents:"none" }}/>
        <div style={{ position:"relative", maxWidth:1160, margin:"0 auto" }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.5)", marginBottom:10 }}>Risk Intelligence · {r.ai_name}</div>
          <h1 style={{ fontSize:24, fontWeight:900, color:"white", letterSpacing:"-0.4px", marginBottom:6 }}>Risk Intelligence</h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.65)" }}>Comprehensive risk analysis — severity breakdown, governance exposure, and deployment blockers</p>
        </div>
      </div>

      <div style={{ maxWidth:1160, margin:"0 auto", padding:"28px 24px" }}>

        {/* Risk KPIs */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14, marginBottom:24 }}>
          {[
            { label:"Overall Risk Level",    val:r.risk_level,          color:riskColor, bg:riskBg },
            { label:"Structural Risk",       val:r.structural_risk,     color:r.structural_risk==="Low"?"#059669":r.structural_risk==="Moderate"?M:"#DC2626", bg:r.structural_risk==="Low"?"#DCFCE7":r.structural_risk==="Moderate"?"#EEF4FF":"#FEE2E2" },
            { label:"High Severity",         val:String(high.length),   color:"#DC2626", bg:"#FEE2E2" },
            { label:"Medium Severity",       val:String(medium.length), color:"#D97706", bg:"#FFF7ED" },
            { label:"Low Severity",          val:String(low.length),    color:"#059669", bg:"#DCFCE7" },
            { label:"Governance Score",      val:`${r.overall_score}/100`, color:r.overall_score>=75?"#059669":r.overall_score>=50?M:"#DC2626", bg:r.overall_score>=75?"#DCFCE7":r.overall_score>=50?"#EEF4FF":"#FEE2E2" },
          ].map((k,i) => (
            <div key={i} style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", padding:"18px 16px", borderTop:`3px solid ${k.color}` }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.6px", marginBottom:8 }}>{k.label}</div>
              <div style={{ fontSize:22, fontWeight:900, color:k.color }}>{k.val}</div>
            </div>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:20, alignItems:"start" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Deployment blockers */}
            {high.length > 0 && (
              <div className="ri-card" style={{ padding:"24px 28px", borderLeft:"4px solid #DC2626" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                  <div style={{ width:32, height:32, borderRadius:9, background:"#FEE2E2", display:"grid", placeItems:"center", color:"#DC2626" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:800, color:"#0F172A" }}>Deployment Blockers — {high.length} High Severity</div>
                    <div style={{ fontSize:12, color:"#94A3B8" }}>These must be resolved before production deployment</div>
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {high.map((f: any, i: number) => (
                    <div key={i} style={{ borderRadius:12, overflow:"hidden", border:"1.5px solid #FECACA" }}>
                      <div style={{ padding:"10px 16px", background:"#FEF2F2", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}
                        onClick={() => setExpanded(expanded===`h${i}`?null:`h${i}`)}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background:"#DC2626", flexShrink:0 }}/>
                          <span style={{ fontSize:13.5, fontWeight:700, color:"#0F172A" }}>{f.category}</span>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:20, background:"#FEE2E2", color:"#DC2626" }}>High</span>
                          <span style={{ fontSize:12, color:"#94A3B8", transform:expanded===`h${i}`?"rotate(180deg)":"none", transition:"transform 0.2s" }}>▾</span>
                        </div>
                      </div>
                      {expanded===`h${i}` && (
                        <div style={{ padding:"14px 16px", background:"white" }}>
                          <p style={{ fontSize:13, color:"#374151", lineHeight:1.7, marginBottom:10 }}>{f.issue}</p>
                          <div style={{ padding:"10px 14px", borderRadius:10, background:"#EEF4FF", border:"1px solid #C7D9F5" }}>
                            <div style={{ fontSize:10, fontWeight:700, color:M, textTransform:"uppercase" as const, letterSpacing:"0.6px", marginBottom:4 }}>Recommended Action</div>
                            <p style={{ fontSize:12, color:B, lineHeight:1.6, margin:0 }}>{f.recommendation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medium findings */}
            {medium.length > 0 && (
              <div className="ri-card" style={{ padding:"24px 28px", borderLeft:"4px solid #D97706" }}>
                <div style={{ fontSize:15, fontWeight:800, color:"#0F172A", marginBottom:4 }}>Medium Severity — {medium.length} Issues</div>
                <div style={{ fontSize:12, color:"#94A3B8", marginBottom:16 }}>Address within 60 days</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {medium.map((f: any, i: number) => (
                    <div key={i} style={{ borderRadius:12, overflow:"hidden", border:"1px solid #FDE68A" }}>
                      <div style={{ padding:"10px 16px", background:"#FFFBEB", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}
                        onClick={() => setExpanded(expanded===`m${i}`?null:`m${i}`)}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background:"#D97706", flexShrink:0 }}/>
                          <span style={{ fontSize:13, fontWeight:700, color:"#0F172A" }}>{f.category}</span>
                        </div>
                        <span style={{ fontSize:12, color:"#94A3B8", transform:expanded===`m${i}`?"rotate(180deg)":"none", transition:"transform 0.2s" }}>▾</span>
                      </div>
                      {expanded===`m${i}` && (
                        <div style={{ padding:"12px 16px", background:"white" }}>
                          <p style={{ fontSize:13, color:"#374151", lineHeight:1.7, marginBottom:8 }}>{f.issue}</p>
                          <p style={{ fontSize:12, color:M, lineHeight:1.5, margin:0 }}><strong>Fix:</strong> {f.recommendation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Low findings */}
            {low.length > 0 && (
              <div className="ri-card" style={{ padding:"24px 28px", borderLeft:"4px solid #059669" }}>
                <div style={{ fontSize:15, fontWeight:800, color:"#0F172A", marginBottom:4 }}>Low Severity — {low.length} Issues</div>
                <div style={{ fontSize:12, color:"#94A3B8", marginBottom:16 }}>Monitor and address in next review cycle</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {low.map((f: any, i: number) => (
                    <div key={i} style={{ padding:"10px 14px", borderRadius:10, background:"#F0FDF4", border:"1px solid #A7F3D0", display:"flex", gap:10, alignItems:"flex-start" }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:"#059669", marginTop:5, flexShrink:0 }}/>
                      <div>
                        <div style={{ fontSize:12.5, fontWeight:700, color:"#0F172A", marginBottom:2 }}>{f.category}</div>
                        <div style={{ fontSize:12, color:"#374151", lineHeight:1.5 }}>{f.issue}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {findings.length === 0 && (
              <div className="ri-card" style={{ padding:"40px", textAlign:"center" }}>
                <div style={{ fontSize:32, marginBottom:12 }}>✓</div>
                <div style={{ fontSize:16, fontWeight:700, color:"#059669", marginBottom:6 }}>No Findings Detected</div>
                <div style={{ fontSize:13, color:"#94A3B8" }}>All governance checks passed. No issues were identified during this audit.</div>
              </div>
            )}
          </div>

          {/* Right: Risk heatmap + weak principles */}
          <div style={{ display:"flex", flexDirection:"column", gap:16, position:"sticky", top:24 }}>
            <div className="ri-card" style={{ padding:"20px" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.7px", marginBottom:14 }}>Risk Heatmap</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[
                  { label:"High Risk",     count:high.length,   color:"#DC2626", bg:"#FEE2E2" },
                  { label:"Medium Risk",   count:medium.length, color:"#D97706", bg:"#FFF7ED" },
                  { label:"Low Risk",      count:low.length,    color:"#059669", bg:"#DCFCE7" },
                  { label:"Weak Principles", count:weakPrinciples.length, color:M, bg:"#EEF4FF" },
                ].map((h,i) => (
                  <div key={i} style={{ padding:"14px", borderRadius:12, background:h.bg, textAlign:"center" }}>
                    <div style={{ fontSize:28, fontWeight:900, color:h.color, lineHeight:1 }}>{h.count}</div>
                    <div style={{ fontSize:10, color:h.color, fontWeight:700, marginTop:4 }}>{h.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {weakPrinciples.length > 0 && (
              <div className="ri-card" style={{ padding:"20px" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.7px", marginBottom:14 }}>Governance Exposure</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {weakPrinciples.map(([k, v]: [string, any]) => (
                    <div key={k} style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>{k}</div>
                        <div style={{ height:5, background:"#F1F5F9", borderRadius:99, overflow:"hidden" }}>
                          <div style={{ width:`${v.score}%`, height:"100%", background:"#DC2626", borderRadius:99 }}/>
                        </div>
                      </div>
                      <div style={{ fontSize:14, fontWeight:900, color:"#DC2626", minWidth:32, textAlign:"right" }}>{v.score}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="ri-card" style={{ padding:"20px" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.7px", marginBottom:12 }}>Regulatory Exposure</div>
              {r.overall_score < 75 && (
                <div style={{ padding:"12px 14px", borderRadius:10, background:"#FEF2F2", border:"1px solid #FECACA", marginBottom:10 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#DC2626", marginBottom:4 }}>EU AI Act</div>
                  <div style={{ fontSize:11, color:"#7F1D1D", lineHeight:1.5 }}>Score below 75 indicates potential non-compliance with high-risk AI system requirements.</div>
                </div>
              )}
              {r.overall_score >= 75 && (
                <div style={{ padding:"12px 14px", borderRadius:10, background:"#F0FDF4", border:"1px solid #A7F3D0" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#059669", marginBottom:4 }}>Compliant Posture</div>
                  <div style={{ fontSize:11, color:"#065F46", lineHeight:1.5 }}>Score meets baseline requirements across major regulatory frameworks.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
