<template>
  <div class="history-sidebar">
    <div class="header">
      <h3>历史对话</h3>
      <button class="btn-refresh" @click="chatStore.loadConversations">🔄</button>
    </div>
    
    <div class="conversation-list">
      <div 
        v-for="conv in chatStore.conversations" 
        :key="conv.id"
        class="conversation-item"
        :class="{ active: chatStore.currentConversationId === conv.id }"
        @click="chatStore.selectConversation(conv)"
      >
        <div class="conv-info">
          <span class="role-name">{{ conv.role?.name || '未知角色' }}</span>
          <span class="time">{{ formatTime(conv.updatedAt) }}</span>
        </div>
        <div class="last-message" v-if="conv.messages && conv.messages.length">
          {{ conv.messages[conv.messages.length - 1].content }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useChatStore } from '../stores/chat';

const chatStore = useChatStore();

onMounted(() => {
  chatStore.loadConversations();
});

function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
</script>

<style scoped>
.history-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-top: 1px solid #eee;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.btn-refresh {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.conversation-item {
  padding: 12px;
  border-radius: 10px;
  background: #f9f9f9;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.conversation-item:hover {
  background: #f0f0f0;
}

.conversation-item.active {
  background: #eef2ff;
  border-color: #667eea;
}

.conv-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.role-name {
  font-weight: bold;
  font-size: 14px;
}

.time {
  font-size: 12px;
  color: #999;
}

.last-message {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
