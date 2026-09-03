import { UoMCatalog } from '../../../entities/uom-catalog/uom-catalog.entity';
export declare class PaginatedUoMCatalogDto {
    data: UoMCatalog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
