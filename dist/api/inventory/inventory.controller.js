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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const inventory_service_1 = require("./inventory.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const batch_filter_dto_1 = require("./dto/batch-filter.dto");
const batch_list_response_dto_1 = require("./dto/batch-list-response.dto");
const batch_detail_response_dto_1 = require("./dto/batch-detail-response.dto");
const inventory_batch_movement_dto_1 = require("./dto/inventory-batch-movement.dto");
const update_inventory_batch_dto_1 = require("./dto/update-inventory-batch.dto");
const inventory_summary_filter_dto_1 = require("./dto/inventory-summary-filter.dto");
const inventory_summary_response_dto_1 = require("./dto/inventory-summary-response.dto");
const inventory_location_tree_response_dto_1 = require("./dto/inventory-location-tree-response.dto");
const inventory_stats_filter_dto_1 = require("./dto/inventory-stats-filter.dto");
const inventory_stats_response_dto_1 = require("./dto/inventory-stats-response.dto");
const inventory_export_service_1 = require("./services/inventory-export.service");
const query_inventory_export_dto_1 = require("./dto/query-inventory-export.dto");
let InventoryController = class InventoryController {
    inventoryService;
    exportService;
    constructor(inventoryService, exportService) {
        this.inventoryService = inventoryService;
        this.exportService = exportService;
    }
    async exportBatchesExcel(filters, req, res) {
        const buffer = await this.exportService.exportBatches(req.user.tenant_id, filters);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${this.exportService.getBatchesFilename()}"`);
        res.send(buffer);
    }
    async exportSummaryExcel(filters, req, res) {
        const buffer = await this.exportService.exportSummary(req.user.tenant_id, filters);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${this.exportService.getSummaryFilename()}"`);
        res.send(buffer);
    }
    async getLocations(req) {
        return this.inventoryService.getLocationTree(req.user.tenant_id);
    }
    async getStats(filters, req) {
        return this.inventoryService.getStats(req.user.tenant_id, filters);
    }
    async findAll(filters, req) {
        const tenantId = req.user.tenant_id;
        return this.inventoryService.findAll(tenantId, filters);
    }
    async getInventorySummary(filters, req) {
        const tenantId = req.user.tenant_id;
        return this.inventoryService.getInventorySummary(tenantId, filters);
    }
    async getPosTerminalInventorySummary(filters, req) {
        const tenantId = req.user.tenant_id;
        return this.inventoryService.getPosTerminalInventorySummary(tenantId, req.user.id, filters);
    }
    async findByPurchaseOrder(poId, filters, req) {
        const tenantId = req.user.tenant_id;
        return this.inventoryService.findByPurchaseOrderId(poId, tenantId, filters);
    }
    async listBatchMovements(id, req) {
        return this.inventoryService.listMovements(id, req.user.tenant_id);
    }
    async findOne(id, req) {
        const tenantId = req.user.tenant_id;
        return this.inventoryService.findById(id, tenantId);
    }
    async updateBatch(id, dto, req) {
        return this.inventoryService.updateBatch(id, req.user.tenant_id, dto);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Get)('export/excel/batches'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'inventory', action: 'read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Descargar Excel de lotes de inventario' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_inventory_export_dto_1.QueryInventoryBatchExportDto, Object, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "exportBatchesExcel", null);
__decorate([
    (0, common_1.Get)('export/excel/summary'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'inventory', action: 'read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Descargar Excel de inventario totalizado por producto y almacén' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_inventory_export_dto_1.QueryInventorySummaryExportDto, Object, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "exportSummaryExcel", null);
__decorate([
    (0, common_1.Get)('locations'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'inventory', action: 'read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Árbol razón social → sucursal → almacén',
        description: 'Catálogo para los tres filtros en cascada de inventario. Permiso inventory:read. Sucursal deshabilitada sin razón social; almacén deshabilitado sin sucursal.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: inventory_location_tree_response_dto_1.InventoryLocationTreeResponseDto }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getLocations", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'inventory', action: 'read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'KPIs de inventario para cards',
        description: 'Totales de lotes, costo vs precio de venta, precio promedio y márgenes. Mismos filtros de ubicación que el listado.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: inventory_stats_response_dto_1.InventoryStatsResponseDto }),
    (0, swagger_1.ApiQuery)({ name: 'fiscal_configuration_id', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'billing_branch_id', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'warehouse_id', required: false, type: String }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_stats_filter_dto_1.InventoryStatsFilterDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('batches'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'inventory', action: 'read' }),
    (0, swagger_1.ApiOperation)({ summary: 'List all inventory batches with pagination and filters' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of batches retrieved successfully',
        type: batch_list_response_dto_1.BatchListResponseDto,
    }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String, description: 'Search by batch number, product name or SKU' }),
    (0, swagger_1.ApiQuery)({ name: 'batch_number', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'product_id', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'fiscal_configuration_id', required: false, type: String, description: 'Razón social. Requerido si se envía sucursal' }),
    (0, swagger_1.ApiQuery)({ name: 'billing_branch_id', required: false, type: String, description: 'Sucursal. Requiere razón social. Requerido si se envía almacén' }),
    (0, swagger_1.ApiQuery)({ name: 'warehouse_id', required: false, type: String, description: 'Almacén. Requiere razón social y sucursal' }),
    (0, swagger_1.ApiQuery)({ name: 'purchase_order_batch_id', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'purchase_order_id', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'created_from', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'created_to', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, example: 20 }),
    (0, swagger_1.ApiQuery)({ name: 'sort_by', required: false, type: String, example: 'created_at' }),
    (0, swagger_1.ApiQuery)({ name: 'sort_order', required: false, type: String, example: 'DESC' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [batch_filter_dto_1.BatchFilterDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'inventory', action: 'read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get inventory summary grouped by product and warehouse',
        description: 'Returns total available quantity per product+warehouse with batch breakdown'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Inventory summary retrieved successfully',
        type: inventory_summary_response_dto_1.InventorySummaryResponseDto,
    }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'fiscal_configuration_id', required: false, type: String, description: 'Razón social. Requerido si se envía sucursal' }),
    (0, swagger_1.ApiQuery)({ name: 'billing_branch_id', required: false, type: String, description: 'Sucursal. Requiere razón social. Requerido si se envía almacén' }),
    (0, swagger_1.ApiQuery)({ name: 'warehouse_id', required: false, type: String, description: 'Almacén. Requiere razón social y sucursal' }),
    (0, swagger_1.ApiQuery)({ name: 'product_id', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'only_available', required: false, type: Boolean }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'sort_by', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'sort_order', required: false, type: String }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_summary_filter_dto_1.InventorySummaryFilterDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getInventorySummary", null);
__decorate([
    (0, common_1.Get)('pos/summary'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'inventory', action: 'read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Inventario POS por sucursal de la terminal',
        description: 'Usa billing_branch_id del usuario POS logueado. warehouse_id es opcional; si se omite, incluye todos los almacenes de esa sucursal. Con search, el SKU exacto va primero y el resto se ordena por relevancia (SKU, luego nombre). No reordenar en cliente.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'search',
        required: false,
        type: String,
        description: 'SKU, SKU externo o nombre. SKU exacto primero; después coincidencias de SKU y nombre por relevancia.',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_summary_filter_dto_1.InventorySummaryFilterDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getPosTerminalInventorySummary", null);
__decorate([
    (0, common_1.Get)('batches/purchase-order/:poId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'inventory', action: 'read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get all inventory batches for a specific purchase order' }),
    (0, swagger_1.ApiParam)({ name: 'poId', description: 'Purchase Order ID', type: String }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of batches for the purchase order retrieved successfully',
        type: batch_list_response_dto_1.BatchListResponseDto,
    }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String, description: 'Search by batch number, product name or SKU' }),
    (0, swagger_1.ApiQuery)({ name: 'batch_number', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'product_id', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'warehouse_id', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'created_from', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'created_to', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, example: 20 }),
    (0, swagger_1.ApiQuery)({ name: 'sort_by', required: false, type: String, example: 'created_at' }),
    (0, swagger_1.ApiQuery)({ name: 'sort_order', required: false, type: String, example: 'DESC' }),
    __param(0, (0, common_1.Param)('poId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, batch_filter_dto_1.BatchFilterDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "findByPurchaseOrder", null);
__decorate([
    (0, common_1.Get)('batches/:id/movements'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'inventory', action: 'read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Historial de movimientos del lote',
        description: 'Creación/compra/importación, ventas, transferencias y auditorías. Más reciente primero.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Batch ID', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, type: inventory_batch_movement_dto_1.InventoryBatchMovementListResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "listBatchMovements", null);
__decorate([
    (0, common_1.Get)('batches/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'inventory', action: 'read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single inventory batch by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Batch ID', type: String }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Batch retrieved successfully',
        type: batch_detail_response_dto_1.BatchDetailResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Batch not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('batches/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'inventory', action: 'write' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Editar tag y/o medida de un lote',
        description: 'Tag siempre editable. Medida solo si el lote no la tiene (no se capturó en el recibo). El almacén se mueve con POST /transfers, no con este PATCH.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Batch ID', type: String }),
    (0, swagger_1.ApiBody)({ type: update_inventory_batch_dto_1.UpdateInventoryBatchDto }),
    (0, swagger_1.ApiResponse)({ status: 200, type: batch_detail_response_dto_1.BatchDetailResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Medida ya definida o payload inválido' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Batch not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_inventory_batch_dto_1.UpdateInventoryBatchDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "updateBatch", null);
exports.InventoryController = InventoryController = __decorate([
    (0, common_1.Controller)('tenant/inventory'),
    (0, swagger_1.ApiTags)('Inventory'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService,
        inventory_export_service_1.InventoryExportService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map