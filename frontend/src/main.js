import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './style.css';
import App from './App.vue';

/**
 * 前端应用入口
 * 
 * 1. 初始化 Vue 实例。
 * 2. 挂载 Pinia 状态管理库。
 * 3. 导入全局样式表。
 */
const app = createApp(App);

// 使用 Pinia 处理角色列表和聊天消息的全局状态
app.use(createPinia());

app.mount('#app');
