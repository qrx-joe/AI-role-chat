<template>
  <div class="app-container">
    <!-- 访问密码验证层 -->
    <div v-if="!isAuthenticated" class="password-gate">
      <div class="password-box">
        <h2>🔒 请输入访问密码</h2>
        <input
          v-model="passwordInput"
          type="password"
          placeholder="密码"
          @keyup.enter="checkPassword"
        />
        <button @click="checkPassword">进入</button>
        <p v-if="passwordError" class="error">密码错误</p>
      </div>
    </div>

    <!--
      模式 A：无角色选中（首页模式）。
      初始进入应用或点击 Logo 时，全屏展示角色网格供用户挑选。
    -->
    <main v-if="!chatStore.currentRole && isAuthenticated" class="home-layout">
       <div class="home-header">
          <h1>跃然 AI</h1>
          <p>邂逅你的数字伙伴，开启一段新的灵魂旅程……</p>
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
    <template v-else-if="isAuthenticated">
      <aside class="sidebar" :class="{ 'is-collapsed': isSidebarCollapsed }">
        <div class="role-header-wrapper" v-show="!isSidebarCollapsed">
          <!-- 在侧边栏中使用 compact 模式展示当前正在对话的角色 -->
          <RoleManager :compact="true" />
        </div>
        <!-- 侧边栏历史记录列表 -->
        <HistorySidebar 
          :collapsed="isSidebarCollapsed" 
          @toggle="isSidebarCollapsed = !isSidebarCollapsed"
        />
      </aside>
      <main class="main-content">
        <!-- 对话框主体：消息列表与输入框 -->
        <ChatContainer />
      </main>
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
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
const isSidebarCollapsed = ref(false);

// 访问密码验证
const ACCESS_PASSWORD = 'vivid2024';
const isAuthenticated = ref(localStorage.getItem('vivid_auth') === '1');
const passwordInput = ref('');
const passwordError = ref(false);

function checkPassword() {
  if (passwordInput.value === ACCESS_PASSWORD) {
    localStorage.setItem('vivid_auth', '1');
    isAuthenticated.value = true;
    passwordError.value = false;
  } else {
    passwordError.value = true;
  }
}

// 应用初始化：加载所有后端存储的角色信息
onMounted(() => {
  if (isAuthenticated.value) {
    chatStore.loadRoles();
  }
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
  transition: width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), flex 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.sidebar.is-collapsed {
  width: 72px;
  flex: 0 0 72px;
  overflow: visible; /* Allow popovers to extend outside */
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

.sidebar.is-collapsed > *:last-child {
  overflow: visible; /* Prevents clipping of the history popover */
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

/* --- Password Gate --- */
.password-gate {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  z-index: 9999;
}

.password-box {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 40px;
  width: 320px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.password-box h2 {
  color: white;
  margin-bottom: 24px;
  font-size: 1.25rem;
}

.password-box input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  margin-bottom: 16px;
  outline: none;
  transition: border-color 0.2s;
}

.password-box input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.password-box input:focus {
  border-color: rgba(255, 255, 255, 0.6);
}

.password-box button {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.password-box button:hover {
  opacity: 0.9;
}

.password-box .error {
  color: #ff6b6b;
  margin-top: 12px;
  font-size: 0.875rem;
}
</style>
