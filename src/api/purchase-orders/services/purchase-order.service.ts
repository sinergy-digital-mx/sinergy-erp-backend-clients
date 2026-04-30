import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner, Brackets } from 'typeorm';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { PurchaseOrderBatchDetail } from '../../../entities/purchase-orders/purchase-order-batch-detail.entity';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { PurchaseOrderPayment } from '../../../entities/purchase-orders/purchase-order-payment.entity';
import { CreatePurchaseOrderDto, CreateLineItemDto } from '../dto/create-purchase-order.dto';
import { ReceivePurchaseOrderDto } from '../dto/receive-purchase-order.dto';
import { UpdateLineItemDto } from '../dto/update-line-item.dto';
import { QueryPurchaseOrderDto } from '../dto/query-purchase-order.dto';
import { CreatePurchaseOrderPaymentDto } from '../dto/create-purchase-order-payment.dto';
import { UnitConversionService } from './unit-conversion.service';
import { BatchNumberGeneratorService } from './batch-number-generator.service';
import { FolioGeneratorService } from './folio-generator.service';
import { PurchaseOrderPdfService } from './purchase-order-pdf.service';
import { PurchaseOrderDocumentsService } from './purchase-order-documents.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PurchaseOrderService {
  private static readonly DOC_TYPE_DOCUMENTO_ORIGINAL = 1;
  private static readonly DOC_TYPE_RECEPCION = 4;

  constructor(
    @InjectRepository(PurchaseOrderBatch)
    private readonly purchaseOrderBatchRepository: Repository<PurchaseOrderBatch>,
    @InjectRepository(PurchaseOrderBatchDetail)
    private readonly purchaseOrderDetailRepository: Repository<PurchaseOrderBatchDetail>,
    @InjectRepository(InventoryBatch)
    private readonly inventoryBatchRepository: Repository<InventoryBatch>,
    @InjectRepository(PurchaseOrderPayment)
    private readonly purchaseOrderPaymentRepository: Repository<PurchaseOrderPayment>,
    private readonly unitConversionService: UnitConversionService,
    private readonly batchNumberGenerator: BatchNumberGeneratorService,
    private readonly folioGenerator: FolioGeneratorService,
    private readonly pdfService: PurchaseOrderPdfService,
    private readonly documentsService: PurchaseOrderDocumentsService,
    private readonly dataSource: DataSource,
  ) {}

  private async deleteDocumentsByType(
    purchaseOrderId: string,
    documentTypeId: number,
  ): Promise<void> {
    const existingDocs = await this.documentsService.getDocuments(purchaseOrderId);
    for (const doc of existingDocs) {
      if (Number(doc.document_type_id) === Number(documentTypeId)) {
        await this.documentsService.deleteDocument(doc.id);
      }
    }
  }

  /**
   * Persist line items for a batch and return requested subtotals (same rules as {@link create}).
   */
  private async insertLineItemsForPurchaseOrder(
    queryRunner: QueryRunner,
    purchaseOrderBatchId: string,
    lineItems: CreateLineItemDto[],
    userId: string,
  ): Promise<{
    requested_subtotal: number;
    requested_iva_total: number;
    requested_ieps_total: number;
  }> {
    let requested_subtotal = 0;
    let requested_iva_total = 0;
    let requested_ieps_total = 0;

    for (const lineItem of lineItems) {
      const line_subtotal =
        Number(lineItem.quantity) * Number(lineItem.unit_total);
      const iva_percentage = Number(lineItem.iva_percentage || 0);
      const line_iva = (line_subtotal * iva_percentage) / 100;
      const ieps_percentage = Number(lineItem.ieps_percentage || 0);
      const line_ieps = (line_subtotal * ieps_percentage) / 100;

      const productUomId = await this.unitConversionService.getProductUomId(
        lineItem.uom_id,
        lineItem.product_id,
      );

      const detail = this.purchaseOrderDetailRepository.create({
        id: uuidv4(),
        purchase_order_batch_id: purchaseOrderBatchId,
        product_id: lineItem.product_id,
        product_uom_id: productUomId,
        quantity: lineItem.quantity,
        unit_total: lineItem.unit_total,
        iva_percentage: iva_percentage,
        iva_unit: line_iva / Number(lineItem.quantity),
        ieps_percentage: ieps_percentage,
        ieps_unit: line_ieps / Number(lineItem.quantity),
        created_by: userId,
      });

      await queryRunner.manager.save(detail);

      requested_subtotal += line_subtotal;
      requested_iva_total += line_iva;
      requested_ieps_total += line_ieps;
    }

    return { requested_subtotal, requested_iva_total, requested_ieps_total };
  }

  /**
   * Create a new purchase order with line items
   */
  async create(
    dto: CreatePurchaseOrderDto,
    tenantId: string,
    userId: string,
  ): Promise<PurchaseOrderBatch> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Generate folio
      const folio = await this.folioGenerator.generateFolio(tenantId);

      // Create purchase order batch
      const purchaseOrder = this.purchaseOrderBatchRepository.create({
        id: uuidv4(),
        tenant_id: tenantId,
        folio: folio,
        fiscal_configuration_id: dto.fiscal_configuration_id,
        warehouse_id: dto.warehouse_id,
        vendor_id: dto.vendor_id,
        expected_delivery_date: new Date(dto.expected_delivery_date),
        payment_status: dto.payment_status || 'Pendiente',
        payment_currency: dto.payment_currency || 'MXN',
        general_status: 'Creada',
        notes: dto.notes,
        created_by: userId,
      });

      const savedOrder = await queryRunner.manager.save(purchaseOrder);

      const totals = await this.insertLineItemsForPurchaseOrder(
        queryRunner,
        savedOrder.id,
        dto.line_items,
        userId,
      );

      savedOrder.requested_subtotal = totals.requested_subtotal;
      savedOrder.requested_iva_total = totals.requested_iva_total;
      savedOrder.requested_ieps_total = totals.requested_ieps_total;
      savedOrder.requested_total =
        totals.requested_subtotal +
        totals.requested_iva_total +
        totals.requested_ieps_total;

      await queryRunner.manager.save(savedOrder);

      await queryRunner.commitTransaction();
      
      // Generate PDF and upload to S3 after transaction completes
      // This runs asynchronously and doesn't block the response
      this.generateAndUploadPdf(savedOrder.id, tenantId, userId).catch(err => {
        console.error('[PDF] Error in async PDF generation:', err);
      });

      return this.findOne(savedOrder.id, tenantId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Generate and upload PDF asynchronously
   */
  private async generateAndUploadPdf(
    purchaseOrderId: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    try {
      console.log('[PDF] Starting async PDF generation for PO:', purchaseOrderId);
      
      // Load the full order with all relationships
      const fullOrder = await this.purchaseOrderBatchRepository
        .createQueryBuilder('po')
        .where('po.id = :id AND po.tenant_id = :tenantId', { id: purchaseOrderId, tenantId })
        .leftJoinAndSelect('po.fiscal_configuration', 'fiscal_config')
        .leftJoinAndSelect('po.warehouse', 'warehouse')
        .leftJoinAndSelect('po.vendor', 'vendor')
        .leftJoinAndSelect('po.creator', 'creator')
        .leftJoinAndSelect('po.line_items', 'line_items')
        .leftJoinAndSelect('line_items.product', 'product')
        .getOne();

      if (!fullOrder) {
        console.error('[PDF] Failed to load full order:', purchaseOrderId);
        return;
      }

      console.log('[PDF] Generating PDF buffer...');
      let pdfBuffer: Buffer;
      let s3Key: string;

      try {
        pdfBuffer = await this.pdfService.generatePdf(fullOrder);
        console.log('[PDF] PDF buffer generated, size:', pdfBuffer.length);

        console.log('[PDF] Uploading to S3...');
        const uploadResult = await this.pdfService.uploadPdfToS3(
          fullOrder,
          pdfBuffer,
          'DOCUMENTO_ORIGINAL',
        );
        s3Key = uploadResult.s3Key;
        console.log('[PDF] Uploaded to S3, key:', s3Key);
      } catch (s3Error) {
        console.error('[PDF] S3 upload failed:', s3Error);
        throw s3Error; // Throw the error so we can see what's wrong
      }

      console.log('[PDF] Creating document record...');
      await this.documentsService.uploadDocument(
        purchaseOrderId,
        PurchaseOrderService.DOC_TYPE_DOCUMENTO_ORIGINAL,
        `DOCUMENTO_ORIGINAL_${fullOrder.folio}.pdf`,
        s3Key,
        pdfBuffer.length,
        'application/pdf',
        userId,
      );
      console.log('[PDF] Document record created successfully');
    } catch (error) {
      console.error('[PDF] Error in generateAndUploadPdf:', error);
    }
  }

  /**
   * Find all purchase orders with optional filters
   */
  async findAll(
    tenantId: string,
    filters: QueryPurchaseOrderDto,
  ): Promise<{ data: PurchaseOrderBatch[]; total: number }> {
    const query = this.purchaseOrderBatchRepository
      .createQueryBuilder('po')
      .where('po.tenant_id = :tenantId', { tenantId })
      .leftJoinAndSelect('po.fiscal_configuration', 'fiscal_config')
      .leftJoinAndSelect('po.warehouse', 'warehouse')
      .leftJoinAndSelect('po.vendor', 'vendor');

    if (filters.general_status) {
      query.andWhere('po.general_status = :general_status', {
        general_status: filters.general_status,
      });
    }

    if (filters.payment_status) {
      query.andWhere('po.payment_status = :payment_status', {
        payment_status: filters.payment_status,
      });
    }

    if (filters.vendor_id) {
      query.andWhere('po.vendor_id = :vendor_id', { vendor_id: filters.vendor_id });
    }

    if (filters.search) {
      const rawSearch = filters.search.trim();
      const search = `%${rawSearch}%`;
      const normalizedSearch = rawSearch.replace(/[\s-]/g, '');
      const normalizedSearchLike = `%${normalizedSearch}%`;
      query.andWhere(
        new Brackets((qb) => {
          qb.where('po.folio = :rawSearch', { rawSearch })
            .orWhere('LOWER(po.folio) LIKE LOWER(:search)', { search })
            .orWhere(
              "LOWER(REPLACE(REPLACE(po.folio, '-', ''), ' ', '')) LIKE LOWER(:normalizedSearchLike)",
              { normalizedSearchLike },
            )
            .orWhere('LOWER(vendor.company_name) LIKE LOWER(:search)', { search });
        }),
      );
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    query.skip(skip).take(limit).orderBy('po.created_at', 'DESC');

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  /**
   * Find a single purchase order by ID
   */
  async findOne(id: string, tenantId: string): Promise<PurchaseOrderBatch> {
    const purchaseOrder = await this.purchaseOrderBatchRepository
      .createQueryBuilder('po')
      .where('po.id = :id AND po.tenant_id = :tenantId', { id, tenantId })
      .leftJoinAndSelect('po.fiscal_configuration', 'fiscal_config')
      .leftJoinAndSelect('po.warehouse', 'warehouse')
      .leftJoinAndSelect('po.vendor', 'vendor')
      .leftJoinAndSelect('po.creator', 'creator')
      .leftJoinAndSelect('po.updater', 'updater')
      .leftJoinAndSelect('po.line_items', 'line_items')
      .leftJoinAndSelect('line_items.product', 'product')
      .leftJoinAndSelect('line_items.product_uom', 'product_uom')
      .leftJoinAndSelect('product_uom.uom', 'uom')
      .leftJoinAndSelect('line_items.received_product', 'received_product')
      .leftJoinAndSelect('line_items.received_uom', 'received_uom')
      .leftJoinAndSelect('line_items.converted_uom', 'converted_uom')
      .leftJoinAndSelect('po.batches', 'batches')
      .leftJoinAndSelect('batches.product', 'batch_product')
      .leftJoinAndSelect('batches.uom', 'batch_uom')
      .leftJoinAndSelect('batches.warehouse', 'batch_warehouse')
      .getOne();

    if (!purchaseOrder) {
      throw new NotFoundException(`Purchase order not found: ${id}`);
    }

    // Never leak credential hashes in API responses.
    if (purchaseOrder.creator) {
      delete (purchaseOrder.creator as any).password;
    }
    if (purchaseOrder.updater) {
      delete (purchaseOrder.updater as any).password;
    }

    return purchaseOrder;
  }

  private buildPaymentSummary(
    purchaseOrder: PurchaseOrderBatch,
    payments: PurchaseOrderPayment[],
  ): {
    amount_paid: number;
    amount_pending: number;
    payment_status: string;
    currency: string;
  } {
    const requestedTotal = Number(purchaseOrder.requested_total || 0);
    const receivedTotal = Number(purchaseOrder.received_total || 0);
    // For open orders (Creada), payments are against requested total.
    // Once received, payments should track the received total.
    const total =
      purchaseOrder.general_status === 'Recibida'
        ? (receivedTotal > 0 ? receivedTotal : requestedTotal)
        : requestedTotal;
    const amount_paid = payments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );
    const amount_pending = Math.max(total - amount_paid, 0);
    const payment_status = amount_pending <= 0 ? 'Pagado' : 'Pendiente';

    return {
      amount_paid: Number(amount_paid.toFixed(2)),
      amount_pending: Number(amount_pending.toFixed(2)),
      payment_status,
      currency: purchaseOrder.payment_currency || 'MXN',
    };
  }

  async getPayments(id: string, tenantId: string): Promise<{
    payments: PurchaseOrderPayment[];
    summary: {
      amount_paid: number;
      amount_pending: number;
      payment_status: string;
      currency: string;
    };
  }> {
    const purchaseOrder = await this.findOne(id, tenantId);
    return this.getPaymentsForOrder(purchaseOrder);
  }

  private async getPaymentsForOrder(purchaseOrder: PurchaseOrderBatch): Promise<{
    payments: PurchaseOrderPayment[];
    summary: {
      amount_paid: number;
      amount_pending: number;
      payment_status: string;
      currency: string;
    };
  }> {
    const payments = await this.purchaseOrderPaymentRepository.find({
      where: {
        purchase_order_batch_id: purchaseOrder.id,
        tenant_id: purchaseOrder.tenant_id,
      },
      order: { payment_date: 'DESC', created_at: 'DESC' },
    });

    const summary = this.buildPaymentSummary(purchaseOrder, payments);
    return { payments, summary };
  }

  async createPayment(
    purchaseOrderId: string,
    dto: CreatePurchaseOrderPaymentDto,
    tenantId: string,
    userId: string,
  ): Promise<{
    payment: PurchaseOrderPayment;
    summary: {
      amount_paid: number;
      amount_pending: number;
      payment_status: string;
      currency: string;
    };
  }> {
    const purchaseOrder = await this.findOne(purchaseOrderId, tenantId);

    if (purchaseOrder.general_status === 'Cancelada') {
      throw new BadRequestException('No se pueden registrar pagos en una orden cancelada');
    }

    if (purchaseOrder.payment_currency !== dto.currency) {
      throw new BadRequestException(
        `La moneda del pago debe ser ${purchaseOrder.payment_currency}`,
      );
    }

    const existingPayments = await this.purchaseOrderPaymentRepository.find({
      where: {
        purchase_order_batch_id: purchaseOrderId,
        tenant_id: tenantId,
      },
    });
    const currentSummary = this.buildPaymentSummary(purchaseOrder, existingPayments);

    if (dto.amount > currentSummary.amount_pending) {
      throw new BadRequestException(
        `El monto excede el saldo pendiente (${currentSummary.amount_pending.toFixed(2)} ${currentSummary.currency})`,
      );
    }

    const payment = this.purchaseOrderPaymentRepository.create({
      tenant_id: tenantId,
      purchase_order_batch_id: purchaseOrderId,
      payment_date: new Date(dto.payment_date),
      amount: dto.amount,
      currency: dto.currency,
      payment_method: dto.payment_method,
      reference_number: dto.reference_number,
      notes: dto.notes,
      created_by: userId,
    });

    await this.purchaseOrderPaymentRepository.save(payment);

    const updatedPayments = [...existingPayments, payment];
    const updatedSummary = this.buildPaymentSummary(purchaseOrder, updatedPayments);
    purchaseOrder.payment_status = updatedSummary.payment_status;
    purchaseOrder.updated_by = userId;
    await this.purchaseOrderBatchRepository.save(purchaseOrder);

    return { payment, summary: updatedSummary };
  }

  async deletePayment(
    purchaseOrderId: string,
    paymentId: string,
    tenantId: string,
    userId: string,
  ): Promise<{
    success: true;
    id: string;
    summary: {
      amount_paid: number;
      amount_pending: number;
      payment_status: string;
      currency: string;
    };
  }> {
    const purchaseOrder = await this.findOne(purchaseOrderId, tenantId);

    const payment = await this.purchaseOrderPaymentRepository.findOne({
      where: {
        id: paymentId,
        purchase_order_batch_id: purchaseOrderId,
        tenant_id: tenantId,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment not found: ${paymentId}`);
    }

    await this.purchaseOrderPaymentRepository.remove(payment);

    const paymentData = await this.getPaymentsForOrder(purchaseOrder);
    purchaseOrder.payment_status = paymentData.summary.payment_status;
    purchaseOrder.updated_by = userId;
    await this.purchaseOrderBatchRepository.save(purchaseOrder);

    return {
      success: true,
      id: paymentId,
      summary: paymentData.summary,
    };
  }

  /**
   * Receive a purchase order and create inventory batches
   */
  async receive(
    id: string,
    dto: ReceivePurchaseOrderDto,
    tenantId: string,
    userId: string,
  ): Promise<PurchaseOrderBatch> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const purchaseOrder = await this.findOne(id, tenantId);

      // Calculate received totals
      let received_subtotal = 0;
      let received_iva_total = 0;
      let received_ieps_total = 0;

      // Update line items with received data
      for (const receivedItem of dto.received_items) {
        const lineItem = purchaseOrder.line_items.find(
          (li) => li.id === receivedItem.line_item_id,
        );

        if (!lineItem) {
          throw new NotFoundException(
            `Line item not found: ${receivedItem.line_item_id}`,
          );
        }

        // Set received original data
        lineItem.received_original_product_id = receivedItem.product_id;
        lineItem.received_original_uom_id = receivedItem.product_uom_id;
        lineItem.received_original_quantity = receivedItem.quantity;
        lineItem.received_original_unit_total = receivedItem.unit_total;
        lineItem.received_original_iva_percentage = receivedItem.iva_percentage;
        lineItem.received_original_iva_unit = receivedItem.iva_unit;
        lineItem.received_original_ieps_percentage = receivedItem.ieps_percentage;
        lineItem.received_original_ieps_unit = receivedItem.ieps_unit;

        // Convert to base unit
        const convertedQuantity = await this.unitConversionService.convertToBaseUnit(
          receivedItem.quantity,
          receivedItem.product_uom_id,
          receivedItem.product_id,
        );
        const baseUomId = await this.unitConversionService.getBaseUom(
          receivedItem.product_id,
        );

        lineItem.received_converted_quantity = convertedQuantity;
        lineItem.received_converted_uom_id = baseUomId;
        lineItem.updated_by = userId;

        await queryRunner.manager.save(lineItem);

        // Calculate received totals
        const line_subtotal = receivedItem.quantity * receivedItem.unit_total;
        const line_iva = receivedItem.iva_unit || (line_subtotal * (receivedItem.iva_percentage || 0) / 100);
        const line_ieps = receivedItem.ieps_unit || (line_subtotal * (receivedItem.ieps_percentage || 0) / 100);

        received_subtotal += line_subtotal;
        received_iva_total += line_iva;
        received_ieps_total += line_ieps;

        // Create inventory batch
        const batchNumber = await this.batchNumberGenerator.generateBatchNumber(
          purchaseOrder.warehouse_id,
          tenantId,
        );

        const batch = this.inventoryBatchRepository.create({
          id: uuidv4(),
          tenant_id: tenantId,
          batch_number: batchNumber,
          warehouse_id: purchaseOrder.warehouse_id,
          product_id: receivedItem.product_id,
          uom_id: baseUomId,
          initial_quantity: convertedQuantity,
          available_quantity: convertedQuantity,
          purchase_order_batch_id: purchaseOrder.id,
          purchase_order_detail_id: lineItem.id,
          created_by: userId,
        });

        await queryRunner.manager.save(batch);
      }

      // Update purchase order with received totals
      purchaseOrder.received_subtotal = received_subtotal;
      purchaseOrder.received_iva_total = received_iva_total;
      purchaseOrder.received_ieps_total = received_ieps_total;
      purchaseOrder.received_total = received_subtotal + received_iva_total + received_ieps_total;
      purchaseOrder.general_status = 'Recibida';
      purchaseOrder.updated_by = userId;
      await queryRunner.manager.save(purchaseOrder);

      await queryRunner.commitTransaction();
      return this.findOne(id, tenantId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Cancel a purchase order
   */
  async cancel(id: string, tenantId: string, userId: string): Promise<PurchaseOrderBatch> {
    const purchaseOrder = await this.findOne(id, tenantId);

    if (purchaseOrder.general_status !== 'Creada') {
      throw new BadRequestException(
        `Cannot cancel purchase order with status: ${purchaseOrder.general_status}`,
      );
    }

    purchaseOrder.general_status = 'Cancelada';
    purchaseOrder.updated_by = userId;

    await this.purchaseOrderBatchRepository.save(purchaseOrder);
    return this.findOne(id, tenantId);
  }

  /**
   * Full replace of purchase order (same body shape as {@link create}): header + all line items.
   * Deletes existing lines and inserts the new list; recalculates requested_* totals.
   * Only when {@link PurchaseOrderBatch.general_status} is Creada. Folio and id are preserved.
   */
  async replacePurchaseOrder(
    id: string,
    dto: CreatePurchaseOrderDto,
    tenantId: string,
    userId: string,
  ): Promise<PurchaseOrderBatch> {
    const existing = await this.findOne(id, tenantId);

    if (existing.general_status !== 'Creada') {
      throw new BadRequestException(
        `Cannot replace purchase order with status: ${existing.general_status}`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(PurchaseOrderBatchDetail, {
        purchase_order_batch_id: id,
      });

      const totals = await this.insertLineItemsForPurchaseOrder(
        queryRunner,
        id,
        dto.line_items,
        userId,
      );

      const batch = await queryRunner.manager.findOne(PurchaseOrderBatch, {
        where: { id, tenant_id: tenantId },
      });
      if (!batch) {
        throw new NotFoundException(`Purchase order not found: ${id}`);
      }

      batch.fiscal_configuration_id = dto.fiscal_configuration_id;
      batch.warehouse_id = dto.warehouse_id;
      batch.vendor_id = dto.vendor_id;
      batch.expected_delivery_date = new Date(dto.expected_delivery_date);
      if (dto.payment_status !== undefined) {
        batch.payment_status = dto.payment_status;
      }
      if (dto.payment_currency !== undefined) {
        batch.payment_currency = dto.payment_currency;
      }
      if (dto.notes !== undefined) {
        batch.notes = dto.notes;
      }
      batch.requested_subtotal = totals.requested_subtotal;
      batch.requested_iva_total = totals.requested_iva_total;
      batch.requested_ieps_total = totals.requested_ieps_total;
      batch.requested_total =
        totals.requested_subtotal +
        totals.requested_iva_total +
        totals.requested_ieps_total;
      batch.updated_by = userId;

      await queryRunner.manager.save(batch);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    this.regenerateDocumentoOriginal(id, tenantId, userId).catch((err) => {
      console.error(
        '[PDF] Error regenerating DOCUMENTO_ORIGINAL after full PO replace:',
        err,
      );
    });

    return this.findOne(id, tenantId);
  }

  /**
   * Append one line item to an existing purchase order (only Creada). Recalculates requested_* totals.
   */
  async addLineItem(
    orderId: string,
    dto: CreateLineItemDto,
    tenantId: string,
    userId: string,
  ): Promise<PurchaseOrderBatchDetail> {
    const purchaseOrder = await this.findOne(orderId, tenantId);

    if (purchaseOrder.general_status !== 'Creada') {
      throw new BadRequestException(
        `Cannot add line item to purchase order with status: ${purchaseOrder.general_status}`,
      );
    }

    const line_subtotal = Number(dto.quantity) * Number(dto.unit_total);
    const iva_percentage = Number(dto.iva_percentage || 0);
    const line_iva = (line_subtotal * iva_percentage) / 100;
    const ieps_percentage = Number(dto.ieps_percentage || 0);
    const line_ieps = (line_subtotal * ieps_percentage) / 100;

    const productUomId = await this.unitConversionService.getProductUomId(
      dto.uom_id,
      dto.product_id,
    );

    const detail = this.purchaseOrderDetailRepository.create({
      id: uuidv4(),
      purchase_order_batch_id: purchaseOrder.id,
      product_id: dto.product_id,
      product_uom_id: productUomId,
      quantity: dto.quantity,
      unit_total: dto.unit_total,
      iva_percentage,
      iva_unit: line_iva / Number(dto.quantity),
      ieps_percentage,
      ieps_unit: line_ieps / Number(dto.quantity),
      created_by: userId,
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.save(detail);
      await this.persistRequestedTotalsWithRunner(
        queryRunner,
        orderId,
        tenantId,
        userId,
      );
      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }

    return detail;
  }

  /**
   * Requested totals from line items (same rules as {@link create}).
   */
  private computeRequestedTotalsFromLineItems(
    details: PurchaseOrderBatchDetail[],
  ): {
    requested_subtotal: number;
    requested_iva_total: number;
    requested_ieps_total: number;
    requested_total: number;
  } {
    let requested_subtotal = 0;
    let requested_iva_total = 0;
    let requested_ieps_total = 0;

    for (const d of details) {
      const qty = Number(d.quantity);
      const unitTotal = Number(d.unit_total);
      const line_subtotal = qty * unitTotal;
      const iva_percentage = Number(d.iva_percentage || 0);
      const ieps_percentage = Number(d.ieps_percentage || 0);
      const line_iva = (line_subtotal * iva_percentage) / 100;
      const line_ieps = (line_subtotal * ieps_percentage) / 100;
      requested_subtotal += line_subtotal;
      requested_iva_total += line_iva;
      requested_ieps_total += line_ieps;
    }

    return {
      requested_subtotal,
      requested_iva_total,
      requested_ieps_total,
      requested_total:
        requested_subtotal + requested_iva_total + requested_ieps_total,
    };
  }

  private async persistRequestedTotalsWithRunner(
    qr: QueryRunner,
    purchaseOrderId: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const details = await qr.manager.find(PurchaseOrderBatchDetail, {
      where: { purchase_order_batch_id: purchaseOrderId },
    });
    const totals = this.computeRequestedTotalsFromLineItems(details);
    const batch = await qr.manager.findOne(PurchaseOrderBatch, {
      where: { id: purchaseOrderId, tenant_id: tenantId },
    });
    if (!batch) {
      throw new NotFoundException(`Purchase order not found: ${purchaseOrderId}`);
    }
    batch.requested_subtotal = totals.requested_subtotal;
    batch.requested_iva_total = totals.requested_iva_total;
    batch.requested_ieps_total = totals.requested_ieps_total;
    batch.requested_total = totals.requested_total;
    batch.updated_by = userId;
    await qr.manager.save(batch);
  }

  /**
   * Recompute per-line IVA/IEPS unit amounts from percentages (aligned with create()).
   */
  private applyLineTaxesFromPercentages(lineItem: PurchaseOrderBatchDetail): void {
    const qty = Number(lineItem.quantity);
    const unitTotal = Number(lineItem.unit_total);
    const line_subtotal = qty * unitTotal;
    const iva_percentage = Number(lineItem.iva_percentage || 0);
    const ieps_percentage = Number(lineItem.ieps_percentage || 0);
    const line_iva = (line_subtotal * iva_percentage) / 100;
    const line_ieps = (line_subtotal * ieps_percentage) / 100;
    lineItem.iva_unit = line_iva / qty;
    lineItem.ieps_unit = line_ieps / qty;
  }

  /**
   * Update a line item (UOM must belong to the line product via product_uoms).
   * Updates requested_* totals on the purchase order header.
   */
  async updateLineItem(
    orderId: string,
    lineItemId: string,
    dto: UpdateLineItemDto,
    tenantId: string,
    userId: string,
  ): Promise<PurchaseOrderBatchDetail> {
    const purchaseOrder = await this.findOne(orderId, tenantId);

    if (purchaseOrder.general_status !== 'Creada') {
      throw new BadRequestException(
        `Cannot update line item for purchase order with status: ${purchaseOrder.general_status}`,
      );
    }

    const lineItem = purchaseOrder.line_items.find((li) => li.id === lineItemId);

    if (!lineItem) {
      throw new NotFoundException(`Line item not found: ${lineItemId}`);
    }

    if (dto.uom_id !== undefined) {
      lineItem.product_uom_id = await this.unitConversionService.getProductUomId(
        dto.uom_id,
        lineItem.product_id,
      );
    }
    if (dto.quantity !== undefined) {
      lineItem.quantity = dto.quantity;
    }
    if (dto.unit_total !== undefined) {
      lineItem.unit_total = dto.unit_total;
    }
    if (dto.iva_percentage !== undefined) {
      lineItem.iva_percentage = dto.iva_percentage;
    }
    if (dto.ieps_percentage !== undefined) {
      lineItem.ieps_percentage = dto.ieps_percentage;
    }

    const qty = Number(lineItem.quantity);
    if (qty <= 0 || !Number.isFinite(qty)) {
      throw new BadRequestException('quantity must be a positive number');
    }

    this.applyLineTaxesFromPercentages(lineItem);
    lineItem.updated_by = userId;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.save(lineItem);
      await this.persistRequestedTotalsWithRunner(
        queryRunner,
        orderId,
        tenantId,
        userId,
      );
      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }

    return lineItem;
  }

  /**
   * Remove a line item and refresh requested_* totals on the header.
   */
  async removeLineItem(
    orderId: string,
    lineItemId: string,
    tenantId: string,
    userId: string,
  ): Promise<{ success: true; id: string }> {
    const purchaseOrder = await this.findOne(orderId, tenantId);

    if (purchaseOrder.general_status !== 'Creada') {
      throw new BadRequestException(
        `Cannot remove line item for purchase order with status: ${purchaseOrder.general_status}`,
      );
    }

    const lineItem = purchaseOrder.line_items.find((li) => li.id === lineItemId);

    if (!lineItem) {
      throw new NotFoundException(`Line item not found: ${lineItemId}`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.remove(lineItem);
      await this.persistRequestedTotalsWithRunner(
        queryRunner,
        orderId,
        tenantId,
        userId,
      );
      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }

    return { success: true, id: lineItemId };
  }
  /**
   * Regenerate DOCUMENTO_ORIGINAL for a purchase order
   */
  async regenerateDocumentoOriginal(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const purchaseOrder = await this.findOne(id, tenantId);

      // Delete all previous DOCUMENTO_ORIGINAL records before creating a new one
      await this.deleteDocumentsByType(
        id,
        PurchaseOrderService.DOC_TYPE_DOCUMENTO_ORIGINAL,
      );

      // Generate new PDF
      let pdfBuffer: Buffer;
      let s3Key: string;

      try {
        pdfBuffer = await this.pdfService.generatePdf(purchaseOrder);
        const uploadResult = await this.pdfService.uploadPdfToS3(
          purchaseOrder,
          pdfBuffer,
          'DOCUMENTO_ORIGINAL',
        );
        s3Key = uploadResult.s3Key;
      } catch (s3Error) {
        console.error('[PDF] S3 upload failed:', s3Error);
        throw s3Error; // Throw the error so we can see what's wrong
      }

      // Create new document record
      await this.documentsService.uploadDocument(
        id,
        PurchaseOrderService.DOC_TYPE_DOCUMENTO_ORIGINAL,
        `DOCUMENTO_ORIGINAL_${purchaseOrder.folio}.pdf`,
        s3Key,
        pdfBuffer.length,
        'application/pdf',
        userId,
      );

      return {
        success: true,
        message: 'DOCUMENTO_ORIGINAL regenerado exitosamente',
      };
    } catch (error) {
      console.error('[PDF] Error regenerating DOCUMENTO_ORIGINAL:', error);
      throw error;
    }
  }

  /**
   * Regenerate RECEPCIÓN document for a received purchase order
   */
  async regenerateRecepcionDocument(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const purchaseOrder = await this.findOne(id, tenantId);

      // Check if PO is received
      if (purchaseOrder.general_status !== 'Recibida') {
        throw new Error('La orden de compra debe estar en estado "Recibida" para generar documento de recepción');
      }

      // Delete all previous RECEPCIÓN records before creating a new one
      await this.deleteDocumentsByType(id, PurchaseOrderService.DOC_TYPE_RECEPCION);

      // Generate reception PDF
      let pdfBuffer: Buffer;
      let s3Key: string;

      try {
        pdfBuffer = await this.pdfService.generateRecepcionPdf(purchaseOrder);
        const uploadResult = await this.pdfService.uploadPdfToS3(
          purchaseOrder,
          pdfBuffer,
          'RECEPCION',
        );
        s3Key = uploadResult.s3Key;
      } catch (s3Error) {
        console.error('[PDF] S3 upload failed:', s3Error);
        throw s3Error; // Throw the error so we can see what's wrong
      }

      // Create new document record (RECEPCIÓN type)
      await this.documentsService.uploadDocument(
        id,
        PurchaseOrderService.DOC_TYPE_RECEPCION,
        `RECEPCION_${purchaseOrder.folio}.pdf`,
        s3Key,
        pdfBuffer.length,
        'application/pdf',
        userId,
      );

      return {
        success: true,
        message: 'Documento de RECEPCIÓN regenerado exitosamente',
      };
    } catch (error) {
      console.error('[PDF] Error regenerating RECEPCIÓN document:', error);
      throw error;
    }
  }
}
