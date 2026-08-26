import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner, Brackets, QueryFailedError, SelectQueryBuilder } from 'typeorm';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { PurchaseOrderBatchDetail } from '../../../entities/purchase-orders/purchase-order-batch-detail.entity';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { PurchaseOrderPayment } from '../../../entities/purchase-orders/purchase-order-payment.entity';
import { Warehouse } from '../../../entities/warehouse/warehouse.entity';
import { Vendor } from '../../../entities/vendor/vendor.entity';
import { VendorType } from '../../../entities/vendor/vendor-type.enum';
import { CreatePurchaseOrderDto, CreateLineItemDto } from '../dto/create-purchase-order.dto';
import { ReceivePurchaseOrderDto } from '../dto/receive-purchase-order.dto';
import { UpdateLineItemDto } from '../dto/update-line-item.dto';
import { QueryPurchaseOrderDto } from '../dto/query-purchase-order.dto';
import { CreatePurchaseOrderPaymentDto } from '../dto/create-purchase-order-payment.dto';
import { UpdatePurchaseOrderNotesDto } from '../dto/update-purchase-order-notes.dto';
import { UpdatePurchaseOrderPedimentoDto } from '../dto/update-purchase-order-pedimento.dto';
import { UnitConversionService } from './unit-conversion.service';
import { BatchNumberGeneratorService } from './batch-number-generator.service';
import { FolioGeneratorService } from './folio-generator.service';
import { PurchaseOrderPdfService } from './purchase-order-pdf.service';
import { PurchaseOrderDocumentsService } from './purchase-order-documents.service';
import { PurchaseOrderDocumentLanguage } from '../../../entities/purchase-orders/purchase-order-document-language.enum';
import { ProductUoM, ProductVendorCost } from '../../../entities/products';
import { v4 as uuidv4 } from 'uuid';

type PurchaseOrderCurrency = 'MXN' | 'USD';

type PurchaseOrderStatBucket = { count: number; amount: number };

type PurchaseOrderCurrencyStats = {
  count: number;
  amount: number;
  by_status: {
    Creada: PurchaseOrderStatBucket;
    Recibida: PurchaseOrderStatBucket;
    Cancelada: PurchaseOrderStatBucket;
  };
  by_payment: {
    Pagado: PurchaseOrderStatBucket;
    Pendiente: PurchaseOrderStatBucket;
  };
};

