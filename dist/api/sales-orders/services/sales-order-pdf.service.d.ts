import { S3Service } from '../../../common/services/s3.service';
import { DocumentLanguage } from '../../../common/enums/document-language.enum';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
export declare class SalesOrderPdfService {
    private readonly s3Service;
    private fonts;
    constructor(s3Service: S3Service);
    generatePdf(salesOrder: SalesOrder, language?: DocumentLanguage, options?: {
        title?: string;
        subtitle?: string;
        hidePayment?: boolean;
    }): Promise<Buffer>;
    generateDeliveryPdf(salesOrder: SalesOrder, language?: DocumentLanguage): Promise<Buffer>;
    private buildDocument;
    uploadPdfToS3(salesOrder: Pick<SalesOrder, 'id' | 'folio' | 'tenant_id'>, pdfBuffer: Buffer, documentType?: string, entityFolder?: string): Promise<{
        s3Key: string;
        signedUrl: string;
    }>;
    private buildHeader;
    private buildAccentLine;
    private buildMetaCards;
    private buildPartyCards;
    private buildLocationStack;
    private buildProductsSection;
    private buildNotesAndTotals;
    private buildTotalsTable;
    private totalRow;
    private metaCell;
    private partyCell;
    private gapCell;
    private equalHeightLayout;
    private thCell;
    private statusColor;
    private paymentColor;
    private formatCustomerName;
    private formatCurrency;
    private formatUnitCurrency;
    private getFiscalLogoImage;
    private renderPdf;
}
