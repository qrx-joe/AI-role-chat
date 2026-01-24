<template>
  <div class="app">
    <div class="sidebar">
      <RoleManager />
      <HistorySidebar />
    </div>
    <ChatContainer />
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
.app {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.sidebar {
  width: 320px;
  background: #f5f7fb;
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.sidebar > *:first-child {
  flex: 0 0 auto;
  max-height: 50%;
  overflow-y: auto;
}

.sidebar > *:last-child {
  flex: 1;
  overflow-y: auto;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
