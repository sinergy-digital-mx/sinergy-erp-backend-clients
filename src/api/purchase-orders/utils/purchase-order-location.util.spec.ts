import { buildPurchaseOrderLocationTree } from './purchase-order-location.util';

describe('buildPurchaseOrderLocationTree', () => {
  it('anida almacenes bajo sucursal y razón social', () => {
    const tree = buildPurchaseOrderLocationTree(
      [
        {
          id: 'fiscal-1',
          razon_social: 'MADERERIA ZONA NORTE',
          rfc: 'MZN010101XXX',
          status: 'active',
        },
      ],
      [{ id: 'branch-1', fiscal_configuration_id: 'fiscal-1', code: 'Ensenada', status: 1 }],
      [
        { id: 'wh-1', name: 'CEDIS Bodega Ensenada', status: 'active', billing_branch_id: 'branch-1' },
      ],
    );

    expect(tree.data[0].branches[0].name).toBe('Ensenada');
    expect(tree.data[0].branches[0].warehouses).toEqual([
      { id: 'wh-1', name: 'CEDIS Bodega Ensenada', status: 'active' },
    ]);
    expect(tree.unassigned_warehouses).toEqual([]);
  });

  it('separa almacenes sin sucursal o con sucursal inexistente', () => {
    const tree = buildPurchaseOrderLocationTree(
      [{ id: 'fiscal-1', razon_social: 'MZN', rfc: 'MZN010101XXX', status: 'active' }],
      [{ id: 'branch-1', fiscal_configuration_id: 'fiscal-1', code: 'Ensenada', status: 1 }],
      [
        { id: 'wh-orphan', name: 'CEDIS Bodega Ensenada', status: 'active', billing_branch_id: null },
        { id: 'wh-ghost', name: 'Bodega huérfana', status: 'active', billing_branch_id: 'missing' },
      ],
    );

    expect(tree.data[0].branches[0].warehouses).toEqual([]);
    expect(tree.unassigned_warehouses.map((item) => item.name)).toEqual([
      'CEDIS Bodega Ensenada',
      'Bodega huérfana',
    ]);
  });
});
