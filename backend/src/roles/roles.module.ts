import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { Role } from './role.entity';

/**
 * 角色管理业务模块
 * 
 * 核心功能：
 * 1. 提供角色的增删改查 (CRUD) 接口。
 * 2. 导出 RolesService，以便 ConversationsModule 等其他模块查询角色详情。
 */
@Module({
    imports: [TypeOrmModule.forFeature([Role])],
    controllers: [RolesController],
    providers: [RolesService],
    exports: [RolesService],
})
export class RolesModule { }
