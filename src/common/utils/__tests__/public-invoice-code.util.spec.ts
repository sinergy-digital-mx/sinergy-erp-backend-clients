import {
  buildPublicInvoiceCode,
  buildSelfInvoicePortalUrl,
  extractInvoiceSequence,
  normalizePublicInvoiceCode,
} from '../public-invoice-code.util';

describe('public-invoice-code.util', () => {
  it('arma MZN-CENT-INV-000012 desde prefijos y folio interno', () => {
    expect(buildPublicInvoiceCode('MZN', 'CENT', 'OSV-000012')).toBe(
      'MZN-CENT-INV-000012',
    );
  });

  it('deriva prefijos si faltan en config', () => {
    expect(
      buildPublicInvoiceCode(null, null, 'OV-99', 'Mazatlan Norte', 'Centro'),
    ).toBe('MAZ-CENT-INV-000099');
  });

  it('normaliza el código que escribe el cliente', () => {
    expect(normalizePublicInvoiceCode(' mzn-cent-inv-000012 ')).toBe(
      'MZN-CENT-INV-000012',
    );
  });

  it('extrae la secuencia numérica del folio', () => {
    expect(extractInvoiceSequence('OSV-000005')).toBe('000005');
  });

  it('mete el folio y el email en la URL del QR', () => {
    const url = buildSelfInvoicePortalUrl(
      'MZN-CENT-INV-000012',
      'ana@empresa.com',
      'https://facturacion.sinergydigital.mx',
    );
    expect(url).toBe(
      'https://facturacion.sinergydigital.mx/facturar/MZN-CENT-INV-000012?email=ana%40empresa.com',
    );
  });

  it('omite email inválido en la URL', () => {
    const url = buildSelfInvoicePortalUrl(
      'MZN-CENT-INV-000012',
      '',
      'https://facturacion.sinergydigital.mx',
    );
    expect(url).toBe(
      'https://facturacion.sinergydigital.mx/facturar/MZN-CENT-INV-000012',
    );
  });
});
