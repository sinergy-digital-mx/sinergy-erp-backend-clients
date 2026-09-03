import { LeaveType } from '../../../entities/employees/leave-type.enum';
import { LeaveStatus } from '../../../entities/employees/leave-status.enum';
export declare class QueryLeaveRequestDto {
    page?: number;
    limit?: number;
    type?: LeaveType;
    status?: LeaveStatus;
}
