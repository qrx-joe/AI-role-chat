<template>
  <div class="chat-container">
    <div v-if="!chatStore.currentRole" class="empty-state">
      <h2>👈 请选择一个角色开始对话</h2>
    </div>

    <div v-if="chatStore.currentRole" class="chat-main">
      <!-- 头部信息 -->
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

      <!-- 提示词预览弹窗 -->
      <PromptPreview v-if="chatStore.showPromptPreview" />
      
      <!-- Debug 面板 (侧滑/浮动) -->
      <DebugPanel v-if="showDebug" @close="showDebug = false" />

      <!-- 消息列表 -->
      <div class="messages" ref="messagesContainer">
        <div
          v-for="(msg, index) in chatStore.messages"
          :key="index"
          class="message"
          :class="[
            msg.role, 
            { 'is-typing': chatStore.isStreaming && index === chatStore.messages.length - 1 && msg.role === 'assistant' }
          ]"
        >
          <div class="bubble">
            <div v-if="msg.type === 'image'" class="image-preview">
              <img :src="msg.content.includes('||') ? msg.content.split(' || ')[1].split(' ')[1] : msg.content" alt="Upload" />
            </div>
            <div class="content">{{ msg.content.includes('||') ? msg.content.split(' || ')[0] : msg.content }}</div>
            <span v-if="msg.role === 'assistant' && index === chatStore.messages.length - 1 && chatStore.isStreaming" class="cursor">▋</span>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <ImageUploader v-model:imageBase64="uploadedImage" />
        <textarea
          v-model="inputText"
          placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
          @keydown.enter.exact.prevent="handleSend"
          :disabled="chatStore.isStreaming"
          rows="3"
        ></textarea>
        <button @click="handleSend" :disabled="(!inputText.trim() && !uploadedImage) || chatStore.isStreaming" class="btn-send">
          {{ chatStore.isStreaming ? '发送中...' : '发送' }}
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
});

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
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.chat-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
}

.tag {
  background: #667eea;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.message.assistant .bubble.is-typing .content::after {
  content: '▋';
  display: inline-block;
  vertical-align: middle;
  margin-left: 2px;
  color: #667eea;
  animation: blink 0.8s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.bubble .content {
  font-size: 0.95rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.chat-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-tool {
  background: #f1f5f9;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  color: #64748b;
}

.btn-tool:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.messages {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message {
  display: flex;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message.user {
  justify-content: flex-end;
}

.message.assistant {
  justify-content: flex-start;
}

.bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 16px;
  word-wrap: break-word;
}

.message.user .bubble {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.message.assistant .bubble {
  background: white;
  border: 1px solid #eee;
  color: #333;
}

.cursor {
  animation: blink 1s infinite;
  margin-left: 2px;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.image-preview img {
  max-width: 200px;
  border-radius: 8px;
  margin-bottom: 8px;
}

.input-area {
  padding: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-area > div:first-child {
  display: flex;
  align-items: center;
  gap: 12px;
}

.input-area textarea {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 12px;
  font-family: inherit;
  resize: none;
}

.btn-send {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: bold;
  transition: transform 0.2s;
  align-self: flex-end;
}

.btn-send:hover:not(:disabled) {
  transform: scale(1.05);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
