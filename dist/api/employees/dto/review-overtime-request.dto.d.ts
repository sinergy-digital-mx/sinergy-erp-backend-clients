import { OvertimeStatus } from '../../../entities/employees/overtime-status.enum';
export declare class ReviewOvertimeRequestDto {
    status: OvertimeStatus.APPROVED | OvertimeStatus.REJECTED;
    approved_hours?: number;
    review_notes?: string;
}
