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
exports.ContractDocumentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const contract_document_entity_1 = require("../../entities/contracts/contract-document.entity");
const s3_service_1 = require("../../common/services/s3.service");
let ContractDocumentsService = class ContractDocumentsService {
    documentRepo;
    s3Service;
    constructor(documentRepo, s3Service) {
        this.documentRepo = documentRepo;
        this.s3Service = s3Service;
    }
    async uploadDocument(tenantId, contractId, file, uploadedBy, notes) {
        const s3Key = await this.s3Service.uploadEntityFile(tenantId, 'contracts', contractId, 'documents', file.buffer, file.originalname, file.mimetype);
        const document = this.documentRepo.create({
            tenant_id: tenantId,
            contract_id: contractId,
            file_name: file.originalname,
            s3_key: s3Key,
            mime_type: file.mimetype,
            file_size: file.size,
            notes: notes,
            uploaded_by: uploadedBy,
            status: 'pending',
        });
        return this.documentRepo.save(document);
    }
    async getContractDocuments(tenantId, contractId) {
        const documents = await this.documentRepo.find({
            where: { tenant_id: tenantId, contract_id: contractId },
            order: { created_at: 'DESC' },
        });
        const documentsWithUrls = await Promise.all(documents.map(async (doc) => {
            const signedUrl = await this.s3Service.getSignedUrl(doc.s3_key);
            return {
                ...doc,
                download_url: signedUrl,
            };
        }));
        return documentsWithUrls;
    }
    async getDocument(tenantId, documentId) {
        const document = await this.documentRepo.findOne({
            where: { id: documentId, tenant_id: tenantId },
            relations: ['contract'],
        });
        if (!document) {
            throw new Error('Document not found');
        }
        const signedUrl = await this.s3Service.getSignedUrl(document.s3_key);
        return {
            ...document,
            download_url: signedUrl,
        };
    }
    async deleteDocument(tenantId, documentId) {
        const document = await this.documentRepo.findOne({
            where: { id: documentId, tenant_id: tenantId },
        });
        if (!document) {
            throw new Error('Document not found');
        }
        try {
            await this.s3Service.deleteFile(document.s3_key);
            await this.documentRepo.remove(document);
        }
        catch (error) {
            console.error('Error deleting document:', error);
            throw new Error(`No se pudo eliminar el documento: ${error.message || 'Error desconocido'}`);
        }
    }
    async updateDocumentStatus(tenantId, documentId, status, notes) {
        const document = await this.documentRepo.findOne({
            where: { id: documentId, tenant_id: tenantId },
        });
        if (!document) {
            throw new Error('Document not found');
        }
        document.status = status;
        if (notes) {
            document.notes = notes;
        }
        return this.documentRepo.save(document);
    }
};
exports.ContractDocumentsService = ContractDocumentsService;
exports.ContractDocumentsService = ContractDocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(contract_document_entity_1.ContractDocument)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        s3_service_1.S3Service])
], ContractDocumentsService);
//# sourceMappingURL=contract-documents.service.js.map