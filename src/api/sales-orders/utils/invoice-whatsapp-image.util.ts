import * as path from 'path';

export interface InvoiceWhatsappImageInput {
  paid: boolean;
  customerName: string;
  issuerName: string;
  issuerRfc: string | null;
  invoiceFolio: string;
  orderFolio: string;
  uuid: string;
  totalLabel: string;
  stampedAt: string;
}

const WIDTH = 1080;
const HEIGHT = 1350;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function clip(value: string, max: number): string {
  const text = value.trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function buildInvoiceWhatsappSvg(input: InvoiceWhatsappImageInput): string {
  const paid = input.paid;
  const headline = paid ? ['Tu factura', 'ya está pagada'] : ['Tu pago', 'está pendiente'];
  const badge = paid ? 'Pagado' : 'Pendiente de pago';
  const accent = paid ? '#059669' : '#d97706';
  const badgeFill = paid ? '#ecfdf5' : '#fffbeb';
  const badgeInk = paid ? '#047857' : '#b45309';
  const issuer = input.issuerRfc ? `${input.issuerName} · ${input.issuerRfc}` : input.issuerName;
  const rows: Array<[string, string]> = [
    ['Factura', input.invoiceFolio || '—'],
    ['Orden', input.orderFolio || '—'],
    ['Fecha', input.stampedAt || '—'],
  ];

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" font-family="Roboto">`,
  );
  parts.push(`<rect width="${WIDTH}" height="${HEIGHT}" fill="#102820"/>`);
  parts.push(`<circle cx="980" cy="40" r="260" fill="#1b4332"/>`);
  parts.push(`<circle cx="70" cy="280" r="120" fill="#1b4332"/>`);
  parts.push(`<circle cx="920" cy="430" r="70" fill="#40916c" fill-opacity="0.35"/>`);
  parts.push(
    `<text x="72" y="168" font-size="22" font-weight="bold" fill="#95d5b2" letter-spacing="6">FACTURA</text>`,
  );
  parts.push(
    `<text x="72" y="268" font-size="72" font-weight="bold" fill="#ffffff">${escapeXml(headline[0])}</text>`,
  );
  parts.push(
    `<text x="72" y="352" font-size="72" font-weight="bold" fill="#ffffff">${escapeXml(headline[1])}</text>`,
  );
  parts.push(
    `<text x="72" y="430" font-size="30" fill="#d8f3dc">${escapeXml(clip(input.customerName, 42))}</text>`,
  );
  parts.push(`<rect x="56" y="490" width="968" height="760" rx="40" fill="#fffdf8"/>`);
  parts.push(`<rect x="56" y="490" width="968" height="14" rx="7" fill="${accent}"/>`);
  parts.push(`<text x="108" y="600" font-size="24" fill="#78716c">Total</text>`);
  parts.push(
    `<text x="108" y="688" font-size="68" font-weight="bold" fill="#1c1917">${escapeXml(clip(input.totalLabel, 18))}</text>`,
  );
  const badgeW = Math.round(badge.length * 16 + 48);
  parts.push(`<rect x="108" y="724" width="${badgeW}" height="48" rx="24" fill="${badgeFill}"/>`);
  parts.push(
    `<text x="${108 + badgeW / 2}" y="756" font-size="24" font-weight="bold" fill="${badgeInk}" text-anchor="middle">${escapeXml(badge)}</text>`,
  );
  parts.push(`<rect x="108" y="812" width="864" height="2" fill="#e7e5e4"/>`);
  rows.forEach(([label, value], index) => {
    const y = 880 + index * 78;
    parts.push(`<text x="108" y="${y}" font-size="24" fill="#78716c">${escapeXml(label)}</text>`);
    parts.push(
      `<text x="300" y="${y}" font-size="26" font-weight="bold" fill="#1c1917">${escapeXml(clip(value, 42))}</text>`,
    );
  });
  parts.push(`<text x="108" y="1124" font-size="24" fill="#78716c">UUID</text>`);
  parts.push(
    `<text x="108" y="1164" font-size="22" font-weight="bold" fill="#1c1917">${escapeXml(input.uuid || '—')}</text>`,
  );
  parts.push(
    `<text x="108" y="1216" font-size="24" font-weight="bold" fill="#14532d">${escapeXml(clip(issuer, 48))}</text>`,
  );
  parts.push(
    `<text x="72" y="1304" font-size="24" fill="#95d5b2">Adjuntamos el PDF y el XML de tu CFDI.</text>`,
  );
  parts.push('</svg>');
  return parts.join('');
}

export function renderInvoiceWhatsappImage(input: InvoiceWhatsappImageInput): Buffer | null {
  let Resvg: typeof import('@resvg/resvg-js').Resvg;
  try {
    Resvg = require('@resvg/resvg-js').Resvg;
  } catch {
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

export function buildInvoiceWhatsappCaption(input: InvoiceWhatsappImageInput): string {
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
