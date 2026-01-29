import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateRoleDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    personality: string;

    @IsNotEmpty()
    @IsString()
    background: string;

    @IsOptional()
    @IsString()
    constraints?: string;

    @IsOptional()
    @IsString()
    examples?: string;

    @IsOptional()
    @IsString()
    avatar?: string;

    @IsOptional()
    @IsString()
    avatar?: string;
}

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
