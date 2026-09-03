"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelfInvoiceModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const sales_order_entity_1 = require("../../entities/sales-orders/sales-order.entity");
const customer_entity_1 = require("../../entities/customers/customer.entity");
const customer_status_entity_1 = require("../../entities/customers/customer-status.entity");
const electronic_invoicing_module_1 = require("../electronic-invoicing/electronic-invoicing.module");
const self_invoice_controller_1 = require("./self-invoice.controller");
const self_invoice_service_1 = require("./self-invoice.service");
let SelfInvoiceModule = class SelfInvoiceModule {
};
exports.SelfInvoiceModule = SelfInvoiceModule;
exports.SelfInvoiceModule = SelfInvoiceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([sales_order_entity_1.SalesOrder, customer_entity_1.Customer, customer_status_entity_1.CustomerStatus]),
            electronic_invoicing_module_1.ElectronicInvoicingModule,
        ],
        controllers: [self_invoice_controller_1.SelfInvoiceController],
        providers: [self_invoice_service_1.SelfInvoiceService],
        exports: [self_invoice_service_1.SelfInvoiceService],
    })
], SelfInvoiceModule);
//# sourceMappingURL=self-invoice.module.js.map