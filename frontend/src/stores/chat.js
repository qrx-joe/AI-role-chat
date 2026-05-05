import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { roleApi, conversationApi } from '../api';

/**
 * 聊天核心状态管理 (Pinia Store) - Composition API 风格
 * 
 * 负责维护整个应用的前端状态，协调 API 调用与 UI 渲染。
 */
export const useChatStore = defineStore('chat', () => {
    const baseURL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/^﻿/, '');

    // ==================== 核心状态 (State) ====================

    /** 所有可用的 AI 角色列表 */
    const roles = ref([]);

    /** 当前选中的对话角色 */
    const currentRole = ref(null);

    /** 侧边栏的对话历史记录列表 */
    const conversations = ref([]);

    /** 当前活跃的会话 ID (UUID) */
    const currentConversationId = ref(null);

    /** 当前窗口的消息记录列表 */
    const messages = ref([]);

    /** 是否正在接收 AI 的流式响应 */
    const isStreaming = ref(false);

    /** 是否显示 System Prompt 预览面板 */
    const showPromptPreview = ref(false);

    /** [调试用] 最后一次发送给后端的数据 */
    const lastRequestData = ref(null);

    /** [调试用] 最近收到的流数据片段集合 */
    const lastResponseChunks = ref([]);

    /** 用户头像 URL (从 localStorage 读取或使用默认值) */
    const userAvatar = ref(localStorage.getItem('user_avatar') || 'https://api.dicebear.com/9.x/notionists/svg?seed=User&backgroundColor=e2d4f5');

    // ==================== 计算属性 (Getters) ====================

    /** 是否已选中某个角色 */
    const hasSelectedRole = computed(() => !!currentRole.value);

    /** 当前选中的会话对象 (Computed) */
    const currentConversation = computed(() => {
        if (!currentConversationId.value) return null;
        return conversations.value.find(c => c.id === currentConversationId.value);
    });

    // ==================== 辅助工具 (Helpers) ====================

    /**
     * 解析复合消息内容（处理图文分离）
     * 
     * @param {string} content - 后端存储的消息内容原文
     * @returns {Object} { text: 文本, image: 图片Base64 }
     */
    function parseMessageContent(content) {
        if (typeof content !== 'string') return { text: '', image: null };
        // 检查是否包含两阶段处理产生的图片标记
        if (!content.includes(' || IMAGE_BASE64: ')) return { text: content, image: null };

        const [text, imagePart] = content.split(' || IMAGE_BASE64: ');
        return { text, image: imagePart };
    }

    // ==================== 动作 (Actions) ====================

    /** 切换提示词面板显示状态 */
    function togglePromptPreview() {
        showPromptPreview.value = !showPromptPreview.value;
    }

    /** 从后端加载角色列表 */
    async function loadRoles() {
        try {
            const response = await roleApi.getAll();
            roles.value = response.data.data;
        } catch (error) {
            console.error('加载角色列表失败:', error);
        }
    }

    /** 选中角色并重置当前对话状态 */
    async function selectRole(role) {
        currentRole.value = role;
        currentConversationId.value = null;
        messages.value = [];
    }

    /** 从后端加载侧边栏对话历史 */
    async function loadConversations() {
        try {
            const response = await conversationApi.getAll();
            conversations.value = response.data.data;
        } catch (error) {
            console.error('加载会话列表失败:', error);
        }
    }

    /** 选中并加载某个历史对话 */
    async function selectConversation(conv) {
        currentConversationId.value = conv.id;
        currentRole.value = conv.role;
        try {
            const response = await conversationApi.getMessages(conv.id);
            messages.value = response.data.data.map(m => ({
                role: m.role,
                content: m.content,
                type: m.type,
            }));
        } catch (error) {
            console.error('加载消息失败:', error);
        }
    }

    /** 开启一个新对话 */
    function startNewChat(role = null) {
        if (role) {
            currentRole.value = role;
        }
        currentConversationId.value = null;
        messages.value = [];
    }

    /** 创建新角色 */
    async function createRole(roleData) {
        try {
            const response = await roleApi.create(roleData);
            roles.value.unshift(response.data.data);
            return response.data.data;
        } catch (error) {
            console.error('创建角色失败:', error);
            throw error;
        }
    }

    /** 更新角色属性 */
    async function updateRole(id, roleData) {
        try {
            const response = await roleApi.update(id, roleData);
            const index = roles.value.findIndex(r => r.id === id);
            if (index !== -1) {
                roles.value[index] = response.data.data;
            }
            if (currentRole.value?.id === id) {
                currentRole.value = response.data.data;
            }
            return response.data.data;
        } catch (error) {
            console.error('更新角色失败:', error);
            throw error;
        }
    }

    /** 删除角色（并同步 UI 状态） */
    async function deleteRole(roleId) {
        try {
            await roleApi.delete(roleId);
            roles.value = roles.value.filter(r => r.id !== roleId);
            if (currentRole.value?.id === roleId) {
                currentRole.value = null;
                messages.value = [];
            }
        } catch (error) {
            console.error('删除角色失败:', error);
            throw error;
        }
    }

    /** 删除历史对话记录 */
    async function deleteConversation(conversationId) {
        try {
            await conversationApi.delete(conversationId);

            // 从本地列表中移除
            const index = conversations.value.findIndex(c => c.id === conversationId);
            if (index !== -1) {
                conversations.value.splice(index, 1);
            }

            // 如果删除的是当前正在看的对话，清空窗口
            if (currentConversationId.value === conversationId) {
                currentConversationId.value = null;
                messages.value = [];
            }
        } catch (error) {
            console.error('删除对话失败:', error);
            throw error;
        }
    }

    /**
     * 发送消息并处理流式响应【核心对话入口】
     * 
     * 流程：
     * 1. 本地更新：插入用户消息和 AI 占位消息
     * 2. 调用 SSE 接口：使用 Fetch 获取 ReadableStream
     * 3. 流式解析：逐块读取数据并实时拼接 content 触发 UI 更新
     */
    async function sendMessage(text, imageBase64 = null) {
        if (!currentRole.value || isStreaming.value) return;

        // --- 1. 构建并插入用户消息 ---
        const messageContent = imageBase64 ? `${text} || IMAGE_BASE64: ${imageBase64}` : text;
        const userMessage = { role: 'user', content: messageContent, type: imageBase64 ? 'image' : 'text' };
        messages.value.push(userMessage);

        // --- 2. 插入 AI 占位消息 ---
        const aiMessageIndex = messages.value.length;
        messages.value.push({ role: 'assistant', content: '', type: 'text' });

        isStreaming.value = true;
        lastRequestData.value = { roleId: currentRole.value.id, message: text, image: imageBase64 ? 'BASE64_IMAGE' : null };
        lastResponseChunks.value = [];

        try {
            // --- 3. 调用流式接口 (Fetch SSE) ---
            const response = await fetch(`${baseURL}/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roleId: currentRole.value.id,
                    message: messageContent,
                    conversationId: currentConversationId.value,
                    imageBase64: imageBase64,
                }),
            });

            if (!response.ok) throw new Error('网络请求失败');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            // --- 4. 逐块读取流数据 ---
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            lastResponseChunks.value.push(data);

                            if (data.chunk) {
                                // 实时追加内容到 AI 消息气泡
                                messages.value[aiMessageIndex].content += data.chunk;
                            } else if (data.done) {
                                // 创建新对话后，后端会返回分配到的全局 ID
                                currentConversationId.value = data.conversationId;
                            } else if (data.error) {
                                throw new Error(data.error);
                            }
                        } catch (e) {
                            // 忽略解析失败的碎片
                        }
                    }
                }
            }
        } catch (error) {
            console.error('发送失败:', error);
            messages.value.push({
                role: 'assistant',
                content: `❌ 发送失败: ${error.message || '未知错误'}\n\n建议：检查网络连接或尝试开启演示 Mock 模式。`,
                type: 'text'
            });
        } finally {
            isStreaming.value = false;
            // 自动刷新历史对话列表，确保标题最新
            loadConversations();
        }
    }

    /** 设置并持久化用户头像 */
    function setUserAvatar(url) {
        userAvatar.value = url;
        localStorage.setItem('user_avatar', url);
    }

    /** 同步角色排序到后端 */
    async function updateRoleOrder(orderData) {
        try {
            await roleApi.updateOrder(orderData);
            // 重新刷新本地列表
            await loadRoles();
        } catch (error) {
            console.error('更新排序失败:', error);
            throw error;
        }
    }

    return {
        roles,
        currentRole,
        conversations,
        currentConversationId,
        currentConversation,
        messages,
        isStreaming,
        showPromptPreview,
        lastRequestData,
        lastResponseChunks,
        hasSelectedRole,
        userAvatar,
        setUserAvatar,
        parseMessageContent,
        loadRoles,
        selectRole,
        togglePromptPreview,
        loadConversations,
        selectConversation,
        deleteConversation,
        createRole,
        updateRole,
        deleteRole,
        sendMessage,
        startNewChat,
        updateRoleOrder,
    };
});
