"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPublicInvoiceCode = buildPublicInvoiceCode;
exports.extractInvoiceSequence = extractInvoiceSequence;
exports.fallbackDocumentPrefix = fallbackDocumentPrefix;
exports.slugPrefix = slugPrefix;
exports.normalizePublicInvoiceCode = normalizePublicInvoiceCode;
exports.resolveSelfInvoicePortalOrigin = resolveSelfInvoicePortalOrigin;
exports.buildSelfInvoicePortalUrl = buildSelfInvoicePortalUrl;
exports.withCollisionSuffix = withCollisionSuffix;
const DEFAULT_PORTAL_ORIGIN = 'https://facturacion.sinergydigital.mx';
const DEFAULT_PORTAL_PATH = '/facturar';
function buildPublicInvoiceCode(fiscalPrefix, branchPrefix, orderFolio, fallbackFiscalName, fallbackBranchName) {
    const fiscal = fallbackDocumentPrefix(fiscalPrefix, fallbackFiscalName, 3);
    const branch = fallbackDocumentPrefix(branchPrefix, fallbackBranchName, 4);
    const sequence = extractInvoiceSequence(orderFolio);
    return `${fiscal}-${branch}-INV-${sequence}`;
}
function extractInvoiceSequence(folio) {
    const match = String(folio ?? '').match(/(\d+)\s*$/);
    const value = match ? Number(match[1]) : 0;
    const safe = Number.isFinite(value) && value > 0 ? value : 0;
    return String(safe).padStart(6, '0');
}
function fallbackDocumentPrefix(configured, sourceName, length) {
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
function slugPrefix(value, length) {
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
function normalizePublicInvoiceCode(value) {
    return String(value ?? '')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '');
}
function resolveSelfInvoicePortalOrigin(configured = process.env.SELF_INVOICE_PORTAL_BASE_URL) {
    const raw = String(configured ?? '').trim().replace(/\/+$/, '');
    return raw || DEFAULT_PORTAL_ORIGIN;
}
function buildSelfInvoicePortalUrl(publicInvoiceCode, email, configuredBase = process.env.SELF_INVOICE_PORTAL_BASE_URL) {
    const origin = resolveSelfInvoicePortalOrigin(configuredBase);
    const path = `${DEFAULT_PORTAL_PATH}/${encodeURIComponent(publicInvoiceCode)}`;
    const url = new URL(path, `${origin}/`);
    const trimmedEmail = String(email ?? '').trim();
    if (trimmedEmail && trimmedEmail.includes('@')) {
        url.searchParams.set('email', trimmedEmail);
    }
    return url.toString();
}
function withCollisionSuffix(code, uniquePart) {
    const suffix = slugPrefix(uniquePart, 4) || 'X';
    return `${code}-${suffix}`.slice(0, 48);
}
//# sourceMappingURL=public-invoice-code.util.js.map