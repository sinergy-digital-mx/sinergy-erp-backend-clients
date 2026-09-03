import { Repository } from 'typeorm';
import { Product } from '../../entities/products/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { PaginatedProductDto } from './dto/paginated-product.dto';
import { ToggleStatusDto } from './dto/toggle-status.dto';
import { S3Service } from '../../common/services/s3.service';
export declare class ProductService {
    private readonly productRepository;
    private readonly s3Service;
    constructor(productRepository: Repository<Product>, s3Service: S3Service);
    private resolveSatClave;
    private extractAllowedProductFields;
    create(dto: CreateProductDto, tenantId: string): Promise<Product>;
    findAll(query: QueryProductDto, tenantId: string): Promise<PaginatedProductDto>;
    findOne(id: string, tenantId: string): Promise<Product>;
    update(id: string, dto: UpdateProductDto, tenantId: string): Promise<Product>;
    toggleStatus(id: string, dto: ToggleStatusDto, tenantId: string): Promise<Product>;
    remove(id: string, tenantId: string): Promise<void>;
    uploadPhoto(id: string, tenantId: string, file: Express.Multer.File): Promise<Product>;
    private getByIdOrFail;
    private toResponseWithPhotoUrl;
}
