import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { SalesOrderDetail } from '../../../entities/sales-orders/sales-order-detail.entity';
import { SalesOrderBatchAllocation } from '../../../entities/sales-orders/sales-order-batch-allocation.entity';
import { SalesOrderPayment } from '../../../entities/sales-orders/sales-order-payment.entity';
import { SalesOrderPaymentDocument } from '../../../entities/sales-orders/sales-order-payment-document.entity';
import { CreateSalesOrderDto, CreateSalesOrderLineItemDto } from '../dto/create-sales-order.dto';
import { QuerySalesOrderDto } from '../dto/query-sales-order.dto';
import { FulfillSalesOrderDto } from '../dto/fulfill-sales-order.dto';
import { UpdateSalesOrderNotesDto } from '../dto/update-sales-order-notes.dto';
import { CreateSalesOrderPaymentDto } from '../dto/create-sales-order-payment.dto';
import { PosSalePaymentMethod } from '../../../entities/pos/pos-sale-payment-method.enum';
import { User } from '../../../entities/users/user.entity';
import { S3Service } from '../../../common/services/s3.service';
import { SalesOrderFolioService } from './sales-order-folio.service';
import { SalesOrderFulfillmentService } from './sales-order-fulfillment.service';
import { SalesOrderPdfService } from './sales-order-pdf.service';
import { SalesOrderDocumentsService } from './sales-order-documents.service';
import { PosShiftsService } from '../../pos-shifts/pos-shifts.service';
import { ProductDiscountService } from '../../products/product-discount.service';
import { GlobalDiscountService } from '../../global-discounts/global-discount.service';
import {
  assertProductDiscountApplicable,
  calculateProductDiscountLineAmounts,
} from '../../products/utils/product-discount.util';
import {
  assertGlobalDiscountApplicable,
  calculateGlobalDiscountAmount,
} from '../../global-discounts/utils/global-discount.util';
import {
  mapAppliedLineDiscountsFromOrder,
  mapLineItemWithDiscount,
  mapOrderDiscountSummary,
} from '../mappers/sales-order-discount.mapper';
import { PosUserType } from '../../../entities/users/pos-user-type.enum';
import { DocumentLanguage } from '../../../common/enums/document-language.enum';
import { PosSaleCollection } from '../../../entities/pos/pos-sale-collection.entity';
import {
  formatCustomerDisplayName,
  mapPosCustomer,
  mapPosSaleCollection,
  mapPosUser,
} from '../../pos-shifts/mappers/pos-sale-collection.mapper';

@Injectable()
export class SalesOrderService {
  private readonly logger = new Logger(SalesOrderService.name);
  private static readonly DOC_TYPE_DOCUMENTO_ORIGINAL = 1;

