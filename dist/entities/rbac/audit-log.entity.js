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
exports.AuditLog = exports.AuditResult = exports.AuditAction = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("./tenant.entity");
var AuditAction;
(function (AuditAction) {
    AuditAction["PERMISSION_GRANTED"] = "permission_granted";
    AuditAction["PERMISSION_REVOKED"] = "permission_revoked";
    AuditAction["ROLE_ASSIGNED"] = "role_assigned";
    AuditAction["ROLE_UNASSIGNED"] = "role_unassigned";
    AuditAction["ROLE_CREATED"] = "role_created";
    AuditAction["ROLE_UPDATED"] = "role_updated";
    AuditAction["ROLE_DELETED"] = "role_deleted";
    AuditAction["PERMISSION_CREATED"] = "permission_created";
    AuditAction["PERMISSION_UPDATED"] = "permission_updated";
    AuditAction["PERMISSION_DELETED"] = "permission_deleted";
    AuditAction["ACCESS_GRANTED"] = "access_granted";
    AuditAction["ACCESS_DENIED"] = "access_denied";
    AuditAction["TENANT_CREATED"] = "tenant_created";
    AuditAction["TENANT_UPDATED"] = "tenant_updated";
    AuditAction["TENANT_DELETED"] = "tenant_deleted";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
var AuditResult;
(function (AuditResult) {
    AuditResult["SUCCESS"] = "success";
    AuditResult["FAILURE"] = "failure";
    AuditResult["ERROR"] = "error";
})(AuditResult || (exports.AuditResult = AuditResult = {}));
let AuditLog = class AuditLog {
    id;
    action;
    result;
    userId;
    actorId;
    tenant;
    tenantId;
    resourceType;
    resourceId;
    entityType;
    permissionAction;
    roleId;
    permissionId;
    details;
    errorMessage;
    ipAddress;
    userAgent;
    metadata;
    createdAt;
};
exports.AuditLog = AuditLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AuditLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AuditAction,
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AuditResult,
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "result", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actor_id', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "actorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], AuditLog.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resource_type', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "resourceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resource_id', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "resourceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entity_type', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "entityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'permission_action', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "permissionAction", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'role_id', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "roleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'permission_id', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "permissionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "details", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ip_address', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_agent', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], AuditLog.prototype, "createdAt", void 0);
exports.AuditLog = AuditLog = __decorate([
    (0, typeorm_1.Entity)('audit_logs'),
    (0, typeorm_1.Index)(['tenantId', 'createdAt']),
    (0, typeorm_1.Index)(['userId', 'createdAt']),
    (0, typeorm_1.Index)(['action', 'createdAt']),
    (0, typeorm_1.Index)(['result', 'createdAt'])
], AuditLog);
//# sourceMappingURL=audit-log.entity.js.map