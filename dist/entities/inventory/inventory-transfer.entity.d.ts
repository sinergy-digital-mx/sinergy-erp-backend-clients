import { RBACTenant } from '../rbac/tenant.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { Product } from '../products/product.entity';
import { UoMCatalog } from '../uom-catalog/uom-catalog.entity';
import { User } from '../users/user.entity';
import { InventoryTransferStatus } from './inventory-transfer-status.enum';
import { InventoryTransferLine } from './inventory-transfer-line.entity';
export declare class InventoryTransfer {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    folio: string;
    product: Product;
    product_id: string;
    uom: UoMCatalog;
    uom_id: string;
    source_warehouse: Warehouse;
    source_warehouse_id: string;
    destination_warehouse: Warehouse;
    destination_warehouse_id: string;
    total_quantity: number;
    status: InventoryTransferStatus;
    notes: string | null;
    created_by_user: User;
    created_by: string;
    created_at: Date;
    lines: InventoryTransferLine[];
}
