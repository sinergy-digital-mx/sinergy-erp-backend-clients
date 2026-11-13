export interface JwtPermissionUser {
  permissions?: unknown;
  hasAdminRole?: boolean;
}

export function userHasJwtPermission(
  user: JwtPermissionUser | null | undefined,
  entity: string,
  action: string,
): boolean {
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions.map((permission) => String(permission).toLowerCase())
    : [];
  const exact = `${entity}:${action}`.toLowerCase();
  if (permissions.includes(exact)) {
    return true;
  }
  if (!user?.hasAdminRole) {
    return false;
  }
  const prefix = `${entity.toLowerCase()}:`;
  return permissions.some((permission) => permission.startsWith(prefix));
}
