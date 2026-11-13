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
  ElectronicInvoiceStampStatus,
} from '../../../entities/electronic-invoicing/electronic-invoice.entity';
import { ElectronicInvoiceSyncLog } from '../../../entities/electronic-invoicing/electronic-invoice-sync-log.entity';
import { FiscalConfiguration } from '../../../entities/billing/fiscal-configuration.entity';
import { StampElectronicInvoiceDto } from '../dto/stamp-electronic-invoice.dto';
import { CancelElectronicInvoiceDto } from '../dto/cancel-electronic-invoice.dto';
import { QueryElectronicInvoiceDto } from '../dto/query-electronic-invoice.dto';
import { FinkokEnvironment } from '../../../entities/electronic-invoicing/finkok-provider-configuration.entity';
import { FinkokProviderConfigurationService } from './finkok-provider-configuration.service';
import { FinkokSoapClient } from './finkok-soap.client';
import { ElectronicInvoicePdfService } from './electronic-invoice-pdf.service';
import { parseCfdiXmlForPdf, normalizeCfdiXml } from '../utils/cfdi-xml.parser';
import { receptorRegimenMismatch } from '../utils/cfdi-regimen-person.util';
import { finkokErrorMessage, stampRejectionMessage } from '../utils/finkok-error-message.util';
import {
  resolveStampStatusAfterCancelRequest,
  resolveStampStatusAfterSatConsult,
} from '../utils/cfdi-cancel-status.util';

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
    userId: string | null,
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

    const credentials = await this.finkokConfigService.getCredentials(
      tenantId,
      dto.environment,
    );

    this.assertReceptorRegimen(dto.xml);

    let result;
    try {
      result = await this.finkokClient.signStamp(credentials, dto.xml);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Error de comunicación con Finkok';
      this.logger.warn(`Finkok Sign_Stamp comunicación: ${msg}`);
      throw new BadRequestException(finkokErrorMessage(undefined, msg));
    }

    if (!result.success || !result.xml) {
      const incidencia = result.incidencias?.[0];
      const errorMsg =
        incidencia?.mensajeIncidencia ??
        result.codEstatus ??
        'Error desconocido al timbrar';
      const codigo = incidencia?.codigoError;
      const extra = incidencia?.extraInfo?.trim();
      const fecha = readXmlAttr(dto.xml, 'Fecha');
      const lugar = readXmlAttr(dto.xml, 'LugarExpedicion');
      this.logger.warn(
        `Finkok Sign_Stamp rechazado${codigo ? ` [${codigo}]` : ''}: ${errorMsg}` +
          `${fecha ? ` Fecha=${fecha}` : ''}${lugar ? ` CP=${lugar}` : ''}` +
          `${extra ? ` Extra=${extra}` : ''}`,
      );
      throw new BadRequestException(stampRejectionMessage(codigo, errorMsg, extra, fecha, lugar));
    }

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
      xml_stamped: result.xml,
      uuid: result.uuid ?? null,
      stamped_at: result.fecha ? new Date(result.fecha) : new Date(),
      sat_seal: result.satSeal ?? null,
      sat_certificate_number: result.noCertificadoSat ?? null,
      certificate_serial:
        dto.certificate_serial ??
        fiscal.certificate_serial_number ??
        this.readNoCertificadoFromXml(result.xml) ??
        null,
      stamp_status: 'stamped',
      stamp_error_message: null,
      sat_sync_enabled: 1,
      invoice_role: dto.invoice_role ?? 'standard',
      related_advance_invoice_id: dto.related_advance_invoice_id ?? null,
      related_invoice_id: dto.related_invoice_id ?? null,
      relation_type: dto.relation_type ?? null,
      metadata: {
        ...(dto.metadata ?? {}),
        finkok_environment: credentials.environment,
      },
      created_by: userId,
    });

    const stamped = await this.invoiceRepo.save(invoice);
    await this.rememberFiscalCertificateSerial(fiscal, stamped.certificate_serial);
    return this.generatePdfAfterStamp(stamped, fiscal);
  }

  async cancel(
    id: string,
    tenantId: string,
    userId: string,
    dto: CancelElectronicInvoiceDto,
  ): Promise<ElectronicInvoice> {
    const invoice = await this.getByIdOrFail(id, tenantId);

    if (
      invoice.stamp_status !== 'stamped' &&
      invoice.stamp_status !== 'cancel_pending' &&
      invoice.stamp_status !== 'cancel_error'
    ) {
      throw new BadRequestException(
        `Solo se pueden cancelar facturas timbradas. Estado actual: ${invoice.stamp_status}`,
      );
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

    const certificateSerial = this.resolveCancelCertificateSerial(invoice, fiscal);
    if (certificateSerial) {
      invoice.certificate_serial = invoice.certificate_serial ?? certificateSerial;
      await this.rememberFiscalCertificateSerial(fiscal, certificateSerial);
    }

    const credentials = await this.finkokConfigService.getCredentials(
      tenantId,
      this.resolveFinkokEnvironment(invoice),
    );

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
      invoice.stamp_error_message = finkokErrorMessage(
        undefined,
        result.codEstatus ?? 'Error al cancelar en Finkok',
      );
      return this.invoiceRepo.save(invoice);
    }

    const folio = result.folios[0];
    invoice.cancel_sat_status_code = folio?.estatusUuid ?? null;
    invoice.cancel_acuse_xml = result.acuse ?? null;
    if (folio?.estatusCancelacion) {
      invoice.sat_estatus_cancelacion = folio.estatusCancelacion;
    }
    invoice.stamp_status = resolveStampStatusAfterCancelRequest(
      folio?.estatusUuid,
      invoice.sat_estatus_cancelacion,
    );
    invoice.stamp_error_message = null;

    await this.syncLogRepo.save(
      this.syncLogRepo.create({
        tenant_id: tenantId,
        electronic_invoice_id: invoice.id,
        trigger_type: 'manual',
        previous_sat_status: invoice.sat_status,
        new_sat_status: invoice.sat_status,
        raw_response: { cancel: result },
        success: result.success ? 1 : 0,
        triggered_by: userId,
      }),
    );

    const saved = await this.invoiceRepo.save(invoice);
    return this.syncAfterCancel(saved.id, tenantId, userId);
  }

  private async syncAfterCancel(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<ElectronicInvoice> {
    try {
      return await this.syncSatStatus(id, tenantId, userId, 'manual');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Sync SAT después de cancelar ${id} falló: ${message}`);
      return this.getByIdOrFail(id, tenantId);
    }
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

    invoice.stamp_status = resolveStampStatusAfterSatConsult(
      invoice.stamp_status,
      newSatStatus,
      invoice.sat_estatus_cancelacion,
    ) as ElectronicInvoiceStampStatus;

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

  async registerExisting(
    tenantId: string,
    userId: string,
    input: {
      fiscal_configuration_id: string;
      source_id: string;
      uuid: string;
      rfc_emisor: string;
      rfc_receptor: string;
      receptor_nombre?: string | null;
      subtotal: number;
      total: number;
      series?: string | null;
      folio?: string | null;
      currency?: string | null;
      stamped_at?: Date | null;
      xml?: string | null;
      pdf?: Buffer | null;
      origin: 'xml' | 'pdf' | 'uuid' | 'xml_pdf';
    },
  ): Promise<ElectronicInvoice> {
    const uuid = input.uuid.trim().toUpperCase();
    const duplicate = await this.invoiceRepo.findOne({
      where: { tenant_id: tenantId, uuid },
    });
    if (duplicate) {
      throw new BadRequestException('Ese UUID ya está registrado');
    }

    const invoice = this.invoiceRepo.create({
      tenant_id: tenantId,
      fiscal_configuration_id: input.fiscal_configuration_id,
      source_module: 'sales_orders',
      source_id: input.source_id,
      uuid,
      series: input.series ?? null,
      folio: input.folio ?? null,
      tipo_comprobante: 'I',
      rfc_emisor: input.rfc_emisor,
      rfc_receptor: input.rfc_receptor,
      receptor_nombre: input.receptor_nombre ?? null,
      subtotal: input.subtotal,
      total: input.total,
      currency: input.currency || 'MXN',
      xml_stamped: input.xml ?? null,
      stamp_status: 'stamped',
      sat_status: 'Vigente',
      stamped_at: input.stamped_at ?? null,
      created_by: userId,
      sat_sync_enabled: input.xml ? 1 : 0,
      metadata: { registered_existing: true, origin: input.origin },
    });
    const saved = await this.invoiceRepo.save(invoice);
    if (!input.pdf?.length) {
      return saved;
    }

    saved.pdf_stamped_s3_key = await this.pdfService.storeUploadedPdf(saved, input.pdf);
    saved.metadata = { ...(saved.metadata ?? {}), pdf_file_name: `${saved.uuid}.pdf` };
    return this.invoiceRepo.save(saved);
  }

  async attachManualFiles(
    id: string,
    tenantId: string,
    input: {
      xml?: string | null;
      pdf?: Buffer | null;
      series?: string | null;
      folio?: string | null;
      subtotal?: number | null;
      total?: number | null;
      rfcEmisor?: string | null;
      rfcReceptor?: string | null;
      receptorNombre?: string | null;
      stampedAt?: Date | null;
    },
  ): Promise<ElectronicInvoice> {
    const invoice = await this.getByIdOrFail(id, tenantId);
    if (invoice.metadata?.registered_existing !== true) {
      throw new BadRequestException('Solo se pueden completar facturas registradas a mano');
    }

    if (input.xml) {
      invoice.xml_stamped = input.xml;
      invoice.sat_sync_enabled = 1;
      if (input.series) invoice.series = input.series;
      if (input.folio) invoice.folio = input.folio;
      if (input.subtotal != null) invoice.subtotal = input.subtotal;
      if (input.total != null) invoice.total = input.total;
      if (input.rfcEmisor) invoice.rfc_emisor = input.rfcEmisor;
      if (input.rfcReceptor) invoice.rfc_receptor = input.rfcReceptor;
      if (input.receptorNombre) invoice.receptor_nombre = input.receptorNombre;
    }
    if (input.stampedAt) invoice.stamped_at = input.stampedAt;

    const saved = await this.invoiceRepo.save(invoice);
    if (!input.pdf?.length) {
      return saved;
    }

    saved.pdf_stamped_s3_key = await this.pdfService.storeUploadedPdf(saved, input.pdf);
    saved.metadata = { ...(saved.metadata ?? {}), pdf_file_name: `${saved.uuid}.pdf` };
    return this.invoiceRepo.save(saved);
  }

  async unlinkManualRegistration(id: string, tenantId: string, sourceId: string): Promise<void> {
    const invoice = await this.getByIdOrFail(id, tenantId);
    if (invoice.source_module !== 'sales_orders' || invoice.source_id !== sourceId) {
      throw new NotFoundException('Factura no encontrada en esta orden');
    }
    if (invoice.metadata?.registered_existing !== true) {
      throw new BadRequestException(
        'Solo se puede quitar una factura registrada a mano. Las timbradas desde aquí se cancelan en el SAT.',
      );
    }

    await this.invoiceRepo.manager.query(
      'DELETE FROM electronic_invoice_sync_logs WHERE electronic_invoice_id = ?',
      [id],
    );
    await this.invoiceRepo.manager.query(
      'DELETE FROM inv_s_sales_order_invoice_emails WHERE invoice_id = ?',
      [id],
    );
    await this.invoiceRepo.manager.query(
      'UPDATE electronic_invoices SET related_advance_invoice_id = NULL WHERE related_advance_invoice_id = ?',
      [id],
    );
    await this.invoiceRepo.delete({ id, tenant_id: tenantId });
  }

  async readPdfBuffer(id: string, tenantId: string): Promise<Buffer> {
    const invoice = await this.getByIdOrFail(id, tenantId);
    const file = await this.pdfService.getPdfBuffer(invoice);
    return file.buffer;
  }

  async saveStampDate(id: string, tenantId: string, stampedAt: Date): Promise<void> {
    await this.invoiceRepo.update({ id, tenant_id: tenantId }, { stamped_at: stampedAt });
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

  async assertNoActiveProductionInvoice(
    tenantId: string,
    sourceModule: ElectronicInvoiceSourceModule,
    sourceId: string,
    environment?: FinkokEnvironment,
  ): Promise<void> {
    const credentials = await this.finkokConfigService.getCredentials(tenantId, environment);
    if (credentials.environment !== 'production') {
      return;
    }

    const invoices = await this.findBySource(tenantId, sourceModule, sourceId);
    const active = invoices.some(
      (invoice) => invoice.tipo_comprobante !== 'P' && this.isActiveProductionInvoice(invoice),
    );
    if (active) {
      throw new BadRequestException(
        'Ya existe una factura activa en producción. Cancela la anterior antes de timbrar otra factura en PROD.',
      );
    }
  }

  private isActiveProductionInvoice(invoice: ElectronicInvoice): boolean {
    if (invoice.metadata?.finkok_environment !== 'production') {
      return false;
    }
    if (invoice.stamp_status !== 'stamped') {
      return false;
    }
    const sat = String(invoice.sat_status ?? '').toLowerCase();
    return !/\bcancelad[oa]\b/.test(sat);
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

    if (
      invoice.stamp_status !== 'stamped' &&
      invoice.stamp_status !== 'cancel_pending' &&
      invoice.stamp_status !== 'cancelled' &&
      invoice.stamp_status !== 'cancel_error'
    ) {
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

  async getXmlDownload(
    id: string,
    tenantId: string,
  ): Promise<{ xml: string; fileName: string }> {
    const invoice = await this.getByIdOrFail(id, tenantId);
    const downloadable = ['stamped', 'cancel_pending', 'cancelled', 'cancel_error'];
    if (!downloadable.includes(invoice.stamp_status) || !invoice.xml_stamped) {
      throw new BadRequestException('Solo hay XML para facturas timbradas');
    }

    const xml = normalizeCfdiXml(invoice.xml_stamped);
    if (!xml.includes('<')) {
      throw new BadRequestException('El XML timbrado no es un CFDI válido');
    }

    const fileName = `${invoice.uuid ?? invoice.folio ?? invoice.id}.xml`;
    return { xml, fileName };
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
      const credentials = await this.finkokConfigService.getCredentials(
        tenantId,
        this.resolveFinkokEnvironment(invoice),
      );
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

  /** Ambiente PAC con el que se timbró; cancel/sync deben usar el mismo. */
  private resolveFinkokEnvironment(invoice: ElectronicInvoice): FinkokEnvironment | undefined {
    const env = invoice.metadata?.finkok_environment;
    if (env === 'demo' || env === 'production') {
      return env;
    }
    return undefined;
  }

  /** Finkok sign_cancel usa el NoCertificado del CSD emisor, no el del SAT. */
  private resolveCancelCertificateSerial(
    invoice: ElectronicInvoice,
    fiscal: FiscalConfiguration,
  ): string | null {
    const stored = invoice.certificate_serial ?? fiscal.certificate_serial_number;
    if (stored) {
      return stored;
    }
    return this.readNoCertificadoFromXml(invoice.xml_stamped);
  }

  private assertReceptorRegimen(xml: string): void {
    let parsed;
    try {
      parsed = parseCfdiXmlForPdf(xml);
    } catch {
      return;
    }
    const message = receptorRegimenMismatch(
      parsed.receptor.rfc,
      parsed.receptor.regimenFiscalReceptor,
    );
    if (message) {
      throw new BadRequestException(message);
    }
  }

  private readNoCertificadoFromXml(xml: string | null | undefined): string | null {
    if (!xml?.trim()) {
      return null;
    }
    try {
      const serial = parseCfdiXmlForPdf(xml).noCertificado?.trim();
      return serial || null;
    } catch (error) {
      this.logger.warn(
        `No se pudo leer NoCertificado del XML: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  private async rememberFiscalCertificateSerial(
    fiscal: FiscalConfiguration,
    serial: string | null,
  ): Promise<void> {
    if (!serial || fiscal.certificate_serial_number) {
      return;
    }
    fiscal.certificate_serial_number = serial;
    await this.fiscalRepo.save(fiscal);
  }

  private async getByIdOrFail(id: string, tenantId: string): Promise<ElectronicInvoice> {
    const invoice = await this.invoiceRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!invoice) {
      throw new NotFoundException('Factura electrónica no encontrada');
    }
    return invoice;
  }
}

function readXmlAttr(xml: string, name: string): string | null {
  const match = xml.match(new RegExp(`${name}="([^"]*)"`));
  const value = match?.[1]?.trim();
  return value || null;
}
