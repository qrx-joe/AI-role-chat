# AI 角色聊天全栈项目需求文档 (PRD) v2.0

## 1. 项目概况与考核重点 (Assessment Focus)
本项目不仅是功能实现，更是对 **“全栈开发思维”** 与 **“AI 协同能力”** 的深度考察。

> [!IMPORTANT]
> **考核核心**：本项目的重点是 **「理解」** 而非 「完成度」。
> - **30% 权重**：AI 工具的使用过程（Prompt 技巧、解决问题的思路）。
> - **40% 权重**：对技术链路的透彻理解（数据流转、实现原理）。
> - **30% 权重**：核心功能的演示与稳定性。

---

## 2. 核心功能及详细规范

### 2.1 角色设定 (Character Persona)
系统需支持高度个性化的 AI 角色。每个角色的存储应包含：
- **核心性格 (Core Personality)**：如“毒舌”、“温柔”、“严谨”等。
- **背景故事 (Background Story)**：赋予 AI 记忆和经历，影响其话术风格。
- **语言禁忌 (Constraints)**：明确 AI 绝对不能提及的话题或回复风格。
- **示例对话 (Few-shot Examples)**：提供 2-3 组对话范本，协助 AI 快速对齐人设。

### 2.2 提示词工程 (Prompt Engineering)
这是项目的灵魂，必须在代码中清晰体现以下逻辑：
- **System Prompt 组织**：如何动态组合角色性格、背景及当前对话上下文。
- **消息拼接逻辑**：
    ```text
    [System: 角色人设 + 当前日期 + 行为规范]
    [Context: 前 N 轮历史对话（防止 token 溢出处理）]
    [User: 用户输入 / 图片描述]
    ```
- **注入防御**：如何防止用户通过提示词引导 AI 跳出预设人设。

### 2.3 多模态 Vision 交互
- **前端处理**：
    - 图片需在上传前进行 **Canvas 压缩**（减小带宽消耗，加速 AI 响应）。
    - 实现 **预览组件**，支持删除重选。
- **后端识别**：
    - 需讲解图片如何从 Base64/Binary 转化为大模型可识别的格式。
    - 理解 Multimodal LLM 对图片的处理深度（OCR vs. 语义理解）。

---

## 3. 技术栈要求 (Technology Stack)

### 3.1 前端模块 (Frontend Requirements)
- **Vue3 组件化开发**：使用 Composition API 和组件化设计思想构建界面。
- **响应式状态管理**：使用 Pinia 或 Vue3 Reactive API 管理应用状态。
- **角色选择/创建界面**：实现角色列表展示、选择及创建功能。
- **对话界面与消息气泡**：区分用户/AI消息，支持文本和图片的混合展示。
- **流式文本渲染**：实现 AI 回复的逐字打字机效果。
- **图片上传与预览**：支持图片选择、预览、删除和重选。
- **对话历史列表展示**：展示历史对话记录，支持切换不同会话。

**前端组件架构建议**：
```text
ChatApp.vue (主容器)
├── RoleManager.vue (角色选择与 CRUD 管理)
└── ChatContainer.vue (对话主容器)
    ├── MessageBubble.vue (消息气泡：区分用户/AI，处理图文展示)
    └── InputArea.vue (输入区域控制)
        ├── TextInput.vue (文本输入与快捷键)
        └── ImageUploader.vue (图片选择、Canvas 压缩逻辑)
```

### 3.2 后端模块 (Backend Requirements)
- **Node.js + NestJS/Express**：使用主流 Node.js 框架搭建后端服务。
- **MySQL/MongoDB 数据库**：选择关系型或文档型数据库存储数据。
- **角色数据持久化存储**：实现角色信息的完整 CRUD 操作。
- **SSE/WebSocket 流式传输**：支持实时流式响应传输到前端。
- **文件上传服务**：实现图片文件的接收、验证和存储。
- **大模型 API 对接**：集成 OpenAI/Claude 等大模型 API。
- **统一异常处理机制**：使用异常过滤器统一处理错误，返回标准格式 `{ "code": 500, "message": "错误提示", "data": null }`。

