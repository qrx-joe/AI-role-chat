```
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
```

## 🚀 项目概览

这是一个 AI 角色聊天全栈项目，包含前端 Vue3 应用和后端 NestJS 服务。项目支持创建个性化 AI 角色、多模态对话（文本+图片），并提供流式响应体验。

## 📁 项目结构

```
AI role chat/
├── backend/              # NestJS 后端服务
│   ├── src/
│   │   ├── chat/        # 聊天模块（DeepSeek API 集成、流式响应）
│   │   ├── roles/       # 角色管理模块（CRUD）
│   │   ├── conversations/  # 会话管理模块
│   │   ├── messages/    # 消息管理模块
│   │   ├── upload/      # 文件上传模块
│   │   └── common/      # 公共模块（异常过滤器等）
│   ├── package.json
│   └── .env             # 环境变量（DeepSeek API Key）
├── frontend/             # Vue3 前端应用
│   ├── src/
│   │   ├── api/         # API 接口定义
│   │   ├── components/  # Vue 组件
│   │   ├── stores/      # Pinia 状态管理
│   │   └── assets/      # 静态资源
│   └── package.json
├── start.bat/start.ps1  # 一键启动脚本
└── stop.bat             # 停止服务脚本
```

## 🛠️ 常用命令

### 后端开发

```bash
cd backend

# 安装依赖
npm install

# 开发模式启动（监听文件变化）
npm run start:dev

# 生产模式启动
npm run start:prod

# 构建
npm run build

# 格式化代码
npm run format

# Lint 检查
npm run lint

# 运行测试
npm run test              # 运行所有测试
npm run test:watch        # 监听模式运行测试
npm run test:cov          # 生成测试覆盖率报告
npm run test:debug        # 调试模式运行测试
npm run test:e2e          # 运行端到端测试

# 单文件测试
npx jest src/chat/chat.service.spec.ts --watch
```

### 前端开发

```bash
cd frontend

# 安装依赖
npm install

# 开发模式启动（Vite）
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 一键启动（推荐）

```bash
# Windows 批处理
start.bat

# PowerShell
.\start.ps1

# 停止所有服务
stop.bat
```

## 🔧 配置文件

### 后端环境变量

在 `backend/.env` 文件中配置：

```env
DEEPSEEK_API_KEY=sk-your-actual-key-here  # 必填：DeepSeek API 密钥
DATABASE_PATH=./database.sqlite           # 可选：SQLite 数据库路径
```

## 🏗️ 核心架构

### 后端架构（NestJS）

1. **模块结构**：
   - `ChatModule`：处理聊天请求，集成 DeepSeek API，支持流式响应（SSE）
   - `RolesModule`：角色 CRUD 操作
   - `ConversationsModule`：会话管理
   - `MessagesModule`：消息存储
   - `UploadModule`：文件上传处理

2. **数据库**：SQLite（开发环境），使用 TypeORM ORM
3. **数据流**：
   - 前端请求 → Controller → Service → DeepSeek API
   - 流式响应通过 SSE 实时返回前端

### 前端架构（Vue3）

1. **组件结构**：
   - `App.vue`：主应用容器
   - `RoleManager.vue`：角色选择与管理
   - `ChatContainer.vue`：对话主容器
   - `MessageBubble.vue`：消息气泡组件（支持图文混合）
   - `InputArea.vue`：输入区域（文本+图片上传）
   - `ImageUploader.vue`：图片上传与 Canvas 压缩

2. **状态管理**：Pinia
3. **HTTP 客户端**：Axios
4. **流式响应**：使用 ReadableStream 处理 SSE 数据

## 📡 API 接口

### 角色管理

- `GET /api/roles` - 获取角色列表
- `POST /api/roles` - 创建角色
- `GET /api/roles/:id` - 获取角色详情
- `PUT /api/roles/:id` - 更新角色
- `DELETE /api/roles/:id` - 删除角色
- `PATCH /api/roles/order` - 更新角色排序

### 对话接口

- `POST /api/chat/stream` - 发送消息（支持文本/图片），返回流式响应（SSE）

### 文件上传

- `POST /api/upload` - 上传图片，返回图片路径

### 会话管理

- `GET /api/conversations` - 获取会话列表
- `GET /api/conversations/:id/messages` - 获取会话消息
- `DELETE /api/conversations/:id` - 删除会话

## 🎯 核心功能

### 1. 角色设定

每个角色包含：
- 核心性格（Personality）
- 背景故事（Background）
- 语言禁忌（Constraints）
- 示例对话（Examples）

### 2. 多模态对话

- 文本消息
- 图片上传（Canvas 压缩）
- 图片语义理解（DeepSeek Vision）

### 3. 流式响应

- SSE（Server-Sent Events）实现
- 前端打字机效果渲染

### 4. 数据持久化

- SQLite 存储角色、会话、消息
- TypeORM 自动同步数据库

## 📚 关键文件

### 后端

- `backend/src/chat/chat.service.ts` - 聊天业务逻辑（核心编排层）
- `backend/src/chat/deepseek.service.ts` - DeepSeek API 集成（AI 接口层）
- `backend/src/roles/roles.service.ts` - 角色管理（CRUD 操作）
- `backend/src/app.module.ts` - 应用模块配置（根模块）

### 前端

- `frontend/src/stores/chat.js` - 聊天核心状态管理（Pinia Store）
- `frontend/src/api/index.js` - API 接口定义（统一请求拦截器）
- `frontend/src/components/` - Vue 组件（UI 渲染层）

## 🏛️ 架构亮点

### 后端设计模式

1. **分层架构**：Controller → Service → Repository
2. **两阶段图片处理**：视觉识别 → 角色化回复
3. **智能标题生成**：AI 自动生成对话主题
4. **流式响应优化**：SSE 实时推送 + 打字机效果

### 前端设计模式

1. **状态管理**：Pinia 单一 Store 管理所有状态
2. **组件通信**：Props/Events + Store 共享状态
3. **流式解析**：ReadableStream 逐块处理 SSE 数据
4. **图片压缩**：Canvas 前端压缩优化传输

## 🚀 开发工作流程

### 新增功能

1. 后端：创建/修改 Module → Service → Controller
2. 前端：创建/修改 Component → Store Action → API 调用
3. 数据库：更新 Entity → 重启服务自动同步
4. 测试：为新功能编写单元测试

### 调试技巧

1. 后端：使用 `npm run start:debug` 启动调试模式
2. 前端：使用浏览器 DevTools 的 Network 面板查看 SSE 数据流
3. 数据库：SQLite 数据库文件位于 `backend/database.sqlite`

### 常见问题

- **端口占用**：确保 3000（后端）和 5173（前端）端口未被占用
- **API Key 无效**：检查 `backend/.env` 文件中的 API Key 配置
- **数据库同步失败**：删除 `backend/database.sqlite` 后重启服务
