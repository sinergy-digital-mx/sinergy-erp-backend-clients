import { Repository } from 'typeorm';
import { PaymentDocument } from '../../entities/contracts/payment-document.entity';
import { Payment } from '../../entities/contracts/payment.entity';
import { S3Service } from '../../common/services/s3.service';
export declare class PaymentDocumentsService {
    private paymentDocumentRepo;
    private paymentRepo;
    private s3Service;
    constructor(paymentDocumentRepo: Repository<PaymentDocument>, paymentRepo: Repository<Payment>, s3Service: S3Service);
    uploadDocument(tenantId: string, paymentId: string, file: any, documentType: string, uploadedBy: string, notes?: string): Promise<PaymentDocument>;
    getPaymentDocuments(tenantId: string, paymentId: string): Promise<PaymentDocument[]>;
    getDocument(tenantId: string, documentId: string): Promise<PaymentDocument | null>;
    getDocumentUrl(tenantId: string, documentId: string, expiresIn?: number): Promise<string>;
    deleteDocument(tenantId: string, documentId: string): Promise<void>;
    updateDocumentNotes(tenantId: string, documentId: string, notes: string): Promise<PaymentDocument>;
}
