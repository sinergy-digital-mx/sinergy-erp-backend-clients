"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const inventory_batch_entity_1 = require("../../entities/purchase-orders/inventory-batch.entity");
const product_entity_1 = require("../../entities/products/product.entity");
const inventory_transfer_entity_1 = require("../../entities/inventory/inventory-transfer.entity");
const inventory_transfer_line_entity_1 = require("../../entities/inventory/inventory-transfer-line.entity");
const inventory_audit_entity_1 = require("../../entities/inventory/inventory-audit.entity");
const inventory_audit_line_entity_1 = require("../../entities/inventory/inventory-audit-line.entity");
const sales_order_batch_allocation_entity_1 = require("../../entities/sales-orders/sales-order-batch-allocation.entity");
const product_price_entity_1 = require("../../entities/products/product-price.entity");
const product_discount_entity_1 = require("../../entities/products/product-discount.entity");
const product_uom_entity_1 = require("../../entities/products/product-uom.entity");
const product_vendor_cost_entity_1 = require("../../entities/products/product-vendor-cost.entity");
const user_entity_1 = require("../../entities/users/user.entity");
const warehouse_entity_1 = require("../../entities/warehouse/warehouse.entity");
const fiscal_configuration_entity_1 = require("../../entities/billing/fiscal-configuration.entity");
const billing_branch_entity_1 = require("../../entities/billing/billing-branch.entity");
const uom_catalog_entity_1 = require("../../entities/uom-catalog/uom-catalog.entity");
const s3_service_1 = require("../../common/services/s3.service");
const inventory_service_1 = require("./inventory.service");
const inventory_controller_1 = require("./inventory.controller");
const inventory_transfer_controller_1 = require("./inventory-transfer.controller");
const inventory_audit_controller_1 = require("./inventory-audit.controller");
const inventory_transfer_service_1 = require("./services/inventory-transfer.service");
const inventory_transfer_folio_service_1 = require("./services/inventory-transfer-folio.service");
const inventory_transfer_pdf_service_1 = require("./services/inventory-transfer-pdf.service");
const inventory_export_service_1 = require("./services/inventory-export.service");
const inventory_audit_folio_service_1 = require("./services/inventory-audit-folio.service");
const inventory_audit_service_1 = require("./services/inventory-audit.service");
const inventory_batch_movements_service_1 = require("./services/inventory-batch-movements.service");
const rbac_module_1 = require("../rbac/rbac.module");
const purchase_orders_module_1 = require("../purchase-orders/purchase-orders.module");
let InventoryModule = class InventoryModule {
};
exports.InventoryModule = InventoryModule;
exports.InventoryModule = InventoryModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                inventory_batch_entity_1.InventoryBatch,
                product_entity_1.Product,
                inventory_transfer_entity_1.InventoryTransfer,
                inventory_transfer_line_entity_1.InventoryTransferLine,
                inventory_audit_entity_1.InventoryAudit,
                inventory_audit_line_entity_1.InventoryAuditLine,
                sales_order_batch_allocation_entity_1.SalesOrderBatchAllocation,
                product_price_entity_1.ProductPrice,
                product_discount_entity_1.ProductDiscount,
                product_uom_entity_1.ProductUoM,
                product_vendor_cost_entity_1.ProductVendorCost,
                user_entity_1.User,
                warehouse_entity_1.Warehouse,
                fiscal_configuration_entity_1.FiscalConfiguration,
                billing_branch_entity_1.BillingBranch,
                uom_catalog_entity_1.UoMCatalog,
            ]),
            rbac_module_1.RBACModule,
            purchase_orders_module_1.PurchaseOrdersModule,
        ],
        providers: [
            inventory_service_1.InventoryService,
            inventory_transfer_service_1.InventoryTransferService,
            inventory_transfer_folio_service_1.InventoryTransferFolioService,
            inventory_transfer_pdf_service_1.InventoryTransferPdfService,
            inventory_export_service_1.InventoryExportService,
            inventory_audit_folio_service_1.InventoryAuditFolioService,
            inventory_audit_service_1.InventoryAuditService,
            inventory_batch_movements_service_1.InventoryBatchMovementsService,
            s3_service_1.S3Service,
        ],
        controllers: [inventory_controller_1.InventoryController, inventory_transfer_controller_1.InventoryTransferController, inventory_audit_controller_1.InventoryAuditController],
        exports: [inventory_service_1.InventoryService, inventory_transfer_service_1.InventoryTransferService, inventory_audit_service_1.InventoryAuditService],
    })
], InventoryModule);
//# sourceMappingURL=inventory.module.js.map