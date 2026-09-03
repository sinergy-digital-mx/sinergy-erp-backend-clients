import { S3Service } from '../../../common/services/s3.service';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { PurchaseOrderDocumentLanguage } from '../../../entities/purchase-orders/purchase-order-document-language.enum';
export declare class PurchaseOrderPdfService {
    private readonly s3Service;
    private fonts;
    constructor(s3Service: S3Service);
    generatePdf(purchaseOrder: PurchaseOrderBatch, language?: PurchaseOrderDocumentLanguage): Promise<Buffer>;
    generateRecepcionPdf(purchaseOrder: PurchaseOrderBatch, language?: PurchaseOrderDocumentLanguage): Promise<Buffer>;
    uploadPdfToS3(purchaseOrder: PurchaseOrderBatch, pdfBuffer: Buffer, documentType?: string): Promise<{
        s3Key: string;
        signedUrl: string;
    }>;
    private buildDocument;
    private buildHeader;
    private buildAccentLine;
    private buildMetaCards;
    private buildPartyCards;
    private buildRequestedProducts;
    private buildReceivedProducts;
    private productsTable;
    private buildNotesAndTotals;
    private buildTotalsTable;
    private totalRow;
    private metaCell;
    private partyCell;
    private gapCell;
    private equalHeightLayout;
    private thCell;
    private getTotals;
    private statusColor;
    private paymentColor;
    private resolveCurrency;
    private formatCurrency;
    private getFiscalLogoImage;
    private renderPdf;
}
