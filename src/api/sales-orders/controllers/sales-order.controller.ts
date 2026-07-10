import {
  Controller, Post, Get, Put, Patch, Delete, Body, Param, Query,
  UseGuards, Req, HttpCode, HttpStatus, Res, UseInterceptors, UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TenantModuleValidationGuard } from '../../auth/tenant-module-validation.guard';
import { SalesOrderService } from '../services/sales-order.service';
import { SalesOrderDocumentsService } from '../services/sales-order-documents.service';
import { SalesOrderPosReceiptService } from '../services/sales-order-pos-receipt.service';
import { SalesOrderExportService } from '../services/sales-order-export.service';
import { SalesOrderInvoicingService } from '../services/sales-order-invoicing.service';
import { CancelElectronicInvoiceDto } from '../../electronic-invoicing/dto/cancel-electronic-invoice.dto';
import { StampSalesOrderInvoiceDto } from '../dto/stamp-sales-order-invoice.dto';
import { InventoryService } from '../../inventory/inventory.service';
import {
  CreateSalesOrderDto,
  QuerySalesOrderDto,
  FulfillSalesOrderDto,
  RegenerateDocumentDto,
  UpdateSalesOrderNotesDto,
  QuerySalesOrderHeaderExportDto,
  QuerySalesOrderDetailExportDto,
  CreateSalesOrderPaymentDto,
  UpdateSalesOrderSellerDto,
} from '../dto';

