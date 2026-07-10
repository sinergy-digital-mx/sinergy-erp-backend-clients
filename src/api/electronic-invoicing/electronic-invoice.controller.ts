import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { ElectronicInvoiceService } from './services/electronic-invoice.service';
import { ElectronicInvoiceSatSyncService } from './services/electronic-invoice-sat-sync.service';
import {
  StampElectronicInvoiceDto,
  CancelElectronicInvoiceDto,
  QueryElectronicInvoiceDto,
} from './dto';

@ApiTags('Electronic Invoicing')
@Controller('tenant/electronic-invoices')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class ElectronicInvoiceController {
  constructor(
    private readonly invoiceService: ElectronicInvoiceService,
    private readonly syncService: ElectronicInvoiceSatSyncService,
  ) {}

  @Post('stamp')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions({ entityType: 'electronic_invoices', action: 'Stamp' })
  @ApiOperation({ summary: 'Timbrar XML vía Finkok Sign_Stamp' })
  stamp(
    @Body() dto: StampElectronicInvoiceDto,
    @Req() req: { user: { tenantId: string; id: string } },
  ) {
    return this.invoiceService.stamp(req.user.tenantId, req.user.id, dto);
  }

  @Get()
  @RequirePermissions({ entityType: 'electronic_invoices', action: 'Read' })
  @ApiOperation({ summary: 'Listar facturas electrónicas' })
  findAll(
    @Query() query: QueryElectronicInvoiceDto,
    @Req() req: { user: { tenantId: string } },
  ) {
    return this.invoiceService.findAll(req.user.tenantId, query);
  }

  @Get('sync-status')
  @RequirePermissions({ entityType: 'electronic_invoices', action: 'SyncSat' })
  @ApiOperation({ summary: 'Estado de sincronización SAT del cliente' })
  syncStatus(@Req() req: { user: { tenantId: string } }) {
    return this.syncService.getSyncStatus(req.user.tenantId);
  }

  @Post('sync-batch')
  @HttpCode(200)
  @RequirePermissions({ entityType: 'electronic_invoices', action: 'SyncSat' })
  @ApiOperation({ summary: 'Ejecutar lote manual de sync SAT para el cliente' })
  syncBatch(@Req() req: { user: { tenantId: string; id: string } }) {
    return this.syncService.syncTenantBatch(req.user.tenantId, req.user.id);
  }

  @Get(':id/pdf')
  @RequirePermissions({ entityType: 'electronic_invoices', action: 'Read' })
  @ApiOperation({ summary: 'Obtener URL firmada del PDF CFDI' })
  getPdf(
    @Param('id') id: string,
    @Query('regenerate') regenerate: string | undefined,
    @Query('preview') preview: string | undefined,
    @Req() req: { user: { tenantId: string } },
  ) {
    return this.invoiceService.getPdfDownload(
      id,
      req.user.tenantId,
      regenerate === 'true' || regenerate === '1',
      preview === 'true' || preview === '1',
    );
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'electronic_invoices', action: 'Read' })
  @ApiOperation({ summary: 'Detalle de factura electrónica' })
  findOne(@Param('id') id: string, @Req() req: { user: { tenantId: string } }) {
    return this.invoiceService.findOne(id, req.user.tenantId);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @RequirePermissions({ entityType: 'electronic_invoices', action: 'Cancel' })
  @ApiOperation({ summary: 'Cancelar CFDI vía Finkok Sign_Cancel' })
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelElectronicInvoiceDto,
    @Req() req: { user: { tenantId: string; id: string } },
  ) {
    return this.invoiceService.cancel(id, req.user.tenantId, req.user.id, dto);
  }

  @Post(':id/sync-sat')
  @HttpCode(200)
  @RequirePermissions({ entityType: 'electronic_invoices', action: 'SyncSat' })
  @ApiOperation({ summary: 'Sincronizar estatus SAT de una factura' })
  syncSat(
    @Param('id') id: string,
    @Req() req: { user: { tenantId: string; id: string } },
  ) {
    return this.invoiceService.syncSatStatus(id, req.user.tenantId, req.user.id, 'manual');
  }
}
