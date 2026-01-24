<template>
  <div class="role-manager">
    <div class="header">
      <h2>AI 角色</h2>
      <button class="btn-create" @click="showCreateDialog = true">+ 创建角色</button>
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
        <button class="btn-delete" @click.stop="handleDelete(role.id)">删除</button>
      </div>
    </div>

    <!-- 创建角色弹窗 -->
    <div v-if="showCreateDialog" class="dialog-overlay" @click="showCreateDialog = false">
      <div class="dialog" @click.stop>
        <h3>创建新角色</h3>
        <input v-model="newRole.name" placeholder="角色名称" />
        <textarea v-model="newRole.personality" placeholder="性格特征（如：毒舌、温柔、严谨）" rows="2"></textarea>
        <textarea v-model="newRole.background" placeholder="背景故事" rows="3"></textarea>
        <textarea v-model="newRole.constraints" placeholder="行为约束（可选）" rows="2"></textarea>
        <textarea v-model="newRole.examples" placeholder="对话示例（可选）" rows="3"></textarea>
        <div class="dialog-actions">
          <button @click="showCreateDialog = false">取消</button>
          <button @click="handleCreate" class="btn-primary">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useChatStore } from '../stores/chat';

const chatStore = useChatStore();
const showCreateDialog = ref(false);
const newRole = ref({
  name: '',
  personality: '',
  background: '',
  constraints: '',
  examples: '',
});

async function handleCreate() {
  if (!newRole.value.name || !newRole.value.personality || !newRole.value.background) {
    alert('请填写必填字段：名称、性格、背景');
    return;
  }
  
  try {
    await chatStore.createRole(newRole.value);
    showCreateDialog.value = false;
    newRole.value = { name: '', personality: '', background: '', constraints: '', examples: '' };
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
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.btn-create {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.role-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.role-card {
  background: white;
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
  position: relative;
}

.role-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.role-card.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea15, #764ba215);
}

.personality {
  color: #666;
  font-size: 14px;
  margin: 8px 0;
}

.btn-delete {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ff4444;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.3s;
}

.role-card:hover .btn-delete {
  opacity: 1;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  padding: 24px;
  border-radius: 16px;
  width: 500px;
  max-width: 90vw;
}

.dialog h3 {
  margin-bottom: 16px;
}

.dialog input,
.dialog textarea {
  width: 100%;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: inherit;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 16px;
}

.dialog-actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.btn-primary {
  background: #667eea;
  color: white;
}
</style>
