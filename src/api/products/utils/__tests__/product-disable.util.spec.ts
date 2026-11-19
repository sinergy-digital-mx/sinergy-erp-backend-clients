import { formatQty, summarizeStock } from '../product-disable.util';

describe('product-disable.util', () => {
  it('formatea cantidades sin recortar el entero', () => {
    expect(formatQty(10)).toBe('10');
    expect(formatQty(10.5)).toBe('10.5');
    expect(formatQty(10.125)).toBe('10.125');
    expect(formatQty(0.5)).toBe('0.5');
  });

  it('agrupa existencias por unidad y omite lotes en cero', () => {
    const summary = summarizeStock([
      { quantity: 10, uomName: 'Pieza' },
      { quantity: 2.5, uomName: 'Pie' },
      { quantity: 1.5, uomName: 'Pieza' },
      { quantity: 0, uomName: 'Pieza' },
    ]);

    expect(summary.lotCount).toBe(3);
    expect(summary.totalQuantity).toBe(14);
    expect(summary.byUom).toEqual([
      { uom_name: 'Pie', quantity: '2.5' },
      { uom_name: 'Pieza', quantity: '11.5' },
    ]);
  });
});
