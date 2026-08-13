import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ElectronicInvoice,
  ElectronicInvoiceSatStatus,
  ElectronicInvoiceSourceModule,
} from '../../../entities/electronic-invoicing/electronic-invoice.entity';
import { ElectronicInvoiceSyncLog } from '../../../entities/electronic-invoicing/electronic-invoice-sync-log.entity';
import { FiscalConfiguration } from '../../../entities/billing/fiscal-configuration.entity';
import { StampElectronicInvoiceDto } from '../dto/stamp-electronic-invoice.dto';
import { CancelElectronicInvoiceDto } from '../dto/cancel-electronic-invoice.dto';
import { QueryElectronicInvoiceDto } from '../dto/query-electronic-invoice.dto';
import { FinkokProviderConfigurationService } from './finkok-provider-configuration.service';
import { FinkokSoapClient } from './finkok-soap.client';
import { ElectronicInvoicePdfService } from './electronic-invoice-pdf.service';

@Injectable()
export class ElectronicInvoiceService {
  private readonly logger = new Logger(ElectronicInvoiceService.name);

  constructor(
    @InjectRepository(ElectronicInvoice)
    private readonly invoiceRepo: Repository<ElectronicInvoice>,
    @InjectRepository(ElectronicInvoiceSyncLog)
    private readonly syncLogRepo: Repository<ElectronicInvoiceSyncLog>,
    @InjectRepository(FiscalConfiguration)
    private readonly fiscalRepo: Repository<FiscalConfiguration>,
    private readonly finkokConfigService: FinkokProviderConfigurationService,
    private readonly finkokClient: FinkokSoapClient,
    private readonly pdfService: ElectronicInvoicePdfService,
  ) {}

  async stamp(
    tenantId: string,
    userId: string,
    dto: StampElectronicInvoiceDto,
  ): Promise<ElectronicInvoice> {
    const fiscal = await this.fiscalRepo.findOne({
      where: { id: dto.fiscal_configuration_id, tenant_id: tenantId },
    });

    if (!fiscal) {
      throw new NotFoundException('Razón emisora no encontrada');
    }

    if (fiscal.finkok_registration_status !== 'registered') {
      throw new BadRequestException(
        'La razón emisora debe estar registrada en Finkok antes de timbrar.',
      );
    }

    const credentials = await this.finkokConfigService.getCredentials(tenantId);

    const invoice = this.invoiceRepo.create({
      tenant_id: tenantId,
      fiscal_configuration_id: dto.fiscal_configuration_id,
      source_module: dto.source_module,
      source_id: dto.source_id,
      tipo_comprobante: dto.tipo_comprobante ?? 'I',
      series: dto.series ?? null,
      folio: dto.folio ?? null,
      rfc_emisor: dto.rfc_emisor ?? fiscal.rfc,
      rfc_receptor: dto.rfc_receptor,
      receptor_nombre: dto.receptor_nombre ?? null,
      subtotal: dto.subtotal,
      total: dto.total,
      currency: dto.currency ?? 'MXN',
      xml_unsigned: dto.xml,
      certificate_serial: dto.certificate_serial ?? fiscal.certificate_serial_number ?? null,
      stamp_status: 'pending_stamp',
      sat_sync_enabled: 1,
      metadata: dto.metadata ?? null,
      created_by: userId,
    });

    const saved = await this.invoiceRepo.save(invoice);

    try {
      const result = await this.finkokClient.signStamp(credentials, dto.xml);

      if (!result.success || !result.xml) {
        const errorMsg =
          result.incidencias?.[0]?.mensajeIncidencia ??
          result.codEstatus ??
          'Error desconocido al timbrar';

        saved.stamp_status = 'stamp_error';
        saved.stamp_error_message = errorMsg;
        saved.metadata = {
          ...(saved.metadata ?? {}),
          finkok_incidencias: result.incidencias,
        };
        return this.invoiceRepo.save(saved);
      }

      saved.uuid = result.uuid ?? null;
      saved.xml_stamped = result.xml;
      saved.stamped_at = result.fecha ? new Date(result.fecha) : new Date();
      saved.sat_seal = result.satSeal ?? null;
      saved.sat_certificate_number = result.noCertificadoSat ?? null;
      saved.stamp_status = 'stamped';
      saved.stamp_error_message = null;

      const stamped = await this.invoiceRepo.save(saved);
      return this.generatePdfAfterStamp(stamped, fiscal);
    } catch (error) {
      saved.stamp_status = 'stamp_error';
      saved.stamp_error_message =
        error instanceof Error ? error.message : 'Error de comunicación con Finkok';
      return this.invoiceRepo.save(saved);
    }
  }

