"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesOrdersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const sales_orders_1 = require("../../entities/sales-orders");
const inventory_batch_entity_1 = require("../../entities/purchase-orders/inventory-batch.entity");
const auth_module_1 = require("../auth/auth.module");
const rbac_module_1 = require("../rbac/rbac.module");
const inventory_module_1 = require("../inventory/inventory.module");
const pos_shifts_module_1 = require("../pos-shifts/pos-shifts.module");
const products_module_1 = require("../products/products.module");
const global_discounts_module_1 = require("../global-discounts/global-discounts.module");
const s3_service_1 = require("../../common/services/s3.service");
const sales_order_controller_1 = require("./controllers/sales-order.controller");
const sales_order_service_1 = require("./services/sales-order.service");
const sales_order_folio_service_1 = require("./services/sales-order-folio.service");
const sales_order_fulfillment_service_1 = require("./services/sales-order-fulfillment.service");
const sales_order_pdf_service_1 = require("./services/sales-order-pdf.service");
const sales_order_documents_service_1 = require("./services/sales-order-documents.service");
const sales_order_pos_receipt_service_1 = require("./services/sales-order-pos-receipt.service");
const sales_order_export_service_1 = require("./services/sales-order-export.service");
const sales_order_products_picker_service_1 = require("./services/sales-order-products-picker.service");
const pos_sale_collection_entity_1 = require("../../entities/pos/pos-sale-collection.entity");
const billing_branch_entity_1 = require("../../entities/billing/billing-branch.entity");
const warehouse_entity_1 = require("../../entities/warehouse/warehouse.entity");
const user_entity_1 = require("../../entities/users/user.entity");
const customer_entity_1 = require("../../entities/customers/customer.entity");
const electronic_invoicing_module_1 = require("../electronic-invoicing/electronic-invoicing.module");
const sales_order_invoicing_service_1 = require("./services/sales-order-invoicing.service");
const shippings_module_1 = require("../shippings/shippings.module");
const warehouse_control_module_1 = require("../warehouse-control/warehouse-control.module");
let SalesOrdersModule = class SalesOrdersModule {
};
exports.SalesOrdersModule = SalesOrdersModule;
exports.SalesOrdersModule = SalesOrdersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                sales_orders_1.SalesOrder,
                sales_orders_1.SalesOrderDetail,
                sales_orders_1.SalesOrderBatchAllocation,
                sales_orders_1.SalesOrderDocument,
                sales_orders_1.SalesOrderDocumentType,
                sales_orders_1.SalesOrderPayment,
                sales_orders_1.SalesOrderPaymentDocument,
                inventory_batch_entity_1.InventoryBatch,
                pos_sale_collection_entity_1.PosSaleCollection,
                billing_branch_entity_1.BillingBranch,
                warehouse_entity_1.Warehouse,
                user_entity_1.User,
                customer_entity_1.Customer,
            ]),
            auth_module_1.AuthModule,
            rbac_module_1.RBACModule,
            inventory_module_1.InventoryModule,
            products_module_1.ProductsModule,
            global_discounts_module_1.GlobalDiscountsModule,
            electronic_invoicing_module_1.ElectronicInvoicingModule,
            (0, common_1.forwardRef)(() => pos_shifts_module_1.PosShiftsModule),
            shippings_module_1.ShippingsModule,
            warehouse_control_module_1.WarehouseControlModule,
        ],
        controllers: [sales_order_controller_1.SalesOrderController],
        providers: [
            sales_order_service_1.SalesOrderService,
            sales_order_folio_service_1.SalesOrderFolioService,
            sales_order_fulfillment_service_1.SalesOrderFulfillmentService,
            sales_order_pdf_service_1.SalesOrderPdfService,
            sales_order_documents_service_1.SalesOrderDocumentsService,
            sales_order_pos_receipt_service_1.SalesOrderPosReceiptService,
            sales_order_export_service_1.SalesOrderExportService,
            sales_order_invoicing_service_1.SalesOrderInvoicingService,
            sales_order_products_picker_service_1.SalesOrderProductsPickerService,
            s3_service_1.S3Service,
        ],
        exports: [
            sales_order_service_1.SalesOrderService,
            sales_order_pos_receipt_service_1.SalesOrderPosReceiptService,
            sales_order_fulfillment_service_1.SalesOrderFulfillmentService,
            sales_order_pdf_service_1.SalesOrderPdfService,
            sales_order_products_picker_service_1.SalesOrderProductsPickerService,
        ],
    })
], SalesOrdersModule);
//# sourceMappingURL=sales-orders.module.js.map