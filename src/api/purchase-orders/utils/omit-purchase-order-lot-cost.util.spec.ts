import { omitPurchaseOrderLotCosts } from './omit-purchase-order-lot-cost.util';

describe('omitPurchaseOrderLotCosts', () => {
  it('clears lot cost and keeps the line unit cost', () => {
    const hidden = omitPurchaseOrderLotCosts({
      data: {
        header: {
          line_items: [{ id: 'line-1', unit_total: 2.22, line_subtotal: 222 }],
          batches: [
            {
              batch_number: 'L-1',
              unit_cost: 2.22,
              amount: 222,
              real_unit_cost_usd: 2.3,
              real_unit_cost_mxn: 39,
              received_quantity: '100',
              migrated_to: [
                {
                  batch_number: 'L-2',
                  unit_cost: 2.22,
                  amount: 50,
                  received_quantity: '20',
                },
              ],
            },
          ],
          batches_summary: {
            received_lots: 1,
            migrated_quantity: '0',
            amount_total: 222,
          },
        },
        payments: [{ amount: 100 }],
      },
    });

    const lot = hidden.data.header.batches[0];
    expect(lot.unit_cost).toBeNull();
    expect(lot.amount).toBeNull();
    expect(lot.real_unit_cost_mxn).toBeNull();
    expect(lot.received_quantity).toBe('100');
    expect(lot.migrated_to[0].unit_cost).toBeNull();
    expect(lot.migrated_to[0].amount).toBeNull();
    expect(hidden.data.header.batches_summary.amount_total).toBeNull();
    expect(hidden.data.header.line_items[0].unit_total).toBe(2.22);
    expect(hidden.data.payments[0].amount).toBe(100);
  });
});
