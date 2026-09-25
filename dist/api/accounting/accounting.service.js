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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sales_order_entity_1 = require("../../entities/sales-orders/sales-order.entity");
const pos_sale_collection_entity_1 = require("../../entities/pos/pos-sale-collection.entity");
const pos_daily_shift_entity_1 = require("../../entities/pos/pos-daily-shift.entity");
const pos_daily_shift_status_enum_1 = require("../../entities/pos/pos-daily-shift-status.enum");
const electronic_invoice_entity_1 = require("../../entities/electronic-invoicing/electronic-invoice.entity");
const purchase_order_batch_entity_1 = require("../../entities/purchase-orders/purchase-order-batch.entity");
const user_entity_1 = require("../../entities/users/user.entity");
const pos_user_type_enum_1 = require("../../entities/users/pos-user-type.enum");
const pos_shifts_service_1 = require("../pos-shifts/pos-shifts.service");
const query_accounting_base_dto_1 = require("./dto/query-accounting-base.dto");
const pos_sale_collection_mapper_1 = require("../pos-shifts/mappers/pos-sale-collection.mapper");
const unclosed_shift_alert_1 = require("../pos-shifts/utils/unclosed-shift-alert");
const sales_order_payment_display_util_1 = require("../sales-orders/utils/sales-order-payment-display.util");
const excel_export_util_1 = require("../../common/utils/excel-export.util");
const WALK_IN_FISCAL_NAME = 'VENTA DE MOSTRADOR';
const WALK_IN_DISPLAY_NAME = 'Público en General';
let AccountingService = class AccountingService {
    salesOrderRepo;
    collectionRepo;
    dailyShiftRepo;
    electronicInvoiceRepo;
    purchaseOrderRepo;
    userRepo;
    posShiftsService;
    constructor(salesOrderRepo, collectionRepo, dailyShiftRepo, electronicInvoiceRepo, purchaseOrderRepo, userRepo, posShiftsService) {
        this.salesOrderRepo = salesOrderRepo;
        this.collectionRepo = collectionRepo;
        this.dailyShiftRepo = dailyShiftRepo;
        this.electronicInvoiceRepo = electronicInvoiceRepo;
        this.purchaseOrderRepo = purchaseOrderRepo;
        this.userRepo = userRepo;
        this.posShiftsService = posShiftsService;
    }
    async getPosSummary(tenantId, filters) {
        const { dateFrom, dateTo } = this.resolveDateRange(filters.period ?? query_accounting_base_dto_1.AccountingReportPeriod.MONTH, filters.date_from, filters.date_to);
        const terminalRows = await this.salesOrderRepo
            .createQueryBuilder('so')
            .innerJoin('so.terminal_user', 'terminal_user')
            .innerJoin('so.warehouse', 'warehouse')
            .select('terminal_user.id', 'terminal_user_id')
            .addSelect('terminal_user.first_name', 'first_name')
            .addSelect('terminal_user.last_name', 'last_name')
            .addSelect('COUNT(so.id)', 'sales_count')
            .addSelect('COALESCE(SUM(so.total), 0)', 'amount_sold')
            .where('so.tenant_id = :tenantId', { tenantId })
            .andWhere('warehouse.billing_branch_id = :branchId', {
            branchId: filters.billing_branch_id,
        })
            .andWhere('so.sales_order_type = :posType', { posType: 'POS' })
            .andWhere('so.general_status != :cancelled', { cancelled: 'Cancelada' })
            .andWhere('terminal_user.pos_user_type IN (:...sellTypes)', {
            sellTypes: pos_user_type_enum_1.POS_SELL_TYPES,
        })
            .andWhere('so.created_at >= :dateFrom', { dateFrom })
            .andWhere('so.created_at <= :dateTo', { dateTo })
            .groupBy('terminal_user.id')
            .addGroupBy('terminal_user.first_name')
            .addGroupBy('terminal_user.last_name')
            .orderBy('sales_count', 'DESC')
            .getRawMany();
        const stampedInvoiceSql = this.stampedInvoiceExistsSql('so');
        const walkInSql = this.walkInCustomerSql('customer');
        const collectionRows = await this.collectionRepo
            .createQueryBuilder('collection')
            .innerJoin('collection.sales_order', 'so')
            .innerJoin('so.warehouse', 'warehouse')
            .innerJoin('collection.customer', 'customer')
            .select('COUNT(collection.id)', 'orders_collected')
            .addSelect('COALESCE(SUM(collection.order_total_mxn), 0)', 'amount_collected')
            .addSelect(`SUM(CASE WHEN ${walkInSql} AND NOT ${stampedInvoiceSql} THEN 1 ELSE 0 END)`, 'walk_in_count')
            .addSelect(`SUM(CASE WHEN ${stampedInvoiceSql} THEN 1 ELSE 0 END)`, 'invoiced_count')
            .where('collection.tenant_id = :tenantId', { tenantId })
            .andWhere('warehouse.billing_branch_id = :branchId', {
            branchId: filters.billing_branch_id,
        })
            .andWhere('collection.created_at >= :dateFrom', { dateFrom })
            .andWhere('collection.created_at <= :dateTo', { dateTo })
            .setParameters({
            walkInFiscal: WALK_IN_FISCAL_NAME,
            walkInName: WALK_IN_DISPLAY_NAME,
        })
            .getRawOne();
        const shiftStats = await this.dailyShiftRepo
            .createQueryBuilder('shift')
            .leftJoin('shift.partial_shifts', 'partial')
            .select('COUNT(DISTINCT shift.id)', 'daily_shifts_count')
            .addSelect('COUNT(partial.id)', 'partial_shifts_count')
            .where('shift.tenant_id = :tenantId', { tenantId })
            .andWhere('shift.billing_branch_id = :branchId', {
            branchId: filters.billing_branch_id,
        })
            .andWhere('shift.created_at >= :dateFrom', { dateFrom })
            .andWhere('shift.created_at <= :dateTo', { dateTo })
            .getRawOne();
        const openDailyShift = await this.dailyShiftRepo.findOne({
            where: {
                tenant_id: tenantId,
                billing_branch_id: filters.billing_branch_id,
                status: pos_daily_shift_status_enum_1.PosDailyShiftStatus.OPEN,
            },
            relations: ['partial_shifts'],
            order: { created_at: 'DESC' },
        });
        const ordersCollected = Number(collectionRows?.orders_collected || 0);
        const amountCollected = Number(collectionRows?.amount_collected || 0);
        const walkInCount = Number(collectionRows?.walk_in_count || 0);
        const invoicedCount = Number(collectionRows?.invoiced_count || 0);
        const dailyShiftsCount = Number(shiftStats?.daily_shifts_count || 0);
        const partialShiftsCount = Number(shiftStats?.partial_shifts_count || 0);
        const cobranzaTerminal = await this.userRepo.findOne({
            where: {
                tenant_id: tenantId,
                billing_branch_id: filters.billing_branch_id,
                is_pos_user: true,
                pos_user_type: (0, typeorm_2.In)(pos_user_type_enum_1.POS_COLLECT_TYPES),
            },
        });
        const salesTerminals = terminalRows.map((row) => ({
            terminal_user_id: row.terminal_user_id,
            terminal_name: this.buildUserName(row.first_name, row.last_name),
            sales_count: Number(row.sales_count || 0),
            amount_sold: Number(row.amount_sold || 0),
        }));
        const unclosedShiftAlert = (0, unclosed_shift_alert_1.buildUnclosedShiftAlert)(openDailyShift);
        return {
            filters_applied: {
                billing_branch_id: filters.billing_branch_id,
                period: filters.period ?? query_accounting_base_dto_1.AccountingReportPeriod.MONTH,
                date_from: dateFrom.toISOString(),
                date_to: dateTo.toISOString(),
            },
            unclosed_shift_alert: unclosedShiftAlert,
            sales_terminals: salesTerminals,
            collection_terminal: {
                terminal_user_id: cobranzaTerminal?.id ?? null,
                terminal_name: cobranzaTerminal
                    ? this.buildUserName(cobranzaTerminal.first_name, cobranzaTerminal.last_name)
                    : null,
                orders_collected: ordersCollected,
                amount_collected: amountCollected,
                walk_in_count: walkInCount,
                invoiced_count: invoicedCount,
                daily_shifts_count: dailyShiftsCount,
                partial_shifts_count: partialShiftsCount,
                open_daily_shift: openDailyShift
                    ? {
                        id: openDailyShift.id,
                        shift_date: openDailyShift.shift_date,
                        status: openDailyShift.status,
                        is_previous_day: (0, unclosed_shift_alert_1.isPreviousDayOpenShift)(openDailyShift.shift_date),
                        partial_shifts_count: openDailyShift.partial_shifts?.length ?? 0,
                    }
                    : null,
            },
        };
    }
    async getPosTerminalSales(tenantId, terminalUserId, filters) {
        const terminalUser = await this.userRepo.findOne({
            where: { id: terminalUserId, tenant_id: tenantId },
        });
        if (!terminalUser) {
            throw new common_1.NotFoundException('Terminal POS no encontrada');
        }
        const { dateFrom, dateTo } = this.resolveDateRange(filters.period ?? query_accounting_base_dto_1.AccountingReportPeriod.MONTH, filters.date_from, filters.date_to);
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const qb = this.salesOrderRepo
            .createQueryBuilder('so')
            .leftJoinAndSelect('so.customer', 'customer')
            .leftJoinAndSelect('so.seller_user', 'seller_user')
            .innerJoin('so.warehouse', 'warehouse')
            .where('so.tenant_id = :tenantId', { tenantId })
            .andWhere('so.terminal_user_id = :terminalUserId', { terminalUserId })
            .andWhere('warehouse.billing_branch_id = :branchId', {
            branchId: filters.billing_branch_id,
        })
            .andWhere('so.sales_order_type = :posType', { posType: 'POS' })
            .andWhere('so.general_status != :cancelled', { cancelled: 'Cancelada' })
            .andWhere('so.created_at >= :dateFrom', { dateFrom })
            .andWhere('so.created_at <= :dateTo', { dateTo })
            .orderBy('so.created_at', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        const [orders, total] = await qb.getManyAndCount();
        return {
            terminal_user_id: terminalUserId,
            terminal_name: this.buildUserName(terminalUser.first_name, terminalUser.last_name),
            filters_applied: {
                billing_branch_id: filters.billing_branch_id,
                period: filters.period ?? query_accounting_base_dto_1.AccountingReportPeriod.MONTH,
                date_from: dateFrom.toISOString(),
                date_to: dateTo.toISOString(),
            },
            data: orders.map((order) => {
                const customerFields = this.buildCustomerFields(order.customer);
                return {
                    id: order.id,
                    folio: order.folio,
                    total: Number(order.total),
                    payment_status: order.payment_status,
                    general_status: order.general_status,
                    created_at: order.created_at,
                    ...customerFields,
                    is_walk_in: order.customer ? (0, pos_sale_collection_mapper_1.isWalkInCustomer)(order.customer) : false,
                    seller_user: order.seller_user
                        ? {
                            id: order.seller_user.id,
                            first_name: order.seller_user.first_name,
                            last_name: order.seller_user.last_name,
                            pos_user_code: order.seller_user.pos_user_code ?? null,
                        }
                        : null,
                };
            }),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getPosCollections(tenantId, filters) {
        const { dateFrom, dateTo } = this.resolveDateRange(filters.period ?? query_accounting_base_dto_1.AccountingReportPeriod.MONTH, filters.date_from, filters.date_to);
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const customerType = filters.customer_type ?? query_accounting_base_dto_1.PosCollectionCustomerType.ALL;
        const cobranzaTerminal = await this.userRepo.findOne({
            where: {
                tenant_id: tenantId,
                billing_branch_id: filters.billing_branch_id,
                is_pos_user: true,
                pos_user_type: (0, typeorm_2.In)(pos_user_type_enum_1.POS_COLLECT_TYPES),
            },
        });
        const qb = this.buildPosCollectionsQuery(tenantId, filters, dateFrom, dateTo, customerType);
        qb.orderBy('collection.created_at', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        const [collections, total] = await qb.getManyAndCount();
        const stampedOrderIds = await this.getStampedInvoiceOrderIds(tenantId, collections
            .map((collection) => collection.sales_order_id)
            .filter((id) => Boolean(id)));
        return {
            terminal_user_id: cobranzaTerminal?.id ?? null,
            terminal_name: cobranzaTerminal
                ? this.buildUserName(cobranzaTerminal.first_name, cobranzaTerminal.last_name)
                : null,
            filters_applied: {
                billing_branch_id: filters.billing_branch_id,
                period: filters.period ?? query_accounting_base_dto_1.AccountingReportPeriod.MONTH,
                date_from: dateFrom.toISOString(),
                date_to: dateTo.toISOString(),
                customer_type: customerType,
                search: filters.search?.trim() || null,
            },
            data: collections.map((collection) => this.mapPosCollectionRow(collection, stampedOrderIds)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async exportPosCollectionsExcel(tenantId, filters) {
        const { dateFrom, dateTo } = this.resolveDateRange(filters.period ?? query_accounting_base_dto_1.AccountingReportPeriod.MONTH, filters.date_from, filters.date_to);
        const customerType = filters.customer_type ?? query_accounting_base_dto_1.PosCollectionCustomerType.ALL;
        const qb = this.buildPosCollectionsQuery(tenantId, filters, dateFrom, dateTo, customerType);
        qb.orderBy('collection.created_at', 'DESC');
        const collections = await qb.getMany();
        const stampedOrderIds = await this.getStampedInvoiceOrderIds(tenantId, collections
            .map((collection) => collection.sales_order_id)
            .filter((id) => Boolean(id)));
        const rows = collections.map((collection) => {
            const mapped = this.mapPosCollectionRow(collection, stampedOrderIds);
            const customerName = mapped.walk_in_name ||
                mapped.customer_display_name ||
                [mapped.customer_company_name, mapped.customer_person_name]
                    .filter(Boolean)
                    .join(' · ') ||
                'Público en General';
            return {
                folio: mapped.folio ?? '',
                created_at: (0, excel_export_util_1.formatExportDateTime)(mapped.created_at),
                collected_at: (0, excel_export_util_1.formatExportDateTime)(mapped.collected_at),
                customer: customerName,
                walk_in_rfc: mapped.walk_in_rfc ?? '',
                customer_type: mapped.has_stamped_invoice
                    ? 'Facturada'
                    : mapped.is_walk_in
                        ? 'Público en General'
                        : 'Cliente',
                seller: this.formatPosUserLabel(mapped.seller_user),
                cashier: this.formatPosUserLabel(mapped.collected_by_user),
                payment_method: mapped.payment_method_label ?? mapped.payment_method ?? '',
                total: (0, excel_export_util_1.num)(mapped.total),
                payment_status: mapped.payment_status ?? '',
            };
        });
        const customerTypeLabel = customerType === query_accounting_base_dto_1.PosCollectionCustomerType.WALK_IN
            ? 'Público en General'
            : customerType === query_accounting_base_dto_1.PosCollectionCustomerType.INVOICED
                ? 'Facturadas'
                : 'Todas';
        const buffer = await (0, excel_export_util_1.buildStyledExcelBuffer)({
            sheetName: 'Cobranza POS',
            title: 'Cobranza POS — órdenes cobradas',
            subtitle: (0, excel_export_util_1.buildExportSubtitle)([
                `Periodo: ${filters.period ?? query_accounting_base_dto_1.AccountingReportPeriod.MONTH}`,
                `${(0, excel_export_util_1.formatExportDateTime)(dateFrom)} – ${(0, excel_export_util_1.formatExportDateTime)(dateTo)}`,
                `Tipo: ${customerTypeLabel}`,
                filters.search?.trim() ? `Búsqueda: ${filters.search.trim()}` : '',
                `${rows.length} órdenes`,
            ]),
            columns: [
                { header: 'Folio', key: 'folio', width: 16 },
                { header: 'Fecha venta', key: 'created_at', width: 18, type: 'date' },
                { header: 'Fecha cobro', key: 'collected_at', width: 18, type: 'date' },
                { header: 'Cliente', key: 'customer', width: 28 },
                { header: 'RFC ticket', key: 'walk_in_rfc', width: 16 },
                { header: 'Tipo', key: 'customer_type', width: 18 },
                { header: 'Vendedor', key: 'seller', width: 22 },
                { header: 'Cajero', key: 'cashier', width: 22 },
                { header: 'Método de pago', key: 'payment_method', width: 16 },
                { header: 'Total', key: 'total', width: 14, type: 'currency' },
                { header: 'Estatus pago', key: 'payment_status', width: 14 },
            ],
            rows,
        });
        const day = new Date().toISOString().slice(0, 10);
        return { buffer, filename: `cobranza-pos-${day}.xlsx` };
    }
    async getPosDailyShifts(tenantId, filters) {
        const { dateFrom, dateTo } = this.resolveDateRange(filters.period ?? query_accounting_base_dto_1.AccountingReportPeriod.MONTH, filters.date_from, filters.date_to);
        const shifts = await this.dailyShiftRepo
            .createQueryBuilder('shift')
            .leftJoinAndSelect('shift.terminal_user', 'terminal_user')
            .leftJoinAndSelect('shift.billing_branch', 'billing_branch')
            .leftJoinAndSelect('shift.partial_shifts', 'partial')
            .leftJoinAndSelect('partial.performed_by_user', 'performed_by')
            .where('shift.tenant_id = :tenantId', { tenantId })
            .andWhere('shift.billing_branch_id = :branchId', {
            branchId: filters.billing_branch_id,
        })
            .andWhere('shift.created_at >= :dateFrom', { dateFrom })
            .andWhere('shift.created_at <= :dateTo', { dateTo })
            .orderBy('shift.shift_date', 'DESC')
            .addOrderBy('shift.created_at', 'DESC')
            .addOrderBy('partial.partial_number', 'ASC')
            .getMany();
        const data = shifts.map((shift) => {
            const partials = shift.partial_shifts ?? [];
            const removedTotalMxn = partials.reduce((sum, partial) => sum + Number(partial.removed_total_mxn || 0), 0);
            return {
                id: shift.id,
                shift_date: shift.shift_date,
                status: shift.status,
                is_previous_day: shift.status === pos_daily_shift_status_enum_1.PosDailyShiftStatus.OPEN &&
                    (0, unclosed_shift_alert_1.isPreviousDayOpenShift)(shift.shift_date),
                opening_cash_mxn: Number(shift.opening_cash_mxn),
                opening_cash_usd: Number(shift.opening_cash_usd),
                terminal_user: shift.terminal_user
                    ? {
                        id: shift.terminal_user.id,
                        first_name: shift.terminal_user.first_name,
                        last_name: shift.terminal_user.last_name,
                        pos_user_type: shift.terminal_user.pos_user_type,
                    }
                    : null,
                terminal_name: shift.terminal_user
                    ? this.buildUserName(shift.terminal_user.first_name, shift.terminal_user.last_name)
                    : null,
                billing_branch: shift.billing_branch
                    ? {
                        id: shift.billing_branch.id,
                        code: shift.billing_branch.code,
                        display_name: [shift.billing_branch.code, shift.billing_branch.city]
                            .filter(Boolean)
                            .join(' — '),
                    }
                    : null,
                partial_shifts_count: partials.length,
                removed_total_mxn: Number(removedTotalMxn.toFixed(2)),
                partial_shifts: partials.map((partial) => ({
                    id: partial.id,
                    partial_number: partial.partial_number,
                    removed_total_mxn: Number(partial.removed_total_mxn || 0),
                    removed_total_usd: Number(partial.removed_total_usd || 0),
                    created_at: partial.created_at,
                    notes: partial.notes,
                    performed_by_user: partial.performed_by_user
                        ? {
                            id: partial.performed_by_user.id,
                            first_name: partial.performed_by_user.first_name,
                            last_name: partial.performed_by_user.last_name,
                        }
                        : null,
                })),
            };
        });
        return {
            filters_applied: {
                billing_branch_id: filters.billing_branch_id,
                period: filters.period ?? query_accounting_base_dto_1.AccountingReportPeriod.MONTH,
                date_from: dateFrom.toISOString(),
                date_to: dateTo.toISOString(),
            },
            data,
            total: data.length,
        };
    }
    getPosDailyShiftDetail(tenantId, dailyShiftId) {
        return this.posShiftsService.findDailyShiftById(dailyShiftId, tenantId);
    }
    async getAccountsPayable(tenantId, filters) {
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const pendingOrders = await this.purchaseOrderRepo.find({
            where: {
                tenant_id: tenantId,
                payment_status: 'Pendiente',
            },
            relations: ['vendor', 'payments'],
        });
        const activeOrders = pendingOrders.filter((po) => po.general_status !== 'Cancelada');
        const vendorMap = new Map();
        for (const order of activeOrders) {
            const summary = this.buildPurchaseOrderPaymentSummary(order);
            if (summary.amount_pending <= 0)
                continue;
            const vendor = order.vendor;
            if (!vendor)
                continue;
            const displayName = vendor.razon_social ?? vendor.company_name ?? vendor.name;
            if (filters.search) {
                const term = filters.search.toLowerCase();
                const matches = vendor.name.toLowerCase().includes(term) ||
                    (vendor.razon_social ?? '').toLowerCase().includes(term) ||
                    (vendor.company_name ?? '').toLowerCase().includes(term);
                if (!matches)
                    continue;
            }
            const existing = vendorMap.get(vendor.id) ?? {
                vendor_id: vendor.id,
                vendor_name: vendor.name,
                razon_social: vendor.razon_social,
                company_name: vendor.company_name,
                credit_limit: vendor.credit_limit ? Number(vendor.credit_limit) : null,
                pending_order_count: 0,
                amount_pending: 0,
                amount_paid: 0,
                total_committed: 0,
            };
            existing.pending_order_count += 1;
            existing.amount_pending += summary.amount_pending;
            existing.amount_paid += summary.amount_paid;
            existing.total_committed += summary.amount_paid + summary.amount_pending;
            vendorMap.set(vendor.id, existing);
        }
        const rows = Array.from(vendorMap.values())
            .map((row) => ({
            ...row,
            amount_pending: Number(row.amount_pending.toFixed(2)),
            amount_paid: Number(row.amount_paid.toFixed(2)),
            total_committed: Number(row.total_committed.toFixed(2)),
            progress_percentage: row.credit_limit && row.credit_limit > 0
                ? Number(((row.amount_pending / row.credit_limit) * 100).toFixed(2))
                : row.total_committed > 0
                    ? Number(((row.amount_pending / row.total_committed) * 100).toFixed(2))
                    : 0,
        }))
            .sort((a, b) => b.amount_pending - a.amount_pending);
        const total = rows.length;
        const paginated = rows.slice((page - 1) * limit, page * limit);
        return {
            summary: {
                total_vendors: total,
                total_amount_pending: Number(rows.reduce((sum, row) => sum + row.amount_pending, 0).toFixed(2)),
            },
            data: paginated,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getAccountsPayableDetail(tenantId, vendorId) {
        const orders = await this.purchaseOrderRepo.find({
            where: {
                tenant_id: tenantId,
                vendor_id: vendorId,
                payment_status: 'Pendiente',
            },
            relations: ['vendor', 'payments'],
            order: { created_at: 'DESC' },
        });
        const pendingOrders = orders
            .filter((po) => po.general_status !== 'Cancelada')
            .map((po) => {
            const summary = this.buildPurchaseOrderPaymentSummary(po);
            return {
                id: po.id,
                folio: po.folio,
                general_status: po.general_status,
                payment_status: po.payment_status,
                payment_currency: po.payment_currency,
                expected_delivery_date: po.expected_delivery_date,
                amount_pending: summary.amount_pending,
                amount_paid: summary.amount_paid,
                total: summary.amount_paid + summary.amount_pending,
                created_at: po.created_at,
            };
        })
            .filter((po) => po.amount_pending > 0);
        if (!pendingOrders.length) {
            throw new common_1.NotFoundException('No hay cuentas por pagar para este proveedor');
        }
        const vendor = orders[0]?.vendor;
        return {
            vendor: vendor
                ? {
                    id: vendor.id,
                    name: vendor.name,
                    razon_social: vendor.razon_social,
                    company_name: vendor.company_name,
                    credit_limit: vendor.credit_limit ? Number(vendor.credit_limit) : null,
                }
                : null,
            orders: pendingOrders,
        };
    }
    async getAccountsReceivable(tenantId, filters) {
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const qb = this.salesOrderRepo
            .createQueryBuilder('so')
            .innerJoinAndSelect('so.customer', 'customer')
            .innerJoin('so.warehouse', 'warehouse')
            .where('so.tenant_id = :tenantId', { tenantId })
            .andWhere('so.payment_status = :pending', { pending: 'Pendiente' })
            .andWhere('so.general_status NOT IN (:...excluded)', {
            excluded: ['Cancelada', 'En cola'],
        })
            .andWhere('(customer.fiscal_razon_social IS NULL OR customer.fiscal_razon_social != :walkInFiscal)', { walkInFiscal: WALK_IN_FISCAL_NAME })
            .andWhere('customer.name != :walkInName', { walkInName: WALK_IN_DISPLAY_NAME });
        if (filters.billing_branch_id) {
            qb.andWhere('warehouse.billing_branch_id = :branchId', {
                branchId: filters.billing_branch_id,
            });
        }
        const orders = await qb.getMany();
        const grouped = new Map();
        for (const order of orders) {
            const customer = order.customer;
            const razonSocial = order.fiscal_razon_social?.trim() ||
                customer?.fiscal_razon_social?.trim() ||
                customer?.company_name?.trim() ||
                [customer?.name, customer?.lastname].filter(Boolean).join(' ').trim() ||
                'Sin razón social';
            if (filters.search) {
                const term = filters.search.toLowerCase();
                const matches = razonSocial.toLowerCase().includes(term) ||
                    (customer?.fiscal_rfc ?? '').toLowerCase().includes(term);
                if (!matches)
                    continue;
            }
            const existing = grouped.get(razonSocial) ?? {
                razon_social: razonSocial,
                fiscal_rfc: customer?.fiscal_rfc ?? null,
                pending_order_count: 0,
                amount_pending: 0,
                customer_ids: new Set(),
            };
            existing.pending_order_count += 1;
            existing.amount_pending += Number(order.total || 0);
            if (customer?.id)
                existing.customer_ids.add(customer.id);
            grouped.set(razonSocial, existing);
        }
        const rows = Array.from(grouped.values())
            .map((row) => ({
            razon_social: row.razon_social,
            fiscal_rfc: row.fiscal_rfc,
            pending_order_count: row.pending_order_count,
            amount_pending: Number(row.amount_pending.toFixed(2)),
            customer_count: row.customer_ids.size,
        }))
            .sort((a, b) => b.amount_pending - a.amount_pending);
        const total = rows.length;
        const paginated = rows.slice((page - 1) * limit, page * limit);
        return {
            summary: {
                total_accounts: total,
                total_amount_pending: Number(rows.reduce((sum, row) => sum + row.amount_pending, 0).toFixed(2)),
            },
            data: paginated,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getAccountsReceivableDetail(tenantId, razonSocial, billingBranchId) {
        const decodedRazonSocial = decodeURIComponent(razonSocial);
        const qb = this.salesOrderRepo
            .createQueryBuilder('so')
            .leftJoinAndSelect('so.customer', 'customer')
            .leftJoinAndSelect('so.seller_user', 'seller_user')
            .innerJoin('so.warehouse', 'warehouse')
            .where('so.tenant_id = :tenantId', { tenantId })
            .andWhere('so.payment_status = :pending', { pending: 'Pendiente' })
            .andWhere('so.general_status NOT IN (:...excluded)', {
            excluded: ['Cancelada', 'En cola'],
        });
        if (billingBranchId) {
            qb.andWhere('warehouse.billing_branch_id = :branchId', {
                branchId: billingBranchId,
            });
        }
        const orders = await qb.orderBy('so.created_at', 'DESC').getMany();
        const matchingOrders = orders.filter((order) => {
            const customer = order.customer;
            const key = order.fiscal_razon_social?.trim() ||
                customer?.fiscal_razon_social?.trim() ||
                customer?.company_name?.trim() ||
                [customer?.name, customer?.lastname].filter(Boolean).join(' ').trim() ||
                'Sin razón social';
            return key === decodedRazonSocial;
        });
        if (!matchingOrders.length) {
            throw new common_1.NotFoundException('No hay órdenes pendientes para esta razón social');
        }
        return {
            razon_social: decodedRazonSocial,
            fiscal_rfc: matchingOrders[0].customer?.fiscal_rfc ?? null,
            pending_order_count: matchingOrders.length,
            amount_pending: Number(matchingOrders.reduce((sum, order) => sum + Number(order.total || 0), 0).toFixed(2)),
            orders: matchingOrders.map((order) => ({
                id: order.id,
                folio: order.folio,
                total: Number(order.total),
                payment_status: order.payment_status,
                general_status: order.general_status,
                expected_delivery_date: order.expected_delivery_date,
                created_at: order.created_at,
                customer_display_name: order.customer?.company_name
                    ?? [order.customer?.name, order.customer?.lastname].filter(Boolean).join(' ').trim()
                    ?? null,
                seller_user: order.seller_user
                    ? {
                        id: order.seller_user.id,
                        first_name: order.seller_user.first_name,
                        last_name: order.seller_user.last_name,
                        pos_user_code: order.seller_user.pos_user_code ?? null,
                    }
                    : null,
            })),
        };
    }
    walkInCustomerSql(customerAlias) {
        return `(${customerAlias}.fiscal_razon_social = :walkInFiscal OR ${customerAlias}.name = :walkInName)`;
    }
    stampedInvoiceExistsSql(salesOrderAlias) {
        return `EXISTS (
      SELECT 1 FROM electronic_invoices ei
      WHERE ei.tenant_id = collection.tenant_id
        AND ei.source_module = 'sales_orders'
        AND ei.source_id = ${salesOrderAlias}.id
        AND ei.stamp_status IN ('stamped', 'cancel_pending', 'cancelled')
    )`;
    }
    async getStampedInvoiceOrderIds(tenantId, orderIds) {
        if (!orderIds.length) {
            return new Set();
        }
        const rows = await this.electronicInvoiceRepo
            .createQueryBuilder('ei')
            .select('DISTINCT ei.source_id', 'source_id')
            .where('ei.tenant_id = :tenantId', { tenantId })
            .andWhere('ei.source_module = :module', { module: 'sales_orders' })
            .andWhere('ei.source_id IN (:...orderIds)', { orderIds })
            .andWhere('ei.stamp_status IN (:...statuses)', {
            statuses: ['stamped', 'cancel_pending', 'cancelled'],
        })
            .getRawMany();
        return new Set(rows.map((row) => row.source_id));
    }
    buildPurchaseOrderPaymentSummary(order) {
        const requestedTotal = Number(order.requested_total || 0);
        const receivedTotal = Number(order.received_total || 0);
        const total = order.general_status === 'Recibida'
            ? (receivedTotal > 0 ? receivedTotal : requestedTotal)
            : requestedTotal;
        const amountPaid = (order.payments ?? []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
        const amountPending = Math.max(total - amountPaid, 0);
        return {
            amount_paid: Number(amountPaid.toFixed(2)),
            amount_pending: Number(amountPending.toFixed(2)),
        };
    }
    resolveDateRange(period, dateFrom, dateTo) {
        const now = new Date();
        switch (period) {
            case query_accounting_base_dto_1.AccountingReportPeriod.TODAY:
                return {
                    dateFrom: this.startOfDay(now),
                    dateTo: this.endOfDay(now),
                };
            case query_accounting_base_dto_1.AccountingReportPeriod.WEEK: {
                const start = new Date(now);
                const day = start.getDay();
                const diff = day === 0 ? 6 : day - 1;
                start.setDate(start.getDate() - diff);
                return {
                    dateFrom: this.startOfDay(start),
                    dateTo: this.endOfDay(now),
                };
            }
            case query_accounting_base_dto_1.AccountingReportPeriod.MONTH: {
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                return {
                    dateFrom: this.startOfDay(start),
                    dateTo: this.endOfDay(now),
                };
            }
            case query_accounting_base_dto_1.AccountingReportPeriod.RANGE:
            default: {
                const from = dateFrom ? new Date(dateFrom) : this.startOfDay(now);
                const to = dateTo ? new Date(dateTo) : this.endOfDay(now);
                return {
                    dateFrom: this.startOfDay(from),
                    dateTo: this.endOfDay(to),
                };
            }
        }
    }
    buildPosCollectionsQuery(tenantId, filters, dateFrom, dateTo, customerType) {
        const qb = this.collectionRepo
            .createQueryBuilder('collection')
            .innerJoinAndSelect('collection.sales_order', 'so')
            .innerJoinAndSelect('collection.customer', 'customer')
            .leftJoinAndSelect('so.seller_user', 'seller_user')
            .leftJoinAndSelect('collection.collected_by_user', 'collected_by_user')
            .innerJoin('so.warehouse', 'warehouse')
            .where('collection.tenant_id = :tenantId', { tenantId })
            .andWhere('warehouse.billing_branch_id = :branchId', {
            branchId: filters.billing_branch_id,
        })
            .andWhere('collection.created_at >= :dateFrom', { dateFrom })
            .andWhere('collection.created_at <= :dateTo', { dateTo });
        if (customerType === query_accounting_base_dto_1.PosCollectionCustomerType.WALK_IN) {
            qb.andWhere(this.walkInCustomerSql('customer'), {
                walkInFiscal: WALK_IN_FISCAL_NAME,
                walkInName: WALK_IN_DISPLAY_NAME,
            }).andWhere(`NOT ${this.stampedInvoiceExistsSql('so')}`);
        }
        else if (customerType === query_accounting_base_dto_1.PosCollectionCustomerType.INVOICED) {
            qb.andWhere(this.stampedInvoiceExistsSql('so'));
        }
        const search = filters.search?.trim();
        if (search) {
            qb.andWhere(`(so.folio ILIKE :search
          OR customer.name ILIKE :search
          OR customer.lastname ILIKE :search
          OR customer.company_name ILIKE :search
          OR so.walk_in_name ILIKE :search
          OR so.walk_in_rfc ILIKE :search)`, { search: `%${search}%` });
        }
        return qb;
    }
    mapPosCollectionRow(collection, stampedOrderIds) {
        const order = collection.sales_order;
        const customer = collection.customer;
        const customerFields = this.buildCustomerFields(customer);
        const hasStampedInvoice = order ? stampedOrderIds.has(order.id) : false;
        const paymentMethod = collection.payment_method;
        const paymentMethodLabel = paymentMethod && paymentMethod in sales_order_payment_display_util_1.SALES_ORDER_PAYMENT_METHOD_LABELS
            ? sales_order_payment_display_util_1.SALES_ORDER_PAYMENT_METHOD_LABELS[paymentMethod]
            : paymentMethod ?? null;
        return {
            id: order?.id ?? collection.sales_order_id,
            collection_id: collection.id,
            folio: order?.folio ?? null,
            total: Number(collection.order_total_mxn),
            payment_status: order?.payment_status ?? null,
            general_status: order?.general_status ?? null,
            created_at: order?.created_at ?? null,
            collected_at: collection.created_at,
            payment_method: paymentMethod,
            payment_method_label: paymentMethodLabel,
            has_stamped_invoice: hasStampedInvoice,
            walk_in_name: order?.walk_in_name ?? null,
            walk_in_rfc: order?.walk_in_rfc ?? null,
            ...customerFields,
            is_walk_in: customer ? (0, pos_sale_collection_mapper_1.isWalkInCustomer)(customer) : false,
            seller_user: order?.seller_user
                ? {
                    id: order.seller_user.id,
                    first_name: order.seller_user.first_name,
                    last_name: order.seller_user.last_name,
                    pos_user_code: order.seller_user.pos_user_code ?? null,
                }
                : null,
            collected_by_user: collection.collected_by_user
                ? {
                    id: collection.collected_by_user.id,
                    first_name: collection.collected_by_user.first_name,
                    last_name: collection.collected_by_user.last_name,
                    pos_user_code: collection.collected_by_user.pos_user_code ?? null,
                }
                : null,
        };
    }
    formatPosUserLabel(user) {
        if (!user)
            return '';
        const name = this.buildUserName(user.first_name, user.last_name);
        return user.pos_user_code ? `${name} (${user.pos_user_code})` : name;
    }
    startOfDay(date) {
        const value = new Date(date);
        value.setHours(0, 0, 0, 0);
        return value;
    }
    endOfDay(date) {
        const value = new Date(date);
        value.setHours(23, 59, 59, 999);
        return value;
    }
    buildUserName(firstName, lastName) {
        return [firstName, lastName].filter(Boolean).join(' ').trim() || 'Sin nombre';
    }
    buildCustomerFields(customer) {
        const companyName = customer?.company_name?.trim() || null;
        const personName = [customer?.name, customer?.lastname].filter(Boolean).join(' ').trim() || null;
        const displayName = companyName ||
            personName ||
            customer?.fiscal_razon_social?.trim() ||
            null;
        return {
            customer_company_name: companyName,
            customer_person_name: personName,
            customer_display_name: displayName,
        };
    }
};
exports.AccountingService = AccountingService;
exports.AccountingService = AccountingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sales_order_entity_1.SalesOrder)),
    __param(1, (0, typeorm_1.InjectRepository)(pos_sale_collection_entity_1.PosSaleCollection)),
    __param(2, (0, typeorm_1.InjectRepository)(pos_daily_shift_entity_1.PosDailyShift)),
    __param(3, (0, typeorm_1.InjectRepository)(electronic_invoice_entity_1.ElectronicInvoice)),
    __param(4, (0, typeorm_1.InjectRepository)(purchase_order_batch_entity_1.PurchaseOrderBatch)),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        pos_shifts_service_1.PosShiftsService])
], AccountingService);
//# sourceMappingURL=accounting.service.js.map