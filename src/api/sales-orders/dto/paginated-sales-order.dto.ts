import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';

export interface PaginatedSalesOrderDto {
  data: SalesOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
