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
exports.CustomerAssignmentChange = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const user_entity_1 = require("../users/user.entity");
const customer_entity_1 = require("./customer.entity");
let CustomerAssignmentChange = class CustomerAssignmentChange {
    id;
    tenant;
    tenant_id;
    customer;
    customer_id;
    type;
    title;
    description;
    actor;
    actor_id;
    occurred_at;
    changes;
    created_at;
};
exports.CustomerAssignmentChange = CustomerAssignmentChange;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CustomerAssignmentChange.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], CustomerAssignmentChange.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 36 }),
    __metadata("design:type", String)
], CustomerAssignmentChange.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_entity_1.Customer, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_id' }),
    __metadata("design:type", customer_entity_1.Customer)
], CustomerAssignmentChange.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], CustomerAssignmentChange.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], CustomerAssignmentChange.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], CustomerAssignmentChange.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], CustomerAssignmentChange.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'actor_id' }),
    __metadata("design:type", Object)
], CustomerAssignmentChange.prototype, "actor", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 36, nullable: true }),
    __metadata("design:type", Object)
], CustomerAssignmentChange.prototype, "actor_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], CustomerAssignmentChange.prototype, "occurred_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], CustomerAssignmentChange.prototype, "changes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], CustomerAssignmentChange.prototype, "created_at", void 0);
exports.CustomerAssignmentChange = CustomerAssignmentChange = __decorate([
    (0, typeorm_1.Entity)('customer_assignment_changes'),
    (0, typeorm_1.Index)('idx_customer_assignment_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('idx_customer_assignment_customer', ['customer_id']),
    (0, typeorm_1.Index)('idx_customer_assignment_occurred', ['customer_id', 'occurred_at'])
], CustomerAssignmentChange);
//# sourceMappingURL=customer-assignment-change.entity.js.map