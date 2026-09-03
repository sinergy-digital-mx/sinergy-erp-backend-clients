import { Repository } from 'typeorm';
import { UoMCatalog } from '../../entities/uom-catalog/uom-catalog.entity';
import { CreateUoMCatalogDto } from './dto/create-uom-catalog.dto';
import { UpdateUoMCatalogDto } from './dto/update-uom-catalog.dto';
import { QueryUoMCatalogDto } from './dto/query-uom-catalog.dto';
import { PaginatedUoMCatalogDto } from './dto/paginated-uom-catalog.dto';
export declare class UoMCatalogService {
    private readonly uomCatalogRepository;
    constructor(uomCatalogRepository: Repository<UoMCatalog>);
    create(dto: CreateUoMCatalogDto, tenantId: string): Promise<UoMCatalog>;
    findAll(query: QueryUoMCatalogDto, tenantId: string): Promise<PaginatedUoMCatalogDto>;
    findOne(id: string, tenantId: string): Promise<UoMCatalog>;
    update(id: string, dto: UpdateUoMCatalogDto, tenantId: string): Promise<UoMCatalog>;
    remove(id: string, tenantId: string): Promise<void>;
}
