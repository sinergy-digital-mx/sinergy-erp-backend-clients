import { SubcategoryService } from './subcategory.service';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { QuerySubcategoryDto } from './dto/query-subcategory.dto';
import { PaginatedSubcategoryDto } from './dto/paginated-subcategory.dto';
export declare class SubcategoryController {
    private readonly service;
    constructor(service: SubcategoryService);
    create(dto: CreateSubcategoryDto, req: any): Promise<import("../../entities/categories").Subcategory>;
    findAll(query: QuerySubcategoryDto, req: any): Promise<PaginatedSubcategoryDto>;
    findOne(id: string, req: any): Promise<import("../../entities/categories").Subcategory>;
    update(id: string, dto: UpdateSubcategoryDto, req: any): Promise<import("../../entities/categories").Subcategory>;
    remove(id: string, req: any): Promise<void>;
}
