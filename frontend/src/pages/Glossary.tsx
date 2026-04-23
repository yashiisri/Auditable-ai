import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/* ─── hooks ─────────────────────────────────────────────────────────────── */
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const o = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setV(true); o.disconnect(); } },
      { threshold }
    );
    o.observe(el); return () => o.disconnect();
  }, [threshold]);
  return { ref, v };
}

function useMouseParallax() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const h = (e: MouseEvent) => setPos({
      x: (e.clientX / window.innerWidth - 0.5) * 2,
      y: (e.clientY / window.innerHeight - 0.5) * 2,
    });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);
  return pos;
}

function useTypewriter(words: string[], speed = 75, pause = 2000) {
  const [display, setDisplay] = useState("");
  const [wi, setWi] = useState(0);
  const [ci, setCi] = useState(0);
  const [del, setDel] = useState(false);
  useEffect(() => {
    const word = words[wi];
    const delay = del ? speed / 2 : ci === word.length ? pause : speed;
    const t = setTimeout(() => {
      if (!del && ci < word.length) { setDisplay(word.slice(0, ci + 1)); setCi(c => c + 1); }
      else if (!del && ci === word.length) setDel(true);
      else if (del && ci > 0) { setDisplay(word.slice(0, ci - 1)); setCi(c => c - 1); }
      else { setDel(false); setWi(w => (w + 1) % words.length); }
    }, delay);
    return () => clearTimeout(t);
  }, [wi, ci, del, words, speed, pause]);
  return display;
}

/* ─── animated primitives ───────────────────────────────────────────────── */
function Reveal({ children, delay = 0, from = "bottom" }: {
  children: React.ReactNode; delay?: number; from?: "bottom" | "left" | "right";
}) {
  const { ref, v } = useInView();
  const t: Record<string, string> = {
    bottom: "translateY(52px)", left: "translateX(-52px)", right: "translateX(52px)",
  };
  return (
    <div ref={ref} style={{
      opacity: v ? 1 : 0,
      transform: v ? "none" : t[from],
      transition: `opacity 0.85s cubic-bezier(.16,1,.3,1) ${delay}s, transform 0.85s cubic-bezier(.16,1,.3,1) ${delay}s`,
    }}>{children}</div>
  );
}



/* ─── data ──────────────────────────────────────────────────────────────── */
const MARQUEE = [
  "Transparency","Explainability","Fairness","Accountability","Data Integrity",
  "Reliability","Security","Privacy","Sustainability","Safety",
  "SDCC Pipeline","LLM Judge Panel","Black Box Audit","TAF Score","BERTScore",
  "Hallucination Rate","Auto Model Detection","PDF Audit Report","Risk Analysis",
];

const STEPS = [
  {
    num: "01", color: "#00338D",
    title: "Register & Log In",
    desc: "Create your organisation account and log in securely. Every workspace is isolated, encrypted, and scoped to your team. Your audit history, AI registrations, and reports are all stored privately under your account.",
  },
  {
    num: "02", color: "#005EB8",
    title: "Register Your AI System",
    desc: "Give your AI system a name and submit it for registration. Our multi-signal detector automatically identifies the model type — General LLM, RAG Pipeline, Classification Model, Image CV, Summarisation, or Automation Agent — with a confidence score.",
  },
  {
    num: "03", color: "#0091DA",
    title: "Upload Inference Logs",
    desc: "Upload a CSV of your AI's real production inference logs. We accept any schema — our parser automatically maps columns like input, output, latency, task_id, and more. No preprocessing required.",
  },
  {
    num: "04", color: "#00A3A1",
    title: "Black Box API Testing",
    desc: "Connect your AI via API endpoint + key, or a deployed UI URL. Governance probes are fired automatically and responses are ingested into the SDCC pipeline. Optionally upload a Knowledge Base to ground the evaluation against your own reference material.",
  },
  {
    num: "05", color: "#005EB8",
    title: "SDCC Quality Pipeline",
    desc: "The Structural & Data Completeness Check (SDCC) runs automatically on your logs — whether uploaded manually or ingested from Black Box probes. It scores your data across 12 quality dimensions — column coverage, completeness, latency distribution, output variance, and more — before any evaluation begins.",
  },
  {
    num: "06", color: "#00338D",
    title: "Triple LLM Judge Panel",
    desc: "Three independent LLM judges from different providers — Groq (Llama 3.3), OpenRouter (Mistral Large), and Together AI (Qwen 2.5) — each evaluate every AI response for factual accuracy. A majority vote determines the verdict. This cross-provider approach eliminates single-model bias.",
  },
  {
    num: "07", color: "#0091DA",
    title: "TAF Score & Full Report",
    desc: "Receive a complete KPMG Trusted AI Framework report. 10 principles scored 0–100, an overall governance rating, risk level classification, per-principle breakdowns with remediation steps, and a boardroom-ready downloadable PDF.",
  },
];

