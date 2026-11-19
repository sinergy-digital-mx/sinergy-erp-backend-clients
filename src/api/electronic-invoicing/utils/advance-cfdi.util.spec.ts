import {
  ADVANCE_IDENTIFICATION,
  ADVANCE_SAT_CLAVE,
  advanceCfdiFecha,
  buildAdvanceConceptCfdi,
  buildMerchandiseCfdi,
  distributeCents,
  inferIvaPercentage,
  taxableBaseOfDocument,
} from './advance-cfdi.util';

const emisor = {
  rfc: 'MZN010101AAA',
  nombre: 'MADERERIA ZONA NORTE',
  regimen: '601',
  postalCode: '22040',
};
const receptor = {
  rfc: 'XAXX010101000',
  nombre: 'CLIENTE SA',
  regimen: '601',
  postalCode: '22040',
};

describe('advance cfdi', () => {
  it('arma el anticipo con base e IVA separados', () => {
    const built = buildAdvanceConceptCfdi({
      folio: 'COT-000001',
      baseAmount: 10000,
      ivaPercentage: 8,
      usoCfdi: 'G01',
      formaPago: '03',
      metodoPago: 'PUE',
      emisor,
      receptor,
      tipoComprobante: 'I',
      descripcion: 'Anticipo del bien o servicio',
    });

    expect(built.subtotal).toBe(10000);
    expect(built.tax).toBe(800);
    expect(built.total).toBe(10800);
    expect(built.xml).toContain(`ClaveProdServ="${ADVANCE_SAT_CLAVE}"`);
    expect(built.xml).toContain(`NoIdentificacion="${ADVANCE_IDENTIFICATION}"`);
    expect(built.xml).toContain('ClaveUnidad="ACT"');
    expect(built.xml).toContain('TipoDeComprobante="I"');
  });

  it('aplica el anticipo completo y deja la mercancía en cero', () => {
    const built = buildMerchandiseCfdi({
      folio: 'OSV-000088',
      lines: [
        {
          satClave: '30103600',
          quantity: 10,
          unitPrice: 1000,
          lineDiscount: 0,
          ivaPercentage: 8,
          iepsPercentage: 0,
          unitCode: 'H87',
          unitName: 'Pieza',
          description: 'Madera',
        },
      ],
      globalDiscount: 0,
      advanceBase: 10000,
      usoCfdi: 'G01',
      formaPago: '03',
      metodoPago: 'PUE',
      emisor,
      receptor,
      relatedUuid: '11111111-1111-1111-1111-111111111111',
    });

    expect(built.subtotal).toBe(10000);
    expect(built.discount).toBe(10000);
    expect(built.tax).toBe(0);
    expect(built.total).toBe(0);
    expect(built.xml).toContain('TipoRelacion="07"');
  });

  it('cobra solo la diferencia cuando el anticipo es parcial', () => {
    const built = buildMerchandiseCfdi({
      folio: 'OSV-000089',
      lines: [
        {
          satClave: '30103600',
          quantity: 1,
          unitPrice: 10000,
          lineDiscount: 0,
          ivaPercentage: 8,
          iepsPercentage: 0,
          unitCode: 'H87',
          unitName: 'Pieza',
          description: 'Madera',
        },
      ],
      globalDiscount: 0,
      advanceBase: 4000,
      usoCfdi: 'G01',
      formaPago: '03',
      metodoPago: 'PUE',
      emisor,
      receptor,
      relatedUuid: '11111111-1111-1111-1111-111111111111',
    });

    expect(built.discount).toBe(4000);
    expect(built.tax).toBe(480);
    expect(built.total).toBe(6480);
  });

  it('escribe la fecha en hora de Tijuana', () => {
    expect(advanceCfdiFecha(new Date('2026-10-14T22:30:00.000Z'))).toBe('2026-10-14T15:30:00');
    expect(advanceCfdiFecha(new Date('2026-11-02T22:30:00.000Z'))).toBe('2026-11-02T14:30:00');
  });

  it('infiere 8% de la base gravable', () => {
    expect(inferIvaPercentage(800, taxableBaseOfDocument(10000, 0, 0))).toBe(8);
    expect(distributeCents([6000, 4000], 10000)).toEqual([6000, 4000]);
  });
});
