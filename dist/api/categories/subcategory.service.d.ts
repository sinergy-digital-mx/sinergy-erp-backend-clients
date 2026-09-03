import { Repository } from 'typeorm';
import { Subcategory } from '../../entities/categories/subcategory.entity';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { QuerySubcategoryDto } from './dto/query-subcategory.dto';
import { PaginatedSubcategoryDto } from './dto/paginated-subcategory.dto';
export declare class SubcategoryService {
    private repo;
    constructor(repo: Repository<Subcategory>);
    create(dto: CreateSubcategoryDto, tenantId: string): Promise<Subcategory>;
    findAll(tenantId: string, query?: QuerySubcategoryDto): Promise<PaginatedSubcategoryDto>;
    findOne(id: string, tenantId: string): Promise<Subcategory>;
    update(id: string, dto: UpdateSubcategoryDto, tenantId: string): Promise<Subcategory>;
    remove(id: string, tenantId: string): Promise<void>;
}
