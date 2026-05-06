# Vivid AI - 沉浸式 AI 角色聊天应用

> 一个支持自定义 AI 人设、多模态图文对话、流式实时响应的全栈聊天应用。用户可创建具有独特性格、背景故事和行为约束的 AI 角色，体验身临其境的沉浸式对话。

---

## 项目背景

### 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Vue | 3.5.24 |
| 状态管理 | Pinia | 3.0.4 |
| 构建工具 | Vite | 7.2.4 |
| 后端框架 | NestJS | 11.0.1 |
| ORM | TypeORM | 0.3.28 |
| 数据库 | SQLite3 | 5.1.7 |
| 开发语言 | TypeScript | 5.7.3 |
| AI 文本对话 | DeepSeek V3 | deepseek-chat |
| AI 视觉识别 | 智谱 GLM-4V | glm-4v-flash |
| HTTP 客户端 | Axios | 1.13.2 |
| 运行环境 | Node.js | >= 20.0.0 |

**质量保障与工程化**：Jest 30.0.0（单元测试 + 覆盖率）、ESLint 9.18.0 + typescript-eslint 8.20.0（代码规范）、Prettier 3.4.2（代码格式化）、@nestjs/testing 11.0.1（模块级集成测试）、Supertest 7.0.0（HTTP 端点测试）

### 技术亮点

1. **两阶段图片处理架构，解决多模态场景下的角色一致性丢失问题**
   - 阶段 1：GLM-4V 纯视觉识别，剥离角色干扰，获取客观图片描述
   - 阶段 2：DeepSeek 基于完整 System Prompt 生成角色化回复
   - 相比单一模型端到端处理，避免了"AI 看到图片后忘记自己是猫娘"的人设稀释问题

2. **SSE 流式响应 + ReadableStream 逐块解析，实现真正的逐字打字机效果**
   - 前端通过 `response.body.getReader()` 实时消费流数据，首字到达即渲染
   - 对比"先拉取完整响应再模拟打字"的方案，显著降低用户感知的等待延迟

3. **AI 智能生成对话标题，替代简单文本截取**
   - 首条消息触发 DeepSeek 生成 10 字以内语义概括，信息密度高于机械截取
   - 完整降级策略：AI 超时或失败时自动回退到文本截取，保证可用性

4. **前端 Canvas 图片压缩 + Base64→Blob→FormData 全链路优化**
   - 上传前压缩至 1MB 以内，显著降低带宽消耗和多模态 API 调用成本

5. **全链路限流防护与访问控制**
   - 后端 `RateLimitMiddleware` 全局接口限流，防止演示环境被爬虫刷爆（`d7d09a5e`）
   - 前端访问密码层，双层防护确保公开演示的安全性

6. **一键启动脚本与后端就绪检测，消除并行启动的竞态问题**
   - `start.ps1` 轮询后端健康接口，确认就绪后再启动前端 DevServer
   - 解决 NestJS 启动慢于 Vite 导致的首次 API 请求 502 失败（`6272abed`）

7. **Vercel + Render 双平台部署适配**
   - 前端 Vercel（CDN 加速）+ 后端 Render（Node 服务），通过 Vercel Rewrite 代理 API
   - 配置 CORS 白名单、Node 引擎约束、数据库路径适配，解决跨平台环境差异（`60813cd5`）

### 项目演示

- **本地开发**：`http://localhost:5173`

### 截图预览

| 角色面板 | 多模态对话 | 流式响应 |
|---------|-----------|---------|
| ![角色面板](docs/screenshots/role-panel.png) | ![多模态对话](docs/screenshots/chat-multimodal.png) | ![流式响应](docs/screenshots/streaming.png) |

> 截图由 `scripts/screenshot.js` 自动生成。

---

## 快速启动

### 环境要求
- Node.js >= 20
- npm >= 9

### 1. 配置 API Key

编辑 `backend/.env`：
```env
DEEPSEEK_API_KEY=sk-your-actual-key-here
```

