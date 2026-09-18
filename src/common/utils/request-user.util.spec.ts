import { UnauthorizedException } from '@nestjs/common';
import { resolveHasAdminRole, resolveRequestUserId } from './request-user.util';

describe('resolveRequestUserId', () => {
  it('usa sub, luego id, luego user_id', () => {
    expect(resolveRequestUserId({ sub: 'u-1', id: 'u-2' })).toBe('u-1');
    expect(resolveRequestUserId({ id: 'u-2', user_id: 'u-3' })).toBe('u-2');
    expect(resolveRequestUserId({ user_id: 'u-3' })).toBe('u-3');
  });

  it('lanza si no hay identificador', () => {
    expect(() => resolveRequestUserId({})).toThrow(UnauthorizedException);
  });
});

describe('resolveHasAdminRole', () => {
  it('respeta el flag del JWT', () => {
    expect(resolveHasAdminRole({ hasAdminRole: true })).toBe(true);
  });

  it('detecta rol Admin en mayúsculas o minúsculas', () => {
    expect(resolveHasAdminRole({ roles: [{ name: 'Admin' }] })).toBe(true);
    expect(resolveHasAdminRole({ roles: ['admin'] })).toBe(true);
    expect(resolveHasAdminRole({ roles: [{ name: 'Seller' }] })).toBe(false);
  });
});
