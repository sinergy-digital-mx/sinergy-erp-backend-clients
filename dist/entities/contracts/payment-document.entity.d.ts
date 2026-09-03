import { Payment } from './payment.entity';
import { RBACTenant } from '../rbac/tenant.entity';
export declare class PaymentDocument {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    payment: Payment;
    payment_id: string;
    document_type: string;
    file_name: string;
    s3_key: string;
    mime_type: string;
    file_size: number;
    notes: string;
    uploaded_by: string;
    metadata: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}
