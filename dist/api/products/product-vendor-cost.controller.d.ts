import { ProductVendorCostService } from './product-vendor-cost.service';
import { CreateProductVendorCostDto } from './dto/create-product-vendor-cost.dto';
import { UpdateProductVendorCostDto } from './dto/update-product-vendor-cost.dto';
export declare class ProductVendorCostController {
    private readonly productVendorCostService;
    constructor(productVendorCostService: ProductVendorCostService);
    create(productId: string, dto: CreateProductVendorCostDto, req: any): Promise<import("../../entities/products").ProductVendorCost>;
    findAll(productId: string, req: any): Promise<import("../../entities/products").ProductVendorCost[]>;
    findOne(productId: string, id: string, req: any): Promise<import("../../entities/products").ProductVendorCost>;
    update(productId: string, id: string, dto: UpdateProductVendorCostDto, req: any): Promise<import("../../entities/products").ProductVendorCost>;
    remove(productId: string, id: string, req: any): Promise<void>;
}
