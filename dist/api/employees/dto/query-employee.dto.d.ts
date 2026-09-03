import { EmployeeStatus } from '../../../entities/employees/employee-status.enum';
export declare class QueryEmployeeDto {
    page?: number;
    limit?: number;
    search?: string;
    status?: EmployeeStatus;
    department?: string;
}
