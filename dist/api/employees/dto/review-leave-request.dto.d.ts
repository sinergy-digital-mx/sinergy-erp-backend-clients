import { LeaveStatus } from '../../../entities/employees/leave-status.enum';
export declare class ReviewLeaveRequestDto {
    status: LeaveStatus;
    review_notes?: string;
}
