import { Injectable } from '@nestjs/common';
import { DocumentLanguage } from '../../../common/enums/document-language.enum';
import { Quotation } from '../../../entities/quotations/quotation.entity';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { SalesOrderPdfService } from '../../sales-orders/services/sales-order-pdf.service';

@Injectable()
export class QuotationPdfService {
  constructor(private readonly salesOrderPdfService: SalesOrderPdfService) {}

  async generatePdf(
    quotation: Quotation,
    language: DocumentLanguage = DocumentLanguage.ES,
  ): Promise<Buffer> {
    const isEn = language === DocumentLanguage.EN;
    return this.salesOrderPdfService.generatePdf(
      this.toSalesOrderShape(quotation),
      language,
      {
        title: isEn ? 'QUOTATION' : 'COTIZACIÓN',
        subtitle: isEn
          ? 'Original quotation document'
          : 'Documento original de cotización',
        hidePayment: true,
      },
    );
  }

  async uploadPdfToS3(
    quotation: Quotation,
    pdfBuffer: Buffer,
  ): Promise<{ s3Key: string; signedUrl: string }> {
    return this.salesOrderPdfService.uploadPdfToS3(
      quotation,
      pdfBuffer,
      'DOCUMENTO_ORIGINAL',
      'quotations',
    );
  }

  /** El PDF de OV y cotización comparten layout; se mapea al shape que ya pinta pdfmake. */
  private toSalesOrderShape(quotation: Quotation): SalesOrder {
    return {
      ...quotation,
      payment_status: null,
      sales_order_type: quotation.quotation_type,
      line_items: quotation.line_items as unknown as SalesOrder['line_items'],
    } as unknown as SalesOrder;
  }
}
