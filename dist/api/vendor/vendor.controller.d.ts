import { VendorService } from './vendor.service';
import { VendorsExportService } from './services/vendors-export.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { QueryVendorDto } from './dto/query-vendor.dto';
import { QueryVendorExportDto } from './dto/query-vendor-export.dto';
import { PaginatedVendorDto } from './dto/paginated-vendor.dto';
export declare class VendorController {
    private readonly service;
    private readonly exportService;
    constructor(service: VendorService, exportService: VendorsExportService);
    create(dto: CreateVendorDto, req: any): Promise<import("../../entities/vendor/vendor.entity").Vendor>;
    findAll(query: QueryVendorDto, req: any): Promise<PaginatedVendorDto>;
    exportExcel(query: QueryVendorExportDto, req: any, res: any): Promise<void>;
    findOne(id: string, req: any): Promise<import("../../entities/vendor/vendor.entity").Vendor>;
    update(id: string, dto: UpdateVendorDto, req: any): Promise<import("../../entities/vendor/vendor.entity").Vendor>;
    remove(id: string, req: any): Promise<void>;
}
