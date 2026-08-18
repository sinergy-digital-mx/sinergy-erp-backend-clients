export interface CfdiConceptoTraslado {
  impuesto: string;
  tipoFactor: string;
  tasaOCuota: string;
  base: string;
  importe: string;
}

export interface CfdiConcepto {
  cantidad: string;
  claveUnidad: string;
  unidad: string;
  claveProdServ: string;
  descripcion: string;
  valorUnitario: string;
  importe: string;
  descuento: string;
  objetoImp: string;
  traslados: CfdiConceptoTraslado[];
}

export interface ParsedCfdi {
  version: string;
  serie: string;
  folio: string;
  fecha: string;
  lugarExpedicion: string;
  tipoComprobante: string;
  subTotal: string;
  descuento: string;
  total: string;
  moneda: string;
  formaPago: string;
  metodoPago: string;
  exportacion: string;
  noCertificado: string;
  sello: string;
  emisor: {
    rfc: string;
    nombre: string;
    regimenFiscal: string;
  };
  receptor: {
    rfc: string;
    nombre: string;
    usoCfdi: string;
    domicilioFiscalReceptor: string;
    regimenFiscalReceptor: string;
  };
  conceptos: CfdiConcepto[];
  totalImpuestosTrasladados: string;
  timbre: {
    uuid: string;
    fechaTimbrado: string;
    rfcProvCertif: string;
    selloCFD: string;
    selloSAT: string;
    noCertificadoSAT: string;
  };
}

function readAttr(tag: string, name: string): string {
  const doubleQuoted = new RegExp(`\\b${name}="([^"]*)"`, 'i').exec(tag);
  if (doubleQuoted) {
    return doubleQuoted[1];
  }
  const singleQuoted = new RegExp(`\\b${name}='([^']*)'`, 'i').exec(tag);
  return singleQuoted?.[1] ?? '';
}

function readFirstTag(xml: string, localName: string): string {
  const match = new RegExp(`<(?:[\\w.-]+:)?${localName}\\b[^>]*>`, 'i').exec(xml);
  return match?.[0] ?? '';
}

function readAllTags(xml: string, localName: string): string[] {
  const regex = new RegExp(`<(?:[\\w.-]+:)?${localName}\\b[^>]*(?:/>|>[\\s\\S]*?</(?:[\\w.-]+:)?${localName}>)`, 'gi');
  return xml.match(regex) ?? [];
}

function parseConceptoTraslados(conceptoXml: string): CfdiConceptoTraslado[] {
  const trasladosBlock = readFirstTag(conceptoXml, 'Traslados');
  if (!trasladosBlock) {
    return [];
  }

  return readAllTags(trasladosBlock, 'Traslado').map((tag) => ({
    impuesto: readAttr(tag, 'Impuesto'),
    tipoFactor: readAttr(tag, 'TipoFactor'),
    tasaOCuota: readAttr(tag, 'TasaOCuota'),
    base: readAttr(tag, 'Base'),
    importe: readAttr(tag, 'Importe'),
  }));
}

const EMPTY_TIMBRE: ParsedCfdi['timbre'] = {
  uuid: '',
  fechaTimbrado: '',
  rfcProvCertif: '',
  selloCFD: '',
  selloSAT: '',
  noCertificadoSAT: '',
};

function unescapeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Finkok a veces entrega el CFDI en base64 o con entidades HTML (`&lt;cfdi:`). */
export function normalizeCfdiXml(raw: string): string {
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

/** Parsea XML timbrado o sin timbrar (vista previa PDF en ambiente demo). */
export function parseCfdiXmlForPdf(xml: string): ParsedCfdi {
  const normalized = normalizeCfdiXml(xml);
  const comprobanteTag = readFirstTag(normalized, 'Comprobante');
  if (!comprobanteTag) {
    throw new Error('XML CFDI inválido: no se encontró el nodo Comprobante');
  }

  const emisorTag = readFirstTag(normalized, 'Emisor');
  const receptorTag = readFirstTag(normalized, 'Receptor');
  const timbreTag = readFirstTag(normalized, 'TimbreFiscalDigital');
  const impuestosTag = readFirstTag(normalized, 'Impuestos');
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
    traslados: parseConceptoTraslados(conceptoTag),
  }));

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
    totalImpuestosTrasladados: readAttr(impuestosTag, 'TotalImpuestosTrasladados'),
    timbre,
  };
}

export function parseStampedCfdiXml(xml: string): ParsedCfdi {
  const parsed = parseCfdiXmlForPdf(xml);
  if (!parsed.timbre.uuid) {
    throw new Error('XML CFDI inválido: no se encontró TimbreFiscalDigital');
  }
  return parsed;
}
