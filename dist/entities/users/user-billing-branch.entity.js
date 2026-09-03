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
exports.UserBillingBranch = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const user_entity_1 = require("./user.entity");
const billing_branch_entity_1 = require("../billing/billing-branch.entity");
let UserBillingBranch = class UserBillingBranch {
    id;
    tenant;
    tenant_id;
    user;
    user_id;
    billing_branch;
    billing_branch_id;
    is_primary;
    created_at;
};
exports.UserBillingBranch = UserBillingBranch;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserBillingBranch.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], UserBillingBranch.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserBillingBranch.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserBillingBranch.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserBillingBranch.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => billing_branch_entity_1.BillingBranch, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'billing_branch_id' }),
    __metadata("design:type", billing_branch_entity_1.BillingBranch)
], UserBillingBranch.prototype, "billing_branch", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserBillingBranch.prototype, "billing_branch_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: 0 }),
    __metadata("design:type", Boolean)
], UserBillingBranch.prototype, "is_primary", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], UserBillingBranch.prototype, "created_at", void 0);
exports.UserBillingBranch = UserBillingBranch = __decorate([
    (0, typeorm_1.Entity)('user_billing_branches'),
    (0, typeorm_1.Index)('idx_user_billing_branches_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('idx_user_billing_branches_user', ['tenant_id', 'user_id']),
    (0, typeorm_1.Index)('uq_user_billing_branch', ['user_id', 'billing_branch_id'], { unique: true })
], UserBillingBranch);
//# sourceMappingURL=user-billing-branch.entity.js.map