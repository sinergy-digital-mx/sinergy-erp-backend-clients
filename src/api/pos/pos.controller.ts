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
import { POSService } from './pos.service';
import { CashShiftService } from './cash-shift.service';
import { POSReportService } from './pos-report.service';
import { CreatePOSOrderDto } from './dto/create-pos-order.dto';
import { QueryPOSOrderDto } from './dto/query-pos-order.dto';
import { AddLineItemDto } from './dto/add-line-item.dto';
import { UpdateLineItemDto } from './dto/update-line-item.dto';
import { UpdateLineStatusDto } from './dto/update-line-status.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { SplitPaymentDto } from './dto/split-payment.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { OpenCashShiftDto } from './dto/open-cash-shift.dto';
import { CloseCashShiftDto } from './dto/close-cash-shift.dto';
import { DailySalesQueryDto } from './dto/daily-sales-query.dto';
import { WaiterPerformanceQueryDto } from './dto/waiter-performance-query.dto';
import { TopProductsQueryDto } from './dto/top-products-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('tenant/pos')
@ApiTags('POS')
@ApiBearerAuth()
export class POSController {
  constructor(
    private readonly posService: POSService,
    private readonly cashShiftService: CashShiftService,
    private readonly posReportService: POSReportService,
  ) {}

  /**
   * ========================================
   * ORDER ENDPOINTS
   * ========================================
   */

  @Post('orders')
  @RequirePermissions({ entityType: 'pos', action: 'Create' })
  @ApiOperation({ summary: 'Create a new POS order' })
  @ApiBody({ type: CreatePOSOrderDto })
  @ApiResponse({ status: 201, description: 'POS order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - Warehouse or table does not exist' })
  createOrder(@Body() dto: CreatePOSOrderDto, @Req() req) {
    return this.posService.createOrder(dto, req.user.tenantId, req.user.id);
  }

