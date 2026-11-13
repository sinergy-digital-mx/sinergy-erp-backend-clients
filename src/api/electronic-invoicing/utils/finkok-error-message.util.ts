const BY_CODE: Record<string, string> = {
  '702':
    'Finkok no reconoció el usuario o la contraseña de este ambiente. Revísalos en Configuración, integración Finkok.',
};

const ENGLISH =
  /\b(sorry|error|when|validating|reseller|user|please|failed|invalid|unable|password|username)\b/i;

export function finkokErrorMessage(code: string | null | undefined, raw: string | null | undefined): string {
  const codigo = String(code || '').trim();
  const text = String(raw || '').trim();
  const known = codigo ? BY_CODE[codigo] : undefined;
  if (known) {
    return `${codigo}: ${known}`;
  }
  if (!text || ENGLISH.test(text)) {
    return codigo
      ? `${codigo}: Finkok rechazó la operación. Revisa el ambiente y las credenciales.`
      : 'Finkok rechazó la operación. Revisa el ambiente y las credenciales.';
  }
  return codigo ? `${codigo}: ${text}` : text;
}

export function stampRejectionMessage(
  code: string | null | undefined,
  raw: string | null | undefined,
  extra: string | null | undefined,
  fecha: string | null | undefined,
  postalCode: string | null | undefined,
): string {
  let message = finkokErrorMessage(code, raw);
  if (String(code || '').trim() === '401' && fecha) {
    const lugar = postalCode ? `, código postal ${postalCode}` : '';
    message += `. Fecha enviada ${fecha}${lugar}. Finkok la compara con la hora de ese código postal: no puede ir adelantada ni tener más de 72 horas.`;
  }
  const detail = extra?.trim();
  if (detail) {
    message += ` ${detail}`;
  }
  return message;
}
