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
exports.DocumentTypesController = exports.CustomerDocumentsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const tenant_context_service_1 = require("../rbac/services/tenant-context.service");
const customer_documents_service_1 = require("./customer-documents.service");
const upload_document_dto_1 = require("./dto/upload-document.dto");
let CustomerDocumentsController = class CustomerDocumentsController {
    documentsService;
    tenantContext;
    constructor(documentsService, tenantContext) {
        this.documentsService = documentsService;
        this.tenantContext = tenantContext;
    }
    async uploadDocument(customerId, dto, file, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const userId = req.user?.sub || 'system';
        return this.documentsService.uploadDocument(tenantId, parseInt(customerId), dto, file, userId);
    }
    async getDocuments(customerId, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.documentsService.getCustomerDocuments(tenantId, parseInt(customerId));
    }
    async getDocument(documentId, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.documentsService.getDocument(tenantId, documentId);
    }
    async deleteDocument(documentId, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        await this.documentsService.deleteDocument(tenantId, documentId);
        return { success: true };
    }
    async updateStatus(documentId, body, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.documentsService.updateDocumentStatus(tenantId, documentId, body.status, body.notes);
    }
};
exports.CustomerDocumentsController = CustomerDocumentsController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'CustomerDocument', action: 'Create' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)(new common_1.ParseFilePipe({
        validators: [
            new common_1.MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
            new common_1.FileTypeValidator({
                fileType: /(jpg|jpeg|png|pdf|doc|docx)$/,
            }),
        ],
    }))),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, upload_document_dto_1.UploadDocumentDto, Object, Object]),
    __metadata("design:returntype", Promise)
], CustomerDocumentsController.prototype, "uploadDocument", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'CustomerDocument', action: 'Read' }),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomerDocumentsController.prototype, "getDocuments", null);
__decorate([
    (0, common_1.Get)(':documentId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'CustomerDocument', action: 'Read' }),
    __param(0, (0, common_1.Param)('documentId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomerDocumentsController.prototype, "getDocument", null);
__decorate([
    (0, common_1.Delete)(':documentId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'CustomerDocument', action: 'Delete' }),
    __param(0, (0, common_1.Param)('documentId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomerDocumentsController.prototype, "deleteDocument", null);
__decorate([
    (0, common_1.Patch)(':documentId/status'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'CustomerDocument', action: 'Update' }),
    __param(0, (0, common_1.Param)('documentId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CustomerDocumentsController.prototype, "updateStatus", null);
exports.CustomerDocumentsController = CustomerDocumentsController = __decorate([
    (0, common_1.Controller)('tenant/customers/:customerId/documents'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [customer_documents_service_1.CustomerDocumentsService,
        tenant_context_service_1.TenantContextService])
], CustomerDocumentsController);
let DocumentTypesController = class DocumentTypesController {
    documentsService;
    tenantContext;
    constructor(documentsService, tenantContext) {
        this.documentsService = documentsService;
        this.tenantContext = tenantContext;
    }
    async getDocumentTypes(req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.documentsService.getDocumentTypes(tenantId);
    }
    async createDocumentType(body, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.documentsService.createDocumentType(tenantId, body);
    }
};
exports.DocumentTypesController = DocumentTypesController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'CustomerDocument', action: 'Read' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DocumentTypesController.prototype, "getDocumentTypes", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'CustomerDocument', action: 'Create' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DocumentTypesController.prototype, "createDocumentType", null);
exports.DocumentTypesController = DocumentTypesController = __decorate([
    (0, common_1.Controller)('tenant/document-types'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [customer_documents_service_1.CustomerDocumentsService,
        tenant_context_service_1.TenantContextService])
], DocumentTypesController);
//# sourceMappingURL=customer-documents.controller.js.map