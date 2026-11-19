import {
  daysLeftInMonth,
  invoiceMonthDeadlineLabel,
  invoiceMonthDeadlineLine,
} from './invoice-month-deadline.util';

describe('invoice-month-deadline.util', () => {
  it('el dia 25 de un mes de 30 deja 5 dias', () => {
    const date = new Date('2026-09-25T19:00:00Z');
    expect(daysLeftInMonth(date)).toBe(5);
    expect(invoiceMonthDeadlineLine(date)).toBe('Solo este mes. Te quedan 5 dias.');
  });

  it('el ultimo dia del mes no deja dias', () => {
    const date = new Date('2026-09-30T19:00:00Z');
    expect(daysLeftInMonth(date)).toBe(0);
    expect(invoiceMonthDeadlineLine(date)).toBe('Solo este mes. Ultimo dia.');
  });

  it('un dia antes del cierre usa singular', () => {
    const date = new Date('2026-09-29T19:00:00Z');
    expect(invoiceMonthDeadlineLine(date)).toBe('Solo este mes. Te queda 1 dia.');
  });

  it('acepta la fecha de MySQL como texto', () => {
    expect(invoiceMonthDeadlineLine('2026-09-25 12:00:00')).toBe(
      'Solo este mes. Te quedan 5 dias.',
    );
  });

  it('el PDF usa la misma cuenta de días con acentos', () => {
    const date = new Date('2026-09-25T19:00:00Z');
    expect(invoiceMonthDeadlineLabel(date)).toBe('Solo este mes. Te quedan 5 días.');
    expect(invoiceMonthDeadlineLabel(date, 'en')).toBe('This month only. 5 days left.');
  });
});
