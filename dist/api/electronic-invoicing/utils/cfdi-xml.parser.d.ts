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
export declare function normalizeCfdiXml(raw: string): string;
export declare function parseCfdiXmlForPdf(xml: string): ParsedCfdi;
export declare function parseStampedCfdiXml(xml: string): ParsedCfdi;
