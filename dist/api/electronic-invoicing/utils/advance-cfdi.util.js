"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADVANCE_RELATION_TYPE = exports.ADVANCE_IDENTIFICATION = exports.ADVANCE_APPLICATION_DESCRIPTION = exports.ADVANCE_DESCRIPTION = exports.ADVANCE_UNIT_NAME = exports.ADVANCE_UNIT_CODE = exports.ADVANCE_SAT_CLAVE = void 0;
exports.inferIvaPercentage = inferIvaPercentage;
exports.taxableBaseOfDocument = taxableBaseOfDocument;
exports.distributeCents = distributeCents;
exports.buildAdvanceConceptCfdi = buildAdvanceConceptCfdi;
exports.buildMerchandiseCfdi = buildMerchandiseCfdi;
exports.fiveDigitPostalCode = fiveDigitPostalCode;
exports.resolveSatUnit = resolveSatUnit;
exports.ADVANCE_SAT_CLAVE = '84111506';
exports.ADVANCE_UNIT_CODE = 'ACT';
exports.ADVANCE_UNIT_NAME = 'Actividad';
exports.ADVANCE_DESCRIPTION = 'Anticipo del bien o servicio';
exports.ADVANCE_APPLICATION_DESCRIPTION = 'Aplicación de anticipo';
exports.ADVANCE_IDENTIFICATION = 'anticipo_CFDI';
exports.ADVANCE_RELATION_TYPE = '07';
function cents(value) {
    return Math.round((Number(value) || 0) * 100);
}
function fromCents(value) {
    return Math.round(value) / 100;
}
function money(value) {
    return fromCents(cents(value)).toFixed(2);
}
function escapeXml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
function cfdiFechaLocal(now = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
function tasa(percent) {
    return (percent / 100).toFixed(6);
}
function inferIvaPercentage(ivaTotal, taxableBase) {
    if (taxableBase <= 0.009 || ivaTotal <= 0.009) {
        return 0;
    }
    const rate = (ivaTotal / taxableBase) * 100;
    if (Math.abs(rate - 8) < 0.25)
        return 8;
    if (Math.abs(rate - 16) < 0.25)
        return 16;
    return Math.round(rate * 100) / 100;
}
function taxableBaseOfDocument(subtotal, discountTotal, globalDiscount) {
    return fromCents(Math.max(cents(subtotal) - cents(discountTotal) - cents(globalDiscount), 0));
}
function relacionXml(uuid) {
    const value = uuid?.trim();
    if (!value)
        return '';
    return `
  <cfdi:CfdiRelacionados TipoRelacion="${exports.ADVANCE_RELATION_TYPE}">
    <cfdi:CfdiRelacionado UUID="${escapeXml(value)}"/>
  </cfdi:CfdiRelacionados>`;
}
function comprobanteShell(params) {
    const series = params.series?.trim();
    const serieAttr = series ? ` Serie="${escapeXml(series)}"` : '';
    const discountAttr = params.discount > 0 ? ` Descuento="${money(params.discount)}"` : '';
    return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd" Version="4.0"${serieAttr} Folio="${escapeXml(params.folio)}" Fecha="${cfdiFechaLocal()}" SubTotal="${money(params.subtotal)}"${discountAttr} Total="${money(params.total)}" Moneda="MXN" TipoDeComprobante="${params.tipo}" Exportacion="01" MetodoPago="${escapeXml(params.metodoPago)}" FormaPago="${escapeXml(params.formaPago)}" LugarExpedicion="${escapeXml(params.emisor.postalCode)}">${relacionXml(params.relatedUuid)}
  <cfdi:Emisor Rfc="${escapeXml(params.emisor.rfc)}" Nombre="${escapeXml(params.emisor.nombre)}" RegimenFiscal="${escapeXml(params.emisor.regimen)}"/>
  <cfdi:Receptor Rfc="${escapeXml(params.receptor.rfc)}" Nombre="${escapeXml(params.receptor.nombre)}" DomicilioFiscalReceptor="${escapeXml(params.receptor.postalCode)}" RegimenFiscalReceptor="${escapeXml(params.receptor.regimen)}" UsoCFDI="${escapeXml(params.usoCfdi)}"/>
  <cfdi:Conceptos>${params.conceptosXml}
  </cfdi:Conceptos>${params.impuestosXml}
</cfdi:Comprobante>`;
}
function taxBlock(base, ivaPercentage, iepsPercentage) {
    const taxes = [];
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
        .map((tax) => `          <cfdi:Traslado Base="${money(tax.base)}" Impuesto="${tax.impuesto}" TipoFactor="Tasa" TasaOCuota="${tasa(tax.tasa)}" Importe="${money(tax.importe)}"/>`)
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
function groupedTaxesXml(taxes) {
    if (!taxes.length)
        return '';
    const grouped = new Map();
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
        .map((row) => `      <cfdi:Traslado Base="${money(row.base)}" Impuesto="${row.impuesto}" TipoFactor="Tasa" TasaOCuota="${tasa(row.tasa)}" Importe="${money(row.importe)}"/>`)
        .join('\n');
    return `
  <cfdi:Impuestos TotalImpuestosTrasladados="${money(total)}">
    <cfdi:Traslados>
${xmlRows}
    </cfdi:Traslados>
  </cfdi:Impuestos>`;
}
function distributeCents(weights, amountCents) {
    const safeWeights = weights.map((weight) => Math.max(cents(weight), 0));
    const totalWeight = safeWeights.reduce((sum, weight) => sum + weight, 0);
    if (amountCents <= 0 || totalWeight <= 0) {
        return weights.map(() => 0);
    }
    const shares = safeWeights.map((weight) => Math.floor((amountCents * weight) / totalWeight));
    let used = shares.reduce((sum, share) => sum + share, 0);
    for (let i = shares.length - 1; i >= 0 && used < amountCents; i -= 1) {
        if (safeWeights[i] <= 0)
            continue;
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
function buildAdvanceConceptCfdi(input) {
    const base = fromCents(cents(input.baseAmount));
    if (base <= 0) {
        throw new Error('El anticipo debe ser mayor a cero');
    }
    const tax = taxBlock(base, input.ivaPercentage, 0);
    const taxTotal = fromCents(tax.taxes.reduce((sum, row) => sum + cents(row.importe), 0));
    const total = fromCents(cents(base) + cents(taxTotal));
    const objeto = tax.taxes.length ? '02' : '01';
    const concepto = `
    <cfdi:Concepto ClaveProdServ="${exports.ADVANCE_SAT_CLAVE}" NoIdentificacion="${exports.ADVANCE_IDENTIFICATION}" Cantidad="1.000000" ClaveUnidad="${exports.ADVANCE_UNIT_CODE}" Unidad="${exports.ADVANCE_UNIT_NAME}" Descripcion="${escapeXml(input.descripcion)}" ValorUnitario="${money(base)}" Importe="${money(base)}" ObjetoImp="${objeto}">${tax.xml}
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
            conceptosXml: concepto,
            impuestosXml: groupedTaxesXml(tax.taxes),
        }),
        subtotal: base,
        discount: 0,
        tax: taxTotal,
        total,
    };
}
function buildMerchandiseCfdi(input) {
    if (!input.lines.length) {
        throw new Error('La orden no tiene líneas para facturar');
    }
    const ivaRates = [...new Set(input.lines.map((line) => Number(line.ivaPercentage) || 0))];
    if (ivaRates.length > 1) {
        throw new Error('El anticipo solo se aplica cuando todas las líneas tienen el mismo IVA');
    }
    const ivaPercentage = ivaRates[0] ?? 0;
    const nets = input.lines.map((line) => fromCents(Math.max(cents(line.quantity * line.unitPrice) - cents(line.lineDiscount), 0)));
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
function fiveDigitPostalCode(value) {
    const digits = String(value ?? '').replace(/\D/g, '');
    return digits.length >= 5 ? digits.slice(0, 5) : '';
}
function resolveSatUnit(unitName, itemKind) {
    const normalized = String(unitName ?? '')
        .trim()
        .toUpperCase()
        .replace(/\./g, '');
    const service = itemKind === 'service' ||
        ['E48', 'SERVICIO', 'SERVICIOS', 'SERVICE', 'SERV'].includes(normalized);
    if (service) {
        return { code: 'E48', name: unitName?.trim() || 'Servicio' };
    }
    return { code: 'H87', name: unitName?.trim() || 'Pieza' };
}
//# sourceMappingURL=advance-cfdi.util.js.map