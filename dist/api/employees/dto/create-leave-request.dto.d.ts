import { LeaveType } from '../../../entities/employees/leave-type.enum';
export declare class CreateLeaveRequestDto {
    type: LeaveType;
    start_date: string;
    end_date: string;
    reason?: string;
    is_paid?: boolean;
    days?: number;
    count_weekends?: boolean;
}
