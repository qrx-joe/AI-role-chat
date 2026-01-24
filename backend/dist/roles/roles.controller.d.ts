import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    create(createRoleDto: CreateRoleDto): Promise<{
        code: number;
        message: string;
        data: import("./role.entity").Role;
    }>;
    findAll(): Promise<{
        code: number;
        message: string;
        data: import("./role.entity").Role[];
    }>;
    findOne(id: string): Promise<{
        code: number;
        message: string;
        data: import("./role.entity").Role;
    }>;
    update(id: string, updateRoleDto: UpdateRoleDto): Promise<{
        code: number;
        message: string;
        data: import("./role.entity").Role;
    }>;
    remove(id: string): Promise<{
        code: number;
        message: string;
        data: null;
    }>;
}
