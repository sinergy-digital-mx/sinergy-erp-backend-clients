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
exports.HoaPaymentsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const require_permissions_decorator_1 = require("../../rbac/decorators/require-permissions.decorator");
const permission_guard_1 = require("../../rbac/guards/permission.guard");
const tenant_context_service_1 = require("../../rbac/services/tenant-context.service");
const generate_hoa_payments_dto_1 = require("./dto/generate-hoa-payments.dto");
const record_hoa_payment_dto_1 = require("./dto/record-hoa-payment.dto");
const update_hoa_payment_dto_1 = require("./dto/update-hoa-payment.dto");
const hoa_payments_service_1 = require("./hoa-payments.service");
let HoaPaymentsController = class HoaPaymentsController {
    hoaPaymentsService;
    tenantContext;
    constructor(hoaPaymentsService, tenantContext) {
        this.hoaPaymentsService = hoaPaymentsService;
        this.tenantContext = tenantContext;
    }
    async generateHoaPayments(contractId, dto) {
        const tenantId = this.getTenantIdOrThrow();
        return this.hoaPaymentsService.generateHoaPayments(tenantId, contractId, dto);
    }
    async getHoaPayments(contractId) {
        const tenantId = this.getTenantIdOrThrow();
        return this.hoaPaymentsService.getContractHoaPayments(tenantId, contractId);
    }
    async getHoaPaymentStats(contractId) {
        const tenantId = this.getTenantIdOrThrow();
        return this.hoaPaymentsService.getHoaPaymentStats(tenantId, contractId);
    }
    async getHoaPayment(contractId, paymentId) {
        const tenantId = this.getTenantIdOrThrow();
        return this.hoaPaymentsService.getHoaPayment(tenantId, contractId, paymentId);
    }
    async updateHoaPayment(contractId, paymentId, dto) {
        const tenantId = this.getTenantIdOrThrow();
        return this.hoaPaymentsService.updateHoaPayment(tenantId, contractId, paymentId, dto);
    }
    async recordHoaPayment(contractId, paymentId, dto) {
        const tenantId = this.getTenantIdOrThrow();
        return this.hoaPaymentsService.recordHoaPayment(tenantId, contractId, paymentId, dto);
    }
    async cancelHoaPayment(contractId, paymentId) {
        const tenantId = this.getTenantIdOrThrow();
        return this.hoaPaymentsService.cancelHoaPayment(tenantId, contractId, paymentId);
    }
    async resetHoaPayment(contractId, paymentId) {
        const tenantId = this.getTenantIdOrThrow();
        return this.hoaPaymentsService.resetHoaPayment(tenantId, contractId, paymentId);
    }
    async deleteHoaPayment(contractId, paymentId) {
        const tenantId = this.getTenantIdOrThrow();
        await this.hoaPaymentsService.deleteHoaPayment(tenantId, contractId, paymentId);
        return { message: 'HOA payment deleted successfully' };
    }
    async markOverdueHoaPayments(contractId) {
        const tenantId = this.getTenantIdOrThrow();
        const updatedCount = await this.hoaPaymentsService.markOverdueHoaPayments(tenantId, contractId);
        return {
            message: `Marked ${updatedCount} HOA payments as overdue`,
            updated_count: updatedCount,
        };
    }
    getTenantIdOrThrow() {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return tenantId;
    }
};
exports.HoaPaymentsController = HoaPaymentsController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Create' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, generate_hoa_payments_dto_1.GenerateHoaPaymentsDto]),
    __metadata("design:returntype", Promise)
], HoaPaymentsController.prototype, "generateHoaPayments", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Read' }),
    __param(0, (0, common_1.Param)('contractId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HoaPaymentsController.prototype, "getHoaPayments", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Read' }),
    __param(0, (0, common_1.Param)('contractId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HoaPaymentsController.prototype, "getHoaPaymentStats", null);
__decorate([
    (0, common_1.Get)(':paymentId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Read' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Param)('paymentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], HoaPaymentsController.prototype, "getHoaPayment", null);
__decorate([
    (0, common_1.Put)(':paymentId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Update' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Param)('paymentId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_hoa_payment_dto_1.UpdateHoaPaymentDto]),
    __metadata("design:returntype", Promise)
], HoaPaymentsController.prototype, "updateHoaPayment", null);
__decorate([
    (0, common_1.Post)(':paymentId/pay'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Update' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Param)('paymentId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, record_hoa_payment_dto_1.RecordHoaPaymentDto]),
    __metadata("design:returntype", Promise)
], HoaPaymentsController.prototype, "recordHoaPayment", null);
__decorate([
    (0, common_1.Post)(':paymentId/cancel'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Update' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Param)('paymentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], HoaPaymentsController.prototype, "cancelHoaPayment", null);
__decorate([
    (0, common_1.Post)(':paymentId/reset'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Update' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Param)('paymentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], HoaPaymentsController.prototype, "resetHoaPayment", null);
__decorate([
    (0, common_1.Delete)(':paymentId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Delete' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Param)('paymentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], HoaPaymentsController.prototype, "deleteHoaPayment", null);
__decorate([
    (0, common_1.Post)('mark-overdue'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Update' }),
    __param(0, (0, common_1.Param)('contractId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HoaPaymentsController.prototype, "markOverdueHoaPayments", null);
exports.HoaPaymentsController = HoaPaymentsController = __decorate([
    (0, common_1.Controller)('tenant/contracts/:contractId/hoa-payments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [hoa_payments_service_1.HoaPaymentsService,
        tenant_context_service_1.TenantContextService])
], HoaPaymentsController);
//# sourceMappingURL=hoa-payments.controller.js.map