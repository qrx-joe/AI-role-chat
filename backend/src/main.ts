import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

/**
 * 应用程序入口点 (Bootstrap)
 * 
 * 负责启动 NestJS 控制塔，配置全局中间件和管道。
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // --- 0. 全局路由前缀 ---
  // 统一将所有业务接口挂载到 /api，避免在 Controller 中重复拼写前缀
  app.setGlobalPrefix('api');

  // --- 1. 跨域与安全配置 ---
  const corsOrigin = process.env.CORS_ORIGIN;
  app.enableCors({
    origin: corsOrigin || true,
    credentials: true,
  });

  // --- 2. 报文解析优化 ---
  // 增加负载限制，确保前端发送的大图 Base64 字符串不会导致 413 Payload Too Large 错误
  const express = require('express');
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- 3. 静态资源托管 ---
  // 将后端 public 文件夹暴露，用于存放上传的本地图片（如果有的话）
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/',
  });

  // --- 4. 全局校验管道 ---
  // 启用自动验证，确保进入 Controller 的 DTO 数据格式正确
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,   // 过滤掉不在 DTO 中定义的冗余字段
    transform: true,   // 自动将字符串 ID 转为 UUID 或数值
  }));

  // --- 5. 异常拦截器 ---
  // 强制将所有系统报错转为标准的格式化 JSON
  app.useGlobalFilters(new AllExceptionsFilter());

  // --- 6. 启动服务 ---
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 服务器运行在: http://localhost:${port}`);
}
bootstrap();
