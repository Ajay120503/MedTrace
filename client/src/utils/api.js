import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken || refreshToken === 'null' || refreshToken === 'undefined') {
          throw new Error('No valid refresh token');
        }

        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Clear all stored auth data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        // Redirect to login on any refresh failure
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  verifyMfa: (data) => api.post('/auth/verify-mfa', data),
  refresh: (data) => api.post('/auth/refresh', data),
  logout: (data) => api.post('/auth/logout', data),
};

// Patient API
export const patientAPI = {
  register: (data) => api.post('/patients/register', data),
  getHistory: (id) => api.get(`/patients/${id}/history`),
  addHistoryEntry: (id, data) => api.post(`/patients/${id}/history`, data),
  getAccessLog: (id) => api.get(`/patients/${id}/access-log`),
  getQR: (id) => api.get(`/patients/${id}/qr`),
  exportPDF: (id) => api.get(`/patients/${id}/export-pdf`, { responseType: 'blob' }),
};

// Doctor API
export const doctorAPI = {
  register: (data) => api.post('/doctors/register', data),
  getMe: () => api.get('/doctors/me'),
};

// Hospital API
export const hospitalAPI = {
  register: (data) => api.post('/hospitals/register', data),
  registerAdmin: (data) => api.post('/hospitals/admin/register', data),
  getAll: () => api.get('/hospitals'),
  getById: (id) => api.get(`/hospitals/${id}`),
};

// Nominee API
export const nomineeAPI = {
  add: (data) => api.post('/nominees', data),
  confirm: (id) => api.post(`/nominees/${id}/confirm`),
  getAll: () => api.get('/nominees'),
};

// Access API
export const accessAPI = {
  request: (data) => api.post('/access/request', data),
  verifyOtp: (data) => api.post('/access/verify-otp', data),
};

// Emergency API
export const emergencyAPI = {
  lookup: (data) => api.post('/emergency/lookup', data),
  breakGlass: (patientId, data) => api.post(`/emergency/breakglass/${patientId}`, data),
  getSummary: (patientId) => api.get(`/emergency/summary/${patientId}`),
};

// Admin API
export const adminAPI = {
  approveDoctor: (id, data) => api.post(`/admin/approve-doctor/${id}`, data),
  getDoctors: (params) => api.get('/admin/doctors', { params }),
  verifyAudit: () => api.get('/admin/audit/verify'),
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
};

// Drug Check API
export const drugCheckAPI = {
  check: (data) => api.post('/drug-check', data),
  getReference: () => api.get('/drug-check/reference'),
};

// Upload API (Cloudinary signed uploads)
export const uploadAPI = {
  sign: (data) => api.post('/uploads/sign', data),
  saveDoctorCertificate: (id, data) => api.post(`/uploads/doctors/${id}/certificate`, data),
  saveHospitalLogo: (id, data) => api.post(`/uploads/hospitals/${id}/logo`, data),
  savePatientPhoto: (id, data) => api.post(`/uploads/patients/${id}/photo`, data),
  delete: (publicId) => api.delete(`/uploads/${publicId}`),
};

// User API
export const userAPI = {
  changePassword: (data) => api.post('/users/change-password', data),
  logoutEverywhere: () => api.post('/users/logout-everywhere'),
  getMe: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/profile', data),
  forgotPassword: (data) => api.post('/users/forgot-password', data),
  resetPassword: (data) => api.post('/users/reset-password', data),
};
