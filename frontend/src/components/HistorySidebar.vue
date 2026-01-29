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
  padding: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-main);
  opacity: 0.9;
}

.btn-refresh {
  background: var(--glass);
  border: 1px solid var(--glass-border);
  cursor: pointer;
  font-size: 0.875rem;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background: var(--glass-border);
  transform: rotate(180deg);
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.role-group {
  margin-bottom: 8px;
}

.role-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--glass);
  border-radius: var(--radius-sm);
  margin-bottom: 12px;
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.count {
  font-size: 0.75rem;
  opacity: 0.6;
  font-weight: normal;
}

.group-conversations {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 4px;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-md);
  background: var(--surface);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--glass-border);
  position: relative;
  animation: fadeIn 0.4s ease-out;
}

.conversation-item:hover {
  background: var(--surface-hover);
  transform: translateX(4px);
  border-color: var(--primary-glow);
}

.conversation-item.active {
  background: var(--surface-active);
  border-color: var(--primary);
  box-shadow: 0 4px 12px var(--primary-glow);
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
  font-size: 1rem;
  border-radius: var(--radius-sm);
  opacity: 0;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.conversation-item:hover .btn-delete {
  opacity: 0.6;
}

.btn-delete:hover {
  opacity: 1 !important;
  background: hsla(0, 100%, 50%, 0.1);
  color: #ef4444;
}

.conv-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-main);
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-time {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-weight: 500;
}
</style>
