import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TenantModuleValidationGuard } from '../../auth/tenant-module-validation.guard';
import { SalesOrderProductsPickerService } from '../../sales-orders/services/sales-order-products-picker.service';
import { QuotationService } from '../services/quotation.service';
import { QuotationDocumentsService } from '../services/quotation-documents.service';
import { QuotationEmailService } from '../services/quotation-email.service';
import { QuotationAdvanceInvoiceService } from '../services/quotation-advance-invoice.service';
import { RegenerateDocumentDto } from '../../../common/dto/regenerate-document.dto';
import {
  CreateQuotationDto,
  QueryQuotationDto,
  ConvertQuotationDto,
  UpdateQuotationNotesDto,
  QueryQuotationProductsSummaryDto,
  SendQuotationEmailDto,
  CreateQuotationLineItemDto,
  UpdateQuotationLineItemDto,
} from '../dto';
import { StampAdvanceInvoiceDto } from '../../electronic-invoicing/dto/stamp-advance-invoice.dto';
import { CancelElectronicInvoiceDto } from '../../electronic-invoicing/dto/cancel-electronic-invoice.dto';
import { resolveRequestUserId } from '../../../common/utils/request-user.util';
import {
  QuotationSellerAccess,
  userCanViewAllQuotations,
  userCanViewAllQuotationBranches,
} from '../utils/quotation-seller-scope.util';

