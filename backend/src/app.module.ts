import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RolesModule } from './roles/roles.module';
import { ChatModule } from './chat/chat.module';
import { ConversationsModule } from './conversations/conversations.module';
import { UploadModule } from './upload/upload.module';
import { Role } from './roles/role.entity';
import { Conversation } from './conversations/conversation.entity';
import { Message } from './messages/message.entity';

/**
 * 根模块 (Root Module)
 * 
 * 后端应用的“总接线板”，负责注册所有业务模块和全局配置。
 */
@Module({
  imports: [
    // 环境变量配置 (全局启用)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 数据库连接配置 (SQLite)
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE_PATH || './database.sqlite',
      entities: [Role, Conversation, Message],
      synchronize: true, // 开发环境下根据实体定义自动创建/修改表结构
    }),

    // 业务功能模块注册
    RolesModule,         // 角色管理
    ChatModule,          // AI 对话核心
    ConversationsModule, // 历史记录管理
    UploadModule,        // 文件上传 (预览功能使用)
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
