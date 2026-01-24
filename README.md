# AI 角色聊天项目 - 快速启动指南

## 🚀 一键启动（推荐）

**方式一：批处理脚本**（已修复乱码问题）
```bash
start.bat
```

**方式二：PowerShell 脚本**（右键"使用 PowerShell 运行"）
```powershell
.\start.ps1
```

**停止所有服务**
```bash
stop.bat
```

---

## 🔧 手动启动

### 1. 配置 DeepSeek API Key

编辑 `backend/.env` 文件，填入你的 API Key：

```env
DEEPSEEK_API_KEY=sk-your-actual-key-here
```

### 2. 启动后端

```bash
cd backend
npm install
npm run start:dev
```

✅ 后端运行在：http://localhost:3000

### 3. 启动前端

```bash
cd frontend
npm install  
npm run dev
```

✅ 前端运行在：http://localhost:5173

---

## 📚 文档导航

- **使用指南**：[USAGE.md](USAGE.md) - 功能演示、问题排查、答辩建议
- **技术文档**：[walkthrough.md](file:///C:/Users/14536/.gemini/antigravity/brain/8df913a7-3b88-4b5b-b0bc-d07b5195c56d/walkthrough.md) - 完整的技术实现和架构说明
- **开发计划**：[implementation_plan.md](file:///C:/Users/14536/.gemini/antigravity/brain/8df913a7-3b88-4b5b-b0bc-d07b5195c56d/implementation_plan.md) - 详细的实施方案

---

## 4. 使用流程

1. **创建角色**：点击左侧 "+ 创建角色"
2. **选择角色**：点击角色卡片
3. **开始对话**：输入消息，观察流式响应

## 详细文档

查看完整项目总结：[walkthrough.md](file:///C:/Users/14536/.gemini/antigravity/brain/8df913a7-3b88-4b5b-b0bc-d07b5195c56d/walkthrough.md)
