import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth helper functions
export const authAPI = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  signup: async (userData) => {
    const res = await api.post('/auth/signup', userData);
    return res.data;
  },
  createUser: async (userData) => {
    const res = await api.post('/auth/create-user', userData);
    return res.data;
  },
  getUsers: async () => {
    const res = await api.get('/auth/users');
    return res.data;
  },
  updateUser: async (id, userData) => {
    const res = await api.put(`/auth/users/${id}`, userData);
    return res.data;
  },
  deleteUser: async (id) => {
    const res = await api.delete(`/auth/users/${id}`);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  }
};

export default api;
