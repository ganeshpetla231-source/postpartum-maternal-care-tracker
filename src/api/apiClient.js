import axios from 'axios';
import { clearAccessToken, saveAccessToken } from '../utils/auth';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

let refreshPromise;

function isAuthRequest(url = '') {
  return /\/auth\/(login|register|refresh|logout)(?:\?|$)/.test(url);
}

export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post('/auth/refresh')
      .finally(() => {
        refreshPromise = undefined;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthRequest(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      const response = await refreshAccessToken();
      const accessToken = response.data.data.accessToken;
      saveAccessToken(accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearAccessToken();
      window.dispatchEvent(new Event('auth:expired'));
      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;
