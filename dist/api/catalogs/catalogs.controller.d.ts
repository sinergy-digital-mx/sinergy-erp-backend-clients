import { CatalogsService } from './catalogs.service';
import { CatalogType } from '../../entities/catalog.entity';
export declare class CatalogsController {
    private readonly catalogsService;
    constructor(catalogsService: CatalogsService);
    findAll(type?: CatalogType): Promise<import("../../entities/catalog.entity").Catalog[]>;
    findByType(type: CatalogType): Promise<import("../../entities/catalog.entity").Catalog[]>;
    search(type: CatalogType, query: string): Promise<import("../../entities/catalog.entity").Catalog[]>;
    getPhoneCountries(): Promise<import("../../entities/catalog.entity").Catalog[]>;
}
