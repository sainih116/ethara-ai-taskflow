import api from './axios'

export const authAPI = {
  register:       (data)            => api.post('/auth/register', data),
  login:          (data)            => api.post('/auth/login', data),
  getMe:          ()                => api.get('/auth/me'),
  updateProfile:  (data)            => api.put('/auth/profile', data),
  changePassword: (data)            => api.put('/auth/change-password', data),
  forgotPassword: (email)           => api.post('/auth/forgot-password', { email }),
  resetPassword:  (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
}
