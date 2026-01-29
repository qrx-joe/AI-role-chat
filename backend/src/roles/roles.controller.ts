import { Controller, Get, Post, Put, Patch, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Controller('api/roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

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

    @Patch('order')
    async updateOrders(@Body() orderData: { id: string, order: number }[]) {
        await this.rolesService.updateOrders(orderData);
        return {
            code: 200,
            message: '排序更新成功',
            data: null,
        };
    }

    @Get()
    async findAll() {
        const roles = await this.rolesService.findAll();
        return {
            code: 200,
            message: '获取角色列表成功',
            data: roles,
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const role = await this.rolesService.findOne(id);
        return {
            code: 200,
            message: '获取角色详情成功',
            data: role,
        };
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
        const role = await this.rolesService.update(id, updateRoleDto);
        return {
            code: 200,
            message: '角色更新成功',
            data: role,
        };
    }

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
