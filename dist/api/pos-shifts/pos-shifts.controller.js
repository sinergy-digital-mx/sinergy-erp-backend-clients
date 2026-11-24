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
exports.PosShiftsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const pos_shifts_service_1 = require("./pos-shifts.service");
const quotation_advance_invoice_service_1 = require("../quotations/services/quotation-advance-invoice.service");
const validate_seller_code_dto_1 = require("./dto/validate-seller-code.dto");
const open_daily_shift_dto_1 = require("./dto/open-daily-shift.dto");
const create_partial_shift_dto_1 = require("./dto/create-partial-shift.dto");
const query_daily_shift_dto_1 = require("./dto/query-daily-shift.dto");
const query_pos_branch_dto_1 = require("./dto/query-pos-branch.dto");
const close_daily_shift_dto_1 = require("./dto/close-daily-shift.dto");
const collect_pos_sale_dto_1 = require("./dto/collect-pos-sale.dto");
const query_collected_sales_dto_1 = require("./dto/query-collected-sales.dto");
const replace_pos_sale_cart_dto_1 = require("./dto/replace-pos-sale-cart.dto");
const send_quotation_to_caja_dto_1 = require("./dto/send-quotation-to-caja.dto");
const update_pos_customer_dto_1 = require("./dto/update-pos-customer.dto");
const recall_from_caja_dto_1 = require("./dto/recall-from-caja.dto");
const pos_caja_recall_hub_1 = require("./pos-caja-recall.hub");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
let PosShiftsController = class PosShiftsController {
    posShiftsService;
    quotationAdvances;
    cajaRecallHub;
    constructor(posShiftsService, quotationAdvances, cajaRecallHub) {
        this.posShiftsService = posShiftsService;
        this.quotationAdvances = quotationAdvances;
        this.cajaRecallHub = cajaRecallHub;
    }
    async validateSellerCode(dto, req) {
        return this.posShiftsService.validateSellerCode(req.user.tenant_id, req.user.id, dto.code, dto.billing_branch_id);
    }
    async getCurrentDailyShift(query, req) {
        return this.posShiftsService.getCurrentDailyShiftResponse(req.user.tenant_id, req.user.id, query.billing_branch_id);
    }
    async openDailyShift(dto, req) {
        const { shift, queued_sales_assigned } = await this.posShiftsService.openDailyShift(req.user.tenant_id, req.user.id, dto);
        return {
            message: 'Corte global abierto correctamente',
            daily_shift: shift,
            queued_sales_assigned,
        };
    }
    async findDailyShifts(query, req) {
        const shifts = await this.posShiftsService.findDailyShifts(req.user.tenant_id, query);
        return { daily_shifts: shifts };
    }
    async findDailyShiftById(id, req) {
        return {
            daily_shift: await this.posShiftsService.findDailyShiftById(id, req.user.tenant_id),
        };
    }
    async createPartialShift(id, dto, req) {
        const partial = await this.posShiftsService.createPartialShift(req.user.tenant_id, req.user.id, id, dto);
        return {
            message: 'Corte parcial registrado correctamente',
            partial_shift: partial,
        };
    }
    async closeDailyShift(id, dto, req) {
        const shift = await this.posShiftsService.closeDailyShift(req.user.tenant_id, req.user.id, id, dto);
        return {
            message: 'Corte global cerrado correctamente',
            daily_shift: shift,
        };
    }
    async getPendingSales(query, req) {
        const sales = await this.posShiftsService.getPendingSales(req.user.tenant_id, req.user.id, query.billing_branch_id);
        return { pending_sales: sales };
    }
    async getSalesInProgress(query, req) {
        const sales = await this.posShiftsService.getSalesInProgress(req.user.tenant_id, req.user.id, query.billing_branch_id);
        return { sales_in_progress: sales };
    }
    async getCollectedSales(query, req) {
        return this.posShiftsService.getCollectedSales(req.user.tenant_id, req.user.id, query.daily_shift_id, query.billing_branch_id);
    }
    async collectSale(salesOrderId, dto, req) {
        return this.posShiftsService.collectSale(req.user.tenant_id, req.user.id, salesOrderId, dto);
    }
    async collectQuotationAdvance(quotationId, dto, req) {
        return this.quotationAdvances.collectFromPos(quotationId, req.user.tenant_id, req.user.id, dto);
    }
    async returnSaleToVentas(salesOrderId, req) {
        return this.posShiftsService.returnSaleToVentas(req.user.tenant_id, req.user.id, salesOrderId);
    }
    async returnQuotationToVentas(quotationId, req) {
        return this.posShiftsService.returnQuotationToVentas(req.user.tenant_id, req.user.id, quotationId);
    }
    async getSalesAwaitingCaja(query, req) {
        const sales = await this.posShiftsService.getSalesAwaitingCaja(req.user.tenant_id, req.user.id, query.billing_branch_id);
        return { sales_in_caja: sales };
    }
    async recallSaleFromCaja(salesOrderId, dto, req) {
        return this.posShiftsService.recallSaleFromCaja(req.user.tenant_id, req.user.id, salesOrderId, dto?.seller_user_id);
    }
    async recallQuotationFromCaja(quotationId, dto, req) {
        return this.posShiftsService.recallQuotationFromCaja(req.user.tenant_id, req.user.id, quotationId, dto?.seller_user_id);
    }
    cajaRecalls(query, req) {
        const tenantId = req.user.tenant_id;
        const branchId = query.billing_branch_id ?? null;
        return (0, rxjs_1.merge)((0, rxjs_1.interval)(15000).pipe((0, operators_1.map)(() => ({ data: { type: 'ping' } }))), this.cajaRecallHub.stream(tenantId, branchId).pipe((0, operators_1.map)((event) => ({
            data: {
                type: 'recalled',
                id: event.id,
                kind: event.kind,
                folio: event.folio,
                recalled_by_name: event.recalledByName,
                branch_id: event.branchId,
            },
        }))));
    }
    async touchSaleCajaPresence(salesOrderId, req) {
        return this.posShiftsService.touchSaleCajaPresence(req.user.tenant_id, req.user.id, salesOrderId);
    }
    async releaseSaleCajaPresence(salesOrderId, req) {
        return this.posShiftsService.releaseSaleCajaPresence(req.user.tenant_id, req.user.id, salesOrderId);
    }
    async touchQuotationCajaPresence(quotationId, req) {
        return this.posShiftsService.touchQuotationCajaPresence(req.user.tenant_id, req.user.id, quotationId);
    }
    async releaseQuotationCajaPresence(quotationId, req) {
        return this.posShiftsService.releaseQuotationCajaPresence(req.user.tenant_id, req.user.id, quotationId);
    }
    async updateSaleCustomer(salesOrderId, dto, req) {
        return this.posShiftsService.updateSaleCustomer(req.user.tenant_id, req.user.id, salesOrderId, dto);
    }
    async updateQuotationCustomer(quotationId, dto, req) {
        return this.posShiftsService.updateQuotationCustomer(req.user.tenant_id, req.user.id, quotationId, dto);
    }
    async replaceSaleCart(salesOrderId, dto, req) {
        return this.posShiftsService.replaceSaleCart(req.user.tenant_id, req.user.id, salesOrderId, dto, req.user);
    }
    async sendSaleToCaja(salesOrderId, req) {
        return this.posShiftsService.sendSaleToCaja(req.user.tenant_id, req.user.id, salesOrderId);
    }
    async sendQuotationToCaja(quotationId, dto, req) {
        return this.posShiftsService.sendQuotationToCaja(req.user.tenant_id, req.user.id, quotationId, dto, req.user);
    }
    async getSaleCollection(salesOrderId, req) {
        return this.posShiftsService.getSaleCollection(req.user.tenant_id, salesOrderId);
    }
    async getSaleReceipt(salesOrderId, req) {
        return this.posShiftsService.getSaleReceipt(req.user.tenant_id, salesOrderId, req.user.id);
    }
    async getSaleReceiptRaw(salesOrderId, req, res) {
        return this.posShiftsService.getSaleReceiptRaw(req.user.tenant_id, salesOrderId, res);
    }
};
exports.PosShiftsController = PosShiftsController;
__decorate([
    (0, common_1.Post)('validate-seller-code'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'PosShift', action: 'Read' }, { entityType: 'pos', action: 'Read' }, { entityType: 'pos', action: 'Create' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Validar código de vendedor',
        description: 'El usuario POS autenticado envía el código numérico del vendedor y recibe su información',
    }),
    (0, swagger_1.ApiBody)({ type: validate_seller_code_dto_1.ValidateSellerCodeDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [validate_seller_code_dto_1.ValidateSellerCodeDto, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "validateSellerCode", null);
__decorate([
    (0, common_1.Get)('daily-shift/current'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'PosShift', action: 'Read' }, { entityType: 'pos', action: 'Read' }, { entityType: 'pos', action: 'Create' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtener corte global abierto de la sucursal',
        description: 'Si el corte abierto es de un día anterior, incluye unclosed_shift_alert para forzar el cierre antes de continuar.',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_pos_branch_dto_1.QueryPosBranchDto, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "getCurrentDailyShift", null);
__decorate([
    (0, common_1.Post)('daily-shift/open'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'PosShift', action: 'Create' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Abrir corte global del día',
        description: 'Solo terminales POS de tipo COBRANZA',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [open_daily_shift_dto_1.OpenDailyShiftDto, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "openDailyShift", null);
__decorate([
    (0, common_1.Get)('daily-shifts'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'PosShift', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Listar cortes globales' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_daily_shift_dto_1.QueryDailyShiftDto, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "findDailyShifts", null);
__decorate([
    (0, common_1.Get)('daily-shift/:id'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'PosShift', action: 'Read' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Daily shift ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "findDailyShiftById", null);
__decorate([
    (0, common_1.Post)('daily-shift/:id/partial-shifts'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'PosShift', action: 'Update' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar corte parcial con denominaciones' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_partial_shift_dto_1.CreatePartialShiftDto, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "createPartialShift", null);
__decorate([
    (0, common_1.Patch)('daily-shift/:id/close'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'PosShift', action: 'Update' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Cerrar corte global del día' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, close_daily_shift_dto_1.CloseDailyShiftDto, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "closeDailyShift", null);
__decorate([
    (0, common_1.Get)('pending-sales'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'PosShift', action: 'Read' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Ventas y anticipos pendientes de cobro',
        description: 'Solo terminal COBRANZA. Órdenes Surtida + Pendiente y cotizaciones con anticipo por cobrar de la sucursal.',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_pos_branch_dto_1.QueryPosBranchDto, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "getPendingSales", null);
__decorate([
    (0, common_1.Get)('sales-in-progress'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'PosShift', action: 'Read' }, { entityType: 'pos', action: 'Read' }, { entityType: 'pos', action: 'Create' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Tickets POS reintegrados a ventas',
        description: 'Solo terminal VENTAS. Órdenes pos_stage=ventas de la sucursal.',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_pos_branch_dto_1.QueryPosBranchDto, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "getSalesInProgress", null);
__decorate([
    (0, common_1.Get)('collected-sales'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'PosShift', action: 'Read' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Ventas cobradas del corte',
        description: 'Solo terminal COBRANZA. Lista órdenes ya cobradas del corte abierto de la sucursal (o de daily_shift_id indicado).',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_collected_sales_dto_1.QueryCollectedSalesDto, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "getCollectedSales", null);
__decorate([
    (0, common_1.Post)('sales/:salesOrderId/collect'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'PosShift', action: 'Update' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Cobrar venta pendiente',
        description: 'Solo terminal COBRANZA. Registra método de pago, cliente y marca la orden como Pagada.',
    }),
    (0, swagger_1.ApiBody)({ type: collect_pos_sale_dto_1.CollectPosSaleDto }),
    __param(0, (0, common_1.Param)('salesOrderId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, collect_pos_sale_dto_1.CollectPosSaleDto, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "collectSale", null);
__decorate([
    (0, common_1.Post)('quotations/:quotationId/collect-advance'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'PosShift', action: 'Update' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Cobrar anticipo de una cotización',
        description: 'Cobra el monto pedido en la cotización, lo mete al corte abierto y timbra la factura de anticipo.',
    }),
    (0, swagger_1.ApiBody)({ type: collect_pos_sale_dto_1.CollectPosSaleDto }),
    __param(0, (0, common_1.Param)('quotationId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, collect_pos_sale_dto_1.CollectPosSaleDto, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "collectQuotationAdvance", null);
__decorate([
    (0, common_1.Post)('sales/:salesOrderId/return-to-sales'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'pos', action: 'ReturnToSales' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Regresar ticket de caja a ventas',
        description: 'Solo terminal de caja. El folio sale de pendientes para que Ventas edite productos.',
    }),
    __param(0, (0, common_1.Param)('salesOrderId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "returnSaleToVentas", null);
__decorate([
    (0, common_1.Post)('quotations/:quotationId/return-to-sales'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'pos', action: 'ReturnToSales' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Regresar anticipo de caja a ventas',
        description: 'Solo terminal de caja. La cotización sale de por cobrar para que Ventas corrija y la reenvíe.',
    }),
    __param(0, (0, common_1.Param)('quotationId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "returnQuotationToVentas", null);
__decorate([
    (0, common_1.Get)('sales-in-caja'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'PosShift', action: 'Read' }, { entityType: 'pos', action: 'Read' }, { entityType: 'pos', action: 'Create' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Ventas que están en caja',
        description: 'Solo terminal VENTAS. Misma lista que pendientes de cobro, para regresarlas a ventas.',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_pos_branch_dto_1.QueryPosBranchDto, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "getSalesAwaitingCaja", null);
__decorate([
    (0, common_1.Post)('sales/:salesOrderId/recall-from-caja'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'pos', action: 'Create' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Ventas regresa un folio que está en caja',
        description: 'Sale de POS Caja. Si caja lo tenía abierto, el siguiente latido se lo quita.',
    }),
    __param(0, (0, common_1.Param)('salesOrderId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, recall_from_caja_dto_1.RecallFromCajaDto, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "recallSaleFromCaja", null);
__decorate([
    (0, common_1.Post)('quotations/:quotationId/recall-from-caja'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'pos', action: 'Create' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Ventas regresa un anticipo que está en caja' }),
    __param(0, (0, common_1.Param)('quotationId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, recall_from_caja_dto_1.RecallFromCajaDto, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "recallQuotationFromCaja", null);
__decorate([
    (0, common_1.Sse)('caja-recalls'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'PosShift', action: 'Update' }, { entityType: 'pos', action: 'Update' }, { entityType: 'pos', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Aviso en vivo cuando Ventas regresa un folio',
        description: 'Canal de texto que caja mantiene abierto. Al regresar un folio, llega el vendedor y el folio para sacar la venta si la tenían abierta.',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_pos_branch_dto_1.QueryPosBranchDto, Object]),
    __metadata("design:returntype", rxjs_1.Observable)
], PosShiftsController.prototype, "cajaRecalls", null);
__decorate([
    (0, common_1.Post)('sales/:salesOrderId/caja-presence'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'PosShift', action: 'Update' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Caja avisa que tiene el folio abierto' }),
    __param(0, (0, common_1.Param)('salesOrderId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "touchSaleCajaPresence", null);
__decorate([
    (0, common_1.Post)('sales/:salesOrderId/caja-release'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'PosShift', action: 'Update' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Caja suelta el folio' }),
    __param(0, (0, common_1.Param)('salesOrderId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "releaseSaleCajaPresence", null);
__decorate([
    (0, common_1.Post)('quotations/:quotationId/caja-presence'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'PosShift', action: 'Update' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Caja avisa que tiene el anticipo abierto' }),
    __param(0, (0, common_1.Param)('quotationId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "touchQuotationCajaPresence", null);
__decorate([
    (0, common_1.Post)('quotations/:quotationId/caja-release'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'PosShift', action: 'Update' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Caja suelta el anticipo' }),
    __param(0, (0, common_1.Param)('quotationId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "releaseQuotationCajaPresence", null);
__decorate([
    (0, common_1.Patch)('sales/:salesOrderId/customer'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'PosShift', action: 'Update' }, { entityType: 'pos', action: 'Create' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Cambia el cliente de una orden POS sin cobrar' }),
    (0, swagger_1.ApiBody)({ type: update_pos_customer_dto_1.UpdatePosCustomerDto }),
    __param(0, (0, common_1.Param)('salesOrderId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_pos_customer_dto_1.UpdatePosCustomerDto, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "updateSaleCustomer", null);
__decorate([
    (0, common_1.Patch)('quotations/:quotationId/customer'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'PosShift', action: 'Update' }, { entityType: 'pos', action: 'Create' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Cambia el cliente de un anticipo POS sin cobrar' }),
    (0, swagger_1.ApiBody)({ type: update_pos_customer_dto_1.UpdatePosCustomerDto }),
    __param(0, (0, common_1.Param)('quotationId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_pos_customer_dto_1.UpdatePosCustomerDto, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "updateQuotationCustomer", null);
__decorate([
    (0, common_1.Put)('sales/:salesOrderId/cart'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'PosShift', action: 'Read' }, { entityType: 'pos', action: 'Read' }, { entityType: 'pos', action: 'Create' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Reemplazar carrito de un ticket en ventas',
        description: 'Solo terminal VENTAS y pos_stage=ventas. Ajusta inventario.',
    }),
    (0, swagger_1.ApiBody)({ type: replace_pos_sale_cart_dto_1.ReplacePosSaleCartDto }),
    __param(0, (0, common_1.Param)('salesOrderId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, replace_pos_sale_cart_dto_1.ReplacePosSaleCartDto, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "replaceSaleCart", null);
__decorate([
    (0, common_1.Post)('sales/:salesOrderId/send-to-caja'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'PosShift', action: 'Read' }, { entityType: 'pos', action: 'Read' }, { entityType: 'pos', action: 'Create' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Reenviar ticket editado a caja',
        description: 'Solo terminal VENTAS. El folio vuelve a pendientes de cobro.',
    }),
    __param(0, (0, common_1.Param)('salesOrderId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "sendSaleToCaja", null);
__decorate([
    (0, common_1.Post)('quotations/:quotationId/send-to-caja'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'PosShift', action: 'Read' }, { entityType: 'pos', action: 'Read' }, { entityType: 'pos', action: 'Create' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Reenviar anticipo de cotización a caja',
        description: 'Solo terminal VENTAS y pos_stage=ventas. Puede corregir productos y el monto del anticipo.',
    }),
    (0, swagger_1.ApiBody)({ type: send_quotation_to_caja_dto_1.SendQuotationToCajaDto }),
    __param(0, (0, common_1.Param)('quotationId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, send_quotation_to_caja_dto_1.SendQuotationToCajaDto, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "sendQuotationToCaja", null);
__decorate([
    (0, common_1.Get)('sales/:salesOrderId/collection'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'PosShift', action: 'Read' }, { entityType: 'pos', action: 'Read' }, { entityType: 'pos', action: 'Create' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Detalle de cobro de una venta POS' }),
    __param(0, (0, common_1.Param)('salesOrderId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "getSaleCollection", null);
__decorate([
    (0, common_1.Get)('sales/:salesOrderId/receipt'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'PosShift', action: 'Read' }, { entityType: 'pos', action: 'Read' }, { entityType: 'pos', action: 'Create' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Ticket térmico ESC/POS de venta cobrada',
        description: 'Devuelve el ticket guardado al cobrar. Si la venta ya está cobrada y el archivo no existe, lo genera.',
    }),
    __param(0, (0, common_1.Param)('salesOrderId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "getSaleReceipt", null);
__decorate([
    (0, common_1.Get)('sales/:salesOrderId/receipt/raw'),
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'PosShift', action: 'Read' }, { entityType: 'pos', action: 'Read' }, { entityType: 'pos', action: 'Create' }, { entityType: 'pos', action: 'Update' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Bytes ESC/POS del ticket (binario)',
        description: 'application/octet-stream para impresión RAW Bixolon.',
    }),
    __param(0, (0, common_1.Param)('salesOrderId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "getSaleReceiptRaw", null);
exports.PosShiftsController = PosShiftsController = __decorate([
    (0, swagger_1.ApiTags)('POS - Shifts'),
    (0, common_1.Controller)('tenant/pos'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => quotation_advance_invoice_service_1.QuotationAdvanceInvoiceService))),
    __metadata("design:paramtypes", [pos_shifts_service_1.PosShiftsService,
        quotation_advance_invoice_service_1.QuotationAdvanceInvoiceService,
        pos_caja_recall_hub_1.PosCajaRecallHub])
], PosShiftsController);
//# sourceMappingURL=pos-shifts.controller.js.map