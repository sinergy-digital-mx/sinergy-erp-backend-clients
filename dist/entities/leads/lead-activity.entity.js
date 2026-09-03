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
exports.LeadActivity = exports.ActivityStatus = exports.ActivityType = void 0;
const typeorm_1 = require("typeorm");
const lead_entity_1 = require("./lead.entity");
const user_entity_1 = require("../users/user.entity");
const tenant_entity_1 = require("../rbac/tenant.entity");
var ActivityType;
(function (ActivityType) {
    ActivityType["CALL"] = "call";
    ActivityType["EMAIL"] = "email";
    ActivityType["MEETING"] = "meeting";
    ActivityType["NOTE"] = "note";
    ActivityType["TASK"] = "task";
    ActivityType["FOLLOW_UP"] = "follow_up";
})(ActivityType || (exports.ActivityType = ActivityType = {}));
var ActivityStatus;
(function (ActivityStatus) {
    ActivityStatus["COMPLETED"] = "completed";
    ActivityStatus["SCHEDULED"] = "scheduled";
    ActivityStatus["CANCELLED"] = "cancelled";
    ActivityStatus["IN_PROGRESS"] = "in_progress";
})(ActivityStatus || (exports.ActivityStatus = ActivityStatus = {}));
let LeadActivity = class LeadActivity {
    id;
    lead;
    lead_id;
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
exports.LeadActivity = LeadActivity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], LeadActivity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => lead_entity_1.Lead, lead => lead.activities, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'lead_id' }),
    __metadata("design:type", lead_entity_1.Lead)
], LeadActivity.prototype, "lead", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lead_id' }),
    __metadata("design:type", Number)
], LeadActivity.prototype, "lead_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], LeadActivity.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', nullable: true }),
    __metadata("design:type", String)
], LeadActivity.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], LeadActivity.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], LeadActivity.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ActivityType,
        default: ActivityType.CALL,
    }),
    __metadata("design:type", String)
], LeadActivity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ActivityStatus,
        default: ActivityStatus.COMPLETED,
    }),
    __metadata("design:type", String)
], LeadActivity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], LeadActivity.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], LeadActivity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], LeadActivity.prototype, "activity_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true, comment: 'Duration in minutes' }),
    __metadata("design:type", Number)
], LeadActivity.prototype, "duration_minutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], LeadActivity.prototype, "outcome", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], LeadActivity.prototype, "follow_up_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], LeadActivity.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], LeadActivity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], LeadActivity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], LeadActivity.prototype, "updated_at", void 0);
exports.LeadActivity = LeadActivity = __decorate([
    (0, typeorm_1.Entity)('lead_activities'),
    (0, typeorm_1.Index)('lead_activity_tenant_index', ['lead_id', 'tenant_id']),
    (0, typeorm_1.Index)('lead_activity_user_index', ['user_id', 'tenant_id']),
    (0, typeorm_1.Index)('lead_activity_type_index', ['type', 'tenant_id']),
    (0, typeorm_1.Index)('lead_activity_date_index', ['activity_date', 'tenant_id'])
], LeadActivity);
//# sourceMappingURL=lead-activity.entity.js.map