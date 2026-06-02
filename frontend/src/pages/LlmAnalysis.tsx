/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const M = "#005EB8";

export default function LlmAnalysis() {
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
  const llm = r.llm_judge;
  void anim;

  if (!llm) return (
    <div style={{ minHeight:"100vh", background:"#F4F7FB", fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
      <div style={{ fontSize:16, color:"#64748B" }}>No LLM Judge data available for this audit.</div>
      <button onClick={() => navigate(-1)} style={{ padding:"10px 24px", background:M, border:"none", borderRadius:10, color:"white", fontWeight:700, cursor:"pointer" }}>← Back</button>
    </div>
  );

  const accuracyPct = llm.accuracy != null ? Math.round(llm.accuracy * 100) : null;
  const hasError    = !!llm.error;
  const ac = accuracyPct != null ? (accuracyPct >= 80 ? "#059669" : accuracyPct >= 60 ? M : "#DC2626") : "#94A3B8";
  const ab = accuracyPct != null ? (accuracyPct >= 80 ? "#DCFCE7" : accuracyPct >= 60 ? "#EEF4FF" : "#FEE2E2") : "#F8FAFC";
  const panelSize  = llm.panel_size ?? (llm.judge_panel?.length ?? (llm.rows_judged > 0 ? 3 : 0));
  const kbCount    = llm.kb_chunks_count ?? llm.kb_chunks_used ?? 0;
  const kbGrounded = llm.kb_grounded ?? (kbCount > 0);
  const disputed   = llm.disputed_rows?.length ?? 0;
  const confs      = llm.confidence ?? [];
  const nHigh      = confs.filter((c: string) => c === "high").length;
  const nMed       = confs.filter((c: string) => c === "medium").length;
  const nLow       = confs.filter((c: string) => c === "low").length;
  const kbUsed     = (llm.kb_used ?? []).filter(Boolean).length;

  const interp = () => {
    if (hasError) return { label:"Unavailable", desc: llm.error || "LLM judge could not be run." };
    if (accuracyPct == null) return { label:"Not Computed", desc:"No accuracy data returned." };
    if (accuracyPct >= 90) return { label:"Excellent", desc:`${accuracyPct}% of responses judged correct by majority vote${kbGrounded?", grounded against your knowledge base":""}. Highly accurate and reliable.` };
    if (accuracyPct >= 75) return { label:"Good", desc:`${accuracyPct}% accuracy. Around ${100-accuracyPct}% of responses had factual issues. Review incorrect rows to identify failure patterns.` };
    if (accuracyPct >= 60) return { label:"Moderate", desc:`${accuracyPct}% accuracy. ${100-accuracyPct}% of responses judged incorrect. Review system prompts and retrieval quality.` };
    return { label:"Low", desc:`${accuracyPct}% accuracy is below acceptable thresholds. Immediate remediation recommended before production deployment.` };
  };
  const ip = interp();

  return (
    <div style={{ minHeight:"100vh", background:"#F4F7FB", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#0F172A", paddingBottom:80 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0;}.la-card{background:white;border-radius:16px;border:1px solid #E2E8F0;box-shadow:0 1px 4px rgba(0,0,0,0.05),0 4px 16px rgba(0,0,0,0.04);}`}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#00338D,#005EB8)", padding:"28px 36px 24px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize:"32px 32px", pointerEvents:"none" }}/>
        <div style={{ position:"relative", maxWidth:1160, margin:"0 auto" }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.5)", marginBottom:10 }}>LLM Analysis · {r.ai_name}</div>
          <h1 style={{ fontSize:24, fontWeight:900, color:"white", letterSpacing:"-0.4px", marginBottom:6 }}>Triple-Judge LLM Analysis</h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.65)" }}>Three independent AI judges evaluate every response — majority vote determines the verdict</p>
        </div>
      </div>

      <div style={{ maxWidth:1160, margin:"0 auto", padding:"28px 24px" }}>

        {/* Accuracy hero */}
        <div className="la-card" style={{ padding:"32px", marginBottom:20 }}>
          <div style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:28, alignItems:"start" }}>
            <div style={{ padding:"28px 36px", borderRadius:20, background:ab, border:`1.5px solid ${ac}30`, textAlign:"center", minWidth:160 }}>
              <div style={{ fontSize:11, fontWeight:700, color:ac, textTransform:"uppercase" as const, letterSpacing:"0.1em", marginBottom:8 }}>Majority Vote Accuracy</div>
              <div style={{ fontSize:60, fontWeight:900, color:ac, lineHeight:1, letterSpacing:"-0.04em" }}>{accuracyPct != null ? `${accuracyPct}%` : "—"}</div>
              <div style={{ marginTop:10, padding:"5px 16px", borderRadius:20, background:"white", border:`1px solid ${ac}30`, display:"inline-block" }}>
                <span style={{ fontSize:12, fontWeight:700, color:ac }}>{ip.label}</span>
              </div>
              <div style={{ marginTop:8, fontSize:11, color:"#64748B" }}>correct ÷ (judged − disputed)</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ padding:"16px 18px", borderRadius:14, background:ab, border:`1px solid ${ac}20`, fontSize:13.5, color:"#1E293B", lineHeight:1.75 }}>{ip.desc}</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:10 }}>
                {[
                  { label:"Rows Judged",   val:String(llm.rows_judged),  color:M,        bg:"#EEF4FF" },
                  { label:"Skipped",       val:String(llm.rows_skipped), color:llm.rows_skipped>0?"#DC2626":"#059669", bg:llm.rows_skipped>0?"#FEE2E2":"#DCFCE7" },
                  { label:"Disputed",      val:String(disputed),         color:disputed>0?"#D97706":"#059669", bg:disputed>0?"#FFF7ED":"#DCFCE7" },
                  { label:"KB-Grounded",   val:String(kbUsed),           color:kbUsed>0?"#059669":"#94A3B8", bg:kbUsed>0?"#DCFCE7":"#F8FAFC" },
                  { label:"Active Judges", val:String(panelSize>0?panelSize:llm.rows_judged>0?3:0), color:"#7C3AED", bg:"#F3E8FF" },
                ].map(item => (
                  <div key={item.label} style={{ padding:"12px 14px", borderRadius:12, background:item.bg, textAlign:"center" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:item.color, textTransform:"uppercase" as const, letterSpacing:"0.06em", marginBottom:5 }}>{item.label}</div>
                    <div style={{ fontSize:20, fontWeight:900, color:item.color }}>{item.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Accuracy gauge */}
        {accuracyPct != null && (
          <div className="la-card" style={{ padding:"24px 28px", marginBottom:20 }}>
            <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:16 }}>Accuracy Gauge</div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#94A3B8", marginBottom:6, fontWeight:500 }}>
              <span>0%</span><span style={{ color:"#DC2626" }}>Poor (&lt;60%)</span><span style={{ color:M }}>Moderate (60–80%)</span><span style={{ color:"#059669" }}>Good (80%+)</span><span>100%</span>
            </div>
            <div style={{ height:14, background:"linear-gradient(90deg,#FEE2E2 0%,#FEE2E2 60%,#EEF4FF 60%,#EEF4FF 80%,#DCFCE7 80%,#DCFCE7 100%)", borderRadius:99, position:"relative", border:"1px solid #E2E8F0" }}>
              <div style={{ position:"absolute", left:`${Math.min(accuracyPct,98)}%`, top:"50%", transform:"translate(-50%,-50%)", width:22, height:22, background:ac, borderRadius:"50%", border:"3px solid white", boxShadow:`0 0 0 2px ${ac}`, transition:"left 0.8s ease" }}/>
            </div>
            <div style={{ textAlign:"center", marginTop:10, fontSize:13, fontWeight:700, color:ac }}>
              {r.model_label||r.model_type} scored {accuracyPct}% — industry benchmark: 85%+ general, 90%+ domain-specific
            </div>
          </div>
        )}

        {/* Judge panel */}
        <div className="la-card" style={{ padding:"24px 28px", marginBottom:20 }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:4 }}>The Panel — {panelSize > 0 ? panelSize : llm.rows_judged > 0 ? 3 : 0} Active Judges</div>
          <div style={{ fontSize:12, color:"#94A3B8", marginBottom:18 }}>Three architecturally different models from three different providers — cross-provider independence</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12 }}>
            {[
              { name:"Judge 1", color:"#7C3AED", bg:"#F3E8FF", specialty:"Broad factual knowledge, structured output" },
              { name:"Judge 2", color:"#0091DA", bg:"#E0F2FE", specialty:"Reasoning, code, European-domain knowledge" },
              { name:"Judge 3", color:"#059669", bg:"#DCFCE7", specialty:"Scientific, technical, multilingual domains" },
            ].map((j, idx) => {
              const active = panelSize > 0 ? idx < panelSize : llm.rows_judged > 0;
              return (
                <div key={j.name} style={{ padding:"16px", borderRadius:14, background:active?j.bg:"#F8FAFC", border:`1.5px solid ${active?j.color:"#E2E8F0"}30`, opacity:active?1:0.45 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:active?j.color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.07em" }}>{j.name}</span>
                    <span style={{ fontSize:10, padding:"2px 8px", borderRadius:99, background:active?j.color:"#94A3B8", color:"white", fontWeight:700 }}>{active?"Active":"Offline"}</span>
                  </div>
                  <div style={{ fontSize:11, color:"#475569", lineHeight:1.5, fontStyle:"italic" }}>{j.specialty}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Evaluation workflow */}
        <div className="la-card" style={{ padding:"24px 28px", marginBottom:20 }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:18 }}>Evaluation Workflow — Per Log Row</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:0, border:"1px solid #E2E8F0", borderRadius:14, overflow:"hidden" }}>
            {[
              { step:"1A", title:"KB Lookup",      subtitle:kbGrounded?"Used this audit":"Not used — no KB provided", color:kbGrounded?"#059669":"#94A3B8", bg:kbGrounded?"#DCFCE7":"#F8FAFC", desc:"Question matched against knowledge base using Jaccard similarity (≥ 0.12). If found, KB chunk becomes the ground-truth reference." },
              { step:"1B", title:"LLM Generation", subtitle:kbGrounded?"Skipped (KB used)":"Used this audit",         color:kbGrounded?"#94A3B8":M,         bg:kbGrounded?"#F8FAFC":"#EEF4FF", desc:"All 3 judges independently generate a reference answer. Their answers are compared for agreement (Jaccard ≥ 0.15) to form a consensus reference." },
              { step:"2",  title:"Majority Vote",  subtitle:"Always runs",                                             color:"#7C3AED",                       bg:"#F3E8FF",                      desc:"All 3 judges vote: is the AI's logged output CORRECT vs the reference? ≥ 2/3 = verdict. 3/3 = High confidence. 2/3 = Medium. Tied = Disputed, excluded." },
            ].map((s, i) => (
              <div key={s.step} style={{ padding:"16px 18px", background:s.bg, borderRight:i<2?"1px solid #E2E8F0":"none" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:s.color, textTransform:"uppercase" as const, letterSpacing:"0.07em" }}>Stage {s.step}</div>
                    <div style={{ fontWeight:700, fontSize:13, color:"#1E293B" }}>{s.title}</div>
                  </div>
                  <span style={{ marginLeft:"auto", fontSize:10, padding:"2px 8px", borderRadius:99, background:s.color, color:"white", fontWeight:700, whiteSpace:"nowrap" as const }}>{s.subtitle}</span>
                </div>
                <p style={{ margin:0, fontSize:12, color:"#475569", lineHeight:1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Confidence breakdown */}
        {confs.length > 0 && (
          <div className="la-card" style={{ padding:"24px 28px", marginBottom:20 }}>
            <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:18 }}>Verdict Confidence Breakdown</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
              {[
                { label:"High Confidence",  count:nHigh, color:"#059669", bg:"#DCFCE7", vote:"3/3 unanimous",  tip:"All judges agreed — most reliable verdicts" },
                { label:"Medium Confidence",count:nMed,  color:"#D97706", bg:"#FFF7ED", vote:"2/3 majority",   tip:"Two judges agreed — solid but review dissent" },
                { label:"Low / Disputed",   count:nLow+disputed, color:"#DC2626", bg:"#FEE2E2", vote:"Split/tied", tip:"Judges disagreed — excluded from accuracy" },
              ].map(c => {
                const pct = confs.length > 0 ? Math.round((c.count/confs.length)*100) : 0;
                return (
                  <div key={c.label} style={{ padding:"16px", borderRadius:14, background:c.bg, border:`1px solid ${c.color}30` }}>
                    <div style={{ fontSize:10, fontWeight:700, color:c.color, textTransform:"uppercase" as const, letterSpacing:"0.06em", marginBottom:6 }}>{c.label}</div>
                    <div style={{ fontSize:28, fontWeight:900, color:c.color, marginBottom:2 }}>{c.count}</div>
                    <div style={{ fontSize:11, color:"#64748B", marginBottom:8 }}>rows ({pct}%) · {c.vote}</div>
                    <div style={{ height:6, background:"white", borderRadius:99, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:c.color, borderRadius:99, transition:"width 0.8s ease" }}/>
                    </div>
                    <div style={{ fontSize:11, color:"#94A3B8", marginTop:6, fontStyle:"italic" }}>{c.tip}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Methodology */}
        <div className="la-card" style={{ padding:"24px 28px" }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:16 }}>Methodology</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, fontSize:13, color:"#475569", lineHeight:1.6 }}>
            <div><div style={{ fontWeight:600, color:"#1E293B", marginBottom:4 }}>Reference Source</div>
              <div>{kbGrounded?`Knowledge base (${kbCount} chunks) — Jaccard similarity retrieval at ≥ 0.12 threshold`:"LLM panel consensus — judges generate and cross-validate reference answers (Jaccard ≥ 0.15)"}</div></div>
            <div><div style={{ fontWeight:600, color:"#1E293B", marginBottom:4 }}>Verdict Rule</div>
              <div>Majority vote (≥ 2 of {panelSize>0?panelSize:3} judges). 3/3 = High confidence. 2/3 = Medium. Tie = Disputed &amp; excluded.</div></div>
            <div><div style={{ fontWeight:600, color:"#1E293B", marginBottom:4 }}>Accuracy Formula</div>
              <div style={{ fontFamily:"monospace", background:"#F8FAFC", padding:"6px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, display:"inline-block" }}>correct_rows ÷ (judged_rows − disputed_rows)</div></div>
            <div><div style={{ fontWeight:600, color:"#1E293B", marginBottom:4 }}>Parallelism</div>
              <div>All three judges run concurrently via ThreadPoolExecutor — no sequential bottleneck.</div></div>
          </div>
          {(llm.warnings??[]).length > 0 && (
            <div style={{ marginTop:16, padding:"14px 16px", borderRadius:12, background:"#FFF7ED", border:"1px solid #FED7AA" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#D97706", textTransform:"uppercase" as const, letterSpacing:"0.07em", marginBottom:8 }}>Evaluation Warnings</div>
              {(llm.warnings??[]).map((w: string, i: number) => (
                <div key={i} style={{ fontSize:12, color:"#92400E", lineHeight:1.6, marginBottom:4 }}>• {w}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
