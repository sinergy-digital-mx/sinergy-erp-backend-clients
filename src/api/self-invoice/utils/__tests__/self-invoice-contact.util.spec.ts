import {
  emailsMatch,
  isUsableEmail,
  phonesMatch,
} from '../self-invoice-contact.util';

describe('self-invoice-contact.util', () => {
  it('compara correos sin importar mayúsculas', () => {
    expect(emailsMatch('Ana@Empresa.com', 'ana@empresa.com')).toBe(true);
    expect(emailsMatch('a@b.com', 'c@d.com')).toBe(false);
  });

  it('compara teléfonos por los últimos 10 dígitos', () => {
    expect(phonesMatch('+52 6641234567', '6641234567')).toBe(true);
    expect(phonesMatch('6641234567', '6640000000')).toBe(false);
  });

  it('detecta correo usable para el QR', () => {
    expect(isUsableEmail('ana@empresa.com')).toBe(true);
    expect(isUsableEmail('mostrador')).toBe(false);
  });
});
