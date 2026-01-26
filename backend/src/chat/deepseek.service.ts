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

    private zhipuApiKey: string;
    private zhipuBaseUrl: string;
    private zhipuModel: string;

    constructor(private configService: ConfigService) {
        this.apiKey = this.configService.get<string>('DEEPSEEK_API_KEY') || '';
        this.baseUrl = this.configService.get<string>('DEEPSEEK_BASE_URL') || 'https://api.deepseek.com';

        this.zhipuApiKey = this.configService.get<string>('ZHIPU_API_KEY') || '';
        this.zhipuBaseUrl = this.configService.get<string>('ZHIPU_BASE_URL') || 'https://open.bigmodel.cn/api/paas/v4/';
        this.zhipuModel = this.configService.get<string>('ZHIPU_MODEL') || 'glm-4v-flash';

        if (!this.apiKey || this.apiKey === 'your_api_key_here') {
            console.warn('⚠️  警告: DeepSeek API Key 未配置');
        }
        if (!this.zhipuApiKey || this.zhipuApiKey === 'your_zhipu_api_key_here') {
            console.warn('⚠️  警告: 智谱 AI API Key 未配置，图片识别可能无法使用');
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

        // --- 统一使用 DeepSeek (图片识别已在 ChatService 两阶段处理) ---
        const currentApiKey = this.apiKey;
        const currentBaseUrl = this.baseUrl;
        const currentModel = 'deepseek-chat';
        const providerName = 'DeepSeek (Chat)';

        // --- API Key 检查 ---
        if (!currentApiKey || currentApiKey === 'your_api_key_here') {
            throw new HttpException(
                `⚠️ 警告: DeepSeek API Key 未配置，请检查环境变量或 .env 文件。`,
                HttpStatus.BAD_REQUEST,
            );
        }

        console.log(`🚀 路由选择: [${providerName}] 使用模型: ${currentModel}`);

        try {
            const response = await axios.post(
                `${currentBaseUrl.endsWith('/') ? currentBaseUrl : currentBaseUrl + '/'}chat/completions`,
                {
                    model: currentModel,
                    messages: messages,  // 直接使用原始消息（图片描述已转换为文本）
                    stream: true,
                    temperature: 0.3,           // 进一步降低随机性
                    max_tokens: 512,            // 限制输出长度，防止无限重复
                    top_p: 0.5,                 // 更严格的采样
                    repetition_penalty: 1.2,    // 重复惩罚参数，防止重复输出
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${currentApiKey}`,
                    },
                    responseType: 'stream',
                },
            );

            console.log(`✅ 发送 ${providerName} 请求 [Stream Mode]`);
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
            if (axios.isAxiosError(error)) {
                let status = error.response?.status;
                let errorMessage = error.message;

                // 由于启用了 responseType: 'stream'，错误内容需要从流中读取
                if (error.response?.data) {
                    try {
                        const errorStream = error.response.data;
                        const errorContent = await new Promise<string>((resolve) => {
                            let data = '';
                            errorStream.on('data', chunk => data += chunk);
                            errorStream.on('end', () => resolve(data));
                            errorStream.on('error', () => resolve(''));
                        });

                        console.error(`❌ ${providerName} 服务器原始报错:`, errorContent);
                        const parsedError = JSON.parse(errorContent);
                        errorMessage = parsedError.error?.message || parsedError.msg || errorContent;
                    } catch (e) {
                        console.error(`❌ 无法解析 ${providerName} 错误流:`, e);
                    }
                }

                console.error(`❌ ${providerName} 最终抛出错误 [${status}]:`, errorMessage);
                throw new HttpException(
                    `${providerName} API 报错: ${errorMessage}`,
                    status || HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }
            throw error;
        }
    }

    /**
     * 【阶段1】纯图片识别：使用 GLM-4V 获取图片的客观描述
     * @param imageContent 图片内容数组（包含 text 和 image_url）
     * @returns 图片描述文本
     */
    async identifyImageOnly(imageContent: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>): Promise<string> {
        console.log('🔍 [阶段1] 开始纯图片识别...');

        // API Key 检查
        if (!this.zhipuApiKey || this.zhipuApiKey === 'your_zhipu_api_key_here') {
            throw new HttpException(
                '⚠️ 警告: 智谱 AI API Key 未配置，无法使用图片识别功能。',
                HttpStatus.BAD_REQUEST,
            );
        }

        try {
            // 使用简洁的图片识别 System Prompt
            const response = await axios.post(
                `${this.zhipuBaseUrl.endsWith('/') ? this.zhipuBaseUrl : this.zhipuBaseUrl + '/'}chat/completions`,
                {
                    model: this.zhipuModel,
                    messages: [
                        {
                            role: 'system',
                            content: '你是一个专业的图片识别助手。请用简洁、准确的中文客观描述图片内容，包括：主要物体、场景、色彩、氛围等关键信息。保持客观中立，避免主观评价。'
                        },
                        {
                            role: 'user',
                            content: imageContent
                        }
                    ],
                    stream: false,  // 非流式调用
                    temperature: 0.3,
                    max_tokens: 300,  // 限制描述长度
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.zhipuApiKey}`,
                    },
                },
            );

            const description = response.data.choices?.[0]?.message?.content || '无法识别图片内容';
            console.log(`✅ [阶段1] 图片识别完成: ${description.substring(0, 50)}...`);
            return description;

        } catch (error) {
            console.error('❌ [阶段1] 图片识别失败:', error.response?.data || error.message);
            throw new HttpException(
                `图片识别失败: ${error.response?.data?.error?.message || error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
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
