import { Repository } from 'typeorm';
import { ContractDocument } from '../../entities/contracts/contract-document.entity';
import { S3Service } from '../../common/services/s3.service';
export declare class ContractDocumentsService {
    private documentRepo;
    private s3Service;
    constructor(documentRepo: Repository<ContractDocument>, s3Service: S3Service);
    uploadDocument(tenantId: string, contractId: string, file: any, uploadedBy: string, notes?: string): Promise<ContractDocument>;
    getContractDocuments(tenantId: string, contractId: string): Promise<any[]>;
    getDocument(tenantId: string, documentId: string): Promise<any>;
    deleteDocument(tenantId: string, documentId: string): Promise<void>;
    updateDocumentStatus(tenantId: string, documentId: string, status: 'pending' | 'approved' | 'rejected', notes?: string): Promise<ContractDocument>;
}
