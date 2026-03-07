import { PurchaseOrder } from '../../../entities/purchase-orders/purchase-order.entity';

export class PaginatedPurchaseOrderDto {
  data: PurchaseOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
