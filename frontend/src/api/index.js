import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

const apiClient = api; // 别名以保持兼容性

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
    updateOrder: (orderData) => apiClient.patch('/roles/order', orderData),
};

export const conversationApi = {
    getAll: () => apiClient.get('/conversations'),
    getMessages: (id) => apiClient.get(`/conversations/${id}/messages`),
    delete: (id) => apiClient.delete(`/conversations/${id}`),
};

// 已移除废弃的 chatApi，流式对话直接在 store 中使用 fetch 实现

export default api;
