import { buildSelfInvoiceCfdiXml } from '../self-invoice-cfdi-xml.util';

describe('buildSelfInvoiceCfdiXml', () => {
  it('arma un CFDI 4.0 con receptor, total e IVA', () => {
    const xml = buildSelfInvoiceCfdiXml({
      serie: 'MZN',
      folio: '12',
      fecha: '2026-08-27T10:00:00',
      formaPago: '01',
      metodoPago: 'PUE',
      lugarExpedicion: '22040',
      emisor: {
        rfc: 'EKU9003173C9',
        nombre: 'ESCUELA KEMPER URGATE',
        regimenFiscal: '601',
      },
      receptor: {
        rfc: 'SSS2410213X9',
        nombre: 'SINERGY SW SOLUTIONS',
        domicilioFiscal: '22040',
        regimenFiscal: '601',
        usoCfdi: 'G03',
      },
      lines: [
        {
          description: 'TABLA PINO',
          quantity: 2,
          unitPrice: 100,
          discountUnit: 0,
          ivaPercentage: 16,
          iepsPercentage: 0,
          satClave: '31201610',
          uomName: 'Pieza',
        },
      ],
    });

    expect(xml).toContain('Version="4.0"');
    expect(xml).toContain('Rfc="SSS2410213X9"');
    expect(xml).toContain('DomicilioFiscalReceptor="22040"');
    expect(xml).toContain('UsoCFDI="G03"');
    expect(xml).toContain('Total="232.00"');
    expect(xml).toContain('TasaOCuota="0.160000"');
    expect(xml).not.toContain('Sello=');
  });
});
