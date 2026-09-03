import { RBACTenant } from '../rbac/tenant.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { SalesOrderDetail } from '../sales-orders/sales-order-detail.entity';
import { ControlDeskPickTask } from './control-desk-pick-task.entity';
import type { ControlDeskLineStatus } from './control-desk.constants';
export declare class ControlDeskPickLine {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    task: ControlDeskPickTask;
    task_id: string;
    sales_order_detail: SalesOrderDetail;
    sales_order_detail_id: string;
    warehouse: Warehouse;
    warehouse_id: string;
    quantity_base_requested: number;
    quantity_base_picked: number;
    status: ControlDeskLineStatus;
    created_at: Date;
    updated_at: Date;
}
