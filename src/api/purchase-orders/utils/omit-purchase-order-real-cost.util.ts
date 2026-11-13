import { PURCHASE_ORDER_REAL_COST_MOVEMENT_TYPE } from '../constants/purchase-order-real-cost-permission';

const NULL_KEYS = new Set([
  'customs_exchange_rate',
  'customs_date',
  'real_unit_cost_usd',
  'real_unit_cost_mxn',
  'landed_extras_usd',
  'landed_total_usd',
  'landed_total_mxn',
  'landed_contracted_usd',
  'landed_invoice_usd',
  'landed_operating_extras_usd',
  'landed_igi_usd',
]);

const ZERO_KEYS = new Set([
  'landed_increment_percentage',
  'landed_merchandise_mxn',
  'landed_extras_mxn',
  'landed_invoice_extras_mxn',
  'landed_contracted_mxn',
  'landed_invoice_mxn',
  'landed_operating_extras_mxn',
  'landed_igi_mxn',
  'igi_percentage',
  'extra_costs_count',
]);

const FALSE_KEYS = new Set(['has_real_cost', 'can_edit_real_cost']);

const EMPTY_ARRAY_KEYS = new Set(['extra_costs', 'landed_cost_lines']);

function isRealCostMovement(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }
  return (
    (value as { type?: unknown }).type === PURCHASE_ORDER_REAL_COST_MOVEMENT_TYPE
  );
}

export function omitPurchaseOrderRealCost<T>(value: T): T {
  return omitValue(value, new WeakMap()) as T;
}

function omitValue(value: unknown, seen: WeakMap<object, unknown>): unknown {
  if (value == null || typeof value !== 'object') {
    return value;
  }
  if (value instanceof Date || Buffer.isBuffer(value)) {
    return value;
  }
  if (seen.has(value)) {
    return seen.get(value);
  }
  if (Array.isArray(value)) {
    const copy: unknown[] = [];
    seen.set(value, copy);
    let changed = false;
    for (const item of value) {
      if (isRealCostMovement(item)) {
        changed = true;
        continue;
      }
      const next = omitValue(item, seen);
      copy.push(next);
      if (next !== item) {
        changed = true;
      }
    }
    return changed ? copy : value;
  }

  const source = value as Record<string, unknown>;
  const copy: Record<string, unknown> = {};
  seen.set(value, copy);
  let changed = false;
  for (const key of Object.keys(source)) {
    if (NULL_KEYS.has(key)) {
      copy[key] = null;
      if (source[key] != null) {
        changed = true;
      }
      continue;
    }
    if (ZERO_KEYS.has(key)) {
      copy[key] = 0;
      if (source[key] !== 0) {
        changed = true;
      }
      continue;
    }
    if (FALSE_KEYS.has(key)) {
      copy[key] = false;
      if (source[key] !== false) {
        changed = true;
      }
      continue;
    }
    if (EMPTY_ARRAY_KEYS.has(key)) {
      copy[key] = [];
      if (!Array.isArray(source[key]) || (source[key] as unknown[]).length > 0) {
        changed = true;
      }
      continue;
    }
    const next = omitValue(source[key], seen);
    copy[key] = next;
    if (next !== source[key]) {
      changed = true;
    }
  }

  if (Array.isArray(copy.movements) && copy.movements !== source.movements) {
    copy.movements_count = copy.movements.length;
    changed = true;
  }

  if (
    Array.isArray(copy.data) &&
    copy.data !== source.data &&
    typeof source.total === 'number' &&
    copy.data.length !== (source.data as unknown[]).length
  ) {
    const removed = (source.data as unknown[]).length - copy.data.length;
    copy.total = Math.max(0, source.total - removed);
    changed = true;
  }

  if (!changed) {
    seen.set(value, value);
    return value;
  }
  return copy;
}
