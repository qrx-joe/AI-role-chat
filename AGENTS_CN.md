# AI 角色对话 - 代理指南

> 本仓库中 AI 编码代理的工作指南。

## 项目结构

```
AI role chat/
├── backend/              # NestJS + TypeORM + SQLite
│   ├── src/
│   │   ├── chat/         # DeepSeek API 集成，SSE 流式传输
│   │   ├── roles/        # 角色增删改查操作
│   │   ├── conversations/# 会话管理
│   │   ├── messages/     # 消息存储
│   │   ├── upload/       # 文件上传处理
│   │   └── common/       # 异常过滤器、工具类
│   └── test/             # 端到端测试
├── frontend/             # Vue3 + Pinia + Vite
│   ├── src/
│   │   ├── components/   # Vue SFC 组件
│   │   ├── stores/       # Pinia 状态管理
│   │   ├── api/          # API 客户端函数
│   │   └── assets/       # 静态资源
│   └── index.html
└── start.bat / start.ps1 # 一键启动脚本
```

## 构建与开发命令

### 后端 (NestJS)

```bash
cd backend

# 开发
npm run start:dev          # 监听模式，热重载

# 构建
npm run build              # 生产构建到 dist/
npm run start:prod         # 运行生产构建

# 代码质量
npm run lint               # ESLint 自动修复
npm run format             # Prettier 格式化所有文件

# 测试
npm run test               # 运行所有单元测试
npm run test:watch         # 监听模式
npm run test:cov           # 带覆盖率报告
npm run test:debug         # Node 调试器
npm run test:e2e           # 端到端测试

# 单个测试文件
npx jest src/chat/chat.service.spec.ts
npx jest --testNamePattern="should stream chat"
```

### 前端 (Vue3)

```bash
cd frontend

# 开发
npm run dev                # Vite 开发服务器 (端口 5173)

# 构建
npm run build              # 生产构建
npm run preview            # 预览生产构建
```

### 全栈

```bash
# Windows
start.bat                  # 同时启动前后端
stop.bat                   # 停止所有服务
```

## 代码风格指南

### TypeScript (后端)

- **装饰器**: 使用 NestJS 标准装饰器 (`@Controller`, `@Injectable`, `@Entity`)
- **导入**: 按外部 → 内部 → 相对分组；每组内按字母顺序排列
- **类型**: 公共方法使用显式返回类型；启用严格空检查
- **命名**: 类/接口使用 PascalCase，变量/函数使用 camelCase，常量使用 UPPER_SNAKE
- **DTO**: 使用 `class-validator` 装饰器进行验证 (`@IsNotEmpty`, `@IsUUID`)
- **注释**: 公共 API 使用 JSDoc，业务逻辑使用中文注释
- **错误处理**: 使用内置 NestJS 异常 (`BadRequestException`, `NotFoundException`)

### Vue/JS (前端)

- **脚本设置**: 独占使用 `<script setup>` Composition API
- **导入**: 分组为 Vue → Pinia → 组件 → API → 工具类
- **命名**: 组件使用 PascalCase，组合式函数/存储使用 camelCase，常量使用 UPPER_SNAKE
- **响应式**: 原始值使用 `ref()`，派生状态使用 `computed()`
- **存储模式**: 使用 Composition API 风格的 Pinia (`defineStore('name', () => {...})`)
- **API 调用**: 集中在 `src/api/` 目录，返回 Promise
- **注释**: 业务逻辑使用中文注释，自解释代码尽量少注释

### Prettier 配置 (强制执行)

```json
{
  "singleQuote": true,
  "trailingComma": "all"
}
```

### 文件组织

- **后端**: 每个文件一个类，文件名匹配导出的类名
- **前端**: 组件放在 `components/`，存储放在 `stores/`，API 放在 `api/`
- **最大大小**: 偏好文件少于 250 行；增长时按关注点拆分

## 测试模式

```typescript
// NestJS 服务测试示例
describe('ChatService', () => {
  let service: ChatService;
  let repository: MockType<Repository<Role>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getRepositoryToken(Role), useFactory: repositoryMockFactory },
      ],
    }).compile();
    
    service = module.get(ChatService);
    repository = module.get(getRepositoryToken(Role));
  });

  it('应该验证角色是否存在', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.streamChat('invalid', ...)).rejects.toThrow('角色不存在');
  });
});
```

## 数据库与 API

- **ORM**: TypeORM 配合 SQLite (开发) / PostgreSQL (生产就绪)
- **迁移**: 仅在开发中启用自动同步 (`synchronize: true`)
- **流式**: 实时聊天使用 SSE 协议 (`text/event-stream`)
- **DTO 验证**: 全局启用 `ValidationPipe`，启用白名单

## 环境设置

创建 `backend/.env`:

```env
DEEPSEEK_API_KEY=sk-your-key-here
DATABASE_PATH=./database.sqlite
```

## 重要提醒

1. 提交后端更改前始终运行 `npm run lint`
2. 后端使用 ES2023 目标和 NodeNext 模块解析
3. 前端流式传输使用原生 `fetch()` + `ReadableStream`，不使用 Axios
4. 图片上传通过两阶段处理：视觉识别 → 角色响应
5. 切勿提交 `.env` 文件或 SQLite 数据库到 git
