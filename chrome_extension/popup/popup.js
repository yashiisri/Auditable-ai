// popup.js — AI Governance Auditor v2.0
const TOTAL_PROBES = 50;

const PLATFORM_LABELS = {
  chatgpt: "ChatGPT", gemini: "Gemini", copilot: "Microsoft Copilot",
  claude: "Claude", grok: "Grok", custom: "Custom AI App",
};

let currentTabId = null;
let currentTabUrl = "";
let lastResults = null;

// ── Tab switching ────────────────────────────────────────────────────────
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`panel-${btn.dataset.tab}`).classList.add("active");
  });
});

// ── Load config ──────────────────────────────────────────────────────────
chrome.storage.sync.get(["backendUrl", "auditName"], cfg => {
  if (cfg.backendUrl) document.getElementById("backend-url").value = cfg.backendUrl;
  if (cfg.auditName)  document.getElementById("audit-name").value  = cfg.auditName;
});

document.getElementById("save-btn").addEventListener("click", () => {
  const backendUrl = document.getElementById("backend-url").value.trim();
  const auditName  = document.getElementById("audit-name").value.trim();
  chrome.storage.sync.set({ backendUrl, auditName }, () => {
    const el = document.getElementById("save-msg");
    el.style.display = "block";
    setTimeout(() => el.style.display = "none", 2000);
  });
});

// ── Detect current tab ───────────────────────────────────────────────────
chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  if (!tabs[0]) return;
  currentTabId  = tabs[0].id;
  currentTabUrl = tabs[0].url || "";

  document.getElementById("purl").textContent = currentTabUrl;

  chrome.tabs.sendMessage(currentTabId, { type: "PING" }, resp => {
    if (chrome.runtime.lastError || !resp?.ok) {
      document.getElementById("pname").textContent = "Not supported on this page";
      document.getElementById("pdot").classList.add("unknown");
      document.getElementById("audit-btn").disabled = true;
      document.getElementById("audit-btn").innerHTML = "Not supported on this page";
      document.getElementById("history-btn").disabled = true;
    } else {
      const pid = resp.platform || "custom";
      document.getElementById("pname").textContent = PLATFORM_LABELS[pid] || "Custom AI App";
    }
  });

  // Restore previous results if available
  chrome.runtime.sendMessage({ type: "GET_STATE", tabId: currentTabId }, state => {
    if (state?.status === "done") renderResults(state);
    if (state?.status === "history_done") renderHistoryResults(state.history_result);
  });
});

// ── Start audit ──────────────────────────────────────────────────────────
document.getElementById("audit-btn").addEventListener("click", () => {
  const backendUrl = document.getElementById("backend-url").value.trim();
  const auditName  = document.getElementById("audit-name").value.trim() || "Enterprise AI";

  resetUI();
  document.getElementById("progress-wrap").style.display = "block";
  document.getElementById("error-box").style.display     = "none";
  document.getElementById("results-wrap").style.display  = "none";
  setBtnRunning(true);

  chrome.runtime.sendMessage(
    { type: "START_AUDIT_FROM_POPUP", backendUrl, auditName },
    resp => {
      if (chrome.runtime.lastError || resp?.error) {
        showError(resp?.error || chrome.runtime.lastError?.message || "Could not reach the page.");
        setBtnRunning(false);
        document.getElementById("progress-wrap").style.display = "none";
      }
    }
  );
});