  async cancel(
    id: string,
    tenantId: string,
    userId: string,
    dto: CancelElectronicInvoiceDto,
  ): Promise<ElectronicInvoice> {
    const invoice = await this.getByIdOrFail(id, tenantId);

    if (invoice.stamp_status !== 'stamped' && invoice.stamp_status !== 'cancel_pending') {
      throw new BadRequestException('Solo se pueden cancelar facturas timbradas');
    }

    if (!invoice.uuid) {
      throw new BadRequestException('La factura no tiene UUID');
    }

    const fiscal = await this.fiscalRepo.findOne({
      where: { id: invoice.fiscal_configuration_id, tenant_id: tenantId },
    });

    if (!fiscal) {
      throw new NotFoundException('Razón emisora no encontrada');
    }

    const certificateSerial =
      invoice.certificate_serial ?? fiscal.certificate_serial_number;

    if (!certificateSerial) {
      throw new BadRequestException(
        'Se requiere el número de certificado (NoCertificado) para cancelar',
      );
    }

    const credentials = await this.finkokConfigService.getCredentials(tenantId);

    const result = await this.finkokClient.signCancel(
      credentials,
      invoice.rfc_emisor,
      certificateSerial,
      [
        {
          uuid: invoice.uuid,
          motivo: dto.motivo,
          folioSustitucion: dto.folio_sustitucion,
        },
      ],
    );

    invoice.cancel_motivo = dto.motivo;
    invoice.cancel_replacement_uuid = dto.folio_sustitucion ?? null;

    if (!result.success) {
      invoice.stamp_status = 'cancel_error';
      invoice.stamp_error_message = result.codEstatus ?? 'Error al cancelar en Finkok';
      return this.invoiceRepo.save(invoice);
    }

    const folio = result.folios[0];
    invoice.cancel_sat_status_code = folio?.estatusUuid ?? null;
    invoice.cancel_acuse_xml = result.acuse ?? null;
    invoice.stamp_status =
      folio?.estatusUuid === '201' ? 'cancel_pending' : 'cancelled';
    invoice.stamp_error_message = null;

    await this.syncLogRepo.save(
      this.syncLogRepo.create({
        tenant_id: tenantId,
        electronic_invoice_id: invoice.id,
        trigger_type: 'manual',
        previous_sat_status: invoice.sat_status,
        new_sat_status: invoice.stamp_status === 'cancelled' ? 'Cancelado' : invoice.sat_status,
        raw_response: { cancel: result },
        success: result.success ? 1 : 0,
        triggered_by: userId,
      }),
    );

    return this.invoiceRepo.save(invoice);
  }

  async syncSatStatus(
    id: string,
    tenantId: string,
    userId: string | null,
    trigger: 'manual' | 'scheduled' | 'batch' = 'manual',
  ): Promise<ElectronicInvoice> {
    const invoice = await this.getByIdOrFail(id, tenantId);

    if (!invoice.uuid || invoice.stamp_status === 'stamp_error') {
      throw new BadRequestException('La factura debe estar timbrada para consultar el SAT');
    }

    const previousStatus = invoice.sat_status;
    const total = Number(invoice.total).toFixed(2);

    let result = await this.tryFinkokSatStatus(tenantId, invoice, total);
    if (!result.success) {
      result = await this.finkokClient.consultSatCfdi(
        invoice.rfc_emisor,
        invoice.rfc_receptor,
        total,
        invoice.uuid,
      );
    }

    const newSatStatus = this.mapSatEstado(result.estado);

    invoice.sat_status = newSatStatus;
    invoice.sat_es_cancelable = result.esCancelable ?? null;
    invoice.sat_estatus_cancelacion = result.estatusCancelacion ?? null;
    invoice.sat_codigo_estatus = result.codigoEstatus ?? null;
    invoice.sat_last_sync_at = new Date();

    if (newSatStatus === 'Cancelado') {
      invoice.stamp_status = 'cancelled';
    }

    await this.syncLogRepo.save(
      this.syncLogRepo.create({
        tenant_id: tenantId,
        electronic_invoice_id: invoice.id,
        trigger_type: trigger,
        previous_sat_status: previousStatus,
        new_sat_status: newSatStatus,
        raw_response: result as unknown as Record<string, unknown>,
        success: result.success ? 1 : 0,
        error_message: result.success
          ? null
          : result.error ?? result.codigoEstatus ?? 'Consulta SAT fallida',
        triggered_by: userId,
      }),
    );

    return this.invoiceRepo.save(invoice);
  }

