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
exports.EmailThreadController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../../api/auth/jwt-auth.guard");
const permission_guard_1 = require("../../../api/rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../../../api/rbac/decorators/require-permissions.decorator");
const tenant_context_service_1 = require("../../../api/rbac/services/tenant-context.service");
const email_thread_service_1 = require("../services/email-thread.service");
const email_message_service_1 = require("../services/email-message.service");
const gmail_send_service_1 = require("../services/gmail-send.service");
let EmailThreadController = class EmailThreadController {
    threadService;
    messageService;
    gmailSendService;
    tenantContext;
    constructor(threadService, messageService, gmailSendService, tenantContext) {
        this.threadService = threadService;
        this.messageService = messageService;
        this.gmailSendService = gmailSendService;
        this.tenantContext = tenantContext;
        console.log('[EmailThreadController] Initialized');
    }
    async createThread(req, body) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const userId = req.user.sub;
        const result = await this.threadService.createThread(tenantId, body.entityTypeId, body.entityId, body.emailTo, body.subject, body.body, userId);
        return {
            success: true,
            data: result,
        };
    }
    async getGmailStatus() {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const isConfigured = await this.gmailSendService.isGmailConfigured(tenantId);
        return {
            success: true,
            gmailConfigured: isConfigured,
        };
    }
    async testGmailConfig() {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const result = await this.gmailSendService.testGmailConfig(tenantId);
        return {
            success: result.success,
            message: result.message,
        };
    }
    async getThreadsByEntity(entityTypeId, entityId, status, archived) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        if (entityTypeId && entityId) {
            const threads = await this.threadService.getThreadsByEntity(tenantId, parseInt(entityTypeId, 10), entityId);
            return {
                success: true,
                data: threads,
            };
        }
        const filters = {};
        if (entityTypeId)
            filters.entityTypeId = parseInt(entityTypeId, 10);
        if (status)
            filters.status = status;
        if (archived !== undefined)
            filters.archived = archived === 'false' ? false : true;
        const threads = await this.threadService.getAllThreads(tenantId, filters);
        return {
            success: true,
            data: threads,
        };
    }
    async getThreadDetails(threadId) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const thread = await this.threadService.getThreadDetails(tenantId, threadId);
        return {
            success: true,
            data: thread,
        };
    }
    async updateThreadStatus(threadId, body) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const thread = await this.threadService.updateThreadStatus(tenantId, threadId, body.status);
        return {
            success: true,
            data: thread,
        };
    }
    async markThreadAsRead(threadId) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const thread = await this.threadService.markThreadAsRead(tenantId, threadId);
        return {
            success: true,
            data: thread,
        };
    }
    async sendMessage(threadId, body) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const message = await this.messageService.sendMessage(tenantId, threadId, body.fromEmail, body.toEmail, body.subject, body.body, body.bodyHtml, body.cc, body.bcc);
        return {
            success: true,
            data: message,
        };
    }
    async getThreadMessages(threadId) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const messages = await this.messageService.getThreadMessages(tenantId, threadId);
        return {
            success: true,
            data: messages,
        };
    }
    async markMessageAsRead(threadId, messageId) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const message = await this.messageService.markAsRead(tenantId, messageId);
        return {
            success: true,
            data: message,
        };
    }
    async markAllMessagesAsRead(threadId) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        await this.messageService.markThreadMessagesAsRead(tenantId, threadId);
        return {
            success: true,
            message: 'All messages marked as read',
        };
    }
    async sendMessageViaGmail(threadId, body) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const gmailMessageId = await this.gmailSendService.sendViaGmail(tenantId, threadId, body.fromEmail, body.toEmail, body.subject, body.body, body.bodyHtml, body.cc, body.bcc);
        return {
            success: true,
            message: 'Email enviado a través de Gmail',
            gmailMessageId,
        };
    }
};
exports.EmailThreadController = EmailThreadController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'EmailThread', action: 'Create' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EmailThreadController.prototype, "createThread", null);
__decorate([
    (0, common_1.Get)('gmail/status'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'EmailMessage', action: 'Read' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmailThreadController.prototype, "getGmailStatus", null);
__decorate([
    (0, common_1.Post)('gmail/test'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'EmailMessage', action: 'Read' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmailThreadController.prototype, "testGmailConfig", null);
__decorate([
    (0, common_1.Get)('by-entity'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'EmailThread', action: 'Read' }),
    __param(0, (0, common_1.Query)('entityTypeId')),
    __param(1, (0, common_1.Query)('entityId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('archived')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], EmailThreadController.prototype, "getThreadsByEntity", null);
__decorate([
    (0, common_1.Get)(':threadId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'EmailThread', action: 'Read' }),
    __param(0, (0, common_1.Param)('threadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmailThreadController.prototype, "getThreadDetails", null);
__decorate([
    (0, common_1.Put)(':threadId/status'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'EmailThread', action: 'Update' }),
    __param(0, (0, common_1.Param)('threadId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailThreadController.prototype, "updateThreadStatus", null);
__decorate([
    (0, common_1.Put)(':threadId/mark-read'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'EmailThread', action: 'Update' }),
    __param(0, (0, common_1.Param)('threadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmailThreadController.prototype, "markThreadAsRead", null);
__decorate([
    (0, common_1.Post)(':threadId/messages'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'EmailMessage', action: 'Create' }),
    __param(0, (0, common_1.Param)('threadId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailThreadController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)(':threadId/messages'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'EmailMessage', action: 'Read' }),
    __param(0, (0, common_1.Param)('threadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmailThreadController.prototype, "getThreadMessages", null);
__decorate([
    (0, common_1.Put)(':threadId/messages/:messageId/mark-read'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'EmailMessage', action: 'Update' }),
    __param(0, (0, common_1.Param)('threadId')),
    __param(1, (0, common_1.Param)('messageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EmailThreadController.prototype, "markMessageAsRead", null);
__decorate([
    (0, common_1.Put)(':threadId/messages/mark-all-read'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'EmailMessage', action: 'Update' }),
    __param(0, (0, common_1.Param)('threadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmailThreadController.prototype, "markAllMessagesAsRead", null);
__decorate([
    (0, common_1.Post)(':threadId/messages/send-via-gmail'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'EmailMessage', action: 'Create' }),
    __param(0, (0, common_1.Param)('threadId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailThreadController.prototype, "sendMessageViaGmail", null);
exports.EmailThreadController = EmailThreadController = __decorate([
    (0, common_1.Controller)('tenant/email-threads'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [email_thread_service_1.EmailThreadService,
        email_message_service_1.EmailMessageService,
        gmail_send_service_1.GmailSendService,
        tenant_context_service_1.TenantContextService])
], EmailThreadController);
//# sourceMappingURL=email-thread.controller.js.map