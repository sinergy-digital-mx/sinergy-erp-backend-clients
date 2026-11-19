import { advanceCreditPending, advanceDocumentPending } from '../advance-credit.util';

describe('advance-credit.util', () => {
  it('deja fuera del crédito el anticipo que caja todavía no cobra', () => {
    expect(advanceCreditPending(10000, 3000, 0)).toBe(7000);
    expect(advanceDocumentPending(10000, 0)).toBe(10000);
  });

  it('al cobrar el anticipo, el crédito es la diferencia del documento', () => {
    expect(advanceCreditPending(10000, 3000, 3000)).toBe(7000);
    expect(advanceDocumentPending(10000, 3000)).toBe(7000);
  });

  it('si el anticipo se pagó de menos, el tramo pedido sigue fuera del crédito', () => {
    expect(advanceCreditPending(10000, 3000, 1000)).toBe(7000);
    expect(advanceDocumentPending(10000, 1000)).toBe(9000);
  });

  it('un anticipo por el total no usa crédito hasta que falte algo fuera de lo pedido', () => {
    expect(advanceCreditPending(10000, 10000, 0)).toBe(0);
    expect(advanceCreditPending(10000, 10000, 10000)).toBe(0);
    expect(advanceCreditPending(12000, 10000, 10000)).toBe(2000);
  });
});
