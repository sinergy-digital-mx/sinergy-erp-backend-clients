"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertInventoryLocationCascade = assertInventoryLocationCascade;
exports.joinInventoryLocation = joinInventoryLocation;
exports.applyInventoryLocationFilters = applyInventoryLocationFilters;
const common_1 = require("@nestjs/common");
function assertInventoryLocationCascade(filters) {
    if (filters.billing_branch_id && !filters.fiscal_configuration_id) {
        throw new common_1.BadRequestException('Selecciona una razón social antes de filtrar por sucursal');
    }
    if (filters.warehouse_id && !filters.billing_branch_id) {
        throw new common_1.BadRequestException('Selecciona una sucursal antes de filtrar por almacén');
    }
}
function joinInventoryLocation(qb, warehouseAlias = 'warehouse', options) {
    if (options?.select === false) {
        return qb
            .leftJoin(`${warehouseAlias}.billing_branch`, 'billing_branch')
            .leftJoin('billing_branch.fiscal_configuration', 'fiscal_configuration');
    }
    return qb
        .leftJoinAndSelect(`${warehouseAlias}.billing_branch`, 'billing_branch')
        .leftJoinAndSelect('billing_branch.fiscal_configuration', 'fiscal_configuration');
}
function applyInventoryLocationFilters(qb, filters, warehouseAlias = 'warehouse') {
    if (filters.fiscal_configuration_id) {
        qb.andWhere('billing_branch.fiscal_configuration_id = :fiscalConfigurationId', {
            fiscalConfigurationId: filters.fiscal_configuration_id,
        });
    }
    if (filters.billing_branch_id) {
        qb.andWhere(`${warehouseAlias}.billing_branch_id = :billingBranchId`, {
            billingBranchId: filters.billing_branch_id,
        });
    }
    if (filters.warehouse_id) {
        qb.andWhere('batch.warehouse_id = :warehouse_id', {
            warehouse_id: filters.warehouse_id,
        });
    }
}
//# sourceMappingURL=inventory-location-filter.util.js.map