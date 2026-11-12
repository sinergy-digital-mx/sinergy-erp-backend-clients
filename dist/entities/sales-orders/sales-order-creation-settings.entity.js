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
exports.SalesOrderCreationSettings = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const user_entity_1 = require("../users/user.entity");
let SalesOrderCreationSettings = class SalesOrderCreationSettings {
    id;
    tenant;
    tenant_id;
    fields;
    updater;
    updated_by;
    created_at;
    updated_at;
};
exports.SalesOrderCreationSettings = SalesOrderCreationSettings;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SalesOrderCreationSettings.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], SalesOrderCreationSettings.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], SalesOrderCreationSettings.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json' }),
    __metadata("design:type", Object)
], SalesOrderCreationSettings.prototype, "fields", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'updated_by' }),
    __metadata("design:type", Object)
], SalesOrderCreationSettings.prototype, "updater", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], SalesOrderCreationSettings.prototype, "updated_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], SalesOrderCreationSettings.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], SalesOrderCreationSettings.prototype, "updated_at", void 0);
exports.SalesOrderCreationSettings = SalesOrderCreationSettings = __decorate([
    (0, typeorm_1.Entity)('sales_order_creation_settings'),
    (0, typeorm_1.Index)('uq_sales_order_creation_settings_tenant', ['tenant_id'], { unique: true })
], SalesOrderCreationSettings);
//# sourceMappingURL=sales-order-creation-settings.entity.js.map