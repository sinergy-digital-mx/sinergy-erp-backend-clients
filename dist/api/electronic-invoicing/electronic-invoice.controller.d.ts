import { ElectronicInvoiceService } from './services/electronic-invoice.service';
import { ElectronicInvoiceSatSyncService } from './services/electronic-invoice-sat-sync.service';
import { StampElectronicInvoiceDto, CancelElectronicInvoiceDto, QueryElectronicInvoiceDto } from './dto';
export declare class ElectronicInvoiceController {
    private readonly invoiceService;
    private readonly syncService;
    constructor(invoiceService: ElectronicInvoiceService, syncService: ElectronicInvoiceSatSyncService);
    stamp(dto: StampElectronicInvoiceDto, req: {
        user: {
            tenantId: string;
            id: string;
        };
    }): Promise<import("../../entities/electronic-invoicing").ElectronicInvoice>;
    findAll(query: QueryElectronicInvoiceDto, req: {
        user: {
            tenantId: string;
        };
    }): Promise<import("../../entities/electronic-invoicing").ElectronicInvoice[]>;
    syncStatus(req: {
        user: {
            tenantId: string;
        };
    }): Promise<{
        pending_count: number;
        last_batch_at: Date | null;
        recent_logs: import("../../entities/electronic-invoicing").ElectronicInvoiceSyncLog[];
    }>;
    syncBatch(req: {
        user: {
            tenantId: string;
            id: string;
        };
    }): Promise<{
        processed: number;
        updated: number;
    }>;
    getPdf(id: string, regenerate: string | undefined, preview: string | undefined, req: {
        user: {
            tenantId: string;
        };
    }): Promise<import("./services/electronic-invoice-pdf.service").ElectronicInvoicePdfUploadResult>;
    getXml(id: string, req: {
        user: {
            tenantId: string;
        };
    }, res: {
        setHeader: (k: string, v: string) => void;
        send: (b: string) => void;
    }): Promise<void>;
    findOne(id: string, req: {
        user: {
            tenantId: string;
        };
    }): Promise<import("../../entities/electronic-invoicing").ElectronicInvoice>;
    cancel(id: string, dto: CancelElectronicInvoiceDto, req: {
        user: {
            tenantId: string;
            id: string;
        };
    }): Promise<import("../../entities/electronic-invoicing").ElectronicInvoice>;
    syncSat(id: string, req: {
        user: {
            tenantId: string;
            id: string;
        };
    }): Promise<import("../../entities/electronic-invoicing").ElectronicInvoice>;
}
