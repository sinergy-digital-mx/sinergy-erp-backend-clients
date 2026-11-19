import { inferReceptorRegimen, receptorRegimenMismatch } from './cfdi-regimen-person.util';

describe('inferReceptorRegimen', () => {
  it('usa el RFC aunque el catálogo diga persona física', () => {
    expect(inferReceptorRegimen('VTI040608HP6', 'fisica')).toBe('601');
    expect(inferReceptorRegimen('ROMR9606149GA', 'moral')).toBe('612');
  });

  it('marca público en general con 616', () => {
    expect(inferReceptorRegimen('XAXX010101000')).toBe('616');
  });
});

describe('receptorRegimenMismatch', () => {
  it('rechaza el 601 cuando el RFC es de persona física', () => {
    expect(receptorRegimenMismatch('ROMR9606149GA', '601')).toMatch(/persona física/);
  });

  it('acepta el 601 en una persona moral y el 612 en una física', () => {
    expect(receptorRegimenMismatch('VTI040608HP6', '601')).toBeNull();
    expect(receptorRegimenMismatch('ROMR9606149GA', '612')).toBeNull();
  });
});
