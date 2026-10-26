import { RBACTenant } from '../rbac/tenant.entity';
import { User } from '../users/user.entity';
import { PurchaseOrderBatch } from '../purchase-orders/purchase-order-batch.entity';
import { PurchaseOrderPayment } from '../purchase-orders/purchase-order-payment.entity';
import { Vendor } from './vendor.entity';
import { VendorCreditLedgerEntryType } from './vendor-credit-ledger-entry-type.enum';
export declare class VendorCreditLedger {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    vendor: Vendor;
    vendor_id: string;
    currency: 'MXN' | 'USD';
    entry_type: VendorCreditLedgerEntryType;
    amount: number;
    purchase_order: PurchaseOrderBatch | null;
    purchase_order_id: string | null;
    purchase_order_payment: PurchaseOrderPayment | null;
    purchase_order_payment_id: string | null;
    source_entry: VendorCreditLedger | null;
    source_entry_id: string | null;
    notes: string | null;
    creator: User | null;
    created_by: string | null;
    created_at: Date;
}
