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
          <span class="role-badge">{{ chatStore.currentRole.personality }}</span>
          <h2>{{ chatStore.currentRole.name }}</h2>
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
          class="message-wrap"
          :class="[msg.role, { 'is-typing': chatStore.isStreaming && index === chatStore.messages.length - 1 && msg.role === 'assistant' }]"
        >
          <div class="message-bubble">
            <template v-if="msg.type === 'image'">
              <div class="image-box" v-if="chatStore.parseMessageContent(msg.content).image">
                <img :src="chatStore.parseMessageContent(msg.content).image" alt="Upload" />
              </div>
            </template>
            <div class="text-content">{{ chatStore.parseMessageContent(msg.content).text }}</div>
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
          {{ chatStore.isStreaming ? '⚡' : '🚀' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue';
import { useChatStore } from '../stores/chat';
import ImageUploader from './ImageUploader.vue';
import PromptPreview from './PromptPreview.vue';
import DebugPanel from './DebugPanel.vue';

const chatStore = useChatStore();
const inputText = ref('');
const uploadedImage = ref(null);
const messagesContainer = ref(null);
const showDebug = ref(false);

// 自动滚动到底部
watch(() => chatStore.messages.length, async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}, { deep: true });

async function handleSend() {
  if ((!inputText.value.trim() && !uploadedImage.value) || chatStore.isStreaming) return;

  const text = inputText.value.trim() || '请看这张图片';
  const image = uploadedImage.value;
  
  inputText.value = '';
  uploadedImage.value = null;

  await chatStore.sendMessage(text, image);
}
</script>

<style scoped>
.chat-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--surface);
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
}

.empty-icon { 
  font-size: 80px; 
  margin-bottom: 24px; 
  filter: drop-shadow(0 0 20px var(--primary-glow));
}

.empty-state h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text-main);
}

.chat-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.chat-header {
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--glass-border);
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-tool {
  background: white;
  border: 1px solid var(--glass-border);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}

.btn-tool:hover {
  border-color: var(--primary);
  color: var(--primary);
  transform: translateY(-1px);
}

.role-info { display: flex; align-items: center; gap: 16px; }

.role-info h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-main);
}

.role-badge { 
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white; 
  font-size: 10px; 
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 4px 10px; 
  border-radius: 20px; 
}

.messages-list {
  flex: 1;
  padding: 32px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: radial-gradient(circle at 50% 50%, hsla(235, 80%, 95%, 0.3) 0%, transparent 100%);
}

.message-wrap { 
  display: flex; 
  width: 100%; 
  animation: fadeIn 0.4s ease-out;
}

.message-wrap.user { justify-content: flex-end; }
.message-wrap.assistant { justify-content: flex-start; }

.message-bubble {
  max-width: 75%;
  padding: 14px 18px;
  border-radius: var(--radius-lg);
  font-size: 0.95rem;
  line-height: 1.6;
  position: relative;
  box-shadow: var(--shadow-sm);
}

.user .message-bubble {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  border-bottom-right-radius: 4px;
  box-shadow: 0 8px 20px var(--primary-glow);
}

.assistant .message-bubble {
  background: white;
  color: var(--text-main);
  border-bottom-left-radius: 4px;
  border: 1px solid var(--glass-border);
}

.image-box {
  margin-bottom: 12px;
  overflow: hidden;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.image-box img {
  display: block;
  max-width: 100%;
  max-height: 300px;
  object-fit: cover;
}

.text-content {
  white-space: pre-wrap;
}

.is-typing .message-bubble::after {
  content: '▋';
  display: inline-block;
  margin-left: 4px;
  animation: blink 0.8s infinite;
  color: var(--primary);
}

@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

.input-panel {
  padding: 24px;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 5;
}

.input-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, var(--surface) 80%, transparent);
  z-index: -1;
  pointer-events: none;
}

.input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: var(--radius-lg);
  padding: 6px 16px;
  box-shadow: var(--shadow-md);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.input-wrapper:focus-within {
  border-color: var(--primary);
  box-shadow: 0 8px 30px var(--primary-glow);
  transform: translateY(-2px);
}

textarea {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 0;
  resize: none;
  font-family: inherit;
  font-size: 0.95rem;
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
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px var(--primary-glow);
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05) rotate(-5deg);
  filter: brightness(1.1);
  box-shadow: 0 8px 20px var(--primary-glow);
}

.send-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.send-btn:disabled { 
  background: #cbd5e1; 
  box-shadow: none;
  cursor: not-allowed; 
}
</style>
