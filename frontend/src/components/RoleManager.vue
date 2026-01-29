<template>
  <div 
    class="role-manager" 
    :class="{ 
      'is-compact': compact,
      'is-grid': grid 
    }"
  >
    <!-- Header: Hidden in Grid Mode (handled by App.vue), Visible in Normal/Compact -->
    <div class="header" v-if="!grid">
      <h2 v-if="!compact">AI 角色</h2>
      <button v-if="compact" class="btn-back" @click="chatStore.selectRole(null)">
        ← 返回角色列表
      </button>
      <button v-else class="btn-create" @click="openCreateDialog">+ 创建角色</button>
    </div>

    <!-- Compact Mode: Only show active role -->
    <div v-if="compact" class="active-role-display">
       <div class="role-card active-static">
          <h3>{{ chatStore.currentRole?.name }}</h3>
          <div class="card-actions-static">
            <button class="btn-icon" @click.stop="openEditDialog(chatStore.currentRole)" title="编辑">📝</button>
          </div>
       </div>
    </div>

    <!-- Top Right Floating Widgets -->
    <div v-if="grid" class="home-widgets">
      <div class="widget-item" @click="toggleSortMode" :class="{ 'is-active': isSortMode }" title="对角色进行排序">
        <div class="widget-icon">⇅</div>
        <span class="widget-label">{{ isSortMode ? '完成排序' : '调整顺序' }}</span>
      </div>
      <div class="widget-item" @click="openUserAvatarDialog" title="设置我的头像">
        <div class="widget-avatar">
          <img :src="chatStore.userAvatar" alt="User" />
        </div>
        <span class="widget-label">我的形象</span>
      </div>
    </div>

    <!-- Grid Mode & List Mode -->
    <div v-if="!compact" class="role-list" :class="{ 'grid-view': grid, 'is-sorting': isSortMode }">
      <!-- Create Button Card (Only in Grid Mode) -->
      <div v-if="grid && !isSortMode" class="role-card create-card" @click="openCreateDialog">
        <div class="create-icon">+</div>
        <h3>创建新角色</h3>
        <p class="create-desc">设计属于你的 AI 伙伴</p>
      </div>

      <div
        v-for="(role, index) in localRoles"
        :key="role.id"
        class="role-card"
        :class="{ active: chatStore.currentRole?.id === role.id, 'sorting-item': isSortMode }"
        @click="handleCardClick(role)"
      >
        <!-- Reorder Buttons -->
        <div v-if="isSortMode" class="reorder-actions">
           <button class="btn-reorder" @click.stop="moveRole(index, -1)" :disabled="index === 0">←</button>
           <button class="btn-reorder" @click.stop="moveRole(index, 1)" :disabled="index === localRoles.length - 1">→</button>
        </div>

        <img 
          :src="getAvatarUrl(role)" 
          class="role-avatar-img" 
          alt="avatar"
          loading="lazy"
        />
        <h3>{{ role.name }}</h3>
        <!-- <p class="personality">{{ role.personality }}</p> 用户要求隐藏 -->
        <div v-if="!isSortMode" class="card-actions">
          <button class="btn-edit" @click.stop="openEditDialog(role)" title="编辑角色">📝</button>
          <button class="btn-delete" @click.stop="handleDelete(role.id)" title="删除角色">🗑️</button>
        </div>
      </div>
    </div>

    <!-- User Avatar Dialog -->
    <div v-if="showUserAvatarDialog" class="dialog-overlay" @click="showUserAvatarDialog = false">
      <div class="dialog" @click.stop style="width: 480px;">
        <div class="dialog-content">
          <h3>设置我的头像</h3>
          
           <div class="avatar-section">
             <div class="avatar-wrapper">
                <img :src="userAvatarForm" alt="User Avatar Preview" />
             </div>
             
             <div class="avatar-controls">
                <button class="btn-random" @click="generateRandomUserAvatar" title="随机生成新形象">
                   🎲 随机生成
                </button>
                <div class="url-input-wrapper">
                   <input v-model="userAvatarForm" placeholder="粘贴图片 URL..." />
                </div>
             </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="showUserAvatarDialog = false" class="btn-cancel">取消</button>
          <button @click="saveUserAvatar" class="btn-primary-action">保存设置</button>
        </div>
      </div>
    </div>

    <!-- 创建/编辑角色弹窗 (不变) -->
    <div v-if="showDialog" class="dialog-overlay" @click="closeDialog">
      <div class="dialog" @click.stop>
        <div class="dialog-content">
          <h3>{{ isEditing ? '编辑角色' : '创建新角色' }}</h3>
          
          <!-- Avatar Section -->
          <div class="avatar-section">
             <div class="avatar-wrapper" @click="showAvatarZoom = true" title="点击放大预览">
                <img :src="roleForm.avatar || getInitials(roleForm.name)" 
                     :class="{ 'is-placeholder': !roleForm.avatar }"
                     alt="Avatar Preview" />
                <div class="avatar-overlay">🔍</div>
             </div>
             
             <div class="avatar-controls">
                <button class="btn-random" @click="generateRandomAvatar" title="随机生成新形象">
                   🎲 随机生成
                </button>
                <div class="url-input-wrapper">
                   <input v-model="roleForm.avatar" placeholder="或者粘贴图片 URL..." />
                </div>
             </div>
          </div>

          <div class="form-group">
              <span class="form-label">角色名称</span>
              <input v-model="roleForm.name" placeholder="给你的 AI 起个名字" />
          </div>
          
          <div class="form-group">
              <span class="form-label">性格特征</span>
              <textarea v-model="roleForm.personality" placeholder="如：毒舌、温柔、严谨..." rows="2"></textarea>
          </div>
          <div class="form-group">
              <span class="form-label">背景故事</span>
              <textarea v-model="roleForm.background" placeholder="它来自哪里？有什么故事？" rows="3"></textarea>
          </div>
          <div class="form-group">
              <span class="form-label optional">行为约束</span>
              <textarea v-model="roleForm.constraints" placeholder="有什么是它绝对不能做的？" rows="2"></textarea>
          </div>
          <div class="form-group">
              <span class="form-label optional">对话示例</span>
              <textarea v-model="roleForm.examples" placeholder="用户：你好 AI：..." rows="3"></textarea>
          </div>
        </div>
        
        <div class="dialog-footer">
          <button @click="closeDialog" class="btn-cancel">取消</button>
          <button @click="handleSubmit" class="btn-primary-action">
            {{ isEditing ? '保存修改' : '立即创建' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Image Zoom Lightbox -->
    <div v-if="showAvatarZoom" class="lightbox-overlay" @click="showAvatarZoom = false">
       <img :src="roleForm.avatar" class="lightbox-img" @click.stop />
       <button class="lightbox-close" @click="showAvatarZoom = false">×</button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, computed, watch, onMounted } from 'vue';
import { useChatStore } from '../stores/chat';

const props = defineProps({
  compact: {
    type: Boolean,
    default: false
  },
  grid: {
    type: Boolean,
    default: false
  }
});

const chatStore = useChatStore();
const showDialog = ref(false);
const showAvatarZoom = ref(false);
const isEditing = ref(false);
const editingRoleId = ref(null);
const roleForm = ref({
  name: '',
  personality: '',
  background: '',
  constraints: '',
  examples: '',
  avatar: ''
});

// Ordering Logic
const isSortMode = ref(false);
const localRoles = ref([]);

// Keep localRoles synced with store roles when not sorting
watch(() => chatStore.roles, (newRoles) => {
  if (!isSortMode.value) {
    localRoles.value = [...newRoles];
  }
}, { immediate: true, deep: true });

async function toggleSortMode() {
  if (isSortMode.value) {
    // Exiting sort mode: Save to backend
    try {
      const orderData = localRoles.value.map((role, index) => ({
        id: role.id,
        order: index
      }));
      await chatStore.updateRoleOrder(orderData);
      isSortMode.value = false;
    } catch (error) {
      alert('保存顺序失败，请重试');
    }
  } else {
    // Entering sort mode
    localRoles.value = [...chatStore.roles];
    isSortMode.value = true;
  }
}

function moveRole(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= localRoles.value.length) return;
  
  const items = [...localRoles.value];
  const temp = items[index];
  items[index] = items[newIndex];
  items[newIndex] = temp;
  localRoles.value = items;
}

