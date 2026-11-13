import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import PdfPrinter from 'pdfmake';
import * as QRCode from 'qrcode';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { S3Service } from '../../../common/services/s3.service';
import { DocumentLanguage } from '../../../common/enums/document-language.enum';
import {
  buildPublicInvoiceCode,
  buildSelfInvoicePortalUrl,
  withCollisionSuffix,
} from '../../../common/utils/public-invoice-code.util';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { PosSaleCollection } from '../../../entities/pos/pos-sale-collection.entity';
import { PosSalePaymentMethod } from '../../../entities/pos/pos-sale-payment-method.enum';
import { BillingBranch } from '../../../entities/billing/billing-branch.entity';
import { SalesOrderDocumentsService } from './sales-order-documents.service';
import { SalesOrderDocumentType } from '../../../entities/sales-orders/sales-order-document-type.entity';
import {
  EscPosBuilder,
  ESCPOS_CHARS_PER_LINE,
  bufferToEscPosHex,
  compactMoneyLine,
  formatMoney,
  formatUnitMoney,
  formatUsd,
  labelValueLine,
  leftLabelLines,
  productLine,
  twoColumnLine,
  wrapLines,
  observationTicketLines,
} from '../utils/escpos.util';
import { cardPaymentsForResponse } from '../../pos-shifts/utils/pos-card-payments.util';
import { displayCashChange } from '../../pos-shifts/utils/pos-cash-payment.util';
import { invoiceMonthDeadlineLine } from '../utils/invoice-month-deadline.util';

export const SALES_ORDER_TICKET_RECIBO_NAMES = ['TICKET / RECIBO', 'TICKET_RECIBO'] as const;

export interface PosReceiptResult {
  document_id: string;
  file_name: string;
  mime_type: string;
  download_url: string | null;
  escpos_base64: string;
  /** Preferir esto en QZ Tray (flavor hex). NO convertir a array de números. */
  escpos_hex: string;
  plain_text: string;
  printer_profile: string;
  /** Solo depuración / vista previa. NO enviar a impresora. */
  print_mode: 'raw_escpos_base64';
  /** Config QZ lista para `qz.print(config, [qz_raw_config])` */
  qz_raw_config: {
    type: 'raw';
    format: 'command';
    flavor: 'hex';
    data: string;
  };
  public_invoice_code: string | null;
  self_invoice_url: string | null;
}

@Injectable()
export class SalesOrderPosReceiptService {
  private readonly logger = new Logger(SalesOrderPosReceiptService.name);
  private ticketDocumentTypeIdCache: number | null = null;

  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepo: Repository<SalesOrder>,
    @InjectRepository(PosSaleCollection)
    private readonly collectionRepo: Repository<PosSaleCollection>,
    @InjectRepository(BillingBranch)
    private readonly billingBranchRepo: Repository<BillingBranch>,
    @InjectRepository(SalesOrderDocumentType)
    private readonly documentTypeRepo: Repository<SalesOrderDocumentType>,
    private readonly documentsService: SalesOrderDocumentsService,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {}

  async generateAndSavePosTicket(
    tenantId: string,
    salesOrderId: string,
    uploadedBy: string,
  ): Promise<PosReceiptResult> {
    const { order, collection } = await this.loadReceiptContext(tenantId, salesOrderId);
    const billingBranchId =
      order.billing_branch_id ?? order.warehouse?.billing_branch_id ?? null;
    const billingBranch = billingBranchId
      ? await this.billingBranchRepo.findOne({
          where: { id: billingBranchId },
        })
      : null;

    const publicInvoiceCode = await this.ensurePublicInvoiceCode(order, billingBranch);
    const selfInvoiceUrl = this.buildPortalUrl(publicInvoiceCode, order.customer?.email);

    const plainText = this.buildPlainTextReceipt(
      order,
      collection,
      billingBranch,
      publicInvoiceCode,
      selfInvoiceUrl,
    );
    const escposBuffer = this.buildEscPosReceipt(plainText);
    const fileName = `TICKET_RECIBO-${order.folio}.escpos`;

    const s3Key = await this.s3Service.uploadEntityFile(
      tenantId,
      'sales_orders',
      order.id,
      'TICKET_RECIBO',
      escposBuffer,
      fileName,
      'application/octet-stream',
    );

    await this.deleteExistingTickets(salesOrderId);

    const ticketDocumentTypeId = await this.resolveTicketDocumentTypeId();

    const document = await this.documentsService.uploadDocument(
      salesOrderId,
      ticketDocumentTypeId,
      fileName,
      s3Key,
      escposBuffer.length,
      'application/octet-stream',
      uploadedBy,
      DocumentLanguage.ES,
    );

    let downloadUrl: string | null = null;
    try {
      downloadUrl = await this.s3Service.getSignedUrl(s3Key, 3600);
    } catch (error) {
      this.logger.warn(`No se pudo firmar URL del ticket ${salesOrderId}: ${error}`);
    }

    return this.buildReceiptResult(
      escposBuffer,
      plainText,
      document.id,
      fileName,
      downloadUrl,
      publicInvoiceCode,
      selfInvoiceUrl,
    );
  }

