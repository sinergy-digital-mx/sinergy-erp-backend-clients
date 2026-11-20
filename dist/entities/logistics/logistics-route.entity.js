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
exports.LogisticsRoute = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
let LogisticsRoute = class LogisticsRoute {
    id;
    tenant;
    tenant_id;
    name;
    code;
    description;
    is_active;
    created_at;
    updated_at;
};
exports.LogisticsRoute = LogisticsRoute;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], LogisticsRoute.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], LogisticsRoute.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], LogisticsRoute.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120 }),
    __metadata("design:type", String)
], LogisticsRoute.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40 }),
    __metadata("design:type", String)
], LogisticsRoute.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], LogisticsRoute.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], LogisticsRoute.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], LogisticsRoute.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], LogisticsRoute.prototype, "updated_at", void 0);
exports.LogisticsRoute = LogisticsRoute = __decorate([
    (0, typeorm_1.Entity)('logistics_routes'),
    (0, typeorm_1.Index)('idx_logistics_routes_tenant', ['tenant_id', 'is_active']),
    (0, typeorm_1.Index)('uq_logistics_routes_tenant_code', ['tenant_id', 'code'], { unique: true })
], LogisticsRoute);
//# sourceMappingURL=logistics-route.entity.js.map