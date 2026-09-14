import { Repository } from 'typeorm';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignUserBranchDto } from './dto/assign-user-branch.dto';
import { UserStatus } from '../../entities/users/user-status.entity';
import { RBACTenant } from '../../entities/rbac/tenant.entity';
import { User } from '../../entities/users/user.entity';
import { UserBillingBranch } from '../../entities/users/user-billing-branch.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { PosUserType } from '../../entities/users/pos-user-type.enum';
import { PosDailyShift } from '../../entities/pos/pos-daily-shift.entity';
import { EmployeesService } from '../employees/employees.service';
import { UserManagerReport } from '../../entities/users/user-manager-report.entity';
import { UserWarehouseAssignment } from '../../entities/control-desk/user-warehouse-assignment.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { QueryUsersDto } from './dto/query-users.dto';
export declare class UsersService {
    private userRepo;
    private tenantRepo;
    private statusRepo;
    private branchRepo;
    private branchAssignmentRepo;
    private dailyShiftRepo;
    private managerReportRepo;
    private warehouseAssignmentRepo;
    private warehouseRepo;
    private employeesService;
    constructor(userRepo: Repository<User>, tenantRepo: Repository<RBACTenant>, statusRepo: Repository<UserStatus>, branchRepo: Repository<BillingBranch>, branchAssignmentRepo: Repository<UserBillingBranch>, dailyShiftRepo: Repository<PosDailyShift>, managerReportRepo: Repository<UserManagerReport>, warehouseAssignmentRepo: Repository<UserWarehouseAssignment>, warehouseRepo: Repository<Warehouse>, employeesService: EmployeesService);
    create(dto: CreateUserDto, tenantId: string): Promise<User>;
    update(id: string, dto: UpdateUserDto, tenantId: string): Promise<User>;
    changePassword(userId: string, dto: ChangePasswordDto, tenantId: string, currentUserId: string, canResetOthers?: boolean): Promise<{
        message: string;
    }>;
    assignBranch(userId: string, tenantId: string, dto: AssignUserBranchDto | string | null): Promise<{
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
    setActiveBranch(userId: string, tenantId: string, billingBranchId: string): Promise<{
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
    getUserBranch(userId: string, tenantId: string): Promise<{
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
    findAllStatuses(): Promise<UserStatus[]>;
    findAll(tenantId: string, query?: QueryUsersDto): Promise<User[]>;
    findOne(id: string, tenantId: string): Promise<User | null>;
    getManagerReports(managerUserId: string, tenantId: string): Promise<{
        is_manager: boolean;
        reports: {
            id: string;
            email: string | null;
            first_name: string;
            last_name: string;
            phone: string;
            status: UserStatus;
        }[];
    }>;
    addManagerReport(managerUserId: string, reportUserId: string, tenantId: string): Promise<{
        id: string;
        email: string | null;
        first_name: string;
        last_name: string;
        phone: string;
        status: UserStatus;
    }>;
    removeManagerReport(managerUserId: string, reportUserId: string, tenantId: string): Promise<void>;
    updateStatus(userId: string, tenantId: string, statusId: number, currentUserId: string): Promise<User>;
    softDelete(userId: string, tenantId: string, currentUserId: string): Promise<User>;
    mapUserResponse(user: User): {
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
        status: UserStatus;
        language_code: string;
        last_login_at: Date | null;
        created_at: Date;
        is_pos_user: boolean;
        pos_user_type: PosUserType | null;
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
    getAssignedWarehouses(userId: string, tenantId: string): Promise<{
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
    replaceAssignedWarehouses(userId: string, tenantId: string, warehouseIds: string[]): Promise<{
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
    mapUserBranchResponse(user: User): {
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
    };
    private loadAssignedWarehouses;
    private getAssignedWarehousesByUserIdMap;
    private assertWarehousesForUser;
    private dropWarehousesOutsideBranches;
    private mapWarehouse;
    private mapBillingBranch;
    private validatePosUserType;
    private validateBranchAssignment;
    private assertCobranzaConfigChangeAllowed;
    private hasOpenDailyShift;
    private resolveBranchAssignmentInput;
    private replaceAssignedBranches;
    private loadAssignedBranchIds;
    private loadAssignedBranches;
    private getAssignedBranchesByUserIdMap;
    private mapAssignedBranch;
    private validateBillingBranches;
    private validateBillingBranch;
    private validatePosFields;
    private getManagerByUserIdMap;
    private loadManagedUsers;
    private mapManagedUser;
    private mapManagerSummary;
}
