import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class SendMessageDto {
    @IsNotEmpty()
    @IsUUID()
    roleId: string;

    @IsOptional()
    @IsUUID()
    conversationId?: string;

    @IsNotEmpty()
    @IsString()
    message: string;

    @IsOptional()
    @IsString()
    imageBase64?: string;
}
