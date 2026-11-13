export interface PayerContactInput {
  transfer_payer_name?: string | null;
  transfer_payer_business_name?: string | null;
  card_payer_name?: string | null;
  card_payer_phone?: string | null;
  check_payer_name?: string | null;
  check_payer_phone?: string | null;
}

export interface PayerContactAmounts {
  transferMxn: number;
  cardMxn: number;
  checkMxn: number;
  checkUsd?: number;
}

export interface PayerContact {
  transferPayerName: string | null;
  transferPayerBusinessName: string | null;
  cardPayerName: string | null;
  cardPayerPhone: string | null;
  checkPayerName: string | null;
  checkPayerPhone: string | null;
}

const EMPTY_PAYER: PayerContact = {
  transferPayerName: null,
  transferPayerBusinessName: null,
  cardPayerName: null,
  cardPayerPhone: null,
  checkPayerName: null,
  checkPayerPhone: null,
};

export function resolvePayerContact(
  input: PayerContactInput,
  amounts: PayerContactAmounts,
): { error: string | null; contact: PayerContact } {
  const transferActive = amounts.transferMxn > 0;
  const cardActive = amounts.cardMxn > 0;
  const checkActive = amounts.checkMxn > 0 || (amounts.checkUsd ?? 0) > 0;

  const contact: PayerContact = {
    transferPayerName: transferActive ? cleanText(input.transfer_payer_name, 120) : null,
    transferPayerBusinessName: transferActive
      ? cleanText(input.transfer_payer_business_name, 180)
      : null,
    cardPayerName: cardActive ? cleanText(input.card_payer_name, 120) : null,
    cardPayerPhone: cardActive ? cleanPhone(input.card_payer_phone) : null,
    checkPayerName: checkActive ? cleanText(input.check_payer_name, 120) : null,
    checkPayerPhone: checkActive ? cleanPhone(input.check_payer_phone) : null,
  };

  if (
    transferActive &&
    !contact.transferPayerName &&
    !contact.transferPayerBusinessName
  ) {
    return {
      error: 'Ingresa el nombre o la razón social de la transferencia',
      contact: EMPTY_PAYER,
    };
  }
  if (cardActive && !contact.cardPayerName) {
    return { error: 'Ingresa el nombre de quien paga con tarjeta', contact: EMPTY_PAYER };
  }
  if (cardActive && (!contact.cardPayerPhone || contact.cardPayerPhone.length < 10)) {
    return {
      error: 'Ingresa el teléfono de quien paga con tarjeta (10 dígitos)',
      contact: EMPTY_PAYER,
    };
  }
  if (checkActive && !contact.checkPayerName) {
    return { error: 'Ingresa el nombre de quien paga con cheque', contact: EMPTY_PAYER };
  }
  if (checkActive && (!contact.checkPayerPhone || contact.checkPayerPhone.length < 10)) {
    return {
      error: 'Ingresa el teléfono de quien paga con cheque (10 dígitos)',
      contact: EMPTY_PAYER,
    };
  }

  return { error: null, contact };
}

export function formatPayerContactSummary(contact: PayerContact): string | null {
  const parts: string[] = [];
  const transfer = [contact.transferPayerName, contact.transferPayerBusinessName]
    .filter((value): value is string => Boolean(value))
    .join(' · ');
  if (transfer) {
    parts.push(transfer);
  }
  const card = [contact.cardPayerName, contact.cardPayerPhone]
    .filter((value): value is string => Boolean(value))
    .join(' · ');
  if (card) {
    parts.push(card);
  }
  const check = [contact.checkPayerName, contact.checkPayerPhone]
    .filter((value): value is string => Boolean(value))
    .join(' · ');
  if (check) {
    parts.push(check);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, max);
}

function cleanPhone(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const digits = value.replace(/\D/g, '').slice(0, 15);
  return digits || null;
}
