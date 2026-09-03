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
exports.Shipping = exports.SHIPPING_STATUSES = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const user_entity_1 = require("../users/user.entity");
const warehouse_entity_1 = require("../warehouse/warehouse.entity");
const billing_branch_entity_1 = require("../billing/billing-branch.entity");
const truck_entity_1 = require("./truck.entity");
const shipping_stop_entity_1 = require("./shipping-stop.entity");
exports.SHIPPING_STATUSES = [
    'Creado',
    'En Ruta',
    'Completado',
    'Cancelado',
];
let Shipping = class Shipping {
    id;
    tenant;
    tenant_id;
    shipping_date;
    creator;
    created_by;
    editor;
    edited_by;
    driver;
    driver_id;
    truck;
    truck_id;
    origin_billing_branch;
    origin_billing_branch_id;
    origin_warehouse;
    origin_warehouse_id;
    status;
    distance_km;
    notes;
    stops;
    created_at;
    updated_at;
};
exports.Shipping = Shipping;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Shipping.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], Shipping.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Shipping.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Shipping.prototype, "shipping_date", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], Shipping.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Shipping.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'edited_by' }),
    __metadata("design:type", Object)
], Shipping.prototype, "editor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], Shipping.prototype, "edited_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'driver_id' }),
    __metadata("design:type", user_entity_1.User)
], Shipping.prototype, "driver", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], Shipping.prototype, "driver_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => truck_entity_1.Truck, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'truck_id' }),
    __metadata("design:type", truck_entity_1.Truck)
], Shipping.prototype, "truck", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], Shipping.prototype, "truck_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => billing_branch_entity_1.BillingBranch, { onDelete: 'RESTRICT', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'origin_billing_branch_id' }),
    __metadata("design:type", Object)
], Shipping.prototype, "origin_billing_branch", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], Shipping.prototype, "origin_billing_branch_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_entity_1.Warehouse, { onDelete: 'RESTRICT', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'origin_warehouse_id' }),
    __metadata("design:type", Object)
], Shipping.prototype, "origin_warehouse", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], Shipping.prototype, "origin_warehouse_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, default: 'Creado' }),
    __metadata("design:type", String)
], Shipping.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], Shipping.prototype, "distance_km", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Shipping.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => shipping_stop_entity_1.ShippingStop, (stop) => stop.shipping),
    __metadata("design:type", Array)
], Shipping.prototype, "stops", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Shipping.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Shipping.prototype, "updated_at", void 0);
exports.Shipping = Shipping = __decorate([
    (0, typeorm_1.Entity)('shippings'),
    (0, typeorm_1.Index)('idx_shippings_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('idx_shippings_status', ['status']),
    (0, typeorm_1.Index)('idx_shippings_date', ['shipping_date'])
], Shipping);
//# sourceMappingURL=shipping.entity.js.map