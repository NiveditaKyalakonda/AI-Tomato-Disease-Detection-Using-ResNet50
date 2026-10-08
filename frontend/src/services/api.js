import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 60000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  update: (data) => api.put('/auth/update', data),
}

export const predictAPI = {
  predict: (formData) =>
    api.post('/predict', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    }),
  getGradcam: (id) => api.get(`/gradcam/${id}`),
}

export const modelAPI = {
  health: () => api.get('/health'),
  info: () => api.get('/model-info'),
}

export const historyAPI = {
  list: (params) => api.get('/history', { params }),
  detail: (id) => api.get(`/history/${id}`),
  delete: (id) => api.delete(`/history/${id}`),
}

export const diseaseAPI = {
  list: () => api.get('/diseases'),
  detail: (name) => api.get(`/diseases/${name}`),
}

export const weatherAPI = {
  risk: (params) => api.get('/weather-risk', { params }),
}

export const dashboardAPI = {
  get: () => api.get('/dashboard'),
}

export const expertAPI = {
  request: (data) => api.post('/expert-request', data),
}

export const adminAPI = {
  stats: () => api.get('/admin/stats'),
  users: (params) => api.get('/admin/users', { params }),
  expertRequests: (params) => api.get('/admin/expert-requests', { params }),
  updateRequest: (id, data) => api.put(`/admin/expert-requests/${id}`, data),
}

export default api