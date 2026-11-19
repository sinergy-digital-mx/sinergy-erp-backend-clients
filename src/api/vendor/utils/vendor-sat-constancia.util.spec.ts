import { SatCsfFiscalData } from '../../customers/utils/sat-csf.util';
import { assertSatConstanciaPdf, toVendorSatConstancia } from './vendor-sat-constancia.util';

describe('toVendorSatConstancia', () => {
  const parsed: SatCsfFiscalData = {
    fiscal_rfc: 'SSS2410213X9',
    fiscal_person_type: 'moral',
    fiscal_razon_social: 'SINERGY SW SOLUTIONS',
    fiscal_postal_code: '22040',
    fiscal_country: 'MEX',
    fiscal_street: 'CALLE ESPANA',
    fiscal_exterior_number: '736',
    fiscal_interior_number: null,
    fiscal_colonia: 'JUAREZ',
    fiscal_localidad: null,
    fiscal_municipio: 'Tijuana',
    fiscal_state: 'Baja California',
  };

  it('mapea la constancia a los campos del proveedor', () => {
    expect(toVendorSatConstancia(parsed)).toEqual({
      rfc: 'SSS2410213X9',
      persona_type: 'Persona Moral',
      razon_social: 'SINERGY SW SOLUTIONS',
      street: 'CALLE ESPANA',
      exterior_number: '736',
      interior_number: null,
      colonia: 'JUAREZ',
      localidad: null,
      city: 'Tijuana',
      state: 'Baja California',
      zip_code: '22040',
      country: 'México',
    });
  });

  it('marca persona física cuando el RFC trae 13 caracteres', () => {
    expect(
      toVendorSatConstancia({
        ...parsed,
        fiscal_rfc: 'XAXX010101000',
        fiscal_person_type: 'fisica',
      }).persona_type,
    ).toBe('Persona Física');
  });
});

describe('assertSatConstanciaPdf', () => {
  it('rechaza un archivo que no es PDF', () => {
    const buffer = Buffer.from('no es pdf');
    expect(() =>
      assertSatConstanciaPdf({
        buffer,
        mimetype: 'text/plain',
        originalname: 'nota.txt',
        size: buffer.length,
      }),
    ).toThrow('Sube el PDF de la constancia del SAT.');
  });
});
