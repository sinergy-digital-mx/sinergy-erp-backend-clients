import { EntityManager } from 'typeorm';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { SalesOrderDetail } from '../../entities/sales-orders/sales-order-detail.entity';
import { ControlDeskJob } from '../../entities/control-desk/control-desk-job.entity';
import { ControlDeskJobStatus, ControlDeskTaskStatus } from '../../entities/control-desk/control-desk.constants';
export declare class ControlDeskLifecycleService {
    private readonly logger;
    findActiveJob(manager: EntityManager, tenantId: string, salesOrderId: string): Promise<ControlDeskJob | null>;
    assertJobEditable(job: ControlDeskJob | null): void;
    syncJobForSalesOrder(manager: EntityManager, params: {
        tenantId: string;
        userId: string;
        salesOrder: SalesOrder;
        details: SalesOrderDetail[];
        requiresSelection: boolean;
    }): Promise<ControlDeskJob | null>;
    private filterGoodsDetails;
    cancelJobForSalesOrder(manager: EntityManager, tenantId: string, salesOrderId: string, userId: string): Promise<void>;
    cancelJob(manager: EntityManager, job: ControlDeskJob, userId: string): Promise<void>;
    deriveJobStatus(tasks: Array<{
        status: ControlDeskTaskStatus;
    }>): {
        status: ControlDeskJobStatus;
        hasShortage: boolean;
    };
    refreshJobProgress(manager: EntityManager, jobId: string, userId?: string, preserveAssembly?: boolean): Promise<ControlDeskJob>;
    private createJob;
    private splitDetailByStock;
    private firstWarehouseOfBranch;
}
