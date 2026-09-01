import { PurchaseOrderActivityChange } from '../../../entities/purchase-orders/purchase-order-activity.entity';

export function activityValue(value: unknown): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return String(value);
}

export function activityChange(
  field: string,
  fieldLabel: string,
  from: unknown,
  to: unknown,
): PurchaseOrderActivityChange | null {
  const previous = activityValue(from);
  const next = activityValue(to);
  if (previous === next) {
    return null;
  }
  return { field, field_label: fieldLabel, from: previous, to: next };
}

export function compactActivityChanges(
  changes: Array<PurchaseOrderActivityChange | null>,
): PurchaseOrderActivityChange[] {
  return changes.filter((change): change is PurchaseOrderActivityChange => change !== null);
}
