import { BadRequestException } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';

export type InventoryLocationQuery = {
  fiscal_configuration_id?: string;
  billing_branch_id?: string;
  warehouse_id?: string;
};

/** Valida la cascada: sucursal requiere razón social; almacén requiere sucursal. */
export function assertInventoryLocationCascade(filters: InventoryLocationQuery): void {
  if (filters.billing_branch_id && !filters.fiscal_configuration_id) {
    throw new BadRequestException(
      'Selecciona una razón social antes de filtrar por sucursal',
    );
  }

  if (filters.warehouse_id && !filters.billing_branch_id) {
    throw new BadRequestException(
      'Selecciona una sucursal antes de filtrar por almacén',
    );
  }
}

/** Une sucursal y razón social al query de lotes (warehouse ya debe estar joineado). */
export function joinInventoryLocation(
  qb: SelectQueryBuilder<InventoryBatch>,
  warehouseAlias = 'warehouse',
): SelectQueryBuilder<InventoryBatch> {
  return qb
    .leftJoinAndSelect(`${warehouseAlias}.billing_branch`, 'billing_branch')
    .leftJoinAndSelect('billing_branch.fiscal_configuration', 'fiscal_configuration');
}

/** Aplica filtros de razón social / sucursal / almacén. Requiere join de location. */
export function applyInventoryLocationFilters(
  qb: SelectQueryBuilder<InventoryBatch>,
  filters: InventoryLocationQuery,
  warehouseAlias = 'warehouse',
): void {
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
