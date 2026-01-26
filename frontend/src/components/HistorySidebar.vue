<template>
  <div class="history-sidebar">
    <div class="header">
      <h3>历史对话</h3>
      <button class="btn-refresh" @click="chatStore.loadConversations">🔄</button>
    </div>
    
    <div class="conversation-list">
      <!-- 按角色分组 -->
      <div 
        v-for="group in groupedConversations" 
        :key="group.roleId"
        class="role-group"
      >
        <div class="role-header">
          <span class="role-name">{{ group.roleName }}</span>
          <span class="count">({{ group.conversations.length }})</span>
        </div>
        
        <div class="group-conversations">
          <div 
            v-for="conv in group.conversations" 
            :key="conv.id"
            class="conversation-item"
            :class="{ active: chatStore.currentConversationId === conv.id }"
            @click="chatStore.selectConversation(conv)"
          >
            <div class="conv-info">
              <span class="time">{{ formatTime(conv.updatedAt) }}</span>
            </div>
            <div class="last-message" v-if="conv.messages && conv.messages.length">
              {{ conv.messages[conv.messages.length - 1].content }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useChatStore } from '../stores/chat';

const chatStore = useChatStore();

// 按角色分组对话
const groupedConversations = computed(() => {
  const groups = {};
  
  chatStore.conversations.forEach(conv => {
    const roleId = conv.role?.id || 'unknown';
    const roleName = conv.role?.name || '未知角色';
    
    if (!groups[roleId]) {
      groups[roleId] = {
        roleId,
        roleName,
        conversations: []
      };
    }
    
    groups[roleId].conversations.push(conv);
  });
  
  // 对每个组内的对话按更新时间降序排列
  Object.values(groups).forEach(group => {
    group.conversations.sort((a, b) => 
      new Date(b.updatedAt) - new Date(a.updatedAt)
    );
  });
  
  return Object.values(groups);
});

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

.role-group {
  margin-bottom: 16px;
}

.role-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.count {
  font-size: 12px;
  color: #999;
  font-weight: normal;
}

.group-conversations {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 8px;
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
