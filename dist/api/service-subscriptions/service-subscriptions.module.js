"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceSubscriptionsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const service_subscription_entity_1 = require("../../entities/service-subscriptions/service-subscription.entity");
const service_subscription_period_entity_1 = require("../../entities/service-subscriptions/service-subscription-period.entity");
const customer_entity_1 = require("../../entities/customers/customer.entity");
const product_entity_1 = require("../../entities/products/product.entity");
const product_uom_entity_1 = require("../../entities/products/product-uom.entity");
const billing_branch_entity_1 = require("../../entities/billing/billing-branch.entity");
const sales_order_entity_1 = require("../../entities/sales-orders/sales-order.entity");
const sales_orders_module_1 = require("../sales-orders/sales-orders.module");
const electronic_invoicing_module_1 = require("../electronic-invoicing/electronic-invoicing.module");
const rbac_module_1 = require("../rbac/rbac.module");
const service_subscriptions_controller_1 = require("./service-subscriptions.controller");
const service_subscriptions_service_1 = require("./service-subscriptions.service");
const service_subscription_billing_service_1 = require("./service-subscription-billing.service");
const service_subscription_scheduler_service_1 = require("./service-subscription-scheduler.service");
let ServiceSubscriptionsModule = class ServiceSubscriptionsModule {
};
exports.ServiceSubscriptionsModule = ServiceSubscriptionsModule;
exports.ServiceSubscriptionsModule = ServiceSubscriptionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                service_subscription_entity_1.ServiceSubscription,
                service_subscription_period_entity_1.ServiceSubscriptionPeriod,
                customer_entity_1.Customer,
                product_entity_1.Product,
                product_uom_entity_1.ProductUoM,
                billing_branch_entity_1.BillingBranch,
                sales_order_entity_1.SalesOrder,
            ]),
            sales_orders_module_1.SalesOrdersModule,
            electronic_invoicing_module_1.ElectronicInvoicingModule,
            rbac_module_1.RBACModule,
        ],
        controllers: [service_subscriptions_controller_1.ServiceSubscriptionsController],
        providers: [
            service_subscriptions_service_1.ServiceSubscriptionsService,
            service_subscription_billing_service_1.ServiceSubscriptionBillingService,
            service_subscription_scheduler_service_1.ServiceSubscriptionScheduler,
        ],
    })
], ServiceSubscriptionsModule);
//# sourceMappingURL=service-subscriptions.module.js.map