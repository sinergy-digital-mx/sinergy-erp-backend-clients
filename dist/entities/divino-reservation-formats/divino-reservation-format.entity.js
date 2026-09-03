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
exports.DivinoReservationFormat = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const property_entity_1 = require("../properties/property.entity");
const fiscal_configuration_entity_1 = require("../billing/fiscal-configuration.entity");
const user_entity_1 = require("../users/user.entity");
let DivinoReservationFormat = class DivinoReservationFormat {
    id;
    tenant;
    tenant_id;
    folio;
    fiscal_configuration;
    fiscal_configuration_id;
    payable_to;
    received_from;
    amount_in_words;
    evidenced_by;
    property;
    property_id;
    block;
    lot_number;
    surface;
    purchase_price;
    currency;
    reservation_deposit;
    reservation_date;
    down_payment;
    down_payment_date;
    financed_balance;
    financing_years;
    monthly_payments_count;
    monthly_payment_amount;
    maintenance_fee;
    maintenance_currency;
    payment_day;
    buyer_name;
    buyer_address;
    buyer_phone;
    buyer_email;
    lead_source;
    lead_source_other;
    format_date;
    agent_name;
    notes;
    status;
    creator;
    created_by;
    created_by_name;
    sent_at;
    sent_to;
    sent_by;
    metadata;
    created_at;
    updated_at;
};
exports.DivinoReservationFormat = DivinoReservationFormat;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DivinoReservationFormat.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], DivinoReservationFormat.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DivinoReservationFormat.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], DivinoReservationFormat.prototype, "folio", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => fiscal_configuration_entity_1.FiscalConfiguration, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'fiscal_configuration_id' }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "fiscal_configuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "payable_to", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "received_from", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "amount_in_words", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "evidenced_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => property_entity_1.Property, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'property_id' }),
    __metadata("design:type", property_entity_1.Property)
], DivinoReservationFormat.prototype, "property", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DivinoReservationFormat.prototype, "property_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "block", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "lot_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "surface", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "purchase_price", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10, default: 'USD' }),
    __metadata("design:type", String)
], DivinoReservationFormat.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "reservation_deposit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "reservation_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "down_payment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "down_payment_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "financed_balance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "financing_years", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "monthly_payments_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "monthly_payment_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, default: 50 }),
    __metadata("design:type", Number)
], DivinoReservationFormat.prototype, "maintenance_fee", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10, default: 'USD' }),
    __metadata("design:type", String)
], DivinoReservationFormat.prototype, "maintenance_currency", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['1', '15'],
        nullable: true,
    }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "payment_day", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "buyer_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "buyer_address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "buyer_phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "buyer_email", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: [
            'facebook',
            'instagram',
            'google',
            'restaurante',
            'walkin',
            'referido',
            'otro',
        ],
        nullable: true,
    }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "lead_source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "lead_source_other", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "format_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "agent_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['draft', 'sent'],
        default: 'draft',
    }),
    __metadata("design:type", String)
], DivinoReservationFormat.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "created_by_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "sent_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "sent_to", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "sent_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], DivinoReservationFormat.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], DivinoReservationFormat.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], DivinoReservationFormat.prototype, "updated_at", void 0);
exports.DivinoReservationFormat = DivinoReservationFormat = __decorate([
    (0, typeorm_1.Entity)('divino_reservation_formats'),
    (0, typeorm_1.Index)('tenant_index', ['tenant_id']),
    (0, typeorm_1.Index)('property_index', ['property_id']),
    (0, typeorm_1.Index)('status_index', ['status']),
    (0, typeorm_1.Index)('folio_index', ['tenant_id', 'folio'], { unique: true })
], DivinoReservationFormat);
//# sourceMappingURL=divino-reservation-format.entity.js.map