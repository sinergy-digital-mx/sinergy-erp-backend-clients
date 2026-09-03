"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const fiscal_configuration_controller_1 = require("./fiscal-configuration.controller");
const fiscal_configuration_service_1 = require("./fiscal-configuration.service");
const billing_branch_controller_1 = require("./billing-branch.controller");
const billing_branch_service_1 = require("./billing-branch.service");
const fiscal_configuration_entity_1 = require("../../entities/billing/fiscal-configuration.entity");
const billing_branch_entity_1 = require("../../entities/billing/billing-branch.entity");
const warehouse_entity_1 = require("../../entities/warehouse/warehouse.entity");
const rbac_module_1 = require("../rbac/rbac.module");
const s3_service_1 = require("../../common/services/s3.service");
const electronic_invoicing_module_1 = require("../electronic-invoicing/electronic-invoicing.module");
let BillingModule = class BillingModule {
};
exports.BillingModule = BillingModule;
exports.BillingModule = BillingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([fiscal_configuration_entity_1.FiscalConfiguration, billing_branch_entity_1.BillingBranch, warehouse_entity_1.Warehouse]),
            rbac_module_1.RBACModule,
            (0, common_1.forwardRef)(() => electronic_invoicing_module_1.ElectronicInvoicingModule),
        ],
        providers: [fiscal_configuration_service_1.FiscalConfigurationService, billing_branch_service_1.BillingBranchService, s3_service_1.S3Service],
        controllers: [fiscal_configuration_controller_1.FiscalConfigurationController, billing_branch_controller_1.BillingBranchController, billing_branch_controller_1.BillingBranchAllController],
        exports: [fiscal_configuration_service_1.FiscalConfigurationService, billing_branch_service_1.BillingBranchService],
    })
], BillingModule);
//# sourceMappingURL=billing.module.js.map