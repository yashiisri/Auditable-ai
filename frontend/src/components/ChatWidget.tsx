import { useState, useRef, useEffect } from "react";

const KPMG = "#00338D";
const KPMG_MID = "#005EB8";
const KPMG_LT = "#0091DA";

interface Message { role: "user" | "assistant"; text: string; }

const KB: Record<string, string> = {
  "what is sdcc": "SDCC (Smart Data Classification & Characterisation) is our automated pipeline that ingests your AI logs, detects the model type, computes data quality scores, and prepares the data for governance evaluation.",
  "what is blackbox": "Black Box Audit lets you test any external AI system by sending 50 governance probes across all 10 KPMG Trusted AI Principles — without needing access to the model's internals. Just provide an API endpoint or UI URL.",
  "what is kpmg trusted ai": "The KPMG Trusted AI Framework defines 10 principles for responsible AI: Transparency, Explainability, Fairness, Accountability, Data Integrity, Reliability, Security, Privacy, Sustainability, and Safety.",
  "what are the 10 principles": "The 10 KPMG Trusted AI Principles are: 1) Transparency, 2) Explainability, 3) Fairness, 4) Accountability, 5) Data Integrity, 6) Reliability, 7) Security, 8) Privacy, 9) Sustainability, 10) Safety.",
  "what is eu ai act": "The EU AI Act is the European Union's comprehensive AI regulation. It classifies AI systems by risk level (unacceptable, high, limited, minimal) and sets obligations for transparency, human oversight, and documentation.",
  "what is iso 42001": "ISO/IEC 42001:2023 is the international standard for AI Management Systems. It provides a framework for organisations to responsibly develop, deploy, and manage AI systems.",
  "what is nist ai rmf": "The NIST AI Risk Management Framework (AI RMF) is a US framework that helps organisations manage AI risks across four functions: Govern, Map, Measure, and Manage.",
  "how do i upload logs": "Go to the Dashboard, select your registered AI system, then upload a CSV or JSON file with your AI logs. Include 'input'/'prompt' and 'output'/'response' columns for best results.",
  "what columns do i need": "For best results, include: input/prompt/query (required), output/response/answer (required), and optionally: reference, context, label, confidence, latency, timestamp, user_id.",
  "what is overall score": "The overall governance score (0-100) is a weighted average across all 10 KPMG Trusted AI Principles. 75+ = Strong, 50-74 = Watch, below 50 = Critical.",
  "what is risk level": "Risk level is derived from the overall score: Low (75+), Moderate (50-74), High (below 50). It reflects the governance posture of your AI system.",
  "how does scoring work": "Each principle is scored 0-100 based on sub-parameters computed from your dataset structure, log content, and model-specific metrics. The overall score is a weighted average with Safety and Security weighted highest.",
  "what is self report": "The Enterprise Self-Assessment lets you fill out a structured form about your AI system — governance policies, safety controls, bias testing, etc. — and get a governance score without uploading logs.",
  "what is chrome extension": "The Chrome Extension lets you audit AI chat interfaces (ChatGPT, Gemini, Copilot, Claude, Grok) directly in your browser. It sends 50 governance probes and scores the responses in real time.",
  "how to register ai": "After logging in, go to Register AI System. Enter your AI's name, description, and domain. This registers it in the platform so you can run audits against it.",
  "what is transparency": "Transparency measures whether the AI is open about its capabilities, limitations, and decision-making process. Sub-parameters include schema confidence, field documentation, and model version tracking.",
  "what is fairness": "Fairness measures whether the AI treats all groups equitably. Sub-parameters include label balance, demographic coverage, bias indicator fields, and missing data equity.",
  "what is safety": "Safety measures whether the AI prevents harm. Sub-parameters include harm prevention logging, safety test coverage, human override capability, incident response signals, and safeguard effectiveness.",
  "what is privacy": "Privacy measures GDPR and data protection compliance. Sub-parameters include PII detection, PII field tracking, data minimisation, user anonymisation, consent management, and data retention signals.",
  "what is reliability": "Reliability measures consistent performance. Sub-parameters include consistency score, performance metrics, latency monitoring, error rate tracking, and volume sufficiency.",
  "what is security": "Security measures resilience against attacks. Sub-parameters include safety flagging, input validation, adversarial robustness, and content moderation.",
  "what is accountability": "Accountability measures governance structures and human oversight. Sub-parameters include audit log volume, timestamp coverage, user attribution, model version control, and error/exception logging.",
  "what is explainability": "Explainability measures how interpretable the AI's decisions are. Sub-parameters include model interpretability, prediction confidence, reasoning documentation, feedback integration, and output traceability.",
  "what is data integrity": "Data Integrity measures data quality and governance. Sub-parameters include completeness score, duplicate-free rate, schema consistency, data type diversity, and ground truth availability.",
  "what is sustainability": "Sustainability measures environmental impact. Sub-parameters include dataset efficiency, feature engineering, compute proxy score, redundancy elimination, and resource optimisation.",
  "how to download pdf": "After running a full evaluation, click 'Download Full PDF Report' on the Report page. You need to be logged in. The PDF includes all findings, scores, and recommendations.",
  "what is groq": "Groq is used to dynamically generate governance probes for Black Box audits. When you register an AI system with a description and domain, Groq generates 50 contextualised probes specific to your model type.",
  "why is my score 0": "A score of 0 usually means the probes all failed or the AI refused to respond. Check that your API endpoint is correct, the API key is valid, and the model is accessible. Also ensure the model type is correctly registered.",
  "what file formats": "The platform accepts CSV and JSON files for log ingestion. For the PDF Report Dashboard, you can upload .pdf or .json report files.",
};

