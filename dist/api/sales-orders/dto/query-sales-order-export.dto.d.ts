import { QuerySalesOrderDto } from './query-sales-order.dto';
export declare class QuerySalesOrderHeaderExportDto extends QuerySalesOrderDto {
}
export declare class QuerySalesOrderDetailExportDto extends QuerySalesOrderHeaderExportDto {
    created_from: string;
    created_to: string;
}