@ApiTags('Sales Orders')
@Controller('tenant/sales-orders')
@UseGuards(JwtAuthGuard, TenantModuleValidationGuard)
@ApiBearerAuth()
export class SalesOrderController {
  constructor(
    private readonly salesOrderService: SalesOrderService,
    private readonly documentsService: SalesOrderDocumentsService,
    private readonly posReceiptService: SalesOrderPosReceiptService,
    private readonly inventoryService: InventoryService,
    private readonly exportService: SalesOrderExportService,
    private readonly invoicingService: SalesOrderInvoicingService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new sales order',
    description:
      'Orders with sales_order_type POS are automatically fulfilled (inventory deducted via FIFO) in the same transaction.',
  })
  async create(@Body() dto: CreateSalesOrderDto, @Req() req: any) {
    return this.salesOrderService.create(dto, req.user.tenant_id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Replace/edit a sales order while it is Creada' })
  async replace(@Param('id') id: string, @Body() dto: CreateSalesOrderDto, @Req() req: any) {
    return this.salesOrderService.replace(id, dto, req.user.tenant_id, req.user.id);
  }

  @Patch(':id/notes')
  @ApiOperation({
    summary: 'Actualizar notas de la orden',
    description:
      'Permite editar solo el campo notes sin reemplazar líneas. Disponible en cualquier estado excepto Cancelada.',
  })
  async updateNotes(
    @Param('id') id: string,
    @Body() dto: UpdateSalesOrderNotesDto,
    @Req() req: any,
  ) {
    return this.salesOrderService.updateNotes(id, dto, req.user.tenant_id, req.user.id);
  }

  @Patch(':id/seller')
  @ApiOperation({
    summary: 'Cambiar vendedor de la orden',
    description:
      'Actualiza seller_user_id. Debe ser un usuario no-POS (quien usa código de vendedor).',
  })
  async updateSeller(
    @Param('id') id: string,
    @Body() dto: UpdateSalesOrderSellerDto,
    @Req() req: any,
  ) {
    return this.salesOrderService.updateSeller(
      id,
      dto.seller_user_id,
      req.user.tenant_id,
      req.user.id,
    );
  }

  @Get(':id/payments')
  @ApiOperation({ summary: 'Listar pagos de la orden de venta' })
  async getPayments(@Param('id') id: string, @Req() req: any) {
    return this.salesOrderService.getPayments(id, req.user.tenant_id);
  }

  @Post(':id/payments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar pago en la orden de venta',
    description:
      'Pago parcial o total. Métodos: cash, card, transfer, mixed. Si el saldo llega a 0 → payment_status = Pagado.',
  })
  async createPayment(
    @Param('id') id: string,
    @Body() dto: CreateSalesOrderPaymentDto,
    @Req() req: any,
  ) {
    return this.salesOrderService.createPayment(
      id,
      dto,
      req.user.tenant_id,
      req.user.id,
      'manual',
    );
  }

  @Delete(':id/payments/:paymentId')
  @ApiOperation({ summary: 'Eliminar un pago manual de la orden' })
  async deletePayment(
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
    @Req() req: any,
  ) {
    return this.salesOrderService.deletePayment(
      id,
      paymentId,
      req.user.tenant_id,
      req.user.id,
    );
  }

  @Get(':id/payments/:paymentId/documents')
  @ApiOperation({ summary: 'Listar comprobantes de un pago' })
  async getPaymentDocuments(
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
    @Req() req: any,
  ) {
    return this.salesOrderService.getPaymentDocuments(
      id,
      paymentId,
      req.user.tenant_id,
    );
  }

  @Post(':id/payments/:paymentId/documents')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir comprobante de pago (PDF/imagen)' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPaymentDocument(
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
    @UploadedFile() file: any,
    @Body('notes') notes: string | undefined,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('El archivo es obligatorio');
    }

    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/heic',
      'image/heif',
    ];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Tipo no permitido. Use PDF, JPEG, PNG o HEIC');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('El archivo no puede superar 10MB');
    }

    return this.salesOrderService.uploadPaymentDocument(
      id,
      paymentId,
      req.user.tenant_id,
      req.user.id,
      file,
      notes,
    );
  }

  @Delete(':id/payments/:paymentId/documents/:documentId')
  @ApiOperation({ summary: 'Eliminar comprobante de un pago' })
  async deletePaymentDocument(
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
    @Param('documentId') documentId: string,
    @Req() req: any,
  ) {
    return this.salesOrderService.deletePaymentDocument(
      id,
      paymentId,
      documentId,
      req.user.tenant_id,
    );
  }

  @Get(':id/invoices')
  @ApiOperation({ summary: 'Listar facturas electrónicas de la orden de venta' })
  async getInvoices(@Param('id') id: string, @Req() req: any) {
    return this.invoicingService.listInvoices(id, req.user.tenant_id);
  }

  @Post(':id/invoices/stamp')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Timbrar factura de la orden de venta',
    description:
      'Timbrado vía Finkok Sign_Stamp. Requiere XML CFDI 4.0 en el body hasta implementar generador automático.',
  })
  async stampInvoice(
    @Param('id') id: string,
    @Body() dto: StampSalesOrderInvoiceDto,
    @Req() req: any,
  ) {
    return this.invoicingService.stampInvoice(id, req.user.tenant_id, req.user.id, dto);
  }

  @Post(':id/invoices/:invoiceId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar factura electrónica de la orden' })
  async cancelInvoice(
    @Param('id') id: string,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: CancelElectronicInvoiceDto,
    @Req() req: any,
  ) {
    return this.invoicingService.cancelInvoice(
      id,
      invoiceId,
      req.user.tenant_id,
      req.user.id,
      dto,
    );
  }

  @Post(':id/invoices/:invoiceId/sync-sat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sincronizar estatus SAT de una factura de la orden' })
  async syncInvoiceSat(
    @Param('id') id: string,
    @Param('invoiceId') invoiceId: string,
    @Req() req: any,
  ) {
    return this.invoicingService.syncInvoiceSat(
      id,
      invoiceId,
      req.user.tenant_id,
      req.user.id,
    );
  }

  @Get(':id/invoices/:invoiceId/pdf')
  @ApiOperation({ summary: 'Obtener URL firmada del PDF CFDI de la factura' })
  async getInvoicePdf(
    @Param('id') id: string,
    @Param('invoiceId') invoiceId: string,
    @Query('regenerate') regenerate: string | undefined,
    @Query('preview') preview: string | undefined,
    @Req() req: any,
  ) {
    return this.invoicingService.getInvoicePdf(
      id,
      invoiceId,
      req.user.tenant_id,
      regenerate === 'true' || regenerate === '1',
      preview === 'true' || preview === '1',
    );
  }

  @Get()
  @ApiOperation({ summary: 'List sales orders with filters and pagination' })
  async findAll(@Query() filters: QuerySalesOrderDto, @Req() req: any) {
    return this.salesOrderService.findAll(req.user.tenant_id, filters);
  }

  @Get('export/excel/headers')
  @ApiOperation({ summary: 'Descargar Excel de cabeceras de órdenes de venta' })
  async exportHeadersExcel(
    @Query() filters: QuerySalesOrderHeaderExportDto,
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
  @ApiOperation({
    summary: 'Descargar Excel detalle de líneas de venta',
    description: 'Requiere created_from y created_to (rango de fechas obligatorio).',
  })
  async exportDetailsExcel(
    @Query() filters: QuerySalesOrderDetailExportDto,
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

  @Get('warehouse/:warehouseId/products-summary')
  @ApiOperation({ summary: 'Get summarized inventory products for a warehouse' })
  async getWarehouseProductsSummary(
    @Param('warehouseId') warehouseId: string,
    @Req() req: any,
  ) {
    return this.inventoryService.getInventorySummary(req.user.tenant_id, {
      warehouse_id: warehouseId,
      only_available: true,
      page: 1,
      limit: 500,
    });
  }

  @Post(':id/regenerate-documento-original')
  @ApiOperation({ summary: 'Regenerate DOCUMENTO_ORIGINAL PDF with selected language' })
  async regenerateDocumentoOriginal(
    @Param('id') id: string,
    @Body() dto: RegenerateDocumentDto,
    @Req() req: any,
  ) {
    return this.salesOrderService.regenerateDocumentoOriginal(
      id,
      req.user.tenant_id,
      req.user.id,
      dto.language,
      dto.keep_previous ?? false,
    );
  }

  @Get(':id/ticket-recibo')
  @ApiOperation({
    summary: 'Obtener ticket existente para reimpresión',
    description:
      'Devuelve el TICKET / RECIBO ya guardado. No genera ni reemplaza documentos (404 si no existe).',
  })
  async getTicketRecibo(@Param('id') id: string, @Req() req: any) {
    const receipt = await this.posReceiptService.reprintPosTicket(
      req.user.tenant_id,
      id,
    );

    return {
      success: true,
      message: 'Ticket existente listo para imprimir',
      regenerated: false,
      receipt,
    };
  }

  @Post(':id/reprint-ticket-recibo')
  @ApiOperation({
    summary: 'Reimprimir ticket existente (sin regenerar)',
    description:
      'Lee el documento TICKET / RECIBO guardado y devuelve bytes para impresora. No modifica documentos.',
  })
  async reprintTicketRecibo(@Param('id') id: string, @Req() req: any) {
    const receipt = await this.posReceiptService.reprintPosTicket(
      req.user.tenant_id,
      id,
    );

    return {
      success: true,
      message: 'Ticket existente listo para imprimir',
      regenerated: false,
      receipt,
    };
  }

  @Post(':id/regenerate-ticket-recibo')
  @ApiOperation({
    summary: '[TEMPORAL] Regenerar TICKET / RECIBO ESC/POS (Bixolon)',
    description:
      'Elimina el ticket anterior y crea uno nuevo. Usar solo cuando haga falta actualizar formato o corregir datos. Para reimprimir el guardado usar reprint-ticket-recibo.',
  })
  async regenerateTicketRecibo(@Param('id') id: string, @Req() req: any) {
    const receipt = await this.posReceiptService.regeneratePosTicket(
      req.user.tenant_id,
      id,
      req.user.id,
    );
    const documents = await this.documentsService.getDocuments(id);

    return {
      success: true,
      message: 'TICKET / RECIBO regenerado exitosamente',
      regenerated: true,
      receipt,
      documents,
    };
  }

  @Get(':id/ticket-recibo/raw')
  @ApiOperation({
    summary: 'Descargar bytes ESC/POS del ticket (binario)',
    description:
      'application/octet-stream listo para enviar RAW a Bixolon. Alternativa a escpos_base64/escpos_hex en JSON.',
  })
  async downloadTicketReciboRaw(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: any,
  ) {
    const { buffer, fileName } = await this.posReceiptService.getPosTicketRawBuffer(
      req.user.tenant_id,
      id,
    );

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.send(buffer);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single sales order with line items, documents and POS collection',
  })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const detail = await this.salesOrderService.findOneDetail(id, req.user.tenant_id);
    const documents = await this.documentsService.getDocuments(id);
    const lineItems = (detail.sales_order.line_items ?? []).map((lineItem: any) => ({
      ...lineItem,
      uom_name: lineItem.product_uom?.uom?.name ?? null,
      base_uom_name: lineItem.base_uom?.name ?? null,
    }));

    return {
      data: {
        header: detail.header,
        line_items: lineItems,
        documents,
        pos_collection: detail.pos_collection,
      },
    };
  }

  @Post(':id/fulfill')
  @ApiOperation({ summary: 'Fulfill (surtir) a sales order — runs FIFO batch allocation' })
  async fulfill(
    @Param('id') id: string,
    @Body() dto: FulfillSalesOrderDto,
    @Req() req: any,
  ) {
    return this.salesOrderService.fulfill(id, dto, req.user.tenant_id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a sales order — releases inventory if already fulfilled' })
  async cancel(@Param('id') id: string, @Req() req: any) {
    return this.salesOrderService.cancel(id, req.user.tenant_id, req.user.id);
  }
}
