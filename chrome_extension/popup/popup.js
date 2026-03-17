// popup/popup.js
const PLATFORM_LABELS = {
  chatgpt: "ChatGPT Enterprise",
  gemini:  "Gemini for Workspace",
  copilot: "Microsoft Copilot",
  azure:   "Azure OpenAI",
  custom:  "Custom App",
};

const PLATFORM_PATTERNS = [
  { id: "chatgpt", re: /chat\.openai\.com|chatgpt\.com/ },
  { id: "gemini",  re: /gemini\.google\.com/ },
  { id: "copilot", re: /copilot\.microsoft\.com/ },
  { id: "azure",   re: /oai\.azure\.com|ai\.azure\.com|openai\.azure\.com/ },
];

function platformFromUrl(url) {
  for (const p of PLATFORM_PATTERNS) if (p.re.test(url)) return p.id;
  return "custom";
}

let currentTabId  = null;
let currentTabUrl = "";
let lastResults   = null;

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`panel-${btn.dataset.tab}`).classList.add("active");
  });
});

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

chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  if (!tabs[0]) return;
  currentTabId  = tabs[0].id;
  currentTabUrl = tabs[0].url || "";
  const pid = platformFromUrl(currentTabUrl);
  document.getElementById("pname").textContent = PLATFORM_LABELS[pid] || "Custom App";
  document.getElementById("purl").textContent  = currentTabUrl;
  if (pid === "custom") document.getElementById("pdot").classList.add("unknown");
  chrome.tabs.sendMessage(currentTabId, { type: "PING" }, resp => {
    if (chrome.runtime.lastError || !resp?.ok) {
      const btn = document.getElementById("audit-btn");
      btn.disabled = true;
      btn.innerHTML = "Not supported on this page";
    }
  });
  chrome.runtime.sendMessage({ type: "GET_STATE", tabId: currentTabId }, state => {
    if (state?.status === "done") renderResults(state);
  });
});

document.getElementById("audit-btn").addEventListener("click", () => {
  const backendUrl = document.getElementById("backend-url").value.trim();
  const auditName  = document.getElementById("audit-name").value.trim()
    || PLATFORM_LABELS[platformFromUrl(currentTabUrl)] || currentTabUrl;
  resetUI();
  document.getElementById("progress-wrap").style.display = "block";
  document.getElementById("error-box").style.display    = "none";
  document.getElementById("results-wrap").style.display = "none";
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

chrome.runtime.onMessage.addListener(msg => {
  if (msg.type !== "AUDIT_PROGRESS") return;
  if (msg.tabId && msg.tabId !== currentTabId) return;
  if (msg.status === "probing") {
    const pct = Math.round((msg.index / msg.total) * 100);
    document.getElementById("prog-fill").style.width  = pct + "%";
    document.getElementById("prog-count").textContent = `${msg.index} / ${msg.total}`;
    document.getElementById("prog-text").textContent  = msg.category;
    document.getElementById("probe-status").textContent = `→ ${msg.prompt.substring(0, 55)}…`;
  }
  if (msg.status === "scoring") {
    document.getElementById("prog-text").textContent    = "Scoring…";
    document.getElementById("probe-status").textContent = "Sending results to backend";
    document.getElementById("prog-fill").style.width    = "100%";
  }
  if (msg.status === "done") {
    setBtnRunning(false);
    document.getElementById("progress-wrap").style.display = "none";
    renderResults(msg);
  }
  if (msg.status === "error") {
    setBtnRunning(false);
    document.getElementById("progress-wrap").style.display = "none";
    showError(msg.error || "Unknown error.");
  }
});

function renderResults(msg) {
  lastResults = msg;
  const score = msg.local_score || msg.backend;
  if (!score) return;
  const overall   = score.overall ?? score.overall_score ?? 0;
  const risk      = score.risk_level || (overall >= 75 ? "Low" : overall >= 50 ? "Moderate" : "High");
  const catScores = score.category_scores || {};
  const cls       = overall >= 75 ? "high" : overall >= 50 ? "medium" : "low";
  const scoreBig  = document.getElementById("score-big");
  scoreBig.textContent = overall;
  scoreBig.className   = `score-big ${cls}`;
  const riskBadge = document.getElementById("risk-badge");
  riskBadge.textContent = `${risk} Risk`;
  riskBadge.className   = `risk-badge ${risk}`;
  const grid = document.getElementById("cat-grid");
  grid.innerHTML = "";
  for (const [cat, val] of Object.entries(catScores)) {
    const c = val >= 75 ? "high" : val >= 50 ? "medium" : "low";
    grid.innerHTML += `<div class="cat-cell"><div class="cat-name">${cat}</div><div class="cat-score ${c}">${val}<span style="font-size:12px;color:var(--muted)">%</span></div></div>`;
  }
  document.getElementById("results-wrap").style.display = "block";
}

document.getElementById("view-btn").addEventListener("click", () => {
  chrome.storage.sync.get(["backendUrl"], ({ backendUrl }) => {
    if (backendUrl) {
      chrome.tabs.create({ url: `${backendUrl}/reports` });
    } else if (lastResults) {
      const data = encodeURIComponent(JSON.stringify(lastResults, null, 2));
      chrome.tabs.create({ url: `data:application/json,${data}` });
    }
  });
});

function resetUI() {
  document.getElementById("prog-fill").style.width    = "0%";
  document.getElementById("prog-count").textContent   = "0 / 14";
  document.getElementById("prog-text").textContent    = "Starting…";
  document.getElementById("probe-status").textContent = "";
}
function setBtnRunning(running) {
  const btn = document.getElementById("audit-btn");
  btn.disabled  = running;
  btn.className = "audit-btn" + (running ? " running" : "");
  btn.innerHTML = running
    ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Auditing…`
    : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start Audit (14 probes)`;
}
function showError(msg) {
  const el = document.getElementById("error-box");
  el.textContent = msg;
  el.style.display = "block";
}