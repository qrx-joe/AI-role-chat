# DeepSeek API 400 错误排查指南

## 错误原因分析

**错误代码 400**：Bad Request（请求格式错误）

可能的原因：
1. ❌ model 名称不对
2. ❌ API 端点路径错误
3. ❌ 图片 Base64 格式不符合要求
4. ❌ 请求体缺少必需参数

## 快速修复方案

### 方案一：确认 Model 名称

编辑 `backend/src/chat/deepseek.service.ts` 第 38 行：

**当前**：
```typescript
model: 'deepseek-chat',
```

**尝试改为**：
```typescript
model: 'deepseek-v3',  // 或 'deepseek-coder'
```

### 方案二：检查 API Key 权限

你的 API Key 可能没有权限访问某些功能（如 Vision）。

**验证方法**：
1. 不上传图片，只发送纯文本消息
2. 如果纯文本成功，说明 API Key 不支持 Vision
3. 解决：在 DeepSeek 平台升级权限或使用不同的 API Key

### 方案三：查看详细错误信息

修改 `backend/src/chat/deepseek.service.ts` 第 87-92 行，打印完整错误：

```typescript
if (axios.isAxiosError(error)) {
    console.error('DeepSeek API 完整错误:', error.response?.data);  // 添加这行
    const message = error.response?.data?.error?.message || error.message;
    throw new HttpException(
        `DeepSeek API 错误: ${message}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
    );
}
```

重启后端，再次发送消息，查看终端输出的完整错误信息。

### 方案四：分步测试

**测试 1：纯文本对话**
- 不上传图片
- 只发送文字消息
- 如果成功 → 问题在图片功能
- 如果失败 → 问题在基础配置

**测试 2：检查 API Key**
访问 DeepSeek 官方文档或控制台：
- 确认 API Key 状态（是否有效、是否过期）
- 确认 API 调用次数限制
- 确认模型权限

## 常见错误代码对照

| 错误码 | 含义 | 解决方法 |
|-------|------|---------|
| 400 | 请求格式错误 | 检查 model 名称、参数格式 |
| 401 | 未授权 | 检查 API Key 是否正确 |
| 403 | 禁止访问 | API Key 无权访问此功能 |
| 404 | 路径不存在 | 检查 API 端点 URL |
| 429 | 请求过多 | 触发速率限制，等待后重试 |
| 500 | 服务器错误 | DeepSeek 服务器问题，稍后重试 |

## 推荐操作步骤

1. **立即测试**：先不上传图片，只发送纯文本
2. **查看日志**：添加 console.log 查看完整错误
3. **确认 Model**：联系 DeepSeek 确认正确的 model 名称
4. **降级方案**：如果 Vision 不可用，先关闭图片功能

## DeepSeek V3 API 参考

根据 DeepSeek 官方文档（2025年最新），正确的配置可能是：

```typescript
// 普通对话
model: 'deepseek-chat'

// 代码生成
model: 'deepseek-coder'

// Vision 功能（如果支持）
model: 'deepseek-vision' // 或 'deepseek-chat-vision'
```

**注意**：DeepSeek V3 可能不支持 Vision，建议先用纯文本测试。

## 快速验证

在浏览器控制台（F12）执行：

```javascript
fetch('https://api.deepseek.com/v1/models', {
  headers: {
    'Authorization': 'Bearer sk-你的Key'
  }
}).then(r => r.json()).then(console.log)
```

这会列出你的 API Key 支持的所有模型。
