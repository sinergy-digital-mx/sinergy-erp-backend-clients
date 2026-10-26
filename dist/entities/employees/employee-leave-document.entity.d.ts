import { RBACTenant } from '../rbac/tenant.entity';
import { EmployeeLeaveRequest } from './employee-leave-request.entity';
export declare class EmployeeLeaveDocument {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    leave_request: EmployeeLeaveRequest;
    leave_request_id: string;
    employee_id: string;
    file_name: string;
    s3_key: string;
    mime_type: string | null;
    file_size: number | null;
    uploaded_by: string | null;
    created_at: Date;
}
