import type { FinkokEnvironment } from '../../../entities/electronic-invoicing/finkok-provider-configuration.entity';

function environmentLabel(environment?: FinkokEnvironment): string {
  if (environment === 'production') {
    return 'producción';
  }
  if (environment === 'demo') {
    return 'demo';
  }
  return environment ?? 'configurado';
}

export function isFinkokAuthenticationFailed(message?: string | null): boolean {
  return (message ?? '').toLowerCase().includes('authentication failed');
}

/** Traduce mensajes crudos de Finkok Registration a texto usable en UI. */
export function translateFinkokRegistrationError(
  message: string | undefined | null,
  environment?: FinkokEnvironment,
): string {
  const raw = (message ?? '').trim();
  if (!raw) {
    return 'Finkok rechazó el alta del emisor';
  }

  const env = environmentLabel(environment);
  if (isFinkokAuthenticationFailed(raw)) {
    return (
      `Finkok rechazó el alta en ${env}: el usuario de Integración Finkok autentica el timbrado, pero no el registro de RFCs. ` +
      `En Integración Finkok (${env}) use el usuario administrador del portal (correo de la cuenta Integración), no el token SOAP (maderia-mzn / mzn-prod). ` +
      `Quitar el RFC del token no habilita esta API.`
    );
  }

  return raw;
}
