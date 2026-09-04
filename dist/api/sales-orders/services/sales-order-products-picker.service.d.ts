import { InventoryService } from '../../inventory/inventory.service';
import { ProductService } from '../../products/product.service';
import { QuerySalesOrderProductsSummaryDto } from '../dto/query-sales-order-products-summary.dto';
import { PosSessionInventorySummaryResponseDto } from '../../inventory/dto/pos-session-inventory-summary-response.dto';
export declare class SalesOrderProductsPickerService {
    private readonly inventoryService;
    private readonly productService;
    constructor(inventoryService: InventoryService, productService: ProductService);
    getSummary(tenantId: string, query: QuerySalesOrderProductsSummaryDto): Promise<PosSessionInventorySummaryResponseDto>;
    private getCombinedSummary;
    private tagGoods;
}
