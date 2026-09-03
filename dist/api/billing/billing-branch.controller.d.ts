import { TenantContextService } from '../rbac/services/tenant-context.service';
import { BillingBranchService } from './billing-branch.service';
import { CreateBillingBranchDto } from './dto/create-billing-branch.dto';
import { UpdateBillingBranchDto } from './dto/update-billing-branch.dto';
export declare class BillingBranchController {
    private readonly branchService;
    private readonly tenantContext;
    constructor(branchService: BillingBranchService, tenantContext: TenantContextService);
    create(fiscalConfigId: string, dto: CreateBillingBranchDto): Promise<import("../../entities/billing").BillingBranch & {
        name: string;
        warehouses_count: number;
        warehouses: {
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
        }[];
    }>;
    findAll(fiscalConfigId: string): Promise<(import("../../entities/billing").BillingBranch & {
        name: string;
        warehouses_count: number;
    })[]>;
    findOne(fiscalConfigId: string, id: string): Promise<import("../../entities/billing").BillingBranch & {
        name: string;
        warehouses_count: number;
        warehouses: {
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
        }[];
    }>;
    update(fiscalConfigId: string, id: string, dto: UpdateBillingBranchDto): Promise<import("../../entities/billing").BillingBranch & {
        name: string;
        warehouses_count: number;
        warehouses: {
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
        }[];
    }>;
    remove(fiscalConfigId: string, id: string): Promise<void>;
}
export declare class BillingBranchAllController {
    private readonly branchService;
    private readonly tenantContext;
    constructor(branchService: BillingBranchService, tenantContext: TenantContextService);
    findAll(): Promise<(import("../../entities/billing").BillingBranch & {
        name: string;
        display_name: string;
    })[]>;
}
