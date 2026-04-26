import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4100';

// Debug: Log the actual environment variable being used
console.log('🔍 VITE_API_URL from import.meta.env:', import.meta.env.VITE_API_URL);
console.log('🔍 Final API_BASE_URL:', API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Log the full request URL for debugging
    console.log('🔍 API Request URL:', config.baseURL + config.url);
    console.log('🔍 Full config:', { baseURL: config.baseURL, url: config.url, method: config.method });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      console.error('Access forbidden - token may be invalid');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
