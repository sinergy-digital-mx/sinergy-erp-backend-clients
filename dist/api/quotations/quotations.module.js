"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const quotations_1 = require("../../entities/quotations");
const auth_module_1 = require("../auth/auth.module");
const rbac_module_1 = require("../rbac/rbac.module");
const inventory_module_1 = require("../inventory/inventory.module");
const products_module_1 = require("../products/products.module");
const global_discounts_module_1 = require("../global-discounts/global-discounts.module");
const pos_shifts_module_1 = require("../pos-shifts/pos-shifts.module");
const sales_orders_module_1 = require("../sales-orders/sales-orders.module");
const mailer_configuration_module_1 = require("../mailer-configuration/mailer-configuration.module");
const s3_service_1 = require("../../common/services/s3.service");
const billing_branch_entity_1 = require("../../entities/billing/billing-branch.entity");
const warehouse_entity_1 = require("../../entities/warehouse/warehouse.entity");
const user_entity_1 = require("../../entities/users/user.entity");
const customer_entity_1 = require("../../entities/customers/customer.entity");
const quotation_controller_1 = require("./controllers/quotation.controller");
const quotation_service_1 = require("./services/quotation.service");
const quotation_folio_service_1 = require("./services/quotation-folio.service");
const quotation_pdf_service_1 = require("./services/quotation-pdf.service");
const quotation_documents_service_1 = require("./services/quotation-documents.service");
const quotation_email_service_1 = require("./services/quotation-email.service");
let QuotationsModule = class QuotationsModule {
};
exports.QuotationsModule = QuotationsModule;
exports.QuotationsModule = QuotationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                quotations_1.Quotation,
                quotations_1.QuotationDetail,
                quotations_1.QuotationDocument,
                quotations_1.QuotationDocumentType,
                quotations_1.QuotationEmail,
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
            (0, common_1.forwardRef)(() => pos_shifts_module_1.PosShiftsModule),
            (0, common_1.forwardRef)(() => sales_orders_module_1.SalesOrdersModule),
            mailer_configuration_module_1.MailerConfigurationModule,
        ],
        controllers: [quotation_controller_1.QuotationController],
        providers: [
            quotation_service_1.QuotationService,
            quotation_folio_service_1.QuotationFolioService,
            quotation_pdf_service_1.QuotationPdfService,
            quotation_documents_service_1.QuotationDocumentsService,
            quotation_email_service_1.QuotationEmailService,
            s3_service_1.S3Service,
        ],
        exports: [quotation_service_1.QuotationService],
    })
], QuotationsModule);
//# sourceMappingURL=quotations.module.js.map