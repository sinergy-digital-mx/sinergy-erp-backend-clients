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
exports.ShippingInventoryTransfer = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const inventory_transfer_entity_1 = require("../inventory/inventory-transfer.entity");
const shipping_entity_1 = require("./shipping.entity");
let ShippingInventoryTransfer = class ShippingInventoryTransfer {
    id;
    tenant;
    tenant_id;
    shipping;
    shipping_id;
    inventory_transfer;
    inventory_transfer_id;
    created_at;
};
exports.ShippingInventoryTransfer = ShippingInventoryTransfer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ShippingInventoryTransfer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], ShippingInventoryTransfer.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ShippingInventoryTransfer.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => shipping_entity_1.Shipping, (shipping) => shipping.transfer_links, {
        onDelete: 'CASCADE',
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'shipping_id' }),
    __metadata("design:type", shipping_entity_1.Shipping)
], ShippingInventoryTransfer.prototype, "shipping", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ShippingInventoryTransfer.prototype, "shipping_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => inventory_transfer_entity_1.InventoryTransfer, (transfer) => transfer.shipping_links, {
        onDelete: 'RESTRICT',
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'inventory_transfer_id' }),
    __metadata("design:type", inventory_transfer_entity_1.InventoryTransfer)
], ShippingInventoryTransfer.prototype, "inventory_transfer", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ShippingInventoryTransfer.prototype, "inventory_transfer_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ShippingInventoryTransfer.prototype, "created_at", void 0);
exports.ShippingInventoryTransfer = ShippingInventoryTransfer = __decorate([
    (0, typeorm_1.Entity)('shipping_inventory_transfers'),
    (0, typeorm_1.Index)('idx_shipping_transfer_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('idx_shipping_transfer_shipping', ['shipping_id']),
    (0, typeorm_1.Index)('idx_shipping_transfer_transfer', ['inventory_transfer_id'])
], ShippingInventoryTransfer);
//# sourceMappingURL=shipping-inventory-transfer.entity.js.map