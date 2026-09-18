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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TenantModuleValidationGuard } from '../../auth/tenant-module-validation.guard';
import { SalesOrderProductsPickerService } from '../../sales-orders/services/sales-order-products-picker.service';
import { QuotationService } from '../services/quotation.service';
import { QuotationDocumentsService } from '../services/quotation-documents.service';
import { QuotationEmailService } from '../services/quotation-email.service';
import { RegenerateDocumentDto } from '../../../common/dto/regenerate-document.dto';
import {
  CreateQuotationDto,
  QueryQuotationDto,
  ConvertQuotationDto,
  UpdateQuotationNotesDto,
  QueryQuotationProductsSummaryDto,
  SendQuotationEmailDto,
} from '../dto';
import { resolveRequestUserId } from '../../../common/utils/request-user.util';
import {
  QuotationSellerAccess,
  userCanViewAllQuotations,
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

  @Get()
  @ApiOperation({
    summary: 'Listar cotizaciones',
    description:
      'Sin Quotation:ViewAll: solo las suyas (vendedor POS o comisionado). Con ViewAll: todas, con filtro opcional assigned_seller_user_id.',
  })
  findAll(@Query() query: QueryQuotationDto, @Req() req: any) {
    const access = this.sellerAccess(req);
    return this.quotationService.findAll(
      req.user.tenant_id,
      access.userId,
      access.canViewAll,
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
      'Crea una OV con los mismos unit_price, impuestos y descuentos. POS descuenta inventario; MANUAL queda Creada.',
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
      req.user.id,
      this.sellerAccess(req),
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
    };
  }
}
