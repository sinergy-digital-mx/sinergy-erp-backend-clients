import { Repository } from 'typeorm';
import { Vendor } from '../../../entities/vendor/vendor.entity';
import { QueryVendorExportDto } from '../dto/query-vendor-export.dto';
export declare class VendorsExportService {
    private readonly vendorRepo;
    private readonly columns;
    constructor(vendorRepo: Repository<Vendor>);
    exportVendors(tenantId: string, filters: QueryVendorExportDto): Promise<Buffer>;
    getFilename(): string;
    private fetchVendors;
    private formatVendorType;
    private describeFilters;
}
