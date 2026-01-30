import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

/**
 * 创建角色请求对象
 */
export class CreateRoleDto {
    /** 角色名称 - 必填 */
    @IsNotEmpty()
    @IsString()
    name: string;

    /** 性格设定 - 必填 */
    @IsNotEmpty()
    @IsString()
    personality: string;

    /** 背景故事 - 必填 */
    @IsNotEmpty()
    @IsString()
    background: string;

    /** 行为禁忌 - 可选 */
    @IsOptional()
    @IsString()
    constraints?: string;

    /** 对话示例 - 可选 */
    @IsOptional()
    @IsString()
    examples?: string;

    /** 头像 URL - 可选 */
    @IsOptional()
    @IsString()
    avatar?: string;
}

/**
 * 更新角色请求对象
 * 全部字段均为可选，仅更新传入的字段
 */
export class UpdateRoleDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    personality?: string;

    @IsOptional()
    @IsString()
    background?: string;

    @IsOptional()
    @IsString()
    constraints?: string;

    @IsOptional()
    @IsString()
    examples?: string;

    @IsOptional()
    @IsString()
    avatar?: string;
}
