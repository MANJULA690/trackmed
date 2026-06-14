import api from "./axios";

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  login:          (data) => api.post("/auth/login", data),
  register:       (data) => api.post("/auth/register", data),
  getMe:          ()     => api.get("/auth/me"),
  updatePassword: (data) => api.put("/auth/update-password", data),
  getUsers:       ()     => api.get("/auth/users"),
};

// ── Medicines ─────────────────────────────────────────────────
export const medicineAPI = {
  getAll:   (params) => api.get("/medicines", { params }),
  getOne:   (id)     => api.get(`/medicines/${id}`),
  create:   (data)   => api.post("/medicines", data),
  update:   (id, data) => api.put(`/medicines/${id}`, data),
  delete:   (id)     => api.delete(`/medicines/${id}`),
  updateStock: (id, data) => api.patch(`/medicines/${id}/stock`, data),
  getStats: ()       => api.get("/medicines/stats/summary"),
};

// ── Alerts ────────────────────────────────────────────────────
export const alertAPI = {
  getAll:       (params) => api.get("/alerts", { params }),
  markRead:     (id)     => api.patch(`/alerts/${id}/read`),
  markAllRead:  ()       => api.patch("/alerts/mark-all-read"),
  resolve:      (id)     => api.patch(`/alerts/${id}/resolve`),
  triggerScan:  ()       => api.post("/alerts/scan"),
};

// ── Predictions ───────────────────────────────────────────────
export const predictionAPI = {
  getAll:    (params) => api.get("/predictions", { params }),
  getOne:    (id)     => api.get(`/predictions/${id}`),
  getHistory:(id, params) => api.get(`/predictions/${id}/history`, { params }),
};

// ── Reports ───────────────────────────────────────────────────
export const reportAPI = {
  expiry:           () => api.get("/reports/expiry"),
  stock:            () => api.get("/reports/stock"),
  transactions:  (params) => api.get("/reports/transactions", { params }),
  categoryOverview: () => api.get("/reports/category-overview"),
};
