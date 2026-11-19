import { userHasJwtPermission } from './jwt-permission.util';

describe('userHasJwtPermission', () => {
  it('acepta el permiso exacto sin distinguir mayúsculas', () => {
    expect(
      userHasJwtPermission(
        { permissions: ['inventory:ViewStats'] },
        'inventory',
        'ViewStats',
      ),
    ).toBe(true);
    expect(
      userHasJwtPermission(
        { permissions: ['purchase_orders:viewstats'] },
        'purchase_orders',
        'ViewStats',
      ),
    ).toBe(true);
  });

  it('no alcanza con Read', () => {
    expect(
      userHasJwtPermission(
        { permissions: ['sales_orders:Read'] },
        'sales_orders',
        'ViewStats',
      ),
    ).toBe(false);
  });

  it('Admin ve el resumen si ya tiene la entidad', () => {
    expect(
      userHasJwtPermission(
        { hasAdminRole: true, permissions: ['inventory:Read'] },
        'inventory',
        'ViewStats',
      ),
    ).toBe(true);
  });

  it('Admin no hereda el resumen de otra entidad', () => {
    expect(
      userHasJwtPermission(
        { hasAdminRole: true, permissions: ['customers:Read'] },
        'inventory',
        'ViewStats',
      ),
    ).toBe(false);
  });
});
