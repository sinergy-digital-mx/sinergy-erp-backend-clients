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
exports.CustomerActivity = exports.CustomerActivityStatus = exports.CustomerActivityType = void 0;
const typeorm_1 = require("typeorm");
const customer_entity_1 = require("./customer.entity");
const user_entity_1 = require("../users/user.entity");
const tenant_entity_1 = require("../rbac/tenant.entity");
var CustomerActivityType;
(function (CustomerActivityType) {
    CustomerActivityType["CALL"] = "call";
    CustomerActivityType["EMAIL"] = "email";
    CustomerActivityType["MEETING"] = "meeting";
    CustomerActivityType["NOTE"] = "note";
    CustomerActivityType["TASK"] = "task";
    CustomerActivityType["FOLLOW_UP"] = "follow_up";
    CustomerActivityType["PURCHASE"] = "purchase";
    CustomerActivityType["SUPPORT"] = "support";
})(CustomerActivityType || (exports.CustomerActivityType = CustomerActivityType = {}));
var CustomerActivityStatus;
(function (CustomerActivityStatus) {
    CustomerActivityStatus["COMPLETED"] = "completed";
    CustomerActivityStatus["SCHEDULED"] = "scheduled";
    CustomerActivityStatus["CANCELLED"] = "cancelled";
    CustomerActivityStatus["IN_PROGRESS"] = "in_progress";
})(CustomerActivityStatus || (exports.CustomerActivityStatus = CustomerActivityStatus = {}));
let CustomerActivity = class CustomerActivity {
    id;
    customer;
    customer_id;
    user;
    user_id;
    tenant;
    tenant_id;
    type;
    status;
    title;
    description;
    activity_date;
    duration_minutes;
    outcome;
    follow_up_date;
    notes;
    metadata;
    created_at;
    updated_at;
};
exports.CustomerActivity = CustomerActivity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CustomerActivity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_entity_1.Customer, customer => customer.activities, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_id' }),
    __metadata("design:type", customer_entity_1.Customer)
], CustomerActivity.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], CustomerActivity.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], CustomerActivity.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', nullable: true }),
    __metadata("design:type", String)
], CustomerActivity.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], CustomerActivity.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], CustomerActivity.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CustomerActivityType,
        default: CustomerActivityType.NOTE,
    }),
    __metadata("design:type", String)
], CustomerActivity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CustomerActivityStatus,
        default: CustomerActivityStatus.COMPLETED,
    }),
    __metadata("design:type", String)
], CustomerActivity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], CustomerActivity.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CustomerActivity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], CustomerActivity.prototype, "activity_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true, comment: 'Duration in minutes' }),
    __metadata("design:type", Number)
], CustomerActivity.prototype, "duration_minutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], CustomerActivity.prototype, "outcome", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], CustomerActivity.prototype, "follow_up_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CustomerActivity.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], CustomerActivity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], CustomerActivity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], CustomerActivity.prototype, "updated_at", void 0);
exports.CustomerActivity = CustomerActivity = __decorate([
    (0, typeorm_1.Entity)('customer_activities'),
    (0, typeorm_1.Index)('customer_activity_tenant_index', ['customer_id', 'tenant_id']),
    (0, typeorm_1.Index)('customer_activity_user_index', ['user_id', 'tenant_id']),
    (0, typeorm_1.Index)('customer_activity_type_index', ['type', 'tenant_id']),
    (0, typeorm_1.Index)('customer_activity_date_index', ['activity_date', 'tenant_id'])
], CustomerActivity);
//# sourceMappingURL=customer-activity.entity.js.map