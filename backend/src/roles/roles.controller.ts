import { Controller, Get, Post, Put, Patch, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

/**
 * 角色管理控制器
 * 
 * 暴露 /api/roles 路由，处理前端对 AI 角色配置的各种请求。
 * 遵循 RESTful 设计规范。
 */
@Controller('api/roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    /**
     * 创建新角色
     * @param createRoleDto - 角色创建的数据传输对象
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createRoleDto: CreateRoleDto) {
        const role = await this.rolesService.create(createRoleDto);
        return {
            code: 201,
            message: '角色创建成功',
            data: role,
        };
    }

    /**
     * 批量更新角色排序
     * 用于响应前端拖拽排序后的顺序同步
     * @param orderData - 包含 ID 和序号的数组
     */
    @Patch('order')
    async updateOrders(@Body() orderData: { id: string, order: number }[]) {
        await this.rolesService.updateOrders(orderData);
        return {
            code: 200,
            message: '排序更新成功',
            data: null,
        };
    }

    /**
     * 获取所有角色列表
     */
    @Get()
    async findAll() {
        const roles = await this.rolesService.findAll();
        return {
            code: 200,
            message: '获取角色列表成功',
            data: roles,
        };
    }

    /**
     * 获取单个角色的详细信息
     * @param id - 角色 UUID
     */
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const role = await this.rolesService.findOne(id);
        return {
            code: 200,
            message: '获取角色详情成功',
            data: role,
        };
    }

    /**
     * 更新指定角色的信息
     * @param id - 角色 ID
     * @param updateRoleDto - 更新后的字段
     */
    @Put(':id')
    async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
        const role = await this.rolesService.update(id, updateRoleDto);
        return {
            code: 200,
            message: '角色更新成功',
            data: role,
        };
    }

    /**
     * 删除指定的角色
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id') id: string) {
        await this.rolesService.remove(id);
        return {
            code: 200,
            message: '角色删除成功',
            data: null,
        };
    }
}
