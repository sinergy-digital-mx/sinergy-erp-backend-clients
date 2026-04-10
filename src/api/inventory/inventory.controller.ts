import { Controller, UseGuards, Get, Query, Param, Req } from '@nestjs/common';
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

@Controller('tenant/inventory')
@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

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
  @ApiQuery({ name: 'warehouse_id', required: false, type: String })
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
  @ApiQuery({ name: 'warehouse_id', required: false, type: String })
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
