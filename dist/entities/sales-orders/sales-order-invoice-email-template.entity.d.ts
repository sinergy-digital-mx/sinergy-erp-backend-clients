import { RBACTenant } from '../rbac/tenant.entity';
import { User } from '../users/user.entity';
export declare class SalesOrderInvoiceEmailTemplate {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    subject: string;
    body_html: string;
    updater: User | null;
    updated_by: string | null;
    created_at: Date;
    updated_at: Date;
}
