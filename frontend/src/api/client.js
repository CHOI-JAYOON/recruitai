import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  let token = localStorage.getItem('token');
  if (!token) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.token) {
        token = user.token;
        localStorage.setItem('token', token);
      }
    } catch {}
  }
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    if (error.response?.status === 403 && error.response?.data?.detail?.error === 'usage_limit_exceeded') {
      window.dispatchEvent(new CustomEvent('usage-limit-exceeded', {
        detail: error.response.data.detail,
      }));
    }
    return Promise.reject(error);
  }
);

export default api;
