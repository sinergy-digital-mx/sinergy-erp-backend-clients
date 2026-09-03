import { VendorProductsService } from '../services/vendor-products.service';
import { QueryVendorProductsDto } from '../dto/query-vendor-products.dto';
export declare class VendorProductsController {
    private readonly vendorProductsService;
    constructor(vendorProductsService: VendorProductsService);
    getVendorProducts(vendorId: string, query: QueryVendorProductsDto, req: any): Promise<import("../services/vendor-products.service").VendorProduct[]>;
}
