import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { roleApi } from '../api';

export const useChatStore = defineStore('chat', () => {
    // State
    const roles = ref([]);
    const currentRole = ref(null);
    const messages = ref([]);
    const conversationId = ref(null);
    const isStreaming = ref(false);

    // Getters
    const hasSelectedRole = computed(() => !!currentRole.value);

    // Actions
    async function loadRoles() {
        try {
            const response = await roleApi.getAll();
            roles.value = response.data.data;
        } catch (error) {
            console.error('加载角色列表失败:', error);
        }
    }

    function selectRole(role) {
        currentRole.value = role;
        messages.value = [];
        conversationId.value = null;
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
        if (!currentRole.value) {
            alert('请先选择一个角色');
            return;
        }

        // 添加用户消息
        messages.value.push({
            role: 'user',
            content: text,
            imageBase64: imageBase64,
        });

        // 添加 AI 消息占位
        const aiMessageIndex = messages.value.length;
        messages.value.push({
            role: 'assistant',
            content: '',
        });

        isStreaming.value = true;

        try {
            const response = await fetch('http://localhost:3000/api/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roleId: currentRole.value.id,
                    message: text,
                    conversationId: conversationId.value,
                    imageBase64: imageBase64,
                }),
            });

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

                        if (data.chunk) {
                            messages.value[aiMessageIndex].content += data.chunk;
                        } else if (data.done) {
                            conversationId.value = data.conversationId;
                        } else if (data.error) {
                            throw new Error(data.error);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('发送消息失败:', error);
            messages.value[aiMessageIndex].content = '❌ 发送失败: ' + error.message;
        } finally {
            isStreaming.value = false;
        }
    }


    return {
        roles,
        currentRole,
        messages,
        conversationId,
        isStreaming,
        hasSelectedRole,
        loadRoles,
        selectRole,
        createRole,
        deleteRole,
        sendMessage,
    };
});
