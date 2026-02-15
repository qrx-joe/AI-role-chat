import { Controller, Post, UploadedFile, UseInterceptors, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * 文件上传控制器
 * 
 * 负责处理用户上传的图片文件（如自定义头像或聊天中的图片）。
 * 使用 Multer 进行磁盘存储管理。
 */
@Controller('upload')
export class UploadController {
    /**
     * 上传单张图片
     * 
     * 包含以下逻辑：
     * 1. **存储定位**：保存至 ./public/uploads 目录。
     * 2. **重命名**：使用 UUID 生成唯一文件名，防止冲突。
     * 3. **格式过滤**：仅限常见图片格式。
     * 4. **大小限制**：最大 5MB。
     */
    @Post()
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './public/uploads',
                filename: (req, file, callback) => {
                    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
                    callback(null, uniqueName);
                },
            }),
            fileFilter: (req, file, callback) => {
                const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
                if (allowedMimes.includes(file.mimetype)) {
                    callback(null, true);
                } else {
                    callback(new HttpException('只支持上传图片文件（jpg, png, webp, gif）', HttpStatus.BAD_REQUEST), false);
                }
            },
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
            },
        }),
    )
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new HttpException('未选择文件', HttpStatus.BAD_REQUEST);
        }

        // 返回文件在服务器上的相对访问路径
        const fileUrl = `/uploads/${file.filename}`;
        return {
            code: 200,
            message: '文件上传成功',
            data: {
                filename: file.filename,
                url: fileUrl,
                size: file.size,
            },
        };
    }
}
