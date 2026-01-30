import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { DeepseekService } from './deepseek.service';
import { Role } from '../roles/role.entity';
import { Conversation } from '../conversations/conversation.entity';
import { Message } from '../messages/message.entity';

/**
 * 聊天业务模块
 * 
 * 核心功能：
 * 1. 注册 ChatController 处理前端的流式请求。
 * 2. 注入 ChatService 和 DeepseekService 两大 AI 驱动核心。
 * 3. 注入数据库实体，支持消息持久化。
 */
@Module({
    imports: [TypeOrmModule.forFeature([Role, Conversation, Message])],
    controllers: [ChatController],
    providers: [ChatService, DeepseekService],
})
export class ChatModule { }
