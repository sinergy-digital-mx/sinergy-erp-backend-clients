import { BadRequestException } from '@nestjs/common';
import {
  assertExchangeRateIfNeeded,
  computePurchaseOrderRealCost,
} from './purchase-order-real-cost.util';

describe('computePurchaseOrderRealCost', () => {
  it('repite la hoja Encino: valor aduana, GTOS% y costo real USD/MXN', () => {
    const header = computePurchaseOrderRealCost({
      payment_currency: 'USD',
      customs_exchange_rate: 16.9593,
      extras: [{ amount: 23295.01, currency: 'MXN' }],
      lines: [{ id: 'aduana', quantity: 1, vendor_unit_cost: 24600.22 }],
    });

    expect(header.has_real_cost).toBe(true);
    expect(header.merchandise_mxn).toBe(417202.51);
    expect(header.extras_mxn).toBe(23295.01);
    expect(header.increment_percentage).toBeCloseTo(5.58, 2);

    const allocatedExtra = 1.8 * 16.9593 * header.increment_ratio;
    const unit = computePurchaseOrderRealCost({
      payment_currency: 'USD',
      customs_exchange_rate: 16.9593,
      extras: [{ amount: allocatedExtra, currency: 'MXN' }],
      lines: [{ id: 'en1c', quantity: 1, vendor_unit_cost: 1.8 }],
    });

    expect(unit.lines[0].real_unit_cost_usd).toBeCloseTo(1.8 * (1 + header.increment_ratio), 3);
    expect(unit.lines[0].real_unit_cost_mxn).toBeCloseTo(32.23, 2);
  });

  it('acepta cualquier cantidad de gastos libres (conceptos nuevos)', () => {
    const extras = [
      { amount: 336, currency: 'MXN' as const },
      { amount: 995, currency: 'MXN' as const },
      { amount: 2800, currency: 'MXN' as const },
      { amount: 4239.83, currency: 'MXN' as const },
      { amount: 4155.03, currency: 'MXN' as const },
      { amount: 6529.33, currency: 'MXN' as const },
      { amount: 4239.83, currency: 'MXN' as const },
      { amount: 1500, currency: 'MXN' as const },
    ];

    const result = computePurchaseOrderRealCost({
      payment_currency: 'USD',
      customs_exchange_rate: 16.9593,
      extras,
      lines: [{ id: 'en1', quantity: 100, vendor_unit_cost: 2.215 }],
    });

    expect(result.has_real_cost).toBe(true);
    expect(result.extras_mxn).toBe(24795.02);
    expect(result.lines[0].real_unit_cost_usd).toBeGreaterThan(2.215);
  });

  it('sin T.C. ni gastos no calcula costo real', () => {
    const result = computePurchaseOrderRealCost({
      payment_currency: 'USD',
      customs_exchange_rate: null,
      extras: [],
      lines: [{ id: 'a', quantity: 10, vendor_unit_cost: 1.8 }],
    });

    expect(result.has_real_cost).toBe(false);
    expect(result.lines[0].real_unit_cost_usd).toBeNull();
    expect(result.lines[0].real_unit_cost_mxn).toBeNull();
  });

  it('solo T.C. convierte el costo proveedor a ambas monedas sin incremento', () => {
    const result = computePurchaseOrderRealCost({
      payment_currency: 'USD',
      customs_exchange_rate: 16.9593,
      extras: [],
      lines: [{ id: 'a', quantity: 10, vendor_unit_cost: 1.8 }],
    });

    expect(result.has_real_cost).toBe(true);
    expect(result.increment_percentage).toBe(0);
    expect(result.lines[0].real_unit_cost_usd).toBe(1.8);
    expect(result.lines[0].real_unit_cost_mxn).toBeCloseTo(1.8 * 16.9593, 4);
  });

  it('exige T.C. si hay gastos en moneda distinta a la OC', () => {
    expect(() =>
      assertExchangeRateIfNeeded('USD', [{ currency: 'MXN' }], null),
    ).toThrow(BadRequestException);
  });

  it('OC en MXN con gastos MXN calcula real_mxn sin T.C.', () => {
    const result = computePurchaseOrderRealCost({
      payment_currency: 'MXN',
      customs_exchange_rate: null,
      extras: [{ amount: 100, currency: 'MXN' }],
      lines: [{ id: 'a', quantity: 10, vendor_unit_cost: 20 }],
    });

    expect(result.has_real_cost).toBe(true);
    expect(result.increment_percentage).toBe(50);
    expect(result.lines[0].real_unit_cost_mxn).toBe(30);
    expect(result.lines[0].real_unit_cost_usd).toBeNull();
  });
});
