import { Repository } from 'typeorm';
import { S3Service } from '../../../common/services/s3.service';
import { DocumentLanguage } from '../../../common/enums/document-language.enum';
import { SalesOrderDocument } from '../../../entities/sales-orders/sales-order-document.entity';
import { SalesOrderDocumentType } from '../../../entities/sales-orders/sales-order-document-type.entity';
export declare class SalesOrderDocumentsService {
    private readonly documentRepository;
    private readonly documentTypeRepository;
    private readonly s3Service;
    constructor(documentRepository: Repository<SalesOrderDocument>, documentTypeRepository: Repository<SalesOrderDocumentType>, s3Service: S3Service);
    uploadDocument(salesOrderId: string, documentTypeId: number, fileName: string, filePath: string, fileSize: number, mimeType: string, uploadedBy: string, documentLanguage?: DocumentLanguage): Promise<SalesOrderDocument>;
    getDocuments(salesOrderId: string): Promise<any[]>;
    ensureDocumentType(name: string, description: string): Promise<number>;
    getLastDocumentLanguage(salesOrderId: string, documentTypeId: number): Promise<DocumentLanguage>;
    deleteDocument(documentId: string): Promise<void>;
}
