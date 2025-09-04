import axios from "axios";

// point at your Render backend (no trailing slash)
const BASE_URL = "https://lync-backend-gghg.onrender.com";

export const api = axios.create({
  baseURL: BASE_URL,
  // withCredentials: true, // enable if you later switch to cookies
});

// attach JWT if you store it (optional)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// handy helpers
export const pingHealth = () => api.get("/api/health");
export const getMyProfile = () => api.get("/api/profile/me");
export const updateMyProfile = (payload) => api.put("/api/profile/me", payload);
export const listMyLinks = () => api.get("/api/links/me");
export const createMyLink = (payload) => api.post("/api/links/me", payload);
export const deleteMyLink = (id) => api.delete(`/api/links/me/${id}`);
export const toggleLink = (id, isActive) => api.patch(`/api/links/me/${id}`, { isActive });
export const reorderLinks = (items) => api.post(`/api/links/me/reorder`, { items });

// public page
export const getPublicProfile = (handle) => api.get(`/api/public/${encodeURIComponent(handle)}`);