  async getPosTicketPdf(
    tenantId: string,
    salesOrderId: string,
    uploadedBy: string,
  ): Promise<{ buffer: Buffer; fileName: string; generated: boolean }> {
    const order = await this.salesOrderRepo.findOne({
      where: { id: salesOrderId, tenant_id: tenantId },
    });
    if (!order) {
      throw new NotFoundException('Orden de venta no encontrada');
    }

    let generated = false;
    let receipt: PosReceiptResult;
    try {
      receipt = await this.getPosTicket(tenantId, salesOrderId);
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
      receipt = await this.generateAndSavePosTicket(tenantId, salesOrderId, uploadedBy);
      generated = true;
    }

    let text = receipt.plain_text?.trim() ?? '';
    if (!text) {
      receipt = await this.generateAndSavePosTicket(tenantId, salesOrderId, uploadedBy);
      text = receipt.plain_text?.trim() || 'Ticket sin contenido';
      generated = true;
    }

    const buffer = await this.renderThermalPdf(text, receipt.self_invoice_url);
    const safeFolio = String(order.folio || salesOrderId).replace(/[^\w.-]+/g, '_');
    return { buffer, fileName: `TICKET-${safeFolio}.pdf`, generated };
  }

  async getPosTicketRawBuffer(
    tenantId: string,
    salesOrderId: string,
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const order = await this.salesOrderRepo.findOne({
      where: { id: salesOrderId, tenant_id: tenantId },
    });
    if (!order) {
      throw new NotFoundException('Orden de venta no encontrada');
    }

    const ticketDoc = await this.findExistingTicket(salesOrderId);
    if (!ticketDoc) {
      throw new NotFoundException('Ticket de recibo no generado para esta orden');
    }

    const buffer = await this.s3Service.getFileBuffer(ticketDoc.file_path);
    return { buffer, fileName: ticketDoc.document_name };
  }

  async getPosTicket(tenantId: string, salesOrderId: string): Promise<PosReceiptResult> {
    const order = await this.salesOrderRepo.findOne({
      where: { id: salesOrderId, tenant_id: tenantId },
      relations: ['customer'],
    });
    if (!order) {
      throw new NotFoundException('Orden de venta no encontrada');
    }

    const ticketDoc = await this.findExistingTicket(salesOrderId);
    if (!ticketDoc) {
      throw new NotFoundException('Ticket de recibo no generado para esta orden');
    }

    return this.buildReceiptResultFromDocument(order, ticketDoc);
  }

  /** Reimprimir ticket guardado — no crea ni reemplaza documentos. */
  async reprintPosTicket(tenantId: string, salesOrderId: string): Promise<PosReceiptResult> {
    return this.getPosTicket(tenantId, salesOrderId);
  }

  /** Regenerar ticket — elimina el anterior y crea uno nuevo. */
  async regeneratePosTicket(
    tenantId: string,
    salesOrderId: string,
    uploadedBy: string,
  ): Promise<PosReceiptResult> {
    this.logger.warn(
      `[TEMP] Regenerando ticket POS ${salesOrderId} por usuario ${uploadedBy}`,
    );
    return this.generateAndSavePosTicket(tenantId, salesOrderId, uploadedBy);
  }

  /** Regenerar ticket solo si ya existe (p. ej. al actualizar observaciones). */
  async refreshTicketIfExists(
    tenantId: string,
    salesOrderId: string,
    uploadedBy: string,
  ): Promise<void> {
    const ticketDoc = await this.findExistingTicket(salesOrderId);
    if (!ticketDoc) {
      return;
    }
    await this.generateAndSavePosTicket(tenantId, salesOrderId, uploadedBy);
  }