@ApiTags('Quotations')
@Controller('tenant/quotations')
@UseGuards(JwtAuthGuard, TenantModuleValidationGuard)
@ApiBearerAuth()
export class QuotationController {
  constructor(
    private readonly quotationService: QuotationService,
    private readonly documentsService: QuotationDocumentsService,
    private readonly emailService: QuotationEmailService,
    private readonly productsPicker: SalesOrderProductsPickerService,
    private readonly advanceInvoices: QuotationAdvanceInvoiceService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear cotización',
    description:
      'Misma captura que OV (POS o MANUAL). No descuenta inventario ni genera factura. Persiste unit_price del payload.',
  })
  create(@Body() dto: CreateQuotationDto, @Req() req: any) {
    return this.quotationService.create(dto, req.user.tenant_id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Reemplazar cotización mientras está Creada' })
  replace(
    @Param('id') id: string,
    @Body() dto: CreateQuotationDto,
    @Req() req: any,
  ) {
    return this.quotationService.replace(
      id,
      dto,
      req.user.tenant_id,
      req.user.id,
      this.sellerAccess(req),
    );
  }

  @Patch(':id/notes')
  @ApiOperation({
    summary: 'Actualizar observaciones de la cotización',
    description:
      'Se pinta en el PDF DOCUMENTO_ORIGINAL. Regenera el PDF. Bloqueado si Cancelada.',
  })
  updateNotes(
    @Param('id') id: string,
    @Body() dto: UpdateQuotationNotesDto,
    @Req() req: any,
  ) {
    return this.quotationService.updateNotes(
      id,
      dto,
      req.user.tenant_id,
      req.user.id,
      this.sellerAccess(req),
    );
  }

  @Post(':id/line-items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Agregar una línea a la cotización',
    description:
      'Solo Creada. No usar PUT para una sola línea. Recalcula totales y regenera el PDF.',
  })
  async addLineItem(
    @Param('id') id: string,
    @Body() dto: CreateQuotationLineItemDto,
    @Req() req: any,
  ) {
    await this.quotationService.addLineItem(
      id,
      dto,
      req.user.tenant_id,
      req.user.id,
      this.sellerAccess(req),
    );
    return this.findOne(id, req);
  }

  @Patch(':id/line-items/:lineItemId')
  @ApiOperation({
    summary: 'Editar una línea de la cotización',
    description: 'Cantidad, precio, IVA e IEPS. Recalcula totales. Solo Creada.',
  })
  async updateLineItem(
    @Param('id') id: string,
    @Param('lineItemId') lineItemId: string,
    @Body() dto: UpdateQuotationLineItemDto,
    @Req() req: any,
  ) {
    await this.quotationService.updateLineItem(
      id,
      lineItemId,
      dto,
      req.user.tenant_id,
      req.user.id,
      this.sellerAccess(req),
    );
    return this.findOne(id, req);
  }

  @Delete(':id/line-items/:lineItemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar una línea de la cotización',
    description: 'Recalcula totales. Debe quedar al menos un producto.',
  })
  async removeLineItem(
    @Param('id') id: string,
    @Param('lineItemId') lineItemId: string,
    @Req() req: any,
  ) {
    await this.quotationService.removeLineItem(
      id,
      lineItemId,
      req.user.tenant_id,
      req.user.id,
      this.sellerAccess(req),
    );
    return this.findOne(id, req);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar cotizaciones',
    description:
      'Sin ViewAll: solo las suyas (vendedor o comisionado). Sin ViewAllBranches: solo sucursales asignadas.',
  })
  findAll(@Query() query: QueryQuotationDto, @Req() req: any) {
    const access = this.sellerAccess(req);
    return this.quotationService.findAll(
      req.user.tenant_id,
      access.userId,
      access.canViewAll,
      access.canViewAllBranches,
      query,
    );
  }

  @Get('products-summary')
  @ApiOperation({
    summary: 'Inventario de sucursal para el tab Productos (alta manual)',
  })
  getProductsSummary(
    @Query() query: QueryQuotationProductsSummaryDto,
    @Req() req: any,
  ) {
    return this.productsPicker.getSummary(req.user.tenant_id, query);
  }

  @Get('sellers')
  @ApiOperation({
    summary: 'Catálogo de vendedores para el filtro (requiere Quotation:ViewAll)',
  })
  listSellers(@Req() req: any) {
    return this.quotationService.listSellers(
      req.user.tenant_id,
      this.sellerAccess(req).canViewAll,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de cotización con líneas, descuentos y PDF' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const access = this.sellerAccess(req);
    const detail = await this.quotationService.findOneDetail(
      id,
      req.user.tenant_id,
      access,
    );
    const documents = await this.documentsService.getDocuments(id);
    const emails = await this.emailService.list(id, req.user.tenant_id, access);
    const lineItems = (detail.line_items ?? []).map((lineItem: any) => ({
      ...lineItem,
      uom_name: lineItem.product_uom?.uom?.name ?? null,
      base_uom_name: lineItem.base_uom?.name ?? null,
    }));

    return {
      data: {
        header: detail.header,
        line_items: lineItems,
        documents,
        emails,
        discount_summary: detail.discount_summary,
        applied_line_discounts: detail.applied_line_discounts,
        applied_global_discount: detail.applied_global_discount,
      },
    };
  }

  @Post(':id/convert')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Convertir cotización a orden de venta',
    description:
      'Crea una OV con los mismos unit_price, impuestos y descuentos. send_to_pos_caja envía a caja POS de la sucursal de la cotización.',
  })
  convert(
    @Param('id') id: string,
    @Body() dto: ConvertQuotationDto,
    @Req() req: any,
  ) {
    return this.quotationService.convert(
      id,
      dto ?? {},
      req.user.tenant_id,
      resolveRequestUserId(req.user),
      this.sellerAccess(req),
    );
  }

  @Get(':id/collection-preview')
  @ApiOperation({
    summary: 'Corte abierto de la sucursal para cobrar al convertir',
  })
  collectionPreview(@Param('id') id: string, @Req() req: any) {
    return this.advanceInvoices.collectionPreview(id, req.user.tenant_id);
  }

  @Get(':id/invoices')
  @ApiOperation({ summary: 'Facturas de anticipo de la cotización' })
  listInvoices(@Param('id') id: string, @Req() req: any) {
    return this.advanceInvoices.list(id, req.user.tenant_id);
  }

  @Post(':id/invoices/stamp-advance')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Timbrar CFDI de anticipo de la cotización' })
  stampAdvance(
    @Param('id') id: string,
    @Body() dto: StampAdvanceInvoiceDto,
    @Req() req: any,
  ) {
    return this.advanceInvoices.stamp(
      id,
      req.user.tenant_id,
      req.user.id,
      dto,
    );
  }

  @Get(':id/invoices/:invoiceId/pdf')
  @ApiOperation({ summary: 'PDF de la factura de anticipo de la cotización' })
  getAdvancePdf(
    @Param('id') id: string,
    @Param('invoiceId') invoiceId: string,
    @Query('regenerate') regenerate: string | undefined,
    @Query('preview') preview: string | undefined,
    @Req() req: any,
  ) {
    return this.advanceInvoices.getPdf(
      id,
      invoiceId,
      req.user.tenant_id,
      regenerate === 'true' || regenerate === '1',
      preview === 'true' || preview === '1',
    );
  }

  @Get(':id/invoices/:invoiceId/xml')
  @ApiOperation({ summary: 'XML de la factura de anticipo de la cotización' })
  async getAdvanceXml(
    @Param('id') id: string,
    @Param('invoiceId') invoiceId: string,
    @Req() req: any,
    @Res() res: any,
  ) {
    const { xml, fileName } = await this.advanceInvoices.getXml(
      id,
      invoiceId,
      req.user.tenant_id,
    );
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(xml);
  }

  @Post(':id/invoices/:invoiceId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar CFDI de anticipo de la cotización' })
  cancelAdvance(
    @Param('id') id: string,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: CancelElectronicInvoiceDto,
    @Req() req: any,
  ) {
    return this.advanceInvoices.cancel(
      id,
      invoiceId,
      req.user.tenant_id,
      req.user.id,
      dto,
    );
  }

  @Post(':id/regenerate-documento-original')
  @ApiOperation({ summary: 'Regenerar PDF DOCUMENTO_ORIGINAL' })
  regenerateDocumentoOriginal(
    @Param('id') id: string,
    @Body() dto: RegenerateDocumentDto,
    @Req() req: any,
  ) {
    return this.quotationService.regenerateDocumentoOriginal(
      id,
      req.user.tenant_id,
      req.user.id,
      dto.language,
      dto.keep_previous === true,
      this.sellerAccess(req),
    );
  }

  @Post(':id/send-email')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Enviar cotización por correo',
    description:
      'Genera el PDF y lo envía como adjunto usando la configuración de correo activa. Guarda el envío en el historial.',
  })
  sendEmail(
    @Param('id') id: string,
    @Body() dto: SendQuotationEmailDto,
    @Req() req: any,
  ) {
    return this.emailService.send(
      id,
      dto ?? {},
      req.user.tenant_id,
      req.user.id,
      this.sellerAccess(req),
    );
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar cotización (solo Creada)' })
  cancel(@Param('id') id: string, @Req() req: any) {
    return this.quotationService.cancel(
      id,
      req.user.tenant_id,
      req.user.id,
      this.sellerAccess(req),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Alias de cancelar' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.quotationService.cancel(
      id,
      req.user.tenant_id,
      req.user.id,
      this.sellerAccess(req),
    );
  }

  private sellerAccess(req: any): QuotationSellerAccess {
    return {
      userId: resolveRequestUserId(req.user),
      canViewAll: userCanViewAllQuotations(req.user),
      canViewAllBranches: userCanViewAllQuotationBranches(req.user),
    };
  }
}
