import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { PurchaseOrderBatchDetail } from '../../../entities/purchase-orders/purchase-order-batch-detail.entity';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';
import { ReceivePurchaseOrderDto } from '../dto/receive-purchase-order.dto';
import { UpdateLineItemDto } from '../dto/update-line-item.dto';
import { QueryPurchaseOrderDto } from '../dto/query-purchase-order.dto';
import { UnitConversionService } from './unit-conversion.service';
import { BatchNumberGeneratorService } from './batch-number-generator.service';
import { FolioGeneratorService } from './folio-generator.service';
import { PurchaseOrderPdfService } from './purchase-order-pdf.service';
import { PurchaseOrderDocumentsService } from './purchase-order-documents.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrderBatch)
    private readonly purchaseOrderBatchRepository: Repository<PurchaseOrderBatch>,
    @InjectRepository(PurchaseOrderBatchDetail)
    private readonly purchaseOrderDetailRepository: Repository<PurchaseOrderBatchDetail>,
    @InjectRepository(InventoryBatch)
    private readonly inventoryBatchRepository: Repository<InventoryBatch>,
    private readonly unitConversionService: UnitConversionService,
    private readonly batchNumberGenerator: BatchNumberGeneratorService,
    private readonly folioGenerator: FolioGeneratorService,
    private readonly pdfService: PurchaseOrderPdfService,
    private readonly documentsService: PurchaseOrderDocumentsService,
    private readonly dataSource: DataSource,
  ) {}

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
        general_status: 'Creada',
        notes: dto.notes,
        created_by: userId,
      });

      const savedOrder = await queryRunner.manager.save(purchaseOrder);

      // Create line items and calculate totals
      let requested_subtotal = 0;
      let requested_iva_total = 0;
      let requested_ieps_total = 0;

      for (const lineItem of dto.line_items) {
        // Calculate line subtotal
        const line_subtotal = Number(lineItem.quantity) * Number(lineItem.unit_total);
        
        // Calculate IVA based on percentage
        const iva_percentage = Number(lineItem.iva_percentage || 0);
        const line_iva = (line_subtotal * iva_percentage) / 100;
        
        // Calculate IEPS based on percentage
        const ieps_percentage = Number(lineItem.ieps_percentage || 0);
        const line_ieps = (line_subtotal * ieps_percentage) / 100;

        // Resolve the product_uom_id (frontend might send uom_catalog_id or product_uom_id)
        const productUomId = await this.unitConversionService.getProductUomId(
          lineItem.uom_id,
          lineItem.product_id,
        );

        const detail = this.purchaseOrderDetailRepository.create({
          id: uuidv4(),
          purchase_order_batch_id: savedOrder.id,
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

      // Update purchase order with totals
      savedOrder.requested_subtotal = requested_subtotal;
      savedOrder.requested_iva_total = requested_iva_total;
      savedOrder.requested_ieps_total = requested_ieps_total;
      savedOrder.requested_total = requested_subtotal + requested_iva_total + requested_ieps_total;

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
        const uploadResult = await this.pdfService.uploadPdfToS3(fullOrder, pdfBuffer);
        s3Key = uploadResult.s3Key;
        console.log('[PDF] Uploaded to S3, key:', s3Key);
      } catch (s3Error) {
        console.error('[PDF] S3 upload failed:', s3Error);
        throw s3Error; // Throw the error so we can see what's wrong
      }

      console.log('[PDF] Creating document record...');
      await this.documentsService.uploadDocument(
        purchaseOrderId,
        1, // DOCUMENTO_ORIGINAL type ID
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
      .getOne();

    if (!purchaseOrder) {
      throw new NotFoundException(`Purchase order not found: ${id}`);
    }

    return purchaseOrder;
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
          quantity: convertedQuantity,
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
   * Update a line item
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

    if (dto.unit_total !== undefined) {
      lineItem.unit_total = dto.unit_total;
    }
    if (dto.iva_percentage !== undefined) {
      lineItem.iva_percentage = dto.iva_percentage;
    }
    if (dto.iva_unit !== undefined) {
      lineItem.iva_unit = dto.iva_unit;
    }
    if (dto.ieps_percentage !== undefined) {
      lineItem.ieps_percentage = dto.ieps_percentage;
    }
    if (dto.ieps_unit !== undefined) {
      lineItem.ieps_unit = dto.ieps_unit;
    }

    lineItem.updated_by = userId;

    return this.purchaseOrderDetailRepository.save(lineItem);
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

      // Delete existing DOCUMENTO_ORIGINAL documents
      const existingDocs = await this.documentsService.getDocuments(id);
      for (const doc of existingDocs) {
        if (doc.document_type_name === 'DOCUMENTO_ORIGINAL') {
          await this.documentsService.deleteDocument(doc.id);
        }
      }

      // Generate new PDF
      let pdfBuffer: Buffer;
      let s3Key: string;

      try {
        pdfBuffer = await this.pdfService.generatePdf(purchaseOrder);
        const uploadResult = await this.pdfService.uploadPdfToS3(purchaseOrder, pdfBuffer);
        s3Key = uploadResult.s3Key;
      } catch (s3Error) {
        console.error('[PDF] S3 upload failed:', s3Error);
        throw s3Error; // Throw the error so we can see what's wrong
      }

      // Create new document record
      await this.documentsService.uploadDocument(
        id,
        1, // DOCUMENTO_ORIGINAL type ID
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

      // Delete existing RECEPCIÓN documents
      const existingDocs = await this.documentsService.getDocuments(id);
      for (const doc of existingDocs) {
        if (doc.document_type_name === 'RECEPCIÓN') {
          await this.documentsService.deleteDocument(doc.id);
        }
      }

      // Generate reception PDF
      let pdfBuffer: Buffer;
      let s3Key: string;

      try {
        pdfBuffer = await this.pdfService.generateRecepcionPdf(purchaseOrder);
        const uploadResult = await this.pdfService.uploadPdfToS3(purchaseOrder, pdfBuffer);
        s3Key = uploadResult.s3Key;
      } catch (s3Error) {
        console.error('[PDF] S3 upload failed:', s3Error);
        throw s3Error; // Throw the error so we can see what's wrong
      }

      // Create new document record (RECEPCIÓN type ID is 4)
      await this.documentsService.uploadDocument(
        id,
        4, // RECEPCIÓN type ID
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
