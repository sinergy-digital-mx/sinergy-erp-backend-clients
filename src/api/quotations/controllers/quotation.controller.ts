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
import { InventoryService } from '../../inventory/inventory.service';
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

@ApiTags('Quotations')
@Controller('tenant/quotations')
@UseGuards(JwtAuthGuard, TenantModuleValidationGuard)
@ApiBearerAuth()
export class QuotationController {
  constructor(
    private readonly quotationService: QuotationService,
    private readonly documentsService: QuotationDocumentsService,
    private readonly emailService: QuotationEmailService,
    private readonly inventoryService: InventoryService,
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
    return this.quotationService.replace(id, dto, req.user.tenant_id, req.user.id);
  }

  @Patch(':id/notes')
  @ApiOperation({ summary: 'Actualizar notas de la cotización' })
  updateNotes(
    @Param('id') id: string,
    @Body() dto: UpdateQuotationNotesDto,
    @Req() req: any,
  ) {
    return this.quotationService.updateNotes(id, dto, req.user.tenant_id, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar cotizaciones' })
  findAll(@Query() query: QueryQuotationDto, @Req() req: any) {
    return this.quotationService.findAll(req.user.tenant_id, query);
  }

  @Get('products-summary')
  @ApiOperation({
    summary: 'Inventario de sucursal para el tab Productos (alta manual)',
  })
  getProductsSummary(
    @Query() query: QueryQuotationProductsSummaryDto,
    @Req() req: any,
  ) {
    return this.inventoryService.getBranchInventorySummary(
      req.user.tenant_id,
      query.billing_branch_id,
      {
        fiscal_configuration_id: query.fiscal_configuration_id,
        search: query.search,
        only_available: true,
        page: query.page ?? 1,
        limit: query.limit ?? 40,
      },
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de cotización con líneas, descuentos y PDF' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const detail = await this.quotationService.findOneDetail(
      id,
      req.user.tenant_id,
    );
    const documents = await this.documentsService.getDocuments(id);
    const emails = await this.emailService.list(id, req.user.tenant_id);
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
    return this.quotationService.convert(id, dto ?? {}, req.user.tenant_id, req.user.id);
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
    return this.emailService.send(id, dto ?? {}, req.user.tenant_id, req.user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar cotización (solo Creada)' })
  cancel(@Param('id') id: string, @Req() req: any) {
    return this.quotationService.cancel(id, req.user.tenant_id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Alias de cancelar' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.quotationService.cancel(id, req.user.tenant_id, req.user.id);
  }
}
