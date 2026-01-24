import { Conversation } from '../conversations/conversation.entity';
import { Message } from '../messages/message.entity';
export declare class Role {
    id: string;
    name: string;
    personality: string;
    background: string;
    constraints: string;
    examples: string;
    createdAt: Date;
    conversations: Conversation[];
    messages: Message[];
}
