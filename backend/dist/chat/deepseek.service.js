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
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/v1/chat/completions`, {
                model: 'deepseek-chat',
                messages: messages,
                stream: true,
                temperature: 0.7,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                responseType: 'stream',
            });
            return new Promise((resolve, reject) => {
                response.data.on('data', (chunk) => {
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
                            }
                            catch (e) {
                            }
                        }
                    }
                });
                response.data.on('end', () => {
                    resolve();
                });
                response.data.on('error', (error) => {
                    onError(error);
                    reject(error);
                });
            });
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
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
                throw new common_1.HttpException(`DeepSeek API 错误: ${message}`, error.response?.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
            throw error;
        }
    }
};
exports.DeepseekService = DeepseekService;
exports.DeepseekService = DeepseekService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DeepseekService);
//# sourceMappingURL=deepseek.service.js.map