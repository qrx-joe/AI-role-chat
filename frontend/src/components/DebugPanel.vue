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
  top: 70px;
  right: 20px;
  width: 350px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  border: 1px solid #eee;
  z-index: 100;
  display: flex;
  flex-direction: column;
  max-height: calc(100% - 90px);
}

.debug-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fcfcfc;
  border-radius: 16px 16px 0 0;
}

.debug-content {
  padding: 15px;
  overflow-y: auto;
}

.debug-section {
  margin-bottom: 15px;
}

.debug-section h4 {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
}

.json-block {
  background: #2d3436;
  color: #fab1a0;
  padding: 10px;
  border-radius: 8px;
  font-size: 11px;
  overflow-x: auto;
  font-family: monospace;
}

.json-block.mini {
  margin-bottom: 5px;
  padding: 6px;
  color: #55efc4;
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
}
</style>
