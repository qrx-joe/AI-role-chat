<template>
  <div class="app-container">
    <aside class="sidebar">
      <RoleManager />
      <HistorySidebar />
    </aside>
    <main class="main-content">
      <ChatContainer />
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import RoleManager from './components/RoleManager.vue';
import ChatContainer from './components/ChatContainer.vue';
import HistorySidebar from './components/HistorySidebar.vue';
import { useChatStore } from './stores/chat';

const chatStore = useChatStore();

onMounted(() => {
  chatStore.loadRoles();
});
</script>

<style scoped>
.app-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-app); /* 极光背景 */
  padding: 16px; /* 增加呼吸感 */
  gap: 16px;
}

.sidebar {
  width: 340px; /* 稍微加宽 */
  flex: 0 0 340px;
  background: var(--glass-nav); /* 更通透的导航背景 */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  animation: slideInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
  z-index: 10;
}

.main-content {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background: var(--surface); /* 水晶白表面 */
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  animation: fadeIn 0.8s ease-out 0.2s backwards; /* 错峰入场 */
  z-index: 5;
}

.sidebar > *:first-child {
  flex: 0 0 auto;
  max-height: 55%;
  overflow-y: auto;
  border-bottom: 1px solid var(--border-subtle);
}

.sidebar > *:last-child {
  flex: 1;
  overflow-y: auto;
}
</style>
