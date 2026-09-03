import {
  cashDifference,
  expectedCashInDrawer,
  roundPosMoney,
} from './cash-drawer';

describe('cash-drawer', () => {
  it('computes expected cash after collections and partials', () => {
    expect(
      expectedCashInDrawer({
        opening: 1500,
        collectedCash: 105.59,
        removed: 1000,
      }),
    ).toBe(605.59);
  });

  it('reports surplus and shortage', () => {
    expect(cashDifference(610, 605.59)).toBe(4.41);
    expect(cashDifference(600, 605.59)).toBe(-5.59);
    expect(cashDifference(605.59, 605.59)).toBe(0);
  });

  it('rounds to cents', () => {
    expect(roundPosMoney(10.005)).toBe(10.01);
  });
});