### 2. 一键启动（Windows）

```bash
# 批处理
start.bat

# PowerShell
.\start.ps1
```

### 3. 手动启动

```bash
# 后端
cd backend && npm install && npm run start:dev
# → http://localhost:3000

# 前端（新开终端）
cd frontend && npm install && npm run dev
# → http://localhost:5173
```

---

## 项目结构

```
AI role chat/
├── backend/                 # NestJS 后端
│   ├── src/
│   │   ├── chat/           # 聊天模块（流式 SSE + 两阶段图片处理）
│   │   ├── roles/          # 角色管理（CRUD）
│   │   ├── conversations/  # 会话管理
│   │   ├── messages/       # 消息持久化
│   │   └── upload/         # 图片上传处理
│   └── .env                # API Key 配置
├── frontend/                # Vue3 前端
│   ├── src/
│   │   ├── components/     # Vue 组件
│   │   ├── stores/         # Pinia 状态管理
│   │   └── api/            # API 接口封装
│   └── package.json
├── docs/
│   └── screenshots/        # 功能截图
├── scripts/
│   └── screenshot.js       # 自动化截图脚本
└── start.bat / start.ps1   # 一键启动脚本
```

---

## 技术沉淀与决策回顾

1. **面对"AI 处理图片后角色性格被稀释"的问题，选择了两阶段模型分离架构，而非单一模型端到端处理**
   - 原因：视觉理解和角色扮演对 System Prompt 的敏感度不同，混合在一起会导致角色约束被视觉任务的客观性描述冲淡
   - 对应代码：`chat.service.ts:296-310` 两阶段编排逻辑

2. **SSE 流式响应的实现与优化**
   - AI 输出为单向服务端→客户端推送，SSE 基于 HTTP、自带重连机制，无需额外协议握手
   - 前端通过 `response.body.getReader()` 逐块解析 SSE 数据流，实现真正的逐字打字机效果
   - 对比"先拉取完整响应再模拟打字"的方案，首字到达即渲染，显著降低用户感知的等待延迟
   - 对应代码：`deepseek.service.ts:176-265` SSE 流解析实现

3. **AI 智能生成对话标题，配合完整降级策略保证可用性**
   - 首条消息触发 DeepSeek 生成 10 字以内语义概括，信息密度高于机械截取
   - 10 秒超时保护 + AI 失败时自动回退到文本截取，避免标题生成阻塞主流程
   - 支持多模态场景：图片对话也能生成"动物识别"等语义标题
   - 对应代码：`deepseek.service.ts:410-494` 标题生成与降级逻辑

4. **面对跨平台部署的环境差异，在 Render/Vercel 双平台部署中配置了环境适配层**
   - 原因：本地开发使用相对路径 `./database.sqlite`，Render 平台需要适配其持久化磁盘路径，Vercel 前端需要 Rewrite 规则代理到 Render 后端
   - 对应 commit：`60813cd5` CORS、Node 引擎、数据库路径配置

5. **面对前端并行启动时的请求失败，添加了后端就绪检测机制**
   - 原因：`start.ps1` 同时启动前后端，前端 Vite DevServer 启动速度快于 NestJS，导致首次 API 请求 502
   - 对应 commit：`6272abed` 优化启动脚本添加后端就绪检测

6. **面对演示环境的滥用风险，添加了限流和访问密码两层防护**
   - 原因：公开演示地址面临爬虫和恶意刷接口的风险，需要在网关层做全局限流，在 UI 层做访问控制
   - 对应 commit：`d7d09a5e` 添加后端限流和前端访问密码

---

## 相关文档

- [使用指南](USAGE.md) - 功能演示与问题排查
- [优化记录](OPTIMIZATION.md) - 性能与体验优化历程
- [故障排查](TROUBLESHOOTING.md) - 前端常见问题解决方案
- [API 错误排查](DEBUG_400_ERROR.md) - DeepSeek / Zhipu API 400/500 错误诊断
