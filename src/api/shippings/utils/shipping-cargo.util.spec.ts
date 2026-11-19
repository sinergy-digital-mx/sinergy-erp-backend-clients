import { resolveCargoKind } from './shipping-cargo.util';

describe('resolveCargoKind', () => {
  it('distingue entrega, transferencia y viaje mixto', () => {
    expect(resolveCargoKind(2, 0)).toBe('order_delivery');
    expect(resolveCargoKind(0, 1)).toBe('inventory_transfer');
    expect(resolveCargoKind(1, 1)).toBe('mixed');
  });
});
