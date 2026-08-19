import { buildCreditSnapshot, extractCreditPatchFromBody } from '../customer-credit.util';
import { getFiscalInvoiceReadiness } from '../fiscal-invoice-readiness.util';
import { Customer } from '../../../../entities/customers/customer.entity';

describe('buildCreditSnapshot', () => {
  it('calcula disponible y porcentaje', () => {
    const snapshot = buildCreditSnapshot({
      creditEnabled: true,
      creditDays: 30,
      creditAmount: 15000,
      creditUsed: 3200.5,
    });

    expect(snapshot.credit_available).toBe(11799.5);
    expect(snapshot.credit_usage_percent).toBe(21.34);
  });

  it('no deja disponible negativo', () => {
    const snapshot = buildCreditSnapshot({
      creditEnabled: true,
      creditAmount: 100,
      creditUsed: 150,
    });

    expect(snapshot.credit_available).toBe(0);
    expect(snapshot.credit_usage_percent).toBe(150);
  });
});

describe('extractCreditPatchFromBody', () => {
  it('toma días y monto aunque no venga credit_enabled', () => {
    expect(
      extractCreditPatchFromBody({ credit_days: 30, credit_amount: 15000 }),
    ).toEqual({
      credit_enabled: true,
      credit_days: 30,
      credit_amount: 15000,
    });
  });

  it('acepta objeto anidado credit', () => {
    expect(
      extractCreditPatchFromBody({
        credit: { enabled: true, days: 15, amount: 5000 },
      }),
    ).toEqual({
      credit_enabled: true,
      credit_days: 15,
      credit_amount: 5000,
    });
  });

  it('ignora solo warehouse_id', () => {
    expect(extractCreditPatchFromBody({ warehouse_id: 'abc' })).toBeNull();
  });
});

describe('getFiscalInvoiceReadiness', () => {
  const base = {
    fiscal_rfc: 'SSS2410213X9',
    fiscal_razon_social: 'SINERGY SW SOLUTIONS',
    fiscal_postal_code: '22040',
  } as Customer;

  it('lista como listo si RFC, razón y CP están completos', () => {
    expect(getFiscalInvoiceReadiness(base)).toEqual({
      fiscal_ready_for_invoice: true,
      fiscal_missing_fields: [],
    });
  });

  it('rechaza RFC genérico y CP inválido', () => {
    const result = getFiscalInvoiceReadiness({
      ...base,
      fiscal_rfc: 'XAXX010101000',
      fiscal_postal_code: '2204',
    } as Customer);

    expect(result.fiscal_ready_for_invoice).toBe(false);
    expect(result.fiscal_missing_fields).toEqual(['fiscal_rfc', 'fiscal_postal_code']);
  });
});
