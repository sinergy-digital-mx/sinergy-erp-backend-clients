import { Injectable } from '@nestjs/common';
import PdfPrinter from 'pdfmake';
import * as path from 'path';
import { S3Service } from '../../../common/services/s3.service';
import { DocumentLanguage } from '../../../common/enums/document-language.enum';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import {
  getSalesOrderPdfLabels,
  translateGeneralStatus,
  translatePaymentStatus,
} from './sales-order-pdf-labels';

@Injectable()
export class SalesOrderPdfService {
  private fonts = {
    Roboto: {
      normal: path.join(process.cwd(), 'src/_public/fonts/Roboto-Regular.ttf'),
      bold: path.join(process.cwd(), 'src/_public/fonts/Roboto-Bold.ttf'),
      italics: path.join(process.cwd(), 'src/_public/fonts/Roboto-Italic.ttf'),
      bolditalics: path.join(process.cwd(), 'src/_public/fonts/Roboto-BoldItalic.ttf'),
    },
  };

  constructor(private readonly s3Service: S3Service) {}

  async generatePdf(
    salesOrder: SalesOrder,
    language: DocumentLanguage = DocumentLanguage.ES,
  ): Promise<Buffer> {
    const printer = new PdfPrinter(this.fonts);
    const labels = getSalesOrderPdfLabels(language);
    const lineItems = salesOrder.line_items || [];
    const creatorName = [salesOrder.creator?.first_name, salesOrder.creator?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim() || 'N/A';
    const customerName = this.formatCustomerName(salesOrder);
    const logoImage = await this.getFiscalLogoImage(salesOrder);

    const tableBody: any[] = [
      [
        { text: labels.product, style: 'tableTh' },
        { text: labels.quantity, style: 'tableTh' },
        { text: labels.unitPrice, style: 'tableTh' },
        { text: labels.discount, style: 'tableTh' },
        { text: labels.total, style: 'tableTh' },
      ],
    ];

    for (const item of lineItems) {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      const lineSubtotal = quantity * unitPrice;
      const discountPct = Number(item.discount_percentage) || 0;
      const lineDiscount = (lineSubtotal * discountPct) / 100;
      const lineTotal = lineSubtotal - lineDiscount;
      const uomName = item.product_uom?.uom?.name || 'UOM';

      tableBody.push([
        {
          stack: [
            { text: item.product?.name || 'N/A', fontSize: 9, bold: true, color: '#111827' },
            { text: `${labels.unitPrefix}: ${uomName}`, fontSize: 8, color: '#6b7280' },
          ],
        },
        { text: `${quantity} ${uomName}`, fontSize: 9, alignment: 'center' },
        { text: this.formatCurrency(unitPrice), fontSize: 9, alignment: 'right' },
        { text: `${discountPct}%`, fontSize: 9, alignment: 'center' },
        { text: this.formatCurrency(lineTotal), fontSize: 9, alignment: 'right', bold: true },
      ]);
    }

    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [28, 30, 28, 24],
      content: [
        {
          columns: [
            {
              width: '*',
              stack: [
                {
                  text: labels.originalDocumentTitle,
                  fontSize: 12,
                  bold: true,
                  color: '#111827',
                },
                {
                  text: `${labels.folioPrefix}: ${salesOrder.folio}`,
                  fontSize: 9,
                  color: '#4b5563',
                  margin: [0, 2, 0, 0],
                },
              ],
            },
            {
              width: 170,
              ...(logoImage
                ? {
                    image: logoImage,
                    fit: [130, 58],
                    alignment: 'center',
                  }
                : { text: '' }),
            },
            {
              width: '*',
              text: labels.salesOrderTitle,
              fontSize: 10,
              bold: true,
              alignment: 'right',
              color: '#6b7280',
            },
          ],
          margin: [0, 0, 0, 8],
        },
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: 539,
              y2: 0,
              lineWidth: 1,
              lineColor: '#d1d5db',
            },
          ],
          margin: [0, 0, 0, 12],
        },
        {
          text: labels.summary,
          style: 'sectionHeading',
          margin: [0, 0, 0, 4],
        },
        {
          table: {
            widths: [95, 132, 95, '*'],
            body: [
              [
                { text: labels.creationDate, style: 'summaryLabel' },
                { text: new Date(salesOrder.created_at).toLocaleDateString(labels.dateLocale), style: 'summaryValue' },
                { text: labels.createdBy, style: 'summaryLabel' },
                { text: creatorName, style: 'summaryValue' },
              ],
              [
                { text: labels.expectedDate, style: 'summaryLabel' },
                { text: new Date(salesOrder.expected_delivery_date).toLocaleDateString(labels.dateLocale), style: 'summaryValue' },
                { text: labels.status, style: 'summaryLabel' },
                { text: translateGeneralStatus(salesOrder.general_status, labels), style: 'summaryValue' },
              ],
              [
                { text: labels.payment, style: 'summaryLabel' },
                { text: translatePaymentStatus(salesOrder.payment_status, labels), style: 'summaryValue' },
                { text: '', style: 'summaryLabel' },
                { text: '', style: 'summaryValue' },
              ],
            ],
          },
          layout: this.tableLayout(),
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                {
                  stack: [
                    { text: labels.customer, style: 'sectionTitle' },
                    { text: customerName, style: 'sectionValue' },
                    {
                      text: `${labels.emailPrefix}: ${salesOrder.customer?.email || 'N/A'}`,
                      style: 'sectionMeta',
                    },
                    {
                      text: `${labels.phonePrefix}: ${salesOrder.customer?.phone || 'N/A'}`,
                      style: 'sectionMeta',
                    },
                  ],
                },
                {
                  stack: [
                    { text: labels.sourceWarehouse, style: 'sectionTitle' },
                    { text: salesOrder.warehouse?.name || 'N/A', style: 'sectionValue' },
                    {
                      text: `${salesOrder.warehouse?.city || 'N/A'}, ${salesOrder.warehouse?.state || 'N/A'}`,
                      style: 'sectionMeta',
                    },
                  ],
                },
              ],
            ],
          },
          layout: {
            hLineColor: () => '#d1d5db',
            vLineColor: () => '#d1d5db',
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            paddingTop: () => 8,
            paddingBottom: () => 8,
            paddingLeft: () => 8,
            paddingRight: () => 8,
            fillColor: () => '#fcfcfd',
          },
          margin: [0, 2, 0, 14],
        },
        {
          text: labels.productsDetail,
          style: 'sectionHeading',
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 80, 80, 60, 80],
            body: tableBody,
          },
          layout: {
            fillColor: (rowIndex: number) => {
              if (rowIndex === 0) return '#e8eef8';
              return rowIndex % 2 === 0 ? '#f9fafb' : '#ffffff';
            },
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#d1d5db',
            vLineColor: () => '#d1d5db',
            paddingTop: () => 6,
            paddingBottom: () => 6,
            paddingLeft: () => 6,
            paddingRight: () => 6,
          },
          margin: [0, 0, 0, 12],
        },
        {
          columns: [
            {
              width: '*',
              text: salesOrder.notes ? `${labels.notesPrefix}: ${salesOrder.notes}` : '',
              style: 'sectionMeta',
              margin: [0, 18, 0, 0],
            },
            {
              width: 200,
              text: [
                { text: `${labels.subtotal}: `, bold: true, fontSize: 9 },
                { text: `${this.formatCurrency(Number(salesOrder.subtotal) || 0)}\n`, fontSize: 9 },
                { text: `${labels.discountTotal}: `, bold: true, fontSize: 9 },
                { text: `${this.formatCurrency(Number(salesOrder.discount_total) || 0)}\n`, fontSize: 9 },
                { text: `${labels.vat}: `, bold: true, fontSize: 9 },
                { text: `${this.formatCurrency(Number(salesOrder.iva_total) || 0)}\n`, fontSize: 9 },
                { text: `${labels.ieps}: `, bold: true, fontSize: 9 },
                { text: `${this.formatCurrency(Number(salesOrder.ieps_total) || 0)}\n`, fontSize: 9 },
                { text: `${labels.totalLabel}: `, bold: true, fontSize: 10, color: '#0f172a' },
                {
                  text: `${this.formatCurrency(Number(salesOrder.total) || 0)}`,
                  fontSize: 10,
                  bold: true,
                  color: '#0f172a',
                },
              ],
              alignment: 'right',
              fontSize: 9,
            },
          ],
          margin: [0, 0, 0, 8],
        },
      ],
      styles: {
        tableTh: {
          fontSize: 8,
          bold: true,
          color: '#1f2937',
          alignment: 'center',
        },
        sectionHeading: {
          fontSize: 10,
          bold: true,
          color: '#1f2937',
          margin: [0, 0, 0, 6],
        },
        sectionTitle: {
          fontSize: 9,
          bold: true,
          color: '#374151',
          margin: [0, 0, 0, 2],
        },
        sectionValue: {
          fontSize: 10,
          color: '#111827',
          margin: [0, 2, 0, 1],
        },
        sectionMeta: {
          fontSize: 8,
          color: '#6b7280',
        },
        summaryLabel: {
          fontSize: 8,
          color: '#4b5563',
          bold: true,
        },
        summaryValue: {
          fontSize: 8,
          color: '#111827',
        },
      },
      defaultStyle: {
        fontSize: 9,
        color: '#111827',
      },
    };

    return this.renderPdf(printer, docDefinition);
  }

  async uploadPdfToS3(
    salesOrder: SalesOrder,
    pdfBuffer: Buffer,
    documentType: string = 'DOCUMENTO_ORIGINAL',
  ): Promise<{ s3Key: string; signedUrl: string }> {
    const safeDocumentType = documentType.replace(/\s+/g, '_').toUpperCase();
    const fileName = `${safeDocumentType}-${salesOrder.folio}.pdf`;

    const s3Key = await this.s3Service.uploadEntityFile(
      salesOrder.tenant_id,
      'sales_orders',
      salesOrder.id,
      safeDocumentType,
      pdfBuffer,
      fileName,
      'application/pdf',
    );

    const signedUrl = await this.s3Service.getSignedUrl(s3Key, 3600);
    return { s3Key, signedUrl };
  }

  private formatCustomerName(salesOrder: SalesOrder): string {
    const customer = salesOrder.customer;
    if (!customer) return 'N/A';
    if (customer.company_name) return customer.company_name;
    return [customer.name, customer.lastname].filter(Boolean).join(' ').trim() || 'N/A';
  }

  private formatCurrency(amount: number): string {
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private tableLayout() {
    return {
      hLineColor: () => '#d1d5db',
      vLineColor: () => '#d1d5db',
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      fillColor: (rowIndex: number, _node: any, columnIndex: number) =>
        columnIndex % 2 === 0 ? '#f8fafc' : rowIndex % 2 === 0 ? '#ffffff' : '#fafafa',
      paddingTop: () => 5,
      paddingBottom: () => 5,
      paddingLeft: () => 6,
      paddingRight: () => 6,
    };
  }

  private async getFiscalLogoImage(salesOrder: SalesOrder): Promise<string | null> {
    const logoKey = salesOrder.fiscal_configuration?.logo;
    if (!logoKey) return null;

    try {
      const signedUrl = await this.s3Service.getSignedUrl(logoKey, 900);
      const response = await fetch(signedUrl);
      if (!response.ok) return null;

      const contentType = response.headers.get('content-type') || 'image/png';
      const buffer = Buffer.from(await response.arrayBuffer());
      return `data:${contentType};base64,${buffer.toString('base64')}`;
    } catch {
      return null;
    }
  }

  private renderPdf(printer: PdfPrinter, docDefinition: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const chunks: Buffer[] = [];

        pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', reject);
        pdfDoc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
