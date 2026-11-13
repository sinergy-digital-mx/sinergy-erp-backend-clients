import { formatCfdiFecha } from '../../self-invoice/utils/self-invoice-cfdi-xml.util';

const ADVANCE_TIME_ZONE = 'America/Tijuana';

export const ADVANCE_SAT_CLAVE = '84111506';
export const ADVANCE_UNIT_CODE = 'ACT';
export const ADVANCE_UNIT_NAME = 'Actividad';
export const ADVANCE_DESCRIPTION = 'Anticipo del bien o servicio';
export const ADVANCE_APPLICATION_DESCRIPTION = 'Aplicación de anticipo';
export const ADVANCE_IDENTIFICATION = 'anticipo_CFDI';
export const ADVANCE_RELATION_TYPE = '07';

export type AdvanceInvoiceRole = 'standard' | 'advance' | 'merchandise' | 'advance_application';

export interface AdvanceParty {
  rfc: string;
  nombre: string;
  regimen: string;
  postalCode: string;
}

export interface AdvanceConceptInput {
  series?: string | null;
  folio: string;
  baseAmount: number;
  ivaPercentage: number;
  usoCfdi: string;
  formaPago: string;
  metodoPago: 'PUE' | 'PPD';
  emisor: AdvanceParty;
  receptor: AdvanceParty;
  tipoComprobante: 'I' | 'E';
  descripcion: string;
  relatedUuid?: string | null;
  relationType?: string;
  currency?: string;
  exchangeRate?: number | null;
  satClave?: string;
  unitCode?: string;
  unitName?: string;
  identification?: string;
}

export interface MerchandiseLineInput {
  satClave: string;
  quantity: number;
  unitPrice: number;
  lineDiscount: number;
  ivaPercentage: number;
  iepsPercentage: number;
  unitCode: string;
  unitName: string;
  description: string;
}

export interface MerchandiseCfdiInput {
  series?: string | null;
  folio: string;
  lines: MerchandiseLineInput[];
  globalDiscount: number;
  advanceBase: number;
  usoCfdi: string;
  formaPago: string;
  metodoPago: 'PUE' | 'PPD';
  emisor: AdvanceParty;
  receptor: AdvanceParty;
  relatedUuid: string;
}