  private buildReceiptResult(
    escposBuffer: Buffer,
    plainText: string,
    documentId: string,
    fileName: string,
    downloadUrl: string | null,
    publicInvoiceCode: string | null = null,
    selfInvoiceUrl: string | null = null,
  ): PosReceiptResult {
    const escposHex = bufferToEscPosHex(escposBuffer);
    return {
      document_id: documentId,
      file_name: fileName,
      mime_type: 'application/octet-stream',
      download_url: downloadUrl,
      escpos_base64: escposBuffer.toString('base64'),
      escpos_hex: escposHex,
      plain_text: this.stripStyleMarkers(plainText),
      printer_profile: 'bixolon-srp-330iii-escpos-80mm',
      print_mode: 'raw_escpos_base64',
      public_invoice_code: publicInvoiceCode,
      self_invoice_url: selfInvoiceUrl,
      qz_raw_config: {
        type: 'raw',
        format: 'command',
        flavor: 'hex',
        data: escposHex,
      },
    };
  }

  private async buildReceiptResultFromDocument(
    order: SalesOrder,
    ticketDoc: {
      id: string;
      document_name: string;
      file_path: string;
      path?: string | null;
    },
  ): Promise<PosReceiptResult> {
    const publicInvoiceCode = order.public_invoice_code ?? null;
    const selfInvoiceUrl = publicInvoiceCode
      ? this.buildPortalUrl(publicInvoiceCode, order.customer?.email)
      : null;
    let plainText = '';
    try {
      const buffer = await this.s3Service.getFileBuffer(ticketDoc.file_path);
      plainText = this.extractPlainTextFromEscPos(buffer);
      return this.buildReceiptResult(
        buffer,
        plainText,
        ticketDoc.id,
        ticketDoc.document_name,
        ticketDoc.path ?? null,
        publicInvoiceCode,
        selfInvoiceUrl,
      );
    } catch (error) {
      this.logger.warn(`Error leyendo ticket ${order.id}: ${error}`);
    }

    return this.buildReceiptResult(
      Buffer.alloc(0),
      plainText,
      ticketDoc.id,
      ticketDoc.document_name,
      ticketDoc.path ?? null,
      publicInvoiceCode,
      selfInvoiceUrl,
    );
  }

  private async renderThermalPdf(
    plainText: string,
    selfInvoiceUrl?: string | null,
  ): Promise<Buffer> {
    const lines = plainText.split(/\r?\n/);
    const qrUrl = selfInvoiceUrl?.trim() || this.findInvoiceUrl(lines);
    const qrImage = qrUrl
      ? await QRCode.toDataURL(qrUrl, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 320,
        })
      : null;
    const content = this.buildThermalPdfContent(lines, qrUrl, qrImage);
    const lineHeight = 10;
    const qrBlock = qrImage ? 148 : 0;
    const width = 226.77;
    const height = Math.max(360, 36 + lines.length * lineHeight + qrBlock);
    const printer = new PdfPrinter({
      Roboto: {
        normal: path.join(process.cwd(), 'src/_public/fonts/Roboto-Regular.ttf'),
        bold: path.join(process.cwd(), 'src/_public/fonts/Roboto-Bold.ttf'),
        italics: path.join(process.cwd(), 'src/_public/fonts/Roboto-Italic.ttf'),
        bolditalics: path.join(process.cwd(), 'src/_public/fonts/Roboto-BoldItalic.ttf'),
      },
    });

