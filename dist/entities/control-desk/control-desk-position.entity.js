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
exports.ControlDeskPosition = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const billing_branch_entity_1 = require("../billing/billing-branch.entity");
let ControlDeskPosition = class ControlDeskPosition {
    id;
    tenant;
    tenant_id;
    billing_branch;
    billing_branch_id;
    code;
    name;
    row;
    col;
    sort_order;
    is_active;
    created_at;
    updated_at;
};
exports.ControlDeskPosition = ControlDeskPosition;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ControlDeskPosition.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], ControlDeskPosition.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ControlDeskPosition.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => billing_branch_entity_1.BillingBranch, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'billing_branch_id' }),
    __metadata("design:type", billing_branch_entity_1.BillingBranch)
], ControlDeskPosition.prototype, "billing_branch", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ControlDeskPosition.prototype, "billing_branch_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], ControlDeskPosition.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], ControlDeskPosition.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ControlDeskPosition.prototype, "row", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ControlDeskPosition.prototype, "col", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ControlDeskPosition.prototype, "sort_order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: 1 }),
    __metadata("design:type", Boolean)
], ControlDeskPosition.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ControlDeskPosition.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ControlDeskPosition.prototype, "updated_at", void 0);
exports.ControlDeskPosition = ControlDeskPosition = __decorate([
    (0, typeorm_1.Entity)('control_desk_positions'),
    (0, typeorm_1.Index)('idx_cd_positions_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('idx_cd_positions_branch', ['tenant_id', 'billing_branch_id']),
    (0, typeorm_1.Index)('uq_cd_positions_branch_code', ['tenant_id', 'billing_branch_id', 'code'], {
        unique: true,
    })
], ControlDeskPosition);
//# sourceMappingURL=control-desk-position.entity.js.map