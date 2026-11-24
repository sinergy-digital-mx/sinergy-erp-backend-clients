import { buildPosBranchStockProducts, formatPosBranchStockQty } from './pos-branch-stock.util';

describe('pos-branch-stock.util', () => {
  const branches = [
    { id: 'ba', name: 'BUENOS AIRES', city: 'Tijuana' },
    { id: 'mx', name: 'MEXICALI', city: 'Mexicali' },
    { id: 'en', name: 'ENSENADA', city: null },
  ];

  it('formats quantities with three decimals', () => {
    expect(formatPosBranchStockQty(0.02)).toBe('0.020');
    expect(formatPosBranchStockQty(Number.NaN)).toBe('0.000');
  });

  it('fills every branch, keeps zeros, and sums only those branches', () => {
    const products = buildPosBranchStockProducts(
      [{ id: 'p1', sku: '1X10', name: 'PINO 1X10' }],
      branches,
      [
        { product_id: 'p1', billing_branch_id: 'ba', quantity: 0.02, uom_name: 'Pieza' },
        { product_id: 'p1', billing_branch_id: 'ba', quantity: 0.01, uom_name: null },
        { product_id: 'p1', billing_branch_id: 'mx', quantity: 12, uom_name: 'Pieza' },
        { product_id: 'p1', billing_branch_id: 'other', quantity: 99, uom_name: 'Pieza' },
      ],
    );

    expect(products).toHaveLength(1);
    expect(products[0].uom_name).toBe('Pieza');
    expect(products[0].total_quantity).toBe('12.030');
    expect(products[0].branches).toEqual([
      { billing_branch_id: 'ba', quantity: '0.030', uom_name: 'Pieza' },
      { billing_branch_id: 'mx', quantity: '12.000', uom_name: 'Pieza' },
      { billing_branch_id: 'en', quantity: '0.000', uom_name: null },
    ]);
  });

  it('uses Pieza when the product has no stock', () => {
    const products = buildPosBranchStockProducts(
      [{ id: 'p2', sku: 'L4', name: 'LIJA' }],
      branches,
      [],
    );

    expect(products[0].uom_name).toBe('Pieza');
    expect(products[0].total_quantity).toBe('0.000');
    expect(products[0].branches.every((cell) => cell.quantity === '0.000')).toBe(true);
  });
});
