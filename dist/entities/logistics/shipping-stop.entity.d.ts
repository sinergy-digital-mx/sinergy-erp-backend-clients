import { RBACTenant } from '../rbac/tenant.entity';
import { SalesOrder } from '../sales-orders/sales-order.entity';
import { CustomerAddress } from '../customers/customer-address.entity';
import { Shipping } from './shipping.entity';
export type LocationStatus = 'ok' | 'without_location';
export declare class ShippingStop {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    shipping: Shipping;
    shipping_id: string;
    sales_order: SalesOrder;
    sales_order_id: string;
    stop_sequence: number;
    customer_address: CustomerAddress | null;
    customer_address_id: number | null;
    location_status: LocationStatus;
    delivery_latitude: number | null;
    delivery_longitude: number | null;
    distance_from_previous_km: number | null;
    created_at: Date;
    updated_at: Date;
}
