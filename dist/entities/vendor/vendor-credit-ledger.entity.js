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
exports.VendorCreditLedger = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const user_entity_1 = require("../users/user.entity");
const purchase_order_batch_entity_1 = require("../purchase-orders/purchase-order-batch.entity");
const purchase_order_payment_entity_1 = require("../purchase-orders/purchase-order-payment.entity");
const vendor_entity_1 = require("./vendor.entity");
const vendor_credit_ledger_entry_type_enum_1 = require("./vendor-credit-ledger-entry-type.enum");
let VendorCreditLedger = class VendorCreditLedger {
    id;
    tenant;
    tenant_id;
    vendor;
    vendor_id;
    currency;
    entry_type;
    amount;
    purchase_order;
    purchase_order_id;
    purchase_order_payment;
    purchase_order_payment_id;
    source_entry;
    source_entry_id;
    notes;
    creator;
    created_by;
    created_at;
};
exports.VendorCreditLedger = VendorCreditLedger;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], VendorCreditLedger.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], VendorCreditLedger.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], VendorCreditLedger.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => vendor_entity_1.Vendor, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'vendor_id' }),
    __metadata("design:type", vendor_entity_1.Vendor)
], VendorCreditLedger.prototype, "vendor", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], VendorCreditLedger.prototype, "vendor_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['MXN', 'USD'] }),
    __metadata("design:type", String)
], VendorCreditLedger.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: vendor_credit_ledger_entry_type_enum_1.VendorCreditLedgerEntryType }),
    __metadata("design:type", String)
], VendorCreditLedger.prototype, "entry_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], VendorCreditLedger.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => purchase_order_batch_entity_1.PurchaseOrderBatch, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'purchase_order_id' }),
    __metadata("design:type", Object)
], VendorCreditLedger.prototype, "purchase_order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], VendorCreditLedger.prototype, "purchase_order_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => purchase_order_payment_entity_1.PurchaseOrderPayment, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'purchase_order_payment_id' }),
    __metadata("design:type", Object)
], VendorCreditLedger.prototype, "purchase_order_payment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], VendorCreditLedger.prototype, "purchase_order_payment_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => VendorCreditLedger, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'source_entry_id' }),
    __metadata("design:type", Object)
], VendorCreditLedger.prototype, "source_entry", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], VendorCreditLedger.prototype, "source_entry_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], VendorCreditLedger.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", Object)
], VendorCreditLedger.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], VendorCreditLedger.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], VendorCreditLedger.prototype, "created_at", void 0);
exports.VendorCreditLedger = VendorCreditLedger = __decorate([
    (0, typeorm_1.Entity)('vendor_credit_ledger'),
    (0, typeorm_1.Index)('idx_vendor_credit_ledger_tenant_vendor', ['tenant_id', 'vendor_id']),
    (0, typeorm_1.Index)('idx_vendor_credit_ledger_payment', ['purchase_order_payment_id'])
], VendorCreditLedger);
//# sourceMappingURL=vendor-credit-ledger.entity.js.map