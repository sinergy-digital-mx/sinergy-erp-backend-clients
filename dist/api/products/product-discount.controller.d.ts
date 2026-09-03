import { ProductDiscountService } from './product-discount.service';
import { CreateProductDiscountDto } from './dto/create-product-discount.dto';
import { UpdateProductDiscountDto } from './dto/update-product-discount.dto';
export declare class ProductDiscountController {
    private readonly productDiscountService;
    constructor(productDiscountService: ProductDiscountService);
    create(productId: string, dto: CreateProductDiscountDto, req: any): Promise<import("../../entities/products").ProductDiscount>;
    findAll(productId: string, req: any): Promise<import("../../entities/products").ProductDiscount[]>;
    findOne(productId: string, id: string, req: any): Promise<import("../../entities/products").ProductDiscount>;
    update(productId: string, id: string, dto: UpdateProductDiscountDto, req: any): Promise<import("../../entities/products").ProductDiscount>;
    remove(productId: string, id: string, req: any): Promise<void>;
}
