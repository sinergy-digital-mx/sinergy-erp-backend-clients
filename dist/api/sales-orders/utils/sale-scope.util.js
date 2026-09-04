"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSaleScope = resolveSaleScope;
exports.assertItemKindMatchesSaleScope = assertItemKindMatchesSaleScope;
const common_1 = require("@nestjs/common");
const product_item_kind_enum_1 = require("../../../entities/products/product-item-kind.enum");
const sales_order_sale_scope_enum_1 = require("../../../entities/sales-orders/sales-order-sale-scope.enum");
function resolveSaleScope(saleScope, isPosSale) {
    if (isPosSale) {
        return sales_order_sale_scope_enum_1.SalesOrderSaleScope.Inventory;
    }
    if (saleScope === sales_order_sale_scope_enum_1.SalesOrderSaleScope.Services) {
        return sales_order_sale_scope_enum_1.SalesOrderSaleScope.Services;
    }
    if (saleScope === sales_order_sale_scope_enum_1.SalesOrderSaleScope.Combined) {
        return sales_order_sale_scope_enum_1.SalesOrderSaleScope.Combined;
    }
    return sales_order_sale_scope_enum_1.SalesOrderSaleScope.Inventory;
}
function assertItemKindMatchesSaleScope(saleScope, itemKind) {
    if (saleScope === sales_order_sale_scope_enum_1.SalesOrderSaleScope.Inventory && itemKind !== product_item_kind_enum_1.ProductItemKind.Goods) {
        throw new common_1.BadRequestException('El modo Inventario solo admite productos. Quita los servicios o cambia el tipo de orden.');
    }
    if (saleScope === sales_order_sale_scope_enum_1.SalesOrderSaleScope.Services && itemKind !== product_item_kind_enum_1.ProductItemKind.Service) {
        throw new common_1.BadRequestException('El modo Servicios solo admite servicios. Quita los productos o cambia el tipo de orden.');
    }
}
//# sourceMappingURL=sale-scope.util.js.map