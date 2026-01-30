import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

/**
 * 发送聊天消息请求对象
 */
export class SendMessageDto {
    /** 目标角色的 ID - 必填 */
    @IsNotEmpty()
    @IsUUID()
    roleId: string;

    /** 所属会话 ID - 可选（若为空则后端自动创建新会话） */
    @IsOptional()
    @IsUUID()
    conversationId?: string;

    /** 消息文本内容 - 必填 */
    @IsNotEmpty()
    @IsString()
    message: string;

    /** 图片数据 (Base64) - 可选 */
    @IsOptional()
    @IsString()
    imageBase64?: string;
}
