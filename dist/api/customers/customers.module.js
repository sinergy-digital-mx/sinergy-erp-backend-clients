"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const customers_controller_1 = require("./customers.controller");
const customers_service_1 = require("./customers.service");
const customers_export_service_1 = require("./services/customers-export.service");
const customer_groups_controller_1 = require("./customer-groups.controller");
const customer_groups_service_1 = require("./customer-groups.service");
const customer_activities_controller_1 = require("./customer-activities.controller");
const customer_activities_service_1 = require("./customer-activities.service");
const customer_documents_controller_1 = require("./customer-documents.controller");
const customer_documents_service_1 = require("./customer-documents.service");
const customer_status_entity_1 = require("../../entities/customers/customer-status.entity");
const customer_entity_1 = require("../../entities/customers/customer.entity");
const customer_credit_entity_1 = require("../../entities/customers/customer-credit.entity");
const customer_assignment_change_entity_1 = require("../../entities/customers/customer-assignment-change.entity");
const customer_group_entity_1 = require("../../entities/customers/customer-group.entity");
const customer_activity_entity_1 = require("../../entities/customers/customer-activity.entity");
const customer_document_entity_1 = require("../../entities/customers/customer-document.entity");
const document_type_entity_1 = require("../../entities/customers/document-type.entity");
const warehouse_entity_1 = require("../../entities/warehouse/warehouse.entity");
const billing_branch_entity_1 = require("../../entities/billing/billing-branch.entity");
const fiscal_configuration_entity_1 = require("../../entities/billing/fiscal-configuration.entity");
const user_entity_1 = require("../../entities/users/user.entity");
const customer_address_entity_1 = require("../../entities/customers/customer-address.entity");
const sales_order_entity_1 = require("../../entities/sales-orders/sales-order.entity");
const sales_order_detail_entity_1 = require("../../entities/sales-orders/sales-order-detail.entity");
const sales_order_payment_entity_1 = require("../../entities/sales-orders/sales-order-payment.entity");
const product_entity_1 = require("../../entities/products/product.entity");
const s3_service_1 = require("../../common/services/s3.service");
const rbac_module_1 = require("../rbac/rbac.module");
const customer_product_insights_service_1 = require("./services/customer-product-insights.service");
const customer_credit_service_1 = require("./services/customer-credit.service");
const customer_assignment_service_1 = require("./services/customer-assignment.service");
let CustomersModule = class CustomersModule {
};
exports.CustomersModule = CustomersModule;
exports.CustomersModule = CustomersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                customer_entity_1.Customer,
                customer_credit_entity_1.CustomerCredit,
                customer_assignment_change_entity_1.CustomerAssignmentChange,
                customer_status_entity_1.CustomerStatus,
                customer_group_entity_1.CustomerGroup,
                customer_activity_entity_1.CustomerActivity,
                customer_document_entity_1.CustomerDocument,
                document_type_entity_1.DocumentType,
                warehouse_entity_1.Warehouse,
                billing_branch_entity_1.BillingBranch,
                fiscal_configuration_entity_1.FiscalConfiguration,
                user_entity_1.User,
                customer_address_entity_1.CustomerAddress,
                sales_order_entity_1.SalesOrder,
                sales_order_detail_entity_1.SalesOrderDetail,
                sales_order_payment_entity_1.SalesOrderPayment,
                product_entity_1.Product,
            ]),
            rbac_module_1.RBACModule,
        ],
        providers: [
            customers_service_1.CustomersService,
            customers_export_service_1.CustomersExportService,
            customer_groups_service_1.CustomerGroupsService,
            customer_activities_service_1.CustomerActivitiesService,
            customer_documents_service_1.CustomerDocumentsService,
            customer_product_insights_service_1.CustomerProductInsightsService,
            customer_credit_service_1.CustomerCreditService,
            customer_assignment_service_1.CustomerAssignmentService,
            s3_service_1.S3Service,
        ],
        controllers: [
            customers_controller_1.CustomersController,
            customer_groups_controller_1.CustomerGroupsController,
            customer_activities_controller_1.CustomerActivitiesController,
            customer_documents_controller_1.CustomerDocumentsController,
            customer_documents_controller_1.DocumentTypesController,
        ],
        exports: [customers_service_1.CustomersService, customer_credit_service_1.CustomerCreditService, customer_groups_service_1.CustomerGroupsService, customer_assignment_service_1.CustomerAssignmentService],
    })
], CustomersModule);
//# sourceMappingURL=customers.module.js.map