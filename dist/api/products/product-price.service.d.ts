import { Repository } from 'typeorm';
import { ProductPrice } from '../../entities/products/product-price.entity';
import { Product } from '../../entities/products/product.entity';
import { CreateProductPriceDto } from './dto/create-product-price.dto';
import { UpdateProductPriceDto } from './dto/update-product-price.dto';
export declare class ProductPriceService {
    private readonly productPriceRepository;
    private readonly productRepository;
    constructor(productPriceRepository: Repository<ProductPrice>, productRepository: Repository<Product>);
    private calculateTotals;
    create(productId: string, dto: CreateProductPriceDto, tenantId: string): Promise<ProductPrice>;
    findAll(productId: string, tenantId: string): Promise<ProductPrice[]>;
    findOne(id: string, productId: string, tenantId: string): Promise<ProductPrice>;
    update(id: string, productId: string, dto: UpdateProductPriceDto, tenantId: string): Promise<ProductPrice>;
    remove(id: string, productId: string, tenantId: string): Promise<void>;
}
