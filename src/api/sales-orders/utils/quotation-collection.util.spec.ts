import {
  resolveCollectionActions,
} from './quotation-collection.util';

describe('quotation collection actions', () => {
  const base = {
    fromQuotation: true,
    generalStatus: 'Creada',
    paymentStatus: 'Pendiente',
    salesOrderType: 'MANUAL',
    onOpenShift: false,
    hasCollection: false,
    hasPayments: false,
    hasVigenteInvoice: false,
    hasOpenShift: true,
  };

  it('permite enviar una orden manual al corte abierto', () => {
    expect(resolveCollectionActions(base).canSend).toBe(true);
  });

  it('permite quitar el cobro si ya está en el corte y sigue pendiente', () => {
    const state = resolveCollectionActions({
      ...base,
      salesOrderType: 'POS',
      generalStatus: 'Surtida',
      onOpenShift: true,
    });
    expect(state.canSend).toBe(false);
    expect(state.canWithdraw).toBe(true);
  });

  it('bloquea quitar el cobro si ya se pagó', () => {
    const state = resolveCollectionActions({
      ...base,
      salesOrderType: 'POS',
      onOpenShift: true,
      paymentStatus: 'Pagado',
    });
    expect(state.canWithdraw).toBe(false);
    expect(state.withdrawBlockedReason).toContain('cobrada');
  });

  it('no ofrece cobranza si no viene de cotización', () => {
    const state = resolveCollectionActions({ ...base, fromQuotation: false });
    expect(state.canSend).toBe(false);
    expect(state.canWithdraw).toBe(false);
  });
});
