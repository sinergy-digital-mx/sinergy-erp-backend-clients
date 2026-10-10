"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFiscalFlagOn = isFiscalFlagOn;
exports.readFiscalTaxPolicy = readFiscalTaxPolicy;
exports.clampTaxPercentages = clampTaxPercentages;
exports.loadFiscalTaxPolicy = loadFiscalTaxPolicy;
function isFiscalFlagOn(value, fallback = true) {
    if (value === undefined || value === null || value === '') {
        return fallback;
    }
    if (value === false || value === 0 || value === '0' || value === 'false') {
        return false;
    }
    return value === true || value === 1 || value === '1' || value === 'true';
}
function readFiscalTaxPolicy(row) {
    return {
        ivaEnabled: isFiscalFlagOn(row?.iva_enabled, true),
        iepsEnabled: isFiscalFlagOn(row?.ieps_enabled, true),
    };
}
function clampTaxPercentages(ivaPercentage, iepsPercentage, policy) {
    return {
        ivaPercentage: policy.ivaEnabled ? ivaPercentage : 0,
        iepsPercentage: policy.iepsEnabled ? iepsPercentage : 0,
    };
}
async function loadFiscalTaxPolicy(db, fiscalConfigurationId, tenantId) {
    if (!fiscalConfigurationId) {
        return { ivaEnabled: true, iepsEnabled: true };
    }
    const rows = await db.query(`SELECT iva_enabled, ieps_enabled
     FROM fiscal_configurations
     WHERE id = ? AND tenant_id = ?
     LIMIT 1`, [fiscalConfigurationId, tenantId]);
    return readFiscalTaxPolicy(rows?.[0]);
}
//# sourceMappingURL=fiscal-tax-policy.util.js.map