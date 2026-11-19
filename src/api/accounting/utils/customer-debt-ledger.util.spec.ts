import { CustomerDebtLedgerMovementType } from '../../../entities/accounting/customer-debt-ledger-movement-type.enum';
import {
  advanceCoveredAmount,
  applyDebtLedgerBalances,
  customerDebtDisplayName,
  debtAgingBucket,
  debtDueDate,
  debtMovementDescription,
  formatDebtDateTime,
  formatDebtDay,
  isWalkInDebtCustomer,
  stripAdvanceFromDebtMovements,
} from './customer-debt-ledger.util';

describe('customer debt ledger', () => {
  const asOf = new Date(2026, 8, 25, 12, 0, 0);

  it('escribe la fecha del flujo en hora de Baja California', () => {
    expect(formatDebtDay('2026-09-26')).toBe('26 sep 2026');
    expect(formatDebtDateTime('2026-09-26T16:41:00.000Z')).toContain('26 sep 2026');
    expect(formatDebtDateTime('2026-09-26T16:41:00.000Z')).toContain('9:41');
  });

  it('clasifica la antigüedad contra la fecha de vencimiento', () => {
    expect(debtAgingBucket('2026-09-25', asOf)).toBe('current');
    expect(debtAgingBucket('2026-09-26', asOf)).toBe('current');
    expect(debtAgingBucket('2026-09-24', asOf)).toBe('d1_30');
    expect(debtAgingBucket('2026-08-26', asOf)).toBe('d1_30');
    expect(debtAgingBucket('2026-08-25', asOf)).toBe('d31_60');
    expect(debtAgingBucket('2026-07-27', asOf)).toBe('d31_60');
    expect(debtAgingBucket('2026-07-26', asOf)).toBe('d61_90');
    expect(debtAgingBucket('2026-06-27', asOf)).toBe('d61_90');
    expect(debtAgingBucket('2026-06-26', asOf)).toBe('d91_plus');
    expect(debtAgingBucket(null, asOf)).toBe('current');
  });

  it('congela el vencimiento sumando los días de crédito del cargo', () => {
    expect(debtDueDate(new Date(2026, 8, 1, 15, 30), 30)).toBe('2026-10-01');
    expect(debtDueDate(new Date(2026, 8, 1, 15, 30), null)).toBe('2026-09-01');
  });

  it('arma el saldo corrido del cliente y el de cada OV', () => {
    const occurred = (day: number) => new Date(2026, 8, day, 10, 0, 0);
    const rows = applyDebtLedgerBalances([
      draft('charge:ov-1', 'ov-1', CustomerDebtLedgerMovementType.CHARGE, 1000, occurred(1)),
      draft('charge:ov-2', 'ov-2', CustomerDebtLedgerMovementType.CHARGE, 400, occurred(2)),
      draft('payment:p-1', 'ov-1', CustomerDebtLedgerMovementType.PAYMENT, -250, occurred(3)),
      draft(
        'charge_reversal:ov-2',
        'ov-2',
        CustomerDebtLedgerMovementType.CHARGE_REVERSAL,
        -400,
        occurred(4),
      ),
    ]);

    expect(rows.map((row) => [row.balanceAfter, row.orderBalanceAfter])).toEqual([
      [1000, 1000],
      [1400, 400],
      [1150, 750],
      [750, 0],
    ]);
  });

  it('no mezcla saldos de otro cliente', () => {
    const at = new Date(2026, 8, 1, 10, 0, 0);
    const rows = applyDebtLedgerBalances([
      draft('charge:a', 'ov-a', CustomerDebtLedgerMovementType.CHARGE, 100, at, 1),
      draft('charge:b', 'ov-b', CustomerDebtLedgerMovementType.CHARGE, 80, at, 2),
    ]);
    expect(rows.find((row) => row.customerId === 1)?.balanceAfter).toBe(100);
    expect(rows.find((row) => row.customerId === 2)?.balanceAfter).toBe(80);
  });

  it('describe el abono con la OV y el método', () => {
    expect(
      debtMovementDescription({
        movementType: CustomerDebtLedgerMovementType.PAYMENT,
        folio: 'OV-12',
        paymentMethod: 'transfer',
        referenceNumber: 'SPEI-9',
      }),
    ).toBe('Abono a OV-12 (Transferencia, ref. SPEI-9).');
  });

  it('toma el anticipo pedido, cobrado o facturado, el que sea mayor', () => {
    expect(advanceCoveredAmount({ advance_requested: 5000, advance_paid: 1000 })).toBe(5000);
    expect(advanceCoveredAmount({ advance_requested: 0, advance_paid: 1000 })).toBe(1000);
    expect(advanceCoveredAmount({ advance_paid: 8000, advance_requested: 5000 })).toBe(8000);
    expect(advanceCoveredAmount({ advance_invoiced: 800 })).toBe(800);
    expect(advanceCoveredAmount({})).toBe(0);
  });

  it('deja el kardex en la parte a crédito y omite el abono de anticipo', () => {
    const rows = stripAdvanceFromDebtMovements([
      move('charge', 11760, 'system'),
      move('payment', -5000, 'advance'),
      move('payment', -2000, 'manual'),
    ]);

    expect(rows.map((row) => [row.movement_type, row.amount_delta, row.order_balance_after])).toEqual([
      ['charge', 6760, 6760],
      ['payment', -2000, 4760],
    ]);
  });

  it('no vuelve a restar el anticipo si el cargo ya venía neto', () => {
    const rows = stripAdvanceFromDebtMovements([
      move('charge', 6760, 'system', { advance_paid: 5000, advance_requested: 5000 }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].amount_delta).toBe(6760);
    expect(rows[0].order_balance_after).toBe(6760);
  });

  it('baja el cargo cuando el anticipo se pidió y todavía no se cobra', () => {
    const rows = stripAdvanceFromDebtMovements([
      move('charge', 11760, 'system', { advance_requested: 5000, advance_paid: 0 }),
    ]);
    expect(rows[0].amount_delta).toBe(6760);
    expect(rows[0].order_balance_after).toBe(6760);
  });

  it('la cancelación deja en cero el saldo ya sin anticipo', () => {
    const rows = stripAdvanceFromDebtMovements([
      move('charge', 11760, 'system'),
      move('payment', -5000, 'advance'),
      move('charge_reversal', -11760, 'system'),
    ]);
    expect(rows.map((row) => [row.movement_type, row.amount_delta, row.order_balance_after])).toEqual([
      ['charge', 6760, 6760],
      ['charge_reversal', -6760, 0],
    ]);
  });

  it('no mueve una orden a crédito que no tiene anticipo', () => {
    const rows = stripAdvanceFromDebtMovements([
      move('charge', 100, 'system', { order_total: 100, advance_requested: 0, advance_paid: 0 }),
      move('payment', -40, 'manual', { order_total: 100, advance_requested: 0, advance_paid: 0 }),
    ]);
    expect(rows.map((row) => row.order_balance_after)).toEqual([100, 60]);
  });

  it('identifica mostrador y el nombre congelado del cliente', () => {
    expect(isWalkInDebtCustomer({ name: 'Público en General' })).toBe(true);
    expect(
      customerDebtDisplayName({
        fiscal_razon_social: 'Constructora Romero SA',
        company_name: 'Romero',
        name: 'Ana',
      }),
    ).toBe('Constructora Romero SA');
  });
});

function draft(
  sourceKey: string,
  salesOrderId: string,
  movementType: CustomerDebtLedgerMovementType,
  amountDelta: number,
  occurredAt: Date,
  customerId = 7,
) {
  return {
    tenantId: 'tenant-1',
    customerId,
    fiscalConfigurationId: 'fiscal-1',
    salesOrderId,
    sourceKey,
    movementType,
    amountDelta,
    occurredAt,
  };
}

function move(
  movementType: string,
  amountDelta: number,
  source: string,
  coverage: {
    order_total?: number;
    advance_requested?: number;
    advance_paid?: number;
  } = {},
) {
  return {
    sales_order_id: 'order-1',
    movement_type: movementType,
    amount_delta: amountDelta,
    source,
    payment_source: source === 'advance' ? 'advance' : null,
    order_total: coverage.order_total ?? 11760,
    advance_requested: coverage.advance_requested ?? 5000,
    advance_paid: coverage.advance_paid ?? 5000,
    advance_invoiced: 0,
  };
}
