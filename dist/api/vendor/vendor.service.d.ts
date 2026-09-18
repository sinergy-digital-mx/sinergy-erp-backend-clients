import { Repository } from 'typeorm';
import { Vendor } from '../../entities/vendor/vendor.entity';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { QueryVendorDto } from './dto/query-vendor.dto';
import { PaginatedVendorDto } from './dto/paginated-vendor.dto';
import { CheckVendorDuplicatesDto } from './dto/check-vendor-duplicates.dto';
import { DeleteVendorResultDto, VendorView } from './dto/vendor-view.dto';
import { VendorSimilarMatch } from './utils/vendor-profile.util';
export declare class VendorService {
    private repo;
    constructor(repo: Repository<Vendor>);
    create(dto: CreateVendorDto, tenantId: string): Promise<Vendor>;
    findAll(tenantId: string, query?: QueryVendorDto): Promise<PaginatedVendorDto>;
    findOne(id: string, tenantId: string): Promise<VendorView>;
    findDuplicates(dto: CheckVendorDuplicatesDto, tenantId: string): Promise<{
        found: boolean;
        matches: VendorSimilarMatch[];
    }>;
    update(id: string, dto: UpdateVendorDto, tenantId: string): Promise<Vendor>;
    remove(id: string, tenantId: string): Promise<DeleteVendorResultDto>;
    private findEntity;
    private loadCatalog;
    private toVendorView;
    private resolveMergeTarget;
    private mergeAndDelete;
    private fillTargetGaps;
    private reassignVendorReferences;
    private countPurchaseOrders;
    private countPurchaseOrdersByVendor;
    private tableExists;
    private assertTypeSwitchValid;
    private buildPayload;
    private saveVendor;
    private rethrowIfNullConstraint;
}
