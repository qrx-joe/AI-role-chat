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
        <textarea
          v-model="inputText"
          placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
          @keydown.enter.exact.prevent="handleSend"
          :disabled="chatStore.isStreaming"
          rows="3"
        ></textarea>
        <button 
          @click="handleSend" 
          :disabled="(!inputText.trim() && !uploadedImage) || chatStore.isStreaming" 
          class="send-btn"
        >
          {{ chatStore.isStreaming ? '🚀' : '发送' }}
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
  background: #f5f7fb;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}

.empty-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.5; }

.chat-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.chat-header {
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  z-index: 5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.btn-tool {
  background: #f1f5f9;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
}

.btn-tool:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.role-info { display: flex; align-items: center; gap: 12px; }
.role-badge { 
  background: #667eea; 
  color: white; 
  font-size: 11px; 
  padding: 2px 8px; 
  border-radius: 4px; 
}

.messages-list {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-wrap { display: flex; width: 100%; }
.message-wrap.user { justify-content: flex-end; }
.message-wrap.assistant { justify-content: flex-start; }

.message-bubble {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
}

.user .message-bubble {
  background: #667eea;
  color: white;
  border-top-right-radius: 2px;
}

.assistant .message-bubble {
  background: white;
  color: #1e293b;
  border-top-left-radius: 2px;
  border: 1px solid #e2e8f0;
}

.image-box img {
  max-width: 100%;
  border-radius: 8px;
  margin-bottom: 8px;
}

.is-typing .message-bubble::after {
  content: '▋';
  display: inline-block;
  margin-left: 4px;
  animation: blink 0.8s infinite;
  color: #667eea;
}

@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

.input-panel {
  padding: 20px 24px;
  background: white;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

textarea {
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  max-height: 120px;
}

.send-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: bold;
}

.send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
