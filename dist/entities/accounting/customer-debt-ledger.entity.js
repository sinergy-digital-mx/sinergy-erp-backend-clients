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
exports.CustomerDebtLedger = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const customer_entity_1 = require("../customers/customer.entity");
const fiscal_configuration_entity_1 = require("../billing/fiscal-configuration.entity");
const billing_branch_entity_1 = require("../billing/billing-branch.entity");
const sales_order_entity_1 = require("../sales-orders/sales-order.entity");
const sales_order_payment_entity_1 = require("../sales-orders/sales-order-payment.entity");
const user_entity_1 = require("../users/user.entity");
const customer_debt_ledger_movement_type_enum_1 = require("./customer-debt-ledger-movement-type.enum");
let CustomerDebtLedger = class CustomerDebtLedger {
    id;
    tenant;
    tenant_id;
    source_key;
    customer;
    customer_id;
    fiscal_configuration;
    fiscal_configuration_id;
    fiscal_razon_social;
    billing_branch;
    billing_branch_id;
    billing_branch_name;
    sales_order;
    sales_order_id;
    sales_order_payment;
    sales_order_payment_id;
    movement_type;
    amount_delta;
    balance_after;
    order_balance_after;
    occurred_at;
    due_date;
    payment_method;
    reference_number;
    source;
    folio;
    customer_name;
    customer_rfc;
    created_by_user;
    created_by;
    created_at;
};
exports.CustomerDebtLedger = CustomerDebtLedger;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CustomerDebtLedger.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], CustomerDebtLedger.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomerDebtLedger.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 80 }),
    __metadata("design:type", String)
], CustomerDebtLedger.prototype, "source_key", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_entity_1.Customer, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_id' }),
    __metadata("design:type", customer_entity_1.Customer)
], CustomerDebtLedger.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], CustomerDebtLedger.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => fiscal_configuration_entity_1.FiscalConfiguration, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'fiscal_configuration_id' }),
    __metadata("design:type", fiscal_configuration_entity_1.FiscalConfiguration)
], CustomerDebtLedger.prototype, "fiscal_configuration", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomerDebtLedger.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], CustomerDebtLedger.prototype, "fiscal_razon_social", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => billing_branch_entity_1.BillingBranch, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'billing_branch_id' }),
    __metadata("design:type", Object)
], CustomerDebtLedger.prototype, "billing_branch", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], CustomerDebtLedger.prototype, "billing_branch_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], CustomerDebtLedger.prototype, "billing_branch_name", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sales_order_entity_1.SalesOrder, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'sales_order_id' }),
    __metadata("design:type", sales_order_entity_1.SalesOrder)
], CustomerDebtLedger.prototype, "sales_order", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomerDebtLedger.prototype, "sales_order_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sales_order_payment_entity_1.SalesOrderPayment, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'sales_order_payment_id' }),
    __metadata("design:type", Object)
], CustomerDebtLedger.prototype, "sales_order_payment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], CustomerDebtLedger.prototype, "sales_order_payment_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType,
    }),
    __metadata("design:type", String)
], CustomerDebtLedger.prototype, "movement_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2 }),
    __metadata("design:type", Number)
], CustomerDebtLedger.prototype, "amount_delta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2 }),
    __metadata("design:type", Number)
], CustomerDebtLedger.prototype, "balance_after", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2 }),
    __metadata("design:type", Number)
], CustomerDebtLedger.prototype, "order_balance_after", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], CustomerDebtLedger.prototype, "occurred_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], CustomerDebtLedger.prototype, "due_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40, nullable: true }),
    __metadata("design:type", Object)
], CustomerDebtLedger.prototype, "payment_method", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120, nullable: true }),
    __metadata("design:type", Object)
], CustomerDebtLedger.prototype, "reference_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], CustomerDebtLedger.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], CustomerDebtLedger.prototype, "folio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], CustomerDebtLedger.prototype, "customer_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], CustomerDebtLedger.prototype, "customer_rfc", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", Object)
], CustomerDebtLedger.prototype, "created_by_user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], CustomerDebtLedger.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], CustomerDebtLedger.prototype, "created_at", void 0);
exports.CustomerDebtLedger = CustomerDebtLedger = __decorate([
    (0, typeorm_1.Entity)('acc_customer_debt_ledger'),
    (0, typeorm_1.Index)('uq_customer_debt_ledger_source', ['tenant_id', 'source_key'], { unique: true }),
    (0, typeorm_1.Index)('idx_customer_debt_ledger_fiscal', ['tenant_id', 'fiscal_configuration_id', 'occurred_at']),
    (0, typeorm_1.Index)('idx_customer_debt_ledger_customer', [
        'tenant_id',
        'customer_id',
        'fiscal_configuration_id',
        'occurred_at',
    ]),
    (0, typeorm_1.Index)('idx_customer_debt_ledger_order', ['tenant_id', 'sales_order_id'])
], CustomerDebtLedger);
//# sourceMappingURL=customer-debt-ledger.entity.js.map