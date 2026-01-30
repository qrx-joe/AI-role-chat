import { Controller, Get, Delete, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ConversationsService } from './conversations.service';

/**
 * 对话历史控制器
 * 
 * 负责管理会话记录及其关联的消息。
 */
@Controller('api/conversations')
export class ConversationsController {
    constructor(private readonly conversationsService: ConversationsService) { }

    /**
     * 获取用户的全部对话历史列表
     * 通常按更新时间降序排列
     */
    @Get()
    async findAll() {
        const conversations = await this.conversationsService.findAll();
        return {
            code: 200,
            message: '获取会话列表成功',
            data: conversations,
        };
    }

    /**
     * 获取特定会话的所有消息详情
     * @param id - 会话 UUID
     */
    @Get(':id/messages')
    async getMessages(@Param('id') id: string) {
        const messages = await this.conversationsService.getMessages(id);
        return {
            code: 200,
            message: '获取消息记录成功',
            data: messages,
        };
    }

    /**
     * 删除整个会话及其下的所有消息
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id') id: string) {
        await this.conversationsService.remove(id);
        return {
            code: 200,
            message: '删除对话成功',
            data: null,
        };
    }
}
