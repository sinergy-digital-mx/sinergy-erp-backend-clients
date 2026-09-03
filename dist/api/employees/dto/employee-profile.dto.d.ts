import { EmployeeStatus } from '../../../entities/employees/employee-status.enum';
import { EmployeePaymentFrequency } from '../../../entities/employees/employee-payment-frequency.enum';
export declare class EmployeeProfileDto {
    employee_code?: string;
    rfc?: string;
    curp?: string;
    nss?: string;
    position?: string;
    department?: string;
    hire_date?: string;
    birth_date?: string;
    monthly_salary?: number;
    payment_frequency?: EmployeePaymentFrequency;
    bank_name?: string;
    clabe?: string;
    bank_account?: string;
    status?: EmployeeStatus;
    termination_date?: string;
    vacation_carryover_days?: number;
}
