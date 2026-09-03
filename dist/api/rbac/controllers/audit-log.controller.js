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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogController = exports.AuditLogQueryDto = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const permission_guard_1 = require("../guards/permission.guard");
const require_permissions_decorator_1 = require("../decorators/require-permissions.decorator");
const audit_log_service_1 = require("../services/audit-log.service");
const audit_log_entity_1 = require("../../../entities/rbac/audit-log.entity");
const tenant_context_service_1 = require("../services/tenant-context.service");
class AuditLogQueryDto {
    userId;
    actorId;
    action;
    result;
    resourceType;
    entityType;
    startDate;
    endDate;
    limit;
    offset;
}
exports.AuditLogQueryDto = AuditLogQueryDto;
let AuditLogController = class AuditLogController {
    auditLogService;
    tenantContextService;
    constructor(auditLogService, tenantContextService) {
        this.auditLogService = auditLogService;
        this.tenantContextService = tenantContextService;
    }
    async getAuditLogs(userId, actorId, action, result, resourceType, entityType, startDate, endDate, limit = 100, offset = 0) {
        const tenantId = this.tenantContextService.getCurrentTenantId() || undefined;
        const queryOptions = {
            userId,
            actorId,
            tenantId,
            action,
            result,
            resourceType,
            entityType,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            limit: Math.min(limit, 1000),
            offset,
        };
        return this.auditLogService.queryAuditLogs(queryOptions);
    }
    async getUserAuditLogs(userId, limit = 50, offset = 0) {
        const tenantId = this.tenantContextService.getCurrentTenantId() || undefined;
        return this.auditLogService.getUserAuditLogs(userId, tenantId, limit, offset);
    }
    async getRoleAuditLogs(roleId, limit = 50, offset = 0) {
        const tenantId = this.tenantContextService.getCurrentTenantId() || undefined;
        return this.auditLogService.getRoleAuditLogs(roleId, tenantId, limit, offset);
    }
    async getFailedAccessAttempts(hours = 24, limit = 100) {
        const tenantId = this.tenantContextService.getCurrentTenantId() || undefined;
        return this.auditLogService.getFailedAccessAttempts(tenantId, hours, limit);
    }
    async getPermissionChanges(days = 30, limit = 100) {
        const tenantId = this.tenantContextService.getCurrentTenantId() || undefined;
        return this.auditLogService.getPermissionChanges(tenantId, days, limit);
    }
    async getAuditLogsByDateRange(startDate, endDate, limit = 100, offset = 0) {
        const tenantId = this.tenantContextService.getCurrentTenantId() || undefined;
        if (!startDate || !endDate) {
            throw new Error('Both startDate and endDate are required');
        }
        return this.auditLogService.getAuditLogsByDateRange(new Date(startDate), new Date(endDate), tenantId, limit, offset);
    }
    async getSecuritySummary(hours = 24) {
        const tenantId = this.tenantContextService.getCurrentTenantId() || undefined;
        const [failedAttempts, permissionChanges] = await Promise.all([
            this.auditLogService.getFailedAccessAttempts(tenantId, hours, 1000),
            this.auditLogService.getPermissionChanges(tenantId, 1, 1000),
        ]);
        const failedByUser = failedAttempts.logs.reduce((acc, log) => {
            if (log.userId) {
                acc[log.userId] = (acc[log.userId] || 0) + 1;
            }
            return acc;
        }, {});
        const changesByType = permissionChanges.logs.reduce((acc, log) => {
            acc[log.action] = (acc[log.action] || 0) + 1;
            return acc;
        }, {});
        return {
            timeRange: `${hours} hours`,
            failedAccessAttempts: {
                total: failedAttempts.total,
                byUser: failedByUser,
                topUsers: Object.entries(failedByUser)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([userId, count]) => ({ userId, count })),
            },
            permissionChanges: {
                total: permissionChanges.total,
                byType: changesByType,
            },
        };
    }
    async getAuditStatistics(days = 30) {
        const tenantId = this.tenantContextService.getCurrentTenantId() || undefined;
        return this.auditLogService.getAuditStatistics(tenantId, days);
    }
    async searchAuditLogs(searchTerm, limit = 100, offset = 0) {
        if (!searchTerm) {
            throw new Error('Search term is required');
        }
        const tenantId = this.tenantContextService.getCurrentTenantId() || undefined;
        return this.auditLogService.searchAuditLogs(searchTerm, tenantId, limit, offset);
    }
    async getComplianceExport(startDate, endDate, actions) {
        if (!startDate || !endDate) {
            throw new Error('Both startDate and endDate are required');
        }
        const tenantId = this.tenantContextService.getCurrentTenantId() || undefined;
        const actionList = actions ? actions.split(',') : undefined;
        return this.auditLogService.getComplianceExport(new Date(startDate), new Date(endDate), tenantId, actionList);
    }
    async getUserRecentActivity(userId, hours = 24, limit = 50) {
        const tenantId = this.tenantContextService.getCurrentTenantId() || undefined;
        return this.auditLogService.getUserRecentActivity(userId, tenantId, hours, limit);
    }
    async getSuspiciousActivity(hours = 24) {
        const tenantId = this.tenantContextService.getCurrentTenantId() || undefined;
        return this.auditLogService.getSuspiciousActivity(tenantId, hours);
    }
};
exports.AuditLogController = AuditLogController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'AuditLog', action: 'Read' }),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('actorId')),
    __param(2, (0, common_1.Query)('action')),
    __param(3, (0, common_1.Query)('result')),
    __param(4, (0, common_1.Query)('resourceType')),
    __param(5, (0, common_1.Query)('entityType')),
    __param(6, (0, common_1.Query)('startDate')),
    __param(7, (0, common_1.Query)('endDate')),
    __param(8, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(100), common_1.ParseIntPipe)),
    __param(9, (0, common_1.Query)('offset', new common_1.DefaultValuePipe(0), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'AuditLog', action: 'Read' }),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(50), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('offset', new common_1.DefaultValuePipe(0), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "getUserAuditLogs", null);
