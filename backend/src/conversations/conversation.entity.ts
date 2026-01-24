import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Role } from '../roles/role.entity';
import { Message } from '../messages/message.entity';

export enum ConversationStatus {
    ACTIVE = 'active',
    ARCHIVED = 'archived',
}

@Entity('conversations')
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    roleId: string;

    @Column({ nullable: true })
    userId: string;

    @Column({
        type: 'text',
        default: ConversationStatus.ACTIVE,
    })
    status: ConversationStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Role, (role) => role.conversations, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'roleId' })
    role: Role;

    @OneToMany(() => Message, (message) => message.conversation)
    messages: Message[];
}
