<template>
  <div class="role-manager">
    <div class="header">
      <h2>AI 角色</h2>
      <button class="btn-create" @click="openCreateDialog">+ 创建角色</button>
    </div>

    <div class="role-list">
      <div
        v-for="role in chatStore.roles"
        :key="role.id"
        class="role-card"
        :class="{ active: chatStore.currentRole?.id === role.id }"
        @click="chatStore.selectRole(role)"
      >
        <h3>{{ role.name }}</h3>
        <p class="personality">{{ role.personality }}</p>
        <div class="card-actions">
          <button class="btn-edit" @click.stop="openEditDialog(role)" title="编辑角色">📝</button>
          <button class="btn-delete" @click.stop="handleDelete(role.id)" title="删除角色">🗑️</button>
        </div>
      </div>
    </div>

    <!-- 创建/编辑角色弹窗 -->
    <div v-if="showDialog" class="dialog-overlay" @click="closeDialog">
      <div class="dialog" @click.stop>
        <h3>{{ isEditing ? '编辑角色' : '创建新角色' }}</h3>
        <input v-model="roleForm.name" placeholder="角色名称" />
        <textarea v-model="roleForm.personality" placeholder="性格特征（如：毒舌、温柔、严谨）" rows="2"></textarea>
        <textarea v-model="roleForm.background" placeholder="背景故事" rows="3"></textarea>
        <textarea v-model="roleForm.constraints" placeholder="行为约束（可选）" rows="2"></textarea>
        <textarea v-model="roleForm.examples" placeholder="对话示例（可选）" rows="3"></textarea>
        <div class="dialog-actions">
          <button @click="closeDialog">取消</button>
          <button @click="handleSubmit" class="btn-primary">{{ isEditing ? '保存修改' : '立即创建' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useChatStore } from '../stores/chat';

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
.role-manager {
  padding: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

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
  background: hsla(240, 20%, 5%, 0.4); /* 深色遮罩 */
  backdrop-filter: blur(12px); /* 模糊背景 */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease-out;
}

.dialog {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(24px);
  padding: 32px 40px; /* 增加内边距 */
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
