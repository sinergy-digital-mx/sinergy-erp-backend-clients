import { Repository } from 'typeorm';
import { Vendor } from '../../entities/vendor/vendor.entity';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { QueryVendorDto } from './dto/query-vendor.dto';
import { PaginatedVendorDto } from './dto/paginated-vendor.dto';
export declare class VendorService {
    private repo;
    constructor(repo: Repository<Vendor>);
    create(dto: CreateVendorDto, tenantId: string): Promise<Vendor>;
    findAll(tenantId: string, query?: QueryVendorDto): Promise<PaginatedVendorDto>;
    findOne(id: string, tenantId: string): Promise<Vendor>;
    update(id: string, dto: UpdateVendorDto, tenantId: string): Promise<Vendor>;
    remove(id: string, tenantId: string): Promise<void>;
    private assertTypeSwitchValid;
    private buildPayload;
    private saveVendor;
    private rethrowIfNullConstraint;
}
