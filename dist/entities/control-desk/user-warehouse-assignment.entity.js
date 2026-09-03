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
exports.UserWarehouseAssignment = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const user_entity_1 = require("../users/user.entity");
const warehouse_entity_1 = require("../warehouse/warehouse.entity");
let UserWarehouseAssignment = class UserWarehouseAssignment {
    id;
    tenant;
    tenant_id;
    user;
    user_id;
    warehouse;
    warehouse_id;
    created_at;
};
exports.UserWarehouseAssignment = UserWarehouseAssignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserWarehouseAssignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], UserWarehouseAssignment.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserWarehouseAssignment.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserWarehouseAssignment.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserWarehouseAssignment.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_entity_1.Warehouse, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'warehouse_id' }),
    __metadata("design:type", warehouse_entity_1.Warehouse)
], UserWarehouseAssignment.prototype, "warehouse", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserWarehouseAssignment.prototype, "warehouse_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], UserWarehouseAssignment.prototype, "created_at", void 0);
exports.UserWarehouseAssignment = UserWarehouseAssignment = __decorate([
    (0, typeorm_1.Entity)('user_warehouse_assignments'),
    (0, typeorm_1.Index)('idx_uwa_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('idx_uwa_user', ['tenant_id', 'user_id']),
    (0, typeorm_1.Index)('uq_uwa_user_warehouse', ['tenant_id', 'user_id', 'warehouse_id'], {
        unique: true,
    })
], UserWarehouseAssignment);
//# sourceMappingURL=user-warehouse-assignment.entity.js.map