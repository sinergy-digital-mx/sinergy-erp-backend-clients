import { Repository } from 'typeorm';
import { ProductVendorCost } from '../../entities/products/product-vendor-cost.entity';
import { Product } from '../../entities/products/product.entity';
import { CreateProductVendorCostDto } from './dto/create-product-vendor-cost.dto';
import { UpdateProductVendorCostDto } from './dto/update-product-vendor-cost.dto';
export declare class ProductVendorCostService {
    private readonly productVendorCostRepository;
    private readonly productRepository;
    constructor(productVendorCostRepository: Repository<ProductVendorCost>, productRepository: Repository<Product>);
    private roundUnitCost;
    private calculateTotals;
    create(productId: string, dto: CreateProductVendorCostDto, tenantId: string): Promise<ProductVendorCost>;
    findAll(productId: string, tenantId: string): Promise<ProductVendorCost[]>;
    findOne(id: string, productId: string, tenantId: string): Promise<ProductVendorCost>;
    update(id: string, productId: string, dto: UpdateProductVendorCostDto, tenantId: string): Promise<ProductVendorCost>;
    remove(id: string, productId: string, tenantId: string): Promise<void>;
}
