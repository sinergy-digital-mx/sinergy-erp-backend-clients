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
exports.DivinoReservationFormatPdfService = void 0;
const common_1 = require("@nestjs/common");
const pdfmake_1 = __importDefault(require("pdfmake"));
const path = __importStar(require("path"));
const s3_service_1 = require("../../common/services/s3.service");
const divino_reservation_formats_constants_1 = require("./divino-reservation-formats.constants");
const COLORS = {
    primary: '#1F3A2E',
    accent: '#C9A24B',
    text: '#2C3E50',
    muted: '#7F8C8D',
    line: '#B7C2BB',
    light: '#F5F3EE',
};
const LEAD_SOURCE_LABELS = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    google: 'Google',
    restaurante: 'Restaurante',
    walkin: 'Walk-in',
    referido: 'Referido',
    otro: 'Otro',
};
let DivinoReservationFormatPdfService = class DivinoReservationFormatPdfService {
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
    async generate(format) {
        const logoImage = await this.getLogoImage(format);
        const razonSocial = format.payable_to ||
            format.fiscal_configuration?.razon_social ||
            divino_reservation_formats_constants_1.DIVINO_RESERVATION_BRAND.defaultPayableTo;
        const docDefinition = {
            pageSize: 'LETTER',
            pageMargins: [42, 36, 42, 44],
            defaultStyle: { font: 'Roboto', fontSize: 9, color: COLORS.text },
            content: [
                this.buildHeader(logoImage),
                this.buildTitle(format),
                this.buildIntro(format, razonSocial),
                this.buildPropertySection(format),
                this.buildPaymentPlan(format),
                this.buildLegalText(),
                this.buildBuyerSection(format),
                {
                    text: '- Favor de agregar una identificación con fotografía',
                    italics: true,
                    fontSize: 8,
                    color: COLORS.muted,
                    margin: [0, 5, 0, 5],
                },
                this.buildLeadSource(format),
                this.buildSignatures(format, razonSocial),
            ],
            footer: () => this.buildFooter(),
            styles: {
                sectionTitle: {
                    fontSize: 10,
                    bold: true,
                    color: COLORS.primary,
                    margin: [0, 6, 0, 4],
                },
            },
        };
        const printer = new pdfmake_1.default(this.fonts);
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        return new Promise((resolve, reject) => {
            const chunks = [];
            pdfDoc.on('data', (chunk) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', reject);
            pdfDoc.end();
        });
    }
    buildHeader(logoImage) {
        const brandStack = [];
        if (logoImage) {
            brandStack.push({ image: logoImage, fit: [140, 62] });
        }
        else {
            brandStack.push({
                text: divino_reservation_formats_constants_1.DIVINO_RESERVATION_BRAND.projectName.toUpperCase(),
                fontSize: 21,
                bold: true,
                color: COLORS.primary,
            });
        }
        return {
            columns: [
                { width: '*', stack: brandStack },
                {
                    width: 'auto',
                    stack: [
                        {
                            text: divino_reservation_formats_constants_1.DIVINO_RESERVATION_BRAND.address,
                            fontSize: 8,
                            color: COLORS.muted,
                            alignment: 'right',
                        },
                        {
                            text: divino_reservation_formats_constants_1.DIVINO_RESERVATION_BRAND.email,
                            fontSize: 8,
                            color: COLORS.muted,
                            alignment: 'right',
                        },
                        {
                            text: divino_reservation_formats_constants_1.DIVINO_RESERVATION_BRAND.phone,
                            fontSize: 8,
                            color: COLORS.muted,
                            alignment: 'right',
                        },
                    ],
                },
            ],
            margin: [0, 0, 0, 6],
        };
    }
    buildTitle(format) {
        return {
            table: {
                widths: ['*'],
                body: [
                    [
                        {
                            columns: [
                                {
                                    text: 'FORMATO DE RESERVACIÓN',
                                    fontSize: 13,
                                    bold: true,
                                    color: 'white',
                                },
                                {
                                    text: `Folio: ${format.folio}`,
                                    fontSize: 9,
                                    color: 'white',
                                    alignment: 'right',
                                    margin: [0, 3, 0, 0],
                                },
                            ],
                            fillColor: COLORS.primary,
                            margin: [10, 6, 10, 6],
                            border: [false, false, false, false],
                        },
                    ],
                ],
            },
            layout: {
                hLineWidth: () => 0,
                vLineWidth: () => 0,
            },
            margin: [0, 0, 0, 8],
        };
    }
    buildIntro(format, razonSocial) {
        return {
            text: [
                'Recibido de ',
                this.inlineValue(format.received_from),
                ' la suma de ',
                this.inlineValue(format.amount_in_words),
                '. Evidenciado por ',
                this.inlineValue(format.evidenced_by),
                `, pagadero a `,
                { text: razonSocial, bold: true },
                ` por la reservación de la propiedad descrita a continuación, en “${divino_reservation_formats_constants_1.DIVINO_RESERVATION_BRAND.projectName}” ubicado en el ${divino_reservation_formats_constants_1.DIVINO_RESERVATION_BRAND.projectLocation}.`,
            ],
            fontSize: 9,
            lineHeight: 1.25,
            alignment: 'justify',
            margin: [0, 0, 0, 8],
        };
    }
    buildPropertySection(format) {
        return {
            table: {
                widths: ['33%', '33%', '34%'],
                body: [
                    [
                        this.fieldCell('Manzana', format.block),
                        this.fieldCell('Número de Lote', format.lot_number),
                        this.fieldCell('Superficie', format.surface != null ? `${this.num(format.surface)} m²` : null),
                    ],
                    [
                        {
                            ...this.fieldCell('Precio de compra', this.money(format.purchase_price, format.currency)),
                            colSpan: 3,
                        },
                        {},
                        {},
                    ],
                ],
            },
            layout: this.cardLayout(),
            margin: [0, 0, 0, 6],
        };
    }
    buildPaymentPlan(format) {
        const maintenance = this.money(format.maintenance_fee, format.maintenance_currency);
        return {
            stack: [
                { text: 'Plan de pagos', style: 'sectionTitle' },
                {
                    table: {
                        widths: ['50%', '50%'],
                        body: [
                            [
                                this.fieldCell('Depósito de reserva', this.money(format.reservation_deposit, format.currency)),
                                this.fieldCell('Fecha de reserva', this.date(format.reservation_date)),
                            ],
                            [
                                this.fieldCell('Enganche', this.money(format.down_payment, format.currency)),
                                this.fieldCell('Fecha de pago de enganche', this.date(format.down_payment_date)),
                            ],
                            [
                                this.fieldCell('Saldo a financiar', this.money(format.financed_balance, format.currency)),
                                this.fieldCell('Años de financiamiento', format.financing_years != null
                                    ? String(format.financing_years)
                                    : null),
                            ],
                            [
                                this.fieldCell('Número de pagos mensuales', format.monthly_payments_count != null
                                    ? String(format.monthly_payments_count)
                                    : null),
                                this.fieldCell('Monto de pago mensual', this.money(format.monthly_payment_amount, format.currency)),
                            ],
                            [
                                this.fieldCell('Cuota de mantenimiento', `${maintenance} mensuales`),
                                this.fieldCell('Día de pago', this.paymentDayText(format)),
                            ],
                        ],
                    },
                    layout: this.cardLayout(),
                },
                {
                    text: 'La cuota de mantenimiento inicia el mes siguiente a la firma del contrato de compra-venta. Todos los pagos de enganches/mensualidades y cuotas de mantenimiento serán pagados directamente a la administración.',
                    fontSize: 7.5,
                    italics: true,
                    color: COLORS.muted,
                    lineHeight: 1.2,
                    margin: [0, 5, 0, 7],
                },
            ],
        };
    }
    buildLegalText() {
        return {
            text: 'La reserva de unidad y términos de compra descritos en este formato son válidos únicamente por 10 días a partir de la firma del mismo, está sujeto a cambios de los términos y condiciones posterior al periodo mencionado. El depósito de apartado es reembolsable antes de los 10 días. Devoluciones de pagos después de los 10 días tendrán un 10% de penalidad. Pueden aplicar cobro de comisiones bancarias dependiendo la forma de pago, los compradores deberán completar el pago y firmar el contrato de compraventa con el vendedor dentro del plazo establecido. El comprador abajo descrito ofrece y acepta comprar la propiedad mencionada anteriormente, así como los términos y condiciones establecidos y acusa de recibido una copia de estos.',
            fontSize: 7,
            color: COLORS.muted,
            alignment: 'justify',
            lineHeight: 1.2,
            margin: [0, 0, 0, 6],
        };
    }
    buildBuyerSection(format) {
        return {
            stack: [
                { text: 'Datos del comprador', style: 'sectionTitle' },
                {
                    table: {
                        widths: ['50%', '50%'],
                        body: [
                            [
                                this.fieldCell('Nombre del comprador', format.buyer_name),
                                this.fieldCell('Dirección', format.buyer_address),
                            ],
                            [
                                this.fieldCell('Teléfono', format.buyer_phone),
                                this.fieldCell('Correo electrónico', format.buyer_email),
                            ],
                        ],
                    },
                    layout: this.cardLayout(),
                },
            ],
        };
    }
    buildLeadSource(format) {
        const options = Object.keys(LEAD_SOURCE_LABELS);
        const marks = options.map((key) => {
            const selected = format.lead_source === key;
            const label = key === 'otro' && format.lead_source === 'otro' && format.lead_source_other
                ? `Otro: ${format.lead_source_other}`
                : LEAD_SOURCE_LABELS[key];
            return {
                text: `${selected ? '[X]' : '[  ]'} ${label}`,
                fontSize: 8.5,
                bold: selected,
                color: selected ? COLORS.primary : COLORS.text,
                margin: [0, 0, 8, 0],
            };
        });
        return {
            stack: [
                { text: '¿Cómo se enteró del proyecto?', style: 'sectionTitle' },
                { columns: marks, columnGap: 4, margin: [0, 2, 0, 4] },
            ],
        };
    }
    buildSignatures(format, razonSocial) {
        return {
            stack: [
                {
                    columns: [
                        this.signatureLine('Firma del comprador'),
                        this.signatureLine('Reconoce la recepción de fondos'),
                    ],
                    columnGap: 24,
                    margin: [0, 10, 0, 4],
                },
                {
                    text: razonSocial,
                    fontSize: 9,
                    bold: true,
                    color: COLORS.primary,
                    margin: [0, 6, 0, 8],
                },
                {
                    columns: [
                        this.fieldCell('Fecha', this.date(format.format_date)),
                        this.fieldCell('Agente', format.agent_name),
                    ],
                    columnGap: 24,
                },
            ],
        };
    }
    buildFooter() {
        return {
            margin: [38, 6, 38, 0],
            stack: [
                {
                    canvas: [
                        {
                            type: 'line',
                            x1: 0,
                            y1: 0,
                            x2: 528,
                            y2: 0,
                            lineWidth: 0.5,
                            lineColor: COLORS.line,
                        },
                    ],
                },
                {
                    columns: [
                        {
                            text: divino_reservation_formats_constants_1.DIVINO_RESERVATION_BRAND.website,
                            fontSize: 8,
                            bold: true,
                            color: COLORS.primary,
                        },
                        {
                            text: `${divino_reservation_formats_constants_1.DIVINO_RESERVATION_BRAND.facebook}    ${divino_reservation_formats_constants_1.DIVINO_RESERVATION_BRAND.instagram}`,
                            fontSize: 8,
                            color: COLORS.muted,
                            alignment: 'right',
                        },
                    ],
                    margin: [0, 4, 0, 0],
                },
            ],
        };
    }
    fieldCell(label, value) {
        return {
            stack: [
                { text: label.toUpperCase(), fontSize: 7, color: COLORS.muted },
                {
                    text: value && String(value).trim().length > 0 ? String(value) : '—',
                    fontSize: 9.5,
                    bold: true,
                    color: COLORS.text,
                    margin: [0, 3, 0, 0],
                },
            ],
            fillColor: COLORS.light,
        };
    }
    signatureLine(label) {
        return {
            width: '*',
            stack: [
                {
                    canvas: [
                        {
                            type: 'line',
                            x1: 0,
                            y1: 0,
                            x2: 230,
                            y2: 0,
                            lineWidth: 0.7,
                            lineColor: COLORS.line,
                        },
                    ],
                    margin: [0, 16, 0, 4],
                },
                { text: label, fontSize: 8.5, color: COLORS.muted, alignment: 'center' },
            ],
        };
    }
    inlineValue(value) {
        const text = value && String(value).trim().length > 0 ? String(value) : '________________________';
        return { text, bold: true, color: COLORS.text };
    }
    cardLayout() {
        return {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingLeft: () => 10,
            paddingRight: () => 10,
            paddingTop: () => 5,
            paddingBottom: () => 5,
            fillColor: (rowIndex, node, colIndex) => {
                return (rowIndex + colIndex) % 2 === 0 ? COLORS.light : '#EFEDE6';
            },
        };
    }
    paymentDayText(format) {
        if (format.payment_day === '1')
            return '1ro del mes';
        if (format.payment_day === '15')
            return '15 del mes';
        return null;
    }
    money(value, currency) {
        if (value == null)
            return null;
        const amount = Number(value);
        if (!Number.isFinite(amount))
            return null;
        const cur = (currency || 'MXN').toUpperCase();
        return `$${amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })} ${cur}`;
    }
    num(value) {
        const amount = Number(value);
        if (!Number.isFinite(amount))
            return '0.00';
        return amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }
    date(value) {
        if (!value)
            return null;
        const str = typeof value === 'string' ? value : value.toISOString();
        const datePart = str.split('T')[0];
        const [year, month, day] = datePart.split('-');
        if (!year || !month || !day)
            return null;
        return `${day}/${month}/${year}`;
    }
    async getLogoImage(format) {
        const logoKey = format.fiscal_configuration?.logo;
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
        catch {
            return null;
        }
    }
};
exports.DivinoReservationFormatPdfService = DivinoReservationFormatPdfService;
exports.DivinoReservationFormatPdfService = DivinoReservationFormatPdfService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [s3_service_1.S3Service])
], DivinoReservationFormatPdfService);
//# sourceMappingURL=divino-reservation-format-pdf.service.js.map