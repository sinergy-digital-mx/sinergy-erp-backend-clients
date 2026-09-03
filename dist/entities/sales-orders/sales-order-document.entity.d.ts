import { SalesOrder } from './sales-order.entity';
import { SalesOrderDocumentType } from './sales-order-document-type.entity';
import { DocumentLanguage } from '../../common/enums/document-language.enum';
import { User } from '../users/user.entity';
export declare class SalesOrderDocument {
    id: string;
    sales_order: SalesOrder;
    sales_order_id: string;
    document_type: SalesOrderDocumentType;
    document_type_id: number;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    document_language: DocumentLanguage;
    uploader: User;
    uploaded_by: string;
    created_at: Date;
}
