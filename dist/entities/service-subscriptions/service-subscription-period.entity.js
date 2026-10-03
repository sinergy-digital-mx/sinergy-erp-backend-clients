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
exports.ServiceSubscriptionPeriod = void 0;
const typeorm_1 = require("typeorm");
const service_subscription_entity_1 = require("./service-subscription.entity");
const service_subscription_period_status_enum_1 = require("./service-subscription-period-status.enum");
const sales_order_entity_1 = require("../sales-orders/sales-order.entity");
let ServiceSubscriptionPeriod = class ServiceSubscriptionPeriod {
    id;
    tenant_id;
    subscription;
    subscription_id;
    period_month;
    amount;
    status;
    sales_order;
    sales_order_id;
    electronic_invoice_id;
    linked_manually;
    invoice_error;
    generated_at;
    created_at;
    updated_at;
};
exports.ServiceSubscriptionPeriod = ServiceSubscriptionPeriod;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ServiceSubscriptionPeriod.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServiceSubscriptionPeriod.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => service_subscription_entity_1.ServiceSubscription, (subscription) => subscription.periods, {
        onDelete: 'CASCADE',
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'subscription_id' }),
    __metadata("design:type", service_subscription_entity_1.ServiceSubscription)
], ServiceSubscriptionPeriod.prototype, "subscription", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServiceSubscriptionPeriod.prototype, "subscription_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], ServiceSubscriptionPeriod.prototype, "period_month", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], ServiceSubscriptionPeriod.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: service_subscription_period_status_enum_1.ServiceSubscriptionPeriodStatus.Pending }),
    __metadata("design:type", String)
], ServiceSubscriptionPeriod.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sales_order_entity_1.SalesOrder, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'sales_order_id' }),
    __metadata("design:type", Object)
], ServiceSubscriptionPeriod.prototype, "sales_order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], ServiceSubscriptionPeriod.prototype, "sales_order_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], ServiceSubscriptionPeriod.prototype, "electronic_invoice_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ServiceSubscriptionPeriod.prototype, "linked_manually", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ServiceSubscriptionPeriod.prototype, "invoice_error", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], ServiceSubscriptionPeriod.prototype, "generated_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ServiceSubscriptionPeriod.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ServiceSubscriptionPeriod.prototype, "updated_at", void 0);
exports.ServiceSubscriptionPeriod = ServiceSubscriptionPeriod = __decorate([
    (0, typeorm_1.Entity)('service_subscription_periods'),
    (0, typeorm_1.Index)('idx_svc_period_subscription', ['subscription_id']),
    (0, typeorm_1.Index)('uq_svc_period_month', ['subscription_id', 'period_month'], { unique: true }),
    (0, typeorm_1.Index)('uq_svc_period_order', ['sales_order_id'], { unique: true })
], ServiceSubscriptionPeriod);
//# sourceMappingURL=service-subscription-period.entity.js.map