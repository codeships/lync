// lib/api.js
import axios from "axios";

/* -------- Base URL -------- */
const fromVite =
  typeof import.meta !== "undefined" &&
  import.meta?.env &&
  import.meta.env.VITE_API_URL;

const API_BASE = (fromVite && String(fromVite)) || "http://localhost:4000";

/* -------- Token storage helpers (SSR-safe) -------- */
const canUseStorage = typeof window !== "undefined" && !!window.localStorage;

const storage = {
  get(key) {
    if (!canUseStorage) return null;
    try { return window.localStorage.getItem(key); } catch { return null; }
  },
  set(key, val) {
    if (!canUseStorage) return;
    try {
      if (val == null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, val);
    } catch {}
  },
  remove(key) {
    if (!canUseStorage) return;
    try { window.localStorage.removeItem(key); } catch {}
  },
};

const TOKEN_KEY = "token";

/* -------- Single Axios instance -------- */
export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  // If you switch to cookie sessions, uncomment:
  // withCredentials: true,
});

/* -------- Token helpers -------- */
export const setAuthToken = (token) => {
  if (token) storage.set(TOKEN_KEY, token);
  else storage.remove(TOKEN_KEY);
};

export const getAuthToken = () => storage.get(TOKEN_KEY);

/* -------- Interceptors -------- */
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token && !config.headers?.Authorization) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const url = err?.config?.url || "";
    const isAuthEndpoint = /\/api\/auth\/(login|register)/.test(url);
    if (status === 401 && !isAuthEndpoint) {
      setAuthToken(null);
      storage.remove("me");
    }
    return Promise.reject(err);
  }
);

/* -------- Handy API helpers -------- */
// Health
export const pingHealth = () => api.get("/api/health");

// Profile (private)
export const getMyProfile = () => api.get("/api/profile/me");
export const updateMyProfile = (payload) => api.put("/api/profile/me", payload);

// Links (private)
export const listMyLinks = () => {
  const token = localStorage.getItem("token");

  api.get("/api/links/me", {
    headers: { Authorization: `Bearer ${token}` }
  })
};
export const createMyLink = (payload) => api.post("/api/links/me", payload);
export const deleteMyLink = (id) => api.delete(`/api/links/me/${id}`);
export const toggleLink = (id, isActive) =>
  api.patch(`/api/links/me/${id}`, { isActive });
export const reorderLinks = (items) =>
  api.post(`/api/links/me/reorder`, { items });

export const saveMyLinksBulk = (links) => {
  const token = localStorage.getItem("token");

  api.put(`/api/links/me/bulk`, { links }, {
    headers:{ Authorization:`Bearer ${token}`}
  })
};


// Public page
export const getPublicProfile = (handle) =>
  api.get(`/api/public/${encodeURIComponent(handle)}`);

// Auth
export const register = (payload) => api.post("/api/auth/register", payload);

/**
 * Login and persist token automatically.
 * Returns { token, user? } (whatever your backend sends).
 */
export const login = async (body) => {
  const res = await api.post("/api/auth/login", body); // <-- no Authorization here
  const data = res.data;
  if (data?.token) setAuthToken(data.token); // <-- save it
  return data;
};

/** Logout: clear local token + cached profile */
export const logout = () => {
  setAuthToken(null);
  storage.remove("me");
  return Promise.resolve();
};

