import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

// 响应拦截器
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || error.message || '请求失败';
        alert(`错误: ${message}`);
        return Promise.reject(error);
    }
);

// 角色管理 API
export const roleApi = {
    getAll: () => apiClient.get('/roles'),
    getOne: (id) => apiClient.get(`/roles/${id}`),
    create: (data) => apiClient.post('/roles', data),
    update: (id, data) => apiClient.put(`/roles/${id}`, data),
    delete: (id) => apiClient.delete(`/roles/${id}`),
};

const conversationApi = {
    getAll: () => apiClient.get('/conversations'),
    getMessages: (id) => apiClient.get(`/conversations/${id}/messages`),
};

// 流式对话
export const chatApi = {
    streamChat: (roleId, message, conversationId = null, imageBase64 = null) => {
        return new EventSource(
            `${API_BASE_URL}/chat/stream`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roleId,
                    message,
                    conversationId,
                    imageBase64,
                }),
            }
        );
    },
};

export default api;
