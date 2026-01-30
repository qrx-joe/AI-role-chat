import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Conversation } from '../conversations/conversation.entity';
import { Message } from '../messages/message.entity';

/**
 * 角色实体类
 * 
 * 对应数据库中的 roles 表，存储 AI 聊天的各个角色人设信息。
 */
@Entity('roles')
export class Role {
  /** 唯一识别码 (UUID) */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 角色名称 (如：毒舌导师) */
  @Column()
  name: string;

  /** 性格设定 (核心 Prompt 之一) */
  @Column('text')
  personality: string;

  /** 背景故事 (为角色提供记忆与深度) */
  @Column('text')
  background: string;

  /** 行为禁忌 (明确 AI 不能做的事情) */
  @Column('text', { nullable: true })
  constraints: string;

  /** 对话示例 (Few-shot，教 AI 说话的风格) */
  @Column('text', { nullable: true })
  examples: string;

  /** 角色头像 (存放生成的 DiceBear URL) */
  @Column('text', { nullable: true })
  avatar: string;

  /** 展示顺序 (支持拖拽排序) */
  @Column({ type: 'int', default: 0 })
  order: number;

  /** 创建时间 */
  @CreateDateColumn()
  createdAt: Date;

  /** 与对话的一对多关系 */
  @OneToMany(() => Conversation, (conversation) => conversation.role)
  conversations: Conversation[];

  /** 与消息的一对多关系 */
  @OneToMany(() => Message, (message) => message.role)
  messages: Message[];
}
