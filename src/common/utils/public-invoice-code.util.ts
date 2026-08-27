const DEFAULT_PORTAL_ORIGIN = 'https://facturacion.sinergydigital.mx';
const DEFAULT_PORTAL_PATH = '/facturar';

/** Folio público global: `{RAZON}-{SUCURSAL}-INV-000012` */
export function buildPublicInvoiceCode(
  fiscalPrefix: string | null | undefined,
  branchPrefix: string | null | undefined,
  orderFolio: string,
  fallbackFiscalName?: string | null,
  fallbackBranchName?: string | null,
): string {
  const fiscal = fallbackDocumentPrefix(fiscalPrefix, fallbackFiscalName, 3);
  const branch = fallbackDocumentPrefix(branchPrefix, fallbackBranchName, 4);
  const sequence = extractInvoiceSequence(orderFolio);
  return `${fiscal}-${branch}-INV-${sequence}`;
}

export function extractInvoiceSequence(folio: string): string {
  const match = String(folio ?? '').match(/(\d+)\s*$/);
  const value = match ? Number(match[1]) : 0;
  const safe = Number.isFinite(value) && value > 0 ? value : 0;
  return String(safe).padStart(6, '0');
}

export function fallbackDocumentPrefix(
  configured: string | null | undefined,
  sourceName: string | null | undefined,
  length: number,
): string {
  const fromConfig = String(configured ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  if (fromConfig) {
    return fromConfig.slice(0, 10);
  }

  const fromName = slugPrefix(sourceName, length);
  return fromName || 'X'.repeat(Math.min(length, 3));
}

export function slugPrefix(value: string | null | undefined, length: number): string {
  const normalized = String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  if (!normalized) {
    return '';
  }
  return normalized.slice(0, Math.max(1, length));
}

export function normalizePublicInvoiceCode(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

export function resolveSelfInvoicePortalOrigin(
  configured = process.env.SELF_INVOICE_PORTAL_BASE_URL,
): string {
  const raw = String(configured ?? '').trim().replace(/\/+$/, '');
  return raw || DEFAULT_PORTAL_ORIGIN;
}

export function buildSelfInvoicePortalUrl(
  publicInvoiceCode: string,
  email?: string | null,
  configuredBase = process.env.SELF_INVOICE_PORTAL_BASE_URL,
): string {
  const origin = resolveSelfInvoicePortalOrigin(configuredBase);
  const path = `${DEFAULT_PORTAL_PATH}/${encodeURIComponent(publicInvoiceCode)}`;
  const url = new URL(path, `${origin}/`);
  const trimmedEmail = String(email ?? '').trim();
  if (trimmedEmail && trimmedEmail.includes('@')) {
    url.searchParams.set('email', trimmedEmail);
  }
  return url.toString();
}

export function withCollisionSuffix(code: string, uniquePart: string): string {
  const suffix = slugPrefix(uniquePart, 4) || 'X';
  return `${code}-${suffix}`.slice(0, 48);
}
