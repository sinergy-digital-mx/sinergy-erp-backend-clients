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
const validate_seller_code_dto_1 = require("./dto/validate-seller-code.dto");
const open_daily_shift_dto_1 = require("./dto/open-daily-shift.dto");
const create_partial_shift_dto_1 = require("./dto/create-partial-shift.dto");
const query_daily_shift_dto_1 = require("./dto/query-daily-shift.dto");
const close_daily_shift_dto_1 = require("./dto/close-daily-shift.dto");
const collect_pos_sale_dto_1 = require("./dto/collect-pos-sale.dto");
const query_collected_sales_dto_1 = require("./dto/query-collected-sales.dto");
let PosShiftsController = class PosShiftsController {
    posShiftsService;
    constructor(posShiftsService) {
        this.posShiftsService = posShiftsService;
    }
    async validateSellerCode(dto, req) {
        return this.posShiftsService.validateSellerCode(req.user.tenant_id, req.user.id, dto.code);
    }
    async getCurrentDailyShift(req) {
        return this.posShiftsService.getCurrentDailyShiftResponse(req.user.tenant_id, req.user.id);
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
    async getPendingSales(req) {
        const sales = await this.posShiftsService.getPendingSales(req.user.tenant_id, req.user.id);
        return { pending_sales: sales };
    }
    async getCollectedSales(query, req) {
        return this.posShiftsService.getCollectedSales(req.user.tenant_id, req.user.id, query.daily_shift_id);
    }
    async collectSale(salesOrderId, dto, req) {
        return this.posShiftsService.collectSale(req.user.tenant_id, req.user.id, salesOrderId, dto);
    }
    async getSaleCollection(salesOrderId, req) {
        return this.posShiftsService.getSaleCollection(req.user.tenant_id, salesOrderId);
    }
    async getSaleReceipt(salesOrderId, req) {
        return this.posShiftsService.getSaleReceipt(req.user.tenant_id, salesOrderId);
    }
    async getSaleReceiptRaw(salesOrderId, req, res) {
        return this.posShiftsService.getSaleReceiptRaw(req.user.tenant_id, salesOrderId, res);
    }
};
exports.PosShiftsController = PosShiftsController;
__decorate([
    (0, common_1.Post)('validate-seller-code'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'PosShift', action: 'Read' }),
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
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'PosShift', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtener corte global abierto de la sucursal',
        description: 'Si el corte abierto es de un día anterior, incluye unclosed_shift_alert para forzar el cierre antes de continuar.',
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "getCurrentDailyShift", null);
__decorate([
    (0, common_1.Post)('daily-shift/open'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'PosShift', action: 'Create' }),
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
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'PosShift', action: 'Read' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Daily shift ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "findDailyShiftById", null);
__decorate([
    (0, common_1.Post)('daily-shift/:id/partial-shifts'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'PosShift', action: 'Update' }),
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
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'PosShift', action: 'Update' }),
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
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'PosShift', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Ventas pendientes de cobro',
        description: 'Solo terminal COBRANZA. Órdenes Surtida + Pendiente de la sucursal.',
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "getPendingSales", null);
__decorate([
    (0, common_1.Get)('collected-sales'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'PosShift', action: 'Read' }),
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
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'PosShift', action: 'Update' }),
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
    (0, common_1.Get)('sales/:salesOrderId/collection'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'PosShift', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Detalle de cobro de una venta POS' }),
    __param(0, (0, common_1.Param)('salesOrderId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "getSaleCollection", null);
__decorate([
    (0, common_1.Get)('sales/:salesOrderId/receipt'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'PosShift', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Ticket térmico ESC/POS de venta cobrada',
        description: 'Devuelve el ticket ya guardado al cobrar. No genera tickets nuevos (404 si no existe).',
    }),
    __param(0, (0, common_1.Param)('salesOrderId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PosShiftsController.prototype, "getSaleReceipt", null);
__decorate([
    (0, common_1.Get)('sales/:salesOrderId/receipt/raw'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'PosShift', action: 'Read' }),
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
    __metadata("design:paramtypes", [pos_shifts_service_1.PosShiftsService])
], PosShiftsController);
//# sourceMappingURL=pos-shifts.controller.js.map