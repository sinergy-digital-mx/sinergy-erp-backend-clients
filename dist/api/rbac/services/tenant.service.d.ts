import { Repository } from 'typeorm';
import { RBACTenant } from '../../../entities/rbac/tenant.entity';
import { Role } from '../../../entities/rbac/role.entity';
import { UserRole } from '../../../entities/rbac/user-role.entity';
import { RolePermission } from '../../../entities/rbac/role-permission.entity';
import { AuditLog } from '../../../entities/rbac/audit-log.entity';
import { RoleTemplateService, BulkRoleCreationResult } from './role-template.service';
import { AuditLogService } from './audit-log.service';
import { ConfigService } from '@nestjs/config';
export interface TenantCreationOptions {
    name: string;
    subdomain: string;
    isActive?: boolean;
    skipSystemRoles?: boolean;
    customRoleTemplates?: Array<{
        name: string;
        description: string;
        permissions: Array<{
            entityType: string;
            actions: string[];
        }>;
    }>;
}
export interface TenantCreationResult {
    tenant: RBACTenant;
    systemRoles: BulkRoleCreationResult;
    customRoles: BulkRoleCreationResult;
    warnings: string[];
}
export interface TenantDeletionResult {
    tenantId: string;
    tenantName: string;
    deletedAt: Date;
    cascadeResults: {
        userRoles: number;
        rolePermissions: number;
        roles: number;
        auditLogs: number;
    };
    warnings: string[];
}
export interface TenantDataCounts {
    userRoles: number;
    rolePermissions: number;
    roles: number;
    auditLogs: number;
    activeUsers: number;
}
export declare class TenantService {
    private tenantRepository;
    private roleRepository;
    private userRoleRepository;
    private rolePermissionRepository;
    private auditLogRepository;
    private roleTemplateService;
    private auditLogService;
    private configService;
    private readonly logger;
    constructor(tenantRepository: Repository<RBACTenant>, roleRepository: Repository<Role>, userRoleRepository: Repository<UserRole>, rolePermissionRepository: Repository<RolePermission>, auditLogRepository: Repository<AuditLog>, roleTemplateService: RoleTemplateService, auditLogService: AuditLogService, configService: ConfigService);
    createTenant(options: TenantCreationOptions): Promise<TenantCreationResult>;
    getTenantById(tenantId: string): Promise<RBACTenant | null>;
    getTenantBySubdomain(subdomain: string): Promise<RBACTenant | null>;
    initializeRolesForTenant(tenantId: string, skipExisting?: boolean): Promise<{
        systemRoles: BulkRoleCreationResult;
        customRoles: BulkRoleCreationResult;
        warnings: string[];
    }>;
    updateTenantStatus(tenantId: string, isActive: boolean): Promise<RBACTenant>;
    deleteTenant(tenantId: string, actorId?: string): Promise<TenantDeletionResult>;
    deleteTenantLegacy(tenantId: string): Promise<void>;
    private validateTenantOptions;
    private checkTenantUniqueness;
    private getCustomRoleTemplatesFromConfig;
    private validateCustomTemplates;
    private createCustomRolesForTenant;
    private getTenantDataCounts;
    private validateTenantDeletion;
    private performCascadeDeletion;
    private logTenantDeletion;
    validateOrphanedReferences(tenantId: string): Promise<string[]>;
}
