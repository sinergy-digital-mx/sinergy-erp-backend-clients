import { Repository } from 'typeorm';
import { ProductDiscount } from '../../entities/products/product-discount.entity';
import { Product } from '../../entities/products/product.entity';
import { CreateProductDiscountDto } from './dto/create-product-discount.dto';
import { UpdateProductDiscountDto } from './dto/update-product-discount.dto';
export declare class ProductDiscountService {
    private readonly productDiscountRepository;
    private readonly productRepository;
    constructor(productDiscountRepository: Repository<ProductDiscount>, productRepository: Repository<Product>);
    private assertProductOwnership;
    private validateDiscountValue;
    private validateDateRange;
    private assertProductUom;
    create(productId: string, dto: CreateProductDiscountDto, tenantId: string): Promise<ProductDiscount>;
    findAll(productId: string, tenantId: string): Promise<ProductDiscount[]>;
    findApplicableForProductUom(productId: string, productUomId: string, tenantId: string): Promise<import("./utils/product-discount.util").ApplicableProductDiscountSummary[]>;
    findOne(id: string, productId: string, tenantId: string): Promise<ProductDiscount>;
    findByIdForOrder(id: string, productId: string, tenantId: string): Promise<ProductDiscount>;
    update(id: string, productId: string, dto: UpdateProductDiscountDto, tenantId: string): Promise<ProductDiscount>;
    remove(id: string, productId: string, tenantId: string): Promise<void>;
}
