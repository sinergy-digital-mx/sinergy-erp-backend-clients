import { Repository } from 'typeorm';
import { ElectronicInvoice } from '../../../entities/electronic-invoicing/electronic-invoice.entity';
import { ElectronicInvoiceSyncLog } from '../../../entities/electronic-invoicing/electronic-invoice-sync-log.entity';
import { ElectronicInvoiceService } from './electronic-invoice.service';
export declare class ElectronicInvoiceSatSyncService {
    private readonly invoiceRepo;
    private readonly syncLogRepo;
    private readonly electronicInvoiceService;
    private readonly logger;
    private isRunning;
    constructor(invoiceRepo: Repository<ElectronicInvoice>, syncLogRepo: Repository<ElectronicInvoiceSyncLog>, electronicInvoiceService: ElectronicInvoiceService);
    runScheduledSync(): Promise<void>;
    syncTenantBatch(tenantId: string, userId: string | null, limit?: number): Promise<{
        processed: number;
        updated: number;
    }>;
    getSyncStatus(tenantId: string): Promise<{
        pending_count: number;
        last_batch_at: Date | null;
        recent_logs: ElectronicInvoiceSyncLog[];
    }>;
    private getTenantsWithPendingSync;
    private getPendingInvoicesForTenant;
}
