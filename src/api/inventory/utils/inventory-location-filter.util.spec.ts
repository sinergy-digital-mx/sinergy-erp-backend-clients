import { BadRequestException } from '@nestjs/common';
import { assertInventoryLocationCascade } from './inventory-location-filter.util';

describe('assertInventoryLocationCascade', () => {
  it('allows empty filters', () => {
    expect(() => assertInventoryLocationCascade({})).not.toThrow();
  });

  it('allows fiscal configuration alone', () => {
    expect(() =>
      assertInventoryLocationCascade({ fiscal_configuration_id: 'fiscal-1' }),
    ).not.toThrow();
  });

  it('allows fiscal + branch', () => {
    expect(() =>
      assertInventoryLocationCascade({
        fiscal_configuration_id: 'fiscal-1',
        billing_branch_id: 'branch-1',
      }),
    ).not.toThrow();
  });

  it('allows full cascade', () => {
    expect(() =>
      assertInventoryLocationCascade({
        fiscal_configuration_id: 'fiscal-1',
        billing_branch_id: 'branch-1',
        warehouse_id: 'wh-1',
      }),
    ).not.toThrow();
  });

  it('rejects branch without fiscal configuration', () => {
    expect(() =>
      assertInventoryLocationCascade({ billing_branch_id: 'branch-1' }),
    ).toThrow(BadRequestException);
    expect(() =>
      assertInventoryLocationCascade({ billing_branch_id: 'branch-1' }),
    ).toThrow('Selecciona una razón social antes de filtrar por sucursal');
  });

  it('rejects warehouse without branch', () => {
    expect(() =>
      assertInventoryLocationCascade({
        fiscal_configuration_id: 'fiscal-1',
        warehouse_id: 'wh-1',
      }),
    ).toThrow('Selecciona una sucursal antes de filtrar por almacén');
  });
});
