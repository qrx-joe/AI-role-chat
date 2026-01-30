import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

/**
 * 角色管理服务
 * 
 * 负责处理 AI 角色的 CRUD（增删改查）操作，以及角色在列表中的自定义排序逻辑。
 * 
 * @class RolesService
 */
@Injectable()
export class RolesService {
    /**
     * 构造函数
     * @param rolesRepository - 注入的 TypeORM 角色实体仓库
     */
    constructor(
        @InjectRepository(Role)
        private rolesRepository: Repository<Role>,
    ) { }

    /**
     * 创建新角色
     * @param createRoleDto - 包含角色名称、性格、背景等信息的 DTO
     * @returns {Promise<Role>} 返回保存后的角色实体
     */
    async create(createRoleDto: CreateRoleDto): Promise<Role> {
        const role = this.rolesRepository.create(createRoleDto);
        return await this.rolesRepository.save(role);
    }

    /**
     * 查询所有可见角色
     * 
     * 按照自定义排序字段 (order) 升序排列，如果 order 相同则按创建时间倒序排列。
     * @returns {Promise<Role[]>} 角色列表
     */
    async findAll(): Promise<Role[]> {
        return await this.rolesRepository.find({
            order: {
                order: 'ASC',
                createdAt: 'DESC'
            },
        });
    }

    /**
     * 批量更新角色排序
     * 
     * 用于前端拖拽排序后的顺序同步。
     * @param orderData - 包含角色 ID 和对应新序号的数组
     */
    async updateOrders(orderData: { id: string, order: number }[]): Promise<void> {
        for (const item of orderData) {
            await this.rolesRepository.update(item.id, { order: item.order });
        }
    }

    /**
     * 根据 ID 查找单个角色
     * @param id - 角色唯一标识
     * @returns {Promise<Role>}
     * @throws {NotFoundException} - 当角色 ID 不存在时抛出 404 异常
     */
    async findOne(id: string): Promise<Role> {
        const role = await this.rolesRepository.findOne({ where: { id } });
        if (!role) {
            throw new NotFoundException(`角色 ID ${id} 不存在`);
        }
        return role;
    }

    /**
     * 更新指定角色的信息
     * @param id - 角色 ID
     * @param updateRoleDto - 更新后的字段内容
     * @returns {Promise<Role>}
     */
    async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
        const role = await this.findOne(id);
        Object.assign(role, updateRoleDto);
        return await this.rolesRepository.save(role);
    }

    /**
     * 删除指定角色
     * @param id - 角色 ID
     */
    async remove(id: string): Promise<void> {
        const role = await this.findOne(id);
        await this.rolesRepository.remove(role);
    }
}
