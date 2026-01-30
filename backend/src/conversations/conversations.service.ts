import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './conversation.entity';
import { Message } from '../messages/message.entity';

/**
 * 对话管理服务
 * 
 * 维护用户与不同 AI 角色之间的对话历史。
 * 每一个 Conversation 对应侧边栏的一条历史记录。
 */
@Injectable()
export class ConversationsService {
    /**
     * @param conversationsRepository - 注入的对话实体仓库
     * @param messagesRepository - 注入的消息实体仓库，用于级联删除对话下的消息
     */
    constructor(
        @InjectRepository(Conversation)
        private conversationsRepository: Repository<Conversation>,
        @InjectRepository(Message)
        private messagesRepository: Repository<Message>,
    ) { }

    /**
     * 获取所有对话列表及其关联的角色和消息概要
     * 
     * 主要用于侧边栏的历史记录展示，按更新时间倒序排列。
     * @returns {Promise<Conversation[]>} 包含 role 关联信息的对话列表
     */
    async findAll(): Promise<Conversation[]> {
        return await this.conversationsRepository.find({
            relations: ['role', 'messages'],
            order: { updatedAt: 'DESC' },
        });
    }

    /**
     * 获取指定对话的所有历史消息内容
     * 
     * 用于点击历史记录进入对话时，加载所有的聊天气泡。
     * @param conversationId - 对话会话的唯一标识
     * @returns {Promise<Message[]>} 按时间正序排列的消息数组
     */
    async getMessages(conversationId: string): Promise<Message[]> {
        return await this.messagesRepository.find({
            where: { conversationId },
            order: { createdAt: 'ASC' },
        });
    }

    /**
     * 删除整个对话
     * 
     * 执行两步操作：
     * 1. 物理删除该对话名下的所有 Message 记录。
     * 2. 删除对话本身的记录。
     * @param id - 对话 ID
     */
    async remove(id: string): Promise<void> {
        // --- 第一步：级联清理消息 ---
        await this.messagesRepository.delete({ conversationId: id });

        // --- 第二步：删除对话主体 ---
        await this.conversationsRepository.delete(id);
    }
}
