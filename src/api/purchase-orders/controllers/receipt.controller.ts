import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TenantModuleValidationGuard } from '../../auth/tenant-module-validation.guard';
import { ReceiptService } from '../services/receipt.service';
import { ReceivePurchaseOrderDto } from '../dto';

/**
 * Receipt Controller
 * Handles HTTP endpoints for purchase order receipt operations
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2, 9.3, 9.4
 */
@Controller('tenant/purchase-orders')
@UseGuards(JwtAuthGuard, TenantModuleValidationGuard)
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  /**
   * POST endpoint to receive a purchase order
   * Accepts received quantities and creates inventory batches
   * Updates purchase order status to "Recibida"
   * Returns updated purchase order with all received data
   *
   * @param id - The purchase order ID
   * @param dto - The receipt data (received items)
   * @param req - The HTTP request object containing user context
   * @returns The updated purchase order with all received data
   * @throws NotFoundException if PO not found or doesn't belong to tenant
   * @throws BadRequestException if validation fails
   */
  @Post(':id/receipt')
  @HttpCode(HttpStatus.OK)
  async receive(
    @Param('id') id: string,
    @Body() dto: ReceivePurchaseOrderDto,
    @Req() req: any,
  ) {
    // Extract tenant ID from request context (Requirement 1.1)
    const tenantId = req.user.tenant_id;

    // Extract user ID from authenticated request (Requirement 1.2)
    const userId = req.user.id;

    // Call ReceiptService.receive() with DTO, tenant ID, and user ID (Requirement 1.3, 1.4, 1.5)
    // Return updated purchase order in response (Requirement 9.1, 9.2, 9.3, 9.4)
    return this.receiptService.receive(id, dto, tenantId, userId);
  }
}
