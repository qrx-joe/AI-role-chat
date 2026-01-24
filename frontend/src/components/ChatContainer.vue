<template>
  <div class="chat-container">
    <div v-if="!chatStore.hasSelectedRole" class="empty-state">
      <h2>👈 请选择一个角色开始对话</h2>
    </div>

    <div v-else class="chat-content">
      <!-- 顶部角色信息 -->
      <div class="chat-header">
        <h2>{{ chatStore.currentRole.name }}</h2>
        <span class="tag">{{ chatStore.currentRole.personality }}</span>
      </div>

      <!-- 消息列表 -->
      <div class="messages" ref="messagesContainer">
        <div
          v-for="(message, index) in chatStore.messages"
          :key="index"
          class="message"
          :class="message.role"
        >
          <div class="bubble">
            <div v-if="message.imageBase64" class="image-preview">
              <img :src="message.imageBase64" alt="用户上传的图片" />
            </div>
            <p>{{ message.content }}</p>
            <span v-if="message.role === 'assistant' && index === chatStore.messages.length - 1 && chatStore.isStreaming" class="cursor">▋</span>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <textarea
          v-model="inputText"
          placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
          @keydown.enter.exact.prevent="handleSend"
          :disabled="chatStore.isStreaming"
          rows="3"
        ></textarea>
        <button @click="handleSend" :disabled="!inputText.trim() || chatStore.isStreaming" class="btn-send">
          {{ chatStore.isStreaming ? '发送中...' : '发送' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue';
import { useChatStore } from '../stores/chat';

const chatStore = useChatStore();
const inputText = ref('');
const messagesContainer = ref(null);

// 自动滚动到底部
watch(() => chatStore.messages.length, async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
});

async function handleSend() {
  if (!inputText.value.trim() || chatStore.isStreaming) return;

  const text = inputText.value.trim();
  inputText.value = '';

  await chatStore.sendMessage(text);
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

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
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
}

.btn-send:hover:not(:disabled) {
  transform: scale(1.05);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
