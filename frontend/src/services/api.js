import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // 60 segundos (antes era 10000)
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@casa_clean:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('@casa_clean:token');
      localStorage.removeItem('@casa_clean:user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;