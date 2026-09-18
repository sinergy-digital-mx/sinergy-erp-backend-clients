import {
  quotedGlobalDiscountAmount,
  quotedLineDiscountAmounts,
  quotedUnitPrice,
} from './quoted-pricing.util';

describe('quotedUnitPrice', () => {
  it('conserva el unitario pactado con 4 decimales', () => {
    expect(quotedUnitPrice('61.3524')).toBe(61.3524);
    expect(quotedUnitPrice(2.15)).toBe(2.15);
  });
});

describe('quotedLineDiscountAmounts', () => {
  it('no recalcula el descuento con el catálogo: usa discount_unit persistido', () => {
    const amounts = quotedLineDiscountAmounts({
      quantity: 2,
      unit_price: 100,
      discount_percentage: 10,
      discount_unit: 5,
      product_discount_id: 'disc-1',
    });
    expect(amounts.discount_unit).toBe(5);
    expect(amounts.line_discount).toBe(10);
    expect(amounts.product_discount_id).toBe('disc-1');
  });
});

describe('quotedGlobalDiscountAmount', () => {
  it('usa el monto de la cotización', () => {
    expect(quotedGlobalDiscountAmount('25.50')).toBe(25.5);
    expect(quotedGlobalDiscountAmount(null)).toBe(0);
  });
});
