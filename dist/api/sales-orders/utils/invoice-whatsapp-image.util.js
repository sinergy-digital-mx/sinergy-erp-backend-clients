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
exports.buildInvoiceWhatsappSvg = buildInvoiceWhatsappSvg;
exports.renderInvoiceWhatsappImage = renderInvoiceWhatsappImage;
exports.buildInvoiceWhatsappCaption = buildInvoiceWhatsappCaption;
const path = __importStar(require("path"));
const WIDTH = 1080;
const HEIGHT = 1350;
function escapeXml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function clip(value, max) {
    const text = value.trim();
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
function buildInvoiceWhatsappSvg(input) {
    const paid = input.paid;
    const headline = paid ? ['Tu factura', 'ya está pagada'] : ['Tu pago', 'está pendiente'];
    const badge = paid ? 'Pagado' : 'Pendiente de pago';
    const accent = paid ? '#059669' : '#d97706';
    const badgeFill = paid ? '#ecfdf5' : '#fffbeb';
    const badgeInk = paid ? '#047857' : '#b45309';
    const issuer = input.issuerRfc ? `${input.issuerName} · ${input.issuerRfc}` : input.issuerName;
    const rows = [
        ['Factura', input.invoiceFolio || '—'],
        ['Orden', input.orderFolio || '—'],
        ['Fecha', input.stampedAt || '—'],
    ];
    const parts = [];
    parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" font-family="Roboto">`);
    parts.push(`<rect width="${WIDTH}" height="${HEIGHT}" fill="#102820"/>`);
    parts.push(`<circle cx="980" cy="40" r="260" fill="#1b4332"/>`);
    parts.push(`<circle cx="70" cy="280" r="120" fill="#1b4332"/>`);
    parts.push(`<circle cx="920" cy="430" r="70" fill="#40916c" fill-opacity="0.35"/>`);
    parts.push(`<text x="72" y="168" font-size="22" font-weight="bold" fill="#95d5b2" letter-spacing="6">FACTURA</text>`);
    parts.push(`<text x="72" y="268" font-size="72" font-weight="bold" fill="#ffffff">${escapeXml(headline[0])}</text>`);
    parts.push(`<text x="72" y="352" font-size="72" font-weight="bold" fill="#ffffff">${escapeXml(headline[1])}</text>`);
    parts.push(`<text x="72" y="430" font-size="30" fill="#d8f3dc">${escapeXml(clip(input.customerName, 42))}</text>`);
    parts.push(`<rect x="56" y="490" width="968" height="760" rx="40" fill="#fffdf8"/>`);
    parts.push(`<rect x="56" y="490" width="968" height="14" rx="7" fill="${accent}"/>`);
    parts.push(`<text x="108" y="600" font-size="24" fill="#78716c">Total</text>`);
    parts.push(`<text x="108" y="688" font-size="68" font-weight="bold" fill="#1c1917">${escapeXml(clip(input.totalLabel, 18))}</text>`);
    const badgeW = Math.round(badge.length * 16 + 48);
    parts.push(`<rect x="108" y="724" width="${badgeW}" height="48" rx="24" fill="${badgeFill}"/>`);
    parts.push(`<text x="${108 + badgeW / 2}" y="756" font-size="24" font-weight="bold" fill="${badgeInk}" text-anchor="middle">${escapeXml(badge)}</text>`);
    parts.push(`<rect x="108" y="812" width="864" height="2" fill="#e7e5e4"/>`);
    rows.forEach(([label, value], index) => {
        const y = 880 + index * 78;
        parts.push(`<text x="108" y="${y}" font-size="24" fill="#78716c">${escapeXml(label)}</text>`);
        parts.push(`<text x="300" y="${y}" font-size="26" font-weight="bold" fill="#1c1917">${escapeXml(clip(value, 42))}</text>`);
    });
    parts.push(`<text x="108" y="1124" font-size="24" fill="#78716c">UUID</text>`);
    parts.push(`<text x="108" y="1164" font-size="22" font-weight="bold" fill="#1c1917">${escapeXml(input.uuid || '—')}</text>`);
    parts.push(`<text x="108" y="1216" font-size="24" font-weight="bold" fill="#14532d">${escapeXml(clip(issuer, 48))}</text>`);
    parts.push(`<text x="72" y="1304" font-size="24" fill="#95d5b2">Adjuntamos el PDF y el XML de tu CFDI.</text>`);
    parts.push('</svg>');
    return parts.join('');
}
function renderInvoiceWhatsappImage(input) {
    let Resvg;
    try {
        Resvg = require('@resvg/resvg-js').Resvg;
    }
    catch {
        return null;
    }
    const fontsDir = path.join(process.cwd(), 'src/_public/fonts');
    const resvg = new Resvg(buildInvoiceWhatsappSvg(input), {
        fitTo: { mode: 'width', value: WIDTH },
        font: {
            fontFiles: [path.join(fontsDir, 'Roboto-Regular.ttf'), path.join(fontsDir, 'Roboto-Bold.ttf')],
            loadSystemFonts: false,
            defaultFontFamily: 'Roboto',
        },
    });
    return Buffer.from(resvg.render().asPng());
}
function buildInvoiceWhatsappCaption(input) {
    const hello = `Hola ${input.customerName},`;
    if (input.paid) {
        return [
            `${hello} te compartimos tu factura *${input.invoiceFolio}* por *${input.totalLabel}*.`,
            `Orden ${input.orderFolio}.`,
            '',
            '¡Gracias!',
        ].join('\n');
    }
    return [
        `${hello} tu pago de la factura *${input.invoiceFolio}* está pendiente.`,
        '',
        `Total: *${input.totalLabel}*`,
        `Orden: ${input.orderFolio}`,
        '',
        'Adjuntamos el PDF y el XML.',
    ].join('\n');
}
//# sourceMappingURL=invoice-whatsapp-image.util.js.map