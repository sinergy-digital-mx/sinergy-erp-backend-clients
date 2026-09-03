"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElectronicInvoicingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const electronic_invoicing_1 = require("../../entities/electronic-invoicing");
const fiscal_configuration_entity_1 = require("../../entities/billing/fiscal-configuration.entity");
const billing_branch_entity_1 = require("../../entities/billing/billing-branch.entity");
const customer_entity_1 = require("../../entities/customers/customer.entity");
const sales_order_entity_1 = require("../../entities/sales-orders/sales-order.entity");
const rbac_module_1 = require("../rbac/rbac.module");
const s3_service_1 = require("../../common/services/s3.service");
const finkok_provider_configuration_controller_1 = require("./finkok-provider-configuration.controller");
const electronic_invoice_controller_1 = require("./electronic-invoice.controller");
const finkok_provider_configuration_service_1 = require("./services/finkok-provider-configuration.service");
const finkok_encryption_service_1 = require("./services/finkok-encryption.service");
const finkok_soap_client_1 = require("./services/finkok-soap.client");
const electronic_invoice_service_1 = require("./services/electronic-invoice.service");
const electronic_invoice_pdf_service_1 = require("./services/electronic-invoice-pdf.service");
const electronic_invoice_sat_sync_service_1 = require("./services/electronic-invoice-sat-sync.service");
const fiscal_configuration_finkok_service_1 = require("./services/fiscal-configuration-finkok.service");
let ElectronicInvoicingModule = class ElectronicInvoicingModule {
};
exports.ElectronicInvoicingModule = ElectronicInvoicingModule;
exports.ElectronicInvoicingModule = ElectronicInvoicingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                electronic_invoicing_1.FinkokProviderConfiguration,
                electronic_invoicing_1.ElectronicInvoice,
                electronic_invoicing_1.ElectronicInvoiceSyncLog,
                fiscal_configuration_entity_1.FiscalConfiguration,
                billing_branch_entity_1.BillingBranch,
                customer_entity_1.Customer,
                sales_order_entity_1.SalesOrder,
            ]),
            rbac_module_1.RBACModule,
        ],
        controllers: [
            finkok_provider_configuration_controller_1.FinkokProviderConfigurationController,
            electronic_invoice_controller_1.ElectronicInvoiceController,
        ],
        providers: [
            finkok_encryption_service_1.FinkokEncryptionService,
            finkok_soap_client_1.FinkokSoapClient,
            finkok_provider_configuration_service_1.FinkokProviderConfigurationService,
            electronic_invoice_service_1.ElectronicInvoiceService,
            electronic_invoice_pdf_service_1.ElectronicInvoicePdfService,
            electronic_invoice_sat_sync_service_1.ElectronicInvoiceSatSyncService,
            fiscal_configuration_finkok_service_1.FiscalConfigurationFinkokService,
            s3_service_1.S3Service,
        ],
        exports: [
            electronic_invoice_service_1.ElectronicInvoiceService,
            electronic_invoice_pdf_service_1.ElectronicInvoicePdfService,
            finkok_provider_configuration_service_1.FinkokProviderConfigurationService,
            fiscal_configuration_finkok_service_1.FiscalConfigurationFinkokService,
            electronic_invoice_sat_sync_service_1.ElectronicInvoiceSatSyncService,
        ],
    })
], ElectronicInvoicingModule);
//# sourceMappingURL=electronic-invoicing.module.js.map