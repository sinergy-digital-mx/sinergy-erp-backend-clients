import {
  Controller,
  Post,
  Get,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TenantModuleValidationGuard } from '../../auth/tenant-module-validation.guard';
import { PurchaseOrderService } from '../services/purchase-order.service';
import { PurchaseOrderDocumentsService } from '../services/purchase-order-documents.service';
import { PurchaseOrderExportService } from '../services/purchase-order-export.service';
import {
  CreatePurchaseOrderDto,
  CreateLineItemDto,
  ReceivePurchaseOrderDto,
  UpdateLineItemDto,
  QueryPurchaseOrderDto,
  CreatePurchaseOrderPaymentDto,
  RegenerateDocumentDto,
  UpdatePurchaseOrderNotesDto,
  UpdatePurchaseOrderPedimentoDto,
  QueryPurchaseOrderHeaderExportDto,
  QueryPurchaseOrderDetailExportDto,
} from '../dto';

@Controller('tenant/purchase-orders')
@UseGuards(JwtAuthGuard, TenantModuleValidationGuard)
export class PurchaseOrderController {
  constructor(
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly documentsService: PurchaseOrderDocumentsService,
    private readonly exportService: PurchaseOrderExportService,
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

  @Get('export/excel/headers')
  async exportHeadersExcel(
    @Query() filters: QueryPurchaseOrderHeaderExportDto,
    @Req() req: any,
    @Res() res: any,
  ) {
    const buffer = await this.exportService.exportHeaders(req.user.tenant_id, filters);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${this.exportService.getHeadersFilename()}"`,
    );
    res.send(buffer);
  }

  @Get('export/excel/details')
  async exportDetailsExcel(
    @Query() filters: QueryPurchaseOrderDetailExportDto,
    @Req() req: any,
    @Res() res: any,
  ) {
    const buffer = await this.exportService.exportDetails(req.user.tenant_id, filters);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${this.exportService.getDetailsFilename(filters.created_from, filters.created_to)}"`,
    );
    res.send(buffer);
  }

  /* Rutas con más segmentos antes que `:id` suelto (evita conflictos en el router). */

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

  @Post(':id/line-items')
  @HttpCode(HttpStatus.CREATED)
  async addLineItem(
    @Param('id') id: string,
    @Body() dto: CreateLineItemDto,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.purchaseOrderService.addLineItem(id, dto, tenantId, userId);
  }

  @Get(':id/payments')
  async getPayments(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user.tenant_id;
    return this.purchaseOrderService.getPayments(id, tenantId);
  }

  @Post(':id/payments')
  @HttpCode(HttpStatus.CREATED)
  async createPayment(
    @Param('id') id: string,
    @Body() dto: CreatePurchaseOrderPaymentDto,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.purchaseOrderService.createPayment(id, dto, tenantId, userId);
  }

  @Delete(':id/payments/:paymentId')
  @HttpCode(HttpStatus.OK)
  async deletePayment(
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.purchaseOrderService.deletePayment(id, paymentId, tenantId, userId);
  }

  @Post(':id/regenerate-documento-original')
  async regenerateDocumentoOriginal(
    @Param('id') id: string,
    @Body() dto: RegenerateDocumentDto,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.purchaseOrderService.regenerateDocumentoOriginal(
      id,
      tenantId,
      userId,
      dto.language,
      dto.keep_previous ?? false,
    );
  }

  @Post(':id/regenerate-recepcion')
  async regenerateRecepcion(
    @Param('id') id: string,
    @Body() dto: RegenerateDocumentDto,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.purchaseOrderService.regenerateRecepcionDocument(
      id,
      tenantId,
      userId,
      dto.language,
      dto.keep_previous ?? false,
    );
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

  @Delete(':orderId/line-items/:lineItemId')
  @HttpCode(HttpStatus.OK)
  async removeLineItem(
    @Param('orderId') orderId: string,
    @Param('lineItemId') lineItemId: string,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.purchaseOrderService.removeLineItem(
      orderId,
      lineItemId,
      tenantId,
      userId,
    );
  }

  @Patch(':id/notes')
  async updateNotes(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderNotesDto,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.purchaseOrderService.updateNotes(id, dto, tenantId, userId);
  }

  @Patch(':id/pedimento')
  async updatePedimento(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderPedimentoDto,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.purchaseOrderService.updatePedimento(id, dto, tenantId, userId);
  }

  /**
   * Reemplazo completo de la OC (mismo JSON que POST create: cabecera + line_items).
   * Solo estado Creada. PUT y PATCH son equivalentes (dos métodos para registro explícito).
   */
  @Put(':id')
  async replacePurchaseOrderPut(
    @Param('id') id: string,
    @Body() dto: CreatePurchaseOrderDto,
    @Req() req: any,
  ) {
    return this.runReplacePurchaseOrder(id, dto, req);
  }

  @Patch(':id')
  async replacePurchaseOrderPatch(
    @Param('id') id: string,
    @Body() dto: CreatePurchaseOrderDto,
    @Req() req: any,
  ) {
    return this.runReplacePurchaseOrder(id, dto, req);
  }

  private runReplacePurchaseOrder(
    id: string,
    dto: CreatePurchaseOrderDto,
    req: any,
  ) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.purchaseOrderService.replacePurchaseOrder(id, dto, tenantId, userId);
  }

  @Delete(':id')
  async cancel(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.purchaseOrderService.cancel(id, tenantId, userId);
  }

  /** Debe ir al final: captura cualquier segmento único (p. ej. UUID de la OC). */
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user.tenant_id;
    const purchaseOrder = await this.purchaseOrderService.findOne(id, tenantId);
    const paymentData = await this.purchaseOrderService.getPayments(id, tenantId);

    const documents = await this.documentsService.getDocuments(id);

    return {
      data: {
        header: purchaseOrder,
        products: purchaseOrder.line_items || [],
        batches: [],
        documents: documents,
        payments: paymentData.payments,
        payments_summary: paymentData.summary,
      },
    };
  }
}
