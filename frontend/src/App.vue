<template>
  <div class="app-container">
    <!-- 
      模式 A：无角色选中（首页模式）。
      初始进入应用或点击 Logo 时，全屏展示角色网格供用户挑选。
    -->
    <main v-if="!chatStore.currentRole" class="home-layout">
       <div class="home-header">
          <h1>跃然 AI</h1>
          <p>邂逅你的数字伙伴，开启一段新的灵魂旅程...</p>
       </div>
       <div class="home-content">
          <!-- 传入 grid 属性，让 RoleManager 渲染为精美的大网格布局 -->
          <RoleManager :grid="true" />
       </div>
    </main>

    <!-- 
      模式 B：有角色选中（对话模式）。
      进入特定的角色对话界面，展示左侧历史侧边栏和右侧聊天主体。
    -->
    <template v-else>
      <aside class="sidebar">
        <div class="role-header-wrapper">
          <!-- 在侧边栏中使用 compact 模式展示当前正在对话的角色 -->
          <RoleManager :compact="true" />
        </div>
        <!-- 侧边栏历史记录列表 -->
        <HistorySidebar />
      </aside>
      <main class="main-content">
        <!-- 对话框主体：消息列表与输入框 -->
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

/**
 * 根组件脚本
 * 
 * 核心逻辑：
 * 1. 控制“首页网格”与“对话界面”的切换。
 * 2. 在组件挂载时初始化全局角色列表。
 */
const chatStore = useChatStore();

// 应用初始化：加载所有后端存储的角色信息
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
  background: white; /* Solid base */
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  box-shadow: 0 4px 24px rgba(0,0,0,0.04); /* Subtle lift */
  overflow: hidden;
  animation: fadeIn 0.8s ease-out 0.2s backwards;
  z-index: 5;
}
</style>