export type PurchaseOrderListStats = {
  count: number;
  by_currency: {
    MXN: PurchaseOrderCurrencyStats;
    USD: PurchaseOrderCurrencyStats;
  };
};

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
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
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

  private normalizeCurrency(value?: string | null): PurchaseOrderCurrency | null {
    if (value == null || String(value).trim() === '') return null;
    const upper = String(value).trim().toUpperCase();
    if (upper === 'MXN' || upper === 'USD') return upper;
    throw new BadRequestException('La moneda debe ser MXN o USD');
  }

  private throwMixedCurrency(): never {
    throw new BadRequestException(
      'No se pueden mezclar MXN y USD en la misma orden de compra. Todos los productos deben estar en la misma moneda.',
    );
  }

  private throwLineCurrencyMismatch(productCurrency: string, expected: string): never {
    throw new BadRequestException(
      `Este producto está en ${productCurrency} y la orden en ${expected}. No se puede mezclar monedas en una orden de compra.`,
    );
  }

  private findVendorCost(
    queryRunner: QueryRunner,
    vendorId: string,
    productId: string,
    productUomId: string,
  ): Promise<ProductVendorCost | null> {
    return queryRunner.manager.findOne(ProductVendorCost, {
      where: {
        vendor_id: vendorId,
        product_id: productId,
        product_uom_id: productUomId,
      },
    });
  }

  /**
   * Moneda de la OC: costos de proveedor existentes, si no hay, currency de las líneas / header.
   * Rechaza mezcla MXN + USD.
   */
  private async resolvePurchaseOrderCurrency(
    queryRunner: QueryRunner,
    vendorId: string,
    lineItems: CreateLineItemDto[],
    headerCurrency?: string,
  ): Promise<PurchaseOrderCurrency> {
    const header = this.normalizeCurrency(headerCurrency);
    const currencies = new Set<PurchaseOrderCurrency>();

    for (const line of lineItems) {
      const productUomId = await this.unitConversionService.getProductUomId(
        line.uom_id,
        line.product_id,
      );
      const existing = await this.findVendorCost(
        queryRunner,
        vendorId,
        line.product_id,
        productUomId,
      );
      const fromCost = existing
        ? this.normalizeCurrency(existing.currency) || 'MXN'
        : null;
      const fromLine = this.normalizeCurrency(line.currency);
      if (fromCost && fromLine && fromCost !== fromLine) {
        this.throwLineCurrencyMismatch(fromCost, fromLine);
      }
      const resolved = fromCost || fromLine;
      if (resolved) currencies.add(resolved);
    }

    if (currencies.size > 1) {
      this.throwMixedCurrency();
    }

    const resolved = [...currencies][0] ?? header ?? 'MXN';
    if (header && header !== resolved) {
      throw new BadRequestException(
        `La orden debe ser en ${resolved}. No se puede usar ${header} porque los productos están en otra moneda.`,
      );
    }
    return resolved;
  }

  /** Crea el costo proveedor+UOM si no existe. No sobrescribe un costo ya guardado. */
  private async ensureVendorCostFromPoLine(
    queryRunner: QueryRunner,
    params: {
      vendorId: string;
      productId: string;
      productUomId: string;
      unitTotal: number;
      ivaPercentage: number;
      iepsPercentage: number;
      currency: PurchaseOrderCurrency;
    },
  ): Promise<void> {
    const existing = await this.findVendorCost(
      queryRunner,
      params.vendorId,
      params.productId,
      params.productUomId,
    );
    if (existing) {
      const existingCurrency = this.normalizeCurrency(existing.currency) || 'MXN';
      if (existingCurrency !== params.currency) {
        this.throwLineCurrencyMismatch(existingCurrency, params.currency);
      }
      return;
    }

    const cost = Number(params.unitTotal);
    const iva = Number(params.ivaPercentage) || 0;
    const ieps = Number(params.iepsPercentage) || 0;
    const ivaUnit = Number(((cost * iva) / 100).toFixed(2));
    const iepsUnit = Number(((cost * ieps) / 100).toFixed(2));
    const row = queryRunner.manager.create(ProductVendorCost, {
      product_id: params.productId,
      vendor_id: params.vendorId,
      product_uom_id: params.productUomId,
      cost,
      iva_percentage: iva,
      ieps_percentage: ieps,
      iva_unit_total: ivaUnit,
      ieps_unit_total: iepsUnit,
      subtotal: Number(cost.toFixed(2)),
      total: Number((cost + ivaUnit + iepsUnit).toFixed(2)),
      currency: params.currency,
    });
    await queryRunner.manager.save(row);
  }

  /**
   * Persist line items for a batch and return requested subtotals (same rules as {@link create}).
   */
  private async insertLineItemsForPurchaseOrder(
    queryRunner: QueryRunner,
    purchaseOrderBatchId: string,
    vendorId: string,
    lineItems: CreateLineItemDto[],
    userId: string,
    headerCurrency?: string,
  ): Promise<{
    requested_subtotal: number;
    requested_iva_total: number;
    requested_ieps_total: number;
    payment_currency: PurchaseOrderCurrency;
  }> {
    const paymentCurrency = await this.resolvePurchaseOrderCurrency(
      queryRunner,
      vendorId,
      lineItems,
      headerCurrency,
    );

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

      await this.ensureVendorCostFromPoLine(queryRunner, {
        vendorId,
        productId: lineItem.product_id,
        productUomId,
        unitTotal: Number(lineItem.unit_total),
        ivaPercentage: iva_percentage,
        iepsPercentage: ieps_percentage,
        currency: paymentCurrency,
      });

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

    return {
      requested_subtotal,
      requested_iva_total,
      requested_ieps_total,
      payment_currency: paymentCurrency,
    };
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
      await this.assertWarehouseMatchesFiscal(
        tenantId,
        dto.warehouse_id,
        dto.fiscal_configuration_id,
        dto.billing_branch_id,
      );

      const vendor = await this.getVendorOrFail(dto.vendor_id, tenantId);
      const pedimentoNumber = this.resolvePedimentoForVendor(
        vendor,
        dto.pedimento_number,
      );

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
        pedimento_number: pedimentoNumber,
        created_by: userId,
      });

      const savedOrder = await queryRunner.manager.save(purchaseOrder);

      const totals = await this.insertLineItemsForPurchaseOrder(
        queryRunner,
        savedOrder.id,
        dto.vendor_id,
        dto.line_items,
        userId,
        dto.payment_currency,
      );

      savedOrder.payment_currency = totals.payment_currency;
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
      if (error instanceof QueryFailedError) {
        const driverError = (error as QueryFailedError & {
          driverError?: { code?: string; message?: string };
        }).driverError;
        if (driverError?.code === 'ER_DUP_ENTRY') {
          throw new BadRequestException(
            'Folio de orden de compra duplicado. Reintente crear la orden.',
          );
        }
        if (driverError?.code === 'ER_NO_REFERENCED_ROW_2') {
          throw new BadRequestException(
            'Referencia inválida (almacén, proveedor, razón fiscal, producto o UOM).',
          );
        }
      }
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
        .leftJoinAndSelect('warehouse.billing_branch', 'billing_branch')
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
        `DOCUMENTO_ORIGINAL_${fullOrder.folio}_es.pdf`,
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
  ): Promise<{
    data: PurchaseOrderBatch[];
    total: number;
    stats: PurchaseOrderListStats;
  }> {
    const query = this.purchaseOrderBatchRepository
      .createQueryBuilder('po')
      .where('po.tenant_id = :tenantId', { tenantId })
      .leftJoinAndSelect('po.fiscal_configuration', 'fiscal_config')
      .leftJoinAndSelect('po.warehouse', 'warehouse')
      .leftJoinAndSelect('warehouse.billing_branch', 'billing_branch')
      .leftJoinAndSelect('po.vendor', 'vendor');

    this.applyListFilters(query, filters);

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    query.skip(skip).take(limit).orderBy('po.created_at', 'DESC');

    const [rows, total] = await query.getManyAndCount();
    const stats = await this.getListStats(tenantId, filters);
    return { data: rows.map((po) => this.mapPurchaseOrderLocation(po)), total, stats };
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
      .leftJoinAndSelect('warehouse.billing_branch', 'billing_branch')
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
      throw new NotFoundException(`Orden de compra no encontrada: ${id}`);
    }

    // Recepción a medias: hay lotes pero el estado quedó en Creada → pasar a Recibida
    if (
      purchaseOrder.general_status === 'Creada' &&
      (purchaseOrder.batches?.length ?? 0) > 0
    ) {
      const lines = purchaseOrder.line_items || [];
      let subtotal = 0;
      let iva = 0;
      let ieps = 0;
      for (const line of lines) {
        const qty = Number(line.received_original_quantity || 0);
        if (qty <= 0) continue;
        subtotal += qty * Number(line.received_original_unit_total || 0);
        iva += qty * Number(line.received_original_iva_unit || 0);
        ieps += qty * Number(line.received_original_ieps_unit || 0);
      }
      const round = (n: number) => Math.round(n * 100) / 100;

      await this.purchaseOrderBatchRepository.update(
        { id, tenant_id: tenantId },
        {
          general_status: 'Recibida',
          received_subtotal: round(subtotal),
          received_iva_total: round(iva),
          received_ieps_total: round(ieps),
          received_total: round(subtotal + iva + ieps),
        },
      );
      purchaseOrder.general_status = 'Recibida';
      purchaseOrder.received_subtotal = round(subtotal);
      purchaseOrder.received_iva_total = round(iva);
      purchaseOrder.received_ieps_total = round(ieps);
      purchaseOrder.received_total = round(subtotal + iva + ieps);
    }

    // Never leak credential hashes in API responses.
    if (purchaseOrder.creator) {
      delete (purchaseOrder.creator as any).password;
    }
    if (purchaseOrder.updater) {
      delete (purchaseOrder.updater as any).password;
    }

    return this.mapPurchaseOrderLocation(purchaseOrder);
  }

  private async assertWarehouseMatchesFiscal(
    tenantId: string,
    warehouseId: string,
    fiscalConfigurationId: string,
    billingBranchId?: string,
  ): Promise<void> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id: warehouseId, tenant_id: tenantId },
      relations: ['billing_branch'],
    });

    if (!warehouse) {
      throw new BadRequestException('Almacén no encontrado');
    }

    const branch = warehouse.billing_branch;
    if (!branch) {
      throw new BadRequestException('El almacén no pertenece a ninguna sucursal');
    }

    if (billingBranchId && branch.id !== billingBranchId) {
      throw new BadRequestException('El almacén no pertenece a la sucursal seleccionada');
    }

    if (branch.fiscal_configuration_id !== fiscalConfigurationId) {
      throw new BadRequestException(
        'La sucursal del almacén no pertenece a la razón social seleccionada',
      );
    }
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /** Totales de línea para la tabla/footer del detalle (no se persisten). */
  private mapLineItemForUi(line: PurchaseOrderBatchDetail) {
    const quantity = Number(line.quantity) || 0;
    const unitTotal = Number(line.unit_total) || 0;
    const ivaPercentage = Number(line.iva_percentage) || 0;
    const iepsPercentage = Number(line.ieps_percentage) || 0;
    const lineSubtotal = quantity * unitTotal;
    const lineIva = (lineSubtotal * ivaPercentage) / 100;
    const lineIeps = (lineSubtotal * iepsPercentage) / 100;

    return {
      ...line,
      line_subtotal: this.roundMoney(lineSubtotal),
      line_iva: this.roundMoney(lineIva),
      line_ieps: this.roundMoney(lineIeps),
      line_total: this.roundMoney(lineSubtotal + lineIva + lineIeps),
    };
  }

  private mapPurchaseOrderLocation(po: PurchaseOrderBatch) {
    const branch = po.warehouse?.billing_branch ?? null;
    const fiscal = po.fiscal_configuration ?? null;
    const isInternationalVendor = po.vendor?.vendor_type === VendorType.INTERNATIONAL;

    return {
      ...po,
      can_edit_lines: po.general_status === 'Creada',
      is_international_vendor: isInternationalVendor,
      pedimento_number: isInternationalVendor ? po.pedimento_number ?? null : null,
      razon_social: fiscal?.razon_social ?? null,
      sucursal: branch?.code ?? null,
      billing_branch_id: po.warehouse?.billing_branch_id ?? branch?.id ?? null,
      billing_branch: branch
        ? {
            id: branch.id,
            code: branch.code,
            address: branch.address,
            city: branch.city,
            state: branch.state,
            country: branch.country,
            postal_code: branch.postal_code,
            fiscal_configuration_id: branch.fiscal_configuration_id,
          }
        : null,
      line_items: Array.isArray(po.line_items)
        ? po.line_items.map((line) => this.mapLineItemForUi(line))
        : po.line_items,
    };
  }

  private scheduleDocumentoOriginalRegen(
    orderId: string,
    tenantId: string,
    userId: string,
    context: string,
  ): void {
    this.regenerateDocumentoOriginalPreservingLanguage(orderId, tenantId, userId).catch(
      (err) => {
        console.error(
          `[PDF] Error regenerating DOCUMENTO_ORIGINAL after ${context}:`,
          err,
        );
      },
    );
  }

  private async getVendorOrFail(vendorId: string, tenantId: string): Promise<Vendor> {
    const vendor = await this.vendorRepository.findOne({
      where: { id: vendorId, tenant_id: tenantId },
    });
    if (!vendor) {
      throw new BadRequestException('Proveedor no encontrado');
    }
    return vendor;
  }

  private normalizePedimento(value?: string | null): string | null {
    const trimmed = value?.trim() ?? '';
    return trimmed.length ? trimmed : null;
  }

  /** Incluye el día completo cuando `created_to` llega como fecha (YYYY-MM-DD o medianoche). */
  private endOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private applyListFilters(
    query: SelectQueryBuilder<PurchaseOrderBatch>,
    filters: QueryPurchaseOrderDto,
  ): void {
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

    if (filters.fiscal_configuration_id) {
      query.andWhere('po.fiscal_configuration_id = :fiscal_configuration_id', {
        fiscal_configuration_id: filters.fiscal_configuration_id,
      });
    }

    if (filters.billing_branch_id) {
      query.andWhere('warehouse.billing_branch_id = :billing_branch_id', {
        billing_branch_id: filters.billing_branch_id,
      });
    }

    if (filters.warehouse_id) {
      query.andWhere('po.warehouse_id = :warehouse_id', { warehouse_id: filters.warehouse_id });
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
            .orWhere('LOWER(vendor.company_name) LIKE LOWER(:search)', { search })
            .orWhere('LOWER(po.pedimento_number) LIKE LOWER(:search)', { search });
        }),
      );
    }

    if (filters.created_from) {
      query.andWhere('po.created_at >= :created_from', {
        created_from: new Date(filters.created_from),
      });
    }

    if (filters.created_to) {
      query.andWhere('po.created_at <= :created_to', {
        created_to: this.endOfDay(new Date(filters.created_to)),
      });
    }
  }

  private emptyCurrencyStats(): PurchaseOrderCurrencyStats {
    const zero = (): PurchaseOrderStatBucket => ({ count: 0, amount: 0 });
    return {
      count: 0,
      amount: 0,
      by_status: { Creada: zero(), Recibida: zero(), Cancelada: zero() },
      by_payment: { Pagado: zero(), Pendiente: zero() },
    };
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private async getListStats(
    tenantId: string,
    filters: QueryPurchaseOrderDto,
  ): Promise<PurchaseOrderListStats> {
    const query = this.purchaseOrderBatchRepository
      .createQueryBuilder('po')
      .where('po.tenant_id = :tenantId', { tenantId })
      .leftJoin('po.warehouse', 'warehouse')
      .leftJoin('po.vendor', 'vendor');

    this.applyListFilters(query, filters);

    const rows = await query
      .select("COALESCE(po.payment_currency, 'MXN')", 'currency')
      .addSelect('po.general_status', 'general_status')
      .addSelect('po.payment_status', 'payment_status')
      .addSelect('COUNT(po.id)', 'cnt')
      .addSelect('COALESCE(SUM(po.requested_total), 0)', 'amount')
      .groupBy("COALESCE(po.payment_currency, 'MXN')")
      .addGroupBy('po.general_status')
      .addGroupBy('po.payment_status')
      .getRawMany<{
        currency: string;
        general_status: string;
        payment_status: string;
        cnt: string | number;
        amount: string | number;
      }>();

    const by_currency = {
      MXN: this.emptyCurrencyStats(),
      USD: this.emptyCurrencyStats(),
    };

    for (const row of rows) {
      const currency: PurchaseOrderCurrency = row.currency === 'USD' ? 'USD' : 'MXN';
      const bucket = by_currency[currency];
      const count = Number(row.cnt) || 0;
      const amount = this.roundMoney(Number(row.amount) || 0);

      bucket.count += count;
      bucket.amount = this.roundMoney(bucket.amount + amount);

      const status = row.general_status as keyof PurchaseOrderCurrencyStats['by_status'];
      if (bucket.by_status[status]) {
        bucket.by_status[status].count += count;
        bucket.by_status[status].amount = this.roundMoney(
          bucket.by_status[status].amount + amount,
        );
      }

      const payment = row.payment_status as keyof PurchaseOrderCurrencyStats['by_payment'];
      if (bucket.by_payment[payment]) {
        bucket.by_payment[payment].count += count;
        bucket.by_payment[payment].amount = this.roundMoney(
          bucket.by_payment[payment].amount + amount,
        );
      }
    }

    return {
      count: by_currency.MXN.count + by_currency.USD.count,
      by_currency,
    };
  }

  private resolvePedimentoForVendor(
    vendor: Vendor,
    value?: string | null,
  ): string | null {
    const pedimentoNumber = this.normalizePedimento(value);
    if (pedimentoNumber && vendor.vendor_type !== VendorType.INTERNATIONAL) {
      throw new BadRequestException(
        'El número de pedimento solo aplica a compras de proveedor internacional',
      );
    }
    if (vendor.vendor_type !== VendorType.INTERNATIONAL) {
      return null;
    }
    return pedimentoNumber;
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
      throw new NotFoundException(`Pago no encontrado: ${paymentId}`);
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

      if (purchaseOrder.general_status === 'Recibida') {
        return purchaseOrder;
      }

      if (purchaseOrder.general_status !== 'Creada') {
        throw new BadRequestException(
          `No se puede recibir la orden de compra. Estado actual: ${purchaseOrder.general_status}`,
        );
      }

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
            `Línea no encontrada: ${receivedItem.line_item_id}`,
          );
        }

        // Set received original data
        lineItem.received_original_product_id = receivedItem.product_id;
        // received_original_uom_id referencia uom_catalog.id (no product_uoms.id)
        const productUomIdForLine = await this.unitConversionService.getProductUomId(
          receivedItem.product_uom_id,
          receivedItem.product_id,
        );
        const productUomRow = await this.dataSource.getRepository(ProductUoM).findOne({
          where: { id: productUomIdForLine },
        });
        lineItem.product_uom_id = productUomIdForLine;
        lineItem.received_original_uom_id =
          productUomRow?.uom_catalog_id || receivedItem.product_uom_id;
        lineItem.received_original_quantity = receivedItem.quantity;
        lineItem.received_original_unit_total = receivedItem.unit_total;
        lineItem.received_original_iva_percentage = receivedItem.iva_percentage;
        lineItem.received_original_iva_unit = receivedItem.iva_unit;
        lineItem.received_original_ieps_percentage = receivedItem.ieps_percentage;
        lineItem.received_original_ieps_unit = receivedItem.ieps_unit;

        // Convert to base unit
        const convertedQuantity = await this.unitConversionService.convertToBaseUnit(
          receivedItem.quantity,
          productUomIdForLine,
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
          queryRunner.manager,
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
      await queryRunner.manager.update(
        PurchaseOrderBatch,
        { id: purchaseOrder.id },
        {
          received_subtotal: purchaseOrder.received_subtotal,
          received_iva_total: purchaseOrder.received_iva_total,
          received_ieps_total: purchaseOrder.received_ieps_total,
          received_total: purchaseOrder.received_total,
          general_status: 'Recibida',
          updated_by: userId,
        },
      );

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
   * Actualiza solo las notas sin reemplazar líneas ni cabecera.
   */
  async updateNotes(
    id: string,
    dto: UpdatePurchaseOrderNotesDto,
    tenantId: string,
    userId: string,
  ): Promise<PurchaseOrderBatch> {
    const purchaseOrder = await this.findOne(id, tenantId);

    if (purchaseOrder.general_status === 'Cancelada') {
      throw new BadRequestException('No se pueden editar notas de una orden cancelada');
    }

    purchaseOrder.notes = dto.notes?.trim() ? dto.notes.trim() : null;
    purchaseOrder.updated_by = userId;
    await this.purchaseOrderBatchRepository.save(purchaseOrder);

    return this.findOne(id, tenantId);
  }

  /**
   * Actualiza el número de pedimento. Solo si el proveedor es internacional.
   */
  async updatePedimento(
    id: string,
    dto: UpdatePurchaseOrderPedimentoDto,
    tenantId: string,
    userId: string,
  ): Promise<PurchaseOrderBatch> {
    const purchaseOrder = await this.findOne(id, tenantId);

    if (purchaseOrder.general_status === 'Cancelada') {
      throw new BadRequestException(
        'No se puede editar el pedimento de una orden cancelada',
      );
    }

    const vendor = await this.getVendorOrFail(purchaseOrder.vendor_id, tenantId);
    const pedimentoNumber = this.resolvePedimentoForVendor(
      vendor,
      dto.pedimento_number,
    );

    await this.purchaseOrderBatchRepository.update(
      { id, tenant_id: tenantId },
      { pedimento_number: pedimentoNumber, updated_by: userId },
    );

    return this.findOne(id, tenantId);
  }

  /**
   * Cancel a purchase order
   */
  async cancel(id: string, tenantId: string, userId: string): Promise<PurchaseOrderBatch> {
    const purchaseOrder = await this.findOne(id, tenantId);

    if (purchaseOrder.general_status !== 'Creada') {
      throw new BadRequestException(
        `No se puede cancelar la orden de compra con estado: ${purchaseOrder.general_status}`,
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
        `No se puede reemplazar la orden de compra con estado: ${existing.general_status}`,
      );
    }

    await this.assertWarehouseMatchesFiscal(
      tenantId,
      dto.warehouse_id,
      dto.fiscal_configuration_id,
      dto.billing_branch_id,
    );

    const vendor = await this.getVendorOrFail(dto.vendor_id, tenantId);
    const pedimentoNumber = this.resolvePedimentoForVendor(
      vendor,
      dto.pedimento_number !== undefined
        ? dto.pedimento_number
        : existing.pedimento_number,
    );

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
        dto.vendor_id,
        dto.line_items,
        userId,
        dto.payment_currency,
      );

      const batch = await queryRunner.manager.findOne(PurchaseOrderBatch, {
        where: { id, tenant_id: tenantId },
      });
      if (!batch) {
        throw new NotFoundException(`Orden de compra no encontrada: ${id}`);
      }

      batch.fiscal_configuration_id = dto.fiscal_configuration_id;
      batch.warehouse_id = dto.warehouse_id;
      batch.vendor_id = dto.vendor_id;
      batch.expected_delivery_date = new Date(dto.expected_delivery_date);
      if (dto.payment_status !== undefined) {
        batch.payment_status = dto.payment_status;
      }
      batch.payment_currency = totals.payment_currency;
      if (dto.notes !== undefined) {
        batch.notes = dto.notes;
      }
      batch.pedimento_number = pedimentoNumber;
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

    this.regenerateDocumentoOriginalPreservingLanguage(id, tenantId, userId).catch((err) => {
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
  ): Promise<PurchaseOrderBatch> {
    const purchaseOrder = await this.findOne(orderId, tenantId);

    if (purchaseOrder.general_status !== 'Creada') {
      throw new BadRequestException(
        `No se puede agregar una línea a la orden de compra con estado: ${purchaseOrder.general_status}`,
      );
    }

    const poCurrency = this.normalizeCurrency(purchaseOrder.payment_currency) || 'MXN';
    const line_subtotal = Number(dto.quantity) * Number(dto.unit_total);
    const iva_percentage = Number(dto.iva_percentage || 0);
    const line_iva = (line_subtotal * iva_percentage) / 100;
    const ieps_percentage = Number(dto.ieps_percentage || 0);
    const line_ieps = (line_subtotal * ieps_percentage) / 100;

    const productUomId = await this.unitConversionService.getProductUomId(
      dto.uom_id,
      dto.product_id,
    );

    const lineCurrency = this.normalizeCurrency(dto.currency);
    if (lineCurrency && lineCurrency !== poCurrency) {
      this.throwLineCurrencyMismatch(lineCurrency, poCurrency);
    }

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
      await this.ensureVendorCostFromPoLine(queryRunner, {
        vendorId: purchaseOrder.vendor_id,
        productId: dto.product_id,
        productUomId,
        unitTotal: Number(dto.unit_total),
        ivaPercentage: iva_percentage,
        iepsPercentage: ieps_percentage,
        currency: poCurrency,
      });
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

    this.scheduleDocumentoOriginalRegen(orderId, tenantId, userId, 'add line item');
    return this.findOne(orderId, tenantId);
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
      throw new NotFoundException(`Orden de compra no encontrada: ${purchaseOrderId}`);
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
  ): Promise<PurchaseOrderBatch> {
    const purchaseOrder = await this.findOne(orderId, tenantId);

    if (purchaseOrder.general_status !== 'Creada') {
      throw new BadRequestException(
        `No se puede actualizar la línea de la orden de compra con estado: ${purchaseOrder.general_status}`,
      );
    }

    const lineItem = purchaseOrder.line_items.find((li) => li.id === lineItemId);

    if (!lineItem) {
      throw new NotFoundException(`Línea no encontrada: ${lineItemId}`);
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
      throw new BadRequestException('La cantidad debe ser un número positivo');
    }

    this.applyLineTaxesFromPercentages(lineItem);
    lineItem.updated_by = userId;

    const poCurrency = this.normalizeCurrency(purchaseOrder.payment_currency) || 'MXN';

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await this.ensureVendorCostFromPoLine(queryRunner, {
        vendorId: purchaseOrder.vendor_id,
        productId: lineItem.product_id,
        productUomId: lineItem.product_uom_id,
        unitTotal: Number(lineItem.unit_total),
        ivaPercentage: Number(lineItem.iva_percentage || 0),
        iepsPercentage: Number(lineItem.ieps_percentage || 0),
        currency: poCurrency,
      });
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

    this.scheduleDocumentoOriginalRegen(orderId, tenantId, userId, 'update line item');
    return this.findOne(orderId, tenantId);
  }

  /**
   * Remove a line item and refresh requested_* totals on the header.
   */
  async removeLineItem(
    orderId: string,
    lineItemId: string,
    tenantId: string,
    userId: string,
  ): Promise<PurchaseOrderBatch> {
    const purchaseOrder = await this.findOne(orderId, tenantId);

    if (purchaseOrder.general_status !== 'Creada') {
      throw new BadRequestException(
        `No se puede eliminar la línea de la orden de compra con estado: ${purchaseOrder.general_status}`,
      );
    }

    const lineItem = purchaseOrder.line_items.find((li) => li.id === lineItemId);

    if (!lineItem) {
      throw new NotFoundException(`Línea no encontrada: ${lineItemId}`);
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

    this.scheduleDocumentoOriginalRegen(orderId, tenantId, userId, 'remove line item');
    return this.findOne(orderId, tenantId);
  }
  /**
   * Regenerate DOCUMENTO_ORIGINAL for a purchase order
   */
  async regenerateDocumentoOriginal(
    id: string,
    tenantId: string,
    userId: string,
    language: PurchaseOrderDocumentLanguage,
    keepPrevious = false,
  ): Promise<{ success: boolean; message: string; document_language: PurchaseOrderDocumentLanguage; keep_previous: boolean }> {
    try {
      const purchaseOrder = await this.findOne(id, tenantId);

      if (!keepPrevious) {
        await this.deleteDocumentsByType(
          id,
          PurchaseOrderService.DOC_TYPE_DOCUMENTO_ORIGINAL,
        );
      }

      // Generate new PDF
      let pdfBuffer: Buffer;
      let s3Key: string;

      try {
        pdfBuffer = await this.pdfService.generatePdf(purchaseOrder, language);
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
        `DOCUMENTO_ORIGINAL_${purchaseOrder.folio}_${language}.pdf`,
        s3Key,
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
    } catch (error) {
      console.error('[PDF] Error regenerating DOCUMENTO_ORIGINAL:', error);
      throw error;
    }
  }

  /**
   * Regenerate DOCUMENTO_ORIGINAL preserving the previous document language.
   */
  async regenerateDocumentoOriginalPreservingLanguage(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string; document_language: PurchaseOrderDocumentLanguage }> {
    const language = await this.documentsService.getLastDocumentLanguage(
      id,
      PurchaseOrderService.DOC_TYPE_DOCUMENTO_ORIGINAL,
    );
    return this.regenerateDocumentoOriginal(id, tenantId, userId, language);
  }

  /**
   * Regenerate RECEPCIÓN document for a received purchase order
   */
  async regenerateRecepcionDocument(
    id: string,
    tenantId: string,
    userId: string,
    language: PurchaseOrderDocumentLanguage,
    keepPrevious = false,
  ): Promise<{ success: boolean; message: string; document_language: PurchaseOrderDocumentLanguage; keep_previous: boolean }> {
    try {
      const purchaseOrder = await this.findOne(id, tenantId);

      // Check if PO is received
      if (purchaseOrder.general_status !== 'Recibida') {
        throw new Error('La orden de compra debe estar en estado "Recibida" para generar documento de recepción');
      }

      if (!keepPrevious) {
        await this.deleteDocumentsByType(id, PurchaseOrderService.DOC_TYPE_RECEPCION);
      }

      // Generate reception PDF
      let pdfBuffer: Buffer;
      let s3Key: string;

      try {
        pdfBuffer = await this.pdfService.generateRecepcionPdf(purchaseOrder, language);
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
        `RECEPCION_${purchaseOrder.folio}_${language}.pdf`,
        s3Key,
        pdfBuffer.length,
        'application/pdf',
        userId,
        language,
      );

      return {
        success: true,
        message: 'Documento de RECEPCIÓN regenerado exitosamente',
        document_language: language,
        keep_previous: keepPrevious,
      };
    } catch (error) {
      console.error('[PDF] Error regenerating RECEPCIÓN document:', error);
      throw error;
    }
  }
}
