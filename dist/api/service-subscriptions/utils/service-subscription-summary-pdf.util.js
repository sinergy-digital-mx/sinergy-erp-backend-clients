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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderSubscriptionSummaryPdf = renderSubscriptionSummaryPdf;
const path = __importStar(require("path"));
const pdfmake_1 = __importDefault(require("pdfmake"));
const fonts = {
    Roboto: {
        normal: path.join(process.cwd(), 'src/_public/fonts/Roboto-Regular.ttf'),
        bold: path.join(process.cwd(), 'src/_public/fonts/Roboto-Bold.ttf'),
        italics: path.join(process.cwd(), 'src/_public/fonts/Roboto-Italic.ttf'),
        bolditalics: path.join(process.cwd(), 'src/_public/fonts/Roboto-BoldItalic.ttf'),
    },
};
const ink = '#0f172a';
const muted = '#64748b';
const line = '#e2e8f0';
const indigo = '#4f46e5';
function money(value) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
}
function paymentLabel(paid) {
    if (paid == null)
        return { text: 'Sin orden', color: '#475569', fill: '#f1f5f9' };
    if (paid)
        return { text: 'Pagado', color: '#047857', fill: '#ecfdf5' };
    return { text: 'Pendiente', color: '#b45309', fill: '#fffbeb' };
}
function factRow(label, value) {
    return [
        { text: label, color: muted, fontSize: 8, margin: [0, 3, 8, 3] },
        { text: value || '—', color: ink, bold: true, fontSize: 9, margin: [0, 3, 0, 3] },
    ];
}
function monthCard(month) {
    const pay = paymentLabel(month.paid);
    const facts = month.invoiceUuid
        ? [
            factRow('Folio', month.invoiceFolio || '—'),
            factRow('UUID', month.invoiceUuid),
            factRow('Timbrado', month.stampStatus || '—'),
            factRow('SAT', month.satStatus || '—'),
            factRow('Fecha', month.stampedAt || '—'),
            factRow('Total CFDI', month.invoiceTotal == null ? '—' : money(month.invoiceTotal)),
        ]
        : [[{ text: 'Sin factura timbrada', colSpan: 2, color: muted, fontSize: 9, margin: [0, 4, 0, 4] }, {}]];
    return {
        table: {
            widths: [4, '*'],
            body: [
                [
                    { text: '', fillColor: indigo, border: [false, false, false, false] },
                    {
                        border: [false, false, false, false],
                        fillColor: '#ffffff',
                        margin: [10, 10, 12, 4],
                        stack: [
                            {
                                columns: [
                                    { text: month.label, bold: true, fontSize: 13, color: ink },
                                    { text: money(month.amount), bold: true, fontSize: 13, color: ink, alignment: 'right' },
                                ],
                            },
                            {
                                columns: [
                                    {
                                        width: 'auto',
                                        table: {
                                            body: [[
                                                    {
                                                        text: pay.text,
                                                        color: pay.color,
                                                        fillColor: pay.fill,
                                                        bold: true,
                                                        fontSize: 8,
                                                        margin: [6, 2, 6, 2],
                                                    },
                                                ]],
                                        },
                                        layout: 'noBorders',
                                        margin: [0, 6, 8, 0],
                                    },
                                    {
                                        text: `Orden ${month.orderFolio || '—'}`,
                                        color: '#475569',
                                        fontSize: 9,
                                        margin: [0, 8, 0, 0],
                                    },
                                ],
                            },
                        ],
                    },
                ],
                [
                    { text: '', fillColor: indigo, border: [false, false, false, false] },
                    {
                        border: [false, false, false, false],
                        fillColor: '#f8fafc',
                        margin: [10, 2, 12, 8],
                        table: {
                            widths: [72, '*'],
                            body: facts,
                        },
                        layout: 'noBorders',
                    },
                ],
            ],
        },
        layout: {
            hLineWidth: () => 0.6,
            vLineWidth: () => 0.6,
            hLineColor: () => line,
            vLineColor: () => line,
            paddingLeft: () => 0,
            paddingRight: () => 0,
            paddingTop: () => 0,
            paddingBottom: () => 0,
        },
        margin: [0, 0, 0, 10],
    };
}
function stat(label, value) {
    return {
        stack: [
            { text: label, fontSize: 8, color: muted, margin: [0, 0, 0, 2] },
            { text: value, fontSize: 10, bold: true, color: ink },
        ],
        fillColor: '#f8fafc',
        margin: [8, 8, 8, 8],
    };
}
function renderSubscriptionSummaryPdf(input) {
    const invoiced = input.months.filter((month) => month.invoiceFolio || month.invoiceUuid).length;
    const paid = input.months.filter((month) => month.paid).length;
    const printer = new pdfmake_1.default(fonts);
    const doc = {
        pageSize: 'A4',
        pageMargins: [36, 36, 36, 42],
        footer: (current, total) => ({
            text: `Resumen de servicio  ·  ${current} / ${total}`,
            alignment: 'center',
            color: '#94a3b8',
            fontSize: 8,
            margin: [0, 8, 0, 0],
        }),
        content: [
            {
                table: {
                    widths: ['*'],
                    body: [[
                            {
                                stack: [
                                    { text: 'RESUMEN DE SERVICIO', color: '#c7d2fe', fontSize: 8, bold: true, characterSpacing: 1.2 },
                                    { text: input.title, color: '#ffffff', fontSize: 18, bold: true, margin: [0, 6, 0, 2] },
                                    { text: input.customerName, color: '#e0e7ff', fontSize: 11 },
                                ],
                                fillColor: '#312e81',
                                margin: [16, 16, 16, 16],
                            },
                        ]],
                },
                layout: 'noBorders',
                margin: [0, 0, 0, 14],
            },
            {
                table: {
                    widths: ['*', '*'],
                    body: [
                        [stat('Vigencia', `${input.startLabel} — ${input.endLabel}`), stat('Mensualidad', `${money(input.monthlyAmount)} + ${input.ivaPercentage}% IVA`)],
                        [stat('Emisor', input.issuerRfc ? `${input.issuerName}\n${input.issuerRfc}` : input.issuerName), stat('Periodos', `${input.months.length} meses · ${invoiced} con factura · ${paid} pagados`)],
                    ],
                },
                layout: {
                    hLineWidth: () => 6,
                    vLineWidth: () => 6,
                    hLineColor: () => '#ffffff',
                    vLineColor: () => '#ffffff',
                },
                margin: [0, 0, 0, 8],
            },
            { text: 'Meses', bold: true, fontSize: 12, color: ink, margin: [0, 8, 0, 8] },
            ...input.months.map((month) => monthCard(month)),
        ],
        defaultStyle: { font: 'Roboto', fontSize: 10, color: ink },
    };
    return new Promise((resolve, reject) => {
        try {
            const pdfDoc = printer.createPdfKitDocument(doc);
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
//# sourceMappingURL=service-subscription-summary-pdf.util.js.map