import { Injectable } from '@nestjs/common';
import PdfPrinter from 'pdfmake';
import { S3Service } from '../../../common/services/s3.service';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { PurchaseOrderDocumentLanguage } from '../../../entities/purchase-orders/purchase-order-document-language.enum';
import {
  getPurchaseOrderPdfLabels,
  PurchaseOrderPdfLabels,
  translateGeneralStatus,
  translatePaymentStatus,
} from './purchase-order-pdf-labels';
import * as path from 'path';

const COLORS = {
  primary: '#1E3A5F',
  primarySoft: '#E8EEF5',
  text: '#111827',
  muted: '#6B7280',
  label: '#4B5563',
  light: '#F3F4F6',
  lightAlt: '#FAFBFC',
  line: '#E5E7EB',
  white: '#FFFFFF',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#2563EB',
};

type PurchaseDocKind = 'original' | 'reception';

interface PurchaseTotals {
  subtotal: number;
  iva: number;
  ieps: number;
  total: number;
}

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

  async generatePdf(
    purchaseOrder: PurchaseOrderBatch,
    language: PurchaseOrderDocumentLanguage = PurchaseOrderDocumentLanguage.ES,
  ): Promise<Buffer> {
    return this.buildDocument(purchaseOrder, language, 'original');
  }

  async generateRecepcionPdf(
    purchaseOrder: PurchaseOrderBatch,
    language: PurchaseOrderDocumentLanguage = PurchaseOrderDocumentLanguage.ES,
  ): Promise<Buffer> {
    return this.buildDocument(purchaseOrder, language, 'reception');
  }

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

    const signedUrl = await this.s3Service.getSignedUrl(s3Key, 3600);
    return { s3Key, signedUrl };
  }

  private async buildDocument(
    purchaseOrder: PurchaseOrderBatch,
    language: PurchaseOrderDocumentLanguage,
    kind: PurchaseDocKind,
  ): Promise<Buffer> {
    const printer = new PdfPrinter(this.fonts);
    const labels = getPurchaseOrderPdfLabels(language);
    const logoImage = await this.getFiscalLogoImage(purchaseOrder);
    const subtitle =
      kind === 'original' ? labels.originalDocumentTitle : labels.receptionDocumentTitle;
    const totals = this.getTotals(purchaseOrder, kind);

    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [28, 28, 28, 40],
      content: [
        this.buildHeader(purchaseOrder, labels, logoImage, subtitle),
        this.buildAccentLine(),
        this.buildMetaCards(purchaseOrder, labels, kind),
        this.buildPartyCards(purchaseOrder, labels),
        kind === 'original'
          ? this.buildRequestedProducts(purchaseOrder, labels)
          : this.buildReceivedProducts(purchaseOrder, labels),
        this.buildNotesAndTotals(purchaseOrder, labels, totals),
      ],
      footer: (currentPage: number, pageCount: number) => ({
        columns: [
          {
            text: subtitle,
            fontSize: 7,
            color: COLORS.muted,
          },
          {
            text: `${labels.pageLabel} ${currentPage} / ${pageCount}`,
            fontSize: 7,
            color: COLORS.muted,
            alignment: 'right',
          },
        ],
        margin: [28, 12, 28, 0],
      }),
      defaultStyle: {
        fontSize: 9,
        color: COLORS.text,
      },
    };

    return this.renderPdf(printer, docDefinition);
  }

  private buildHeader(
    purchaseOrder: PurchaseOrderBatch,
    labels: PurchaseOrderPdfLabels,
    logoImage: string | null,
    subtitle: string,
  ): any {
    return {
      columns: [
        {
          width: '*',
          stack: [
            {
              text: subtitle.toUpperCase(),
              fontSize: 8,
              bold: true,
              color: COLORS.muted,
              characterSpacing: 0.4,
            },
            {
              text: labels.purchaseOrderTitle,
              fontSize: 14,
              bold: true,
              color: COLORS.primary,
              margin: [0, 3, 0, 0],
            },
            {
              text: `${labels.folioPrefix}  ${purchaseOrder.folio}`,
              fontSize: 10,
              bold: true,
              color: COLORS.label,
              margin: [0, 4, 0, 0],
            },
          ],
          margin: [0, 6, 0, 0],
        },
        {
          width: 160,
          ...(logoImage
            ? {
                image: logoImage,
                fit: [150, 58],
                alignment: 'right',
              }
            : { text: '' }),
        },
      ],
      margin: [0, 0, 0, 6],
    };
  }

  private buildAccentLine(): any {
    return {
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 0,
          x2: 539,
          y2: 0,
          lineWidth: 1.5,
          lineColor: COLORS.primary,
        },
      ],
      margin: [0, 0, 0, 12],
    };
  }

  private buildMetaCards(
    purchaseOrder: PurchaseOrderBatch,
    labels: PurchaseOrderPdfLabels,
    kind: PurchaseDocKind,
  ): any {
    const creatorName = [purchaseOrder.creator?.first_name, purchaseOrder.creator?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim() || 'N/A';
    const createdAt = new Date(purchaseOrder.created_at).toLocaleDateString(labels.dateLocale);
    const expectedAt = new Date(purchaseOrder.expected_delivery_date).toLocaleDateString(
      labels.dateLocale,
    );
    const status = translateGeneralStatus(purchaseOrder.general_status, labels);
    const payment = translatePaymentStatus(purchaseOrder.payment_status, labels);

    const cards =
      kind === 'original'
        ? [
            this.metaCell(labels.creationDate, createdAt),
            this.gapCell(),
            this.metaCell(labels.createdBy, creatorName),
            this.gapCell(),
            this.metaCell(labels.expectedDate, expectedAt),
            this.gapCell(),
            this.metaCell(labels.status, status, this.statusColor(purchaseOrder.general_status)),
            this.gapCell(),
            this.metaCell(labels.payment, payment, this.paymentColor(purchaseOrder.payment_status)),
          ]
        : [
            this.metaCell(labels.creationDate, createdAt),
            this.gapCell(),
            this.metaCell(labels.createdBy, creatorName),
            this.gapCell(),
            this.metaCell(labels.expectedDate, expectedAt),
            this.gapCell(),
            this.metaCell(
              labels.receptionDate,
              new Date().toLocaleDateString(labels.dateLocale),
            ),
            this.gapCell(),
            this.metaCell(labels.status, status, this.statusColor(purchaseOrder.general_status)),
            this.gapCell(),
            this.metaCell(labels.payment, payment, this.paymentColor(purchaseOrder.payment_status)),
          ];

    return {
      stack: [
        {
          text: labels.summary.toUpperCase(),
          fontSize: 8,
          bold: true,
          color: COLORS.muted,
          margin: [0, 0, 0, 6],
        },
        {
          table: {
            widths:
              kind === 'original'
                ? ['*', 6, '*', 6, '*', 6, '*', 6, '*']
                : ['*', 6, '*', 6, '*', 6, '*', 6, '*', 6, '*'],
            body: [cards],
          },
          layout: this.equalHeightLayout(),
        },
      ],
      margin: [0, 0, 0, 10],
    };
  }

  private buildPartyCards(
    purchaseOrder: PurchaseOrderBatch,
    labels: PurchaseOrderPdfLabels,
  ): any {
    const vendorAddress =
      [purchaseOrder.vendor?.street, purchaseOrder.vendor?.city, purchaseOrder.vendor?.state]
        .filter(Boolean)
        .join(', ') || 'N/A';
    const warehouseLocation = `${purchaseOrder.warehouse?.city || 'N/A'}, ${purchaseOrder.warehouse?.state || 'N/A'}`;

    return {
      table: {
        widths: ['*', 8, '*'],
        body: [
          [
            this.partyCell(labels.vendor, [
              {
                text: purchaseOrder.vendor?.name || 'N/A',
                fontSize: 10,
                bold: true,
                color: COLORS.text,
                margin: [0, 0, 0, 3],
              },
              {
                text: `${labels.rfcPrefix}: ${purchaseOrder.vendor?.rfc || 'N/A'}`,
                fontSize: 8,
                color: COLORS.muted,
                margin: [0, 0, 0, 1],
              },
              {
                text: `${labels.addressPrefix}: ${vendorAddress}`,
                fontSize: 8,
                color: COLORS.muted,
              },
            ]),
            this.gapCell(),
            this.partyCell(labels.destinationWarehouse, [
              {
                text: purchaseOrder.warehouse?.name || 'N/A',
                fontSize: 10,
                bold: true,
                color: COLORS.text,
                margin: [0, 0, 0, 3],
              },
              {
                text: `${labels.branchPrefix}: ${purchaseOrder.warehouse?.billing_branch?.code || 'N/A'}`,
                fontSize: 8,
                color: COLORS.muted,
                margin: [0, 0, 0, 1],
              },
              { text: warehouseLocation, fontSize: 8, color: COLORS.muted },
            ]),
          ],
        ],
      },
      layout: this.equalHeightLayout(),
      margin: [0, 0, 0, 14],
    };
  }

  private buildRequestedProducts(
    purchaseOrder: PurchaseOrderBatch,
    labels: PurchaseOrderPdfLabels,
  ): any {
    const lineItems = purchaseOrder.line_items || [];
    const tableBody: any[] = [
      [
        { text: labels.product, ...this.thCell('left') },
        { text: labels.requestedQty, ...this.thCell('center') },
        { text: labels.unitPrice, ...this.thCell('right') },
        { text: labels.total, ...this.thCell('right') },
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
            { text: item.product?.name || 'N/A', fontSize: 9, bold: true, color: COLORS.text },
            {
              text: `${labels.unitPrefix}: ${requestedUom}`,
              fontSize: 7.5,
              color: COLORS.muted,
              margin: [0, 1, 0, 0],
            },
          ],
        },
        { text: `${quantity} ${requestedUom}`, fontSize: 9, alignment: 'center', color: COLORS.text },
        { text: this.formatCurrency(unitPrice), fontSize: 9, alignment: 'right', color: COLORS.text },
        {
          text: this.formatCurrency(total),
          fontSize: 9,
          alignment: 'right',
          bold: true,
          color: COLORS.text,
        },
      ]);
    }

    return this.productsTable(labels.requestedProductsDetail, ['*', 100, 90, 90], tableBody);
  }

  private buildReceivedProducts(
    purchaseOrder: PurchaseOrderBatch,
    labels: PurchaseOrderPdfLabels,
  ): any {
    const lineItems = purchaseOrder.line_items || [];
    const batches = purchaseOrder.batches || [];
    const batchesByLineItem = new Map<string, any[]>();

    for (const batch of batches) {
      const lineItemId = batch.purchase_order_detail_id;
      if (!lineItemId) continue;
      if (!batchesByLineItem.has(lineItemId)) {
        batchesByLineItem.set(lineItemId, []);
      }
      batchesByLineItem.get(lineItemId)?.push(batch);
    }

    const tableBody: any[] = [
      [
        { text: labels.product, ...this.thCell('left') },
        { text: labels.receivedBatches, ...this.thCell('left') },
        { text: labels.receivedQty, ...this.thCell('center') },
        { text: labels.unitPrice, ...this.thCell('right') },
        { text: labels.total, ...this.thCell('right') },
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
            { text: item.product?.name || 'N/A', fontSize: 9, bold: true, color: COLORS.text },
            {
              text: `${labels.modePrefix}: ${lotModeLabel}`,
              fontSize: 7.5,
              color: COLORS.muted,
              margin: [0, 1, 0, 0],
            },
          ],
        },
        { text: lotText, fontSize: 8, color: COLORS.text },
        { text: `${quantity} ${receivedUom}`, fontSize: 9, alignment: 'center', color: COLORS.text },
        { text: this.formatCurrency(unitPrice), fontSize: 9, alignment: 'right', color: COLORS.text },
        {
          text: this.formatCurrency(total),
          fontSize: 9,
          alignment: 'right',
          bold: true,
          color: COLORS.text,
        },
      ]);
    }

    return this.productsTable(
      labels.receivedProductsDetail,
      ['*', 150, 78, 80, 78],
      tableBody,
    );
  }

  private productsTable(title: string, widths: any[], body: any[]): any {
    return {
      stack: [
        {
          text: title.toUpperCase(),
          fontSize: 8,
          bold: true,
          color: COLORS.muted,
          margin: [0, 0, 0, 6],
        },
        {
          table: {
            headerRows: 1,
            widths,
            body,
          },
          layout: {
            fillColor: (rowIndex: number) => {
              if (rowIndex === 0) return COLORS.primarySoft;
              return rowIndex % 2 === 0 ? COLORS.lightAlt : COLORS.white;
            },
            hLineWidth: () => 0.4,
            vLineWidth: () => 0,
            hLineColor: () => COLORS.line,
            paddingTop: () => 6,
            paddingBottom: () => 6,
            paddingLeft: () => 8,
            paddingRight: () => 8,
          },
        },
      ],
      margin: [0, 0, 0, 12],
    };
  }

  private buildNotesAndTotals(
    purchaseOrder: PurchaseOrderBatch,
    labels: PurchaseOrderPdfLabels,
    totals: PurchaseTotals,
  ): any {
    const notesText = purchaseOrder.notes?.trim();

    return {
      table: {
        widths: ['*', 228],
        body: [
          [
            {
              stack: [
                {
                  text: labels.notesPrefix.toUpperCase(),
                  fontSize: 8,
                  bold: true,
                  color: COLORS.muted,
                  margin: [0, 0, 0, 6],
                },
                {
                  text: notesText || labels.notesEmpty,
                  fontSize: 9,
                  color: notesText ? COLORS.text : COLORS.muted,
                  italics: !notesText,
                },
              ],
              fillColor: COLORS.light,
              border: [false, false, false, false],
              margin: [14, 14, 16, 14],
            },
            {
              stack: [this.buildTotalsTable(labels, totals)],
              fillColor: COLORS.light,
              border: [false, false, false, false],
              margin: [10, 12, 12, 12],
            },
          ],
        ],
      },
      layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
      margin: [0, 0, 0, 0],
    };
  }

  private buildTotalsTable(labels: PurchaseOrderPdfLabels, totals: PurchaseTotals): any {
    return {
      table: {
        widths: ['*', 82],
        body: [
          this.totalRow(labels.subtotal, totals.subtotal),
          this.totalRow(labels.vat, totals.iva),
          this.totalRow(labels.ieps, totals.ieps),
          this.totalRow(labels.totalLabel, totals.total, true),
        ],
      },
      layout: {
        hLineWidth: (i: number, node: any) => (i === node.table.body.length - 1 ? 0 : 0),
        vLineWidth: () => 0,
        paddingTop: (i: number, node: any) => (i === node.table.body.length - 1 ? 7 : 4),
        paddingBottom: (i: number, node: any) => (i === node.table.body.length - 1 ? 7 : 4),
        paddingLeft: () => 8,
        paddingRight: () => 8,
      },
    };
  }

  private totalRow(label: string, amount: number, strong = false): any[] {
    if (strong) {
      return [
        {
          text: label,
          fontSize: 10,
          bold: true,
          color: COLORS.primary,
          fillColor: COLORS.primarySoft,
        },
        {
          text: this.formatCurrency(amount),
          fontSize: 10,
          bold: true,
          color: COLORS.primary,
          fillColor: COLORS.primarySoft,
          alignment: 'right',
        },
      ];
    }

    return [
      { text: label, fontSize: 8.5, color: COLORS.muted },
      {
        text: this.formatCurrency(amount),
        fontSize: 8.5,
        color: COLORS.text,
        alignment: 'right',
        bold: true,
      },
    ];
  }

  private metaCell(label: string, value: string, valueColor: string = COLORS.text): any {
    return {
      stack: [
        {
          text: label.toUpperCase(),
          fontSize: 6.5,
          bold: true,
          color: COLORS.muted,
          margin: [0, 0, 0, 4],
        },
        { text: value, fontSize: 8, bold: true, color: valueColor },
      ],
      fillColor: COLORS.light,
      margin: [8, 8, 8, 8],
    };
  }

  private partyCell(title: string, content: any[]): any {
    return {
      stack: [
        {
          text: title.toUpperCase(),
          fontSize: 7,
          bold: true,
          color: COLORS.muted,
          margin: [0, 0, 0, 6],
        },
        ...content,
      ],
      fillColor: COLORS.light,
      margin: [10, 10, 10, 10],
    };
  }

  private gapCell(): any {
    return { text: '', fillColor: COLORS.white };
  }

  private equalHeightLayout() {
    return {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    };
  }

  private thCell(alignment: 'left' | 'center' | 'right'): Record<string, unknown> {
    return {
      fontSize: 7.5,
      bold: true,
      color: COLORS.primary,
      alignment,
    };
  }

  private getTotals(purchaseOrder: PurchaseOrderBatch, kind: PurchaseDocKind): PurchaseTotals {
    if (kind === 'reception') {
      return {
        subtotal: Number(purchaseOrder.received_subtotal) || 0,
        iva: Number(purchaseOrder.received_iva_total) || 0,
        ieps: Number(purchaseOrder.received_ieps_total) || 0,
        total: Number(purchaseOrder.received_total) || 0,
      };
    }

    return {
      subtotal: Number(purchaseOrder.requested_subtotal) || 0,
      iva: Number(purchaseOrder.requested_iva_total) || 0,
      ieps: Number(purchaseOrder.requested_ieps_total) || 0,
      total: Number(purchaseOrder.requested_total) || 0,
    };
  }

  private statusColor(status: string | null | undefined): string {
    switch (status) {
      case 'Recibida':
        return COLORS.success;
      case 'Cancelada':
        return COLORS.danger;
      default:
        return COLORS.info;
    }
  }

  private paymentColor(status: string | null | undefined): string {
    return status === 'Pagado' ? COLORS.success : COLORS.warning;
  }

  private formatCurrency(amount: number): string {
    return (
      '$' +
      amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  }

  private async getFiscalLogoImage(purchaseOrder: PurchaseOrderBatch): Promise<string | null> {
    const logoKey = purchaseOrder.fiscal_configuration?.logo;
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
