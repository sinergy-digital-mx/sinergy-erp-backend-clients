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
exports.GpsTrackingConfiguration = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
let GpsTrackingConfiguration = class GpsTrackingConfiguration {
    id;
    tenant;
    tenant_id;
    name;
    username;
    encrypted_password;
    password_iv;
    is_active;
    is_valid;
    last_test_result;
    last_test_at;
    created_by;
    updated_by;
    created_at;
    updated_at;
};
exports.GpsTrackingConfiguration = GpsTrackingConfiguration;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], GpsTrackingConfiguration.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], GpsTrackingConfiguration.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], GpsTrackingConfiguration.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], GpsTrackingConfiguration.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], GpsTrackingConfiguration.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], GpsTrackingConfiguration.prototype, "encrypted_password", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], GpsTrackingConfiguration.prototype, "password_iv", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], GpsTrackingConfiguration.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], GpsTrackingConfiguration.prototype, "is_valid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], GpsTrackingConfiguration.prototype, "last_test_result", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], GpsTrackingConfiguration.prototype, "last_test_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], GpsTrackingConfiguration.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], GpsTrackingConfiguration.prototype, "updated_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], GpsTrackingConfiguration.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], GpsTrackingConfiguration.prototype, "updated_at", void 0);
exports.GpsTrackingConfiguration = GpsTrackingConfiguration = __decorate([
    (0, typeorm_1.Entity)('gps_tracking_configurations'),
    (0, typeorm_1.Index)('idx_gps_tracking_configurations_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('idx_gps_tracking_configurations_tenant_active', ['tenant_id', 'is_active'])
], GpsTrackingConfiguration);
//# sourceMappingURL=gps-tracking-configuration.entity.js.map