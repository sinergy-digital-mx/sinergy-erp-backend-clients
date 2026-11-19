import { buildPaymentComplementXml, resolveFechaPago, taxesFromIncomeCfdi } from './payment-cfdi.util';
import { ParsedCfdi } from './cfdi-xml.parser';

const base = {
  series: 'CP',
  folio: 'OSV-000019',
  fecha: '2026-10-09T14:00:00',
  lugarExpedicion: '22040',
  emisor: { rfc: 'VTI040608HP6', nombre: 'LA VERDULERIA', regimen: '601' },
  receptor: {
    rfc: 'XAXX010101000',
    nombre: 'PUBLICO EN GENERAL',
    regimen: '616',
    postalCode: '22040',
  },
  related: {
    uuid: '6C3C0C87-1111-2222-3333-444444444444',
    serie: 'A',
    folio: '19',
    moneda: 'MXN',
    total: 1160,
    fecha: '2026-08-07T10:00:00',
  },
  taxes: [
    {
      impuesto: '002' as const,
      tipoFactor: 'Tasa' as const,
      tasaOCuota: '0.160000',
      base: 1000,
      importe: 160,
    },
  ],
  objetoImp: '02' as const,
};

describe('buildPaymentComplementXml', () => {
  it('arma un CFDI tipo P que liquida la factura en dos pagos', () => {
    const built = buildPaymentComplementXml({
      ...base,
      payments: [
        { amount: 500, paymentDate: '2026-10-01', formaPago: '01' },
        { amount: 660, paymentDate: '2026-10-09', formaPago: '03', reference: 'SPEI-1' },
      ],
    });

    expect(built.amount).toBe(1160);
    expect(built.xml).toContain('TipoDeComprobante="P"');
    expect(built.xml).toContain('Moneda="XXX"');
    expect(built.xml).toContain('UsoCFDI="CP01"');
    expect(built.xml).toContain('xmlns:pago20="http://www.sat.gob.mx/Pagos20"');
    expect(built.xml).not.toContain('FormaPago=');
    expect(built.xml).not.toContain('MetodoPago=');
    expect(built.xml).toContain('MontoTotalPagos="1160.00"');
    expect(built.xml).toContain('TotalTrasladosBaseIVA16="1000.00"');
    expect(built.xml).toContain('TotalTrasladosImpuestoIVA16="160.00"');
    expect(built.xml).toContain('NumParcialidad="1"');
    expect(built.xml).toContain('ImpSaldoAnt="1160.00"');
    expect(built.xml).toContain('ImpPagado="500.00"');
    expect(built.xml).toContain('ImpSaldoInsoluto="660.00"');
    expect(built.xml).toContain('NumParcialidad="2"');
    expect(built.xml).toContain('ImpSaldoInsoluto="0.00"');
    expect(built.xml).toContain('NumOperacion="SPEI-1"');
    expect(built.xml).toContain('BaseDR="431.03"');
    expect(built.xml).toContain('BaseDR="568.97"');
  });

  it('rechaza un pago que no cubre la factura', () => {
    expect(() =>
      buildPaymentComplementXml({
        ...base,
        payments: [{ amount: 100, paymentDate: '2026-10-01', formaPago: '03' }],
      }),
    ).toThrow('no cubren el total');
  });
});

describe('resolveFechaPago', () => {
  it('no deja la fecha del pago después del comprobante ni antes de la factura', () => {
    expect(resolveFechaPago('2026-10-01', '2026-08-07T10:00:00', '2026-10-09T14:00:00')).toBe(
      '2026-10-01T12:00:00',
    );
    expect(resolveFechaPago('2026-07-01', '2026-08-07T10:00:00', '2026-10-09T14:00:00')).toBe(
      '2026-08-07T10:00:00',
    );
    expect(resolveFechaPago('2026-10-20', '2026-08-07T10:00:00', '2026-10-09T14:00:00')).toBe(
      '2026-10-09T14:00:00',
    );
  });
});

describe('taxesFromIncomeCfdi', () => {
  it('suma el IVA de los conceptos', () => {
    const parsed = {
      conceptos: [
        {
          objetoImp: '02',
          traslados: [
            { impuesto: '002', tipoFactor: 'Tasa', tasaOCuota: '0.160000', base: '500.00', importe: '80.00' },
          ],
        },
        {
          objetoImp: '02',
          traslados: [
            { impuesto: '002', tipoFactor: 'Tasa', tasaOCuota: '0.160000', base: '500.00', importe: '80.00' },
          ],
        },
      ],
    } as ParsedCfdi;
    expect(taxesFromIncomeCfdi(parsed)).toEqual({
      objetoImp: '02',
      taxes: [
        {
          impuesto: '002',
          tipoFactor: 'Tasa',
          tasaOCuota: '0.160000',
          base: 1000,
          importe: 160,
        },
      ],
    });
  });
});
