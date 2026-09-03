import { Product } from './product.entity';
import { UoMCatalog } from '../uom-catalog/uom-catalog.entity';
export declare class ProductUoM {
    id: string;
    product: Product;
    product_id: string;
    uom: UoMCatalog;
    uom_catalog_id: string;
    factor: number;
    is_base: boolean;
    parent_uom: UoMCatalog | null;
    parent_uom_id: string | null;
    created_at: Date;
    updated_at: Date;
}
