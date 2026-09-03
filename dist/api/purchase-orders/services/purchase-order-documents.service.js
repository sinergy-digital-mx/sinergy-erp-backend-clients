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
exports.PurchaseOrderDocumentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const purchase_order_document_entity_1 = require("../../../entities/purchase-orders/purchase-order-document.entity");
const purchase_order_document_language_enum_1 = require("../../../entities/purchase-orders/purchase-order-document-language.enum");
const purchase_order_document_type_entity_1 = require("../../../entities/purchase-orders/purchase-order-document-type.entity");
const s3_service_1 = require("../../../common/services/s3.service");
const uuid_1 = require("uuid");
let PurchaseOrderDocumentsService = class PurchaseOrderDocumentsService {
    documentRepository;
    documentTypeRepository;
    s3Service;
    constructor(documentRepository, documentTypeRepository, s3Service) {
        this.documentRepository = documentRepository;
        this.documentTypeRepository = documentTypeRepository;
        this.s3Service = s3Service;
    }
    async uploadDocument(purchaseOrderId, documentTypeId, fileName, filePath, fileSize, mimeType, uploadedBy, documentLanguage = purchase_order_document_language_enum_1.PurchaseOrderDocumentLanguage.ES) {
        const docType = await this.documentTypeRepository.findOne({
            where: { id: documentTypeId },
        });
        if (!docType) {
            throw new common_1.NotFoundException(`Tipo de documento no encontrado: ${documentTypeId}`);
        }
        const document = this.documentRepository.create({
            id: (0, uuid_1.v4)(),
            purchase_order_batch_id: purchaseOrderId,
            document_type_id: documentTypeId,
            file_name: fileName,
            file_path: filePath,
            file_size: fileSize,
            mime_type: mimeType,
            uploaded_by: uploadedBy,
            document_language: documentLanguage,
        });
        return this.documentRepository.save(document);
    }
    async uploadDocumentFile(tenantId, purchaseOrderId, documentTypeId, file, uploadedBy) {
        const docType = await this.documentTypeRepository.findOne({
            where: { id: documentTypeId },
        });
        if (!docType) {
            throw new common_1.NotFoundException(`Tipo de documento no encontrado: ${documentTypeId}`);
        }
        const s3Key = await this.s3Service.uploadEntityFile(tenantId, 'purchase_orders', purchaseOrderId, docType.name, file.buffer, file.originalname, file.mimetype);
        return this.uploadDocument(purchaseOrderId, documentTypeId, file.originalname, s3Key, file.size, file.mimetype, uploadedBy);
    }
    async getDocuments(purchaseOrderId) {
        const documents = await this.documentRepository
            .createQueryBuilder('doc')
            .where('doc.purchase_order_batch_id = :purchaseOrderId', { purchaseOrderId })
            .leftJoinAndSelect('doc.document_type', 'doc_type')
            .leftJoinAndSelect('doc.uploader', 'uploader')
            .orderBy('doc.created_at', 'DESC')
            .getMany();
        const docsWithUrls = await Promise.all(documents.map(async (doc) => {
            let signedUrl = null;
            try {
                signedUrl = await this.s3Service.getSignedUrl(doc.file_path, 900);
            }
            catch (error) {
                console.error(`Error generating signed URL for ${doc.file_path}:`, error);
            }
            const uploaderName = doc.uploader
                ? `${doc.uploader.first_name || ''} ${doc.uploader.last_name || ''}`.trim() || 'Unknown'
                : 'Unknown';
            return {
                id: doc.id,
                purchase_order_id: doc.purchase_order_batch_id,
                document_type_id: doc.document_type_id,
                document_name: doc.file_name,
                file_path: doc.file_path,
                file_key: doc.file_path,
                uploaded_by: doc.uploaded_by,
                uploaded_by_name: uploaderName,
                uploaded_at: doc.created_at,
                document_type_name: doc.document_type?.name || 'Unknown',
                document_language: doc.document_language,
                key: doc.file_path,
                path: signedUrl || doc.file_path,
            };
        }));
        return docsWithUrls;
    }
    async getLastDocumentLanguage(purchaseOrderId, documentTypeId) {
        const document = await this.documentRepository.findOne({
            where: {
                purchase_order_batch_id: purchaseOrderId,
                document_type_id: documentTypeId,
            },
            order: { created_at: 'DESC' },
        });
        return document?.document_language ?? purchase_order_document_language_enum_1.PurchaseOrderDocumentLanguage.ES;
    }
    async deleteDocument(documentId) {
        const result = await this.documentRepository.delete(documentId);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Documento no encontrado: ${documentId}`);
        }
    }
    async getDocumentTypes() {
        return this.documentTypeRepository.find({
            order: { id: 'ASC' },
        });
    }
};
exports.PurchaseOrderDocumentsService = PurchaseOrderDocumentsService;
exports.PurchaseOrderDocumentsService = PurchaseOrderDocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(purchase_order_document_entity_1.PurchaseOrderDocument)),
    __param(1, (0, typeorm_1.InjectRepository)(purchase_order_document_type_entity_1.PurchaseOrderDocumentType)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        s3_service_1.S3Service])
], PurchaseOrderDocumentsService);
//# sourceMappingURL=purchase-order-documents.service.js.map