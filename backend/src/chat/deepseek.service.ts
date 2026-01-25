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
            const hasImage = messages.some(m => typeof m.content === 'string' && m.content.includes(' || IMAGE_BASE64: '));
            const mockReply = hasImage
                ? '（模拟多模态识别）我已经看到了您上传的图片！这张图片看起来非常有艺术感，色彩丰富且构图巧妙。我可以基于这张图片的内容为您提供详细的分析或建议，请问您想深入了解图片的哪个部分？'
                : '（模拟模式开启）这是一个预设的回复文本，用于演示 API 连接不可用时的情况。流式数据依然可以通过 Mock 模式正常在前端渲染。';

            await this.simulateStreamOutput(mockReply, onChunk);
            return;
        }

        try {
            const response = await axios.post(
                `${this.baseUrl}/v1/chat/completions`,
                {
                    model: 'deepseek-chat',
                    messages: messages.map(m => {
                        // 检查是否是带图片的混合消息
                        if (m.role === 'user' && typeof m.content === 'string' && m.content.includes(' || IMAGE_BASE64: ')) {
                            const [text, imagePart] = m.content.split(' || IMAGE_BASE64: ');

                            // [紧急修复] deepseek-chat 目前是纯文本模型，发送 content 数组会导致 400 错误
                            // 演示时若需要展示图片识别，建议开启 MOCK_MODE 或说明该局限性
                            console.log('📸 检测到图片数据，由于 deepseek-chat 不支持 Vision，将降级为纯文本发送');

                            return {
                                role: 'user',
                                content: text || '请看这张图片' // 仅保留文本
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
