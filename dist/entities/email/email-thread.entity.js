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
exports.EmailThread = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const user_entity_1 = require("../users/user.entity");
const lead_entity_1 = require("../leads/lead.entity");
const email_message_entity_1 = require("./email-message.entity");
const entity_registry_entity_1 = require("../entity-registry/entity-registry.entity");
let EmailThread = class EmailThread {
    id;
    tenant;
    tenant_id;
    entityType;
    entity_type_id;
    entity_id;
    get entity_type() {
        return this.entityType?.code || null;
    }
    lead;
    lead_id;
    subject;
    email_from;
    email_to;
    status;
    last_message_at;
    message_count;
    is_read;
    createdByUser;
    created_by;
    created_at;
    updated_at;
    messages;
};
exports.EmailThread = EmailThread;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], EmailThread.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], EmailThread.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], EmailThread.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => entity_registry_entity_1.EntityRegistry, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'entity_type_id' }),
    __metadata("design:type", entity_registry_entity_1.EntityRegistry)
], EmailThread.prototype, "entityType", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], EmailThread.prototype, "entity_type_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EmailThread.prototype, "entity_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => lead_entity_1.Lead, { onDelete: 'CASCADE', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'lead_id' }),
    __metadata("design:type", lead_entity_1.Lead)
], EmailThread.prototype, "lead", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], EmailThread.prototype, "lead_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EmailThread.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EmailThread.prototype, "email_from", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EmailThread.prototype, "email_to", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'draft' }),
    __metadata("design:type", String)
], EmailThread.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], EmailThread.prototype, "last_message_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], EmailThread.prototype, "message_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], EmailThread.prototype, "is_read", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], EmailThread.prototype, "createdByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], EmailThread.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], EmailThread.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], EmailThread.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => email_message_entity_1.EmailMessage, (message) => message.thread),
    __metadata("design:type", Array)
], EmailThread.prototype, "messages", void 0);
exports.EmailThread = EmailThread = __decorate([
    (0, typeorm_1.Entity)('email_threads'),
    (0, typeorm_1.Index)(['tenant_id', 'entity_type_id', 'entity_id']),
    (0, typeorm_1.Index)(['tenant_id', 'status']),
    (0, typeorm_1.Index)(['lead_id'])
], EmailThread);
//# sourceMappingURL=email-thread.entity.js.map