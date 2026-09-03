import { RBACTenant } from '../rbac/tenant.entity';
import { User } from '../users/user.entity';
import { PosDailyShift } from './pos-daily-shift.entity';
import { PosPartialShiftDenomination } from './pos-partial-shift-denomination.entity';
export declare class PosPartialShift {
    id: string;
    tenant_id: string;
    tenant: RBACTenant;
    daily_shift_id: string;
    daily_shift: PosDailyShift;
    partial_number: number;
    removed_total_mxn: number;
    removed_total_usd: number;
    sales_total_mxn: number;
    sales_count: number;
    performed_by_user_id: string | null;
    performed_by_user: User | null;
    notes: string | null;
    denominations: PosPartialShiftDenomination[];
    created_at: Date;
}
