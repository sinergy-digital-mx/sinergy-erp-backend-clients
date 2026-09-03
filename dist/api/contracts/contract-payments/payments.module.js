"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const payment_entity_1 = require("../../../entities/contracts/payment.entity");
const contract_entity_1 = require("../../../entities/contracts/contract.entity");
const contract_downpayment_payment_entity_1 = require("../../../entities/contracts/contract-downpayment-payment.entity");
const payments_service_1 = require("./payments.service");
const payments_controller_1 = require("./payments.controller");
const rbac_module_1 = require("../../rbac/rbac.module");
let PaymentsModule = class PaymentsModule {
};
exports.PaymentsModule = PaymentsModule;
exports.PaymentsModule = PaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([payment_entity_1.Payment, contract_entity_1.Contract, contract_downpayment_payment_entity_1.ContractDownpaymentPayment]),
            rbac_module_1.RBACModule,
        ],
        providers: [payments_service_1.PaymentsService],
        controllers: [payments_controller_1.PaymentsController],
        exports: [payments_service_1.PaymentsService, typeorm_1.TypeOrmModule],
    })
], PaymentsModule);
//# sourceMappingURL=payments.module.js.map