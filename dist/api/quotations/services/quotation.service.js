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
var QuotationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const quotation_entity_1 = require("../../../entities/quotations/quotation.entity");
const quotation_detail_entity_1 = require("../../../entities/quotations/quotation-detail.entity");
const user_entity_1 = require("../../../entities/users/user.entity");
const customer_entity_1 = require("../../../entities/customers/customer.entity");
const billing_branch_entity_1 = require("../../../entities/billing/billing-branch.entity");
const warehouse_entity_1 = require("../../../entities/warehouse/warehouse.entity");
const unit_amount_util_1 = require("../../../common/utils/unit-amount.util");
const quotation_folio_service_1 = require("./quotation-folio.service");
const quotation_pdf_service_1 = require("./quotation-pdf.service");
const quotation_documents_service_1 = require("./quotation-documents.service");
const pos_shifts_service_1 = require("../../pos-shifts/pos-shifts.service");
const product_discount_service_1 = require("../../products/product-discount.service");
const global_discount_service_1 = require("../../global-discounts/global-discount.service");
const product_discount_util_1 = require("../../products/utils/product-discount.util");
const global_discount_util_1 = require("../../global-discounts/utils/global-discount.util");
const quotation_discount_mapper_1 = require("../mappers/quotation-discount.mapper");
const document_language_enum_1 = require("../../../common/enums/document-language.enum");
const pos_sale_collection_mapper_1 = require("../../pos-shifts/mappers/pos-sale-collection.mapper");
const sales_order_service_1 = require("../../sales-orders/services/sales-order.service");
let QuotationService = class QuotationService {
    static { QuotationService_1 = this; }
    quotationRepo;
    userRepo;
    customerRepo;
    billingBranchRepo;
    warehouseRepo;
    folioService;
    dataSource;
    posShiftsService;
    productDiscountService;
    globalDiscountService;
    pdfService;
    documentsService;
    salesOrderService;
    logger = new common_1.Logger(QuotationService_1.name);
    static DOC_TYPE_DOCUMENTO_ORIGINAL = 1;
    constructor(quotationRepo, userRepo, customerRepo, billingBranchRepo, warehouseRepo, folioService, dataSource, posShiftsService, productDiscountService, globalDiscountService, pdfService, documentsService, salesOrderService) {
        this.quotationRepo = quotationRepo;
        this.userRepo = userRepo;
        this.customerRepo = customerRepo;
        this.billingBranchRepo = billingBranchRepo;
        this.warehouseRepo = warehouseRepo;
        this.folioService = folioService;
        this.dataSource = dataSource;
        this.posShiftsService = posShiftsService;
        this.productDiscountService = productDiscountService;
        this.globalDiscountService = globalDiscountService;
        this.pdfService = pdfService;
        this.documentsService = documentsService;
        this.salesOrderService = salesOrderService;
    }
    async create(dto, tenantId, userId) {
        const isPos = dto.quotation_type === 'POS';
        if (!isPos && dto.customer_id == null) {
            throw new common_1.BadRequestException('Las cotizaciones manuales requieren customer_id');
        }
        if (isPos && !dto.seller_user_id) {
            throw new common_1.BadRequestException('Las cotizaciones POS requieren seller_user_id');
        }
        const customerId = isPos
            ? dto.customer_id ?? (await this.posShiftsService.resolveWalkInCustomerId(tenantId))
            : dto.customer_id;
        const location = await this.resolveLocation(tenantId, dto, isPos);
        const sellerUserId = isPos ? dto.seller_user_id : (dto.seller_user_id ?? userId);
        const assignedSellerUserId = await this.resolveAssignedSellerUserId(tenantId, customerId, sellerUserId, dto.assigned_seller_user_id);
        if (isPos) {
            await this.posShiftsService.assertPosWarehouseForTerminal(tenantId, userId, location.warehouseId);
        }
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const folio = await this.folioService.generateFolio(tenantId);
            const quotation = qr.manager.create(quotation_entity_1.Quotation, {
                id: (0, uuid_1.v4)(),
                tenant_id: tenantId,
                folio,
                fiscal_configuration_id: location.fiscalConfigurationId,
                billing_branch_id: location.billingBranchId,
                warehouse_id: location.warehouseId,
                customer_id: customerId,
                expected_delivery_date: new Date(dto.expected_delivery_date),
                quotation_type: dto.quotation_type || 'MANUAL',
                fiscal_razon_social: dto.fiscal_razon_social ?? null,
                general_status: 'Creada',
                notes: dto.notes ?? null,
                created_by: userId,
                terminal_user_id: isPos ? userId : null,
                seller_user_id: sellerUserId,
                assigned_seller_user_id: assignedSellerUserId,
            });
            const saved = await qr.manager.save(quotation_entity_1.Quotation, quotation);
            await this.insertLineItems(qr, saved.id, dto.line_items, userId, tenantId);
            await this.recomputeTotals(qr, saved, tenantId, dto.global_discount_id);
            await qr.commitTransaction();
            this.generateAndUploadPdf(saved.id, tenantId, userId).catch((err) => {
                this.logger.error('[PDF] Error generando PDF de cotización:', err);
            });
            return this.findOne(saved.id, tenantId);
        }
        catch (err) {
            await qr.rollbackTransaction();
            throw err;
        }
        finally {
            await qr.release();
        }
    }
    async replace(id, dto, tenantId, userId) {
        const existing = await this.findOne(id, tenantId);
        if (existing.general_status !== 'Creada') {
            throw new common_1.BadRequestException(`No se puede editar una cotización con estado: ${existing.general_status}`);
        }
        const isPos = (dto.quotation_type || existing.quotation_type) === 'POS';
        const location = await this.resolveLocation(tenantId, dto, isPos);
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            await qr.manager.delete(quotation_detail_entity_1.QuotationDetail, { quotation_id: id });
            const quotation = await qr.manager.findOne(quotation_entity_1.Quotation, {
                where: { id, tenant_id: tenantId },
            });
            if (!quotation) {
                throw new common_1.NotFoundException(`Cotización no encontrada: ${id}`);
            }
            quotation.fiscal_configuration_id = dto.fiscal_configuration_id;
            quotation.billing_branch_id = location.billingBranchId;
            quotation.warehouse_id = location.warehouseId;
            if (dto.customer_id != null) {
                quotation.customer_id = dto.customer_id;
            }
            quotation.expected_delivery_date = new Date(dto.expected_delivery_date);
            quotation.quotation_type = dto.quotation_type || quotation.quotation_type || 'MANUAL';
            if (dto.fiscal_razon_social !== undefined) {
                quotation.fiscal_razon_social = dto.fiscal_razon_social;
            }
            if (dto.notes !== undefined) {
                quotation.notes = dto.notes;
            }
            if (dto.seller_user_id) {
                quotation.seller_user_id = dto.seller_user_id;
            }
            quotation.updated_by = userId;
            await qr.manager.save(quotation_entity_1.Quotation, quotation);
            await this.insertLineItems(qr, id, dto.line_items, userId, tenantId);
            await this.recomputeTotals(qr, quotation, tenantId, dto.global_discount_id);
            await qr.commitTransaction();
            this.regenerateDocumentoOriginalPreservingLanguage(id, tenantId, userId).catch((err) => {
                this.logger.error('[PDF] Error regenerando PDF tras editar cotización:', err);
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
    async findAll(tenantId, filters) {
        const { search, general_status, quotation_type, fiscal_configuration_id, billing_branch_id, customer_id, created_from, created_to, page = 1, limit = 20, sort_by = 'created_at', sort_order = 'DESC', } = filters;
        const qb = this.quotationRepo
            .createQueryBuilder('qt')
            .leftJoinAndSelect('qt.customer', 'customer')
            .leftJoinAndSelect('qt.fiscal_configuration', 'fiscal_configuration')
            .leftJoinAndSelect('qt.billing_branch', 'billing_branch')
            .leftJoinAndSelect('qt.warehouse', 'warehouse')
            .leftJoinAndSelect('qt.seller_user', 'seller_user')
            .where('qt.tenant_id = :tenantId', { tenantId });
        if (search) {
            qb.andWhere('(qt.folio LIKE :s OR customer.name LIKE :s OR customer.lastname LIKE :s OR CONCAT(customer.name, \' \', COALESCE(customer.lastname, \'\')) LIKE :s)', { s: `%${search}%` });
        }
        if (general_status?.length) {
            if (general_status.length === 1) {
                qb.andWhere('qt.general_status = :general_status', {
                    general_status: general_status[0],
                });
            }
            else {
                qb.andWhere('qt.general_status IN (:...general_statuses)', {
                    general_statuses: general_status,
                });
            }
        }
        if (quotation_type) {
            qb.andWhere('qt.quotation_type = :quotation_type', { quotation_type });
        }
        if (fiscal_configuration_id) {
            qb.andWhere('qt.fiscal_configuration_id = :fiscal_configuration_id', {
                fiscal_configuration_id,
            });
        }
        if (billing_branch_id) {
            qb.andWhere('(qt.billing_branch_id = :billing_branch_id OR (qt.billing_branch_id IS NULL AND warehouse.billing_branch_id = :billing_branch_id))', { billing_branch_id });
        }
        if (customer_id) {
            qb.andWhere('qt.customer_id = :customer_id', { customer_id });
        }
        if (created_from) {
            qb.andWhere('qt.created_at >= :created_from', {
                created_from: new Date(created_from),
            });
        }
        if (created_to) {
            qb.andWhere('qt.created_at <= :created_to', {
                created_to: new Date(created_to),
            });
        }
        const sortCol = sort_by === 'total'
            ? 'qt.total'
            : sort_by === 'folio'
                ? 'qt.folio'
                : 'qt.created_at';
        qb.orderBy(sortCol, sort_order)
            .skip((page - 1) * limit)
            .take(limit);
        const [rows, total] = await qb.getManyAndCount();
        return {
            data: rows.map((qt) => this.mapLocation(qt)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id, tenantId) {
        const quotation = await this.quotationRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: [
                'customer',
                'billing_branch',
                'warehouse',
                'warehouse.billing_branch',
                'fiscal_configuration',
                'seller_user',
                'assigned_seller_user',
                'terminal_user',
                'creator',
                'line_items',
                'line_items.product',
                'line_items.product_uom',
                'line_items.product_uom.uom',
                'line_items.product_discount',
                'line_items.base_uom',
                'global_discount',
            ],
        });
        if (!quotation) {
            throw new common_1.NotFoundException(`Cotización no encontrada: ${id}`);
        }
        return quotation;
    }
    async findOneDetail(id, tenantId) {
        const quotation = await this.findOne(id, tenantId);
        const customerSummary = (0, pos_sale_collection_mapper_1.mapPosCustomer)(quotation.customer);
        const appliedLineDiscounts = (0, quotation_discount_mapper_1.mapAppliedLineDiscountsFromQuotation)(quotation);
        const discountSummary = (0, quotation_discount_mapper_1.mapOrderDiscountSummary)(quotation);
        const header = {
            ...this.mapLocation(quotation),
            customer_display_name: customerSummary?.display_name ?? (0, pos_sale_collection_mapper_1.formatCustomerDisplayName)(quotation.customer),
            customer_summary: customerSummary,
            seller_user: (0, pos_sale_collection_mapper_1.mapPosUser)(quotation.seller_user),
            assigned_seller_user: (0, pos_sale_collection_mapper_1.mapPosUser)(quotation.assigned_seller_user),
            terminal_user: (0, pos_sale_collection_mapper_1.mapPosUser)(quotation.terminal_user),
            applied_line_discounts: appliedLineDiscounts,
            applied_global_discount: discountSummary.global_discount,
            discount_summary: discountSummary,
            can_convert: quotation.general_status === 'Creada',
            can_cancel: quotation.general_status === 'Creada',
            can_edit: quotation.general_status === 'Creada',
            can_send: quotation.general_status !== 'Cancelada',
            customer_email: quotation.customer?.email?.trim() ||
                quotation.customer?.additional_email?.trim() ||
                null,
            converted_to_sales_order_id: quotation.converted_to_sales_order_id,
        };
        return {
            header,
            line_items: (quotation.line_items ?? []).map(quotation_discount_mapper_1.mapLineItemWithDiscount),
            discount_summary: discountSummary,
            applied_line_discounts: appliedLineDiscounts,
            applied_global_discount: discountSummary.global_discount,
        };
    }
    async updateNotes(id, dto, tenantId, userId) {
        const quotation = await this.findOne(id, tenantId);
        if (quotation.general_status === 'Cancelada') {
            throw new common_1.BadRequestException('No se pueden editar las notas de una cotización cancelada');
        }
        quotation.notes = dto.notes === undefined ? quotation.notes : dto.notes;
        quotation.updated_by = userId;
        await this.quotationRepo.save(quotation);
        return this.findOneDetail(id, tenantId);
    }
    async cancel(id, tenantId, userId) {
        const quotation = await this.findOne(id, tenantId);
        if (quotation.general_status === 'Cancelada') {
            throw new common_1.BadRequestException('La cotización ya está cancelada');
        }
        if (quotation.general_status === 'Convertida') {
            throw new common_1.BadRequestException('No se puede cancelar una cotización convertida. Cancela la orden de venta.');
        }
        quotation.general_status = 'Cancelada';
        quotation.updated_by = userId;
        await this.quotationRepo.save(quotation);
        return this.findOne(id, tenantId);
    }
    async convert(id, dto, tenantId, userId) {
        const quotation = await this.findOne(id, tenantId);
        if (quotation.general_status !== 'Creada') {
            throw new common_1.BadRequestException(`Solo se puede convertir una cotización en estado Creada (actual: ${quotation.general_status})`);
        }
        const expectedDate = this.toDateString(quotation.expected_delivery_date);
        const notes = [quotation.notes, dto.notes, `Convertida desde ${quotation.folio}`]
            .filter((part) => part && String(part).trim())
            .join(' | ');
        const createDto = {
            fiscal_configuration_id: quotation.fiscal_configuration_id,
            billing_branch_id: quotation.billing_branch_id ?? undefined,
            warehouse_id: quotation.warehouse_id ?? undefined,
            customer_id: dto.customer_id ?? quotation.customer_id,
            expected_delivery_date: expectedDate,
            sales_order_type: quotation.quotation_type === 'POS' ? 'POS' : 'MANUAL',
            seller_user_id: quotation.seller_user_id ?? undefined,
            assigned_seller_user_id: quotation.assigned_seller_user_id ?? undefined,
            fiscal_razon_social: quotation.fiscal_razon_social ?? undefined,
            notes,
            global_discount_id: quotation.global_discount_id ?? undefined,
            line_items: (quotation.line_items ?? []).map((line) => ({
                product_id: line.product_id,
                product_uom_id: line.product_uom_id,
                quantity: Number(line.quantity),
                unit_price: Number(line.unit_price),
                discount_percentage: Number(line.discount_percentage || 0),
                product_discount_id: line.product_discount_id ?? undefined,
                iva_percentage: Number(line.iva_percentage || 0),
                ieps_percentage: Number(line.ieps_percentage || 0),
            })),
        };
        const salesOrder = await this.salesOrderService.create(createDto, tenantId, userId, { fromQuotation: true });
        await this.salesOrderService.linkConvertedFromQuotation(salesOrder.id, quotation.id, tenantId);
        quotation.general_status = 'Convertida';
        quotation.converted_to_sales_order_id = salesOrder.id;
        quotation.updated_by = userId;
        await this.quotationRepo.save(quotation);
        return {
            quotation: await this.findOneDetail(id, tenantId),
            sales_order: {
                id: salesOrder.id,
                folio: salesOrder.folio,
                general_status: salesOrder.general_status,
                payment_status: salesOrder.payment_status,
                sales_order_type: salesOrder.sales_order_type,
                total: salesOrder.total,
                converted_from_quotation_id: quotation.id,
            },
        };
    }
    async regenerateDocumentoOriginal(id, tenantId, userId, language, keepPrevious = false) {
        await this.findOne(id, tenantId);
        if (!keepPrevious) {
            await this.documentsService.deleteDocumentsByType(id, QuotationService_1.DOC_TYPE_DOCUMENTO_ORIGINAL);
        }
        await this.generateAndUploadPdf(id, tenantId, userId, language);
        return {
            success: true,
            message: 'DOCUMENTO_ORIGINAL regenerado exitosamente',
            document_language: language,
            keep_previous: keepPrevious,
        };
    }
    async regenerateDocumentoOriginalPreservingLanguage(id, tenantId, userId) {
        const language = await this.documentsService.getLastDocumentLanguage(id, QuotationService_1.DOC_TYPE_DOCUMENTO_ORIGINAL);
        return this.regenerateDocumentoOriginal(id, tenantId, userId, language);
    }
    async generateAndUploadPdf(quotationId, tenantId, userId, language = document_language_enum_1.DocumentLanguage.ES) {
        try {
            const full = await this.loadForPdf(quotationId, tenantId);
            if (!full) {
                this.logger.error(`[PDF] No se pudo cargar cotización: ${quotationId}`);
                return;
            }
            const pdfBuffer = await this.pdfService.generatePdf(full, language);
            const uploadResult = await this.pdfService.uploadPdfToS3(full, pdfBuffer);
            await this.documentsService.uploadDocument(quotationId, QuotationService_1.DOC_TYPE_DOCUMENTO_ORIGINAL, `DOCUMENTO_ORIGINAL_${full.folio}_${language}.pdf`, uploadResult.s3Key, pdfBuffer.length, 'application/pdf', userId, language);
        }
        catch (error) {
            this.logger.error('[PDF] Error en generateAndUploadPdf:', error);
        }
    }
    async loadForPdf(id, tenantId) {
        return this.quotationRepo
            .createQueryBuilder('qt')
            .where('qt.id = :id AND qt.tenant_id = :tenantId', { id, tenantId })
            .leftJoinAndSelect('qt.fiscal_configuration', 'fiscal_config')
            .leftJoinAndSelect('qt.billing_branch', 'billing_branch')
            .leftJoinAndSelect('qt.warehouse', 'warehouse')
            .leftJoinAndSelect('warehouse.billing_branch', 'warehouse_branch')
            .leftJoinAndSelect('qt.customer', 'customer')
            .leftJoinAndSelect('qt.creator', 'creator')
            .leftJoinAndSelect('qt.line_items', 'line_items')
            .leftJoinAndSelect('line_items.product', 'product')
            .leftJoinAndSelect('line_items.product_uom', 'product_uom')
            .leftJoinAndSelect('product_uom.uom', 'uom')
            .leftJoinAndSelect('qt.global_discount', 'global_discount')
            .getOne();
    }
    async insertLineItems(qr, quotationId, lineItems, userId, tenantId) {
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
            const detail = qr.manager.create(quotation_detail_entity_1.QuotationDetail, {
                id: (0, uuid_1.v4)(),
                quotation_id: quotationId,
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
            await qr.manager.save(quotation_detail_entity_1.QuotationDetail, detail);
            saved.push(detail);
        }
        return saved;
    }
    async recomputeTotals(qr, quotation, tenantId, globalDiscountId) {
        const details = await qr.manager.find(quotation_detail_entity_1.QuotationDetail, {
            where: { quotation_id: quotation.id },
        });
        let subtotal = 0;
        let discount_total = 0;
        let iva_total = 0;
        let ieps_total = 0;
        for (const detail of details) {
            const qty = Number(detail.quantity);
            const line_subtotal = qty * Number(detail.unit_price);
            const line_discount = qty * Number(detail.discount_unit || 0);
            subtotal += line_subtotal;
            discount_total += line_discount;
            iva_total += qty * Number(detail.iva_unit || 0);
            ieps_total += qty * Number(detail.ieps_unit || 0);
        }
        const globalDiscountAmounts = await this.resolveGlobalDiscountAmounts(tenantId, globalDiscountId, subtotal - discount_total);
        quotation.subtotal = Number(subtotal.toFixed(2));
        quotation.discount_total = Number(discount_total.toFixed(2));
        quotation.global_discount_id = globalDiscountAmounts.global_discount_id;
        quotation.global_discount_amount = globalDiscountAmounts.global_discount_amount;
        quotation.iva_total = Number(iva_total.toFixed(2));
        quotation.ieps_total = Number(ieps_total.toFixed(2));
        quotation.total = Number((subtotal -
            discount_total -
            globalDiscountAmounts.global_discount_amount +
            iva_total +
            ieps_total).toFixed(2));
        await qr.manager.save(quotation_entity_1.Quotation, quotation);
    }
    async resolveProductUom(qr, productId, providedUomId) {
        const [productUomRow] = await qr.manager.query(`SELECT pu.id, pu.factor, pu.is_base, pu.uom_catalog_id
       FROM product_uoms pu
       WHERE pu.id = ? AND pu.product_id = ?
       LIMIT 1`, [providedUomId, productId]);
        if (productUomRow)
            return productUomRow;
        const [byCatalog] = await qr.manager.query(`SELECT pu.id, pu.factor, pu.is_base, pu.uom_catalog_id
       FROM product_uoms pu
       WHERE pu.product_id = ? AND pu.uom_catalog_id = ?
       LIMIT 1`, [productId, providedUomId]);
        if (byCatalog)
            return byCatalog;
        throw new common_1.BadRequestException(`UOM no encontrado: ${providedUomId}`);
    }
    async resolveLineDiscountAmounts(tenantId, item, productUomId) {
        if (item.product_discount_id) {
            const discount = await this.productDiscountService.findByIdForOrder(item.product_discount_id, item.product_id, tenantId);
            (0, product_discount_util_1.assertProductDiscountApplicable)(discount, item.product_id, productUomId);
            return {
                ...(0, product_discount_util_1.calculateProductDiscountLineAmounts)(item.unit_price, item.quantity, discount),
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
    async resolveAssignedSellerUserId(tenantId, customerId, sellerUserId, explicitAssignedSellerId) {
        if (explicitAssignedSellerId) {
            const explicit = await this.userRepo.findOne({
                where: { id: explicitAssignedSellerId, tenant_id: tenantId },
            });
            if (!explicit) {
                throw new common_1.BadRequestException('Comisionado no válido');
            }
            return explicit.id;
        }
        const customer = await this.customerRepo.findOne({
            where: { id: customerId, tenant_id: tenantId },
            select: ['id', 'assigned_seller_user_id'],
        });
        if (customer?.assigned_seller_user_id) {
            return customer.assigned_seller_user_id;
        }
        return sellerUserId;
    }
    async resolveLocation(tenantId, dto, isPos) {
        if (isPos) {
            if (!dto.warehouse_id) {
                throw new common_1.BadRequestException('Las cotizaciones POS requieren warehouse_id');
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
            if (!warehouse?.billing_branch_id) {
                throw new common_1.BadRequestException('El almacén no pertenece a ninguna sucursal');
            }
            billingBranchId = warehouse.billing_branch_id;
        }
        if (!billingBranchId) {
            throw new common_1.BadRequestException('Las cotizaciones manuales requieren billing_branch_id');
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
        return {
            fiscalConfigurationId: dto.fiscal_configuration_id,
            billingBranchId,
            warehouseId,
        };
    }
    mapLocation(qt) {
        const branch = qt.billing_branch ?? qt.warehouse?.billing_branch ?? null;
        const fiscal = qt.fiscal_configuration ?? null;
        const { warehouse: _warehouse, ...rest } = qt;
        return {
            ...rest,
            razon_social: fiscal?.razon_social ?? qt.fiscal_razon_social ?? null,
            sucursal: branch?.code ?? null,
            fiscal_configuration: fiscal
                ? {
                    id: fiscal.id,
                    razon_social: fiscal.razon_social,
                    rfc: fiscal.rfc,
                }
                : null,
            billing_branch_id: qt.billing_branch_id ?? qt.warehouse?.billing_branch_id ?? branch?.id ?? null,
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
    toDateString(value) {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
            return value.slice(0, 10);
        }
        const date = new Date(value);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
};
exports.QuotationService = QuotationService;
exports.QuotationService = QuotationService = QuotationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(quotation_entity_1.Quotation)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(3, (0, typeorm_1.InjectRepository)(billing_branch_entity_1.BillingBranch)),
    __param(4, (0, typeorm_1.InjectRepository)(warehouse_entity_1.Warehouse)),
    __param(7, (0, common_1.Inject)((0, common_1.forwardRef)(() => pos_shifts_service_1.PosShiftsService))),
    __param(12, (0, common_1.Inject)((0, common_1.forwardRef)(() => sales_order_service_1.SalesOrderService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        quotation_folio_service_1.QuotationFolioService,
        typeorm_2.DataSource,
        pos_shifts_service_1.PosShiftsService,
        product_discount_service_1.ProductDiscountService,
        global_discount_service_1.GlobalDiscountService,
        quotation_pdf_service_1.QuotationPdfService,
        quotation_documents_service_1.QuotationDocumentsService,
        sales_order_service_1.SalesOrderService])
], QuotationService);
//# sourceMappingURL=quotation.service.js.map