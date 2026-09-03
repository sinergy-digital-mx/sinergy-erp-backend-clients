import { RBACTenant } from '../rbac/tenant.entity';
import { User } from '../users/user.entity';
import { Quotation } from './quotation.entity';
export declare class QuotationEmail {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    quotation: Quotation;
    quotation_id: string;
    to_email: string;
    cc: string[] | null;
    bcc: string[] | null;
    subject: string;
    message: string | null;
    sender: User | null;
    sent_by: string | null;
    sent_at: Date;
}
