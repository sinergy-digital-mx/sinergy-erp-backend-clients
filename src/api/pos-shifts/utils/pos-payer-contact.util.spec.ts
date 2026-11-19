import { formatPayerContactSummary, resolvePayerContact } from './pos-payer-contact.util';

describe('resolvePayerContact', () => {
  const none = { transferMxn: 0, cardMxn: 0, checkMxn: 0 };

  it('efectivo no pide datos del pagador', () => {
    const result = resolvePayerContact(
      { transfer_payer_name: '', card_payer_name: '' },
      none,
    );
    expect(result.error).toBeNull();
    expect(result.contact.transferPayerName).toBeNull();
    expect(result.contact.cardPayerName).toBeNull();
  });

  it('transferencia acepta solo razón social', () => {
    const result = resolvePayerContact(
      { transfer_payer_business_name: '  Maderería del Norte  ' },
      { transferMxn: 100, cardMxn: 0, checkMxn: 0 },
    );
    expect(result.error).toBeNull();
    expect(result.contact.transferPayerBusinessName).toBe('Maderería del Norte');
    expect(result.contact.transferPayerName).toBeNull();
  });

  it('transferencia sin nombre ni razón social falla', () => {
    const result = resolvePayerContact(
      { transfer_payer_name: '   ' },
      { transferMxn: 100, cardMxn: 0, checkMxn: 0 },
    );
    expect(result.error).toBe('Ingresa el nombre o la razón social de la transferencia');
  });

  it('tarjeta pide nombre y teléfono de 10 dígitos', () => {
    const missing = resolvePayerContact(
      { card_payer_name: 'Ana' },
      { transferMxn: 0, cardMxn: 50, checkMxn: 0 },
    );
    expect(missing.error).toBe('Ingresa el teléfono de quien paga con tarjeta (10 dígitos)');

    const ok = resolvePayerContact(
      { card_payer_name: 'Ana López', card_payer_phone: '664 123 4567' },
      { transferMxn: 0, cardMxn: 50, checkMxn: 0 },
    );
    expect(ok.error).toBeNull();
    expect(ok.contact.cardPayerPhone).toBe('6641234567');
  });

  it('un cheque en dólares también pide nombre y teléfono', () => {
    const missing = resolvePayerContact(
      {},
      { transferMxn: 0, cardMxn: 0, checkMxn: 0, checkUsd: 40 },
    );
    expect(missing.error).toBe('Ingresa el nombre de quien paga con cheque');
  });

  it('cheque pide nombre y teléfono', () => {
    const result = resolvePayerContact(
      { check_payer_name: 'Luis', check_payer_phone: '6640001122' },
      { transferMxn: 0, cardMxn: 0, checkMxn: 80 },
    );
    expect(result.error).toBeNull();
    expect(formatPayerContactSummary(result.contact)).toBe('Luis · 6640001122');
  });
});
