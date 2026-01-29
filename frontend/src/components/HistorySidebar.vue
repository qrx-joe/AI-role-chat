<template>
  <div class="history-sidebar">
    <div class="header">
      <h3>历史对话</h3>
      <div class="header-actions">
        <button class="btn-refresh" @click="chatStore.loadConversations" title="刷新列表">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 2v6h-6"></path>
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
            <path d="M3 22v-6h6"></path>
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
          </svg>
        </button>
      </div>
    </div>
    
    <div class="conversation-list">
      <!-- 按角色分组 -->
      <div 
        v-for="group in groupedConversations" 
        :key="group.roleId"
        class="role-group"
      >
        <div class="role-header">
          <img 
            :src="group.roleAvatar || getInitialsAvatar(group.roleName)" 
            class="sidebar-role-avatar" 
            alt="Role Avatar"
          />
          <span class="role-name">{{ group.roleName }}</span>
          <span class="count">({{ group.conversations.length }})</span>
          
          <div class="role-actions">
            <!-- 加上新对话按钮 -->
            <button class="btn-group-action" @click="handleNewChat(group.roleId)" title="与此角色开始新对话">
              +
            </button>
          </div>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
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
    // Helper logic to get same consistent avatar
    let roleAvatar = conv.role?.avatar;
    if (!roleAvatar && conv.role?.name) {
       const style = 'notionists';
       const colors = 'FFD6E0,C1E7E3,D1E8FF,FFF2CC,E2D4F5,FFE6D1';
       roleAvatar = `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(conv.role.name)}&backgroundColor=${colors}`;
    }
    
    if (!groups[roleId]) {
      groups[roleId] = {
        roleId,
        roleName,
        roleAvatar,
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

function getInitialsAvatar(name) {
  // Fallback just in case
  const style = 'notionists';
  const colors = 'FFD6E0,C1E7E3,D1E8FF,FFF2CC,E2D4F5,FFE6D1';
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(name || 'User')}&backgroundColor=${colors}`;
}

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

async function handleNewChat(roleId) {
  // Find role from store
  const role = chatStore.roles.find(r => r.id === roleId);
  if (role) {
     const shouldConfirm = chatStore.messages.length > 0 && chatStore.currentConversationId === null;
     if (shouldConfirm) {
        if (!confirm('当前有未保存的对话，确定要开始新对话吗？')) return;
     }
     
     chatStore.startNewChat(role);
     // If sidebar is overlay on mobile (future proof), close it here
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

.header-actions {
  display: flex;
  gap: 8px;
}

.btn-refresh {
  background: white;
  border: 1px solid var(--primary-glow);
  cursor: pointer;
  font-size: 0.9rem;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  color: var(--primary);
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.btn-refresh:hover {
  background: var(--primary);
  color: white;
  transform: rotate(180deg);
  box-shadow: 0 4px 10px var(--primary-glow);
}

.btn-refresh:hover {
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
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1rem;
  color: var(--primary);
  opacity: 1;
}

.sidebar-role-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border-subtle);
  background: white;
  flex-shrink: 0;
}

.role-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.btn-group-action {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  width: 22px;
  height: 22px;
  border-radius: 4px; /* Square with slight round */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  font-weight: 300;
  line-height: 1;
  padding: 0;
  transition: all 0.2s;
}

.btn-group-action:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
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
  background: transparent;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
  margin-bottom: 4px; /* Space items slightly */
}

.conversation-item:hover {
  background: rgba(0, 0, 0, 0.03); /* Subtle hover */
}

.conversation-item.active {
  background: white; /* Card-like active state */
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border-color: var(--border-subtle);
}

/* 激活状态左侧指示条 - 加粗并改为圆角条 */
.conversation-item.active::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 12px;
  bottom: 12px;
  width: 4px;
  background: var(--primary);
  border-radius: 4px;
}

.conv-title {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 0.95rem; /* Slightly larger */
  color: var(--text-main); /* Ensure dark color */
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-item.active .conv-title {
  color: var(--primary);
  font-weight: 700;
}

.conv-time {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: #94a3b8; /* Slate-400 equivalent for better readability than muted */
  letter-spacing: -0.01em;
}
/* Ensure content takes available space but allows button to sit on the right */
.conv-content {
  flex: 1;
  cursor: pointer;
  min-width: 0;
  /* Ensure padding-right so text doesn't overlap the button that appears */
  padding-right: 24px; 
}

.btn-delete {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #94a3b8; /* Muted slate */
  border-radius: 4px;
  opacity: 0; /* Hidden by default */
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.conversation-item:hover .btn-delete {
  opacity: 1; /* Show on hover */
}

.btn-delete:hover {
  color: #ef4444; /* Red color on hover */
  background: rgba(239, 68, 68, 0.1);
  transform: translateY(-50%) scale(1.1);
}
</style>
