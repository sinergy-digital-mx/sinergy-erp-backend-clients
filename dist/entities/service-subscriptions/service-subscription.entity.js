"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceSubscription = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const customer_entity_1 = require("../customers/customer.entity");
const fiscal_configuration_entity_1 = require("../billing/fiscal-configuration.entity");
const billing_branch_entity_1 = require("../billing/billing-branch.entity");
const product_entity_1 = require("../products/product.entity");
const product_uom_entity_1 = require("../products/product-uom.entity");
const service_subscription_status_enum_1 = require("./service-subscription-status.enum");
const service_subscription_period_entity_1 = require("./service-subscription-period.entity");
let ServiceSubscription = class ServiceSubscription {
    id;
    tenant;
    tenant_id;
    customer;
    customer_id;
    title;
    monthly_amount;
    iva_percentage;
    fiscal_configuration;
    fiscal_configuration_id;
    billing_branch;
    billing_branch_id;
    product;
    product_id;
    product_uom;
    product_uom_id;
    start_month;
    end_month;
    billing_day;
    status;
    uso_cfdi;
    forma_pago;
    metodo_pago;
    regimen_fiscal_receptor;
    notes;
    renewed_from;
    renewed_from_id;
    created_by;
    periods;
    created_at;
    updated_at;
};
exports.ServiceSubscription = ServiceSubscription;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ServiceSubscription.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], ServiceSubscription.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServiceSubscription.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_entity_1.Customer, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_id' }),
    __metadata("design:type", customer_entity_1.Customer)
], ServiceSubscription.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ServiceSubscription.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 160 }),
    __metadata("design:type", String)
], ServiceSubscription.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], ServiceSubscription.prototype, "monthly_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 16 }),
    __metadata("design:type", Number)
], ServiceSubscription.prototype, "iva_percentage", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => fiscal_configuration_entity_1.FiscalConfiguration, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'fiscal_configuration_id' }),
    __metadata("design:type", fiscal_configuration_entity_1.FiscalConfiguration)
], ServiceSubscription.prototype, "fiscal_configuration", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServiceSubscription.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => billing_branch_entity_1.BillingBranch, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'billing_branch_id' }),
    __metadata("design:type", billing_branch_entity_1.BillingBranch)
], ServiceSubscription.prototype, "billing_branch", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServiceSubscription.prototype, "billing_branch_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], ServiceSubscription.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServiceSubscription.prototype, "product_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_uom_entity_1.ProductUoM, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'product_uom_id' }),
    __metadata("design:type", product_uom_entity_1.ProductUoM)
], ServiceSubscription.prototype, "product_uom", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServiceSubscription.prototype, "product_uom_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], ServiceSubscription.prototype, "start_month", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], ServiceSubscription.prototype, "end_month", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: 1 }),
    __metadata("design:type", Number)
], ServiceSubscription.prototype, "billing_day", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: service_subscription_status_enum_1.ServiceSubscriptionStatus.Active }),
    __metadata("design:type", String)
], ServiceSubscription.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 3, default: 'G03' }),
    __metadata("design:type", String)
], ServiceSubscription.prototype, "uso_cfdi", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 2, default: '99' }),
    __metadata("design:type", String)
], ServiceSubscription.prototype, "forma_pago", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 3, default: 'PPD' }),
    __metadata("design:type", String)
], ServiceSubscription.prototype, "metodo_pago", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 3, default: '601' }),
    __metadata("design:type", String)
], ServiceSubscription.prototype, "regimen_fiscal_receptor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ServiceSubscription.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ServiceSubscription, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'renewed_from_id' }),
    __metadata("design:type", Object)
], ServiceSubscription.prototype, "renewed_from", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], ServiceSubscription.prototype, "renewed_from_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServiceSubscription.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => service_subscription_period_entity_1.ServiceSubscriptionPeriod, (period) => period.subscription),
    __metadata("design:type", Array)
], ServiceSubscription.prototype, "periods", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ServiceSubscription.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ServiceSubscription.prototype, "updated_at", void 0);
exports.ServiceSubscription = ServiceSubscription = __decorate([
    (0, typeorm_1.Entity)('service_subscriptions'),
    (0, typeorm_1.Index)('idx_svc_sub_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('idx_svc_sub_customer', ['customer_id']),
    (0, typeorm_1.Index)('idx_svc_sub_status', ['status'])
], ServiceSubscription);
//# sourceMappingURL=service-subscription.entity.js.map