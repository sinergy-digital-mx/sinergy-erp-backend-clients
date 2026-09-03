import { Product } from '../../../entities/products/product.entity';
export declare class PaginatedProductDto {
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
