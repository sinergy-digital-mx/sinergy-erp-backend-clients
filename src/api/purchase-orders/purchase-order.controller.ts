import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  Delete,
  Query,
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
import { PurchaseOrderService } from './purchase-order.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { QueryPurchaseOrderDto } from './dto/query-purchase-order.dto';
import { CancelPurchaseOrderDto } from './dto/cancel-purchase-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('tenant/purchase-orders')
@ApiTags('Purchase Orders')
@ApiBearerAuth()
export class PurchaseOrderController {
  constructor(private readonly service: PurchaseOrderService) {}

  @Post()
  @RequirePermissions({ entityType: 'purchase_orders', action: 'Create' })
  @ApiOperation({ summary: 'Create a new purchase order' })
  @ApiBody({ type: CreatePurchaseOrderDto })
  @ApiResponse({ status: 201, description: 'Purchase order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  create(@Body() dto: CreatePurchaseOrderDto, @Req() req) {
    return this.service.create(dto, req.user.tenantId, req.user.id);
  }

  @Get()
  @RequirePermissions({ entityType: 'purchase_orders', action: 'Read' })
  @ApiOperation({ summary: 'Get paginated purchase orders with search and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'vendor_id', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'start_date', required: false, type: String })
  @ApiQuery({ name: 'end_date', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of purchase orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Query() query: QueryPurchaseOrderDto, @Req() req) {
    return this.service.findAll(req.user.tenantId, query);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'purchase_orders', action: 'Read' })
  @ApiOperation({ summary: 'Get a specific purchase order by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Purchase Order ID' })
  @ApiResponse({ status: 200, description: 'Purchase order retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string, @Req() req) {
    return this.service.findOne(id, req.user.tenantId);
  }

  @Put(':id')
  @RequirePermissions({ entityType: 'purchase_orders', action: 'Update' })
  @ApiOperation({ summary: 'Update an existing purchase order' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: UpdatePurchaseOrderDto })
  @ApiResponse({ status: 200, description: 'Purchase order updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderDto, @Req() req) {
    return this.service.update(id, dto, req.user.tenantId);
  }

  @Put(':id/status')
  @RequirePermissions({ entityType: 'purchase_orders', action: 'Update' })
  @ApiOperation({ summary: 'Update purchase order status' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ schema: { properties: { status: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  updateStatus(@Param('id') id: string, @Body() body: { status: string }, @Req() req) {
    return this.service.updateStatus(id, body.status, req.user.tenantId);
  }

  @Post(':id/cancel')
  @RequirePermissions({ entityType: 'purchase_orders', action: 'Update' })
  @ApiOperation({ summary: 'Cancel a purchase order' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: CancelPurchaseOrderDto })
  @ApiResponse({ status: 200, description: 'Purchase order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Conflict - Already cancelled' })
  cancelPurchaseOrder(@Param('id') id: string, @Body() dto: CancelPurchaseOrderDto, @Req() req) {
    return this.service.cancelPurchaseOrder(id, dto, req.user.tenantId);
  }

  @Delete(':id')
  @RequirePermissions({ entityType: 'purchase_orders', action: 'Delete' })
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a purchase order by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Purchase order deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id') id: string, @Req() req) {
    return this.service.remove(id, req.user.tenantId);
  }
}
