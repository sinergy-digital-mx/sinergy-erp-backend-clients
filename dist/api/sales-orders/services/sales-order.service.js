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
var SalesOrderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesOrderService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const sales_order_entity_1 = require("../../../entities/sales-orders/sales-order.entity");
const sales_order_detail_entity_1 = require("../../../entities/sales-orders/sales-order-detail.entity");
const sales_order_batch_allocation_entity_1 = require("../../../entities/sales-orders/sales-order-batch-allocation.entity");
const sales_order_payment_entity_1 = require("../../../entities/sales-orders/sales-order-payment.entity");
const sales_order_payment_document_entity_1 = require("../../../entities/sales-orders/sales-order-payment-document.entity");
const pos_sale_payment_method_enum_1 = require("../../../entities/pos/pos-sale-payment-method.enum");
const user_entity_1 = require("../../../entities/users/user.entity");
const customer_entity_1 = require("../../../entities/customers/customer.entity");
const s3_service_1 = require("../../../common/services/s3.service");
const public_invoice_code_util_1 = require("../../../common/utils/public-invoice-code.util");
const unit_amount_util_1 = require("../../../common/utils/unit-amount.util");
const sales_order_folio_service_1 = require("./sales-order-folio.service");
const sales_order_fulfillment_service_1 = require("./sales-order-fulfillment.service");
const sales_order_pdf_service_1 = require("./sales-order-pdf.service");
const sales_order_documents_service_1 = require("./sales-order-documents.service");
const pos_shifts_service_1 = require("../../pos-shifts/pos-shifts.service");
const product_discount_service_1 = require("../../products/product-discount.service");
const global_discount_service_1 = require("../../global-discounts/global-discount.service");
const product_discount_util_1 = require("../../products/utils/product-discount.util");
const global_discount_util_1 = require("../../global-discounts/utils/global-discount.util");
const sales_order_discount_mapper_1 = require("../mappers/sales-order-discount.mapper");
const pos_user_type_enum_1 = require("../../../entities/users/pos-user-type.enum");
const document_language_enum_1 = require("../../../common/enums/document-language.enum");
const pos_sale_collection_entity_1 = require("../../../entities/pos/pos-sale-collection.entity");
const pos_sale_collection_mapper_1 = require("../../pos-shifts/mappers/pos-sale-collection.mapper");
const electronic_invoice_service_1 = require("../../electronic-invoicing/services/electronic-invoice.service");
const billing_branch_entity_1 = require("../../../entities/billing/billing-branch.entity");
const warehouse_entity_1 = require("../../../entities/warehouse/warehouse.entity");
const control_desk_lifecycle_service_1 = require("../../warehouse-control/control-desk-lifecycle.service");
const warehouse_control_service_1 = require("../../warehouse-control/warehouse-control.service");
const sales_order_payment_display_util_1 = require("../utils/sales-order-payment-display.util");
const sales_order_collection_channel_util_1 = require("../utils/sales-order-collection-channel.util");
let SalesOrderService = class SalesOrderService {
    static { SalesOrderService_1 = this; }
    soRepo;
    detailRepo;
    allocationRepo;
    folioService;
    fulfillmentService;
    dataSource;
    posShiftsService;
    productDiscountService;
    globalDiscountService;
    pdfService;
    documentsService;
    s3Service;
    posCollectionRepo;
    paymentRepo;
    paymentDocumentRepo;
    userRepo;
    customerRepo;
    billingBranchRepo;
    warehouseRepo;
    electronicInvoiceService;
    controlDeskLifecycle;
    warehouseControlService;
    logger = new common_1.Logger(SalesOrderService_1.name);
    static DOC_TYPE_DOCUMENTO_ORIGINAL = 1;
    static DOC_TYPE_NAME_ENTREGA = 'ENTREGA';
    static DOC_TYPE_NAMES_ENTREGA = ['ENTREGA', 'RECIBO'];
    constructor(soRepo, detailRepo, allocationRepo, folioService, fulfillmentService, dataSource, posShiftsService, productDiscountService, globalDiscountService, pdfService, documentsService, s3Service, posCollectionRepo, paymentRepo, paymentDocumentRepo, userRepo, customerRepo, billingBranchRepo, warehouseRepo, electronicInvoiceService, controlDeskLifecycle, warehouseControlService) {
        this.soRepo = soRepo;
        this.detailRepo = detailRepo;
        this.allocationRepo = allocationRepo;
        this.folioService = folioService;
        this.fulfillmentService = fulfillmentService;
        this.dataSource = dataSource;
        this.posShiftsService = posShiftsService;
        this.productDiscountService = productDiscountService;
        this.globalDiscountService = globalDiscountService;
        this.pdfService = pdfService;
        this.documentsService = documentsService;
        this.s3Service = s3Service;
        this.posCollectionRepo = posCollectionRepo;
        this.paymentRepo = paymentRepo;
        this.paymentDocumentRepo = paymentDocumentRepo;
        this.userRepo = userRepo;
        this.customerRepo = customerRepo;
        this.billingBranchRepo = billingBranchRepo;
        this.warehouseRepo = warehouseRepo;
        this.electronicInvoiceService = electronicInvoiceService;
        this.controlDeskLifecycle = controlDeskLifecycle;
        this.warehouseControlService = warehouseControlService;
    }
    async deleteDocumentsByType(salesOrderId, documentTypeId) {
        const existingDocs = await this.documentsService.getDocuments(salesOrderId);
        for (const doc of existingDocs) {
            if (Number(doc.document_type_id) === Number(documentTypeId)) {
                await this.documentsService.deleteDocument(doc.id);
            }
        }
    }
    async deleteDocumentsByTypeNames(salesOrderId, typeNames) {
        const existingDocs = await this.documentsService.getDocuments(salesOrderId);
        for (const doc of existingDocs) {
            if (typeNames.includes(doc.document_type_name)) {
                await this.documentsService.deleteDocument(doc.id);
            }
        }
    }
    async loadOrderForPdf(id, tenantId) {
        return this.soRepo
            .createQueryBuilder('so')
            .where('so.id = :id AND so.tenant_id = :tenantId', { id, tenantId })
            .leftJoinAndSelect('so.fiscal_configuration', 'fiscal_config')
            .leftJoinAndSelect('so.billing_branch', 'billing_branch')
            .leftJoinAndSelect('so.warehouse', 'warehouse')
            .leftJoinAndSelect('warehouse.billing_branch', 'warehouse_branch')
            .leftJoinAndSelect('so.customer', 'customer')
            .leftJoinAndSelect('so.creator', 'creator')
            .leftJoinAndSelect('so.line_items', 'line_items')
            .leftJoinAndSelect('line_items.product', 'product')
            .leftJoinAndSelect('line_items.product_uom', 'product_uom')
            .leftJoinAndSelect('product_uom.uom', 'uom')
            .leftJoinAndSelect('so.global_discount', 'global_discount')
            .getOne();
    }
    async generateAndUploadPdf(salesOrderId, tenantId, userId, language = document_language_enum_1.DocumentLanguage.ES) {
        try {
            const fullOrder = await this.loadOrderForPdf(salesOrderId, tenantId);
            if (!fullOrder) {
                this.logger.error(`[PDF] Failed to load sales order: ${salesOrderId}`);
                return;
            }
            const pdfBuffer = await this.pdfService.generatePdf(fullOrder, language);
            const uploadResult = await this.pdfService.uploadPdfToS3(fullOrder, pdfBuffer, 'DOCUMENTO_ORIGINAL');
            await this.documentsService.uploadDocument(salesOrderId, SalesOrderService_1.DOC_TYPE_DOCUMENTO_ORIGINAL, `DOCUMENTO_ORIGINAL_${fullOrder.folio}_es.pdf`, uploadResult.s3Key, pdfBuffer.length, 'application/pdf', userId, language);
            await this.generateAndUploadDeliveryPdf(fullOrder, salesOrderId, userId, language);
        }
        catch (error) {
            this.logger.error('[PDF] Error in generateAndUploadPdf:', error);
        }
    }
    async generateAndUploadDeliveryPdf(fullOrder, salesOrderId, userId, language) {
        const deliveryTypeId = await this.documentsService.ensureDocumentType(SalesOrderService_1.DOC_TYPE_NAME_ENTREGA, 'Comprobante de entrega de la orden de venta');
        const pdfBuffer = await this.pdfService.generateDeliveryPdf(fullOrder, language);
        const uploadResult = await this.pdfService.uploadPdfToS3(fullOrder, pdfBuffer, SalesOrderService_1.DOC_TYPE_NAME_ENTREGA);
        await this.documentsService.uploadDocument(salesOrderId, deliveryTypeId, `ENTREGA_${fullOrder.folio}_${language}.pdf`, uploadResult.s3Key, pdfBuffer.length, 'application/pdf', userId, language);
    }
    async resolveProductUom(qr, productId, providedUomId) {
        const [productUomRow] = await qr.manager.query(`SELECT pu.id, pu.factor, pu.is_base, pu.uom_catalog_id
       FROM product_uoms pu
       WHERE pu.id = ? AND pu.product_id = ?
       LIMIT 1`, [providedUomId, productId]);
        if (productUomRow) {
            return productUomRow;
        }
        const [productUomByCatalog] = await qr.manager.query(`SELECT pu.id, pu.factor, pu.is_base, pu.uom_catalog_id
       FROM product_uoms pu
       WHERE pu.product_id = ? AND pu.uom_catalog_id = ?
       LIMIT 1`, [productId, providedUomId]);
        if (productUomByCatalog) {
            return productUomByCatalog;
        }
        throw new common_1.BadRequestException(`UOM no encontrado: ${providedUomId}`);
    }
    async resolveLineDiscountAmounts(tenantId, item, productUomId) {
        if (item.product_discount_id) {
            const discount = await this.productDiscountService.findByIdForOrder(item.product_discount_id, item.product_id, tenantId);
            (0, product_discount_util_1.assertProductDiscountApplicable)(discount, item.product_id, productUomId);
            const amounts = (0, product_discount_util_1.calculateProductDiscountLineAmounts)(item.unit_price, item.quantity, discount);
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
    async resolveGlobalDiscountAmounts(tenantId, globalDiscountId, netSubtotal) {
        if (!globalDiscountId) {
            return { global_discount_id: null, global_discount_amount: 0 };
        }
        const discount = await this.globalDiscountService.findByIdForOrder(globalDiscountId, tenantId);
        (0, global_discount_util_1.assertGlobalDiscountApplicable)(discount);
        return {
            global_discount_id: discount.id,
            global_discount_amount: (0, global_discount_util_1.calculateGlobalDiscountAmount)(netSubtotal, discount),
        };
    }
    computeOrderTotal(subtotal, lineDiscountTotal, globalDiscountAmount, ivaTotal, iepsTotal) {
        return Number((subtotal -
            lineDiscountTotal -
            globalDiscountAmount +
            ivaTotal +
            iepsTotal).toFixed(2));
    }
    async create(dto, tenantId, userId, options) {
        const isPosSale = dto.sales_order_type === 'POS';
        const fromQuotation = options?.fromQuotation === true;
        let posDailyShiftId = null;
        let paymentStatus = dto.payment_status || 'Pendiente';
        let collectedByUserId = null;
        let posQueued = false;
        if (!isPosSale && dto.customer_id == null) {
            throw new common_1.BadRequestException('Las órdenes manuales requieren customer_id');
        }
        const customerId = isPosSale
            ? dto.customer_id ?? (await this.posShiftsService.resolveWalkInCustomerId(tenantId))
            : dto.customer_id;
        const location = await this.resolveSalesOrderLocation(tenantId, dto, isPosSale);
        if (isPosSale && !dto.seller_user_id) {
            throw new common_1.BadRequestException('Las ventas POS requieren seller_user_id');
        }
        const sellerUserId = isPosSale ? dto.seller_user_id : (dto.seller_user_id ?? userId);
        const assignedSellerUserId = await this.resolveAssignedSellerUserId(tenantId, customerId, sellerUserId, dto.assigned_seller_user_id);
        if (isPosSale && !fromQuotation) {
            await this.posShiftsService.assertPosWarehouseForTerminal(tenantId, userId, location.warehouseId);
            const { shift, terminalUser, queued } = await this.posShiftsService.resolvePosSaleContext(tenantId, userId, sellerUserId, dto.pos_daily_shift_id);
            posQueued = queued;
            posDailyShiftId = shift?.id ?? null;
            if (!(0, pos_user_type_enum_1.canPosCollect)(terminalUser.pos_user_type)) {
                paymentStatus = 'Pendiente';
            }
            else if (paymentStatus === 'Pagado') {
                collectedByUserId = userId;
            }
        }
        if (isPosSale && fromQuotation) {
            paymentStatus = 'Pendiente';
        }
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const folio = await this.folioService.generateFolio(tenantId);
            const salesOrderType = dto.sales_order_type || 'MANUAL';
            const requiresSelectionAssembly = !isPosSale && salesOrderType === 'MANUAL' && !!dto.requires_selection_assembly;
            const initialStatus = requiresSelectionAssembly ? 'En Selección' : 'Creada';
            const so = qr.manager.create(sales_order_entity_1.SalesOrder, {
                id: (0, uuid_1.v4)(),
                tenant_id: tenantId,
                folio,
                fiscal_configuration_id: location.fiscalConfigurationId,
                billing_branch_id: location.billingBranchId,
                warehouse_id: location.warehouseId,
                customer_id: customerId,
                expected_delivery_date: new Date(dto.expected_delivery_date),
                sales_order_type: salesOrderType,
                fiscal_razon_social: dto.fiscal_razon_social,
                payment_status: paymentStatus,
                general_status: initialStatus,
                notes: dto.notes,
                requires_selection_assembly: requiresSelectionAssembly,
                created_by: userId,
                terminal_user_id: isPosSale ? userId : null,
                seller_user_id: sellerUserId,
                assigned_seller_user_id: assignedSellerUserId,
                pos_daily_shift_id: isPosSale ? posDailyShiftId : null,
                collected_by_user_id: collectedByUserId,
            });
            const savedSO = await qr.manager.save(sales_order_entity_1.SalesOrder, so);
            const savedDetails = [];
            let subtotal = 0, iva_total = 0, ieps_total = 0, discount_total = 0;
            for (const item of dto.line_items) {
                const productUomRow = await this.resolveProductUom(qr, item.product_id, item.product_uom_id);
                const discountAmounts = await this.resolveLineDiscountAmounts(tenantId, item, productUomRow.id);
                const line_subtotal = Number(item.quantity) * Number(item.unit_price);
                const line_discount = discountAmounts.line_discount;
                const taxable_subtotal = Math.max(line_subtotal - line_discount, 0);
                const iva_pct = Number(item.iva_percentage || 0);
                const ieps_pct = Number(item.ieps_percentage || 0);
                const line_iva = (taxable_subtotal * iva_pct) / 100;
                const line_ieps = (taxable_subtotal * ieps_pct) / 100;
                const [baseUomRow] = await qr.manager.query(`SELECT pu.uom_catalog_id FROM product_uoms pu
           WHERE pu.product_id = ? AND pu.is_base = 1 LIMIT 1`, [item.product_id]);
                if (!baseUomRow) {
                    throw new common_1.BadRequestException(`UOM base no encontrado para producto: ${item.product_id}`);
                }
                const factor = productUomRow.factor || 1;
                const qty_base = productUomRow.is_base
                    ? Number(item.quantity)
                    : Number(item.quantity) * factor;
                const detail = qr.manager.create(sales_order_detail_entity_1.SalesOrderDetail, {
                    id: (0, uuid_1.v4)(),
                    sales_order_id: savedSO.id,
                    product_id: item.product_id,
                    product_uom_id: productUomRow.id,
                    quantity: item.quantity,
                    quantity_base_uom: qty_base,
                    base_uom_id: baseUomRow.uom_catalog_id,
                    unit_price: (0, unit_amount_util_1.roundUnitAmount)(item.unit_price),
                    discount_percentage: discountAmounts.discount_percentage,
                    discount_unit: discountAmounts.discount_unit,
                    product_discount_id: discountAmounts.product_discount_id,
                    iva_percentage: iva_pct,
                    iva_unit: Number(item.quantity) > 0 ? line_iva / Number(item.quantity) : 0,
                    ieps_percentage: ieps_pct,
                    ieps_unit: Number(item.quantity) > 0 ? line_ieps / Number(item.quantity) : 0,
                    created_by: userId,
                });
                await qr.manager.save(sales_order_detail_entity_1.SalesOrderDetail, detail);
                savedDetails.push(detail);
                subtotal += line_subtotal;
                discount_total += line_discount;
                iva_total += line_iva;
                ieps_total += line_ieps;
            }
            savedSO.subtotal = subtotal;
            savedSO.discount_total = discount_total;
            const globalDiscountAmounts = await this.resolveGlobalDiscountAmounts(tenantId, dto.global_discount_id, subtotal - discount_total);
            savedSO.global_discount_id = globalDiscountAmounts.global_discount_id;
            savedSO.global_discount_amount = globalDiscountAmounts.global_discount_amount;
            savedSO.iva_total = iva_total;
            savedSO.ieps_total = ieps_total;
            savedSO.total = this.computeOrderTotal(subtotal, discount_total, globalDiscountAmounts.global_discount_amount, iva_total, ieps_total);
            await qr.manager.save(sales_order_entity_1.SalesOrder, savedSO);
            if (requiresSelectionAssembly) {
                await this.controlDeskLifecycle.syncJobForSalesOrder(qr.manager, {
                    tenantId,
                    userId,
                    salesOrder: savedSO,
                    details: savedDetails,
                    requiresSelection: true,
                });
            }
            if (salesOrderType === 'POS') {
                await this.fulfillOrderLines(qr, savedSO.id, this.allocationScope(savedSO), savedDetails, userId);
                savedSO.general_status = posQueued ? 'En cola' : 'Surtida';
                await qr.manager.save(sales_order_entity_1.SalesOrder, savedSO);
                this.logger.log(`POS sales order ${folio} auto-fulfilled by user ${userId}`);
            }
            await qr.commitTransaction();
            this.generateAndUploadPdf(savedSO.id, tenantId, userId).catch((err) => {
                this.logger.error('[PDF] Error in async PDF generation:', err);
            });
            return this.findOne(savedSO.id, tenantId);
        }
        catch (err) {
            await qr.rollbackTransaction();
            throw err;
        }
        finally {
            await qr.release();
        }
    }
    async findAll(tenantId, filters) {
        const { search, general_status, payment_status, is_credit, sales_order_type, collection_channel, fiscal_configuration_id, billing_branch_id, customer_id, created_from, created_to, page = 1, limit = 20, sort_by = 'created_at', sort_order = 'DESC', } = filters;
        const qb = this.soRepo
            .createQueryBuilder('so')
            .leftJoinAndSelect('so.customer', 'customer')
            .leftJoinAndSelect('so.fiscal_configuration', 'fiscal_configuration')
            .leftJoinAndSelect('so.billing_branch', 'billing_branch')
            .leftJoinAndSelect('so.warehouse', 'warehouse')
            .where('so.tenant_id = :tenantId', { tenantId });
        if (search) {
            qb.andWhere('(so.folio LIKE :s OR customer.name LIKE :s OR customer.lastname LIKE :s OR CONCAT(customer.name, \' \', COALESCE(customer.lastname, \'\')) LIKE :s)', { s: `%${search}%` });
        }
        if (general_status?.length) {
            if (general_status.length === 1) {
                qb.andWhere('so.general_status = :general_status', {
                    general_status: general_status[0],
                });
            }
            else {
                qb.andWhere('so.general_status IN (:...general_statuses)', {
                    general_statuses: general_status,
                });
            }
        }
        if (payment_status)
            qb.andWhere('so.payment_status = :payment_status', { payment_status });
        if (typeof is_credit === 'boolean') {
            qb.andWhere('so.is_credit = :is_credit', { is_credit });
        }
        if (sales_order_type)
            qb.andWhere('so.sales_order_type = :sales_order_type', { sales_order_type });
        (0, sales_order_collection_channel_util_1.applySalesOrderCollectionChannelFilter)(qb, 'so', collection_channel);
        if (fiscal_configuration_id) {
            qb.andWhere('so.fiscal_configuration_id = :fiscal_configuration_id', {
                fiscal_configuration_id,
            });
        }
        if (billing_branch_id) {
            qb.andWhere('(so.billing_branch_id = :billing_branch_id OR (so.billing_branch_id IS NULL AND warehouse.billing_branch_id = :billing_branch_id))', { billing_branch_id });
        }
        if (customer_id)
            qb.andWhere('so.customer_id = :customer_id', { customer_id });
        if (created_from)
            qb.andWhere('so.created_at >= :created_from', { created_from: new Date(created_from) });
        if (created_to)
            qb.andWhere('so.created_at <= :created_to', { created_to: new Date(created_to) });
        const sortCol = sort_by === 'total' ? 'so.total' : sort_by === 'folio' ? 'so.folio' : 'so.created_at';
        qb.orderBy(sortCol, sort_order).skip((page - 1) * limit).take(limit);
        const [rows, total] = await qb.getManyAndCount();
        const paymentByOrderId = await this.getPaymentDisplayByOrderIds(tenantId, rows);
        return {
            data: rows.map((so) => {
                const paymentInfo = paymentByOrderId.get(so.id);
                const paymentDisplay = paymentInfo?.display ??
                    (0, sales_order_payment_display_util_1.buildSalesOrderPaymentDisplay)({ isCredit: !!so.is_credit });
                return {
                    ...this.mapOrderLocation(so),
                    payment_method: paymentDisplay.payment_method,
                    payment_method_label: paymentDisplay.payment_method_label,
                    payment_breakdown_label: paymentDisplay.payment_breakdown_label,
                    payment_display: paymentDisplay,
                    collection_channel: paymentInfo?.collection_channel ?? null,
                    collection_channel_label: paymentInfo?.collection_channel_label ?? null,
                };
            }),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async linkConvertedFromQuotation(salesOrderId, quotationId, tenantId) {
        await this.soRepo.update({ id: salesOrderId, tenant_id: tenantId }, { converted_from_quotation_id: quotationId });
    }
    async findOne(id, tenantId) {
        const so = await this.soRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: [
                'customer', 'billing_branch', 'warehouse', 'warehouse.billing_branch', 'fiscal_configuration',
                'seller_user', 'assigned_seller_user', 'terminal_user', 'collected_by_user', 'corroborator',
                'line_items', 'line_items.product', 'line_items.product_uom', 'line_items.product_uom.uom',
                'line_items.product_discount',
                'global_discount',
                'line_items.base_uom',
                'line_items.batch_allocations', 'line_items.batch_allocations.inventory_batch',
            ],
        });
        if (!so)
            throw new common_1.NotFoundException(`Sales order not found: ${id}`);
        return so;
    }
    async findOneDetail(id, tenantId) {
        const so = await this.findOne(id, tenantId);
        const posCollection = await this.posCollectionRepo.findOne({
            where: { sales_order_id: id, tenant_id: tenantId },
            relations: ['customer', 'collected_by_user'],
        });
        if (posCollection && so.customer_id !== posCollection.customer_id) {
            await this.soRepo.update({ id: so.id, tenant_id: tenantId }, { customer_id: posCollection.customer_id });
            so.customer_id = posCollection.customer_id;
            so.customer = posCollection.customer ?? so.customer;
        }
        const customerSummary = (0, pos_sale_collection_mapper_1.mapPosCustomer)(so.customer);
        const appliedLineDiscounts = (0, sales_order_discount_mapper_1.mapAppliedLineDiscountsFromOrder)(so);
        const discountSummary = (0, sales_order_discount_mapper_1.mapOrderDiscountSummary)(so);
        const paymentData = await this.getPaymentsForOrder(so);
        const paymentDisplay = (0, sales_order_payment_display_util_1.buildSalesOrderPaymentDisplay)({
            collection: posCollection,
            payments: paymentData.payments,
            isCredit: !!so.is_credit,
        });
        const collectionChannel = (0, sales_order_collection_channel_util_1.resolveSalesOrderCollectionChannel)({
            hasPosCollection: !!posCollection,
            paymentSources: paymentData.payments.map((payment) => payment.source),
            inferredPosCollection: so.sales_order_type === 'POS' && !!so.collected_by_user_id,
        });
        const cancelBlockedReason = await this.getCancelBlockedReason(so, tenantId);
        const controlDesk = await this.warehouseControlService.getSalesOrderSummary(so.id, tenantId);
        const header = {
            ...this.mapOrderLocation(so),
            public_invoice_code: so.public_invoice_code ?? null,
            self_invoice_url: so.public_invoice_code
                ? (0, public_invoice_code_util_1.buildSelfInvoicePortalUrl)(so.public_invoice_code, so.customer?.email)
                : null,
            customer_display_name: customerSummary?.display_name ?? (0, pos_sale_collection_mapper_1.formatCustomerDisplayName)(so.customer),
            customer_summary: customerSummary,
            seller_user: (0, pos_sale_collection_mapper_1.mapPosUser)(so.seller_user),
            assigned_seller_user: (0, pos_sale_collection_mapper_1.mapPosUser)(so.assigned_seller_user),
            terminal_user: (0, pos_sale_collection_mapper_1.mapPosUser)(so.terminal_user),
            collected_by_user: (0, pos_sale_collection_mapper_1.mapPosUser)(so.collected_by_user),
            corroborated_by_user: (0, pos_sale_collection_mapper_1.mapPosUser)(so.corroborator),
            pos_collection: posCollection ? (0, pos_sale_collection_mapper_1.mapPosSaleCollection)(posCollection) : null,
            payment_method: paymentDisplay.payment_method,
            payment_method_label: paymentDisplay.payment_method_label,
            payment_breakdown_label: paymentDisplay.payment_breakdown_label,
            payment_display: paymentDisplay,
            collection_channel: collectionChannel.collection_channel,
            collection_channel_label: collectionChannel.collection_channel_label,
            payments: paymentData.payments,
            payments_summary: paymentData.summary,
            applied_line_discounts: appliedLineDiscounts,
            applied_global_discount: discountSummary.global_discount,
            applied_discounts: appliedLineDiscounts,
            discount_summary: discountSummary,
            can_cancel: cancelBlockedReason === null,
            cancel_blocked_reason: cancelBlockedReason,
            can_edit_lines: this.resolveCanEditLines(so.general_status, controlDesk),
            control_desk: controlDesk,
        };
        return {
            header,
            sales_order: {
                ...so,
                line_items: (so.line_items ?? []).map(sales_order_discount_mapper_1.mapLineItemWithDiscount),
            },
            pos_collection: header.pos_collection,
            payment_display: paymentDisplay,
            payments: paymentData.payments,
            payments_summary: paymentData.summary,
            applied_line_discounts: appliedLineDiscounts,
            applied_global_discount: discountSummary.global_discount,
            applied_discounts: appliedLineDiscounts,
            discount_summary: discountSummary,
        };
    }
    async getPayments(id, tenantId) {
        const order = await this.findOne(id, tenantId);
        return this.getPaymentsForOrder(order);
    }
    async createPayment(salesOrderId, dto, tenantId, userId, source = 'manual') {
        const order = await this.findOne(salesOrderId, tenantId);
        if (order.general_status === 'Cancelada') {
            throw new common_1.BadRequestException('No se pueden registrar pagos en una orden cancelada');
        }
        if (order.payment_status === 'Pagado') {
            throw new common_1.BadRequestException('La orden ya está pagada');
        }
        if (dto.payment_method === pos_sale_payment_method_enum_1.PosSalePaymentMethod.CREDIT) {
            throw new common_1.BadRequestException('El crédito solo se registra desde cobranza POS');
        }
        if (dto.payment_method === pos_sale_payment_method_enum_1.PosSalePaymentMethod.TRANSFER &&
            !dto.reference_number?.trim()) {
            throw new common_1.BadRequestException('reference_number es obligatorio para transferencia');
        }
        const existing = await this.paymentRepo.find({
            where: { sales_order_id: salesOrderId, tenant_id: tenantId },
        });
        const currentSummary = this.buildPaymentSummary(order, existing);
        if (dto.amount > currentSummary.amount_pending + 0.001) {
            throw new common_1.BadRequestException(`El monto excede el saldo pendiente (${currentSummary.amount_pending.toFixed(2)} MXN)`);
        }
        const payment = this.paymentRepo.create({
            id: (0, uuid_1.v4)(),
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
    async deletePayment(salesOrderId, paymentId, tenantId, userId) {
        const order = await this.findOne(salesOrderId, tenantId);
        const payment = await this.paymentRepo.findOne({
            where: { id: paymentId, sales_order_id: salesOrderId, tenant_id: tenantId },
            relations: ['documents'],
        });
        if (!payment) {
            throw new common_1.NotFoundException(`Pago no encontrado: ${paymentId}`);
        }
        if (payment.source === 'pos_cobranza') {
            throw new common_1.BadRequestException('No se puede eliminar un pago registrado desde cobranza POS');
        }
        for (const doc of payment.documents ?? []) {
            try {
                await this.s3Service.deleteFile(doc.s3_key);
            }
            catch {
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
        return { success: true, id: paymentId, summary: paymentData.summary };
    }
    async uploadPaymentDocument(salesOrderId, paymentId, tenantId, userId, file, notes) {
        await this.findOne(salesOrderId, tenantId);
        const payment = await this.paymentRepo.findOne({
            where: { id: paymentId, sales_order_id: salesOrderId, tenant_id: tenantId },
        });
        if (!payment) {
            throw new common_1.NotFoundException(`Pago no encontrado: ${paymentId}`);
        }
        const s3Key = await this.s3Service.uploadEntityFile(tenantId, 'sales-order-payments', paymentId, 'comprobantes', file.buffer, file.originalname, file.mimetype);
        const document = this.paymentDocumentRepo.create({
            id: (0, uuid_1.v4)(),
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
    async getPaymentDocuments(salesOrderId, paymentId, tenantId) {
        await this.findOne(salesOrderId, tenantId);
        const payment = await this.paymentRepo.findOne({
            where: { id: paymentId, sales_order_id: salesOrderId, tenant_id: tenantId },
        });
        if (!payment) {
            throw new common_1.NotFoundException(`Pago no encontrado: ${paymentId}`);
        }
        const docs = await this.paymentDocumentRepo.find({
            where: { payment_id: paymentId, tenant_id: tenantId },
            order: { created_at: 'DESC' },
        });
        return Promise.all(docs.map((doc) => this.mapPaymentDocument(doc)));
    }
    async deletePaymentDocument(salesOrderId, paymentId, documentId, tenantId) {
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
            throw new common_1.NotFoundException('Documento de pago no encontrado');
        }
        try {
            await this.s3Service.deleteFile(doc.s3_key);
        }
        catch {
        }
        await this.paymentDocumentRepo.remove(doc);
        return { success: true, id: documentId };
    }
    async getAmountPending(salesOrderId, tenantId) {
        const order = await this.soRepo.findOne({
            where: { id: salesOrderId, tenant_id: tenantId },
            select: ['id', 'total'],
        });
        if (!order) {
            throw new common_1.NotFoundException(`Sales order not found: ${salesOrderId}`);
        }
        const pendingByOrder = await this.getAmountPendingMap([order], tenantId);
        return pendingByOrder.get(order.id) ?? Number(order.total || 0);
    }
    async getAmountPendingMap(orders, tenantId) {
        const pendingByOrder = new Map();
        if (orders.length === 0) {
            return pendingByOrder;
        }
        const paidRows = await this.paymentRepo
            .createQueryBuilder('p')
            .select('p.sales_order_id', 'sales_order_id')
            .addSelect('COALESCE(SUM(p.amount), 0)', 'paid')
            .where('p.tenant_id = :tenantId', { tenantId })
            .andWhere('p.sales_order_id IN (:...ids)', {
            ids: orders.map((order) => order.id),
        })
            .groupBy('p.sales_order_id')
            .getRawMany();
        const paidByOrder = new Map(paidRows.map((row) => [row.sales_order_id, Number(row.paid)]));
        for (const order of orders) {
            const total = Number(order.total || 0);
            const paid = paidByOrder.get(order.id) ?? 0;
            pendingByOrder.set(order.id, Math.max(Number((total - paid).toFixed(2)), 0));
        }
        return pendingByOrder;
    }
    async getPaymentDisplayByOrderIds(tenantId, orders) {
        const displayByOrder = new Map();
        if (orders.length === 0)
            return displayByOrder;
        const orderIds = orders.map((order) => order.id);
        const collections = await this.posCollectionRepo.find({
            where: { tenant_id: tenantId, sales_order_id: (0, typeorm_2.In)(orderIds) },
        });
        const payments = await this.paymentRepo.find({
            where: { tenant_id: tenantId, sales_order_id: (0, typeorm_2.In)(orderIds) },
            select: ['id', 'sales_order_id', 'payment_method', 'amount', 'currency', 'source'],
        });
        const collectionByOrder = new Map(collections.map((row) => [row.sales_order_id, row]));
        const paymentsByOrder = new Map();
        for (const payment of payments) {
            const list = paymentsByOrder.get(payment.sales_order_id) ?? [];
            list.push(payment);
            paymentsByOrder.set(payment.sales_order_id, list);
        }
        const channelByOrder = (0, sales_order_collection_channel_util_1.mapCollectionChannelByOrderId)(orders, collections, payments);
        for (const order of orders) {
            const channel = channelByOrder.get(order.id) ?? {
                collection_channel: null,
                collection_channel_label: null,
            };
            displayByOrder.set(order.id, {
                display: (0, sales_order_payment_display_util_1.buildSalesOrderPaymentDisplay)({
                    collection: collectionByOrder.get(order.id),
                    payments: paymentsByOrder.get(order.id),
                    isCredit: !!order.is_credit,
                }),
                collection_channel: channel.collection_channel,
                collection_channel_label: channel.collection_channel_label,
            });
        }
        return displayByOrder;
    }
    async getPaymentsForOrder(order) {
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
    async assertPosSellerUser(userId, tenantId, notFoundMessage) {
        const user = await this.userRepo.findOne({
            where: { id: userId, tenant_id: tenantId },
        });
        if (!user) {
            throw new common_1.BadRequestException(notFoundMessage);
        }
        if (user.pos_user_code == null) {
            throw new common_1.BadRequestException('El vendedor debe tener un código POS');
        }
        return user;
    }
    async resolveAssignedSellerUserId(tenantId, customerId, sellerUserId, explicitAssignedSellerId) {
        if (explicitAssignedSellerId) {
            const explicit = await this.assertPosSellerUser(explicitAssignedSellerId, tenantId, 'Comisionado no válido');
            return explicit.id;
        }
        const customer = await this.customerRepo.findOne({
            where: { id: customerId, tenant_id: tenantId },
            select: ['id', 'assigned_seller_user_id'],
        });
        if (customer?.assigned_seller_user_id) {
            const assigned = await this.userRepo.findOne({
                where: { id: customer.assigned_seller_user_id, tenant_id: tenantId },
                select: ['id', 'pos_user_code'],
            });
            if (assigned?.pos_user_code != null) {
                return assigned.id;
            }
        }
        return sellerUserId;
    }
    mapOrderLocation(so) {
        const branch = so.billing_branch ?? so.warehouse?.billing_branch ?? null;
        const fiscal = so.fiscal_configuration ?? null;
        const { warehouse: _warehouse, ...rest } = so;
        return {
            ...rest,
            razon_social: fiscal?.razon_social ?? so.fiscal_razon_social ?? null,
            sucursal: branch?.code ?? null,
            fiscal_configuration: fiscal
                ? {
                    id: fiscal.id,
                    razon_social: fiscal.razon_social,
                    rfc: fiscal.rfc,
                }
                : null,
            billing_branch_id: so.billing_branch_id ?? so.warehouse?.billing_branch_id ?? branch?.id ?? null,
            billing_branch: branch
                ? {
                    id: branch.id,
                    code: branch.code,
                    address: branch.address,
                    city: branch.city,
                    state: branch.state,
                    country: branch.country,
                    postal_code: branch.postal_code,
                }
                : null,
        };
    }
    buildPaymentSummary(order, payments) {
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
    async mapPaymentWithDocuments(payment) {
        const documents = await Promise.all((payment.documents ?? []).map((doc) => this.mapPaymentDocument(doc)));
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
            source_label: (0, sales_order_collection_channel_util_1.collectionChannelSourceLabel)(payment.source),
            created_by: payment.created_by,
            created_by_name: payment.creator
                ? [payment.creator.first_name, payment.creator.last_name].filter(Boolean).join(' ').trim()
                : null,
            created_at: payment.created_at,
            documents,
        };
    }
    async mapPaymentDocument(doc) {
        let url = null;
        try {
            url = await this.s3Service.getSignedUrl(doc.s3_key, 900);
        }
        catch {
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
    async updateNotes(id, dto, tenantId, userId) {
        const so = await this.findOne(id, tenantId);
        if (so.general_status === 'Cancelada') {
            throw new common_1.BadRequestException('No se pueden editar notas de una orden cancelada');
        }
        so.notes = dto.notes?.trim() ? dto.notes.trim() : null;
        so.updated_by = userId;
        await this.soRepo.save(so);
        return this.findOne(id, tenantId);
    }
    async updateSeller(id, sellerUserId, tenantId, userId) {
        const so = await this.findOne(id, tenantId);
        if (so.general_status === 'Cancelada') {
            throw new common_1.BadRequestException('No se puede cambiar el vendedor de una orden cancelada');
        }
        const seller = await this.assertPosSellerUser(sellerUserId, tenantId, 'Vendedor no válido');
        await this.soRepo.update({ id, tenant_id: tenantId }, { seller_user_id: seller.id, updated_by: userId });
        return this.findOneDetail(id, tenantId);
    }
    async updateAssignedSeller(id, assignedSellerUserId, tenantId, userId) {
        const so = await this.findOne(id, tenantId);
        if (so.general_status === 'Cancelada') {
            throw new common_1.BadRequestException('No se puede cambiar el comisionado de una orden cancelada');
        }
        const assigned = await this.assertPosSellerUser(assignedSellerUserId, tenantId, 'Comisionado no válido');
        await this.soRepo.update({ id, tenant_id: tenantId }, { assigned_seller_user_id: assigned.id, updated_by: userId });
        return this.findOneDetail(id, tenantId);
    }
    async fulfill(id, dto, tenantId, userId) {
        const so = await this.findOne(id, tenantId);
        if (so.general_status === 'En Selección') {
            throw new common_1.BadRequestException(`La orden ${so.folio} está en selección; debe corroborarse en Mesa de Control`);
        }
        if (so.general_status !== 'Creada') {
            throw new common_1.BadRequestException(`La orden ${so.folio} ya fue ${so.general_status.toLowerCase()}`);
        }
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            await this.fulfillOrderLines(qr, id, this.allocationScope(so), so.line_items, userId, dto.notes ?? so.notes ?? undefined);
            await qr.commitTransaction();
            this.logger.log(`Sales order ${so.folio} fulfilled by user ${userId}`);
            return this.findOne(id, tenantId);
        }
        catch (err) {
            await qr.rollbackTransaction();
            throw err;
        }
        finally {
            await qr.release();
        }
    }
    async cancel(id, tenantId, userId) {
        const so = await this.findOne(id, tenantId);
        const blockedReason = await this.getCancelBlockedReason(so, tenantId);
        if (blockedReason) {
            throw new common_1.BadRequestException(blockedReason);
        }
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const allAllocations = (so.line_items ?? []).flatMap((d) => d.batch_allocations ?? []);
            if (allAllocations.length) {
                await this.fulfillmentService.releaseAllocations(allAllocations, qr.manager);
                this.logger.log(`Sales order ${so.folio}: released ${allAllocations.length} batch allocation(s) on cancel`);
            }
            await this.controlDeskLifecycle.cancelJobForSalesOrder(qr.manager, tenantId, id, userId);
            await qr.manager.update(sales_order_entity_1.SalesOrder, { id }, {
                general_status: 'Cancelada',
                updated_by: userId,
            });
            await qr.commitTransaction();
            this.logger.log(`Sales order ${so.folio} cancelled by user ${userId}`);
            return this.findOne(id, tenantId);
        }
        catch (err) {
            await qr.rollbackTransaction();
            throw err;
        }
        finally {
            await qr.release();
        }
    }
    async getCancelBlockedReason(so, tenantId) {
        if (so.general_status === 'Cancelada') {
            return 'La orden ya está cancelada';
        }
        const vigentes = await this.electronicInvoiceService.findVigenteBySource(tenantId, 'sales_orders', so.id);
        if (!vigentes.length) {
            return null;
        }
        const first = vigentes[0];
        const uuidLabel = first.uuid ? ` (UUID ${first.uuid})` : '';
        return `No se puede cancelar la orden: tiene una factura CFDI vigente${uuidLabel}. Cancela la factura primero.`;
    }
    async replace(id, dto, tenantId, userId) {
        const existing = await this.findOne(id, tenantId);
        if (existing.general_status !== 'Creada' &&
            existing.general_status !== 'En Selección') {
            throw new common_1.BadRequestException(`Cannot edit sales order with status: ${existing.general_status}`);
        }
        const isPosSale = (dto.sales_order_type || existing.sales_order_type) === 'POS';
        const location = await this.resolveSalesOrderLocation(tenantId, dto, isPosSale);
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const existingJob = await this.controlDeskLifecycle.findActiveJob(qr.manager, tenantId, id);
            this.controlDeskLifecycle.assertJobEditable(existingJob);
            await qr.manager.delete(sales_order_detail_entity_1.SalesOrderDetail, { sales_order_id: id });
            const so = await qr.manager.findOne(sales_order_entity_1.SalesOrder, { where: { id, tenant_id: tenantId } });
            if (!so) {
                throw new common_1.NotFoundException(`Sales order not found: ${id}`);
            }
            so.fiscal_configuration_id = dto.fiscal_configuration_id;
            so.billing_branch_id = location.billingBranchId;
            so.warehouse_id = location.warehouseId;
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
            if (dto.requires_selection_assembly !== undefined && so.sales_order_type === 'MANUAL') {
                so.requires_selection_assembly = !!dto.requires_selection_assembly;
                so.general_status = so.requires_selection_assembly
                    ? 'En Selección'
                    : 'Creada';
            }
            so.updated_by = userId;
            await qr.manager.save(sales_order_entity_1.SalesOrder, so);
            const savedDetails = await this.insertSalesOrderLineItems(qr, so.id, dto.line_items, userId, tenantId);
            await this.recomputeTotals(qr, so.id, tenantId, userId);
            await this.controlDeskLifecycle.syncJobForSalesOrder(qr.manager, {
                tenantId,
                userId,
                salesOrder: so,
                details: savedDetails,
                requiresSelection: !!so.requires_selection_assembly,
            });
            await qr.commitTransaction();
            this.regenerateDocumentoOriginalPreservingLanguage(id, tenantId, userId).catch((err) => {
                this.logger.error('[PDF] Error regenerating DOCUMENTO_ORIGINAL after sales order replace:', err);
            });
            return this.findOne(id, tenantId);
        }
        catch (err) {
            await qr.rollbackTransaction();
            throw err;
        }
        finally {
            await qr.release();
        }
    }
    async addLineItem(orderId, dto, tenantId, userId) {
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const so = await qr.manager.findOne(sales_order_entity_1.SalesOrder, {
                where: { id: orderId, tenant_id: tenantId },
            });
            if (!so) {
                throw new common_1.NotFoundException(`Orden de venta no encontrada: ${orderId}`);
            }
            await this.assertLineItemsEditable(qr, so, tenantId);
            await this.insertSalesOrderLineItems(qr, so.id, [dto], userId, tenantId);
            await this.recomputeTotals(qr, so.id, tenantId, userId);
            const details = await qr.manager.find(sales_order_detail_entity_1.SalesOrderDetail, {
                where: { sales_order_id: so.id },
            });
            await this.controlDeskLifecycle.syncJobForSalesOrder(qr.manager, {
                tenantId,
                userId,
                salesOrder: so,
                details,
                requiresSelection: !!so.requires_selection_assembly,
            });
            await qr.commitTransaction();
        }
        catch (err) {
            await qr.rollbackTransaction();
            throw err;
        }
        finally {
            await qr.release();
        }
        this.regenerateDocumentoOriginalPreservingLanguage(orderId, tenantId, userId).catch((err) => {
            this.logger.error('[PDF] Error regenerating DOCUMENTO_ORIGINAL after add line:', err);
        });
    }
    async updateLineItem(orderId, lineItemId, dto, tenantId, userId) {
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const so = await qr.manager.findOne(sales_order_entity_1.SalesOrder, {
                where: { id: orderId, tenant_id: tenantId },
            });
            if (!so) {
                throw new common_1.NotFoundException(`Orden de venta no encontrada: ${orderId}`);
            }
            await this.assertLineItemsEditable(qr, so, tenantId);
            const line = await qr.manager.findOne(sales_order_detail_entity_1.SalesOrderDetail, {
                where: { id: lineItemId, sales_order_id: orderId },
            });
            if (!line) {
                throw new common_1.NotFoundException(`Línea no encontrada: ${lineItemId}`);
            }
            if (dto.quantity !== undefined) {
                line.quantity = dto.quantity;
            }
            if (dto.unit_price !== undefined) {
                line.unit_price = (0, unit_amount_util_1.roundUnitAmount)(dto.unit_price);
            }
            if (dto.iva_percentage !== undefined) {
                line.iva_percentage = dto.iva_percentage;
            }
            if (dto.ieps_percentage !== undefined) {
                line.ieps_percentage = dto.ieps_percentage;
            }
            const productUomId = dto.product_uom_id || line.product_uom_id;
            const productUomRow = await this.resolveProductUom(qr, line.product_id, productUomId);
            line.product_uom_id = productUomRow.id;
            const factor = productUomRow.factor || 1;
            line.quantity_base_uom = productUomRow.is_base
                ? Number(line.quantity)
                : Number(line.quantity) * factor;
            const discountAmounts = await this.resolveLineDiscountAmounts(tenantId, {
                product_id: line.product_id,
                product_uom_id: productUomRow.id,
                quantity: Number(line.quantity),
                unit_price: Number(line.unit_price),
                discount_percentage: dto.discount_percentage !== undefined
                    ? dto.discount_percentage
                    : Number(line.discount_percentage || 0),
                product_discount_id: line.product_discount_id ?? undefined,
                iva_percentage: Number(line.iva_percentage || 0),
                ieps_percentage: Number(line.ieps_percentage || 0),
            }, productUomRow.id);
            line.discount_percentage = discountAmounts.discount_percentage;
            line.discount_unit = discountAmounts.discount_unit;
            line.product_discount_id = discountAmounts.product_discount_id;
            this.applyPersistedLineTaxes(line);
            await qr.manager.save(sales_order_detail_entity_1.SalesOrderDetail, line);
            await this.recomputeTotals(qr, so.id, tenantId, userId);
            const details = await qr.manager.find(sales_order_detail_entity_1.SalesOrderDetail, {
                where: { sales_order_id: so.id },
            });
            await this.controlDeskLifecycle.syncJobForSalesOrder(qr.manager, {
                tenantId,
                userId,
                salesOrder: so,
                details,
                requiresSelection: !!so.requires_selection_assembly,
            });
            await qr.commitTransaction();
        }
        catch (err) {
            await qr.rollbackTransaction();
            throw err;
        }
        finally {
            await qr.release();
        }
        this.regenerateDocumentoOriginalPreservingLanguage(orderId, tenantId, userId).catch((err) => {
            this.logger.error('[PDF] Error regenerating DOCUMENTO_ORIGINAL after update line:', err);
        });
    }
    async removeLineItem(orderId, lineItemId, tenantId, userId) {
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const so = await qr.manager.findOne(sales_order_entity_1.SalesOrder, {
                where: { id: orderId, tenant_id: tenantId },
            });
            if (!so) {
                throw new common_1.NotFoundException(`Orden de venta no encontrada: ${orderId}`);
            }
            await this.assertLineItemsEditable(qr, so, tenantId);
            const line = await qr.manager.findOne(sales_order_detail_entity_1.SalesOrderDetail, {
                where: { id: lineItemId, sales_order_id: orderId },
            });
            if (!line) {
                throw new common_1.NotFoundException(`Línea no encontrada: ${lineItemId}`);
            }
            const remaining = await qr.manager.count(sales_order_detail_entity_1.SalesOrderDetail, {
                where: { sales_order_id: orderId },
            });
            if (remaining <= 1) {
                throw new common_1.BadRequestException('La orden debe tener al menos un producto');
            }
            await qr.manager.delete(sales_order_detail_entity_1.SalesOrderDetail, { id: lineItemId, sales_order_id: orderId });
            await this.recomputeTotals(qr, so.id, tenantId, userId);
            const details = await qr.manager.find(sales_order_detail_entity_1.SalesOrderDetail, {
                where: { sales_order_id: so.id },
            });
            await this.controlDeskLifecycle.syncJobForSalesOrder(qr.manager, {
                tenantId,
                userId,
                salesOrder: so,
                details,
                requiresSelection: !!so.requires_selection_assembly,
            });
            await qr.commitTransaction();
        }
        catch (err) {
            await qr.rollbackTransaction();
            throw err;
        }
        finally {
            await qr.release();
        }
        this.regenerateDocumentoOriginalPreservingLanguage(orderId, tenantId, userId).catch((err) => {
            this.logger.error('[PDF] Error regenerating DOCUMENTO_ORIGINAL after remove line:', err);
        });
    }
    async fulfillOrderLines(qr, salesOrderId, scope, lineItems, userId, notes) {
        for (const detail of lineItems) {
            await this.fulfillmentService.allocateFifo(detail, userId, qr.manager, scope);
        }
        await qr.manager.update(sales_order_entity_1.SalesOrder, { id: salesOrderId }, {
            general_status: 'Surtida',
            ...(notes !== undefined ? { notes } : {}),
            updated_by: userId,
        });
    }
    async insertSalesOrderLineItems(qr, salesOrderId, lineItems, userId, tenantId) {
        const saved = [];
        for (const item of lineItems) {
            const productUomRow = await this.resolveProductUom(qr, item.product_id, item.product_uom_id);
            const discountAmounts = await this.resolveLineDiscountAmounts(tenantId, item, productUomRow.id);
            const line_subtotal = Number(item.quantity) * Number(item.unit_price);
            const line_discount = discountAmounts.line_discount;
            const taxable_subtotal = Math.max(line_subtotal - line_discount, 0);
            const iva_pct = Number(item.iva_percentage || 0);
            const ieps_pct = Number(item.ieps_percentage || 0);
            const line_iva = (taxable_subtotal * iva_pct) / 100;
            const line_ieps = (taxable_subtotal * ieps_pct) / 100;
            const [baseUomRow] = await qr.manager.query(`SELECT pu.uom_catalog_id FROM product_uoms pu
         WHERE pu.product_id = ? AND pu.is_base = 1 LIMIT 1`, [item.product_id]);
            if (!baseUomRow) {
                throw new common_1.BadRequestException(`UOM base no encontrado para producto: ${item.product_id}`);
            }
            const factor = productUomRow.factor || 1;
            const qty_base = productUomRow.is_base
                ? Number(item.quantity)
                : Number(item.quantity) * factor;
            const detail = qr.manager.create(sales_order_detail_entity_1.SalesOrderDetail, {
                id: (0, uuid_1.v4)(),
                sales_order_id: salesOrderId,
                product_id: item.product_id,
                product_uom_id: productUomRow.id,
                quantity: item.quantity,
                quantity_base_uom: qty_base,
                base_uom_id: baseUomRow.uom_catalog_id,
                unit_price: (0, unit_amount_util_1.roundUnitAmount)(item.unit_price),
                discount_percentage: discountAmounts.discount_percentage,
                discount_unit: discountAmounts.discount_unit,
                product_discount_id: discountAmounts.product_discount_id,
                iva_percentage: iva_pct,
                iva_unit: Number(item.quantity) > 0 ? line_iva / Number(item.quantity) : 0,
                ieps_percentage: ieps_pct,
                ieps_unit: Number(item.quantity) > 0 ? line_ieps / Number(item.quantity) : 0,
                created_by: userId,
            });
            await qr.manager.save(sales_order_detail_entity_1.SalesOrderDetail, detail);
            saved.push(detail);
        }
        return saved;
    }
    resolveCanEditLines(status, controlDesk) {
        if (status !== 'Creada' && status !== 'En Selección') {
            return false;
        }
        if (!controlDesk) {
            return true;
        }
        if (controlDesk.status && controlDesk.status !== 'released') {
            return false;
        }
        return (controlDesk.progress?.warehouses_done ?? 0) <= 0;
    }
    async assertLineItemsEditable(qr, so, tenantId) {
        if (so.general_status !== 'Creada' && so.general_status !== 'En Selección') {
            throw new common_1.BadRequestException(`No se puede actualizar la línea de la orden de venta con estado: ${so.general_status}`);
        }
        const existingJob = await this.controlDeskLifecycle.findActiveJob(qr.manager, tenantId, so.id);
        this.controlDeskLifecycle.assertJobEditable(existingJob);
    }
    applyPersistedLineTaxes(line) {
        const qty = Number(line.quantity || 0);
        const lineSubtotal = qty * Number(line.unit_price || 0);
        const lineDiscount = qty * Number(line.discount_unit || 0);
        const taxable = Math.max(lineSubtotal - lineDiscount, 0);
        const lineIva = (taxable * Number(line.iva_percentage || 0)) / 100;
        const lineIeps = (taxable * Number(line.ieps_percentage || 0)) / 100;
        line.iva_unit = qty > 0 ? lineIva / qty : 0;
        line.ieps_unit = qty > 0 ? lineIeps / qty : 0;
    }
    async recomputeTotals(qr, salesOrderId, tenantId, userId) {
        const so = await qr.manager.findOne(sales_order_entity_1.SalesOrder, { where: { id: salesOrderId, tenant_id: tenantId } });
        if (!so) {
            throw new common_1.NotFoundException(`Sales order not found: ${salesOrderId}`);
        }
        const details = await qr.manager.find(sales_order_detail_entity_1.SalesOrderDetail, { where: { sales_order_id: salesOrderId } });
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
            const discount = await this.globalDiscountService.findByIdForOrder(so.global_discount_id, tenantId);
            so.global_discount_amount = (0, global_discount_util_1.calculateGlobalDiscountAmount)(netSubtotal, discount);
        }
        else {
            so.global_discount_amount = 0;
        }
        so.iva_total = iva_total;
        so.ieps_total = ieps_total;
        so.total = this.computeOrderTotal(subtotal, discount_total, Number(so.global_discount_amount) || 0, iva_total, ieps_total);
        so.updated_by = userId;
        await qr.manager.save(sales_order_entity_1.SalesOrder, so);
    }
    async regenerateDocumentoOriginal(id, tenantId, userId, language, keepPrevious = false) {
        const salesOrder = await this.findOne(id, tenantId);
        if (!keepPrevious) {
            await this.deleteDocumentsByType(id, SalesOrderService_1.DOC_TYPE_DOCUMENTO_ORIGINAL);
            await this.deleteDocumentsByTypeNames(id, SalesOrderService_1.DOC_TYPE_NAMES_ENTREGA);
        }
        const fullOrder = await this.loadOrderForPdf(id, tenantId);
        if (!fullOrder) {
            throw new common_1.NotFoundException(`Sales order not found: ${id}`);
        }
        const pdfBuffer = await this.pdfService.generatePdf(fullOrder, language);
        const uploadResult = await this.pdfService.uploadPdfToS3(fullOrder, pdfBuffer, 'DOCUMENTO_ORIGINAL');
        await this.documentsService.uploadDocument(id, SalesOrderService_1.DOC_TYPE_DOCUMENTO_ORIGINAL, `DOCUMENTO_ORIGINAL_${salesOrder.folio}_${language}.pdf`, uploadResult.s3Key, pdfBuffer.length, 'application/pdf', userId, language);
        await this.generateAndUploadDeliveryPdf(fullOrder, id, userId, language);
        return {
            success: true,
            message: 'DOCUMENTO_ORIGINAL regenerado exitosamente',
            document_language: language,
            keep_previous: keepPrevious,
        };
    }
    async regenerateDocumentoOriginalPreservingLanguage(id, tenantId, userId) {
        const language = await this.documentsService.getLastDocumentLanguage(id, SalesOrderService_1.DOC_TYPE_DOCUMENTO_ORIGINAL);
        return this.regenerateDocumentoOriginal(id, tenantId, userId, language);
    }
    allocationScope(so) {
        if (so.warehouse_id) {
            return { warehouseId: so.warehouse_id };
        }
        return { billingBranchId: so.billing_branch_id };
    }
    async resolveSalesOrderLocation(tenantId, dto, isPosSale) {
        if (isPosSale) {
            if (!dto.warehouse_id) {
                throw new common_1.BadRequestException('Las ventas POS requieren warehouse_id');
            }
            const warehouse = await this.warehouseRepo.findOne({
                where: { id: dto.warehouse_id, tenant_id: tenantId },
                relations: ['billing_branch'],
            });
            if (!warehouse) {
                throw new common_1.BadRequestException('Almacén no encontrado');
            }
            const branch = warehouse.billing_branch;
            if (!branch) {
                throw new common_1.BadRequestException('El almacén no pertenece a ninguna sucursal');
            }
            const billingBranchId = dto.billing_branch_id ?? branch.id;
            if (billingBranchId !== branch.id) {
                throw new common_1.BadRequestException('El almacén no pertenece a la sucursal seleccionada');
            }
            if (branch.fiscal_configuration_id !== dto.fiscal_configuration_id) {
                throw new common_1.BadRequestException('La sucursal del almacén no pertenece a la razón social seleccionada');
            }
            return {
                fiscalConfigurationId: dto.fiscal_configuration_id,
                billingBranchId,
                warehouseId: warehouse.id,
            };
        }
        let billingBranchId = dto.billing_branch_id ?? null;
        let warehouseId = dto.warehouse_id ?? null;
        if (!billingBranchId && warehouseId) {
            const warehouse = await this.warehouseRepo.findOne({
                where: { id: warehouseId, tenant_id: tenantId },
            });
            if (!warehouse) {
                throw new common_1.BadRequestException('Almacén no encontrado');
            }
            if (!warehouse.billing_branch_id) {
                throw new common_1.BadRequestException('El almacén no pertenece a ninguna sucursal');
            }
            billingBranchId = warehouse.billing_branch_id;
        }
        if (!billingBranchId) {
            throw new common_1.BadRequestException('Las órdenes manuales requieren billing_branch_id');
        }
        const branch = await this.billingBranchRepo.findOne({
            where: { id: billingBranchId },
            relations: ['fiscal_configuration'],
        });
        if (!branch || branch.fiscal_configuration?.tenant_id !== tenantId) {
            throw new common_1.BadRequestException('Sucursal no encontrada');
        }
        if (branch.fiscal_configuration_id !== dto.fiscal_configuration_id) {
            throw new common_1.BadRequestException('La sucursal no pertenece a la razón social seleccionada');
        }
        if (warehouseId) {
            const warehouse = await this.warehouseRepo.findOne({
                where: { id: warehouseId, tenant_id: tenantId },
            });
            if (!warehouse) {
                throw new common_1.BadRequestException('Almacén no encontrado');
            }
            if (warehouse.billing_branch_id !== billingBranchId) {
                throw new common_1.BadRequestException('El almacén no pertenece a la sucursal seleccionada');
            }
        }
        return {
            fiscalConfigurationId: dto.fiscal_configuration_id,
            billingBranchId,
            warehouseId,
        };
    }
};
exports.SalesOrderService = SalesOrderService;
exports.SalesOrderService = SalesOrderService = SalesOrderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sales_order_entity_1.SalesOrder)),
    __param(1, (0, typeorm_1.InjectRepository)(sales_order_detail_entity_1.SalesOrderDetail)),
    __param(2, (0, typeorm_1.InjectRepository)(sales_order_batch_allocation_entity_1.SalesOrderBatchAllocation)),
    __param(6, (0, common_1.Inject)((0, common_1.forwardRef)(() => pos_shifts_service_1.PosShiftsService))),
    __param(12, (0, typeorm_1.InjectRepository)(pos_sale_collection_entity_1.PosSaleCollection)),
    __param(13, (0, typeorm_1.InjectRepository)(sales_order_payment_entity_1.SalesOrderPayment)),
    __param(14, (0, typeorm_1.InjectRepository)(sales_order_payment_document_entity_1.SalesOrderPaymentDocument)),
    __param(15, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(16, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(17, (0, typeorm_1.InjectRepository)(billing_branch_entity_1.BillingBranch)),
    __param(18, (0, typeorm_1.InjectRepository)(warehouse_entity_1.Warehouse)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        sales_order_folio_service_1.SalesOrderFolioService,
        sales_order_fulfillment_service_1.SalesOrderFulfillmentService,
        typeorm_2.DataSource,
        pos_shifts_service_1.PosShiftsService,
        product_discount_service_1.ProductDiscountService,
        global_discount_service_1.GlobalDiscountService,
        sales_order_pdf_service_1.SalesOrderPdfService,
        sales_order_documents_service_1.SalesOrderDocumentsService,
        s3_service_1.S3Service,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        electronic_invoice_service_1.ElectronicInvoiceService,
        control_desk_lifecycle_service_1.ControlDeskLifecycleService,
        warehouse_control_service_1.WarehouseControlService])
], SalesOrderService);
//# sourceMappingURL=sales-order.service.js.map