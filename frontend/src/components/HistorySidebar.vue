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
          >
            <div 
              class="conv-content"
              @click="chatStore.selectConversation(conv)"
            >
              <div class="conv-title">{{ conv.title || '未命名对话' }}</div>
              <div class="conv-time">{{ formatTime(conv.updatedAt) }}</div>
            </div>
            <button 
              class="btn-delete" 
              @click.stop="handleDelete(conv)"
              title="删除对话"
            >
              🗑️
            </button>
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

async function handleDelete(conversation) {
  const roleName = conversation.role?.name || '未知角色';
  const confirmed = confirm(`确定要删除与"${roleName}"的这段对话吗？\n此操作不可恢复！`);
  
  if (confirmed) {
    try {
      await chatStore.deleteConversation(conversation.id);
    } catch (error) {
      alert('删除失败，请重试');
    }
  }
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
  display: flex;
  align-items: stretch;
  gap: 8px;
  padding: 12px;
  border-radius: 10px;
  background: #f9f9f9;
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

.conv-content {
  flex: 1;
  cursor: pointer;
  min-width: 0;
}

.btn-delete {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  border-radius: 6px;
  opacity: 0;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.conversation-item:hover .btn-delete {
  opacity: 1;
}

.btn-delete:hover {
  background: #fee;
  transform: scale(1.1);
}

.conv-title {
  font-weight: 500;
  font-size: 13px;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-time {
  font-size: 11px;
  color: #999;
}

.time {
  font-size: 12px;
  color: #999;
}
</style>
