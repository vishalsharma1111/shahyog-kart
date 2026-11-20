import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercept requests to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('shahyog_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses for auth expiration and HTML-fallback prevention
api.interceptors.response.use(
  (response) => {
    // If Vercel rewrote /api to index.html (SPA fallback), treat as offline/unavailable
    if (typeof response.data === 'string' && response.data.trim().startsWith('<!doctype html>')) {
      return Promise.reject({
        response: {
          status: 404,
          data: { message: 'Backend service offline or waking up' }
        }
      });
    }
    return response;
  },
  (error) => {
    const token = localStorage.getItem('shahyog_token');
    const isDemoToken = token && (token.startsWith('shahyog_demo_') || token.startsWith('shahyog_custom_'));

    // Only clear session on 401 if it's a real backend token that actually expired
    if (error.response && error.response.status === 401 && !isDemoToken) {
      if (token) {
        localStorage.removeItem('shahyog_token');
        localStorage.removeItem('shahyog_user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?expired=1';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
