<template>
  <div class="chat-container">
    <div v-if="!chatStore.currentRole" class="empty-state">
      <div class="empty-icon">👈</div>
      <h2>请选择一个角色开始对话</h2>
      <p>或者在左上角创建一个新的人设</p>
    </div>

    <div v-else class="chat-main">
      <header class="chat-header">
        <div class="role-info">
          <img 
            v-if="chatStore.currentRole"
            :src="getRoleAvatar(chatStore.currentRole)" 
            class="header-avatar" 
            alt="Role Avatar"
          />
          <div class="role-text">
            <h2>{{ chatStore.currentRole.name }}</h2>
            <div v-if="chatStore.currentConversation?.title" class="role-subtitle">
              {{ chatStore.currentConversation.title }}
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-tool" @click="chatStore.togglePromptPreview" title="查看系统提示词">📜 Prompt</button>
          <button class="btn-tool" @click="showDebug = !showDebug" title="打开调试面板">🛠 Debug</button>
        </div>
      </header>

      <!-- 演示增强组件 -->
      <PromptPreview v-if="chatStore.showPromptPreview" />
      <DebugPanel v-if="showDebug" @close="showDebug = false" />

      <div class="messages-list" ref="messagesContainer">
        <div
          v-for="(msg, index) in chatStore.messages"
          :key="index"
          class="message-row"
          :class="[msg.role, { 'is-typing': chatStore.isStreaming && index === chatStore.messages.length - 1 && msg.role === 'assistant' }]"
        >
          <!-- Avatar Column -->
          <div class="message-avatar">
            <img 
              :src="msg.role === 'assistant' ? getRoleAvatar(chatStore.currentRole) : chatStore.userAvatar" 
              alt="avatar" 
            />
          </div>

          <div class="message-bubble">
            <template v-if="msg.type === 'image'">
              <div class="image-box" v-if="chatStore.parseMessageContent(msg.content).image">
                <img :src="chatStore.parseMessageContent(msg.content).image" alt="Upload" />
              </div>
            </template>
            <span class="text-content">{{ cleanText(chatStore.parseMessageContent(msg.content).text) }}</span>
          </div>
        </div>
      </div>

      <div class="input-panel">
        <ImageUploader v-model:imageBase64="uploadedImage" />
        <div class="input-wrapper">
          <textarea
            v-model="inputText"
            placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
            @keydown.enter.exact.prevent="handleSend"
            :disabled="chatStore.isStreaming"
            rows="1"
            ref="textareaRef"
          ></textarea>
        </div>
        <button 
          @click="handleSend" 
          :disabled="(!inputText.trim() && !uploadedImage) || chatStore.isStreaming" 
          class="send-btn"
        >
          <!-- 发送图标 -->
          <svg v-if="!chatStore.isStreaming" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          <!-- 正在生成图标 (闪电/正在运行) -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 聊天主容器组件
 * 
 * 核心功能：
 * 1. 渲染聊天消息流（支持图文显示）
 * 2. 处理用户输入发送（文本 + 图片）
 * 3. 自动滚动到底部
 * 4. 集成调试面板与系统提示词预览
 */
import { ref, nextTick, watch } from 'vue';
import { useChatStore } from '../stores/chat';
import ImageUploader from './ImageUploader.vue';
import PromptPreview from './PromptPreview.vue';
import DebugPanel from './DebugPanel.vue';

const chatStore = useChatStore();

/** 用户当前输入的文本 */
const inputText = ref('');

/** 待上传图片的 Base64 数据 */
const uploadedImage = ref(null);

/** 消息列表容器的 DOM 引用，用于控制滚动 */
const messagesContainer = ref(null);

/** 控制调试面板的显隐 */
const showDebug = ref(false);

/**
 * 获取角色的头像 URL
 * 
 * 如果角色没有自定义头像，则使用 DiceBear 生成一个基于名称的随机头像。
 */
