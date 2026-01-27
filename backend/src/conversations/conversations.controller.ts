import { Controller, Get, Delete, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ConversationsService } from './conversations.service';

@Controller('api/conversations')
export class ConversationsController {
    constructor(private readonly conversationsService: ConversationsService) { }

    @Get()
    async findAll() {
        const conversations = await this.conversationsService.findAll();
        return {
            code: 200,
            message: '获取会话列表成功',
            data: conversations,
        };
    }

    @Get(':id/messages')
    async getMessages(@Param('id') id: string) {
        const messages = await this.conversationsService.getMessages(id);
        return {
            code: 200,
            message: '获取消息记录成功',
            data: messages,
        };
    }

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
