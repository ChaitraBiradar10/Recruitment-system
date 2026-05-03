import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 30000 });

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('git_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('git_token'); localStorage.removeItem('git_user');
    window.location.href = '/login';
  }
  return Promise.reject(err);
});

export const authService = {
  register: d => api.post('/auth/register', d),
  registerWithFile: formData => api.post('/auth/register', formData),
  sendRegistrationOtp: d => api.post('/auth/registration/send-otp', d),
  verifyRegistrationOtp: d => api.post('/auth/registration/verify-otp', d),
  login:    d => api.post('/auth/login', d),
  forgotPassword: d => api.post('/auth/forgot-password', d),
};

export const studentService = {
  getProfile:    ()  => api.get('/student/profile'),
  updateProfile: d   => api.put('/student/profile', d),
  uploadResume: (file, onProgress) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post('/student/resume', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: e => onProgress && onProgress(Math.round((e.loaded*100)/e.total)),
    });
  },
  downloadResume: () => api.get('/student/resume/download', { responseType: 'blob' }),
};

export const jobService = {
  getActiveJobs:     ()  => api.get('/jobs/active'),
  applyForJob:       id  => api.post(`/jobs/${id}/apply`),
  getMyApplications: ()  => api.get('/jobs/my-applications'),
  getRoundScheduling: id  => api.get(`/jobs/applications/${id}/rounds`),
};

export const adminService = {
  getDashboard:    () => api.get('/admin/dashboard'),
  getAllStudents:   () => api.get('/admin/students'),
  getSelectedStudents: () => api.get('/admin/students/selected'),
  getStudent:      id => api.get(`/admin/students/${id}`),
  getPending:      () => api.get('/admin/registrations/pending'),
  approveReg:      id => api.post(`/admin/registrations/${id}/approve`),
  rejectReg:       id => api.post(`/admin/registrations/${id}/reject`),
  shortlistCV:     id => api.post(`/admin/cv/${id}/shortlist`),
  rejectCV:        id => api.post(`/admin/cv/${id}/reject`),
  reviewCV:        id => api.post(`/admin/cv/${id}/review`),
  downloadResume:  id => api.get(`/admin/students/${id}/resume/download`, { responseType: 'blob' }),

  // Jobs
  getAllJobs:      () => api.get('/admin/jobs'),
  createJob:       d  => api.post('/admin/jobs', d),
  updateJob:      (id, d) => api.put(`/admin/jobs/${id}`, d),
  deleteJob:       id => api.delete(`/admin/jobs/${id}`),
  getApplicants:   id => api.get(`/admin/jobs/${id}/applicants`),

  // Selection process
  rejectApplicant:   id      => api.post(`/admin/applications/${id}/reject`),

  // Round scheduling
  getRoundScheduling: id      => api.get(`/admin/applications/${id}/rounds`),
  scheduleRound:     (id, d)  => api.post(`/admin/applications/${id}/rounds/schedule`, d),
  recordRoundResult: (id, rid, d) => api.post(`/admin/applications/${id}/rounds/${rid}/result`, d),
  finalDecision:     (id, d)  => api.post(`/admin/applications/${id}/final-decision`, d),
};

export default api;
