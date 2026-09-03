import { ProductUoMService } from './product-uom.service';
import { CreateProductUoMDto } from './dto/create-product-uom.dto';
import { UpdateProductUoMDto } from './dto/update-product-uom.dto';
import { QueryUoMCatalogDto } from '../uom-catalog/dto/query-uom-catalog.dto';
export declare class ProductUoMController {
    private readonly productUoMService;
    constructor(productUoMService: ProductUoMService);
    create(productId: string, dto: CreateProductUoMDto, req: any): Promise<import("../../entities/products").ProductUoM>;
    findAll(productId: string, req: any): Promise<import("../../entities/products").ProductUoM[]>;
    findCatalog(productId: string, query: QueryUoMCatalogDto, req: any): Promise<import("../uom-catalog/dto/paginated-uom-catalog.dto").PaginatedUoMCatalogDto>;
    findOne(productId: string, id: string, req: any): Promise<import("../../entities/products").ProductUoM>;
    update(productId: string, id: string, dto: UpdateProductUoMDto, req: any): Promise<import("../../entities/products").ProductUoM>;
    remove(productId: string, id: string, req: any): Promise<void>;
}
