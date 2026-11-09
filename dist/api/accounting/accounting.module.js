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
const sales_order_payment_entity_1 = require("../../entities/sales-orders/sales-order-payment.entity");
const pos_sale_collection_entity_1 = require("../../entities/pos/pos-sale-collection.entity");
const pos_daily_shift_entity_1 = require("../../entities/pos/pos-daily-shift.entity");
const pos_partial_shift_entity_1 = require("../../entities/pos/pos-partial-shift.entity");
const electronic_invoice_entity_1 = require("../../entities/electronic-invoicing/electronic-invoice.entity");
const purchase_order_batch_entity_1 = require("../../entities/purchase-orders/purchase-order-batch.entity");
const vendor_entity_1 = require("../../entities/vendor/vendor.entity");
const vendor_module_1 = require("../vendor/vendor.module");
const user_entity_1 = require("../../entities/users/user.entity");
const fiscal_configuration_entity_1 = require("../../entities/billing/fiscal-configuration.entity");
const billing_branch_entity_1 = require("../../entities/billing/billing-branch.entity");
const global_invoice_entity_1 = require("../../entities/accounting/global-invoice.entity");
const global_invoice_auto_run_entity_1 = require("../../entities/accounting/global-invoice-auto-run.entity");
const global_invoice_order_entity_1 = require("../../entities/accounting/global-invoice-order.entity");
const rbac_module_1 = require("../rbac/rbac.module");
const electronic_invoicing_module_1 = require("../electronic-invoicing/electronic-invoicing.module");
const pos_shifts_module_1 = require("../pos-shifts/pos-shifts.module");
const exchange_rate_module_1 = require("../exchange-rate/exchange-rate.module");
const accounting_controller_1 = require("./accounting.controller");
const accounting_service_1 = require("./accounting.service");
const average_cost_report_service_1 = require("./services/average-cost-report.service");
const global_invoice_auto_service_1 = require("./services/global-invoice-auto.service");
const global_invoice_service_1 = require("./services/global-invoice.service");
const customer_debt_ledger_module_1 = require("./customer-debt-ledger.module");
let AccountingModule = class AccountingModule {
};
exports.AccountingModule = AccountingModule;
exports.AccountingModule = AccountingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                sales_order_entity_1.SalesOrder,
                sales_order_payment_entity_1.SalesOrderPayment,
                pos_sale_collection_entity_1.PosSaleCollection,
                pos_daily_shift_entity_1.PosDailyShift,
                pos_partial_shift_entity_1.PosPartialShift,
                electronic_invoice_entity_1.ElectronicInvoice,
                purchase_order_batch_entity_1.PurchaseOrderBatch,
                vendor_entity_1.Vendor,
                user_entity_1.User,
                fiscal_configuration_entity_1.FiscalConfiguration,
                billing_branch_entity_1.BillingBranch,
                global_invoice_entity_1.GlobalInvoice,
                global_invoice_auto_run_entity_1.GlobalInvoiceAutoRun,
                global_invoice_order_entity_1.GlobalInvoiceOrder,
            ]),
            rbac_module_1.RBACModule,
            electronic_invoicing_module_1.ElectronicInvoicingModule,
            vendor_module_1.VendorModule,
            pos_shifts_module_1.PosShiftsModule,
            exchange_rate_module_1.ExchangeRateModule,
            customer_debt_ledger_module_1.CustomerDebtLedgerModule,
        ],
        controllers: [accounting_controller_1.AccountingController],
        providers: [
            accounting_service_1.AccountingService,
            average_cost_report_service_1.AverageCostReportService,
            global_invoice_service_1.GlobalInvoiceService,
            global_invoice_auto_service_1.GlobalInvoiceAutoService,
        ],
        exports: [accounting_service_1.AccountingService],
    })
], AccountingModule);
//# sourceMappingURL=accounting.module.js.map