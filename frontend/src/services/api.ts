import axios from "axios";

const BASE_URL = "http://localhost:8000";

const api = axios.create({ baseURL: BASE_URL });

// ── Attach JWT to every request automatically ─────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────
export const registerUser = (data: {
  name: string; email: string; password: string;
}) => api.post("/api/auth/register", data);

export const loginUser = (data: {
  email: string; password: string;
}) => api.post("/api/auth/login", data);

export const getProfile = () => api.get("/api/auth/me");

// ── Register AI ───────────────────────────────────────────────────────────
export const registerAI = (data: {
  name: string;
  description: string;
  domain: string;
  connector: { type: string; endpoint: string; headers: object };
}) => api.post("/register-ai", data);

// ── SDCC Ingest ───────────────────────────────────────────────────────────
// ⚠ Do NOT set Content-Type manually — axios must set it automatically
//   so it includes the correct multipart boundary string.
export const sdccIngest = (aiName: string, file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post(`/sdcc/ingest/${aiName}`, fd);
};

// ── Legacy CSV Upload ─────────────────────────────────────────────────────
export const uploadCSV = (aiName: string, file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post(`/upload-csv/${aiName}`, fd);
};

// ── Evaluate ──────────────────────────────────────────────────────────────
export const evaluateAI = (aiName: string) =>
  api.post(`/evaluate/${aiName}`);

// ── Black Box Audit ───────────────────────────────────────────────────────
export const runBlackBoxAudit = (data: {
  ai_name: string;
  mode: "api" | "ui";
  endpoint?: string;
  api_key?: string;
  ui_url?: string;
}) => api.post("/blackbox/audit", data);

export const getBlackBoxHistory = (aiName: string) =>
  api.get(`/blackbox/history/${aiName}`);