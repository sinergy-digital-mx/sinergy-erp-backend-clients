import { Controller, UseGuards, Get, Query, Param, Req, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { BatchFilterDto } from './dto/batch-filter.dto';
import { BatchListResponseDto } from './dto/batch-list-response.dto';
import { BatchResponseDto } from './dto/batch-response.dto';
import { BatchDetailResponseDto } from './dto/batch-detail-response.dto';
import { InventorySummaryFilterDto } from './dto/inventory-summary-filter.dto';
import { InventorySummaryResponseDto } from './dto/inventory-summary-response.dto';
import { PosSessionInventorySummaryResponseDto } from './dto/pos-session-inventory-summary-response.dto';
import { InventoryLocationTreeResponseDto } from './dto/inventory-location-tree-response.dto';
import { InventoryStatsFilterDto } from './dto/inventory-stats-filter.dto';
import { InventoryStatsResponseDto } from './dto/inventory-stats-response.dto';
import { InventoryExportService } from './services/inventory-export.service';
import {
  QueryInventoryBatchExportDto,
  QueryInventorySummaryExportDto,
} from './dto/query-inventory-export.dto';

@Controller('tenant/inventory')
@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly exportService: InventoryExportService,
  ) {}

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
    const buffer = await this.exportService.exportSummary(req.user.tenant_id, filters);
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
  @RequirePermissions({ entityType: 'inventory', action: 'read' })
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
  @RequirePermissions({ entityType: 'inventory', action: 'read' })
  @ApiOperation({
    summary: 'KPIs de inventario para cards',
    description:
      'Totales de lotes, costo vs precio de venta, precio promedio y márgenes. Mismos filtros de ubicación que el listado.',
  })
  @ApiResponse({ status: 200, type: InventoryStatsResponseDto })
  @ApiQuery({ name: 'fiscal_configuration_id', required: false, type: String })
  @ApiQuery({ name: 'billing_branch_id', required: false, type: String })
  @ApiQuery({ name: 'warehouse_id', required: false, type: String })
  async getStats(
    @Query() filters: InventoryStatsFilterDto,
    @Req() req: any,
  ): Promise<InventoryStatsResponseDto> {
    return this.inventoryService.getStats(req.user.tenant_id, filters);
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
    return this.inventoryService.getInventorySummary(tenantId, filters);
  }

  @Get('pos/summary')
  @RequirePermissions({ entityType: 'inventory', action: 'read' })
  @ApiOperation({
    summary: 'Inventario POS por sucursal de la terminal',
    description:
      'Usa billing_branch_id del usuario POS logueado. warehouse_id es opcional; si se omite, incluye todos los almacenes de esa sucursal. La respuesta trae warehouses válidos para la UI.',
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
    return this.inventoryService.findById(id, tenantId);
  }
}
