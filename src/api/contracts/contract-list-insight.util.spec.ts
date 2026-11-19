import {
  emptyOverdueBucket,
  isInDownPaymentPhase,
  mergeOverdueBuckets,
  parseOverdueBucket,
  resolveListPaymentInsight,
} from './contract-list-insight.util';

describe('isInDownPaymentPhase', () => {
  it('no aplica si el enganche no está financiado', () => {
    expect(
      isInDownPaymentPhase({
        downPaymentFinanced: false,
        unpaidDownPaymentCount: 2,
        downPaymentApplied: 0,
        downPaymentTarget: 36000,
      }),
    ).toBe(false);
  });

  it('sigue en enganche si hay cuotas pendientes', () => {
    expect(
      isInDownPaymentPhase({
        downPaymentFinanced: true,
        unpaidDownPaymentCount: 1,
        downPaymentApplied: 30000,
        downPaymentTarget: 36000,
      }),
    ).toBe(true);
  });

  it('pasa a contrato cuando la meta ya se cubrió y no hay cuotas', () => {
    expect(
      isInDownPaymentPhase({
        downPaymentFinanced: true,
        unpaidDownPaymentCount: 0,
        downPaymentApplied: 36000,
        downPaymentTarget: 36000,
      }),
    ).toBe(false);
  });

  it('sigue en enganche si aún no hay meta', () => {
    expect(
      isInDownPaymentPhase({
        downPaymentFinanced: true,
        unpaidDownPaymentCount: 0,
        downPaymentApplied: 0,
        downPaymentTarget: null,
      }),
    ).toBe(true);
  });
});

describe('resolveListPaymentInsight', () => {
  const downPaymentNext = {
    due_date: '2026-11-05',
    status: 'pendiente',
    payment_number: 'ENG-3',
    amount: 6000,
  };
  const contractNext = {
    due_date: '2026-12-01',
    status: 'pendiente',
    payment_number: '1',
    amount: 1200,
  };

  it('usa el siguiente pago de enganche y marca el último activo', () => {
    const insight = resolveListPaymentInsight({
      downPaymentFinanced: true,
      unpaidDownPaymentCount: 1,
      downPaymentApplied: 30000,
      downPaymentTarget: 36000,
      contractNext,
      downPaymentNext,
    });

    expect(insight.payment_phase).toBe('down_payment');
    expect(insight.next_payment_kind).toBe('down_payment');
    expect(insight.next_payment_is_last_down_payment).toBe(true);
    expect(insight.next_payment).toEqual(downPaymentNext);
  });

  it('usa el pago de contrato cuando el enganche ya cerró', () => {
    const insight = resolveListPaymentInsight({
      downPaymentFinanced: true,
      unpaidDownPaymentCount: 0,
      downPaymentApplied: 36000,
      downPaymentTarget: 36000,
      contractNext,
      downPaymentNext: null,
    });

    expect(insight.payment_phase).toBe('contract');
    expect(insight.next_payment_kind).toBe('contract');
    expect(insight.next_payment_is_last_down_payment).toBe(false);
    expect(insight.next_payment).toEqual(contractNext);
  });
});

describe('mergeOverdueBuckets', () => {
  it('suma montos y pagos, y usa el conteo único de contratos', () => {
    const merged = mergeOverdueBuckets(
      { contracts_count: 10, payments_count: 40, value: 18000.2 },
      { contracts_count: 4, payments_count: 6, value: 3550.3 },
      12,
    );

    expect(merged.contracts_count).toBe(12);
    expect(merged.payments_count).toBe(46);
    expect(merged.value).toBe(21550.5);
    expect(merged.contract.payments_count).toBe(40);
    expect(merged.down_payment.value).toBe(3550.3);
  });

  it('parsea filas vacías a ceros', () => {
    expect(parseOverdueBucket(null)).toEqual(emptyOverdueBucket());
  });
});
