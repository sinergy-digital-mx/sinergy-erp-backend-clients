import { ProductVendorImportService } from './services/product-vendor-import.service';
import { QueryVendorCostImportDto } from './dto/query-vendor-cost-import.dto';
import { QueryVendorPriceImportDto } from './dto/query-vendor-price-import.dto';
export declare class ProductVendorImportController {
    private readonly importService;
    constructor(importService: ProductVendorImportService);
    previewCosts(query: QueryVendorCostImportDto, req: any): Promise<import("./services/product-vendor-import.service").VendorImportPreview>;
    exportCostTemplate(query: QueryVendorCostImportDto, req: any, res: any): Promise<void>;
    importCosts(file: Express.Multer.File, dto: QueryVendorCostImportDto, req: any): Promise<import("./services/product-vendor-import.service").VendorImportResult>;
    previewPrices(query: QueryVendorPriceImportDto, req: any): Promise<import("./services/product-vendor-import.service").VendorImportPreview>;
    exportPriceTemplate(query: QueryVendorPriceImportDto, req: any, res: any): Promise<void>;
    importPrices(file: Express.Multer.File, dto: QueryVendorPriceImportDto, req: any): Promise<import("./services/product-vendor-import.service").VendorImportResult>;
    private sendExcel;
}
