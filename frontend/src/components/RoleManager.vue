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

    <!-- Grid Mode & List Mode -->
    <div v-else class="role-list" :class="{ 'grid-view': grid }">
      <!-- Create Button Card (Only in Grid Mode) -->
      <div v-if="grid" class="role-card create-card" @click="openCreateDialog">
        <div class="create-icon">+</div>
        <h3>创建新角色</h3>
        <p class="create-desc">设计属于你的 AI 伙伴</p>
      </div>

      <div
        v-for="role in chatStore.roles"
        :key="role.id"
        class="role-card"
        :class="{ active: chatStore.currentRole?.id === role.id }"
        @click="chatStore.selectRole(role)"
      >
        <h3>{{ role.name }}</h3>
        <!-- <p class="personality">{{ role.personality }}</p> 用户要求隐藏 -->
        <div class="card-actions">
          <button class="btn-edit" @click.stop="openEditDialog(role)" title="编辑角色">📝</button>
          <button class="btn-delete" @click.stop="handleDelete(role.id)" title="删除角色">🗑️</button>
        </div>
      </div>
    </div>

    <!-- 创建/编辑角色弹窗 (不变) -->
    <div v-if="showDialog" class="dialog-overlay" @click="closeDialog">
      <div class="dialog" @click.stop>
        <h3>{{ isEditing ? '编辑角色' : '创建新角色' }}</h3>
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
        <div class="dialog-actions">
          <button @click="closeDialog">取消</button>
          <button @click="handleSubmit" class="btn-primary">{{ isEditing ? '保存修改' : '立即创建' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps } from 'vue';
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
const isEditing = ref(false);
const editingRoleId = ref(null);
const roleForm = ref({
  name: '',
  personality: '',
  background: '',
  constraints: '',
  examples: '',
});

function openCreateDialog() {
  isEditing.value = false;
  editingRoleId.value = null;
  roleForm.value = { name: '', personality: '', background: '', constraints: '', examples: '' };
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
  -webkit-line-clamp: 3;
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

.role-card:hover {
  /* Only apply translateY if NOT in grid view (handled above) */
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
  padding: 32px 40px; 
  border-radius: 24px;
  width: 580px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.5);
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
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

.dialog input:focus, 
.dialog textarea:focus {
  outline: none;
  background: white;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-glow);
}

.dialog input { height: 48px; }
.dialog textarea { min-height: 80px; }

.dialog-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 12px;
  padding-top: 20px;
  border-top: 1px solid var(--border-subtle);
}

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
</style>
