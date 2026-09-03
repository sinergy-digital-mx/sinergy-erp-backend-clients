import { RBACTenant } from '../rbac/tenant.entity';
import { User } from '../users/user.entity';
import { PosConfiguration } from '../billing/pos-configuration.entity';
export declare enum PosSessionStatus {
    OPEN = "open",
    CLOSED = "closed",
    SUSPENDED = "suspended"
}
export declare class PosSession {
    id: string;
    tenant_id: string;
    pos_configuration_id: string;
    user_id: string;
    session_number: number;
    opened_at: Date;
    closed_at: Date;
    opening_cash: number;
    closing_cash: number;
    expected_cash: number;
    cash_difference: number;
    status: PosSessionStatus;
    total_sales: number;
    total_transactions: number;
    notes: string;
    closed_by: string;
    created_at: Date;
    updated_at: Date;
    tenant: RBACTenant;
    posConfiguration: PosConfiguration;
    user: User;
    closedByUser: User;
    generateId(): void;
}
