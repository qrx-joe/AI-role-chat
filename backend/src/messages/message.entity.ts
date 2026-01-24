import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from '../roles/role.entity';
import { Conversation } from '../conversations/conversation.entity';

export enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
}

export enum MessageRole {
    USER = 'user',
    ASSISTANT = 'assistant',
}

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    roleId: string;

    @Column('uuid')
    conversationId: string;

    @Column('text')
    content: string;

    @Column({
        type: 'text',
        default: MessageType.TEXT,
    })
    type: MessageType;

    @Column({
        type: 'text',
    })
    role: MessageRole;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Role, (role) => role.messages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'roleId' })
    roleEntity: Role;

    @ManyToOne(() => Conversation, (conversation) => conversation.messages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversationId' })
    conversation: Conversation;
}
