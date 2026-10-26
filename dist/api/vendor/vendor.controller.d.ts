import { VendorService } from './vendor.service';
import { VendorsExportService } from './services/vendors-export.service';
import { VendorCreditLedgerService } from './services/vendor-credit-ledger.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { QueryVendorDto } from './dto/query-vendor.dto';
import { QueryVendorExportDto } from './dto/query-vendor-export.dto';
import { PaginatedVendorDto } from './dto/paginated-vendor.dto';
import { CheckVendorDuplicatesDto } from './dto/check-vendor-duplicates.dto';
import { DeleteVendorResultDto } from './dto/vendor-view.dto';
export declare class VendorController {
    private readonly service;
    private readonly exportService;
    private readonly creditLedger;
    constructor(service: VendorService, exportService: VendorsExportService, creditLedger: VendorCreditLedgerService);
    create(dto: CreateVendorDto, req: any): Promise<import("../../entities/vendor/vendor.entity").Vendor>;
    findDuplicates(dto: CheckVendorDuplicatesDto, req: any): Promise<{
        found: boolean;
        matches: import("./utils/vendor-profile.util").VendorSimilarMatch[];
    }>;
    findAll(query: QueryVendorDto, req: any): Promise<PaginatedVendorDto>;
    exportExcel(query: QueryVendorExportDto, req: any, res: any): Promise<void>;
    getAccounts(id: string, req: any): Promise<{
        vendor: {
            id: string;
            name: string;
            razon_social: string | null;
            company_name: string | null;
        };
        mxn: {
            pending_order_count: number;
            amount_pending: number;
            credit_balance: number;
            net: number;
        };
        usd: {
            pending_order_count: number;
            amount_pending: number;
            credit_balance: number;
            net: number;
        };
        ledger: {
            id: string;
            created_at: Date;
            entry_type: import("../../entities/vendor/vendor-credit-ledger-entry-type.enum").VendorCreditLedgerEntryType;
            amount: number;
            currency: "USD" | "MXN";
            folio: string | null;
            notes: string | null;
            balance_after: number;
        }[];
    }>;
    findOne(id: string, req: any): Promise<import("./dto/vendor-view.dto").VendorView>;
    update(id: string, dto: UpdateVendorDto, req: any): Promise<import("../../entities/vendor/vendor.entity").Vendor>;
    remove(id: string, req: any): Promise<DeleteVendorResultDto>;
}
