import {
  duplicateTransferReference,
  normalizeTransferPayments,
  sumTransferPayments,
  transferReferenceKey,
} from './pos-transfer-payments.util';

describe('pos-transfer-payments', () => {
  it('acepta dos transferencias con su referencia', () => {
    const payments = normalizeTransferPayments({
      transfer_payments: [
        { amount_mxn: 400, reference: ' SPEI-1 ' },
        { amount_mxn: 430.5, reference: 'SPEI-2' },
      ],
    });
    expect(payments).toEqual([
      { amount_mxn: 400, reference: 'SPEI-1' },
      { amount_mxn: 430.5, reference: 'SPEI-2' },
    ]);
    expect(sumTransferPayments(payments)).toBe(830.5);
    expect(duplicateTransferReference(payments)).toBeNull();
  });

  it('sin transfer_payments usa el monto y la referencia únicos', () => {
    const payments = normalizeTransferPayments({
      amount_transfer_mxn: 200,
      transfer_reference: 'SPEI-9',
    });
    expect(payments).toEqual([{ amount_mxn: 200, reference: 'SPEI-9' }]);
  });

  it('trata como repetida la misma referencia con otro formato', () => {
    const payments = normalizeTransferPayments({
      transfer_payments: [
        { amount_mxn: 100, reference: 'spei-1' },
        { amount_mxn: 50, reference: ' SPEI-1 ' },
      ],
    });
    expect(transferReferenceKey(' spei-1 ')).toBe('SPEI-1');
    expect(duplicateTransferReference(payments)).toBe('SPEI-1');
  });
});
