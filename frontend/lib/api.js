// lib/api.js
import axios from "axios";

/* -------- Base URL -------- */
const fromVite =
  typeof import.meta !== "undefined" &&
  import.meta?.env &&
  import.meta.env.VITE_API_URL;

// Allow absolute (https://api...) or relative ("/") bases (for Vercel rewrites)
const normalizeBase = (b) => {
  if (!b) return "http://localhost:4000";
  const s = String(b).trim();
  // strip trailing slash
  return s.endsWith("/") && s !== "/" ? s.slice(0, -1) : s;
};

export const API_BASE = normalizeBase(fromVite || "http://localhost:4000");

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
  baseURL: API_BASE,              // can be "https://api..." or "/"
  timeout: 30000,                 // bump to 30s for cold starts
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  // You use Bearer tokens (no cookies) -> keep credentials off to simplify CORS
  withCredentials: false,
});

// simple exponential backoff helper
export async function withRetry(fn, { retries = 2, baseDelay = 600 } = {}) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); } catch (e) { lastErr = e; }
    await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, i)));
  }
  throw lastErr;
}

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

/** Optional: call once on app start to warm the API (no React hooks here) */
export const warmApi = () => pingHealth().catch(() => {});

// Profile (private)
export const updateMyProfile = (payload) =>
  api.patch("/api/profile/me", payload);

export const getMyProfile = () => api.get("/api/profile/me");

export const uploadAvatar = (file) => {
  const fd = new FormData();
  fd.append("avatar", file);
  return api.post("/api/profile/avatar", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// Links (private)
export const createMyLink = (payload) => api.post("/api/links/me", payload);
export const deleteMyLink = (id) => api.delete(`/api/links/me/${id}`);
export const toggleLink = (id, isActive) =>
  api.patch(`/api/links/me/${id}`, { isActive });
export const reorderLinks = (items) =>
  api.post(`/api/links/me/reorder`, { items });

// (Optional) helpers to normalize user-entered URLs when bulk-saving
const OPTION_LABEL = {
  website: "Website",
  twitter: "Twitter",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  custom: "Custom",
};

const ensureHttpUrl = (s = "") => {
  const t = String(s).trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
};

const toBulkPayload = (links = []) =>
  links
    .filter(l => (l.url || "").trim())
    .map((l, idx) => ({
      title: (l.name || "").trim() || OPTION_LABEL[l.type] || `Link ${idx + 1}`,
      url: ensureHttpUrl(l.url),
      isActive: l.isActive !== false,
    }));

export const listMyLinks = (token, { limit = 50, skip = 0, q = "" } = {}) =>
  api.get("/api/links/me", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    params: { limit, skip, q },
  });

export const saveMyLinks = (links, token) =>
  api.put("/api/links/me/bulk", { links }, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

// Public page
export const getPublicProfile = (handle) =>
  api.get(`/api/public/${encodeURIComponent(handle)}`);

// Auth
export const register = (payload) => api.post("/api/auth/register", payload);

export const login = async (body) => {
  const res = await api.post("/api/auth/login", body);
  const data = res.data;
  if (data?.token) setAuthToken(data.token);
  return data;
};

export const logout = () => {
  setAuthToken(null);
  storage.remove("me");
  return Promise.resolve();
};

/* -------- Public profile helpers (cached + robust) -------- */

// Normalize any incoming route param to a safe handle
export const normalizeHandle = (raw) => {
  if (!raw) return "";
  return String(raw).replace(/^[@:]+/, "").trim().toLowerCase();
};

// Resolve an asset (e.g., avatarUrl) against API_BASE (or window origin if relative base)
export const resolveAssetUrl = (u, base = API_BASE) => {
  if (!u) return "";
  try {
    if (/^https?:\/\//i.test(u)) return u;
    const b = String(base || "");
    const absolute = /^https?:\/\//i.test(b)
      ? b
      : (typeof window !== "undefined" && window.location?.origin) || "http://localhost:5173";
    return new URL(u, absolute.endsWith("/") ? absolute : absolute + "/").toString();
  } catch {
    return u;
  }
};

// Simple in-memory + sessionStorage cache (SWR-ish)
const _ppMem = new Map(); // handle -> { data, ts }
const _ppKey = (h) => `pprofile:${h}`;

export async function getPublicProfileCached(handle, { ttl = 30000, signal } = {}) {
  const h = normalizeHandle(handle);
  if (!h) {
    const err = new Error("invalid_handle");
    err.code = "invalid_handle";
    throw err;
  }

  const now = Date.now();

  // 1) Memory cache
  const mem = _ppMem.get(h);
  if (mem && now - mem.ts < ttl) return mem.data;

  // 2) Session cache
  try {
    const raw = sessionStorage.getItem(_ppKey(h));
    if (raw) {
      const cached = JSON.parse(raw);
      if (cached?.ts && now - cached.ts < ttl) {
        _ppMem.set(h, { data: cached.data, ts: cached.ts });
        return cached.data;
      }
    }
  } catch {}

  // 3) Network
  try {
    const res = await api.get(`/api/public/${encodeURIComponent(h)}`, { signal });
    const data = res.data;
    const pack = { data, ts: now };
    _ppMem.set(h, pack);
    try { sessionStorage.setItem(_ppKey(h), JSON.stringify(pack)); } catch {}
    return data;
  } catch (e) {
    const msg = e?.response?.data?.error || e.message || "error";
    const err = new Error(msg);
    err.code = msg;
    throw err;
  }
}

