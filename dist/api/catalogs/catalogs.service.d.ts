import { Repository } from 'typeorm';
import { Catalog, CatalogType } from '../../entities/catalog.entity';
export declare class CatalogsService {
    private catalogRepo;
    constructor(catalogRepo: Repository<Catalog>);
    findByType(catalogType: CatalogType): Promise<Catalog[]>;
    findByTypeAndCode(catalogType: CatalogType, code: string): Promise<Catalog | null>;
    search(catalogType: CatalogType, query: string): Promise<Catalog[]>;
    findAll(catalogType?: CatalogType): Promise<Catalog[]>;
}
