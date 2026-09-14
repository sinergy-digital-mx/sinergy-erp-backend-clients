"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MadereriaInventoryImportModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const fiscal_configuration_entity_1 = require("../../entities/billing/fiscal-configuration.entity");
const billing_branch_entity_1 = require("../../entities/billing/billing-branch.entity");
const warehouse_entity_1 = require("../../entities/warehouse/warehouse.entity");
const product_entity_1 = require("../../entities/products/product.entity");
const product_uom_entity_1 = require("../../entities/products/product-uom.entity");
const product_price_entity_1 = require("../../entities/products/product-price.entity");
const product_vendor_cost_entity_1 = require("../../entities/products/product-vendor-cost.entity");
const price_list_entity_1 = require("../../entities/products/price-list.entity");
const vendor_entity_1 = require("../../entities/vendor/vendor.entity");
const uom_catalog_entity_1 = require("../../entities/uom-catalog/uom-catalog.entity");
const inventory_batch_entity_1 = require("../../entities/purchase-orders/inventory-batch.entity");
const purchase_orders_module_1 = require("../purchase-orders/purchase-orders.module");
const rbac_module_1 = require("../rbac/rbac.module");
const madereria_inventory_import_controller_1 = require("./madereria-inventory-import.controller");
const madereria_inventory_import_service_1 = require("./madereria-inventory-import.service");
let MadereriaInventoryImportModule = class MadereriaInventoryImportModule {
};
exports.MadereriaInventoryImportModule = MadereriaInventoryImportModule;
exports.MadereriaInventoryImportModule = MadereriaInventoryImportModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                fiscal_configuration_entity_1.FiscalConfiguration,
                billing_branch_entity_1.BillingBranch,
                warehouse_entity_1.Warehouse,
                product_entity_1.Product,
                product_uom_entity_1.ProductUoM,
                product_price_entity_1.ProductPrice,
                product_vendor_cost_entity_1.ProductVendorCost,
                price_list_entity_1.PriceList,
                vendor_entity_1.Vendor,
                uom_catalog_entity_1.UoMCatalog,
                inventory_batch_entity_1.InventoryBatch,
            ]),
            purchase_orders_module_1.PurchaseOrdersModule,
            rbac_module_1.RBACModule,
        ],
        controllers: [madereria_inventory_import_controller_1.MadereriaInventoryImportController],
        providers: [madereria_inventory_import_service_1.MadereriaInventoryImportService],
    })
], MadereriaInventoryImportModule);
//# sourceMappingURL=madereria-inventory-import.module.js.map