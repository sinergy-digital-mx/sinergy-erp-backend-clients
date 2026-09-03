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
exports.FinkokProviderConfiguration = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const user_entity_1 = require("../users/user.entity");
let FinkokProviderConfiguration = class FinkokProviderConfiguration {
    id;
    tenant;
    tenant_id;
    finkok_username;
    finkok_username_encrypted;
    finkok_username_iv;
    finkok_password_encrypted;
    finkok_password_iv;
    environment;
    is_active;
    is_stamping_default;
    last_connection_test_at;
    last_connection_test_status;
    creator;
    created_by;
    updater;
    updated_by;
    created_at;
    updated_at;
};
exports.FinkokProviderConfiguration = FinkokProviderConfiguration;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FinkokProviderConfiguration.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], FinkokProviderConfiguration.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], FinkokProviderConfiguration.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], FinkokProviderConfiguration.prototype, "finkok_username", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], FinkokProviderConfiguration.prototype, "finkok_username_encrypted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], FinkokProviderConfiguration.prototype, "finkok_username_iv", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], FinkokProviderConfiguration.prototype, "finkok_password_encrypted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], FinkokProviderConfiguration.prototype, "finkok_password_iv", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['demo', 'production'],
        default: 'demo',
    }),
    __metadata("design:type", String)
], FinkokProviderConfiguration.prototype, "environment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: 1 }),
    __metadata("design:type", Number)
], FinkokProviderConfiguration.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: 0 }),
    __metadata("design:type", Number)
], FinkokProviderConfiguration.prototype, "is_stamping_default", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], FinkokProviderConfiguration.prototype, "last_connection_test_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], FinkokProviderConfiguration.prototype, "last_connection_test_status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], FinkokProviderConfiguration.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], FinkokProviderConfiguration.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'updated_by' }),
    __metadata("design:type", user_entity_1.User)
], FinkokProviderConfiguration.prototype, "updater", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], FinkokProviderConfiguration.prototype, "updated_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], FinkokProviderConfiguration.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], FinkokProviderConfiguration.prototype, "updated_at", void 0);
exports.FinkokProviderConfiguration = FinkokProviderConfiguration = __decorate([
    (0, typeorm_1.Entity)('finkok_provider_configurations'),
    (0, typeorm_1.Index)('uq_finkok_provider_tenant_env', ['tenant_id', 'environment'], { unique: true })
], FinkokProviderConfiguration);
//# sourceMappingURL=finkok-provider-configuration.entity.js.map