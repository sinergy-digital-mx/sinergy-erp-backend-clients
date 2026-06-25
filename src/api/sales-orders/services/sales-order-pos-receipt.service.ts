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
  formatMoney,
  labelValueLine,
  productLine,
} from '../utils/escpos.util';

export const SALES_ORDER_TICKET_RECIBO_NAMES = ['TICKET / RECIBO', 'TICKET_RECIBO'] as const;

export interface PosReceiptResult {
  document_id: string;
  file_name: string;
  mime_type: string;
  download_url: string | null;
  escpos_base64: string;
  plain_text: string;
  printer_profile: string;
  /** Solo depuración / vista previa. NO enviar a impresora. */
  print_mode: 'raw_escpos_base64';
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

    return {
      document_id: document.id,
      file_name: fileName,
      mime_type: 'application/octet-stream',
      download_url: downloadUrl,
      escpos_base64: escposBuffer.toString('base64'),
      plain_text: plainText,
      printer_profile: 'bixolon-srp-330iii-escpos-80mm',
      print_mode: 'raw_escpos_base64',
    };
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

  private async buildReceiptResultFromDocument(
    salesOrderId: string,
    ticketDoc: {
      id: string;
      document_name: string;
      file_path: string;
      path?: string | null;
    },
  ): Promise<PosReceiptResult> {
    let escposBase64 = '';
    let plainText = '';
    try {
      const buffer = await this.s3Service.getFileBuffer(ticketDoc.file_path);
      escposBase64 = buffer.toString('base64');
      plainText = this.extractPlainTextFromEscPos(buffer);
    } catch (error) {
      this.logger.warn(`Error leyendo ticket ${salesOrderId}: ${error}`);
    }

    return {
      document_id: ticketDoc.id,
      file_name: ticketDoc.document_name,
      mime_type: 'application/octet-stream',
      download_url: ticketDoc.path ?? null,
      escpos_base64: escposBase64,
      plain_text: plainText,
      printer_profile: 'bixolon-srp-330iii-escpos-80mm',
      print_mode: 'raw_escpos_base64',
    };
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

    lines.push(businessName.toUpperCase());
    lines.push(businessName.toUpperCase());
    if (rfc) lines.push(rfc);
    if (address) lines.push(address.toUpperCase());
    lines.push(this.formatDateTime(soldAt));
    lines.push('');
    lines.push(
      productLine('DESCRIPCION', 'CANT.', 'PRECIO', 'TOTAL', ESCPOS_CHARS_PER_LINE),
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
        productLine(
          description,
          this.formatQuantity(qty),
          formatMoney(unitPrice),
          formatMoney(lineTotal),
          ESCPOS_CHARS_PER_LINE,
        ),
      );
    }

    const orderTotal = Number(collection.order_total_mxn) || Number(order.total) || 0;
    lines.push('');
    lines.push(labelValueLine('Total:', formatMoney(orderTotal)));
    lines.push('Recibido + :');
    lines.push(...this.buildPaymentLines(collection));
    lines.push('');
    lines.push(labelValueLine('Rens :', String(order.line_items?.length ?? 0)));
    lines.push(labelValueLine('Tot-Cant:', this.formatQuantity(totalQty)));
    lines.push('');
    lines.push(labelValueLine('No. Caja:', '1'));
    lines.push(labelValueLine('Recibo No:', order.folio));
    lines.push(labelValueLine('Por:', 'RECIBO AL PUBLICO EN GENERAL'));
    lines.push(labelValueLine('Cajero(a):', this.formatUserName(collection.collected_by_user)));
    lines.push(labelValueLine('Lo atendio:', this.formatUserName(order.seller_user)));
    lines.push(labelValueLine('Cliente:', this.formatCustomerName(order)));
    lines.push(labelValueLine('Saldo Global:', formatMoney(0)));
    lines.push('');
    if (address) lines.push(address.toUpperCase());
    lines.push('');
    lines.push(this.center('GRACIAS POR SU PREFERENCIA !!!'));
    lines.push(this.center('REVISE SU CAMBIO Y SU MERCANCIA'));
    lines.push(this.center('NO HAY CAMBIOS NI DEVOLUCIONES'));

