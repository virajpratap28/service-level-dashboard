import axios from "axios";

const api = axios.create({
  baseURL: "https://service-level-dashboard-h1yv.onrender.com",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sl_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem("sl_token");
      localStorage.removeItem("sl_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ---------------------------------------------------------------------------
// Endpoint helpers
// ---------------------------------------------------------------------------

export const login = (username, password) =>
  api.post("/auth/login", { username, password }).then((r) => r.data);

export const getFilterOptions = () =>
  api.get("/dashboard/filters").then((r) => r.data);

export const getDashboard = (params) =>
  api.get("/dashboard", { params }).then((r) => r.data);

export const getHourly = (params) =>
  api.get("/hourly", { params }).then((r) => r.data);

export const getDaily = (params) =>
  api.get("/daily", { params }).then((r) => r.data);

export const getWeekly = (params) =>
  api.get("/weekly", { params }).then((r) => r.data);

export const getMonthly = (params) =>
  api.get("/monthly", { params }).then((r) => r.data);

export const getQueueAnalysis = (params) =>
  api.get("/queue", { params }).then((r) => r.data);

export const getWaitDrilldown = (params) =>
  api.get("/queue/wait-drilldown", { params }).then((r) => r.data);

export const getSiteAnalysis = (params) =>
  api.get("/site", { params }).then((r) => r.data);

export const getSlaTrendBySite = (params) =>
  api.get("/site/sla-trend", { params }).then((r) => r.data);

export const uploadWorkbook = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api
    .post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data);
};

export const listReportFiles = () => api.get("/reports/files").then((r) => r.data);

export const exportCsvUrl = (params) => {
  const qs = new URLSearchParams(params).toString();
  return `/api/reports/export/csv${qs ? `?${qs}` : ""}`;
};

export const exportPdfUrl = (params) => {
  const qs = new URLSearchParams(params).toString();
  return `/api/reports/export/pdf${qs ? `?${qs}` : ""}`;
};

export default api;
