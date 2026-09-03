import { RBACTenant } from '../rbac/tenant.entity';
import { User } from '../users/user.entity';
import { BillingBranch } from '../billing/billing-branch.entity';
import { PosDailyShiftStatus } from './pos-daily-shift-status.enum';
import { PosPartialShift } from './pos-partial-shift.entity';
export declare class PosDailyShift {
    id: string;
    tenant_id: string;
    tenant: RBACTenant;
    terminal_user_id: string;
    terminal_user: User;
    billing_branch_id: string;
    billing_branch: BillingBranch;
    shift_date: string;
    opening_cash_mxn: number;
    opening_cash_usd: number;
    closing_cash_mxn: number | null;
    closing_cash_usd: number | null;
    expected_cash_mxn: number | null;
    expected_cash_usd: number | null;
    cash_difference_mxn: number | null;
    cash_difference_usd: number | null;
    closing_denominations: Array<{
        currency: 'MXN' | 'USD';
        denomination: number;
        bill_count: number;
        amount: number;
    }> | null;
    status: PosDailyShiftStatus;
    closed_at: Date | null;
    notes: string | null;
    partial_shifts: PosPartialShift[];
    created_at: Date;
    updated_at: Date;
}
