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
import { SalesOrderService } from './sales-order.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { QuerySalesOrderDto } from './dto/query-sales-order.dto';
import { PaginatedSalesOrderDto } from './dto/paginated-sales-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('tenant/sales-orders')
@ApiTags('Sales Orders')
@ApiBearerAuth()
export class SalesOrderController {
  constructor(private readonly salesOrderService: SalesOrderService) {}

  @Post()
  @RequirePermissions({ entityType: 'sales_orders', action: 'Create' })
  @ApiOperation({ summary: 'Create a new sales order' })
  @ApiBody({ type: CreateSalesOrderDto })
  @ApiResponse({ status: 201, description: 'Sales order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  create(@Body() dto: CreateSalesOrderDto, @Req() req) {
    return this.salesOrderService.create(dto, req.user.tenantId);
  }

  @Get()
  @RequirePermissions({ entityType: 'sales_orders', action: 'Read' })
  @ApiOperation({ summary: 'Get paginated sales orders with search and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for filtering by name' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by status' })
  @ApiResponse({ status: 200, description: 'List of sales orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  findAll(@Query() query: QuerySalesOrderDto, @Req() req): Promise<PaginatedSalesOrderDto> {
    return this.salesOrderService.findAll(req.user.tenantId, query);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'sales_orders', action: 'Read' })
  @ApiOperation({ summary: 'Get a specific sales order by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Sales order UUID' })
  @ApiResponse({ status: 200, description: 'Sales order retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - Sales order does not exist' })
  findOne(@Param('id') id: string, @Req() req) {
    return this.salesOrderService.findOne(id, req.user.tenantId);
  }

  @Put(':id')
  @RequirePermissions({ entityType: 'sales_orders', action: 'Update' })
  @ApiOperation({ summary: 'Update an existing sales order' })
  @ApiParam({ name: 'id', type: 'string', description: 'Sales order UUID' })
  @ApiBody({ type: UpdateSalesOrderDto })
  @ApiResponse({ status: 200, description: 'Sales order updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - Sales order does not exist' })
  update(@Param('id') id: string, @Body() dto: UpdateSalesOrderDto, @Req() req) {
    return this.salesOrderService.update(id, dto, req.user.tenantId, req.user.id);
  }

  @Delete(':id')
  @HttpCode(200)
  @RequirePermissions({ entityType: 'sales_orders', action: 'Delete' })
  @ApiOperation({ summary: 'Delete a sales order by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Sales order UUID' })
  @ApiResponse({ status: 200, description: 'Sales order deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - Sales order does not exist' })
  remove(@Param('id') id: string, @Req() req) {
    return this.salesOrderService.remove(id, req.user.tenantId);
  }
}
