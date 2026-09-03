import { PurchaseOrderBatch } from './purchase-order-batch.entity';
import { PurchaseOrderDocumentType } from './purchase-order-document-type.entity';
import { PurchaseOrderDocumentLanguage } from './purchase-order-document-language.enum';
import { User } from '../users/user.entity';
export declare class PurchaseOrderDocument {
    id: string;
    purchase_order_batch: PurchaseOrderBatch;
    purchase_order_batch_id: string;
    document_type: PurchaseOrderDocumentType;
    document_type_id: number;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    document_language: PurchaseOrderDocumentLanguage;
    uploader: User;
    uploaded_by: string;
    created_at: Date;
}