  async findBySource(
    tenantId: string,
    sourceModule: ElectronicInvoiceSourceModule,
    sourceId: string,
  ): Promise<ElectronicInvoice[]> {
    return this.invoiceRepo.find({
      where: { tenant_id: tenantId, source_module: sourceModule, source_id: sourceId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * CFDI vigente: SAT = Vigente, o timbrada / cancelación pendiente o fallida
   * sin que SAT haya confirmado Cancelado.
   */
  isCfdiVigente(invoice: ElectronicInvoice): boolean {
    if (invoice.sat_status === 'Cancelado') {
      return false;
    }
    if (invoice.sat_status === 'Vigente') {
      return true;
    }
    return (
      invoice.stamp_status === 'stamped' ||
      invoice.stamp_status === 'cancel_pending' ||
      invoice.stamp_status === 'cancel_error'
    );
  }

  async findVigenteBySource(
    tenantId: string,
    sourceModule: ElectronicInvoiceSourceModule,
    sourceId: string,
  ): Promise<ElectronicInvoice[]> {
    const invoices = await this.findBySource(tenantId, sourceModule, sourceId);
    return invoices.filter((invoice) => this.isCfdiVigente(invoice));
  }

  async findAll(tenantId: string, query: QueryElectronicInvoiceDto): Promise<ElectronicInvoice[]> {
    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .where('inv.tenant_id = :tenantId', { tenantId });

    if (query.source_module) {
      qb.andWhere('inv.source_module = :sourceModule', { sourceModule: query.source_module });
    }
    if (query.source_id) {
      qb.andWhere('inv.source_id = :sourceId', { sourceId: query.source_id });
    }
    if (query.stamp_status) {
      qb.andWhere('inv.stamp_status = :stampStatus', { stampStatus: query.stamp_status });
    }

    qb.orderBy('inv.created_at', 'DESC');
    qb.take(Math.min(query.limit ?? 50, 100));

    return qb.getMany();
  }

  async findOne(id: string, tenantId: string): Promise<ElectronicInvoice> {
    return this.getByIdOrFail(id, tenantId);
  }

  async getPdfDownload(
    id: string,
    tenantId: string,
    regenerate = false,
    preview = false,
  ) {
    const invoice = await this.getByIdOrFail(id, tenantId);

    if (preview) {
      return this.getPdfPreviewDownload(invoice, tenantId);
    }

    if (invoice.stamp_status !== 'stamped' && invoice.stamp_status !== 'cancel_pending' && invoice.stamp_status !== 'cancelled') {
      throw new BadRequestException('Solo hay PDF para facturas timbradas');
    }

    if (!invoice.pdf_stamped_s3_key || regenerate) {
      const fiscal = await this.fiscalRepo.findOne({
        where: { id: invoice.fiscal_configuration_id, tenant_id: tenantId },
      });
      if (!fiscal) {
        throw new NotFoundException('Razón emisora no encontrada');
      }

      const updated = await this.generatePdfAfterStamp(invoice, fiscal);
      return this.pdfService.getSignedPdfUrl(updated);
    }

    return this.pdfService.getSignedPdfUrl(invoice);
  }

  private async getPdfPreviewDownload(invoice: ElectronicInvoice, tenantId: string) {
    const bundle = await this.finkokConfigService.getAllForTenant(tenantId);
    if (bundle.stamping_environment !== 'demo') {
      throw new BadRequestException(
        'La vista previa de PDF solo está disponible con Finkok en ambiente demo',
      );
    }

    const previewableStatuses = ['stamp_error', 'pending_stamp'];
    if (!previewableStatuses.includes(invoice.stamp_status)) {
      throw new BadRequestException(
        'La vista previa aplica a facturas con error de timbrado o pendientes de timbrar',
      );
    }

    const fiscal = await this.fiscalRepo.findOne({
      where: { id: invoice.fiscal_configuration_id, tenant_id: tenantId },
    });
    if (!fiscal) {
      throw new NotFoundException('Razón emisora no encontrada');
    }

    return this.pdfService.generatePreviewAndUpload(invoice, fiscal);
  }

  private mapSatEstado(estado?: string): ElectronicInvoiceSatStatus {
    if (!estado) {
      return 'Desconocido';
    }
    if (estado === 'Vigente' || estado === 'Cancelado' || estado === 'No Encontrado') {
      return estado;
    }
    return 'Desconocido';
  }

  private async tryFinkokSatStatus(
    tenantId: string,
    invoice: ElectronicInvoice,
    total: string,
  ) {
    try {
      const credentials = await this.finkokConfigService.getCredentials(tenantId);
      return await this.finkokClient.getSatStatusFinkok(
        credentials,
        invoice.rfc_emisor,
        invoice.rfc_receptor,
        total,
        invoice.uuid!,
      );
    } catch {
      return { success: false, source: 'finkok' as const };
    }
  }

  private async generatePdfAfterStamp(
    invoice: ElectronicInvoice,
    fiscal: FiscalConfiguration,
  ): Promise<ElectronicInvoice> {
    if (!invoice.xml_stamped || invoice.stamp_status !== 'stamped') {
      return invoice;
    }

    try {
      const upload = await this.pdfService.generateAndUpload(invoice, fiscal);
      invoice.pdf_stamped_s3_key = upload.s3Key;
      invoice.metadata = {
        ...(invoice.metadata ?? {}),
        pdf_file_name: upload.fileName,
        pdf_generated_at: new Date().toISOString(),
      };
      return this.invoiceRepo.save(invoice);
    } catch (error) {
      this.logger.error(
        `Error generando PDF CFDI ${invoice.id}: ${error instanceof Error ? error.message : error}`,
      );
      invoice.metadata = {
        ...(invoice.metadata ?? {}),
        pdf_generation_error: error instanceof Error ? error.message : 'Error generando PDF',
      };
      return this.invoiceRepo.save(invoice);
    }
  }

  private async getByIdOrFail(id: string, tenantId: string): Promise<ElectronicInvoice> {
    const invoice = await this.invoiceRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!invoice) {
      throw new NotFoundException('Factura electrónica no encontrada');
    }
    return invoice;
  }
}
