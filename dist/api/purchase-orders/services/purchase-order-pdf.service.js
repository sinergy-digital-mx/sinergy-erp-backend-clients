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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseOrderPdfService = void 0;
const common_1 = require("@nestjs/common");
const pdfmake_1 = __importDefault(require("pdfmake"));
const s3_service_1 = require("../../../common/services/s3.service");
const purchase_order_document_language_enum_1 = require("../../../entities/purchase-orders/purchase-order-document-language.enum");
const purchase_order_pdf_labels_1 = require("./purchase-order-pdf-labels");
const path = __importStar(require("path"));
const purchase_order_line_breakdown_util_1 = require("../utils/purchase-order-line-breakdown.util");
const inventory_measure_util_1 = require("../../inventory/utils/inventory-measure.util");
const COLORS = {
    primary: '#1E3A5F',
    primarySoft: '#E8EEF5',
    text: '#111827',
    muted: '#6B7280',
    label: '#4B5563',
    light: '#F3F4F6',
    lightAlt: '#FAFBFC',
    line: '#E5E7EB',
    white: '#FFFFFF',
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
    info: '#2563EB',
};
let PurchaseOrderPdfService = class PurchaseOrderPdfService {
    s3Service;
    fonts = {
        Roboto: {
            normal: path.join(process.cwd(), 'src/_public/fonts/Roboto-Regular.ttf'),
            bold: path.join(process.cwd(), 'src/_public/fonts/Roboto-Bold.ttf'),
            italics: path.join(process.cwd(), 'src/_public/fonts/Roboto-Italic.ttf'),
            bolditalics: path.join(process.cwd(), 'src/_public/fonts/Roboto-BoldItalic.ttf'),
        },
    };
    constructor(s3Service) {
        this.s3Service = s3Service;
    }
    async generatePdf(purchaseOrder, language = purchase_order_document_language_enum_1.PurchaseOrderDocumentLanguage.ES) {
        return this.buildDocument(purchaseOrder, language, 'original');
    }
    async generateRecepcionPdf(purchaseOrder, language = purchase_order_document_language_enum_1.PurchaseOrderDocumentLanguage.ES) {
        return this.buildDocument(purchaseOrder, language, 'reception');
    }
    async uploadPdfToS3(purchaseOrder, pdfBuffer, documentType = 'DOCUMENTO_ORIGINAL') {
        const safeDocumentType = documentType.replace(/\s+/g, '_').toUpperCase();
        const fileName = `${safeDocumentType}-${purchaseOrder.folio}.pdf`;
        const s3Key = await this.s3Service.uploadEntityFile(purchaseOrder.tenant_id, 'purchase_orders', purchaseOrder.id, safeDocumentType, pdfBuffer, fileName, 'application/pdf');
        const signedUrl = await this.s3Service.getSignedUrl(s3Key, 3600);
        return { s3Key, signedUrl };
    }
    async buildDocument(purchaseOrder, language, kind) {
        const printer = new pdfmake_1.default(this.fonts);
        const labels = (0, purchase_order_pdf_labels_1.getPurchaseOrderPdfLabels)(language);
        const logoImage = await this.getFiscalLogoImage(purchaseOrder);
        const subtitle = kind === 'original' ? labels.originalDocumentTitle : labels.receptionDocumentTitle;
        const totals = this.getTotals(purchaseOrder, kind);
        const currency = this.resolveCurrency(purchaseOrder);
        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [28, 28, 28, 40],
            content: [
                this.buildHeader(purchaseOrder, labels, logoImage, subtitle, currency),
                this.buildAccentLine(),
                this.buildMetaCards(purchaseOrder, labels, kind),
                this.buildPartyCards(purchaseOrder, labels),
                kind === 'original'
                    ? this.buildRequestedProducts(purchaseOrder, labels, currency)
                    : this.buildReceivedProducts(purchaseOrder, labels, currency),
                this.buildNotesAndTotals(purchaseOrder, labels, totals, currency),
            ],
            footer: (currentPage, pageCount) => ({
                columns: [
                    {
                        text: subtitle,
                        fontSize: 7,
                        color: COLORS.muted,
                    },
                    {
                        text: `${labels.pageLabel} ${currentPage} / ${pageCount}`,
                        fontSize: 7,
                        color: COLORS.muted,
                        alignment: 'right',
                    },
                ],
                margin: [28, 12, 28, 0],
            }),
            defaultStyle: {
                fontSize: 9,
                color: COLORS.text,
            },
        };
        return this.renderPdf(printer, docDefinition);
    }
    buildHeader(purchaseOrder, labels, logoImage, subtitle, currency) {
        return {
            columns: [
                {
                    width: '*',
                    stack: [
                        {
                            text: subtitle.toUpperCase(),
                            fontSize: 8,
                            bold: true,
                            color: COLORS.muted,
                            characterSpacing: 0.4,
                        },
                        {
                            text: labels.purchaseOrderTitle,
                            fontSize: 14,
                            bold: true,
                            color: COLORS.primary,
                            margin: [0, 3, 0, 0],
                        },
                        {
                            text: `${labels.folioPrefix}  ${purchaseOrder.folio}`,
                            fontSize: 10,
                            bold: true,
                            color: COLORS.label,
                            margin: [0, 4, 0, 0],
                        },
                        {
                            text: `${labels.currency}:  ${currency}`,
                            fontSize: 10,
                            bold: true,
                            color: COLORS.primary,
                            margin: [0, 2, 0, 0],
                        },
                    ],
                    margin: [0, 6, 0, 0],
                },
                {
                    width: 160,
                    ...(logoImage
                        ? {
                            image: logoImage,
                            fit: [150, 58],
                            alignment: 'right',
                        }
                        : { text: '' }),
                },
            ],
            margin: [0, 0, 0, 6],
        };
    }
    buildAccentLine() {
        return {
            canvas: [
                {
                    type: 'line',
                    x1: 0,
                    y1: 0,
                    x2: 539,
                    y2: 0,
                    lineWidth: 1.5,
                    lineColor: COLORS.primary,
                },
            ],
            margin: [0, 0, 0, 12],
        };
    }
    buildMetaCards(purchaseOrder, labels, kind) {
        const creatorName = [purchaseOrder.creator?.first_name, purchaseOrder.creator?.last_name]
            .filter(Boolean)
            .join(' ')
            .trim() || 'N/A';
        const createdAt = new Date(purchaseOrder.created_at).toLocaleDateString(labels.dateLocale);
        const expectedAt = new Date(purchaseOrder.expected_delivery_date).toLocaleDateString(labels.dateLocale);
        const status = (0, purchase_order_pdf_labels_1.translateGeneralStatus)(purchaseOrder.general_status, labels);
        const payment = (0, purchase_order_pdf_labels_1.translatePaymentStatus)(purchaseOrder.payment_status, labels);
        const cards = kind === 'original'
            ? [
                this.metaCell(labels.creationDate, createdAt),
                this.gapCell(),
                this.metaCell(labels.createdBy, creatorName),
                this.gapCell(),
                this.metaCell(labels.expectedDate, expectedAt),
                this.gapCell(),
                this.metaCell(labels.status, status, this.statusColor(purchaseOrder.general_status)),
                this.gapCell(),
                this.metaCell(labels.payment, payment, this.paymentColor(purchaseOrder.payment_status)),
                this.gapCell(),
                this.metaCell(labels.currency, this.resolveCurrency(purchaseOrder), COLORS.primary),
            ]
            : [
                this.metaCell(labels.creationDate, createdAt),
                this.gapCell(),
                this.metaCell(labels.createdBy, creatorName),
                this.gapCell(),
                this.metaCell(labels.expectedDate, expectedAt),
                this.gapCell(),
                this.metaCell(labels.receptionDate, new Date().toLocaleDateString(labels.dateLocale)),
                this.gapCell(),
                this.metaCell(labels.status, status, this.statusColor(purchaseOrder.general_status)),
                this.gapCell(),
                this.metaCell(labels.payment, payment, this.paymentColor(purchaseOrder.payment_status)),
            ];
        return {
            stack: [
                {
                    text: labels.summary.toUpperCase(),
                    fontSize: 8,
                    bold: true,
                    color: COLORS.muted,
                    margin: [0, 0, 0, 6],
                },
                {
                    table: {
                        widths: kind === 'original'
                            ? ['*', 6, '*', 6, '*', 6, '*', 6, '*', 6, '*']
                            : ['*', 6, '*', 6, '*', 6, '*', 6, '*', 6, '*'],
                        body: [cards],
                    },
                    layout: this.equalHeightLayout(),
                },
            ],
            margin: [0, 0, 0, 10],
        };
    }
    buildPartyCards(purchaseOrder, labels) {
        const vendorAddress = [purchaseOrder.vendor?.street, purchaseOrder.vendor?.city, purchaseOrder.vendor?.state]
            .filter(Boolean)
            .join(', ') || 'N/A';
        const warehouseLocation = `${purchaseOrder.warehouse?.city || 'N/A'}, ${purchaseOrder.warehouse?.state || 'N/A'}`;
        return {
            table: {
                widths: ['*', 8, '*'],
                body: [
                    [
                        this.partyCell(labels.vendor, [
                            {
                                text: purchaseOrder.vendor?.name || 'N/A',
                                fontSize: 10,
                                bold: true,
                                color: COLORS.text,
                                margin: [0, 0, 0, 3],
                            },
                            {
                                text: `${labels.rfcPrefix}: ${purchaseOrder.vendor?.rfc || 'N/A'}`,
                                fontSize: 8,
                                color: COLORS.muted,
                                margin: [0, 0, 0, 1],
                            },
                            {
                                text: `${labels.addressPrefix}: ${vendorAddress}`,
                                fontSize: 8,
                                color: COLORS.muted,
                            },
                        ]),
                        this.gapCell(),
                        this.partyCell(labels.destinationWarehouse, [
                            {
                                text: purchaseOrder.warehouse?.name || 'N/A',
                                fontSize: 10,
                                bold: true,
                                color: COLORS.text,
                                margin: [0, 0, 0, 3],
                            },
                            {
                                text: `${labels.branchPrefix}: ${purchaseOrder.warehouse?.billing_branch?.code || 'N/A'}`,
                                fontSize: 8,
                                color: COLORS.muted,
                                margin: [0, 0, 0, 1],
                            },
                            { text: warehouseLocation, fontSize: 8, color: COLORS.muted },
                        ]),
                    ],
                ],
            },
            layout: this.equalHeightLayout(),
            margin: [0, 0, 0, 14],
        };
    }
    buildRequestedProducts(purchaseOrder, labels, currency) {
        const lineItems = purchaseOrder.line_items || [];
        const tableBody = [
            [
                { text: labels.product, ...this.thCell('left') },
                { text: labels.requestedQty, ...this.thCell('center') },
                { text: labels.unitPrice, ...this.thCell('right') },
                { text: labels.lineAmount, ...this.thCell('right') },
                { text: labels.vat, ...this.thCell('right') },
                { text: labels.total, ...this.thCell('right') },
            ],
        ];
        for (const item of lineItems) {
            const quantity = Number(item.quantity) || 0;
            const unitPrice = Number(item.unit_total) || 0;
            const requestedUom = item.product_uom?.uom?.name || 'UOM';
            const breakdown = (0, purchase_order_line_breakdown_util_1.computeRequestedLineBreakdown)(quantity, unitPrice, Number(item.iva_percentage || 0), Number(item.ieps_percentage || 0));
            const lineSubtotal = Number(item.line_subtotal) || breakdown.line_subtotal;
            const lineIva = Number(item.line_iva) || breakdown.line_iva;
            const lineTotal = Number(item.line_total) || breakdown.line_total;
            tableBody.push([
                {
                    stack: [
                        { text: item.product?.name || 'N/A', fontSize: 9, bold: true, color: COLORS.text },
                        {
                            text: `${labels.unitPrefix}: ${requestedUom}`,
                            fontSize: 7.5,
                            color: COLORS.muted,
                            margin: [0, 1, 0, 0],
                        },
                    ],
                },
                { text: `${quantity} ${requestedUom}`, fontSize: 8.5, alignment: 'center', color: COLORS.text },
                { text: this.formatCurrency(unitPrice, currency, 4), fontSize: 8, alignment: 'right', color: COLORS.text },
                { text: this.formatCurrency(lineSubtotal, currency), fontSize: 8, alignment: 'right', color: COLORS.text },
                { text: this.formatCurrency(lineIva, currency), fontSize: 8, alignment: 'right', color: COLORS.text },
                {
                    text: this.formatCurrency(lineTotal, currency),
                    fontSize: 8.5,
                    alignment: 'right',
                    bold: true,
                    color: COLORS.text,
                },
            ]);
        }
        return this.productsTable(labels.requestedProductsDetail, ['*', 78, 78, 86, 78, 92], tableBody);
    }
    buildReceivedProducts(purchaseOrder, labels, currency) {
        const lineItems = purchaseOrder.line_items || [];
        const batches = purchaseOrder.batches || [];
        const batchesByLineItem = new Map();
        for (const batch of batches) {
            const lineItemId = batch.purchase_order_detail_id;
            if (!lineItemId)
                continue;
            if (!batchesByLineItem.has(lineItemId)) {
                batchesByLineItem.set(lineItemId, []);
            }
            batchesByLineItem.get(lineItemId)?.push(batch);
        }
        const tableBody = [
            [
                { text: labels.product, ...this.thCell('left') },
                { text: labels.receivedBatches, ...this.thCell('left') },
                { text: labels.receivedQty, ...this.thCell('center') },
                { text: labels.unitPrice, ...this.thCell('right') },
                { text: labels.vat, ...this.thCell('right') },
                { text: labels.total, ...this.thCell('right') },
            ],
        ];
        for (const item of lineItems) {
            const quantity = Number(item.received_original_quantity) || 0;
            const unitPrice = Number(item.received_original_unit_total) || 0;
            const receivedBreakdown = (0, purchase_order_line_breakdown_util_1.computeReceivedLineBreakdown)(quantity, unitPrice, Number(item.received_original_iva_percentage || 0), Number(item.received_original_ieps_percentage || 0));
            const lineIva = Number(item.received_line_iva) || receivedBreakdown.received_line_iva;
            const lineTotal = Number(item.received_line_total) || receivedBreakdown.received_line_total;
            const itemBatches = batchesByLineItem.get(item.id) || [];
            const lotText = itemBatches.length
                ? itemBatches
                    .map((batch, index) => {
                    const lotIdentifier = batch.source_tag_identifier || batch.batch_number || labels.noTag;
                    const lotQty = Number(batch.initial_quantity) || 0;
                    const lotUom = batch.uom?.name || item.converted_uom?.name || 'UOM';
                    const lotMeasure = (0, inventory_measure_util_1.formatMeasureLabel)(batch.measure, batch.measure_uom?.name);
                    const measureText = lotMeasure
                        ? `, ${labels.measurePrefix} ${lotMeasure}`
                        : '';
                    return `${index + 1}. ${lotIdentifier} (${lotQty} ${lotUom}${measureText})`;
                })
                    .join('\n')
                : labels.noBatchesRegistered;
            const lotModeLabel = itemBatches.length > 1 ? 'MULTI' : 'SINGLE';
            const receivedUom = item.received_uom?.name || item.product_uom?.uom?.name || 'UOM';
            tableBody.push([
                {
                    stack: [
                        { text: item.product?.name || 'N/A', fontSize: 9, bold: true, color: COLORS.text },
                        {
                            text: `${labels.modePrefix}: ${lotModeLabel}`,
                            fontSize: 7.5,
                            color: COLORS.muted,
                            margin: [0, 1, 0, 0],
                        },
                    ],
                },
                { text: lotText, fontSize: 8, color: COLORS.text },
                { text: `${quantity} ${receivedUom}`, fontSize: 9, alignment: 'center', color: COLORS.text },
                { text: this.formatCurrency(unitPrice, currency, 4), fontSize: 8, alignment: 'right', color: COLORS.text },
                { text: this.formatCurrency(lineIva, currency), fontSize: 8, alignment: 'right', color: COLORS.text },
                {
                    text: this.formatCurrency(lineTotal, currency),
                    fontSize: 8.5,
                    alignment: 'right',
                    bold: true,
                    color: COLORS.text,
                },
            ]);
        }
        return this.productsTable(labels.receivedProductsDetail, ['*', 120, 70, 78, 78, 92], tableBody);
    }
    productsTable(title, widths, body) {
        return {
            stack: [
                {
                    text: title.toUpperCase(),
                    fontSize: 8,
                    bold: true,
                    color: COLORS.muted,
                    margin: [0, 0, 0, 6],
                },
                {
                    table: {
                        headerRows: 1,
                        widths,
                        body,
                    },
                    layout: {
                        fillColor: (rowIndex) => {
                            if (rowIndex === 0)
                                return COLORS.primarySoft;
                            return rowIndex % 2 === 0 ? COLORS.lightAlt : COLORS.white;
                        },
                        hLineWidth: () => 0.4,
                        vLineWidth: () => 0,
                        hLineColor: () => COLORS.line,
                        paddingTop: () => 6,
                        paddingBottom: () => 6,
                        paddingLeft: () => 8,
                        paddingRight: () => 8,
                    },
                },
            ],
            margin: [0, 0, 0, 12],
        };
    }
    buildNotesAndTotals(purchaseOrder, labels, totals, currency) {
        const notesText = purchaseOrder.notes?.trim();
        return {
            table: {
                widths: ['*', 228],
                body: [
                    [
                        {
                            stack: [
                                {
                                    text: labels.notesPrefix.toUpperCase(),
                                    fontSize: 8,
                                    bold: true,
                                    color: COLORS.muted,
                                    margin: [0, 0, 0, 6],
                                },
                                {
                                    text: notesText || labels.notesEmpty,
                                    fontSize: 9,
                                    color: notesText ? COLORS.text : COLORS.muted,
                                    italics: !notesText,
                                },
                            ],
                            fillColor: COLORS.light,
                            border: [false, false, false, false],
                            margin: [14, 14, 16, 14],
                        },
                        {
                            stack: [this.buildTotalsTable(labels, totals, currency)],
                            fillColor: COLORS.light,
                            border: [false, false, false, false],
                            margin: [10, 12, 12, 12],
                        },
                    ],
                ],
            },
            layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
            margin: [0, 0, 0, 0],
        };
    }
    buildTotalsTable(labels, totals, currency) {
        return {
            table: {
                widths: ['*', 108],
                body: [
                    this.totalRow(labels.subtotal, totals.subtotal, currency),
                    this.totalRow(labels.vat, totals.iva, currency),
                    this.totalRow(labels.ieps, totals.ieps, currency),
                    this.totalRow(`${labels.totalLabel} (${currency})`, totals.total, currency, true),
                ],
            },
            layout: {
                hLineWidth: (i, node) => (i === node.table.body.length - 1 ? 0 : 0),
                vLineWidth: () => 0,
                paddingTop: (i, node) => (i === node.table.body.length - 1 ? 7 : 4),
                paddingBottom: (i, node) => (i === node.table.body.length - 1 ? 7 : 4),
                paddingLeft: () => 8,
                paddingRight: () => 8,
            },
        };
    }
    totalRow(label, amount, currency, strong = false) {
        if (strong) {
            return [
                {
                    text: label,
                    fontSize: 10,
                    bold: true,
                    color: COLORS.primary,
                    fillColor: COLORS.primarySoft,
                },
                {
                    text: this.formatCurrency(amount, currency),
                    fontSize: 10,
                    bold: true,
                    color: COLORS.primary,
                    fillColor: COLORS.primarySoft,
                    alignment: 'right',
                },
            ];
        }
        return [
            { text: label, fontSize: 8.5, color: COLORS.muted },
            {
                text: this.formatCurrency(amount, currency),
                fontSize: 8.5,
                color: COLORS.text,
                alignment: 'right',
                bold: true,
            },
        ];
    }
    metaCell(label, value, valueColor = COLORS.text) {
        return {
            stack: [
                {
                    text: label.toUpperCase(),
                    fontSize: 6.5,
                    bold: true,
                    color: COLORS.muted,
                    margin: [0, 0, 0, 4],
                },
                { text: value, fontSize: 8, bold: true, color: valueColor },
            ],
            fillColor: COLORS.light,
            margin: [8, 8, 8, 8],
        };
    }
    partyCell(title, content) {
        return {
            stack: [
                {
                    text: title.toUpperCase(),
                    fontSize: 7,
                    bold: true,
                    color: COLORS.muted,
                    margin: [0, 0, 0, 6],
                },
                ...content,
            ],
            fillColor: COLORS.light,
            margin: [10, 10, 10, 10],
        };
    }
    gapCell() {
        return { text: '', fillColor: COLORS.white };
    }
    equalHeightLayout() {
        return {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingLeft: () => 0,
            paddingRight: () => 0,
            paddingTop: () => 0,
            paddingBottom: () => 0,
        };
    }
    thCell(alignment) {
        return {
            fontSize: 7.5,
            bold: true,
            color: COLORS.primary,
            alignment,
        };
    }
    getTotals(purchaseOrder, kind) {
        if (kind === 'reception') {
            return {
                subtotal: Number(purchaseOrder.received_subtotal) || 0,
                iva: Number(purchaseOrder.received_iva_total) || 0,
                ieps: Number(purchaseOrder.received_ieps_total) || 0,
                total: Number(purchaseOrder.received_total) || 0,
            };
        }
        return {
            subtotal: Number(purchaseOrder.requested_subtotal) || 0,
            iva: Number(purchaseOrder.requested_iva_total) || 0,
            ieps: Number(purchaseOrder.requested_ieps_total) || 0,
            total: Number(purchaseOrder.requested_total) || 0,
        };
    }
    statusColor(status) {
        switch (status) {
            case 'Recibida':
                return COLORS.success;
            case 'Cancelada':
                return COLORS.danger;
            default:
                return COLORS.info;
        }
    }
    paymentColor(status) {
        return status === 'Pagado' ? COLORS.success : COLORS.warning;
    }
    resolveCurrency(purchaseOrder) {
        const value = String(purchaseOrder.payment_currency || 'MXN').trim().toUpperCase();
        return value === 'USD' ? 'USD' : 'MXN';
    }
    formatCurrency(amount, currency, maximumFractionDigits = 2) {
        const formatted = amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits,
        });
        return `$${formatted} ${currency}`;
    }
    async getFiscalLogoImage(purchaseOrder) {
        const logoKey = purchaseOrder.fiscal_configuration?.logo;
        if (!logoKey)
            return null;
        try {
            const signedUrl = await this.s3Service.getSignedUrl(logoKey, 900);
            const response = await fetch(signedUrl);
            if (!response.ok)
                return null;
            const contentType = response.headers.get('content-type') || 'image/png';
            const buffer = Buffer.from(await response.arrayBuffer());
            return `data:${contentType};base64,${buffer.toString('base64')}`;
        }
        catch {
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
exports.PurchaseOrderPdfService = PurchaseOrderPdfService;
exports.PurchaseOrderPdfService = PurchaseOrderPdfService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [s3_service_1.S3Service])
], PurchaseOrderPdfService);
//# sourceMappingURL=purchase-order-pdf.service.js.map