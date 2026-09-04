import { ProductItemKind } from '../../../entities/products/product-item-kind.enum';
import { SalesOrderSaleScope } from '../../../entities/sales-orders/sales-order-sale-scope.enum';
export declare function resolveSaleScope(saleScope: SalesOrderSaleScope | string | undefined, isPosSale: boolean): SalesOrderSaleScope;
export declare function assertItemKindMatchesSaleScope(saleScope: SalesOrderSaleScope, itemKind: ProductItemKind): void;
