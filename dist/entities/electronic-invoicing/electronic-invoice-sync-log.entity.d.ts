import { RBACTenant } from '../rbac/tenant.entity';
import { ElectronicInvoice } from './electronic-invoice.entity';
import { User } from '../users/user.entity';
export type ElectronicInvoiceSyncTrigger = 'scheduled' | 'manual' | 'batch';
export declare class ElectronicInvoiceSyncLog {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    electronic_invoice: ElectronicInvoice | null;
    electronic_invoice_id: string | null;
    trigger_type: ElectronicInvoiceSyncTrigger;
    previous_sat_status: string | null;
    new_sat_status: string | null;
    raw_response: Record<string, unknown> | null;
    success: number;
    error_message: string | null;
    triggered_by_user: User | null;
    triggered_by: string | null;
    created_at: Date;
}
