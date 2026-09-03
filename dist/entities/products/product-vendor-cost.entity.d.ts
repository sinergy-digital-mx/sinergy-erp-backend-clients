import { Product } from './product.entity';
import { Vendor } from '../vendor/vendor.entity';
import { ProductUoM } from './product-uom.entity';
export declare class ProductVendorCost {
    id: string;
    product: Product;
    product_id: string;
    vendor: Vendor;
    vendor_id: string;
    product_uom: ProductUoM;
    product_uom_id: string;
    cost: number;
    currency: string;
    iva_percentage: number;
    ieps_percentage: number;
    iva_unit_total: number;
    ieps_unit_total: number;
    subtotal: number;
    total: number;
    created_at: Date;
    updated_at: Date;
}
