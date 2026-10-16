import { RBACTenant } from '../rbac/tenant.entity';
import { InventoryTransfer } from '../inventory/inventory-transfer.entity';
import { Shipping } from './shipping.entity';
export declare class ShippingInventoryTransfer {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    shipping: Shipping;
    shipping_id: string;
    inventory_transfer: InventoryTransfer;
    inventory_transfer_id: string;
    created_at: Date;
}
