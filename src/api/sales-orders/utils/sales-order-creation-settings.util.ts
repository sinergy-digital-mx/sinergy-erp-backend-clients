export const SALES_ORDER_CREATION_FIELD_KEYS = [
  'fiscal_configuration_id',
  'customer',
  'billing_branch_id',
  'expected_delivery_date',
  'sale_scope',
  'currency',
  'requires_selection_assembly',
  'for_shipping',
  'notes',
] as const;

export type SalesOrderCreationFieldKey = (typeof SALES_ORDER_CREATION_FIELD_KEYS)[number];

export interface SalesOrderCreationFieldConfig {
  visible: boolean;
  required: boolean;
  default_value: string | boolean | null;
  locked: boolean;
}

export type SalesOrderCreationFields = Record<
  SalesOrderCreationFieldKey,
  SalesOrderCreationFieldConfig
>;

const LOCKED_KEYS = new Set<SalesOrderCreationFieldKey>([
  'fiscal_configuration_id',
  'customer',
]);

const BOOLEAN_KEYS = new Set<SalesOrderCreationFieldKey>([
  'requires_selection_assembly',
  'for_shipping',
]);

export function defaultSalesOrderCreationFields(): SalesOrderCreationFields {
  return {
    fiscal_configuration_id: {
      visible: true,
      required: true,
      default_value: 'user_primary',
      locked: true,
    },
    customer: {
      visible: true,
      required: true,
      default_value: null,
      locked: true,
    },
    billing_branch_id: {
      visible: true,
      required: true,
      default_value: 'user_primary',
      locked: false,
    },
    expected_delivery_date: {
      visible: true,
      required: true,
      default_value: 'today',
      locked: false,
    },
    sale_scope: {
      visible: true,
      required: true,
      default_value: 'inventory',
      locked: false,
    },
    currency: {
      visible: true,
      required: true,
      default_value: 'MXN',
      locked: false,
    },
    requires_selection_assembly: {
      visible: true,
      required: false,
      default_value: false,
      locked: false,
    },
    for_shipping: {
      visible: true,
      required: false,
      default_value: false,
      locked: false,
    },
    notes: {
      visible: true,
      required: false,
      default_value: null,
      locked: false,
    },
  };
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function sanitizeDefault(
  key: SalesOrderCreationFieldKey,
  value: unknown,
  fallback: string | boolean | null,
): string | boolean | null {
  if (BOOLEAN_KEYS.has(key)) {
    return typeof value === 'boolean' ? value : fallback === true;
  }
  if (key === 'sale_scope') {
    return value === 'services' || value === 'combined' || value === 'inventory'
      ? value
      : 'inventory';
  }
  if (key === 'currency') {
    return value === 'USD' ? 'USD' : 'MXN';
  }
  if (key === 'expected_delivery_date') {
    if (value === 'today') return 'today';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.slice(0, 10);
    }
    return 'today';
  }
  if (key === 'billing_branch_id' || key === 'fiscal_configuration_id') {
    return 'user_primary';
  }
  if (key === 'notes') {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, 2000) : null;
  }
  return fallback;
}

export function normalizeSalesOrderCreationFields(raw: unknown): SalesOrderCreationFields {
  const defaults = defaultSalesOrderCreationFields();
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const fields = { ...defaults };

  for (const key of SALES_ORDER_CREATION_FIELD_KEYS) {
    const incoming = source[key];
    const base = defaults[key];
    const row =
      incoming && typeof incoming === 'object'
        ? (incoming as Partial<Record<keyof SalesOrderCreationFieldConfig, unknown>>)
        : {};
    const locked = LOCKED_KEYS.has(key);
    const visible = locked ? true : asBoolean(row.visible, base.visible);
    let required = locked ? true : asBoolean(row.required, base.required);
    if (BOOLEAN_KEYS.has(key)) {
      required = false;
    }
    if (key === 'billing_branch_id' && visible) {
      required = true;
    }
    fields[key] = {
      visible,
      required,
      default_value: sanitizeDefault(key, row.default_value, base.default_value),
      locked,
    };
  }

  return fields;
}

export function shouldHideBillingBranch(
  fields: SalesOrderCreationFields,
  branchCount: number,
): boolean {
  if (!fields.billing_branch_id.visible) return true;
  return branchCount === 1;
}

export function todayInBusinessZone(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Tijuana',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function resolveDeliveryDateDefault(
  defaultValue: string | boolean | null,
  now = new Date(),
): string {
  if (typeof defaultValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(defaultValue)) {
    return defaultValue.slice(0, 10);
  }
  return todayInBusinessZone(now);
}
