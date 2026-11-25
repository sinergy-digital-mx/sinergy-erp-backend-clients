export const INVENTORY_MARGIN_ACTION = 'ViewMargin';
export const INVENTORY_MARGIN_PERMISSION = `inventory:${INVENTORY_MARGIN_ACTION}`;

type MarginUser = {
  permissions?: unknown;
};

/**
 * Permiso exacto. No usa el atajo de administrador: si se quita en Roles, deja de verse.
 */
export function userCanViewInventoryMargin(
  user: MarginUser | null | undefined,
): boolean {
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions.map((permission) => String(permission).toLowerCase())
    : [];
  return permissions.includes(INVENTORY_MARGIN_PERMISSION.toLowerCase());
}
