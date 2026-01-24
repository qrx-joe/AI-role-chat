import type { Response } from 'express';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    streamChat(sendMessageDto: SendMessageDto, res: Response): Promise<void>;
}