export interface BuiltCfdiAmounts {
  xml: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

interface TaxRow {
  impuesto: '002' | '003';
  base: number;
  tasa: number;
  importe: number;
}

interface ComprobanteShellParams {
  series?: string | null;
  folio: string;
  subtotal: number;
  discount: number;
  total: number;
  tipo: 'I' | 'E';
  formaPago: string;
  metodoPago: 'PUE' | 'PPD';
  emisor: AdvanceParty;
  receptor: AdvanceParty;
  usoCfdi: string;
  relatedUuid?: string | null;
  relationType?: string;
  currency?: string;
  exchangeRate?: number | null;
  conceptosXml: string;
  impuestosXml: string;
}

function cents(value: number): number {
  return Math.round((Number(value) || 0) * 100);
}

function fromCents(value: number): number {
  return Math.round(value) / 100;
}

function money(value: number): string {
  return fromCents(cents(value)).toFixed(2);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function advanceCfdiFecha(now = new Date()): string {
  return formatCfdiFecha(now, ADVANCE_TIME_ZONE).replace('T24:', 'T00:');
}

function tasa(percent: number): string {
  return (percent / 100).toFixed(6);
}

export function inferIvaPercentage(ivaTotal: number, taxableBase: number): number {
  if (taxableBase <= 0.009 || ivaTotal <= 0.009) {
    return 0;
  }
  const rate = (ivaTotal / taxableBase) * 100;
  if (Math.abs(rate - 8) < 0.25) return 8;
  if (Math.abs(rate - 16) < 0.25) return 16;
  return Math.round(rate * 100) / 100;
}

export function taxableBaseOfDocument(subtotal: number, discountTotal: number, globalDiscount: number): number {
  return fromCents(Math.max(cents(subtotal) - cents(discountTotal) - cents(globalDiscount), 0));
}

function relacionXml(uuid: string | null | undefined, relationType: string = ADVANCE_RELATION_TYPE): string {
  const value = uuid?.trim();
  if (!value) return '';
  const type = (relationType || ADVANCE_RELATION_TYPE).trim() || ADVANCE_RELATION_TYPE;
  return `
  <cfdi:CfdiRelacionados TipoRelacion="${escapeXml(type)}">
    <cfdi:CfdiRelacionado UUID="${escapeXml(value)}"/>
  </cfdi:CfdiRelacionados>`;
}

function comprobanteShell(params: ComprobanteShellParams): string {
  const series = params.series?.trim();
  const serieAttr = series ? ` Serie="${escapeXml(series)}"` : '';
  const discountAttr = params.discount > 0 ? ` Descuento="${money(params.discount)}"` : '';
  const currency = (params.currency || 'MXN').trim().toUpperCase() || 'MXN';
  const rate = Number(params.exchangeRate || 0);
  const tipoCambioAttr = currency !== 'MXN' && rate > 0 ? ` TipoCambio="${rate.toFixed(6)}"` : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd" Version="4.0"${serieAttr} Folio="${escapeXml(params.folio)}" Fecha="${advanceCfdiFecha()}" SubTotal="${money(params.subtotal)}"${discountAttr} Total="${money(params.total)}" Moneda="${escapeXml(currency)}"${tipoCambioAttr} TipoDeComprobante="${params.tipo}" Exportacion="01" MetodoPago="${escapeXml(params.metodoPago)}" FormaPago="${escapeXml(params.formaPago)}" LugarExpedicion="${escapeXml(params.emisor.postalCode)}">${relacionXml(params.relatedUuid, params.relationType)}
  <cfdi:Emisor Rfc="${escapeXml(params.emisor.rfc)}" Nombre="${escapeXml(params.emisor.nombre)}" RegimenFiscal="${escapeXml(params.emisor.regimen)}"/>
  <cfdi:Receptor Rfc="${escapeXml(params.receptor.rfc)}" Nombre="${escapeXml(params.receptor.nombre)}" DomicilioFiscalReceptor="${escapeXml(params.receptor.postalCode)}" RegimenFiscalReceptor="${escapeXml(params.receptor.regimen)}" UsoCFDI="${escapeXml(params.usoCfdi)}"/>
  <cfdi:Conceptos>${params.conceptosXml}
  </cfdi:Conceptos>${params.impuestosXml}
</cfdi:Comprobante>`;
}

function taxBlock(base: number, ivaPercentage: number, iepsPercentage: number): { xml: string; taxes: TaxRow[] } {
  const taxes: TaxRow[] = [];
  if (ivaPercentage > 0 && base > 0) {
    taxes.push({
      impuesto: '002',
      base,
      tasa: ivaPercentage,
      importe: fromCents(cents(base * (ivaPercentage / 100))),
    });
  }
  if (iepsPercentage > 0 && base > 0) {
    taxes.push({
      impuesto: '003',
      base,
      tasa: iepsPercentage,
      importe: fromCents(cents(base * (iepsPercentage / 100))),
    });
  }
  if (!taxes.length) {
    return { xml: '', taxes };
  }
  const rows = taxes
    .map(
      (tax) =>
        `          <cfdi:Traslado Base="${money(tax.base)}" Impuesto="${tax.impuesto}" TipoFactor="Tasa" TasaOCuota="${tasa(tax.tasa)}" Importe="${money(tax.importe)}"/>`,
    )
    .join('\n');
  return {
    xml: `
      <cfdi:Impuestos>
        <cfdi:Traslados>
${rows}
        </cfdi:Traslados>
      </cfdi:Impuestos>`,
    taxes,
  };
}

function groupedTaxesXml(taxes: TaxRow[]): string {
  if (!taxes.length) return '';
  const grouped = new Map<string, TaxRow>();
  for (const tax of taxes) {
    const key = `${tax.impuesto}|${tasa(tax.tasa)}`;
    const current = grouped.get(key) ?? {
      impuesto: tax.impuesto,
      base: 0,
      tasa: tax.tasa,
      importe: 0,
    };
    current.base = fromCents(cents(current.base) + cents(tax.base));
    current.importe = fromCents(cents(current.importe) + cents(tax.importe));
    grouped.set(key, current);
  }
  const rows = [...grouped.values()];
  const total = fromCents(rows.reduce((sum, row) => sum + cents(row.importe), 0));
  const xmlRows = rows
    .map(
      (row) =>
        `      <cfdi:Traslado Base="${money(row.base)}" Impuesto="${row.impuesto}" TipoFactor="Tasa" TasaOCuota="${tasa(row.tasa)}" Importe="${money(row.importe)}"/>`,
    )
    .join('\n');
  return `
  <cfdi:Impuestos TotalImpuestosTrasladados="${money(total)}">
    <cfdi:Traslados>
${xmlRows}
    </cfdi:Traslados>
  </cfdi:Impuestos>`;
}

export function distributeCents(weights: number[], amountCents: number): number[] {
  const safeWeights = weights.map((weight) => Math.max(cents(weight), 0));
  const totalWeight = safeWeights.reduce((sum, weight) => sum + weight, 0);
  if (amountCents <= 0 || totalWeight <= 0) {
    return weights.map(() => 0);
  }
  const shares = safeWeights.map((weight) => Math.floor((amountCents * weight) / totalWeight));
  let used = shares.reduce((sum, share) => sum + share, 0);
  for (let i = shares.length - 1; i >= 0 && used < amountCents; i -= 1) {
    if (safeWeights[i] <= 0) continue;
    const room = safeWeights[i] - shares[i];
    const add = Math.min(room, amountCents - used);
    shares[i] += add;
    used += add;
  }
  if (used !== amountCents) {
    throw new Error('El descuento no cabe en las líneas de la factura');
  }
  return shares;
}

export function buildAdvanceConceptCfdi(input: AdvanceConceptInput): BuiltCfdiAmounts {
  const base = fromCents(cents(input.baseAmount));
  if (base <= 0) {
    throw new Error('El anticipo debe ser mayor a cero');
  }
  const tax = taxBlock(base, input.ivaPercentage, 0);
  const taxTotal = fromCents(tax.taxes.reduce((sum, row) => sum + cents(row.importe), 0));
  const total = fromCents(cents(base) + cents(taxTotal));
  const objeto = tax.taxes.length ? '02' : '01';
  const clave = (input.satClave || ADVANCE_SAT_CLAVE).trim() || ADVANCE_SAT_CLAVE;
  const unitCode = (input.unitCode || ADVANCE_UNIT_CODE).trim() || ADVANCE_UNIT_CODE;
  const unitName = (input.unitName || ADVANCE_UNIT_NAME).trim() || ADVANCE_UNIT_NAME;
  const identification = (input.identification || ADVANCE_IDENTIFICATION).trim();
  const identificationAttr = identification
    ? ` NoIdentificacion="${escapeXml(identification)}"`
    : '';
  const concepto = `
    <cfdi:Concepto ClaveProdServ="${escapeXml(clave)}"${identificationAttr} Cantidad="1.000000" ClaveUnidad="${escapeXml(unitCode)}" Unidad="${escapeXml(unitName)}" Descripcion="${escapeXml(input.descripcion)}" ValorUnitario="${money(base)}" Importe="${money(base)}" ObjetoImp="${objeto}">${tax.xml}
    </cfdi:Concepto>`;

  return {
    xml: comprobanteShell({
      series: input.series,
      folio: input.folio,
      subtotal: base,
      discount: 0,
      total,
      tipo: input.tipoComprobante,
      formaPago: input.formaPago,
      metodoPago: input.metodoPago,
      emisor: input.emisor,
      receptor: input.receptor,
      usoCfdi: input.usoCfdi,
      relatedUuid: input.relatedUuid,
      relationType: input.relationType,
      currency: input.currency,
      exchangeRate: input.exchangeRate,
      conceptosXml: concepto,
      impuestosXml: groupedTaxesXml(tax.taxes),
    }),
    subtotal: base,
    discount: 0,
    tax: taxTotal,
    total,
  };
}

export function buildMerchandiseCfdi(input: MerchandiseCfdiInput): BuiltCfdiAmounts {
  if (!input.lines.length) {
    throw new Error('La orden no tiene líneas para facturar');
  }
  const ivaRates = [...new Set(input.lines.map((line) => Number(line.ivaPercentage) || 0))];
  if (ivaRates.length > 1) {
    throw new Error('El anticipo solo se aplica cuando todas las líneas tienen el mismo IVA');
  }
  const ivaPercentage = ivaRates[0] ?? 0;
  const nets = input.lines.map((line) =>
    fromCents(Math.max(cents(line.quantity * line.unitPrice) - cents(line.lineDiscount), 0)),
  );
  const extra = fromCents(cents(input.globalDiscount) + cents(input.advanceBase));
  const shares = distributeCents(nets, cents(extra)).map((share) => fromCents(share));

  const built = input.lines.map((line, index) => {
    const gross = fromCents(cents(line.quantity * line.unitPrice));
    const discount = fromCents(cents(line.lineDiscount) + cents(shares[index] ?? 0));
    const taxable = fromCents(Math.max(cents(gross) - cents(discount), 0));
    const tax = taxBlock(taxable, ivaPercentage, Number(line.iepsPercentage) || 0);
    const discountAttr = discount > 0 ? ` Descuento="${money(discount)}"` : '';
    const objeto = tax.taxes.length ? '02' : '01';
    const xml = `
    <cfdi:Concepto ClaveProdServ="${escapeXml(line.satClave || '01010101')}" Cantidad="${Number(line.quantity).toFixed(6)}" ClaveUnidad="${escapeXml(line.unitCode)}" Unidad="${escapeXml(line.unitName)}" Descripcion="${escapeXml(line.description)}" ValorUnitario="${money(line.unitPrice)}" Importe="${money(gross)}"${discountAttr} ObjetoImp="${objeto}">${tax.xml}
    </cfdi:Concepto>`;
    return { xml, gross, discount, taxes: tax.taxes };
  });

  const subtotal = fromCents(built.reduce((sum, row) => sum + cents(row.gross), 0));
  const discount = fromCents(built.reduce((sum, row) => sum + cents(row.discount), 0));
  const taxes = built.flatMap((row) => row.taxes);
  const tax = fromCents(taxes.reduce((sum, row) => sum + cents(row.importe), 0));
  const total = fromCents(Math.max(cents(subtotal) - cents(discount) + cents(tax), 0));

  return {
    xml: comprobanteShell({
      series: input.series,
      folio: input.folio,
      subtotal,
      discount,
      total,
      tipo: 'I',
      formaPago: input.formaPago,
      metodoPago: input.metodoPago,
      emisor: input.emisor,
      receptor: input.receptor,
      usoCfdi: input.usoCfdi,
      relatedUuid: input.relatedUuid,
      conceptosXml: built.map((row) => row.xml).join(''),
      impuestosXml: groupedTaxesXml(taxes),
    }),
    subtotal,
    discount,
    tax,
    total,
  };
}

export function fiveDigitPostalCode(value?: string | null): string {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length >= 5 ? digits.slice(0, 5) : '';
}

export function resolveSatUnit(
  unitName?: string | null,
  itemKind?: string | null,
): {
  code: string;
  name: string;
} {
  const normalized = String(unitName ?? '')
    .trim()
    .toUpperCase()
    .replace(/\./g, '');
  const service =
    itemKind === 'service' ||
    ['E48', 'SERVICIO', 'SERVICIOS', 'SERVICE', 'SERV'].includes(normalized);
  if (service) {
    return { code: 'E48', name: unitName?.trim() || 'Servicio' };
  }
  return { code: 'H87', name: unitName?.trim() || 'Pieza' };
}
