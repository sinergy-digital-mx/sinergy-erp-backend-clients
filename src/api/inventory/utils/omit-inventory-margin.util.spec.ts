import { userCanViewInventoryMargin } from '../constants/inventory-margin-permission';
import {
  omitInventoryBatchMargin,
  omitInventoryStatsMargin,
  omitInventorySummaryMargin,
} from './omit-inventory-margin.util';

describe('inventory margin permission', () => {
  it('accepts only the exact permission', () => {
    expect(userCanViewInventoryMargin({ permissions: ['inventory:ViewMargin'] })).toBe(true);
    expect(userCanViewInventoryMargin({ permissions: ['inventory:Read'] })).toBe(false);
    expect(userCanViewInventoryMargin({ permissions: [] })).toBe(false);
  });

  it('strips price, cost and margin from the summary', () => {
    const summary = omitInventorySummaryMargin({
      data: [
        {
          product_name: 'Triplay',
          suggested_unit_price: '10.00',
          pricing_options: [{ price: '10.00' }],
          margin: { unit_price: '10.00', unit_cost: '6.00', margin_percentage: '40.00' },
          batches: [{ batch_id: 'b1', margin: { unit_cost: '6.00' } }],
        },
      ],
    });

    expect(summary.data[0].product_name).toBe('Triplay');
    expect(summary.data[0]).not.toHaveProperty('margin');
    expect(summary.data[0]).not.toHaveProperty('suggested_unit_price');
    expect(summary.data[0].batches[0]).not.toHaveProperty('margin');
  });

  it('keeps the lot and clears its cost and price', () => {
    const batch = omitInventoryBatchMargin({
      batch_number: 'L-1',
      unit_cost: 12,
      suggested_unit_price: 20,
      real_unit_cost_mxn: 15,
      margin_detail: { headline: 'Margen' },
    });

    expect(batch.batch_number).toBe('L-1');
    expect(batch.unit_cost).toBeNull();
    expect(batch.suggested_unit_price).toBeNull();
    expect(batch.real_unit_cost_mxn).toBe(15);
    expect(batch).not.toHaveProperty('margin_detail');
  });

  it('clears the money cards and keeps the counts', () => {
    const stats = omitInventoryStatsMargin({
      total_batches: 4,
      total_cost: '100.00',
      gross_margin: '40.00',
      batches_without_cost: 2,
    });

    expect(stats.total_batches).toBe(4);
    expect(stats.total_cost).toBeNull();
    expect(stats.gross_margin).toBeNull();
    expect(stats.batches_without_cost).toBe(0);
  });
});
