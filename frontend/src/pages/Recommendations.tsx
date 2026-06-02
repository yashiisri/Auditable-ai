/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const M = "#005EB8", B = "#00338D";
const sc = (s: number) => s >= 75 ? "#059669" : s >= 50 ? M : "#DC2626";
const sb = (s: number) => s >= 75 ? "#DCFCE7" : s >= 50 ? "#EEF4FF" : "#FEE2E2";
const band = (s: number) => s >= 75 ? "Strong" : s >= 50 ? "Watch" : "Critical";

const PRINCIPLE_RECS: Record<string, { icon: string; what: string; actions: string[]; priority: "High" | "Medium" | "Low" }> = {
  Fairness: {
    icon: "⚖",
    what: "Ensure the AI treats all demographic groups with equal quality, tone, and response length.",
    actions: [
      "Add demographic group labels to your inference logs to enable differential fairness testing.",
      "Run bias evaluation across protected attributes (gender, age, ethnicity) using your log data.",
      "Implement output length monitoring to detect unequal effort across user groups.",
      "Establish a quarterly fairness review process with documented findings.",
    ],
    priority: "High",
  },
  Transparency: {
    icon: "🔍",
    what: "Make the AI open about its knowledge boundaries, uncertainty, and reasoning process.",
    actions: [
      "Add model version tracking to every inference log record.",
      "Implement uncertainty disclosure — the AI should say 'I'm not sure' when it isn't.",
      "Ensure the AI addresses the specific question asked, not just related content.",
      "Log causal reasoning language rates to track whether the AI explains its conclusions.",
    ],
    priority: "Medium",
  },
  Explainability: {
    icon: "💡",
    what: "Ensure AI outputs can be understood, interpreted, and verified by non-technical users.",
    actions: [
      "Implement step-by-step reasoning in AI responses for complex decisions.",
      "Add source citation to AI outputs — especially for factual claims.",
      "Monitor Flesch readability scores to ensure outputs are accessible.",
      "Require confidence expression in all outputs so users can calibrate trust.",
    ],
    priority: "Medium",
  },
  Accountability: {
    icon: "📋",
    what: "Establish a clear, auditable chain of responsibility for every AI decision.",
    actions: [
      "Implement human escalation triggers for high-stakes or uncertain outputs.",
      "Add timestamp and user attribution columns to all inference logs.",
      "Ensure the AI acknowledges errors and provides guidance when it cannot answer.",
      "Document governance ownership and incident response procedures.",
    ],
    priority: "High",
  },
  "Data Integrity": {
    icon: "🗄",
    what: "Ensure the data used for evaluation is complete, consistent, and trustworthy.",
    actions: [
      "Remove duplicate records from inference logs before re-running the audit.",
      "Ensure all required columns (task_id, input, output, latency) are populated.",
      "Implement output format consistency checks in your AI pipeline.",
      "Add coherence scoring to detect incoherent or low-quality responses.",
    ],
    priority: "Medium",
  },
  Reliability: {
    icon: "⚙",
    what: "Ensure the AI performs consistently and predictably across all queries.",
    actions: [
      "Monitor response consistency — similar queries should produce similar answers.",
      "Implement token efficiency tracking to detect over- or under-answering.",
      "Add error rate monitoring to your observability stack.",
      "Run A/B consistency tests across model versions before deployment.",
    ],
    priority: "Medium",
  },
  Security: {
    icon: "🔒",
    what: "Protect the AI system against adversarial attacks, misuse, and data exposure.",
    actions: [
      "Implement prompt injection detection on all incoming requests.",
      "Add content moderation to filter harmful outputs before they reach users.",
      "Monitor input anomaly rates — empty or malformed inputs are a security signal.",
      "Implement PII scanning on all AI outputs before delivery.",
    ],
    priority: "High",
  },
  Privacy: {
    icon: "🛡",
    what: "Ensure the AI handles personal data responsibly and in compliance with GDPR.",
    actions: [
      "Implement PII detection and redaction in the AI output pipeline.",
      "Add data minimisation controls — the AI should not volunteer unnecessary information.",
      "Ensure the AI demonstrates awareness of data retention rights in relevant contexts.",
      "Anonymise all personal identifiers before they appear in AI outputs.",
    ],
    priority: "High",
  },
  Safety: {
    icon: "🛡",
    what: "Prevent the AI from generating harmful, dangerous, or misleading outputs.",
    actions: [
      "Implement the Triple LLM Judge panel for ongoing safety evaluation.",
      "Add hallucination detection — especially critical for medical, legal, or financial use cases.",
      "Ensure human override mechanisms are in place for all high-stakes decisions.",
      "Run regular red-team exercises to test safety controls under adversarial conditions.",
    ],
    priority: "High",
  },
  Sustainability: {
    icon: "🌱",
    what: "Optimise the AI for computational efficiency and minimal environmental impact.",
    actions: [
      "Monitor token economy — responses should be concise and information-dense.",
      "Implement response deduplication to avoid pattern-matching instead of reasoning.",
      "Reduce lexical complexity where possible — simpler language is faster to generate.",
      "Track and report compute costs per inference as part of your governance metrics.",
    ],
    priority: "Low",
  },
};

