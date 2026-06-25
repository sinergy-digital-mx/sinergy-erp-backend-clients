import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3Service } from '../../../common/services/s3.service';
import { DocumentLanguage } from '../../../common/enums/document-language.enum';
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
  formatMoney,
  formatUsd,
  labelValueLine,
  leftLabelLines,
  productLine,
  twoColumnLine,
  wrapLines,
} from '../utils/escpos.util';

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
  ) {}

  async generateAndSavePosTicket(
    tenantId: string,
    salesOrderId: string,
    uploadedBy: string,
  ): Promise<PosReceiptResult> {
    const { order, collection } = await this.loadReceiptContext(tenantId, salesOrderId);
    const billingBranch = order.warehouse?.billing_branch_id
      ? await this.billingBranchRepo.findOne({
          where: { id: order.warehouse.billing_branch_id },
        })
      : null;

    const plainText = this.buildPlainTextReceipt(order, collection, billingBranch);
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
    );
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
    });
    if (!order) {
      throw new NotFoundException('Orden de venta no encontrada');
    }

    const ticketDoc = await this.findExistingTicket(salesOrderId);
    if (!ticketDoc) {
      throw new NotFoundException('Ticket de recibo no generado para esta orden');
    }

    return this.buildReceiptResultFromDocument(salesOrderId, ticketDoc);
  }

  /** Temporal: regenerar TICKET / RECIBO desde detalle de venta (backoffice). */
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

  private buildReceiptResult(
    escposBuffer: Buffer,
    plainText: string,
    documentId: string,
    fileName: string,
    downloadUrl: string | null,
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
      qz_raw_config: {
        type: 'raw',
        format: 'command',
        flavor: 'hex',
        data: escposHex,
      },
    };
  }

  private async buildReceiptResultFromDocument(
    salesOrderId: string,
    ticketDoc: {
      id: string;
      document_name: string;
      file_path: string;
      path?: string | null;
    },
  ): Promise<PosReceiptResult> {
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
      );
    } catch (error) {
      this.logger.warn(`Error leyendo ticket ${salesOrderId}: ${error}`);
    }

    return this.buildReceiptResult(
      Buffer.alloc(0),
      plainText,
      ticketDoc.id,
      ticketDoc.document_name,
      ticketDoc.path ?? null,
    );
  }

  private async findExistingTicket(salesOrderId: string) {
    const documents = await this.documentsService.getDocuments(salesOrderId);
    const ticketTypeId = await this.resolveTicketDocumentTypeId();
    return (
      documents.find((doc) => Number(doc.document_type_id) === ticketTypeId) ??
      documents.find((doc) =>
        SALES_ORDER_TICKET_RECIBO_NAMES.includes(
          doc.document_type_name as (typeof SALES_ORDER_TICKET_RECIBO_NAMES)[number],
        ),
      ) ??
      null
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
      .leftJoinAndSelect('so.warehouse', 'warehouse')
      .leftJoinAndSelect('so.customer', 'customer')
      .leftJoinAndSelect('so.seller_user', 'seller_user')
      .leftJoinAndSelect('so.collected_by_user', 'collected_by_user')
      .leftJoinAndSelect('so.line_items', 'line_items')
      .leftJoinAndSelect('line_items.product', 'product')
      .leftJoinAndSelect('line_items.product_uom', 'product_uom')
      .leftJoinAndSelect('product_uom.uom', 'uom')
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
    lines.push('');
    lines.push(
      `!N!${productLine('DESCRIPCION', 'CANT.', 'PRECIO', 'TOTAL', ESCPOS_CHARS_PER_LINE)}`,
    );

    let totalQty = 0;
    for (const item of order.line_items ?? []) {
      const qty = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      const discountPct = Number(item.discount_percentage) || 0;
      const lineSubtotal = qty * unitPrice;
      const lineTotal = lineSubtotal - (lineSubtotal * discountPct) / 100;
      totalQty += qty;

      const description = (item.product?.name ?? 'PRODUCTO').toUpperCase();
      lines.push(
        `!N!${productLine(
          description,
          this.formatQuantity(qty),
          formatMoney(unitPrice),
          formatMoney(lineTotal),
          ESCPOS_CHARS_PER_LINE,
        )}`,
      );
    }

    const orderTotal = Number(collection.order_total_mxn) || Number(order.total) || 0;
    const lineCount = order.line_items?.length ?? 0;

    lines.push('');
    lines.push(`!N!${labelValueLine('Total:', formatMoney(orderTotal))}`);
    lines.push(`!N!${'-'.repeat(ESCPOS_CHARS_PER_LINE)}`);
    lines.push(...this.buildPaymentLines(collection).map((line) => `!N!${line}`));
    lines.push(`!N!${'-'.repeat(ESCPOS_CHARS_PER_LINE)}`);
    lines.push(
      `!N!${twoColumnLine(
        `Renglones: ${lineCount}`,
        `Cantidad: ${this.formatQuantity(totalQty)}`,
      )}`,
    );
    lines.push('');
    this.pushFooterLines(lines, 'No. Caja:', '1');
    this.pushFooterLines(lines, 'Recibo No:', order.folio);
    this.pushFooterLines(lines, 'Por:', 'RECIBO AL PUBLICO EN GENERAL');
    this.pushFooterLines(lines, 'Cajero(a):', this.formatUserName(collection.collected_by_user));
    this.pushFooterLines(lines, 'Lo atendio:', this.formatUserName(order.seller_user));
    this.pushFooterLines(lines, 'Cliente:', this.formatCustomerName(order));
    lines.push('');
    lines.push('!CB!GRACIAS POR SU PREFERENCIA !!!');
    lines.push('!CB!REVISE SU CAMBIO Y SU MERCANCIA');
    lines.push('!CB!NO HAY CAMBIOS NI DEVOLUCIONES');

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

  private buildPaymentLines(collection: PosSaleCollection): string[] {
    const lines: string[] = [];
    const cashMxn = Number(collection.amount_cash_mxn) || 0;
    const cashUsd = Number(collection.amount_cash_usd) || 0;
    const transferMxn = Number(collection.amount_transfer_mxn) || 0;
    const cardMxn = Number(collection.amount_card_mxn) || 0;
    const changeMxn = Number(collection.change_cash_mxn) || 0;
    const changeUsd = Number(collection.change_cash_usd) || 0;
    const receivedMxn =
      Number(collection.received_cash_mxn) || (cashMxn > 0 ? cashMxn + changeMxn : 0);
    const receivedUsd =
      Number(collection.received_cash_usd) || (cashUsd > 0 ? cashUsd + changeUsd : 0);

    lines.push(
      labelValueLine('Recibido Efec. Pesos:', formatMoney(receivedMxn)),
    );
    lines.push(
      labelValueLine('Recibido Efec. Dolares:', formatUsd(receivedUsd)),
    );

    if (collection.payment_method === PosSalePaymentMethod.CARD && cardMxn > 0) {
      lines.push(labelValueLine('Tarjeta:', formatMoney(cardMxn)));
    } else if (collection.payment_method === PosSalePaymentMethod.TRANSFER && transferMxn > 0) {
      lines.push(labelValueLine('Transferencia:', formatMoney(transferMxn)));
    } else if (collection.payment_method === PosSalePaymentMethod.MIXED) {
      if (transferMxn > 0) lines.push(labelValueLine('Transferencia:', formatMoney(transferMxn)));
      if (cardMxn > 0) lines.push(labelValueLine('Tarjeta:', formatMoney(cardMxn)));
    }

    lines.push(labelValueLine('Cambio Pesos:', formatMoney(changeMxn)));
    lines.push(labelValueLine('Cambio Dolares:', formatUsd(changeUsd)));

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

  private formatCustomerName(order: SalesOrder): string {
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

  private extractPlainTextFromEscPos(buffer: Buffer): string {
    return buffer
      .toString('latin1')
      .replace(/\x1b./g, '')
      .replace(/\x1d./g, '')
      .replace(/[^\x20-\x7E\n\r]/g, '')
      .trim();
  }
}
