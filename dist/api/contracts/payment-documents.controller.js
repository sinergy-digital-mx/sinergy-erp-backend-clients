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
exports.PaymentDocumentsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const tenant_context_service_1 = require("../rbac/services/tenant-context.service");
const payment_documents_service_1 = require("./payment-documents.service");
const upload_payment_document_dto_1 = require("./dto/upload-payment-document.dto");
let PaymentDocumentsController = class PaymentDocumentsController {
    paymentDocumentsService;
    tenantContext;
    constructor(paymentDocumentsService, tenantContext) {
        this.paymentDocumentsService = paymentDocumentsService;
        this.tenantContext = tenantContext;
    }
    async uploadDocument(paymentId, file, dto, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const userId = req.user?.userId || req.user?.id;
        if (!file) {
            throw new common_1.BadRequestException('File is required');
        }
        const allowedMimeTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/heic',
            'image/heif',
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException('Invalid file type. Allowed: PDF, JPEG, PNG, HEIC');
        }
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new common_1.BadRequestException('File size exceeds 10MB limit');
        }
        return this.paymentDocumentsService.uploadDocument(tenantId, paymentId, file, dto.document_type, userId, dto.notes);
    }
    async getDocuments(paymentId, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.paymentDocumentsService.getPaymentDocuments(tenantId, paymentId);
    }
    async getDocumentUrl(documentId, req, expiresIn) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const expires = expiresIn ? parseInt(expiresIn, 10) : 3600;
        const url = await this.paymentDocumentsService.getDocumentUrl(tenantId, documentId, expires);
        return { url };
    }
    async deleteDocument(documentId, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        await this.paymentDocumentsService.deleteDocument(tenantId, documentId);
        return { message: 'Document deleted successfully' };
    }
};
exports.PaymentDocumentsController = PaymentDocumentsController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Payment', action: 'Update' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('paymentId')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, upload_payment_document_dto_1.UploadPaymentDocumentDto, Object]),
    __metadata("design:returntype", Promise)
], PaymentDocumentsController.prototype, "uploadDocument", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Payment', action: 'Read' }),
    __param(0, (0, common_1.Param)('paymentId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentDocumentsController.prototype, "getDocuments", null);
__decorate([
    (0, common_1.Get)(':documentId/url'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Payment', action: 'Read' }),
    __param(0, (0, common_1.Param)('documentId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('expiresIn')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], PaymentDocumentsController.prototype, "getDocumentUrl", null);
__decorate([
    (0, common_1.Delete)(':documentId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Payment', action: 'Delete' }),
    __param(0, (0, common_1.Param)('documentId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentDocumentsController.prototype, "deleteDocument", null);
exports.PaymentDocumentsController = PaymentDocumentsController = __decorate([
    (0, common_1.Controller)('tenant/contracts/:contractId/payments/:paymentId/documents'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [payment_documents_service_1.PaymentDocumentsService,
        tenant_context_service_1.TenantContextService])
], PaymentDocumentsController);
//# sourceMappingURL=payment-documents.controller.js.map