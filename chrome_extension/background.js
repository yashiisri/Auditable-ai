// background.js
const auditState = {};

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "AUDIT_PROGRESS") {
    const tabId = sender.tab?.id;
    if (tabId) {
      auditState[tabId] = msg;
      chrome.runtime.sendMessage({ ...msg, tabId }).catch(() => {});
    }
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "GET_STATE") {
    sendResponse(auditState[msg.tabId] || null);
    return true;
  }
  if (msg.type === "START_AUDIT_FROM_POPUP") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return sendResponse({ error: "No active tab" });
      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: "START_AUDIT", backendUrl: msg.backendUrl, auditName: msg.auditName },
        (resp) => sendResponse(resp || { error: chrome.runtime.lastError?.message })
      );
    });
    return true;
  }
});