function handleCardClick(role) {
  if (isSortMode.value) return;
  chatStore.selectRole(role);
}

function openCreateDialog() {
  isEditing.value = false;
  editingRoleId.value = null;
  // Initialize with a random avatar immediately for better UX
  const seed = Math.random().toString(36).substring(7);
  roleForm.value = { 
     name: '', 
     personality: '', 
     background: '', 
     constraints: '', 
     examples: '', 
     avatar: generateDiceBearUrl(seed) // Auto-gen one to start
  };
  showDialog.value = true;
}

function openEditDialog(role) {
  isEditing.value = true;
  editingRoleId.value = role.id;
  roleForm.value = { ...role };
  showDialog.value = true;
}

function closeDialog() {
  showDialog.value = false;
  showAvatarZoom.value = false;
}

async function handleSubmit() {
  if (!roleForm.value.name || !roleForm.value.personality || !roleForm.value.background) {
    alert('请填写必填字段：名称、性格、背景');
    return;
  }
  
  try {
    if (isEditing.value) {
      await chatStore.updateRole(editingRoleId.value, roleForm.value);
    } else {
      await chatStore.createRole(roleForm.value);
    }
    showDialog.value = false;
  } catch (error) {
    console.error(error);
  }
}

async function handleDelete(roleId) {
  if (confirm('确定删除这个角色吗？')) {
    await chatStore.deleteRole(roleId);
  }
}
// Helper to get avatar URL (Default: Notionists with Morandi BG)
function getAvatarUrl(role) {
  // If role has a specific avatar set (custom URL or saved DiceBear URL), use it.
  if (role.avatar) return role.avatar;
  
  // Default fallback: Generate deterministic Notion-style avatar based on name
  return generateDiceBearUrl(role.name);
}

