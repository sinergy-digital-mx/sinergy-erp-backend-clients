"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeCfdiXml = normalizeCfdiXml;
exports.parseCfdiXmlForPdf = parseCfdiXmlForPdf;
exports.parseStampedCfdiXml = parseStampedCfdiXml;
function readAttr(tag, name) {
    const doubleQuoted = new RegExp(`\\b${name}="([^"]*)"`, 'i').exec(tag);
    if (doubleQuoted) {
        return doubleQuoted[1];
    }
    const singleQuoted = new RegExp(`\\b${name}='([^']*)'`, 'i').exec(tag);
    return singleQuoted?.[1] ?? '';
}
function readFirstTag(xml, localName) {
    const match = new RegExp(`<(?:[\\w.-]+:)?${localName}\\b[^>]*>`, 'i').exec(xml);
    return match?.[0] ?? '';
}
function readAllOpeningTags(xml, localName) {
    return xml.match(new RegExp(`<(?:[\\w.-]+:)?${localName}\\b[^>]*>`, 'gi')) ?? [];
}
function readAllTags(xml, localName) {
    const regex = new RegExp(`<(?:[\\w.-]+:)?${localName}\\b[^>]*(?:/>|>[\\s\\S]*?</(?:[\\w.-]+:)?${localName}>)`, 'gi');
    return xml.match(regex) ?? [];
}
function readComprobanteImpuestosTag(xml) {
    const tags = readAllOpeningTags(xml, 'Impuestos');
    const withTotal = [...tags].reverse().find((tag) => /TotalImpuestosTrasladados=/i.test(tag));
    return withTotal ?? tags[tags.length - 1] ?? '';
}
function parseTraslados(xml) {
    return readAllTags(xml, 'Traslado').map((tag) => ({
        impuesto: readAttr(tag, 'Impuesto'),
        tipoFactor: readAttr(tag, 'TipoFactor'),
        tasaOCuota: readAttr(tag, 'TasaOCuota'),
        base: readAttr(tag, 'Base'),
        importe: readAttr(tag, 'Importe'),
    }));
}
function sumTrasladados(traslados) {
    const cents = traslados.reduce((acc, item) => acc + Math.round((Number(item.importe) || 0) * 100), 0);
    return cents ? (cents / 100).toFixed(2) : '';
}
const EMPTY_TIMBRE = {
    uuid: '',
    fechaTimbrado: '',
    rfcProvCertif: '',
    selloCFD: '',
    selloSAT: '',
    noCertificadoSAT: '',
};
function unescapeXmlEntities(value) {
    return value
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&');
}
function normalizeCfdiXml(raw) {
    let xml = raw.trim();
    if (!xml) {
        return xml;
    }
    if (xml.includes('&lt;')) {
        xml = unescapeXmlEntities(xml);
    }
    const compact = xml.replace(/\s/g, '');
    if (!xml.includes('<') && /^[A-Za-z0-9+/=]+$/.test(compact)) {
        xml = Buffer.from(compact, 'base64').toString('utf8').trim();
        if (xml.includes('&lt;')) {
            xml = unescapeXmlEntities(xml);
        }
    }
    return xml;
}
function parseCfdiXmlForPdf(xml) {
    const normalized = normalizeCfdiXml(xml);
    const comprobanteTag = readFirstTag(normalized, 'Comprobante');
    if (!comprobanteTag) {
        throw new Error('XML CFDI inválido: no se encontró el nodo Comprobante');
    }
    const emisorTag = readFirstTag(normalized, 'Emisor');
    const receptorTag = readFirstTag(normalized, 'Receptor');
    const timbreTag = readFirstTag(normalized, 'TimbreFiscalDigital');
    const impuestosTag = readComprobanteImpuestosTag(normalized);
    const conceptos = readAllTags(normalized, 'Concepto').map((conceptoTag) => ({
        cantidad: readAttr(conceptoTag, 'Cantidad'),
        claveUnidad: readAttr(conceptoTag, 'ClaveUnidad'),
        unidad: readAttr(conceptoTag, 'Unidad'),
        claveProdServ: readAttr(conceptoTag, 'ClaveProdServ'),
        descripcion: readAttr(conceptoTag, 'Descripcion'),
        valorUnitario: readAttr(conceptoTag, 'ValorUnitario'),
        importe: readAttr(conceptoTag, 'Importe'),
        descuento: readAttr(conceptoTag, 'Descuento'),
        objetoImp: readAttr(conceptoTag, 'ObjetoImp'),
        traslados: parseTraslados(conceptoTag),
    }));
    const totalImpuestosTrasladados = readAttr(impuestosTag, 'TotalImpuestosTrasladados') ||
        sumTrasladados(conceptos.flatMap((concepto) => concepto.traslados));
    const timbre = timbreTag
        ? {
            uuid: readAttr(timbreTag, 'UUID'),
            fechaTimbrado: readAttr(timbreTag, 'FechaTimbrado'),
            rfcProvCertif: readAttr(timbreTag, 'RfcProvCertif'),
            selloCFD: readAttr(timbreTag, 'SelloCFD'),
            selloSAT: readAttr(timbreTag, 'SelloSAT'),
            noCertificadoSAT: readAttr(timbreTag, 'NoCertificadoSAT'),
        }
        : EMPTY_TIMBRE;
    return {
        version: readAttr(comprobanteTag, 'Version'),
        serie: readAttr(comprobanteTag, 'Serie'),
        folio: readAttr(comprobanteTag, 'Folio'),
        fecha: readAttr(comprobanteTag, 'Fecha'),
        lugarExpedicion: readAttr(comprobanteTag, 'LugarExpedicion'),
        tipoComprobante: readAttr(comprobanteTag, 'TipoDeComprobante'),
        subTotal: readAttr(comprobanteTag, 'SubTotal'),
        descuento: readAttr(comprobanteTag, 'Descuento'),
        total: readAttr(comprobanteTag, 'Total'),
        moneda: readAttr(comprobanteTag, 'Moneda'),
        formaPago: readAttr(comprobanteTag, 'FormaPago'),
        metodoPago: readAttr(comprobanteTag, 'MetodoPago'),
        exportacion: readAttr(comprobanteTag, 'Exportacion'),
        noCertificado: readAttr(comprobanteTag, 'NoCertificado'),
        sello: readAttr(comprobanteTag, 'Sello'),
        emisor: {
            rfc: readAttr(emisorTag, 'Rfc'),
            nombre: readAttr(emisorTag, 'Nombre'),
            regimenFiscal: readAttr(emisorTag, 'RegimenFiscal'),
        },
        receptor: {
            rfc: readAttr(receptorTag, 'Rfc'),
            nombre: readAttr(receptorTag, 'Nombre'),
            usoCfdi: readAttr(receptorTag, 'UsoCFDI'),
            domicilioFiscalReceptor: readAttr(receptorTag, 'DomicilioFiscalReceptor'),
            regimenFiscalReceptor: readAttr(receptorTag, 'RegimenFiscalReceptor'),
        },
        conceptos,
        totalImpuestosTrasladados,
        timbre,
    };
}
function parseStampedCfdiXml(xml) {
    const parsed = parseCfdiXmlForPdf(xml);
    if (!parsed.timbre.uuid) {
        throw new Error('XML CFDI inválido: no se encontró TimbreFiscalDigital');
    }
    return parsed;
}
//# sourceMappingURL=cfdi-xml.parser.js.map