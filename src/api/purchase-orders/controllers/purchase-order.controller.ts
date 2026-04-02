import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TenantModuleValidationGuard } from '../../auth/tenant-module-validation.guard';
import { PurchaseOrderService } from '../services/purchase-order.service';
import { PurchaseOrderDocumentsService } from '../services/purchase-order-documents.service';
import {
  CreatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
  UpdateLineItemDto,
  QueryPurchaseOrderDto,
} from '../dto';

@Controller('tenant/purchase-orders')
@UseGuards(JwtAuthGuard, TenantModuleValidationGuard)
export class PurchaseOrderController {
  constructor(
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly documentsService: PurchaseOrderDocumentsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePurchaseOrderDto, @Req() req: any) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.purchaseOrderService.create(dto, tenantId, userId);
  }

  @Get()
  async findAll(@Query() filters: QueryPurchaseOrderDto, @Req() req: any) {
    const tenantId = req.user.tenant_id;
    return this.purchaseOrderService.findAll(tenantId, filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user.tenant_id;
    const purchaseOrder = await this.purchaseOrderService.findOne(id, tenantId);
    
    // Get documents for this purchase order
    const documents = await this.documentsService.getDocuments(id);

    return {
      data: {
        header: purchaseOrder,
        products: purchaseOrder.line_items || [],
        batches: [],
        documents: documents,
        payments: [],
      },
    };
  }

  @Post(':id/receive')
  async receive(
    @Param('id') id: string,
    @Body() dto: ReceivePurchaseOrderDto,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.purchaseOrderService.receive(id, dto, tenantId, userId);
  }

  @Delete(':id')
  async cancel(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.purchaseOrderService.cancel(id, tenantId, userId);
  }

  @Patch(':orderId/line-items/:lineItemId')
  async updateLineItem(
    @Param('orderId') orderId: string,
    @Param('lineItemId') lineItemId: string,
    @Body() dto: UpdateLineItemDto,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.purchaseOrderService.updateLineItem(
      orderId,
      lineItemId,
      dto,
      tenantId,
      userId,
    );
  }

  @Post(':id/regenerate-documento-original')
  async regenerateDocumentoOriginal(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.purchaseOrderService.regenerateDocumentoOriginal(id, tenantId, userId);
  }

  @Post(':id/regenerate-recepcion')
  async regenerateRecepcion(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.purchaseOrderService.regenerateRecepcionDocument(id, tenantId, userId);
  }
}
