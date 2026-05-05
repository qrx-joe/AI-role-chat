# API 错误排查指南

## 错误概览

| 错误码 | 含义 | 常见原因 |
|-------|------|---------|
| 400 | 请求格式错误 | Model 名称、参数格式、图片编码 |
| 401 | 未授权 | API Key 无效或过期 |
| 403 | 禁止访问 | API Key 无权访问此功能 |
| 404 | 路径不存在 | API 端点 URL 错误 |
| 429 | 请求过多 | 触发速率限制 |
| 500 | 服务器错误 | AI 服务商问题或后端异常 |

---

## 快速诊断流程

```
发送消息失败
    ↓
查看后端终端日志（红色错误信息）
    ↓
判断错误来源：
    ├── DeepSeek API 错误 → 检查 API Key / Model / 网络
    ├── Zhipu API 错误  → 检查 ZHIPU_API_KEY / 图片格式
    └── 本地服务错误    → 检查数据库 / 代码异常
```

---

## 场景一：DeepSeek API 400 错误

### 检查 Model 名称

当前配置：`backend/src/chat/deepseek.service.ts`

```typescript
model: 'deepseek-chat',  // DeepSeek V3 标准模型
```

如遇到 400 错误，尝试替换为：
- `'deepseek-chat'` — 通用对话（默认）
- `'deepseek-coder'` — 代码生成

### 检查 API Key

```bash
# 验证 .env 配置
cat backend/.env | grep DEEPSEEK

# 正确格式
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

### 查看完整错误日志

后端已内置详细错误捕获：

```typescript
if (axios.isAxiosError(error)) {
    console.error('DeepSeek API 完整错误:', error.response?.data);
    const message = error.response?.data?.error?.message || error.message;
    throw new HttpException(
        `DeepSeek API 错误: ${message}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
    );
}
```

重启后端，再次发送消息，查看终端输出的完整错误信息。

---

## 场景二：图片上传 400 错误

### 两阶段图片处理架构

本项目采用 **Zhipu GLM-4V** 处理图片识别：

```env
# backend/.env
ZHIPU_API_KEY=your_zhipu_key
ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4/
ZHIPU_MODEL=glm-4v-flash
```

**流程**：
1. 用户上传图片 → 前端 Canvas 压缩为 Base64
2. 后端调用 Zhipu Vision API 识别图片内容
3. 将图片描述注入角色 Prompt
4. 调用 DeepSeek 生成角色化回复

### 图片格式要求

- **格式**：JPEG / PNG
- **大小**：Canvas 压缩后建议 ≤ 1MB
- **编码**：`data:image/jpeg;base64,...` 格式

### 排查步骤

1. **纯文本是否正常？**
   - 正常 → 问题在图片处理链路（检查 ZHIPU_API_KEY）
   - 异常 → 问题在基础配置（检查 DEEPSEEK_API_KEY）

2. **检查 Zhipu API Key**
   ```bash
   curl -s https://open.bigmodel.cn/api/paas/v4/models \
     -H "Authorization: Bearer $ZHIPU_API_KEY"
   ```

3. **查看后端日志**
   - 搜索 `[阶段1]` 或 `[阶段2]` 日志
   - 检查图片 Base64 是否正确传输

---

## 场景三：MOCK_MODE 保命方案

如果 API 暂时不可用，开启模拟模式：

```env
# backend/.env
MOCK_MODE=true
```

效果：
- 不调用真实 AI API
- 返回预设模拟文本
- 前端流式效果正常展示
- **适用于：无网络环境演示、API 额度耗尽**

---

## 验证工具

### 1. 测试纯文本对话

不上传图片，只发送文字消息。

### 2. 测试后端健康状态

```bash
curl http://localhost:3000/api/roles
# 预期返回：{"code":200,"message":"...","data":[...]}
```

### 3. 浏览器控制台快速验证

```javascript
// 测试 DeepSeek API Key
fetch('https://api.deepseek.com/v1/models', {
  headers: { 'Authorization': 'Bearer sk-你的Key' }
}).then(r => r.json()).then(console.log)

// 测试 Zhipu API Key
fetch('https://open.bigmodel.cn/api/paas/v4/models', {
  headers: { 'Authorization': 'Bearer 你的ZhipuKey' }
}).then(r => r.json()).then(console.log)
```

---

## 常见错误速查

| 现象 | 原因 | 解决 |
|------|------|------|
| 发送消息后一直转圈 | API Key 未配置或无效 | 检查 `.env` 中的 Key |
| 纯文本正常，图片报错 | ZHIPU_API_KEY 无效 | 检查智谱 AI Key |
| 提示 "模型不存在" | Model 名称错误 | 改为 `deepseek-chat` |
| 429 Too Many Requests | 触发速率限制 | 等待 60 秒后重试 |
| 500 服务器内部错误 | 后端代码异常 | 查看终端堆栈跟踪 |

