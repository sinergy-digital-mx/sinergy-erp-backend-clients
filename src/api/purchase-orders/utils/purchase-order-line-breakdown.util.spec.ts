import { computeRequestedLineBreakdown } from './purchase-order-line-breakdown.util';

describe('computeRequestedLineBreakdown', () => {
  it('guarda subtotal sin IVA y total con IVA', () => {
    const b = computeRequestedLineBreakdown(3000, 2.22, 16, 0);
    expect(b.line_subtotal).toBe(6660);
    expect(b.line_iva).toBe(1065.6);
    expect(b.line_ieps).toBe(0);
    expect(b.line_total).toBe(7725.6);
  });

  it('IVA 0 deja total igual al subtotal', () => {
    const b = computeRequestedLineBreakdown(3000, 2.22, 0, 0);
    expect(b.line_subtotal).toBe(6660);
    expect(b.line_iva).toBe(0);
    expect(b.line_total).toBe(6660);
  });

  it('conserva 2.215 en el costo unitario y redondea el importe de línea a 2 decimales', () => {
    const b = computeRequestedLineBreakdown(1, 2.215, 16, 0);
    expect(b.line_subtotal).toBe(2.22);
    expect(b.line_iva).toBe(0.36);
    expect(b.line_total).toBe(2.58);
  });

  it('qty × 2.215 calcula el subtotal de línea con el costo milésimal', () => {
    const b = computeRequestedLineBreakdown(3000, 2.215, 16, 0);
    expect(b.line_subtotal).toBe(6645);
    expect(b.line_iva).toBe(1063.2);
    expect(b.line_total).toBe(7708.2);
  });
});
