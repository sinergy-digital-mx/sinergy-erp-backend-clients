"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeVendorCompleteness = computeVendorCompleteness;
exports.normalizeVendorName = normalizeVendorName;
exports.normalizeFiscalId = normalizeFiscalId;
exports.normalizeBankId = normalizeBankId;
exports.findSimilarVendors = findSimilarVendors;
exports.pickBestSimilarVendor = pickBestSimilarVendor;
const vendor_type_enum_1 = require("../../../entities/vendor/vendor-type.enum");
const GENERIC_RFCS = new Set(['XAXX010101000', 'XEXX010101000']);
const LEGAL_SUFFIX = /\b(s\.?\s*a\.?|s\.?\s*de\s*r\.?\s*l\.?|s\.?\s*en\s*c\.?|c\.?\s*v\.?|s\.?\s*c\.?|llc|inc|ltd|gmbh|corp|co|company|sa|cv|srl|sas|de)\b/gi;
const SIMILAR_MATCH_LIMIT = 3;
function isFilled(value) {
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
function computeVendorCompleteness(vendor) {
    const isInternational = vendor.vendor_type === vendor_type_enum_1.VendorType.INTERNATIONAL;
    const slots = [
        isFilled(vendor.name),
        isFilled(vendor.company_name),
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
function normalizeVendorName(value) {
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
function normalizeFiscalId(value) {
    const id = value?.trim().toUpperCase().replace(/[\s.-]/g, '');
    if (!id || GENERIC_RFCS.has(id)) {
        return null;
    }
    return id;
}
function normalizeBankId(value) {
    const id = value?.trim().toUpperCase().replace(/[\s-]/g, '');
    return id || null;
}
function levenshtein(a, b) {
    if (a === b)
        return 0;
    if (!a.length)
        return b.length;
    if (!b.length)
        return a.length;
    const row = new Array(b.length + 1);
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
function namesLookSimilar(left, right) {
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
function fiscalIdsLookSimilar(left, right) {
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
function companyOf(vendor) {
    return vendor.company_name || vendor.razon_social || vendor.legal_name || null;
}
function bankIdsOf(vendor) {
    return [
        normalizeBankId(vendor.bank_clabe),
        normalizeBankId(vendor.bank_iban),
        normalizeBankId(vendor.bank_account_number),
    ].filter((value) => Boolean(value) && value.length >= 6);
}
function findSimilarVendors(vendor, catalog, limit = SIMILAR_MATCH_LIMIT) {
    const matches = [];
    for (const other of catalog) {
        if (!other.id || other.id === vendor.id) {
            continue;
        }
        const reasons = [];
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
        if (namesLookSimilar(vendor.name, other.name)) {
            reasons.push('name');
            score = Math.max(score, normalizeVendorName(vendor.name) === normalizeVendorName(other.name) ? 90 : 78);
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
            name: other.name ?? '',
            company_name: other.company_name ?? null,
            rfc: other.rfc ?? null,
            tax_id: other.tax_id ?? null,
            match_reasons: reasons,
            score,
        });
    }
    return matches.sort((a, b) => b.score - a.score).slice(0, limit);
}
function pickBestSimilarVendor(matches, catalog, purchaseCounts, completeness) {
    if (!matches.length) {
        return null;
    }
    const ranked = [...matches].sort((a, b) => {
        const po = (purchaseCounts.get(b.id) ?? 0) - (purchaseCounts.get(a.id) ?? 0);
        if (po)
            return po;
        const complete = (completeness.get(b.id) ?? 0) - (completeness.get(a.id) ?? 0);
        if (complete)
            return complete;
        return b.score - a.score;
    });
    return catalog.find((item) => item.id === ranked[0].id) ?? null;
}
//# sourceMappingURL=vendor-profile.util.js.map