import { Repository } from 'typeorm';
import { Role } from '../roles/role.entity';
import { Conversation } from '../conversations/conversation.entity';
import { Message } from '../messages/message.entity';
import { DeepseekService } from './deepseek.service';
export declare class ChatService {
    private rolesRepository;
    private conversationsRepository;
    private messagesRepository;
    private deepseekService;
    constructor(rolesRepository: Repository<Role>, conversationsRepository: Repository<Conversation>, messagesRepository: Repository<Message>, deepseekService: DeepseekService);
    private buildSystemPrompt;
    private getOrCreateConversation;
    private getRecentMessages;
    private saveMessage;
    streamChat(roleId: string, userMessage: string, conversationId: string | null, imageBase64: string | null, onChunk: (chunk: string) => void, onError: (error: Error) => void): Promise<{
        conversationId: string;
    }>;
}
