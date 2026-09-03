"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownpaymentPaymentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const contract_entity_1 = require("../../../entities/contracts/contract.entity");
const contract_downpayment_payment_entity_1 = require("../../../entities/contracts/contract-downpayment-payment.entity");
const rbac_module_1 = require("../../rbac/rbac.module");
const downpayment_payments_controller_1 = require("./downpayment-payments.controller");
const downpayment_payments_service_1 = require("./downpayment-payments.service");
let DownpaymentPaymentsModule = class DownpaymentPaymentsModule {
};
exports.DownpaymentPaymentsModule = DownpaymentPaymentsModule;
exports.DownpaymentPaymentsModule = DownpaymentPaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([contract_downpayment_payment_entity_1.ContractDownpaymentPayment, contract_entity_1.Contract]),
            rbac_module_1.RBACModule,
        ],
        providers: [downpayment_payments_service_1.DownpaymentPaymentsService],
        controllers: [downpayment_payments_controller_1.DownpaymentPaymentsController],
        exports: [downpayment_payments_service_1.DownpaymentPaymentsService],
    })
], DownpaymentPaymentsModule);
//# sourceMappingURL=downpayment-payments.module.js.map