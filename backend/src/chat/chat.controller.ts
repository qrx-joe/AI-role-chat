import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';

/**
 * 聊天核心控制器
 * 
 * 负责处理用户与 AI 之间的实时对话请求。
 * 主要特点是支持流式响应 (SSE)，让前端能实时展示生成内容。
 */
@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    /**
     * 发送聊天消息并接收流式响应
     * 
     * 使用标准 HTTP SSE (Server-Sent Events) 协议。
     * 每个数据块以 "data: " 开头并以双换行符结尾。
     * 
     * @param sendMessageDto - 包含角色 ID、消息内容、会话 ID 和可选图片
     * @param res - Express 响应对象，用于手动控制流式输出
     */
    @Post('stream')
    async streamChat(@Body() sendMessageDto: SendMessageDto, @Res() res: Response) {
        try {
            // --- 1. 设置 SSE 专用响应头 ---
            res.setHeader('Content-Type', 'text/event-stream'); // 声明流式传输
            res.setHeader('Cache-Control', 'no-cache');        // 禁用浏览器缓存
            res.setHeader('Connection', 'keep-alive');         // 保持长连接
            res.setHeader('Access-Control-Allow-Origin', '*'); // 支持跨域
            res.status(HttpStatus.OK);

            let conversationId: string | undefined = undefined;

            // --- 2. 调用 ChatService 启动流式任务 ---
            await this.chatService.streamChat(
                sendMessageDto.roleId,
                sendMessageDto.message,
                sendMessageDto.conversationId || null,
                sendMessageDto.imageBase64 || null,
                // 回调函数 A: 处理实时生成的文本块 (Chunk)
                (chunk) => {
                    res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
                },
                // 回调函数 B: 捕获生成过程中的异常
                (error) => {
                    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
                    res.end();
                },
            ).then((result) => {
                // --- 3. 生成结束后的收尾工作 ---
                conversationId = result.conversationId;
                // 发送完成信号 'done'，告知前端当前会话 ID（若是新创建的对话）
                res.write(`data: ${JSON.stringify({ done: true, conversationId })}\n\n`);
                res.end(); // 关闭流
            }).catch((error) => {
                res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
                res.end();
            });
        } catch (error) {
            // 非流式错误处理
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                code: 500,
                message: error.message,
                data: null,
            });
        }
    }
}
