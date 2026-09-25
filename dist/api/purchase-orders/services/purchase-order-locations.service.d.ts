import { Repository } from 'typeorm';
import { BillingBranch } from '../../../entities/billing/billing-branch.entity';
import { FiscalConfiguration } from '../../../entities/billing/fiscal-configuration.entity';
import { Warehouse } from '../../../entities/warehouse/warehouse.entity';
import { PurchaseOrderLocationTree } from '../utils/purchase-order-location.util';
export declare class PurchaseOrderLocationsService {
    private readonly fiscalConfigRepository;
    private readonly billingBranchRepository;
    private readonly warehouseRepository;
    constructor(fiscalConfigRepository: Repository<FiscalConfiguration>, billingBranchRepository: Repository<BillingBranch>, warehouseRepository: Repository<Warehouse>);
    getLocationTree(tenantId: string): Promise<PurchaseOrderLocationTree>;
}
