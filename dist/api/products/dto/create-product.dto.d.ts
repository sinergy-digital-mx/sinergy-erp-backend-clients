import { ProductItemKind } from '../../../entities/products/product-item-kind.enum';
export declare class CreateProductDto {
    sku?: string;
    external_sku?: string;
    name: string;
    description?: string;
    sat_clave?: string;
    sat_code?: string;
    category_id?: string;
    subcategory_id?: string;
    item_kind?: ProductItemKind;
    base_uom_catalog_id?: string;
    base_uom_id?: string;
}
