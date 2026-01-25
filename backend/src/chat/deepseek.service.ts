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

        // --- 模型选择逻辑 ---
        const hasImage = messages.some(m => {
            if (Array.isArray(m.content)) {
                return m.content.some(c => c.type === 'image_url');
            }
            return typeof m.content === 'string' && m.content.includes(' || IMAGE_BASE64: ');
        });

        const currentApiKey = hasImage ? this.zhipuApiKey : this.apiKey;
        const currentBaseUrl = hasImage ? this.zhipuBaseUrl : this.baseUrl;
        const currentModel = hasImage ? this.zhipuModel : 'deepseek-chat';
        const providerName = hasImage ? '智谱 AI (Vision)' : 'DeepSeek (Chat)';

        // --- API Key 检查 ---
        if (!currentApiKey || currentApiKey === 'your_api_key_here' || currentApiKey === 'your_zhipu_api_key_here') {
            const keyName = hasImage ? '智谱 AI API Key' : 'DeepSeek API Key';
            throw new HttpException(
                `⚠️ 警告: ${keyName} 未配置，请检查环境变量或 .env 文件。`,
                HttpStatus.BAD_REQUEST,
            );
        }

        // --- 视觉模式下清除历史消息 (防止 Token 超限) ---
        let processedMessages = messages;
        if (hasImage) {
            const lastUserMessage = messages.filter(m => m.role === 'user').pop();

            // 在视觉模式下，使用简洁的图片识别提示，避免复杂角色扮演导致重复
            processedMessages = [
                {
                    role: 'system',
                    content: '你是一个图片识别助手。请仔细观察用户上传的图片，用简洁、准确的中文描述图片内容。描述应包括：主要物体、场景、色彩、氛围等关键信息。避免重复相同的词语。'
                }
            ];
            if (lastUserMessage) processedMessages.push(lastUserMessage);

            console.log(`📸 视觉模式: 使用简化提示，仅保留 ${processedMessages.length} 条消息`);
            console.log(`📸 最后用户消息类型: ${Array.isArray(lastUserMessage?.content) ? 'array' : typeof lastUserMessage?.content}`);
            if (Array.isArray(lastUserMessage?.content)) {
                console.log(`📸 消息包含元素: ${lastUserMessage.content.map(c => c.type).join(', ')}`);
            }
        }

        console.log(`🚀 路由选择: [${providerName}] 使用模型: ${currentModel}`);

        try {
            // 调试日志：打印最终发送的消息结构
            const lastMsg = processedMessages[processedMessages.length - 1];
            console.log('📤 最后一条消息结构:', JSON.stringify({
                role: lastMsg?.role,
                contentType: Array.isArray(lastMsg?.content) ? 'array' : typeof lastMsg?.content,
                contentLength: Array.isArray(lastMsg?.content)
                    ? lastMsg.content.length
                    : (typeof lastMsg?.content === 'string' ? lastMsg.content.length : 0),
                hasImageUrl: Array.isArray(lastMsg?.content)
                    ? lastMsg.content.some(c => c.type === 'image_url')
                    : false
            }, null, 2));
            const response = await axios.post(
                `${currentBaseUrl.endsWith('/') ? currentBaseUrl : currentBaseUrl + '/'}chat/completions`,
                {
                    model: currentModel,
                    messages: processedMessages.map((m, index) => {
                        const isLastMessage = index === processedMessages.length - 1;

                        // 处理数组格式的内容 (ChatService 传过来的最新消息)
                        if (Array.isArray(m.content)) {
                            // 如果是发给 DeepSeek (纯文本模型)，或者虽然是发给视觉模型但不是最新一条消息，则需降级
                            // 注意：智谱 GLM-4v 要求图片只能在最新一条消息中
                            if (!isLastMessage || (!hasImage && currentModel === 'deepseek-chat')) {
                                return {
                                    role: m.role,
                                    content: m.content.find(c => c.type === 'text')?.text || '请看这张图片'
                                };
                            }
                            return m; // Zhipu 支持且是最新消息，保持原样
                        }

                        // 处理带标记的字符串格式 (历史消息中的图片标记)
                        if (typeof m.content === 'string' && m.content.includes(' || IMAGE_BASE64: ')) {
                            const [text, imagePart] = m.content.split(' || IMAGE_BASE64: ');

                            // 只有最新一条消息且在视觉模式下才还原图片
                            if (hasImage && isLastMessage && currentModel !== 'deepseek-chat') {
                                return {
                                    role: 'user',
                                    content: [
                                        { type: 'text', text: text || '请识别这张图片内容' },
                                        { type: 'image_url', image_url: { url: imagePart } }
                                    ]
                                };
                            }

                            // 历史消息或非视觉模式，强制降级为纯文本，防止 Zhipu 报错（智谱不支持历史中带图片）
                            return {
                                role: m.role,
                                content: text || '请看这张图片'
                            };
                        }
                        return m;
                    }),
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
