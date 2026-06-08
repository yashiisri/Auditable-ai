/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import AuditContextBar, { LensFooter } from "../components/AuditContextBar";
import { useLocation, useNavigate } from "react-router-dom";

const B = "#00338D", M = "#005EB8";
const sc = (s: number) => s >= 75 ? "#059669" : s >= 50 ? M : "#64748B";
const sb = (s: number) => s >= 75 ? "#F0FDF4" : s >= 50 ? "#EFF6FF" : "#F1F5F9";
const band = (s: number) => s >= 75 ? "Strong" : s >= 50 ? "Watch" : "Critical";

const FW_META: Record<string, { label: string; desc: string; focus: string }> = {
  EU_AI_Act:   { label:"EU AI Act",        desc:"European Union Artificial Intelligence Regulation",    focus:"Risk classification, prohibited practices, human oversight, transparency obligations" },
  ISO_42001:   { label:"ISO 42001",         desc:"AI Management System Standard",                       focus:"AI management system requirements, continual improvement, risk treatment" },
  NIST_AI_RMF: { label:"NIST AI RMF",      desc:"AI Risk Management Framework",                        focus:"Govern, Map, Measure & Manage across the full AI lifecycle" },
  KPMG_TAF:    { label:"KPMG Trusted AI",  desc:"KPMG Trusted AI Framework",                           focus:"10-principle assessment across all governance dimensions" },
};

