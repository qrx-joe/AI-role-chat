import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Conversation } from '../conversations/conversation.entity';
import { Message } from '../messages/message.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  personality: string;

  @Column('text')
  background: string;

  @Column('text', { nullable: true })
  constraints: string;

  @Column('text', { nullable: true })
  examples: string;

  @Column('text', { nullable: true })
  avatar: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Conversation, (conversation) => conversation.role)
  conversations: Conversation[];

  @OneToMany(() => Message, (message) => message.role)
  messages: Message[];
}
