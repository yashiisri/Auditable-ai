// import axios from "axios";

// const BASE_URL = "http://localhost:8000";

// const api = axios.create({ baseURL: BASE_URL });

// // ── Register AI ────────────────────────────────────────────────────────────
// export const registerAI = (data: {
//   name: string;
//   description: string;
//   domain: string;
//   risk_level: string;
//   connector: { type: string; endpoint: string; headers: object };
// }) => api.post("/register-ai", data);

// // ── Legacy CSV Upload ──────────────────────────────────────────────────────
// export const uploadCSV = (aiName: string, file: File) => {
//   const formData = new FormData();
//   formData.append("file", file);
//   return api.post(`/upload-csv/${aiName}`, formData, {
//     headers: { "Content-Type": "multipart/form-data" },
//   });
// };

// // ── Auth ────────────────────────────────────────────────────────────────
// export const registerUser = (data: {
//   name: string;
//   email: string;
//   password: string;
// }) => api.post("/auth/register", data);

// export const loginUser = (data: {
//   email: string;
//   password: string;
// }) => api.post("/auth/login", data);
// // ── SDCC Ingest (CSV or JSON) ──────────────────────────────────────────────
// export const sdccIngest = (aiName: string, file: File) => {
//   const formData = new FormData();
//   formData.append("file", file);
//   return api.post(`/sdcc/ingest/${aiName}`, formData, {
//     headers: { "Content-Type": "multipart/form-data" },
//   });
// };

// // ── Get SDCC Classification ────────────────────────────────────────────────
// export const getSDCCClassification = (aiName: string) =>
//   api.get(`/sdcc/classification/${aiName}`);

// // ── Run Evaluation ─────────────────────────────────────────────────────────
// export const evaluateAI = (aiName: string) =>
//   api.post(`/evaluate/${aiName}`);


import axios from "axios";

const BASE_URL = "http://localhost:8000";

const api = axios.create({ baseURL: BASE_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Register AI ────────────────────────────────────────────────────────────
export const registerAI = (data: {
  name: string;
  description: string;
  domain: string;

  connector: { type: string; endpoint: string; headers: object };
}) => api.post("/register-ai", data);

// ── Legacy CSV Upload ──────────────────────────────────────────────────────
export const uploadCSV = (aiName: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`/upload-csv/${aiName}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// ── Auth (FIXED ROUTES) ───────────────────────────────────────────────────
export const registerUser = (data: {
  name: string;
  email: string;
  password: string;
}) => api.post("/api/auth/register", data);

export const loginUser = (data: {
  email: string;
  password: string;
}) => api.post("/api/auth/login", data);

// ── SDCC Ingest (CSV or JSON) ──────────────────────────────────────────────
export const sdccIngest = (aiName: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`/sdcc/ingest/${aiName}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// ── Get SDCC Classification ────────────────────────────────────────────────
export const getSDCCClassification = (aiName: string) =>
  api.get(`/sdcc/classification/${aiName}`);

// ── Run Evaluation ─────────────────────────────────────────────────────────
export const evaluateAI = (aiName: string) =>
  api.post(`/evaluate/${aiName}`);