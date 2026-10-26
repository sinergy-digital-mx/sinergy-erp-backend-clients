import { VendorCreditLedgerEntryType } from '../../../entities/vendor/vendor-credit-ledger-entry-type.enum';
export type VendorCreditCurrency = 'MXN' | 'USD';
export declare function roundVendorCreditMoney(value: number): number;
export declare function normalizeVendorCreditCurrency(value: string | null | undefined): VendorCreditCurrency;
export declare function splitVendorPayment(amount: number, pending: number): {
    applied: number;
    credit: number;
};
export declare function vendorCreditSignedAmount(type: VendorCreditLedgerEntryType | string, amount: number): number;
export declare function vendorCreditBalances(entries: Array<{
    currency?: string | null;
    entry_type: string;
    amount: number | string;
}>): {
    mxn: number;
    usd: number;
};
export declare function vendorCreditNet(pending: number, credit: number): number;
export declare function withRunningVendorCreditBalance<T extends {
    currency?: string | null;
    entry_type: string;
    amount: number | string;
}>(entries: T[]): Array<T & {
    balance_after: number;
}>;
