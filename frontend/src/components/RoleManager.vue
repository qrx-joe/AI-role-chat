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
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-main);
  background: linear-gradient(to right, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.btn-create {
  background: var(--primary);
  color: var(--text-on-primary);
  border: none;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px var(--primary-glow);
}

.btn-create:hover {
  transform: translateY(-1px);
  filter: brightness(1.1);
  box-shadow: 0 6px 16px var(--primary-glow);
}

.role-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.role-card {
  background: var(--surface);
  padding: 20px;
  border-radius: var(--radius-lg);
  cursor: pointer;
  border: 1px solid var(--glass-border);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: var(--shadow-sm);
  animation: fadeIn 0.5s ease-out;
}

.role-card:hover {
  transform: translateY(-4px);
  background: var(--surface-hover);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-glow);
}

.role-card.active {
  background: var(--surface-active);
  border: 2px solid var(--primary);
  box-shadow: 0 0 0 4px var(--primary-glow);
}

.role-card h3 {
  font-size: 1.1rem;
  margin-bottom: 4px;
  color: var(--text-main);
}

.personality {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.3s ease;
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
}

.btn-edit {
  background: whitesmoke;
  color: var(--primary);
}

.btn-edit:hover {
  background: var(--primary);
  color: white;
}

.btn-delete {
  background: whitesmoke;
  color: #ef4444;
}

.btn-delete:hover {
  background: #ef4444;
  color: white;
}

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: hsla(220, 30%, 5%, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.dialog {
  background: var(--surface);
  padding: 32px;
  border-radius: var(--radius-lg);
  width: 560px;
  max-width: 95vw;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--glass-border);
}

.dialog h3 {
  font-size: 1.5rem;
  margin-bottom: 24px;
  color: var(--text-main);
}

.dialog input,
.dialog textarea {
  width: 100%;
  padding: 14px;
  margin-bottom: 16px;
  border: 1.5px solid #e2e8f0;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 0.95rem;
  transition: all 0.2s;
  background: white;
}

.dialog input:focus,
.dialog textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.dialog-actions button {
  padding: 12px 24px;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.dialog-actions button:not(.btn-primary) {
  background: #f1f5f9;
  color: #475569;
}

.dialog-actions button:not(.btn-primary):hover {
  background: #e2e8f0;
}

.btn-primary {
  background: var(--primary);
  color: white;
  box-shadow: 0 4px 12px var(--primary-glow);
}

.btn-primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}
</style>
