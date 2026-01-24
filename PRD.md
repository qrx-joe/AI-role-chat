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

## 3. 技术实现深度 (Technical Principles)

### 3.1 流式传输 (Streaming)
- **选型理由**：解释为何选择 **SSE (Server-Sent Events)** 相比 WebSocket 在单向输出场景下的优势（如协议轻量、自带重连）。
- **渲染原理**：前端如何处理 `ReadableStream`，如何将 `chunk` 实时拼接并触发响应式更新，实现顺滑的打字机效果。

### 3.2 数据持久化与表结构 (Database Schema)
设计需体现角色与对话的关联逻辑：
- **`roles` 表**：存储人设核心数据。
    - `id`, `name`, `personality`, `background`, `constraints`, `examples`, `created_at`
- **`conversations` 表**：管理对话会话。
    - `id`, `role_id`, `user_id`, `status` (active/archived), `updated_at`
- **`messages` 表**：存储对话详情。
    - `id`, `role_id`, `conv_id`, `content`, `type` (text/image), `role` (user/assistant), `created_at`

### 3.3 前端组件架构 (Frontend Architecture)
建议采用清晰的容器-组件模式进行拆分：
```text
ChatApp.vue (主容器)
├── RoleManager.vue (角色选择与 CRUD 管理)
└── ChatContainer.vue (对话主容器)
    ├── MessageBubble.vue (消息气泡：区分用户/AI，处理图文展示)
    └── InputArea.vue (输入区域控制)
        ├── TextInput.vue (文本输入与快捷键)
        └── ImageUploader.vue (图片选择、Canvas 压缩逻辑)
```

### 3.4 统一异常处理与规范 (Error Handling)
- **后端规范**：
    - 统一使用异常过滤器 (Exception Filter)，返回固定格式：`{ "code": 500, "message": "错误提示", "data": null }`。
    - 针对流式接口 (SSE)，需处理连接中断的异常情况。
- **前端规范**：
    - 利用 axios/fetch 拦截器全局处理 HTTP 错误码（401 未授权、429 频率限制、500 服务异常）。
    - 针对 UI 层，实现 Toast 或 Message 提示，确保用户在 API 报错时有明确反馈。

### 3.5 存储方案 (Storage Strategy)
- **本地存储 vs. 云存储**：
    - 开发阶段建议先存入后端 `public/uploads` 目录。
    - 答辩需准备：“若流量激增，如何迁移至阿里云 OSS/腾讯云 COS？”的回答思路。
- **图片预处理**：
    - 前端使用 `Uint8Array` 或 `Canvas` 将图片压至 1MB 以内，并转换为 Base64 或 Multipart 格式传输。

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
