import { SelectQueryBuilder } from 'typeorm';
import { Customer } from '../../../entities/customers/customer.entity';

export const CUSTOMER_LIST_INSIGHTS = [
  'with_orders',
  'without_orders',
  'fiscal_ready',
  'fiscal_not_ready',
  'active',
  'inactive',
  'with_email',
  'without_email',
] as const;

export type CustomerListInsight = (typeof CUSTOMER_LIST_INSIGHTS)[number];

export const CUSTOMER_INSIGHT_LABELS: Record<CustomerListInsight, string> = {
  with_orders: 'Con órdenes',
  without_orders: 'Sin órdenes',
  fiscal_ready: 'Listos para facturar',
  fiscal_not_ready: 'Sin datos fiscales',
  active: 'Activos',
  inactive: 'Inactivos',
  with_email: 'Con correo',
  without_email: 'Sin correo',
};

export const CUSTOMER_HAS_ORDER_SQL = `EXISTS (
    SELECT 1 FROM inv_s_sales_orders so
    WHERE so.customer_id = customer.id
      AND so.tenant_id = customer.tenant_id
      AND so.general_status <> 'Cancelada'
)`;

export const CUSTOMER_FISCAL_READY_SQL = `(
    customer.fiscal_rfc IS NOT NULL
    AND TRIM(customer.fiscal_rfc) <> ''
    AND UPPER(TRIM(customer.fiscal_rfc)) NOT IN ('XAXX010101000', 'XEXX010101000')
    AND customer.fiscal_razon_social IS NOT NULL
    AND TRIM(customer.fiscal_razon_social) <> ''
    AND TRIM(customer.fiscal_postal_code) REGEXP '^[0-9]{5}$'
)`;

export const CUSTOMER_HAS_EMAIL_SQL = `(
    customer.email IS NOT NULL AND TRIM(customer.email) <> ''
)`;

export const CUSTOMER_IS_ACTIVE_SQL = `(status.code = 'ACTIVE')`;

export const CUSTOMER_IS_INACTIVE_SQL = `(status.code IS NULL OR status.code <> 'ACTIVE')`;

export function isCustomerListInsight(
  value: unknown,
): value is CustomerListInsight {
  return (
    typeof value === 'string' &&
    (CUSTOMER_LIST_INSIGHTS as readonly string[]).includes(value)
  );
}

export function customerInsightLabel(insight: CustomerListInsight): string {
  return CUSTOMER_INSIGHT_LABELS[insight];
}

export function customerInsightWhere(insight: CustomerListInsight): string {
  switch (insight) {
    case 'with_orders':
      return CUSTOMER_HAS_ORDER_SQL;
    case 'without_orders':
      return `NOT (${CUSTOMER_HAS_ORDER_SQL})`;
    case 'fiscal_ready':
      return CUSTOMER_FISCAL_READY_SQL;
    case 'fiscal_not_ready':
      return `NOT (${CUSTOMER_FISCAL_READY_SQL})`;
    case 'active':
      return CUSTOMER_IS_ACTIVE_SQL;
    case 'inactive':
      return CUSTOMER_IS_INACTIVE_SQL;
    case 'with_email':
      return CUSTOMER_HAS_EMAIL_SQL;
    case 'without_email':
      return `NOT (${CUSTOMER_HAS_EMAIL_SQL})`;
  }
}

export interface CustomerDirectoryFilter {
  search?: string;
  status_id?: number;
  group_id?: string;
  registered_fiscal_configuration_id?: string;
  insight?: string;
}

export function applyCustomerDirectoryFilters(
  qb: SelectQueryBuilder<Customer>,
  query?: CustomerDirectoryFilter,
  options?: { applyInsight?: boolean },
): void {
  if (query?.search) {
    const term = `%${query.search.trim()}%`;
    qb.andWhere(
      `(
                LOWER(customer.name) LIKE LOWER(:search)
                OR LOWER(customer.lastname) LIKE LOWER(:search)
                OR LOWER(CONCAT(customer.name, ' ', COALESCE(customer.lastname, ''))) LIKE LOWER(:search)
                OR LOWER(CONCAT(COALESCE(customer.lastname, ''), ' ', customer.name)) LIKE LOWER(:search)
                OR LOWER(customer.email) LIKE LOWER(:search)
                OR LOWER(customer.phone) LIKE LOWER(:search)
                OR LOWER(customer.phone_code) LIKE LOWER(:search)
                OR LOWER(CONCAT(COALESCE(customer.phone_code, ''), customer.phone)) LIKE LOWER(:search)
                OR LOWER(customer.company_name) LIKE LOWER(:search)
                OR LOWER(customer.website) LIKE LOWER(:search)
                OR LOWER(customer.additional_name) LIKE LOWER(:search)
                OR LOWER(customer.additional_lastname) LIKE LOWER(:search)
                OR LOWER(CONCAT(customer.additional_name, ' ', COALESCE(customer.additional_lastname, ''))) LIKE LOWER(:search)
                OR LOWER(customer.additional_email) LIKE LOWER(:search)
                OR LOWER(customer.additional_phone) LIKE LOWER(:search)
                OR LOWER(customer.fiscal_rfc) LIKE LOWER(:search)
                OR LOWER(customer.fiscal_razon_social) LIKE LOWER(:search)
                OR LOWER(property.code) LIKE LOWER(:search)
                OR LOWER(property.name) LIKE LOWER(:search)
                OR LOWER(property.cadastral_key) LIKE LOWER(:search)
                OR LOWER(contracts.contract_number) LIKE LOWER(:search)
            )`,
      { search: term },
    );
  }

  if (query?.status_id) {
    qb.andWhere('customer.status_id = :status_id', {
      status_id: query.status_id,
    });
  }

  if (query?.group_id) {
    qb.andWhere('customer.group_id = :group_id', {
      group_id: query.group_id,
    });
  }

  if (query?.registered_fiscal_configuration_id) {
    qb.andWhere(
      'customer.registered_fiscal_configuration_id = :registered_fiscal_configuration_id',
      {
        registered_fiscal_configuration_id:
          query.registered_fiscal_configuration_id,
      },
    );
  }

  if (options?.applyInsight !== false && isCustomerListInsight(query?.insight)) {
    qb.andWhere(customerInsightWhere(query.insight));
  }
}
