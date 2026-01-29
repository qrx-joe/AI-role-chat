<template>
  <div class="app-container">
    <!-- 模式 A：无角色选中（首页模式），全屏网格显示 -->
    <main v-if="!chatStore.currentRole" class="home-layout">
       <div class="home-header">
          <h1>选择你的 AI 伙伴</h1>
          <p>开启一段新的对话旅程</p>
       </div>
       <div class="home-content">
          <RoleManager :grid="true" />
       </div>
    </main>

    <!-- 模式 B：有角色选中（对话模式），恢复侧边栏布局 -->
    <template v-else>
      <aside class="sidebar">
        <div class="role-header-wrapper">
          <RoleManager :compact="true" />
        </div>
        <HistorySidebar />
      </aside>
      <main class="main-content">
        <ChatContainer />
      </main>
    </template>
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
  padding: 16px;
  gap: 16px;
}

/* --- Home Layout --- */
.home-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: transparent;
  animation: fadeIn 0.8s ease-out;
}

.home-header {
  text-align: center;
  margin-bottom: 50px; /* 增加间距 */
  position: relative;
  z-index: 2;
}

.home-header h1 {
  font-family: var(--font-heading);
  font-size: 4.5rem; /* 更大气的标题 */
  font-weight: 800;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
  /* 移除 text-fill-color: transparent 以避免模糊，或者优化它 */
  color: white;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 10px rgba(255, 255, 255, 0.3); /* 更清晰的投影 */
  background: none;
  -webkit-text-fill-color: initial;
}

.home-header p {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  letter-spacing: 0.05em;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.home-content {
  width: 100%;
  max-width: 1400px; /* 更宽的容器 */
  flex: 1;
  overflow-y: auto;
  padding: 0 40px 40px;
  display: flex;
  justify-content: center;
}

/* --- Sidebar Chat Mode --- */
.sidebar {
  width: 340px;
  flex: 0 0 340px;
  background: var(--glass-nav);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  animation: slideInLeft 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  z-index: 10;
}

.role-header-wrapper {
  flex: 0 0 auto;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--glass-nav);
  z-index: 5;
}

.sidebar > *:last-child {
  flex: 1;
  overflow-y: auto;
}

.main-content {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background: var(--surface);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  animation: fadeIn 0.8s ease-out 0.2s backwards;
  z-index: 5;
}
</style>
