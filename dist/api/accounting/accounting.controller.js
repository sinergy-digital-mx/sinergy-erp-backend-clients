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
exports.AccountingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const accounting_service_1 = require("./accounting.service");
const query_accounting_base_dto_1 = require("./dto/query-accounting-base.dto");
let AccountingController = class AccountingController {
    accountingService;
    constructor(accountingService) {
        this.accountingService = accountingService;
    }
    getPosSummary(query, req) {
        return this.accountingService.getPosSummary(req.user.tenant_id, query);
    }
    getPosTerminalSales(terminalUserId, query, req) {
        return this.accountingService.getPosTerminalSales(req.user.tenant_id, terminalUserId, query);
    }
    getPosCollections(query, req) {
        return this.accountingService.getPosCollections(req.user.tenant_id, query);
    }
    getAccountsPayable(query, req) {
        return this.accountingService.getAccountsPayable(req.user.tenant_id, query);
    }
    getAccountsPayableDetail(vendorId, req) {
        return this.accountingService.getAccountsPayableDetail(req.user.tenant_id, vendorId);
    }
    getAccountsReceivable(query, req) {
        return this.accountingService.getAccountsReceivable(req.user.tenant_id, query);
    }
    getAccountsReceivableDetail(razonSocial, billingBranchId, req) {
        return this.accountingService.getAccountsReceivableDetail(req.user.tenant_id, razonSocial, billingBranchId);
    }
};
exports.AccountingController = AccountingController;
__decorate([
    (0, common_1.Get)('pos-summary'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Accounting', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Resumen POS por sucursal',
        description: 'Ventas por terminal VENTAS y métricas de cobranza. Si hay un corte abierto de un día anterior, incluye unclosed_shift_alert en la raíz.',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_accounting_base_dto_1.QueryAccountingBaseDto, Object]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "getPosSummary", null);
__decorate([
    (0, common_1.Get)('pos-terminals/:terminalUserId/sales'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Accounting', action: 'Read' }),
    (0, swagger_1.ApiParam)({ name: 'terminalUserId', description: 'UUID del usuario terminal POS' }),
    (0, swagger_1.ApiOperation)({ summary: 'Detalle de ventas de una terminal POS' }),
    __param(0, (0, common_1.Param)('terminalUserId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_accounting_base_dto_1.QueryPosTerminalSalesDto, Object]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "getPosTerminalSales", null);
__decorate([
    (0, common_1.Get)('pos-collections'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Accounting', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Detalle de órdenes cobradas (terminal de cobranza)',
        description: 'Lista cobros del periodo/sucursal. Filtro customer_type: all | walk_in | invoiced.',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_accounting_base_dto_1.QueryPosCollectionsDto, Object]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "getPosCollections", null);
__decorate([
    (0, common_1.Get)('accounts-payable'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Accounting', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Cuentas por pagar agrupadas por proveedor' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_accounting_base_dto_1.QueryAccountsPayableDto, Object]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "getAccountsPayable", null);
__decorate([
    (0, common_1.Get)('accounts-payable/vendors/:vendorId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Accounting', action: 'Read' }),
    (0, swagger_1.ApiParam)({ name: 'vendorId', description: 'UUID del proveedor' }),
    (0, swagger_1.ApiOperation)({ summary: 'Detalle de órdenes de compra pendientes de un proveedor' }),
    __param(0, (0, common_1.Param)('vendorId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "getAccountsPayableDetail", null);
__decorate([
    (0, common_1.Get)('accounts-receivable'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Accounting', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Cuentas por cobrar agrupadas por razón social' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_accounting_base_dto_1.QueryAccountsReceivableDto, Object]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "getAccountsReceivable", null);
__decorate([
    (0, common_1.Get)('accounts-receivable/by-razon-social/:razonSocial/orders'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Accounting', action: 'Read' }),
    (0, swagger_1.ApiParam)({
        name: 'razonSocial',
        description: 'Razón social codificada (encodeURIComponent)',
    }),
    (0, swagger_1.ApiOperation)({ summary: 'Detalle de órdenes pendientes por razón social' }),
    __param(0, (0, common_1.Param)('razonSocial')),
    __param(1, (0, common_1.Query)('billing_branch_id')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "getAccountsReceivableDetail", null);
exports.AccountingController = AccountingController = __decorate([
    (0, swagger_1.ApiTags)('Accounting'),
    (0, common_1.Controller)('tenant/accounting'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [accounting_service_1.AccountingService])
], AccountingController);
//# sourceMappingURL=accounting.controller.js.map