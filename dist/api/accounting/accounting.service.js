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
const pos_shifts_service_1 = require("../pos-shifts/pos-shifts.service");
const exchange_rate_service_1 = require("../exchange-rate/exchange-rate.service");
const query_accounting_base_dto_1 = require("./dto/query-accounting-base.dto");
const pos_sale_collection_mapper_1 = require("../pos-shifts/mappers/pos-sale-collection.mapper");
const unclosed_shift_alert_1 = require("../pos-shifts/utils/unclosed-shift-alert");
const sales_order_payment_display_util_1 = require("../sales-orders/utils/sales-order-payment-display.util");
const excel_export_util_1 = require("../../common/utils/excel-export.util");
const accounts_payable_currency_util_1 = require("./utils/accounts-payable-currency.util");
const accounts_receivable_currency_util_1 = require("./utils/accounts-receivable-currency.util");
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
    exchangeRateService;
    constructor(salesOrderRepo, collectionRepo, dailyShiftRepo, electronicInvoiceRepo, purchaseOrderRepo, userRepo, posShiftsService, exchangeRateService) {
        this.salesOrderRepo = salesOrderRepo;
        this.collectionRepo = collectionRepo;
        this.dailyShiftRepo = dailyShiftRepo;
        this.electronicInvoiceRepo = electronicInvoiceRepo;
        this.purchaseOrderRepo = purchaseOrderRepo;
        this.userRepo = userRepo;
        this.posShiftsService = posShiftsService;
        this.exchangeRateService = exchangeRateService;
    }
    async getPosSummary(tenantId, filters) {
        const period = filters.period ?? query_accounting_base_dto_1.AccountingReportPeriod.MONTH;
        const { from: shiftFrom, to: shiftTo } = (0, unclosed_shift_alert_1.resolvePosCalendarRange)(period, filters.date_from, filters.date_to);
        const terminalRows = await this.salesOrderRepo
            .createQueryBuilder('so')
            .innerJoin('so.terminal_user', 'terminal_user')
            .leftJoin('so.warehouse', 'warehouse')
            .select('terminal_user.id', 'terminal_user_id')
            .addSelect('terminal_user.first_name', 'first_name')
            .addSelect('terminal_user.last_name', 'last_name')
            .addSelect('COUNT(so.id)', 'sales_count')
            .addSelect('COALESCE(SUM(so.total), 0)', 'amount_sold')
            .where('so.tenant_id = :tenantId', { tenantId })
            .andWhere(this.posBranchSql(), { branchId: filters.billing_branch_id })
            .andWhere('so.sales_order_type = :posType', { posType: 'POS' })
            .andWhere('so.general_status != :cancelled', { cancelled: 'Cancelada' })
            .andWhere(`${(0, unclosed_shift_alert_1.posCalendarDateSql)('so.created_at')} >= :shiftFrom`, { shiftFrom })
            .andWhere(`${(0, unclosed_shift_alert_1.posCalendarDateSql)('so.created_at')} <= :shiftTo`, { shiftTo })
            .groupBy('terminal_user.id')
            .addGroupBy('terminal_user.first_name')
            .addGroupBy('terminal_user.last_name')
            .orderBy('sales_count', 'DESC')
            .getRawMany();
        const enteredOrders = await this.loadPosEnteredOrders(tenantId, filters.billing_branch_id, shiftFrom, shiftTo);
        const stampedInvoiceSql = this.stampedInvoiceExistsSql('so');
        const walkInSql = this.walkInCustomerSql('customer');
        const collectionRows = await this.collectionRepo
            .createQueryBuilder('collection')
            .innerJoin('collection.sales_order', 'so')
            .innerJoin('collection.pos_daily_shift', 'shift')
            .innerJoin('collection.customer', 'customer')
            .select('COUNT(collection.id)', 'orders_collected')
            .addSelect('COALESCE(SUM(collection.order_total_mxn), 0)', 'amount_collected')
            .addSelect(`SUM(CASE WHEN ${walkInSql} AND NOT ${stampedInvoiceSql} THEN 1 ELSE 0 END)`, 'walk_in_count')
            .addSelect(`SUM(CASE WHEN ${stampedInvoiceSql} THEN 1 ELSE 0 END)`, 'invoiced_count')
            .where('collection.tenant_id = :tenantId', { tenantId })
            .andWhere('shift.billing_branch_id = :branchId', {
            branchId: filters.billing_branch_id,
        })
            .andWhere('shift.shift_date >= :shiftFrom', { shiftFrom })
            .andWhere('shift.shift_date <= :shiftTo', { shiftTo })
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
            .andWhere('shift.shift_date >= :shiftFrom', { shiftFrom })
            .andWhere('shift.shift_date <= :shiftTo', { shiftTo })
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
        const amountEntered = enteredOrders.reduce((sum, order) => sum + order.total, 0);
        const pendingOrders = enteredOrders.filter((order) => order.payment_status === 'Pendiente');
        const amountPending = pendingOrders.reduce((sum, order) => sum + order.total, 0);
        const walkInCount = Number(collectionRows?.walk_in_count || 0);
        const invoicedCount = Number(collectionRows?.invoiced_count || 0);
        const dailyShiftsCount = Number(shiftStats?.daily_shifts_count || 0);
        const partialShiftsCount = Number(shiftStats?.partial_shifts_count || 0);
        const periodShift = await this.dailyShiftRepo.findOne({
            where: {
                tenant_id: tenantId,
                billing_branch_id: filters.billing_branch_id,
                shift_date: (0, typeorm_2.Between)(shiftFrom, shiftTo),
            },
            relations: ['terminal_user'],
            order: { shift_date: 'DESC', created_at: 'DESC' },
        });
        const cobranzaTerminal = periodShift?.terminal_user ?? null;
        const openShiftDate = openDailyShift ? (0, unclosed_shift_alert_1.toDateOnlyString)(openDailyShift.shift_date) : null;
        const openShiftInPeriod = openDailyShift && openShiftDate && openShiftDate >= shiftFrom && openShiftDate <= shiftTo
            ? openDailyShift
            : null;
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
                period,
                date_from: shiftFrom,
                date_to: shiftTo,
            },
            unclosed_shift_alert: unclosedShiftAlert,
            summary: {
                orders_entered: enteredOrders.length,
                amount_entered: Number(amountEntered.toFixed(2)),
                orders_collected: ordersCollected,
                amount_collected: Number(amountCollected.toFixed(2)),
                orders_pending: pendingOrders.length,
                amount_pending: Number(amountPending.toFixed(2)),
            },
            entered_orders: enteredOrders,
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
                open_daily_shift: openShiftInPeriod
                    ? {
                        id: openShiftInPeriod.id,
                        shift_date: (0, unclosed_shift_alert_1.toDateOnlyString)(openShiftInPeriod.shift_date),
                        status: openShiftInPeriod.status,
                        is_previous_day: (0, unclosed_shift_alert_1.isPreviousDayOpenShift)(openShiftInPeriod.shift_date),
                        partial_shifts_count: openShiftInPeriod.partial_shifts?.length ?? 0,
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
        const period = filters.period ?? query_accounting_base_dto_1.AccountingReportPeriod.MONTH;
        const { from: shiftFrom, to: shiftTo } = (0, unclosed_shift_alert_1.resolvePosCalendarRange)(period, filters.date_from, filters.date_to);
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const qb = this.salesOrderRepo
            .createQueryBuilder('so')
            .leftJoinAndSelect('so.customer', 'customer')
            .leftJoinAndSelect('so.seller_user', 'seller_user')
            .where('so.tenant_id = :tenantId', { tenantId })
            .andWhere('so.terminal_user_id = :terminalUserId', { terminalUserId })
            .andWhere('so.billing_branch_id = :branchId', {
            branchId: filters.billing_branch_id,
        })
            .andWhere('so.sales_order_type = :posType', { posType: 'POS' })
            .andWhere('so.general_status != :cancelled', { cancelled: 'Cancelada' })
            .andWhere(`${(0, unclosed_shift_alert_1.posCalendarDateSql)('so.created_at')} >= :shiftFrom`, { shiftFrom })
            .andWhere(`${(0, unclosed_shift_alert_1.posCalendarDateSql)('so.created_at')} <= :shiftTo`, { shiftTo })
            .orderBy('so.created_at', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        const [orders, total] = await qb.getManyAndCount();
        return {
            terminal_user_id: terminalUserId,
            terminal_name: this.buildUserName(terminalUser.first_name, terminalUser.last_name),
            filters_applied: {
                billing_branch_id: filters.billing_branch_id,
                period,
                date_from: shiftFrom,
                date_to: shiftTo,
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
        const period = filters.period ?? query_accounting_base_dto_1.AccountingReportPeriod.MONTH;
        const { from: shiftFrom, to: shiftTo } = (0, unclosed_shift_alert_1.resolvePosCalendarRange)(period, filters.date_from, filters.date_to);
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const customerType = filters.customer_type ?? query_accounting_base_dto_1.PosCollectionCustomerType.ALL;
        const dateBasis = filters.date_basis ?? query_accounting_base_dto_1.PosCollectionDateBasis.SHIFT;
        const search = filters.search?.trim() || '';
        const periodShift = await this.dailyShiftRepo.findOne({
            where: {
                tenant_id: tenantId,
                billing_branch_id: filters.billing_branch_id,
                shift_date: (0, typeorm_2.Between)(shiftFrom, shiftTo),
            },
            relations: ['terminal_user'],
            order: { shift_date: 'DESC', created_at: 'DESC' },
        });
        const cobranzaTerminal = periodShift?.terminal_user ?? null;
        const summary = await this.aggregatePosCollections(tenantId, filters, shiftFrom, shiftTo, dateBasis, query_accounting_base_dto_1.PosCollectionCustomerType.ALL);
        const filtered = customerType === query_accounting_base_dto_1.PosCollectionCustomerType.ALL && !search
            ? summary
            : await this.aggregatePosCollections(tenantId, filters, shiftFrom, shiftTo, dateBasis, customerType, search);
        const total = filtered.orders_collected;
        const qb = this.buildPosCollectionsQuery(tenantId, filters, shiftFrom, shiftTo, customerType, dateBasis);
        qb.orderBy('collection.created_at', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        const collections = await qb.getMany();
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
                period,
                date_from: shiftFrom,
                date_to: shiftTo,
                date_basis: dateBasis,
                customer_type: customerType,
                search: search || null,
            },
            summary: {
                orders_collected: summary.orders_collected,
                amount_collected: summary.amount_collected,
                walk_in_count: summary.walk_in_count,
                invoiced_count: summary.invoiced_count,
            },
            filtered_amount: filtered.amount_collected,
            data: collections.map((collection) => this.mapPosCollectionRow(collection, stampedOrderIds)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async exportPosCollectionsExcel(tenantId, filters) {
        const period = filters.period ?? query_accounting_base_dto_1.AccountingReportPeriod.MONTH;
        const { from: shiftFrom, to: shiftTo } = (0, unclosed_shift_alert_1.resolvePosCalendarRange)(period, filters.date_from, filters.date_to);
        const customerType = filters.customer_type ?? query_accounting_base_dto_1.PosCollectionCustomerType.ALL;
        const dateBasis = filters.date_basis ?? query_accounting_base_dto_1.PosCollectionDateBasis.SHIFT;
        const qb = this.buildPosCollectionsQuery(tenantId, filters, shiftFrom, shiftTo, customerType, dateBasis);
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
                branch: mapped.billing_branch?.label ?? '',
                created_at: (0, excel_export_util_1.formatExportDateTime)(mapped.created_at),
                collected_at: (0, excel_export_util_1.formatExportDateTime)(mapped.collected_at),
                shift_date: mapped.shift_date ?? '',
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
                `${shiftFrom} – ${shiftTo}`,
                dateBasis === query_accounting_base_dto_1.PosCollectionDateBasis.COLLECTED ? 'Por fecha de cobro' : 'Por fecha de corte',
                `Tipo: ${customerTypeLabel}`,
                filters.search?.trim() ? `Búsqueda: ${filters.search.trim()}` : '',
                `${rows.length} órdenes`,
            ]),
            columns: [
                { header: 'Folio', key: 'folio', width: 16 },
                { header: 'Sucursal', key: 'branch', width: 28 },
                { header: 'Fecha venta', key: 'created_at', width: 18, type: 'date' },
                { header: 'Fecha cobro', key: 'collected_at', width: 18, type: 'date' },
                { header: 'Fecha corte', key: 'shift_date', width: 14, type: 'date' },
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
        const day = (0, unclosed_shift_alert_1.getTodayDateString)();
        return { buffer, filename: `cobranza-pos-${day}.xlsx` };
    }
    async getPosDailyShifts(tenantId, filters) {
        const period = filters.period ?? query_accounting_base_dto_1.AccountingReportPeriod.MONTH;
        const { from: shiftFrom, to: shiftTo } = (0, unclosed_shift_alert_1.resolvePosCalendarRange)(period, filters.date_from, filters.date_to);
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
            .andWhere('shift.shift_date >= :shiftFrom', { shiftFrom })
            .andWhere('shift.shift_date <= :shiftTo', { shiftTo })
            .orderBy('shift.shift_date', 'DESC')
            .addOrderBy('shift.created_at', 'DESC')
            .addOrderBy('partial.partial_number', 'ASC')
            .getMany();
        const data = shifts.map((shift) => {
            const partials = shift.partial_shifts ?? [];
            const removedTotalMxn = partials.reduce((sum, partial) => sum + Number(partial.removed_total_mxn || 0), 0);
            return {
                id: shift.id,
                shift_date: (0, unclosed_shift_alert_1.toDateOnlyString)(shift.shift_date),
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
                period,
                date_from: shiftFrom,
                date_to: shiftTo,
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
        const currency = filters.currency ?? query_accounting_base_dto_1.AccountsPayableCurrencyView.ALL;
        const rows = (0, accounts_payable_currency_util_1.sortPayableVendors)((0, accounts_payable_currency_util_1.filterPayableVendors)(await this.collectAccountsPayableVendors(tenantId, filters.search), currency), currency);
        const dailyRate = await this.resolvePayableExchangeRate(tenantId);
        const rated = (0, accounts_payable_currency_util_1.applyPayableExchangeRate)(rows, currency, dailyRate.exchange_rate);
        const total = rated.length;
        const paginated = rated.slice((page - 1) * limit, page * limit);
        return {
            summary: (0, accounts_payable_currency_util_1.summarizePayableWithRate)(rows, currency, dailyRate.exchange_rate, dailyRate.exchange_rate_date),
            data: paginated,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 0,
        };
    }
    async exportAccountsPayableExcel(tenantId, filters) {
        const currency = filters.currency ?? query_accounting_base_dto_1.AccountsPayableCurrencyView.ALL;
        const rows = await this.collectAccountsPayableVendors(tenantId, filters.search);
        const dailyRate = await this.resolvePayableExchangeRate(tenantId);
        const searchLabel = filters.search?.trim() ? `Búsqueda: ${filters.search.trim()}` : '';
        const buffer = await (0, excel_export_util_1.buildStyledExcelWorkbook)(this.payableExcelSheets(rows, currency, searchLabel, dailyRate));
        const day = (0, unclosed_shift_alert_1.getTodayDateString)();
        const suffix = currency === query_accounting_base_dto_1.AccountsPayableCurrencyView.ALL ? '' : `-${currency}`;
        return { buffer, filename: `cuentas-por-pagar${suffix}-${day}.xlsx` };
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
        const currency = filters.currency ?? query_accounting_base_dto_1.AccountsPayableCurrencyView.ALL;
        const rows = (0, accounts_receivable_currency_util_1.sortReceivableAccounts)((0, accounts_receivable_currency_util_1.filterReceivableAccounts)(await this.collectAccountsReceivable(tenantId, filters), currency), currency);
        const dailyRate = await this.resolvePayableExchangeRate(tenantId);
        const rated = (0, accounts_receivable_currency_util_1.applyReceivableExchangeRate)(rows, currency, dailyRate.exchange_rate);
        const total = rated.length;
        const paginated = rated.slice((page - 1) * limit, page * limit);
        return {
            summary: (0, accounts_receivable_currency_util_1.summarizeReceivableAccounts)(rows, currency, dailyRate.exchange_rate, dailyRate.exchange_rate_date),
            data: paginated,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 0,
        };
    }
    async exportAccountsReceivableExcel(tenantId, filters) {
        const currency = filters.currency ?? query_accounting_base_dto_1.AccountsPayableCurrencyView.ALL;
        const rows = await this.collectAccountsReceivable(tenantId, filters);
        const dailyRate = await this.resolvePayableExchangeRate(tenantId);
        const searchLabel = filters.search?.trim() ? `Búsqueda: ${filters.search.trim()}` : '';
        const buffer = await (0, excel_export_util_1.buildStyledExcelWorkbook)(this.receivableExcelSheets(rows, currency, searchLabel, dailyRate));
        const day = (0, unclosed_shift_alert_1.getTodayDateString)();
        const suffix = currency === query_accounting_base_dto_1.AccountsPayableCurrencyView.ALL ? '' : `-${currency}`;
        return { buffer, filename: `cuentas-por-cobrar${suffix}-${day}.xlsx` };
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
        const matchingOrders = orders.filter((order) => this.receivableRazonSocial(order) === decodedRazonSocial);
        if (!matchingOrders.length) {
            throw new common_1.NotFoundException('No hay órdenes pendientes para esta razón social');
        }
        const mxnOrders = matchingOrders.filter((order) => (0, accounts_payable_currency_util_1.normalizePayableCurrency)(order.currency) === 'MXN');
        const usdOrders = matchingOrders.filter((order) => (0, accounts_payable_currency_util_1.normalizePayableCurrency)(order.currency) === 'USD');
        const sumTotal = (list) => Number(list.reduce((sum, order) => sum + Number(order.total || 0), 0).toFixed(2));
        return {
            razon_social: decodedRazonSocial,
            fiscal_rfc: matchingOrders[0].customer?.fiscal_rfc ?? null,
            pending_order_count: matchingOrders.length,
            pending_order_count_mxn: mxnOrders.length,
            pending_order_count_usd: usdOrders.length,
            amount_pending: sumTotal(mxnOrders),
            amount_pending_mxn: sumTotal(mxnOrders),
            amount_pending_usd: sumTotal(usdOrders),
            orders: matchingOrders.map((order) => ({
                id: order.id,
                folio: order.folio,
                currency: (0, accounts_payable_currency_util_1.normalizePayableCurrency)(order.currency),
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
    async collectAccountsReceivable(tenantId, filters) {
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
        const term = filters.search?.trim().toLowerCase();
        const inputs = [];
        for (const order of orders) {
            const amountPending = Number(order.total || 0);
            if (amountPending <= 0)
                continue;
            const razonSocial = this.receivableRazonSocial(order);
            const fiscalRfc = order.customer?.fiscal_rfc ?? null;
            if (term) {
                const matches = razonSocial.toLowerCase().includes(term) ||
                    (fiscalRfc ?? '').toLowerCase().includes(term);
                if (!matches)
                    continue;
            }
            inputs.push({
                razon_social: razonSocial,
                fiscal_rfc: fiscalRfc,
                customer_id: order.customer?.id ?? null,
                currency: order.currency,
                amount_pending: amountPending,
            });
        }
        return (0, accounts_receivable_currency_util_1.aggregateReceivableAccounts)(inputs);
    }
    receivableRazonSocial(order) {
        const customer = order.customer;
        return (order.fiscal_razon_social?.trim() ||
            customer?.fiscal_razon_social?.trim() ||
            customer?.company_name?.trim() ||
            [customer?.name, customer?.lastname].filter(Boolean).join(' ').trim() ||
            'Sin razón social');
    }
    receivableExcelSheets(rows, currency, searchLabel, dailyRate) {
        const banner = this.payableRateBanner(dailyRate);
        const sheets = [];
        if (currency === query_accounting_base_dto_1.AccountsPayableCurrencyView.ALL) {
            sheets.push(this.receivableAmbosSheet(rows, searchLabel, dailyRate, banner));
        }
        const views = currency === query_accounting_base_dto_1.AccountsPayableCurrencyView.ALL
            ? [query_accounting_base_dto_1.AccountsPayableCurrencyView.MXN, query_accounting_base_dto_1.AccountsPayableCurrencyView.USD]
            : [currency];
        for (const view of views) {
            const isUsd = view === query_accounting_base_dto_1.AccountsPayableCurrencyView.USD;
            const list = (0, accounts_receivable_currency_util_1.sortReceivableAccounts)((0, accounts_receivable_currency_util_1.filterReceivableAccounts)(rows, view), view);
            sheets.push({
                sheetName: isUsd ? 'Dólares USD' : 'Pesos MXN',
                title: isUsd ? 'Cuentas por cobrar — dólares' : 'Cuentas por cobrar — pesos',
                banner,
                subtitle: (0, excel_export_util_1.buildExportSubtitle)([
                    isUsd ? 'Montos en USD' : 'Montos en MXN',
                    searchLabel,
                    `${list.length} cuentas`,
                ]),
                headerColor: isUsd ? 'FF047857' : 'FF1D4ED8',
                titleColor: isUsd ? 'FF065F46' : 'FF1E3A8A',
                columns: [
                    { header: 'Razón social', key: 'razon_social', width: 36 },
                    { header: 'RFC', key: 'fiscal_rfc', width: 18 },
                    { header: 'Órdenes', key: 'pending_orders', width: 14, type: 'integer' },
                    { header: 'Monto por cobrar', key: 'amount_pending', width: 18, type: 'currency' },
                    { header: 'Total en pesos', key: 'amount_total_mxn', width: 18, type: 'currency' },
                ],
                rows: list.map((row) => ({
                    razon_social: row.razon_social,
                    fiscal_rfc: row.fiscal_rfc ?? '',
                    pending_orders: isUsd ? row.pending_order_count_usd : row.pending_order_count_mxn,
                    amount_pending: isUsd ? row.amount_pending_usd : row.amount_pending_mxn,
                    amount_total_mxn: (0, accounts_payable_currency_util_1.payableTotalInMxn)(isUsd ? 0 : row.amount_pending_mxn, isUsd ? row.amount_pending_usd : 0, dailyRate.exchange_rate),
                })),
            });
        }
        return sheets;
    }
    receivableAmbosSheet(rows, searchLabel, dailyRate, banner) {
        const list = (0, accounts_receivable_currency_util_1.sortReceivableAccounts)((0, accounts_receivable_currency_util_1.filterReceivableAccounts)(rows, query_accounting_base_dto_1.AccountsPayableCurrencyView.ALL), query_accounting_base_dto_1.AccountsPayableCurrencyView.ALL);
        const data = list.map((row) => ({
            razon_social: row.razon_social,
            fiscal_rfc: row.fiscal_rfc ?? '',
            orders_mxn: row.pending_order_count_mxn,
            amount_mxn: row.amount_pending_mxn,
            orders_usd: row.pending_order_count_usd,
            amount_usd: row.amount_pending_usd,
            amount_total_mxn: (0, accounts_payable_currency_util_1.payableTotalInMxn)(row.amount_pending_mxn, row.amount_pending_usd, dailyRate.exchange_rate),
        }));
        const totalMxn = roundPayableMoney(data.reduce((sum, row) => sum + row.amount_mxn, 0));
        const totalUsd = roundPayableMoney(data.reduce((sum, row) => sum + row.amount_usd, 0));
        return {
            sheetName: 'Ambos',
            title: 'Cuentas por cobrar — ambos',
            banner,
            subtitle: (0, excel_export_util_1.buildExportSubtitle)([
                'Pesos + dólares × tipo de cambio del sistema',
                searchLabel,
                `${list.length} cuentas`,
            ]),
            headerColor: 'FF4338CA',
            titleColor: 'FF312E81',
            columns: [
                { header: 'Razón social', key: 'razon_social', width: 36 },
                { header: 'RFC', key: 'fiscal_rfc', width: 18 },
                { header: 'Órdenes pesos', key: 'orders_mxn', width: 16, type: 'integer' },
                { header: 'Por cobrar en pesos', key: 'amount_mxn', width: 20, type: 'currency' },
                { header: 'Órdenes dólares', key: 'orders_usd', width: 16, type: 'integer' },
                { header: 'Por cobrar en dólares', key: 'amount_usd', width: 22, type: 'currency' },
                { header: 'Total en pesos', key: 'amount_total_mxn', width: 20, type: 'currency' },
            ],
            rows: [
                ...data,
                {
                    razon_social: 'Total',
                    fiscal_rfc: '',
                    orders_mxn: data.reduce((sum, row) => sum + row.orders_mxn, 0),
                    amount_mxn: totalMxn,
                    orders_usd: data.reduce((sum, row) => sum + row.orders_usd, 0),
                    amount_usd: totalUsd,
                    amount_total_mxn: (0, accounts_payable_currency_util_1.payableTotalInMxn)(totalMxn, totalUsd, dailyRate.exchange_rate),
                },
            ],
        };
    }
    posBranchSql() {
        return '(so.billing_branch_id = :branchId OR warehouse.billing_branch_id = :branchId)';
    }
    async loadPosEnteredOrders(tenantId, branchId, shiftFrom, shiftTo) {
        const rows = await this.salesOrderRepo
            .createQueryBuilder('so')
            .leftJoin('so.terminal_user', 'terminal_user')
            .leftJoin('so.customer', 'customer')
            .leftJoin('so.warehouse', 'warehouse')
            .leftJoin('pos_sale_collections', 'collection', 'collection.sales_order_id = so.id')
            .select('so.id', 'id')
            .addSelect('so.folio', 'folio')
            .addSelect('so.created_at', 'created_at')
            .addSelect('so.total', 'total')
            .addSelect('so.payment_status', 'payment_status')
            .addSelect('terminal_user.first_name', 'terminal_first_name')
            .addSelect('terminal_user.last_name', 'terminal_last_name')
            .addSelect('customer.company_name', 'customer_company_name')
            .addSelect('customer.name', 'customer_name')
            .addSelect('customer.lastname', 'customer_lastname')
            .addSelect('customer.fiscal_razon_social', 'customer_fiscal')
            .addSelect('so.sales_order_type', 'sales_order_type')
            .addSelect('COALESCE(collection.order_total_mxn, 0)', 'amount_collected')
            .where('so.tenant_id = :tenantId', { tenantId })
            .andWhere(this.posBranchSql(), { branchId })
            .andWhere('so.sales_order_type IN (:...orderTypes)', { orderTypes: ['POS', 'MANUAL'] })
            .andWhere('so.general_status != :cancelled', { cancelled: 'Cancelada' })
            .andWhere(`(
          (
            ${(0, unclosed_shift_alert_1.posCalendarDateSql)('so.created_at')} >= :shiftFrom
            AND ${(0, unclosed_shift_alert_1.posCalendarDateSql)('so.created_at')} <= :shiftTo
          )
          OR EXISTS (
            SELECT 1 FROM pos_sale_collections col
            INNER JOIN pos_daily_shifts sh ON sh.id = col.pos_daily_shift_id
            WHERE col.sales_order_id = so.id
              AND sh.billing_branch_id = :branchId
              AND sh.shift_date >= :shiftFrom
              AND sh.shift_date <= :shiftTo
          )
        )`, { shiftFrom, shiftTo, branchId })
            .orderBy('so.created_at', 'DESC')
            .getRawMany();
        return rows.map((row) => {
            const customerFields = this.buildCustomerFields({
                company_name: row.customer_company_name,
                name: row.customer_name,
                lastname: row.customer_lastname,
                fiscal_razon_social: row.customer_fiscal,
            });
            const createdAt = row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? '');
            return {
                id: row.id,
                folio: row.folio,
                created_at: createdAt,
                total: Number(row.total || 0),
                payment_status: row.payment_status,
                sales_order_type: row.sales_order_type,
                channel: row.sales_order_type === 'POS' ? 'caja' : 'branch',
                terminal_name: row.sales_order_type === 'POS'
                    ? row.terminal_first_name || row.terminal_last_name
                        ? this.buildUserName(row.terminal_first_name, row.terminal_last_name)
                        : null
                    : 'Sucursal',
                customer_display_name: customerFields.customer_display_name,
                amount_collected: Number(row.amount_collected || 0),
            };
        });
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
    async collectAccountsPayableVendors(tenantId, search) {
        const pendingOrders = await this.purchaseOrderRepo.find({
            where: {
                tenant_id: tenantId,
                payment_status: 'Pendiente',
            },
            relations: ['vendor', 'payments'],
        });
        const term = search?.trim().toLowerCase();
        const inputs = [];
        for (const order of pendingOrders) {
            if (order.general_status === 'Cancelada')
                continue;
            const summary = this.buildPurchaseOrderPaymentSummary(order);
            if (summary.amount_pending <= 0)
                continue;
            const vendor = order.vendor;
            if (!vendor)
                continue;
            if (term) {
                const matches = vendor.name.toLowerCase().includes(term) ||
                    (vendor.razon_social ?? '').toLowerCase().includes(term) ||
                    (vendor.company_name ?? '').toLowerCase().includes(term);
                if (!matches)
                    continue;
            }
            inputs.push({
                vendor_id: vendor.id,
                vendor_name: vendor.name,
                razon_social: vendor.razon_social,
                company_name: vendor.company_name,
                credit_limit: (0, accounts_payable_currency_util_1.parseCreditLimit)(vendor.credit_limit),
                payment_currency: order.payment_currency,
                amount_pending: summary.amount_pending,
                amount_paid: summary.amount_paid,
            });
        }
        return (0, accounts_payable_currency_util_1.aggregatePayableVendors)(inputs);
    }
    async resolvePayableExchangeRate(tenantId) {
        const row = await this.exchangeRateService.getDailyRate(tenantId);
        if (!row) {
            return { exchange_rate: null, exchange_rate_date: null };
        }
        const rawDate = row.rate_date;
        const exchangeRateDate = rawDate instanceof Date ? rawDate.toISOString().slice(0, 10) : rawDate ? String(rawDate).slice(0, 10) : null;
        return {
            exchange_rate: Number(row.exchange_rate),
            exchange_rate_date: exchangeRateDate,
        };
    }
    payableExcelSheets(rows, currency, searchLabel, dailyRate) {
        const banner = this.payableRateBanner(dailyRate);
        const sheets = [];
        if (currency === query_accounting_base_dto_1.AccountsPayableCurrencyView.ALL) {
            sheets.push(this.payableAmbosSheet(rows, searchLabel, dailyRate, banner));
        }
        const views = currency === query_accounting_base_dto_1.AccountsPayableCurrencyView.ALL
            ? [query_accounting_base_dto_1.AccountsPayableCurrencyView.MXN, query_accounting_base_dto_1.AccountsPayableCurrencyView.USD]
            : [currency];
        for (const view of views) {
            const isUsd = view === query_accounting_base_dto_1.AccountsPayableCurrencyView.USD;
            const list = (0, accounts_payable_currency_util_1.sortPayableVendors)((0, accounts_payable_currency_util_1.filterPayableVendors)(rows, view), view);
            sheets.push({
                sheetName: isUsd ? 'Dólares USD' : 'Pesos MXN',
                title: isUsd ? 'Cuentas por pagar — dólares' : 'Cuentas por pagar — pesos',
                banner,
                subtitle: (0, excel_export_util_1.buildExportSubtitle)([
                    isUsd ? 'Montos en USD' : 'Montos en MXN',
                    searchLabel,
                    `${list.length} proveedores`,
                ]),
                headerColor: isUsd ? 'FF047857' : 'FF1D4ED8',
                titleColor: isUsd ? 'FF065F46' : 'FF1E3A8A',
                columns: [
                    { header: 'Proveedor', key: 'vendor', width: 36 },
                    { header: 'OC pendientes', key: 'pending_orders', width: 16, type: 'integer' },
                    { header: 'Monto adeudado', key: 'amount_pending', width: 18, type: 'currency' },
                    { header: 'Total en pesos', key: 'amount_total_mxn', width: 18, type: 'currency' },
                    { header: 'Progreso', key: 'progress', width: 14, type: 'percent' },
                ],
                rows: list.map((row) => ({
                    vendor: this.payableVendorLabel(row),
                    pending_orders: isUsd ? row.pending_order_count_usd : row.pending_order_count_mxn,
                    amount_pending: isUsd ? row.amount_pending_usd : row.amount_pending_mxn,
                    amount_total_mxn: (0, accounts_payable_currency_util_1.payableTotalInMxn)(isUsd ? 0 : row.amount_pending_mxn, isUsd ? row.amount_pending_usd : 0, dailyRate.exchange_rate),
                    progress: isUsd ? row.progress_percentage_usd : row.progress_percentage_mxn,
                })),
            });
        }
        return sheets;
    }
    payableAmbosSheet(rows, searchLabel, dailyRate, banner) {
        const list = (0, accounts_payable_currency_util_1.sortPayableVendors)((0, accounts_payable_currency_util_1.filterPayableVendors)(rows, query_accounting_base_dto_1.AccountsPayableCurrencyView.ALL), query_accounting_base_dto_1.AccountsPayableCurrencyView.ALL);
        const data = list.map((row) => ({
            vendor: this.payableVendorLabel(row),
            orders_mxn: row.pending_order_count_mxn,
            amount_mxn: row.amount_pending_mxn,
            orders_usd: row.pending_order_count_usd,
            amount_usd: row.amount_pending_usd,
            amount_total_mxn: (0, accounts_payable_currency_util_1.payableTotalInMxn)(row.amount_pending_mxn, row.amount_pending_usd, dailyRate.exchange_rate),
        }));
        const totalMxn = roundPayableMoney(data.reduce((sum, row) => sum + row.amount_mxn, 0));
        const totalUsd = roundPayableMoney(data.reduce((sum, row) => sum + row.amount_usd, 0));
        const totalInMxn = (0, accounts_payable_currency_util_1.payableTotalInMxn)(totalMxn, totalUsd, dailyRate.exchange_rate);
        return {
            sheetName: 'Ambos',
            title: 'Cuentas por pagar — ambos',
            banner,
            subtitle: (0, excel_export_util_1.buildExportSubtitle)([
                'Pesos + dólares × tipo de cambio del sistema',
                searchLabel,
                `${list.length} proveedores`,
            ]),
            headerColor: 'FF4338CA',
            titleColor: 'FF312E81',
            columns: [
                { header: 'Proveedor', key: 'vendor', width: 36 },
                { header: 'OC pesos', key: 'orders_mxn', width: 12, type: 'integer' },
                { header: 'Adeudado en pesos', key: 'amount_mxn', width: 20, type: 'currency' },
                { header: 'OC dólares', key: 'orders_usd', width: 14, type: 'integer' },
                { header: 'Adeudado en dólares', key: 'amount_usd', width: 20, type: 'currency' },
                { header: 'Total en pesos', key: 'amount_total_mxn', width: 20, type: 'currency' },
            ],
            rows: [
                ...data,
                {
                    vendor: 'Total',
                    orders_mxn: data.reduce((sum, row) => sum + row.orders_mxn, 0),
                    amount_mxn: totalMxn,
                    orders_usd: data.reduce((sum, row) => sum + row.orders_usd, 0),
                    amount_usd: totalUsd,
                    amount_total_mxn: totalInMxn,
                },
            ],
        };
    }
    payableRateBanner(dailyRate) {
        const rate = (0, accounts_payable_currency_util_1.normalizeExchangeRate)(dailyRate.exchange_rate);
        if (rate == null)
            return 'Sin tipo de cambio en el sistema';
        const formatted = formatPayableRate(rate);
        const date = formatPayableRateDate(dailyRate.exchange_rate_date);
        return date
            ? `Tipo de cambio del sistema: ${formatted}  ·  ${date}`
            : `Tipo de cambio del sistema: ${formatted}`;
    }
    payableVendorLabel(row) {
        return row.vendor_name?.trim() || row.razon_social?.trim() || row.company_name?.trim() || '—';
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
    buildPosCollectionsQuery(tenantId, filters, periodFrom, periodTo, customerType, dateBasis = query_accounting_base_dto_1.PosCollectionDateBasis.SHIFT) {
        const qb = this.collectionRepo
            .createQueryBuilder('collection')
            .innerJoinAndSelect('collection.sales_order', 'so')
            .innerJoinAndSelect('collection.pos_daily_shift', 'shift')
            .innerJoinAndSelect('collection.customer', 'customer')
            .leftJoinAndSelect('so.seller_user', 'seller_user')
            .leftJoinAndSelect('collection.collected_by_user', 'collected_by_user')
            .leftJoinAndSelect('so.billing_branch', 'sale_branch')
            .leftJoinAndSelect('so.warehouse', 'warehouse')
            .leftJoinAndSelect('warehouse.billing_branch', 'warehouse_branch')
            .leftJoinAndSelect('shift.billing_branch', 'shift_branch');
        this.applyPosCollectionScope(qb, tenantId, filters.billing_branch_id, periodFrom, periodTo, dateBasis, customerType, filters.search);
        return qb;
    }
    async aggregatePosCollections(tenantId, filters, periodFrom, periodTo, dateBasis, customerType, search) {
        const walkInSql = this.walkInCustomerSql('customer');
        const stampedSql = this.stampedInvoiceExistsSql('so');
        const qb = this.collectionRepo
            .createQueryBuilder('collection')
            .innerJoin('collection.sales_order', 'so')
            .innerJoin('collection.pos_daily_shift', 'shift')
            .innerJoin('collection.customer', 'customer')
            .select('COUNT(collection.id)', 'orders_collected')
            .addSelect('COALESCE(SUM(collection.order_total_mxn), 0)', 'amount_collected')
            .addSelect(`SUM(CASE WHEN ${walkInSql} AND NOT ${stampedSql} THEN 1 ELSE 0 END)`, 'walk_in_count')
            .addSelect(`SUM(CASE WHEN ${stampedSql} THEN 1 ELSE 0 END)`, 'invoiced_count');
        this.applyPosCollectionScope(qb, tenantId, filters.billing_branch_id, periodFrom, periodTo, dateBasis, customerType, search);
        qb.setParameter('walkInFiscal', WALK_IN_FISCAL_NAME).setParameter('walkInName', WALK_IN_DISPLAY_NAME);
        const row = await qb.getRawOne();
        return {
            orders_collected: Number(row?.orders_collected || 0),
            amount_collected: Number(Number(row?.amount_collected || 0).toFixed(2)),
            walk_in_count: Number(row?.walk_in_count || 0),
            invoiced_count: Number(row?.invoiced_count || 0),
        };
    }
    applyPosCollectionScope(qb, tenantId, branchId, periodFrom, periodTo, dateBasis, customerType, search) {
        qb.where('collection.tenant_id = :tenantId', { tenantId }).andWhere('shift.billing_branch_id = :branchId', { branchId });
        if (dateBasis === query_accounting_base_dto_1.PosCollectionDateBasis.COLLECTED) {
            qb.andWhere(`${(0, unclosed_shift_alert_1.posCalendarDateSql)('collection.created_at')} >= :periodFrom`, { periodFrom })
                .andWhere(`${(0, unclosed_shift_alert_1.posCalendarDateSql)('collection.created_at')} <= :periodTo`, { periodTo });
        }
        else {
            qb.andWhere('shift.shift_date >= :periodFrom', { periodFrom }).andWhere('shift.shift_date <= :periodTo', { periodTo });
        }
        if (customerType === query_accounting_base_dto_1.PosCollectionCustomerType.WALK_IN) {
            qb.andWhere(this.walkInCustomerSql('customer'), {
                walkInFiscal: WALK_IN_FISCAL_NAME,
                walkInName: WALK_IN_DISPLAY_NAME,
            }).andWhere(`NOT ${this.stampedInvoiceExistsSql('so')}`);
        }
        else if (customerType === query_accounting_base_dto_1.PosCollectionCustomerType.INVOICED) {
            qb.andWhere(this.stampedInvoiceExistsSql('so'));
        }
        const term = search?.trim();
        if (term) {
            qb.andWhere(`(so.folio ILIKE :search
          OR customer.name ILIKE :search
          OR customer.lastname ILIKE :search
          OR customer.company_name ILIKE :search
          OR so.walk_in_name ILIKE :search
          OR so.walk_in_rfc ILIKE :search)`, { search: `%${term}%` });
        }
    }
    mapPosCollectionRow(collection, stampedOrderIds) {
        const order = collection.sales_order;
        const customer = collection.customer;
        const customerFields = this.buildCustomerFields(customer);
        const hasStampedInvoice = order ? stampedOrderIds.has(order.id) : false;
        const billingBranch = this.mapCollectionBranch(order?.billing_branch ??
            order?.warehouse?.billing_branch ??
            collection.pos_daily_shift?.billing_branch);
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
            shift_date: collection.pos_daily_shift?.shift_date
                ? (0, unclosed_shift_alert_1.toDateOnlyString)(collection.pos_daily_shift.shift_date)
                : null,
            billing_branch: billingBranch,
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
    mapCollectionBranch(branch) {
        if (!branch) {
            return null;
        }
        const code = branch.code?.trim() || null;
        const city = branch.city?.trim() || null;
        if (!branch.id && !code && !city) {
            return null;
        }
        return {
            id: branch.id ?? null,
            code,
            city,
            label: [code, city].filter(Boolean).join(' · ') || null,
        };
    }
    formatPosUserLabel(user) {
        if (!user)
            return '';
        const name = this.buildUserName(user.first_name, user.last_name);
        return user.pos_user_code ? `${name} (${user.pos_user_code})` : name;
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
        pos_shifts_service_1.PosShiftsService,
        exchange_rate_service_1.ExchangeRateService])
], AccountingService);
function roundPayableMoney(value) {
    return Number(value.toFixed(2));
}
function formatPayableRate(rate) {
    const [whole, fraction = ''] = rate.toFixed(4).split('.');
    const trimmed = fraction.replace(/0+$/, '');
    const decimals = trimmed.length < 2 ? fraction.slice(0, 2) : trimmed;
    return `${whole}.${decimals}`;
}
function formatPayableRateDate(value) {
    if (!value)
        return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (!match)
        return value;
    return `${match[3]}/${match[2]}/${match[1]}`;
}
//# sourceMappingURL=accounting.service.js.map