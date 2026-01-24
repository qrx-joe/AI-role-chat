import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { DeepseekService } from './deepseek.service';
import { Role } from '../roles/role.entity';
import { Conversation } from '../conversations/conversation.entity';
import { Message } from '../messages/message.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Role, Conversation, Message])],
    controllers: [ChatController],
    providers: [ChatService, DeepseekService],
})
export class ChatModule { }
