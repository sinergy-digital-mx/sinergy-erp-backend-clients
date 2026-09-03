import { RBACTenant } from '../rbac/tenant.entity';
import { SalesOrderPayment } from './sales-order-payment.entity';
import { User } from '../users/user.entity';
export declare class SalesOrderPaymentDocument {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    payment: SalesOrderPayment;
    payment_id: string;
    file_name: string;
    s3_key: string;
    mime_type: string;
    file_size: number;
    notes: string | null;
    uploader: User;
    uploaded_by: string | null;
    created_at: Date;
}
