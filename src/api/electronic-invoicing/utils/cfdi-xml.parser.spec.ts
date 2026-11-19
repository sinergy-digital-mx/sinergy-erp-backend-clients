import { parseCfdiXmlForPdf } from './cfdi-xml.parser';

const CFDI_WITH_CONCEPT_AND_DOCUMENT_TAXES = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0" Serie="A" Folio="1042"
  Fecha="2026-10-31T10:00:00" SubTotal="1000.00" Total="1160.00" Moneda="MXN"
  FormaPago="03" MetodoPago="PUE" TipoDeComprobante="I" Exportacion="01" LugarExpedicion="22040">
  <cfdi:Emisor Rfc="EKU9003173C9" Nombre="EMISOR SA" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="XAXX010101000" Nombre="PUBLICO EN GENERAL" UsoCFDI="S01"
    DomicilioFiscalReceptor="22040" RegimenFiscalReceptor="616"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="01010101" Cantidad="1" ClaveUnidad="H87" Unidad="Pieza"
      Descripcion="Producto con IVA" ValorUnitario="1000.00" Importe="1000.00" ObjetoImp="02">
      <cfdi:Impuestos>
        <cfdi:Traslados>
          <cfdi:Traslado Base="1000.00" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="160.00"/>
        </cfdi:Traslados>
      </cfdi:Impuestos>
    </cfdi:Concepto>
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="160.00">
    <cfdi:Traslados>
      <cfdi:Traslado Base="1000.00" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="160.00"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
</cfdi:Comprobante>`;

describe('parseCfdiXmlForPdf', () => {
  it('lee el IVA del Impuestos del comprobante, no el del concepto', () => {
    const parsed = parseCfdiXmlForPdf(CFDI_WITH_CONCEPT_AND_DOCUMENT_TAXES);

    expect(parsed.subTotal).toBe('1000.00');
    expect(parsed.total).toBe('1160.00');
    expect(parsed.totalImpuestosTrasladados).toBe('160.00');
    expect(parsed.conceptos).toHaveLength(1);
    expect(parsed.conceptos[0].traslados).toEqual([
      {
        impuesto: '002',
        tipoFactor: 'Tasa',
        tasaOCuota: '0.160000',
        base: '1000.00',
        importe: '160.00',
      },
    ]);
  });

  it('suma los traslados del concepto si el comprobante no trae TotalImpuestosTrasladados', () => {
    const xml = CFDI_WITH_CONCEPT_AND_DOCUMENT_TAXES.replace(
      ' TotalImpuestosTrasladados="160.00"',
      '',
    );
    const parsed = parseCfdiXmlForPdf(xml);
    expect(parsed.totalImpuestosTrasladados).toBe('160.00');
  });
});
