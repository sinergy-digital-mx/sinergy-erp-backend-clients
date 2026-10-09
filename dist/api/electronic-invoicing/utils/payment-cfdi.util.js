"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPaymentComplementXml = buildPaymentComplementXml;
exports.paymentComplementFecha = paymentComplementFecha;
exports.formaPagoFromSalesMethod = formaPagoFromSalesMethod;
exports.taxesFromIncomeCfdi = taxesFromIncomeCfdi;
exports.readPaymentComplementLines = readPaymentComplementLines;
exports.resolveFechaPago = resolveFechaPago;
const self_invoice_cfdi_xml_util_1 = require("../../self-invoice/utils/self-invoice-cfdi-xml.util");
const BUSINESS_TIME_ZONE = 'America/Tijuana';
function buildPaymentComplementXml(input) {
    if (input.related.moneda !== 'MXN') {
        throw new Error('El CEP automático solo cubre facturas en MXN.');
    }
    const invoiceCents = cents(input.related.total);
    if (invoiceCents <= 0) {
        throw new Error('La factura no tiene importe que cobrar.');
    }
    const slices = allocatePayments(input.payments, invoiceCents);
    const taxPlan = planTaxes(input.taxes, slices, invoiceCents);
    const pagosXml = slices
        .map((slice, index) => pagoXml(input, slice, index + 1, taxPlan[index] ?? []))
        .join('');
    const series = input.series?.trim();
    const serieAttr = series ? ` Serie="${escapeXml(series)}"` : '';
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:pago20="http://www.sat.gob.mx/Pagos20" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd http://www.sat.gob.mx/Pagos20 http://www.sat.gob.mx/sitio_internet/cfd/Pagos/Pagos20.xsd" Version="4.0"${serieAttr} Folio="${escapeXml(input.folio)}" Fecha="${escapeXml(input.fecha)}" SubTotal="0" Total="0" Moneda="XXX" TipoDeComprobante="P" Exportacion="01" LugarExpedicion="${escapeXml(input.lugarExpedicion)}">
  <cfdi:Emisor Rfc="${escapeXml(input.emisor.rfc)}" Nombre="${escapeXml(input.emisor.nombre)}" RegimenFiscal="${escapeXml(input.emisor.regimen)}"/>
  <cfdi:Receptor Rfc="${escapeXml(input.receptor.rfc)}" Nombre="${escapeXml(input.receptor.nombre)}" DomicilioFiscalReceptor="${escapeXml(input.receptor.postalCode)}" RegimenFiscalReceptor="${escapeXml(input.receptor.regimen)}" UsoCFDI="CP01"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="84111506" Cantidad="1" ClaveUnidad="ACT" Descripcion="Pago" ValorUnitario="0" Importe="0" ObjetoImp="01"/>
  </cfdi:Conceptos>
  <cfdi:Complemento>
    <pago20:Pagos Version="2.0">
      <pago20:Totales ${totalesAttrs(slices, taxPlan)}/>${pagosXml}
    </pago20:Pagos>
  </cfdi:Complemento>
</cfdi:Comprobante>`;
    return { xml, amount: invoiceCents / 100 };
}
function paymentComplementFecha(now = new Date()) {
    return (0, self_invoice_cfdi_xml_util_1.formatCfdiFecha)(now, BUSINESS_TIME_ZONE).replace('T24:', 'T00:');
}
function formaPagoFromSalesMethod(method) {
    switch ((method ?? '').trim()) {
        case 'cash':
            return '01';
        case 'check':
            return '02';
        case 'transfer':
            return '03';
        case 'card':
            return '04';
        default:
            return null;
    }
}
function taxesFromIncomeCfdi(cfdi) {
    const grouped = new Map();
    let objeto = '01';
    for (const concepto of cfdi.conceptos) {
        if (concepto.objetoImp === '02') {
            objeto = '02';
        }
        for (const traslado of concepto.traslados) {
            const impuesto = traslado.impuesto === '003' ? '003' : traslado.impuesto === '002' ? '002' : '';
            if (!impuesto) {
                continue;
            }
            const exento = traslado.tipoFactor.toLowerCase() === 'exento';
            const tasa = exento ? '' : normalizeRate(traslado.tasaOCuota);
            const key = `${impuesto}|${exento ? 'Exento' : 'Tasa'}|${tasa}`;
            const current = grouped.get(key) ?? {
                impuesto,
                tipoFactor: exento ? 'Exento' : 'Tasa',
                tasaOCuota: tasa,
                base: 0,
                importe: 0,
            };
            current.base = (cents(current.base) + cents(traslado.base)) / 100;
            current.importe = (cents(current.importe) + cents(traslado.importe)) / 100;
            grouped.set(key, current);
        }
    }
    const taxes = [...grouped.values()];
    if (taxes.length === 0) {
        objeto = '01';
    }
    return { objetoImp: objeto, taxes };
}
function readPaymentComplementLines(xml) {
    const pagos = xml.match(/<(?:[\w.-]+:)?Pago\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?Pago>/gi) ?? [];
    const lines = [];
    for (const block of pagos) {
        const open = /<(?:[\w.-]+:)?Pago\b[^>]*>/i.exec(block)?.[0] ?? '';
        const docto = /<(?:[\w.-]+:)?DoctoRelacionado\b[^>]*\/?>/i.exec(block)?.[0] ?? '';
        lines.push({
            fecha: readAttr(open, 'FechaPago'),
            formaPago: readAttr(open, 'FormaDePagoP'),
            monto: readAttr(open, 'Monto'),
            parcialidad: readAttr(docto, 'NumParcialidad'),
            saldo: readAttr(docto, 'ImpSaldoInsoluto'),
            uuid: readAttr(docto, 'IdDocumento'),
        });
    }
    return lines;
}
function allocatePayments(payments, invoiceCents) {
    const usable = payments
        .map((payment, index) => ({ payment, index }))
        .filter((row) => cents(row.payment.amount) > 0)
        .sort((a, b) => {
        const byDate = a.payment.paymentDate.localeCompare(b.payment.paymentDate);
        return byDate || a.index - b.index;
    });
    let remaining = invoiceCents;
    const slices = [];
    for (const row of usable) {
        if (remaining <= 0) {
            break;
        }
        const paidCents = Math.min(cents(row.payment.amount), remaining);
        slices.push({
            ...row.payment,
            paidCents,
            saldoAntCents: remaining,
        });
        remaining -= paidCents;
    }
    if (remaining > 0) {
        throw new Error('Los pagos registrados no cubren el total de la factura.');
    }
    if (slices.length === 0) {
        throw new Error('No hay pagos registrados para armar el CEP.');
    }
    return slices;
}
function planTaxes(taxes, slices, invoiceCents) {
    const allocated = taxes.map(() => ({ base: 0, importe: 0 }));
    return slices.map((slice, sliceIndex) => {
        const last = sliceIndex === slices.length - 1;
        return taxes.map((tax, taxIndex) => {
            const baseTotal = cents(tax.base);
            const importeTotal = cents(tax.importe);
            const baseCents = last
                ? baseTotal - allocated[taxIndex].base
                : Math.round((baseTotal * slice.paidCents) / invoiceCents);
            const importeCents = last
                ? importeTotal - allocated[taxIndex].importe
                : Math.round((importeTotal * slice.paidCents) / invoiceCents);
            allocated[taxIndex].base += baseCents;
            allocated[taxIndex].importe += importeCents;
            return { tax, baseCents, importeCents };
        });
    });
}
function pagoXml(input, slice, parcialidad, taxes) {
    const saldoIns = slice.saldoAntCents - slice.paidCents;
    const fechaPago = resolveFechaPago(slice.paymentDate, input.related.fecha, input.fecha);
    const reference = slice.reference?.trim();
    const operacion = reference ? ` NumOperacion="${escapeXml(reference.slice(0, 100))}"` : '';
    const serie = input.related.serie?.trim();
    const folio = input.related.folio?.trim();
    const serieAttr = serie ? ` Serie="${escapeXml(serie)}"` : '';
    const folioAttr = folio ? ` Folio="${escapeXml(folio)}"` : '';
    const impuestos = input.objetoImp === '02' ? impuestosXml(taxes) : '';
    return `
      <pago20:Pago FechaPago="${escapeXml(fechaPago)}" FormaDePagoP="${escapeXml(slice.formaPago)}" MonedaP="MXN" TipoCambioP="1" Monto="${money(slice.paidCents)}"${operacion}>
        <pago20:DoctoRelacionado IdDocumento="${escapeXml(input.related.uuid)}"${serieAttr}${folioAttr} MonedaDR="MXN" EquivalenciaDR="1" NumParcialidad="${parcialidad}" ImpSaldoAnt="${money(slice.saldoAntCents)}" ImpPagado="${money(slice.paidCents)}" ImpSaldoInsoluto="${money(saldoIns)}" ObjetoImpDR="${input.objetoImp}">${impuestos}
        </pago20:DoctoRelacionado>${input.objetoImp === '02' ? impuestosPXml(taxes) : ''}
      </pago20:Pago>`;
}
function impuestosXml(taxes) {
    const rows = taxes.map((row) => trasladoAttrs('DR', row)).join('');
    if (!rows) {
        return '';
    }
    return `
          <pago20:ImpuestosDR>
            <pago20:TrasladosDR>${rows}
            </pago20:TrasladosDR>
          </pago20:ImpuestosDR>`;
}
function impuestosPXml(taxes) {
    const rows = taxes.map((row) => trasladoAttrs('P', row)).join('');
    if (!rows) {
        return '';
    }
    return `
        <pago20:ImpuestosP>
          <pago20:TrasladosP>${rows}
          </pago20:TrasladosP>
        </pago20:ImpuestosP>`;
}
function trasladoAttrs(suffix, row) {
    const base = ` Base${suffix}="${money(row.baseCents)}" Impuesto${suffix}="${row.tax.impuesto}" TipoFactor${suffix}="${row.tax.tipoFactor}"`;
    if (row.tax.tipoFactor === 'Exento') {
        return `
              <pago20:Traslado${suffix}${base}/>`;
    }
    const tasa = ` TasaOCuota${suffix}="${normalizeRate(row.tax.tasaOCuota)}" Importe${suffix}="${money(row.importeCents)}"`;
    return `
              <pago20:Traslado${suffix}${base}${tasa}/>`;
}
function totalesAttrs(slices, taxPlan) {
    const monto = slices.reduce((sum, slice) => sum + slice.paidCents, 0);
    const buckets = new Map();
    for (const plan of taxPlan) {
        for (const row of plan) {
            if (row.tax.impuesto !== '002') {
                continue;
            }
            const key = row.tax.tipoFactor === 'Exento' ? 'Exento' : ivaBucket(row.tax.tasaOCuota);
            if (!key) {
                throw new Error('La factura tiene una tasa de IVA que el CEP no puede agrupar.');
            }
            const current = buckets.get(key) ?? { base: 0, importe: 0 };
            current.base += row.baseCents;
            current.importe += row.importeCents;
            buckets.set(key, current);
        }
    }
    const attrs = [`MontoTotalPagos="${money(monto)}"`];
    for (const rate of ['16', '8', '0']) {
        const bucket = buckets.get(rate);
        if (!bucket) {
            continue;
        }
        attrs.push(`TotalTrasladosBaseIVA${rate}="${money(bucket.base)}"`);
        attrs.push(`TotalTrasladosImpuestoIVA${rate}="${money(bucket.importe)}"`);
    }
    const exento = buckets.get('Exento');
    if (exento) {
        attrs.push(`TotalTrasladosBaseIVAExento="${money(exento.base)}"`);
    }
    return attrs.join(' ');
}
function ivaBucket(tasa) {
    const rate = Number(tasa);
    if (Math.abs(rate - 0.16) < 0.000001)
        return '16';
    if (Math.abs(rate - 0.08) < 0.000001)
        return '8';
    if (Math.abs(rate) < 0.000001)
        return '0';
    return null;
}
function resolveFechaPago(paymentDate, relatedFecha, comprobanteFecha) {
    const raw = paymentDate.trim();
    const dateOnly = /^(\d{4}-\d{2}-\d{2})/.exec(raw);
    let fecha = dateOnly && raw.length <= 10 ? `${dateOnly[1]}T12:00:00` : raw.slice(0, 19);
    if (relatedFecha && fecha < relatedFecha) {
        fecha = relatedFecha;
    }
    if (comprobanteFecha && fecha > comprobanteFecha) {
        fecha = comprobanteFecha;
    }
    return fecha;
}
function normalizeRate(value) {
    const rate = Number(value);
    return Number.isFinite(rate) ? rate.toFixed(6) : value;
}
function cents(value) {
    return Math.round((Number(value) || 0) * 100);
}
function money(value) {
    return (value / 100).toFixed(2);
}
function escapeXml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
function readAttr(tag, name) {
    const match = new RegExp(`\\b${name}="([^"]*)"`, 'i').exec(tag);
    return match?.[1] ?? '';
}
//# sourceMappingURL=payment-cfdi.util.js.map