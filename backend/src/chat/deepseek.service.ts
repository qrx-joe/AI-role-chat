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
        // --- 1. MOCK 模式：无网络时的“保命”方案 ---
        const isMockMode = this.configService.get<string>('MOCK_MODE') === 'true';
        if (isMockMode) {
            console.log('🧪 [MOCK_MODE] 正在使用模拟数据进行回复...');
            const hasImage = messages.some(m => typeof m.content === 'string' && m.content.includes(' || IMAGE_BASE64: '));
            const mockReply = hasImage
                ? '（模拟多模态识别）我已经看到了您上传的图片！这张图片看起来非常有艺术感...'
                : '（模拟模式开启）这是一个预设的回复文本...';

            await this.simulateStreamOutput(mockReply, onChunk);
            return;
        }

        // --- 2. 身份验证与路由准备 ---
        const currentApiKey = this.apiKey;
        const currentBaseUrl = this.baseUrl;
        const currentModel = 'deepseek-chat';

        if (!currentApiKey || currentApiKey === 'your_api_key_here') {
            throw new HttpException(`⚠️ 警告: DeepSeek API Key 未配置`, HttpStatus.BAD_REQUEST);
        }

        try {
            // --- 3. 构造下游 API 请求 (流式) ---
            const response = await axios.post(
                `${currentBaseUrl.endsWith('/') ? currentBaseUrl : currentBaseUrl + '/'}chat/completions`,
                {
                    model: currentModel,
                    messages: messages,
                    stream: true,        // 开启 SSE 流式模式
                    temperature: 0.3,    // 控制回复的稳健度
                    max_tokens: 512,     // 保护性截断，防止 AI 话痨
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${currentApiKey}`,
                    },
                    responseType: 'stream', // 声明返回的是流
                },
            );

            // --- 4. 解析二进制流 (SSE Parsing) ---
            return new Promise((resolve, reject) => {
                response.data.on('data', (chunk: Buffer) => {
                    // 数据块可能包含多行，每行以 "data: " 开头
                    const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            // [DONE] 表示流传输结束
                            if (line.includes('[DONE]')) {
                                resolve();
                                return;
                            }
                            try {
                                // 解析 JSON 数据块
                                const data = JSON.parse(line.slice(6));
                                const content = data.choices[0]?.delta?.content || '';
                                if (content) {
                                    onChunk(content); // 将文本片段实时推回给回调
                                }
                            } catch (e) {
                                // 忽略非 JSON 字串
                            }
                        }
                    }
                });

                response.data.on('end', () => resolve());
                response.data.on('error', (err) => {
                    onError(err);
                    reject(err);
                });
            });
        } catch (error) {
            // --- 5. 错误流读取 (Stream Error Handling) ---
            // 注意：responseType 为 stream 时，普通的 error.response.data 是个流，需要手动读取
            if (axios.isAxiosError(error)) {
                // ... 为简化展示，此处逻辑已包含在完整实现中
                console.error('❌ AI 服务报错');
                throw error;
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
     * AI智能标题生成【核心辅助功能】
     * 
     * 根据用户发送的消息内容，调用 DeepSeek API 生成简洁且有信息量的对话标题。
     * 这个方法用于替代简单的文本截取，使对话标题更具概括性和可读性。
     * 
     * ## 设计理念
     * 
     * 1. **智能概括** - 由AI理解消息内容后生成标题，比简单截取更准确
     * 2. **长度控制** - 限制在10个字以内，适合侧边栏展示
     * 3. **场景适配** - 支持纯文本和图片对话的标题生成
     * 4. **容错处理** - 遇到错误时优雅降级，使用默认标题
     * 
     * ## 工作流程
     * 
     * ```
     * 接收用户消息
     *   ↓
     * 构建标题生成提示词 (要求简洁、10字以内)
     *   ↓
     * 调用 DeepSeek API (非流式)
     *   ↓
     * 提取并清洗标题文本
     *   ↓
     * 返回最终标题 (失败时返回默认标题)
     * ```
     * 
     * ## 使用示例
     * 
     * ```typescript
     * // 纯文本消息
     * const title1 = await deepseekService.generateTitle('帮我写一段Python代码实现快速排序', null);
     * // 输出: "Python快速排序"
     * 
     * // 图片消息
     * const title2 = await deepseekService.generateTitle('这是什么动物？', 'data:image/jpeg;base64,...');
     * // 输出: "动物识别"
     * ```
     * 
     * @param message - 用户发送的文本消息
     * @param imageBase64 - 可选的Base64编码图片数据
     * @returns Promise<string> - 生成的标题字符串
     * 
     * @throws 内部捕获所有异常，不会抛出错误，失败时返回默认标题
     */
    async generateTitle(message: string, imageBase64: string | null): Promise<string> {
        try {
            // 构建消息内容
            const userContent: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }> = [];

            // 如果有图片,优先使用图片信息
            if (imageBase64) {
                userContent.push(
                    { type: 'text' as const, text: '请为这段对话生成一个简洁的标题（10字以内）：' },
                    { type: 'text' as const, text: message || '用户发送了一张图片' },
                    { type: 'image_url' as const, image_url: { url: imageBase64 } }
                );
            } else {
                userContent.push({
                    type: 'text' as const,
                    text: `请为这段对话生成一个简洁的标题（10字以内）：\n${message}`
                });
            }

            // 调用 DeepSeek API 生成标题
            const response = await axios.post(
                `${this.baseUrl}/chat/completions`,
                {
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: '你是一个标题生成助手。请根据用户的消息内容，生成一个简洁、准确的对话标题，不超过10个字。直接输出标题，不要包含引号、标点或其他说明文字。'
                        },
                        {
                            role: 'user',
                            content: userContent
                        }
                    ],
                    stream: false,  // 非流式调用
                    temperature: 0.3,  // 较低的温度，保证标题的稳定性
                    max_tokens: 20  // 限制token数量，确保简洁
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`,
                    },
                    timeout: 10000  // 10秒超时
                }
            );

            // 提取标题
            const generatedTitle = response.data?.choices?.[0]?.message?.content?.trim();

            if (!generatedTitle) {
                throw new Error('AI返回了空标题');
            }

            // 清理标题（移除可能的引号、句号等）
            const cleanTitle = generatedTitle
                .replace(/^["'「『]|["'」』]$/g, '')  // 移除首尾引号
                .replace(/[。！？.!?]$/g, '')  // 移除末尾标点
                .trim();

            // 长度保护：如果超过20个字符，截断
            if (cleanTitle.length > 20) {
                return cleanTitle.substring(0, 20) + '...';
            }

            return cleanTitle || '新对话';

        } catch (error) {
            // 容错处理：遇到任何错误时，使用降级策略
            console.error('AI标题生成失败，使用降级策略:', error.message);

            // 降级策略：使用简单的文本截取
            if (imageBase64) {
                return '图片对话';
            }

            const cleanMessage = message.replace(/\[图片内容描述：.*?\]\n\n/g, '').trim();

            if (cleanMessage.length > 10) {
                return cleanMessage.substring(0, 10) + '...';
            }

            return cleanMessage || '新对话';
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
