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
exports.DownpaymentPaymentsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const require_permissions_decorator_1 = require("../../rbac/decorators/require-permissions.decorator");
const permission_guard_1 = require("../../rbac/guards/permission.guard");
const tenant_context_service_1 = require("../../rbac/services/tenant-context.service");
const record_partial_payment_dto_1 = require("../dto/record-partial-payment.dto");
const create_manual_downpayment_payment_dto_1 = require("./dto/create-manual-downpayment-payment.dto");
const generate_downpayment_payments_dto_1 = require("./dto/generate-downpayment-payments.dto");
const update_downpayment_payment_dto_1 = require("./dto/update-downpayment-payment.dto");
const update_downpayment_target_dto_1 = require("./dto/update-downpayment-target.dto");
const downpayment_payments_service_1 = require("./downpayment-payments.service");
let DownpaymentPaymentsController = class DownpaymentPaymentsController {
    downpaymentPaymentsService;
    tenantContext;
    constructor(downpaymentPaymentsService, tenantContext) {
        this.downpaymentPaymentsService = downpaymentPaymentsService;
        this.tenantContext = tenantContext;
    }
    async createManual(contractId, dto) {
        return this.downpaymentPaymentsService.createManualDownpaymentPayment(this.getTenantIdOrThrow(), contractId, dto);
    }
    async generate(contractId, dto) {
        return this.downpaymentPaymentsService.generateDownpaymentPayments(this.getTenantIdOrThrow(), contractId, dto ?? {});
    }
    async updateTarget(contractId, dto) {
        return this.downpaymentPaymentsService.updateDownpaymentTarget(this.getTenantIdOrThrow(), contractId, dto.down_payment_target);
    }
    async list(contractId) {
        return this.downpaymentPaymentsService.getDownpaymentPayments(this.getTenantIdOrThrow(), contractId);
    }
    async stats(contractId) {
        return this.downpaymentPaymentsService.getDownpaymentPaymentStats(this.getTenantIdOrThrow(), contractId);
    }
    async pay(contractId, paymentId, dto) {
        return this.downpaymentPaymentsService.recordDownpaymentPayment(this.getTenantIdOrThrow(), contractId, paymentId, dto.amount, dto.payment_date, dto.payment_method, dto.reference_number, dto.notes);
    }
    async update(contractId, paymentId, dto) {
        return this.downpaymentPaymentsService.updateDownpaymentPayment(this.getTenantIdOrThrow(), contractId, paymentId, dto);
    }
    async cancel(contractId, paymentId) {
        return this.downpaymentPaymentsService.cancelDownpaymentPayment(this.getTenantIdOrThrow(), contractId, paymentId);
    }
    async reset(contractId, paymentId) {
        return this.downpaymentPaymentsService.resetDownpaymentPayment(this.getTenantIdOrThrow(), contractId, paymentId);
    }
    async delete(contractId, paymentId) {
        await this.downpaymentPaymentsService.deleteDownpaymentPayment(this.getTenantIdOrThrow(), contractId, paymentId);
        return { message: 'Down payment deleted successfully' };
    }
    async markOverdue(contractId) {
        const updatedCount = await this.downpaymentPaymentsService.markOverdueDownpaymentPayments(this.getTenantIdOrThrow(), contractId);
        return {
            message: `Marked ${updatedCount} downpayment payments as overdue`,
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
exports.DownpaymentPaymentsController = DownpaymentPaymentsController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Create' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_manual_downpayment_payment_dto_1.CreateManualDownpaymentPaymentDto]),
    __metadata("design:returntype", Promise)
], DownpaymentPaymentsController.prototype, "createManual", null);
__decorate([
    (0, common_1.Post)('generate'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Create' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, generate_downpayment_payments_dto_1.GenerateDownpaymentPaymentsDto]),
    __metadata("design:returntype", Promise)
], DownpaymentPaymentsController.prototype, "generate", null);
__decorate([
    (0, common_1.Put)('target'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Update' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_downpayment_target_dto_1.UpdateDownpaymentTargetDto]),
    __metadata("design:returntype", Promise)
], DownpaymentPaymentsController.prototype, "updateTarget", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Read' }),
    __param(0, (0, common_1.Param)('contractId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DownpaymentPaymentsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Read' }),
    __param(0, (0, common_1.Param)('contractId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DownpaymentPaymentsController.prototype, "stats", null);
__decorate([
    (0, common_1.Post)(':paymentId/pay'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Update' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Param)('paymentId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, record_partial_payment_dto_1.RecordPartialPaymentDto]),
    __metadata("design:returntype", Promise)
], DownpaymentPaymentsController.prototype, "pay", null);
__decorate([
    (0, common_1.Put)(':paymentId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Update' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Param)('paymentId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_downpayment_payment_dto_1.UpdateDownpaymentPaymentDto]),
    __metadata("design:returntype", Promise)
], DownpaymentPaymentsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':paymentId/cancel'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Update' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Param)('paymentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DownpaymentPaymentsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)(':paymentId/reset'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Update' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Param)('paymentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DownpaymentPaymentsController.prototype, "reset", null);
__decorate([
    (0, common_1.Delete)(':paymentId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Delete' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Param)('paymentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DownpaymentPaymentsController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)('mark-overdue'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Update' }),
    __param(0, (0, common_1.Param)('contractId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DownpaymentPaymentsController.prototype, "markOverdue", null);
exports.DownpaymentPaymentsController = DownpaymentPaymentsController = __decorate([
    (0, common_1.Controller)('tenant/contracts/:contractId/downpayment-payments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [downpayment_payments_service_1.DownpaymentPaymentsService,
        tenant_context_service_1.TenantContextService])
], DownpaymentPaymentsController);
//# sourceMappingURL=downpayment-payments.controller.js.map