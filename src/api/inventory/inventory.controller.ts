import { Controller, UseGuards, Get, Patch, Put, Body, Query, Param, Req, Res, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { InventoryBranchReportService } from './services/inventory-branch-report.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import {
  RequireAnyPermissions,
  RequirePermissions,
} from '../rbac/decorators/require-permissions.decorator';
import { BatchFilterDto } from './dto/batch-filter.dto';
import { BatchListResponseDto } from './dto/batch-list-response.dto';
import { BatchResponseDto } from './dto/batch-response.dto';
import { BatchDetailResponseDto } from './dto/batch-detail-response.dto';
import { InventoryBatchMovementListResponseDto } from './dto/inventory-batch-movement.dto';
import { UpdateInventoryBatchDto } from './dto/update-inventory-batch.dto';
import { InventorySummaryFilterDto } from './dto/inventory-summary-filter.dto';
import { InventorySummaryResponseDto } from './dto/inventory-summary-response.dto';
import { PosSessionInventorySummaryResponseDto } from './dto/pos-session-inventory-summary-response.dto';
import { PosBranchStockResponseDto } from './dto/pos-branch-stock-response.dto';
import {
  BranchReportProductSearchResponseDto,
  BranchReportSettingsResponseDto,
  BranchStockReportResponseDto,
  QueryBranchReportDto,
  QueryBranchReportProductsDto,
  UpdateBranchReportSettingsDto,
} from './dto/branch-stock-report.dto';
import { InventoryLocationTreeResponseDto } from './dto/inventory-location-tree-response.dto';
import { InventoryStatsFilterDto } from './dto/inventory-stats-filter.dto';
import { InventoryStatsResponseDto } from './dto/inventory-stats-response.dto';
import { ProductMarginResponseDto } from './dto/inventory-margin.dto';
import { InventoryExportService } from './services/inventory-export.service';
import { InventoryStockFlowService } from './services/inventory-stock-flow.service';
import {
  QueryInventoryBatchExportDto,
  QueryInventorySummaryExportDto,
} from './dto/query-inventory-export.dto';
import { QueryStockFlowDto, StockFlowView } from './dto/query-stock-flow.dto';
import { StockFlowResponseDto } from './dto/stock-flow-response.dto';
import { userCanViewPurchaseOrderRealCost } from '../purchase-orders/constants/purchase-order-real-cost-permission';
import { omitPurchaseOrderRealCost } from '../purchase-orders/utils/omit-purchase-order-real-cost.util';
import { userCanViewInventoryMargin } from './constants/inventory-margin-permission';
import {
  omitBranchReportMargin,
  omitInventoryBatchMargin,
  omitInventoryStatsMargin,
  omitInventorySummaryMargin,
  omitStockFlowMargin,
} from './utils/omit-inventory-margin.util';

