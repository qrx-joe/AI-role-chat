import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { roleApi, conversationApi } from '../api';

export const useChatStore = defineStore('chat', () => {
    // State
    const roles = ref([]);
    const currentRole = ref(null);
    const conversations = ref([]);
    const currentConversationId = ref(null);
    const messages = ref([]);
    const isStreaming = ref(false);
    const showPromptPreview = ref(false);
    const lastRequestData = ref(null);
    const lastResponseChunks = ref([]);

    // Getters
    const hasSelectedRole = computed(() => !!currentRole.value);

    // Actions
    function togglePromptPreview() {
        showPromptPreview.value = !showPromptPreview.value;
    }
    async function loadRoles() {
        try {
            const response = await roleApi.getAll();
            roles.value = response.data.data;
        } catch (error) {
            console.error('加载角色列表失败:', error);
        }
    }

    async function selectRole(role) {
        currentRole.value = role;
        currentConversationId.value = null;
        messages.value = [];
    }

    async function loadConversations() {
        try {
            const response = await conversationApi.getAll();
            conversations.value = response.data.data;
        } catch (error) {
            console.error('加载会话列表失败:', error);
        }
    }

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

    async function sendMessage(text, imageBase64 = null) {
        if (!currentRole.value || isStreaming.value) return;

        const userMessage = { role: 'user', content: text, type: imageBase64 ? 'image' : 'text' };
        messages.value.push(userMessage);

        const aiMessageIndex = messages.value.length;
        messages.value.push({ role: 'assistant', content: '', type: 'text' });

        isStreaming.value = true;
        const fullText = imageBase64 ? `${text} || IMAGE_BASE64: ${imageBase64}` : text;
        lastRequestData.value = { roleId: currentRole.value.id, message: text, image: imageBase64 ? 'BASE64_IMAGE' : null };
        lastResponseChunks.value = [];

        try {
            const response = await fetch(`${baseURL}/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roleId: currentRole.value.id,
                    message: fullText,
                    conversationId: currentConversationId.value,
                    imageBase64: imageBase64,
                }),
            });

            if (!response.ok) throw new Error('网络请求失败');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));
                        lastResponseChunks.value.push(data);
                        if (data.chunk) {
                            messages.value[aiMessageIndex].content += data.chunk;
                        } else if (data.done) {
                            currentConversationId.value = data.conversationId;
                        } else if (data.error) {
                            throw new Error(data.error);
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
        }
    }


    return {
        roles,
        currentRole,
        conversations,
        currentConversationId,
        messages,
        isStreaming,
        showPromptPreview,
        lastRequestData,
        lastResponseChunks,
        hasSelectedRole,
        loadRoles,
        selectRole,
        togglePromptPreview,
        loadConversations,
        selectConversation,
        createRole,
        updateRole,
        deleteRole,
        sendMessage,
    };
});
