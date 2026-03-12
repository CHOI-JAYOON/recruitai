import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// AI-related endpoints that need the OpenAI API key
const AI_PATHS = [
  '/resume/generate', '/resume/download',
  '/cover-letter/answer', '/cover-letter/refine',
  '/interview/generate-questions', '/interview/evaluate',
  '/portfolios/parse',
  '/career-description/generate', '/career-description/download',
  '/profile/', // parse-resume
];

api.interceptors.request.use((config) => {
  // Attach JWT token to all authenticated requests
  let token = localStorage.getItem('token');
  // Fallback: check if token is stored inside user object
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

  // Attach OpenAI API key only for AI-related endpoints
  const apiKey = localStorage.getItem('apiKey');
  if (apiKey && AI_PATHS.some((p) => config.url?.includes(p))) {
    config.headers['x-api-key'] = apiKey;
  }

  return config;
});

// Handle 401 responses (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('apiKey');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
