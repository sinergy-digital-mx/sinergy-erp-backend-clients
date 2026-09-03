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
exports.UserRole = void 0;
const typeorm_1 = require("typeorm");
const class_validator_1 = require("class-validator");
let UserRole = class UserRole {
    id;
    user;
    user_id;
    role;
    role_id;
    tenant;
    tenant_id;
    created_at;
};
exports.UserRole = UserRole;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserRole.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('User', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", Object)
], UserRole.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UserRole.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('Role', 'user_roles', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'role_id' }),
    __metadata("design:type", Object)
], UserRole.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'role_id' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UserRole.prototype, "role_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('RBACTenant', 'user_roles', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", Object)
], UserRole.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UserRole.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], UserRole.prototype, "created_at", void 0);
exports.UserRole = UserRole = __decorate([
    (0, typeorm_1.Entity)('rbac_user_roles'),
    (0, typeorm_1.Index)('user_role_tenant_index', ['user_id', 'role_id', 'tenant_id'], { unique: true }),
    (0, typeorm_1.Index)('user_tenant_index', ['user_id', 'tenant_id']),
    (0, typeorm_1.Index)('role_index', ['role_id']),
    (0, typeorm_1.Index)('tenant_index', ['tenant_id'])
], UserRole);
//# sourceMappingURL=user-role.entity.js.map