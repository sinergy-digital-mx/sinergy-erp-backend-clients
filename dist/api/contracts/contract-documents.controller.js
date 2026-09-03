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
exports.ContractDocumentsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const tenant_context_service_1 = require("../rbac/services/tenant-context.service");
const contract_documents_service_1 = require("./contract-documents.service");
let ContractDocumentsController = class ContractDocumentsController {
    documentsService;
    tenantContext;
    constructor(documentsService, tenantContext) {
        this.documentsService = documentsService;
        this.tenantContext = tenantContext;
    }
    async uploadDocument(contractId, notes, file, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const userId = req.user?.sub || 'system';
        return this.documentsService.uploadDocument(tenantId, contractId, file, userId, notes);
    }
    async getDocuments(contractId, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.documentsService.getContractDocuments(tenantId, contractId);
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
exports.ContractDocumentsController = ContractDocumentsController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'ContractDocument', action: 'Create' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Body)('notes')),
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
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], ContractDocumentsController.prototype, "uploadDocument", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'ContractDocument', action: 'Read' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContractDocumentsController.prototype, "getDocuments", null);
__decorate([
    (0, common_1.Get)(':documentId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'ContractDocument', action: 'Read' }),
    __param(0, (0, common_1.Param)('documentId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContractDocumentsController.prototype, "getDocument", null);
__decorate([
    (0, common_1.Delete)(':documentId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'ContractDocument', action: 'Delete' }),
    __param(0, (0, common_1.Param)('documentId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContractDocumentsController.prototype, "deleteDocument", null);
__decorate([
    (0, common_1.Patch)(':documentId/status'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'ContractDocument', action: 'Update' }),
    __param(0, (0, common_1.Param)('documentId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ContractDocumentsController.prototype, "updateStatus", null);
exports.ContractDocumentsController = ContractDocumentsController = __decorate([
    (0, common_1.Controller)('tenant/contracts/:contractId/documents'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [contract_documents_service_1.ContractDocumentsService,
        tenant_context_service_1.TenantContextService])
], ContractDocumentsController);
//# sourceMappingURL=contract-documents.controller.js.map