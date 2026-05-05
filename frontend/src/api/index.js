import axios from 'axios';

/**
 * 前端 API 客户端配置
 * 
 * 统一管理所有与后端 NestJS 交互的强类型接口。
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/^﻿/, '');

const api = axios.create({
    baseURL: API_BASE_URL,
});

const apiClient = api; // 别名以保持兼容性

// --- 统一响应拦截器 ---
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // 全局错误提示处理
        const message = error.response?.data?.message || error.message || '请求失败';
        alert(`网络或接口错误: ${message}`);
        return Promise.reject(error);
    }
);

/**
 * 角色管理 API 分组
 */
export const roleApi = {
    getAll: () => apiClient.get('/roles'),           // 获取全部可用角色
    getOne: (id) => apiClient.get(`/roles/${id}`),    // 获取单个角色详情
    create: (data) => apiClient.post('/roles', data), // 创建新角色
    update: (id, data) => apiClient.put(`/roles/${id}`, data), // 修改已有角色
    delete: (id) => apiClient.delete(`/roles/${id}`), // 删除角色 (含级联删除历史)
    updateOrder: (orderData) => apiClient.patch('/roles/order', orderData), // 拖拽排序同步
};

/**
 * 会话管理 API 分组
 */
export const conversationApi = {
    getAll: () => apiClient.get('/conversations'),                  // 获取全局对话列表（侧边栏使用）
    getMessages: (id) => apiClient.get(`/conversations/${id}/messages`), // 加载指定会话的完整历史
    delete: (id) => apiClient.delete(`/conversations/${id}`),       // 物理删除某段对话
};

// [注意] 流式对话 (Chat) 接口不使用 Axios，因为 Axios 不原生支持流式读取 (ReadableStream)。
// 它在 Chat Store 中通过原生 fetch() 直接实现。

export default api;
