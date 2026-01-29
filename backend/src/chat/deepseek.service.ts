import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * 聊天消息接口
 * 
 * 定义AI对话中的消息格式，支持纯文本和多模态（文本+图片）内容
 * 
 * @interface ChatMessage
 */
export interface ChatMessage {
    /** 
     * 消息角色
     * - system: 系统提示词，定义AI的行为和性格
     * - user: 用户发送的消息
     * - assistant: AI助手的回复
     */
    role: 'system' | 'user' | 'assistant';

    /** 
     * 消息内容
     * 
     * 可以是以下两种格式：
     * 1. 纯文本字符串 - 用于普通文本对话
     * 2. 内容数组 - 用于多模态消息（文本+图片）
     *    - type: 'text' - 文本块，包含 text 属性
     *    - type: 'image_url' - 图片块，包含 image_url.url 属性（Base64编码）
     * 
     * @example
     * // 纯文本
     * content: "你好，请帮我分析这段代码"
     * 
     * @example
     * // 多模态（文本+图片）
     * content: [
     *   { type: 'text', text: '请看这张图片' },
     *   { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,...' } }
     * ]
     */
    content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
}

/**
 * DeepSeek AI 服务类
 * 
 * 这是整个AI对话系统的核心服务，负责与AI模型进行交互。
 * 主要功能包括：
 * 
 * 1. **文本对话** - 使用 DeepSeek 模型进行角色扮演对话
 * 2. **图片识别** - 使用智谱 GLM-4V 模型识别图片内容
 * 3. **两阶段图片处理** - 分离视觉识别和角色扮演，提升回复质量
 * 
 * ## 两阶段图片处理架构
 * 
 * 为了解决AI在处理图片时角色性格被稀释的问题，采用了两阶段处理：
 * 
 * ```
 * 用户发送图片
 *   ↓
 * 【阶段1】GLM-4V 纯图片识别
 *   - 使用简洁的识别提示词
 *   - 获取客观的图片描述
 *   - 不涉及角色扮演
 *   ↓
 * 【阶段2】DeepSeek 角色扮演
 *   - 将图片描述作为纯文本输入
 *   - 结合完整的角色 System Prompt
 *   - 生成符合角色性格的回复
 *   ↓
 * 返回最终结果
 * ```
 * 
 * @class DeepseekService
 * @decorator @Injectable() - NestJS依赖注入装饰器
 */
@Injectable()
export class DeepseekService {
    // ==================== 私有属性 ====================

    /** DeepSeek API 密钥 - 用于文本对话 */
    private apiKey: string;

    /** DeepSeek API 基础URL */
    private baseUrl: string;

    /** 智谱 AI API 密钥 - 用于图片识别 */
    private zhipuApiKey: string;

    /** 智谱 AI API 基础URL */
    private zhipuBaseUrl: string;

    /** 智谱 AI 使用的模型名称 */
    private zhipuModel: string;

    /**
     * 构造函数 - 初始化AI服务配置
     * 
     * 从环境变量中读取API配置，并进行基本的有效性检查。
     * 如果API Key未配置或使用默认值，会输出警告信息。
     * 
     * @param configService - NestJS配置服务，用于读取环境变量
     * 
     * @example
     * // 环境变量配置（.env文件）
     * DEEPSEEK_API_KEY=sk-xxxxx
     * DEEPSEEK_BASE_URL=https://api.deepseek.com
     * ZHIPU_API_KEY=xxxxx.xxxxxx
     * ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4/
     * ZHIPU_MODEL=glm-4v-flash
     */
    constructor(private configService: ConfigService) {
        // 初始化 DeepSeek 配置
        this.apiKey = this.configService.get<string>('DEEPSEEK_API_KEY') || '';
        this.baseUrl = this.configService.get<string>('DEEPSEEK_BASE_URL') || 'https://api.deepseek.com';

        // 初始化智谱 AI 配置
        this.zhipuApiKey = this.configService.get<string>('ZHIPU_API_KEY') || '';
        this.zhipuBaseUrl = this.configService.get<string>('ZHIPU_BASE_URL') || 'https://open.bigmodel.cn/api/paas/v4/';
        this.zhipuModel = this.configService.get<string>('ZHIPU_MODEL') || 'glm-4v-flash';

        // API Key 有效性检查
        if (!this.apiKey || this.apiKey === 'your_api_key_here') {
            console.warn('⚠️  警告: DeepSeek API Key 未配置');
        }
        if (!this.zhipuApiKey || this.zhipuApiKey === 'your_zhipu_api_key_here') {
            console.warn('⚠️  警告: 智谱 AI API Key 未配置，图片识别可能无法使用');
        }
    }

