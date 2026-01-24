# 前端问题排查指南

## 问题：页面显示空白

### 快速检查清单

1. **检查浏览器控制台**（F12）
   - 红色错误？记录错误信息
   - 网络请求失败？检查后端是否运行

2. **检查前端是否成功启动**
   ```bash
   # 查看终端输出，应该显示：
   VITE v7.x ready in xxx ms
   ➜ Local: http://localhost:5173/
   ```

3. **检查后端是否运行**
   - 访问：http://localhost:3000/api/roles
   - 应该返回 JSON 数据（空数组或角色列表）

### 常见问题修复

#### 1. 编译错误导致空白

**症状**：终端显示红色错误，Vite 编译失败

**解决**：
```bash
# 停止前端（Ctrl+C），重新启动
cd frontend
npm run dev
```

#### 2. 端口冲突

**症状**：终端提示端口已被占用

**解决**：
- Vite 会自动使用下一个端口（5174, 5175...）
- 查看终端实际运行的端口号
- 或手动停止占用进程：`netstat -ano | findstr :5173`

#### 3. 模块导入错误

**症状**：浏览器控制台显示 "Failed to resolve module"

**解决**：
```bash
cd frontend
rm -rf node_modules
npm install
npm run dev
```

#### 4. CORS 跨域问题

**症状**：浏览器控制台显示 "CORS policy blocked"

**解决**：确认后端已启用 CORS（`main.ts` 中有 `app.enableCors()`）

### 重启前端服务

如果修改了代码但未生效：

```bash
# 方法一：完全重启
cd frontend
# Ctrl+C 停止服务
npm run dev

# 方法二：清理缓存重启
cd frontend
rm -rf dist .vite
npm run dev
```

### 验证步骤

1. ✅ 后端运行：http://localhost:3000/api/roles 返回 JSON
2. ✅ 前端运行：终端显示 "VITE ready"
3. ✅ 页面加载：http://localhost:5173/ 显示界面
4. ✅ 无报错：浏览器控制台无红色错误

### 如果仍然空白

打开浏览器开发者工具（F12），提供以下信息：

1. **Console 标签**：复制所有红色错误
2. **Network 标签**：查看是否有失败的请求（红色）
3. **Sources 标签**：检查 `src/` 文件是否加载

---

## 当前已修复的问题

- ✅ `chat.js` 第 82 行：`headers: headers:` 语法错误
- ✅ `chat.js` 缩进混乱问题

## 下一步

刷新浏览器页面：http://localhost:5173/

如果还是空白，请：
1. 按 F12 打开开发者工具
2. 查看 Console 标签的错误信息
3. 提供错误信息以便进一步排查
