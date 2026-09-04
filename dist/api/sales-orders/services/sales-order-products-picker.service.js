"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesOrderProductsPickerService = void 0;
const common_1 = require("@nestjs/common");
const inventory_service_1 = require("../../inventory/inventory.service");
const product_service_1 = require("../../products/product.service");
const product_item_kind_enum_1 = require("../../../entities/products/product-item-kind.enum");
const sales_order_sale_scope_enum_1 = require("../../../entities/sales-orders/sales-order-sale-scope.enum");
let SalesOrderProductsPickerService = class SalesOrderProductsPickerService {
    inventoryService;
    productService;
    constructor(inventoryService, productService) {
        this.inventoryService = inventoryService;
        this.productService = productService;
    }
    async getSummary(tenantId, query) {
        const saleScope = query.sale_scope ?? sales_order_sale_scope_enum_1.SalesOrderSaleScope.Inventory;
        if (saleScope === sales_order_sale_scope_enum_1.SalesOrderSaleScope.Services) {
            return this.productService.findServiceCatalogSummary(tenantId, query);
        }
        if (saleScope === sales_order_sale_scope_enum_1.SalesOrderSaleScope.Inventory) {
            const goods = await this.inventoryService.getBranchInventorySummary(tenantId, query.billing_branch_id, {
                fiscal_configuration_id: query.fiscal_configuration_id,
                search: query.search,
                only_available: true,
                page: query.page ?? 1,
                limit: query.limit ?? 40,
            });
            return this.tagGoods(goods);
        }
        return this.getCombinedSummary(tenantId, query);
    }
    async getCombinedSummary(tenantId, query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = Math.min(query.limit && query.limit > 0 ? query.limit : 40, 100);
        const fetchLimit = Math.min(page * limit, 100);
        const [services, goods] = await Promise.all([
            this.productService.findServiceCatalogSummary(tenantId, {
                ...query,
                page: 1,
                limit: fetchLimit,
            }),
            this.inventoryService
                .getBranchInventorySummary(tenantId, query.billing_branch_id, {
                fiscal_configuration_id: query.fiscal_configuration_id,
                search: query.search,
                only_available: true,
                page: 1,
                limit: fetchLimit,
            })
                .then((summary) => this.tagGoods(summary))
                .catch((error) => {
                if (error instanceof common_1.NotFoundException) {
                    return {
                        billing_branch_id: query.billing_branch_id,
                        fiscal_configuration_id: query.fiscal_configuration_id,
                        warehouses: [],
                        applied_warehouse_id: null,
                        data: [],
                        total: 0,
                        page: 1,
                        limit: fetchLimit,
                        totalPages: 0,
                    };
                }
                throw error;
            }),
        ]);
        const seen = new Set();
        const merged = [...services.data, ...goods.data].filter((row) => {
            if (seen.has(row.product_id)) {
                return false;
            }
            seen.add(row.product_id);
            return true;
        });
        const start = (page - 1) * limit;
        const data = merged.slice(start, start + limit);
        const total = merged.length;
        return {
            billing_branch_id: query.billing_branch_id,
            fiscal_configuration_id: query.fiscal_configuration_id,
            warehouses: goods.warehouses ?? [],
            applied_warehouse_id: goods.applied_warehouse_id ?? null,
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 0,
        };
    }
    tagGoods(summary) {
        return {
            ...summary,
            data: (summary.data ?? []).map((row) => ({
                ...row,
                item_kind: row.item_kind ?? product_item_kind_enum_1.ProductItemKind.Goods,
            })),
        };
    }
};
exports.SalesOrderProductsPickerService = SalesOrderProductsPickerService;
exports.SalesOrderProductsPickerService = SalesOrderProductsPickerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService,
        product_service_1.ProductService])
], SalesOrderProductsPickerService);
//# sourceMappingURL=sales-order-products-picker.service.js.map