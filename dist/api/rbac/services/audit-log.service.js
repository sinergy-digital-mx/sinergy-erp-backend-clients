"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuditLogService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogService = exports.AuditResult = exports.AuditAction = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_log_entity_1 = require("../../../entities/rbac/audit-log.entity");
const tenant_context_service_1 = require("./tenant-context.service");
var audit_log_entity_2 = require("../../../entities/rbac/audit-log.entity");
Object.defineProperty(exports, "AuditAction", { enumerable: true, get: function () { return audit_log_entity_2.AuditAction; } });
Object.defineProperty(exports, "AuditResult", { enumerable: true, get: function () { return audit_log_entity_2.AuditResult; } });
let AuditLogService = AuditLogService_1 = class AuditLogService {
    auditLogRepository;
    tenantContextService;
    logger = new common_1.Logger(AuditLogService_1.name);
    constructor(auditLogRepository, tenantContextService) {
        this.auditLogRepository = auditLogRepository;
        this.tenantContextService = tenantContextService;
    }
    async createAuditLog(data) {
        try {
            const tenantId = data.tenantId || this.tenantContextService.getCurrentTenantId() || undefined;
            const auditLog = this.auditLogRepository.create({
                ...data,
                tenantId,
            });
            const savedLog = await this.auditLogRepository.save(auditLog);
            this.logger.log(`Audit: ${data.action} - ${data.result}`, {
                auditId: savedLog.id,
                userId: data.userId,
                actorId: data.actorId,
                tenantId,
                resourceType: data.resourceType,
                resourceId: data.resourceId,
                details: data.details,
            });
            return savedLog;
        }
        catch (error) {
            this.logger.error('Failed to create audit log', error.stack, {
                action: data.action,
                userId: data.userId,
                tenantId: data.tenantId,
            });
            throw error;
        }
    }
    async logPermissionChange(action, userId, actorId, permissionId, entityType, permissionAction, tenantId, metadata) {
        return this.createAuditLog({
            action,
            result: audit_log_entity_1.AuditResult.SUCCESS,
            userId,
            actorId,
            tenantId,
            permissionId,
            entityType,
            permissionAction,
            resourceType: 'permission',
            resourceId: permissionId,
            details: `${action === audit_log_entity_1.AuditAction.PERMISSION_GRANTED ? 'Granted' : 'Revoked'} permission ${permissionAction} on ${entityType}`,
            metadata,
        });
    }
    async logRoleAssignment(action, userId, actorId, roleId, tenantId, metadata) {
        return this.createAuditLog({
            action,
            result: audit_log_entity_1.AuditResult.SUCCESS,
            userId,
            actorId,
            tenantId,
            roleId,
            resourceType: 'role',
            resourceId: roleId,
            details: `${action === audit_log_entity_1.AuditAction.ROLE_ASSIGNED ? 'Assigned' : 'Unassigned'} role to user`,
            metadata,
        });
    }
    async logAccessAttempt(granted, userId, entityType, permissionAction, resourceId, tenantId, errorMessage, ipAddress, userAgent, metadata) {
        return this.createAuditLog({
            action: granted ? audit_log_entity_1.AuditAction.ACCESS_GRANTED : audit_log_entity_1.AuditAction.ACCESS_DENIED,
            result: granted ? audit_log_entity_1.AuditResult.SUCCESS : audit_log_entity_1.AuditResult.FAILURE,
            userId,
            tenantId,
            entityType,
            permissionAction,
            resourceType: entityType.toLowerCase(),
            resourceId,
            details: `Access ${granted ? 'granted' : 'denied'} for ${permissionAction} on ${entityType}`,
            errorMessage,
            ipAddress,
            userAgent,
            metadata,
        });
    }
    async logRoleManagement(action, actorId, roleId, tenantId, details, metadata) {
        return this.createAuditLog({
            action,
            result: audit_log_entity_1.AuditResult.SUCCESS,
            actorId,
            tenantId,
            roleId,
            resourceType: 'role',
            resourceId: roleId,
            details: details || `Role ${action.replace('role_', '')}`,
            metadata,
        });
    }
    async logPermissionManagement(action, actorId, permissionId, entityType, permissionAction, tenantId, details, metadata) {
        return this.createAuditLog({
            action,
            result: audit_log_entity_1.AuditResult.SUCCESS,
            actorId,
            tenantId,
            permissionId,
            entityType,
            permissionAction,
            resourceType: 'permission',
            resourceId: permissionId,
            details: details || `Permission ${action.replace('permission_', '')} for ${permissionAction} on ${entityType}`,
            metadata,
        });
    }
    async logTenantManagement(action, actorId, tenantId, details, metadata) {
        return this.createAuditLog({
            action,
            result: audit_log_entity_1.AuditResult.SUCCESS,
            actorId,
            tenantId,
            resourceType: 'tenant',
            resourceId: tenantId,
            details: details || `Tenant ${action.replace('tenant_', '')}`,
            metadata,
        });
    }
    async queryAuditLogs(options = {}) {
        const { userId, actorId, tenantId, action, result, resourceType, entityType, roleId, startDate, endDate, limit = 100, offset = 0, } = options;
        const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log')
            .leftJoinAndSelect('audit_log.tenant', 'tenant');
        if (userId) {
            queryBuilder.andWhere('audit_log.userId = :userId', { userId });
        }
        if (actorId) {
            queryBuilder.andWhere('audit_log.actorId = :actorId', { actorId });
        }
        if (tenantId) {
            queryBuilder.andWhere('audit_log.tenantId = :tenantId', { tenantId });
        }
        if (action) {
            queryBuilder.andWhere('audit_log.action = :action', { action });
        }
        if (result) {
            queryBuilder.andWhere('audit_log.result = :result', { result });
        }
        if (resourceType) {
            queryBuilder.andWhere('audit_log.resourceType = :resourceType', { resourceType });
        }
        if (entityType) {
            queryBuilder.andWhere('audit_log.entityType = :entityType', { entityType });
        }
        if (roleId) {
            queryBuilder.andWhere('audit_log.roleId = :roleId', { roleId });
        }
        if (startDate && endDate) {
            queryBuilder.andWhere('audit_log.createdAt BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            });
        }
        else if (startDate) {
            queryBuilder.andWhere('audit_log.createdAt >= :startDate', { startDate });
        }
        else if (endDate) {
            queryBuilder.andWhere('audit_log.createdAt <= :endDate', { endDate });
        }
        queryBuilder.orderBy('audit_log.createdAt', 'DESC');
        const total = await queryBuilder.getCount();
        queryBuilder.skip(offset).take(limit);
        const logs = await queryBuilder.getMany();
        return { logs, total };
    }
    async getUserAuditLogs(userId, tenantId, limit = 50, offset = 0) {
        return this.queryAuditLogs({
            userId,
            tenantId,
            limit,
            offset,
        });
    }
    async getRoleAuditLogs(roleId, tenantId, limit = 50, offset = 0) {
        return this.queryAuditLogs({
            roleId,
            tenantId,
            limit,
            offset,
        });
    }
    async getAuditLogsByDateRange(startDate, endDate, tenantId, limit = 100, offset = 0) {
        return this.queryAuditLogs({
            startDate,
            endDate,
            tenantId,
            limit,
            offset,
        });
    }
    async getFailedAccessAttempts(tenantId, hours = 24, limit = 100) {
        const startDate = new Date();
        startDate.setHours(startDate.getHours() - hours);
        return this.queryAuditLogs({
            action: audit_log_entity_1.AuditAction.ACCESS_DENIED,
            result: audit_log_entity_1.AuditResult.FAILURE,
            startDate,
            tenantId,
            limit,
        });
    }
    async getPermissionChanges(tenantId, days = 30, limit = 100) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log')
            .leftJoinAndSelect('audit_log.tenant', 'tenant')
            .where('audit_log.action IN (:...actions)', {
            actions: [
                audit_log_entity_1.AuditAction.PERMISSION_GRANTED,
                audit_log_entity_1.AuditAction.PERMISSION_REVOKED,
                audit_log_entity_1.AuditAction.ROLE_ASSIGNED,
                audit_log_entity_1.AuditAction.ROLE_UNASSIGNED,
            ],
        })
            .andWhere('audit_log.createdAt >= :startDate', { startDate });
        if (tenantId) {
            queryBuilder.andWhere('audit_log.tenantId = :tenantId', { tenantId });
        }
        queryBuilder
            .orderBy('audit_log.createdAt', 'DESC')
            .take(limit);
        const logs = await queryBuilder.getMany();
        const total = await queryBuilder.getCount();
        return { logs, total };
    }
    async getAuditStatistics(tenantId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log')
            .where('audit_log.createdAt >= :startDate', { startDate });
        if (tenantId) {
            queryBuilder.andWhere('audit_log.tenantId = :tenantId', { tenantId });
        }
        const logs = await queryBuilder.getMany();
        const totalLogs = logs.length;
        const successfulActions = logs.filter(log => log.result === audit_log_entity_1.AuditResult.SUCCESS).length;
        const failedActions = logs.filter(log => log.result === audit_log_entity_1.AuditResult.FAILURE).length;
        const actionBreakdown = logs.reduce((acc, log) => {
            acc[log.action] = (acc[log.action] || 0) + 1;
            return acc;
        }, {});
        const userActivity = logs.reduce((acc, log) => {
            if (log.userId) {
                acc[log.userId] = (acc[log.userId] || 0) + 1;
            }
            return acc;
        }, {});
        const dailyActivity = logs.reduce((acc, log) => {
            const date = log.createdAt.toISOString().split('T')[0];
            const existing = acc.find(item => item.date === date);
            if (existing) {
                existing.count++;
            }
            else {
                acc.push({ date, count: 1 });
            }
            return acc;
        }, []);
        return {
            totalLogs,
            successfulActions,
            failedActions,
            actionBreakdown,
            userActivity,
            dailyActivity: dailyActivity.sort((a, b) => a.date.localeCompare(b.date)),
        };
    }
    async searchAuditLogs(searchTerm, tenantId, limit = 100, offset = 0) {
        const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log')
            .leftJoinAndSelect('audit_log.tenant', 'tenant')
            .where('(audit_log.details ILIKE :searchTerm OR audit_log.errorMessage ILIKE :searchTerm)', {
            searchTerm: `%${searchTerm}%`,
        });
        if (tenantId) {
            queryBuilder.andWhere('audit_log.tenantId = :tenantId', { tenantId });
        }
        queryBuilder.orderBy('audit_log.createdAt', 'DESC');
        const total = await queryBuilder.getCount();
        queryBuilder.skip(offset).take(limit);
        const logs = await queryBuilder.getMany();
        return { logs, total };
    }
    async getComplianceExport(startDate, endDate, tenantId, actions) {
        const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log')
            .leftJoinAndSelect('audit_log.tenant', 'tenant')
            .where('audit_log.createdAt BETWEEN :startDate AND :endDate', {
            startDate,
            endDate,
        });
        if (tenantId) {
            queryBuilder.andWhere('audit_log.tenantId = :tenantId', { tenantId });
        }
        if (actions && actions.length > 0) {
            queryBuilder.andWhere('audit_log.action IN (:...actions)', { actions });
        }
        queryBuilder.orderBy('audit_log.createdAt', 'ASC');
        return queryBuilder.getMany();
    }
    async getUserRecentActivity(userId, tenantId, hours = 24, limit = 50) {
        const startDate = new Date();
        startDate.setHours(startDate.getHours() - hours);
        const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log')
            .leftJoinAndSelect('audit_log.tenant', 'tenant')
            .where('(audit_log.userId = :userId OR audit_log.actorId = :userId)', { userId })
            .andWhere('audit_log.createdAt >= :startDate', { startDate });
        if (tenantId) {
            queryBuilder.andWhere('audit_log.tenantId = :tenantId', { tenantId });
        }
        queryBuilder
            .orderBy('audit_log.createdAt', 'DESC')
            .take(limit);
        return queryBuilder.getMany();
    }
    async getSuspiciousActivity(tenantId, hours = 24) {
        const startDate = new Date();
        startDate.setHours(startDate.getHours() - hours);
        const failedAttemptsQuery = this.auditLogRepository.createQueryBuilder('audit_log')
            .select('audit_log.userId', 'userId')
            .addSelect('COUNT(*)', 'count')
            .addSelect('MAX(audit_log.createdAt)', 'lastAttempt')
            .where('audit_log.action = :action', { action: audit_log_entity_1.AuditAction.ACCESS_DENIED })
            .andWhere('audit_log.createdAt >= :startDate', { startDate })
            .andWhere('audit_log.userId IS NOT NULL');
        if (tenantId) {
            failedAttemptsQuery.andWhere('audit_log.tenantId = :tenantId', { tenantId });
        }
        const multipleFailedAttempts = await failedAttemptsQuery
            .groupBy('audit_log.userId')
            .having('COUNT(*) >= 5')
            .getRawMany();
        const permissionChangesQuery = this.auditLogRepository.createQueryBuilder('audit_log')
            .where('audit_log.action IN (:...actions)', {
            actions: [audit_log_entity_1.AuditAction.PERMISSION_GRANTED, audit_log_entity_1.AuditAction.PERMISSION_REVOKED],
        })
            .andWhere('audit_log.createdAt >= :startDate', { startDate });
        if (tenantId) {
            permissionChangesQuery.andWhere('audit_log.tenantId = :tenantId', { tenantId });
        }
        const unusualPermissionChanges = await permissionChangesQuery
            .orderBy('audit_log.createdAt', 'DESC')
            .getMany();
        const crossTenantQuery = this.auditLogRepository.createQueryBuilder('audit_log')
            .where('audit_log.action = :action', { action: audit_log_entity_1.AuditAction.ACCESS_DENIED })
            .andWhere('audit_log.errorMessage ILIKE :error', { error: '%tenant%' })
            .andWhere('audit_log.createdAt >= :startDate', { startDate });
        if (tenantId) {
            crossTenantQuery.andWhere('audit_log.tenantId = :tenantId', { tenantId });
        }
        const crossTenantAttempts = await crossTenantQuery
            .orderBy('audit_log.createdAt', 'DESC')
            .getMany();
        return {
            multipleFailedAttempts,
            unusualPermissionChanges,
            crossTenantAttempts,
        };
    }
};
exports.AuditLogService = AuditLogService;
exports.AuditLogService = AuditLogService = AuditLogService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        tenant_context_service_1.TenantContextService])
], AuditLogService);
//# sourceMappingURL=audit-log.service.js.map