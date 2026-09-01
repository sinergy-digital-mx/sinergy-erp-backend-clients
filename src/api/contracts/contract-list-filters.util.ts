import { SelectQueryBuilder } from 'typeorm';
import { Contract } from '../../entities/contracts/contract.entity';

export type ContractListFilters = {
  customerId?: number;
  propertyId?: string;
  status?: string;
  hasOverdue?: boolean;
  search?: string;
  group_id?: string;
};

/** Joins needed by search / group_id. Call before applyContractListFilters. */
export function joinContractFilterRelations(
  query: SelectQueryBuilder<Contract>,
  opts?: { select?: boolean },
): void {
  if (opts?.select) {
    query.leftJoinAndSelect('c.customer', 'customer');
    query.leftJoinAndSelect('customer.group', 'customerGroup');
    query.leftJoinAndSelect('c.property', 'property');
    return;
  }

  query.leftJoin('c.customer', 'customer');
  query.leftJoin('c.property', 'property');
}

export function applyContractListFilters(
  query: SelectQueryBuilder<Contract>,
  filters: ContractListFilters,
): void {
  if (filters.customerId) {
    query.andWhere('c.customer_id = :customerId', { customerId: filters.customerId });
  }

  if (filters.propertyId) {
    query.andWhere('c.property_id = :propertyId', { propertyId: filters.propertyId });
  }

  if (filters.status) {
    query.andWhere('c.status = :status', { status: filters.status });
  }

  if (filters.group_id) {
    query.andWhere(
      '(customer.group_id = :group_id OR property.group_id = :group_id)',
      { group_id: filters.group_id },
    );
  }

  if (filters.hasOverdue === true) {
    query.andWhere(
      `EXISTS (
        SELECT 1 FROM contract_payments overdue_filter_p
        WHERE overdue_filter_p.contract_id = c.id
          AND overdue_filter_p.is_overdue = true
          AND overdue_filter_p.status IN ('pendiente', 'parcial')
      )`,
    );
  }

  if (filters.search) {
    query.andWhere(
      '(customer.name LIKE :search OR customer.lastname LIKE :search OR c.contract_number LIKE :search OR property.code LIKE :search OR LOWER(property.cadastral_key) LIKE LOWER(:search))',
      { search: `%${filters.search}%` },
    );
  }
}
