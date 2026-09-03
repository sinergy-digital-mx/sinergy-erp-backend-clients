import { Repository } from 'typeorm';
import { ProductUoM } from '../../entities/products/product-uom.entity';
import { Product } from '../../entities/products/product.entity';
import { CreateProductUoMDto } from './dto/create-product-uom.dto';
import { UpdateProductUoMDto } from './dto/update-product-uom.dto';
import { UoMCatalogService } from '../uom-catalog/uom-catalog.service';
import { QueryUoMCatalogDto } from '../uom-catalog/dto/query-uom-catalog.dto';
import { PaginatedUoMCatalogDto } from '../uom-catalog/dto/paginated-uom-catalog.dto';
export declare class ProductUoMService {
    private readonly productUoMRepository;
    private readonly productRepository;
    private readonly uomCatalogService;
    constructor(productUoMRepository: Repository<ProductUoM>, productRepository: Repository<Product>, uomCatalogService: UoMCatalogService);
    create(productId: string, dto: CreateProductUoMDto, tenantId: string): Promise<ProductUoM>;
    findCatalogForProduct(productId: string, query: QueryUoMCatalogDto, tenantId: string): Promise<PaginatedUoMCatalogDto>;
    findAll(productId: string, tenantId: string): Promise<ProductUoM[]>;
    findOne(id: string, productId: string, tenantId: string): Promise<ProductUoM>;
    update(id: string, productId: string, dto: UpdateProductUoMDto, tenantId: string): Promise<ProductUoM>;
    remove(id: string, productId: string, tenantId: string): Promise<void>;
    private resolveParentUomCatalogId;
}
