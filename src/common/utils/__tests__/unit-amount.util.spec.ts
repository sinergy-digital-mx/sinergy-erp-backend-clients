import { roundUnitAmount } from '../unit-amount.util';

describe('roundUnitAmount', () => {
  it('conserva milésimas (2.150)', () => {
    expect(roundUnitAmount(2.15)).toBe(2.15);
    expect(roundUnitAmount(2.15).toFixed(4)).toBe('2.1500');
  });

  it('no redondea 2.215 a 2.22', () => {
    expect(roundUnitAmount(2.215)).toBe(2.215);
  });

  it('no recorta a 1 decimal (2.2)', () => {
    expect(roundUnitAmount(2.15)).not.toBe(2.2);
  });
});
