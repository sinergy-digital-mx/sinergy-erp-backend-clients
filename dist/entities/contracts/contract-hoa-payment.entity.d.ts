import { Contract } from './contract.entity';
import { RBACTenant } from '../rbac/tenant.entity';
export declare class ContractHoaPayment {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    contract: Contract;
    contract_id: string;
    payment_number: string;
    amount: number;
    amount_paid: number;
    amount_pending: number;
    currency: string;
    due_date: Date;
    paid_date: Date | null;
    first_partial_payment_date: Date | null;
    payment_method: string | null;
    status: string;
    is_overdue: boolean;
    notes: string | null;
    created_at: Date;
    updated_at: Date;
}
