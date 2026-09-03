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
exports.ShippingStop = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const sales_order_entity_1 = require("../sales-orders/sales-order.entity");
const customer_address_entity_1 = require("../customers/customer-address.entity");
const shipping_entity_1 = require("./shipping.entity");
let ShippingStop = class ShippingStop {
    id;
    tenant;
    tenant_id;
    shipping;
    shipping_id;
    sales_order;
    sales_order_id;
    stop_sequence;
    customer_address;
    customer_address_id;
    location_status;
    delivery_latitude;
    delivery_longitude;
    distance_from_previous_km;
    created_at;
    updated_at;
};
exports.ShippingStop = ShippingStop;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ShippingStop.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], ShippingStop.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ShippingStop.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => shipping_entity_1.Shipping, (shipping) => shipping.stops, {
        onDelete: 'CASCADE',
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'shipping_id' }),
    __metadata("design:type", shipping_entity_1.Shipping)
], ShippingStop.prototype, "shipping", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ShippingStop.prototype, "shipping_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sales_order_entity_1.SalesOrder, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'sales_order_id' }),
    __metadata("design:type", sales_order_entity_1.SalesOrder)
], ShippingStop.prototype, "sales_order", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ShippingStop.prototype, "sales_order_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ShippingStop.prototype, "stop_sequence", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_address_entity_1.CustomerAddress, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_address_id' }),
    __metadata("design:type", Object)
], ShippingStop.prototype, "customer_address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], ShippingStop.prototype, "customer_address_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, default: 'without_location' }),
    __metadata("design:type", String)
], ShippingStop.prototype, "location_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 6, nullable: true }),
    __metadata("design:type", Object)
], ShippingStop.prototype, "delivery_latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 6, nullable: true }),
    __metadata("design:type", Object)
], ShippingStop.prototype, "delivery_longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], ShippingStop.prototype, "distance_from_previous_km", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ShippingStop.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ShippingStop.prototype, "updated_at", void 0);
exports.ShippingStop = ShippingStop = __decorate([
    (0, typeorm_1.Entity)('shipping_stops'),
    (0, typeorm_1.Index)('idx_shipping_stops_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('idx_shipping_stops_shipping', ['shipping_id']),
    (0, typeorm_1.Index)('idx_shipping_stops_sales_order', ['tenant_id', 'sales_order_id'])
], ShippingStop);
//# sourceMappingURL=shipping-stop.entity.js.map