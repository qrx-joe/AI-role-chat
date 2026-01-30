import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';

/**
 * 文件上传模块
 * 
 * 核心功能：
 * 1. 注册 UploadController，提供基于 Multer 的文件暂存服务。
 */
@Module({
    controllers: [UploadController],
})
export class UploadModule { }
