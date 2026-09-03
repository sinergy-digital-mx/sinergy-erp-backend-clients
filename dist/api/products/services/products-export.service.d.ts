import { Repository } from 'typeorm';
import { Product } from '../../../entities/products/product.entity';
import { ProductUoM } from '../../../entities/products/product-uom.entity';
import { PriceList } from '../../../entities/products/price-list.entity';
import { ProductPrice } from '../../../entities/products/product-price.entity';
import { ProductVendorCost } from '../../../entities/products/product-vendor-cost.entity';
import { QueryProductExportDto } from '../dto/query-product-export.dto';
export declare class ProductsExportService {
    private readonly productRepo;
    private readonly productUomRepo;
    private readonly priceListRepo;
    private readonly productPriceRepo;
    private readonly vendorCostRepo;
    constructor(productRepo: Repository<Product>, productUomRepo: Repository<ProductUoM>, priceListRepo: Repository<PriceList>, productPriceRepo: Repository<ProductPrice>, vendorCostRepo: Repository<ProductVendorCost>);
    getFilename(): string;
    exportCatalog(orgId: string, filters: QueryProductExportDto): Promise<Buffer>;
    private buildColumns;
    private buildRow;
    private fetchProducts;
    private groupNumbers;
    private average;
    private priceListKey;
    private describeFilters;
}
