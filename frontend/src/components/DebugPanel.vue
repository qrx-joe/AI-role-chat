<template>
  <div class="debug-panel">
    <div class="debug-header">
      <h3>🛠 调试面板</h3>
      <button class="btn-close" @click="$emit('close')">✕</button>
    </div>
    
    <div class="debug-content">
      <!-- 区域 A：请求原始载荷 -->
      <div class="debug-section">
        <h4 @click="showRequest = !showRequest">
          📡 最近请求数据 (JSON)
          <span>{{ showRequest ? '▼' : '▶' }}</span>
        </h4>
        <pre v-if="showRequest" class="json-block">{{ chatStore.lastRequestData }}</pre>
      </div>

      <!-- 区域 B：SSE 流式原始分片 -->
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

      <!-- 区域 C：Pinia 内部状态 -->
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

/**
 * 后台调试面板组件
 * 
 * 作用：
 * 实时监控前端与后端 API 的通讯细节。
 * 能够看到每次发送的 DTO 载荷、流式返回的每一个 Chunk，以及 Store 的关键状态。
 */
defineEmits(['close']);
const chatStore = useChatStore();

// 折叠状态控制
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
  background: hsla(240, 20%, 10%, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  border: 1px solid hsla(0, 0%, 100%, 0.1);
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
  background: linear-gradient(to right, hsla(270, 95%, 65%, 0.1), transparent);
}

.debug-header h3 {
  font-family: var(--font-heading);
  font-size: 0.95rem;
  letter-spacing: 0.05em;
  font-weight: 700;
}

.debug-content {
  padding: 16px;
  overflow-y: auto;
}

.debug-section {
  margin-bottom: 24px;
}

.debug-section h4 {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: hsla(0, 0%, 100%, 0.6);
  margin-bottom: 12px;
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
  background: #0d1117; /* GitHub Dark 代码背景 */
  color: #c9d1d9;
  padding: 14px;
  border-radius: var(--radius-md);
  font-size: 11px;
  overflow-x: auto;
  font-family: 'Space Grotesk', 'Fira Code', monospace;
  border: 1px solid hsla(0, 0%, 100%, 0.1);
  line-height: 1.6;
  box-shadow: inset 0 2px 8px rgba(0,0,0,0.4);
}

.json-block.mini {
  margin-bottom: 8px;
  padding: 10px;
  color: #7ee787; /* 成功绿 */
  border-left: 2px solid #7ee787;
}

.btn-close {
  background: rgba(255,255,255,0.1);
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
  transform: rotate(90deg);
}
</style>
