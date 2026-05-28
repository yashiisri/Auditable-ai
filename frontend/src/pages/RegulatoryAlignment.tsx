/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const B = "#00338D", M = "#005EB8", L = "#0091DA";

const FW_META: Record<string, { label: string; desc: string; focus: string; color: string; bg: string }> = {
  EU_AI_Act:   { label:"EU AI Act",        desc:"European Union Artificial Intelligence Regulation",       focus:"Risk classification, prohibited practices, human oversight, transparency obligations",  color:"#1D4ED8", bg:"#EFF6FF" },
  ISO_42001:   { label:"ISO 42001",         desc:"AI Management System Standard",                          focus:"AI management system requirements, continual improvement, risk treatment",              color:"#059669", bg:"#F0FDF4" },
  NIST_AI_RMF: { label:"NIST AI RMF",      desc:"AI Risk Management Framework",                           focus:"Govern, Map, Measure & Manage across the full AI lifecycle",                           color:"#7C3AED", bg:"#F3E8FF" },
  KPMG_TAF:    { label:"KPMG Trusted AI",  desc:"KPMG Trusted AI Framework",                              focus:"10-principle assessment: Fairness, Transparency, Explainability, Accountability, Safety, Security, Privacy, Reliability, Data Integrity, Sustainability", color:M, bg:"#EEF4FF" },
};

