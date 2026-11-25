const LOT_COST_KEYS = [
  'unit_cost',
  'amount',
  'real_unit_cost_usd',
  'real_unit_cost_mxn',
] as const;

function isLotNode(value: Record<string, unknown>): boolean {
  return (
    typeof value.batch_number === 'string' &&
    'unit_cost' in value &&
    'received_quantity' in value
  );
}

function isLotsSummary(value: Record<string, unknown>): boolean {
  return (
    'received_lots' in value &&
    'amount_total' in value &&
    'migrated_quantity' in value
  );
}

/**
 * Quita costo e importe del árbol de lotes. No toca el costo de la línea:
 * ese valor sigue haciendo falta para editar la orden.
 */
export function omitPurchaseOrderLotCosts<T>(value: T): T {
  return walk(value, new WeakMap()) as T;
}

function walk(value: unknown, seen: WeakMap<object, unknown>): unknown {
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
      const next = walk(item, seen);
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
    const next = walk(source[key], seen);
    copy[key] = next;
    if (next !== source[key]) {
      changed = true;
    }
  }

  if (isLotNode(copy)) {
    for (const key of LOT_COST_KEYS) {
      if (copy[key] != null) {
        copy[key] = null;
        changed = true;
      }
    }
  }
  if (isLotsSummary(copy) && copy.amount_total != null) {
    copy.amount_total = null;
    changed = true;
  }

  if (!changed) {
    seen.set(value, value);
    return value;
  }
  return copy;
}
