import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('tenant/purchase-orders/:id/payments')
@ApiTags('Payments')
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Post()
  @RequirePermissions({ entityType: 'purchase_orders', action: 'Update' })
  @ApiOperation({ summary: 'Record a payment for a purchase order' })
  @ApiParam({ name: 'id', type: 'string', description: 'Purchase Order ID' })
  @ApiBody({ type: RecordPaymentDto })
  @ApiResponse({ status: 201, description: 'Payment recorded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  @ApiResponse({ status: 409, description: 'Conflict - PO is cancelled' })
  recordPayment(@Param('id') poId: string, @Body() dto: RecordPaymentDto, @Req() req) {
    return this.service.recordPayment(poId, dto, req.user.tenantId);
  }

  @Get()
  @RequirePermissions({ entityType: 'purchase_orders', action: 'Read' })
  @ApiOperation({ summary: 'Get payment information for a purchase order' })
  @ApiParam({ name: 'id', type: 'string', description: 'Purchase Order ID' })
  @ApiResponse({ status: 200, description: 'Payment information retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  getPaymentInfo(@Param('id') poId: string, @Req() req) {
    return this.service.getPaymentInfo(poId, req.user.tenantId);
  }
}
