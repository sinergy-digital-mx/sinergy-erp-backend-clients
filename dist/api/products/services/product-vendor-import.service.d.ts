import { Repository } from 'typeorm';
import { ProductVendorCost } from '../../../entities/products/product-vendor-cost.entity';
import { ProductPrice } from '../../../entities/products/product-price.entity';
import { PriceList } from '../../../entities/products/price-list.entity';
import { Vendor } from '../../../entities/vendor/vendor.entity';
export interface VendorImportPreview {
    vendor_id: string;
    vendor_name: string;
    price_list_id?: string;
    price_list_name?: string;
    product_count: number;
    row_count: number;
}
export interface VendorImportError {
    row: number;
    sku: string;
    message: string;
}
export interface VendorImportResult {
    updated: number;
    created: number;
    skipped: number;
    errors: VendorImportError[];
}
export declare class ProductVendorImportService {
    private readonly vendorCostRepo;
    private readonly productPriceRepo;
    private readonly priceListRepo;
    private readonly vendorRepo;
    constructor(vendorCostRepo: Repository<ProductVendorCost>, productPriceRepo: Repository<ProductPrice>, priceListRepo: Repository<PriceList>, vendorRepo: Repository<Vendor>);
    previewCosts(orgId: string, vendorId: string): Promise<VendorImportPreview>;
    previewPrices(orgId: string, vendorId: string, priceListId: string): Promise<VendorImportPreview>;
    exportCostTemplate(orgId: string, vendorId: string): Promise<{
        buffer: Buffer;
        filename: string;
    }>;
    exportPriceTemplate(orgId: string, vendorId: string, priceListId: string): Promise<{
        buffer: Buffer;
        filename: string;
    }>;
    importCosts(orgId: string, vendorId: string, file: Express.Multer.File): Promise<VendorImportResult>;
    importPrices(orgId: string, vendorId: string, priceListId: string, file: Express.Multer.File): Promise<VendorImportResult>;
    private requireVendor;
    private requirePriceList;
    private loadVendorCosts;
    private parseFile;
    private assertExcelFile;
    private matchCost;
    private matchCostForPrice;
    private skuUomKey;
    private validateAmount;
    private roundUnitCost;
    private roundPrice;
    private calculateTotals;
    private toNumber;
    private emptyResult;
}
