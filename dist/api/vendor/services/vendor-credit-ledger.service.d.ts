import { Repository } from 'typeorm';
import { Vendor } from '../../../entities/vendor/vendor.entity';
import { VendorCreditLedger } from '../../../entities/vendor/vendor-credit-ledger.entity';
import { VendorCreditLedgerEntryType } from '../../../entities/vendor/vendor-credit-ledger-entry-type.enum';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { VendorCreditCurrency } from '../utils/vendor-credit-ledger.util';
export type VendorCreditCreated = {
    amount: number;
    currency: VendorCreditCurrency;
    balance_after: number;
};
export type VendorCreditBalanceRow = {
    vendor_id: string;
    mxn: number;
    usd: number;
};
export declare class VendorCreditLedgerService {
    private readonly ledgerRepo;
    private readonly vendorRepo;
    private readonly purchaseOrderRepo;
    constructor(ledgerRepo: Repository<VendorCreditLedger>, vendorRepo: Repository<Vendor>, purchaseOrderRepo: Repository<PurchaseOrderBatch>);
    recordCredit(input: {
        tenantId: string;
        vendorId: string;
        userId: string;
        amount: number;
        currency: VendorCreditCurrency;
        purchaseOrderId?: string | null;
        purchaseOrderPaymentId?: string | null;
        notes?: string | null;
    }): Promise<VendorCreditCreated | null>;
    assertPaymentVoidable(tenantId: string, paymentId: string): Promise<void>;
    voidByPayment(tenantId: string, userId: string, paymentId: string): Promise<void>;
    balancesForVendor(tenantId: string, vendorId: string): Promise<{
        mxn: number;
        usd: number;
    }>;
    balancesByVendor(tenantId: string): Promise<VendorCreditBalanceRow[]>;
    describeAccounts(tenantId: string, vendorId: string): Promise<{
        vendor: {
            id: string;
            name: string;
            razon_social: string | null;
            company_name: string | null;
        };
        mxn: {
            pending_order_count: number;
            amount_pending: number;
            credit_balance: number;
            net: number;
        };
        usd: {
            pending_order_count: number;
            amount_pending: number;
            credit_balance: number;
            net: number;
        };
        ledger: {
            id: string;
            created_at: Date;
            entry_type: VendorCreditLedgerEntryType;
            amount: number;
            currency: "USD" | "MXN";
            folio: string | null;
            notes: string | null;
            balance_after: number;
        }[];
    }>;
    private currencyBucket;
    private pendingByCurrency;
}
