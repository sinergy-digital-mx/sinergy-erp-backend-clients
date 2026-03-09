import {
  Controller,
  Post,
  Put,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { QueryInventoryItemDto } from './dto/query-inventory-item.dto';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { QueryInventoryMovementDto } from './dto/query-inventory-movement.dto';
import { CreateStockReservationDto } from './dto/create-stock-reservation.dto';
import { QueryStockReservationDto } from './dto/query-stock-reservation.dto';
import { TransferInventoryDto } from './dto/transfer-inventory.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('tenant/inventory')
@ApiTags('Inventory')
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * ========================================
   * INVENTORY ITEMS ENDPOINTS (Tasks 13.1-13.2)
   * ========================================
   */

  @Post('items')
  @RequirePermissions({ entityType: 'inventory', action: 'Create' })
  @ApiOperation({ summary: 'Create a new inventory item' })
  @ApiBody({ type: CreateInventoryItemDto })
  @ApiResponse({ status: 201, description: 'Inventory item created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - Referenced entity does not exist' })
  @ApiResponse({ status: 409, description: 'Conflict - Inventory item already exists' })
  createInventoryItem(@Body() dto: CreateInventoryItemDto, @Req() req) {
    return this.inventoryService.createInventoryItem(dto, req.user.tenantId);
  }

  @Get('items')
  @RequirePermissions({ entityType: 'inventory', action: 'Read' })
  @ApiOperation({ summary: 'Get paginated inventory items with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'product_id', required: false, type: String, description: 'Filter by product ID' })
  @ApiQuery({ name: 'warehouse_id', required: false, type: String, description: 'Filter by warehouse ID' })
  @ApiQuery({ name: 'location', required: false, type: String, description: 'Filter by location' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by product name or SKU' })
  @ApiQuery({ name: 'low_stock', required: false, type: Boolean, description: 'Filter low stock items' })
  @ApiResponse({ status: 200, description: 'List of inventory items retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  findInventoryItems(@Query() query: QueryInventoryItemDto, @Req() req) {
    return this.inventoryService.findInventoryItems(req.user.tenantId, query);
  }

  @Get('items/:id')
  @RequirePermissions({ entityType: 'inventory', action: 'Read' })
  @ApiOperation({ summary: 'Get a specific inventory item by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Inventory item UUID' })
  @ApiResponse({ status: 200, description: 'Inventory item retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - Inventory item does not exist' })
  findInventoryItemById(@Param('id') id: string, @Req() req) {
    return this.inventoryService.findInventoryItemById(id, req.user.tenantId);
  }

  @Put('items/:id')
  @RequirePermissions({ entityType: 'inventory', action: 'Update' })
  @ApiOperation({ summary: 'Update an inventory item configuration' })
  @ApiParam({ name: 'id', type: 'string', description: 'Inventory item UUID' })
  @ApiBody({ type: UpdateInventoryItemDto })
  @ApiResponse({ status: 200, description: 'Inventory item updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - Inventory item does not exist' })
  updateInventoryItem(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryItemDto,
    @Req() req,
  ) {
    return this.inventoryService.updateInventoryItem(id, dto, req.user.tenantId);
  }

  @Delete('items/:id')
  @HttpCode(200)
  @RequirePermissions({ entityType: 'inventory', action: 'Delete' })
  @ApiOperation({ summary: 'Delete an inventory item' })
  @ApiParam({ name: 'id', type: 'string', description: 'Inventory item UUID' })
  @ApiResponse({ status: 200, description: 'Inventory item deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - Inventory item does not exist' })
  deleteInventoryItem(@Param('id') id: string, @Req() req) {
    return this.inventoryService.deleteInventoryItem(id, req.user.tenantId);
  }

  /**
   * ========================================
   * INVENTORY MOVEMENTS ENDPOINTS (Task 14.1)
   * ========================================
   */

  @Post('movements')
  @RequirePermissions({ entityType: 'inventory', action: 'Create' })
  @ApiOperation({ summary: 'Create a new inventory movement' })
  @ApiBody({ type: CreateInventoryMovementDto })
  @ApiResponse({ status: 201, description: 'Inventory movement created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data or insufficient stock' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - Referenced entity does not exist' })
  createInventoryMovement(@Body() dto: CreateInventoryMovementDto, @Req() req) {
    return this.inventoryService.createInventoryMovement(
      dto,
      req.user.tenantId,
      req.user.id,
    );
  }

  @Get('movements')
  @RequirePermissions({ entityType: 'inventory', action: 'Read' })
  @ApiOperation({ summary: 'Get paginated inventory movements with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'product_id', required: false, type: String, description: 'Filter by product ID' })
  @ApiQuery({ name: 'warehouse_id', required: false, type: String, description: 'Filter by warehouse ID' })
  @ApiQuery({ name: 'movement_type', required: false, type: String, description: 'Filter by movement type' })
  @ApiQuery({ name: 'movement_date_from', required: false, type: String, description: 'Filter by date from (YYYY-MM-DD)' })
  @ApiQuery({ name: 'movement_date_to', required: false, type: String, description: 'Filter by date to (YYYY-MM-DD)' })
  @ApiQuery({ name: 'reference_type', required: false, type: String, description: 'Filter by reference type' })
  @ApiQuery({ name: 'reference_id', required: false, type: String, description: 'Filter by reference ID' })
  @ApiQuery({ name: 'lot_number', required: false, type: String, description: 'Filter by lot number' })
  @ApiQuery({ name: 'serial_number', required: false, type: String, description: 'Filter by serial number' })
  @ApiResponse({ status: 200, description: 'List of inventory movements retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  findInventoryMovements(@Query() query: QueryInventoryMovementDto, @Req() req) {
    return this.inventoryService.findInventoryMovements(req.user.tenantId, query);
  }

  @Get('movements/:id')
  @RequirePermissions({ entityType: 'inventory', action: 'Read' })
  @ApiOperation({ summary: 'Get a specific inventory movement by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Inventory movement UUID' })
  @ApiResponse({ status: 200, description: 'Inventory movement retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - Inventory movement does not exist' })
  findInventoryMovementById(@Param('id') id: string, @Req() req) {
    return this.inventoryService.findInventoryMovementById(id, req.user.tenantId);
  }

  /**
   * ========================================
   * STOCK RESERVATIONS ENDPOINTS (Task 15.1)
   * ========================================
   */

  @Post('reservations')
  @RequirePermissions({ entityType: 'inventory', action: 'Create' })
  @ApiOperation({ summary: 'Create a stock reservation' })
  @ApiBody({ type: CreateStockReservationDto })
  @ApiResponse({ status: 201, description: 'Stock reservation created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data or insufficient stock' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - Referenced entity does not exist' })
  createStockReservation(@Body() dto: CreateStockReservationDto, @Req() req) {
    return this.inventoryService.createStockReservation(dto, req.user.tenantId);
  }

  @Post('reservations/:id/fulfill')
  @HttpCode(200)
  @RequirePermissions({ entityType: 'inventory', action: 'Update' })
  @ApiOperation({ summary: 'Fulfill a stock reservation' })
  @ApiParam({ name: 'id', type: 'string', description: 'Stock reservation UUID' })
  @ApiResponse({ status: 200, description: 'Stock reservation fulfilled successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid reservation status' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - Stock reservation does not exist' })
  fulfillStockReservation(@Param('id') id: string, @Req() req) {
    return this.inventoryService.fulfillStockReservation(
      id,
      req.user.tenantId,
      req.user.id,
    );
  }

  @Post('reservations/:id/cancel')
  @HttpCode(200)
  @RequirePermissions({ entityType: 'inventory', action: 'Update' })
  @ApiOperation({ summary: 'Cancel a stock reservation' })
  @ApiParam({ name: 'id', type: 'string', description: 'Stock reservation UUID' })
  @ApiResponse({ status: 200, description: 'Stock reservation cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid reservation status' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - Stock reservation does not exist' })
  cancelStockReservation(@Param('id') id: string, @Req() req) {
    return this.inventoryService.cancelStockReservation(id, req.user.tenantId);
  }

  @Get('reservations')
  @RequirePermissions({ entityType: 'inventory', action: 'Read' })
  @ApiOperation({ summary: 'Get paginated stock reservations' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'product_id', required: false, type: String, description: 'Filter by product ID' })
  @ApiQuery({ name: 'warehouse_id', required: false, type: String, description: 'Filter by warehouse ID' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by status' })
  @ApiQuery({ name: 'reference_type', required: false, type: String, description: 'Filter by reference type' })
  @ApiQuery({ name: 'reference_id', required: false, type: String, description: 'Filter by reference ID' })
  @ApiResponse({ status: 200, description: 'List of stock reservations retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  findStockReservations(@Query() query: QueryStockReservationDto, @Req() req) {
    return this.inventoryService.findStockReservations(req.user.tenantId, query);
  }

  /**
   * ========================================
   * TRANSFERS AND ADJUSTMENTS ENDPOINTS (Task 16.1)
   * ========================================
   */

  @Post('transfers')
  @RequirePermissions({ entityType: 'inventory', action: 'Create' })
  @ApiOperation({ summary: 'Transfer inventory between warehouses' })
  @ApiBody({ type: TransferInventoryDto })
  @ApiResponse({ status: 201, description: 'Inventory transfer completed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data or insufficient stock' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - Referenced entity does not exist' })
  transferInventory(@Body() dto: TransferInventoryDto, @Req() req) {
    return this.inventoryService.transferInventory(
      dto,
      req.user.tenantId,
      req.user.id,
    );
  }

  @Post('adjustments')
  @RequirePermissions({ entityType: 'inventory', action: 'Create' })
  @ApiOperation({ summary: 'Adjust inventory quantity' })
  @ApiBody({ type: AdjustInventoryDto })
  @ApiResponse({ status: 201, description: 'Inventory adjustment completed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data or insufficient stock' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - Referenced entity does not exist' })
  adjustInventory(@Body() dto: AdjustInventoryDto, @Req() req) {
    return this.inventoryService.adjustInventory(
      dto,
      req.user.tenantId,
      req.user.id,
    );
  }

  /**
   * ========================================
   * REPORTS ENDPOINTS (Task 17.1)
   * ========================================
   */

  @Get('reports/low-stock')
  @RequirePermissions({ entityType: 'inventory', action: 'Read' })
  @ApiOperation({ summary: 'Get low stock items' })
  @ApiResponse({ status: 200, description: 'List of low stock items retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  getLowStockItems(@Req() req) {
    return this.inventoryService.getLowStockItems(req.user.tenantId);
  }

  @Get('reports/valuation')
  @RequirePermissions({ entityType: 'inventory', action: 'Read' })
  @ApiOperation({ summary: 'Get inventory valuation report' })
  @ApiQuery({ name: 'warehouse_id', required: false, type: String, description: 'Filter by warehouse ID' })
  @ApiResponse({ status: 200, description: 'Inventory valuation report retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  getInventoryValuationReport(
    @Query('warehouse_id') warehouseId: string,
    @Req() req,
  ) {
    return this.inventoryService.getInventoryValuationReport(
      req.user.tenantId,
      warehouseId,
    );
  }

  @Get('reports/by-product/:productId')
  @RequirePermissions({ entityType: 'inventory', action: 'Read' })
  @ApiOperation({ summary: 'Get stock by product across all warehouses' })
  @ApiParam({ name: 'productId', type: 'string', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Stock by product retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  getStockByProduct(@Param('productId') productId: string, @Req() req) {
    return this.inventoryService.getStockByProduct(productId, req.user.tenantId);
  }

  @Get('reports/by-warehouse/:warehouseId')
  @RequirePermissions({ entityType: 'inventory', action: 'Read' })
  @ApiOperation({ summary: 'Get all stock in a warehouse' })
  @ApiParam({ name: 'warehouseId', type: 'string', description: 'Warehouse UUID' })
  @ApiResponse({ status: 200, description: 'Stock by warehouse retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  getStockByWarehouse(@Param('warehouseId') warehouseId: string, @Req() req) {
    return this.inventoryService.getStockByWarehouse(
      warehouseId,
      req.user.tenantId,
    );
  }
}
