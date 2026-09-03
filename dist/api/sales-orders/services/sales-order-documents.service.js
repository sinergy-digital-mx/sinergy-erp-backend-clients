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
exports.SalesOrderDocumentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const s3_service_1 = require("../../../common/services/s3.service");
const document_language_enum_1 = require("../../../common/enums/document-language.enum");
const sales_order_document_entity_1 = require("../../../entities/sales-orders/sales-order-document.entity");
const sales_order_document_type_entity_1 = require("../../../entities/sales-orders/sales-order-document-type.entity");
let SalesOrderDocumentsService = class SalesOrderDocumentsService {
    documentRepository;
    documentTypeRepository;
    s3Service;
    constructor(documentRepository, documentTypeRepository, s3Service) {
        this.documentRepository = documentRepository;
        this.documentTypeRepository = documentTypeRepository;
        this.s3Service = s3Service;
    }
    async uploadDocument(salesOrderId, documentTypeId, fileName, filePath, fileSize, mimeType, uploadedBy, documentLanguage = document_language_enum_1.DocumentLanguage.ES) {
        const docType = await this.documentTypeRepository.findOne({
            where: { id: documentTypeId },
        });
        if (!docType) {
            throw new common_1.NotFoundException(`Document type not found: ${documentTypeId}`);
        }
        const document = this.documentRepository.create({
            id: (0, uuid_1.v4)(),
            sales_order_id: salesOrderId,
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
    async getDocuments(salesOrderId) {
        const documents = await this.documentRepository
            .createQueryBuilder('doc')
            .where('doc.sales_order_id = :salesOrderId', { salesOrderId })
            .leftJoinAndSelect('doc.document_type', 'doc_type')
            .leftJoinAndSelect('doc.uploader', 'uploader')
            .orderBy('doc.created_at', 'DESC')
            .getMany();
        return Promise.all(documents.map(async (doc) => {
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
                sales_order_id: doc.sales_order_id,
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
    }
    async ensureDocumentType(name, description) {
        const found = await this.documentTypeRepository.findOne({ where: { name } });
        if (found)
            return found.id;
        const created = await this.documentTypeRepository.save(this.documentTypeRepository.create({ name, description }));
        return created.id;
    }
    async getLastDocumentLanguage(salesOrderId, documentTypeId) {
        const document = await this.documentRepository.findOne({
            where: {
                sales_order_id: salesOrderId,
                document_type_id: documentTypeId,
            },
            order: { created_at: 'DESC' },
        });
        return document?.document_language ?? document_language_enum_1.DocumentLanguage.ES;
    }
    async deleteDocument(documentId) {
        const result = await this.documentRepository.delete(documentId);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Document not found: ${documentId}`);
        }
    }
};
exports.SalesOrderDocumentsService = SalesOrderDocumentsService;
exports.SalesOrderDocumentsService = SalesOrderDocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sales_order_document_entity_1.SalesOrderDocument)),
    __param(1, (0, typeorm_1.InjectRepository)(sales_order_document_type_entity_1.SalesOrderDocumentType)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        s3_service_1.S3Service])
], SalesOrderDocumentsService);
//# sourceMappingURL=sales-order-documents.service.js.map