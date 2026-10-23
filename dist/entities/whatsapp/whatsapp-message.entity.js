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
exports.WhatsappMessage = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
let WhatsappMessage = class WhatsappMessage {
    id;
    tenant;
    tenant_id;
    session_name;
    to_phone;
    chat_id;
    type;
    body;
    file_name;
    file_mimetype;
    status;
    error_message;
    waha_message_id;
    reference_type;
    reference_id;
    sent_at;
    delivered_at;
    read_at;
    created_by;
    created_at;
    updated_at;
};
exports.WhatsappMessage = WhatsappMessage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WhatsappMessage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], WhatsappMessage.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], WhatsappMessage.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 80 }),
    __metadata("design:type", String)
], WhatsappMessage.prototype, "session_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 80 }),
    __metadata("design:type", String)
], WhatsappMessage.prototype, "to_phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], WhatsappMessage.prototype, "chat_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, default: 'text' }),
    __metadata("design:type", String)
], WhatsappMessage.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], WhatsappMessage.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], WhatsappMessage.prototype, "file_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120, nullable: true }),
    __metadata("design:type", Object)
], WhatsappMessage.prototype, "file_mimetype", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, default: 'queued' }),
    __metadata("design:type", String)
], WhatsappMessage.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], WhatsappMessage.prototype, "error_message", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 190, nullable: true }),
    __metadata("design:type", Object)
], WhatsappMessage.prototype, "waha_message_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 60, nullable: true }),
    __metadata("design:type", Object)
], WhatsappMessage.prototype, "reference_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], WhatsappMessage.prototype, "reference_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], WhatsappMessage.prototype, "sent_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], WhatsappMessage.prototype, "delivered_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], WhatsappMessage.prototype, "read_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], WhatsappMessage.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], WhatsappMessage.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], WhatsappMessage.prototype, "updated_at", void 0);
exports.WhatsappMessage = WhatsappMessage = __decorate([
    (0, typeorm_1.Entity)('whatsapp_messages'),
    (0, typeorm_1.Index)('idx_whatsapp_messages_tenant_created', ['tenant_id', 'created_at']),
    (0, typeorm_1.Index)('idx_whatsapp_messages_tenant_status', ['tenant_id', 'status']),
    (0, typeorm_1.Index)('idx_whatsapp_messages_waha_id', ['waha_message_id']),
    (0, typeorm_1.Index)('idx_whatsapp_messages_reference', ['tenant_id', 'reference_type', 'reference_id'])
], WhatsappMessage);
//# sourceMappingURL=whatsapp-message.entity.js.map