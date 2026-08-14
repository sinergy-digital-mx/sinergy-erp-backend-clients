export const USER_STATUS_CODE = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DELETED: 'deleted',
} as const;

export type UserStatusCode =
  (typeof USER_STATUS_CODE)[keyof typeof USER_STATUS_CODE];

export function normalizeUserStatusCode(code?: string | null): string {
  return (code ?? '').trim().toLowerCase();
}

export function isActiveUserStatus(code?: string | null): boolean {
  return normalizeUserStatusCode(code) === USER_STATUS_CODE.ACTIVE;
}
