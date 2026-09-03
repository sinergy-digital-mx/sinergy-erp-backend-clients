import { Contract } from './contract.entity';
import { RBACTenant } from '../rbac/tenant.entity';
export declare class ContractDocument {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    contract: Contract;
    contract_id: string;
    file_name: string;
    s3_key: string;
    mime_type: string;
    file_size: number;
    notes: string;
    status: string;
    metadata: Record<string, any>;
    uploaded_by: string;
    created_at: Date;
    updated_at: Date;
}
