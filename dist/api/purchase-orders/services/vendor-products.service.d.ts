import { Repository } from 'typeorm';
import { Product, ProductUoM, ProductVendorCost } from '../../../entities/products';
import { QueryVendorProductsDto } from '../dto/query-vendor-products.dto';
export interface VendorProductUom {
    product_uom_id: string;
    uom_id: string;
    uom_name: string;
    factor: number;
    is_base: boolean;
    cost: number;
    iva_percentage: number;
    ieps_percentage: number;
    iva_unit_total: number;
    ieps_unit_total: number;
    subtotal: number;
    currency: 'MXN' | 'USD' | null;
}
export interface VendorProduct {
    product_id: string;
    product_name: string;
    product_sku: string;
    sku: string;
    has_vendor_cost: boolean;
    uoms: VendorProductUom[];
}
export declare class VendorProductsService {
    private readonly productRepository;
    private readonly productUomRepository;
    private readonly productVendorCostRepository;
    constructor(productRepository: Repository<Product>, productUomRepository: Repository<ProductUoM>, productVendorCostRepository: Repository<ProductVendorCost>);
    getVendorProducts(vendorId: string, tenantId: string, query?: QueryVendorProductsDto): Promise<VendorProduct[]>;
    private shouldIncludeWithoutCost;
    private listActiveCatalog;
    private listProductsWithVendorCost;
    private loadProductUoms;
    private loadCostsByProductUom;
    private applyProductSearch;
    private productSearchSql;
    private productSearchParams;
    private toVendorProduct;
    private mapUomWithoutCost;
    private mapUomFromCost;
}
