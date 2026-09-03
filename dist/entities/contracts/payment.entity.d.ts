import { Contract } from './contract.entity';
import { RBACTenant } from '../rbac/tenant.entity';
export declare class Payment {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    contract: Contract;
    contract_id: string;
    payment_number: string;
    payment_date: Date;
    amount_paid: number;
    amount: number;
    amount_pending: number;
    due_date: Date;
    paid_date: Date;
    first_partial_payment_date: Date;
    payment_method: string;
    status: string;
    is_overdue: boolean;
    notes: string;
    metadata: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}
