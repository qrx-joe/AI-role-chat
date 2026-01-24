import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './conversation.entity';
import { Message } from '../messages/message.entity';

@Injectable()
export class ConversationsService {
    constructor(
        @InjectRepository(Conversation)
        private conversationsRepository: Repository<Conversation>,
        @InjectRepository(Message)
        private messagesRepository: Repository<Message>,
    ) { }

    async findAll(): Promise<Conversation[]> {
        return await this.conversationsRepository.find({
            relations: ['role'],
            order: { updatedAt: 'DESC' },
        });
    }

    async getMessages(conversationId: string): Promise<Message[]> {
        return await this.messagesRepository.find({
            where: { conversationId },
            order: { createdAt: 'ASC' },
        });
    }
}