export default function Recommendations() {
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
  const prn = r.trusted_ai_principles || {};
  const pkeys = Object.keys(prn);
  const _ = anim;

  // Sort: critical first, then watch, then strong
  const sorted = [...pkeys].sort((a, b) => (prn[a]?.score || 0) - (prn[b]?.score || 0));

  // Overall recommendation text
  const highFindings = (r.findings || []).filter((f: any) => f.severity === "High").length;
  const weakCount = pkeys.filter(k => (prn[k]?.score || 0) < 60).length;
  const overallRec = r.overall_score >= 80 && highFindings === 0
    ? `${r.ai_name} demonstrates strong governance posture with an overall score of ${r.overall_score}/100. No high-severity findings were detected. Continue monitoring and schedule quarterly re-assessments to maintain compliance.`
    : highFindings > 0
    ? `${r.ai_name} has ${highFindings} high-severity finding(s) that require immediate remediation before production deployment. ${weakCount > 0 ? `Additionally, ${weakCount} principle(s) are critically low and need urgent attention.` : ""} Implement the recommended controls below and re-run the audit after remediation.`
    : r.overall_score >= 60
    ? `${r.ai_name} meets baseline governance requirements with a score of ${r.overall_score}/100. ${weakCount > 0 ? `Focus remediation on the ${weakCount} principle(s) scoring below 60.` : "Address the identified gaps within 60 days."} Re-assess to achieve full alignment with governance standards.`
    : `${r.ai_name} requires significant governance improvements before deployment. Score of ${r.overall_score}/100 indicates critical gaps. Engage your AI governance team to implement a structured remediation plan.`;

  return (
    <div style={{ minHeight:"100vh", background:"#F4F7FB", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#0F172A", paddingBottom:80 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0;}.rec-card{background:white;border-radius:16px;border:1px solid #E2E8F0;box-shadow:0 1px 4px rgba(0,0,0,0.05),0 4px 16px rgba(0,0,0,0.04);}`}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#00338D,#005EB8)", padding:"28px 36px 24px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize:"32px 32px", pointerEvents:"none" }}/>
        <div style={{ position:"relative", maxWidth:1160, margin:"0 auto" }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.5)", marginBottom:10 }}>Recommendations · {r.ai_name}</div>
          <h1 style={{ fontSize:24, fontWeight:900, color:"white", letterSpacing:"-0.4px", marginBottom:6 }}>Governance Recommendations</h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.65)" }}>Per-principle remediation guidance across all 10 Trusted AI dimensions</p>
        </div>
      </div>

      <div style={{ maxWidth:1160, margin:"0 auto", padding:"28px 24px" }}>

        {/* Overall recommendation */}
        <div className="rec-card" style={{ padding:"28px 32px", marginBottom:20, borderLeft:`4px solid ${r.overall_score>=75?"#059669":r.overall_score>=50?M:"#DC2626"}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"#EEF4FF", display:"grid", placeItems:"center", color:M }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:"#0F172A" }}>Overall Governance Recommendation</div>
              <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Based on audit results for {r.model_label || r.model_type}</div>
            </div>
            <div style={{ marginLeft:"auto", textAlign:"right" }}>
              <div style={{ fontSize:32, fontWeight:900, color:sc(r.overall_score), lineHeight:1 }}>{r.overall_score}</div>
              <div style={{ fontSize:10, color:"#94A3B8" }}>/ 100</div>
            </div>
          </div>
          <div style={{ padding:"16px 20px", background:`linear-gradient(135deg,${B}08,${M}05)`, border:`1.5px solid ${M}25`, borderRadius:14 }}>
            <p style={{ margin:0, color:"#1E293B", lineHeight:1.85, fontSize:14 }}>{overallRec}</p>
          </div>
          {/* Remediation timeline */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12, marginTop:16 }}>
            {[
              { label:"Immediate (0–30 days)",  items:sorted.filter(k=>(prn[k]?.score||0)<50).map(k=>k), color:"#DC2626", bg:"#FEE2E2" },
              { label:"Short-term (30–60 days)",items:sorted.filter(k=>(prn[k]?.score||0)>=50&&(prn[k]?.score||0)<75).map(k=>k), color:"#D97706", bg:"#FFF7ED" },
              { label:"Ongoing monitoring",     items:sorted.filter(k=>(prn[k]?.score||0)>=75).map(k=>k), color:"#059669", bg:"#DCFCE7" },
            ].map(t => (
              <div key={t.label} style={{ padding:"14px 16px", borderRadius:12, background:t.bg, border:`1px solid ${t.color}25` }}>
                <div style={{ fontSize:10, fontWeight:700, color:t.color, textTransform:"uppercase" as const, letterSpacing:"0.6px", marginBottom:8 }}>{t.label}</div>
                {t.items.length === 0
                  ? <div style={{ fontSize:11, color:"#94A3B8" }}>None</div>
                  : t.items.map(k => <div key={k} style={{ fontSize:11.5, fontWeight:600, color:t.color, marginBottom:3 }}>• {k}</div>)
                }
              </div>
            ))}
          </div>
        </div>

        {/* Per-principle recommendations */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {sorted.map(k => {
            const score = prn[k]?.score || 0;
            const rec = PRINCIPLE_RECS[k];
            const isOpen = expanded === k;
            const priorityColor = score < 50 ? "#DC2626" : score < 75 ? "#D97706" : "#059669";
            const priorityBg    = score < 50 ? "#FEE2E2" : score < 75 ? "#FFF7ED" : "#DCFCE7";
            const priorityLabel = score < 50 ? "Critical" : score < 75 ? "Watch" : "Strong";

            return (
              <div key={k} className="rec-card" style={{ overflow:"hidden", borderLeft:`4px solid ${sc(score)}` }}>
                {/* Header row */}
                <div style={{ padding:"16px 20px", display:"flex", alignItems:"center", gap:14, cursor:"pointer" }}
                  onClick={() => setExpanded(isOpen ? null : k)}>
                  <div style={{ width:36, height:36, borderRadius:10, background:sb(score), display:"grid", placeItems:"center", fontSize:18, flexShrink:0 }}>
                    {rec?.icon || "◈"}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14.5, fontWeight:800, color:"#0F172A" }}>{k}</div>
                    {rec && <div style={{ fontSize:12, color:"#64748B", marginTop:2, lineHeight:1.4 }}>{rec.what}</div>}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:24, fontWeight:900, color:sc(score), lineHeight:1 }}>{score}</div>
                      <div style={{ fontSize:9, color:sc(score), fontWeight:700 }}>/ 100</div>
                    </div>
                    <div style={{ padding:"4px 10px", borderRadius:20, background:priorityBg, color:priorityColor, fontSize:11, fontWeight:700 }}>{priorityLabel}</div>
                    <div style={{ width:28, height:28, borderRadius:"50%", background:"#F1F5F9", display:"grid", placeItems:"center", fontSize:12, color:"#94A3B8", transition:"transform 0.2s", transform:isOpen?"rotate(180deg)":"none" }}>▾</div>
                  </div>
                </div>

                {/* Score bar */}
                <div style={{ padding:"0 20px 12px" }}>
                  <div style={{ height:5, background:"#F1F5F9", borderRadius:99, overflow:"hidden" }}>
                    <div style={{ width:`${score}%`, height:"100%", background:`linear-gradient(90deg,${sc(score)}88,${sc(score)})`, borderRadius:99, transition:"width 0.8s ease" }}/>
                  </div>
                </div>

                {/* Expanded actions */}
                {isOpen && rec && (
                  <div style={{ padding:"0 20px 20px", borderTop:"1px solid #F1F5F9" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.7px", margin:"16px 0 12px" }}>Recommended Actions</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {rec.actions.map((action, i) => (
                        <div key={i} style={{ display:"flex", gap:12, padding:"12px 14px", borderRadius:10, background:"#F8FAFC", border:"1px solid #E2E8F0" }}>
                          <div style={{ width:22, height:22, borderRadius:"50%", background:sb(score), color:sc(score), display:"grid", placeItems:"center", fontSize:11, fontWeight:800, flexShrink:0 }}>{i+1}</div>
                          <div style={{ fontSize:13, color:"#374151", lineHeight:1.65 }}>{action}</div>
                        </div>
                      ))}
                    </div>
                    {/* Sub-parameter breakdown */}
                    {prn[k]?.parameters && Object.keys(prn[k].parameters).length > 0 && (
                      <div style={{ marginTop:16 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.7px", marginBottom:10 }}>Sub-parameter Scores</div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:8 }}>
                          {Object.entries(prn[k].parameters).map(([param, val]: any) => (
                            <div key={param} style={{ padding:"10px 12px", borderRadius:10, background:sb(val), border:`1px solid ${sc(val)}18` }}>
                              <div style={{ fontSize:11, fontWeight:700, color:"#0F172A", marginBottom:5 }}>{param}</div>
                              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <div style={{ flex:1, height:4, background:"rgba(0,0,0,0.08)", borderRadius:99 }}>
                                  <div style={{ width:`${val}%`, height:"100%", borderRadius:99, background:sc(val) }}/>
                                </div>
                                <span style={{ fontSize:13, fontWeight:800, color:sc(val), flexShrink:0 }}>{val}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
