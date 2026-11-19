import {
  isManualPrice,
  meanCost,
  priceFromMargin,
  priceListLabel,
} from './price-update.util';

describe('price update math', () => {
  it('averages the last two purchase costs', () => {
    expect(meanCost([10, 14])).toBe(12);
  });

  it('uses the only purchase when the other is missing', () => {
    expect(meanCost([18.5, null])).toBe(18.5);
    expect(meanCost([null, undefined])).toBeNull();
  });

  it('applies margin on the base unit and scales the second unit', () => {
    expect(priceFromMargin(20, 15, 1, 1)).toBe(23);
    expect(priceFromMargin(20, 15, 12, 1)).toBe(276);
  });

  it('keeps a zero margin as the cost itself', () => {
    expect(priceFromMargin(10.125, 0, 1, 1)).toBe(10.125);
  });

  it('labels lists by their number', () => {
    expect(priceListLabel(3, 'Hoteleros')).toBe('L3');
    expect(priceListLabel(null, 'Mayoreo')).toBe('Mayoreo');
  });

  it('flags a price that no longer matches the margin', () => {
    expect(isManualPrice(25, 23)).toBe(true);
    expect(isManualPrice(23, 23)).toBe(false);
    expect(isManualPrice(null, 23)).toBe(false);
  });
});
