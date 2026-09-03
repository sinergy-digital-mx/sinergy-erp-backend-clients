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
exports.CustomerActivitiesController = void 0;
const common_1 = require("@nestjs/common");
const customer_activities_service_1 = require("./customer-activities.service");
const create_customer_activity_dto_1 = require("./dto/create-customer-activity.dto");
const update_customer_activity_dto_1 = require("./dto/update-customer-activity.dto");
const query_customer_activity_dto_1 = require("./dto/query-customer-activity.dto");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const tenant_context_service_1 = require("../rbac/services/tenant-context.service");
let CustomerActivitiesController = class CustomerActivitiesController {
    activitiesService;
    tenantContext;
    constructor(activitiesService, tenantContext) {
        this.activitiesService = activitiesService;
        this.tenantContext = tenantContext;
    }
    async create(customerId, createActivityDto, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.activitiesService.create(customerId, createActivityDto, req.user.sub, tenantId);
    }
    async findAll(customerId, query, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.activitiesService.findAll(customerId, query, tenantId);
    }
    async getActivitySummary(customerId, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.activitiesService.getActivitySummary(customerId, tenantId);
    }
    async findOne(customerId, id, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.activitiesService.findOne(customerId, id, tenantId);
    }
    async update(customerId, id, updateActivityDto, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.activitiesService.update(customerId, id, updateActivityDto, req.user.sub, tenantId);
    }
};
exports.CustomerActivitiesController = CustomerActivitiesController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Update' }),
    __param(0, (0, common_1.Param)('customerId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_customer_activity_dto_1.CreateCustomerActivityDto, Object]),
    __metadata("design:returntype", Promise)
], CustomerActivitiesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Read' }),
    __param(0, (0, common_1.Param)('customerId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, query_customer_activity_dto_1.QueryCustomerActivityDto, Object]),
    __metadata("design:returntype", Promise)
], CustomerActivitiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Read' }),
    __param(0, (0, common_1.Param)('customerId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], CustomerActivitiesController.prototype, "getActivitySummary", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Read' }),
    __param(0, (0, common_1.Param)('customerId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", Promise)
], CustomerActivitiesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Update' }),
    __param(0, (0, common_1.Param)('customerId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, update_customer_activity_dto_1.UpdateCustomerActivityDto, Object]),
    __metadata("design:returntype", Promise)
], CustomerActivitiesController.prototype, "update", null);
exports.CustomerActivitiesController = CustomerActivitiesController = __decorate([
    (0, common_1.Controller)('tenant/customers/:customerId/activities'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [customer_activities_service_1.CustomerActivitiesService,
        tenant_context_service_1.TenantContextService])
], CustomerActivitiesController);
//# sourceMappingURL=customer-activities.controller.js.map