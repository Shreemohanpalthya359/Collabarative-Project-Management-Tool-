import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Auto-logout on 401 Unauthorized
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

export const labelsApi = {
    getProjectLabels: (projectId) => api.get(`/projects/${projectId}/labels`),
    createProjectLabel: (projectId, data) => api.post(`/projects/${projectId}/labels`, data),
    assignLabelToTask: (taskId, labelId) => api.post(`/tasks/${taskId}/labels`, { label_id: labelId }),
    removeLabelFromTask: (taskId, labelId) => api.delete(`/tasks/${taskId}/labels/${labelId}`),
};