// Sub-parameter → framework mapping
const PARAM_FRAMEWORK: Record<string, string[]> = {
  "PII Detection":              ["EU_AI_Act","ISO_42001","KPMG_TAF"],
  "PII Leakage Rate":           ["EU_AI_Act","KPMG_TAF"],
  "Consent Management":         ["EU_AI_Act","ISO_42001"],
  "Data Retention Signals":     ["EU_AI_Act","ISO_42001"],
  "Output Anonymisation":       ["EU_AI_Act","KPMG_TAF"],
  "Label Balance":              ["EU_AI_Act","KPMG_TAF","NIST_AI_RMF"],
  "Bias Indicator Fields":      ["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],
  "Missing Data Equity":        ["EU_AI_Act","KPMG_TAF"],
  "Demographic Tone Equity":    ["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],
  "Consistency Score":          ["ISO_42001","NIST_AI_RMF","KPMG_TAF"],
  "Error Rate Tracking":        ["ISO_42001","NIST_AI_RMF","KPMG_TAF"],
  "Latency Monitoring":         ["ISO_42001","NIST_AI_RMF"],
  "Audit Log Volume":           ["EU_AI_Act","ISO_42001","KPMG_TAF"],
  "Timestamp Coverage":         ["EU_AI_Act","ISO_42001"],
  "User Attribution":           ["EU_AI_Act","KPMG_TAF"],
  "Human Override Readiness":   ["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],
  "Safety Pass Rate":           ["EU_AI_Act","KPMG_TAF"],
  "Harmful Output Prevention":  ["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],
  "Prompt Injection Resistance":["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],
  "Uncertainty Disclosure":     ["EU_AI_Act","KPMG_TAF"],
  "Governance Language Rate":   ["ISO_42001","KPMG_TAF"],
  "Schema Confidence":          ["ISO_42001","KPMG_TAF"],
  "Data Completeness":          ["ISO_42001","NIST_AI_RMF","KPMG_TAF"],
};

const PRINCIPLE_FRAMEWORK: Record<string, string[]> = {
  Fairness:        ["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],
  Transparency:    ["EU_AI_Act","ISO_42001","KPMG_TAF"],
  Explainability:  ["EU_AI_Act","KPMG_TAF"],
  Accountability:  ["EU_AI_Act","ISO_42001","NIST_AI_RMF","KPMG_TAF"],
  "Data Integrity":["ISO_42001","NIST_AI_RMF","KPMG_TAF"],
  Reliability:     ["ISO_42001","NIST_AI_RMF","KPMG_TAF"],
  Security:        ["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],
  Privacy:         ["EU_AI_Act","ISO_42001","KPMG_TAF"],
  Safety:          ["EU_AI_Act","NIST_AI_RMF","KPMG_TAF"],
  Sustainability:  ["ISO_42001","KPMG_TAF"],
};

function alignLabel(status: string, score: number) {
  if (["Good Alignment","Compliant","Certified Ready","Aligned"].includes(status)) {
    return score >= 75 ? { label:"High Alignment", color:"#059669", bg:"#DCFCE7" }
         : score >= 55 ? { label:"Partial Alignment", color:M, bg:"#EEF4FF" }
         :               { label:"Limited Alignment", color:"#DC2626", bg:"#FEE2E2" };
  }
  if (["Partial Alignment","Conditional","Assessed"].includes(status)) {
    return score >= 75 ? { label:"Partial Alignment", color:M, bg:"#EEF4FF" }
         :               { label:"Limited Alignment", color:"#DC2626", bg:"#FEE2E2" };
  }
  return { label:"Limited Alignment", color:"#DC2626", bg:"#FEE2E2" };
}

export default function RegulatoryAlignment() {
  const location = useLocation();
  const navigate = useNavigate();
  const raw = location.state?.data;
  const [selFw, setSelFw] = useState<string>("EU_AI_Act");
  const [anim, setAnim] = useState(false);
  useEffect(() => { setTimeout(() => setAnim(true), 100); }, []);

  if (!raw) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <button onClick={() => navigate("/dashboard")} style={{ padding:"10px 24px", background:M, border:"none", borderRadius:10, color:"white", fontWeight:700, cursor:"pointer" }}>← Back</button>
    </div>
  );

  const r = raw;
  const prn = r.trusted_ai_principles || {};
  const fw = r.framework_compliance || {};
  const _ = anim;

  // Principles mapped to selected framework
  const mappedPrinciples = Object.entries(prn).filter(([k]) => (PRINCIPLE_FRAMEWORK[k] || []).includes(selFw));
  // Sub-params mapped to selected framework
  const mappedParams: { principle: string; param: string; score: number }[] = [];
  Object.entries(prn).forEach(([principle, data]: [string, any]) => {
    Object.entries(data.parameters || {}).forEach(([param, score]) => {
      if ((PARAM_FRAMEWORK[param] || []).includes(selFw)) {
        mappedParams.push({ principle, param, score: score as number });
      }
    });
  });

  const fwMeta = FW_META[selFw] || { label: selFw, desc:"", focus:"", color:M, bg:"#EEF4FF" };
  const fwStatus = fw[selFw] || "Unknown";
  const fwScore = r.overall_score;
  const al = alignLabel(fwStatus, fwScore);

  return (
    <div style={{ minHeight:"100vh", background:"#F4F7FB", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#0F172A", paddingBottom:80 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0;}.ra-card{background:white;border-radius:16px;border:1px solid #E2E8F0;box-shadow:0 1px 4px rgba(0,0,0,0.05),0 4px 16px rgba(0,0,0,0.04);}`}</style>

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${B},${M})`, padding:"28px 36px 24px" }}>
        <div style={{ maxWidth:1160, margin:"0 auto" }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.5)", marginBottom:10 }}>Regulatory Alignment · {r.ai_name}</div>
          <h1 style={{ fontSize:24, fontWeight:900, color:"white", letterSpacing:"-0.4px" }}>Regulatory &amp; Framework Alignment</h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.65)", marginTop:6 }}>How this AI agent aligns with major governance frameworks — mapped to individual governance parameters</p>
        </div>
      </div>

      <div style={{ maxWidth:1160, margin:"0 auto", padding:"28px 24px", display:"grid", gridTemplateColumns:"220px 1fr", gap:20, alignItems:"start" }}>

        {/* Left nav */}
        <div className="ra-card" style={{ padding:"16px 12px", position:"sticky", top:24 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.7px", padding:"4px 8px", marginBottom:8 }}>Frameworks</div>
          {Object.entries(FW_META).map(([key, meta]) => {
            const status = fw[key] || "Unknown";
            const al2 = alignLabel(status, fwScore);
            return (
              <div key={key} onClick={() => setSelFw(key)}
                style={{ padding:"10px 12px", borderRadius:10, cursor:"pointer", marginBottom:4, background:selFw===key?meta.bg:"transparent", border:selFw===key?`1.5px solid ${meta.color}30`:"1.5px solid transparent", transition:"all 0.15s" }}
                onMouseEnter={e => { if(selFw!==key)(e.currentTarget as HTMLDivElement).style.background="#F8FAFC"; }}
                onMouseLeave={e => { if(selFw!==key)(e.currentTarget as HTMLDivElement).style.background="transparent"; }}
              >
                <div style={{ fontSize:12.5, fontWeight:700, color:selFw===key?meta.color:"#374151" }}>{meta.label}</div>
                <div style={{ fontSize:10, fontWeight:700, color:al2.color, marginTop:4 }}>{al2.label}</div>
              </div>
            );
          })}
          <div style={{ height:1, background:"#F1F5F9", margin:"12px 0" }}/>
          <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.7px", padding:"4px 8px", marginBottom:8 }}>Principles</div>
          {Object.keys(prn).map(k => (
            <div key={k} style={{ padding:"7px 12px", borderRadius:8, fontSize:11.5, fontWeight:500, color:"#64748B", cursor:"default" }}>
              {k}
              {(PRINCIPLE_FRAMEWORK[k]||[]).includes(selFw) && <span style={{ marginLeft:6, fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:10, background:fwMeta.bg, color:fwMeta.color }}>mapped</span>}
            </div>
          ))}
        </div>

        {/* Right content */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Framework card */}
          <div className="ra-card" style={{ padding:"28px 32px", borderTop:`4px solid ${fwMeta.color}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:16, marginBottom:20 }}>
              <div>
                <div style={{ fontSize:20, fontWeight:900, color:"#0F172A", marginBottom:4 }}>{fwMeta.label}</div>
                <div style={{ fontSize:13, color:"#64748B", marginBottom:8 }}>{fwMeta.desc}</div>
                <div style={{ fontSize:12, color:"#94A3B8", lineHeight:1.6, maxWidth:560 }}>{fwMeta.focus}</div>
              </div>
              <div style={{ textAlign:"center", padding:"16px 24px", borderRadius:14, background:al.bg, border:`1px solid ${al.color}30` }}>
                <div style={{ fontSize:28, fontWeight:900, color:al.color, lineHeight:1 }}>{fwScore}</div>
                <div style={{ fontSize:10, color:al.color, marginTop:4 }}>/ 100</div>
                <div style={{ fontSize:12, fontWeight:700, color:al.color, marginTop:8, padding:"3px 12px", borderRadius:20, background:"white", border:`1px solid ${al.color}30` }}>{al.label}</div>
              </div>
            </div>
            {/* Alignment bar */}
            <div style={{ marginBottom:8 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#94A3B8", marginBottom:6 }}>
                <span>Limited</span><span>Partial</span><span>High</span>
              </div>
              <div style={{ height:10, background:"#F1F5F9", borderRadius:99, overflow:"hidden" }}>
                <div style={{ width:`${fwScore}%`, height:"100%", background:`linear-gradient(90deg,${fwMeta.color}66,${fwMeta.color})`, borderRadius:99, transition:"width 1s ease" }}/>
              </div>
            </div>
          </div>

          {/* Mapped principles */}
          {mappedPrinciples.length > 0 && (
            <div className="ra-card" style={{ padding:"24px 28px" }}>
              <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:4 }}>Governance Principles Mapped to {fwMeta.label}</div>
              <div style={{ fontSize:12, color:"#94A3B8", marginBottom:18 }}>These principles directly address {fwMeta.label} requirements</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {mappedPrinciples.map(([k, data]: [string, any]) => (
                  <div key={k} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", borderRadius:12, background:"#F8FAFC", border:"1px solid #E2E8F0" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13.5, fontWeight:700, color:"#0F172A" }}>{k}</div>
                    </div>
                    <div style={{ width:160, height:6, background:"#E2E8F0", borderRadius:99, overflow:"hidden" }}>
                      <div style={{ width:`${data.score}%`, height:"100%", background:data.score>=75?"#059669":data.score>=50?M:"#DC2626", borderRadius:99, transition:"width 0.8s ease" }}/>
                    </div>
                    <div style={{ fontSize:14, fontWeight:900, color:data.score>=75?"#059669":data.score>=50?M:"#DC2626", minWidth:36, textAlign:"right" }}>{data.score}</div>
                    <div style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:6, background:data.score>=75?"#DCFCE7":data.score>=50?"#EEF4FF":"#FEE2E2", color:data.score>=75?"#059669":data.score>=50?M:"#DC2626", textTransform:"uppercase" as const }}>{data.score>=75?"Strong":data.score>=50?"Watch":"Critical"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mapped sub-parameters */}
          {mappedParams.length > 0 && (
            <div className="ra-card" style={{ padding:"24px 28px" }}>
              <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:4 }}>Sub-Parameters Mapped to {fwMeta.label}</div>
              <div style={{ fontSize:12, color:"#94A3B8", marginBottom:18 }}>Individual governance parameters that directly address {fwMeta.label} policy requirements</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:10 }}>
                {mappedParams.map((mp, i) => (
                  <div key={i} style={{ padding:"12px 14px", borderRadius:12, background:mp.score>=75?"#F0FDF4":mp.score>=50?"#EEF4FF":"#FEF2F2", border:`1px solid ${mp.score>=75?"#A7F3D0":mp.score>=50?"#C7D9F5":"#FECACA"}` }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.5px", marginBottom:4 }}>{mp.principle}</div>
                    <div style={{ fontSize:12.5, fontWeight:700, color:"#0F172A", marginBottom:8 }}>{mp.param}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ flex:1, height:5, background:"rgba(0,0,0,0.06)", borderRadius:99, overflow:"hidden" }}>
                        <div style={{ width:`${mp.score}%`, height:"100%", background:mp.score>=75?"#059669":mp.score>=50?M:"#DC2626", borderRadius:99 }}/>
                      </div>
                      <span style={{ fontSize:13, fontWeight:900, color:mp.score>=75?"#059669":mp.score>=50?M:"#DC2626" }}>{mp.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All frameworks summary */}
          <div className="ra-card" style={{ padding:"24px 28px" }}>
            <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:18 }}>All Framework Alignment Summary</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:14 }}>
              {Object.entries(FW_META).map(([key, meta]) => {
                const status = fw[key] || "Unknown";
                const al2 = alignLabel(status, fwScore);
                return (
                  <div key={key} onClick={() => setSelFw(key)} style={{ padding:"18px 20px", borderRadius:14, background:meta.bg, border:`1.5px solid ${meta.color}25`, cursor:"pointer", transition:"all 0.15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow=`0 6px 20px ${meta.color}18`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform="translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow="none"; }}
                  >
                    <div style={{ fontSize:13, fontWeight:800, color:meta.color, marginBottom:4 }}>{meta.label}</div>
                    <div style={{ fontSize:11, color:"#64748B", marginBottom:12, lineHeight:1.4 }}>{meta.desc}</div>
                    <div style={{ height:5, background:"rgba(0,0,0,0.08)", borderRadius:99, overflow:"hidden", marginBottom:8 }}>
                      <div style={{ width:`${fwScore}%`, height:"100%", background:meta.color, borderRadius:99 }}/>
                    </div>
                    <div style={{ fontSize:11, fontWeight:700, color:al2.color }}>{al2.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
