import { ImportMadereriaInventoryDto } from './dto/import-inventory.dto';
import { MadereriaInventoryImportService } from './madereria-inventory-import.service';
export declare class MadereriaInventoryImportController {
    private readonly service;
    constructor(service: MadereriaInventoryImportService);
    startImport(file: Express.Multer.File, dto: ImportMadereriaInventoryDto, req: {
        user: {
            tenantId?: string;
            tenant_id?: string;
            id: string;
        };
    }): Promise<import("./import-job.store").ImportInventoryJob>;
    getJob(jobId: string, req: {
        user: {
            tenantId?: string;
            tenant_id?: string;
        };
    }): import("./import-job.store").ImportInventoryJob;
}