__decorate([
    (0, common_1.Get)('role/:roleId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'AuditLog', action: 'Read' }),
    __param(0, (0, common_1.Query)('roleId')),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(50), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('offset', new common_1.DefaultValuePipe(0), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "getRoleAuditLogs", null);
__decorate([
    (0, common_1.Get)('failed-access'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'AuditLog', action: 'Read' }),
    __param(0, (0, common_1.Query)('hours', new common_1.DefaultValuePipe(24), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(100), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "getFailedAccessAttempts", null);
__decorate([
    (0, common_1.Get)('permission-changes'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'AuditLog', action: 'Read' }),
    __param(0, (0, common_1.Query)('days', new common_1.DefaultValuePipe(30), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(100), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "getPermissionChanges", null);
__decorate([
    (0, common_1.Get)('date-range'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'AuditLog', action: 'Read' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(100), common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('offset', new common_1.DefaultValuePipe(0), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "getAuditLogsByDateRange", null);
__decorate([
    (0, common_1.Get)('security-summary'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'AuditLog', action: 'Read' }),
    __param(0, (0, common_1.Query)('hours', new common_1.DefaultValuePipe(24), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "getSecuritySummary", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'AuditLog', action: 'Read' }),
    __param(0, (0, common_1.Query)('days', new common_1.DefaultValuePipe(30), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "getAuditStatistics", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'AuditLog', action: 'Read' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(100), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('offset', new common_1.DefaultValuePipe(0), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "searchAuditLogs", null);
__decorate([
    (0, common_1.Get)('compliance-export'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'AuditLog', action: 'Export' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('actions')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "getComplianceExport", null);
__decorate([
    (0, common_1.Get)('user/:userId/recent-activity'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'AuditLog', action: 'Read' }),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('hours', new common_1.DefaultValuePipe(24), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(50), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "getUserRecentActivity", null);
__decorate([
    (0, common_1.Get)('suspicious-activity'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'AuditLog', action: 'Read' }),
    __param(0, (0, common_1.Query)('hours', new common_1.DefaultValuePipe(24), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "getSuspiciousActivity", null);
exports.AuditLogController = AuditLogController = __decorate([
    (0, common_1.Controller)('rbac/audit-logs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [audit_log_service_1.AuditLogService,
        tenant_context_service_1.TenantContextService])
], AuditLogController);
//# sourceMappingURL=audit-log.controller.js.map