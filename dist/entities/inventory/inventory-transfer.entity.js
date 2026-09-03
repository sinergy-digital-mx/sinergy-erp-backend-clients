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
exports.InventoryTransfer = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const warehouse_entity_1 = require("../warehouse/warehouse.entity");
const product_entity_1 = require("../products/product.entity");
const uom_catalog_entity_1 = require("../uom-catalog/uom-catalog.entity");
const user_entity_1 = require("../users/user.entity");
const inventory_transfer_status_enum_1 = require("./inventory-transfer-status.enum");
const inventory_transfer_line_entity_1 = require("./inventory-transfer-line.entity");
let InventoryTransfer = class InventoryTransfer {
    id;
    tenant;
    tenant_id;
    folio;
    product;
    product_id;
    uom;
    uom_id;
    source_warehouse;
    source_warehouse_id;
    destination_warehouse;
    destination_warehouse_id;
    total_quantity;
    status;
    notes;
    created_by_user;
    created_by;
    created_at;
    lines;
};
exports.InventoryTransfer = InventoryTransfer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InventoryTransfer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], InventoryTransfer.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InventoryTransfer.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], InventoryTransfer.prototype, "folio", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], InventoryTransfer.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InventoryTransfer.prototype, "product_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => uom_catalog_entity_1.UoMCatalog, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'uom_id' }),
    __metadata("design:type", uom_catalog_entity_1.UoMCatalog)
], InventoryTransfer.prototype, "uom", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InventoryTransfer.prototype, "uom_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_entity_1.Warehouse, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'source_warehouse_id' }),
    __metadata("design:type", warehouse_entity_1.Warehouse)
], InventoryTransfer.prototype, "source_warehouse", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InventoryTransfer.prototype, "source_warehouse_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_entity_1.Warehouse, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'destination_warehouse_id' }),
    __metadata("design:type", warehouse_entity_1.Warehouse)
], InventoryTransfer.prototype, "destination_warehouse", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InventoryTransfer.prototype, "destination_warehouse_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 3 }),
    __metadata("design:type", Number)
], InventoryTransfer.prototype, "total_quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: inventory_transfer_status_enum_1.InventoryTransferStatus,
        default: inventory_transfer_status_enum_1.InventoryTransferStatus.COMPLETED,
    }),
    __metadata("design:type", String)
], InventoryTransfer.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], InventoryTransfer.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], InventoryTransfer.prototype, "created_by_user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InventoryTransfer.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], InventoryTransfer.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => inventory_transfer_line_entity_1.InventoryTransferLine, (line) => line.inventory_transfer),
    __metadata("design:type", Array)
], InventoryTransfer.prototype, "lines", void 0);
exports.InventoryTransfer = InventoryTransfer = __decorate([
    (0, typeorm_1.Entity)('inv_s_inventory_transfers'),
    (0, typeorm_1.Index)('idx_transfer_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('idx_transfer_folio', ['tenant_id', 'folio'], { unique: true }),
    (0, typeorm_1.Index)('idx_transfer_source_wh', ['source_warehouse_id']),
    (0, typeorm_1.Index)('idx_transfer_dest_wh', ['destination_warehouse_id']),
    (0, typeorm_1.Index)('idx_transfer_product', ['product_id']),
    (0, typeorm_1.Index)('idx_transfer_created_at', ['created_at'])
], InventoryTransfer);
//# sourceMappingURL=inventory-transfer.entity.js.map