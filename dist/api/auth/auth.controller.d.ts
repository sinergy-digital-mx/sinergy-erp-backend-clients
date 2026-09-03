import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { TenantContextService } from '../rbac/services/tenant-context.service';
import { PermissionService } from '../rbac/services/permission.service';
export declare class AuthController {
    private readonly authService;
    private readonly tenantContextService;
    private readonly permissionService;
    constructor(authService: AuthService, tenantContextService: TenantContextService, permissionService: PermissionService);
    login(dto: LoginDto): Promise<{
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
    refresh(req: {
        user?: Record<string, unknown>;
    }): Promise<{
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
    getCurrentUserPermissions(req: {
        user?: Record<string, unknown>;
    }): Promise<{
        user_id: string;
        tenant_id: string;
        permissions: string[];
        permissions_by_module: any;
    }>;
    private resolveAuthContext;
}
