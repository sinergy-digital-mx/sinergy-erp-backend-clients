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
exports.DataCleanupController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const permission_guard_1 = require("../guards/permission.guard");
const require_permissions_decorator_1 = require("../decorators/require-permissions.decorator");
const data_cleanup_service_1 = require("../services/data-cleanup.service");
const tenant_context_service_1 = require("../services/tenant-context.service");
class CleanupOptionsDto {
    dryRun = true;
    batchSize = 1000;
    cleanupUserRoles = true;
    cleanupRolePermissions = true;
    cleanupUnusedRoles = true;
    cleanupUnusedPermissions = true;
    cleanupEmptyTenants = false;
    cleanupOldAuditLogs = false;
    auditLogRetentionDays = 365;
    tenantId;
}
class IntegrityCheckDto {
    tenantId;
}
let DataCleanupController = class DataCleanupController {
    dataCleanupService;
    tenantContextService;
    constructor(dataCleanupService, tenantContextService) {
        this.dataCleanupService = dataCleanupService;
        this.tenantContextService = tenantContextService;
    }
    async performCleanup(options) {
        this.validateCleanupOptions(options);
        if (this.dataCleanupService.isCleanupInProgress()) {
            throw new common_1.BadRequestException('Cleanup operation is already in progress');
        }
        if (options.tenantId) {
            const currentTenantId = this.tenantContextService.getCurrentTenantId();
            if (options.tenantId !== currentTenantId) {
                throw new common_1.ForbiddenException('Cannot perform cleanup for different tenant');
            }
        }
        return await this.dataCleanupService.performCleanup(options);
    }
    async performIntegrityCheck(options) {
        if (options.tenantId) {
            const currentTenantId = this.tenantContextService.getCurrentTenantId();
            if (options.tenantId !== currentTenantId) {
                throw new common_1.ForbiddenException('Cannot perform integrity check for different tenant');
            }
        }
        return await this.dataCleanupService.performIntegrityCheck(options.tenantId);
    }
    async getLastCleanupResult() {
        return this.dataCleanupService.getLastCleanupResult();
    }
    async getLastIntegrityCheck() {
        return this.dataCleanupService.getLastIntegrityCheck();
    }
    async getCleanupStatus() {
        const lastCleanup = this.dataCleanupService.getLastCleanupResult();
        const lastIntegrityCheck = this.dataCleanupService.getLastIntegrityCheck();
        return {
            isRunning: this.dataCleanupService.isCleanupInProgress(),
            lastCleanupAt: lastCleanup ? new Date(Date.now() - lastCleanup.executionTime) : null,
            lastIntegrityCheckAt: lastIntegrityCheck ? lastIntegrityCheck.checkedAt : null,
        };
    }
    async getMaintenanceSchedule() {
        return this.dataCleanupService.getMaintenanceSchedule();
    }
    async previewCleanup(options) {
        this.validateCleanupOptions(options);
        const previewOptions = { ...options, dryRun: true };
        if (previewOptions.tenantId) {
            const currentTenantId = this.tenantContextService.getCurrentTenantId();
            if (previewOptions.tenantId !== currentTenantId) {
                throw new common_1.ForbiddenException('Cannot preview cleanup for different tenant');
            }
        }
        const result = await this.dataCleanupService.performCleanup(previewOptions);
        const totalItems = Object.values(result.statistics).reduce((sum, count) => sum + count, 0);
        const estimatedSeconds = Math.max(1, Math.ceil(totalItems / 1000));
        const estimatedExecutionTime = estimatedSeconds < 60
            ? `${estimatedSeconds} seconds`
            : `${Math.ceil(estimatedSeconds / 60)} minutes`;
        const recommendations = [];
        const warnings = [...result.warnings];
        if (result.statistics.orphanedUserRoles > 0) {
            recommendations.push(`${result.statistics.orphanedUserRoles} orphaned user roles will be removed`);
        }
        if (result.statistics.orphanedRolePermissions > 0) {
            recommendations.push(`${result.statistics.orphanedRolePermissions} orphaned role permissions will be removed`);
        }
        if (result.statistics.unusedRoles > 0) {
            recommendations.push(`${result.statistics.unusedRoles} unused roles will be removed`);
        }
        if (result.statistics.unusedPermissions > 0) {
            recommendations.push(`${result.statistics.unusedPermissions} unused permissions will be removed`);
        }
        if (result.statistics.emptyTenants > 0) {
            recommendations.push(`${result.statistics.emptyTenants} empty tenants will be removed`);
            warnings.push('Tenant deletion is irreversible - ensure these tenants are truly unused');
        }
        if (result.statistics.oldAuditLogs > 0) {
            recommendations.push(`${result.statistics.oldAuditLogs} old audit logs will be removed`);
            warnings.push('Audit log deletion may impact compliance requirements');
        }
        if (totalItems === 0) {
            recommendations.push('No cleanup needed - system is clean');
        }
        return {
            wouldCleanup: result.statistics,
            estimatedExecutionTime,
            recommendations,
            warnings,
        };
    }
    async getSystemHealth(tenantId) {
        if (tenantId) {
            const currentTenantId = this.tenantContextService.getCurrentTenantId();
            if (tenantId !== currentTenantId) {
                throw new common_1.ForbiddenException('Cannot check health for different tenant');
            }
        }
        const lastIntegrityCheck = this.dataCleanupService.getLastIntegrityCheck();
        const schedule = this.dataCleanupService.getMaintenanceSchedule();
        let overallHealth = 'healthy';
        let criticalIssues = 0;
        let highIssues = 0;
        let mediumIssues = 0;
        let lowIssues = 0;
        if (lastIntegrityCheck) {
            criticalIssues = lastIntegrityCheck.issues.filter(i => i.severity === 'critical').length;
            highIssues = lastIntegrityCheck.issues.filter(i => i.severity === 'high').length;
            mediumIssues = lastIntegrityCheck.issues.filter(i => i.severity === 'medium').length;
            lowIssues = lastIntegrityCheck.issues.filter(i => i.severity === 'low').length;
            if (criticalIssues > 0) {
                overallHealth = 'critical';
            }
            else if (highIssues > 0 || mediumIssues > 5) {
                overallHealth = 'warning';
            }
        }
        const cleanupRecommended = criticalIssues > 0 || highIssues > 0 || mediumIssues > 3;
        return {
            overallHealth,
            lastChecked: lastIntegrityCheck?.checkedAt || null,
            criticalIssues,
            highIssues,
            mediumIssues,
            lowIssues,
            cleanupRecommended,
            nextScheduledCleanup: schedule.enabled ? schedule.schedule : null,
            quickStats: lastIntegrityCheck?.performance || {
                totalUsers: 0,
                totalRoles: 0,
                totalPermissions: 0,
                totalTenants: 0,
            },
        };
    }
    validateCleanupOptions(options) {
        if (options.batchSize && (options.batchSize < 1 || options.batchSize > 10000)) {
            throw new common_1.BadRequestException('Batch size must be between 1 and 10000');
        }
        if (options.auditLogRetentionDays && options.auditLogRetentionDays < 1) {
            throw new common_1.BadRequestException('Audit log retention days must be at least 1');
        }
        if (options.cleanupEmptyTenants && !options.dryRun) {
        }
        if (options.cleanupOldAuditLogs && !options.dryRun && (options.auditLogRetentionDays || 365) < 90) {
            throw new common_1.BadRequestException('Audit log retention period less than 90 days requires explicit confirmation');
        }
    }
};
exports.DataCleanupController = DataCleanupController;
__decorate([
    (0, common_1.Post)('perform'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'System', action: 'Maintain' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Perform data cleanup',
        description: 'Execute data cleanup operations to remove orphaned data and maintain system integrity. Defaults to dry run for safety.',
    }),
    (0, swagger_1.ApiBody)({ type: CleanupOptionsDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Cleanup operation completed successfully',
        schema: {
            type: 'object',
            properties: {
                executionTime: { type: 'number', description: 'Execution time in milliseconds' },
                dryRun: { type: 'boolean', description: 'Whether this was a dry run' },
                statistics: {
                    type: 'object',
                    properties: {
                        orphanedUserRoles: { type: 'number' },
                        orphanedRolePermissions: { type: 'number' },
                        unusedRoles: { type: 'number' },
                        unusedPermissions: { type: 'number' },
                        emptyTenants: { type: 'number' },
                        oldAuditLogs: { type: 'number' },
                    },
                },
                actions: { type: 'array', items: { type: 'string' } },
                warnings: { type: 'array', items: { type: 'string' } },
                errors: { type: 'array', items: { type: 'string' } },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid cleanup options' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Insufficient permissions' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Cleanup operation already in progress' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CleanupOptionsDto]),
    __metadata("design:returntype", Promise)
], DataCleanupController.prototype, "performCleanup", null);
__decorate([
    (0, common_1.Post)('integrity-check'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'System', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Perform data integrity check',
        description: 'Check system data integrity and identify potential issues without making changes.',
    }),
    (0, swagger_1.ApiBody)({ type: IntegrityCheckDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Integrity check completed successfully',
        schema: {
            type: 'object',
            properties: {
                isHealthy: { type: 'boolean', description: 'Overall system health status' },
                checkedAt: { type: 'string', format: 'date-time' },
                issues: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            type: { type: 'string', enum: ['orphaned_data', 'missing_reference', 'duplicate_data', 'constraint_violation', 'performance_issue'] },
                            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                            description: { type: 'string' },
                            affectedCount: { type: 'number' },
                            recommendation: { type: 'string' },
                            tenantId: { type: 'string', nullable: true },
                        },
                    },
                },
                performance: {
                    type: 'object',
                    properties: {
                        totalUsers: { type: 'number' },
                        totalRoles: { type: 'number' },
                        totalPermissions: { type: 'number' },
                        totalUserRoles: { type: 'number' },
                        totalRolePermissions: { type: 'number' },
                        totalTenants: { type: 'number' },
                        averageRolesPerUser: { type: 'number' },
                        averagePermissionsPerRole: { type: 'number' },
                    },
                },
                recommendations: { type: 'array', items: { type: 'string' } },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Insufficient permissions' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [IntegrityCheckDto]),
    __metadata("design:returntype", Promise)
], DataCleanupController.prototype, "performIntegrityCheck", null);
__decorate([
    (0, common_1.Get)('last-cleanup'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'System', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get last cleanup result',
        description: 'Retrieve the results of the most recent cleanup operation.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Last cleanup result retrieved successfully',
        schema: {
            type: 'object',
            nullable: true,
            properties: {
                executionTime: { type: 'number' },
                dryRun: { type: 'boolean' },
                statistics: { type: 'object' },
                actions: { type: 'array', items: { type: 'string' } },
                warnings: { type: 'array', items: { type: 'string' } },
                errors: { type: 'array', items: { type: 'string' } },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Insufficient permissions' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DataCleanupController.prototype, "getLastCleanupResult", null);
__decorate([
    (0, common_1.Get)('last-integrity-check'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'System', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get last integrity check result',
        description: 'Retrieve the results of the most recent integrity check.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Last integrity check result retrieved successfully',
        schema: {
            type: 'object',
            nullable: true,
            properties: {
                isHealthy: { type: 'boolean' },
                checkedAt: { type: 'string', format: 'date-time' },
                issues: { type: 'array' },
                performance: { type: 'object' },
                recommendations: { type: 'array', items: { type: 'string' } },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Insufficient permissions' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DataCleanupController.prototype, "getLastIntegrityCheck", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'System', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get cleanup status',
        description: 'Check if a cleanup operation is currently in progress.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Cleanup status retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                isRunning: { type: 'boolean', description: 'Whether cleanup is currently running' },
                lastCleanupAt: { type: 'string', format: 'date-time', nullable: true },
                lastIntegrityCheckAt: { type: 'string', format: 'date-time', nullable: true },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Insufficient permissions' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DataCleanupController.prototype, "getCleanupStatus", null);
__decorate([
    (0, common_1.Get)('maintenance-schedule'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'System', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get maintenance schedule',
        description: 'Retrieve the current maintenance schedule configuration.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Maintenance schedule retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                enabled: { type: 'boolean' },
                schedule: { type: 'string', description: 'Cron expression' },
                defaultOptions: { type: 'object' },
                notifyOnCompletion: { type: 'boolean' },
                notificationEmails: { type: 'array', items: { type: 'string' } },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Insufficient permissions' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DataCleanupController.prototype, "getMaintenanceSchedule", null);
__decorate([
    (0, common_1.Post)('preview'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'System', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Preview cleanup operation',
        description: 'Preview what would be cleaned up without making any changes. Always performs a dry run.',
    }),
    (0, swagger_1.ApiBody)({ type: CleanupOptionsDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Cleanup preview completed successfully',
        schema: {
            type: 'object',
            properties: {
                wouldCleanup: {
                    type: 'object',
                    properties: {
                        orphanedUserRoles: { type: 'number' },
                        orphanedRolePermissions: { type: 'number' },
                        unusedRoles: { type: 'number' },
                        unusedPermissions: { type: 'number' },
                        emptyTenants: { type: 'number' },
                        oldAuditLogs: { type: 'number' },
                    },
                },
                estimatedExecutionTime: { type: 'string', description: 'Estimated time to complete' },
                recommendations: { type: 'array', items: { type: 'string' } },
                warnings: { type: 'array', items: { type: 'string' } },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid cleanup options' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Insufficient permissions' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CleanupOptionsDto]),
    __metadata("design:returntype", Promise)
], DataCleanupController.prototype, "previewCleanup", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'System', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get system health summary',
        description: 'Get a quick overview of system health and data integrity status.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'tenantId', required: false, description: 'Limit health check to specific tenant' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'System health summary retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                overallHealth: { type: 'string', enum: ['healthy', 'warning', 'critical'] },
                lastChecked: { type: 'string', format: 'date-time', nullable: true },
                criticalIssues: { type: 'number' },
                highIssues: { type: 'number' },
                mediumIssues: { type: 'number' },
                lowIssues: { type: 'number' },
                cleanupRecommended: { type: 'boolean' },
                nextScheduledCleanup: { type: 'string', nullable: true },
                quickStats: {
                    type: 'object',
                    properties: {
                        totalUsers: { type: 'number' },
                        totalRoles: { type: 'number' },
                        totalPermissions: { type: 'number' },
                        totalTenants: { type: 'number' },
                    },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Insufficient permissions' }),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DataCleanupController.prototype, "getSystemHealth", null);
exports.DataCleanupController = DataCleanupController = __decorate([
    (0, swagger_1.ApiTags)('RBAC Data Cleanup'),
    (0, common_1.Controller)('rbac/cleanup'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [data_cleanup_service_1.DataCleanupService,
        tenant_context_service_1.TenantContextService])
], DataCleanupController);
//# sourceMappingURL=data-cleanup.controller.js.map