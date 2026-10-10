"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPurchaseOrderLocationTree = buildPurchaseOrderLocationTree;
const fiscal_tax_policy_util_1 = require("../../billing/utils/fiscal-tax-policy.util");
function toWarehouseNode(warehouse) {
    return {
        id: warehouse.id,
        name: warehouse.name,
        status: warehouse.status,
    };
}
function buildPurchaseOrderLocationTree(fiscals, branches, warehouses) {
    const branchIds = new Set(branches.map((branch) => branch.id));
    const warehousesByBranch = new Map();
    const unassigned_warehouses = [];
    for (const warehouse of warehouses) {
        const branchId = warehouse.billing_branch_id ?? null;
        if (!branchId || !branchIds.has(branchId)) {
            unassigned_warehouses.push(toWarehouseNode(warehouse));
            continue;
        }
        const list = warehousesByBranch.get(branchId) ?? [];
        list.push(toWarehouseNode(warehouse));
        warehousesByBranch.set(branchId, list);
    }
    const branchesByFiscal = new Map();
    for (const branch of branches) {
        const list = branchesByFiscal.get(branch.fiscal_configuration_id) ?? [];
        list.push(branch);
        branchesByFiscal.set(branch.fiscal_configuration_id, list);
    }
    return {
        data: fiscals.map((fiscal) => ({
            id: fiscal.id,
            razon_social: fiscal.razon_social,
            rfc: fiscal.rfc,
            status: fiscal.status,
            iva_enabled: (0, fiscal_tax_policy_util_1.isFiscalFlagOn)(fiscal.iva_enabled, true),
            ieps_enabled: (0, fiscal_tax_policy_util_1.isFiscalFlagOn)(fiscal.ieps_enabled, true),
            multi_fiscal_transfers_enabled: (0, fiscal_tax_policy_util_1.isFiscalFlagOn)(fiscal.multi_fiscal_transfers_enabled, true),
            branches: (branchesByFiscal.get(fiscal.id) ?? []).map((branch) => ({
                id: branch.id,
                name: branch.code,
                status: branch.status,
                warehouses: warehousesByBranch.get(branch.id) ?? [],
            })),
        })),
        unassigned_warehouses,
    };
}
//# sourceMappingURL=purchase-order-location.util.js.map