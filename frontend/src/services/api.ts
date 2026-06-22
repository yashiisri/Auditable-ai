import axios from "axios";

const BASE_URL = "http://localhost:8000";

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const registerUser = (data: { name: string; email: string; password: string }) =>
  api.post("/api/auth/register", data);

export const loginUser = (data: { email: string; password: string }) =>
  api.post("/api/auth/login", data);

export const getProfile = () =>
  api.get("/api/auth/me");

export const updateProfile = (data: { name: string }) =>
  api.patch("/api/auth/me", data);

// ── Register AI ───────────────────────────────────────────────────────────────
// Connection details (type, endpoint, headers) are no longer collected during
// registration — they are entered fresh at audit time on the Dashboard.
// A stub connector is sent to satisfy the backend schema requirement.
// The profile field carries all governance/deployment context used by the
// behavioral fingerprinter and probe generator.
export const registerAI = (data: {
  name:        string;
  description: string;
  domain:      string;
  connector:   { type: string; endpoint: string; headers: Record<string, string> };
  profile?: {
    end_users?:              string;
    decision_influence?:     string;
    data_types?:             string[];
    jurisdictions?:          string[];
    deployment_status?:      string;
    real_time_data?:         string;
    autonomous_actions?:     string;
    oversight_model?:        string;
    output_visibility?:      string;
    highest_stakes_failure?: string;
    bias_tested?:            string;
  };
}) => api.post("/register-ai", data);

// ── List AI systems (used by Dashboard to populate the AI selector) ───────────
export const listAiSystems = () =>
  api.get("/ai-systems");

// ── SDCC Ingest ───────────────────────────────────────────────────────────────
export const sdccIngest = (aiName: string, file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post(`/sdcc/ingest/${aiName}`, fd);
};

// ── KB Upload ─────────────────────────────────────────────────────────────────
export const uploadKnowledgeBase = (aiName: string, files: File[]) => {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  return api.post(`/sdcc/upload-kb/${aiName}`, fd);
};

// ── Evaluate ──────────────────────────────────────────────────────────────────
export const evaluateAI = (aiName: string) =>
  api.post(`/evaluate/${aiName}`);

// ── Reports ───────────────────────────────────────────────────────────────────
export const getReports = () =>
  api.get("/reports");

export const getReportById = (reportId: string) =>
  api.get(`/reports/${reportId}`);

// ── Black Box Audit ───────────────────────────────────────────────────────────
// Connection credentials (api_key, endpoint, ui_url) are entered here at
// audit-run time and never stored — they are used only for the duration of
// the audit request.
export const runBlackBoxAudit = (data: {
  ai_name:   string;
  mode:      "api" | "ui";
  endpoint?: string;
  api_key?:  string;
  ui_url?:   string;
}) => api.post("/blackbox/audit", data);

export const getBlackBoxHistory = (aiName: string) =>
  api.get(`/blackbox/history/${aiName}`);

export const getAllBlackBoxHistory = () =>
  api.get("/blackbox/history-all");

export const getBlackBoxAuditById = (auditId: string) =>
  api.get(`/blackbox/audit/${auditId}`);

// ── Chat History Ingest ───────────────────────────────────────────────────────
export const ingestChatHistory = (aiName: string, text: string, source = "") =>
  api.post(`/sdcc/ingest-chat/${aiName}`, { text, source });

// ── Re-run Audit ──────────────────────────────────────────────────────────────
export const runRerunAudit = (data: {
  prior_audit_id:  string;
  user_context:    string;
  scope_override?: "full" | "targeted" | "phase1_only";
  endpoint?:       string;
  api_key?:        string;
  mode?:           string;
}) => api.post("/blackbox/audit/rerun", data);

export const getRerunHistory = (aiName: string) =>
  api.get(`/blackbox/rerun-history/${aiName}`);

export default api;