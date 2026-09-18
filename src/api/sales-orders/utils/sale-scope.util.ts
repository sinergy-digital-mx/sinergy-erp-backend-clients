import { BadRequestException } from '@nestjs/common';
import { ProductItemKind } from '../../../entities/products/product-item-kind.enum';
import { SalesOrderSaleScope } from '../../../entities/sales-orders/sales-order-sale-scope.enum';

export function resolveSaleScope(
  saleScope: SalesOrderSaleScope | string | undefined,
  isPosSale: boolean,
): SalesOrderSaleScope {
  if (isPosSale) {
    return SalesOrderSaleScope.Inventory;
  }
  if (saleScope === SalesOrderSaleScope.Services) {
    return SalesOrderSaleScope.Services;
  }
  if (saleScope === SalesOrderSaleScope.Combined) {
    return SalesOrderSaleScope.Combined;
  }
  return SalesOrderSaleScope.Inventory;
}

export function assertItemKindMatchesSaleScope(
  saleScope: SalesOrderSaleScope,
  itemKind: ProductItemKind,
): void {
  if (saleScope === SalesOrderSaleScope.Inventory && itemKind !== ProductItemKind.Goods) {
    throw new BadRequestException(
      'El modo Inventario solo admite productos. Quita los servicios o cambia el tipo de orden.',
    );
  }
  if (saleScope === SalesOrderSaleScope.Services && itemKind !== ProductItemKind.Service) {
    throw new BadRequestException(
      'El modo Servicios solo admite servicios. Quita los productos o cambia el tipo de orden.',
    );
  }
}
