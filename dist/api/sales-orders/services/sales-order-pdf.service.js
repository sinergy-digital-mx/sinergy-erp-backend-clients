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
exports.SalesOrderPdfService = void 0;
const common_1 = require("@nestjs/common");
const pdfmake_1 = __importDefault(require("pdfmake"));
const path = __importStar(require("path"));
const s3_service_1 = require("../../../common/services/s3.service");
const document_language_enum_1 = require("../../../common/enums/document-language.enum");
const sales_order_pdf_labels_1 = require("./sales-order-pdf-labels");
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
let SalesOrderPdfService = class SalesOrderPdfService {
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
    async generatePdf(salesOrder, language = document_language_enum_1.DocumentLanguage.ES, options) {
        return this.buildDocument(salesOrder, language, 'original', options);
    }
    async generateDeliveryPdf(salesOrder, language = document_language_enum_1.DocumentLanguage.ES) {
        return this.buildDocument(salesOrder, language, 'delivery');
    }
    async buildDocument(salesOrder, language, kind, options) {
        const printer = new pdfmake_1.default(this.fonts);
        const labels = (0, sales_order_pdf_labels_1.getSalesOrderPdfLabels)(language);
        const logoImage = await this.getFiscalLogoImage(salesOrder);
        const subtitle = options?.subtitle ??
            (kind === 'original' ? labels.originalDocumentTitle : labels.deliveryDocumentTitle);
        const title = options?.title ??
            (kind === 'original' ? labels.salesOrderTitle : labels.deliveryTitle);
        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [28, 28, 28, 40],
            content: [
                this.buildHeader(salesOrder, labels, logoImage, subtitle, title),
                this.buildAccentLine(),
                this.buildMetaCards(salesOrder, labels, options?.hidePayment === true),
                this.buildPartyCards(salesOrder, labels),
                this.buildProductsSection(salesOrder, labels),
                this.buildNotesAndTotals(salesOrder, labels),
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
    async uploadPdfToS3(salesOrder, pdfBuffer, documentType = 'DOCUMENTO_ORIGINAL', entityFolder = 'sales_orders') {
        const safeDocumentType = documentType.replace(/\s+/g, '_').toUpperCase();
        const fileName = `${safeDocumentType}-${salesOrder.folio}.pdf`;
        const s3Key = await this.s3Service.uploadEntityFile(salesOrder.tenant_id, entityFolder, salesOrder.id, safeDocumentType, pdfBuffer, fileName, 'application/pdf');
        const signedUrl = await this.s3Service.getSignedUrl(s3Key, 3600);
        return { s3Key, signedUrl };
    }
    buildHeader(salesOrder, labels, logoImage, subtitle, title) {
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
                            text: title,
                            fontSize: 14,
                            bold: true,
                            color: COLORS.primary,
                            margin: [0, 3, 0, 0],
                        },
                        {
                            text: `${labels.folioPrefix}  ${salesOrder.folio}`,
                            fontSize: 10,
                            bold: true,
                            color: COLORS.label,
                            margin: [0, 4, 0, 0],
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
    buildMetaCards(salesOrder, labels, hidePayment = false) {
        const creatorName = [salesOrder.creator?.first_name, salesOrder.creator?.last_name]
            .filter(Boolean)
            .join(' ')
            .trim() || 'N/A';
        const createdAt = new Date(salesOrder.created_at).toLocaleDateString(labels.dateLocale);
        const expectedAt = new Date(salesOrder.expected_delivery_date).toLocaleDateString(labels.dateLocale);
        const status = (0, sales_order_pdf_labels_1.translateGeneralStatus)(salesOrder.general_status, labels);
        const payment = (0, sales_order_pdf_labels_1.translatePaymentStatus)(salesOrder.payment_status, labels);
        const cells = [
            this.metaCell(labels.creationDate, createdAt),
            this.gapCell(),
            this.metaCell(labels.createdBy, creatorName),
            this.gapCell(),
            this.metaCell(labels.expectedDate, expectedAt),
            this.gapCell(),
            this.metaCell(labels.status, status, this.statusColor(salesOrder.general_status)),
        ];
        const widths = ['*', 6, '*', 6, '*', 6, '*'];
        if (!hidePayment) {
            cells.push(this.gapCell(), this.metaCell(labels.payment, payment, this.paymentColor(salesOrder.payment_status)));
            widths.push(6, '*');
        }
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
                        widths,
                        body: [cells],
                    },
                    layout: this.equalHeightLayout(),
                },
            ],
            margin: [0, 0, 0, 10],
        };
    }
    buildPartyCards(salesOrder, labels) {
        const customerName = this.formatCustomerName(salesOrder);
        const locationTitle = salesOrder.warehouse ? labels.sourceWarehouse : labels.branchPrefix;
        return {
            table: {
                widths: ['*', 8, '*'],
                body: [
                    [
                        this.partyCell(labels.customer, [
                            { text: customerName, fontSize: 10, bold: true, color: COLORS.text, margin: [0, 0, 0, 3] },
                            {
                                text: `${labels.emailPrefix}: ${salesOrder.customer?.email || 'N/A'}`,
                                fontSize: 8,
                                color: COLORS.muted,
                                margin: [0, 0, 0, 1],
                            },
                            {
                                text: `${labels.phonePrefix}: ${salesOrder.customer?.phone || 'N/A'}`,
                                fontSize: 8,
                                color: COLORS.muted,
                            },
                        ]),
                        this.gapCell(),
                        this.partyCell(locationTitle, this.buildLocationStack(salesOrder, labels)),
                    ],
                ],
            },
            layout: this.equalHeightLayout(),
            margin: [0, 0, 0, 14],
        };
    }
    buildLocationStack(salesOrder, labels) {
        const branch = salesOrder.billing_branch ?? salesOrder.warehouse?.billing_branch ?? null;
        const branchCode = branch?.code || 'N/A';
        const city = branch?.city || salesOrder.warehouse?.city;
        const state = branch?.state || salesOrder.warehouse?.state;
        const location = [city, state].filter(Boolean).join(', ') || 'N/A';
        if (salesOrder.warehouse) {
            return [
                { text: salesOrder.warehouse.name, fontSize: 10, bold: true, color: COLORS.text, margin: [0, 0, 0, 3] },
                {
                    text: `${labels.branchPrefix}: ${branchCode}`,
                    fontSize: 8,
                    color: COLORS.muted,
                    margin: [0, 0, 0, 1],
                },
                { text: location, fontSize: 8, color: COLORS.muted },
            ];
        }
        return [
            { text: branchCode, fontSize: 10, bold: true, color: COLORS.text, margin: [0, 0, 0, 3] },
            { text: location, fontSize: 8, color: COLORS.muted },
        ];
    }
    buildProductsSection(salesOrder, labels) {
        const lineItems = salesOrder.line_items || [];
        const tableBody = [
            [
                { text: labels.product, ...this.thCell('left') },
                { text: labels.quantity, ...this.thCell('center') },
                { text: labels.unitPrice, ...this.thCell('right') },
                { text: labels.discount, ...this.thCell('center') },
                { text: labels.total, ...this.thCell('right') },
            ],
        ];
        for (const item of lineItems) {
            const quantity = Number(item.quantity) || 0;
            const unitPrice = Number(item.unit_price) || 0;
            const lineSubtotal = quantity * unitPrice;
            const discountPct = Number(item.discount_percentage) || 0;
            const lineDiscount = (lineSubtotal * discountPct) / 100;
            const lineTotal = lineSubtotal - lineDiscount;
            const uomName = item.product_uom?.uom?.name || 'UOM';
            tableBody.push([
                {
                    stack: [
                        { text: item.product?.name || 'N/A', fontSize: 9, bold: true, color: COLORS.text },
                        {
                            text: `${labels.unitPrefix}: ${uomName}`,
                            fontSize: 7.5,
                            color: COLORS.muted,
                            margin: [0, 1, 0, 0],
                        },
                    ],
                },
                { text: `${quantity} ${uomName}`, fontSize: 9, alignment: 'center', color: COLORS.text },
                { text: this.formatUnitCurrency(unitPrice), fontSize: 9, alignment: 'right', color: COLORS.text },
                { text: `${discountPct}%`, fontSize: 9, alignment: 'center', color: COLORS.text },
                {
                    text: this.formatCurrency(lineTotal),
                    fontSize: 9,
                    alignment: 'right',
                    bold: true,
                    color: COLORS.text,
                },
            ]);
        }
        return {
            stack: [
                {
                    text: labels.productsDetail.toUpperCase(),
                    fontSize: 8,
                    bold: true,
                    color: COLORS.muted,
                    margin: [0, 0, 0, 6],
                },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 78, 78, 58, 78],
                        body: tableBody,
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
    buildNotesAndTotals(salesOrder, labels) {
        const notesText = salesOrder.notes?.trim();
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
                            stack: [this.buildTotalsTable(salesOrder, labels)],
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
    buildTotalsTable(salesOrder, labels) {
        const lineDiscountTotal = Number(salesOrder.discount_total) || 0;
        const globalDiscountAmount = Number(salesOrder.global_discount_amount) || 0;
        const rows = [this.totalRow(labels.subtotal, Number(salesOrder.subtotal) || 0)];
        if (lineDiscountTotal > 0) {
            rows.push(this.totalRow(labels.lineDiscountTotal, lineDiscountTotal));
        }
        if (globalDiscountAmount > 0) {
            rows.push(this.totalRow(labels.globalDiscountTotal, globalDiscountAmount));
        }
        if (lineDiscountTotal <= 0 && globalDiscountAmount <= 0) {
            rows.push(this.totalRow(labels.discountTotal, 0));
        }
        rows.push(this.totalRow(labels.vat, Number(salesOrder.iva_total) || 0), this.totalRow(labels.ieps, Number(salesOrder.ieps_total) || 0), this.totalRow(labels.totalLabel, Number(salesOrder.total) || 0, true));
        return {
            table: {
                widths: ['*', 82],
                body: rows,
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
    totalRow(label, amount, strong = false) {
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
                    text: this.formatCurrency(amount),
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
                text: this.formatCurrency(amount),
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
    statusColor(status) {
        switch (status) {
            case 'Surtida':
            case 'Lista para entrega':
            case 'Convertida':
                return COLORS.success;
            case 'Cancelada':
                return COLORS.danger;
            case 'En Selección':
            case 'En camino':
                return COLORS.warning;
            default:
                return COLORS.info;
        }
    }
    paymentColor(status) {
        return status === 'Pagado' ? COLORS.success : COLORS.warning;
    }
    formatCustomerName(salesOrder) {
        const customer = salesOrder.customer;
        if (!customer)
            return 'N/A';
        if (customer.company_name)
            return customer.company_name;
        return [customer.name, customer.lastname].filter(Boolean).join(' ').trim() || 'N/A';
    }
    formatCurrency(amount) {
        return ('$' +
            amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }
    formatUnitCurrency(amount) {
        return ('$' +
            amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }));
    }
    async getFiscalLogoImage(salesOrder) {
        const logoKey = salesOrder.fiscal_configuration?.logo;
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
exports.SalesOrderPdfService = SalesOrderPdfService;
exports.SalesOrderPdfService = SalesOrderPdfService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [s3_service_1.S3Service])
], SalesOrderPdfService);
//# sourceMappingURL=sales-order-pdf.service.js.map