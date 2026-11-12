import { DataSource, Repository } from 'typeorm';
import { Product } from '../../../entities/products/product.entity';
import { InventoryStockLedgerService } from '../../inventory/services/inventory-stock-ledger.service';
import { InventoryStockLedgerValuationService } from '../../inventory/services/inventory-stock-ledger-valuation.service';
import { ToggleStatusDto } from '../dto/toggle-status.dto';
import { StockByUom } from '../utils/product-disable.util';
export interface ProductDisableImpact {
    is_active: boolean;
    has_inventory: boolean;
    lot_count: number;
    open_transfer_count: number;
    by_uom: StockByUom[];
}
export declare class ProductDisableService {
    private readonly productRepo;
    private readonly dataSource;
    private readonly stockLedger;
    private readonly stockLedgerValuation;
    constructor(productRepo: Repository<Product>, dataSource: DataSource, stockLedger: InventoryStockLedgerService, stockLedgerValuation: InventoryStockLedgerValuationService);
    getImpact(id: string, tenantId: string): Promise<ProductDisableImpact>;
    apply(id: string, dto: ToggleStatusDto, tenantId: string, userId?: string | null): Promise<Product>;
    private disable;
    private countOpenTransfers;
    private requireProduct;
}
