import { Customer } from './customer.entity';
import { DocumentType } from './document-type.entity';
import { RBACTenant } from '../rbac/tenant.entity';
export declare class CustomerDocument {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    customer: Customer;
    customer_id: number;
    document_type: DocumentType;
    document_type_id: string;
    file_name: string;
    s3_key: string;
    mime_type: string;
    file_size: number;
    expiration_date: Date | null;
    notes: string;
    status: string;
    metadata: Record<string, any>;
    uploaded_by: string;
    created_at: Date;
    updated_at: Date;
}
