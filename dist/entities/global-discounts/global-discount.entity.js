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
exports.GlobalDiscount = exports.GlobalDiscountType = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
var GlobalDiscountType;
(function (GlobalDiscountType) {
    GlobalDiscountType["PERCENTAGE"] = "percentage";
    GlobalDiscountType["FIXED"] = "fixed";
})(GlobalDiscountType || (exports.GlobalDiscountType = GlobalDiscountType = {}));
let GlobalDiscount = class GlobalDiscount {
    id;
    tenant;
    tenant_id;
    name;
    discount_type;
    value;
    is_active;
    valid_from;
    valid_to;
    created_at;
    updated_at;
};
exports.GlobalDiscount = GlobalDiscount;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], GlobalDiscount.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], GlobalDiscount.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], GlobalDiscount.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120 }),
    __metadata("design:type", String)
], GlobalDiscount.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: GlobalDiscountType,
        default: GlobalDiscountType.PERCENTAGE,
    }),
    __metadata("design:type", String)
], GlobalDiscount.prototype, "discount_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], GlobalDiscount.prototype, "value", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], GlobalDiscount.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], GlobalDiscount.prototype, "valid_from", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], GlobalDiscount.prototype, "valid_to", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], GlobalDiscount.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], GlobalDiscount.prototype, "updated_at", void 0);
exports.GlobalDiscount = GlobalDiscount = __decorate([
    (0, typeorm_1.Entity)('global_discounts'),
    (0, typeorm_1.Index)('global_discount_tenant_index', ['tenant_id']),
    (0, typeorm_1.Index)('UQ_global_discounts_tenant_name', ['tenant_id', 'name'], { unique: true })
], GlobalDiscount);
//# sourceMappingURL=global-discount.entity.js.map