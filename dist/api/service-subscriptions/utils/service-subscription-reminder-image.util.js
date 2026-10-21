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
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPaymentReminderSvg = buildPaymentReminderSvg;
exports.renderPaymentReminderImage = renderPaymentReminderImage;
exports.buildPaymentReminderCaption = buildPaymentReminderCaption;
const path = __importStar(require("path"));
const WIDTH = 1000;
const MARGIN = 32;
const INK = '#0f172a';
const MUTED = '#64748b';
const LINE = '#e2e8f0';
const INDIGO = '#4f46e5';
function money(value) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
}
function escapeXml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function clip(value, max) {
    return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
function badge(paid) {
    if (paid == null)
        return { text: 'Sin orden', color: '#475569', fill: '#f1f5f9' };
    if (paid)
        return { text: 'Pagado', color: '#047857', fill: '#ecfdf5' };
    return { text: 'Pendiente de pago', color: '#b45309', fill: '#fffbeb' };
}
function buildPaymentReminderSvg(input) {
    const { month } = input;
    const pay = badge(month.paid);
    const facts = month.invoiceUuid
        ? [
            ['Folio', month.invoiceFolio || '—'],
            ['UUID', month.invoiceUuid],
            ['Timbrado', month.stampStatus || '—'],
            ['SAT', month.satStatus || '—'],
            ['Fecha', month.stampedAt || '—'],
            ['Total CFDI', month.invoiceTotal == null ? '—' : money(month.invoiceTotal)],
        ]
        : [['Factura', 'Sin factura timbrada']];
    const innerX = MARGIN;
    const innerW = WIDTH - MARGIN * 2;
    const headerH = 190;
    const headerY = MARGIN;
    const cardY = headerY + headerH + 24;
    const topH = 150;
    const rowH = 54;
    const factsH = facts.length * rowH + 28;
    const cardH = topH + factsH;
    const footerY = cardY + cardH + 28;
    const footerH = 118;
    const height = footerY + footerH + MARGIN;
    const parts = [];
    parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" font-family="Roboto">`);
    parts.push(`<rect width="${WIDTH}" height="${height}" fill="#f1f5f9"/>`);
    parts.push(`<rect x="${innerX}" y="${headerY}" width="${innerW}" height="${headerH}" rx="24" fill="#312e81"/>`);
    parts.push(`<text x="${innerX + 40}" y="${headerY + 56}" font-size="22" font-weight="bold" fill="#c7d2fe" letter-spacing="3">RECORDATORIO DE PAGO</text>`);
    parts.push(`<text x="${innerX + 40}" y="${headerY + 114}" font-size="42" font-weight="bold" fill="#ffffff">${escapeXml(clip(input.title, 34))}</text>`);
    parts.push(`<text x="${innerX + 40}" y="${headerY + 156}" font-size="28" fill="#e0e7ff">${escapeXml(clip(input.customerName, 46))}</text>`);
    parts.push(`<defs><clipPath id="card"><rect x="${innerX}" y="${cardY}" width="${innerW}" height="${cardH}" rx="20"/></clipPath></defs>`);
    parts.push(`<rect x="${innerX}" y="${cardY}" width="${innerW}" height="${cardH}" rx="20" fill="#ffffff" stroke="${LINE}" stroke-width="2"/>`);
    parts.push(`<g clip-path="url(#card)">`);
    parts.push(`<rect x="${innerX}" y="${cardY}" width="10" height="${cardH}" fill="${INDIGO}"/>`);
    parts.push(`<rect x="${innerX + 10}" y="${cardY + topH}" width="${innerW - 10}" height="${factsH}" fill="#f8fafc"/>`);
    parts.push(`<rect x="${innerX + 10}" y="${cardY + topH}" width="${innerW - 10}" height="2" fill="#eef2f7"/>`);
    parts.push(`</g>`);
    parts.push(`<text x="${innerX + 44}" y="${cardY + 62}" font-size="40" font-weight="bold" fill="${INK}">${escapeXml(month.label)}</text>`);
    parts.push(`<text x="${innerX + innerW - 36}" y="${cardY + 62}" font-size="40" font-weight="bold" fill="${INK}" text-anchor="end">${escapeXml(money(input.totalDue))}</text>`);
    const badgeW = Math.round(pay.text.length * 14.5 + 40);
    parts.push(`<rect x="${innerX + 44}" y="${cardY + 90}" width="${badgeW}" height="40" rx="20" fill="${pay.fill}"/>`);
    parts.push(`<text x="${innerX + 44 + badgeW / 2}" y="${cardY + 118}" font-size="22" font-weight="bold" fill="${pay.color}" text-anchor="middle">${escapeXml(pay.text)}</text>`);
    parts.push(`<text x="${innerX + 44 + badgeW + 22}" y="${cardY + 119}" font-size="24" fill="#475569">Orden ${escapeXml(month.orderFolio || '—')}</text>`);
    facts.forEach(([label, value], index) => {
        const y = cardY + topH + 14 + index * rowH + 36;
        parts.push(`<text x="${innerX + 44}" y="${y}" font-size="23" fill="${MUTED}">${escapeXml(label)}</text>`);
        parts.push(`<text x="${innerX + 230}" y="${y}" font-size="${label === 'UUID' ? 24 : 26}" font-weight="bold" fill="${INK}">${escapeXml(clip(value, 44))}</text>`);
    });
    parts.push(`<rect x="${innerX}" y="${footerY}" width="${innerW}" height="${footerH}" rx="20" fill="#eef2ff"/>`);
    parts.push(`<text x="${innerX + 36}" y="${footerY + 46}" font-size="22" fill="#4338ca">Mensualidad: ${escapeXml(money(input.monthlyAmount))} + ${input.ivaPercentage}% IVA</text>`);
    const issuer = input.issuerRfc ? `${input.issuerName} · ${input.issuerRfc}` : input.issuerName;
    parts.push(`<text x="${innerX + 36}" y="${footerY + 88}" font-size="22" font-weight="bold" fill="#312e81">${escapeXml(clip(issuer, 52))}</text>`);
    parts.push('</svg>');
    return parts.join('');
}
function renderPaymentReminderImage(input) {
    let Resvg;
    try {
        Resvg = require('@resvg/resvg-js').Resvg;
    }
    catch {
        return null;
    }
    const fontsDir = path.join(process.cwd(), 'src/_public/fonts');
    const resvg = new Resvg(buildPaymentReminderSvg(input), {
        fitTo: { mode: 'width', value: WIDTH },
        font: {
            fontFiles: [path.join(fontsDir, 'Roboto-Regular.ttf'), path.join(fontsDir, 'Roboto-Bold.ttf')],
            loadSystemFonts: false,
            defaultFontFamily: 'Roboto',
        },
    });
    return Buffer.from(resvg.render().asPng());
}
function buildPaymentReminderCaption(input) {
    const lines = [
        `Hola ${input.customerName}, te recordamos el pago de ${input.month.label} de *${input.title}*.`,
        '',
        `Importe: *${money(input.totalDue)}* (IVA incluido)`,
    ];
    if (input.month.orderFolio)
        lines.push(`Orden: ${input.month.orderFolio}`);
    if (input.month.invoiceFolio)
        lines.push(`Factura: ${input.month.invoiceFolio}`);
    lines.push('', 'Si ya realizaste el pago, ignora este mensaje. ¡Gracias!');
    return lines.join('\n');
}
//# sourceMappingURL=service-subscription-reminder-image.util.js.map