function getRoleAvatar(role) {
  if (!role) return '';
  if (role.avatar) return role.avatar;
  
  // 备用逻辑：Notion 风格人像，配合随机调色盘
  const style = 'notionists';
  const colors = 'FFD6E0,C1E7E3,D1E8FF,FFF2CC,E2D4F5,FFE6D1';
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(role.name)}&backgroundColor=${colors}`;
}

/**
 * 自动滚动逻辑
 * 
 * 每当消息数组长度变化（有新消息进入）时，等待 DOM 更新完成，并平滑滚动到容器最底部。
 */
watch(() => chatStore.messages.length, async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}, { deep: true });

/**
 * 处理消息发送
 * 
 * 逻辑：
 * 1. 检查输入有效性（不能为空且不在生成中）
 * 2. 构造数据并调用 Store 的 sendMessage 动作
 * 3. 清空本地输入框和已上传图片
 */
async function handleSend() {
  if ((!inputText.value.trim() && !uploadedImage.value) || chatStore.isStreaming) return;

  const text = inputText.value.trim() || '请看这张图片';
  const image = uploadedImage.value;
  
  // 立即清空，提升 UI 响应感
  inputText.value = '';
  uploadedImage.value = null;

  await chatStore.sendMessage(text, image);
}

/**
 * 文本内容清洗
 * 
 * 用于在聊天气泡中隐藏后端两阶段处理时添加的预览描述 [图片内容描述：...]。
 * 这样做可以保持界面的简洁，仅展示用户实际发送的指令。
 */
function cleanText(text) {
  if (!text) return '';
  // 移除 [图片内容描述：...] 块及其后的空白字符
  return text.replace(/\[图片内容描述：[\s\S]*?\]\s*/g, '').trim();
}
</script>

<style scoped>
.chat-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: transparent; /* 让 App.vue 的极光背景透过来 */
  position: relative;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  animation: fadeIn 1s ease-out;
  background: radial-gradient(circle at center, hsla(255,100%,100%,0.4) 0%, transparent 60%);
}

.empty-icon { 
  font-size: 80px; 
  margin-bottom: 24px; 
  filter: drop-shadow(0 0 30px var(--primary-glow));
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.empty-state h2 {
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 12px;
  background: linear-gradient(135deg, var(--text-main) 30%, var(--primary) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.03em;
}

.chat-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.chat-header {
  padding: 16px 24px;
  background: var(--glass-nav);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-subtle);
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-tool {
  background: rgba(255,255,255,0.5);
  border: 1px solid var(--border-subtle);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.2s;
  backdrop-filter: blur(4px);
}

.btn-tool:hover {
  background: white;
  border-color: var(--primary);
  color: var(--primary);
  box-shadow: 0 4px 12px var(--primary-glow);
  transform: translateY(-1px);
}

.role-info { 
  display: flex; 
  align-items: center; 
  gap: 14px; /* Increased gap for better breathing room */
}

.header-avatar {
  width: 40px; /* Increased from 32px to balance double-line text */
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.role-info h2 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1.1rem; /* Slightly refined size */
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.role-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px; /* Increased gap for wider spacing */
}

.role-subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 400; /* Regular weight for better contrast */
  opacity: 0.85;
}

.role-badge { 
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white; 
  font-size: 11px; 
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 4px 12px; 
  border-radius: 20px; 
  box-shadow: 0 2px 8px var(--primary-glow);
}

.messages-list {
  flex: 1;
  padding: 32px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
  /* 移除背景颜色，改为完全透明 */
  background: transparent;
  scroll-behavior: smooth;
}

.message-row { 
  display: flex; 
  width: 100%; 
  gap: 12px;
  animation: slideInUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  align-items: flex-start;
}

.message-row.user { 
  flex-direction: row-reverse; 
}

.message-avatar img {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  background: white;
  flex-shrink: 0;
}

.message-bubble {
  max-width: 75%;
  padding: 16px 22px;
  border-radius: var(--radius-lg);
  font-size: 0.95rem;
  line-height: 1.7;
  position: relative;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s;
}

/* User Bubble with Tail (TUNED V2: STRONGER CONTRAST) */
.user .message-bubble {
  background: linear-gradient(135deg, #8B5CF6, #7C3AED); /* Vivid Violet to slightly darker */
  color: white;
  border-top-right-radius: 2px;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4); /* Deeper shadow */
  border: none; /* Removed border found to dilute color */
}

.user .message-bubble::before {
  content: '';
  position: absolute;
  right: -8px;
  top: 12px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 6px 0 6px 9px;
  border-color: transparent transparent transparent #7C3AED; /* Match gradient end */
  filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.2));
}

/* Assistant Bubble with Tail (TUNED V2: SOFTER OFF-WHITE) */
.assistant .message-bubble {
  background: #F8FAFC; /* Slate-50, soft off-white, warmer/softer than pure white */
  color: #334155; /* Slate-700, softer black */
  border-top-left-radius: 2px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04); /* Very gentle shadow */
  border: 1px solid rgba(0,0,0,0.03); /* Extremely subtle border */
}

.assistant .message-bubble::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 12px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 6px 9px 6px 0;
  border-color: transparent #F8FAFC transparent transparent;
  filter: drop-shadow(-1px 1px 2px rgba(0,0,0,0.04));
}

.image-box {
  margin: -6px -10px 10px;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-light);
}

.image-box img {
  display: block;
  width: 100%;
  height: auto;
  max-height: 400px;
  border-radius: 8px;
}

.text-content {
  white-space: pre-wrap;
  font-family: var(--font-body);
}

.input-panel {
  padding: 24px 32px 32px; /* 底部留多一点 */
  background: linear-gradient(to top, hsla(255,100%,100%,0.9) 0%, hsla(255,100%,100%,0.6) 50%, transparent 100%);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end; /* 对齐底部 */
  gap: 16px;
  position: relative;
  z-index: 50;
  border-top: 1px solid var(--border-subtle);
}

.input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-light);
  border-radius: 24px; /* 胶囊圆角 */
  padding: 8px 20px;
  box-shadow: var(--shadow-md);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.input-wrapper:focus-within {
  background: white;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-glow), var(--shadow-md);
  transform: translateY(-2px);
}

textarea {
  flex: 1;
  border: none;
  background: transparent;
  padding: 8px 0;
  resize: none;
  font-family: inherit;
  font-size: 1rem;
  max-height: 120px;
  color: var(--text-main);
  line-height: 1.5;
}

textarea:focus {
  outline: none;
}

.send-btn {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  border: none;
  width: 52px;
  height: 52px;
  border-radius: 50%; /* 圆形按钮 */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); /* 弹性动画 */
  box-shadow: 0 8px 20px var(--primary-glow);
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.1) rotate(10deg);
  filter: brightness(1.1);
  box-shadow: 0 12px 28px var(--primary-glow);
}

.send-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.send-btn:disabled { 
  background: #cbd5e1; 
  box-shadow: none;
  cursor: not-allowed;
  transform: scale(0.9);
  opacity: 0.7;
}
</style>
