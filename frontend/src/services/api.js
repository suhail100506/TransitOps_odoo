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
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------
export const authAPI = {
  login: async (credentials) => (await api.post('/auth/login', credentials)).data,
  signup: async (userData) => (await api.post('/auth/signup', userData)).data,
  getMe: async () => (await api.get('/auth/me')).data,
  updateProfile: async (data) => (await api.put('/auth/profile', data)).data,
  setUserStatus: async (id, status) => (await api.patch(`/auth/users/${id}/status`, { status })).data,
};

// ---------------------------------------------------------------------------
// Vehicle API
// ---------------------------------------------------------------------------
export const vehicleAPI = {
  getAll: async (params = {}) => (await api.get('/vehicles', { params })).data,
  getAvailable: async () => (await api.get('/vehicles/available')).data,
  getById: async (id) => (await api.get(`/vehicles/${id}`)).data,
  create: async (data) => (await api.post('/vehicles', data)).data,
  update: async (id, data) => (await api.put(`/vehicles/${id}`, data)).data,
  retire: async (id) => (await api.patch(`/vehicles/${id}/retire`)).data,
  getCostSummary: async (id) => (await api.get(`/vehicles/${id}/cost-summary`)).data,
};

// ---------------------------------------------------------------------------
// Driver API
// ---------------------------------------------------------------------------
export const driverAPI = {
  getAll: async (params = {}) => (await api.get('/drivers', { params })).data,
  getAvailable: async () => (await api.get('/drivers/available')).data,
  getExpiring: async () => (await api.get('/drivers/expiring-licenses')).data,
  getById: async (id) => (await api.get(`/drivers/${id}`)).data,
  create: async (data) => (await api.post('/drivers', data)).data,
  update: async (id, data) => (await api.put(`/drivers/${id}`, data)).data,
  changeStatus: async (id, status) => (await api.patch(`/drivers/${id}/status`, { status })).data,
};

// ---------------------------------------------------------------------------
// Trip API
// ---------------------------------------------------------------------------
export const tripAPI = {
  getAll: async (params = {}) => (await api.get('/trips', { params })).data,
  create: async (data) => (await api.post('/trips', data)).data,
  dispatch: async (id) => (await api.post(`/trips/${id}/dispatch`)).data,
  complete: async (id, data) => (await api.post(`/trips/${id}/complete`, data)).data,
  cancel: async (id) => (await api.post(`/trips/${id}/cancel`)).data,
};

// ---------------------------------------------------------------------------
// Dashboard API
// ---------------------------------------------------------------------------
export const dashboardAPI = {
  getKpis: async () => (await api.get('/dashboard/kpis')).data,
};

// ---------------------------------------------------------------------------
// Maintenance API
// ---------------------------------------------------------------------------
export const maintenanceAPI = {
  getAll: async (params = {}) => (await api.get('/maintenance', { params })).data,
  create: async (data) => (await api.post('/maintenance', data)).data,
  close: async (id) => (await api.post(`/maintenance/${id}/close`)).data,
};

// ---------------------------------------------------------------------------
// Fuel & Expenses API
// ---------------------------------------------------------------------------
export const fuelAPI = {
  getAll: async () => (await api.get('/fuel-logs')).data,
  create: async (data) => (await api.post('/fuel-logs', data)).data,
};

export const expenseAPI = {
  getAll: async () => (await api.get('/expenses')).data,
  create: async (data) => (await api.post('/expenses', data)).data,
};

// ---------------------------------------------------------------------------
// Reports API
// ---------------------------------------------------------------------------
export const reportsAPI = {
  getFuelEfficiency: async () => (await api.get('/reports/fuel-efficiency')).data,
  getFleetUtilization: async () => (await api.get('/reports/fleet-utilization')).data,
  getRoi: async () => (await api.get('/reports/roi')).data,
  exportCsv: async () => await api.get('/reports/export', { responseType: 'blob' }),
};

export default api;
