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
exports.PurchaseOrderBatch = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const fiscal_configuration_entity_1 = require("../billing/fiscal-configuration.entity");
const warehouse_entity_1 = require("../warehouse/warehouse.entity");
const vendor_entity_1 = require("../vendor/vendor.entity");
const user_entity_1 = require("../users/user.entity");
const purchase_order_batch_detail_entity_1 = require("./purchase-order-batch-detail.entity");
const inventory_batch_entity_1 = require("./inventory-batch.entity");
const purchase_order_payment_entity_1 = require("./purchase-order-payment.entity");
const purchase_order_landed_cost_line_entity_1 = require("./purchase-order-landed-cost-line.entity");
let PurchaseOrderBatch = class PurchaseOrderBatch {
    id;
    tenant;
    tenant_id;
    fiscal_configuration;
    fiscal_configuration_id;
    warehouse;
    warehouse_id;
    vendor;
    vendor_id;
    folio;
    expected_delivery_date;
    payment_status;
    payment_currency;
    general_status;
    notes;
    pedimento_number;
    customs_date;
    customs_exchange_rate;
    landed_increment_percentage;
    landed_merchandise_mxn;
    landed_extras_mxn;
    requested_subtotal;
    requested_iva_total;
    requested_ieps_total;
    requested_total;
    received_subtotal;
    received_iva_total;
    received_ieps_total;
    received_total;
    creator;
    created_by;
    created_at;
    updater;
    updated_by;
    updated_at;
    line_items;
    batches;
    payments;
    landed_cost_lines;
};
exports.PurchaseOrderBatch = PurchaseOrderBatch;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PurchaseOrderBatch.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], PurchaseOrderBatch.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PurchaseOrderBatch.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => fiscal_configuration_entity_1.FiscalConfiguration, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'fiscal_configuration_id' }),
    __metadata("design:type", fiscal_configuration_entity_1.FiscalConfiguration)
], PurchaseOrderBatch.prototype, "fiscal_configuration", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PurchaseOrderBatch.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_entity_1.Warehouse, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'warehouse_id' }),
    __metadata("design:type", warehouse_entity_1.Warehouse)
], PurchaseOrderBatch.prototype, "warehouse", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PurchaseOrderBatch.prototype, "warehouse_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => vendor_entity_1.Vendor, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'vendor_id' }),
    __metadata("design:type", vendor_entity_1.Vendor)
], PurchaseOrderBatch.prototype, "vendor", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PurchaseOrderBatch.prototype, "vendor_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], PurchaseOrderBatch.prototype, "folio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], PurchaseOrderBatch.prototype, "expected_delivery_date", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['Pendiente', 'Pagado'],
        default: 'Pendiente',
    }),
    __metadata("design:type", String)
], PurchaseOrderBatch.prototype, "payment_status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['MXN', 'USD'],
        default: 'MXN',
    }),
    __metadata("design:type", String)
], PurchaseOrderBatch.prototype, "payment_currency", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['Creada', 'Recibida', 'Cancelada'],
        default: 'Creada',
    }),
    __metadata("design:type", String)
], PurchaseOrderBatch.prototype, "general_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], PurchaseOrderBatch.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, nullable: true }),
    __metadata("design:type", Object)
], PurchaseOrderBatch.prototype, "pedimento_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], PurchaseOrderBatch.prototype, "customs_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 4, nullable: true }),
    __metadata("design:type", Object)
], PurchaseOrderBatch.prototype, "customs_exchange_rate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 8, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], PurchaseOrderBatch.prototype, "landed_increment_percentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseOrderBatch.prototype, "landed_merchandise_mxn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseOrderBatch.prototype, "landed_extras_mxn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseOrderBatch.prototype, "requested_subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseOrderBatch.prototype, "requested_iva_total", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseOrderBatch.prototype, "requested_ieps_total", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseOrderBatch.prototype, "requested_total", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseOrderBatch.prototype, "received_subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseOrderBatch.prototype, "received_iva_total", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseOrderBatch.prototype, "received_ieps_total", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseOrderBatch.prototype, "received_total", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], PurchaseOrderBatch.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PurchaseOrderBatch.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], PurchaseOrderBatch.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'updated_by' }),
    __metadata("design:type", user_entity_1.User)
], PurchaseOrderBatch.prototype, "updater", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PurchaseOrderBatch.prototype, "updated_by", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], PurchaseOrderBatch.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => purchase_order_batch_detail_entity_1.PurchaseOrderBatchDetail, (detail) => detail.purchase_order_batch),
    __metadata("design:type", Array)
], PurchaseOrderBatch.prototype, "line_items", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => inventory_batch_entity_1.InventoryBatch, (batch) => batch.purchase_order_batch),
    __metadata("design:type", Array)
], PurchaseOrderBatch.prototype, "batches", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => purchase_order_payment_entity_1.PurchaseOrderPayment, (payment) => payment.purchase_order_batch),
    __metadata("design:type", Array)
], PurchaseOrderBatch.prototype, "payments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => purchase_order_landed_cost_line_entity_1.PurchaseOrderLandedCostLine, (line) => line.purchase_order_batch),
    __metadata("design:type", Array)
], PurchaseOrderBatch.prototype, "landed_cost_lines", void 0);
exports.PurchaseOrderBatch = PurchaseOrderBatch = __decorate([
    (0, typeorm_1.Entity)('inv_s_purchase_order_batch'),
    (0, typeorm_1.Index)('idx_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('uq_po_batch_tenant_folio', ['tenant_id', 'folio'], { unique: true }),
    (0, typeorm_1.Index)('idx_general_status', ['general_status']),
    (0, typeorm_1.Index)('idx_payment_status', ['payment_status']),
    (0, typeorm_1.Index)('idx_vendor', ['vendor_id']),
    (0, typeorm_1.Index)('idx_warehouse', ['warehouse_id']),
    (0, typeorm_1.Index)('idx_expected_delivery', ['expected_delivery_date'])
], PurchaseOrderBatch);
//# sourceMappingURL=purchase-order-batch.entity.js.map