**数据库表结构设计**：
- **`roles` 表**：存储人设核心数据
    - `id`, `name`, `personality`, `background`, `constraints`, `examples`, `created_at`
- **`conversations` 表**：管理对话会话
    - `id`, `role_id`, `user_id`, `status` (active/archived), `updated_at`
- **`messages` 表**：存储对话详情
    - `id`, `role_id`, `conv_id`, `content`, `type` (text/image), `role` (user/assistant), `created_at`

### 3.3 数据与接口 (API & Data Flow)
- **RESTful API 规范设计**：遵循 REST 标准，使用合理的 HTTP 方法和状态码。
- **角色管理接口 (CRUD)**：
    - `POST /api/roles` - 创建角色
    - `GET /api/roles` - 获取角色列表
    - `GET /api/roles/:id` - 获取角色详情
    - `PUT /api/roles/:id` - 更新角色
    - `DELETE /api/roles/:id` - 删除角色
- **对话接口 (支持流式)**：
    - `POST /api/chat/stream` - 发送消息并接收流式响应 (SSE)
    - 需支持文本和图片的混合输入
- **文件上传接口**：
    - `POST /api/upload` - 上传图片文件
    - 返回图片的存储路径或 URL
- **历史记录接口**：
    - `GET /api/conversations` - 获取会话列表
    - `GET /api/conversations/:id/messages` - 获取指定会话的消息记录
- **前后端数据流转清晰**：能够清晰描述从用户操作到数据库存储，再到 AI 响应的完整链路。
- **接口错误码规范**：定义统一的错误码体系，如：
    - `200` - 成功
    - `400` - 请求参数错误
    - `401` - 未授权
    - `404` - 资源不存在
    - `429` - 请求频率限制
    - `500` - 服务器内部错误

### 3.4 核心技术深度解析

#### 流式传输实现原理
- **SSE vs. WebSocket**：解释 SSE 在单向输出场景下的优势（协议轻量、自带重连、基于 HTTP）。
- **前端流式处理**：如何处理 `ReadableStream`，实时拼接 `chunk` 并触发响应式更新，实现打字机效果。
- **连接管理**：处理流式连接中断、超时等异常情况。

#### 图片处理与存储
- **前端预处理**：使用 Canvas API 进行图片压缩（目标 1MB 以内），减小带宽消耗。
- **存储策略**：
    - 开发阶段：存储至 `public/uploads` 目录
    - 生产环境：考虑迁移至阿里云 OSS/腾讯云 COS
- **格式转换**：从 Base64/Binary 转为大模型可识别的格式。

---

## 4. AI 辅助开发记录 (AI-Driven Implementation)
本项目强制要求记录 AI 工具（如 AI 助教、Cursor、Copilot 等）的深度配合过程：
- **Prompt 案例库**：记录你向 AI 提问的最佳实践。例如：“如何通过 AI 解释复杂的流式数据合并 Bug？”
- **复盘与搜索**：当 AI 给出的方案报错时，你的思考过程和二次调整 Prompt 的技巧。
- **效率提升证明**：量化 AI 在写 Boilerplate 代码、生成 Mock 数据和辅助算法逻辑上的具体价值。

---

## 5. 答辩与评分细则 (Defense Criteria)

### 5.1 现场答辩流程
1. **功能演示 (3-4min)**：展示人设复原度、图片理解能力、流式稳定性。
2. **代码挖掘 (4-5min)**：随机抽取组件或接口，要求解释其在数据流中的位置。
3. **AI 分享 (2-3min)**：**核心展示环节**，展示对话历史，证明 AI 是你的“外脑”而非简单的代写。

### 5.2 避坑指南
- **不要只贴代码**：说出你的思考过程。
- **提前测飞书共享**：确保代码在屏幕共享时清晰可见。
- **接口错误码规范**：展示对工程化细节的把控。

---

## 6. 关键时间节点
- **截止时间**：2026年1月29日晚
- **答辩确认**：请主动联系总策划 **何奕** 安排答辩序列。
