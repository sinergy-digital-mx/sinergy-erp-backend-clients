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
const email_template_entity_1 = require("../../../entities/email-templates/email-template.entity");
const fiscal_configuration_entity_1 = require("../../../entities/billing/fiscal-configuration.entity");
const tenant_entity_1 = require("../../../entities/rbac/tenant.entity");
const payments_service_1 = require("./payments.service");
const payment_receipt_service_1 = require("./payment-receipt.service");
const payments_controller_1 = require("./payments.controller");
const rbac_module_1 = require("../../rbac/rbac.module");
const mailer_configuration_module_1 = require("../../mailer-configuration/mailer-configuration.module");
let PaymentsModule = class PaymentsModule {
};
exports.PaymentsModule = PaymentsModule;
exports.PaymentsModule = PaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                payment_entity_1.Payment,
                contract_entity_1.Contract,
                contract_downpayment_payment_entity_1.ContractDownpaymentPayment,
                email_template_entity_1.EmailTemplate,
                fiscal_configuration_entity_1.FiscalConfiguration,
                tenant_entity_1.RBACTenant,
            ]),
            rbac_module_1.RBACModule,
            mailer_configuration_module_1.MailerConfigurationModule,
        ],
        providers: [payments_service_1.PaymentsService, payment_receipt_service_1.PaymentReceiptService],
        controllers: [payments_controller_1.PaymentsController],
        exports: [payments_service_1.PaymentsService, typeorm_1.TypeOrmModule],
    })
], PaymentsModule);
//# sourceMappingURL=payments.module.js.map