    return new Promise<Buffer>((resolve, reject) => {
      try {
        const pdfDoc = printer.createPdfKitDocument({
          pageSize: { width, height },
          pageMargins: [10, 12, 10, 12],
          defaultStyle: { font: 'Roboto', fontSize: 7.5 },
          content,
        });
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

  private buildThermalPdfContent(
    lines: string[],
    qrUrl: string | null,
    qrImage: string | null,
  ): any[] {
    const content: any[] = [];
    let qrPlaced = false;
    for (const line of lines) {
      if (qrImage && qrUrl && !qrPlaced && this.isInvoiceUrlStart(line, qrUrl)) {
        content.push({
          image: qrImage,
          width: 132,
          alignment: 'center',
          margin: [0, 6, 0, 6],
        });
        qrPlaced = true;
      }
      content.push({
        text: line.length ? line : ' ',
        fontSize: 7.5,
        margin: [0, 0, 0, 0],
      });
    }
    if (qrImage && !qrPlaced) {
      content.push({
        image: qrImage,
        width: 132,
        alignment: 'center',
        margin: [0, 6, 0, 4],
      });
    }
    return content;
  }

  private findInvoiceUrl(lines: string[]): string | null {
    for (let index = 0; index < lines.length; index += 1) {
      const start = lines[index].trim();
      if (!/^https?:\/\//i.test(start)) {
        continue;
      }
      let url = start;
      for (let next = index + 1; next < lines.length; next += 1) {
        const part = lines[next].trim();
        if (!part || /\s/.test(part) || !/^[A-Za-z0-9\-._~:/?#\[\]@!$&'()*+,;=%]+$/.test(part)) {
          break;
        }
        url += part;
      }
      return url;
    }
    return null;
  }

  private isInvoiceUrlStart(line: string, qrUrl: string): boolean {
    const text = line.trim();
    return text.startsWith('http') && (qrUrl.startsWith(text) || text.startsWith(qrUrl));
  }

  private async findExistingTicket(salesOrderId: string) {
    const documents = await this.documentsService.getDocuments(salesOrderId);
    const ticketTypeId = await this.resolveTicketDocumentTypeId();
    const byType = documents.find((doc) => Number(doc.document_type_id) === ticketTypeId);
    if (byType) return byType;
    const byName = documents.find((doc) =>
      SALES_ORDER_TICKET_RECIBO_NAMES.includes(
        doc.document_type_name as (typeof SALES_ORDER_TICKET_RECIBO_NAMES)[number],
      ),
    );
    if (byName) return byName;
    return (
      documents.find((doc) => {
        const type = String(doc.document_type_name || '').toUpperCase();
        const file = String(doc.document_name || doc.file_name || '').toUpperCase();
        return type.includes('TICKET') || file.startsWith('TICKET_RECIBO');
      }) ?? null
    );
  }

  private async resolveTicketDocumentTypeId(): Promise<number> {
    if (this.ticketDocumentTypeIdCache != null) {
      return this.ticketDocumentTypeIdCache;
    }

    for (const name of SALES_ORDER_TICKET_RECIBO_NAMES) {
      const found = await this.documentTypeRepo.findOne({ where: { name } });
      if (found) {
        this.ticketDocumentTypeIdCache = found.id;
        return found.id;
      }
    }

    const created = await this.documentTypeRepo.save(
      this.documentTypeRepo.create({
        name: 'TICKET / RECIBO',
        description: 'Ticket térmico ESC/POS de cobro POS',
      }),
    );
    this.ticketDocumentTypeIdCache = created.id;
    this.logger.log(`Tipo de documento TICKET / RECIBO creado con id ${created.id}`);
    return created.id;
  }

  private async loadReceiptContext(tenantId: string, salesOrderId: string) {
    const order = await this.salesOrderRepo
      .createQueryBuilder('so')
      .where('so.id = :id AND so.tenant_id = :tenantId', { id: salesOrderId, tenantId })
      .leftJoinAndSelect('so.fiscal_configuration', 'fiscal_configuration')
      .leftJoinAndSelect('so.billing_branch', 'billing_branch')
      .leftJoinAndSelect('so.warehouse', 'warehouse')
      .leftJoinAndSelect('so.customer', 'customer')
      .leftJoinAndSelect('so.seller_user', 'seller_user')
      .leftJoinAndSelect('so.collected_by_user', 'collected_by_user')
      .leftJoinAndSelect('so.line_items', 'line_items')
      .leftJoinAndSelect('line_items.product', 'product')
      .leftJoinAndSelect('line_items.product_uom', 'product_uom')
      .leftJoinAndSelect('product_uom.uom', 'uom')
      .leftJoinAndSelect('line_items.product_discount', 'product_discount')
      .leftJoinAndSelect('so.global_discount', 'global_discount')
      .getOne();

    if (!order) {
      throw new NotFoundException('Orden de venta no encontrada');
    }

    const collection = await this.collectionRepo.findOne({
      where: { sales_order_id: salesOrderId },
      relations: ['collected_by_user'],
    });
    if (!collection) {
      throw new NotFoundException('Cobro no encontrado para generar ticket');
    }

    return { order, collection };
  }

  private async deleteExistingTickets(salesOrderId: string): Promise<void> {
    const documents = await this.documentsService.getDocuments(salesOrderId);
    const ticketTypeId = await this.resolveTicketDocumentTypeId();
    for (const doc of documents) {
      const isTicket =
        Number(doc.document_type_id) === ticketTypeId ||
        SALES_ORDER_TICKET_RECIBO_NAMES.includes(
          doc.document_type_name as (typeof SALES_ORDER_TICKET_RECIBO_NAMES)[number],
        );
      if (isTicket) {
        await this.documentsService.deleteDocument(doc.id);
      }
    }
  }

  private buildPlainTextReceipt(
    order: SalesOrder,
    collection: PosSaleCollection,
    billingBranch: BillingBranch | null,
    publicInvoiceCode: string,
    selfInvoiceUrl: string,
  ): string {
    const lines: string[] = [];
    const fiscal = order.fiscal_configuration;
    const businessName = order.fiscal_razon_social || fiscal?.razon_social || 'EMPRESA';
    const rfc = fiscal?.rfc ?? '';
    const address = this.formatBranchAddress(billingBranch, order);
    const soldAt = collection.created_at ?? order.updated_at ?? new Date();

    lines.push(`!H!${businessName.toUpperCase()}`);
    if (rfc) lines.push(`!H!${rfc}`);
    lines.push(`!C!${this.formatDateTime(soldAt)}`);
    if (address) {
      for (const addressLine of wrapLines(address.toUpperCase(), ESCPOS_CHARS_PER_LINE)) {
        lines.push(`!S!${addressLine}`);
      }
    }
    const branchPhone = this.formatBranchPhone(billingBranch);
    if (branchPhone) {
      lines.push(`!S!TEL: ${branchPhone.toUpperCase()}`);
    }
    // Orden en USD: los importes se guardan en MXN; el ticket los muestra en dólares al T.C. de la orden.
    const usdRate = Number(order.exchange_rate) || 0;
    const inUsd = order.currency === 'USD' && usdRate > 0;
    const toDoc = (mxn: number) => (inUsd ? Math.round((mxn / usdRate) * 100) / 100 : mxn);
    const money = (mxn: number) => (inUsd ? formatUsd(toDoc(mxn)) : formatMoney(mxn));
    const lineMoney = (mxn: number) => formatMoney(toDoc(mxn));
    const unitMoney = (mxn: number) => formatUnitMoney(inUsd ? mxn / usdRate : mxn);

    lines.push('');
    if (inUsd) {
      lines.push(`!N!${compactMoneyLine('Moneda:', `USD  T.C. ${usdRate.toFixed(4)}`)}`);
    }
    lines.push(
      `!N!${productLine('DESCRIPCION', 'CANT.', 'PRECIO', 'TOTAL', ESCPOS_CHARS_PER_LINE)}`,
    );

    let totalQty = 0;
    let subtotalBeforeDiscount = 0;
    let totalLineDiscountAmount = 0;

    for (const item of order.line_items ?? []) {
      const qty = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      const discountUnit = Number(item.discount_unit) || 0;
      const lineSubtotal = qty * unitPrice;
      const lineDiscount = discountUnit * qty;
      const lineTotal = lineSubtotal - lineDiscount;
      totalQty += qty;
      subtotalBeforeDiscount += lineSubtotal;
      totalLineDiscountAmount += lineDiscount;

      const description = (item.product?.name ?? 'PRODUCTO').toUpperCase();
      lines.push(
        `!N!${productLine(
          description,
          this.formatQuantity(qty),
          unitMoney(unitPrice),
          lineMoney(lineTotal),
          ESCPOS_CHARS_PER_LINE,
        )}`,
      );

      if (lineDiscount > 0) {
        const discountLabel = item.product_discount?.name
          ? `DESC PROD: ${item.product_discount.name.toUpperCase()}`
          : 'DESCUENTO PRODUCTO';
        lines.push(`!N!${compactMoneyLine(`  ${discountLabel}`, `-${money(lineDiscount)}`)}`);
      }
    }

    const globalDiscountAmount = Number(order.global_discount_amount) || 0;
    const orderTotal = Number(collection.order_total_mxn) || Number(order.total) || 0;
    const lineCount = order.line_items?.length ?? 0;

    lines.push('');
    lines.push(`!N!${compactMoneyLine('Subtotal:', money(subtotalBeforeDiscount))}`);
    lines.push(
      `!N!${compactMoneyLine('Descuento:', `-${money(totalLineDiscountAmount + globalDiscountAmount)}`)}`,
    );
    if (totalLineDiscountAmount > 0) {
      lines.push(
        `!N!${compactMoneyLine('  Desc. por producto:', `-${money(totalLineDiscountAmount)}`)}`,
      );
    }
    if (globalDiscountAmount > 0) {
      const globalLabel = order.global_discount?.name
        ? `Desc. global (${order.global_discount.name})`
        : 'Desc. global';
      lines.push(`!N!${compactMoneyLine(`  ${globalLabel}:`, `-${money(globalDiscountAmount)}`)}`);
    }
    if (inUsd) {
      // IVA = total − (subtotal − descuentos) para que la suma en USD cuadre al centavo.
      const totalUsd = toDoc(orderTotal);
      const netUsd =
        toDoc(subtotalBeforeDiscount) - toDoc(totalLineDiscountAmount + globalDiscountAmount);
      lines.push(`!N!${compactMoneyLine('IVA:', formatUsd(Math.round((totalUsd - netUsd) * 100) / 100))}`);
      lines.push(`!N!${compactMoneyLine('Total:', formatUsd(totalUsd))}`);
      lines.push(`!N!${compactMoneyLine('Equivale a:', `${formatMoney(orderTotal)} MXN`)}`);
    } else {
      lines.push(
        `!N!${compactMoneyLine('IVA:', formatMoney(Number(order.iva_total) || 0))}`,
      );
      lines.push(`!N!${compactMoneyLine('Total:', formatMoney(orderTotal))}`);
    }
    lines.push(`!N!${'-'.repeat(ESCPOS_CHARS_PER_LINE)}`);
    lines.push(...this.buildPaymentLines(collection, inUsd ? usdRate : null).map((line) => `!N!${line}`));
    lines.push(`!N!${'-'.repeat(ESCPOS_CHARS_PER_LINE)}`);
    lines.push(
      `!N!${twoColumnLine(
        `Renglones: ${lineCount}`,
        `Cantidad: ${this.formatQuantity(totalQty)}`,
      )}`,
    );
    lines.push('');
    this.pushFooterLines(lines, 'No. Caja:', '1');
    this.pushFooterLines(lines, 'Recibo No:', publicInvoiceCode);
    this.pushFooterLines(lines, 'Por:', 'RECIBO AL PUBLICO EN GENERAL');
    this.pushFooterLines(lines, 'Cajero(a):', this.formatUserName(collection.collected_by_user));
    this.pushFooterLines(lines, 'Lo atendio:', this.formatUserName(order.seller_user));
    this.pushFooterLines(lines, 'Cliente:', this.formatCustomerName(order));
    if (order.walk_in_phone) {
      this.pushFooterLines(lines, 'Tel:', order.walk_in_phone);
    }
    if (order.walk_in_rfc) {
      this.pushFooterLines(lines, 'RFC:', order.walk_in_rfc);
    }
    const observationLines = observationTicketLines(order.notes);
    if (observationLines.length) {
      lines.push('');
      for (const observationLine of observationLines) {
        lines.push(`!N!${observationLine}`);
      }
    }
    lines.push('');
    lines.push('!CB!GRACIAS POR SU PREFERENCIA !!!');
    lines.push('!CB!REVISE SU CAMBIO Y SU MERCANCIA');
    lines.push('!CB!NO HAY CAMBIOS NI DEVOLUCIONES');
    lines.push('');
    lines.push('!CB!FACTURA TU COMPRA');
    lines.push(`!CB!${invoiceMonthDeadlineLine(soldAt)}`);
    lines.push('!C!Escanea el QR o entra a:');
    for (const part of wrapLines(selfInvoiceUrl, ESCPOS_CHARS_PER_LINE)) {
      lines.push(`!S!${part}`);
    }
    lines.push(`!QR!${selfInvoiceUrl}`);
    lines.push(`!C!Folio: ${publicInvoiceCode}`);

    return lines.join('\n');
  }

  private pushFooterLines(lines: string[], label: string, value: string): void {
    for (const part of leftLabelLines(label, value)) {
      lines.push(`!N!${part}`);
    }
  }

  private buildEscPosReceipt(plainText: string): Buffer {
    const builder = new EscPosBuilder().initialize();

    for (const rawLine of plainText.split('\n')) {
      if (!rawLine) {
        builder.textLine('');
        continue;
      }

      const { style, text } = this.parseStyleLine(rawLine);
      switch (style) {
        case 'H':
          builder
            .align('center')
            .selectFontA()
            .characterSizeDouble()
            .bold(true)
            .textLine(text)
            .bold(false)
            .characterSizeNormal()
            .align('left');
          break;
        case 'S':
          builder
            .align('center')
            .selectFontB()
            .characterSizeNormal()
            .bold(false)
            .textLine(text)
            .selectFontA()
            .align('left');
          break;
        case 'C':
          builder
            .align('center')
            .selectFontA()
            .characterSizeNormal()
            .bold(false)
            .textLine(text)
            .align('left');
          break;
        case 'CB':
          builder
            .align('center')
            .selectFontA()
            .characterSizeNormal()
            .bold(true)
            .textLine(text)
            .bold(false)
            .align('left');
          break;
        case 'QR':
          if (text) {
            builder.align('center').qr(text, 5).textLine('').align('left');
          }
          break;
        default:
          builder.align('left').selectFontA().characterSizeNormal().bold(false).textLine(text);
      }
    }

    return builder.cut(true).build();
  }

  private parseStyleLine(line: string): { style: string; text: string } {
    const match = line.match(/^!([A-Z]+)!(.*)$/);
    if (match) {
      return { style: match[1], text: match[2] };
    }
    return { style: 'N', text: line };
  }

  private stripStyleMarkers(text: string): string {
    return text.replace(/^![A-Z]+!/gm, '');
  }

  private buildPaymentLines(collection: PosSaleCollection, documentUsdRate: number | null = null): string[] {
    const lines: string[] = [];
    const cashMxn = Number(collection.amount_cash_mxn) || 0;
    const cashUsd = Number(collection.amount_cash_usd) || 0;
    const transferMxn = Number(collection.amount_transfer_mxn) || 0;
    const cardMxn = Number(collection.amount_card_mxn) || 0;
    const checkMxn = Number(collection.amount_check_mxn) || 0;
    const checkUsd = Number(collection.amount_check_usd) || 0;
    const changeMxn = Number(collection.change_cash_mxn) || 0;
    const changeUsd = Number(collection.change_cash_usd) || 0;
    const changeShown = displayCashChange(
      changeMxn,
      changeUsd,
      Number(collection.usd_exchange_rate) || 0,
    );
    const receivedMxn =
      Number(collection.received_cash_mxn) || (cashMxn > 0 ? cashMxn + changeMxn : 0);
    const receivedUsd =
      Number(collection.received_cash_usd) || (cashUsd > 0 ? cashUsd + changeUsd : 0);

    lines.push(
      compactMoneyLine('Recibido Pesos:', formatMoney(receivedMxn)),
    );
    lines.push(
      compactMoneyLine('Recibido Dolares:', formatUsd(receivedUsd)),
    );

    if (collection.payment_method === PosSalePaymentMethod.CARD && cardMxn > 0) {
      lines.push(compactMoneyLine('Tarjeta:', formatMoney(cardMxn)));
    } else if (collection.payment_method === PosSalePaymentMethod.TRANSFER && transferMxn > 0) {
      lines.push(compactMoneyLine('Transferencia:', formatMoney(transferMxn)));
    } else if (collection.payment_method === PosSalePaymentMethod.CHECK && (checkMxn > 0 || checkUsd > 0)) {
      if (checkMxn > 0) lines.push(compactMoneyLine('Cheque:', formatMoney(checkMxn)));
      if (checkUsd > 0) lines.push(compactMoneyLine('Cheque USD:', formatUsd(checkUsd)));
    } else if (collection.payment_method === PosSalePaymentMethod.CREDIT) {
      const creditMxn = Number(collection.amount_credit_mxn) || 0;
      if (creditMxn > 0) {
        lines.push(
          compactMoneyLine(
            'Credito:',
            documentUsdRate
              ? formatUsd(Math.round((creditMxn / documentUsdRate) * 100) / 100)
              : formatMoney(creditMxn),
          ),
        );
      }
    } else if (collection.payment_method === PosSalePaymentMethod.MIXED) {
      if (transferMxn > 0) lines.push(compactMoneyLine('Transferencia:', formatMoney(transferMxn)));
      const cardPayments = cardPaymentsForResponse(
        collection.card_payments,
        cardMxn,
        collection.card_reference,
      );
      if (cardPayments.length > 1) {
        cardPayments.forEach((payment, index) => {
          lines.push(compactMoneyLine(`Tarjeta ${index + 1}:`, formatMoney(payment.amount_mxn)));
        });
      } else if (cardMxn > 0) {
        lines.push(compactMoneyLine('Tarjeta:', formatMoney(cardMxn)));
      }
      if (checkMxn > 0) {
        lines.push(compactMoneyLine('Cheque:', formatMoney(checkMxn)));
      }
      if (checkUsd > 0) {
        lines.push(compactMoneyLine('Cheque USD:', formatUsd(checkUsd)));
      }
    }

    lines.push(...payerTicketLines(collection));
    lines.push(compactMoneyLine('Cambio Pesos:', formatMoney(changeShown.mxn)));
    lines.push(compactMoneyLine('Cambio Dolares:', formatUsd(changeShown.usd)));

    return lines;
  }

  private formatBranchAddress(
    billingBranch: BillingBranch | null,
    order: SalesOrder,
  ): string {
    if (billingBranch) {
      return [billingBranch.address, billingBranch.city, billingBranch.state]
        .filter(Boolean)
        .join(', ');
    }
    const warehouse = order.warehouse;
    if (!warehouse) return '';
    return [warehouse.street, warehouse.city, warehouse.state].filter(Boolean).join(', ');
  }

  private formatBranchPhone(billingBranch: BillingBranch | null): string {
    const phone = billingBranch?.phone?.trim();
    return phone || '';
  }

  private formatCustomerName(order: SalesOrder): string {
    const walkInName = order.walk_in_name?.trim();
    if (walkInName) {
      return walkInName.toUpperCase();
    }
    const customer = order.customer;
    if (!customer) return 'MOSTRADOR';
    if (customer.company_name) return customer.company_name.toUpperCase();
    const fullName = [customer.name, customer.lastname].filter(Boolean).join(' ').trim();
    if (fullName) return fullName.toUpperCase();
    if (customer.fiscal_razon_social) return customer.fiscal_razon_social.toUpperCase();
    return 'MOSTRADOR';
  }

  private formatUserName(user?: { first_name?: string | null; last_name?: string | null } | null): string {
    if (!user) return 'N/A';
    return [user.first_name, user.last_name].filter(Boolean).join(' ').trim().toUpperCase() || 'N/A';
  }

  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Tijuana',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date(date));
  }

  private formatQuantity(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/\.?0+$/, '');
  }

  async assignPublicInvoiceCode(order: SalesOrder): Promise<{ code: string; url: string }> {
    const branch = order.billing_branch ?? order.warehouse?.billing_branch ?? null;
    const code = await this.ensurePublicInvoiceCode(order, branch);
    return {
      code,
      url: this.buildPortalUrl(code, order.customer?.email),
    };
  }

  private async ensurePublicInvoiceCode(
    order: SalesOrder,
    billingBranch: BillingBranch | null,
  ): Promise<string> {
    if (order.public_invoice_code) {
      return order.public_invoice_code;
    }

    const fiscal = order.fiscal_configuration;
    let code = buildPublicInvoiceCode(
      fiscal?.prefix,
      billingBranch?.prefix,
      order.folio,
      order.fiscal_razon_social || fiscal?.razon_social,
      billingBranch?.code || billingBranch?.city,
    );

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await this.salesOrderRepo.update({ id: order.id }, { public_invoice_code: code });
        order.public_invoice_code = code;
        return code;
      } catch (error) {
        if (!this.isUniqueViolation(error)) {
          throw error;
        }
        code = withCollisionSuffix(code, order.id);
      }
    }

    throw new Error(`No se pudo asignar folio público al recibo ${order.folio}`);
  }

