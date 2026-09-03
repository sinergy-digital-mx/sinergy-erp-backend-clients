import { RBACTenant } from '../rbac/tenant.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { User } from '../users/user.entity';
import { ControlDeskJob } from './control-desk-job.entity';
import { ControlDeskPickLine } from './control-desk-pick-line.entity';
import type { ControlDeskTaskStatus } from './control-desk.constants';
export declare class ControlDeskPickTask {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    job: ControlDeskJob;
    job_id: string;
    warehouse: Warehouse;
    warehouse_id: string;
    status: ControlDeskTaskStatus;
    started_at: Date | null;
    starter: User | null;
    started_by: string | null;
    completed_at: Date | null;
    completer: User | null;
    completed_by: string | null;
    created_at: Date;
    updated_at: Date;
    lines: ControlDeskPickLine[];
}
