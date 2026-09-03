import { TenantContextService } from '../rbac/services/tenant-context.service';
import { PaymentDocumentsService } from './payment-documents.service';
import { UploadPaymentDocumentDto } from './dto/upload-payment-document.dto';
export declare class PaymentDocumentsController {
    private paymentDocumentsService;
    private tenantContext;
    constructor(paymentDocumentsService: PaymentDocumentsService, tenantContext: TenantContextService);
    uploadDocument(paymentId: string, file: any, dto: UploadPaymentDocumentDto, req: any): Promise<import("../../entities/contracts/payment-document.entity").PaymentDocument>;
    getDocuments(paymentId: string, req: any): Promise<import("../../entities/contracts/payment-document.entity").PaymentDocument[]>;
    getDocumentUrl(documentId: string, req: any, expiresIn?: string): Promise<{
        url: string;
    }>;
    deleteDocument(documentId: string, req: any): Promise<{
        message: string;
    }>;
}