const PARAM_FRAMEWORK: Record<string, string[]> = {
  "PII Detection":["EU_AI_Act","ISO_42001","KPMG_TAF"],"PII Leakage Rate":["EU_AI_Act","KPMG_TAF"],
  "Consent Management":["EU_AI_Act","ISO_42001"],"Data Retention Signals":["EU_AI_Act","ISO_42001"],
  "Label Balance":["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],"Bias Indicator Fields":["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],
  "Demographic Tone Equity":["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],"Audit Log Volume":["EU_AI_Act","ISO_42001","KPMG_TAF"],
  "Timestamp Coverage":["EU_AI_Act","ISO_42001"],"Human Override Readiness":["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],
  "Safety Pass Rate":["EU_AI_Act","KPMG_TAF"],"Harmful Output Prevention":["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],
  "Prompt Injection Resistance":["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],"Governance Language Rate":["ISO_42001","KPMG_TAF"],
  "Schema Confidence":["ISO_42001","KPMG_TAF"],"Data Completeness":["ISO_42001","NIST_AI_RMF","KPMG_TAF"],
};

const PRINCIPLE_FRAMEWORK: Record<string, string[]> = {
  Fairness:["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],Transparency:["EU_AI_Act","ISO_42001","KPMG_TAF"],
  Explainability:["EU_AI_Act","KPMG_TAF"],Accountability:["EU_AI_Act","ISO_42001","NIST_AI_RMF","KPMG_TAF"],
  "Data Integrity":["ISO_42001","NIST_AI_RMF","KPMG_TAF"],Reliability:["ISO_42001","NIST_AI_RMF","KPMG_TAF"],
  Security:["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],Privacy:["EU_AI_Act","ISO_42001","KPMG_TAF"],
  Safety:["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],Sustainability:["ISO_42001","KPMG_TAF"],
};

function alignLabel(status: string, score: number) {
  const good = ["Good Alignment","Compliant","Certified Ready","Aligned"].includes(status);
  const partial = ["Partial Alignment","Conditional","Assessed"].includes(status);
  if (good) return score>=75?{l:"High Alignment",c:"#059669",b:"#F0FDF4"}:score>=55?{l:"Partial Alignment",c:M,b:"#EEF4FF"}:{l:"Limited Alignment",c:"#64748B",b:"#F1F5F9"};
  if (partial) return score>=75?{l:"Partial Alignment",c:M,b:"#EEF4FF"}:{l:"Limited Alignment",c:"#64748B",b:"#F1F5F9"};
  return {l:"Limited Alignment",c:"#64748B",b:"#F1F5F9"};
}

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0;}body{background:#F8FAFC;}.ra-card{background:white;border-radius:14px;border:1px solid #E2E8F0;box-shadow:0 1px 3px rgba(0,0,0,0.05),0 4px 12px rgba(0,0,0,0.04);}.ra-fw{padding:10px 12px;border-radius:10px;cursor:pointer;transition:all 0.15s;margin-bottom:3px;}.ra-fw:hover{background:#F8FAFC;}`;

export default function RegulatoryAlignment() {
  const location = useLocation();
  const navigate = useNavigate();
  const raw = location.state?.data || (() => { try { const s = sessionStorage.getItem("lastReportData"); return s ? JSON.parse(s) : null; } catch { return null; } })();
  const [selFw, setSelFw] = useState("EU_AI_Act");
  const [anim, setAnim] = useState(false);
  useEffect(() => { setTimeout(() => setAnim(true), 60); }, []);

  if (!raw) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <button onClick={() => navigate("/dashboard")} style={{ padding:"10px 24px", background:M, border:"none", borderRadius:10, color:"white", fontWeight:700, cursor:"pointer" }}>← Back</button>
    </div>
  );

  const r = raw; void anim;
  const prn = r.trusted_ai_principles || {};
  const fw = r.framework_compliance || {};
  const fwScore = r.overall_score;
  const fwMeta = FW_META[selFw] || { label:selFw, desc:"", focus:"" };
  const al = alignLabel(fw[selFw]||"", fwScore);
  const mappedPrinciples = Object.entries(prn).filter(([k]) => (PRINCIPLE_FRAMEWORK[k]||[]).includes(selFw));
  const mappedParams: { principle:string; param:string; score:number }[] = [];
  Object.entries(prn).forEach(([principle, data]: any) => {
    Object.entries(data.parameters||{}).forEach(([param, score]) => {
      if ((PARAM_FRAMEWORK[param]||[]).includes(selFw)) mappedParams.push({ principle, param, score: score as number });
    });
  });

  return (
    <div style={{ minHeight:"100vh", background:"#F8FAFC", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#0F172A" }}>
      <style>{CSS}</style>

      <AuditContextBar data={raw} />

      {/* Page header */}
      <div style={{ background: "linear-gradient(135deg, #00338D, #005EB8)", padding: "18px 40px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "22px 22px", pointerEvents: "none" }}/>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 3 }}>Audit Report · Regulatory Alignment</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.3px" }}>Regulatory &amp; Framework Alignment</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 3 }}>How this agent aligns with EU AI Act, ISO 42001, NIST AI RMF, and KPMG TAF</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:"28px 40px 60px", display:"grid", gridTemplateColumns:"220px 1fr", gap:22 }}>

        {/* Left: framework nav */}
        <div style={{ position:"sticky", top:90 }}>
          <div className="ra-card" style={{ padding:"16px 12px", marginBottom:14 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.6px", padding:"2px 8px", marginBottom:10 }}>Frameworks</div>
            {Object.entries(FW_META).map(([key, meta]) => {
              const a = alignLabel(fw[key]||"", fwScore);
              const sel = selFw === key;
              return (
                <div key={key} className="ra-fw" onClick={() => setSelFw(key)}
                  style={{ background:sel?"#EEF4FF":"transparent", border:sel?`1.5px solid #C7D9F5`:"1.5px solid transparent" }}>
                  <div style={{ fontSize:13, fontWeight:sel?700:500, color:sel?M:"#374151" }}>{meta.label}</div>
                  <div style={{ fontSize:10, fontWeight:700, color:a.c, marginTop:3 }}>{a.l}</div>
                </div>
              );
            })}
          </div>

          <div className="ra-card" style={{ padding:"16px 12px" }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.6px", padding:"2px 8px", marginBottom:10 }}>Principles</div>
            {Object.keys(prn).map(k => (
              <div key={k} style={{ padding:"5px 8px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:11.5, color:"#374151" }}>{k}</span>
                {(PRINCIPLE_FRAMEWORK[k]||[]).includes(selFw) && (
                  <span style={{ fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:10, background:"#EEF4FF", color:M }}>mapped</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: content */}
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

          {/* Framework hero */}
          <div className="ra-card" style={{ padding:"24px 28px", borderTop:`4px solid ${M}` }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:20, alignItems:"start" }}>
              <div>
                <div style={{ fontSize:18, fontWeight:900, color:"#0F172A", marginBottom:4 }}>{fwMeta.label}</div>
                <div style={{ fontSize:13, color:"#64748B", marginBottom:8 }}>{fwMeta.desc}</div>
                <div style={{ fontSize:12.5, color:"#94A3B8", lineHeight:1.6 }}>{fwMeta.focus}</div>
              </div>
              <div style={{ textAlign:"center", padding:"16px 22px", borderRadius:14, background:al.b, border:`1px solid ${al.c}25` }}>
                <div style={{ fontSize:30, fontWeight:900, color:al.c, lineHeight:1 }}>{fwScore}</div>
                <div style={{ fontSize:10, color:al.c, marginTop:3 }}>/ 100</div>
                <div style={{ fontSize:11, fontWeight:700, color:al.c, marginTop:8, padding:"3px 10px", borderRadius:20, background:"white", border:`1px solid ${al.c}30` }}>{al.l}</div>
              </div>
            </div>
            {/* Alignment bar */}
            <div style={{ marginTop:18 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#94A3B8", marginBottom:6 }}>
                <span>Limited</span><span>Partial</span><span>High</span>
              </div>
              <div style={{ height:6, background:"#F1F5F9", borderRadius:99, overflow:"hidden" }}>
                <div style={{ width:`${fwScore}%`, height:"100%", background:`linear-gradient(90deg,${M}66,${M})`, borderRadius:99, transition:"width 1s ease" }}/>
              </div>
            </div>
          </div>

          {/* All frameworks summary */}
          <div className="ra-card" style={{ padding:"22px 28px" }}>
            <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:16 }}>All Framework Alignment</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
              {Object.entries(FW_META).map(([key, meta]) => {
                const a = alignLabel(fw[key]||"", fwScore);
                return (
                  <div key={key} onClick={() => setSelFw(key)} style={{ padding:"16px 14px", borderRadius:12, background:selFw===key?"#EEF4FF":"#F8FAFC", border:selFw===key?`1.5px solid #C7D9F5`:"1px solid #E2E8F0", cursor:"pointer", transition:"all 0.15s" }}
                    onMouseEnter={e => { if(selFw!==key)(e.currentTarget as HTMLDivElement).style.background="#F1F5F9"; }}
                    onMouseLeave={e => { if(selFw!==key)(e.currentTarget as HTMLDivElement).style.background="#F8FAFC"; }}>
                    <div style={{ fontSize:12.5, fontWeight:800, color:"#0F172A", marginBottom:4 }}>{meta.label}</div>
                    <div style={{ fontSize:10, color:"#64748B", marginBottom:10, lineHeight:1.4 }}>{meta.desc}</div>
                    <div style={{ height:4, background:"#E2E8F0", borderRadius:99, overflow:"hidden", marginBottom:6 }}>
                      <div style={{ width:`${fwScore}%`, height:"100%", background:M, borderRadius:99 }}/>
                    </div>
                    <div style={{ fontSize:10, fontWeight:700, color:a.c }}>{a.l}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mapped principles */}
          {mappedPrinciples.length > 0 && (
            <div className="ra-card" style={{ padding:"22px 28px" }}>
              <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:4 }}>Principles Mapped to {fwMeta.label}</div>
              <div style={{ fontSize:12, color:"#94A3B8", marginBottom:16 }}>These principles directly address {fwMeta.label} requirements</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {mappedPrinciples.map(([k, data]: any) => (
                  <div key={k} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", borderRadius:12, background:"#F8FAFC", border:"1px solid #E2E8F0" }}>
                    <div style={{ flex:1, fontSize:13.5, fontWeight:600, color:"#0F172A" }}>{k}</div>
                    <div style={{ width:180, height:5, background:"#E2E8F0", borderRadius:99, overflow:"hidden" }}>
                      <div style={{ width:`${data.score}%`, height:"100%", background:sc(data.score), borderRadius:99, transition:"width 0.8s ease" }}/>
                    </div>
                    <div style={{ fontSize:14, fontWeight:900, color:sc(data.score), minWidth:32, textAlign:"right" }}>{data.score}</div>
                    <div style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:6, background:sb(data.score), color:sc(data.score), textTransform:"uppercase" as const }}>{band(data.score)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mapped sub-params */}
          {mappedParams.length > 0 && (
            <div className="ra-card" style={{ padding:"22px 28px" }}>
              <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:4 }}>Sub-Parameters Mapped to {fwMeta.label}</div>
              <div style={{ fontSize:12, color:"#94A3B8", marginBottom:16 }}>Individual parameters that address {fwMeta.label} policy requirements</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:10 }}>
                {mappedParams.map((mp, i) => (
                  <div key={i} style={{ padding:"12px 14px", borderRadius:12, background:sb(mp.score), border:`1px solid ${sc(mp.score)}18` }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.5px", marginBottom:4 }}>{mp.principle}</div>
                    <div style={{ fontSize:12.5, fontWeight:700, color:"#0F172A", marginBottom:8 }}>{mp.param}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ flex:1, height:4, background:"rgba(0,0,0,0.07)", borderRadius:99, overflow:"hidden" }}>
                        <div style={{ width:`${mp.score}%`, height:"100%", background:sc(mp.score), borderRadius:99 }}/>
                      </div>
                      <span style={{ fontSize:13, fontWeight:900, color:sc(mp.score) }}>{mp.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    <LensFooter data={raw} />
    </div>
  );
}