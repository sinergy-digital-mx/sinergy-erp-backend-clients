import { buildPurchaseOrderLotTree } from './purchase-order-lot-tree.util';

describe('buildPurchaseOrderLotTree', () => {
  const line = {
    id: 'line-1',
    quantity: 3000,
    unit_total: 2.22,
    received_original_unit_total: 2.22,
  };

  it('anida lotes migrados bajo el lote recibido y no los cuenta como recibo', () => {
    const tree = buildPurchaseOrderLotTree(
      [
        {
          id: 'root',
          batch_number: 'MZN-CTIJ-BDG-00005',
          transferred_from_batch_id: null,
          purchase_order_detail_id: 'line-1',
          product_id: 'p1',
          product_name: 'ENCINO 4/4',
          product_sku: 'EN1',
          warehouse_id: 'wh-tij',
          warehouse_name: 'Bodega',
          fiscal_configuration_id: 'fiscal',
          razon_social: 'Maderería Zona Norte',
          billing_branch_id: 'br-tij',
          sucursal: 'Cedis Tijuana',
          uom_id: 'uom-pt',
          uom_name: 'PT',
          initial_quantity: 1314,
          available_quantity: 0,
          created_at: new Date('2026-01-10T10:00:00Z'),
          created_by: 'user-1',
          created_by_name: 'Miguel Arriaga',
        },
        {
          id: 'dest',
          batch_number: 'MZN-CTR-BDG-01493',
          transferred_from_batch_id: 'root',
          purchase_order_detail_id: 'line-1',
          product_id: 'p1',
          product_name: 'ENCINO 4/4',
          product_sku: 'EN1',
          warehouse_id: 'wh-tr',
          warehouse_name: 'Bodega Torreón',
          fiscal_configuration_id: 'fiscal',
          razon_social: 'Maderería Zona Norte',
          billing_branch_id: 'br-tr',
          sucursal: 'Torreón',
          uom_id: 'uom-pt',
          uom_name: 'PT',
          initial_quantity: 1314,
          available_quantity: 1314,
          created_at: new Date('2026-01-12T10:00:00Z'),
          created_by: 'user-2',
          created_by_name: 'Ana',
        },
      ],
      [line],
      [
        {
          id: 'trf-1',
          folio: 'TRF-000010',
          quantity: 1314,
          source_inventory_batch_id: 'root',
          destination_inventory_batch_id: 'dest',
          created_at: new Date('2026-01-12T10:00:00Z'),
          created_by_name: 'Ana',
          source_warehouse_name: 'Bodega',
          source_sucursal: 'Cedis Tijuana',
          destination_warehouse_name: 'Bodega Torreón',
          destination_sucursal: 'Torreón',
        },
      ],
    );

    expect(tree.batches).toHaveLength(1);
    expect(tree.summary.received_lots).toBe(1);
    expect(tree.summary.migrated_lots).toBe(1);
    expect(tree.summary.amount_total).toBe(2917.08);

    const root = tree.batches[0];
    expect(root.origin).toBe('receipt');
    expect(root.origin_label).toBe('Recibido');
    expect(root.received_quantity).toBe('1314.000');
    expect(root.remaining_quantity).toBe('0.000');
    expect(root.migrated_quantity).toBe('1314.000');
    expect(root.amount).toBe(2917.08);
    expect(root.migrated_to).toHaveLength(1);

    const dest = root.migrated_to[0];
    expect(dest.origin).toBe('migration');
    expect(dest.origin_label).toBe('Migrado a');
    expect(dest.received_quantity).toBe('1314.000');
    expect(dest.ordered_quantity).toBeNull();
    expect(dest.transfer?.transfer_folio).toBe('TRF-000010');
    expect(dest.transfer?.destination_sucursal).toBe('Torreón');
  });

  it('encadena migraciones sucesivas y separa venta de lo migrado', () => {
    const tree = buildPurchaseOrderLotTree(
      [
        {
          id: 'a',
          batch_number: 'A',
          transferred_from_batch_id: null,
          purchase_order_detail_id: 'line-1',
          product_id: 'p1',
          product_name: 'ENCINO',
          product_sku: 'EN1',
          warehouse_id: 'w1',
          warehouse_name: 'W1',
          fiscal_configuration_id: null,
          razon_social: null,
          billing_branch_id: null,
          sucursal: null,
          uom_id: 'u',
          uom_name: 'PT',
          initial_quantity: 100,
          available_quantity: 40,
          created_at: new Date(),
          created_by: 'u1',
          created_by_name: null,
        },
        {
          id: 'b',
          batch_number: 'B',
          transferred_from_batch_id: 'a',
          purchase_order_detail_id: 'line-1',
          product_id: 'p1',
          product_name: 'ENCINO',
          product_sku: 'EN1',
          warehouse_id: 'w2',
          warehouse_name: 'W2',
          fiscal_configuration_id: null,
          razon_social: null,
          billing_branch_id: null,
          sucursal: null,
          uom_id: 'u',
          uom_name: 'PT',
          initial_quantity: 50,
          available_quantity: 10,
          created_at: new Date(),
          created_by: 'u1',
          created_by_name: null,
        },
        {
          id: 'c',
          batch_number: 'C',
          transferred_from_batch_id: 'b',
          purchase_order_detail_id: 'line-1',
          product_id: 'p1',
          product_name: 'ENCINO',
          product_sku: 'EN1',
          warehouse_id: 'w3',
          warehouse_name: 'W3',
          fiscal_configuration_id: null,
          razon_social: null,
          billing_branch_id: null,
          sucursal: null,
          uom_id: 'u',
          uom_name: 'PT',
          initial_quantity: 20,
          available_quantity: 20,
          created_at: new Date(),
          created_by: 'u1',
          created_by_name: null,
        },
      ],
      [line],
      [
        {
          id: 't1',
          folio: 'TRF-1',
          quantity: 50,
          source_inventory_batch_id: 'a',
          destination_inventory_batch_id: 'b',
          created_at: new Date(),
          created_by_name: null,
          source_warehouse_name: 'W1',
          source_sucursal: null,
          destination_warehouse_name: 'W2',
          destination_sucursal: null,
        },
        {
          id: 't2',
          folio: 'TRF-2',
          quantity: 20,
          source_inventory_batch_id: 'b',
          destination_inventory_batch_id: 'c',
          created_at: new Date(),
          created_by_name: null,
          source_warehouse_name: 'W2',
          source_sucursal: null,
          destination_warehouse_name: 'W3',
          destination_sucursal: null,
        },
      ],
    );

    const a = tree.batches[0];
    expect(a.received_quantity).toBe('100.000');
    expect(a.remaining_quantity).toBe('40.000');
    expect(a.migrated_quantity).toBe('50.000');
    expect(a.consumed_quantity).toBe('10.000');
    expect(a.migrated_to[0].batch_number).toBe('B');
    expect(a.migrated_to[0].migrated_to[0].batch_number).toBe('C');
    expect(tree.summary.received_lots).toBe(1);
    expect(tree.summary.migrated_lots).toBe(2);
    expect(tree.summary.migrated_quantity).toBe('50.000');
  });
});
