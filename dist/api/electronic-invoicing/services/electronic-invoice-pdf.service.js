"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ElectronicInvoicePdfService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElectronicInvoicePdfService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const pdfmake_1 = __importDefault(require("pdfmake"));
const path = __importStar(require("path"));
const typeorm_2 = require("typeorm");
const s3_service_1 = require("../../../common/services/s3.service");
const billing_branch_entity_1 = require("../../../entities/billing/billing-branch.entity");
const customer_entity_1 = require("../../../entities/customers/customer.entity");
const sales_order_entity_1 = require("../../../entities/sales-orders/sales-order.entity");
const cfdi_xml_parser_1 = require("../utils/cfdi-xml.parser");
const fiscal_domicile_util_1 = require("../../customers/utils/fiscal-domicile.util");
const cfdi_qr_util_1 = require("../utils/cfdi-qr.util");
const cfdi_catalog_labels_1 = require("../utils/cfdi-catalog-labels");
let ElectronicInvoicePdfService = ElectronicInvoicePdfService_1 = class ElectronicInvoicePdfService {
    s3Service;
    billingBranchRepo;
    customerRepo;
    salesOrderRepo;
    logger = new common_1.Logger(ElectronicInvoicePdfService_1.name);
    brandText = '#3d5a73';
    sectionBg = '#e8f1f6';
    panelBg = '#f3f7fa';
    borderColor = '#d4e0ea';
    fonts = {
        Roboto: {
            normal: path.join(process.cwd(), 'src/_public/fonts/Roboto-Regular.ttf'),
            bold: path.join(process.cwd(), 'src/_public/fonts/Roboto-Bold.ttf'),
            italics: path.join(process.cwd(), 'src/_public/fonts/Roboto-Italic.ttf'),
            bolditalics: path.join(process.cwd(), 'src/_public/fonts/Roboto-BoldItalic.ttf'),
        },
    };
    constructor(s3Service, billingBranchRepo, customerRepo, salesOrderRepo) {
        this.s3Service = s3Service;
        this.billingBranchRepo = billingBranchRepo;
        this.customerRepo = customerRepo;
        this.salesOrderRepo = salesOrderRepo;
    }
    async generateAndUpload(invoice, fiscal) {
        if (!invoice.xml_stamped) {
            throw new common_1.BadRequestException('La factura no tiene XML timbrado para generar PDF');
        }
        const cfdi = (0, cfdi_xml_parser_1.parseStampedCfdiXml)(invoice.xml_stamped);
        const branch = await this.billingBranchRepo.findOne({
            where: { fiscal_configuration_id: fiscal.id, status: 1 },
            order: { created_at: 'ASC' },
        });
        const receptor = await this.findReceptorCustomer(invoice, cfdi.receptor.rfc);
        const pdfBuffer = await this.buildPdfBuffer(cfdi, fiscal, branch, receptor);
        return this.uploadPdf(invoice, cfdi, pdfBuffer);
    }
    async getSignedPdfUrl(invoice) {
        if (!invoice.pdf_stamped_s3_key) {
            throw new common_1.BadRequestException('La factura no tiene PDF generado');
        }
        const fileName = this.buildFileName(invoice);
        const signedUrl = await this.s3Service.getSignedUrl(invoice.pdf_stamped_s3_key, 3600);
        return {
            s3Key: invoice.pdf_stamped_s3_key,
            signedUrl,
            fileName,
        };
    }
    async getPdfBuffer(invoice) {
        if (!invoice.pdf_stamped_s3_key) {
            throw new common_1.BadRequestException('La factura no tiene PDF generado');
        }
        const buffer = await this.s3Service.getFileBuffer(invoice.pdf_stamped_s3_key);
        return { buffer, fileName: this.buildFileName(invoice) };
    }
    async generatePreviewAndUpload(invoice, fiscal) {
        const xml = invoice.xml_unsigned?.trim();
        if (!xml) {
            throw new common_1.BadRequestException('La factura no tiene XML para generar vista previa del PDF');
        }
        const cfdi = (0, cfdi_xml_parser_1.parseCfdiXmlForPdf)(xml);
        const branch = await this.billingBranchRepo.findOne({
            where: { fiscal_configuration_id: fiscal.id, status: 1 },
            order: { created_at: 'ASC' },
        });
        const receptor = await this.findReceptorCustomer(invoice, cfdi.receptor.rfc);
        const pdfBuffer = await this.buildPdfBuffer(cfdi, fiscal, branch, receptor, { preview: true });
        const upload = await this.uploadPdf(invoice, cfdi, pdfBuffer, { preview: true });
        return { ...upload, preview: true };
    }
    async buildPdfBuffer(cfdi, fiscal, branch, receptor, options = {}) {
        const printer = new pdfmake_1.default(this.fonts);
        const logoImage = await this.getLogoImage(fiscal.logo);
        const isPreview = options.preview === true;
        const hasTimbre = Boolean(cfdi.timbre.uuid);
        const qrImage = !isPreview && hasTimbre
            ? await (0, cfdi_qr_util_1.generateCfdiQrDataUrl)((0, cfdi_qr_util_1.buildCfdiVerificationUrl)(cfdi))
            : null;
        const emisorAddress = this.formatEmisorAddress(branch);
        const serieFolio = [cfdi.serie, cfdi.folio].filter(Boolean).join(' / ') || '—';
        const conceptRows = [
            [
                { text: 'Cant.', style: 'tableTh' },
                { text: 'Clave Unidad', style: 'tableTh' },
                { text: 'Unidad', style: 'tableTh' },
                { text: 'C. Prod/Serv', style: 'tableTh' },
                { text: 'Descripcion', style: 'tableTh' },
                { text: 'Valor Unitario', style: 'tableTh' },
                { text: 'Descuento', style: 'tableTh' },
                { text: 'Importe', style: 'tableTh' },
            ],
        ];
        for (const concepto of cfdi.conceptos) {
            conceptRows.push([
                concepto.cantidad,
                concepto.claveUnidad,
                concepto.unidad,
                concepto.claveProdServ,
                concepto.descripcion,
                this.formatCurrency(concepto.valorUnitario),
                this.formatCurrency(concepto.descuento || '0'),
                this.formatCurrency(concepto.importe),
            ]);
            for (const traslado of concepto.traslados) {
                conceptRows.push([
                    {
                        colSpan: 8,
                        text: this.formatConceptTaxLine(traslado),
                        style: 'conceptTax',
                    },
                    {},
                    {},
                    {},
                    {},
                    {},
                    {},
                    {},
                ]);
            }
        }
        const previewBanner = isPreview
            ? {
                text: 'VISTA PREVIA — Modo pruebas Finkok. Documento sin timbrar; no válido ante el SAT.',
                style: 'previewBanner',
                margin: [0, 0, 0, 10],
            }
            : null;
        const uuidLabel = hasTimbre ? cfdi.timbre.uuid : 'Pendiente de timbrado';
        const emisorNombre = cfdi.emisor.nombre || fiscal.razon_social;
        const docDefinition = {
            pageSize: 'LETTER',
            pageMargins: [24, 22, 24, 22],
            content: [
                ...(previewBanner ? [previewBanner] : []),
                {
                    table: {
                        widths: [70, '*', 176],
                        body: [
                            [
                                {
                                    ...(logoImage
                                        ? { image: logoImage, fit: [66, 48], alignment: 'center', margin: [0, 4, 4, 0] }
                                        : { text: '' }),
                                    valign: 'top',
                                },
                                {
                                    stack: [
                                        { text: emisorNombre, style: 'issuerName' },
                                        ...(emisorAddress ? [{ text: emisorAddress, style: 'issuerMeta' }] : []),
                                        { text: `RFC: ${cfdi.emisor.rfc}`, style: 'issuerMeta' },
                                        {
                                            text: `Regimen fiscal: ${(0, cfdi_catalog_labels_1.labelRegimenFiscal)(cfdi.emisor.regimenFiscal)}`,
                                            style: 'issuerMeta',
                                        },
                                        {
                                            text: `Lugar de expedicion: ${cfdi.lugarExpedicion}`,
                                            style: 'issuerMeta',
                                        },
                                        this.buildComprobanteHeader(cfdi),
                                    ],
                                    margin: [4, 2, 8, 0],
                                    valign: 'top',
                                },
                                { ...this.buildFacturaBox(cfdi, serieFolio, uuidLabel, hasTimbre), valign: 'top' },
                            ],
                        ],
                    },
                    layout: 'noBorders',
                    margin: [0, 0, 0, 6],
                },
                this.headerDivider(),
                this.sectionBar('DATOS DEL CLIENTE'),
                this.infoPairsTable([
                    ['Nombre', { text: cfdi.receptor.nombre, bold: true }],
                    ['RFC', cfdi.receptor.rfc],
                    ['Domicilio fiscal', this.formatReceptorAddress(receptor, cfdi.receptor.domicilioFiscalReceptor)],
                    ['Regimen fiscal', (0, cfdi_catalog_labels_1.labelRegimenFiscal)(cfdi.receptor.regimenFiscalReceptor)],
                    ['Uso CFDI', (0, cfdi_catalog_labels_1.labelUsoCfdi)(cfdi.receptor.usoCfdi)],
                    ['Version CFDI', `CFDI ${cfdi.version || '4.0'}`],
                ]),
                this.sectionBar('CONCEPTOS'),
                {
                    table: {
                        headerRows: 1,
                        widths: [28, 52, 42, 58, '*', 58, 52, 58],
                        body: conceptRows,
                    },
                    layout: this.tableLayout(),
                    margin: [0, 0, 0, 8],
                },
                {
                    columns: [
                        { width: '*', text: '' },
                        {
                            width: 210,
                            table: {
                                widths: ['*', 78],
                                body: this.buildTotalsRows(cfdi),
                            },
                            layout: this.totalsLayout(),
                        },
                    ],
                    margin: [0, 0, 0, 12],
                },
                {
                    table: {
                        widths: [108, '*'],
                        body: [
                            [
                                qrImage
                                    ? { image: qrImage, width: 108, alignment: 'center' }
                                    : {
                                        table: {
                                            widths: ['*'],
                                            body: [
                                                [
                                                    {
                                                        text: isPreview ? 'QR disponible\ntras timbrado' : 'Sin QR',
                                                        style: 'qrPlaceholder',
                                                        alignment: 'center',
                                                    },
                                                ],
                                            ],
                                        },
                                        layout: this.boxLayout(),
                                    },
                                {
                                    stack: [
                                        this.sealBlock('Cadena original del complemento de certificacion digital del SAT', hasTimbre ? uuidLabel : '—'),
                                        this.sealBlock('Sello digital del CFDI', cfdi.timbre.selloCFD),
                                        this.sealBlock('Sello digital del SAT', cfdi.timbre.selloSAT),
                                        {
                                            columns: [
                                                {
                                                    width: '*',
                                                    stack: [
                                                        this.footerMeta('No. certificado SAT', cfdi.timbre.noCertificadoSAT),
                                                        this.footerMeta('Fecha de certificacion', cfdi.timbre.fechaTimbrado),
                                                    ],
                                                },
                                                {
                                                    width: '*',
                                                    stack: [
                                                        this.footerMeta('RFC proveedor certificacion', cfdi.timbre.rfcProvCertif),
                                                        this.footerMeta('Folio fiscal (UUID)', uuidLabel),
                                                    ],
                                                },
                                            ],
                                            margin: [0, 4, 0, 0],
                                        },
                                    ],
                                    margin: [8, 0, 0, 0],
                                },
                            ],
                        ],
                    },
                    layout: 'noBorders',
                },
                {
                    text: isPreview
                        ? 'Vista previa de representacion impresa — no es un CFDI vigente'
                        : 'Este documento es una representacion impresa de un CFDI',
                    style: 'legalLegend',
                    margin: [0, 12, 0, 0],
                },
                {
                    text: [
                        { text: 'Generada por ', color: '#8b7cc9' },
                        { text: 'Vexia', bold: true, color: '#6d4ec9' },
                    ],
                    style: 'vexiaCredit',
                    margin: [0, 3, 0, 0],
                },
            ],
            styles: {
                issuerName: { fontSize: 11, bold: true, color: '#0f172a' },
                issuerMeta: { fontSize: 7.5, color: '#475569', margin: [0, 1, 0, 0] },
                facturaTitle: {
                    fontSize: 9,
                    bold: true,
                    color: this.brandText,
                    fillColor: this.sectionBg,
                },
                facturaLabel: { fontSize: 6.5, color: '#64748b' },
                facturaValue: { fontSize: 6.5, color: '#334155', bold: true },
                sectionBarText: {
                    fontSize: 8,
                    bold: true,
                    color: this.brandText,
                },
                infoLabel: { fontSize: 7.5, color: '#64748b', fillColor: this.panelBg },
                infoValue: { fontSize: 7.5, color: '#334155' },
                compHeaderTitle: { fontSize: 7, bold: true, color: this.brandText },
                compLine: { fontSize: 6.5, lineHeight: 0.95, color: '#334155' },
                compLabel: { fontSize: 6.5, color: '#64748b' },
                compValue: { fontSize: 6.5, color: '#334155' },
                tableTh: { fontSize: 7, bold: true, color: '#475569', fillColor: '#edf2f6' },
                conceptTax: { fontSize: 7, color: '#64748b', italics: true, fillColor: this.panelBg },
                totalLabel: { fontSize: 8, color: '#64748b', margin: [6, 4, 4, 4] },
                totalValue: { fontSize: 8, color: '#334155', alignment: 'right', margin: [4, 4, 6, 4] },
                totalLabelStrong: {
                    fontSize: 9,
                    bold: true,
                    color: this.brandText,
                    fillColor: this.sectionBg,
                    margin: [6, 5, 4, 5],
                },
                totalValueStrong: {
                    fontSize: 9,
                    bold: true,
                    color: this.brandText,
                    fillColor: this.sectionBg,
                    alignment: 'right',
                    margin: [4, 5, 6, 5],
                },
                sealTitle: {
                    fontSize: 6.5,
                    bold: true,
                    color: '#4a6278',
                    fillColor: this.panelBg,
                    margin: [4, 3, 4, 3],
                },
                sealBody: {
                    fontSize: 5.5,
                    color: '#334155',
                    margin: [4, 3, 4, 3],
                    alignment: 'left',
                },
                footerMetaLabel: { fontSize: 6.5, color: '#64748b' },
                footerMetaValue: { fontSize: 6.5, color: '#0f172a', bold: true },
                legalLegend: { fontSize: 7, italics: true, alignment: 'center', color: '#94a3b8' },
                vexiaCredit: { fontSize: 6.5, alignment: 'center' },
                previewBanner: {
                    fontSize: 8.5,
                    bold: true,
                    color: '#92400e',
                    fillColor: '#fef3c7',
                    alignment: 'center',
                    margin: [0, 0, 0, 8],
                },
                qrPlaceholder: { fontSize: 7.5, color: '#94a3b8', margin: [4, 28, 4, 28] },
            },
            defaultStyle: {
                fontSize: 8,
                color: '#0f172a',
            },
        };
        return this.renderPdf(printer, docDefinition);
    }
    async uploadPdf(invoice, cfdi, pdfBuffer, options = {}) {
        const fileName = this.buildFileName(invoice, cfdi, options.preview);
        const { entityType, entityId, documentType } = this.resolveS3Path(invoice, options.preview);
        const s3Key = await this.s3Service.uploadEntityFile(invoice.tenant_id, entityType, entityId, documentType, pdfBuffer, fileName, 'application/pdf');
        const signedUrl = await this.s3Service.getSignedUrl(s3Key, 3600);
        return { s3Key, signedUrl, fileName };
    }
    resolveS3Path(invoice, preview = false) {
        const documentType = preview ? 'cfdi_pdf_preview' : 'cfdi_pdf';
        if (invoice.source_module === 'sales_orders') {
            return {
                entityType: 'sales_orders',
                entityId: invoice.source_id,
                documentType,
            };
        }
        return {
            entityType: 'electronic_invoices',
            entityId: invoice.id,
            documentType,
        };
    }
    buildFileName(invoice, cfdi, preview = false) {
        const uuid = cfdi?.timbre.uuid ?? invoice.uuid ?? invoice.id;
        const serie = cfdi?.serie ?? invoice.series ?? '';
        const folio = cfdi?.folio ?? invoice.folio ?? '';
        const serieFolio = [serie, folio].filter(Boolean).join('-');
        const suffix = serieFolio ? `${serieFolio}-` : '';
        const prefix = preview ? 'PREVIEW-' : '';
        return `${prefix}CFDI-${suffix}${uuid}.pdf`;
    }
    formatEmisorAddress(branch) {
        if (!branch) {
            return '';
        }
        return [
            branch.address,
            branch.city,
            branch.state,
            branch.postal_code ? `C.P. ${branch.postal_code}` : null,
            branch.country,
        ]
            .filter(Boolean)
            .join(', ');
    }
    async findReceptorCustomer(invoice, receptorRfc) {
        const rfc = receptorRfc?.trim().toUpperCase();
        if (invoice.source_module === 'sales_orders' && invoice.source_id) {
            const order = await this.salesOrderRepo.findOne({
                where: { id: invoice.source_id, tenant_id: invoice.tenant_id },
                select: ['id', 'customer_id'],
            });
            if (order?.customer_id) {
                const byOrder = await this.customerRepo.findOne({
                    where: { id: order.customer_id, tenant_id: invoice.tenant_id },
                });
                const orderRfc = byOrder?.fiscal_rfc?.trim().toUpperCase() ?? '';
                if (byOrder && rfc && orderRfc === rfc) {
                    return byOrder;
                }
            }
        }
        if (!rfc) {
            return null;
        }
        return this.customerRepo
            .createQueryBuilder('customer')
            .where('customer.tenant_id = :tenantId', { tenantId: invoice.tenant_id })
            .andWhere('UPPER(customer.fiscal_rfc) = :rfc', { rfc })
            .getOne();
    }
    formatReceptorAddress(customer, xmlPostalCode) {
        const postal = customer?.fiscal_postal_code?.trim() || xmlPostalCode?.trim();
        const streetLine = (0, fiscal_domicile_util_1.composeFiscalAddress)({
            street: customer?.fiscal_street,
            exteriorNumber: customer?.fiscal_exterior_number,
            interiorNumber: customer?.fiscal_interior_number,
            colonia: customer?.fiscal_colonia,
        }) || customer?.fiscal_address?.trim();
        const country = this.formatCountry(customer?.fiscal_country);
        const formatted = [
            streetLine,
            customer?.fiscal_localidad?.trim(),
            customer?.fiscal_municipio?.trim() || customer?.fiscal_city?.trim(),
            customer?.fiscal_state?.trim(),
            postal ? `C.P. ${postal}` : null,
            country,
        ]
            .filter(Boolean)
            .join(', ');
        return formatted || postal || '—';
    }
    formatCountry(code) {
        const value = code?.trim();
        if (!value) {
            return null;
        }
        if (value.toUpperCase() === 'MEX' || value.toLowerCase() === 'mexico' || value.toLowerCase() === 'méxico') {
            return 'México';
        }
        return value;
    }
    formatCurrency(value) {
        const amount = Number(value) || 0;
        return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    formatTaxRate(tasaOCuota) {
        const rate = Number(tasaOCuota);
        if (!Number.isFinite(rate)) {
            return '0 %';
        }
        return `${(rate * 100).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        })} %`;
    }
    formatConceptTaxLine(traslado) {
        const taxName = traslado.impuesto === '002' ? 'IVA' : traslado.impuesto === '003' ? 'IEPS' : 'Traslado';
        return `${taxName} ${this.formatTaxRate(traslado.tasaOCuota)}  ·  Base ${this.formatCurrency(traslado.base)}  ·  Importe ${this.formatCurrency(traslado.importe || '0')}`;
    }
    totalRow(label, value) {
        return [
            { text: label, style: 'totalLabel' },
            { text: this.formatCurrency(value || 0), style: 'totalValue' },
        ];
    }
    buildTotalsRows(cfdi) {
        return [
            this.totalRow('SubTotal', cfdi.subTotal),
            this.totalRow('Descuento', cfdi.descuento || '0'),
            this.totalRow('IVA', cfdi.totalImpuestosTrasladados || '0'),
            [
                { text: 'Total', style: 'totalLabelStrong' },
                { text: this.formatCurrency(cfdi.total), style: 'totalValueStrong' },
            ],
        ];
    }
    wrapUnbreakable(value, groupSize = 64) {
        const text = value?.trim();
        if (!text) {
            return '—';
        }
        return text.replace(new RegExp(`.{1,${groupSize}}`, 'g'), '$& ').trimEnd();
    }
    buildComprobanteHeader(cfdi) {
        const pairs = [
            ['Forma de pago', (0, cfdi_catalog_labels_1.labelFormaPago)(cfdi.formaPago)],
            ['Método de pago', (0, cfdi_catalog_labels_1.labelMetodoPago)(cfdi.metodoPago)],
            ['Tipo', (0, cfdi_catalog_labels_1.labelTipoComprobante)(cfdi.tipoComprobante)],
            ['Moneda', cfdi.moneda || 'MXN'],
            ['Exportación', cfdi.exportacion || '01'],
        ];
        return {
            stack: [
                { text: 'Datos del comprobante', style: 'compHeaderTitle', margin: [0, 6, 0, 1] },
                ...pairs.map(([label, value]) => ({
                    text: [
                        { text: `${label}:  `, style: 'compLabel' },
                        { text: value, style: 'compValue' },
                    ],
                    style: 'compLine',
                    margin: [0, 0, 0, 0],
                })),
            ],
            margin: [0, 0, 0, 0],
        };
    }
    headerDivider() {
        return {
            canvas: [
                {
                    type: 'line',
                    x1: 0,
                    y1: 0,
                    x2: 564,
                    y2: 0,
                    lineWidth: 0.8,
                    lineColor: this.borderColor,
                },
            ],
            margin: [0, 0, 0, 4],
        };
    }
    sectionBar(title) {
        return {
            text: title,
            style: 'sectionBarText',
            margin: [0, 6, 0, 2],
        };
    }
    buildFacturaBox(cfdi, serieFolio, uuidLabel, hasTimbre) {
        const rows = [
            this.facturaRow('Folio fiscal', serieFolio),
            this.facturaRow('Fecha emision', cfdi.fecha || '—'),
            this.facturaRow('Fecha certificacion', cfdi.timbre.fechaTimbrado || '—'),
            this.facturaRow('Folio fiscal (UUID)', uuidLabel),
            this.facturaRow('No. certificado CSD', cfdi.noCertificado || '—'),
            this.facturaRow('No. certificado SAT', hasTimbre ? cfdi.timbre.noCertificadoSAT || '—' : '—'),
        ];
        return {
            table: {
                widths: ['*'],
                body: [
                    [{ text: 'FACTURA', style: 'facturaTitle', alignment: 'center', margin: [0, 6, 0, 6] }],
                    [{ stack: rows, margin: [6, 6, 6, 6] }],
                ],
            },
            layout: this.facturaBoxLayout(),
        };
    }
    facturaRow(label, value) {
        return {
            stack: [
                { text: label, style: 'facturaLabel' },
                { text: this.wrapUnbreakable(value, 24), style: 'facturaValue' },
            ],
            margin: [0, 0, 0, 4],
        };
    }
    infoPairsTable(pairs, options = {}) {
        return {
            table: {
                widths: ['34%', '66%'],
                body: pairs.map(([label, value]) => [
                    { text: label, style: 'infoLabel', margin: [6, 4, 4, 4] },
                    typeof value === 'string'
                        ? { text: value, style: 'infoValue', margin: [4, 4, 6, 4] }
                        : {
                            text: value.text,
                            style: 'infoValue',
                            bold: value.bold === true,
                            margin: [4, 4, 6, 4],
                        },
                ]),
            },
            layout: this.boxLayout(),
            margin: options.margin ?? [0, 0, 0, 10],
        };
    }
    sealBlock(title, body) {
        return {
            table: {
                widths: ['*'],
                dontBreakRows: false,
                body: [
                    [{ text: title, style: 'sealTitle' }],
                    [{ text: this.wrapUnbreakable(body), style: 'sealBody' }],
                ],
            },
            layout: this.boxLayout(),
            margin: [0, 0, 0, 4],
        };
    }
    footerMeta(label, value) {
        return {
            stack: [
                { text: label, style: 'footerMetaLabel' },
                { text: value || '—', style: 'footerMetaValue' },
            ],
            margin: [0, 0, 0, 4],
        };
    }
    facturaBoxLayout() {
        return {
            hLineColor: () => this.borderColor,
            vLineColor: () => this.borderColor,
            hLineWidth: (i, node) => i === 0 || i === node.table.body.length ? 0.8 : 0,
            vLineWidth: () => 0.8,
            paddingLeft: () => 0,
            paddingRight: () => 0,
            paddingTop: () => 0,
            paddingBottom: () => 0,
        };
    }
    boxLayout() {
        return {
            hLineColor: () => this.borderColor,
            vLineColor: () => this.borderColor,
            hLineWidth: () => 0.6,
            vLineWidth: () => 0.6,
            paddingTop: () => 0,
            paddingBottom: () => 0,
            paddingLeft: () => 0,
            paddingRight: () => 0,
        };
    }
    totalsLayout() {
        return {
            hLineColor: () => this.borderColor,
            vLineColor: () => this.borderColor,
            hLineWidth: (i, node) => i === 0 || i === node.table.body.length ? 1 : 0.5,
            vLineWidth: () => 1,
            paddingTop: () => 0,
            paddingBottom: () => 0,
            paddingLeft: () => 0,
            paddingRight: () => 0,
        };
    }
    tableLayout() {
        return {
            hLineColor: () => this.borderColor,
            vLineColor: () => this.borderColor,
            hLineWidth: () => 0.4,
            vLineWidth: () => 0.4,
            paddingTop: () => 4,
            paddingBottom: () => 4,
            paddingLeft: () => 4,
            paddingRight: () => 4,
        };
    }
    async getLogoImage(logoKey) {
        if (!logoKey) {
            return null;
        }
        try {
            const signedUrl = await this.s3Service.getSignedUrl(logoKey, 900);
            const response = await fetch(signedUrl);
            if (!response.ok) {
                return null;
            }
            const contentType = response.headers.get('content-type') || 'image/png';
            const buffer = Buffer.from(await response.arrayBuffer());
            return `data:${contentType};base64,${buffer.toString('base64')}`;
        }
        catch (error) {
            this.logger.warn(`No se pudo cargar logo fiscal: ${error instanceof Error ? error.message : error}`);
            return null;
        }
    }
    renderPdf(printer, docDefinition) {
        return new Promise((resolve, reject) => {
            try {
                const pdfDoc = printer.createPdfKitDocument(docDefinition);
                const chunks = [];
                pdfDoc.on('data', (chunk) => chunks.push(chunk));
                pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
                pdfDoc.on('error', reject);
                pdfDoc.end();
            }
            catch (error) {
                reject(error);
            }
        });
    }
};
exports.ElectronicInvoicePdfService = ElectronicInvoicePdfService;
exports.ElectronicInvoicePdfService = ElectronicInvoicePdfService = ElectronicInvoicePdfService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(billing_branch_entity_1.BillingBranch)),
    __param(2, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(3, (0, typeorm_1.InjectRepository)(sales_order_entity_1.SalesOrder)),
    __metadata("design:paramtypes", [s3_service_1.S3Service,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ElectronicInvoicePdfService);
//# sourceMappingURL=electronic-invoice-pdf.service.js.map