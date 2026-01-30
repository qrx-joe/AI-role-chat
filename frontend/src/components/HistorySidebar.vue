<template>
  <div class="history-sidebar" :class="{ 'is-collapsed': collapsed }">
    <!-- 侧边栏头部：标题与刷新动作 -->
    <div class="header">
      <h3 v-if="!collapsed">历史对话</h3>
      
      <div class="header-actions">
        <button v-if="!collapsed" class="btn-refresh" @click="chatStore.loadConversations" title="刷新列表">
          <!-- 顺时针旋转图标 -->
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 2v6h-6"></path>
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
            <path d="M3 22v-6h6"></path>
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
          </svg>
        </button>

        <!-- 展开/收起侧边栏按钮（参考大厂设计：简洁的 Panel Icon） -->
        <button class="btn-toggle" @click="$emit('toggle')" :title="collapsed ? '展开侧边栏' : '收起侧边栏'">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- 折叠后的简易操作区 -->
    <div v-if="collapsed" class="collapsed-actions">
       <div class="divider"></div>
       <!-- 开启新对话 -->
       <button class="btn-new-chat-compact" @click="startNewChatCurrentRole" title="开启新对话">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
       </button>
       
       <!-- 返回角色列表 -->
       <button class="btn-back-compact" @click="chatStore.selectRole(null)" title="返回角色列表">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
       </button>
    </div>

    <div v-else class="conversation-list">
      <!-- 渲染分组后的对话：同一角色的对话聚拢在一起 -->
      <div 
        v-for="group in groupedConversations" 
        :key="group.roleId"
        class="role-group"
      >
        <!-- 分组头部：展示角色的头像和名称 -->
        <div class="role-header">
          <img 
            :src="group.roleAvatar || getInitialsAvatar(group.roleName)" 
            class="sidebar-role-avatar" 
            alt="Role Avatar"
          />
          <span class="role-name">{{ group.roleName }}</span>
          <span class="count">({{ group.conversations.length }})</span>
          
          <div class="role-actions">
            <!-- 直接在这个分组下开启新对话 -->
            <button class="btn-group-action" @click="handleNewChat(group.roleId)" title="与此角色开始新对话">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </div>
        </div>
        
        <!-- 属于该角色的具体会话项 -->
        <div class="group-conversations">
          <div 
            v-for="conv in group.conversations" 
            :key="conv.id"
            class="conversation-item"
            :class="{ active: chatStore.currentConversationId === conv.id }"
          >
            <!-- 点击切换会话逻辑 -->
            <div 
              class="conv-content"
              @click="chatStore.selectConversation(conv)"
            >
              <div class="conv-title">{{ conv.title || '未命名对话' }}</div>
              <div class="conv-time">{{ formatTime(conv.updatedAt) }}</div>
            </div>
            <!-- 删除单个会话按钮（仅在悬停时显示） -->
            <button 
              class="btn-delete" 
              @click.stop="handleDelete(conv)"
              title="删除对话"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, defineProps, defineEmits } from 'vue';
import { useChatStore } from '../stores/chat';

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['toggle']);

/**
 * 历史侧边栏管理组件
 * 
 * 核心功能：
 * 1. 自动对历史会话进行【角色分组】，方便用户查阅。
 * 2. 提供快捷的切换会话、删除会话以及开启特定角色新对话的功能。
 * 3. 实时展示最后活跃时间。
 */
const chatStore = useChatStore();

/**
 * 分组逻辑 (Computed)
 * 将扁平的会话列表转换成按角色分类的树状结构
 */
