"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ElectronicInvoiceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElectronicInvoiceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const electronic_invoice_entity_1 = require("../../../entities/electronic-invoicing/electronic-invoice.entity");
const electronic_invoice_sync_log_entity_1 = require("../../../entities/electronic-invoicing/electronic-invoice-sync-log.entity");
const fiscal_configuration_entity_1 = require("../../../entities/billing/fiscal-configuration.entity");
const finkok_provider_configuration_service_1 = require("./finkok-provider-configuration.service");
const finkok_soap_client_1 = require("./finkok-soap.client");
const electronic_invoice_pdf_service_1 = require("./electronic-invoice-pdf.service");
const cfdi_xml_parser_1 = require("../utils/cfdi-xml.parser");
let ElectronicInvoiceService = ElectronicInvoiceService_1 = class ElectronicInvoiceService {
    invoiceRepo;
    syncLogRepo;
    fiscalRepo;
    finkokConfigService;
    finkokClient;
    pdfService;
    logger = new common_1.Logger(ElectronicInvoiceService_1.name);
    constructor(invoiceRepo, syncLogRepo, fiscalRepo, finkokConfigService, finkokClient, pdfService) {
        this.invoiceRepo = invoiceRepo;
        this.syncLogRepo = syncLogRepo;
        this.fiscalRepo = fiscalRepo;
        this.finkokConfigService = finkokConfigService;
        this.finkokClient = finkokClient;
        this.pdfService = pdfService;
    }
    async stamp(tenantId, userId, dto) {
        const fiscal = await this.fiscalRepo.findOne({
            where: { id: dto.fiscal_configuration_id, tenant_id: tenantId },
        });
        if (!fiscal) {
            throw new common_1.NotFoundException('Razón emisora no encontrada');
        }
        if (fiscal.finkok_registration_status !== 'registered') {
            throw new common_1.BadRequestException('La razón emisora debe estar registrada en Finkok antes de timbrar.');
        }
        const credentials = await this.finkokConfigService.getCredentials(tenantId, dto.environment);
        let result;
        try {
            result = await this.finkokClient.signStamp(credentials, dto.xml);
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : 'Error de comunicación con Finkok';
            this.logger.warn(`Finkok Sign_Stamp comunicación: ${msg}`);
            throw new common_1.BadRequestException(msg);
        }
        if (!result.success || !result.xml) {
            const incidencia = result.incidencias?.[0];
            const errorMsg = incidencia?.mensajeIncidencia ??
                result.codEstatus ??
                'Error desconocido al timbrar';
            const codigo = incidencia?.codigoError;
            this.logger.warn(`Finkok Sign_Stamp rechazado${codigo ? ` [${codigo}]` : ''}: ${errorMsg}`);
            throw new common_1.BadRequestException(codigo ? `${codigo}: ${errorMsg}` : errorMsg);
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
            certificate_serial: dto.certificate_serial ??
                fiscal.certificate_serial_number ??
                this.readNoCertificadoFromXml(result.xml) ??
                null,
            stamp_status: 'stamped',
            stamp_error_message: null,
            sat_sync_enabled: 1,
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
    async cancel(id, tenantId, userId, dto) {
        const invoice = await this.getByIdOrFail(id, tenantId);
        if (invoice.stamp_status !== 'stamped' && invoice.stamp_status !== 'cancel_pending') {
            throw new common_1.BadRequestException(`Solo se pueden cancelar facturas timbradas. Estado actual: ${invoice.stamp_status}`);
        }
        if (!invoice.uuid) {
            throw new common_1.BadRequestException('La factura no tiene UUID');
        }
        const fiscal = await this.fiscalRepo.findOne({
            where: { id: invoice.fiscal_configuration_id, tenant_id: tenantId },
        });
        if (!fiscal) {
            throw new common_1.NotFoundException('Razón emisora no encontrada');
        }
        const certificateSerial = this.resolveCancelCertificateSerial(invoice, fiscal);
        if (certificateSerial) {
            invoice.certificate_serial = invoice.certificate_serial ?? certificateSerial;
            await this.rememberFiscalCertificateSerial(fiscal, certificateSerial);
        }
        const credentials = await this.finkokConfigService.getCredentials(tenantId, this.resolveFinkokEnvironment(invoice));
        const result = await this.finkokClient.signCancel(credentials, invoice.rfc_emisor, certificateSerial, [
            {
                uuid: invoice.uuid,
                motivo: dto.motivo,
                folioSustitucion: dto.folio_sustitucion,
            },
        ]);
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
        await this.syncLogRepo.save(this.syncLogRepo.create({
            tenant_id: tenantId,
            electronic_invoice_id: invoice.id,
            trigger_type: 'manual',
            previous_sat_status: invoice.sat_status,
            new_sat_status: invoice.stamp_status === 'cancelled' ? 'Cancelado' : invoice.sat_status,
            raw_response: { cancel: result },
            success: result.success ? 1 : 0,
            triggered_by: userId,
        }));
        return this.invoiceRepo.save(invoice);
    }
    async syncSatStatus(id, tenantId, userId, trigger = 'manual') {
        const invoice = await this.getByIdOrFail(id, tenantId);
        if (!invoice.uuid || invoice.stamp_status === 'stamp_error') {
            throw new common_1.BadRequestException('La factura debe estar timbrada para consultar el SAT');
        }
        const previousStatus = invoice.sat_status;
        const total = Number(invoice.total).toFixed(2);
        let result = await this.tryFinkokSatStatus(tenantId, invoice, total);
        if (!result.success) {
            result = await this.finkokClient.consultSatCfdi(invoice.rfc_emisor, invoice.rfc_receptor, total, invoice.uuid);
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
        await this.syncLogRepo.save(this.syncLogRepo.create({
            tenant_id: tenantId,
            electronic_invoice_id: invoice.id,
            trigger_type: trigger,
            previous_sat_status: previousStatus,
            new_sat_status: newSatStatus,
            raw_response: result,
            success: result.success ? 1 : 0,
            error_message: result.success
                ? null
                : result.error ?? result.codigoEstatus ?? 'Consulta SAT fallida',
            triggered_by: userId,
        }));
        return this.invoiceRepo.save(invoice);
    }
    async findBySource(tenantId, sourceModule, sourceId) {
        return this.invoiceRepo.find({
            where: { tenant_id: tenantId, source_module: sourceModule, source_id: sourceId },
            order: { created_at: 'DESC' },
        });
    }
    isCfdiVigente(invoice) {
        if (invoice.sat_status === 'Cancelado') {
            return false;
        }
        if (invoice.sat_status === 'Vigente') {
            return true;
        }
        return (invoice.stamp_status === 'stamped' ||
            invoice.stamp_status === 'cancel_pending' ||
            invoice.stamp_status === 'cancel_error');
    }
    async findVigenteBySource(tenantId, sourceModule, sourceId) {
        const invoices = await this.findBySource(tenantId, sourceModule, sourceId);
        return invoices.filter((invoice) => this.isCfdiVigente(invoice));
    }
    async findAll(tenantId, query) {
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
    async findOne(id, tenantId) {
        return this.getByIdOrFail(id, tenantId);
    }
    async getPdfDownload(id, tenantId, regenerate = false, preview = false) {
        const invoice = await this.getByIdOrFail(id, tenantId);
        if (preview) {
            return this.getPdfPreviewDownload(invoice, tenantId);
        }
        if (invoice.stamp_status !== 'stamped' && invoice.stamp_status !== 'cancel_pending' && invoice.stamp_status !== 'cancelled') {
            throw new common_1.BadRequestException('Solo hay PDF para facturas timbradas');
        }
        if (!invoice.pdf_stamped_s3_key || regenerate) {
            const fiscal = await this.fiscalRepo.findOne({
                where: { id: invoice.fiscal_configuration_id, tenant_id: tenantId },
            });
            if (!fiscal) {
                throw new common_1.NotFoundException('Razón emisora no encontrada');
            }
            const updated = await this.generatePdfAfterStamp(invoice, fiscal);
            return this.pdfService.getSignedPdfUrl(updated);
        }
        return this.pdfService.getSignedPdfUrl(invoice);
    }
    async getXmlDownload(id, tenantId) {
        const invoice = await this.getByIdOrFail(id, tenantId);
        const downloadable = ['stamped', 'cancel_pending', 'cancelled', 'cancel_error'];
        if (!downloadable.includes(invoice.stamp_status) || !invoice.xml_stamped) {
            throw new common_1.BadRequestException('Solo hay XML para facturas timbradas');
        }
        const xml = (0, cfdi_xml_parser_1.normalizeCfdiXml)(invoice.xml_stamped);
        if (!xml.includes('<')) {
            throw new common_1.BadRequestException('El XML timbrado no es un CFDI válido');
        }
        const fileName = `${invoice.uuid ?? invoice.folio ?? invoice.id}.xml`;
        return { xml, fileName };
    }
    async getPdfPreviewDownload(invoice, tenantId) {
        const bundle = await this.finkokConfigService.getAllForTenant(tenantId);
        if (bundle.stamping_environment !== 'demo') {
            throw new common_1.BadRequestException('La vista previa de PDF solo está disponible con Finkok en ambiente demo');
        }
        const previewableStatuses = ['stamp_error', 'pending_stamp'];
        if (!previewableStatuses.includes(invoice.stamp_status)) {
            throw new common_1.BadRequestException('La vista previa aplica a facturas con error de timbrado o pendientes de timbrar');
        }
        const fiscal = await this.fiscalRepo.findOne({
            where: { id: invoice.fiscal_configuration_id, tenant_id: tenantId },
        });
        if (!fiscal) {
            throw new common_1.NotFoundException('Razón emisora no encontrada');
        }
        return this.pdfService.generatePreviewAndUpload(invoice, fiscal);
    }
    mapSatEstado(estado) {
        if (!estado) {
            return 'Desconocido';
        }
        if (estado === 'Vigente' || estado === 'Cancelado' || estado === 'No Encontrado') {
            return estado;
        }
        return 'Desconocido';
    }
    async tryFinkokSatStatus(tenantId, invoice, total) {
        try {
            const credentials = await this.finkokConfigService.getCredentials(tenantId, this.resolveFinkokEnvironment(invoice));
            return await this.finkokClient.getSatStatusFinkok(credentials, invoice.rfc_emisor, invoice.rfc_receptor, total, invoice.uuid);
        }
        catch {
            return { success: false, source: 'finkok' };
        }
    }
    async generatePdfAfterStamp(invoice, fiscal) {
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
        }
        catch (error) {
            this.logger.error(`Error generando PDF CFDI ${invoice.id}: ${error instanceof Error ? error.message : error}`);
            invoice.metadata = {
                ...(invoice.metadata ?? {}),
                pdf_generation_error: error instanceof Error ? error.message : 'Error generando PDF',
            };
            return this.invoiceRepo.save(invoice);
        }
    }
    resolveFinkokEnvironment(invoice) {
        const env = invoice.metadata?.finkok_environment;
        if (env === 'demo' || env === 'production') {
            return env;
        }
        return undefined;
    }
    resolveCancelCertificateSerial(invoice, fiscal) {
        const stored = invoice.certificate_serial ?? fiscal.certificate_serial_number;
        if (stored) {
            return stored;
        }
        return this.readNoCertificadoFromXml(invoice.xml_stamped);
    }
    readNoCertificadoFromXml(xml) {
        if (!xml?.trim()) {
            return null;
        }
        try {
            const serial = (0, cfdi_xml_parser_1.parseCfdiXmlForPdf)(xml).noCertificado?.trim();
            return serial || null;
        }
        catch (error) {
            this.logger.warn(`No se pudo leer NoCertificado del XML: ${error instanceof Error ? error.message : error}`);
            return null;
        }
    }
    async rememberFiscalCertificateSerial(fiscal, serial) {
        if (!serial || fiscal.certificate_serial_number) {
            return;
        }
        fiscal.certificate_serial_number = serial;
        await this.fiscalRepo.save(fiscal);
    }
    async getByIdOrFail(id, tenantId) {
        const invoice = await this.invoiceRepo.findOne({ where: { id, tenant_id: tenantId } });
        if (!invoice) {
            throw new common_1.NotFoundException('Factura electrónica no encontrada');
        }
        return invoice;
    }
};
exports.ElectronicInvoiceService = ElectronicInvoiceService;
exports.ElectronicInvoiceService = ElectronicInvoiceService = ElectronicInvoiceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(electronic_invoice_entity_1.ElectronicInvoice)),
    __param(1, (0, typeorm_1.InjectRepository)(electronic_invoice_sync_log_entity_1.ElectronicInvoiceSyncLog)),
    __param(2, (0, typeorm_1.InjectRepository)(fiscal_configuration_entity_1.FiscalConfiguration)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        finkok_provider_configuration_service_1.FinkokProviderConfigurationService,
        finkok_soap_client_1.FinkokSoapClient,
        electronic_invoice_pdf_service_1.ElectronicInvoicePdfService])
], ElectronicInvoiceService);
//# sourceMappingURL=electronic-invoice.service.js.map