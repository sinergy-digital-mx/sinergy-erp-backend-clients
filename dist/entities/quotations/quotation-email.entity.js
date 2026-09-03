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
exports.QuotationEmail = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const user_entity_1 = require("../users/user.entity");
const quotation_entity_1 = require("./quotation.entity");
let QuotationEmail = class QuotationEmail {
    id;
    tenant;
    tenant_id;
    quotation;
    quotation_id;
    to_email;
    cc;
    bcc;
    subject;
    message;
    sender;
    sent_by;
    sent_at;
};
exports.QuotationEmail = QuotationEmail;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], QuotationEmail.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], QuotationEmail.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], QuotationEmail.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => quotation_entity_1.Quotation, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'quotation_id' }),
    __metadata("design:type", quotation_entity_1.Quotation)
], QuotationEmail.prototype, "quotation", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], QuotationEmail.prototype, "quotation_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], QuotationEmail.prototype, "to_email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], QuotationEmail.prototype, "cc", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], QuotationEmail.prototype, "bcc", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], QuotationEmail.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], QuotationEmail.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'sent_by' }),
    __metadata("design:type", Object)
], QuotationEmail.prototype, "sender", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], QuotationEmail.prototype, "sent_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], QuotationEmail.prototype, "sent_at", void 0);
exports.QuotationEmail = QuotationEmail = __decorate([
    (0, typeorm_1.Entity)('inv_s_quotation_emails'),
    (0, typeorm_1.Index)('idx_qt_email_quotation', ['quotation_id']),
    (0, typeorm_1.Index)('idx_qt_email_tenant', ['tenant_id'])
], QuotationEmail);
//# sourceMappingURL=quotation-email.entity.js.map