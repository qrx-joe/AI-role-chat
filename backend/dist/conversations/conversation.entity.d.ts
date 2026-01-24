import { Role } from '../roles/role.entity';
import { Message } from '../messages/message.entity';
export declare enum ConversationStatus {
    ACTIVE = "active",
    ARCHIVED = "archived"
}
export declare class Conversation {
    id: string;
    roleId: string;
    userId: string;
    status: ConversationStatus;
    createdAt: Date;
    updatedAt: Date;
    role: Role;
    messages: Message[];
}
