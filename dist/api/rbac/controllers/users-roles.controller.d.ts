import { RoleService } from '../services/role.service';
import { PermissionService } from '../services/permission.service';
import { TenantContextService } from '../services/tenant-context.service';
import { UsersService } from '../../users/users.service';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { UpdateUserDto } from '../../users/dto/update-user.dto';
import { AssignUserBranchDto } from '../../users/dto/assign-user-branch.dto';
import { SetActiveBranchDto } from '../../users/dto/set-active-branch.dto';
import { AssignUserWarehousesDto } from '../../users/dto/assign-user-warehouses.dto';
import { AssignUserReportDto } from '../../users/dto/assign-user-report.dto';
import { ChangePasswordDto } from '../../users/dto/change-password.dto';
import { QueryUsersDto } from '../../users/dto/query-users.dto';
import { UpdateUserStatusDto } from '../../users/dto/update-user-status.dto';
export declare class UsersRolesController {
    private roleService;
    private permissionService;
    private tenantContextService;
    private usersService;
    constructor(roleService: RoleService, permissionService: PermissionService, tenantContextService: TenantContextService, usersService: UsersService);
    createUser(dto: CreateUserDto, req: any): Promise<{
        message: string;
        user: {
            assigned_warehouses: any;
            billing_branch_id: string | null;
            billing_branch: {
                id: string;
                code: string;
                address: string;
                city: string;
                state: string;
                country: string;
                postal_code: string;
                fiscal_configuration_id: string;
                fiscal_configuration: {
                    id: string;
                    razon_social: string;
                    rfc: string;
                } | null;
            } | null;
            fiscal_configuration_id: string | null;
            primary_billing_branch_id: any;
            assigned_branches: any;
            can_switch_branch: boolean;
            has_all_branches_access: boolean;
            reports?: any;
            id: string;
            email: string | null;
            first_name: string;
            last_name: string;
            phone: string;
            status_id: number;
            status: import("../../../entities/users/user-status.entity").UserStatus;
            language_code: string;
            last_login_at: Date | null;
            created_at: Date;
            is_pos_user: boolean;
            pos_user_type: import("../../../entities/users/pos-user-type.enum").PosUserType | null;
            pos_user_code: number | null;
            pos_can_sell: boolean;
            pos_can_collect: boolean;
            is_employee: boolean;
            employee: any;
            is_manager: boolean;
            manager: {
                id: string;
                email: string | null;
                first_name: string;
                last_name: string;
            } | null;
        };
    }>;
    getUserStatuses(): Promise<import("../../../entities/users/user-status.entity").UserStatus[]>;
    getMyBranches(req: {
        user?: Record<string, unknown>;
    }): Promise<{
        billing_branch_id: string | null;
        billing_branch: {
            id: string;
            code: string;
            address: string;
            city: string;
            state: string;
            country: string;
            postal_code: string;
            fiscal_configuration_id: string;
            fiscal_configuration: {
                id: string;
                razon_social: string;
                rfc: string;
            } | null;
        } | null;
        fiscal_configuration_id: string | null;
        primary_billing_branch_id: any;
        assigned_branches: any;
        can_switch_branch: boolean;
        has_all_branches_access: boolean;
    }>;
    setMyActiveBranch(req: {
        user?: Record<string, unknown>;
    }, dto: SetActiveBranchDto): Promise<{
        billing_branch_id: string | null;
        billing_branch: {
            id: string;
            code: string;
            address: string;
            city: string;
            state: string;
            country: string;
            postal_code: string;
            fiscal_configuration_id: string;
            fiscal_configuration: {
                id: string;
                razon_social: string;
                rfc: string;
            } | null;
        } | null;
        fiscal_configuration_id: string | null;
        primary_billing_branch_id: any;
        assigned_branches: any;
        can_switch_branch: boolean;
        has_all_branches_access: boolean;
        message: string;
    }>;
    getTenantUsers(query: QueryUsersDto): Promise<{
        users: {
            assigned_warehouses: any;
            billing_branch_id: string | null;
            billing_branch: {
                id: string;
                code: string;
                address: string;
                city: string;
                state: string;
                country: string;
                postal_code: string;
                fiscal_configuration_id: string;
                fiscal_configuration: {
                    id: string;
                    razon_social: string;
                    rfc: string;
                } | null;
            } | null;
            fiscal_configuration_id: string | null;
            primary_billing_branch_id: any;
            assigned_branches: any;
            can_switch_branch: boolean;
            has_all_branches_access: boolean;
            reports?: any;
            id: string;
            email: string | null;
            first_name: string;
            last_name: string;
            phone: string;
            status_id: number;
            status: import("../../../entities/users/user-status.entity").UserStatus;
            language_code: string;
            last_login_at: Date | null;
            created_at: Date;
            is_pos_user: boolean;
            pos_user_type: import("../../../entities/users/pos-user-type.enum").PosUserType | null;
            pos_user_code: number | null;
            pos_can_sell: boolean;
            pos_can_collect: boolean;
            is_employee: boolean;
            employee: any;
            is_manager: boolean;
            manager: {
                id: string;
                email: string | null;
                first_name: string;
                last_name: string;
            } | null;
        }[];
    }>;
    getUserById(userId: string): Promise<{
        assigned_warehouses: any;
        billing_branch_id: string | null;
        billing_branch: {
            id: string;
            code: string;
            address: string;
            city: string;
            state: string;
            country: string;
            postal_code: string;
            fiscal_configuration_id: string;
            fiscal_configuration: {
                id: string;
                razon_social: string;
                rfc: string;
            } | null;
        } | null;
        fiscal_configuration_id: string | null;
        primary_billing_branch_id: any;
        assigned_branches: any;
        can_switch_branch: boolean;
        has_all_branches_access: boolean;
        reports?: any;
        id: string;
        email: string | null;
        first_name: string;
        last_name: string;
        phone: string;
        status_id: number;
        status: import("../../../entities/users/user-status.entity").UserStatus;
        language_code: string;
        last_login_at: Date | null;
        created_at: Date;
        is_pos_user: boolean;
        pos_user_type: import("../../../entities/users/pos-user-type.enum").PosUserType | null;
        pos_user_code: number | null;
        pos_can_sell: boolean;
        pos_can_collect: boolean;
        is_employee: boolean;
        employee: any;
        is_manager: boolean;
        manager: {
            id: string;
            email: string | null;
            first_name: string;
            last_name: string;
        } | null;
    }>;
    updateUserStatus(userId: string, dto: UpdateUserStatusDto): Promise<{
        message: string;
        user: {
            assigned_warehouses: any;
            billing_branch_id: string | null;
            billing_branch: {
                id: string;
                code: string;
                address: string;
                city: string;
                state: string;
                country: string;
                postal_code: string;
                fiscal_configuration_id: string;
                fiscal_configuration: {
                    id: string;
                    razon_social: string;
                    rfc: string;
                } | null;
            } | null;
            fiscal_configuration_id: string | null;
            primary_billing_branch_id: any;
            assigned_branches: any;
            can_switch_branch: boolean;
            has_all_branches_access: boolean;
            reports?: any;
            id: string;
            email: string | null;
            first_name: string;
            last_name: string;
            phone: string;
            status_id: number;
            status: import("../../../entities/users/user-status.entity").UserStatus;
            language_code: string;
            last_login_at: Date | null;
            created_at: Date;
            is_pos_user: boolean;
            pos_user_type: import("../../../entities/users/pos-user-type.enum").PosUserType | null;
            pos_user_code: number | null;
            pos_can_sell: boolean;
            pos_can_collect: boolean;
            is_employee: boolean;
            employee: any;
            is_manager: boolean;
            manager: {
                id: string;
                email: string | null;
                first_name: string;
                last_name: string;
            } | null;
        };
    }>;
    deleteUser(userId: string): Promise<{
        message: string;
        user: {
            assigned_warehouses: any;
            billing_branch_id: string | null;
            billing_branch: {
                id: string;
                code: string;
                address: string;
                city: string;
                state: string;
                country: string;
                postal_code: string;
                fiscal_configuration_id: string;
                fiscal_configuration: {
                    id: string;
                    razon_social: string;
                    rfc: string;
                } | null;
            } | null;
            fiscal_configuration_id: string | null;
            primary_billing_branch_id: any;
            assigned_branches: any;
            can_switch_branch: boolean;
            has_all_branches_access: boolean;
            reports?: any;
            id: string;
            email: string | null;
            first_name: string;
            last_name: string;
            phone: string;
            status_id: number;
            status: import("../../../entities/users/user-status.entity").UserStatus;
            language_code: string;
            last_login_at: Date | null;
            created_at: Date;
            is_pos_user: boolean;
            pos_user_type: import("../../../entities/users/pos-user-type.enum").PosUserType | null;
            pos_user_code: number | null;
            pos_can_sell: boolean;
            pos_can_collect: boolean;
            is_employee: boolean;
            employee: any;
            is_manager: boolean;
            manager: {
                id: string;
                email: string | null;
                first_name: string;
                last_name: string;
            } | null;
        };
    }>;
    getUserBranch(userId: string): Promise<{
        billing_branch_id: string | null;
        billing_branch: {
            id: string;
            code: string;
            address: string;
            city: string;
            state: string;
            country: string;
            postal_code: string;
            fiscal_configuration_id: string;
            fiscal_configuration: {
                id: string;
                razon_social: string;
                rfc: string;
            } | null;
        } | null;
        fiscal_configuration_id: string | null;
        primary_billing_branch_id: any;
        assigned_branches: any;
        can_switch_branch: boolean;
        has_all_branches_access: boolean;
    }>;
    getManagerReports(userId: string): Promise<{
        is_manager: boolean;
        reports: {
            id: string;
            email: string | null;
            first_name: string;
            last_name: string;
            phone: string;
            status: import("../../../entities/users/user-status.entity").UserStatus;
        }[];
    }>;
    addManagerReport(userId: string, dto: AssignUserReportDto): Promise<{
        message: string;
        report: {
            id: string;
            email: string | null;
            first_name: string;
            last_name: string;
            phone: string;
            status: import("../../../entities/users/user-status.entity").UserStatus;
        };
    }>;
    removeManagerReport(userId: string, reportUserId: string): Promise<{
        message: string;
    }>;
    getUserWarehouses(userId: string): Promise<{
        assigned_warehouses: {
            id: string;
            name: string;
            code: string;
            billing_branch_id: string;
            billing_branch: {
                id: string;
                code: string;
                display_name: string;
            } | null;
        }[];
    }>;
    assignUserWarehouses(userId: string, dto: AssignUserWarehousesDto): Promise<{
        assigned_warehouses: {
            id: string;
            name: string;
            code: string;
            billing_branch_id: string;
            billing_branch: {
                id: string;
                code: string;
                display_name: string;
            } | null;
        }[];
        message: string;
    }>;
    assignUserBranch(userId: string, dto: AssignUserBranchDto): Promise<{
        billing_branch_id: string | null;
        billing_branch: {
            id: string;
            code: string;
            address: string;
            city: string;
            state: string;
            country: string;
            postal_code: string;
            fiscal_configuration_id: string;
            fiscal_configuration: {
                id: string;
                razon_social: string;
                rfc: string;
            } | null;
        } | null;
        fiscal_configuration_id: string | null;
        primary_billing_branch_id: any;
        assigned_branches: any;
        can_switch_branch: boolean;
        has_all_branches_access: boolean;
        message: string;
    }>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    updateUser(userId: string, updateData: UpdateUserDto, req: any): Promise<{
        message: string;
        user: {
            assigned_warehouses: any;
            billing_branch_id: string | null;
            billing_branch: {
                id: string;
                code: string;
                address: string;
                city: string;
                state: string;
                country: string;
                postal_code: string;
                fiscal_configuration_id: string;
                fiscal_configuration: {
                    id: string;
                    razon_social: string;
                    rfc: string;
                } | null;
            } | null;
            fiscal_configuration_id: string | null;
            primary_billing_branch_id: any;
            assigned_branches: any;
            can_switch_branch: boolean;
            has_all_branches_access: boolean;
            reports?: any;
            id: string;
            email: string | null;
            first_name: string;
            last_name: string;
            phone: string;
            status_id: number;
            status: import("../../../entities/users/user-status.entity").UserStatus;
            language_code: string;
            last_login_at: Date | null;
            created_at: Date;
            is_pos_user: boolean;
            pos_user_type: import("../../../entities/users/pos-user-type.enum").PosUserType | null;
            pos_user_code: number | null;
            pos_can_sell: boolean;
            pos_can_collect: boolean;
            is_employee: boolean;
            employee: any;
            is_manager: boolean;
            manager: {
                id: string;
                email: string | null;
                first_name: string;
                last_name: string;
            } | null;
        };
    }>;
    getUserPermissions(userId: string): Promise<{
        user: {
            id: string;
        };
        permissions: string[];
    }>;
    getUserRoles(userId: string): Promise<{
        user: {
            id: string;
        };
        roles: {
            id: string;
            name: string;
            description: string;
            is_system_role: boolean;
            permissions: {
                id: string;
                action: string;
                description: string;
            }[];
        }[];
    }>;
    assignRoleToUser(userId: string, roleId: string): Promise<{
        message: string;
        user_role: import("..").UserRole;
    }>;
    replaceUserRole(userId: string, oldRoleId: string, body: {
        new_role_id: string;
    }): Promise<{
        message: string;
        user_role: import("..").UserRole;
    }>;
    removeRoleFromUser(userId: string, roleId: string): Promise<{
        message: string;
    }>;
    private resolveSessionContext;
}
