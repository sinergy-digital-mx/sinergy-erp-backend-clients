import { Repository } from 'typeorm';
import { Category } from '../../entities/categories/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { PaginatedCategoryDto } from './dto/paginated-category.dto';
export declare class CategoryService {
    private repo;
    constructor(repo: Repository<Category>);
    create(dto: CreateCategoryDto, tenantId: string): Promise<Category>;
    findAll(tenantId: string, query?: QueryCategoryDto): Promise<PaginatedCategoryDto>;
    findOne(id: string, tenantId: string): Promise<Category>;
    update(id: string, dto: UpdateCategoryDto, tenantId: string): Promise<Category>;
    remove(id: string, tenantId: string): Promise<void>;
}
