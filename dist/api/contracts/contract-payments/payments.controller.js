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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const permission_guard_1 = require("../../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../../rbac/decorators/require-permissions.decorator");
const tenant_context_service_1 = require("../../rbac/services/tenant-context.service");
const payments_service_1 = require("./payments.service");
const record_partial_payment_dto_1 = require("../dto/record-partial-payment.dto");
const generate_contract_payments_dto_1 = require("./dto/generate-contract-payments.dto");
let PaymentsController = class PaymentsController {
    paymentsService;
    tenantContext;
    constructor(paymentsService, tenantContext) {
        this.paymentsService = paymentsService;
        this.tenantContext = tenantContext;
    }
    async generatePayments(contractId, dto = {}, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.paymentsService.generatePaymentsForContract(tenantId, contractId, dto ?? {});
    }
    async regeneratePayments(contractId, dto = {}, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.paymentsService.regeneratePaymentsForContract(tenantId, contractId, dto ?? {});
    }
    async getPayments(contractId, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.paymentsService.getContractPayments(tenantId, contractId);
    }
    async getStats(contractId, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.paymentsService.getContractPaymentStats(tenantId, contractId);
    }
    async previewSchedule(contractId, startDate) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.paymentsService.previewPaymentSchedule(tenantId, contractId, startDate);
    }
    async getPayment(contractId, paymentId, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.paymentsService.getPayment(tenantId, paymentId);
    }
    async updatePayment(contractId, paymentId, body, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.paymentsService.updatePayment(tenantId, paymentId, body);
    }
    async recordPayment(contractId, paymentId, dto, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.paymentsService.recordPayment(tenantId, paymentId, dto.amount, dto.payment_date, dto.payment_method, dto.reference_number, dto.notes);
    }
    async cancelPayment(contractId, paymentId, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.paymentsService.cancelPayment(tenantId, paymentId);
    }
    async resetPayment(contractId, paymentId, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.paymentsService.resetPayment(tenantId, paymentId);
    }
    async deletePayment(contractId, paymentId, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        await this.paymentsService.deletePayment(tenantId, paymentId);
        return { message: 'Payment deleted successfully' };
    }
    async markOverduePayments(contractId, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const updatedCount = await this.paymentsService.markOverduePayments(tenantId);
        return {
            message: `Marked ${updatedCount} payments as overdue`,
            updated_count: updatedCount,
        };
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Create' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, generate_contract_payments_dto_1.GenerateContractPaymentsDto, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "generatePayments", null);
__decorate([
    (0, common_1.Post)('regenerate'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Create' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, generate_contract_payments_dto_1.GenerateContractPaymentsDto, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "regeneratePayments", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Read' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getPayments", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Read' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('schedule-preview'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Read' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Query)('start_date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "previewSchedule", null);
__decorate([
    (0, common_1.Get)(':paymentId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Read' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Param)('paymentId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getPayment", null);
__decorate([
    (0, common_1.Put)(':paymentId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Update' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Param)('paymentId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "updatePayment", null);
__decorate([
    (0, common_1.Post)(':paymentId/pay'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Update' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Param)('paymentId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, record_partial_payment_dto_1.RecordPartialPaymentDto, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "recordPayment", null);
__decorate([
    (0, common_1.Post)(':paymentId/cancel'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Update' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Param)('paymentId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "cancelPayment", null);
__decorate([
    (0, common_1.Post)(':paymentId/reset'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Update' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Param)('paymentId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "resetPayment", null);
__decorate([
    (0, common_1.Delete)(':paymentId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Delete' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Param)('paymentId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "deletePayment", null);
__decorate([
    (0, common_1.Post)('mark-overdue'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Update' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "markOverduePayments", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)('tenant/contracts/:contractId/payments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService,
        tenant_context_service_1.TenantContextService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map