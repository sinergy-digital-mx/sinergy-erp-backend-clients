import { MADERERIA_ORGANIZATION_ID } from '../../madereria-inventory-import/madereria-inventory-import.constants';
import { userCanViewPurchaseOrderRealCost } from '../constants/purchase-order-real-cost-permission';
import { omitPurchaseOrderRealCost } from './omit-purchase-order-real-cost.util';

describe('purchase order real cost access', () => {
  const madereriaAdmin = {
    tenant_id: MADERERIA_ORGANIZATION_ID,
    hasAdminRole: true,
    permissions: ['purchase_orders:Read', 'purchase_order_real_cost:Read'],
  };

  it('permite el costo real solo a Madereria con el permiso', () => {
    expect(userCanViewPurchaseOrderRealCost(madereriaAdmin)).toBe(true);
    expect(
      userCanViewPurchaseOrderRealCost({
        tenant_id: MADERERIA_ORGANIZATION_ID,
        hasAdminRole: true,
        permissions: ['purchase_orders:Read'],
      }),
    ).toBe(false);
    expect(
      userCanViewPurchaseOrderRealCost({
        tenant_id: '54481b63-5516-458d-9bb3-d4e5cb028864',
        hasAdminRole: true,
        permissions: ['purchase_orders:Read', 'purchase_order_real_cost:Read'],
      }),
    ).toBe(false);
  });

  it('quita costo real de la orden, lotes e historial sin mutar el original', () => {
    const line = {
      id: 'line-1',
      unit_total: 10,
      igi_percentage: 5,
      real_unit_cost_usd: 1.9,
      real_unit_cost_mxn: 32.2,
    };
    const order = {
      folio: 'ODC-1',
      customs_exchange_rate: 16.95,
      customs_date: '2026-06-08',
      has_real_cost: true,
      can_edit_real_cost: true,
      extra_costs_count: 1,
      extra_costs: [{ concept: 'Flete', amount: 100 }],
      landed_cost_lines: [{ concept: 'Flete' }],
      landed_extras_mxn: 100,
      landed_invoice_extras_mxn: 40,
      landed_total_mxn: 500,
      landed_contracted_mxn: 400,
      landed_contracted_usd: 20,
      landed_invoice_mxn: 440,
      landed_invoice_usd: 22,
      landed_operating_extras_mxn: 60,
      landed_operating_extras_usd: 3,
      line_items: [line],
      batches: [{ id: 'lot-1', unit_cost: 10, real_unit_cost_usd: 1.9, real_unit_cost_mxn: 32.2 }],
      movements: [
        { type: 'created', description: 'Creada' },
        { type: 'real_cost_updated', description: 'Se actualizó el costo real' },
      ],
      movements_count: 2,
    };

    const hidden = omitPurchaseOrderRealCost({ data: { header: order, products: order.line_items } });

    expect(hidden.data.header.folio).toBe('ODC-1');
    expect(hidden.data.header.customs_exchange_rate).toBeNull();
    expect(hidden.data.header.has_real_cost).toBe(false);
    expect(hidden.data.header.extra_costs).toEqual([]);
    expect(hidden.data.header.landed_extras_mxn).toBe(0);
    expect(hidden.data.header.landed_invoice_extras_mxn).toBe(0);
    expect(hidden.data.header.landed_contracted_mxn).toBe(0);
    expect(hidden.data.header.landed_contracted_usd).toBeNull();
    expect(hidden.data.header.landed_invoice_mxn).toBe(0);
    expect(hidden.data.header.landed_invoice_usd).toBeNull();
    expect(hidden.data.header.landed_operating_extras_mxn).toBe(0);
    expect(hidden.data.header.landed_operating_extras_usd).toBeNull();
    expect(hidden.data.header.line_items[0].unit_total).toBe(10);
    expect(hidden.data.header.line_items[0].real_unit_cost_mxn).toBeNull();
    expect(hidden.data.header.line_items[0].igi_percentage).toBe(0);
    expect(hidden.data.header.batches[0].unit_cost).toBe(10);
    expect(hidden.data.header.batches[0].real_unit_cost_usd).toBeNull();
    expect(hidden.data.header.movements).toEqual([{ type: 'created', description: 'Creada' }]);
    expect(hidden.data.header.movements_count).toBe(1);
    expect(hidden.data.products[0].real_unit_cost_usd).toBeNull();
    expect(order.customs_exchange_rate).toBe(16.95);
    expect(line.real_unit_cost_mxn).toBe(32.2);
  });
});