  @Get('orders')
  @RequirePermissions({ entityType: 'pos', action: 'Read' })
  @ApiOperation({ summary: 'Get POS orders with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'warehouse_id', required: false, type: String, description: 'Filter by warehouse ID' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by status' })
  @ApiQuery({ name: 'waiter_id', required: false, type: String, description: 'Filter by waiter ID' })
  @ApiQuery({ name: 'cashier_id', required: false, type: String, description: 'Filter by cashier ID' })
  @ApiQuery({ name: 'table_number', required: false, type: String, description: 'Filter by table number' })
  @ApiQuery({ name: 'zone', required: false, type: String, description: 'Filter by zone' })
  @ApiQuery({ name: 'date_from', required: false, type: String, description: 'Filter from date (ISO 8601)' })
  @ApiQuery({ name: 'date_to', required: false, type: String, description: 'Filter to date (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'List of POS orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  findOrders(@Query() query: QueryPOSOrderDto, @Req() req) {
    return this.posService.findOrders(req.user.tenantId, query);
  }

  @Get('orders/:id')
  @RequirePermissions({ entityType: 'pos', action: 'Read' })
  @ApiOperation({ summary: 'Get a specific POS order by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'POS order UUID' })
  @ApiResponse({ status: 200, description: 'POS order retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - POS order does not exist' })
  findOrder(@Param('id') id: string, @Req() req) {
    return this.posService.findOrder(id, req.user.tenantId);
  }

  @Post('orders/:id/cancel')
  @HttpCode(200)
  @RequirePermissions({ entityType: 'pos', action: 'Delete' })
  @ApiOperation({ summary: 'Cancel a POS order' })
  @ApiParam({ name: 'id', type: 'string', description: 'POS order UUID' })
  @ApiBody({ type: CancelOrderDto })
  @ApiResponse({ status: 200, description: 'POS order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Order already paid or cancelled' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - POS order does not exist' })
  cancelOrder(@Param('id') id: string, @Body() dto: CancelOrderDto, @Req() req) {
    return this.posService.cancelOrder(id, req.user.tenantId, dto.reason);
  }

  /**
   * ========================================
   * LINE ITEM ENDPOINTS
   * ========================================
   */

  @Post('orders/:id/lines')
  @RequirePermissions({ entityType: 'pos', action: 'Update' })
  @ApiOperation({ summary: 'Add a line item to a POS order' })
  @ApiParam({ name: 'id', type: 'string', description: 'POS order UUID' })
  @ApiBody({ type: AddLineItemDto })
  @ApiResponse({ status: 201, description: 'Line item added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data or order already paid' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - Order, product, or UoM does not exist' })
  addLineItem(@Param('id') id: string, @Body() dto: AddLineItemDto, @Req() req) {
    return this.posService.addLineItem(id, dto, req.user.tenantId);
  }

  @Put('lines/:id')
  @RequirePermissions({ entityType: 'pos', action: 'Update' })
  @ApiOperation({ summary: 'Update a line item' })
  @ApiParam({ name: 'id', type: 'string', description: 'Line item UUID' })
  @ApiBody({ type: UpdateLineItemDto })
  @ApiResponse({ status: 200, description: 'Line item updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data or order already paid' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - Line item does not exist' })
  updateLineItem(@Param('id') id: string, @Body() dto: UpdateLineItemDto, @Req() req) {
    return this.posService.updateLineItem(id, dto, req.user.tenantId);
  }

  @Delete('lines/:id')
  @HttpCode(200)
  @RequirePermissions({ entityType: 'pos', action: 'Update' })
  @ApiOperation({ summary: 'Remove a line item from order' })
  @ApiParam({ name: 'id', type: 'string', description: 'Line item UUID' })
  @ApiResponse({ status: 200, description: 'Line item removed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Order already paid' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - Line item does not exist' })
  removeLineItem(@Param('id') id: string, @Req() req) {
    return this.posService.removeLineItem(id, req.user.tenantId);
  }

  /**
   * ========================================
   * PAYMENT ENDPOINTS
   * ========================================
   */

  @Post('orders/:id/payment')
  @RequirePermissions({ entityType: 'pos', action: 'Payment' })
  @ApiOperation({ summary: 'Process payment for a POS order' })
  @ApiParam({ name: 'id', type: 'string', description: 'POS order UUID' })
  @ApiBody({ type: ProcessPaymentDto })
  @ApiResponse({ status: 201, description: 'Payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid payment data or order already paid' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions or no open cash shift' })
  @ApiResponse({ status: 404, description: 'Not found - POS order does not exist' })
  processPayment(@Param('id') id: string, @Body() dto: ProcessPaymentDto, @Req() req) {
    return this.posService.processPayment(id, dto, req.user.tenantId, req.user.id);
  }

  @Post('orders/:id/split-payment')
  @RequirePermissions({ entityType: 'pos', action: 'Payment' })
  @ApiOperation({ summary: 'Process split payment for a POS order' })
  @ApiParam({ name: 'id', type: 'string', description: 'POS order UUID' })
  @ApiBody({ type: SplitPaymentDto })
  @ApiResponse({ status: 201, description: 'Split payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid payment data, sum mismatch, or order already paid' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions or no open cash shift' })
  @ApiResponse({ status: 404, description: 'Not found - POS order does not exist' })
  processSplitPayment(@Param('id') id: string, @Body() dto: SplitPaymentDto, @Req() req) {
    return this.posService.processSplitPayment(id, dto.payments, req.user.tenantId, req.user.id);
  }

  /**
   * ========================================
   * CASH SHIFT ENDPOINTS
   * ========================================
   */

  @Post('cash-shifts/open')
  @RequirePermissions({ entityType: 'pos', action: 'CashShift' })
  @ApiOperation({ summary: 'Open a new cash shift' })
  @ApiBody({ type: OpenCashShiftDto })
  @ApiResponse({ status: 201, description: 'Cash shift opened successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - Warehouse does not exist' })
  @ApiResponse({ status: 409, description: 'Conflict - User already has an open shift for this warehouse' })
  openCashShift(@Body() dto: OpenCashShiftDto, @Req() req) {
    return this.cashShiftService.openShift(dto, req.user.tenantId, req.user.id);
  }

  @Post('cash-shifts/:id/close')
  @HttpCode(200)
  @RequirePermissions({ entityType: 'pos', action: 'CashShift' })
  @ApiOperation({ summary: 'Close an open cash shift' })
  @ApiParam({ name: 'id', type: 'string', description: 'Cash shift UUID' })
  @ApiBody({ type: CloseCashShiftDto })
  @ApiResponse({ status: 200, description: 'Cash shift closed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Shift already closed or invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - Cash shift does not exist' })
  closeCashShift(@Param('id') id: string, @Body() dto: CloseCashShiftDto, @Req() req) {
    return this.cashShiftService.closeShift(id, dto, req.user.tenantId);
  }

  @Get('cash-shifts/current')
  @RequirePermissions({ entityType: 'pos', action: 'CashShift' })
  @ApiOperation({ summary: 'Get current open cash shift for user' })
  @ApiQuery({ name: 'warehouse_id', required: true, type: String, description: 'Warehouse ID' })
  @ApiResponse({ status: 200, description: 'Current cash shift retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - No open shift found' })
  getCurrentShift(@Query('warehouse_id') warehouseId: string, @Req() req) {
    return this.cashShiftService.getCurrentShift(req.user.id, warehouseId, req.user.tenantId);
  }

  @Get('cash-shifts/:id/report')
  @RequirePermissions({ entityType: 'pos', action: 'Reports' })
  @ApiOperation({ summary: 'Get cash shift report with all transactions' })
  @ApiParam({ name: 'id', type: 'string', description: 'Cash shift UUID' })
  @ApiResponse({ status: 200, description: 'Cash shift report retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - Cash shift does not exist' })
  getShiftReport(@Param('id') id: string, @Req() req) {
    return this.cashShiftService.getShiftReport(id, req.user.tenantId);
  }

  /**
   * ========================================
   * KITCHEN ENDPOINTS
   * ========================================
   */

  @Get('kitchen/orders')
  @RequirePermissions({ entityType: 'pos', action: 'Read' })
  @ApiOperation({ summary: 'Get orders for kitchen display' })
  @ApiQuery({ name: 'warehouse_id', required: true, type: String, description: 'Warehouse ID' })
  @ApiResponse({ status: 200, description: 'Kitchen orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  getKitchenOrders(@Query('warehouse_id') warehouseId: string, @Req() req) {
    return this.posService.getKitchenOrders(warehouseId, req.user.tenantId);
  }

  @Put('kitchen/lines/:id/status')
  @RequirePermissions({ entityType: 'pos', action: 'Update' })
  @ApiOperation({ summary: 'Update line item status for kitchen' })
  @ApiParam({ name: 'id', type: 'string', description: 'Line item UUID' })
  @ApiBody({ type: UpdateLineStatusDto })
  @ApiResponse({ status: 200, description: 'Line item status updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid status' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - Line item does not exist' })
  updateLineStatus(@Param('id') id: string, @Body() dto: UpdateLineStatusDto, @Req() req) {
    return this.posService.updateLineStatus(id, dto.status, req.user.tenantId);
  }

  /**
   * ========================================
   * REPORT ENDPOINTS
   * ========================================
   */

  @Get('reports/daily-sales')
  @RequirePermissions({ entityType: 'pos', action: 'Reports' })
  @ApiOperation({ summary: 'Get daily sales report' })
  @ApiQuery({ name: 'warehouse_id', required: true, type: String, description: 'Warehouse ID' })
  @ApiQuery({ name: 'date', required: true, type: String, description: 'Date (ISO 8601 format)' })
  @ApiResponse({ status: 200, description: 'Daily sales report retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  getDailySalesReport(@Query() query: DailySalesQueryDto, @Req() req) {
    return this.posReportService.getDailySalesReport(
      query.warehouse_id,
      new Date(query.date),
      req.user.tenantId,
    );
  }

  @Get('reports/waiter-performance')
  @RequirePermissions({ entityType: 'pos', action: 'Reports' })
  @ApiOperation({ summary: 'Get waiter performance report' })
  @ApiQuery({ name: 'waiter_id', required: true, type: String, description: 'Waiter ID' })
  @ApiQuery({ name: 'date_from', required: true, type: String, description: 'Date from (ISO 8601)' })
  @ApiQuery({ name: 'date_to', required: true, type: String, description: 'Date to (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Waiter performance report retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  getWaiterPerformance(@Query() query: WaiterPerformanceQueryDto, @Req() req) {
    return this.posReportService.getWaiterPerformance(
      query.waiter_id,
      new Date(query.date_from),
      new Date(query.date_to),
      req.user.tenantId,
    );
  }

  @Get('reports/top-products')
  @RequirePermissions({ entityType: 'pos', action: 'Reports' })
  @ApiOperation({ summary: 'Get top selling products report' })
  @ApiQuery({ name: 'warehouse_id', required: true, type: String, description: 'Warehouse ID' })
  @ApiQuery({ name: 'date_from', required: true, type: String, description: 'Date from (ISO 8601)' })
  @ApiQuery({ name: 'date_to', required: true, type: String, description: 'Date to (ISO 8601)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of products (default: 10)' })
  @ApiResponse({ status: 200, description: 'Top products report retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  getTopProducts(@Query() query: TopProductsQueryDto, @Req() req) {
    return this.posReportService.getTopProducts(
      query.warehouse_id,
      new Date(query.date_from),
      new Date(query.date_to),
      req.user.tenantId,
    );
  }

  @Get('reports/sales-by-hour')
  @RequirePermissions({ entityType: 'pos', action: 'Reports' })
  @ApiOperation({ summary: 'Get sales by hour report' })
  @ApiQuery({ name: 'warehouse_id', required: true, type: String, description: 'Warehouse ID' })
  @ApiQuery({ name: 'date', required: true, type: String, description: 'Date (ISO 8601 format)' })
  @ApiResponse({ status: 200, description: 'Sales by hour report retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  getSalesByHour(@Query() query: DailySalesQueryDto, @Req() req) {
    return this.posReportService.getSalesByHour(
      query.warehouse_id,
      new Date(query.date),
      req.user.tenantId,
    );
  }

  @Get('reports/sales-by-payment-method')
  @RequirePermissions({ entityType: 'pos', action: 'Reports' })
  @ApiOperation({ summary: 'Get sales by payment method report' })
  @ApiQuery({ name: 'warehouse_id', required: true, type: String, description: 'Warehouse ID' })
  @ApiQuery({ name: 'date_from', required: true, type: String, description: 'Date from (ISO 8601)' })
  @ApiQuery({ name: 'date_to', required: true, type: String, description: 'Date to (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Sales by payment method report retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  getSalesByPaymentMethod(@Query() query: TopProductsQueryDto, @Req() req) {
    return this.posReportService.getSalesByPaymentMethod(
      query.warehouse_id,
      new Date(query.date_from),
      new Date(query.date_to),
      req.user.tenantId,
    );
  }
}
