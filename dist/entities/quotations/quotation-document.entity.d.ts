import { Quotation } from './quotation.entity';
import { QuotationDocumentType } from './quotation-document-type.entity';
import { DocumentLanguage } from '../../common/enums/document-language.enum';
import { User } from '../users/user.entity';
export declare class QuotationDocument {
    id: string;
    quotation: Quotation;
    quotation_id: string;
    document_type: QuotationDocumentType;
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
