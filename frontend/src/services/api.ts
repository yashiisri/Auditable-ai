// // import axios from "axios";

// // const BASE_URL = "http://localhost:8000";

// // const api = axios.create({ baseURL: BASE_URL });

// // // Attach JWT to every request automatically
// // api.interceptors.request.use((config) => {
// //   const token = localStorage.getItem("token");
// //   if (token) config.headers.Authorization = `Bearer ${token}`;
// //   return config;
// // });

// // // ── Auth ──────────────────────────────────────────────────────────────────
// // export const registerUser = (data: { name: string; email: string; password: string }) =>
// //   api.post("/api/auth/register", data);

// // export const loginUser = (data: { email: string; password: string }) =>
// //   api.post("/api/auth/login", data);

// // export const getProfile = () =>
// //   api.get("/api/auth/me");

// // export const updateProfile = (data: { name: string }) =>
// //   api.patch("/api/auth/me", data);

// // // ── Register AI ───────────────────────────────────────────────────────────
// // export const registerAI = (data: {
// //   name: string; description: string; domain: string;
// //   connector: { type: string; endpoint: string; headers: object };
// // }) => api.post("/register-ai", data);

// // // ── SDCC Ingest ───────────────────────────────────────────────────────────
// // export const sdccIngest = (aiName: string, file: File) => {
// //   const fd = new FormData();
// //   fd.append("file", file);
// //   return api.post(`/sdcc/ingest/${aiName}`, fd);
// // };

// // // ── Evaluate ──────────────────────────────────────────────────────────────
// // export const evaluateAI = (aiName: string) =>
// //   api.post(`/evaluate/${aiName}`);

// // // ── Reports (evaluate pipeline) ───────────────────────────────────────────
// // // Returns all evaluation reports for the current user.
// // export const getReports = () =>
// //   api.get("/reports");

// // // Returns a single report by report_id.
// // export const getReportById = (reportId: string) =>
// //   api.get(`/reports/${reportId}`);

// // // ── Black Box Audit ───────────────────────────────────────────────────────
// // export const runBlackBoxAudit = (data: {
// //   ai_name: string; mode: "api" | "ui";
// //   endpoint?: string; api_key?: string; ui_url?: string;
// // }) => api.post("/blackbox/audit", data);

// // export const getBlackBoxHistory = (aiName: string) =>
// //   api.get(`/blackbox/history/${aiName}`);

// // export const getAllBlackBoxHistory = () =>
// //   api.get("/blackbox/history-all");

// // export const getBlackBoxAuditById = (auditId: string) =>
// //   api.get(`/blackbox/audit/${auditId}`);




// import axios from "axios";

// const BASE_URL = "http://localhost:8000";

// const api = axios.create({ baseURL: BASE_URL });

// // Attach JWT to every request automatically
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// // ── Auth ──────────────────────────────────────────────────────────────────
// export const registerUser = (data: { name: string; email: string; password: string }) =>
//   api.post("/api/auth/register", data);

// export const loginUser = (data: { email: string; password: string }) =>
//   api.post("/api/auth/login", data);

// export const getProfile = () =>
//   api.get("/api/auth/me");

// export const updateProfile = (data: { name: string }) =>
//   api.patch("/api/auth/me", data);

// // ── Register AI ───────────────────────────────────────────────────────────
// export const registerAI = (data: {
//   name: string; description: string; domain: string;
//   connector: { type: string; endpoint: string; headers: object };
// }) => api.post("/register-ai", data);

// // ── SDCC Ingest ───────────────────────────────────────────────────────────
// export const sdccIngest = (aiName: string, file: File) => {
//   const fd = new FormData();
//   fd.append("file", file);
//   return api.post(`/sdcc/ingest/${aiName}`, fd);
// };

// // ── Evaluate ──────────────────────────────────────────────────────────────
// export const evaluateAI = (aiName: string) =>
//   api.post(`/evaluate/${aiName}`);

// // ── Reports (evaluate pipeline) ───────────────────────────────────────────
// // Returns all evaluation reports for the current user.
// export const getReports = () =>
//   api.get("/reports");

// // Returns a single report by report_id.
// export const getReportById = (reportId: string) =>
//   api.get(`/reports/${reportId}`);

// // ── Black Box Audit ───────────────────────────────────────────────────────
// export const runBlackBoxAudit = (data: {
//   ai_name: string; mode: "api" | "ui";
//   endpoint?: string; api_key?: string; ui_url?: string;
// }) => api.post("/blackbox/audit", data);

// export const getBlackBoxHistory = (aiName: string) =>
//   api.get(`/blackbox/history/${aiName}`);

// export const getAllBlackBoxHistory = () =>
//   api.get("/blackbox/history-all");

// export const getBlackBoxAuditById = (auditId: string) =>
//   api.get(`/blackbox/audit/${auditId}`);

// // Default export for direct use in components
// export default api;0



import axios from "axios";

const BASE_URL = "http://localhost:8000";

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────
export const registerUser = (data: { name: string; email: string; password: string }) =>
  api.post("/api/auth/register", data);

export const loginUser = (data: { email: string; password: string }) =>
  api.post("/api/auth/login", data);

export const getProfile = () =>
  api.get("/api/auth/me");

export const updateProfile = (data: { name: string }) =>
  api.patch("/api/auth/me", data);

// ── Register AI ───────────────────────────────────────────────────────────
export const registerAI = (data: {
  name: string; description: string; domain: string;
  connector: { type: string; endpoint: string; headers: object };
}) => api.post("/register-ai", data);

// ── SDCC Ingest ───────────────────────────────────────────────────────────
export const sdccIngest = (aiName: string, file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post(`/sdcc/ingest/${aiName}`, fd);
};

// ── KB Upload — uses same api instance so baseURL + auth are inherited ────
export const uploadKnowledgeBase = (aiName: string, files: File[]) => {
  const fd = new FormData();
  // Field name MUST be "files" — matches FastAPI List[UploadFile] = File(...)
  files.forEach((f) => fd.append("files", f));
  return api.post(`/sdcc/upload-kb/${aiName}`, fd);
  // Do NOT set Content-Type — axios sets multipart/form-data + boundary automatically
};

// ── Evaluate ──────────────────────────────────────────────────────────────
export const evaluateAI = (aiName: string) =>
  api.post(`/evaluate/${aiName}`);

// ── Reports (evaluate pipeline) ───────────────────────────────────────────
export const getReports = () =>
  api.get("/reports");

export const getReportById = (reportId: string) =>
  api.get(`/reports/${reportId}`);

// ── Black Box Audit ───────────────────────────────────────────────────────
export const runBlackBoxAudit = (data: {
  ai_name: string; mode: "api" | "ui";
  endpoint?: string; api_key?: string; ui_url?: string;
}) => api.post("/blackbox/audit", data);

export const getBlackBoxHistory = (aiName: string) =>
  api.get(`/blackbox/history/${aiName}`);

export const getAllBlackBoxHistory = () =>
  api.get("/blackbox/history-all");

export const getBlackBoxAuditById = (auditId: string) =>
  api.get(`/blackbox/audit/${auditId}`);

// ── Chat History Ingest ───────────────────────────────────────────────────
export const ingestChatHistory = (aiName: string, text: string, source = "") =>
  api.post(`/sdcc/ingest-chat/${aiName}`, { text, source });