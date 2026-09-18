import { UnauthorizedException } from '@nestjs/common';

type RequestUserLike = {
  sub?: unknown;
  id?: unknown;
  user_id?: unknown;
  hasAdminRole?: unknown;
  roles?: unknown;
};

export function resolveRequestUserId(user: RequestUserLike | null | undefined): string {
  const id = user?.sub ?? user?.id ?? user?.user_id;
  if (id == null || String(id).trim() === '') {
    throw new UnauthorizedException('No se pudo identificar al usuario');
  }
  return String(id);
}

export function resolveHasAdminRole(user: RequestUserLike | null | undefined): boolean {
  if (user?.hasAdminRole === true) {
    return true;
  }

  const roles = user?.roles;
  if (!Array.isArray(roles)) {
    return false;
  }

  return roles.some((role) => {
    const name = typeof role === 'string' ? role : role && typeof role === 'object' ? (role as { name?: unknown }).name : '';
    return String(name).toLowerCase() === 'admin';
  });
}
