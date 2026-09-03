import { Repository } from 'typeorm';
import { CustomerDocument } from '../../entities/customers/customer-document.entity';
import { DocumentType } from '../../entities/customers/document-type.entity';
import { S3Service } from '../../common/services/s3.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
export declare class CustomerDocumentsService {
    private documentRepo;
    private documentTypeRepo;
    private s3Service;
    constructor(documentRepo: Repository<CustomerDocument>, documentTypeRepo: Repository<DocumentType>, s3Service: S3Service);
    uploadDocument(tenantId: string, customerId: number, dto: UploadDocumentDto, file: any, uploadedBy: string): Promise<CustomerDocument>;
    getCustomerDocuments(tenantId: string, customerId: number): Promise<any[]>;
    getDocument(tenantId: string, documentId: string): Promise<any>;
    deleteDocument(tenantId: string, documentId: string): Promise<void>;
    updateDocumentStatus(tenantId: string, documentId: string, status: 'pending' | 'approved' | 'rejected', notes?: string): Promise<CustomerDocument>;
    getDocumentTypes(tenantId: string): Promise<DocumentType[]>;
    createDocumentType(tenantId: string, data: Partial<DocumentType>): Promise<DocumentType>;
}