function getAnswer(q: string): string {
  const lower = q.toLowerCase().trim();
  for (const [key, answer] of Object.entries(KB)) {
    if (lower.includes(key) || key.split(" ").every(w => lower.includes(w))) {
      return answer;
    }
  }
  // Fuzzy fallback
  if (lower.includes("score") || lower.includes("scoring")) return KB["how does scoring work"];
  if (lower.includes("upload") || lower.includes("file") || lower.includes("log")) return KB["how do i upload logs"];
  if (lower.includes("principle") || lower.includes("kpmg")) return KB["what are the 10 principles"];
  if (lower.includes("extension") || lower.includes("chrome")) return KB["what is chrome extension"];
  if (lower.includes("register") || lower.includes("ai system")) return KB["how to register ai"];
  if (lower.includes("pdf") || lower.includes("report")) return KB["how to download pdf"];
  return "I can help with questions about the platform, KPMG Trusted AI principles, scoring, auditing, and governance. Try asking: 'What is SDCC?', 'How does scoring work?', 'What are the 10 principles?', or 'How do I upload logs?'";
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hi! I'm your AI governance assistant. Ask me anything about the platform, KPMG Trusted AI principles, scoring, or how to use any feature." }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = () => {
    const q = input.trim();
    if (!q) return;
    setMessages(m => [...m, { role: "user", text: q }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const answer = getAnswer(q);
      setMessages(m => [...m, { role: "assistant", text: answer }]);
      setTyping(false);
    }, 600);
  };

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          width: 56, height: 56, borderRadius: "50%",
          background: `linear-gradient(135deg, ${KPMG}, ${KPMG_MID})`,
          border: "none", cursor: "pointer",
          boxShadow: "0 8px 24px rgba(0,51,141,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.3s",
          transform: open ? "scale(0.9)" : "scale(1)",
        }}
        title="AI Governance Assistant"
      >
        {open
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        }
      </button>

      {/* Chat window */}
      {open && (
        <div style={{
          position: "fixed", bottom: 96, right: 28, zIndex: 9998,
          width: 360, height: 500,
          background: "white", borderRadius: 20,
          border: "1px solid #E3EAF3",
          boxShadow: "0 20px 60px rgba(0,51,141,0.18)",
          display: "flex", flexDirection: "column",
          fontFamily: "'Inter', sans-serif",
          overflow: "hidden",
          animation: "chatSlideIn 0.25s ease",
        }}>
          <style>{`
            @keyframes chatSlideIn { from { opacity:0; transform:translateY(16px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
          `}</style>

          {/* Header */}
          <div style={{ padding: "14px 18px", background: `linear-gradient(135deg, ${KPMG}, ${KPMG_MID})`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔷</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>AI Governance Assistant</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Ask me anything about the platform</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "82%", padding: "10px 14px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: m.role === "user" ? `linear-gradient(135deg, ${KPMG}, ${KPMG_MID})` : "#F4F7FB",
                  color: m.role === "user" ? "white" : "#1E293B",
                  fontSize: 13, lineHeight: 1.6,
                  border: m.role === "assistant" ? "1px solid #E3EAF3" : "none",
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: "#F4F7FB", border: "1px solid #E3EAF3", fontSize: 13, color: "#94A3B8" }}>
                  Thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          <div style={{ padding: "8px 12px", borderTop: "1px solid #F1F5F9", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["What is SDCC?", "10 principles", "How scoring works", "Chrome extension"].map(q => (
              <button key={q} onClick={() => { setInput(q); }}
                style={{ padding: "4px 10px", background: "#E6F2FB", border: `1px solid ${KPMG_LT}30`, borderRadius: 20, fontSize: 11, color: KPMG_MID, cursor: "pointer", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: "12px 14px", borderTop: "1px solid #E3EAF3", display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask about the platform…"
              style={{ flex: 1, padding: "9px 12px", border: "1.5px solid #E3EAF3", borderRadius: 10, fontSize: 13, fontFamily: "'Inter', sans-serif", outline: "none", color: "#1E293B", background: "#FAFBFD" }}
              onFocus={e => { e.currentTarget.style.borderColor = KPMG_MID; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,94,184,0.1)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "#E3EAF3"; e.currentTarget.style.boxShadow = "none"; }}
            />
            <button onClick={send}
              style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${KPMG}, ${KPMG_MID})`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
