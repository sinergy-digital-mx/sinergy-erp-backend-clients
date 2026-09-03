import { UoMCatalogService } from './uom-catalog.service';
import { CreateUoMCatalogDto } from './dto/create-uom-catalog.dto';
import { UpdateUoMCatalogDto } from './dto/update-uom-catalog.dto';
import { QueryUoMCatalogDto } from './dto/query-uom-catalog.dto';
import { PaginatedUoMCatalogDto } from './dto/paginated-uom-catalog.dto';
export declare class UoMCatalogController {
    private readonly uomCatalogService;
    constructor(uomCatalogService: UoMCatalogService);
    create(dto: CreateUoMCatalogDto, req: any): Promise<import("../../entities/uom-catalog/uom-catalog.entity").UoMCatalog>;
    findAll(query: QueryUoMCatalogDto, req: any): Promise<PaginatedUoMCatalogDto>;
    findOne(id: string, req: any): Promise<import("../../entities/uom-catalog/uom-catalog.entity").UoMCatalog>;
    update(id: string, dto: UpdateUoMCatalogDto, req: any): Promise<import("../../entities/uom-catalog/uom-catalog.entity").UoMCatalog>;
    remove(id: string, req: any): Promise<void>;
}
