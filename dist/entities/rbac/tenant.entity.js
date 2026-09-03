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
exports.RBACTenant = void 0;
const typeorm_1 = require("typeorm");
const class_validator_1 = require("class-validator");
let RBACTenant = class RBACTenant {
    id;
    name;
    subdomain;
    legacy_tenant_id;
    is_active;
    roles;
    user_roles;
    created_at;
    updated_at;
};
exports.RBACTenant = RBACTenant;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RBACTenant.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 100),
    __metadata("design:type", String)
], RBACTenant.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 50),
    __metadata("design:type", String)
], RBACTenant.prototype, "subdomain", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RBACTenant.prototype, "legacy_tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], RBACTenant.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('Role', 'tenant'),
    __metadata("design:type", Array)
], RBACTenant.prototype, "roles", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('UserRole', 'tenant'),
    __metadata("design:type", Array)
], RBACTenant.prototype, "user_roles", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], RBACTenant.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], RBACTenant.prototype, "updated_at", void 0);
exports.RBACTenant = RBACTenant = __decorate([
    (0, typeorm_1.Entity)('rbac_tenants'),
    (0, typeorm_1.Index)('name_index', ['name']),
    (0, typeorm_1.Index)('subdomain_index', ['subdomain'])
], RBACTenant);
//# sourceMappingURL=tenant.entity.js.map