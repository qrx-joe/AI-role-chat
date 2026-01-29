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
  background: var(--bg-app);
  padding: 12px; /* 给边框留出一点呼吸空间 */
  gap: 12px;
}

.sidebar {
  width: 320px;
  flex: 0 0 320px;
  background: var(--glass);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  animation: fadeIn 0.6s ease-out;
}

.main-content {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background: var(--surface);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  animation: fadeIn 0.8s ease-out;
}

.sidebar > *:first-child {
  flex: 0 0 auto;
  max-height: 50%;
  overflow-y: auto;
}

.sidebar > *:last-child {
  flex: 1;
  overflow-y: auto;
  border-top: 1px solid var(--glass-border);
}
</style>
