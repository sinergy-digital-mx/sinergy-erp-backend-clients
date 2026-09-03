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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailMessageService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const email_message_entity_1 = require("../../../entities/email/email-message.entity");
const email_thread_entity_1 = require("../../../entities/email/email-thread.entity");
let EmailMessageService = class EmailMessageService {
    messageRepo;
    threadRepo;
    constructor(messageRepo, threadRepo) {
        this.messageRepo = messageRepo;
        this.threadRepo = threadRepo;
    }
    async sendMessage(tenantId, threadId, fromEmail, toEmail, subject, body, bodyHtml, cc, bcc) {
        const thread = await this.threadRepo.findOne({
            where: { id: threadId, tenant_id: tenantId },
        });
        if (!thread) {
            throw new common_1.NotFoundException('Thread not found');
        }
        const message = this.messageRepo.create({
            tenant_id: tenantId,
            thread_id: threadId,
            message_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            from_email: fromEmail,
            to_email: toEmail,
            cc,
            bcc,
            subject,
            body,
            body_html: bodyHtml,
            direction: 'outbound',
            status: 'pending',
            external_provider: 'gmail',
        });
        const savedMessage = await this.messageRepo.save(message);
        await this.threadRepo.update(threadId, {
            last_message_at: new Date(),
            message_count: () => 'message_count + 1',
            status: 'sent',
        });
        return savedMessage;
    }
    async receiveMessage(tenantId, threadId, externalId, fromEmail, toEmail, subject, body, bodyHtml, cc, bcc, inReplyTo) {
        const thread = await this.threadRepo.findOne({
            where: { id: threadId, tenant_id: tenantId },
        });
        if (!thread) {
            throw new common_1.NotFoundException('Thread not found');
        }
        const existingMessage = await this.messageRepo.findOne({
            where: { external_id: externalId, tenant_id: tenantId },
        });
        if (existingMessage) {
            throw new common_1.BadRequestException('Message already exists');
        }
        const message = this.messageRepo.create({
            tenant_id: tenantId,
            thread_id: threadId,
            message_id: externalId,
            external_id: externalId,
            from_email: fromEmail,
            to_email: toEmail,
            cc,
            bcc,
            subject,
            body,
            body_html: bodyHtml,
            in_reply_to: inReplyTo,
            direction: 'inbound',
            status: 'received',
            external_provider: 'gmail',
            received_at: new Date(),
        });
        const savedMessage = await this.messageRepo.save(message);
        await this.threadRepo.update(threadId, {
            last_message_at: new Date(),
            message_count: () => 'message_count + 1',
            status: 'replied',
            is_read: false,
        });
        return savedMessage;
    }
    async getThreadMessages(tenantId, threadId) {
        const thread = await this.threadRepo.findOne({
            where: { id: threadId, tenant_id: tenantId },
        });
        if (!thread) {
            throw new common_1.NotFoundException('Thread not found');
        }
        return this.messageRepo.find({
            where: { thread_id: threadId, tenant_id: tenantId },
            order: { created_at: 'ASC' },
        });
    }
    async markAsRead(tenantId, messageId) {
        const message = await this.messageRepo.findOne({
            where: { id: messageId, tenant_id: tenantId },
        });
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        message.read_at = new Date();
        return this.messageRepo.save(message);
    }
    async markThreadMessagesAsRead(tenantId, threadId) {
        await this.messageRepo.update({ thread_id: threadId, tenant_id: tenantId }, { read_at: new Date() });
    }
    async getMessageById(tenantId, messageId) {
        const message = await this.messageRepo.findOne({
            where: { id: messageId, tenant_id: tenantId },
        });
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        return message;
    }
};
exports.EmailMessageService = EmailMessageService;
exports.EmailMessageService = EmailMessageService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(email_message_entity_1.EmailMessage)),
    __param(1, (0, typeorm_1.InjectRepository)(email_thread_entity_1.EmailThread)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], EmailMessageService);
//# sourceMappingURL=email-message.service.js.map