import {
  formatBlockedLotsMessage,
  isPurchaseLotAlreadyExited,
  lotsBlockingFullExit,
} from './purchase-order-reversal.util';

describe('lotsBlockingFullExit', () => {
  it('deja pasar el lote si la existencia sigue completa', () => {
    expect(
      lotsBlockingFullExit([
        {
          batch_id: 'b1',
          batch_number: 'L-1',
          product_label: 'Pino',
          initial_quantity: 10,
          available_quantity: 10,
          missing_quantity: 0,
        },
      ]),
    ).toEqual([]);
  });

  it('bloquea si ya se vendió o se transfirió parte del lote', () => {
    const blocked = lotsBlockingFullExit([
      {
        batch_id: 'b1',
        batch_number: 'L-1',
        product_label: 'Pino',
        initial_quantity: 10,
        available_quantity: 4,
        missing_quantity: 0,
      },
    ]);
    expect(blocked).toHaveLength(1);
    expect(blocked[0].missing_quantity).toBe(6);
  });

  it('ignora lotes hijos de una transferencia', () => {
    expect(
      lotsBlockingFullExit([
        {
          batch_id: 'b2',
          batch_number: 'L-2',
          product_label: 'Pino',
          initial_quantity: 4,
          available_quantity: 1,
          missing_quantity: 0,
          transferred_from_batch_id: 'b1',
        },
      ]),
    ).toEqual([]);
  });
});

describe('formatBlockedLotsMessage', () => {
  it('pide auditar los lotes antes de cancelar', () => {
    const message = formatBlockedLotsMessage('OC-1', [
      {
        batch_id: 'b1',
        batch_number: 'L-1',
        product_label: 'Pino',
        initial_quantity: 10,
        available_quantity: 4,
        missing_quantity: 6,
      },
    ]);
    expect(message).toContain('OC-1');
    expect(message).toContain('L-1');
    expect(message).toContain('audita');
  });
});

describe('isPurchaseLotAlreadyExited', () => {
  it('reconoce un lote cuya compra ya salió completa', () => {
    expect(isPurchaseLotAlreadyExited(0, 0)).toBe(true);
  });

  it('no trata como salida una venta que dejó el lote en cero', () => {
    expect(isPurchaseLotAlreadyExited(0, 10)).toBe(false);
  });
});
