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
exports.PurchaseOrderDocumentsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const tenant_module_validation_guard_1 = require("../../auth/tenant-module-validation.guard");
const purchase_order_documents_service_1 = require("../services/purchase-order-documents.service");
const purchase_order_service_1 = require("../services/purchase-order.service");
let PurchaseOrderDocumentsController = class PurchaseOrderDocumentsController {
    documentsService;
    purchaseOrderService;
    constructor(documentsService, purchaseOrderService) {
        this.documentsService = documentsService;
        this.purchaseOrderService = purchaseOrderService;
    }
    async uploadDocument(orderId, file, documentTypeId, req) {
        const tenantId = req.user.tenant_id;
        const userId = req.user.id;
        if (!file) {
            throw new common_1.BadRequestException('No se subió ningún archivo');
        }
        if (!documentTypeId) {
            throw new common_1.BadRequestException('El tipo de documento es obligatorio');
        }
        await this.purchaseOrderService.findOne(orderId, tenantId);
        const document = await this.documentsService.uploadDocumentFile(tenantId, orderId, parseInt(documentTypeId), file, userId);
        return {
            message: 'Documento subido correctamente',
            data: document,
        };
    }
    async getDocuments(orderId, req) {
        const tenantId = req.user.tenant_id;
        await this.purchaseOrderService.findOne(orderId, tenantId);
        const documents = await this.documentsService.getDocuments(orderId);
        return {
            data: documents,
            total: documents.length,
        };
    }
    async deleteDocument(documentId) {
        await this.documentsService.deleteDocument(documentId);
        return {
            message: 'Documento eliminado correctamente',
        };
    }
    async getDocumentTypes() {
        const documentTypes = await this.documentsService.getDocumentTypes();
        return {
            data: documentTypes,
            total: documentTypes.length,
        };
    }
};
exports.PurchaseOrderDocumentsController = PurchaseOrderDocumentsController;
__decorate([
    (0, common_1.Post)(':orderId/documents'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)('document_type_id')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrderDocumentsController.prototype, "uploadDocument", null);
__decorate([
    (0, common_1.Get)(':orderId/documents'),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrderDocumentsController.prototype, "getDocuments", null);
__decorate([
    (0, common_1.Delete)('documents/:documentId'),
    __param(0, (0, common_1.Param)('documentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PurchaseOrderDocumentsController.prototype, "deleteDocument", null);
__decorate([
    (0, common_1.Get)('document-types/list'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PurchaseOrderDocumentsController.prototype, "getDocumentTypes", null);
exports.PurchaseOrderDocumentsController = PurchaseOrderDocumentsController = __decorate([
    (0, common_1.Controller)('tenant/purchase-orders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_module_validation_guard_1.TenantModuleValidationGuard),
    __metadata("design:paramtypes", [purchase_order_documents_service_1.PurchaseOrderDocumentsService,
        purchase_order_service_1.PurchaseOrderService])
], PurchaseOrderDocumentsController);
//# sourceMappingURL=purchase-order-documents.controller.js.map