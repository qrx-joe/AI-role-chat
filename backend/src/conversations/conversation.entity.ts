import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Role } from '../roles/role.entity';
import { Message } from '../messages/message.entity';

export enum ConversationStatus {
    ACTIVE = 'active',
    ARCHIVED = 'archived',
}

/**
 * 对话会话实体类
 * 
 * 对应数据库中的 conversations 表，管理用户与特定角色的整段对话历史。
 */
@Entity('conversations')
export class Conversation {
    /** 会话唯一识别码 (UUID) */
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /** 关联的角色 ID */
    @Column('uuid')
    roleId: string;

    /** 用户 ID (预留字段，用于后续多用户扩展) */
    @Column({ nullable: true })
    userId: string;

    /** 对话标题 (由 AI 根据首条消息智能生成) */
    @Column({ type: 'varchar', length: 100, nullable: true })
    title: string;

    /** 会话状态 (激进型/已存档) */
    @Column({
        type: 'text',
        default: ConversationStatus.ACTIVE,
    })
    status: ConversationStatus;

    /** 会话创建时间 */
    @CreateDateColumn()
    createdAt: Date;

    /** 会话最后活跃或更新时间 */
    @UpdateDateColumn()
    updatedAt: Date;

    /** 多对一：多个对话可以指向同一个角色 */
    @ManyToOne(() => Role, (role) => role.conversations, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'roleId' })
    role: Role;

    /** 一对多：一个对话包含多条聊天消息 */
    @OneToMany(() => Message, (message) => message.conversation)
    messages: Message[];
}
