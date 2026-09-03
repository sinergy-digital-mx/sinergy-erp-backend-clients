"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSelfInvoiceCfdiXml = buildSelfInvoiceCfdiXml;
exports.formatCfdiFecha = formatCfdiFecha;
const self_invoice_constants_1 = require("../self-invoice.constants");
function buildSelfInvoiceCfdiXml(input) {
    if (!input.lines.length) {
        throw new Error('La orden no tiene partidas para facturar');
    }
    const conceptos = [];
    let subTotal = 0;
    let descuentoTotal = 0;
    const impuestoBuckets = new Map();
    const globalDiscount = round2(Number(input.globalDiscountAmount) || 0);
    const lineGrossTotal = input.lines.reduce((sum, line) => {
        return sum + round2(line.quantity * line.unitPrice);
    }, 0);
    for (const line of input.lines) {
        const qty = round6(Number(line.quantity) || 0);
        const unitPrice = round6(Number(line.unitPrice) || 0);
        const importe = round2(qty * unitPrice);
        const lineDiscount = round2((Number(line.discountUnit) || 0) * qty);
        const share = globalDiscount > 0 && lineGrossTotal > 0
            ? round2((importe / lineGrossTotal) * globalDiscount)
            : 0;
        const descuento = round2(lineDiscount + share);
        const base = round2(Math.max(0, importe - descuento));
        subTotal = round2(subTotal + importe);
        descuentoTotal = round2(descuentoTotal + descuento);
        const traslados = [];
        const ivaRate = (Number(line.ivaPercentage) || 0) / 100;
        const iepsRate = (Number(line.iepsPercentage) || 0) / 100;
        if (ivaRate > 0) {
            traslados.push(makeTraslado('002', ivaRate, base));
        }
        if (iepsRate > 0) {
            traslados.push(makeTraslado('003', iepsRate, base));
        }
        for (const traslado of traslados) {
            const key = `${traslado.impuesto}:${traslado.tasa.toFixed(6)}`;
            const current = impuestoBuckets.get(key);
            if (current) {
                current.base = round2(current.base + traslado.base);
                current.importe = round2(current.importe + traslado.importe);
            }
            else {
                impuestoBuckets.set(key, { ...traslado });
            }
        }
        const objetoImp = traslados.length > 0 ? '02' : '01';
        const claveProd = sanitizeSatClave(line.satClave) || self_invoice_constants_1.DEFAULT_SAT_CLAVE_PROD_SERV;
        const claveUnidad = resolveClaveUnidad(line.uomName);
        const unidad = xmlAttr(line.uomName?.trim() || 'Pieza');
        const attrs = [
            `ClaveProdServ="${xmlAttr(claveProd)}"`,
            `Cantidad="${formatQty(qty)}"`,
            `ClaveUnidad="${xmlAttr(claveUnidad)}"`,
            `Unidad="${unidad}"`,
            `Descripcion="${xmlAttr(line.description || 'PRODUCTO')}"`,
            `ValorUnitario="${formatMoney6(unitPrice)}"`,
            `Importe="${formatMoney(importe)}"`,
            descuento > 0 ? `Descuento="${formatMoney(descuento)}"` : '',
            `ObjetoImp="${objetoImp}"`,
        ]
            .filter(Boolean)
            .join(' ');
        if (traslados.length === 0) {
            conceptos.push(`    <cfdi:Concepto ${attrs}/>`);
            continue;
        }
        const trasladoXml = traslados
            .map((traslado) => `          <cfdi:Traslado Base="${formatMoney(traslado.base)}" Impuesto="${traslado.impuesto}" TipoFactor="Tasa" TasaOCuota="${formatRate(traslado.tasa)}" Importe="${formatMoney(traslado.importe)}"/>`)
            .join('\n');
        conceptos.push([
            `    <cfdi:Concepto ${attrs}>`,
            `      <cfdi:Impuestos>`,
            `        <cfdi:Traslados>`,
            trasladoXml,
            `        </cfdi:Traslados>`,
            `      </cfdi:Impuestos>`,
            `    </cfdi:Concepto>`,
        ].join('\n'));
    }
    const buckets = [...impuestoBuckets.values()];
    const totalImpuestos = round2(buckets.reduce((sum, item) => sum + item.importe, 0));
    const total = round2(subTotal - descuentoTotal + totalImpuestos);
    const comprobanteAttrs = [
        `xmlns:cfdi="http://www.sat.gob.mx/cfd/4"`,
        `xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"`,
        `xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd"`,
        `Version="4.0"`,
        input.serie ? `Serie="${xmlAttr(input.serie)}"` : '',
        `Folio="${xmlAttr(input.folio)}"`,
        `Fecha="${xmlAttr(input.fecha)}"`,
        `FormaPago="${xmlAttr(input.formaPago)}"`,
        `SubTotal="${formatMoney(subTotal)}"`,
        descuentoTotal > 0 ? `Descuento="${formatMoney(descuentoTotal)}"` : '',
        `Moneda="MXN"`,
        `Total="${formatMoney(total)}"`,
        `TipoDeComprobante="I"`,
        `Exportacion="01"`,
        `MetodoPago="${xmlAttr(input.metodoPago)}"`,
        `LugarExpedicion="${xmlAttr(input.lugarExpedicion)}"`,
    ]
        .filter(Boolean)
        .join(' ');
    const impuestosXml = buckets.length === 0
        ? ''
        : [
            `  <cfdi:Impuestos TotalImpuestosTrasladados="${formatMoney(totalImpuestos)}">`,
            `    <cfdi:Traslados>`,
            ...buckets.map((traslado) => `      <cfdi:Traslado Base="${formatMoney(traslado.base)}" Impuesto="${traslado.impuesto}" TipoFactor="Tasa" TasaOCuota="${formatRate(traslado.tasa)}" Importe="${formatMoney(traslado.importe)}"/>`),
            `    </cfdi:Traslados>`,
            `  </cfdi:Impuestos>`,
        ].join('\n');
    return [
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<cfdi:Comprobante ${comprobanteAttrs}>`,
        `  <cfdi:Emisor Rfc="${xmlAttr(input.emisor.rfc)}" Nombre="${xmlAttr(input.emisor.nombre)}" RegimenFiscal="${xmlAttr(input.emisor.regimenFiscal)}"/>`,
        `  <cfdi:Receptor Rfc="${xmlAttr(input.receptor.rfc)}" Nombre="${xmlAttr(input.receptor.nombre)}" DomicilioFiscalReceptor="${xmlAttr(input.receptor.domicilioFiscal)}" RegimenFiscalReceptor="${xmlAttr(input.receptor.regimenFiscal)}" UsoCFDI="${xmlAttr(input.receptor.usoCfdi)}"/>`,
        `  <cfdi:Conceptos>`,
        conceptos.join('\n'),
        `  </cfdi:Conceptos>`,
        impuestosXml,
        `</cfdi:Comprobante>`,
    ]
        .filter((line) => line !== '')
        .join('\n');
}
function makeTraslado(impuesto, tasa, base) {
    return {
        impuesto,
        tasa,
        base,
        importe: round2(base * tasa),
    };
}
function resolveClaveUnidad(uomName) {
    const key = String(uomName ?? '')
        .trim()
        .toUpperCase()
        .replace(/\./g, '');
    return self_invoice_constants_1.SAT_CLAVE_UNIDAD_BY_UOM[key] ?? self_invoice_constants_1.DEFAULT_SAT_CLAVE_UNIDAD;
}
function sanitizeSatClave(value) {
    return String(value ?? '').trim();
}
function xmlAttr(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
function round2(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
function round6(value) {
    return Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;
}
function formatMoney(value) {
    return round2(value).toFixed(2);
}
function formatMoney6(value) {
    const rounded = round6(value);
    return Number.isInteger(rounded) ? rounded.toFixed(2) : String(rounded);
}
function formatQty(value) {
    const rounded = round6(value);
    return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}
function formatRate(value) {
    return value.toFixed(6);
}
function formatCfdiFecha(date, timeZone = 'America/Tijuana') {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).formatToParts(date);
    const pick = (type) => parts.find((part) => part.type === type)?.value ?? '00';
    return `${pick('year')}-${pick('month')}-${pick('day')}T${pick('hour')}:${pick('minute')}:${pick('second')}`;
}
//# sourceMappingURL=self-invoice-cfdi-xml.util.js.map