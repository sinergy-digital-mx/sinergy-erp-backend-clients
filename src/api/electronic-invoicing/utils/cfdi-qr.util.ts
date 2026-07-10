import * as QRCode from 'qrcode';
import { ParsedCfdi } from './cfdi-xml.parser';

/** Total para QR SAT: 17 dígitos sin punto decimal, ceros a la izquierda */
export function formatCfdiQrTotal(total: string | number): string {
  const normalized = Number(total).toFixed(2);
  return normalized.replace('.', '').padStart(17, '0');
}

export function buildCfdiVerificationUrl(cfdi: ParsedCfdi): string {
  const selloForQr = cfdi.timbre.selloCFD || cfdi.sello;
  const fe = selloForQr.slice(-8);
  const params = new URLSearchParams({
    id: cfdi.timbre.uuid,
    re: cfdi.emisor.rfc,
    rr: cfdi.receptor.rfc,
    tt: formatCfdiQrTotal(cfdi.total),
    fe,
  });

  return `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?&${params.toString()}`;
}

export async function generateCfdiQrDataUrl(verificationUrl: string): Promise<string> {
  return QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 220,
  });
}
