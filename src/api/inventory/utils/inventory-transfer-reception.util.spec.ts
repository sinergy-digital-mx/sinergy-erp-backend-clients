import { InventoryTransferStatus } from '../../../entities/inventory/inventory-transfer-status.enum';
import {
  quantitiesMatch,
  receptionQuantityError,
  receptionStatus,
  roundTransferQty,
  transferNeedsShipping,
} from './inventory-transfer-reception.util';

describe('inventory transfer reception', () => {
  it('redondea a 3 decimales', () => {
    expect(roundTransferQty(1.23456)).toBe(1.235);
  });

  it('trata como iguales cantidades que solo difieren por redondeo', () => {
    expect(quantitiesMatch(10, 10.0004)).toBe(true);
    expect(quantitiesMatch(10, 9.5)).toBe(false);
  });

  it('marca diferencia cuando alguna línea no cuadra', () => {
    expect(
      receptionStatus([
        { shipped: 4, received: 4 },
        { shipped: 2, received: 1 },
      ]),
    ).toBe(InventoryTransferStatus.RECEIVED_WITH_DIFFERENCE);
    expect(receptionStatus([{ shipped: 4, received: 4 }])).toBe(InventoryTransferStatus.RECEIVED);
  });

  it('la misma sucursal no pide envío', () => {
    expect(transferNeedsShipping('branch-a', 'branch-a')).toBe(false);
    expect(transferNeedsShipping('branch-a', 'branch-b')).toBe(true);
    expect(transferNeedsShipping(null, 'branch-a')).toBe(true);
    expect(transferNeedsShipping('branch-a', undefined)).toBe(true);
  });

  it('rechaza recibir más de lo enviado', () => {
    expect(receptionQuantityError(5, 6)).toMatch(/más de lo enviado/);
    expect(receptionQuantityError(5, 5)).toBeNull();
    expect(receptionQuantityError(5, 0)).toBeNull();
  });
});
