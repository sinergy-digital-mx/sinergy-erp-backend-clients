import { DocumentLanguage } from '../../../common/enums/document-language.enum';
import { Quotation } from '../../../entities/quotations/quotation.entity';
import { SalesOrderPdfService } from '../../sales-orders/services/sales-order-pdf.service';
export declare class QuotationPdfService {
    private readonly salesOrderPdfService;
    constructor(salesOrderPdfService: SalesOrderPdfService);
    generatePdf(quotation: Quotation, language?: DocumentLanguage): Promise<Buffer>;
    uploadPdfToS3(quotation: Quotation, pdfBuffer: Buffer): Promise<{
        s3Key: string;
        signedUrl: string;
    }>;
    private toSalesOrderShape;
}
