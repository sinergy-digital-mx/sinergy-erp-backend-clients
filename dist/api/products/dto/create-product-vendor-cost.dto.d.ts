export declare class CreateProductVendorCostDto {
    vendor_id: string;
    product_uom_id: string;
    cost: number;
    iva_percentage: number;
    ieps_percentage: number;
    currency?: 'MXN' | 'USD';
}
