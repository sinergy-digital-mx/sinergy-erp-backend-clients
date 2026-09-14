import { DataSource, Repository } from 'typeorm';
import { FiscalConfiguration } from '../../entities/billing/fiscal-configuration.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { BatchNumberGeneratorService } from '../purchase-orders/services/batch-number-generator.service';
import { ImportInventoryJob, ImportInventoryJobResult } from './import-job.store';
export type ImportInventoryResult = ImportInventoryJobResult;
export declare class MadereriaInventoryImportService {
    private readonly dataSource;
    private readonly fiscalRepository;
    private readonly branchRepository;
    private readonly warehouseRepository;
    private readonly batchNumberGenerator;
    private readonly logger;
    constructor(dataSource: DataSource, fiscalRepository: Repository<FiscalConfiguration>, branchRepository: Repository<BillingBranch>, warehouseRepository: Repository<Warehouse>, batchNumberGenerator: BatchNumberGeneratorService);
    assertOrganization(organizationId: string): void;
    startImportJob(params: {
        organizationId: string;
        userId: string;
        fiscalConfigurationId: string;
        billingBranchId: string;
        warehouseId: string;
        file: Express.Multer.File;
    }): Promise<ImportInventoryJob>;
    getJobStatus(jobId: string, organizationId: string): ImportInventoryJob;
    importFile(params: {
        organizationId: string;
        userId: string;
        fiscalConfigurationId: string;
        billingBranchId: string;
        warehouseId: string;
        file: Express.Multer.File;
    }): Promise<ImportInventoryResult>;
    private runImportJob;
    private executeImport;
    private assertExcelFile;
    private assertWarehouseContext;
    private importRow;
    private findProduct;
    private createProduct;
    private ensureBaseUom;
    private ensurePriceIfMissing;
    private upsertImportCost;
    private ensureImportVendor;
    private ensurePriceList;
    private ensurePiezaUom;
    private calculateTotals;
}
