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
exports.Quotation = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const fiscal_configuration_entity_1 = require("../billing/fiscal-configuration.entity");
const billing_branch_entity_1 = require("../billing/billing-branch.entity");
const warehouse_entity_1 = require("../warehouse/warehouse.entity");
const customer_entity_1 = require("../customers/customer.entity");
const user_entity_1 = require("../users/user.entity");
const global_discount_entity_1 = require("../global-discounts/global-discount.entity");
const quotation_detail_entity_1 = require("./quotation-detail.entity");
let Quotation = class Quotation {
    id;
    tenant;
    tenant_id;
    folio;
    fiscal_configuration;
    fiscal_configuration_id;
    billing_branch;
    billing_branch_id;
    warehouse;
    warehouse_id;
    customer;
    customer_id;
    expected_delivery_date;
    quotation_type;
    fiscal_razon_social;
    general_status;
    notes;
    subtotal;
    iva_total;
    ieps_total;
    discount_total;
    global_discount;
    global_discount_id;
    global_discount_amount;
    total;
    creator;
    created_by;
    terminal_user;
    terminal_user_id;
    seller_user;
    seller_user_id;
    assigned_seller_user;
    assigned_seller_user_id;
    converted_to_sales_order_id;
    created_at;
    updated_by;
    updated_at;
    line_items;
};
exports.Quotation = Quotation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Quotation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], Quotation.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Quotation.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], Quotation.prototype, "folio", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => fiscal_configuration_entity_1.FiscalConfiguration, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'fiscal_configuration_id' }),
    __metadata("design:type", fiscal_configuration_entity_1.FiscalConfiguration)
], Quotation.prototype, "fiscal_configuration", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Quotation.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => billing_branch_entity_1.BillingBranch, { onDelete: 'RESTRICT', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'billing_branch_id' }),
    __metadata("design:type", Object)
], Quotation.prototype, "billing_branch", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], Quotation.prototype, "billing_branch_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_entity_1.Warehouse, { onDelete: 'RESTRICT', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'warehouse_id' }),
    __metadata("design:type", Object)
], Quotation.prototype, "warehouse", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], Quotation.prototype, "warehouse_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_entity_1.Customer, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_id' }),
    __metadata("design:type", customer_entity_1.Customer)
], Quotation.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Quotation.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Quotation.prototype, "expected_delivery_date", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['POS', 'MANUAL'],
        default: 'MANUAL',
    }),
    __metadata("design:type", String)
], Quotation.prototype, "quotation_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Quotation.prototype, "fiscal_razon_social", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['Creada', 'Convertida', 'Cancelada'],
        default: 'Creada',
    }),
    __metadata("design:type", String)
], Quotation.prototype, "general_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Quotation.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Quotation.prototype, "subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Quotation.prototype, "iva_total", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Quotation.prototype, "ieps_total", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Quotation.prototype, "discount_total", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => global_discount_entity_1.GlobalDiscount, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'global_discount_id' }),
    __metadata("design:type", Object)
], Quotation.prototype, "global_discount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], Quotation.prototype, "global_discount_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Quotation.prototype, "global_discount_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Quotation.prototype, "total", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], Quotation.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Quotation.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'terminal_user_id' }),
    __metadata("design:type", Object)
], Quotation.prototype, "terminal_user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], Quotation.prototype, "terminal_user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'seller_user_id' }),
    __metadata("design:type", Object)
], Quotation.prototype, "seller_user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], Quotation.prototype, "seller_user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'assigned_seller_user_id' }),
    __metadata("design:type", Object)
], Quotation.prototype, "assigned_seller_user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], Quotation.prototype, "assigned_seller_user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], Quotation.prototype, "converted_to_sales_order_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Quotation.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Quotation.prototype, "updated_by", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Quotation.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => quotation_detail_entity_1.QuotationDetail, (detail) => detail.quotation),
    __metadata("design:type", Array)
], Quotation.prototype, "line_items", void 0);
exports.Quotation = Quotation = __decorate([
    (0, typeorm_1.Entity)('inv_s_quotations'),
    (0, typeorm_1.Index)('idx_qt_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('uq_qt_tenant_folio', ['tenant_id', 'folio'], { unique: true }),
    (0, typeorm_1.Index)('idx_qt_customer', ['customer_id']),
    (0, typeorm_1.Index)('idx_qt_warehouse', ['warehouse_id']),
    (0, typeorm_1.Index)('idx_qt_billing_branch', ['billing_branch_id']),
    (0, typeorm_1.Index)('idx_qt_general_status', ['general_status']),
    (0, typeorm_1.Index)('idx_qt_converted_so', ['converted_to_sales_order_id'])
], Quotation);
//# sourceMappingURL=quotation.entity.js.map