  private buildPortalUrl(publicInvoiceCode: string, email?: string | null): string {
    const base = this.configService.get<string>('SELF_INVOICE_PORTAL_BASE_URL');
    const usableEmail =
      email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? email.trim() : null;
    return buildSelfInvoicePortalUrl(publicInvoiceCode, usableEmail, base);
  }

  private isUniqueViolation(error: unknown): boolean {
    if (error instanceof QueryFailedError) {
      const driver = error.driverError as { errno?: number; code?: string } | undefined;
      return driver?.errno === 1062 || driver?.code === 'ER_DUP_ENTRY';
    }
    return false;
  }

  private extractPlainTextFromEscPos(buffer: Buffer): string {
    return buffer
      .toString('latin1')
      .replace(/\x1b./g, '')
      .replace(/\x1d./g, '')
      .replace(/[^\x20-\x7E\n\r]/g, '')
      .trim();
  }
}

function payerTicketLines(collection: PosSaleCollection): string[] {
  const lines: string[] = [];
  const transferMxn = Number(collection.amount_transfer_mxn) || 0;
  const cardMxn = Number(collection.amount_card_mxn) || 0;
  const checkMxn = Number(collection.amount_check_mxn) || 0;
  const checkUsd = Number(collection.amount_check_usd) || 0;
  if (transferMxn > 0 && collection.transfer_payer_name) {
    lines.push(...leftLabelLines('Nombre transf.:', collection.transfer_payer_name));
  }
  if (transferMxn > 0 && collection.transfer_payer_business_name) {
    lines.push(...leftLabelLines('Razon social:', collection.transfer_payer_business_name));
  }
  if (cardMxn > 0 && collection.card_payer_name) {
    lines.push(...leftLabelLines('Nombre tarjeta:', collection.card_payer_name));
  }
  if (cardMxn > 0 && collection.card_payer_phone) {
    lines.push(...leftLabelLines('Tel. tarjeta:', collection.card_payer_phone));
  }
  if ((checkMxn > 0 || checkUsd > 0) && collection.check_payer_name) {
    lines.push(...leftLabelLines('Nombre cheque:', collection.check_payer_name));
  }
  if ((checkMxn > 0 || checkUsd > 0) && collection.check_payer_phone) {
    lines.push(...leftLabelLines('Tel. cheque:', collection.check_payer_phone));
  }
  return lines;
}