    return lines.join('\n');
  }

  private buildEscPosReceipt(plainText: string): Buffer {
    const builder = new EscPosBuilder().initialize().align('center');
    const textLines = plainText.split('\n');
    let headerLinesPrinted = 0;

    for (const line of textLines) {
      const trimmed = line.trim();

      if (!trimmed) {
        builder.textLine('');
        continue;
      }

      if (
        trimmed === 'GRACIAS POR SU PREFERENCIA !!!' ||
        trimmed === 'REVISE SU CAMBIO Y SU MERCANCIA' ||
        trimmed === 'NO HAY CAMBIOS NI DEVOLUCIONES'
      ) {
        builder
          .align('center')
          .characterSizeNormal()
          .bold(true)
          .textLine(trimmed)
          .bold(false)
          .align('left');
        continue;
      }

      const isBusinessHeader =
        headerLinesPrinted < 4 &&
        !trimmed.includes('$') &&
        trimmed === trimmed.toUpperCase() &&
        trimmed.length > 3;

      if (isBusinessHeader) {
        headerLinesPrinted++;
        builder
          .align('center')
          .characterSizeDouble()
          .bold(true)
          .textLine(trimmed)
          .bold(false)
          .characterSizeNormal()
          .align('left');
        continue;
      }

      builder.align('left').characterSizeNormal().textLine(line);
    }

    return builder.cut(true).build();
  }

  private buildPaymentLines(collection: PosSaleCollection): string[] {
    const lines: string[] = [];
    const cashMxn = Number(collection.amount_cash_mxn) || 0;
    const cashUsd = Number(collection.amount_cash_usd) || 0;
    const transferMxn = Number(collection.amount_transfer_mxn) || 0;
    const cardMxn = Number(collection.amount_card_mxn) || 0;
    const changeMxn = Number(collection.change_cash_mxn) || 0;
    const changeUsd = Number(collection.change_cash_usd) || 0;

    if (collection.payment_method === PosSalePaymentMethod.CASH) {
      if (cashMxn > 0) {
        lines.push(labelValueLine('Efectivo PESOS -> :', formatMoney(cashMxn)));
      }
      if (cashUsd > 0) {
        lines.push(labelValueLine('Efectivo DOLARES -> :', formatMoney(cashUsd)));
      }
    } else if (collection.payment_method === PosSalePaymentMethod.CARD) {
      lines.push(labelValueLine('Tarjeta -> :', formatMoney(cardMxn)));
    } else if (collection.payment_method === PosSalePaymentMethod.TRANSFER) {
      lines.push(labelValueLine('Transferencia -> :', formatMoney(transferMxn)));
    } else {
      if (cashMxn > 0) lines.push(labelValueLine('Efectivo PESOS -> :', formatMoney(cashMxn)));
      if (cashUsd > 0) lines.push(labelValueLine('Efectivo DOLARES -> :', formatMoney(cashUsd)));
      if (transferMxn > 0) {
        lines.push(labelValueLine('Transferencia -> :', formatMoney(transferMxn)));
      }
      if (cardMxn > 0) lines.push(labelValueLine('Tarjeta -> :', formatMoney(cardMxn)));
    }

    if (changeMxn > 0) {
      lines.push(labelValueLine('Cambio = :', formatMoney(changeMxn)));
    } else if (changeUsd > 0) {
      lines.push(labelValueLine('Cambio USD = :', formatMoney(changeUsd)));
    } else {
      lines.push(labelValueLine('Cambio = :', formatMoney(0)));
    }

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

  private center(text: string): string {
    if (text.length >= ESCPOS_CHARS_PER_LINE) return text;
    const pad = Math.floor((ESCPOS_CHARS_PER_LINE - text.length) / 2);
    return ' '.repeat(pad) + text;
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