  constructor(
    @InjectRepository(SalesOrder)
    private readonly soRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderDetail)
    private readonly detailRepo: Repository<SalesOrderDetail>,
    @InjectRepository(SalesOrderBatchAllocation)
    private readonly allocationRepo: Repository<SalesOrderBatchAllocation>,
    private readonly folioService: SalesOrderFolioService,
    private readonly fulfillmentService: SalesOrderFulfillmentService,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => PosShiftsService))
    private readonly posShiftsService: PosShiftsService,
    private readonly productDiscountService: ProductDiscountService,
    private readonly globalDiscountService: GlobalDiscountService,
    private readonly pdfService: SalesOrderPdfService,
    private readonly documentsService: SalesOrderDocumentsService,
    private readonly s3Service: S3Service,
    @InjectRepository(PosSaleCollection)
    private readonly posCollectionRepo: Repository<PosSaleCollection>,
    @InjectRepository(SalesOrderPayment)
    private readonly paymentRepo: Repository<SalesOrderPayment>,
    @InjectRepository(SalesOrderPaymentDocument)
    private readonly paymentDocumentRepo: Repository<SalesOrderPaymentDocument>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private async deleteDocumentsByType(
    salesOrderId: string,
    documentTypeId: number,
  ): Promise<void> {
    const existingDocs = await this.documentsService.getDocuments(salesOrderId);
    for (const doc of existingDocs) {
      if (Number(doc.document_type_id) === Number(documentTypeId)) {
        await this.documentsService.deleteDocument(doc.id);
      }
    }
  }

  private async loadOrderForPdf(id: string, tenantId: string): Promise<SalesOrder | null> {
    return this.soRepo
      .createQueryBuilder('so')
      .where('so.id = :id AND so.tenant_id = :tenantId', { id, tenantId })
      .leftJoinAndSelect('so.fiscal_configuration', 'fiscal_config')
      .leftJoinAndSelect('so.warehouse', 'warehouse')
      .leftJoinAndSelect('so.customer', 'customer')
      .leftJoinAndSelect('so.creator', 'creator')
      .leftJoinAndSelect('so.line_items', 'line_items')
      .leftJoinAndSelect('line_items.product', 'product')
      .leftJoinAndSelect('line_items.product_uom', 'product_uom')
      .leftJoinAndSelect('product_uom.uom', 'uom')
      .leftJoinAndSelect('so.global_discount', 'global_discount')
      .getOne();
  }

  private async generateAndUploadPdf(
    salesOrderId: string,
    tenantId: string,
    userId: string,
    language: DocumentLanguage = DocumentLanguage.ES,
  ): Promise<void> {
    try {
      const fullOrder = await this.loadOrderForPdf(salesOrderId, tenantId);
      if (!fullOrder) {
        this.logger.error(`[PDF] Failed to load sales order: ${salesOrderId}`);
        return;
      }

      const pdfBuffer = await this.pdfService.generatePdf(fullOrder, language);
      const uploadResult = await this.pdfService.uploadPdfToS3(
        fullOrder,
        pdfBuffer,
        'DOCUMENTO_ORIGINAL',
      );

      await this.documentsService.uploadDocument(
        salesOrderId,
        SalesOrderService.DOC_TYPE_DOCUMENTO_ORIGINAL,
        `DOCUMENTO_ORIGINAL_${fullOrder.folio}_es.pdf`,
        uploadResult.s3Key,
        pdfBuffer.length,
        'application/pdf',
        userId,
        language,
      );
    } catch (error) {
      this.logger.error('[PDF] Error in generateAndUploadPdf:', error);
    }
  }

  /**
   * Accepts either product_uom.id (preferred) or uom_catalog.id (fallback).
   * Returns the resolved ProductUoM row used by sales-order logic.
   */
  private async resolveProductUom(
    qr: QueryRunner,
    productId: string,
    providedUomId: string,
  ): Promise<{ id: string; factor: number; is_base: boolean; uom_catalog_id: string }> {
    const [productUomRow] = await qr.manager.query(
      `SELECT pu.id, pu.factor, pu.is_base, pu.uom_catalog_id
       FROM product_uoms pu
       WHERE pu.id = ? AND pu.product_id = ?
       LIMIT 1`,
      [providedUomId, productId],
    );

    if (productUomRow) {
      return productUomRow;
    }

    const [productUomByCatalog] = await qr.manager.query(
      `SELECT pu.id, pu.factor, pu.is_base, pu.uom_catalog_id
       FROM product_uoms pu
       WHERE pu.product_id = ? AND pu.uom_catalog_id = ?
       LIMIT 1`,
      [productId, providedUomId],
    );

    if (productUomByCatalog) {
      return productUomByCatalog;
    }

    throw new BadRequestException(`UOM no encontrado: ${providedUomId}`);
  }

  private async resolveLineDiscountAmounts(
    tenantId: string,
    item: CreateSalesOrderLineItemDto,
    productUomId: string,
  ): Promise<{ discount_percentage: number; discount_unit: number; line_discount: number; product_discount_id: string | null }> {
    if (item.product_discount_id) {
      const discount = await this.productDiscountService.findByIdForOrder(
        item.product_discount_id,
        item.product_id,
        tenantId,
      );
      assertProductDiscountApplicable(discount, item.product_id, productUomId);
      const amounts = calculateProductDiscountLineAmounts(
        item.unit_price,
        item.quantity,
        discount,
      );
      return {
        ...amounts,
        product_discount_id: discount.id,
      };
    }

    const discount_pct = Number(item.discount_percentage || 0);
    const line_subtotal = Number(item.quantity) * Number(item.unit_price);
    const line_discount = (line_subtotal * discount_pct) / 100;

    return {
      discount_percentage: discount_pct,
      discount_unit: Number(item.quantity) > 0 ? line_discount / Number(item.quantity) : 0,
      line_discount,
      product_discount_id: null,
    };
  }

  private async resolveGlobalDiscountAmounts(
    tenantId: string,
    globalDiscountId: string | undefined,
    netSubtotal: number,
  ): Promise<{ global_discount_id: string | null; global_discount_amount: number }> {
    if (!globalDiscountId) {
      return { global_discount_id: null, global_discount_amount: 0 };
    }

    const discount = await this.globalDiscountService.findByIdForOrder(globalDiscountId, tenantId);
    assertGlobalDiscountApplicable(discount);

    return {
      global_discount_id: discount.id,
      global_discount_amount: calculateGlobalDiscountAmount(netSubtotal, discount),
    };
  }

  private computeOrderTotal(
    subtotal: number,
    lineDiscountTotal: number,
    globalDiscountAmount: number,
    ivaTotal: number,
    iepsTotal: number,
  ): number {
    return Number(
      (
        subtotal -
        lineDiscountTotal -
        globalDiscountAmount +
        ivaTotal +
        iepsTotal
      ).toFixed(2),
    );
  }

  async create(dto: CreateSalesOrderDto, tenantId: string, userId: string): Promise<SalesOrder> {
    const isPosSale = dto.sales_order_type === 'POS';
    let posDailyShiftId: string | null = null;
    let paymentStatus = dto.payment_status || 'Pendiente';
    let collectedByUserId: string | null = null;
    let posQueued = false;

    if (!isPosSale && dto.customer_id == null) {
      throw new BadRequestException('Las órdenes manuales requieren customer_id');
    }

    const customerId = isPosSale
      ? dto.customer_id ?? (await this.posShiftsService.resolveWalkInCustomerId(tenantId))
      : dto.customer_id!;

    if (isPosSale) {
      if (!dto.seller_user_id) {
        throw new BadRequestException('Las ventas POS requieren seller_user_id');
      }

      await this.posShiftsService.assertPosWarehouseForTerminal(
        tenantId,
        userId,
        dto.warehouse_id,
      );

      const { shift, terminalUser, queued } =
        await this.posShiftsService.resolvePosSaleContext(
          tenantId,
          userId,
          dto.seller_user_id,
          dto.pos_daily_shift_id,
        );

      posQueued = queued;
      posDailyShiftId = shift?.id ?? null;

      if (terminalUser.pos_user_type === PosUserType.VENTAS) {
        paymentStatus = 'Pendiente';
      } else if (paymentStatus === 'Pagado') {
        collectedByUserId = userId;
      }
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const folio = await this.folioService.generateFolio(tenantId);

      const so = qr.manager.create(SalesOrder, {
        id: uuidv4(),
        tenant_id: tenantId,
        folio,
        fiscal_configuration_id: dto.fiscal_configuration_id,
        warehouse_id: dto.warehouse_id,
        customer_id: customerId,
        expected_delivery_date: new Date(dto.expected_delivery_date),
        sales_order_type: dto.sales_order_type || 'MANUAL',
        fiscal_razon_social: dto.fiscal_razon_social,
        payment_status: paymentStatus,
        general_status: 'Creada',
        notes: dto.notes,
        created_by: userId,
        terminal_user_id: isPosSale ? userId : null,
        seller_user_id: isPosSale ? dto.seller_user_id! : null,
        pos_daily_shift_id: isPosSale ? posDailyShiftId : null,
        collected_by_user_id: collectedByUserId,
      });

      const savedSO = await qr.manager.save(SalesOrder, so);
      const savedDetails: SalesOrderDetail[] = [];

      let subtotal = 0, iva_total = 0, ieps_total = 0, discount_total = 0;

      for (const item of dto.line_items) {
        const productUomRow = await this.resolveProductUom(
          qr,
          item.product_id,
          item.product_uom_id,
        );

        const discountAmounts = await this.resolveLineDiscountAmounts(
          tenantId,
          item,
          productUomRow.id,
        );

        const line_subtotal = Number(item.quantity) * Number(item.unit_price);
        const line_discount = discountAmounts.line_discount;
        const taxable_subtotal = Math.max(line_subtotal - line_discount, 0);
        const iva_pct = Number(item.iva_percentage || 0);
        const ieps_pct = Number(item.ieps_percentage || 0);
        const line_iva = (taxable_subtotal * iva_pct) / 100;
        const line_ieps = (taxable_subtotal * ieps_pct) / 100;

        const [baseUomRow] = await qr.manager.query(
          `SELECT pu.uom_catalog_id FROM product_uoms pu
           WHERE pu.product_id = ? AND pu.is_base = 1 LIMIT 1`,
          [item.product_id],
        );

        if (!baseUomRow) {
          throw new BadRequestException(`UOM base no encontrado para producto: ${item.product_id}`);
        }

        const factor = productUomRow.factor || 1;
        const qty_base = productUomRow.is_base
          ? Number(item.quantity)
          : Number(item.quantity) * factor;

        const detail = qr.manager.create(SalesOrderDetail, {
          id: uuidv4(),
          sales_order_id: savedSO.id,
          product_id: item.product_id,
          product_uom_id: productUomRow.id,
          quantity: item.quantity,
          quantity_base_uom: qty_base,
          base_uom_id: baseUomRow.uom_catalog_id,
          unit_price: item.unit_price,
          discount_percentage: discountAmounts.discount_percentage,
          discount_unit: discountAmounts.discount_unit,
          product_discount_id: discountAmounts.product_discount_id,
          iva_percentage: iva_pct,
          iva_unit: Number(item.quantity) > 0 ? line_iva / Number(item.quantity) : 0,
          ieps_percentage: ieps_pct,
          ieps_unit: Number(item.quantity) > 0 ? line_ieps / Number(item.quantity) : 0,
          created_by: userId,
        });

        await qr.manager.save(SalesOrderDetail, detail);
        savedDetails.push(detail);

        subtotal += line_subtotal;
        discount_total += line_discount;
        iva_total += line_iva;
        ieps_total += line_ieps;
      }

      savedSO.subtotal = subtotal;
      savedSO.discount_total = discount_total;

      const globalDiscountAmounts = await this.resolveGlobalDiscountAmounts(
        tenantId,
        dto.global_discount_id,
        subtotal - discount_total,
      );
      savedSO.global_discount_id = globalDiscountAmounts.global_discount_id;
      savedSO.global_discount_amount = globalDiscountAmounts.global_discount_amount;

      savedSO.iva_total = iva_total;
      savedSO.ieps_total = ieps_total;
      savedSO.total = this.computeOrderTotal(
        subtotal,
        discount_total,
        globalDiscountAmounts.global_discount_amount,
        iva_total,
        ieps_total,
      );
      await qr.manager.save(SalesOrder, savedSO);

      if ((dto.sales_order_type || 'MANUAL') === 'POS') {
        await this.fulfillOrderLines(
          qr,
          savedSO.id,
          dto.warehouse_id,
          savedDetails,
          userId,
        );
        savedSO.general_status = posQueued ? 'En cola' : 'Surtida';
        await qr.manager.save(SalesOrder, savedSO);
        this.logger.log(`POS sales order ${folio} auto-fulfilled by user ${userId}`);
      }

      await qr.commitTransaction();

      this.generateAndUploadPdf(savedSO.id, tenantId, userId).catch((err) => {
        this.logger.error('[PDF] Error in async PDF generation:', err);
      });

      return this.findOne(savedSO.id, tenantId);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async findAll(tenantId: string, filters: QuerySalesOrderDto) {
    const { search, general_status, payment_status, sales_order_type, warehouse_id, customer_id,
            created_from, created_to, page = 1, limit = 20,
            sort_by = 'created_at', sort_order = 'DESC' } = filters;

    const qb = this.soRepo
      .createQueryBuilder('so')
      .leftJoinAndSelect('so.customer', 'customer')
      .leftJoinAndSelect('so.warehouse', 'warehouse')
      .where('so.tenant_id = :tenantId', { tenantId });

    if (search) {
      qb.andWhere(
        '(so.folio LIKE :s OR customer.name LIKE :s OR customer.lastname LIKE :s OR CONCAT(customer.name, \' \', COALESCE(customer.lastname, \'\')) LIKE :s)',
        { s: `%${search}%` },
      );
    }
    if (general_status) qb.andWhere('so.general_status = :general_status', { general_status });
    if (payment_status) qb.andWhere('so.payment_status = :payment_status', { payment_status });
    if (sales_order_type) qb.andWhere('so.sales_order_type = :sales_order_type', { sales_order_type });
    if (warehouse_id) qb.andWhere('so.warehouse_id = :warehouse_id', { warehouse_id });
    if (customer_id) qb.andWhere('so.customer_id = :customer_id', { customer_id });
    if (created_from) qb.andWhere('so.created_at >= :created_from', { created_from: new Date(created_from) });
    if (created_to) qb.andWhere('so.created_at <= :created_to', { created_to: new Date(created_to) });

    const sortCol = sort_by === 'total' ? 'so.total' : sort_by === 'folio' ? 'so.folio' : 'so.created_at';
    qb.orderBy(sortCol, sort_order).skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, tenantId: string): Promise<SalesOrder> {
    const so = await this.soRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: [
        'customer', 'warehouse', 'fiscal_configuration',
        'seller_user', 'terminal_user', 'collected_by_user',
        'line_items', 'line_items.product', 'line_items.product_uom', 'line_items.product_uom.uom',
        'line_items.product_discount',
        'global_discount',
        'line_items.base_uom',
        'line_items.batch_allocations', 'line_items.batch_allocations.inventory_batch',
      ],
    });
    if (!so) throw new NotFoundException(`Sales order not found: ${id}`);
    return so;
  }

  async findOneDetail(id: string, tenantId: string) {
    const so = await this.findOne(id, tenantId);
    const posCollection = await this.posCollectionRepo.findOne({
      where: { sales_order_id: id, tenant_id: tenantId },
      relations: ['customer', 'collected_by_user'],
    });

    if (posCollection && so.customer_id !== posCollection.customer_id) {
      await this.soRepo.update(
        { id: so.id, tenant_id: tenantId },
        { customer_id: posCollection.customer_id },
      );
      so.customer_id = posCollection.customer_id;
      so.customer = posCollection.customer ?? so.customer;
    }

    const customerSummary = mapPosCustomer(so.customer);
    const appliedLineDiscounts = mapAppliedLineDiscountsFromOrder(so);
    const discountSummary = mapOrderDiscountSummary(so);
    const paymentData = await this.getPaymentsForOrder(so);
    const header = {
      ...so,
      customer_display_name: customerSummary?.display_name ?? formatCustomerDisplayName(so.customer),
      customer_summary: customerSummary,
      seller_user: mapPosUser(so.seller_user),
      terminal_user: mapPosUser(so.terminal_user),
      collected_by_user: mapPosUser(so.collected_by_user),
      pos_collection: posCollection ? mapPosSaleCollection(posCollection) : null,
      payments: paymentData.payments,
      payments_summary: paymentData.summary,
      applied_line_discounts: appliedLineDiscounts,
      applied_global_discount: discountSummary.global_discount,
      applied_discounts: appliedLineDiscounts,
      discount_summary: discountSummary,
    };

    return {
      header,
      sales_order: {
        ...so,
        line_items: (so.line_items ?? []).map(mapLineItemWithDiscount),
      },
      pos_collection: header.pos_collection,
      payments: paymentData.payments,
      payments_summary: paymentData.summary,
      applied_line_discounts: appliedLineDiscounts,
      applied_global_discount: discountSummary.global_discount,
      applied_discounts: appliedLineDiscounts,
      discount_summary: discountSummary,
    };
  }

  async getPayments(id: string, tenantId: string) {
    const order = await this.findOne(id, tenantId);
    return this.getPaymentsForOrder(order);
  }

  /**
   * Registra un pago en la orden (detalle OV o cobranza POS).
   * Actualiza payment_status a Pagado cuando el saldo queda en 0.
   */
  async createPayment(
    salesOrderId: string,
    dto: CreateSalesOrderPaymentDto,
    tenantId: string,
    userId: string,
    source: 'manual' | 'pos_cobranza' = 'manual',
  ) {
    const order = await this.findOne(salesOrderId, tenantId);

    if (order.general_status === 'Cancelada') {
      throw new BadRequestException('No se pueden registrar pagos en una orden cancelada');
    }

    if (order.payment_status === 'Pagado') {
      throw new BadRequestException('La orden ya está pagada');
    }

    if (
      dto.payment_method === PosSalePaymentMethod.TRANSFER &&
      !dto.reference_number?.trim()
    ) {
      throw new BadRequestException('reference_number es obligatorio para transferencia');
    }

    const existing = await this.paymentRepo.find({
      where: { sales_order_id: salesOrderId, tenant_id: tenantId },
    });
    const currentSummary = this.buildPaymentSummary(order, existing);

    if (dto.amount > currentSummary.amount_pending + 0.001) {
      throw new BadRequestException(
        `El monto excede el saldo pendiente (${currentSummary.amount_pending.toFixed(2)} MXN)`,
      );
    }

    const payment = this.paymentRepo.create({
      id: uuidv4(),
      tenant_id: tenantId,
      sales_order_id: salesOrderId,
      payment_date: new Date(dto.payment_date),
      amount: dto.amount,
      currency: dto.currency ?? 'MXN',
      payment_method: dto.payment_method,
      reference_number: dto.reference_number?.trim() || null,
      notes: dto.notes?.trim() || null,
      source,
      created_by: userId,
    });

    await this.paymentRepo.save(payment);

    const updatedPayments = [...existing, payment];
    const summary = this.buildPaymentSummary(order, updatedPayments);
    order.payment_status = summary.payment_status;
    order.updated_by = userId;
    if (summary.payment_status === 'Pagado' && source === 'manual') {
      order.collected_by_user_id = userId;
    }
    await this.soRepo.save(order);

    const mapped = await this.mapPaymentWithDocuments(payment);
    return { payment: mapped, summary };
  }

  async deletePayment(
    salesOrderId: string,
    paymentId: string,
    tenantId: string,
    userId: string,
  ) {
    const order = await this.findOne(salesOrderId, tenantId);

    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId, sales_order_id: salesOrderId, tenant_id: tenantId },
      relations: ['documents'],
    });

    if (!payment) {
      throw new NotFoundException(`Pago no encontrado: ${paymentId}`);
    }

    if (payment.source === 'pos_cobranza') {
      throw new BadRequestException(
        'No se puede eliminar un pago registrado desde cobranza POS',
      );
    }

    for (const doc of payment.documents ?? []) {
      try {
        await this.s3Service.deleteFile(doc.s3_key);
      } catch {
        /* ignore S3 cleanup errors */
      }
    }

    await this.paymentRepo.remove(payment);

    const paymentData = await this.getPaymentsForOrder(order);
    order.payment_status = paymentData.summary.payment_status;
    order.updated_by = userId;
    if (paymentData.summary.payment_status === 'Pendiente') {
      order.collected_by_user_id = null;
    }
    await this.soRepo.save(order);

    return { success: true as const, id: paymentId, summary: paymentData.summary };
  }

  async uploadPaymentDocument(
    salesOrderId: string,
    paymentId: string,
    tenantId: string,
    userId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    notes?: string,
  ) {
    await this.findOne(salesOrderId, tenantId);

    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId, sales_order_id: salesOrderId, tenant_id: tenantId },
    });
    if (!payment) {
      throw new NotFoundException(`Pago no encontrado: ${paymentId}`);
    }

    const s3Key = await this.s3Service.uploadEntityFile(
      tenantId,
      'sales-order-payments',
      paymentId,
      'comprobantes',
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    const document = this.paymentDocumentRepo.create({
      id: uuidv4(),
      tenant_id: tenantId,
      payment_id: paymentId,
      file_name: file.originalname,
      s3_key: s3Key,
      mime_type: file.mimetype,
      file_size: file.size,
      notes: notes?.trim() || null,
      uploaded_by: userId,
    });

    await this.paymentDocumentRepo.save(document);
    return this.mapPaymentDocument(document);
  }

  async getPaymentDocuments(salesOrderId: string, paymentId: string, tenantId: string) {
    await this.findOne(salesOrderId, tenantId);

    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId, sales_order_id: salesOrderId, tenant_id: tenantId },
    });
    if (!payment) {
      throw new NotFoundException(`Pago no encontrado: ${paymentId}`);
    }

    const docs = await this.paymentDocumentRepo.find({
      where: { payment_id: paymentId, tenant_id: tenantId },
      order: { created_at: 'DESC' },
    });

    return Promise.all(docs.map((doc) => this.mapPaymentDocument(doc)));
  }

  async deletePaymentDocument(
    salesOrderId: string,
    paymentId: string,
    documentId: string,
    tenantId: string,
  ) {
    await this.findOne(salesOrderId, tenantId);

    const doc = await this.paymentDocumentRepo.findOne({
      where: {
        id: documentId,
        payment_id: paymentId,
        tenant_id: tenantId,
      },
      relations: ['payment'],
    });

    if (!doc || doc.payment?.sales_order_id !== salesOrderId) {
      throw new NotFoundException('Documento de pago no encontrado');
    }

    try {
      await this.s3Service.deleteFile(doc.s3_key);
    } catch {
      /* ignore */
    }

    await this.paymentDocumentRepo.remove(doc);
    return { success: true as const, id: documentId };
  }

  /** Saldo pendiente de una orden (para cobranza POS). */
  async getAmountPending(salesOrderId: string, tenantId: string): Promise<number> {
    const order = await this.findOne(salesOrderId, tenantId);
    const { summary } = await this.getPaymentsForOrder(order);
    return summary.amount_pending;
  }

  private async getPaymentsForOrder(order: SalesOrder) {
    const payments = await this.paymentRepo.find({
      where: { sales_order_id: order.id, tenant_id: order.tenant_id },
      relations: ['documents', 'creator'],
      order: { payment_date: 'DESC', created_at: 'DESC' },
    });

    const mapped = await Promise.all(payments.map((p) => this.mapPaymentWithDocuments(p)));
    return {
      payments: mapped,
      summary: this.buildPaymentSummary(order, payments),
    };
  }

  private buildPaymentSummary(
    order: SalesOrder,
    payments: SalesOrderPayment[],
  ): {
    amount_paid: number;
    amount_pending: number;
    payment_status: string;
    currency: string;
    order_total: number;
  } {
    const orderTotal = Number(order.total || 0);
    const amountPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const amountPending = Math.max(Number((orderTotal - amountPaid).toFixed(2)), 0);
    return {
      amount_paid: Number(amountPaid.toFixed(2)),
      amount_pending: amountPending,
      payment_status: amountPending <= 0 ? 'Pagado' : 'Pendiente',
      currency: 'MXN',
      order_total: Number(orderTotal.toFixed(2)),
    };
  }

  private async mapPaymentWithDocuments(payment: SalesOrderPayment) {
    const documents = await Promise.all(
      (payment.documents ?? []).map((doc) => this.mapPaymentDocument(doc)),
    );
    return {
      id: payment.id,
      sales_order_id: payment.sales_order_id,
      payment_date: payment.payment_date,
      amount: Number(payment.amount),
      currency: payment.currency,
      payment_method: payment.payment_method,
      reference_number: payment.reference_number,
      notes: payment.notes,
      source: payment.source,
      created_by: payment.created_by,
      created_by_name: payment.creator
        ? [payment.creator.first_name, payment.creator.last_name].filter(Boolean).join(' ').trim()
        : null,
      created_at: payment.created_at,
      documents,
    };
  }

  private async mapPaymentDocument(doc: SalesOrderPaymentDocument) {
    let url: string | null = null;
    try {
      url = await this.s3Service.getSignedUrl(doc.s3_key, 900);
    } catch {
      url = null;
    }
    return {
      id: doc.id,
      payment_id: doc.payment_id,
      file_name: doc.file_name,
      mime_type: doc.mime_type,
      file_size: Number(doc.file_size),
      notes: doc.notes,
      uploaded_by: doc.uploaded_by,
      created_at: doc.created_at,
      url,
    };
  }

  async updateNotes(
    id: string,
    dto: UpdateSalesOrderNotesDto,
    tenantId: string,
    userId: string,
  ): Promise<SalesOrder> {
    const so = await this.findOne(id, tenantId);

    if (so.general_status === 'Cancelada') {
      throw new BadRequestException('No se pueden editar notas de una orden cancelada');
    }

    so.notes = dto.notes?.trim() ? dto.notes.trim() : null;
    so.updated_by = userId;
    await this.soRepo.save(so);

    return this.findOne(id, tenantId);
  }

  /**
   * Cambia el vendedor de la orden (usuario con pos_user_code).
   * Disponible en cualquier estado excepto Cancelada.
   */
  async updateSeller(
    id: string,
    sellerUserId: string,
    tenantId: string,
    userId: string,
  ) {
    const so = await this.findOne(id, tenantId);

    if (so.general_status === 'Cancelada') {
      throw new BadRequestException('No se puede cambiar el vendedor de una orden cancelada');
    }

    const seller = await this.userRepo.findOne({
      where: { id: sellerUserId, tenant_id: tenantId },
    });

    if (!seller) {
      throw new BadRequestException('Vendedor no válido');
    }

    if (seller.is_pos_user) {
      throw new BadRequestException(
        'El vendedor debe ser un usuario de ventas (no terminal POS)',
      );
    }

    await this.soRepo.update(
      { id, tenant_id: tenantId },
      { seller_user_id: sellerUserId, updated_by: userId },
    );

    return this.findOneDetail(id, tenantId);
  }

  /**
   * Fulfill (surtir) a sales order.
   * Runs FIFO batch allocation for every line item inside a single transaction.
   * Deducts available_quantity from the corresponding inventory batches.
   */
  async fulfill(id: string, dto: FulfillSalesOrderDto, tenantId: string, userId: string): Promise<SalesOrder> {
    const so = await this.findOne(id, tenantId);

    if (so.general_status !== 'Creada') {
      throw new BadRequestException(`La orden ${so.folio} ya fue ${so.general_status.toLowerCase()}`);
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      await this.fulfillOrderLines(
        qr,
        id,
        so.warehouse_id,
        so.line_items,
        userId,
        dto.notes ?? so.notes ?? undefined,
      );

      await qr.commitTransaction();
      this.logger.log(`Sales order ${so.folio} fulfilled by user ${userId}`);
      return this.findOne(id, tenantId);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async cancel(id: string, tenantId: string, userId: string): Promise<SalesOrder> {
    const so = await this.findOne(id, tenantId);

    if (so.general_status === 'Cancelada') {
      throw new BadRequestException('La orden ya está cancelada');
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // If already fulfilled, release inventory back
      if (so.general_status === 'Surtida') {
        const allAllocations = so.line_items.flatMap((d) => d.batch_allocations ?? []);
        await this.fulfillmentService.releaseAllocations(allAllocations, qr.manager);
      }

      await qr.manager.update(SalesOrder, { id }, {
        general_status: 'Cancelada',
        updated_by: userId,
      });

      await qr.commitTransaction();
      return this.findOne(id, tenantId);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async replace(
    id: string,
    dto: CreateSalesOrderDto,
    tenantId: string,
    userId: string,
  ): Promise<SalesOrder> {
    const existing = await this.findOne(id, tenantId);
    if (existing.general_status !== 'Creada') {
      throw new BadRequestException(
        `Cannot edit sales order with status: ${existing.general_status}`,
      );
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      await qr.manager.delete(SalesOrderDetail, { sales_order_id: id });
      const so = await qr.manager.findOne(SalesOrder, { where: { id, tenant_id: tenantId } });
      if (!so) {
        throw new NotFoundException(`Sales order not found: ${id}`);
      }

      so.fiscal_configuration_id = dto.fiscal_configuration_id;
      so.warehouse_id = dto.warehouse_id;
      if (dto.customer_id != null) {
        so.customer_id = dto.customer_id;
      }
      so.expected_delivery_date = new Date(dto.expected_delivery_date);
      so.sales_order_type = dto.sales_order_type || so.sales_order_type || 'MANUAL';
      if (dto.fiscal_razon_social !== undefined) {
        so.fiscal_razon_social = dto.fiscal_razon_social;
      }
      so.payment_status = dto.payment_status || so.payment_status;
      if (dto.notes !== undefined) {
        so.notes = dto.notes;
      }
      so.updated_by = userId;

      await qr.manager.save(SalesOrder, so);
      await this.insertSalesOrderLineItems(qr, so.id, dto.line_items, userId, tenantId);
      await this.recomputeTotals(qr, so.id, tenantId, userId);

      await qr.commitTransaction();

      this.regenerateDocumentoOriginalPreservingLanguage(id, tenantId, userId).catch((err) => {
        this.logger.error('[PDF] Error regenerating DOCUMENTO_ORIGINAL after sales order replace:', err);
      });

      return this.findOne(id, tenantId);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  private async fulfillOrderLines(
    qr: QueryRunner,
    salesOrderId: string,
    warehouseId: string,
    lineItems: SalesOrderDetail[],
    userId: string,
    notes?: string,
  ): Promise<void> {
    for (const detail of lineItems) {
      await this.fulfillmentService.allocateFifo(detail, warehouseId, userId, qr.manager);
    }

    await qr.manager.update(SalesOrder, { id: salesOrderId }, {
      general_status: 'Surtida',
      ...(notes !== undefined ? { notes } : {}),
      updated_by: userId,
    });
  }

  private async insertSalesOrderLineItems(
    qr: QueryRunner,
    salesOrderId: string,
    lineItems: CreateSalesOrderLineItemDto[],
    userId: string,
    tenantId: string,
  ): Promise<void> {
    for (const item of lineItems) {
      const productUomRow = await this.resolveProductUom(
        qr,
        item.product_id,
        item.product_uom_id,
      );

      const discountAmounts = await this.resolveLineDiscountAmounts(
        tenantId,
        item,
        productUomRow.id,
      );

      const line_subtotal = Number(item.quantity) * Number(item.unit_price);
      const line_discount = discountAmounts.line_discount;
      const taxable_subtotal = Math.max(line_subtotal - line_discount, 0);
      const iva_pct = Number(item.iva_percentage || 0);
      const ieps_pct = Number(item.ieps_percentage || 0);
      const line_iva = (taxable_subtotal * iva_pct) / 100;
      const line_ieps = (taxable_subtotal * ieps_pct) / 100;

      const [baseUomRow] = await qr.manager.query(
        `SELECT pu.uom_catalog_id FROM product_uoms pu
         WHERE pu.product_id = ? AND pu.is_base = 1 LIMIT 1`,
        [item.product_id],
      );
      if (!baseUomRow) {
        throw new BadRequestException(`UOM base no encontrado para producto: ${item.product_id}`);
      }

      const factor = productUomRow.factor || 1;
      const qty_base = productUomRow.is_base
        ? Number(item.quantity)
        : Number(item.quantity) * factor;

      const detail = qr.manager.create(SalesOrderDetail, {
        id: uuidv4(),
        sales_order_id: salesOrderId,
        product_id: item.product_id,
        product_uom_id: productUomRow.id,
        quantity: item.quantity,
        quantity_base_uom: qty_base,
        base_uom_id: baseUomRow.uom_catalog_id,
        unit_price: item.unit_price,
        discount_percentage: discountAmounts.discount_percentage,
        discount_unit: discountAmounts.discount_unit,
        product_discount_id: discountAmounts.product_discount_id,
        iva_percentage: iva_pct,
        iva_unit: Number(item.quantity) > 0 ? line_iva / Number(item.quantity) : 0,
        ieps_percentage: ieps_pct,
        ieps_unit: Number(item.quantity) > 0 ? line_ieps / Number(item.quantity) : 0,
        created_by: userId,
      });
      await qr.manager.save(SalesOrderDetail, detail);
    }
  }

  private async recomputeTotals(
    qr: QueryRunner,
    salesOrderId: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const so = await qr.manager.findOne(SalesOrder, { where: { id: salesOrderId, tenant_id: tenantId } });
    if (!so) {
      throw new NotFoundException(`Sales order not found: ${salesOrderId}`);
    }

    const details = await qr.manager.find(SalesOrderDetail, { where: { sales_order_id: salesOrderId } });
    let subtotal = 0;
    let discount_total = 0;
    let iva_total = 0;
    let ieps_total = 0;
    for (const detail of details) {
      const qty = Number(detail.quantity || 0);
      const line_subtotal = qty * Number(detail.unit_price || 0);
      const line_discount = qty * Number(detail.discount_unit || 0);
      const taxable_subtotal = Math.max(line_subtotal - line_discount, 0);
      subtotal += line_subtotal;
      discount_total += line_discount;
      iva_total += (taxable_subtotal * Number(detail.iva_percentage || 0)) / 100;
      ieps_total += (taxable_subtotal * Number(detail.ieps_percentage || 0)) / 100;
    }
    so.subtotal = subtotal;
    so.discount_total = discount_total;

    const netSubtotal = subtotal - discount_total;
    if (so.global_discount_id) {
      const discount = await this.globalDiscountService.findByIdForOrder(
        so.global_discount_id,
        tenantId,
      );
      so.global_discount_amount = calculateGlobalDiscountAmount(netSubtotal, discount);
    } else {
      so.global_discount_amount = 0;
    }

    so.iva_total = iva_total;
    so.ieps_total = ieps_total;
    so.total = this.computeOrderTotal(
      subtotal,
      discount_total,
      Number(so.global_discount_amount) || 0,
      iva_total,
      ieps_total,
    );
    so.updated_by = userId;
    await qr.manager.save(SalesOrder, so);
  }

  async regenerateDocumentoOriginal(
    id: string,
    tenantId: string,
    userId: string,
    language: DocumentLanguage,
    keepPrevious = false,
  ): Promise<{ success: boolean; message: string; document_language: DocumentLanguage; keep_previous: boolean }> {
    const salesOrder = await this.findOne(id, tenantId);

    if (!keepPrevious) {
      await this.deleteDocumentsByType(id, SalesOrderService.DOC_TYPE_DOCUMENTO_ORIGINAL);
    }

    const fullOrder = await this.loadOrderForPdf(id, tenantId);
    if (!fullOrder) {
      throw new NotFoundException(`Sales order not found: ${id}`);
    }

    const pdfBuffer = await this.pdfService.generatePdf(fullOrder, language);
    const uploadResult = await this.pdfService.uploadPdfToS3(
      fullOrder,
      pdfBuffer,
      'DOCUMENTO_ORIGINAL',
    );

    await this.documentsService.uploadDocument(
      id,
      SalesOrderService.DOC_TYPE_DOCUMENTO_ORIGINAL,
      `DOCUMENTO_ORIGINAL_${salesOrder.folio}_${language}.pdf`,
      uploadResult.s3Key,
      pdfBuffer.length,
      'application/pdf',
      userId,
      language,
    );

    return {
      success: true,
      message: 'DOCUMENTO_ORIGINAL regenerado exitosamente',
      document_language: language,
      keep_previous: keepPrevious,
    };
  }

  async regenerateDocumentoOriginalPreservingLanguage(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string; document_language: DocumentLanguage }> {
    const language = await this.documentsService.getLastDocumentLanguage(
      id,
      SalesOrderService.DOC_TYPE_DOCUMENTO_ORIGINAL,
    );
    return this.regenerateDocumentoOriginal(id, tenantId, userId, language);
  }
}
