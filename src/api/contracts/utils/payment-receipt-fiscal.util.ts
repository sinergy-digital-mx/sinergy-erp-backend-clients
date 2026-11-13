export function resolveReceiptFiscalId(input: {
  contractFiscalId?: string | null;
  templateFiscalId?: string | null;
  systemLogoFiscalId?: string | null;
  firstFiscalId?: string | null;
}): string | null {
  return (
    normalizeId(input.contractFiscalId) ||
    normalizeId(input.templateFiscalId) ||
    normalizeId(input.systemLogoFiscalId) ||
    normalizeId(input.firstFiscalId)
  );
}

function normalizeId(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}
