import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { PaginatedCategoryDto } from './dto/paginated-category.dto';
export declare class CategoryController {
    private readonly service;
    constructor(service: CategoryService);
    create(dto: CreateCategoryDto, req: any): Promise<import("../../entities/categories").Category>;
    findAll(query: QueryCategoryDto, req: any): Promise<PaginatedCategoryDto>;
    findOne(id: string, req: any): Promise<import("../../entities/categories").Category>;
    update(id: string, dto: UpdateCategoryDto, req: any): Promise<import("../../entities/categories").Category>;
    remove(id: string, req: any): Promise<void>;
}
