import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
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
} from '@nestjs/swagger';
import { LineItemService } from './line-item.service';
import { CreateLineItemDto } from './dto/create-line-item.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('tenant/purchase-orders/:po-id/line-items')
@ApiTags('Line Items')
@ApiBearerAuth()
export class LineItemController {
  constructor(private readonly service: LineItemService) {}

  @Post()
  @RequirePermissions({ entityType: 'purchase_orders', action: 'Update' })
  @ApiOperation({ summary: 'Add a line item to a purchase order' })
  @ApiParam({ name: 'po-id', type: 'string', description: 'Purchase Order ID' })
  @ApiBody({ type: CreateLineItemDto })
  @ApiResponse({ status: 201, description: 'Line item created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  @ApiResponse({ status: 409, description: 'Conflict - PO is cancelled' })
  create(@Param('po-id') poId: string, @Body() dto: CreateLineItemDto, @Req() req) {
    return this.service.addLineItem(poId, dto, req.user.tenantId);
  }

  @Put(':item-id')
  @RequirePermissions({ entityType: 'purchase_orders', action: 'Update' })
  @ApiOperation({ summary: 'Update a line item' })
  @ApiParam({ name: 'po-id', type: 'string', description: 'Purchase Order ID' })
  @ApiParam({ name: 'item-id', type: 'string', description: 'Line Item ID' })
  @ApiBody({ type: CreateLineItemDto })
  @ApiResponse({ status: 200, description: 'Line item updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Conflict - PO is cancelled' })
  update(
    @Param('po-id') poId: string,
    @Param('item-id') itemId: string,
    @Body() dto: CreateLineItemDto,
    @Req() req,
  ) {
    return this.service.editLineItem(poId, itemId, dto, req.user.tenantId);
  }

  @Delete(':item-id')
  @RequirePermissions({ entityType: 'purchase_orders', action: 'Update' })
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a line item' })
  @ApiParam({ name: 'po-id', type: 'string', description: 'Purchase Order ID' })
  @ApiParam({ name: 'item-id', type: 'string', description: 'Line Item ID' })
  @ApiResponse({ status: 200, description: 'Line item deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Conflict - PO is cancelled' })
  remove(@Param('po-id') poId: string, @Param('item-id') itemId: string, @Req() req) {
    return this.service.removeLineItem(poId, itemId, req.user.tenantId);
  }
}
