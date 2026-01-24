import { ConfigService } from '@nestjs/config';
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string | Array<{
        type: 'text' | 'image_url';
        text?: string;
        image_url?: {
            url: string;
        };
    }>;
}
export declare class DeepseekService {
    private configService;
    private apiKey;
    private baseUrl;
    constructor(configService: ConfigService);
    streamChat(messages: ChatMessage[], onChunk: (chunk: string) => void, onError: (error: Error) => void): Promise<void>;
    private simulateStreamOutput;
}
