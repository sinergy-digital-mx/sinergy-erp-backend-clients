import { CreateSalesOrderLineItemDto } from '../../sales-orders/dto/create-sales-order.dto';
export declare class ReplacePosSaleCartDto {
    line_items: CreateSalesOrderLineItemDto[];
    customer_id?: number;
    global_discount_id?: string;
    walk_in_name?: string;
    walk_in_rfc?: string;
}
