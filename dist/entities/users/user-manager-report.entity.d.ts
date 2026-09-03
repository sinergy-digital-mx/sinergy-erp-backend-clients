import { RBACTenant } from '../rbac/tenant.entity';
import { User } from './user.entity';
export declare class UserManagerReport {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    manager: User;
    manager_user_id: string;
    report: User;
    report_user_id: string;
    created_at: Date;
}
