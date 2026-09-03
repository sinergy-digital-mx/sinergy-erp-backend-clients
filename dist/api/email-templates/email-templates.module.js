"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailTemplatesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const email_template_entity_1 = require("../../entities/email-templates/email-template.entity");
const tenant_module_entity_1 = require("../../entities/rbac/tenant-module.entity");
const tenant_entity_1 = require("../../entities/rbac/tenant.entity");
const payment_entity_1 = require("../../entities/contracts/payment.entity");
const contract_entity_1 = require("../../entities/contracts/contract.entity");
const customer_entity_1 = require("../../entities/customers/customer.entity");
const lead_entity_1 = require("../../entities/leads/lead.entity");
const rbac_module_1 = require("../rbac/rbac.module");
const mailer_configuration_module_1 = require("../mailer-configuration/mailer-configuration.module");
const email_templates_controller_1 = require("./email-templates.controller");
const email_templates_service_1 = require("./email-templates.service");
let EmailTemplatesModule = class EmailTemplatesModule {
};
exports.EmailTemplatesModule = EmailTemplatesModule;
exports.EmailTemplatesModule = EmailTemplatesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                email_template_entity_1.EmailTemplate,
                tenant_module_entity_1.TenantModule,
                tenant_entity_1.RBACTenant,
                payment_entity_1.Payment,
                contract_entity_1.Contract,
                customer_entity_1.Customer,
                lead_entity_1.Lead,
            ]),
            rbac_module_1.RBACModule,
            mailer_configuration_module_1.MailerConfigurationModule,
        ],
        controllers: [email_templates_controller_1.EmailTemplatesController],
        providers: [email_templates_service_1.EmailTemplatesService],
        exports: [email_templates_service_1.EmailTemplatesService],
    })
], EmailTemplatesModule);
//# sourceMappingURL=email-templates.module.js.map