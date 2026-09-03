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
exports.EmailTemplatesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const tenant_context_service_1 = require("../rbac/services/tenant-context.service");
const email_templates_service_1 = require("./email-templates.service");
const create_email_template_dto_1 = require("./dto/create-email-template.dto");
const query_email_template_dto_1 = require("./dto/query-email-template.dto");
const render_email_template_dto_1 = require("./dto/render-email-template.dto");
const send_email_template_dto_1 = require("./dto/send-email-template.dto");
const update_email_template_dto_1 = require("./dto/update-email-template.dto");
let EmailTemplatesController = class EmailTemplatesController {
    service;
    tenantContext;
    constructor(service, tenantContext) {
        this.service = service;
        this.tenantContext = tenantContext;
    }
    async create(dto) {
        const { tenantId, userId } = this.requireTenantContext();
        return this.service.create(tenantId, dto, userId);
    }
    async findAll(query) {
        const { tenantId } = this.requireTenantContext();
        return this.service.findAll(tenantId, query);
    }
    async getAvailableVariables() {
        const { tenantId } = this.requireTenantContext();
        return this.service.getAvailableVariables(tenantId);
    }
    async preview(dto) {
        const { tenantId } = this.requireTenantContext();
        return this.service.preview(tenantId, dto);
    }
    async findOne(id) {
        const { tenantId } = this.requireTenantContext();
        return this.service.findOne(tenantId, id);
    }
    async update(id, dto) {
        const { tenantId, userId } = this.requireTenantContext();
        return this.service.update(tenantId, id, dto, userId);
    }
    async remove(id) {
        const { tenantId, userId } = this.requireTenantContext();
        return this.service.remove(tenantId, id, userId);
    }
    async render(id, dto) {
        const { tenantId } = this.requireTenantContext();
        return this.service.render(tenantId, id, dto);
    }
    async send(id, dto) {
        const { tenantId } = this.requireTenantContext();
        return this.service.send(tenantId, id, dto);
    }
    requireTenantContext() {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return {
            tenantId,
            userId: this.tenantContext.getCurrentUserId(),
        };
    }
};
exports.EmailTemplatesController = EmailTemplatesController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'email-templates', action: 'Create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Create an email template for the current tenant' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Email template created' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_email_template_dto_1.CreateEmailTemplateDto]),
    __metadata("design:returntype", Promise)
], EmailTemplatesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'email-templates', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'List email templates for the current tenant' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_email_template_dto_1.QueryEmailTemplateDto]),
    __metadata("design:returntype", Promise)
], EmailTemplatesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('variables'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'email-templates', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get template variables available for the current tenant' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmailTemplatesController.prototype, "getAvailableVariables", null);
__decorate([
    (0, common_1.Post)('preview'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'email-templates', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Render an unsaved email template preview' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [render_email_template_dto_1.PreviewEmailTemplateDto]),
    __metadata("design:returntype", Promise)
], EmailTemplatesController.prototype, "preview", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'email-templates', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get an email template by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmailTemplatesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'email-templates', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update an email template' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_email_template_dto_1.UpdateEmailTemplateDto]),
    __metadata("design:returntype", Promise)
], EmailTemplatesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(200),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'email-templates', action: 'Delete' }),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an email template' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmailTemplatesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/render'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'email-templates', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Render a saved email template with provided variables' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, render_email_template_dto_1.RenderEmailTemplateDto]),
    __metadata("design:returntype", Promise)
], EmailTemplatesController.prototype, "render", null);
__decorate([
    (0, common_1.Post)(':id/send'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'email-templates', action: 'Send' }),
    (0, swagger_1.ApiOperation)({ summary: 'Render and send a saved email template using the active tenant mailer configuration' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, send_email_template_dto_1.SendEmailTemplateDto]),
    __metadata("design:returntype", Promise)
], EmailTemplatesController.prototype, "send", null);
exports.EmailTemplatesController = EmailTemplatesController = __decorate([
    (0, common_1.Controller)('tenant/email-templates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, swagger_1.ApiTags)('Email Templates'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [email_templates_service_1.EmailTemplatesService,
        tenant_context_service_1.TenantContextService])
], EmailTemplatesController);
//# sourceMappingURL=email-templates.controller.js.map