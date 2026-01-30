import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { Conversation } from './conversation.entity';
import { Message } from '../messages/message.entity';

/**
 * 对话历史模块
 * 
 * 核心功能：
 * 1. 注册 ConversationsController，支持前端查询和删除历史对话。
 * 2. 注入核心服务，处理数据库中会话数据的读取。
 */
@Module({
    imports: [TypeOrmModule.forFeature([Conversation, Message])],
    controllers: [ConversationsController],
    providers: [ConversationsService],
})
export class ConversationsModule { }
