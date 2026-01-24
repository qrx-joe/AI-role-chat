import { Controller, Post, UploadedFile, UseInterceptors, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Controller('api/upload')
export class UploadController {
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
