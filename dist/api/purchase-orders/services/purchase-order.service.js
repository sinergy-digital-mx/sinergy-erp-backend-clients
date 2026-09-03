"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PurchaseOrderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseOrderService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const purchase_order_batch_entity_1 = require("../../../entities/purchase-orders/purchase-order-batch.entity");
const purchase_order_batch_detail_entity_1 = require("../../../entities/purchase-orders/purchase-order-batch-detail.entity");
const inventory_batch_entity_1 = require("../../../entities/purchase-orders/inventory-batch.entity");
const purchase_order_payment_entity_1 = require("../../../entities/purchase-orders/purchase-order-payment.entity");
const warehouse_entity_1 = require("../../../entities/warehouse/warehouse.entity");
const vendor_entity_1 = require("../../../entities/vendor/vendor.entity");
const vendor_type_enum_1 = require("../../../entities/vendor/vendor-type.enum");
const purchase_order_real_cost_service_1 = require("./purchase-order-real-cost.service");
const purchase_order_real_cost_util_1 = require("../utils/purchase-order-real-cost.util");
const unit_conversion_service_1 = require("./unit-conversion.service");
const batch_number_generator_service_1 = require("./batch-number-generator.service");
const folio_generator_service_1 = require("./folio-generator.service");
const purchase_order_pdf_service_1 = require("./purchase-order-pdf.service");
const purchase_order_documents_service_1 = require("./purchase-order-documents.service");
const purchase_order_lots_service_1 = require("./purchase-order-lots.service");
const purchase_order_activity_service_1 = require("./purchase-order-activity.service");
const products_1 = require("../../../entities/products");
const uuid_1 = require("uuid");
const purchase_order_line_breakdown_util_1 = require("../utils/purchase-order-line-breakdown.util");
const purchase_order_activity_change_util_1 = require("../utils/purchase-order-activity-change.util");
const purchase_order_movements_1 = require("../constants/purchase-order-movements");
let PurchaseOrderService = class PurchaseOrderService {
    static { PurchaseOrderService_1 = this; }
    purchaseOrderBatchRepository;
    purchaseOrderDetailRepository;
    inventoryBatchRepository;
    purchaseOrderPaymentRepository;
    warehouseRepository;
    vendorRepository;
    unitConversionService;
    batchNumberGenerator;
    folioGenerator;
    pdfService;
    documentsService;
    lotsService;
    activityService;
    realCostService;
    dataSource;
    static DOC_TYPE_DOCUMENTO_ORIGINAL = 1;
    static DOC_TYPE_RECEPCION = 4;
    constructor(purchaseOrderBatchRepository, purchaseOrderDetailRepository, inventoryBatchRepository, purchaseOrderPaymentRepository, warehouseRepository, vendorRepository, unitConversionService, batchNumberGenerator, folioGenerator, pdfService, documentsService, lotsService, activityService, realCostService, dataSource) {
        this.purchaseOrderBatchRepository = purchaseOrderBatchRepository;
        this.purchaseOrderDetailRepository = purchaseOrderDetailRepository;
        this.inventoryBatchRepository = inventoryBatchRepository;
        this.purchaseOrderPaymentRepository = purchaseOrderPaymentRepository;
        this.warehouseRepository = warehouseRepository;
        this.vendorRepository = vendorRepository;
        this.unitConversionService = unitConversionService;
        this.batchNumberGenerator = batchNumberGenerator;
        this.folioGenerator = folioGenerator;
        this.pdfService = pdfService;
        this.documentsService = documentsService;
        this.lotsService = lotsService;
        this.activityService = activityService;
        this.realCostService = realCostService;
        this.dataSource = dataSource;
    }
    async deleteDocumentsByType(purchaseOrderId, documentTypeId) {
        const existingDocs = await this.documentsService.getDocuments(purchaseOrderId);
        for (const doc of existingDocs) {
            if (Number(doc.document_type_id) === Number(documentTypeId)) {
                await this.documentsService.deleteDocument(doc.id);
            }
        }
    }
    normalizeCurrency(value) {
        if (value == null || String(value).trim() === '')
            return null;
        const upper = String(value).trim().toUpperCase();
        if (upper === 'MXN' || upper === 'USD')
            return upper;
        throw new common_1.BadRequestException('La moneda debe ser MXN o USD');
    }
    throwMixedCurrency() {
        throw new common_1.BadRequestException('No se pueden mezclar MXN y USD en la misma orden de compra. Todos los productos deben estar en la misma moneda.');
    }
    throwLineCurrencyMismatch(productCurrency, expected) {
        throw new common_1.BadRequestException(`Este producto está en ${productCurrency} y la orden en ${expected}. No se puede mezclar monedas en una orden de compra.`);
    }
    findVendorCost(queryRunner, vendorId, productId, productUomId) {
        return queryRunner.manager.findOne(products_1.ProductVendorCost, {
            where: {
                vendor_id: vendorId,
                product_id: productId,
                product_uom_id: productUomId,
            },
        });
    }
    async resolvePurchaseOrderCurrency(queryRunner, vendorId, lineItems, headerCurrency) {
        const header = this.normalizeCurrency(headerCurrency);
        const currencies = new Set();
        for (const line of lineItems) {
            const productUomId = await this.unitConversionService.getProductUomId(line.uom_id, line.product_id);
            const existing = await this.findVendorCost(queryRunner, vendorId, line.product_id, productUomId);
            const fromCost = existing
                ? this.normalizeCurrency(existing.currency) || 'MXN'
                : null;
            const fromLine = this.normalizeCurrency(line.currency);
            if (fromCost && fromLine && fromCost !== fromLine) {
                this.throwLineCurrencyMismatch(fromCost, fromLine);
            }
            const resolved = fromCost || fromLine;
            if (resolved)
                currencies.add(resolved);
        }
        if (currencies.size > 1) {
            this.throwMixedCurrency();
        }
        const resolved = [...currencies][0] ?? header ?? 'MXN';
        if (header && header !== resolved) {
            throw new common_1.BadRequestException(`La orden debe ser en ${resolved}. No se puede usar ${header} porque los productos están en otra moneda.`);
        }
        return resolved;
    }
    async ensureVendorCostFromPoLine(queryRunner, params) {
        const existing = await this.findVendorCost(queryRunner, params.vendorId, params.productId, params.productUomId);
        if (existing) {
            const existingCurrency = this.normalizeCurrency(existing.currency) || 'MXN';
            if (existingCurrency !== params.currency) {
                this.throwLineCurrencyMismatch(existingCurrency, params.currency);
            }
            return;
        }
        const cost = (0, purchase_order_line_breakdown_util_1.roundPoUnitCost)(params.unitTotal);
        const iva = Number(params.ivaPercentage) || 0;
        const ieps = Number(params.iepsPercentage) || 0;
        const ivaUnit = Number(((cost * iva) / 100).toFixed(2));
        const iepsUnit = Number(((cost * ieps) / 100).toFixed(2));
        const row = queryRunner.manager.create(products_1.ProductVendorCost, {
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
    async insertLineItemsForPurchaseOrder(queryRunner, purchaseOrderBatchId, vendorId, lineItems, userId, headerCurrency) {
        const paymentCurrency = await this.resolvePurchaseOrderCurrency(queryRunner, vendorId, lineItems, headerCurrency);
        let requested_subtotal = 0;
        let requested_iva_total = 0;
        let requested_ieps_total = 0;
        for (const lineItem of lineItems) {
            const iva_percentage = Number(lineItem.iva_percentage || 0);
            const ieps_percentage = Number(lineItem.ieps_percentage || 0);
            const unitTotal = (0, purchase_order_line_breakdown_util_1.roundPoUnitCost)(lineItem.unit_total);
            const breakdown = (0, purchase_order_line_breakdown_util_1.computeRequestedLineBreakdown)(Number(lineItem.quantity), unitTotal, iva_percentage, ieps_percentage);
            const productUomId = await this.unitConversionService.getProductUomId(lineItem.uom_id, lineItem.product_id);
            await this.ensureVendorCostFromPoLine(queryRunner, {
                vendorId,
                productId: lineItem.product_id,
                productUomId,
                unitTotal,
                ivaPercentage: iva_percentage,
                iepsPercentage: ieps_percentage,
                currency: paymentCurrency,
            });
            const detail = this.purchaseOrderDetailRepository.create({
                id: (0, uuid_1.v4)(),
                purchase_order_batch_id: purchaseOrderBatchId,
                product_id: lineItem.product_id,
                product_uom_id: productUomId,
                quantity: lineItem.quantity,
                unit_total: unitTotal,
                iva_percentage,
                ieps_percentage,
                ...breakdown,
                created_by: userId,
            });
            await queryRunner.manager.save(detail);
            requested_subtotal += breakdown.line_subtotal;
            requested_iva_total += breakdown.line_iva;
            requested_ieps_total += breakdown.line_ieps;
        }
        return {
            requested_subtotal,
            requested_iva_total,
            requested_ieps_total,
            payment_currency: paymentCurrency,
        };
    }
    async create(dto, tenantId, userId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await this.assertWarehouseMatchesFiscal(tenantId, dto.warehouse_id, dto.fiscal_configuration_id, dto.billing_branch_id);
            const vendor = await this.getVendorOrFail(dto.vendor_id, tenantId);
            const pedimentoNumber = this.resolvePedimentoForVendor(vendor, dto.pedimento_number);
            const folio = await this.folioGenerator.generateFolio(tenantId);
            const purchaseOrder = this.purchaseOrderBatchRepository.create({
                id: (0, uuid_1.v4)(),
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
            const totals = await this.insertLineItemsForPurchaseOrder(queryRunner, savedOrder.id, dto.vendor_id, dto.line_items, userId, dto.payment_currency);
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
            this.generateAndUploadPdf(savedOrder.id, tenantId, userId).catch(err => {
                console.error('[PDF] Error in async PDF generation:', err);
            });
            return this.findOne(savedOrder.id, tenantId);
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof typeorm_2.QueryFailedError) {
                const driverError = error.driverError;
                if (driverError?.code === 'ER_DUP_ENTRY') {
                    throw new common_1.BadRequestException('Folio de orden de compra duplicado. Reintente crear la orden.');
                }
                if (driverError?.code === 'ER_NO_REFERENCED_ROW_2') {
                    throw new common_1.BadRequestException('Referencia inválida (almacén, proveedor, razón fiscal, producto o UOM).');
                }
            }
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async generateAndUploadPdf(purchaseOrderId, tenantId, userId) {
        try {
            console.log('[PDF] Starting async PDF generation for PO:', purchaseOrderId);
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
            let pdfBuffer;
            let s3Key;
            try {
                pdfBuffer = await this.pdfService.generatePdf(fullOrder);
                console.log('[PDF] PDF buffer generated, size:', pdfBuffer.length);
                console.log('[PDF] Uploading to S3...');
                const uploadResult = await this.pdfService.uploadPdfToS3(fullOrder, pdfBuffer, 'DOCUMENTO_ORIGINAL');
                s3Key = uploadResult.s3Key;
                console.log('[PDF] Uploaded to S3, key:', s3Key);
            }
            catch (s3Error) {
                console.error('[PDF] S3 upload failed:', s3Error);
                throw s3Error;
            }
            console.log('[PDF] Creating document record...');
            await this.documentsService.uploadDocument(purchaseOrderId, PurchaseOrderService_1.DOC_TYPE_DOCUMENTO_ORIGINAL, `DOCUMENTO_ORIGINAL_${fullOrder.folio}_es.pdf`, s3Key, pdfBuffer.length, 'application/pdf', userId);
            console.log('[PDF] Document record created successfully');
        }
        catch (error) {
            console.error('[PDF] Error in generateAndUploadPdf:', error);
        }
    }
    async findAll(tenantId, filters) {
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
    async findOne(id, tenantId) {
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
            .leftJoinAndSelect('po.landed_cost_lines', 'landed_cost_lines')
            .addOrderBy('landed_cost_lines.sort_order', 'ASC')
            .leftJoinAndSelect('po.batches', 'batches')
            .leftJoinAndSelect('batches.product', 'batch_product')
            .leftJoinAndSelect('batches.uom', 'batch_uom')
            .leftJoinAndSelect('batches.measure_uom', 'batch_measure_uom')
            .leftJoinAndSelect('batches.warehouse', 'batch_warehouse')
            .leftJoinAndSelect('batch_warehouse.billing_branch', 'batch_branch')
            .leftJoinAndSelect('batch_branch.fiscal_configuration', 'batch_fiscal')
            .getOne();
        if (!purchaseOrder) {
            throw new common_1.NotFoundException(`Orden de compra no encontrada: ${id}`);
        }
        if (purchaseOrder.general_status === 'Creada' &&
            (purchaseOrder.batches?.length ?? 0) > 0) {
            const lines = purchaseOrder.line_items || [];
            let subtotal = 0;
            let iva = 0;
            let ieps = 0;
            for (const line of lines) {
                const qty = Number(line.received_original_quantity || 0);
                if (qty <= 0)
                    continue;
                subtotal += qty * Number(line.received_original_unit_total || 0);
                iva += qty * Number(line.received_original_iva_unit || 0);
                ieps += qty * Number(line.received_original_ieps_unit || 0);
            }
            const round = (n) => Math.round(n * 100) / 100;
            await this.purchaseOrderBatchRepository.update({ id, tenant_id: tenantId }, {
                general_status: 'Recibida',
                received_subtotal: round(subtotal),
                received_iva_total: round(iva),
                received_ieps_total: round(ieps),
                received_total: round(subtotal + iva + ieps),
            });
            purchaseOrder.general_status = 'Recibida';
            purchaseOrder.received_subtotal = round(subtotal);
            purchaseOrder.received_iva_total = round(iva);
            purchaseOrder.received_ieps_total = round(ieps);
            purchaseOrder.received_total = round(subtotal + iva + ieps);
        }
        if (purchaseOrder.creator) {
            delete purchaseOrder.creator.password;
        }
        if (purchaseOrder.updater) {
            delete purchaseOrder.updater.password;
        }
        return this.withLotTree(purchaseOrder);
    }
    async assertWarehouseMatchesFiscal(tenantId, warehouseId, fiscalConfigurationId, billingBranchId) {
        const warehouse = await this.warehouseRepository.findOne({
            where: { id: warehouseId, tenant_id: tenantId },
            relations: ['billing_branch'],
        });
        if (!warehouse) {
            throw new common_1.BadRequestException('Almacén no encontrado');
        }
        const branch = warehouse.billing_branch;
        if (!branch) {
            throw new common_1.BadRequestException('El almacén no pertenece a ninguna sucursal');
        }
        if (billingBranchId && branch.id !== billingBranchId) {
            throw new common_1.BadRequestException('El almacén no pertenece a la sucursal seleccionada');
        }
        if (branch.fiscal_configuration_id !== fiscalConfigurationId) {
            throw new common_1.BadRequestException('La sucursal del almacén no pertenece a la razón social seleccionada');
        }
    }
    mapLineItemForUi(line) {
        const stored = (0, purchase_order_line_breakdown_util_1.computeRequestedLineBreakdown)(Number(line.quantity), Number(line.unit_total), Number(line.iva_percentage), Number(line.ieps_percentage));
        const money = (value, fallback) => {
            const n = Number(value);
            return Number.isFinite(n) ? this.roundMoney(n) : fallback;
        };
        const hasReceived = line.received_original_quantity != null &&
            line.received_original_unit_total != null;
        const received = hasReceived
            ? (0, purchase_order_line_breakdown_util_1.computeReceivedLineBreakdown)(Number(line.received_original_quantity), Number(line.received_original_unit_total), Number(line.received_original_iva_percentage || 0), Number(line.received_original_ieps_percentage || 0))
            : null;
        return {
            ...line,
            unit_total: Number(line.unit_total),
            igi_percentage: (0, purchase_order_real_cost_util_1.parseRealCostNumber)(line.igi_percentage),
            real_unit_cost_usd: line.real_unit_cost_usd == null ? null : Number(line.real_unit_cost_usd),
            real_unit_cost_mxn: line.real_unit_cost_mxn == null ? null : Number(line.real_unit_cost_mxn),
            received_original_unit_total: line.received_original_unit_total == null
                ? line.received_original_unit_total
                : Number(line.received_original_unit_total),
            line_subtotal: money(line.line_subtotal, stored.line_subtotal),
            line_iva: money(line.line_iva, stored.line_iva),
            line_ieps: money(line.line_ieps, stored.line_ieps),
            line_total: money(line.line_total, stored.line_total),
            received_line_subtotal: received
                ? money(line.received_line_subtotal, received.received_line_subtotal)
                : null,
            received_line_iva: received
                ? money(line.received_line_iva, received.received_line_iva)
                : null,
            received_line_ieps: received
                ? money(line.received_line_ieps, received.received_line_ieps)
                : null,
            received_line_total: received
                ? money(line.received_line_total, received.received_line_total)
                : null,
        };
    }
    mapPurchaseOrderLocation(po) {
        const branch = po.warehouse?.billing_branch ?? null;
        const fiscal = po.fiscal_configuration ?? null;
        const isInternationalVendor = po.vendor?.vendor_type === vendor_type_enum_1.VendorType.INTERNATIONAL;
        const extraCosts = [...(po.landed_cost_lines ?? [])]
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((extra) => ({
            id: extra.id,
            concept: extra.concept,
            amount: Number(extra.amount),
            currency: extra.currency,
            sort_order: extra.sort_order,
        }));
        const hasRealCost = (0, purchase_order_real_cost_util_1.isRealCostEnabled)(po.customs_exchange_rate, extraCosts.length) ||
            (0, purchase_order_real_cost_util_1.parseRealCostNumber)(po.landed_extras_mxn) > 0;
        return {
            ...po,
            can_edit_lines: po.general_status === 'Creada',
            can_edit_real_cost: po.general_status !== 'Cancelada',
            is_international_vendor: isInternationalVendor,
            pedimento_number: isInternationalVendor ? po.pedimento_number ?? null : null,
            has_real_cost: hasRealCost,
            extra_costs_count: extraCosts.length,
            extra_costs: extraCosts,
            customs_exchange_rate: po.customs_exchange_rate == null
                ? null
                : (0, purchase_order_real_cost_util_1.parseRealCostNumber)(po.customs_exchange_rate, 0) || null,
            landed_increment_percentage: (0, purchase_order_real_cost_util_1.parseRealCostNumber)(po.landed_increment_percentage),
            landed_merchandise_mxn: (0, purchase_order_real_cost_util_1.parseRealCostNumber)(po.landed_merchandise_mxn),
            landed_extras_mxn: (0, purchase_order_real_cost_util_1.parseRealCostNumber)(po.landed_extras_mxn),
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
    async withLotTree(purchaseOrder) {
        const mapped = this.mapPurchaseOrderLocation(purchaseOrder);
        const lots = await this.lotsService.buildTree(purchaseOrder.batches, purchaseOrder.line_items);
        return {
            ...mapped,
            batches: lots.batches,
            batches_summary: lots.summary,
        };
    }
    async recordActivity(input) {
        try {
            await this.activityService.record(input);
        }
        catch (error) {
            console.error('[PO activity] No se pudo guardar el movimiento', error);
        }
    }
    scheduleDocumentoOriginalRegen(orderId, tenantId, userId, context) {
        this.regenerateDocumentoOriginalPreservingLanguage(orderId, tenantId, userId).catch((err) => {
            console.error(`[PDF] Error regenerating DOCUMENTO_ORIGINAL after ${context}:`, err);
        });
    }
    async getVendorOrFail(vendorId, tenantId) {
        const vendor = await this.vendorRepository.findOne({
            where: { id: vendorId, tenant_id: tenantId },
        });
        if (!vendor) {
            throw new common_1.BadRequestException('Proveedor no encontrado');
        }
        return vendor;
    }
    normalizePedimento(value) {
        const trimmed = value?.trim() ?? '';
        return trimmed.length ? trimmed : null;
    }
    endOfDay(date) {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d;
    }
    applyListFilters(query, filters) {
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
            query.andWhere(new typeorm_2.Brackets((qb) => {
                qb.where('po.folio = :rawSearch', { rawSearch })
                    .orWhere('LOWER(po.folio) LIKE LOWER(:search)', { search })
                    .orWhere("LOWER(REPLACE(REPLACE(po.folio, '-', ''), ' ', '')) LIKE LOWER(:normalizedSearchLike)", { normalizedSearchLike })
                    .orWhere('LOWER(vendor.company_name) LIKE LOWER(:search)', { search })
                    .orWhere('LOWER(po.pedimento_number) LIKE LOWER(:search)', { search });
            }));
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
    emptyCurrencyStats() {
        const zero = () => ({ count: 0, amount: 0 });
        return {
            count: 0,
            amount: 0,
            by_status: { Creada: zero(), Recibida: zero(), Cancelada: zero() },
            by_payment: { Pagado: zero(), Pendiente: zero() },
        };
    }
    roundMoney(value) {
        return Math.round(value * 100) / 100;
    }
    async getListStats(tenantId, filters) {
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
            .getRawMany();
        const by_currency = {
            MXN: this.emptyCurrencyStats(),
            USD: this.emptyCurrencyStats(),
        };
        for (const row of rows) {
            const currency = row.currency === 'USD' ? 'USD' : 'MXN';
            const bucket = by_currency[currency];
            const count = Number(row.cnt) || 0;
            const amount = this.roundMoney(Number(row.amount) || 0);
            bucket.count += count;
            bucket.amount = this.roundMoney(bucket.amount + amount);
            const status = row.general_status;
            if (bucket.by_status[status]) {
                bucket.by_status[status].count += count;
                bucket.by_status[status].amount = this.roundMoney(bucket.by_status[status].amount + amount);
            }
            const payment = row.payment_status;
            if (bucket.by_payment[payment]) {
                bucket.by_payment[payment].count += count;
                bucket.by_payment[payment].amount = this.roundMoney(bucket.by_payment[payment].amount + amount);
            }
        }
        return {
            count: by_currency.MXN.count + by_currency.USD.count,
            by_currency,
        };
    }
    resolvePedimentoForVendor(vendor, value) {
        const pedimentoNumber = this.normalizePedimento(value);
        if (pedimentoNumber && vendor.vendor_type !== vendor_type_enum_1.VendorType.INTERNATIONAL) {
            throw new common_1.BadRequestException('El número de pedimento solo aplica a compras de proveedor internacional');
        }
        if (vendor.vendor_type !== vendor_type_enum_1.VendorType.INTERNATIONAL) {
            return null;
        }
        return pedimentoNumber;
    }
    buildPaymentSummary(purchaseOrder, payments) {
        const requestedTotal = Number(purchaseOrder.requested_total || 0);
        const receivedTotal = Number(purchaseOrder.received_total || 0);
        const total = purchaseOrder.general_status === 'Recibida'
            ? (receivedTotal > 0 ? receivedTotal : requestedTotal)
            : requestedTotal;
        const amount_paid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
        const amount_pending = Math.max(total - amount_paid, 0);
        const payment_status = amount_pending <= 0 ? 'Pagado' : 'Pendiente';
        return {
            amount_paid: Number(amount_paid.toFixed(2)),
            amount_pending: Number(amount_pending.toFixed(2)),
            payment_status,
            currency: purchaseOrder.payment_currency || 'MXN',
        };
    }
    async getPayments(id, tenantId) {
        const purchaseOrder = await this.findOne(id, tenantId);
        return this.getPaymentsForOrder(purchaseOrder);
    }
    async getPaymentsForOrder(purchaseOrder) {
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
    async createPayment(purchaseOrderId, dto, tenantId, userId) {
        const purchaseOrder = await this.findOne(purchaseOrderId, tenantId);
        if (purchaseOrder.general_status === 'Cancelada') {
            throw new common_1.BadRequestException('No se pueden registrar pagos en una orden cancelada');
        }
        if (purchaseOrder.payment_currency !== dto.currency) {
            throw new common_1.BadRequestException(`La moneda del pago debe ser ${purchaseOrder.payment_currency}`);
        }
        const existingPayments = await this.purchaseOrderPaymentRepository.find({
            where: {
                purchase_order_batch_id: purchaseOrderId,
                tenant_id: tenantId,
            },
        });
        const currentSummary = this.buildPaymentSummary(purchaseOrder, existingPayments);
        if (dto.amount > currentSummary.amount_pending) {
            throw new common_1.BadRequestException(`El monto excede el saldo pendiente (${currentSummary.amount_pending.toFixed(2)} ${currentSummary.currency})`);
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
    async deletePayment(purchaseOrderId, paymentId, tenantId, userId) {
        const purchaseOrder = await this.findOne(purchaseOrderId, tenantId);
        const payment = await this.purchaseOrderPaymentRepository.findOne({
            where: {
                id: paymentId,
                purchase_order_batch_id: purchaseOrderId,
                tenant_id: tenantId,
            },
        });
        if (!payment) {
            throw new common_1.NotFoundException(`Pago no encontrado: ${paymentId}`);
        }
        await this.purchaseOrderPaymentRepository.remove(payment);
        const paymentData = await this.getPaymentsForOrder(purchaseOrder);
        purchaseOrder.payment_status = paymentData.summary.payment_status;
        purchaseOrder.updated_by = userId;
        await this.purchaseOrderBatchRepository.save(purchaseOrder);
        await this.recordActivity({
            tenantId,
            purchaseOrderId,
            type: purchase_order_movements_1.PURCHASE_ORDER_MOVEMENT_TYPES.PAYMENT_DELETED,
            actorId: userId,
            description: `Se eliminó un pago de ${Number(payment.amount).toFixed(2)} ${payment.currency}.`,
            metadata: {
                payment_id: paymentId,
                amount: Number(payment.amount).toFixed(2),
                currency: payment.currency,
                payment_method: payment.payment_method,
            },
        });
        return {
            success: true,
            id: paymentId,
            summary: paymentData.summary,
        };
    }
    async receive(id, dto, tenantId, userId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const purchaseOrder = await this.findOne(id, tenantId);
            if (purchaseOrder.general_status === 'Recibida') {
                return purchaseOrder;
            }
            if (purchaseOrder.general_status !== 'Creada') {
                throw new common_1.BadRequestException(`No se puede recibir la orden de compra. Estado actual: ${purchaseOrder.general_status}`);
            }
            let received_subtotal = 0;
            let received_iva_total = 0;
            let received_ieps_total = 0;
            for (const receivedItem of dto.received_items) {
                const lineItem = purchaseOrder.line_items.find((li) => li.id === receivedItem.line_item_id);
                if (!lineItem) {
                    throw new common_1.NotFoundException(`Línea no encontrada: ${receivedItem.line_item_id}`);
                }
                lineItem.received_original_product_id = receivedItem.product_id;
                const productUomIdForLine = await this.unitConversionService.getProductUomId(receivedItem.product_uom_id, receivedItem.product_id);
                const productUomRow = await this.dataSource.getRepository(products_1.ProductUoM).findOne({
                    where: { id: productUomIdForLine },
                });
                lineItem.product_uom_id = productUomIdForLine;
                lineItem.received_original_uom_id =
                    productUomRow?.uom_catalog_id || receivedItem.product_uom_id;
                lineItem.received_original_quantity = receivedItem.quantity;
                lineItem.received_original_unit_total = (0, purchase_order_line_breakdown_util_1.roundPoUnitCost)(receivedItem.unit_total);
                lineItem.received_original_iva_percentage = receivedItem.iva_percentage;
                lineItem.received_original_iva_unit = receivedItem.iva_unit;
                lineItem.received_original_ieps_percentage = receivedItem.ieps_percentage;
                lineItem.received_original_ieps_unit = receivedItem.ieps_unit;
                Object.assign(lineItem, (0, purchase_order_line_breakdown_util_1.computeReceivedLineBreakdown)(Number(receivedItem.quantity), Number(receivedItem.unit_total), Number(receivedItem.iva_percentage || 0), Number(receivedItem.ieps_percentage || 0)));
                const convertedQuantity = await this.unitConversionService.convertToBaseUnit(receivedItem.quantity, productUomIdForLine, receivedItem.product_id);
                const baseUomId = await this.unitConversionService.getBaseUom(receivedItem.product_id);
                lineItem.received_converted_quantity = convertedQuantity;
                lineItem.received_converted_uom_id = baseUomId;
                lineItem.updated_by = userId;
                await queryRunner.manager.save(purchase_order_batch_detail_entity_1.PurchaseOrderBatchDetail, lineItem);
                const receivedBreakdown = (0, purchase_order_line_breakdown_util_1.computeReceivedLineBreakdown)(Number(receivedItem.quantity), Number(receivedItem.unit_total), Number(receivedItem.iva_percentage || 0), Number(receivedItem.ieps_percentage || 0));
                received_subtotal += receivedBreakdown.received_line_subtotal;
                received_iva_total += receivedBreakdown.received_line_iva;
                received_ieps_total += receivedBreakdown.received_line_ieps;
                const batchNumber = await this.batchNumberGenerator.generateBatchNumber(purchaseOrder.warehouse_id, tenantId, queryRunner.manager);
                const batch = this.inventoryBatchRepository.create({
                    id: (0, uuid_1.v4)(),
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
            purchaseOrder.received_subtotal = received_subtotal;
            purchaseOrder.received_iva_total = received_iva_total;
            purchaseOrder.received_ieps_total = received_ieps_total;
            purchaseOrder.received_total = received_subtotal + received_iva_total + received_ieps_total;
            purchaseOrder.general_status = 'Recibida';
            purchaseOrder.updated_by = userId;
            await queryRunner.manager.update(purchase_order_batch_entity_1.PurchaseOrderBatch, { id: purchaseOrder.id }, {
                received_subtotal: purchaseOrder.received_subtotal,
                received_iva_total: purchaseOrder.received_iva_total,
                received_ieps_total: purchaseOrder.received_ieps_total,
                received_total: purchaseOrder.received_total,
                general_status: 'Recibida',
                updated_by: userId,
            });
            await queryRunner.commitTransaction();
            await this.realCostService.recalculateIfEnabled(tenantId, id);
            await this.recordActivity({
                tenantId,
                purchaseOrderId: id,
                type: purchase_order_movements_1.PURCHASE_ORDER_MOVEMENT_TYPES.STATUS_CHANGED,
                actorId: userId,
                description: 'La orden pasó de Creada a Recibida.',
                changes: (0, purchase_order_activity_change_util_1.compactActivityChanges)([
                    (0, purchase_order_activity_change_util_1.activityChange)('general_status', 'Estatus', 'Creada', 'Recibida'),
                ]),
                metadata: { received_items: dto.received_items.length },
            });
            return this.findOne(id, tenantId);
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async updateNotes(id, dto, tenantId, userId) {
        const purchaseOrder = await this.findOne(id, tenantId);
        if (purchaseOrder.general_status === 'Cancelada') {
            throw new common_1.BadRequestException('No se pueden editar notas de una orden cancelada');
        }
        const previousNotes = purchaseOrder.notes ?? null;
        purchaseOrder.notes = dto.notes?.trim() ? dto.notes.trim() : null;
        purchaseOrder.updated_by = userId;
        await this.purchaseOrderBatchRepository.save(purchaseOrder);
        const changes = (0, purchase_order_activity_change_util_1.compactActivityChanges)([
            (0, purchase_order_activity_change_util_1.activityChange)('notes', 'Notas', previousNotes, purchaseOrder.notes),
        ]);
        if (changes.length) {
            await this.recordActivity({
                tenantId,
                purchaseOrderId: id,
                type: purchase_order_movements_1.PURCHASE_ORDER_MOVEMENT_TYPES.NOTES_UPDATED,
                actorId: userId,
                description: 'Se actualizaron las notas de la orden.',
                changes,
            });
        }
        return this.findOne(id, tenantId);
    }
    async updatePedimento(id, dto, tenantId, userId) {
        const purchaseOrder = await this.findOne(id, tenantId);
        if (purchaseOrder.general_status === 'Cancelada') {
            throw new common_1.BadRequestException('No se puede editar el pedimento de una orden cancelada');
        }
        const vendor = await this.getVendorOrFail(purchaseOrder.vendor_id, tenantId);
        const pedimentoNumber = this.resolvePedimentoForVendor(vendor, dto.pedimento_number);
        const previousPedimento = purchaseOrder.pedimento_number ?? null;
        await this.purchaseOrderBatchRepository.update({ id, tenant_id: tenantId }, { pedimento_number: pedimentoNumber, updated_by: userId });
        const changes = (0, purchase_order_activity_change_util_1.compactActivityChanges)([
            (0, purchase_order_activity_change_util_1.activityChange)('pedimento_number', 'Pedimento', previousPedimento, pedimentoNumber),
        ]);
        if (changes.length) {
            await this.recordActivity({
                tenantId,
                purchaseOrderId: id,
                type: purchase_order_movements_1.PURCHASE_ORDER_MOVEMENT_TYPES.PEDIMENTO_UPDATED,
                actorId: userId,
                description: 'Se actualizó el pedimento.',
                changes,
            });
        }
        return this.findOne(id, tenantId);
    }
    async updateRealCost(id, dto, tenantId, userId) {
        await this.realCostService.updateRealCost(id, dto, tenantId, userId);
        return this.findOne(id, tenantId);
    }
    async cancel(id, tenantId, userId) {
        const purchaseOrder = await this.findOne(id, tenantId);
        if (purchaseOrder.general_status !== 'Creada') {
            throw new common_1.BadRequestException(`No se puede cancelar la orden de compra con estado: ${purchaseOrder.general_status}`);
        }
        purchaseOrder.general_status = 'Cancelada';
        purchaseOrder.updated_by = userId;
        await this.purchaseOrderBatchRepository.save(purchaseOrder);
        await this.recordActivity({
            tenantId,
            purchaseOrderId: id,
            type: purchase_order_movements_1.PURCHASE_ORDER_MOVEMENT_TYPES.STATUS_CHANGED,
            actorId: userId,
            description: 'La orden pasó de Creada a Cancelada.',
            changes: (0, purchase_order_activity_change_util_1.compactActivityChanges)([
                (0, purchase_order_activity_change_util_1.activityChange)('general_status', 'Estatus', 'Creada', 'Cancelada'),
            ]),
        });
        return this.findOne(id, tenantId);
    }
    async replacePurchaseOrder(id, dto, tenantId, userId) {
        const existing = await this.findOne(id, tenantId);
        if (existing.general_status !== 'Creada') {
            throw new common_1.BadRequestException(`No se puede reemplazar la orden de compra con estado: ${existing.general_status}`);
        }
        await this.assertWarehouseMatchesFiscal(tenantId, dto.warehouse_id, dto.fiscal_configuration_id, dto.billing_branch_id);
        const vendor = await this.getVendorOrFail(dto.vendor_id, tenantId);
        const pedimentoNumber = this.resolvePedimentoForVendor(vendor, dto.pedimento_number !== undefined
            ? dto.pedimento_number
            : existing.pedimento_number);
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await queryRunner.manager.delete(purchase_order_batch_detail_entity_1.PurchaseOrderBatchDetail, {
                purchase_order_batch_id: id,
            });
            const totals = await this.insertLineItemsForPurchaseOrder(queryRunner, id, dto.vendor_id, dto.line_items, userId, dto.payment_currency);
            const batch = await queryRunner.manager.findOne(purchase_order_batch_entity_1.PurchaseOrderBatch, {
                where: { id, tenant_id: tenantId },
            });
            if (!batch) {
                throw new common_1.NotFoundException(`Orden de compra no encontrada: ${id}`);
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
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        const replaceChanges = (0, purchase_order_activity_change_util_1.compactActivityChanges)([
            (0, purchase_order_activity_change_util_1.activityChange)('vendor_id', 'Proveedor', existing.vendor_id, dto.vendor_id),
            (0, purchase_order_activity_change_util_1.activityChange)('warehouse_id', 'Almacén', existing.warehouse_id, dto.warehouse_id),
            (0, purchase_order_activity_change_util_1.activityChange)('fiscal_configuration_id', 'Razón social', existing.fiscal_configuration_id, dto.fiscal_configuration_id),
            (0, purchase_order_activity_change_util_1.activityChange)('payment_currency', 'Moneda', existing.payment_currency, dto.payment_currency || existing.payment_currency),
            (0, purchase_order_activity_change_util_1.activityChange)('notes', 'Notas', existing.notes, dto.notes ?? existing.notes),
            (0, purchase_order_activity_change_util_1.activityChange)('pedimento_number', 'Pedimento', existing.pedimento_number, pedimentoNumber),
            (0, purchase_order_activity_change_util_1.activityChange)('line_items_count', 'Productos', existing.line_items?.length ?? 0, dto.line_items?.length ?? 0),
        ]);
        await this.recordActivity({
            tenantId,
            purchaseOrderId: id,
            type: purchase_order_movements_1.PURCHASE_ORDER_MOVEMENT_TYPES.HEADER_REPLACED,
            actorId: userId,
            description: 'Se reemplazó la cabecera y las líneas de la orden.',
            changes: replaceChanges,
        });
        this.regenerateDocumentoOriginalPreservingLanguage(id, tenantId, userId).catch((err) => {
            console.error('[PDF] Error regenerating DOCUMENTO_ORIGINAL after full PO replace:', err);
        });
        await this.realCostService.recalculateIfEnabled(tenantId, id);
        return this.findOne(id, tenantId);
    }
    async addLineItem(orderId, dto, tenantId, userId) {
        const purchaseOrder = await this.findOne(orderId, tenantId);
        if (purchaseOrder.general_status !== 'Creada') {
            throw new common_1.BadRequestException(`No se puede agregar una línea a la orden de compra con estado: ${purchaseOrder.general_status}`);
        }
        const poCurrency = this.normalizeCurrency(purchaseOrder.payment_currency) || 'MXN';
        const iva_percentage = Number(dto.iva_percentage || 0);
        const ieps_percentage = Number(dto.ieps_percentage || 0);
        const unitTotal = (0, purchase_order_line_breakdown_util_1.roundPoUnitCost)(dto.unit_total);
        const breakdown = (0, purchase_order_line_breakdown_util_1.computeRequestedLineBreakdown)(Number(dto.quantity), unitTotal, iva_percentage, ieps_percentage);
        const productUomId = await this.unitConversionService.getProductUomId(dto.uom_id, dto.product_id);
        const lineCurrency = this.normalizeCurrency(dto.currency);
        if (lineCurrency && lineCurrency !== poCurrency) {
            this.throwLineCurrencyMismatch(lineCurrency, poCurrency);
        }
        const detail = this.purchaseOrderDetailRepository.create({
            id: (0, uuid_1.v4)(),
            purchase_order_batch_id: purchaseOrder.id,
            product_id: dto.product_id,
            product_uom_id: productUomId,
            quantity: dto.quantity,
            unit_total: unitTotal,
            iva_percentage,
            ieps_percentage,
            ...breakdown,
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
                unitTotal,
                ivaPercentage: iva_percentage,
                iepsPercentage: ieps_percentage,
                currency: poCurrency,
            });
            await queryRunner.manager.save(detail);
            await this.persistRequestedTotalsWithRunner(queryRunner, orderId, tenantId, userId);
            await queryRunner.commitTransaction();
        }
        catch (e) {
            await queryRunner.rollbackTransaction();
            throw e;
        }
        finally {
            await queryRunner.release();
        }
        await this.realCostService.recalculateIfEnabled(tenantId, orderId);
        this.scheduleDocumentoOriginalRegen(orderId, tenantId, userId, 'add line item');
        const addedName = (purchaseOrder.line_items || []).find((line) => line.product_id === dto.product_id)
            ?.product?.name ?? dto.product_id;
        await this.recordActivity({
            tenantId,
            purchaseOrderId: orderId,
            type: purchase_order_movements_1.PURCHASE_ORDER_MOVEMENT_TYPES.LINE_ADDED,
            actorId: userId,
            description: `Se agregó ${addedName}: ${dto.quantity} × ${unitTotal}, IVA ${iva_percentage}%.`,
            metadata: {
                product_id: dto.product_id,
                quantity: dto.quantity,
                unit_total: unitTotal,
                iva_percentage,
                ieps_percentage,
            },
        });
        return this.findOne(orderId, tenantId);
    }
    computeRequestedTotalsFromLineItems(details) {
        let requested_subtotal = 0;
        let requested_iva_total = 0;
        let requested_ieps_total = 0;
        for (const d of details) {
            const breakdown = (0, purchase_order_line_breakdown_util_1.computeRequestedLineBreakdown)(Number(d.quantity), Number(d.unit_total), Number(d.iva_percentage || 0), Number(d.ieps_percentage || 0));
            const pick = (value, fallback) => {
                const n = Number(value);
                return Number.isFinite(n) ? this.roundMoney(n) : fallback;
            };
            requested_subtotal += pick(d.line_subtotal, breakdown.line_subtotal);
            requested_iva_total += pick(d.line_iva, breakdown.line_iva);
            requested_ieps_total += pick(d.line_ieps, breakdown.line_ieps);
        }
        return {
            requested_subtotal,
            requested_iva_total,
            requested_ieps_total,
            requested_total: requested_subtotal + requested_iva_total + requested_ieps_total,
        };
    }
    async persistRequestedTotalsWithRunner(qr, purchaseOrderId, tenantId, userId) {
        const details = await qr.manager.find(purchase_order_batch_detail_entity_1.PurchaseOrderBatchDetail, {
            where: { purchase_order_batch_id: purchaseOrderId },
        });
        const totals = this.computeRequestedTotalsFromLineItems(details);
        const batch = await qr.manager.findOne(purchase_order_batch_entity_1.PurchaseOrderBatch, {
            where: { id: purchaseOrderId, tenant_id: tenantId },
        });
        if (!batch) {
            throw new common_1.NotFoundException(`Orden de compra no encontrada: ${purchaseOrderId}`);
        }
        batch.requested_subtotal = totals.requested_subtotal;
        batch.requested_iva_total = totals.requested_iva_total;
        batch.requested_ieps_total = totals.requested_ieps_total;
        batch.requested_total = totals.requested_total;
        batch.updated_by = userId;
        await qr.manager.save(batch);
    }
    applyLineTaxesFromPercentages(lineItem) {
        Object.assign(lineItem, (0, purchase_order_line_breakdown_util_1.computeRequestedLineBreakdown)(Number(lineItem.quantity), Number(lineItem.unit_total), Number(lineItem.iva_percentage || 0), Number(lineItem.ieps_percentage || 0)));
    }
    async updateLineItem(orderId, lineItemId, dto, tenantId, userId) {
        const purchaseOrder = await this.findOne(orderId, tenantId);
        if (purchaseOrder.general_status !== 'Creada') {
            throw new common_1.BadRequestException(`No se puede actualizar la línea de la orden de compra con estado: ${purchaseOrder.general_status}`);
        }
        const lineItem = await this.purchaseOrderDetailRepository.findOne({
            where: { id: lineItemId, purchase_order_batch_id: orderId },
        });
        if (!lineItem) {
            throw new common_1.NotFoundException(`Línea no encontrada: ${lineItemId}`);
        }
        const productName = (purchaseOrder.line_items || []).find((line) => line.id === lineItemId)?.product
            ?.name ?? lineItem.product_id;
        const before = {
            quantity: lineItem.quantity,
            unit_total: lineItem.unit_total,
            iva_percentage: lineItem.iva_percentage,
            ieps_percentage: lineItem.ieps_percentage,
            product_uom_id: lineItem.product_uom_id,
        };
        if (dto.uom_id !== undefined) {
            lineItem.product_uom_id = await this.unitConversionService.getProductUomId(dto.uom_id, lineItem.product_id);
        }
        if (dto.quantity !== undefined) {
            lineItem.quantity = dto.quantity;
        }
        if (dto.unit_total !== undefined) {
            lineItem.unit_total = (0, purchase_order_line_breakdown_util_1.roundPoUnitCost)(dto.unit_total);
        }
        if (dto.iva_percentage !== undefined) {
            lineItem.iva_percentage = dto.iva_percentage;
        }
        if (dto.ieps_percentage !== undefined) {
            lineItem.ieps_percentage = dto.ieps_percentage;
        }
        const qty = Number(lineItem.quantity);
        if (qty <= 0 || !Number.isFinite(qty)) {
            throw new common_1.BadRequestException('La cantidad debe ser un número positivo');
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
            await queryRunner.manager.save(purchase_order_batch_detail_entity_1.PurchaseOrderBatchDetail, lineItem);
            await this.persistRequestedTotalsWithRunner(queryRunner, orderId, tenantId, userId);
            await queryRunner.commitTransaction();
        }
        catch (e) {
            await queryRunner.rollbackTransaction();
            throw e;
        }
        finally {
            await queryRunner.release();
        }
        await this.realCostService.recalculateIfEnabled(tenantId, orderId);
        this.scheduleDocumentoOriginalRegen(orderId, tenantId, userId, 'update line item');
        const changes = (0, purchase_order_activity_change_util_1.compactActivityChanges)([
            (0, purchase_order_activity_change_util_1.activityChange)('quantity', 'Cantidad', before.quantity, lineItem.quantity),
            (0, purchase_order_activity_change_util_1.activityChange)('unit_total', 'Costo unitario', before.unit_total, lineItem.unit_total),
            (0, purchase_order_activity_change_util_1.activityChange)('iva_percentage', 'IVA %', before.iva_percentage, lineItem.iva_percentage),
            (0, purchase_order_activity_change_util_1.activityChange)('ieps_percentage', 'IEPS %', before.ieps_percentage, lineItem.ieps_percentage),
            (0, purchase_order_activity_change_util_1.activityChange)('product_uom_id', 'Unidad', before.product_uom_id, lineItem.product_uom_id),
        ]);
        if (changes.length) {
            await this.recordActivity({
                tenantId,
                purchaseOrderId: orderId,
                type: purchase_order_movements_1.PURCHASE_ORDER_MOVEMENT_TYPES.LINE_UPDATED,
                actorId: userId,
                description: `Se actualizó ${productName}.`,
                changes,
                metadata: { line_item_id: lineItemId, product_id: lineItem.product_id },
            });
        }
        return this.findOne(orderId, tenantId);
    }
    async removeLineItem(orderId, lineItemId, tenantId, userId) {
        const purchaseOrder = await this.findOne(orderId, tenantId);
        if (purchaseOrder.general_status !== 'Creada') {
            throw new common_1.BadRequestException(`No se puede eliminar la línea de la orden de compra con estado: ${purchaseOrder.general_status}`);
        }
        const lineItem = await this.purchaseOrderDetailRepository.findOne({
            where: { id: lineItemId, purchase_order_batch_id: orderId },
        });
        if (!lineItem) {
            throw new common_1.NotFoundException(`Línea no encontrada: ${lineItemId}`);
        }
        const productName = (purchaseOrder.line_items || []).find((line) => line.id === lineItemId)?.product
            ?.name ?? lineItem.product_id;
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await queryRunner.manager.remove(purchase_order_batch_detail_entity_1.PurchaseOrderBatchDetail, lineItem);
            await this.persistRequestedTotalsWithRunner(queryRunner, orderId, tenantId, userId);
            await queryRunner.commitTransaction();
        }
        catch (e) {
            await queryRunner.rollbackTransaction();
            throw e;
        }
        finally {
            await queryRunner.release();
        }
        await this.realCostService.recalculateIfEnabled(tenantId, orderId);
        this.scheduleDocumentoOriginalRegen(orderId, tenantId, userId, 'remove line item');
        await this.recordActivity({
            tenantId,
            purchaseOrderId: orderId,
            type: purchase_order_movements_1.PURCHASE_ORDER_MOVEMENT_TYPES.LINE_REMOVED,
            actorId: userId,
            description: `Se eliminó ${productName} (${Number(lineItem.quantity)} × ${Number(lineItem.unit_total)}, IVA ${Number(lineItem.iva_percentage)}%).`,
            metadata: {
                line_item_id: lineItemId,
                product_id: lineItem.product_id,
                quantity: lineItem.quantity,
                unit_total: lineItem.unit_total,
                iva_percentage: lineItem.iva_percentage,
            },
        });
        return this.findOne(orderId, tenantId);
    }
    async regenerateDocumentoOriginal(id, tenantId, userId, language, keepPrevious = false) {
        try {
            const purchaseOrder = await this.findOne(id, tenantId);
            if (!keepPrevious) {
                await this.deleteDocumentsByType(id, PurchaseOrderService_1.DOC_TYPE_DOCUMENTO_ORIGINAL);
            }
            let pdfBuffer;
            let s3Key;
            try {
                pdfBuffer = await this.pdfService.generatePdf(purchaseOrder, language);
                const uploadResult = await this.pdfService.uploadPdfToS3(purchaseOrder, pdfBuffer, 'DOCUMENTO_ORIGINAL');
                s3Key = uploadResult.s3Key;
            }
            catch (s3Error) {
                console.error('[PDF] S3 upload failed:', s3Error);
                throw s3Error;
            }
            await this.documentsService.uploadDocument(id, PurchaseOrderService_1.DOC_TYPE_DOCUMENTO_ORIGINAL, `DOCUMENTO_ORIGINAL_${purchaseOrder.folio}_${language}.pdf`, s3Key, pdfBuffer.length, 'application/pdf', userId, language);
            return {
                success: true,
                message: 'DOCUMENTO_ORIGINAL regenerado exitosamente',
                document_language: language,
                keep_previous: keepPrevious,
            };
        }
        catch (error) {
            console.error('[PDF] Error regenerating DOCUMENTO_ORIGINAL:', error);
            throw error;
        }
    }
    async regenerateDocumentoOriginalPreservingLanguage(id, tenantId, userId) {
        const language = await this.documentsService.getLastDocumentLanguage(id, PurchaseOrderService_1.DOC_TYPE_DOCUMENTO_ORIGINAL);
        return this.regenerateDocumentoOriginal(id, tenantId, userId, language);
    }
    async regenerateRecepcionDocument(id, tenantId, userId, language, keepPrevious = false) {
        try {
            const purchaseOrder = await this.findOne(id, tenantId);
            if (purchaseOrder.general_status !== 'Recibida') {
                throw new Error('La orden de compra debe estar en estado "Recibida" para generar documento de recepción');
            }
            if (!keepPrevious) {
                await this.deleteDocumentsByType(id, PurchaseOrderService_1.DOC_TYPE_RECEPCION);
            }
            let pdfBuffer;
            let s3Key;
            try {
                pdfBuffer = await this.pdfService.generateRecepcionPdf(purchaseOrder, language);
                const uploadResult = await this.pdfService.uploadPdfToS3(purchaseOrder, pdfBuffer, 'RECEPCION');
                s3Key = uploadResult.s3Key;
            }
            catch (s3Error) {
                console.error('[PDF] S3 upload failed:', s3Error);
                throw s3Error;
            }
            await this.documentsService.uploadDocument(id, PurchaseOrderService_1.DOC_TYPE_RECEPCION, `RECEPCION_${purchaseOrder.folio}_${language}.pdf`, s3Key, pdfBuffer.length, 'application/pdf', userId, language);
            return {
                success: true,
                message: 'Documento de RECEPCIÓN regenerado exitosamente',
                document_language: language,
                keep_previous: keepPrevious,
            };
        }
        catch (error) {
            console.error('[PDF] Error regenerating RECEPCIÓN document:', error);
            throw error;
        }
    }
};
exports.PurchaseOrderService = PurchaseOrderService;
exports.PurchaseOrderService = PurchaseOrderService = PurchaseOrderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(purchase_order_batch_entity_1.PurchaseOrderBatch)),
    __param(1, (0, typeorm_1.InjectRepository)(purchase_order_batch_detail_entity_1.PurchaseOrderBatchDetail)),
    __param(2, (0, typeorm_1.InjectRepository)(inventory_batch_entity_1.InventoryBatch)),
    __param(3, (0, typeorm_1.InjectRepository)(purchase_order_payment_entity_1.PurchaseOrderPayment)),
    __param(4, (0, typeorm_1.InjectRepository)(warehouse_entity_1.Warehouse)),
    __param(5, (0, typeorm_1.InjectRepository)(vendor_entity_1.Vendor)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        unit_conversion_service_1.UnitConversionService,
        batch_number_generator_service_1.BatchNumberGeneratorService,
        folio_generator_service_1.FolioGeneratorService,
        purchase_order_pdf_service_1.PurchaseOrderPdfService,
        purchase_order_documents_service_1.PurchaseOrderDocumentsService,
        purchase_order_lots_service_1.PurchaseOrderLotsService,
        purchase_order_activity_service_1.PurchaseOrderActivityService,
        purchase_order_real_cost_service_1.PurchaseOrderRealCostService,
        typeorm_2.DataSource])
], PurchaseOrderService);
//# sourceMappingURL=purchase-order.service.js.map