const PRINCIPLES = [
  { name: "Transparency",   color: "#005EB8", desc: "How openly the AI communicates its reasoning and limitations." },
  { name: "Explainability", color: "#0091DA", desc: "Whether AI decisions can be understood and justified by humans." },
  { name: "Fairness",       color: "#00A3A1", desc: "Freedom from bias and unequal treatment across user groups." },
  { name: "Accountability", color: "#00338D", desc: "Clear, auditable chain of responsibility for AI decisions." },
  { name: "Data Integrity", color: "#005EB8", desc: "Quality and completeness of data used for training and inference." },
  { name: "Reliability",    color: "#0091DA", desc: "Consistent, predictable performance across varied conditions." },
  { name: "Security",       color: "#00A3A1", desc: "Resilience against adversarial attacks and prompt injection." },
  { name: "Privacy",        color: "#00338D", desc: "Responsible handling of personal data in line with regulations." },
  { name: "Sustainability", color: "#005EB8", desc: "Environmental and compute footprint of the AI system." },
  { name: "Safety",         color: "#0091DA", desc: "Avoidance of harmful, misleading, or toxic outputs." },
];

const FEATURES = [
  { accent: "#00338D", title: "Auto Model Detection",    desc: "Automatically identifies your AI type from logs — LLM, RAG, Classification, Image CV, Summarisation, or Automation." },
  { accent: "#005EB8", title: "Black Box API Audit",     desc: "Provide an API endpoint + key, or a deployed UI URL — probes are fired and responses auto-ingested into the SDCC pipeline." },
  { accent: "#0091DA", title: "20+ Computed Metrics",    desc: "BLEU, ROUGE, BERTScore, latency percentiles, hallucination rate — computed live from your logs." },
  { accent: "#00A3A1", title: "Per-Principle Breakdown", desc: "Each TAF principle comes with a score, the sub-parameters behind it, and specific remediation steps." },
  { accent: "#005EB8", title: "Boardroom-Ready PDF",     desc: "Export a polished audit report with charts, risk analysis, and compliance mapping — ready to share." },
];

const FRAMEWORKS = [
  { name: "EU AI Act",   color: "#005EB8", desc: "The EU's binding regulation for high-risk AI systems — your TAF scores map directly to its technical requirements." },
  { name: "ISO 42001",   color: "#00A3A1", desc: "The international standard for AI management systems — your report shows readiness against ISO 42001 controls." },
  { name: "NIST AI RMF", color: "#0091DA", desc: "The US AI Risk Management Framework — your scores are aligned to its Govern, Map, Measure, and Manage functions." },
  { name: "KPMG TAF",    color: "#00338D", desc: "KPMG's Trusted AI Framework — 10 principles, one score, the backbone of every Auditable AI report." },
];

const GLOSSARY_TERMS = [
  { term: "SDCC",                def: "Structural & Data Completeness Check — scores your inference logs across 12 quality dimensions before evaluation begins." },
  { term: "TAF Score",           def: "A 0–100 composite governance rating across 10 KPMG principles. Above 75 = Low Risk. 50–74 = Medium. Below 50 = High Risk." },
  { term: "LLM Judge",           def: "A panel of three LLMs from different providers that vote on each AI response's accuracy. Majority vote determines the verdict." },
  { term: "Inference Logs",      def: "A CSV of your AI's real production data — inputs, outputs, latency, task IDs. The raw evidence your audit is built on." },
  { term: "Black Box Audit",     def: "An audit via API endpoint + key, or a deployed UI URL — no model access needed. Probes are fired and responses auto-ingested into the SDCC pipeline." },
  { term: "Knowledge Base",      def: "PDFs, docs, or text files you upload to ground the LLM Judge against your own reference material — improves accuracy scoring for RAG and domain-specific systems." },
  { term: "Adversarial Probe",   def: "A crafted test input designed to expose AI weaknesses — bias, hallucination, prompt injection, refusal gaps, and more." },
  { term: "Risk Level",          def: "Low (75–100), Medium (50–74), or High (0–49) — based on your TAF Score. Determines urgency of remediation." },
  { term: "Hallucination Rate",  def: "The share of AI responses containing fabricated or unsupported information, as judged by the LLM panel." },
  { term: "BERTScore",           def: "A semantic similarity metric using contextual embeddings — captures meaning, not just word overlap." },
  { term: "BLEU / ROUGE",        def: "Classic NLP metrics measuring n-gram overlap between AI outputs and reference answers." },
  { term: "Auto Model Detection",def: "ML classifier that identifies your AI system type from log patterns — no manual tagging needed." },
  { term: "Remediation Step",    def: "A specific, actionable fix generated for each TAF principle where your AI scored below threshold." },
];

