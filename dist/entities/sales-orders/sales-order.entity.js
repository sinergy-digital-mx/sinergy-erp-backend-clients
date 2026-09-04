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
exports.SalesOrder = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const fiscal_configuration_entity_1 = require("../billing/fiscal-configuration.entity");
const billing_branch_entity_1 = require("../billing/billing-branch.entity");
const warehouse_entity_1 = require("../warehouse/warehouse.entity");
const customer_entity_1 = require("../customers/customer.entity");
const user_entity_1 = require("../users/user.entity");
const pos_daily_shift_entity_1 = require("../pos/pos-daily-shift.entity");
const sales_order_detail_entity_1 = require("./sales-order-detail.entity");
const global_discount_entity_1 = require("../global-discounts/global-discount.entity");
const sales_order_sale_scope_enum_1 = require("./sales-order-sale-scope.enum");
let SalesOrder = class SalesOrder {
    id;
    tenant;
    tenant_id;
    folio;
    public_invoice_code;
    fiscal_configuration;
    fiscal_configuration_id;
    billing_branch;
    billing_branch_id;
    warehouse;
    warehouse_id;
    customer;
    customer_id;
    expected_delivery_date;
    sales_order_type;
    fiscal_razon_social;
    payment_status;
    is_credit;
    invoice_requested;
    general_status;
    notes;
    converted_from_quotation_id;
    sale_scope;
    requires_selection_assembly;
    corroborator;
    corroborated_by;
    corroborated_at;
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
    pos_daily_shift;
    pos_daily_shift_id;
    collected_by_user;
    collected_by_user_id;
    created_at;
    updated_by;
    updated_at;
    line_items;
};
exports.SalesOrder = SalesOrder;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SalesOrder.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], SalesOrder.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SalesOrder.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], SalesOrder.prototype, "folio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 48, nullable: true }),
    __metadata("design:type", Object)
], SalesOrder.prototype, "public_invoice_code", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => fiscal_configuration_entity_1.FiscalConfiguration, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'fiscal_configuration_id' }),
    __metadata("design:type", fiscal_configuration_entity_1.FiscalConfiguration)
], SalesOrder.prototype, "fiscal_configuration", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SalesOrder.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => billing_branch_entity_1.BillingBranch, { onDelete: 'RESTRICT', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'billing_branch_id' }),
    __metadata("design:type", Object)
], SalesOrder.prototype, "billing_branch", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], SalesOrder.prototype, "billing_branch_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_entity_1.Warehouse, { onDelete: 'RESTRICT', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'warehouse_id' }),
    __metadata("design:type", Object)
], SalesOrder.prototype, "warehouse", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], SalesOrder.prototype, "warehouse_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_entity_1.Customer, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_id' }),
    __metadata("design:type", customer_entity_1.Customer)
], SalesOrder.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], SalesOrder.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], SalesOrder.prototype, "expected_delivery_date", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['POS', 'MANUAL'],
        default: 'MANUAL',
    }),
    __metadata("design:type", String)
], SalesOrder.prototype, "sales_order_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], SalesOrder.prototype, "fiscal_razon_social", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['Pendiente', 'Pagado'],
        default: 'Pendiente',
    }),
    __metadata("design:type", String)
], SalesOrder.prototype, "payment_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], SalesOrder.prototype, "is_credit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], SalesOrder.prototype, "invoice_requested", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: [
            'Creada',
            'En Selección',
            'Lista para entrega',
            'Surtida',
            'Cancelada',
            'En cola',
            'En Camino',
        ],
        default: 'Creada',
    }),
    __metadata("design:type", String)
], SalesOrder.prototype, "general_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], SalesOrder.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], SalesOrder.prototype, "converted_from_quotation_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, default: sales_order_sale_scope_enum_1.SalesOrderSaleScope.Inventory }),
    __metadata("design:type", String)
], SalesOrder.prototype, "sale_scope", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], SalesOrder.prototype, "requires_selection_assembly", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'corroborated_by' }),
    __metadata("design:type", Object)
], SalesOrder.prototype, "corroborator", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], SalesOrder.prototype, "corroborated_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], SalesOrder.prototype, "corroborated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesOrder.prototype, "subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesOrder.prototype, "iva_total", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesOrder.prototype, "ieps_total", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesOrder.prototype, "discount_total", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => global_discount_entity_1.GlobalDiscount, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'global_discount_id' }),
    __metadata("design:type", Object)
], SalesOrder.prototype, "global_discount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], SalesOrder.prototype, "global_discount_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesOrder.prototype, "global_discount_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesOrder.prototype, "total", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], SalesOrder.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SalesOrder.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'terminal_user_id' }),
    __metadata("design:type", user_entity_1.User)
], SalesOrder.prototype, "terminal_user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], SalesOrder.prototype, "terminal_user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'seller_user_id' }),
    __metadata("design:type", user_entity_1.User)
], SalesOrder.prototype, "seller_user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], SalesOrder.prototype, "seller_user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'assigned_seller_user_id' }),
    __metadata("design:type", Object)
], SalesOrder.prototype, "assigned_seller_user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], SalesOrder.prototype, "assigned_seller_user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => pos_daily_shift_entity_1.PosDailyShift, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'pos_daily_shift_id' }),
    __metadata("design:type", pos_daily_shift_entity_1.PosDailyShift)
], SalesOrder.prototype, "pos_daily_shift", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], SalesOrder.prototype, "pos_daily_shift_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'collected_by_user_id' }),
    __metadata("design:type", user_entity_1.User)
], SalesOrder.prototype, "collected_by_user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], SalesOrder.prototype, "collected_by_user_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], SalesOrder.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SalesOrder.prototype, "updated_by", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], SalesOrder.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => sales_order_detail_entity_1.SalesOrderDetail, (detail) => detail.sales_order),
    __metadata("design:type", Array)
], SalesOrder.prototype, "line_items", void 0);
exports.SalesOrder = SalesOrder = __decorate([
    (0, typeorm_1.Entity)('inv_s_sales_orders'),
    (0, typeorm_1.Index)('idx_so_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('uq_so_tenant_folio', ['tenant_id', 'folio'], { unique: true }),
    (0, typeorm_1.Index)('uq_so_public_invoice_code', ['public_invoice_code'], { unique: true }),
    (0, typeorm_1.Index)('idx_so_customer', ['customer_id']),
    (0, typeorm_1.Index)('idx_so_warehouse', ['warehouse_id']),
    (0, typeorm_1.Index)('idx_so_billing_branch', ['billing_branch_id']),
    (0, typeorm_1.Index)('idx_so_general_status', ['general_status']),
    (0, typeorm_1.Index)('idx_so_payment_status', ['payment_status'])
], SalesOrder);
//# sourceMappingURL=sales-order.entity.js.map