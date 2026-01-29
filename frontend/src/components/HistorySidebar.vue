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
  const currentRoleId = chatStore.currentRole?.id;
  
  chatStore.conversations.forEach(conv => {
    // 过滤：如果已选中角色，只显示该角色的对话
    if (currentRoleId && conv.role?.id !== currentRoleId) {
      return;
    }

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
  margin-bottom: 24px;
}

.header h3 {
  font-family: var(--font-heading);
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.btn-refresh {
  background: transparent;
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  font-size: 0.9rem;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  color: var(--text-muted);
}

.btn-refresh:hover {
  background: var(--surface-hover);
  color: var(--primary);
  border-color: var(--primary-glow);
  transform: rotate(180deg);
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-right: 4px; /* 滚动条空间 */
}

.role-group {
  margin-bottom: 8px;
}

.role-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  margin-bottom: 12px;
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--primary);
  opacity: 0.8;
}

.count {
  font-size: 0.7rem;
  opacity: 0.6;
  font-weight: normal;
}

.group-conversations {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  /* 默认无背景，更干净 */
  background: transparent;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
}

.conversation-item:hover {
  background: var(--surface-hover);
  transform: translateX(2px);
}

.conversation-item.active {
  background: var(--surface-active);
  box-shadow: var(--shadow-sm);
  border-color: var(--border-subtle);
}

/* 激活状态左侧指示条 */
.conversation-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10%;
  bottom: 10%;
  width: 3px;
  background: var(--primary);
  border-radius: 0 4px 4px 0;
  box-shadow: 0 0 8px var(--primary-glow);
}

.conv-content {
  flex: 1;
  cursor: pointer;
  min-width: 0;
}

.btn-delete {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.9rem;
  border-radius: var(--radius-sm);
  opacity: 0;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.conversation-item:hover .btn-delete {
  opacity: 0.5;
}

.btn-delete:hover {
  opacity: 1 !important;
  background: hsla(0, 80%, 60%, 0.1);
  transform: scale(1.1);
}

.conv-title {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--text-main);
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s;
}

.conversation-item.active .conv-title {
  color: var(--primary);
  font-weight: 600;
}

.conv-time {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--text-muted);
  letter-spacing: -0.02em;
}
</style>
