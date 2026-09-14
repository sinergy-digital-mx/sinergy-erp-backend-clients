import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../entities/users/user.entity';
import { UserBillingBranch } from '../../entities/users/user-billing-branch.entity';
import { UserWarehouseAssignment } from '../../entities/control-desk/user-warehouse-assignment.entity';
import { PermissionService } from '../rbac/services/permission.service';
import { RoleService } from '../rbac/services/role.service';
export declare class AuthService {
    private userRepo;
    private branchAssignmentRepo;
    private warehouseAssignmentRepo;
    private jwtService;
    private permissionService;
    private roleService;
    private readonly logger;
    constructor(userRepo: Repository<User>, branchAssignmentRepo: Repository<UserBillingBranch>, warehouseAssignmentRepo: Repository<UserWarehouseAssignment>, jwtService: JwtService, permissionService: PermissionService, roleService: RoleService);
    login(email: string, password: string): Promise<{
        access_token: string;
        user: {
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
            assigned_branches: {
                id: string;
                code: string;
                city: string;
                display_name: string;
                is_primary: boolean;
                fiscal_configuration_id: string;
            }[];
            primary_billing_branch_id: string;
            can_switch_branch: boolean;
            is_pos_user: boolean;
            pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            pos_can_sell: boolean;
            pos_can_collect: boolean;
            billing_branch_id: string | null;
            fiscal_configuration_id: string | null;
            is_employee: boolean;
            is_manager: boolean;
            id: string;
            email: string | null;
            tenant_id: string;
            status: string;
            roles: any[];
            permissions: any;
            permissions_flat: string[];
            permissions_version: number;
            last_login_at: Date;
        };
    }>;
    refreshToken(userId: string, tenantId: string): Promise<{
        access_token: string;
        user: {
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
            assigned_branches: {
                id: string;
                code: string;
                city: string;
                display_name: string;
                is_primary: boolean;
                fiscal_configuration_id: string;
            }[];
            primary_billing_branch_id: string;
            can_switch_branch: boolean;
            is_pos_user: boolean;
            pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            pos_can_sell: boolean;
            pos_can_collect: boolean;
            billing_branch_id: string | null;
            fiscal_configuration_id: string | null;
            is_employee: boolean;
            is_manager: boolean;
            id: string;
            email: string | null;
            tenant_id: string;
            status: string;
            roles: string[];
            permissions_flat: string[];
            permissions_version: number;
        };
    }>;
    private loadSessionBranchFields;
    private loadAssignedBranches;
    private loadAssignedWarehouses;
    private mapPosSessionFields;
    refresh(userId: string, tenantId: string): Promise<{
        access_token: string;
        user: {
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
            assigned_branches: {
                id: string;
                code: string;
                city: string;
                display_name: string;
                is_primary: boolean;
                fiscal_configuration_id: string;
            }[];
            primary_billing_branch_id: string;
            can_switch_branch: boolean;
            is_pos_user: boolean;
            pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            pos_can_sell: boolean;
            pos_can_collect: boolean;
            billing_branch_id: string | null;
            fiscal_configuration_id: string | null;
            is_employee: boolean;
            is_manager: boolean;
            id: string;
            email: string | null;
            tenant_id: string;
            status: string;
            roles: string[];
            permissions_flat: string[];
            permissions_version: number;
        };
    }>;
    validateUserWithRBAC(userId: string, tenantId: string): Promise<{
        id: string;
        email: string | null;
        tenant_id: string;
        status: string;
        roles: import("../rbac").Role[];
        permissions: import("../rbac").Permission[];
    } | null>;
}
