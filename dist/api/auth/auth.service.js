"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("../../entities/users/user.entity");
const user_billing_branch_entity_1 = require("../../entities/users/user-billing-branch.entity");
const user_warehouse_assignment_entity_1 = require("../../entities/control-desk/user-warehouse-assignment.entity");
const permission_service_1 = require("../rbac/services/permission.service");
const role_service_1 = require("../rbac/services/role.service");
const user_status_constants_1 = require("../users/user-status.constants");
const pos_user_type_enum_1 = require("../../entities/users/pos-user-type.enum");
let AuthService = AuthService_1 = class AuthService {
    userRepo;
    branchAssignmentRepo;
    warehouseAssignmentRepo;
    jwtService;
    permissionService;
    roleService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(userRepo, branchAssignmentRepo, warehouseAssignmentRepo, jwtService, permissionService, roleService) {
        this.userRepo = userRepo;
        this.branchAssignmentRepo = branchAssignmentRepo;
        this.warehouseAssignmentRepo = warehouseAssignmentRepo;
        this.jwtService = jwtService;
        this.permissionService = permissionService;
        this.roleService = roleService;
    }
    async login(email, password) {
        const user = await this.userRepo.findOne({
            where: { email },
            relations: ['tenant', 'status', 'billing_branch'],
        });
        if (!user) {
            this.logger.warn(`Login attempt with non-existent email: ${email}`);
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            this.logger.warn(`Invalid password for user: ${email}`);
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!(0, user_status_constants_1.isActiveUserStatus)(user.status?.code)) {
            this.logger.warn(`Login blocked for inactive user: ${email}`);
            throw new common_1.UnauthorizedException('Tu cuenta no está activa');
        }
        user.last_login_at = new Date();
        await this.userRepo.save(user);
        let userRoles = [];
        let userPermissions = [];
        let permissionsByModule = {};
        try {
            userRoles = await this.roleService.getUserRoles(user.id, user.tenant.id.toString());
            userPermissions = await this.permissionService.getUserPermissions(user.id, user.tenant.id.toString());
            permissionsByModule = userPermissions.reduce((acc, perm) => {
                const moduleName = perm.module?.name || 'System';
                if (!acc[moduleName]) {
                    acc[moduleName] = [];
                }
                acc[moduleName].push({
                    id: perm.id,
                    action: perm.action,
                    description: perm.description,
                });
                return acc;
            }, {});
            this.logger.debug(`User ${user.id} has ${userRoles.length} roles and ${userPermissions.length} permissions in tenant ${user.tenant.id}`);
        }
        catch (error) {
            this.logger.error(`Failed to load RBAC data for user ${user.id}: ${error.message}`);
        }
        const permissionsForJwt = userPermissions.map(permission => `${permission.entity_type.toLowerCase()}:${permission.action}`);
        const payload = {
            sub: user.id,
            email: user.email,
            tenant_id: user.tenant.id,
            status: user.status.code,
            roles: userRoles.map(role => ({
                id: role.id,
                name: role.name,
                isSystemRole: role.is_system_role,
            })),
            permissions: permissionsForJwt,
            permissions_version: user.permissions_version,
            hasAdminRole: userRoles.some(role => role.name === 'Admin'),
            permissionCount: userPermissions.length,
            iat: Math.floor(Date.now() / 1000),
        };
        const accessToken = this.jwtService.sign(payload);
        this.logger.log(`Successful login for user ${email} in tenant ${user.tenant.id}`);
        return {
            access_token: accessToken,
            user: {
                id: user.id,
                email: user.email,
                tenant_id: user.tenant.id,
                status: user.status.code,
                roles: userRoles.map(role => role.name),
                permissions: permissionsByModule,
                permissions_flat: permissionsForJwt,
                permissions_version: user.permissions_version,
                last_login_at: user.last_login_at,
                ...this.mapPosSessionFields(user),
                ...(await this.loadSessionBranchFields(user.id, user.tenant.id.toString())),
                assigned_warehouses: await this.loadAssignedWarehouses(user.id, user.tenant.id.toString()),
            },
        };
    }
    async refreshToken(userId, tenantId) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['tenant', 'status', 'billing_branch'],
        });
        if (!user || user.tenant.id.toString() !== tenantId) {
            throw new common_1.UnauthorizedException('Invalid user or tenant');
        }
        const userRoles = await this.roleService.getUserRoles(userId, tenantId);
        const userPermissions = await this.permissionService.getUserPermissions(userId, tenantId);
        const permissionsForJwt = userPermissions.map(permission => `${permission.entity_type.toLowerCase()}:${permission.action}`);
        const payload = {
            sub: user.id,
            email: user.email,
            tenant_id: user.tenant.id,
            status: user.status.code,
            roles: userRoles.map(role => ({
                id: role.id,
                name: role.name,
                isSystemRole: role.is_system_role,
            })),
            permissions: permissionsForJwt,
            permissions_version: user.permissions_version,
            hasAdminRole: userRoles.some(role => role.name === 'Admin'),
            permissionCount: userPermissions.length,
            iat: Math.floor(Date.now() / 1000),
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                tenant_id: user.tenant.id,
                status: user.status.code,
                roles: userRoles.map(role => role.name),
                permissions_flat: permissionsForJwt,
                permissions_version: user.permissions_version,
                ...this.mapPosSessionFields(user),
                ...(await this.loadSessionBranchFields(user.id, user.tenant.id.toString())),
                assigned_warehouses: await this.loadAssignedWarehouses(user.id, user.tenant.id.toString()),
            },
        };
    }
    async loadSessionBranchFields(userId, tenantId) {
        const assigned_branches = await this.loadAssignedBranches(userId, tenantId);
        const primary = assigned_branches.find((row) => row.is_primary) ?? assigned_branches[0];
        return {
            assigned_branches,
            primary_billing_branch_id: primary?.id ?? null,
            can_switch_branch: assigned_branches.length > 1,
        };
    }
    async loadAssignedBranches(userId, tenantId) {
        const rows = await this.branchAssignmentRepo.find({
            where: { tenant_id: tenantId, user_id: userId },
            relations: ['billing_branch', 'billing_branch.fiscal_configuration'],
        });
        return rows
            .filter((row) => row.billing_branch)
            .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
            .map((row) => ({
            id: row.billing_branch.id,
            code: row.billing_branch.code,
            city: row.billing_branch.city,
            display_name: [row.billing_branch.code, row.billing_branch.city]
                .filter(Boolean)
                .join(' — '),
            is_primary: Boolean(row.is_primary),
            fiscal_configuration_id: row.billing_branch.fiscal_configuration_id,
        }));
    }
    async loadAssignedWarehouses(userId, tenantId) {
        const rows = await this.warehouseAssignmentRepo.find({
            where: { tenant_id: tenantId, user_id: userId },
            relations: ['warehouse', 'warehouse.billing_branch'],
        });
        return rows
            .filter((row) => row.warehouse)
            .map((row) => ({
            id: row.warehouse.id,
            name: row.warehouse.name,
            code: row.warehouse.code,
            billing_branch_id: row.warehouse.billing_branch_id,
            billing_branch: row.warehouse.billing_branch
                ? {
                    id: row.warehouse.billing_branch.id,
                    code: row.warehouse.billing_branch.code,
                    display_name: [
                        row.warehouse.billing_branch.code,
                        row.warehouse.billing_branch.city,
                    ]
                        .filter(Boolean)
                        .join(' — '),
                }
                : null,
        }));
    }
    mapPosSessionFields(user) {
        return {
            is_pos_user: Boolean(user.is_pos_user),
            pos_user_type: user.is_pos_user ? user.pos_user_type : null,
            pos_can_sell: Boolean(user.is_pos_user) && (0, pos_user_type_enum_1.canPosSell)(user.pos_user_type),
            pos_can_collect: Boolean(user.is_pos_user) && (0, pos_user_type_enum_1.canPosCollect)(user.pos_user_type),
            billing_branch_id: user.billing_branch_id ?? null,
            fiscal_configuration_id: user.billing_branch?.fiscal_configuration_id ?? null,
            is_employee: Boolean(user.is_employee),
            is_manager: Boolean(user.is_manager),
        };
    }
    async refresh(userId, tenantId) {
        return this.refreshToken(userId, tenantId);
    }
    async validateUserWithRBAC(userId, tenantId) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['tenant', 'status'],
        });
        if (!user) {
            return null;
        }
        if (user.tenant.id.toString() !== tenantId) {
            const hasAccess = await this.permissionService.validateUserTenantAccess(userId, tenantId);
            if (!hasAccess) {
                return null;
            }
        }
        const userRoles = await this.roleService.getUserRoles(userId, tenantId);
        const userPermissions = await this.permissionService.getUserPermissions(userId, tenantId);
        return {
            id: user.id,
            email: user.email,
            tenant_id: tenantId,
            status: user.status.code,
            roles: userRoles,
            permissions: userPermissions,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(user_billing_branch_entity_1.UserBillingBranch)),
    __param(2, (0, typeorm_1.InjectRepository)(user_warehouse_assignment_entity_1.UserWarehouseAssignment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        permission_service_1.PermissionService,
        role_service_1.RoleService])
], AuthService);
//# sourceMappingURL=auth.service.js.map