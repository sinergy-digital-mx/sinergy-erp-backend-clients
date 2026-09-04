import { SalesOrderSaleScope } from '../../../entities/sales-orders/sales-order-sale-scope.enum';
export declare class QueryQuotationProductsSummaryDto {
    fiscal_configuration_id: string;
    billing_branch_id: string;
    search?: string;
    page?: number;
    limit?: number;
    sale_scope?: SalesOrderSaleScope;
}
