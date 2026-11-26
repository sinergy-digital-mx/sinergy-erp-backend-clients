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
const inventory_branch_report_service_1 = require("./services/inventory-branch-report.service");
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
const pos_branch_stock_response_dto_1 = require("./dto/pos-branch-stock-response.dto");
const branch_stock_report_dto_1 = require("./dto/branch-stock-report.dto");
const inventory_location_tree_response_dto_1 = require("./dto/inventory-location-tree-response.dto");
const inventory_stats_filter_dto_1 = require("./dto/inventory-stats-filter.dto");
const inventory_stats_response_dto_1 = require("./dto/inventory-stats-response.dto");
const inventory_margin_dto_1 = require("./dto/inventory-margin.dto");
const inventory_export_service_1 = require("./services/inventory-export.service");
const inventory_stock_flow_service_1 = require("./services/inventory-stock-flow.service");
const query_inventory_export_dto_1 = require("./dto/query-inventory-export.dto");
const query_stock_flow_dto_1 = require("./dto/query-stock-flow.dto");
const stock_flow_response_dto_1 = require("./dto/stock-flow-response.dto");
const purchase_order_real_cost_permission_1 = require("../purchase-orders/constants/purchase-order-real-cost-permission");
const omit_purchase_order_real_cost_util_1 = require("../purchase-orders/utils/omit-purchase-order-real-cost.util");
const inventory_margin_permission_1 = require("./constants/inventory-margin-permission");
const omit_inventory_margin_util_1 = require("./utils/omit-inventory-margin.util");
let InventoryController = class InventoryController {
    inventoryService;
    exportService;
    stockFlowService;
    branchReportService;
    constructor(inventoryService, exportService, stockFlowService, branchReportService) {
        this.inventoryService = inventoryService;
        this.exportService = exportService;
        this.stockFlowService = stockFlowService;
        this.branchReportService = branchReportService;
    }
    async getStockFlow(filters, req) {
        const report = await this.stockFlowService.getReport(req.user.tenant_id, filters);
        return (0, inventory_margin_permission_1.userCanViewInventoryMargin)(req.user) ? report : (0, omit_inventory_margin_util_1.omitStockFlowMargin)(report);
    }
    async exportStockFlowExcel(filters, req, res) {
        const buffer = await this.stockFlowService.exportExcel(req.user.tenant_id, filters, (0, inventory_margin_permission_1.userCanViewInventoryMargin)(req.user));
        const view = filters.view ?? query_stock_flow_dto_1.StockFlowView.SUMMARY;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${this.stockFlowService.getFilename(view)}"`);
        res.send(buffer);
    }
    async exportBatchesExcel(filters, req, res) {
        const buffer = await this.exportService.exportBatches(req.user.tenant_id, filters);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${this.exportService.getBatchesFilename()}"`);
        res.send(buffer);
    }
    async exportSummaryExcel(filters, req, res) {
        const buffer = await this.exportService.exportSummary(req.user.tenant_id, filters, (0, inventory_margin_permission_1.userCanViewInventoryMargin)(req.user));
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${this.exportService.getSummaryFilename()}"`);
        res.send(buffer);
    }
    async getLocations(req) {
        return this.inventoryService.getLocationTree(req.user.tenant_id);
    }
    async getStats(filters, req) {
        const stats = await this.inventoryService.getStats(req.user.tenant_id, filters);
        return (0, inventory_margin_permission_1.userCanViewInventoryMargin)(req.user) ? stats : (0, omit_inventory_margin_util_1.omitInventoryStatsMargin)(stats);
    }
    async findAll(filters, req) {
        const tenantId = req.user.tenant_id;
        return this.inventoryService.findAll(tenantId, filters);
    }
    async getInventorySummary(filters, req) {
        const tenantId = req.user.tenant_id;
        const summary = await this.inventoryService.getInventorySummary(tenantId, filters);
        return (0, inventory_margin_permission_1.userCanViewInventoryMargin)(req.user) ? summary : (0, omit_inventory_margin_util_1.omitInventorySummaryMargin)(summary);
    }
    async getProductMargin(productId, req) {
        if (!(0, inventory_margin_permission_1.userCanViewInventoryMargin)(req.user)) {
            throw new common_1.ForbiddenException('No tienes permiso para ver el margen del inventario.');
        }
        return this.inventoryService.getProductMargin(req.user.tenant_id, productId);
    }
    async searchBranchReportProducts(query, req) {
        return this.branchReportService.searchProducts(req.user.tenant_id, query.search ?? '');
    }
    async getBranchReportSettings(req) {
        return this.branchReportService.getSettings(req.user.tenant_id);
    }
    async updateBranchReportSettings(body, req) {
        return this.branchReportService.updateSettings(req.user.tenant_id, req.user?.id ?? null, body.branch_ids);
    }
    async getBranchStockReport(query, req) {
        const report = await this.branchReportService.getReport(req.user.tenant_id, query.product_id);
        return (0, inventory_margin_permission_1.userCanViewInventoryMargin)(req.user) ? report : (0, omit_inventory_margin_util_1.omitBranchReportMargin)(report);
    }
    async getPosBranchStock(search, req) {
        return this.inventoryService.getPosBranchStock(req.user.tenant_id, search ?? '');
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
        const batch = await this.inventoryService.findById(id, tenantId);
        return this.presentBatch(batch, req.user);
    }
    async updateBatch(id, dto, req) {
        const batch = await this.inventoryService.updateBatch(id, req.user.tenant_id, dto);
        return this.presentBatch(batch, req.user);
    }
    presentBatch(batch, user) {
        const canViewMargin = (0, inventory_margin_permission_1.userCanViewInventoryMargin)(user);
        const canViewRealCost = canViewMargin &&
            (0, purchase_order_real_cost_permission_1.userCanViewPurchaseOrderRealCost)(user);
        const withoutRealCost = canViewRealCost ? batch : (0, omit_purchase_order_real_cost_util_1.omitPurchaseOrderRealCost)(batch);
        return canViewMargin ? withoutRealCost : (0, omit_inventory_margin_util_1.omitInventoryBatchMargin)(withoutRealCost);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Get)('stock-flow'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'inventory', action: 'StockFlow' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Reporte de existencia / kardex (TRK-017 + TRK-018)',
        description: 'Resumen (apertura/compras/ventas/cierre) o flujo detallado por rango de fechas. Permiso inventory:StockFlow.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: stock_flow_response_dto_1.StockFlowResponseDto }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_stock_flow_dto_1.QueryStockFlowDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getStockFlow", null);
__decorate([
    (0, common_1.Get)('stock-flow/export/excel'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'inventory', action: 'StockFlow' }),
    (0, swagger_1.ApiOperation)({ summary: 'Excel del reporte de existencia' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_stock_flow_dto_1.QueryStockFlowDto, Object, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "exportStockFlowExcel", null);
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
    (0, require_permissions_decorator_1.RequireAnyPermissions)({ entityType: 'inventory', action: 'read' }, { entityType: 'Transfer', action: 'Read' }),
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
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'inventory', action: 'ViewStats' }),
    (0, swagger_1.ApiOperation)({
        summary: 'KPIs de inventario para cards',
        description: 'Totales de lotes, costo vs precio de venta, precio promedio y márgenes. Mismos filtros de ubicación que el listado. Permiso inventory:ViewStats.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: inventory_stats_response_dto_1.InventoryStatsResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Sin permiso ViewStats' }),
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
    (0, common_1.Get)('products/:productId/margin'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'inventory', action: 'read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Margen general de un producto',
        description: 'Promedio simple de los lotes con existencia. Cada lote usa su compra; si no tiene, el costo configurado en pesos. Permiso inventory:ViewMargin.',
    }),
    (0, swagger_1.ApiParam)({ name: 'productId', description: 'Product ID', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, type: inventory_margin_dto_1.ProductMarginResponseDto }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getProductMargin", null);
__decorate([
    (0, common_1.Get)('branch-report/products'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'inventory', action: 'read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Buscar un producto para el reporte por sucursal',
        description: 'Nombre, SKU o SKU externo. Máximo 10. Permiso inventory:Read.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: branch_stock_report_dto_1.BranchReportProductSearchResponseDto }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [branch_stock_report_dto_1.QueryBranchReportProductsDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "searchBranchReportProducts", null);
__decorate([
    (0, common_1.Get)('branch-report/settings'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'inventory', action: 'read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Sucursales activas y cuáles salen en el reporte',
        description: 'Sin configuración guardada, todas las sucursales activas salen. Permiso inventory:Read.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: branch_stock_report_dto_1.BranchReportSettingsResponseDto }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getBranchReportSettings", null);
__decorate([
    (0, common_1.Put)('branch-report/settings'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'inventory', action: 'read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Guardar las sucursales del reporte',
        description: 'La selección queda para quien consulte Inventario. Permiso inventory:Read.',
    }),
    (0, swagger_1.ApiBody)({ type: branch_stock_report_dto_1.UpdateBranchReportSettingsDto }),
    (0, swagger_1.ApiResponse)({ status: 200, type: branch_stock_report_dto_1.BranchReportSettingsResponseDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [branch_stock_report_dto_1.UpdateBranchReportSettingsDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "updateBranchReportSettings", null);
__decorate([
    (0, common_1.Get)('branch-report'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'inventory', action: 'read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Existencia y costo de un producto por sucursal',
        description: 'Una sola pieza. Incluye sucursales en cero. El costo promedio es ponderado por existencia, con el mismo costo unitario que Totalizado. Permiso inventory:Read.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: branch_stock_report_dto_1.BranchStockReportResponseDto }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [branch_stock_report_dto_1.QueryBranchReportDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getBranchStockReport", null);
__decorate([
    (0, common_1.Get)('pos/branch-stock'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'inventory', action: 'read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Existencias por sucursal para el POS',
        description: 'Busca por nombre, SKU o SKU externo y devuelve cantidades por sucursal activa. No incluye costos. Máximo 12 productos.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: true, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, type: pos_branch_stock_response_dto_1.PosBranchStockResponseDto }),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getPosBranchStock", null);
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
        inventory_export_service_1.InventoryExportService,
        inventory_stock_flow_service_1.InventoryStockFlowService,
        inventory_branch_report_service_1.InventoryBranchReportService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map