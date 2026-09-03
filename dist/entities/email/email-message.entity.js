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
exports.EmailMessage = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const email_thread_entity_1 = require("./email-thread.entity");
let EmailMessage = class EmailMessage {
    id;
    tenant;
    tenant_id;
    thread;
    thread_id;
    message_id;
    in_reply_to;
    from_email;
    to_email;
    cc;
    bcc;
    subject;
    body;
    body_html;
    direction;
    status;
    external_provider;
    external_id;
    created_at;
    received_at;
    read_at;
};
exports.EmailMessage = EmailMessage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], EmailMessage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], EmailMessage.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], EmailMessage.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => email_thread_entity_1.EmailThread, (thread) => thread.messages, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'thread_id' }),
    __metadata("design:type", email_thread_entity_1.EmailThread)
], EmailMessage.prototype, "thread", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EmailMessage.prototype, "thread_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EmailMessage.prototype, "message_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], EmailMessage.prototype, "in_reply_to", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EmailMessage.prototype, "from_email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EmailMessage.prototype, "to_email", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], EmailMessage.prototype, "cc", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], EmailMessage.prototype, "bcc", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EmailMessage.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], EmailMessage.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], EmailMessage.prototype, "body_html", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'outbound' }),
    __metadata("design:type", String)
], EmailMessage.prototype, "direction", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'pending' }),
    __metadata("design:type", String)
], EmailMessage.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'gmail' }),
    __metadata("design:type", String)
], EmailMessage.prototype, "external_provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], EmailMessage.prototype, "external_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], EmailMessage.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], EmailMessage.prototype, "received_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], EmailMessage.prototype, "read_at", void 0);
exports.EmailMessage = EmailMessage = __decorate([
    (0, typeorm_1.Entity)('email_messages'),
    (0, typeorm_1.Index)(['thread_id', 'created_at']),
    (0, typeorm_1.Index)(['tenant_id', 'external_id'])
], EmailMessage);
//# sourceMappingURL=email-message.entity.js.map