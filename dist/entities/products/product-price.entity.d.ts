import { Product } from './product.entity';
import { PriceList } from './price-list.entity';
import { ProductUoM } from './product-uom.entity';
export declare class ProductPrice {
    id: string;
    product: Product;
    product_id: string;
    price_list: PriceList;
    price_list_id: string;
    product_uom: ProductUoM;
    product_uom_id: string;
    price: number;
    iva_percentage: number;
    ieps_percentage: number;
    iva_unit_total: number;
    ieps_unit_total: number;
    subtotal: number;
    total: number;
    created_at: Date;
    updated_at: Date;
}
