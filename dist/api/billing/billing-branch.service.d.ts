import { Repository } from 'typeorm';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { FiscalConfiguration } from '../../entities/billing/fiscal-configuration.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { CreateBillingBranchDto } from './dto/create-billing-branch.dto';
import { UpdateBillingBranchDto } from './dto/update-billing-branch.dto';
type BranchWarehouseResponse = {
    id: string;
    name: string;
    code: string | null;
    prefix: string | null;
    description: string | null;
    street: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
    status: string;
    metadata: Record<string, any> | null;
    created_at: Date;
    updated_at: Date;
};
type BillingBranchDetail = BillingBranch & {
    name: string;
    warehouses_count: number;
    warehouses: BranchWarehouseResponse[];
};
export declare class BillingBranchService {
    private branchRepository;
    private fiscalConfigRepository;
    private warehouseRepository;
    constructor(branchRepository: Repository<BillingBranch>, fiscalConfigRepository: Repository<FiscalConfiguration>, warehouseRepository: Repository<Warehouse>);
    create(fiscalConfigId: string, tenantId: string, dto: CreateBillingBranchDto): Promise<BillingBranchDetail>;
    findAll(fiscalConfigId: string, tenantId: string): Promise<(BillingBranch & {
        name: string;
        warehouses_count: number;
    })[]>;
    findOne(id: string, fiscalConfigId: string, tenantId: string): Promise<BillingBranchDetail>;
    update(id: string, fiscalConfigId: string, tenantId: string, dto: UpdateBillingBranchDto): Promise<BillingBranchDetail>;
    remove(id: string, fiscalConfigId: string, tenantId: string): Promise<void>;
    findAllByTenant(tenantId: string): Promise<(BillingBranch & {
        name: string;
        display_name: string;
    })[]>;
    private resolveBranchName;
    private assertFiscalConfiguration;
    private syncWarehouses;
    private toWarehouseCreatePayload;
    private toWarehouseUpdatePayload;
    private toWarehouseResponse;
    private toBranchDetailResponse;
}
export {};
