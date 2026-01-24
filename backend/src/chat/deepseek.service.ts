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
        // --- Mock 模式检查 ---
        const isMockMode = this.configService.get<string>('MOCK_MODE') === 'true';
        if (isMockMode) {
            console.log('🧪 [MOCK_MODE] 正在使用模拟数据进行回复...');
            await this.simulateStreamOutput('（模拟模式开启）这是一个预设的回复文本，用于演示 API 连接不可用时的情况。流式数据依然可以通过 Mock 模式正常在前端渲染。', onChunk);
            return;
        }

        try {
            const response = await axios.post(
                `${this.baseUrl}/v1/chat/completions`,
                {
                    model: 'deepseek-chat',
                    messages: messages.map(m => {
                        if (m.role === 'user' && typeof m.content === 'string' && m.content.includes(' || IMAGE_BASE64: ')) {
                            const parts = m.content.split(' || IMAGE_BASE64: ');
                            const text = parts[0];
                            const imagePart = parts[1];
                            return {
                                role: 'user',
                                content: [
                                    { type: 'text', text: text || '请看这张图片' },
                                    { type: 'image_url', image_url: { url: imagePart } }
                                ]
                            };
                        }
                        return m;
                    }),
                    stream: true,
                    temperature: 0.7,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`,
                    },
                    responseType: 'stream',
                },
            );

            console.log('✅ 发送 DeepSeek 请求 [Stream Mode]');
            return new Promise((resolve, reject) => {
                response.data.on('data', (chunk: Buffer) => {
                    const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            if (line.includes('[DONE]')) {
                                resolve();
                                return;
                            }
                            try {
                                const data = JSON.parse(line.slice(6));
                                const content = data.choices[0]?.delta?.content || '';
                                if (content) {
                                    onChunk(content);
                                }
                            } catch (e) {
                                // 忽略解析错误的 chunk
                            }
                        }
                    }
                });

                response.data.on('end', () => {
                    resolve();
                });

                response.data.on('error', (err) => {
                    onError(err);
                    reject(err);
                });
            });
        } catch (error) {
            // 如果 API 报错且未显式关闭 Mock，可以考虑自动降级（可选，此处暂仅手动配置）
            if (axios.isAxiosError(error)) {
                // ... (之前实现的错误详情打印逻辑保持不变)
                console.error('❌ DeepSeek API 错误详情:', {
                    status: error.response?.status,
                    data: error.response?.data,
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

    /**
     * 模拟流式输出效果
     */
    private async simulateStreamOutput(text: string, onChunk: (chunk: string) => void): Promise<void> {
        const words = text.split('');
        for (const char of words) {
            onChunk(char);
            await new Promise(resolve => setTimeout(resolve, 50)); // 模拟打字速度
        }
    }
}
