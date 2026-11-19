import { finkokErrorMessage, stampRejectionMessage } from './finkok-error-message.util';

describe('finkokErrorMessage', () => {
  it('traduce el 702 del usuario reseller', () => {
    expect(
      finkokErrorMessage('702', 'Sorry there was an error when validating the reseller and user'),
    ).toContain('no reconoció el usuario');
    expect(
      finkokErrorMessage('702', 'Sorry there was an error when validating the reseller and user'),
    ).not.toMatch(/sorry/i);
  });

  it('en el 401 dice qué fecha y qué código postal se enviaron', () => {
    const message = stampRejectionMessage(
      '401',
      'Fecha y hora de generación fuera de rango',
      'LugarExpedicion 22207 corresponde a 2026-10-14T22:30:00 UTC',
      '2026-10-14T15:30:00',
      '22207',
    );
    expect(message).toContain('401: Fecha y hora de generación fuera de rango');
    expect(message).toContain('Fecha enviada 2026-10-14T15:30:00');
    expect(message).toContain('código postal 22207');
    expect(message).toContain('LugarExpedicion 22207');
  });

  it('conserva un mensaje del SAT en español', () => {
    expect(finkokErrorMessage('CFDI40101', 'El campo Nombre del receptor no coincide')).toBe(
      'CFDI40101: El campo Nombre del receptor no coincide',
    );
  });
});
