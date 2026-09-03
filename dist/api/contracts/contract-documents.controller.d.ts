import { TenantContextService } from '../rbac/services/tenant-context.service';
import { ContractDocumentsService } from './contract-documents.service';
export declare class ContractDocumentsController {
    private documentsService;
    private tenantContext;
    constructor(documentsService: ContractDocumentsService, tenantContext: TenantContextService);
    uploadDocument(contractId: string, notes: string, file: any, req: any): Promise<import("../../entities/contracts/contract-document.entity").ContractDocument>;
    getDocuments(contractId: string, req: any): Promise<any[]>;
    getDocument(documentId: string, req: any): Promise<any>;
    deleteDocument(documentId: string, req: any): Promise<{
        success: boolean;
    }>;
    updateStatus(documentId: string, body: {
        status: 'pending' | 'approved' | 'rejected';
        notes?: string;
    }, req: any): Promise<import("../../entities/contracts/contract-document.entity").ContractDocument>;
}
