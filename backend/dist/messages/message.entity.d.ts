import { Role } from '../roles/role.entity';
import { Conversation } from '../conversations/conversation.entity';
export declare enum MessageType {
    TEXT = "text",
    IMAGE = "image"
}
export declare enum MessageRole {
    USER = "user",
    ASSISTANT = "assistant"
}
export declare class Message {
    id: string;
    roleId: string;
    conversationId: string;
    content: string;
    type: MessageType;
    role: MessageRole;
    createdAt: Date;
    roleEntity: Role;
    conversation: Conversation;
}