    /**
     * 流式对话方法【核心功能】
     * 
     * 这是与AI进行对话的核心方法，支持Server-Sent Events (SSE)流式输出。
     * 统一使用 DeepSeek 模型进行文本对话。
     * 
     * ## 工作流程
     * 
     * 1. **Mock模式检查** - 如果启用Mock模式，使用模拟数据返回
     * 2. **API Key验证** - 检查DeepSeek API Key是否配置
     * 3. **发送请求** - 调用DeepSeek API，开启流式模式
     * 4. **处理响应** - 逐块接收AI回复，通过回调函数实时返回
     * 5. **错误处理** - 捕获并处理各种异常情况
     * 
     * ## 重要说明
     * 
     * - 图片识别已在 ChatService 中通过两阶段处理完成
     * - 传入的 messages 已经是纯文本格式（图片描述已嵌入）
     * - 响应采用流式处理，实时返回AI生成的内容
     * 
     * @param messages - 对话消息数组，包含system、user、assistant角色的消息
     * @param onChunk - 流式数据回调函数，每接收到一个文本片段就调用一次
     * @param onError - 错误回调函数，当发生错误时调用
     * @returns {Promise<void>} 异步完成，无返回值
     * 
     * @throws {HttpException} 当API Key未配置时抛出400错误
     * @throws {HttpException} 当API调用失败时抛出对应的HTTP错误
     * 
     * @example
     * ```typescript
     * // 使用示例
     * await deepseekService.streamChat(
     *   [
     *     { role: 'system', content: '你是一个友好的助手' },
     *     { role: 'user', content: '你好，请介绍一下自己' }
     *   ],
     *   (chunk) => {
     *     console.log('接收到:', chunk); // 实时输出AI回复片段
     *   },
     *   (error) => {
     *     console.error('错误:', error);
     *   }
     * );
     * ```
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
     * 纯图片识别方法【两阶段处理的第一阶段】
     * 
     * 使用智谱 GLM-4V 模型进行纯粹的图片内容识别，不涉及角色扮演。
     * 这是两阶段图片处理流程的第一步，专注于获取客观的图片描述。
     * 
     * ## 设计理念
     * 
     * 将图片识别和角色扮演分离的原因：
     * - 避免角色性格影响图片识别的准确性
     * - 避免图片识别任务稀释角色性格表现
     * - 让每个模型专注做自己擅长的事情
     * 
     * ## 工作流程
     * 
     * 1. **验证API Key** - 检查智谱AI的API Key是否配置
     * 2. **构建请求** - 使用客观中立的System Prompt
     * 3. **调用API** - 非流式调用，等待完整结果
     * 4. **返回描述** - 提取并返回图片描述文本
     * 
     * @param imageContent - 图片内容数组，包含用户文本和图片URL
     * @param imageContent[].type - 内容类型：'text' | 'image_url'
     * @param imageContent[].text - 文本内容（当type为'text'时）
     * @param imageContent[].image_url - 图片URL对象（当type为'image_url'时）
     * @param imageContent[].image_url.url - 图片的Base64编码URL
     * @returns {Promise<string>} 图片的客观描述文本
     * 
     * @throws {HttpException} 当智谱API Key未配置时抛出400错误
     * @throws {HttpException} 当图片识别失败时抛出500错误
     * 
     * @example
     * ```typescript
     * // 使用示例
     * const imageDescription = await deepseekService.identifyImageOnly([
     *   { type: 'text', text: '请看这张图片' },
     *   { 
     *     type: 'image_url', 
     *     image_url: { url: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...' } 
     *   }
     * ]);
     * 
     * console.log(imageDescription);
     * // 输出: "一张城市夜景照片，画面中可见高楼大厦的灯光..."
     * ```
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