const groupedConversations = computed(() => {
  const groups = {};
  const currentRoleId = chatStore.currentRole?.id;
  
  chatStore.conversations.forEach(conv => {
    // 过滤：如果已选中角色，通常侧边栏只展示该相关的对话（或者展示全部但突出重点）
    // 当前逻辑：如果有选中角色，仅展示该角色的对话。
    if (currentRoleId && conv.role?.id !== currentRoleId) {
      return;
    }

    const roleId = conv.role?.id || 'unknown';
    const roleName = conv.role?.name || '未知角色';
    
    // 复用 DiceBear 动态生成规则，确保侧边栏头像与主界面一致
    let roleAvatar = conv.role?.avatar;
    if (!roleAvatar && conv.role?.name) {
       const style = 'notionists';
       const colors = 'FFD6E0,C1E7E3,D1E8FF,FFF2CC,E2D4F5,FFE6D1';
       roleAvatar = `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(conv.role.name)}&backgroundColor=${colors}`;
    }
    
    // 初始化分组容器
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
  
  // 组内排序：最新的对话排在最前面
  Object.values(groups).forEach(group => {
    group.conversations.sort((a, b) => 
      new Date(b.updatedAt) - new Date(a.updatedAt)
    );
  });
  
  return Object.values(groups);
});

// 组件挂载即加载历史记录
onMounted(() => {
  chatStore.loadConversations();
});

/**
 * 备选头像生成
 */
function getInitialsAvatar(name) {
  const style = 'notionists';
  const colors = 'FFD6E0,C1E7E3,D1E8FF,FFF2CC,E2D4F5,FFE6D1';
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(name || 'User')}&backgroundColor=${colors}`;
}

/**
 * 时间本地化格式化 (HH:mm)
 */
function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * 删除会话逻辑 (含确认弹窗)
 */
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

/**
 * 开启新对话
 * 点击角色分组旁的 [+] 按钮执行
 */
async function handleNewChat(roleId) {
  const role = chatStore.roles.find(r => r.id === roleId);
  if (role) {
     // 保护逻辑：如果当前正在临时会话中且有未保存的消息，提示用户
     const shouldConfirm = chatStore.messages.length > 0 && chatStore.currentConversationId === null;
     if (shouldConfirm) {
        if (!confirm('当前有未保存的对话，确定要开始新对话吗？')) return;
     }
     
     chatStore.startNewChat(role);
  }
}

/**
 * 侧边栏折叠时的新对话逻辑
 * 默认使用当前选中的角色开启新对话
 */
function startNewChatCurrentRole() {
  if (chatStore.currentRole) {
    handleNewChat(chatStore.currentRole.id);
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

.history-sidebar.is-collapsed .header {
  margin-bottom: 12px;
  justify-content: center;
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

.btn-toggle {
  background: white; /* 醒目的白色卡片背景 */
  border: 1px solid var(--border-subtle); /* 细腻的边框 */
  color: var(--text-main);
  width: 32px;
  height: 32px;
  border-radius: 8px; /* 更圆润的方角 */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); /* Q弹的动画 */
  padding: 0;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04); /* 增加投影 */
}

.btn-toggle:hover {
  background: white;
  color: var(--primary);
  border-color: var(--primary);
  transform: translateY(-2px); /* 悬停上浮 */
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15); /* 更有质感的发光投影 */
}

.history-sidebar.is-collapsed .btn-toggle {
   /* Optional: Distinct style when collapsed if needed, but keeping it uniform is cleaner */
}

.history-sidebar.is-collapsed .btn-toggle {
   /* Optional: Distinct style when collapsed if needed, but keeping it uniform is cleaner */
}

.btn-toggle svg {
  transition: transform 0.3s;
}

.btn-toggle svg.rotate-180 {
  transform: rotate(180deg);
}

.btn-refresh {
  background: transparent; /* Cleaner look */
  border: none;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  color: var(--text-muted);
}

.btn-refresh:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--primary);
  transform: rotate(180deg);
  box-shadow: none;
}

.collapsed-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 20px;
  gap: 16px;
  border-top: 1px solid var(--border-subtle);
  width: 100%;
}

.btn-new-chat-compact {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-glow) 100%);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.btn-new-chat-compact:hover {
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 8px 16px rgba(139, 92, 246, 0.4);
}

.btn-back-compact {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back-compact:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-main);
  border-color: var(--border-subtle);
  transform: translateX(-2px);
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
