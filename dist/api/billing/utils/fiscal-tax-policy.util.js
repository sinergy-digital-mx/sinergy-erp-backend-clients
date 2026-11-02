"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFiscalFlagOn = isFiscalFlagOn;
exports.readFiscalTaxPolicy = readFiscalTaxPolicy;
exports.clampTaxPercentages = clampTaxPercentages;
exports.loadTenantIepsEnabled = loadTenantIepsEnabled;
exports.columnsWithoutDisabledIeps = columnsWithoutDisabledIeps;
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
async function loadTenantIepsEnabled(db, tenantId) {
    const active = await db.query(`SELECT ieps_enabled
     FROM fiscal_configurations
     WHERE tenant_id = ? AND status = 'active'`, [tenantId]);
    const rows = active?.length
        ? active
        : await db.query(`SELECT ieps_enabled FROM fiscal_configurations WHERE tenant_id = ?`, [tenantId]);
    if (!rows?.length)
        return true;
    return rows.some((row) => isFiscalFlagOn(row?.ieps_enabled, true));
}
function columnsWithoutDisabledIeps(columns, iepsEnabled) {
    if (iepsEnabled)
        return columns;
    return columns.filter((column) => !/ieps/i.test(`${column.key} ${column.header}`));
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