import { Vendor } from '../../../entities/vendor/vendor.entity';
import { VendorType } from '../../../entities/vendor/vendor-type.enum';

export type VendorMatchReason = 'rfc' | 'tax_id' | 'name' | 'company' | 'bank';

export interface VendorSimilarMatch {
  id: string;
  name: string;
  company_name: string | null;
  rfc: string | null;
  tax_id: string | null;
  match_reasons: VendorMatchReason[];
  score: number;
}

const GENERIC_RFCS = new Set(['XAXX010101000', 'XEXX010101000']);
const LEGAL_SUFFIX =
  /\b(s\.?\s*a\.?|s\.?\s*de\s*r\.?\s*l\.?|s\.?\s*en\s*c\.?|c\.?\s*v\.?|s\.?\s*c\.?|llc|inc|ltd|gmbh|corp|co|company|sa|cv|srl|sas|de)\b/gi;
const SIMILAR_MATCH_LIMIT = 3;

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '0' || trimmed === '0.00') {
      return false;
    }
    return true;
  }
  return Boolean(value);
}

export function computeVendorCompleteness(vendor: Partial<Vendor>): number {
  const isInternational = vendor.vendor_type === VendorType.INTERNATIONAL;
  const slots = [
    isFilled(vendor.company_name) || isFilled(vendor.name),
    isInternational ? isFilled(vendor.tax_id) : isFilled(vendor.rfc),
    isInternational ? isFilled(vendor.legal_name) : isFilled(vendor.razon_social),
    isFilled(vendor.street),
    isFilled(vendor.city),
    isFilled(vendor.state),
    isFilled(vendor.zip_code),
    isFilled(vendor.bank_name),
    isFilled(vendor.bank_account_holder),
    isInternational
      ? isFilled(vendor.bank_swift_bic) ||
        isFilled(vendor.bank_iban) ||
        isFilled(vendor.bank_account_number)
      : isFilled(vendor.bank_clabe) || isFilled(vendor.bank_account_number),
    isFilled(vendor.credit_days) || isFilled(vendor.credit_limit),
  ];
  if (isInternational) {
    slots.push(isFilled(vendor.country));
  }
  const filled = slots.filter(Boolean).length;
  return Math.round((filled / slots.length) * 100);
}

export function normalizeVendorName(value?: string | null): string | null {
  if (!value?.trim()) {
    return null;
  }
  const normalized = value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[.,'"()/]/g, ' ')
    .replace(LEGAL_SUFFIX, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized || null;
}

export function normalizeFiscalId(value?: string | null): string | null {
  const id = value?.trim().toUpperCase().replace(/[\s.-]/g, '');
  if (!id || GENERIC_RFCS.has(id)) {
    return null;
  }
  return id;
}

export function normalizeBankId(value?: string | null): string | null {
  const id = value?.trim().toUpperCase().replace(/[\s-]/g, '');
  return id || null;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) {
    row[j] = j;
  }
  for (let i = 1; i <= a.length; i += 1) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = current;
    }
  }
  return row[b.length];
}

function namesLookSimilar(left?: string | null, right?: string | null): boolean {
  const a = normalizeVendorName(left);
  const b = normalizeVendorName(right);
  if (!a || !b) {
    return false;
  }
  if (a === b) {
    return true;
  }
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  if (shorter.length >= 8 && longer.includes(shorter)) {
    return true;
  }
  if (shorter.length < 6) {
    return false;
  }
  const distance = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return distance <= 3 && (maxLen - distance) / maxLen >= 0.86;
}

function fiscalIdsLookSimilar(left?: string | null, right?: string | null): boolean {
  const a = normalizeFiscalId(left);
  const b = normalizeFiscalId(right);
  if (!a || !b) {
    return false;
  }
  if (a === b) {
    return true;
  }
  if (Math.abs(a.length - b.length) > 1) {
    return false;
  }
  if (a.length >= 10 && b.length >= 10 && a.slice(0, 10) === b.slice(0, 10)) {
    return true;
  }
  return a.length >= 10 && b.length >= 10 && levenshtein(a, b) <= 2;
}

export function vendorCompanyName(
  vendor?: { company_name?: string | null; name?: string | null } | null,
): string {
  return (vendor?.company_name || vendor?.name || '').trim();
}

function companyOf(vendor: Partial<Vendor>): string | null {
  return (
    vendor.company_name?.trim() ||
    vendor.name?.trim() ||
    vendor.razon_social?.trim() ||
    vendor.legal_name?.trim() ||
    null
  );
}

function bankIdsOf(vendor: Partial<Vendor>): string[] {
  return [
    normalizeBankId(vendor.bank_clabe),
    normalizeBankId(vendor.bank_iban),
    normalizeBankId(vendor.bank_account_number),
  ].filter((value): value is string => Boolean(value) && value!.length >= 6);
}

export function findSimilarVendors(
  vendor: Partial<Vendor> & { id?: string },
  catalog: Array<Partial<Vendor> & { id: string }>,
  limit = SIMILAR_MATCH_LIMIT,
): VendorSimilarMatch[] {
  const matches: VendorSimilarMatch[] = [];
  for (const other of catalog) {
    if (!other.id || other.id === vendor.id) {
      continue;
    }
    const reasons: VendorMatchReason[] = [];
    let score = 0;
    if (fiscalIdsLookSimilar(vendor.rfc, other.rfc)) {
      reasons.push('rfc');
      score = Math.max(score, normalizeFiscalId(vendor.rfc) === normalizeFiscalId(other.rfc) ? 100 : 92);
    }
    if (fiscalIdsLookSimilar(vendor.tax_id, other.tax_id)) {
      reasons.push('tax_id');
      score = Math.max(score, normalizeFiscalId(vendor.tax_id) === normalizeFiscalId(other.tax_id) ? 100 : 92);
    }
    const vendorBanks = bankIdsOf(vendor);
    const otherBanks = new Set(bankIdsOf(other));
    if (vendorBanks.some((id) => otherBanks.has(id))) {
      reasons.push('bank');
      score = Math.max(score, 95);
    }
    if (namesLookSimilar(companyOf(vendor), companyOf(other))) {
      reasons.push('company');
      score = Math.max(score, 82);
    }
    if (!reasons.length) {
      continue;
    }
    matches.push({
      id: other.id,
      name: vendorCompanyName(other),
      company_name: other.company_name ?? null,
      rfc: other.rfc ?? null,
      tax_id: other.tax_id ?? null,
      match_reasons: reasons,
      score,
    });
  }
  return matches.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function pickBestSimilarVendor<T extends { id: string }>(
  matches: VendorSimilarMatch[],
  catalog: T[],
  purchaseCounts: Map<string, number>,
  completeness: Map<string, number>,
): T | null {
  if (!matches.length) {
    return null;
  }
  const ranked = [...matches].sort((a, b) => {
    const po = (purchaseCounts.get(b.id) ?? 0) - (purchaseCounts.get(a.id) ?? 0);
    if (po) return po;
    const complete = (completeness.get(b.id) ?? 0) - (completeness.get(a.id) ?? 0);
    if (complete) return complete;
    return b.score - a.score;
  });
  return catalog.find((item) => item.id === ranked[0].id) ?? null;
}
