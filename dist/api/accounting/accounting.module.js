"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const sales_order_entity_1 = require("../../entities/sales-orders/sales-order.entity");
const pos_sale_collection_entity_1 = require("../../entities/pos/pos-sale-collection.entity");
const pos_daily_shift_entity_1 = require("../../entities/pos/pos-daily-shift.entity");
const electronic_invoice_entity_1 = require("../../entities/electronic-invoicing/electronic-invoice.entity");
const purchase_order_batch_entity_1 = require("../../entities/purchase-orders/purchase-order-batch.entity");
const user_entity_1 = require("../../entities/users/user.entity");
const rbac_module_1 = require("../rbac/rbac.module");
const accounting_controller_1 = require("./accounting.controller");
const accounting_service_1 = require("./accounting.service");
let AccountingModule = class AccountingModule {
};
exports.AccountingModule = AccountingModule;
exports.AccountingModule = AccountingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                sales_order_entity_1.SalesOrder,
                pos_sale_collection_entity_1.PosSaleCollection,
                pos_daily_shift_entity_1.PosDailyShift,
                electronic_invoice_entity_1.ElectronicInvoice,
                purchase_order_batch_entity_1.PurchaseOrderBatch,
                user_entity_1.User,
            ]),
            rbac_module_1.RBACModule,
        ],
        controllers: [accounting_controller_1.AccountingController],
        providers: [accounting_service_1.AccountingService],
        exports: [accounting_service_1.AccountingService],
    })
], AccountingModule);
//# sourceMappingURL=accounting.module.js.map