<template>
  <div class="debug-panel">
    <div class="debug-header">
      <h3>🛠 调试面板</h3>
      <button class="btn-close" @click="$emit('close')">✕</button>
    </div>
    
    <div class="debug-content">
      <div class="debug-section">
        <h4 @click="showRequest = !showRequest">
          📡 最近请求数据 (JSON)
          <span>{{ showRequest ? '▼' : '▶' }}</span>
        </h4>
        <pre v-if="showRequest" class="json-block">{{ chatStore.lastRequestData }}</pre>
      </div>

      <div class="debug-section">
        <h4 @click="showResponse = !showResponse">
          📥 最近响应 Chunks (SSE)
          <span>{{ showResponse ? '▼' : '▶' }}</span>
        </h4>
        <div v-if="showResponse" class="chunks-list">
          <pre v-for="(chunk, i) in chatStore.lastResponseChunks" :key="i" class="json-block mini">
            {{ chunk }}
          </pre>
        </div>
      </div>

      <div class="debug-section">
        <h4 @click="showState = !showState">
          ⚙️ 当前状态 (Store)
          <span>{{ showState ? '▼' : '▶' }}</span>
        </h4>
        <pre v-if="showState" class="json-block">
{
  "isStreaming": {{ chatStore.isStreaming }},
  "currentConversationId": "{{ chatStore.currentConversationId }}",
  "messageCount": {{ chatStore.messages.length }}
}
        </pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useChatStore } from '../stores/chat';

defineEmits(['close']);
const chatStore = useChatStore();

const showRequest = ref(true);
const showResponse = ref(false);
const showState = ref(false);
</script>

<style scoped>
.debug-panel {
  position: absolute;
  top: 80px;
  right: 24px;
  width: 380px;
  background: hsla(220, 40%, 10%, 0.75);
  backdrop-filter: blur(24px);
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 50px rgba(0,0,0,0.2);
  border: 1px solid hsla(0, 0%, 100%, 0.15);
  z-index: 100;
  display: flex;
  flex-direction: column;
  max-height: calc(100% - 120px);
  animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  color: white;
}

.debug-header {
  padding: 16px 20px;
  border-bottom: 1px solid hsla(0, 0%, 100%, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.debug-header h3 {
  font-size: 0.9rem;
  letter-spacing: 0.05em;
}

.debug-content {
  padding: 16px;
  overflow-y: auto;
}

.debug-section {
  margin-bottom: 20px;
}

.debug-section h4 {
  font-size: 0.75rem;
  color: hsla(0, 0%, 100%, 0.5);
  margin-bottom: 10px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: color 0.2s;
}

.debug-section h4:hover {
  color: var(--primary);
}

.json-block {
  background: hsla(0, 0%, 0%, 0.3);
  color: #a5d6ff;
  padding: 12px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  overflow-x: auto;
  font-family: 'Fira Code', monospace;
  border: 1px solid hsla(0, 0%, 100%, 0.05);
  line-height: 1.5;
}

.json-block.mini {
  margin-bottom: 6px;
  padding: 8px;
  color: #7ee787;
}

.btn-close {
  background: hsla(0, 0%, 100%, 0.1);
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #ef4444;
}
</style>
