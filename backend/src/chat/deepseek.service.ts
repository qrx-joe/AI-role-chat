import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
}

@Injectable()
export class DeepseekService {
    private apiKey: string;
    private baseUrl: string;

    constructor(private configService: ConfigService) {
        this.apiKey = this.configService.get<string>('DEEPSEEK_API_KEY') || '';
        this.baseUrl = this.configService.get<string>('DEEPSEEK_BASE_URL') || 'https://api.deepseek.com';

        if (!this.apiKey || this.apiKey === 'your_api_key_here') {
            console.warn('⚠️  警告: DeepSeek API Key 未配置，请在 .env 文件中设置 DEEPSEEK_API_KEY');
        }
    }

    /**
     * 调用 DeepSeek 流式 API
     * @param messages 对话消息数组
     * @param onChunk 流式数据回调函数
     */
    async streamChat(
        messages: ChatMessage[],
        onChunk: (chunk: string) => void,
        onError: (error: Error) => void,
    ): Promise<void> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/v1/chat/completions`,
                {
                    model: 'deepseek-chat',  // DeepSeek V3 官方模型名
                    messages: messages,
                    stream: true,
                    temperature: 0.7,  // 添加温度参数
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`,
                    },
                    responseType: 'stream',
                },
            );

            return new Promise((resolve, reject) => {
                response.data.on('data', (chunk: Buffer) => {
                    const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);

                            if (data === '[DONE]') {
                                resolve();
                                return;
                            }

                            try {
                                const json = JSON.parse(data);
                                const content = json.choices?.[0]?.delta?.content;
                                if (content) {
                                    onChunk(content);
                                }
                            } catch (e) {
                                // 忽略解析错误
                            }
                        }
                    }
                });

                response.data.on('end', () => {
                    resolve();
                });

                response.data.on('error', (error: Error) => {
                    onError(error);
                    reject(error);
                });
            });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                // 打印完整错误信息以便调试
                console.error('❌ DeepSeek API 错误详情:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    config: {
                        url: error.config?.url,
                        method: error.config?.method,
                        data: error.config?.data ? JSON.parse(error.config.data) : null,
                    }
                });

                const message = error.response?.data?.error?.message || error.message;
                throw new HttpException(
                    `DeepSeek API 错误: ${message}`,
                    error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }
            throw error;
        }
    }
}
