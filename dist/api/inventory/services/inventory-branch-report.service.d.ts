import { Repository } from 'typeorm';
import { BillingBranch } from '../../../entities/billing/billing-branch.entity';
import { InventoryBranchReportSetting } from '../../../entities/inventory/inventory-branch-report-setting.entity';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { Product } from '../../../entities/products/product.entity';
import { ProductVendorCost } from '../../../entities/products/product-vendor-cost.entity';
import { BranchReportProductSearchResponseDto, BranchReportSettingsResponseDto, BranchStockReportResponseDto } from '../dto/branch-stock-report.dto';
export declare class InventoryBranchReportService {
    private readonly settingsRepo;
    private readonly branchRepo;
    private readonly productRepo;
    private readonly batchRepo;
    private readonly vendorCostRepo;
    constructor(settingsRepo: Repository<InventoryBranchReportSetting>, branchRepo: Repository<BillingBranch>, productRepo: Repository<Product>, batchRepo: Repository<InventoryBatch>, vendorCostRepo: Repository<ProductVendorCost>);
    searchProducts(tenantId: string, search: string): Promise<BranchReportProductSearchResponseDto>;
    getSettings(tenantId: string): Promise<BranchReportSettingsResponseDto>;
    updateSettings(tenantId: string, userId: string | null, branchIds: string[]): Promise<BranchReportSettingsResponseDto>;
    getReport(tenantId: string, productId: string): Promise<BranchStockReportResponseDto>;
    private loadActiveBranches;
    private loadLots;
    private loadConfigLines;
    private toLot;
    private purchaseInput;
    private optionalMoney;
    private parseDecimal;
}
