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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.sidebar {
  width: 320px;
  flex: 0 0 320px;
  background: #f8fafc;
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: 100%;
  box-shadow: 4px 0 15px rgba(0,0,0,0.05);
  z-index: 10;
}

.main-content {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background: white;
}

.sidebar > *:first-child {
  flex: 0 0 auto;
  max-height: 45%;
  overflow-y: auto;
}

.sidebar > *:last-child {
  flex: 1;
  overflow-y: auto;
  border-top: 1px solid #e2e8f0;
}
</style>
