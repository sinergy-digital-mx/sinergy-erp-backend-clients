import { Repository } from 'typeorm';
import { PurchaseOrderDocument } from '../../../entities/purchase-orders/purchase-order-document.entity';
import { PurchaseOrderDocumentLanguage } from '../../../entities/purchase-orders/purchase-order-document-language.enum';
import { PurchaseOrderDocumentType } from '../../../entities/purchase-orders/purchase-order-document-type.entity';
import { S3Service } from '../../../common/services/s3.service';
export declare class PurchaseOrderDocumentsService {
    private readonly documentRepository;
    private readonly documentTypeRepository;
    private readonly s3Service;
    constructor(documentRepository: Repository<PurchaseOrderDocument>, documentTypeRepository: Repository<PurchaseOrderDocumentType>, s3Service: S3Service);
    uploadDocument(purchaseOrderId: string, documentTypeId: number, fileName: string, filePath: string, fileSize: number, mimeType: string, uploadedBy: string, documentLanguage?: PurchaseOrderDocumentLanguage): Promise<PurchaseOrderDocument>;
    uploadDocumentFile(tenantId: string, purchaseOrderId: string, documentTypeId: number, file: Express.Multer.File, uploadedBy: string): Promise<PurchaseOrderDocument>;
    getDocuments(purchaseOrderId: string): Promise<any[]>;
    getLastDocumentLanguage(purchaseOrderId: string, documentTypeId: number): Promise<PurchaseOrderDocumentLanguage>;
    deleteDocument(documentId: string): Promise<void>;
    getDocumentTypes(): Promise<PurchaseOrderDocumentType[]>;
}
