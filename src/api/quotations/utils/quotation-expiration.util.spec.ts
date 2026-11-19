import {
  addCalendarDays,
  isQuotationExpired,
  normalizeExpirationDays,
  resolveQuotationExpiresAt,
  toDateOnlyString,
} from './quotation-expiration.util';

describe('quotation-expiration.util', () => {
  it('normaliza días vacíos o inválidos a null', () => {
    expect(normalizeExpirationDays(null)).toBeNull();
    expect(normalizeExpirationDays('')).toBeNull();
    expect(normalizeExpirationDays(0)).toBeNull();
    expect(normalizeExpirationDays(-3)).toBeNull();
    expect(normalizeExpirationDays(15.9)).toBe(15);
  });

  it('suma días de calendario sin corrimiento por huso', () => {
    expect(addCalendarDays('2026-09-01', 15)).toBe('2026-09-16');
    expect(toDateOnlyString('2026-09-01T23:30:00.000Z').length).toBe(10);
  });

  it('calcula la fecha de vencimiento desde created_at + días', () => {
    expect(resolveQuotationExpiresAt('2026-09-01T08:00:00.000Z', 15)).toBe('2026-09-16');
    expect(resolveQuotationExpiresAt('2026-09-01', null)).toBeNull();
  });

  it('marca vencida el día de expires_at, no antes', () => {
    expect(isQuotationExpired('2026-09-01', 15, '2026-09-15')).toBe(false);
    expect(isQuotationExpired('2026-09-01', 15, '2026-09-16')).toBe(true);
    expect(isQuotationExpired('2026-09-01', null, '2026-09-30')).toBe(false);
  });
});