// ── History audit ────────────────────────────────────────────────────────
document.getElementById("history-btn").addEventListener("click", () => {
  document.getElementById("history-results").innerHTML = "";
  document.getElementById("history-error-box").style.display = "none";
  document.getElementById("history-btn").disabled = true;
  document.getElementById("history-btn").innerHTML = "Analysing…";

  chrome.tabs.sendMessage(currentTabId, { type: "AUDIT_HISTORY" }, resp => {
    if (chrome.runtime.lastError || !resp?.ok) {
      document.getElementById("history-error-box").textContent = "Could not access chat history on this page.";
      document.getElementById("history-error-box").style.display = "block";
    }
    document.getElementById("history-btn").disabled = false;
    document.getElementById("history-btn").innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      Audit Chat History`;
  });
});

// ── Progress listener ────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener(msg => {
  if (msg.type !== "AUDIT_PROGRESS") return;
  if (msg.tabId && msg.tabId !== currentTabId) return;

  if (msg.status === "probing") {
    const pct = Math.round((msg.index / TOTAL_PROBES) * 100);
    document.getElementById("prog-fill").style.width  = pct + "%";
    document.getElementById("prog-count").textContent = `${msg.index} / ${TOTAL_PROBES}`;
    document.getElementById("prog-text").textContent  = msg.category;
    document.getElementById("probe-status").textContent = `→ ${msg.prompt.substring(0, 60)}…`;
  }
  if (msg.status === "scoring") {
    document.getElementById("prog-text").textContent    = "Scoring results…";
    document.getElementById("probe-status").textContent = "Sending to backend";
    document.getElementById("prog-fill").style.width    = "100%";
  }
  if (msg.status === "done") {
    setBtnRunning(false);
    document.getElementById("progress-wrap").style.display = "none";
    renderResults(msg);
  }
  if (msg.status === "history_done") {
    renderHistoryResults(msg.history_result);
  }
  if (msg.status === "error") {
    setBtnRunning(false);
    document.getElementById("progress-wrap").style.display = "none";
    showError(msg.error || "Unknown error.");
  }
});

// ── Render audit results ─────────────────────────────────────────────────
function renderResults(msg) {
  lastResults = msg;
  const score = msg.local_score || msg.backend;
  if (!score) return;

  const overall   = score.overall ?? score.overall_score ?? 0;
  const risk      = score.risk_level || (overall >= 75 ? "Low" : overall >= 50 ? "Moderate" : "High");
  const catScores = score.category_scores || {};
  const cls       = overall >= 75 ? "high" : overall >= 50 ? "medium" : "low";

  const scoreBig = document.getElementById("score-big");
  scoreBig.textContent = overall;
  scoreBig.className   = `score-big ${cls}`;

  const riskBadge = document.getElementById("risk-badge");
  riskBadge.textContent = `${risk} Risk`;
  riskBadge.className   = `risk-badge ${risk}`;

  const probesLabel = document.getElementById("probes-run-label");
  if (probesLabel) probesLabel.textContent = `${msg.probes_run || TOTAL_PROBES} probes run`;

  const grid = document.getElementById("cat-grid");
  grid.innerHTML = "";
  for (const [cat, val] of Object.entries(catScores)) {
    const c = val >= 75 ? "high" : val >= 50 ? "medium" : "low";
    grid.innerHTML += `
      <div class="cat-cell">
        <div class="cat-name">${cat}</div>
        <div class="cat-score ${c}">${val}<span style="font-size:11px;color:var(--muted)">%</span></div>
      </div>`;
  }

  document.getElementById("results-wrap").style.display = "block";
}

// ── Render history results ───────────────────────────────────────────────
function renderHistoryResults(result) {
  const container = document.getElementById("history-results");
  if (!result) { container.innerHTML = '<div class="error-box" style="display:block">No results returned.</div>'; return; }

  const scoreColor = result.score >= 75 ? "var(--green)" : result.score >= 50 ? "var(--kpmg-mid)" : "var(--red)";
  let html = `
    <div class="history-result">
      <h3>Chat History Analysis</h3>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div>
          <div style="font-size:10px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em">Governance Score</div>
          <div style="font-size:32px;font-weight:900;color:${scoreColor};letter-spacing:-1px">${result.score}</div>
        </div>
        <div style="text-align:right">
          <span style="font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;background:${result.risk==='Low'?'#DCFCE7':result.risk==='Moderate'?'#E6F2FB':'#FEE2E2'};color:${scoreColor}">${result.risk} Risk</span>
          <div style="font-size:10px;color:var(--muted);margin-top:6px">${result.turns} turns analysed</div>
        </div>
      </div>`;

  if (!result.findings || result.findings.length === 0) {
    html += `<div class="no-findings">✅ No governance issues found in chat history</div>`;
  } else {
    html += `<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">${result.findings.length} issue(s) found</div>`;
    for (const f of result.findings.slice(0, 8)) {
      html += `
        <div class="finding-item ${f.severity}">
          <strong>${f.category}</strong> · ${f.severity}<br>
          ${f.issue}<br>
          <span style="opacity:0.7;font-size:10px">"${f.snippet}…"</span>
        </div>`;
    }
    if (result.findings.length > 8) {
      html += `<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px">+${result.findings.length - 8} more issues</div>`;
    }
  }
  html += `</div>`;
  container.innerHTML = html;
}

// ── View full report ─────────────────────────────────────────────────────
document.getElementById("view-btn").addEventListener("click", () => {
  chrome.storage.sync.get(["backendUrl"], ({ backendUrl }) => {
    if (backendUrl) {
      chrome.tabs.create({ url: `${backendUrl}/report` });
    } else if (lastResults) {
      const data = encodeURIComponent(JSON.stringify(lastResults, null, 2));
      chrome.tabs.create({ url: `data:application/json,${data}` });
    }
  });
});

// ── Helpers ──────────────────────────────────────────────────────────────
function resetUI() {
  document.getElementById("prog-fill").style.width    = "0%";
  document.getElementById("prog-count").textContent   = `0 / ${TOTAL_PROBES}`;
  document.getElementById("prog-text").textContent    = "Starting…";
  document.getElementById("probe-status").textContent = "";
}

function setBtnRunning(running) {
  const btn = document.getElementById("audit-btn");
  btn.disabled  = running;
  btn.className = "audit-btn" + (running ? " running" : "");
  btn.innerHTML = running
    ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Auditing…`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start Governance Audit (${TOTAL_PROBES} probes)`;
}

function showError(msg) {
  const el = document.getElementById("error-box");
  el.textContent = msg;
  el.style.display = "block";
}
