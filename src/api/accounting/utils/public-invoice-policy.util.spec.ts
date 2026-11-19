import {
  automaticRunPeriod,
  isOrderMonthClosed,
  readPublicInvoicePolicy,
  resolvePublicInvoiceSettings,
  zonedTimeToUtc,
} from './public-invoice-policy.util';

const HERMOSILLO = 'America/Hermosillo';

describe('public-invoice-policy.util', () => {
  const policy = readPublicInvoicePolicy({
    global_invoice_auto_enabled: true,
    global_invoice_block_after_month: true,
    global_invoice_hour: 9,
    global_invoice_timezone: HERMOSILLO,
  });

  it('convierte las 9:00 de Hermosillo a UTC', () => {
    expect(zonedTimeToUtc(2026, 11, 30, 9, 0, HERMOSILLO).toISOString()).toBe(
      '2026-11-30T16:00:00.000Z',
    );
  });

  it('deja facturar la orden hasta las 9:00 del último día de su mes', () => {
    const created = new Date('2026-11-08T15:00:00.000Z');
    expect(isOrderMonthClosed(created, policy, new Date('2026-11-30T15:59:00.000Z'))).toBe(false);
    expect(isOrderMonthClosed(created, policy, new Date('2026-11-30T16:00:00.000Z'))).toBe(true);
    expect(isOrderMonthClosed(created, policy, new Date('2026-12-01T16:00:00.000Z'))).toBe(true);
  });

  it('no cierra el mes si la razón social no lo tiene activo', () => {
    const open = readPublicInvoicePolicy({
      global_invoice_block_after_month: false,
      global_invoice_hour: 9,
      global_invoice_timezone: HERMOSILLO,
    });
    expect(
      isOrderMonthClosed('2026-11-08T15:00:00.000Z', open, new Date('2026-12-02T00:00:00.000Z')),
    ).toBe(false);
  });

  it('corre el automático el último día, desde la hora configurada', () => {
    expect(automaticRunPeriod(policy, new Date('2026-11-30T15:00:00.000Z'))).toBeNull();
    expect(automaticRunPeriod(policy, new Date('2026-11-29T16:00:00.000Z'))).toBeNull();
    expect(automaticRunPeriod(policy, new Date('2026-11-30T16:00:00.000Z'))).toEqual({
      year: 2026,
      month: 11,
    });
    expect(automaticRunPeriod(policy, new Date('2026-11-30T23:30:00.000Z'))).toEqual({
      year: 2026,
      month: 11,
    });
    expect(automaticRunPeriod(policy, new Date('2026-12-01T16:00:00.000Z'))).toBeNull();
  });

  it('completa hora y zona cuando se enciende el cierre', () => {
    expect(
      resolvePublicInvoiceSettings({
        global_invoice_auto_enabled: true,
        global_invoice_block_after_month: false,
        global_invoice_hour: null,
        global_invoice_timezone: null,
      }),
    ).toEqual({
      global_invoice_auto_enabled: true,
      global_invoice_block_after_month: false,
      global_invoice_hour: 9,
      global_invoice_timezone: 'America/Tijuana',
    });
  });
});
