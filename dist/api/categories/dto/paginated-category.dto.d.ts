import { Category } from '../../../entities/categories/category.entity';
export declare class PaginatedCategoryDto {
    data: Category[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
