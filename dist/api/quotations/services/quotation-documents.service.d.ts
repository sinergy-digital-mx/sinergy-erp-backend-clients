import { Repository } from 'typeorm';
import { S3Service } from '../../../common/services/s3.service';
import { DocumentLanguage } from '../../../common/enums/document-language.enum';
import { QuotationDocument } from '../../../entities/quotations/quotation-document.entity';
import { QuotationDocumentType } from '../../../entities/quotations/quotation-document-type.entity';
export declare class QuotationDocumentsService {
    private readonly documentRepository;
    private readonly documentTypeRepository;
    private readonly s3Service;
    constructor(documentRepository: Repository<QuotationDocument>, documentTypeRepository: Repository<QuotationDocumentType>, s3Service: S3Service);
    uploadDocument(quotationId: string, documentTypeId: number, fileName: string, filePath: string, fileSize: number, mimeType: string, uploadedBy: string, documentLanguage?: DocumentLanguage): Promise<QuotationDocument>;
    getDocuments(quotationId: string): Promise<any[]>;
    getLastDocumentLanguage(quotationId: string, documentTypeId: number): Promise<DocumentLanguage>;
    deleteDocument(documentId: string): Promise<void>;
    deleteDocumentsByType(quotationId: string, documentTypeId: number): Promise<void>;
}
