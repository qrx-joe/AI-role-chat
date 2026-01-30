import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

/**
 * 全局异常过滤器
 * 
 * 捕获应用程序中所有未处理的异常，并将其统一格式化为 JSON 返回。
 * 确保接口报错时依然遵循 { code, message, data } 的标准规范。
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = '服务器内部错误';

        // --- 1. 识别异常类型并提取错误信息 ---
        if (exception instanceof HttpException) {
            // 处理 NestJS 内置的 HTTP 异常 (如 404, 403)
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            message = typeof exceptionResponse === 'string'
                ? exceptionResponse
                : (exceptionResponse as any).message || message;
        } else if (exception instanceof Error) {
            // 处理标准 JavaScript 错误
            message = exception.message;
        }

        // --- 2. 统一输出格式 ---
        response.status(status).json({
            code: status,
            message: message,
            data: null, // 发生错误时 data 统一为 null
        });
    }
}
