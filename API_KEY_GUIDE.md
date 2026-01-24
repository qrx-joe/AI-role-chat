# 如何获取 DeepSeek API Key

## 方式一：使用 DeepSeek 官方 API（推荐）

1. 访问 DeepSeek 开放平台：https://platform.deepseek.com/
2. 注册/登录账号
3. 进入 API 管理页面
4. 创建新的 API Key
5. 复制 API Key（格式：`sk-xxxxxxxxxxxxx`）
6. 粘贴到 `backend/.env` 文件的 `DEEPSEEK_API_KEY=` 后面

## 方式二：使用其他兼容 API（测试用）

如果暂时没有 DeepSeek API，可以使用兼容 OpenAI 格式的其他 API：

### 使用 OpenAI API
```env
DEEPSEEK_API_KEY=sk-your-openai-key
DEEPSEEK_BASE_URL=https://api.openai.com
```
修改 `backend/src/chat/deepseek.service.ts` 第 38 行：
```typescript
model: 'gpt-3.5-turbo',  // 改为 OpenAI 模型
```

### 使用本地大模型（Ollama）
```env
DEEPSEEK_API_KEY=ollama
DEEPSEEK_BASE_URL=http://localhost:11434/v1
```
修改 `backend/src/chat/deepseek.service.ts` 第 38 行：
```typescript
model: 'llama2',  // 改为 Ollama 模型名称
```

## 方式三：跳过 AI 功能（仅测试界面）

如果只想测试界面和角色管理功能，可以：

1. 保持默认的 `DEEPSEEK_API_KEY=your_deepseek_api_key_here`
2. 运行 `start.bat`，按任意键继续
3. 前端可以正常使用角色创建、编辑、删除功能
4. 发送消息时会报错（因为没有真实 API）

## 配置示例

编辑 `backend/.env`：
```env
# 将下面的 sk-xxx 替换为你的真实 API Key
DEEPSEEK_API_KEY=sk-1234567890abcdefghijklmnopqrstuvwxyz
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

DATABASE_PATH=./database.sqlite
PORT=3000
```

## 验证配置

启动后端后，检查终端输出：
- ✅ 没有警告：API Key 配置成功
- ⚠️ 有警告：API Key 未配置或格式不正确

发送测试消息：
- ✅ AI 正常回复：配置正确
- ❌ 报错 "DeepSeek API 错误"：API Key 无效或余额不足
