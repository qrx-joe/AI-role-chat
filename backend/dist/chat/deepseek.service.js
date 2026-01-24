"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeepseekService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let DeepseekService = class DeepseekService {
    configService;
    apiKey;
    baseUrl;
    constructor(configService) {
        this.configService = configService;
        this.apiKey = this.configService.get('DEEPSEEK_API_KEY') || '';
        this.baseUrl = this.configService.get('DEEPSEEK_BASE_URL') || 'https://api.deepseek.com';
        if (!this.apiKey || this.apiKey === 'your_api_key_here') {
            console.warn('⚠️  警告: DeepSeek API Key 未配置，请在 .env 文件中设置 DEEPSEEK_API_KEY');
        }
    }
    async streamChat(messages, onChunk, onError) {
        const isMockMode = this.configService.get('MOCK_MODE') === 'true';
        if (isMockMode) {
            console.log('🧪 [MOCK_MODE] 正在使用模拟数据进行回复...');
            await this.simulateStreamOutput('（模拟模式开启）这是一个预设的回复文本，用于演示 API 连接不可用时的情况。流式数据依然可以通过 Mock 模式正常在前端渲染。', onChunk);
            return;
        }
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/v1/chat/completions`, {
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
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                responseType: 'stream',
            });
            console.log('✅ 发送 DeepSeek 请求 [Stream Mode]');
            return new Promise((resolve, reject) => {
                response.data.on('data', (chunk) => {
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
                            }
                            catch (e) {
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
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                console.error('❌ DeepSeek API 错误详情:', {
                    status: error.response?.status,
                    data: error.response?.data,
                });
                const message = error.response?.data?.error?.message || error.message;
                throw new common_1.HttpException(`DeepSeek API 错误: ${message}`, error.response?.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
            throw error;
        }
    }
    async simulateStreamOutput(text, onChunk) {
        const words = text.split('');
        for (const char of words) {
            onChunk(char);
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }
};
exports.DeepseekService = DeepseekService;
exports.DeepseekService = DeepseekService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DeepseekService);
//# sourceMappingURL=deepseek.service.js.map