/* ─── CSS ───────────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{background:#fff;}
.gl{font-family:'Plus Jakarta Sans',sans-serif;background:#fff;color:#0B1F33;overflow-x:hidden;}

/* ── NAV ── */
.gl-nav{position:fixed;top:0;left:0;right:0;z-index:300;height:70px;display:flex;align-items:center;justify-content:space-between;padding:0 56px;transition:background 0.4s,box-shadow 0.4s,border-color 0.4s;}
.gl-nav.scrolled{background:rgba(255,255,255,0.96);backdrop-filter:blur(24px);border-bottom:1px solid rgba(0,51,141,0.07);box-shadow:0 4px 40px rgba(0,51,141,0.06);}
.gl-nav-brand{display:flex;align-items:center;gap:12px;cursor:pointer;}
.gl-nav-brand img{height:40px;}
.gl-nav-brand-text{display:flex;flex-direction:column;line-height:1.1;}
.gl-nav-brand-name{font-size:16px;font-weight:800;color:#00338D;letter-spacing:-0.3px;}
.gl-nav-brand-sub{font-size:10px;font-weight:600;color:#A0B4CC;letter-spacing:1.2px;text-transform:uppercase;}
.gl-nav-center{display:flex;align-items:center;gap:2px;}
.gl-nav-link{padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600;color:#5A6A7A;cursor:pointer;border:none;background:transparent;transition:color 0.2s;font-family:inherit;position:relative;}
.gl-nav-link::after{content:'';position:absolute;bottom:3px;left:50%;right:50%;height:2px;background:#005EB8;border-radius:2px;transition:left 0.25s,right 0.25s;}
.gl-nav-link:hover{color:#005EB8;}
.gl-nav-link:hover::after,.gl-nav-link.active::after{left:14px;right:14px;}
.gl-nav-link.active{color:#005EB8;}
.gl-nav-right{display:flex;align-items:center;gap:10px;}
.gl-nav-ghost{padding:9px 20px;border-radius:9px;font-size:13px;font-weight:700;color:#00338D;cursor:pointer;border:1.5px solid #C7D9F5;background:transparent;transition:all 0.2s;font-family:inherit;}
.gl-nav-ghost:hover{background:#EEF4FF;border-color:#005EB8;}
.gl-nav-cta{padding:10px 22px;border-radius:10px;font-size:13px;font-weight:700;color:#fff;cursor:pointer;border:none;background:linear-gradient(135deg,#00338D,#005EB8);transition:all 0.25s;font-family:inherit;box-shadow:0 4px 16px rgba(0,51,141,0.24);}
.gl-nav-cta:hover{transform:translateY(-1px);box-shadow:0 8px 28px rgba(0,51,141,0.34);}

/* ── HERO ── */
.gl-hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:110px 60px 80px;position:relative;overflow:hidden;text-align:center;background:#fff;}
.gl-hero-mesh{position:absolute;inset:0;background:radial-gradient(ellipse 90% 65% at 50% -5%,rgba(0,94,184,0.07) 0%,transparent 65%),radial-gradient(ellipse 55% 45% at 92% 85%,rgba(0,163,161,0.07) 0%,transparent 60%),radial-gradient(ellipse 45% 40% at 8% 88%,rgba(0,145,218,0.06) 0%,transparent 55%);pointer-events:none;}
.gl-hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(0,51,141,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(0,51,141,0.035) 1px,transparent 1px);background-size:64px 64px;pointer-events:none;mask-image:radial-gradient(ellipse 85% 85% at 50% 50%,black 20%,transparent 100%);}
.gl-hero-pill{display:inline-flex;align-items:center;gap:9px;background:linear-gradient(135deg,#EEF4FF,#E6F7F7);border:1px solid rgba(0,94,184,0.18);color:#00338D;font-size:11.5px;font-weight:700;padding:7px 18px;border-radius:100px;margin-bottom:34px;letter-spacing:1px;text-transform:uppercase;animation:hfu 0.8s cubic-bezier(.16,1,.3,1) both;}
.gl-hero-pill-dot{width:7px;height:7px;border-radius:50%;background:linear-gradient(135deg,#005EB8,#00A3A1);animation:pulse 2.2s ease-in-out infinite;}
@keyframes pulse{0%,100%{transform:scale(1);opacity:1;}50%{transform:scale(1.5);opacity:0.5;}}
.gl-hero-h1{font-size:clamp(44px,6.5vw,82px);font-weight:900;line-height:1.03;color:#00338D;letter-spacing:-3px;margin-bottom:6px;animation:hfu 0.9s cubic-bezier(.16,1,.3,1) 0.08s both;}
.gl-hero-h1-grad{font-size:clamp(44px,6.5vw,82px);font-weight:900;line-height:1.03;letter-spacing:-3px;margin-bottom:30px;animation:hfu 0.9s cubic-bezier(.16,1,.3,1) 0.16s both;background:linear-gradient(135deg,#005EB8 0%,#0091DA 45%,#00A3A1 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.gl-hero-sub{font-size:clamp(15px,1.8vw,19px);font-weight:400;color:#4A6080;max-width:660px;line-height:1.8;margin-bottom:50px;animation:hfu 0.9s cubic-bezier(.16,1,.3,1) 0.24s both;}
.gl-hero-tw{color:#0091DA;border-right:2.5px solid #0091DA;padding-right:3px;animation:blink 1s step-end infinite;}
@keyframes blink{0%,100%{border-color:#0091DA;}50%{border-color:transparent;}}
.gl-hero-btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;animation:hfu 0.9s cubic-bezier(.16,1,.3,1) 0.32s both;}
.gl-btn-p{padding:16px 36px;border-radius:14px;font-size:15px;font-weight:700;color:#fff;cursor:pointer;border:none;background:linear-gradient(135deg,#00338D,#005EB8);box-shadow:0 8px 28px rgba(0,51,141,0.28);transition:all 0.3s;font-family:inherit;}
.gl-btn-p:hover{transform:translateY(-3px);box-shadow:0 18px 44px rgba(0,51,141,0.36);}
.gl-btn-s{padding:16px 36px;border-radius:14px;font-size:15px;font-weight:700;color:#00338D;cursor:pointer;border:2px solid #C7D9F5;background:rgba(255,255,255,0.85);backdrop-filter:blur(8px);transition:all 0.3s;font-family:inherit;}
.gl-btn-s:hover{border-color:#005EB8;background:#EEF4FF;transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,51,141,0.1);}
.gl-hero-scroll{position:absolute;bottom:34px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;animation:hfu 1s cubic-bezier(.16,1,.3,1) 1.1s both;}
.gl-hero-scroll span{font-size:10px;font-weight:700;color:#A0B4CC;letter-spacing:2.5px;text-transform:uppercase;}
.gl-scroll-line{width:1px;height:44px;background:linear-gradient(to bottom,#005EB8,transparent);animation:sline 2s ease-in-out infinite;}
@keyframes sline{0%{transform:scaleY(0);transform-origin:top;}50%{transform:scaleY(1);transform-origin:top;}51%{transform:scaleY(1);transform-origin:bottom;}100%{transform:scaleY(0);transform-origin:bottom;}}
@keyframes hfu{from{opacity:0;transform:translateY(28px);}to{opacity:1;transform:translateY(0);}}

/* ── MARQUEE ── */
.gl-mq{background:linear-gradient(135deg,#00338D,#005EB8);padding:16px 0;overflow:hidden;position:relative;}
.gl-mq::before,.gl-mq::after{content:'';position:absolute;top:0;bottom:0;width:100px;z-index:2;pointer-events:none;}
.gl-mq::before{left:0;background:linear-gradient(to right,#00338D,transparent);}
.gl-mq::after{right:0;background:linear-gradient(to left,#005EB8,transparent);}
.gl-mq-track{display:flex;animation:mq 32s linear infinite;}
.gl-mq-item{display:flex;align-items:center;gap:10px;padding:0 26px;white-space:nowrap;font-size:12.5px;font-weight:700;color:rgba(255,255,255,0.8);letter-spacing:0.8px;text-transform:uppercase;}
.gl-mq-sep{width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.35);flex-shrink:0;}
@keyframes mq{from{transform:translateX(0);}to{transform:translateX(-50%);}}

/* ── SECTION SHELL ── */
.gl-sec{padding:100px 60px;max-width:1200px;margin:0 auto;}
.gl-sec-alt{padding:100px 0;background:linear-gradient(160deg,#F7FAFF 0%,#EEF4FF 55%,#F0FAFA 100%);}
.gl-sec-alt-inner{max-width:1200px;margin:0 auto;padding:0 60px;}
.gl-eyebrow{font-size:11px;font-weight:800;color:#005EB8;letter-spacing:3px;text-transform:uppercase;margin-bottom:14px;display:flex;align-items:center;gap:10px;}
.gl-eyebrow::before{content:'';width:28px;height:2px;background:linear-gradient(to right,#005EB8,#0091DA);border-radius:2px;flex-shrink:0;}
.gl-h2{font-size:clamp(28px,4vw,48px);font-weight:900;color:#00338D;letter-spacing:-1.5px;line-height:1.1;margin-bottom:16px;}
.gl-h2 em{font-style:normal;background:linear-gradient(135deg,#005EB8,#0091DA);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.gl-lead{font-size:17px;color:#5A7090;line-height:1.78;max-width:580px;}

/* ── STEPS ── */
.gl-steps{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:64px;}
.gl-step{background:#fff;border:1.5px solid #E8EEF6;border-radius:22px;padding:32px 28px;transition:all 0.35s cubic-bezier(.16,1,.3,1);position:relative;overflow:hidden;}
.gl-step::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--c);border-radius:22px 22px 0 0;}
.gl-step:hover{transform:translateY(-7px);box-shadow:0 24px 56px rgba(0,51,141,0.1);border-color:var(--c);}
.gl-step-top{display:flex;align-items:center;gap:14px;margin-bottom:14px;}
.gl-step-num{width:46px;height:46px;border-radius:13px;background:var(--c);color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;letter-spacing:0.5px;flex-shrink:0;box-shadow:0 6px 18px color-mix(in srgb,var(--c) 35%,transparent);}
.gl-step-title{font-size:16.5px;font-weight:800;color:#00338D;line-height:1.2;}
.gl-step-desc{font-size:14px;color:#5A7090;line-height:1.75;}

/* ── PRINCIPLES ── */
.gl-principles{display:grid;grid-template-columns:repeat(5,1fr);gap:16px;margin-top:64px;}
.gl-principle{background:#fff;border:1.5px solid #E8EEF6;border-radius:20px;padding:26px 20px;transition:all 0.35s cubic-bezier(.16,1,.3,1);position:relative;overflow:hidden;}
.gl-principle::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--c);border-radius:20px 20px 0 0;}
.gl-principle:hover{transform:translateY(-8px);box-shadow:0 20px 48px rgba(0,51,141,0.1);border-color:var(--c);}
.gl-principle-name{font-size:14px;font-weight:800;color:#00338D;margin-bottom:10px;}
.gl-principle-desc{font-size:12.5px;color:#6B7C93;line-height:1.62;}

/* ── FEATURES ── */
.gl-features{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:64px;}
.gl-feature{background:#fff;border:1.5px solid #E8EEF6;border-radius:22px;padding:34px 28px;transition:all 0.35s cubic-bezier(.16,1,.3,1);position:relative;overflow:hidden;}
.gl-feature::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--a);border-radius:22px 22px 0 0;}
.gl-feature:hover{transform:translateY(-7px);box-shadow:0 22px 52px rgba(0,51,141,0.1);border-color:var(--a);}
.gl-feature-dot{width:44px;height:44px;border-radius:12px;background:color-mix(in srgb,var(--a) 12%,white);border:1.5px solid color-mix(in srgb,var(--a) 18%,transparent);margin-bottom:20px;}
.gl-feature-title{font-size:16px;font-weight:800;color:#00338D;margin-bottom:10px;}
.gl-feature-desc{font-size:13.5px;color:#6B7C93;line-height:1.7;}

/* ── FRAMEWORKS ── */
.gl-fw-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:64px;}
.gl-fw{background:#fff;border-radius:22px;padding:36px 26px;border:1.5px solid #E8EEF6;transition:all 0.35s cubic-bezier(.16,1,.3,1);position:relative;overflow:hidden;}
.gl-fw::after{content:'';position:absolute;bottom:0;left:0;right:0;height:3px;background:var(--c);border-radius:0 0 22px 22px;}
.gl-fw:hover{transform:translateY(-8px);box-shadow:0 24px 56px rgba(0,51,141,0.1);}
.gl-fw-name{font-size:20px;font-weight:900;color:#00338D;margin-bottom:12px;letter-spacing:-0.5px;}
.gl-fw-desc{font-size:13.5px;color:#6B7C93;line-height:1.68;}

/* ── GLOSSARY ── */
.gl-terms{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:64px;}
.gl-term{background:#fff;border:1.5px solid #E8EEF6;border-radius:18px;padding:28px 24px;transition:all 0.35s cubic-bezier(.16,1,.3,1);position:relative;overflow:hidden;}
.gl-term::after{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(to bottom,#005EB8,#0091DA);border-radius:3px 0 0 3px;transform:scaleY(0);transform-origin:top;transition:transform 0.35s cubic-bezier(.16,1,.3,1);}
.gl-term:hover{transform:translateY(-5px);box-shadow:0 18px 44px rgba(0,51,141,0.09);border-color:#C7D9F5;}
.gl-term:hover::after{transform:scaleY(1);}
.gl-term-label{font-size:11px;font-weight:800;color:#005EB8;letter-spacing:1.8px;text-transform:uppercase;margin-bottom:10px;}
.gl-term-def{font-size:13.5px;color:#5A7090;line-height:1.72;}

/* ── CTA ── */
.gl-cta{background:linear-gradient(135deg,#00338D 0%,#005EB8 50%,#0091DA 100%);padding:120px 60px;text-align:center;position:relative;overflow:hidden;}
.gl-cta-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px);background-size:52px 52px;pointer-events:none;}
.gl-cta-orb{position:absolute;border-radius:50%;filter:blur(90px);pointer-events:none;}
.gl-cta-h2{font-size:clamp(32px,5vw,62px);font-weight:900;color:#fff;letter-spacing:-2px;margin-bottom:20px;position:relative;}
.gl-cta-sub{font-size:18px;color:rgba(255,255,255,0.7);margin-bottom:50px;max-width:520px;margin-left:auto;margin-right:auto;line-height:1.72;position:relative;}
.gl-cta-btns{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;position:relative;}
.gl-cta-w{padding:16px 38px;border-radius:14px;font-size:15px;font-weight:700;color:#00338D;cursor:pointer;border:none;background:#fff;box-shadow:0 8px 28px rgba(0,0,0,0.16);transition:all 0.3s;font-family:inherit;}
.gl-cta-w:hover{transform:translateY(-3px);box-shadow:0 16px 40px rgba(0,0,0,0.22);}
.gl-cta-o{padding:16px 38px;border-radius:14px;font-size:15px;font-weight:700;color:#fff;cursor:pointer;border:2px solid rgba(255,255,255,0.32);background:rgba(255,255,255,0.08);backdrop-filter:blur(8px);transition:all 0.3s;font-family:inherit;}
.gl-cta-o:hover{border-color:#fff;background:rgba(255,255,255,0.14);transform:translateY(-3px);}

/* ── FOOTER ── */
.gl-footer{background:#F7FAFF;border-top:1px solid #E8EEF6;padding:40px 60px;display:flex;align-items:center;justify-content:space-between;}
.gl-footer-left{display:flex;align-items:center;gap:12px;}
.gl-footer-left img{height:30px;opacity:0.65;}
.gl-footer-copy{font-size:13px;color:#8FA3BF;}
.gl-footer-links{display:flex;gap:22px;}
.gl-footer-link{font-size:13px;color:#8FA3BF;cursor:pointer;transition:color 0.2s;border:none;background:none;font-family:inherit;}
.gl-footer-link:hover{color:#005EB8;}

/* ── RESPONSIVE ── */
@media(max-width:1024px){
  .gl-principles{grid-template-columns:repeat(3,1fr);}
  .gl-fw-grid{grid-template-columns:repeat(2,1fr);}
  .gl-steps{grid-template-columns:1fr;}
}
@media(max-width:768px){
  .gl-nav{padding:0 20px;}.gl-nav-center{display:none;}
  .gl-hero{padding:90px 20px 60px;}
  .gl-sec{padding:60px 20px;}
  .gl-sec-alt-inner{padding:0 20px;}
  .gl-sec-alt{padding:60px 0;}
  .gl-principles{grid-template-columns:repeat(2,1fr);}
  .gl-features{grid-template-columns:1fr;}
  .gl-fw-grid{grid-template-columns:1fr;}
  .gl-terms{grid-template-columns:1fr;}
  .gl-cta{padding:60px 20px;}
  .gl-footer{flex-direction:column;gap:16px;text-align:center;padding:28px 20px;}
  .gl-footer-links{justify-content:center;flex-wrap:wrap;}
}
`;

/* ─── component ─────────────────────────────────────────────────────────── */
export default function Glossary() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("hero");
  const typed = useTypewriter(
    ["LLM Systems","RAG Pipelines","Classification Models","Image CV Systems","Automation Agents"],
    72, 2000
  );
  const mouse = useMouseParallax();

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    const ids = ["hero","how","principles","features","frameworks","glossary"];
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      for (const id of [...ids].reverse()) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 130) { setActive(id); break; }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const mq = [...MARQUEE, ...MARQUEE];

  return (
    <div className="gl">
      <style>{CSS}</style>

      {/* NAV */}
      <nav className={`gl-nav${scrolled ? " scrolled" : ""}`}>
        <div className="gl-nav-brand" onClick={() => scrollTo("hero")}>
          <img src="/kpmg-logo.png" alt="KPMG" />
          <div className="gl-nav-brand-text">
            <span className="gl-nav-brand-name">Auditable AI™</span>
            <span className="gl-nav-brand-sub">KPMG Trusted AI</span>
          </div>
        </div>
        <div className="gl-nav-center">
          {([["how","How It Works"],["principles","TAF Principles"],["features","Features"],["frameworks","Frameworks"],["glossary","Glossary"]] as [string,string][]).map(([id,label]) => (
            <button key={id} className={`gl-nav-link${active===id?" active":""}`} onClick={() => scrollTo(id)}>{label}</button>
          ))}
        </div>
        <div className="gl-nav-right">
          <button className="gl-nav-ghost" onClick={() => navigate("/login")}>Sign In</button>
          <button className="gl-nav-cta" onClick={() => navigate("/register")}>Get Started</button>
        </div>
      </nav>

      {/* HERO */}
      <section id="hero" className="gl-hero">
        <div className="gl-hero-mesh" />
        <div className="gl-hero-grid" />
        <div style={{ position:"absolute", width:640, height:640, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,94,184,0.09),transparent)", top:-160, right:-120, transform:`translate(${mouse.x*-20}px,${mouse.y*-20}px)`, transition:"transform 0.12s linear", pointerEvents:"none", filter:"blur(50px)" }} />
        <div style={{ position:"absolute", width:440, height:440, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,163,161,0.09),transparent)", bottom:-80, left:-80, transform:`translate(${mouse.x*16}px,${mouse.y*16}px)`, transition:"transform 0.12s linear", pointerEvents:"none", filter:"blur(40px)" }} />
        <div style={{ position:"absolute", width:320, height:320, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,145,218,0.07),transparent)", top:"38%", left:"4%", transform:`translate(${mouse.x*10}px,${mouse.y*10}px)`, transition:"transform 0.12s linear", pointerEvents:"none", filter:"blur(32px)" }} />

        <div className="gl-hero-pill">
          <div className="gl-hero-pill-dot" />
          KPMG Trusted AI Framework · Enterprise Grade
        </div>
        <h1 className="gl-hero-h1">Enterprise AI Governance,</h1>
        <div className="gl-hero-h1-grad">Automated.</div>
        <p className="gl-hero-sub">
          An end-to-end AI audit platform. Upload inference logs from your{" "}
          <span className="gl-hero-tw">{typed}</span>
          {" "}and receive a full governance report in minutes — no ML expertise required.
        </p>
        <div className="gl-hero-btns">
          <button className="gl-btn-p" onClick={() => navigate("/register")}>Start Your Audit</button>
          <button className="gl-btn-s" onClick={() => scrollTo("how")}>See How It Works</button>
        </div>
        <div className="gl-hero-scroll">
          <span>Scroll to explore</span>
          <div className="gl-scroll-line" />
        </div>
      </section>

      {/* MARQUEE */}
      <div className="gl-mq">
        <div className="gl-mq-track">
          {mq.map((item, i) => (
            <div className="gl-mq-item" key={i}>
              <div className="gl-mq-sep" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how" className="gl-sec">
        <Reveal>
          <div className="gl-eyebrow">Walkthrough</div>
          <h2 className="gl-h2">From logs to audit report<br />in <em>seven steps.</em></h2>
          <p className="gl-lead">No model access needed. No ML expertise required. Upload your inference logs — or connect an API — and Auditable AI handles the rest.</p>
        </Reveal>
        <div className="gl-steps">
          {STEPS.map((s, i) => (
            <Reveal key={s.num} delay={i * 0.06} from={i % 2 === 0 ? "left" : "right"}>
              <div className="gl-step" style={{ "--c": s.color } as React.CSSProperties}>
                <div className="gl-step-top">
                  <div className="gl-step-num">{s.num}</div>
                  <div className="gl-step-title">{s.title}</div>
                </div>
                <div className="gl-step-desc">{s.desc}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TAF PRINCIPLES */}
      <section id="principles" className="gl-sec-alt">
        <div className="gl-sec-alt-inner">
          <Reveal>
            <div className="gl-eyebrow">KPMG Trusted AI Framework</div>
            <h2 className="gl-h2">10 principles.<br /><em>One unified score.</em></h2>
            <p className="gl-lead">Every AI system is evaluated across all 10 TAF principles. Each is scored 0–100 and contributes to your overall governance rating.</p>
          </Reveal>
          <div className="gl-principles">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.05}>
                <div className="gl-principle" style={{ "--c": p.color } as React.CSSProperties}>
                  <div className="gl-principle-name">{p.name}</div>
                  <div className="gl-principle-desc">{p.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="gl-sec">
        <Reveal>
          <div className="gl-eyebrow">Features</div>
          <h2 className="gl-h2">Everything you need<br />to <em>audit AI.</em></h2>
          <p className="gl-lead">A complete toolkit — from automatic model detection and black box testing to boardroom-ready PDF reports.</p>
        </Reveal>
        <div className="gl-features">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <div className="gl-feature" style={{ "--a": f.accent } as React.CSSProperties}>
                <div className="gl-feature-title">{f.title}</div>
                <div className="gl-feature-desc">{f.desc}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FRAMEWORKS */}
      <section id="frameworks" className="gl-sec-alt">
        <div className="gl-sec-alt-inner">
          <Reveal>
            <div className="gl-eyebrow">Global Standards</div>
            <h2 className="gl-h2">Mapped to the frameworks<br /><em>that matter.</em></h2>
            <p className="gl-lead">Your audit report automatically maps your TAF scores to the four leading AI governance frameworks — so you know exactly where you stand.</p>
          </Reveal>
          <div className="gl-fw-grid">
            {FRAMEWORKS.map((f, i) => (
              <Reveal key={f.name} delay={i * 0.1}>
                <div className="gl-fw" style={{ "--c": f.color } as React.CSSProperties}>
                  <div className="gl-fw-name">{f.name}</div>
                  <div className="gl-fw-desc">{f.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* GLOSSARY */}
      <section id="glossary" className="gl-sec">
        <Reveal>
          <div className="gl-eyebrow">Glossary</div>
          <h2 className="gl-h2">Key terms,<br /><em>explained in full.</em></h2>
          <p className="gl-lead">Every term you'll encounter inside Auditable AI — defined clearly, with the context you need to understand your audit results.</p>
        </Reveal>
        <div className="gl-terms">
          {GLOSSARY_TERMS.map((g, i) => (
            <Reveal key={g.term} delay={i * 0.04}>
              <div className="gl-term">
                <div className="gl-term-label">{g.term}</div>
                <div className="gl-term-def">{g.def}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="gl-cta">
        <div className="gl-cta-grid" />
        <div className="gl-cta-orb" style={{ width:520, height:520, background:"rgba(255,255,255,0.05)", top:-160, right:-120 }} />
        <div className="gl-cta-orb" style={{ width:380, height:380, background:"rgba(0,163,161,0.14)", bottom:-120, left:-80 }} />
        <Reveal>
          <h2 className="gl-cta-h2">Ready to audit your AI?</h2>
          <p className="gl-cta-sub">Join organisations using Auditable AI™ to achieve trusted, explainable, and well-governed AI — in minutes.</p>
          <div className="gl-cta-btns">
            <button className="gl-cta-w" onClick={() => navigate("/register")}>Create Free Account</button>
            <button className="gl-cta-o" onClick={() => navigate("/login")}>Sign In</button>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="gl-footer">
        <div className="gl-footer-left">
          <img src="/kpmg-logo.png" alt="KPMG" />
          <span className="gl-footer-copy">© 2026 KPMG Auditable AI™. All rights reserved.</span>
        </div>
        <div className="gl-footer-links">
          {([["how","How It Works"],["principles","TAF Principles"],["features","Features"],["frameworks","Frameworks"],["glossary","Glossary"]] as [string,string][]).map(([id,label]) => (
            <button key={id} className="gl-footer-link" onClick={() => scrollTo(id)}>{label}</button>
          ))}
          <button className="gl-footer-link" onClick={() => navigate("/login")}>Sign In</button>
        </div>
      </footer>
    </div>
  );
}