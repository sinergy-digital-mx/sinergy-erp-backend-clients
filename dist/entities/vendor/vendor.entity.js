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
exports.Vendor = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const vendor_type_enum_1 = require("./vendor-type.enum");
let Vendor = class Vendor {
    id;
    tenant;
    tenant_id;
    vendor_type;
    vendor_code;
    name;
    company_name;
    street;
    city;
    state;
    zip_code;
    country;
    razon_social;
    rfc;
    persona_type;
    tax_id;
    legal_name;
    bank_name;
    bank_account_holder;
    bank_account_number;
    bank_clabe;
    bank_swift_bic;
    bank_iban;
    bank_currency;
    credit_days;
    credit_limit;
    status;
    created_at;
    updated_at;
};
exports.Vendor = Vendor;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Vendor.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], Vendor.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Vendor.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: vendor_type_enum_1.VendorType,
        default: vendor_type_enum_1.VendorType.NATIONAL,
    }),
    __metadata("design:type", String)
], Vendor.prototype, "vendor_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", Object)
], Vendor.prototype, "vendor_code", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Vendor.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Vendor.prototype, "company_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Vendor.prototype, "street", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Vendor.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Vendor.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Vendor.prototype, "zip_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Vendor.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Vendor.prototype, "razon_social", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Vendor.prototype, "rfc", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['Persona Física', 'Persona Moral'],
        nullable: true,
    }),
    __metadata("design:type", Object)
], Vendor.prototype, "persona_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Vendor.prototype, "tax_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Vendor.prototype, "legal_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Vendor.prototype, "bank_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Vendor.prototype, "bank_account_holder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Vendor.prototype, "bank_account_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 18, nullable: true }),
    __metadata("design:type", Object)
], Vendor.prototype, "bank_clabe", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 11, nullable: true }),
    __metadata("design:type", Object)
], Vendor.prototype, "bank_swift_bic", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 34, nullable: true }),
    __metadata("design:type", Object)
], Vendor.prototype, "bank_iban", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 3, nullable: true }),
    __metadata("design:type", Object)
], Vendor.prototype, "bank_currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Object)
], Vendor.prototype, "credit_days", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], Vendor.prototype, "credit_limit", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['active', 'inactive'],
        default: 'active',
    }),
    __metadata("design:type", String)
], Vendor.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Vendor.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Vendor.prototype, "updated_at", void 0);
exports.Vendor = Vendor = __decorate([
    (0, typeorm_1.Entity)('vendors'),
    (0, typeorm_1.Index)('tenant_index', ['tenant_id']),
    (0, typeorm_1.Index)('status_index', ['status']),
    (0, typeorm_1.Index)('rfc_index', ['rfc']),
    (0, typeorm_1.Index)('vendor_type_index', ['vendor_type'])
], Vendor);
//# sourceMappingURL=vendor.entity.js.map