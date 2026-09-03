import { TenantContextService } from '../rbac/services/tenant-context.service';
import { CustomerDocumentsService } from './customer-documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
export declare class CustomerDocumentsController {
    private documentsService;
    private tenantContext;
    constructor(documentsService: CustomerDocumentsService, tenantContext: TenantContextService);
    uploadDocument(customerId: string, dto: UploadDocumentDto, file: any, req: any): Promise<import("../../entities/customers/customer-document.entity").CustomerDocument>;
    getDocuments(customerId: string, req: any): Promise<any[]>;
    getDocument(documentId: string, req: any): Promise<any>;
    deleteDocument(documentId: string, req: any): Promise<{
        success: boolean;
    }>;
    updateStatus(documentId: string, body: {
        status: 'pending' | 'approved' | 'rejected';
        notes?: string;
    }, req: any): Promise<import("../../entities/customers/customer-document.entity").CustomerDocument>;
}
export declare class DocumentTypesController {
    private documentsService;
    private tenantContext;
    constructor(documentsService: CustomerDocumentsService, tenantContext: TenantContextService);
    getDocumentTypes(req: any): Promise<import("../../entities/customers/document-type.entity").DocumentType[]>;
    createDocumentType(body: any, req: any): Promise<import("../../entities/customers/document-type.entity").DocumentType>;
}
