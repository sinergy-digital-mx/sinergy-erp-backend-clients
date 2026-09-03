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
exports.Permission = void 0;
const typeorm_1 = require("typeorm");
const class_validator_1 = require("class-validator");
const entity_registry_entity_1 = require("../entity-registry/entity-registry.entity");
let Permission = class Permission {
    id;
    module;
    module_id;
    entity_registry;
    entity_registry_id;
    action;
    description;
    is_system_permission;
    role_permissions;
    created_at;
    updated_at;
    get entity_type() {
        return this.entity_registry?.code || '';
    }
};
exports.Permission = Permission;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Permission.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('Module', 'permissions', { onDelete: 'CASCADE', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'module_id' }),
    __metadata("design:type", Object)
], Permission.prototype, "module", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Permission.prototype, "module_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => entity_registry_entity_1.EntityRegistry, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'entity_registry_id' }),
    __metadata("design:type", entity_registry_entity_1.EntityRegistry)
], Permission.prototype, "entity_registry", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Permission.prototype, "entity_registry_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 50),
    __metadata("design:type", String)
], Permission.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 255),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], Permission.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], Permission.prototype, "is_system_permission", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('RolePermission', 'permission'),
    __metadata("design:type", Array)
], Permission.prototype, "role_permissions", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Permission.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Permission.prototype, "updated_at", void 0);
exports.Permission = Permission = __decorate([
    (0, typeorm_1.Entity)('rbac_permissions'),
    (0, typeorm_1.Index)('module_action_index', ['module_id', 'action'], { unique: true }),
    (0, typeorm_1.Index)('action_index', ['action']),
    (0, typeorm_1.Index)('module_index', ['module_id']),
    (0, typeorm_1.Index)('entity_registry_index', ['entity_registry_id'])
], Permission);
//# sourceMappingURL=permission.entity.js.map