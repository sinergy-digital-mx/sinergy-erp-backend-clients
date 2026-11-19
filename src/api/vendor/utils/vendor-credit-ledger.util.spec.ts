import { VendorCreditLedgerEntryType } from '../../../entities/vendor/vendor-credit-ledger-entry-type.enum';
import {
  roundVendorCreditMoney,
  splitVendorPayment,
  vendorCreditBalances,
  vendorCreditNet,
  vendorCreditSignedAmount,
  withRunningVendorCreditBalance,
} from './vendor-credit-ledger.util';

describe('vendor-credit-ledger.util', () => {
  it('parte el excedente y no deja pagado de más en la OC', () => {
    expect(splitVendorPayment(12000, 10000)).toEqual({ applied: 10000, credit: 2000 });
    expect(splitVendorPayment(500, 10000)).toEqual({ applied: 500, credit: 0 });
    expect(splitVendorPayment(2000, 0)).toEqual({ applied: 0, credit: 2000 });
  });

  it('el crédito suma y void/debit restan, por moneda', () => {
    expect(vendorCreditSignedAmount(VendorCreditLedgerEntryType.CREDIT, 100)).toBe(100);
    expect(vendorCreditSignedAmount(VendorCreditLedgerEntryType.VOID, 40)).toBe(-40);
    expect(
      vendorCreditBalances([
        { currency: 'MXN', entry_type: 'credit', amount: 2000 },
        { currency: 'MXN', entry_type: 'void', amount: 500 },
        { currency: 'USD', entry_type: 'credit', amount: 80 },
      ]),
    ).toEqual({ mxn: 1500, usd: 80 });
  });

  it('neto y kardex con saldo corrido', () => {
    expect(vendorCreditNet(10000, 2000)).toBe(8000);
    expect(vendorCreditNet(1000, 2500)).toBe(-1500);
    expect(roundVendorCreditMoney(10.005)).toBe(10.01);

    const rows = withRunningVendorCreditBalance([
      { currency: 'MXN', entry_type: 'credit', amount: 2000 },
      { currency: 'MXN', entry_type: 'void', amount: 2000 },
    ]);
    expect(rows[0].balance_after).toBe(2000);
    expect(rows[1].balance_after).toBe(0);
  });
});
