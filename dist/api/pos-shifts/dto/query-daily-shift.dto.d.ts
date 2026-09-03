import { PosDailyShiftStatus } from '../../../entities/pos/pos-daily-shift-status.enum';
export declare class QueryDailyShiftDto {
    terminal_user_id?: string;
    billing_branch_id?: string;
    shift_date?: string;
    status?: PosDailyShiftStatus;
}
