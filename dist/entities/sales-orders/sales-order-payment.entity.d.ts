import { RBACTenant } from '../rbac/tenant.entity';
import { SalesOrder } from './sales-order.entity';
import { User } from '../users/user.entity';
import { PosSalePaymentMethod } from '../pos/pos-sale-payment-method.enum';
import { SalesOrderPaymentDocument } from './sales-order-payment-document.entity';
export declare class SalesOrderPayment {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    sales_order: SalesOrder;
    sales_order_id: string;
    payment_date: Date;
    amount: number;
    currency: string;
    payment_method: PosSalePaymentMethod;
    reference_number: string | null;
    notes: string | null;
    source: string;
    creator: User;
    created_by: string;
    documents: SalesOrderPaymentDocument[];
    created_at: Date;
}
