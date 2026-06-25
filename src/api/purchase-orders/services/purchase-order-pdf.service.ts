import { Injectable } from '@nestjs/common';
import PdfPrinter from 'pdfmake';
import { S3Service } from '../../../common/services/s3.service';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { PurchaseOrderDocumentLanguage } from '../../../entities/purchase-orders/purchase-order-document-language.enum';
import {
  getPurchaseOrderPdfLabels,
  translateGeneralStatus,
  translatePaymentStatus,
} from './purchase-order-pdf-labels';
import * as path from 'path';

@Injectable()
export class PurchaseOrderPdfService {
  private fonts = {
    Roboto: {
      normal: path.join(process.cwd(), 'src/_public/fonts/Roboto-Regular.ttf'),
      bold: path.join(process.cwd(), 'src/_public/fonts/Roboto-Bold.ttf'),
      italics: path.join(process.cwd(), 'src/_public/fonts/Roboto-Italic.ttf'),
      bolditalics: path.join(process.cwd(), 'src/_public/fonts/Roboto-BoldItalic.ttf'),
    },
  };

  constructor(private readonly s3Service: S3Service) {}

  /**
   * Generate PDF for a purchase order
   */
  async generatePdf(
    purchaseOrder: PurchaseOrderBatch,
    language: PurchaseOrderDocumentLanguage = PurchaseOrderDocumentLanguage.ES,
  ): Promise<Buffer> {
    const printer = new PdfPrinter(this.fonts);
    const labels = getPurchaseOrderPdfLabels(language);
    const lineItems = purchaseOrder.line_items || [];
    const creatorName = [purchaseOrder.creator?.first_name, purchaseOrder.creator?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim() || 'N/A';
    const logoImage = await this.getFiscalLogoImage(purchaseOrder);

    const tableBody: any[] = [
      [
        { text: labels.product, style: 'receptionTh' },
        { text: labels.requestedQty, style: 'receptionTh' },
        { text: labels.unitPrice, style: 'receptionTh' },
        { text: labels.total, style: 'receptionTh' },
      ],
    ];

    for (const item of lineItems) {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_total) || 0;
      const total = quantity * unitPrice;
      const requestedUom = item.product_uom?.uom?.name || 'UOM';

      tableBody.push([
        {
          stack: [
            { text: item.product?.name || 'N/A', fontSize: 9, bold: true, color: '#111827' },
            { text: `${labels.unitPrefix}: ${requestedUom}`, fontSize: 8, color: '#6b7280' },
          ],
        },
        { text: `${quantity} ${requestedUom}`, fontSize: 9, alignment: 'center' },
        { text: this.formatCurrency(unitPrice), fontSize: 9, alignment: 'right' },
        { text: this.formatCurrency(total), fontSize: 9, alignment: 'right', bold: true },
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
                  text: `${labels.folioPrefix}: ${purchaseOrder.folio}`,
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
              text: labels.purchaseOrderTitle,
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
                { text: new Date(purchaseOrder.created_at).toLocaleDateString(labels.dateLocale), style: 'summaryValue' },
                { text: labels.createdBy, style: 'summaryLabel' },
                { text: creatorName, style: 'summaryValue' },
              ],
              [
                { text: labels.expectedDate, style: 'summaryLabel' },
                { text: new Date(purchaseOrder.expected_delivery_date).toLocaleDateString(labels.dateLocale), style: 'summaryValue' },
                { text: labels.status, style: 'summaryLabel' },
                { text: translateGeneralStatus(purchaseOrder.general_status, labels), style: 'summaryValue' },
              ],
              [
                { text: labels.payment, style: 'summaryLabel' },
                { text: translatePaymentStatus(purchaseOrder.payment_status, labels), style: 'summaryValue' },
                { text: '', style: 'summaryLabel' },
                { text: '', style: 'summaryValue' },
              ],
            ],
          },
          layout: {
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
          },
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                {
                  stack: [
                    { text: labels.vendor, style: 'sectionTitle' },
                    { text: purchaseOrder.vendor?.name || 'N/A', style: 'sectionValue' },
                    { text: `${labels.rfcPrefix}: ${purchaseOrder.vendor?.rfc || 'N/A'}`, style: 'sectionMeta' },
                    {
                      text: `${labels.addressPrefix}: ${
                        [purchaseOrder.vendor?.street, purchaseOrder.vendor?.city, purchaseOrder.vendor?.state]
                          .filter(Boolean)
                          .join(', ') || 'N/A'
                      }`,
                      style: 'sectionMeta',
                    },
                  ],
                },
                {
                  stack: [
                    { text: labels.destinationWarehouse, style: 'sectionTitle' },
                    { text: purchaseOrder.warehouse?.name || 'N/A', style: 'sectionValue' },
                    {
                      text: `${purchaseOrder.warehouse?.city || 'N/A'}, ${purchaseOrder.warehouse?.state || 'N/A'}`,
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
          text: labels.requestedProductsDetail,
          style: 'sectionHeading',
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 100, 90, 90],
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
              text: purchaseOrder.notes ? `${labels.notesPrefix}: ${purchaseOrder.notes}` : '',
              style: 'sectionMeta',
              margin: [0, 18, 0, 0],
            },
            {
              width: 200,
              margin: [0, 0, 0, 0],
              text: [
                { text: `${labels.subtotal}: `, bold: true, fontSize: 9 },
                { text: `${this.formatCurrency(Number(purchaseOrder.requested_subtotal) || 0)}\n`, fontSize: 9 },
                { text: `${labels.vat}: `, bold: true, fontSize: 9 },
                { text: `${this.formatCurrency(Number(purchaseOrder.requested_iva_total) || 0)}\n`, fontSize: 9 },
                { text: `${labels.ieps}: `, bold: true, fontSize: 9 },
                { text: `${this.formatCurrency(Number(purchaseOrder.requested_ieps_total) || 0)}\n`, fontSize: 9 },
                { text: `${labels.totalLabel}: `, bold: true, fontSize: 10, color: '#0f172a' },
                {
                  text: `${this.formatCurrency(Number(purchaseOrder.requested_total) || 0)}`,
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
        receptionTh: {
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

  /**
   * Generate Reception PDF for a received purchase order
   */
  async generateRecepcionPdf(
    purchaseOrder: PurchaseOrderBatch,
    language: PurchaseOrderDocumentLanguage = PurchaseOrderDocumentLanguage.ES,
  ): Promise<Buffer> {
    const printer = new PdfPrinter(this.fonts);
    const labels = getPurchaseOrderPdfLabels(language);
    const lineItems = purchaseOrder.line_items || [];
    const batches = purchaseOrder.batches || [];
    const batchesByLineItem = new Map<string, any[]>();
    const creatorName = [purchaseOrder.creator?.first_name, purchaseOrder.creator?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim() || 'N/A';
    const logoImage = await this.getFiscalLogoImage(purchaseOrder);

    for (const batch of batches) {
      const lineItemId = batch.purchase_order_detail_id;
      if (!lineItemId) {
        continue;
      }

      if (!batchesByLineItem.has(lineItemId)) {
        batchesByLineItem.set(lineItemId, []);
      }
      batchesByLineItem.get(lineItemId)?.push(batch);
    }

    const tableBody: any[] = [
      [
        { text: labels.product, style: 'receptionTh' },
        { text: labels.receivedBatches, style: 'receptionTh' },
        { text: labels.receivedQty, style: 'receptionTh' },
        { text: labels.unitPrice, style: 'receptionTh' },
        { text: labels.total, style: 'receptionTh' },
      ],
    ];

    for (const item of lineItems) {
      const quantity = Number(item.received_original_quantity) || 0;
      const unitPrice = Number(item.received_original_unit_total) || 0;
      const total = quantity * unitPrice;
      const itemBatches = batchesByLineItem.get(item.id) || [];
      const lotText = itemBatches.length
        ? itemBatches
            .map((batch, index) => {
              const lotIdentifier = batch.source_tag_identifier || batch.batch_number || labels.noTag;
              const lotQty = Number(batch.initial_quantity) || 0;
              const lotUom = batch.uom?.name || item.converted_uom?.name || 'UOM';
              return `${index + 1}. ${lotIdentifier} (${lotQty} ${lotUom})`;
            })
            .join('\n')
        : labels.noBatchesRegistered;
      const lotModeLabel = itemBatches.length > 1 ? 'MULTI' : 'SINGLE';
      const receivedUom = item.received_uom?.name || item.product_uom?.uom?.name || 'UOM';

      tableBody.push([
        {
          stack: [
            { text: item.product?.name || 'N/A', fontSize: 9, bold: true, color: '#111827' },
            { text: `${labels.modePrefix}: ${lotModeLabel}`, fontSize: 8, color: '#6b7280' },
          ],
        },
        { text: lotText, fontSize: 8, color: '#1f2937' },
        { text: `${quantity} ${receivedUom}`, fontSize: 9, alignment: 'center' },
        { text: this.formatCurrency(unitPrice), fontSize: 9, alignment: 'right' },
        { text: this.formatCurrency(total), fontSize: 9, alignment: 'right', bold: true },
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
                  text: labels.receptionDocumentTitle,
                  fontSize: 12,
                  bold: true,
                  color: '#111827',
                },
                {
                  text: `${labels.folioPrefix}: ${purchaseOrder.folio}`,
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
              text: labels.purchaseOrderTitle,
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
                { text: new Date(purchaseOrder.created_at).toLocaleDateString(labels.dateLocale), style: 'summaryValue' },
                { text: labels.createdBy, style: 'summaryLabel' },
                { text: creatorName, style: 'summaryValue' },
              ],
              [
                { text: labels.expectedDate, style: 'summaryLabel' },
                { text: new Date(purchaseOrder.expected_delivery_date).toLocaleDateString(labels.dateLocale), style: 'summaryValue' },
                { text: labels.receptionDate, style: 'summaryLabel' },
                { text: new Date().toLocaleDateString(labels.dateLocale), style: 'summaryValue' },
              ],
              [
                { text: labels.status, style: 'summaryLabel' },
                { text: translateGeneralStatus(purchaseOrder.general_status, labels), style: 'summaryValue' },
                { text: labels.payment, style: 'summaryLabel' },
                { text: translatePaymentStatus(purchaseOrder.payment_status, labels), style: 'summaryValue' },
              ],
            ],
          },
          layout: {
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
          },
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                {
                  stack: [
                    { text: labels.vendor, style: 'sectionTitle' },
                    { text: purchaseOrder.vendor?.name || 'N/A', style: 'sectionValue' },
                    { text: `${labels.rfcPrefix}: ${purchaseOrder.vendor?.rfc || 'N/A'}`, style: 'sectionMeta' },
                    {
                      text: `${labels.addressPrefix}: ${
                        [purchaseOrder.vendor?.street, purchaseOrder.vendor?.city, purchaseOrder.vendor?.state]
                          .filter(Boolean)
                          .join(', ') || 'N/A'
                      }`,
                      style: 'sectionMeta',
                    },
                  ],
                },
                {
                  stack: [
                    { text: labels.destinationWarehouse, style: 'sectionTitle' },
                    { text: purchaseOrder.warehouse?.name || 'N/A', style: 'sectionValue' },
                    {
                      text: `${purchaseOrder.warehouse?.city || 'N/A'}, ${purchaseOrder.warehouse?.state || 'N/A'}`,
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
          text: labels.receivedProductsDetail,
          style: 'sectionHeading',
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 160, 72, 80, 80],
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
              text: purchaseOrder.notes ? `${labels.notesPrefix}: ${purchaseOrder.notes}` : '',
              style: 'sectionMeta',
              margin: [0, 18, 0, 0],
            },
            {
              width: 200,
              margin: [0, 0, 0, 0],
              text: [
                { text: `${labels.subtotal}: `, bold: true, fontSize: 9 },
                { text: `${this.formatCurrency(Number(purchaseOrder.received_subtotal) || 0)}\n`, fontSize: 9 },
                { text: `${labels.vat}: `, bold: true, fontSize: 9 },
                { text: `${this.formatCurrency(Number(purchaseOrder.received_iva_total) || 0)}\n`, fontSize: 9 },
                { text: `${labels.ieps}: `, bold: true, fontSize: 9 },
                { text: `${this.formatCurrency(Number(purchaseOrder.received_ieps_total) || 0)}\n`, fontSize: 9 },
                { text: `${labels.totalLabel}: `, bold: true, fontSize: 10, color: '#0f172a' },
                {
                  text: `${this.formatCurrency(Number(purchaseOrder.received_total) || 0)}`,
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
        receptionTh: {
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

  /**
   * Upload purchase order PDF to S3
   */
  async uploadPdfToS3(
    purchaseOrder: PurchaseOrderBatch,
    pdfBuffer: Buffer,
    documentType: string = 'DOCUMENTO_ORIGINAL',
  ): Promise<{ s3Key: string; signedUrl: string }> {
    const safeDocumentType = documentType.replace(/\s+/g, '_').toUpperCase();
    const fileName = `${safeDocumentType}-${purchaseOrder.folio}.pdf`;

    const s3Key = await this.s3Service.uploadEntityFile(
      purchaseOrder.tenant_id,
      'purchase_orders',
      purchaseOrder.id,
      safeDocumentType,
      pdfBuffer,
      fileName,
      'application/pdf',
    );

    const signedUrl = await this.s3Service.getSignedUrl(s3Key, 3600); // 1 hour

    return { s3Key, signedUrl };
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number): string {
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private async getFiscalLogoImage(purchaseOrder: PurchaseOrderBatch): Promise<string | null> {
    const logoKey = purchaseOrder.fiscal_configuration?.logo;
    if (!logoKey) {
      return null;
    }

    try {
      const signedUrl = await this.s3Service.getSignedUrl(logoKey, 900);
      const response = await fetch(signedUrl);
      if (!response.ok) {
        return null;
      }

      const contentType = response.headers.get('content-type') || 'image/png';
      const buffer = Buffer.from(await response.arrayBuffer());
      return `data:${contentType};base64,${buffer.toString('base64')}`;
    } catch (_error) {
      return null;
    }
  }
}
