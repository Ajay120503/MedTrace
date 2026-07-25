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

// Helper to unwrap axios response
const unwrap = (promise) => promise.then((res) => res.data);

// Patient API
export const patientAPI = {
  register: (data) => unwrap(api.post('/patients/register', data)),
  getHistory: (id) => unwrap(api.get(`/patients/${id}/history`)),
  addHistoryEntry: (id, data) => unwrap(api.post(`/patients/${id}/history`, data)),
  getAccessLog: (id) => unwrap(api.get(`/patients/${id}/access-log`)),
  getQR: (id) => unwrap(api.get(`/patients/${id}/qr`)),
  exportPDF: (id) => api.get(`/patients/${id}/export-pdf`, { responseType: 'blob' }).then(res => res.data),
};

// Doctor API
export const doctorAPI = {
  register: (data) => unwrap(api.post('/doctors/register', data)),
  getMe: () => unwrap(api.get('/doctors/me')),
};

// Hospital API
export const hospitalAPI = {
  register: (data) => unwrap(api.post('/hospitals/register', data)),
  registerAdmin: (data) => unwrap(api.post('/hospitals/admin/register', data)),
  getAll: () => unwrap(api.get('/hospitals')),
  getById: (id) => unwrap(api.get(`/hospitals/${id}`)),
};

// Nominee API
export const nomineeAPI = {
  add: (data) => unwrap(api.post('/nominees', data)),
  confirm: (id) => unwrap(api.post(`/nominees/${id}/confirm`)),
  getAll: () => unwrap(api.get('/nominees')),
};

// Access API
export const accessAPI = {
  request: (data) => unwrap(api.post('/access/request', data)),
  verifyOtp: (data) => unwrap(api.post('/access/verify-otp', data)),
};

// Emergency API
export const emergencyAPI = {
  lookup: (data) => unwrap(api.post('/emergency/lookup', data)),
  breakGlass: (patientId, data) => unwrap(api.post(`/emergency/breakglass/${patientId}`, data)),
  getSummary: (patientId) => unwrap(api.get(`/emergency/summary/${patientId}`)),
};

// Admin API
export const adminAPI = {
  approveDoctor: (id, data) => unwrap(api.post(`/admin/approve-doctor/${id}`, data)),
  getDoctors: (params) => unwrap(api.get('/admin/doctors', { params })),
  verifyAudit: () => unwrap(api.get('/admin/audit/verify')),
  getDashboardStats: () => unwrap(api.get('/admin/dashboard/stats')),
};

// Drug Check API
export const drugCheckAPI = {
  check: (data) => unwrap(api.post('/drug-check', data)),
  getReference: () => unwrap(api.get('/drug-check/reference')),
};

// Upload API (Cloudinary signed uploads)
export const uploadAPI = {
  sign: (data) => unwrap(api.post('/uploads/sign', data)),
  saveDoctorCertificate: (id, data) => unwrap(api.post(`/uploads/doctors/${id}/certificate`, data)),
  saveHospitalLogo: (id, data) => unwrap(api.post(`/uploads/hospitals/${id}/logo`, data)),
  savePatientPhoto: (id, data) => unwrap(api.post(`/uploads/patients/${id}/photo`, data)),
  delete: (publicId) => unwrap(api.delete(`/uploads/${publicId}`)),
};

// User API
export const userAPI = {
  changePassword: (data) => unwrap(api.post('/users/change-password', data)),
  logoutEverywhere: () => unwrap(api.post('/users/logout-everywhere')),
  getMe: () => unwrap(api.get('/users/me')),
  updateProfile: (data) => unwrap(api.put('/users/profile', data)),
  forgotPassword: (data) => unwrap(api.post('/users/forgot-password', data)),
  resetPassword: (data) => unwrap(api.post('/users/reset-password', data)),
};