@Controller('tenant/inventory')
@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly exportService: InventoryExportService,
    private readonly stockFlowService: InventoryStockFlowService,
    private readonly branchReportService: InventoryBranchReportService,
  ) {}

  @Get('stock-flow')
  @RequirePermissions({ entityType: 'inventory', action: 'StockFlow' })
  @ApiOperation({
    summary: 'Reporte de existencia / kardex (TRK-017 + TRK-018)',
    description:
      'Resumen (apertura/compras/ventas/cierre) o flujo detallado por rango de fechas. Permiso inventory:StockFlow.',
  })
  @ApiResponse({ status: 200, type: StockFlowResponseDto })
  async getStockFlow(
    @Query() filters: QueryStockFlowDto,
    @Req() req: any,
  ): Promise<StockFlowResponseDto> {
    const report = await this.stockFlowService.getReport(req.user.tenant_id, filters);
    return userCanViewInventoryMargin(req.user) ? report : omitStockFlowMargin(report);
  }

  @Get('stock-flow/export/excel')
  @RequirePermissions({ entityType: 'inventory', action: 'StockFlow' })
  @ApiOperation({ summary: 'Excel del reporte de existencia' })
  async exportStockFlowExcel(
    @Query() filters: QueryStockFlowDto,
    @Req() req: any,
    @Res() res: any,
  ) {
    const buffer = await this.stockFlowService.exportExcel(
      req.user.tenant_id,
      filters,
      userCanViewInventoryMargin(req.user),
    );
    const view = filters.view ?? StockFlowView.SUMMARY;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${this.stockFlowService.getFilename(view)}"`,
    );
    res.send(buffer);
  }

  @Get('export/excel/batches')
  @RequirePermissions({ entityType: 'inventory', action: 'read' })
  @ApiOperation({ summary: 'Descargar Excel de lotes de inventario' })
  async exportBatchesExcel(
    @Query() filters: QueryInventoryBatchExportDto,
    @Req() req: any,
    @Res() res: any,
  ) {
    const buffer = await this.exportService.exportBatches(req.user.tenant_id, filters);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${this.exportService.getBatchesFilename()}"`,
    );
    res.send(buffer);
  }

  @Get('export/excel/summary')
  @RequirePermissions({ entityType: 'inventory', action: 'read' })
  @ApiOperation({ summary: 'Descargar Excel de inventario totalizado por producto y almacén' })
  async exportSummaryExcel(
    @Query() filters: QueryInventorySummaryExportDto,
    @Req() req: any,
    @Res() res: any,
  ) {
    const buffer = await this.exportService.exportSummary(
      req.user.tenant_id,
      filters,
      userCanViewInventoryMargin(req.user),
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${this.exportService.getSummaryFilename()}"`,
    );
    res.send(buffer);
  }

  @Get('locations')
  @RequireAnyPermissions(
    { entityType: 'inventory', action: 'read' },
    { entityType: 'Transfer', action: 'Read' },
  )
  @ApiOperation({
    summary: 'Árbol razón social → sucursal → almacén',
    description:
      'Catálogo para los tres filtros en cascada de inventario. Permiso inventory:read. Sucursal deshabilitada sin razón social; almacén deshabilitado sin sucursal.',
  })
  @ApiResponse({ status: 200, type: InventoryLocationTreeResponseDto })
  async getLocations(@Req() req: any): Promise<InventoryLocationTreeResponseDto> {
    return this.inventoryService.getLocationTree(req.user.tenant_id);
  }

  @Get('stats')
  @RequirePermissions({ entityType: 'inventory', action: 'ViewStats' })
  @ApiOperation({
    summary: 'KPIs de inventario para cards',
    description:
      'Totales de lotes, costo vs precio de venta, precio promedio y márgenes. Mismos filtros de ubicación que el listado. Permiso inventory:ViewStats.',
  })
  @ApiResponse({ status: 200, type: InventoryStatsResponseDto })
  @ApiResponse({ status: 403, description: 'Sin permiso ViewStats' })
  @ApiQuery({ name: 'fiscal_configuration_id', required: false, type: String })
  @ApiQuery({ name: 'billing_branch_id', required: false, type: String })
  @ApiQuery({ name: 'warehouse_id', required: false, type: String })
  async getStats(
    @Query() filters: InventoryStatsFilterDto,
    @Req() req: any,
  ): Promise<InventoryStatsResponseDto> {
    const stats = await this.inventoryService.getStats(req.user.tenant_id, filters);
    return userCanViewInventoryMargin(req.user) ? stats : omitInventoryStatsMargin(stats);
  }

  @Get('batches')
  @RequirePermissions({ entityType: 'inventory', action: 'read' })
  @ApiOperation({ summary: 'List all inventory batches with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'List of batches retrieved successfully',
    type: BatchListResponseDto,
  })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by batch number, product name or SKU' })
  @ApiQuery({ name: 'batch_number', required: false, type: String })
  @ApiQuery({ name: 'product_id', required: false, type: String })
  @ApiQuery({ name: 'fiscal_configuration_id', required: false, type: String, description: 'Razón social. Requerido si se envía sucursal' })
  @ApiQuery({ name: 'billing_branch_id', required: false, type: String, description: 'Sucursal. Requiere razón social. Requerido si se envía almacén' })
  @ApiQuery({ name: 'warehouse_id', required: false, type: String, description: 'Almacén. Requiere razón social y sucursal' })
  @ApiQuery({ name: 'purchase_order_batch_id', required: false, type: String })
  @ApiQuery({ name: 'purchase_order_id', required: false, type: String })
  @ApiQuery({ name: 'created_from', required: false, type: String })
  @ApiQuery({ name: 'created_to', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'sort_by', required: false, type: String, example: 'created_at' })
  @ApiQuery({ name: 'sort_order', required: false, type: String, example: 'DESC' })
  async findAll(
    @Query() filters: BatchFilterDto,
    @Req() req: any,
  ): Promise<BatchListResponseDto> {
    const tenantId = req.user.tenant_id;
    return this.inventoryService.findAll(tenantId, filters);
  }

  @Get('summary')
  @RequirePermissions({ entityType: 'inventory', action: 'read' })
  @ApiOperation({ 
    summary: 'Get inventory summary grouped by product and warehouse',
    description: 'Returns total available quantity per product+warehouse with batch breakdown'
  })
  @ApiResponse({
    status: 200,
    description: 'Inventory summary retrieved successfully',
    type: InventorySummaryResponseDto,
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'fiscal_configuration_id', required: false, type: String, description: 'Razón social. Requerido si se envía sucursal' })
  @ApiQuery({ name: 'billing_branch_id', required: false, type: String, description: 'Sucursal. Requiere razón social. Requerido si se envía almacén' })
  @ApiQuery({ name: 'warehouse_id', required: false, type: String, description: 'Almacén. Requiere razón social y sucursal' })
  @ApiQuery({ name: 'product_id', required: false, type: String })
  @ApiQuery({ name: 'only_available', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort_by', required: false, type: String })
  @ApiQuery({ name: 'sort_order', required: false, type: String })
  async getInventorySummary(
    @Query() filters: InventorySummaryFilterDto,
    @Req() req: any,
  ): Promise<InventorySummaryResponseDto> {
    const tenantId = req.user.tenant_id;
    const summary = await this.inventoryService.getInventorySummary(tenantId, filters);
    return userCanViewInventoryMargin(req.user) ? summary : omitInventorySummaryMargin(summary);
  }

  @Get('products/:productId/margin')
  @RequirePermissions({ entityType: 'inventory', action: 'read' })
  @ApiOperation({
    summary: 'Margen general de un producto',
    description:
      'Promedio simple de los lotes con existencia. Cada lote usa su compra; si no tiene, el costo configurado en pesos. Permiso inventory:ViewMargin.',
  })
  @ApiParam({ name: 'productId', description: 'Product ID', type: String })
  @ApiResponse({ status: 200, type: ProductMarginResponseDto })
  async getProductMargin(
    @Param('productId') productId: string,
    @Req() req: any,
  ): Promise<ProductMarginResponseDto> {
    if (!userCanViewInventoryMargin(req.user)) {
      throw new ForbiddenException('No tienes permiso para ver el margen del inventario.');
    }
    return this.inventoryService.getProductMargin(req.user.tenant_id, productId);
  }

  @Get('branch-report/products')
  @RequirePermissions({ entityType: 'inventory', action: 'read' })
  @ApiOperation({
    summary: 'Buscar un producto para el reporte por sucursal',
    description: 'Nombre, SKU o SKU externo. Máximo 10. Permiso inventory:Read.',
  })
  @ApiResponse({ status: 200, type: BranchReportProductSearchResponseDto })
  async searchBranchReportProducts(
    @Query() query: QueryBranchReportProductsDto,
    @Req() req: any,
  ): Promise<BranchReportProductSearchResponseDto> {
    return this.branchReportService.searchProducts(req.user.tenant_id, query.search ?? '');
  }

  @Get('branch-report/settings')
  @RequirePermissions({ entityType: 'inventory', action: 'read' })
  @ApiOperation({
    summary: 'Sucursales activas y cuáles salen en el reporte',
    description: 'Sin configuración guardada, todas las sucursales activas salen. Permiso inventory:Read.',
  })
  @ApiResponse({ status: 200, type: BranchReportSettingsResponseDto })
  async getBranchReportSettings(@Req() req: any): Promise<BranchReportSettingsResponseDto> {
    return this.branchReportService.getSettings(req.user.tenant_id);
  }

  @Put('branch-report/settings')
  @RequirePermissions({ entityType: 'inventory', action: 'read' })
  @ApiOperation({
    summary: 'Guardar las sucursales del reporte',
    description: 'La selección queda para quien consulte Inventario. Permiso inventory:Read.',
  })
  @ApiBody({ type: UpdateBranchReportSettingsDto })
  @ApiResponse({ status: 200, type: BranchReportSettingsResponseDto })
  async updateBranchReportSettings(
    @Body() body: UpdateBranchReportSettingsDto,
    @Req() req: any,
  ): Promise<BranchReportSettingsResponseDto> {
    return this.branchReportService.updateSettings(
      req.user.tenant_id,
      req.user?.id ?? null,
      body.branch_ids,
    );
  }

  @Get('branch-report')
  @RequirePermissions({ entityType: 'inventory', action: 'read' })
  @ApiOperation({
    summary: 'Existencia y costo de un producto por sucursal',
    description:
      'Una sola pieza. Incluye sucursales en cero. El costo promedio es ponderado por existencia, con el mismo costo unitario que Totalizado. Permiso inventory:Read.',
  })
  @ApiResponse({ status: 200, type: BranchStockReportResponseDto })
  async getBranchStockReport(
    @Query() query: QueryBranchReportDto,
    @Req() req: any,
  ): Promise<BranchStockReportResponseDto> {
    const report = await this.branchReportService.getReport(req.user.tenant_id, query.product_id);
    return userCanViewInventoryMargin(req.user) ? report : omitBranchReportMargin(report);
  }

  @Get('pos/branch-stock')
  @RequirePermissions({ entityType: 'inventory', action: 'read' })
  @ApiOperation({
    summary: 'Existencias por sucursal para el POS',
    description:
      'Busca por nombre, SKU o SKU externo y devuelve cantidades por sucursal activa. No incluye costos. Máximo 12 productos.',
  })
  @ApiQuery({ name: 'search', required: true, type: String })
  @ApiResponse({ status: 200, type: PosBranchStockResponseDto })
  async getPosBranchStock(
    @Query('search') search: string,
    @Req() req: any,
  ): Promise<PosBranchStockResponseDto> {
    return this.inventoryService.getPosBranchStock(req.user.tenant_id, search ?? '');
  }

  @Get('pos/summary')
  @RequirePermissions({ entityType: 'inventory', action: 'read' })
  @ApiOperation({
    summary: 'Inventario POS por sucursal de la terminal',
    description:
      'Usa billing_branch_id del usuario POS logueado. warehouse_id es opcional; si se omite, incluye todos los almacenes de esa sucursal. Con search, el SKU exacto va primero y el resto se ordena por relevancia (SKU, luego nombre). No reordenar en cliente.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description:
      'SKU, SKU externo o nombre. SKU exacto primero; después coincidencias de SKU y nombre por relevancia.',
  })
  async getPosTerminalInventorySummary(
    @Query() filters: InventorySummaryFilterDto,
    @Req() req: any,
  ): Promise<PosSessionInventorySummaryResponseDto> {
    const tenantId = req.user.tenant_id;
    return this.inventoryService.getPosTerminalInventorySummary(
      tenantId,
      req.user.id,
      filters,
    );
  }

  @Get('batches/purchase-order/:poId')
  @RequirePermissions({ entityType: 'inventory', action: 'read' })
  @ApiOperation({ summary: 'Get all inventory batches for a specific purchase order' })
  @ApiParam({ name: 'poId', description: 'Purchase Order ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'List of batches for the purchase order retrieved successfully',
    type: BatchListResponseDto,
  })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by batch number, product name or SKU' })
  @ApiQuery({ name: 'batch_number', required: false, type: String })
  @ApiQuery({ name: 'product_id', required: false, type: String })
  @ApiQuery({ name: 'warehouse_id', required: false, type: String })
  @ApiQuery({ name: 'created_from', required: false, type: String })
  @ApiQuery({ name: 'created_to', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'sort_by', required: false, type: String, example: 'created_at' })
  @ApiQuery({ name: 'sort_order', required: false, type: String, example: 'DESC' })
  async findByPurchaseOrder(
    @Param('poId') poId: string,
    @Query() filters: BatchFilterDto,
    @Req() req: any,
  ): Promise<BatchListResponseDto> {
    const tenantId = req.user.tenant_id;
    return this.inventoryService.findByPurchaseOrderId(poId, tenantId, filters);
  }

  @Get('batches/:id/movements')
  @RequirePermissions({ entityType: 'inventory', action: 'read' })
  @ApiOperation({
    summary: 'Historial de movimientos del lote',
    description:
      'Creación/compra/importación, ventas, transferencias y auditorías. Más reciente primero.',
  })
  @ApiParam({ name: 'id', description: 'Batch ID', type: String })
  @ApiResponse({ status: 200, type: InventoryBatchMovementListResponseDto })
  async listBatchMovements(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<InventoryBatchMovementListResponseDto> {
    return this.inventoryService.listMovements(id, req.user.tenant_id);
  }

  @Get('batches/:id')
  @RequirePermissions({ entityType: 'inventory', action: 'read' })
  @ApiOperation({ summary: 'Get a single inventory batch by ID' })
  @ApiParam({ name: 'id', description: 'Batch ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Batch retrieved successfully',
    type: BatchDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Batch not found',
  })
  async findOne(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<BatchDetailResponseDto> {
    const tenantId = req.user.tenant_id;
    const batch = await this.inventoryService.findById(id, tenantId);
    return this.presentBatch(batch, req.user);
  }

  @Patch('batches/:id')
  @RequirePermissions({ entityType: 'inventory', action: 'write' })
  @ApiOperation({
    summary: 'Editar tag y/o medida de un lote',
    description:
      'Tag siempre editable. Medida solo si el lote no la tiene (no se capturó en el recibo). El almacén se mueve con POST /transfers, no con este PATCH.',
  })
  @ApiParam({ name: 'id', description: 'Batch ID', type: String })
  @ApiBody({ type: UpdateInventoryBatchDto })
  @ApiResponse({ status: 200, type: BatchDetailResponseDto })
  @ApiResponse({ status: 400, description: 'Medida ya definida o payload inválido' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  async updateBatch(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryBatchDto,
    @Req() req: any,
  ): Promise<BatchDetailResponseDto> {
    const batch = await this.inventoryService.updateBatch(id, req.user.tenant_id, dto);
    return this.presentBatch(batch, req.user);
  }

  private presentBatch<T>(batch: T, user: unknown): T {
    const canViewMargin = userCanViewInventoryMargin(
      user as Parameters<typeof userCanViewInventoryMargin>[0],
    );
    const canViewRealCost =
      canViewMargin &&
      userCanViewPurchaseOrderRealCost(
        user as Parameters<typeof userCanViewPurchaseOrderRealCost>[0],
      );
    const withoutRealCost = canViewRealCost ? batch : omitPurchaseOrderRealCost(batch);
    return canViewMargin ? withoutRealCost : omitInventoryBatchMargin(withoutRealCost);
  }
}
