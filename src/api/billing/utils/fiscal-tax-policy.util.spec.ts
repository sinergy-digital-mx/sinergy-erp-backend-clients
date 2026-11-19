import {
  clampTaxPercentages,
  columnsWithoutDisabledIeps,
  isFiscalFlagOn,
  loadTenantIepsEnabled,
  readFiscalTaxPolicy,
} from './fiscal-tax-policy.util';

describe('fiscal tax policy', () => {
  it('trata 0 y false como apagado', () => {
    expect(isFiscalFlagOn(0, true)).toBe(false);
    expect(isFiscalFlagOn(false, true)).toBe(false);
    expect(isFiscalFlagOn('0', true)).toBe(false);
    expect(isFiscalFlagOn(1, false)).toBe(true);
    expect(isFiscalFlagOn(null, true)).toBe(true);
  });

  it('anula IEPS cuando la razón social no lo tiene', () => {
    const policy = readFiscalTaxPolicy({ iva_enabled: 1, ieps_enabled: 0 });
    expect(clampTaxPercentages(16, 8, policy)).toEqual({
      ivaPercentage: 16,
      iepsPercentage: 0,
    });
  });

  it('anula IVA e IEPS cuando ambos están apagados', () => {
    const policy = readFiscalTaxPolicy({ iva_enabled: 0, ieps_enabled: 0 });
    expect(clampTaxPercentages(16, 8, policy)).toEqual({
      ivaPercentage: 0,
      iepsPercentage: 0,
    });
  });

  it('la organización no usa IEPS si ninguna razón activa lo tiene', async () => {
    const db = {
      query: async (sql: string) => {
        if (sql.includes("status = 'active'")) {
          return [{ ieps_enabled: 0 }, { ieps_enabled: 0 }];
        }
        return [{ ieps_enabled: 1 }];
      },
    };
    await expect(loadTenantIepsEnabled(db, 'org')).resolves.toBe(false);
  });

  it('la organización usa IEPS si una razón activa lo tiene', async () => {
    const db = {
      query: async () => [{ ieps_enabled: 0 }, { ieps_enabled: 1 }],
    };
    await expect(loadTenantIepsEnabled(db, 'org')).resolves.toBe(true);
  });

  it('quita columnas IEPS del Excel cuando la opción está apagada', () => {
    const columns = [
      { key: 'iva_total', header: 'IVA' },
      { key: 'ieps_total', header: 'IEPS' },
      { key: 'total', header: 'Total' },
    ];
    expect(columnsWithoutDisabledIeps(columns, false).map((column) => column.key)).toEqual([
      'iva_total',
      'total',
    ]);
  });
});
