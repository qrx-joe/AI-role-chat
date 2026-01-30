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

/**
 * 消息项实体类
 * 
 * 对应数据库中的 messages 表，存储每条用户提问和 AI 回复。
 */
@Entity('messages')
export class Message {
    /** 消息唯一识别码 (UUID) */
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /** 关联的角色 ID */
    @Column('uuid')
    roleId: string;

    /** 关联的会话 ID */
    @Column('uuid')
    conversationId: string;

    /** 消息内容 (文本或经过包装的图片描述) */
    @Column('text')
    content: string;

    /** 消息类型 (纯文本/图文) */
    @Column({
        type: 'text',
        default: MessageType.TEXT,
    })
    type: MessageType;

    /** 消息角色 (用户/AI) */
    @Column({
        type: 'text',
    })
    role: MessageRole;

    /** 消息发送时间 */
    @CreateDateColumn()
    createdAt: Date;

    /** 多对一：消息所属的角色实体 */
    @ManyToOne(() => Role, (role) => role.messages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'roleId' })
    roleEntity: Role;

    /** 多对一：消息所属的会话实体 */
    @ManyToOne(() => Conversation, (conversation) => conversation.messages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversationId' })
    conversation: Conversation;
}
