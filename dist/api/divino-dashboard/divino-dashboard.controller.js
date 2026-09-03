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
exports.DivinoDashboardController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const tenant_context_service_1 = require("../rbac/services/tenant-context.service");
const divino_dashboard_service_1 = require("./divino-dashboard.service");
const query_divino_dashboard_dto_1 = require("./dto/query-divino-dashboard.dto");
let DivinoDashboardController = class DivinoDashboardController {
    divinoDashboardService;
    tenantContext;
    constructor(divinoDashboardService, tenantContext) {
        this.divinoDashboardService = divinoDashboardService;
        this.tenantContext = tenantContext;
    }
    getSummary(query) {
        return this.divinoDashboardService.getSummary(this.getTenantId(), query);
    }
    getSellers(query) {
        return this.divinoDashboardService.getSellers(this.getTenantId(), query);
    }
    getLeadOrigins(query) {
        return this.divinoDashboardService.getLeadOrigins(this.getTenantId(), query);
    }
    getRevenueSeries(query) {
        return this.divinoDashboardService.getRevenueSeries(this.getTenantId(), query);
    }
    getTenantId() {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return tenantId;
    }
};
exports.DivinoDashboardController = DivinoDashboardController;
__decorate([
    (0, common_1.Get)('summary'),
    (0, require_permissions_decorator_1.RequirePermission)('DivinoDashboard', 'Read'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_divino_dashboard_dto_1.QueryDivinoDashboardDto]),
    __metadata("design:returntype", void 0)
], DivinoDashboardController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('sellers'),
    (0, require_permissions_decorator_1.RequirePermission)('DivinoDashboard', 'Read'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_divino_dashboard_dto_1.QueryDivinoDashboardDto]),
    __metadata("design:returntype", void 0)
], DivinoDashboardController.prototype, "getSellers", null);
__decorate([
    (0, common_1.Get)('lead-origins'),
    (0, require_permissions_decorator_1.RequirePermission)('DivinoDashboard', 'Read'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_divino_dashboard_dto_1.QueryDivinoDashboardDto]),
    __metadata("design:returntype", void 0)
], DivinoDashboardController.prototype, "getLeadOrigins", null);
__decorate([
    (0, common_1.Get)('revenue-series'),
    (0, require_permissions_decorator_1.RequirePermission)('DivinoDashboard', 'Read'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_divino_dashboard_dto_1.QueryRevenueSeriesDto]),
    __metadata("design:returntype", void 0)
], DivinoDashboardController.prototype, "getRevenueSeries", null);
exports.DivinoDashboardController = DivinoDashboardController = __decorate([
    (0, common_1.Controller)('tenant/divino-dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [divino_dashboard_service_1.DivinoDashboardService,
        tenant_context_service_1.TenantContextService])
], DivinoDashboardController);
//# sourceMappingURL=divino-dashboard.controller.js.map