function generateDiceBearUrl(seed) {
  const style = 'notionists'; // Human-like, expressive, fits 'Persona'
  
  // Bright Pastel Palette (Fresher, Lighter Tones)
  const colors = [
    'FFD6E0', // Light Sakura Pink
    'C1E7E3', // Fresh Mint Green
    'D1E8FF', // Bright Sky Blue
    'FFF2CC', // Light Lemon
    'E2D4F5', // Soft Lavender
    'FFE6D1'  // Pale Apricot
  ].join(',');

  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${colors}`;
}

// Generate a random avatar URL for the form
function generateRandomAvatar() {
  const randomSeed = Math.random().toString(36).substring(7);
  roleForm.value.avatar = generateDiceBearUrl(randomSeed);
}

const showUserAvatarDialog = ref(false);
const userAvatarForm = ref('');

function openUserAvatarDialog() {
  userAvatarForm.value = chatStore.userAvatar;
  showUserAvatarDialog.value = true;
}

function generateRandomUserAvatar() {
  const seed = Math.random().toString(36).substring(7);
  userAvatarForm.value = generateDiceBearUrl(seed);
}

function saveUserAvatar() {
  chatStore.setUserAvatar(userAvatarForm.value);
  showUserAvatarDialog.value = false;
}

function getInitials(name) {
  return name ? name.charAt(0).toUpperCase() : '?';
}
</script>

<style scoped>
.role-manager.is-compact {
  padding: 12px 16px; 
}

.role-manager:not(.is-compact):not(.is-grid) {
  padding: 24px;
}

.role-manager.is-grid {
  width: 100%;
  padding: 0; /* Grid view doesn't need container padding */
}

/* Header Logic */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.role-manager.is-compact .header {
  margin-bottom: 0px; 
}

.btn-back {
  background: transparent;
  border: none;
  font-family: var(--font-heading);
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.btn-back:hover {
  color: var(--primary);
}

.active-role-display {
  display: none; 
}

/* ... existing styles for list mode ... */
.header h2 {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-main);
  background: linear-gradient(135deg, var(--text-main) 0%, var(--primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.02em;
}

.btn-create {
  background: var(--primary);
  color: var(--text-on-primary);
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-heading);
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: var(--shadow-glow);
  position: relative;
  overflow: hidden;
}

.btn-create:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 20px var(--primary-glow);
}

.role-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* --- Grid View Override --- */
.role-list.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  width: 100%;
}

.role-card {
  background: hsla(255, 100%, 100%, 0.3);
  padding: 20px;
  border-radius: var(--radius-md);
  cursor: pointer;
  border: 1px solid var(--border-subtle);
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  position: relative;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
  overflow: hidden;
}

.role-avatar, .role-avatar-img {
  width: 56px; /* Slightly larger for patterns */
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08); /* Soft shadow for image */
  background: white; /* Fallback/Loading bg */
  border: 2px solid white; 
}

/* Grid View Avatar overrides */
.grid-view .role-avatar, .grid-view .role-avatar-img {
  width: 90px;
  height: 90px;
  margin-bottom: 20px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
  border: 4px solid rgba(255,255,255,0.9);
}

/* Specific styles for Grid Cards */
.grid-view .role-card {
  height: 240px; /* Taller cards */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.grid-view .role-card:hover {
  transform: translateY(-8px);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 12px 40px rgba(0,0,0,0.08);
}

.grid-view .role-card h3 {
  font-size: 1.4rem;
  margin-bottom: 12px;
}

.grid-view .personality {
  font-size: 0.95rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Create Card in Grid */
.create-card {
  border: 2px dashed var(--border-subtle);
  background: rgba(255,255,255,0.2) !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.create-card:hover {
  border-color: var(--primary);
  background: rgba(255,255,255,0.4) !important;
}

.create-icon {
  font-size: 3rem;
  color: var(--primary);
  opacity: 0.8;
  margin-bottom: 8px;
  line-height: 1;
}

.create-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* User Card in Grid */
.role-card.user-card {
  background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.6));
  border: 2px solid white;
}

.user-avatar-wrapper {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  margin-bottom: 20px;
  padding: 4px;
  background: white;
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar-wrapper img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

/* Top Right Home Widgets Box */
.home-widgets {
  position: fixed;
  top: 24px;
  right: 24px;
  display: flex;
  gap: 12px;
  z-index: 1000;
}

.widget-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px 8px 8px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 40px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
}

.widget-item:hover {
  transform: translateY(-2px);
  background: white;
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  border-color: var(--primary-glow);
}

.widget-item.is-active {
  background: var(--primary);
  border-color: var(--primary);
}

.widget-item.is-active .widget-icon,
.widget-item.is-active .widget-label {
  color: white;
  -webkit-text-fill-color: white;
}

.widget-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: var(--primary);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.widget-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.widget-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.widget-label {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-main);
  background: linear-gradient(135deg, var(--text-main), var(--primary));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Sorting Mode Effects */
.role-list.is-sorting .role-card:not(.sorting-item) {
   opacity: 0.5;
   pointer-events: none;
}

.role-card.sorting-item {
   border: 2px solid var(--primary);
   animation: shake 0.5s infinite ease-in-out;
}

@keyframes shake {
  0% { transform: rotate(0deg); }
  25% { transform: rotate(0.5deg); }
  75% { transform: rotate(-0.5deg); }
  100% { transform: rotate(0deg); }
}

.reorder-actions {
  position: absolute;
  top: 10px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 20px;
  z-index: 10;
}

.btn-reorder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  transition: all 0.2s;
}

.btn-reorder:hover:not(:disabled) {
  transform: scale(1.1);
  background: #6d28d9;
}

.btn-reorder:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
  opacity: 0.5;
}

/* User Card Utility replacement: DEPRECATED by home-widgets */
.user-profile-widget {
  display: none;
}

/* Keep existing list styles for sidebar mode */
.role-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--primary);
  opacity: 0;
  transition: opacity 0.3s;
}

.role-list:not(.grid-view) .role-card:hover { 
  transform: translateY(-3px) scale(1.01);
  background: hsla(255, 100%, 100%, 0.5);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-glow);
}

.role-card.active {
  background: white;
  border-color: transparent;
  box-shadow: var(--shadow-md), 0 0 0 1px var(--primary-glow);
}

.role-card.active::before {
  opacity: 1;
}

.role-card.active h3 {
  color: var(--primary);
}

.role-card h3 {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--text-main);
  transition: color 0.3s;
}

.personality {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-actions {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.role-card:hover .card-actions {
  opacity: 1;
  transform: translateX(0);
}

.btn-edit, .btn-delete {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  font-size: 1rem;
  transition: all 0.2s;
  background: white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.btn-edit:hover {
  background: var(--primary);
  color: white;
  transform: translateY(-2px);
}

.btn-delete:hover {
  background: #ff4757;
  color: white;
  transform: translateY(-2px);
}

/* --- Modal Styles 2.0 --- */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: hsla(240, 20%, 5%, 0.4); 
  backdrop-filter: blur(12px); 
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease-out;
}

.dialog {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(24px);
  padding: 0; /* Remove padding here, move to content */
  border-radius: 24px;
  width: 580px;
  max-width: 90vw;
  max-height: 90vh; /* Limit height */
  box-shadow: 0 20px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.5);
  display: flex;
  flex-direction: column;
  gap: 0; /* Handle gap in scroll area */
  animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden; /* rounded corners */
}

.dialog-content {
  padding: 32px 40px;
  overflow-y: auto; /* Scrollable content */
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dialog-header {
  padding: 24px 40px 0 40px;
  flex-shrink: 0;
}

.dialog-footer {
  padding: 20px 40px 32px 40px;
  border-top: 1px solid var(--border-subtle);
  background: white;
  flex-shrink: 0; /* Always visible */
  display: flex;
  gap: 16px;
  justify-content: flex-end;
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.dialog h3 {
  font-family: var(--font-heading);
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-main);
  margin: 0 0 8px 0;
  text-align: center;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Form Groups Layout */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted);
  margin-left: 4px;
}

.form-label.optional::after {
  content: ' (可选)';
  font-weight: 400;
  opacity: 0.6;
}

.dialog input, 
.dialog textarea {
  width: 100%;
  padding: 12px 16px;
  background: rgba(240, 244, 255, 0.5);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  font-family: inherit;
  font-size: 0.95rem;
  color: var(--text-main);
  transition: all 0.2s;
  resize: vertical;
}

.input-with-action {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-icon-action {
  background: white; /* Explicit white instead of var */
  border: 1px solid #e0e0e0; /* Explicit border */
  width: 48px;
  height: 48px;
  border-radius: 12px;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05); /* Add shadow for visibility */
}

.btn-icon-action:hover {
  background: #f0f7ff;
  border-color: var(--primary);
  transform: scale(1.05);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.avatar-preview-small {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.avatar-preview-small img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border-subtle);
}

.dialog input:focus, 
.dialog textarea:focus {
  outline: none;
  background: white;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-glow);
}

.dialog input { height: 48px; }
.dialog textarea { min-height: 80px; }

/* Old dialog-actions removed, replaced by .dialog-footer */

.dialog-actions button {
  padding: 12px 28px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.dialog-actions button:first-child { /* Cancel */
  background: transparent;
  color: var(--text-muted);
}

.dialog-actions button:first-child:hover {
  background: rgba(0,0,0,0.05);
  color: var(--text-main);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  box-shadow: 0 4px 15px var(--primary-glow);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--primary-glow);
  filter: brightness(1.05);
}

/* --- Avatar Section Styles --- */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.avatar-wrapper {
  width: 120px; /* Larger */
  height: 120px;
  border-radius: 50%;
  position: relative;
  cursor: zoom-in;
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
  border: 4px solid white;
  background: white;
  transition: transform 0.2s;
  overflow: hidden; /* Fix image spilling */
  display: flex; /* Center alignment */
  align-items: center;
  justify-content: center;
}

/* ... existing code ... */

.btn-primary-action {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  padding: 12px 32px;
  border-radius: 12px;
  border: none;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 15px var(--primary-glow);
  transition: all 0.2s;
  flex: 1; /* Make it wide */
  max-width: 200px;
}

.btn-primary-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--primary-glow);
  filter: brightness(1.05);
}

.btn-cancel {
  padding: 12px 24px;
  border: 1px solid var(--border-subtle);
  background: white;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  color: var(--text-muted);
}

.btn-cancel:hover {
  background: #f5f5f5;
  color: var(--text-main);
}

.avatar-wrapper:hover {
  transform: scale(1.05);
}

.avatar-wrapper img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0,0,0,0.3);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-controls {
  display: flex;
  gap: 12px;
  width: 100%;
  justify-content: center;
  align-items: center;
}

.btn-random {
  padding: 8px 16px;
  background: white;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
  white-space: nowrap;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.btn-random:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: #f0f7ff;
}

.url-input-wrapper {
  flex: 1;
  max-width: 300px;
}

.url-input-wrapper input {
  height: 36px;
  padding: 8px 12px;
  font-size: 0.85rem;
  border-radius: 8px;
}

/* --- Lightbox --- */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
  animation: fadeIn 0.2s;
  backdrop-filter: blur(5px);
}

.lightbox-img {
  max-width: 90vw;
  max-height: 90vh;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  cursor: default;
  animation: scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  background: white;
}

.lightbox-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255,255,255,0.2);
  border: none;
  font-size: 2rem;
  color: white;
  cursor: pointer;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.lightbox-close:hover {
  background: rgba(255,255,255,0.4);
}
</style>
