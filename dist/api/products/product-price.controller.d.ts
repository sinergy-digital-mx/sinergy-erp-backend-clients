import { ProductPriceService } from './product-price.service';
import { CreateProductPriceDto } from './dto/create-product-price.dto';
import { UpdateProductPriceDto } from './dto/update-product-price.dto';
export declare class ProductPriceController {
    private readonly productPriceService;
    constructor(productPriceService: ProductPriceService);
    create(productId: string, dto: CreateProductPriceDto, req: any): Promise<import("../../entities/products").ProductPrice>;
    findAll(productId: string, req: any): Promise<import("../../entities/products").ProductPrice[]>;
    findOne(productId: string, id: string, req: any): Promise<import("../../entities/products").ProductPrice>;
    update(productId: string, id: string, dto: UpdateProductPriceDto, req: any): Promise<import("../../entities/products").ProductPrice>;
    remove(productId: string, id: string, req: any): Promise<void>;
}
