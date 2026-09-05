import { RBACTenant } from '../rbac/tenant.entity';
import { User } from '../users/user.entity';
import { SalesOrder } from './sales-order.entity';
export declare class SalesOrderInvoiceEmail {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    sales_order: SalesOrder;
    sales_order_id: string;
    invoice_id: string;
    to_email: string;
    cc: string[] | null;
    subject: string;
    message: string | null;
    sender: User | null;
    sent_by: string | null;
    sent_at: Date;
}
