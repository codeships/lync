// lib/api.js
import axios from "axios";

// Use Vite env: proxy in dev, absolute URL in prod
const API = 'https://lync-backend-gghg.onrender.com';

export const api = axios.create({
  baseURL: API,
  timeout: 100,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  // withCredentials: true, // enable if you switch to cookie auth
});

// token helpers
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
};

// attach JWT if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// optional: auto-clear auth on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("me");
    }
    return Promise.reject(err);
  }
);

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
export const getPublicProfile = (handle) =>
  api.get(`/api/public/${encodeURIComponent(handle)}`);

// auth
export const register = (payload) => api.post("/api/auth/register", payload); // { email, password, displayName? }
export const login = (body) => {
  return axios
    .post(`${API}/auth/login`, body, {
      // withCredentials: true, // uncomment if using cookie sessions
      headers: { 'Content-Type': 'application/json' },
    })
    .then(r => r.data); // normalize so the component gets the payload directly
}// { email, password, displayName? }
export const logout = () => {
  setAuthToken(null);
  localStorage.removeItem("me");
  return Promise.resolve();
};
