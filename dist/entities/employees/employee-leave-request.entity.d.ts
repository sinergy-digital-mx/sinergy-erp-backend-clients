import { RBACTenant } from '../rbac/tenant.entity';
import { Employee } from './employee.entity';
import { LeaveType } from './leave-type.enum';
import { LeaveStatus } from './leave-status.enum';
export declare class EmployeeLeaveRequest {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    employee: Employee;
    employee_id: string;
    type: LeaveType;
    start_date: string;
    end_date: string;
    days: number;
    reason: string | null;
    status: LeaveStatus;
    is_paid: boolean;
    created_by: string | null;
    reviewed_by: string | null;
    reviewed_at: Date | null;
    review_notes: string | null;
    created_at: Date;
    updated_at: Date;
}
