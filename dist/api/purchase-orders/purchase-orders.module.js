"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseOrdersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const purchase_orders_1 = require("../../entities/purchase-orders");
const inventory_transfer_line_entity_1 = require("../../entities/inventory/inventory-transfer-line.entity");
const inventory_transfer_entity_1 = require("../../entities/inventory/inventory-transfer.entity");
const inventory_audit_line_entity_1 = require("../../entities/inventory/inventory-audit-line.entity");
const inventory_audit_entity_1 = require("../../entities/inventory/inventory-audit.entity");
const sales_order_batch_allocation_entity_1 = require("../../entities/sales-orders/sales-order-batch-allocation.entity");
const sales_order_detail_entity_1 = require("../../entities/sales-orders/sales-order-detail.entity");
const sales_order_entity_1 = require("../../entities/sales-orders/sales-order.entity");
const user_entity_1 = require("../../entities/users/user.entity");
const warehouse_entity_1 = require("../../entities/warehouse/warehouse.entity");
const billing_branch_entity_1 = require("../../entities/billing/billing-branch.entity");
const fiscal_configuration_entity_1 = require("../../entities/billing/fiscal-configuration.entity");
const products_1 = require("../../entities/products");
const uom_catalog_entity_1 = require("../../entities/uom-catalog/uom-catalog.entity");
const vendor_entity_1 = require("../../entities/vendor/vendor.entity");
const rbac_1 = require("../../entities/rbac");
const auth_module_1 = require("../auth/auth.module");
const s3_service_1 = require("../../common/services/s3.service");
const controllers_1 = require("./controllers");
const services_1 = require("./services");
let PurchaseOrdersModule = class PurchaseOrdersModule {
};
exports.PurchaseOrdersModule = PurchaseOrdersModule;
exports.PurchaseOrdersModule = PurchaseOrdersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                purchase_orders_1.PurchaseOrderBatch,
                purchase_orders_1.PurchaseOrderBatchDetail,
                purchase_orders_1.InventoryBatch,
                purchase_orders_1.PurchaseOrderDocument,
                purchase_orders_1.PurchaseOrderDocumentType,
                purchase_orders_1.PurchaseOrderPayment,
                purchase_orders_1.PurchaseOrderLandedCostLine,
                purchase_orders_1.PurchaseOrderActivity,
                inventory_transfer_line_entity_1.InventoryTransferLine,
                inventory_transfer_entity_1.InventoryTransfer,
                inventory_audit_line_entity_1.InventoryAuditLine,
                inventory_audit_entity_1.InventoryAudit,
                sales_order_batch_allocation_entity_1.SalesOrderBatchAllocation,
                sales_order_detail_entity_1.SalesOrderDetail,
                sales_order_entity_1.SalesOrder,
                user_entity_1.User,
                warehouse_entity_1.Warehouse,
                billing_branch_entity_1.BillingBranch,
                fiscal_configuration_entity_1.FiscalConfiguration,
                products_1.Product,
                products_1.ProductUoM,
                products_1.ProductVendorCost,
                uom_catalog_entity_1.UoMCatalog,
                vendor_entity_1.Vendor,
                rbac_1.TenantModule,
                rbac_1.Module,
            ]),
            auth_module_1.AuthModule,
        ],
        controllers: [controllers_1.PurchaseOrderController, controllers_1.VendorProductsController, controllers_1.PurchaseOrderDocumentsController, controllers_1.ReceiptController, controllers_1.InventoryBatchController],
        providers: [
            services_1.PurchaseOrderService,
            services_1.VendorProductsService,
            services_1.BatchNumberGeneratorService,
            services_1.UnitConversionService,
            services_1.FolioGeneratorService,
            services_1.PurchaseOrderDocumentsService,
            services_1.PurchaseOrderPdfService,
            services_1.ReceiptService,
            services_1.ReceiptValidatorService,
            services_1.LineItemUpdaterService,
            services_1.BatchCreatorService,
            services_1.TotalCalculatorService,
            services_1.POStatusUpdaterService,
            services_1.TenantValidatorService,
            services_1.InventoryBatchService,
            services_1.PurchaseOrderExportService,
            services_1.PurchaseOrderLotsService,
            services_1.PurchaseOrderActivityService,
            services_1.PurchaseOrderMovementsService,
            services_1.PurchaseOrderRealCostService,
            s3_service_1.S3Service,
        ],
        exports: [
            services_1.PurchaseOrderService,
            services_1.VendorProductsService,
            services_1.BatchNumberGeneratorService,
            services_1.UnitConversionService,
            services_1.FolioGeneratorService,
            services_1.PurchaseOrderDocumentsService,
            services_1.PurchaseOrderPdfService,
            services_1.ReceiptService,
            services_1.ReceiptValidatorService,
            services_1.LineItemUpdaterService,
            services_1.BatchCreatorService,
            services_1.TotalCalculatorService,
            services_1.POStatusUpdaterService,
            services_1.TenantValidatorService,
            services_1.InventoryBatchService,
            services_1.PurchaseOrderLotsService,
            services_1.PurchaseOrderActivityService,
            services_1.PurchaseOrderMovementsService,
            services_1.PurchaseOrderRealCostService,
        ],
    })
], PurchaseOrdersModule);
//# sourceMappingURL=purchase-orders.module.js.map