import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';

@Controller('api/chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post('stream')
    async streamChat(@Body() sendMessageDto: SendMessageDto, @Res() res: Response) {
        try {
            // 设置 SSE 响应头
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.status(HttpStatus.OK);

            let conversationId: string | undefined = undefined;

            await this.chatService.streamChat(
                sendMessageDto.roleId,
                sendMessageDto.message,
                sendMessageDto.conversationId || null,
                sendMessageDto.imageBase64 || null,
                (chunk) => {
                    // 发送流式数据块
                    res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
                },
                (error) => {
                    // 发送错误
                    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
                    res.end();
                },
            ).then((result) => {
                conversationId = result.conversationId;
                // 发送完成信号
                res.write(`data: ${JSON.stringify({ done: true, conversationId })}\n\n`);
                res.end();
            }).catch((error) => {
                res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
                res.end();
            });
        } catch (error) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                code: 500,
                message: error.message,
                data: null,
            });
        }
    }
}
