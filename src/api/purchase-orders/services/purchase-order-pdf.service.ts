import { Injectable } from '@nestjs/common';
import PdfPrinter from 'pdfmake';
import { S3Service } from '../../../common/services/s3.service';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
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
  async generatePdf(purchaseOrder: PurchaseOrderBatch): Promise<Buffer> {
    const printer = new PdfPrinter(this.fonts);
    const lineItems = purchaseOrder.line_items || [];

    // Build table body
    const tableBody: any[] = [
      [
        { text: 'Producto', style: 'th' },
        { text: 'Cantidad', style: 'th' },
        { text: 'Precio Unit.', style: 'th' },
        { text: 'Total', style: 'th' },
      ],
    ];

    for (const item of lineItems) {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_total) || 0;
      const total = quantity * unitPrice;

      tableBody.push([
        item.product?.name || 'N/A',
        { text: String(quantity), fontSize: 9 },
        this.formatCurrency(unitPrice),
        this.formatCurrency(total),
      ]);
    }

    const docDefinition: any = {
      content: [
        // Header
        {
          columns: [
            {
              text: 'LOGO AQUI',
              fontSize: 14,
              bold: true,
              color: '#1e3a8a',
            },
            {
              text: 'ORDEN DE COMPRA',
              fontSize: 18,
              bold: true,
              alignment: 'center',
              color: '#000000',
            },
            {
              text: [
                { text: `Folio: ${purchaseOrder.folio}\n`, fontSize: 10 },
                { text: `Fecha: ${new Date(purchaseOrder.created_at).toLocaleDateString('es-MX')}`, fontSize: 10 },
              ],
              alignment: 'right',
            },
          ],
          margin: [0, 0, 0, 8],
        },

        // Divider line
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 2,
              lineColor: '#1e3a8a',
            },
          ],
          margin: [0, 5, 0, 10],
        },

        // Vendor info
        {
          text: 'PROVEEDOR',
          style: 'header',
        },
        {
          text: [
            { text: 'Nombre: ', bold: true, fontSize: 9 },
            { text: `${purchaseOrder.vendor?.name || 'N/A'}\n`, fontSize: 9 },
            { text: 'RFC: ', bold: true, fontSize: 9 },
            { text: `${purchaseOrder.vendor?.rfc || 'N/A'}`, fontSize: 9 },
          ],
          fontSize: 9,
          margin: [0, 3, 0, 8],
        },

        // Warehouse info
        {
          text: 'ALMACÉN DE DESTINO',
          style: 'header',
        },
        {
          text: [
            { text: 'Nombre: ', bold: true, fontSize: 9 },
            { text: `${purchaseOrder.warehouse?.name || 'N/A'}\n`, fontSize: 9 },
            { text: 'Ubicación: ', bold: true, fontSize: 9 },
            { text: `${purchaseOrder.warehouse?.city || 'N/A'}, ${purchaseOrder.warehouse?.state || 'N/A'}`, fontSize: 9 },
          ],
          fontSize: 9,
          margin: [0, 3, 0, 8],
        },

        // Delivery date
        {
          text: 'FECHA DE ENTREGA ESPERADA',
          style: 'header',
        },
        {
          text: new Date(purchaseOrder.expected_delivery_date).toLocaleDateString('es-MX'),
          fontSize: 9,
          margin: [0, 3, 0, 8],
        },

        // Line items
        {
          text: 'ARTÍCULOS',
          style: 'header',
        },
        {
          style: 'table',
          table: {
            headerRows: 1,
            widths: ['*', 80, 100, 100],
            body: tableBody,
          },
          layout: {
            fillColor: (i: number) => (i === 0 ? '#1e3a8a' : i % 2 === 0 ? '#f0f0f0' : null),
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#1e3a8a',
            vLineColor: () => '#1e3a8a',
          },
          margin: [0, 10, 0, 10],
        },

        // Totals
        {
          columns: [
            { text: '' },
            {
              text: [
                { text: 'Subtotal: ', bold: true, fontSize: 9 },
                { text: `${this.formatCurrency(Number(purchaseOrder.requested_subtotal) || 0)}\n`, fontSize: 9 },
                { text: 'IVA: ', bold: true, fontSize: 9 },
                { text: `${this.formatCurrency(Number(purchaseOrder.requested_iva_total) || 0)}\n`, fontSize: 9 },
                { text: 'IEPS: ', bold: true, fontSize: 9 },
                { text: `${this.formatCurrency(Number(purchaseOrder.requested_ieps_total) || 0)}\n`, fontSize: 9 },
                { text: 'TOTAL: ', bold: true, fontSize: 10, color: '#1e3a8a' },
                { text: `${this.formatCurrency(Number(purchaseOrder.requested_total) || 0)}`, fontSize: 10, bold: true, color: '#1e3a8a' },
              ],
              alignment: 'right',
              fontSize: 9,
            },
          ],
          margin: [0, 8, 0, 0],
        },

        // Status
        {
          text: [
            { text: 'Estado: ', bold: true, fontSize: 9 },
            { text: `${purchaseOrder.general_status}\n`, fontSize: 9 },
            { text: 'Pago: ', bold: true, fontSize: 9 },
            { text: `${purchaseOrder.payment_status}`, fontSize: 9 },
          ],
          fontSize: 9,
          margin: [0, 8, 0, 0],
        },

        // Notes
        ...(purchaseOrder.notes
          ? [
              {
                text: 'NOTAS',
                style: 'header',
                margin: [0, 8, 0, 0],
              },
              {
                text: purchaseOrder.notes,
                fontSize: 9,
                margin: [0, 3, 0, 0],
              },
            ]
          : []),
      ],
      styles: {
        header: {
          fontSize: 11,
          bold: true,
          color: '#1e3a8a',
          margin: [0, 8, 0, 3],
        },
        th: {
          bold: true,
          fillColor: '#1e3a8a',
          color: '#ffffff',
          alignment: 'center',
          fontSize: 9,
        },
        table: {
          margin: [0, 3, 0, 5],
          fontSize: 9,
        },
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
  async generateRecepcionPdf(purchaseOrder: PurchaseOrderBatch): Promise<Buffer> {
    const printer = new PdfPrinter(this.fonts);
    const lineItems = purchaseOrder.line_items || [];

    // Build table body
    const tableBody: any[] = [
      [
        { text: 'Producto', style: 'th' },
        { text: 'Cantidad', style: 'th' },
        { text: 'Precio Unit.', style: 'th' },
        { text: 'Total', style: 'th' },
      ],
    ];

    for (const item of lineItems) {
      const quantity = Number(item.received_original_quantity) || 0;
      const unitPrice = Number(item.received_original_unit_total) || 0;
      const total = quantity * unitPrice;

      tableBody.push([
        item.product?.name || 'N/A',
        { text: String(quantity), fontSize: 9 },
        this.formatCurrency(unitPrice),
        this.formatCurrency(total),
      ]);
    }

    const docDefinition: any = {
      content: [
        // Header
        {
          columns: [
            {
              text: 'LOGO AQUI',
              fontSize: 14,
              bold: true,
              color: '#1e3a8a',
            },
            {
              text: 'COMPROBANTE DE RECEPCIÓN',
              fontSize: 18,
              bold: true,
              alignment: 'center',
              color: '#000000',
            },
            {
              text: [
                { text: `Folio: ${purchaseOrder.folio}\n`, fontSize: 10 },
                { text: `Fecha Orden: ${new Date(purchaseOrder.created_at).toLocaleDateString('es-MX')}\n`, fontSize: 10 },
                { text: `Fecha Recepción: ${new Date().toLocaleDateString('es-MX')}`, fontSize: 10 },
              ],
              alignment: 'right',
            },
          ],
          margin: [0, 0, 0, 8],
        },

        // Divider line
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 2,
              lineColor: '#1e3a8a',
            },
          ],
          margin: [0, 5, 0, 10],
        },

        // Vendor info
        {
          text: 'PROVEEDOR',
          style: 'header',
        },
        {
          text: [
            { text: 'Nombre: ', bold: true, fontSize: 9 },
            { text: `${purchaseOrder.vendor?.name || 'N/A'}\n`, fontSize: 9 },
            { text: 'RFC: ', bold: true, fontSize: 9 },
            { text: `${purchaseOrder.vendor?.rfc || 'N/A'}`, fontSize: 9 },
          ],
          fontSize: 9,
          margin: [0, 3, 0, 8],
        },

        // Warehouse info
        {
          text: 'ALMACÉN DE DESTINO',
          style: 'header',
        },
        {
          text: [
            { text: 'Nombre: ', bold: true, fontSize: 9 },
            { text: `${purchaseOrder.warehouse?.name || 'N/A'}\n`, fontSize: 9 },
            { text: 'Ubicación: ', bold: true, fontSize: 9 },
            { text: `${purchaseOrder.warehouse?.city || 'N/A'}, ${purchaseOrder.warehouse?.state || 'N/A'}`, fontSize: 9 },
          ],
          fontSize: 9,
          margin: [0, 3, 0, 8],
        },

        // Line items
        {
          text: 'ARTÍCULOS RECIBIDOS',
          style: 'header',
        },
        {
          style: 'table',
          table: {
            headerRows: 1,
            widths: ['*', 80, 100, 100],
            body: tableBody,
          },
          layout: {
            fillColor: (i: number) => (i === 0 ? '#1e3a8a' : i % 2 === 0 ? '#f0f0f0' : null),
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#1e3a8a',
            vLineColor: () => '#1e3a8a',
          },
          margin: [0, 10, 0, 10],
        },

        // Totals
        {
          columns: [
            { text: '' },
            {
              text: [
                { text: 'Subtotal: ', bold: true, fontSize: 9 },
                { text: `${this.formatCurrency(Number(purchaseOrder.received_subtotal) || 0)}\n`, fontSize: 9 },
                { text: 'IVA: ', bold: true, fontSize: 9 },
                { text: `${this.formatCurrency(Number(purchaseOrder.received_iva_total) || 0)}\n`, fontSize: 9 },
                { text: 'IEPS: ', bold: true, fontSize: 9 },
                { text: `${this.formatCurrency(Number(purchaseOrder.received_ieps_total) || 0)}\n`, fontSize: 9 },
                { text: 'TOTAL: ', bold: true, fontSize: 10, color: '#1e3a8a' },
                { text: `${this.formatCurrency(Number(purchaseOrder.received_total) || 0)}`, fontSize: 10, bold: true, color: '#1e3a8a' },
              ],
              alignment: 'right',
              fontSize: 9,
            },
          ],
          margin: [0, 8, 0, 0],
        },

        // Status
        {
          text: [
            { text: 'Estado: ', bold: true, fontSize: 9 },
            { text: `${purchaseOrder.general_status}\n`, fontSize: 9 },
            { text: 'Pago: ', bold: true, fontSize: 9 },
            { text: `${purchaseOrder.payment_status}`, fontSize: 9 },
          ],
          fontSize: 9,
          margin: [0, 8, 0, 0],
        },

        // Notes
        ...(purchaseOrder.notes
          ? [
              {
                text: 'NOTAS',
                style: 'header',
                margin: [0, 8, 0, 0],
              },
              {
                text: purchaseOrder.notes,
                fontSize: 9,
                margin: [0, 3, 0, 0],
              },
            ]
          : []),
      ],
      styles: {
        header: {
          fontSize: 11,
          bold: true,
          color: '#1e3a8a',
          margin: [0, 8, 0, 3],
        },
        th: {
          bold: true,
          fillColor: '#1e3a8a',
          color: '#ffffff',
          alignment: 'center',
          fontSize: 9,
        },
        table: {
          margin: [0, 3, 0, 5],
          fontSize: 9,
        },
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
  ): Promise<{ s3Key: string; signedUrl: string }> {
    const fileName = `ODC-${purchaseOrder.folio}.pdf`;
    const documentType = 'DOCUMENTO_ORIGINAL';

    const s3Key = await this.s3Service.uploadFile(
      purchaseOrder.tenant_id,
      purchaseOrder.id,
      documentType,
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
}
