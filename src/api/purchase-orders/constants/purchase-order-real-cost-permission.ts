import { MADERERIA_ORGANIZATION_ID } from '../../madereria-inventory-import/madereria-inventory-import.constants';

export const PURCHASE_ORDER_REAL_COST_MODULE_CODE = 'purchase_order_real_cost';
export const PURCHASE_ORDER_REAL_COST_ENTITY = 'purchase_order_real_cost';
export const PURCHASE_ORDER_REAL_COST_ACTION = 'Read';
export const PURCHASE_ORDER_REAL_COST_PERMISSION = `${PURCHASE_ORDER_REAL_COST_ENTITY}:${PURCHASE_ORDER_REAL_COST_ACTION}` as const;
export const PURCHASE_ORDER_REAL_COST_MOVEMENT_TYPE = 'real_cost_updated';

type RealCostUser = {
  tenant_id?: string | null;
  tenantId?: string | null;
  hasAdminRole?: boolean;
  permissions?: unknown;
};

export function userCanViewPurchaseOrderRealCost(
  user: RealCostUser | null | undefined,
): boolean {
  const tenantId = user?.tenant_id ?? user?.tenantId ?? null;
  if (tenantId !== MADERERIA_ORGANIZATION_ID) {
    return false;
  }
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions.map((permission) => String(permission).toLowerCase())
    : [];
  const exact = PURCHASE_ORDER_REAL_COST_PERMISSION.toLowerCase();
  if (permissions.includes(exact)) {
    return true;
  }
  if (!user?.hasAdminRole) {
    return false;
  }
  const prefix = `${PURCHASE_ORDER_REAL_COST_ENTITY}:`.toLowerCase();
  return permissions.some((permission) => permission.startsWith(prefix));
}
