import { OvertimeStatus } from '../../../entities/employees/overtime-status.enum';
export declare class QueryOvertimeRequestDto {
    page?: number;
    limit?: number;
    status?: OvertimeStatus;
}
