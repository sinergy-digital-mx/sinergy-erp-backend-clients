import { ProductService } from './product.service';
import { ProductsExportService } from './services/products-export.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { QueryProductExportDto } from './dto/query-product-export.dto';
import { PaginatedProductDto } from './dto/paginated-product.dto';
import { ToggleStatusDto } from './dto/toggle-status.dto';
import { ProductDisableService } from './services/product-disable.service';
export declare class ProductController {
    private readonly productService;
    private readonly productsExportService;
    private readonly productDisableService;
    constructor(productService: ProductService, productsExportService: ProductsExportService, productDisableService: ProductDisableService);
    create(dto: CreateProductDto, req: any): Promise<import("../../entities/products").Product>;
    findAll(query: QueryProductDto, req: any): Promise<PaginatedProductDto>;
    exportExcel(query: QueryProductExportDto, req: any, res: any): Promise<void>;
    getDisableImpact(id: string, req: any): Promise<import("./services/product-disable.service").ProductDisableImpact>;
    findOne(id: string, req: any): Promise<import("../../entities/products").Product>;
    update(id: string, dto: UpdateProductDto, req: any): Promise<import("../../entities/products").Product>;
    toggleStatus(id: string, dto: ToggleStatusDto, req: any): Promise<import("../../entities/products").Product>;
    remove(id: string, req: any): Promise<void>;
    uploadPhoto(id: string, file: Express.Multer.File, req: any): Promise<import("../../entities/products").Product>;
}
