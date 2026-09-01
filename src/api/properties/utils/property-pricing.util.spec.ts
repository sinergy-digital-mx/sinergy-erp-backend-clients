import { resolvePropertyPricing } from './property-pricing.util';

describe('resolvePropertyPricing', () => {
  it('calculates total from optional price per m2', () => {
    expect(
      resolvePropertyPricing({
        totalArea: 200,
        pricePerM2: 1850,
        isCreate: true,
      }),
    ).toEqual({
      total_price: 370000,
      price_per_m2: 1850,
    });
  });

  it('keeps a manually entered total when price per m2 is omitted', () => {
    expect(
      resolvePropertyPricing({
        totalArea: 200,
        totalPrice: 400000,
        isCreate: true,
      }),
    ).toEqual({
      total_price: 400000,
      price_per_m2: 2000,
    });
  });

  it('requires one of the two prices on create', () => {
    expect(() =>
      resolvePropertyPricing({
        totalArea: 200,
        isCreate: true,
      }),
    ).toThrow(/total_price o price_per_m2/);
  });
});
