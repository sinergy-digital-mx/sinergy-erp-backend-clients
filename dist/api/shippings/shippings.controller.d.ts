import { ShippingsService } from './shippings.service';
import { AddShippingStopsDto, CreateShippingDto, PreviewShippingDto, QueryAvailableShippingOrdersDto, QueryShippingDto, ResolveOrdersDto, UpdateShippingStatusDto } from './dto/shipping.dto';
export declare class ShippingsController {
    private readonly service;
    constructor(service: ShippingsService);
    preview(dto: PreviewShippingDto, req: any): Promise<{
        origin: {
            label: string;
            billing_branch_id: string | null;
            fiscal_configuration_id: string | null;
            warehouse_id: string | null;
            name: string;
            street: string | null;
            city: string | null;
            state: string | null;
            zip_code: string | null;
            country: string | null;
            address_summary: string;
            latitude: number | null;
            longitude: number | null;
            location_status: import("../../entities/logistics/shipping-stop.entity").LocationStatus;
            distance_from_previous_km: number | null;
        };
        orders: {
            label: string;
            sales_order_id: string;
            folio: string;
            customer_id: number | null;
            customer_name: string | null;
            stop_sequence: number;
            location_status: import("../../entities/logistics/shipping-stop.entity").LocationStatus;
            delivery_latitude: number | null;
            delivery_longitude: number | null;
            address_summary: string | null;
            customer_address_id: number | null;
            address_type: string | null;
            distance_from_previous_km: number | null;
            distance_from_origin_km: number | null;
        }[];
        route_points: ({
            label: string;
            kind: "stop";
            name: string | null;
            address_summary: string | null;
            latitude: number | null;
            longitude: number | null;
            location_status: import("../../entities/logistics/shipping-stop.entity").LocationStatus;
            distance_from_previous_km: number | null;
            billing_branch_id: null;
            warehouse_id: null;
            sales_order_id: string;
            customer_id: number | null;
            customer_address_id: number | null;
        } | {
            label: string;
            kind: "origin";
            name: string;
            address_summary: string;
            latitude: number | null;
            longitude: number | null;
            location_status: import("../../entities/logistics/shipping-stop.entity").LocationStatus;
            distance_from_previous_km: null;
            billing_branch_id: string | null;
            warehouse_id: string | null;
            sales_order_id: null;
            customer_id: null;
            customer_address_id: null;
        })[];
        estimated_distance_km: number | null;
        missing_location_count: number;
        origin_missing_location: boolean;
    }>;
    resolveOrders(dto: ResolveOrdersDto, req: any): Promise<{
        orders: {
            sales_order_id: string;
            found: boolean;
            folio?: string;
            customer_name?: string | null;
            customer_address_id?: number | null;
            location_status: import("../../entities/logistics/shipping-stop.entity").LocationStatus | string;
            delivery_latitude?: number | null;
            delivery_longitude?: number | null;
            address_summary?: string | null;
        }[];
        missing_location_count: number;
    }>;
    create(dto: CreateShippingDto, req: any): Promise<import("../../entities/logistics/shipping.entity").Shipping>;
    findAll(query: QueryShippingDto, req: any): Promise<{
        data: import("../../entities/logistics/shipping.entity").Shipping[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
    findAvailableOrders(query: QueryAvailableShippingOrdersDto, req: any): Promise<{
        data: {
            id: string;
            folio: string;
            general_status: string;
            payment_status: string;
            total: number;
            created_at: Date;
            fiscal_configuration_id: string;
            razon_social: string | null;
            billing_branch_id: string | null;
            sucursal: string | null;
            billing_branch: {
                id: string;
                code: string;
                city: string;
                state: string;
            } | null;
            customer_id: number;
            customer_name: string | null;
            customer: {
                id: number;
                name: string;
                lastname: string;
                company_name: string;
            } | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
    findOne(id: string, req: any): Promise<import("../../entities/logistics/shipping.entity").Shipping>;
    addStops(id: string, dto: AddShippingStopsDto, req: any): Promise<import("../../entities/logistics/shipping.entity").Shipping>;
    recalculate(id: string, req: any): Promise<import("../../entities/logistics/shipping.entity").Shipping>;
    updateStatus(id: string, dto: UpdateShippingStatusDto, req: any): Promise<import("../../entities/logistics/shipping.entity").Shipping>;
}
