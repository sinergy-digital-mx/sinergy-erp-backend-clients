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
exports.RolePermission = void 0;
const typeorm_1 = require("typeorm");
const class_validator_1 = require("class-validator");
let RolePermission = class RolePermission {
    id;
    role;
    role_id;
    permission;
    permission_id;
    created_at;
};
exports.RolePermission = RolePermission;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RolePermission.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('Role', 'role_permissions', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'role_id' }),
    __metadata("design:type", Object)
], RolePermission.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'role_id' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RolePermission.prototype, "role_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('Permission', 'role_permissions', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'permission_id' }),
    __metadata("design:type", Object)
], RolePermission.prototype, "permission", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'permission_id' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RolePermission.prototype, "permission_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], RolePermission.prototype, "created_at", void 0);
exports.RolePermission = RolePermission = __decorate([
    (0, typeorm_1.Entity)('rbac_role_permissions'),
    (0, typeorm_1.Index)('role_permission_index', ['role_id', 'permission_id'], { unique: true }),
    (0, typeorm_1.Index)('role_index', ['role_id']),
    (0, typeorm_1.Index)('permission_index', ['permission_id'])
], RolePermission);
//# sourceMappingURL=role-permission.entity.js.map