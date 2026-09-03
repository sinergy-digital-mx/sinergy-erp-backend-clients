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
var PosShiftsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PosShiftsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const pos_daily_shift_entity_1 = require("../../entities/pos/pos-daily-shift.entity");
const pos_partial_shift_entity_1 = require("../../entities/pos/pos-partial-shift.entity");
const pos_partial_shift_denomination_entity_1 = require("../../entities/pos/pos-partial-shift-denomination.entity");
const pos_daily_shift_status_enum_1 = require("../../entities/pos/pos-daily-shift-status.enum");
const pos_sale_collection_entity_1 = require("../../entities/pos/pos-sale-collection.entity");
const pos_sale_payment_method_enum_1 = require("../../entities/pos/pos-sale-payment-method.enum");
const user_entity_1 = require("../../entities/users/user.entity");
const pos_user_type_enum_1 = require("../../entities/users/pos-user-type.enum");
const sales_order_entity_1 = require("../../entities/sales-orders/sales-order.entity");
const customer_entity_1 = require("../../entities/customers/customer.entity");
const warehouse_entity_1 = require("../../entities/warehouse/warehouse.entity");
const sales_order_pos_receipt_service_1 = require("../sales-orders/services/sales-order-pos-receipt.service");
const sales_order_service_1 = require("../sales-orders/services/sales-order.service");
const pos_sale_collection_mapper_1 = require("./mappers/pos-sale-collection.mapper");
const cash_drawer_1 = require("./utils/cash-drawer");
const unclosed_shift_alert_1 = require("./utils/unclosed-shift-alert");
const customer_credit_service_1 = require("../customers/services/customer-credit.service");
const fiscal_invoice_readiness_util_1 = require("../customers/utils/fiscal-invoice-readiness.util");
const WALK_IN_FISCAL_NAME = 'VENTA DE MOSTRADOR';
const WALK_IN_DISPLAY_NAME = 'Público en General';
let PosShiftsService = PosShiftsService_1 = class PosShiftsService {
    dailyShiftRepo;
    partialShiftRepo;
    userRepo;
    salesOrderRepo;
    customerRepo;
    warehouseRepo;
    collectionRepo;
    posReceiptService;
    salesOrderService;
    customerCreditService;
    logger = new common_1.Logger(PosShiftsService_1.name);
    constructor(dailyShiftRepo, partialShiftRepo, userRepo, salesOrderRepo, customerRepo, warehouseRepo, collectionRepo, posReceiptService, salesOrderService, customerCreditService) {
        this.dailyShiftRepo = dailyShiftRepo;
        this.partialShiftRepo = partialShiftRepo;
        this.userRepo = userRepo;
        this.salesOrderRepo = salesOrderRepo;
        this.customerRepo = customerRepo;
        this.warehouseRepo = warehouseRepo;
        this.collectionRepo = collectionRepo;
        this.posReceiptService = posReceiptService;
        this.salesOrderService = salesOrderService;
        this.customerCreditService = customerCreditService;
    }
    async validateSellerCode(tenantId, terminalUserId, code) {
        const terminalUser = await this.requirePosTerminal(tenantId, terminalUserId);
        const dailyShift = await this.getBranchOpenDailyShift(tenantId, terminalUser.billing_branch_id);
        const seller = await this.userRepo.findOne({
            where: {
                tenant_id: tenantId,
                pos_user_code: code,
            },
            relations: ['status'],
        });
        if (!seller) {
            throw new common_1.NotFoundException('Código de vendedor no válido');
        }
        return {
            seller: this.mapSeller(seller),
            terminal_user: this.mapTerminalUser(terminalUser),
            daily_shift: dailyShift ? this.mapDailyShiftSummary(dailyShift) : null,
            requires_daily_shift: !dailyShift,
            pos_user_type: terminalUser.pos_user_type,
        };
    }
    async getCurrentDailyShift(tenantId, terminalUserId) {
        const terminalUser = await this.requirePosTerminal(tenantId, terminalUserId);
        return this.getBranchOpenDailyShift(tenantId, terminalUser.billing_branch_id);
    }
    async getCurrentDailyShiftResponse(tenantId, terminalUserId) {
        const shift = await this.getCurrentDailyShift(tenantId, terminalUserId);
        const dailyShift = shift
            ? await this.findDailyShiftById(shift.id, tenantId)
            : null;
        const unclosedShiftAlert = (0, unclosed_shift_alert_1.buildUnclosedShiftAlert)(shift);
        return {
            daily_shift: dailyShift,
            requires_previous_close: Boolean(unclosedShiftAlert),
            unclosed_shift_alert: unclosedShiftAlert,
        };
    }
    async resolveOpenDailyShiftId(tenantId, terminalUserId) {
        const terminalUser = await this.requirePosTerminal(tenantId, terminalUserId);
        const shift = await this.getBranchOpenDailyShift(tenantId, terminalUser.billing_branch_id);
        if (!shift) {
            throw new common_1.BadRequestException('No hay corte global abierto en la sucursal. La terminal de cobranza debe abrir el corte del día.');
        }
        return shift.id;
    }
    async getBranchOpenDailyShift(tenantId, billingBranchId) {
        return this.dailyShiftRepo
            .createQueryBuilder('shift')
            .innerJoinAndSelect('shift.terminal_user', 'terminal_user')
            .leftJoinAndSelect('shift.billing_branch', 'billing_branch')
            .leftJoinAndSelect('billing_branch.fiscal_configuration', 'fiscal_configuration')
            .leftJoinAndSelect('shift.partial_shifts', 'partial_shifts')
            .leftJoinAndSelect('partial_shifts.denominations', 'denominations')
            .leftJoinAndSelect('partial_shifts.performed_by_user', 'performed_by_user')
            .where('shift.tenant_id = :tenantId', { tenantId })
            .andWhere('shift.billing_branch_id = :billingBranchId', { billingBranchId })
            .andWhere('shift.status = :status', { status: pos_daily_shift_status_enum_1.PosDailyShiftStatus.OPEN })
            .andWhere('terminal_user.pos_user_type IN (:...collectTypes)', {
            collectTypes: pos_user_type_enum_1.POS_COLLECT_TYPES,
        })
            .orderBy('shift.shift_date', 'ASC')
            .addOrderBy('shift.created_at', 'ASC')
            .addOrderBy('partial_shifts.partial_number', 'ASC')
            .getOne();
    }
    buildOpenShiftConflictMessage(openShift, requestedShiftDate) {
        if (openShift.shift_date !== requestedShiftDate) {
            return `Hay un corte abierto del ${openShift.shift_date} sin cerrar. Ciérralo antes de abrir otro.`;
        }
        return 'Ya existe un corte global abierto en la sucursal. Ciérralo antes de abrir otro.';
    }
    async openDailyShift(tenantId, terminalUserId, dto) {
        const terminalUser = await this.requireCobranzaTerminal(tenantId, terminalUserId);
        const shiftDate = (0, unclosed_shift_alert_1.getTodayDateString)();
        const billingBranchId = terminalUser.billing_branch_id;
        const openShift = await this.getBranchOpenDailyShift(tenantId, billingBranchId);
        if (openShift) {
            throw new common_1.BadRequestException(this.buildOpenShiftConflictMessage(openShift, shiftDate));
        }
        const shift = this.dailyShiftRepo.create({
            tenant_id: tenantId,
            terminal_user_id: terminalUserId,
            billing_branch_id: billingBranchId,
            shift_date: shiftDate,
            opening_cash_mxn: dto.opening_cash_mxn,
            opening_cash_usd: dto.opening_cash_usd ?? 0,
            status: pos_daily_shift_status_enum_1.PosDailyShiftStatus.OPEN,
            notes: dto.notes ?? null,
        });
        const saved = await this.dailyShiftRepo.save(shift);
        const queuedSalesAssigned = await this.assignQueuedSalesToShift(tenantId, terminalUser.billing_branch_id, saved.id);
        const detail = await this.findDailyShiftById(saved.id, tenantId);
        return { shift: detail, queued_sales_assigned: queuedSalesAssigned };
    }
    async findDailyShiftById(id, tenantId) {
        const shift = await this.dailyShiftRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: [
                'terminal_user',
                'billing_branch',
                'billing_branch.fiscal_configuration',
                'partial_shifts',
                'partial_shifts.denominations',
                'partial_shifts.performed_by_user',
            ],
            order: {
                partial_shifts: { partial_number: 'ASC' },
            },
        });
        if (!shift) {
            throw new common_1.NotFoundException('Corte global no encontrado');
        }
        return this.mapDailyShiftDetail(shift);
    }
    async findDailyShifts(tenantId, query) {
        const qb = this.dailyShiftRepo
            .createQueryBuilder('shift')
            .leftJoinAndSelect('shift.terminal_user', 'terminal_user')
            .leftJoinAndSelect('shift.billing_branch', 'billing_branch')
            .leftJoinAndSelect('billing_branch.fiscal_configuration', 'fiscal_configuration')
            .leftJoinAndSelect('shift.partial_shifts', 'partial_shifts')
            .where('shift.tenant_id = :tenantId', { tenantId })
            .orderBy('shift.shift_date', 'DESC')
            .addOrderBy('partial_shifts.partial_number', 'ASC');
        if (query.terminal_user_id) {
            qb.andWhere('shift.terminal_user_id = :terminalUserId', {
                terminalUserId: query.terminal_user_id,
            });
        }
        if (query.billing_branch_id) {
            qb.andWhere('shift.billing_branch_id = :billingBranchId', {
                billingBranchId: query.billing_branch_id,
            });
        }
        if (query.shift_date) {
            qb.andWhere('shift.shift_date = :shiftDate', { shiftDate: query.shift_date });
        }
        if (query.status) {
            qb.andWhere('shift.status = :status', { status: query.status });
        }
        const shifts = await qb.getMany();
        return Promise.all(shifts.map((shift) => this.mapDailyShiftDetail(shift)));
    }
    async createPartialShift(tenantId, terminalUserId, dailyShiftId, dto) {
        const shift = await this.requireOpenDailyShift(tenantId, terminalUserId, dailyShiftId);
        if (!dto.denominations?.length) {
            throw new common_1.BadRequestException('Debe indicar al menos una denominación');
        }
        const { removedTotalMxn, removedTotalUsd, denominationRows } = this.computeDenominations(dto.denominations);
        const salesStats = await this.getShiftSalesStats(shift.id);
        const lastPartial = await this.partialShiftRepo.findOne({
            where: { daily_shift_id: shift.id },
            order: { partial_number: 'DESC' },
        });
        const partial = this.partialShiftRepo.create({
            tenant_id: tenantId,
            daily_shift_id: shift.id,
            partial_number: (lastPartial?.partial_number ?? 0) + 1,
            removed_total_mxn: removedTotalMxn,
            removed_total_usd: removedTotalUsd,
            sales_total_mxn: salesStats.total,
            sales_count: salesStats.count,
            performed_by_user_id: dto.performed_by_user_id ?? terminalUserId,
            notes: dto.notes ?? null,
        });
        const saved = await this.partialShiftRepo.save(partial);
        for (const row of denominationRows) {
            await this.partialShiftRepo.manager.save(pos_partial_shift_denomination_entity_1.PosPartialShiftDenomination, {
                ...row,
                partial_shift_id: saved.id,
            });
        }
        const full = await this.partialShiftRepo.findOne({
            where: { id: saved.id },
            relations: ['denominations', 'performed_by_user'],
        });
        return this.mapPartialShift(full);
    }
    async closeDailyShift(tenantId, terminalUserId, dailyShiftId, dto) {
        const shift = await this.requireOpenDailyShift(tenantId, terminalUserId, dailyShiftId);
        const cashTotals = await this.getShiftCashTotals(shift.id);
        const removed = await this.getShiftRemovedTotals(shift.id);
        const countedFromDenoms = dto.denominations?.length
            ? this.computeDenominations(dto.denominations)
            : null;
        const closingCashMxn = (0, cash_drawer_1.roundPosMoney)(countedFromDenoms ? countedFromDenoms.removedTotalMxn : dto.closing_cash_mxn);
        const closingCashUsd = (0, cash_drawer_1.roundPosMoney)(countedFromDenoms
            ? countedFromDenoms.removedTotalUsd
            : dto.closing_cash_usd ?? 0);
        const expectedMxn = (0, cash_drawer_1.expectedCashInDrawer)({
            opening: Number(shift.opening_cash_mxn),
            collectedCash: cashTotals.cash_mxn,
            removed: removed.mxn,
        });
        const expectedUsd = (0, cash_drawer_1.expectedCashInDrawer)({
            opening: Number(shift.opening_cash_usd),
            collectedCash: cashTotals.cash_usd,
            removed: removed.usd,
        });
        shift.status = pos_daily_shift_status_enum_1.PosDailyShiftStatus.CLOSED;
        shift.closed_at = new Date();
        shift.closing_cash_mxn = closingCashMxn;
        shift.closing_cash_usd = closingCashUsd;
        shift.expected_cash_mxn = expectedMxn;
        shift.expected_cash_usd = expectedUsd;
        shift.cash_difference_mxn = (0, cash_drawer_1.cashDifference)(closingCashMxn, expectedMxn);
        shift.cash_difference_usd = (0, cash_drawer_1.cashDifference)(closingCashUsd, expectedUsd);
        shift.closing_denominations = countedFromDenoms
            ? countedFromDenoms.denominationRows
            : null;
        if (dto.notes) {
            shift.notes = [shift.notes, dto.notes].filter(Boolean).join('\n');
        }
        await this.dailyShiftRepo.save(shift);
        return this.findDailyShiftById(shift.id, tenantId);
    }
    async resolvePosSaleContext(tenantId, terminalUserId, sellerUserId, dailyShiftId) {
        const terminalUser = await this.requirePosTerminal(tenantId, terminalUserId);
        await this.requireSellerUser(tenantId, sellerUserId);
        let shift = null;
        if (dailyShiftId) {
            shift = await this.dailyShiftRepo.findOne({
                where: {
                    id: dailyShiftId,
                    tenant_id: tenantId,
                    billing_branch_id: terminalUser.billing_branch_id,
                    status: pos_daily_shift_status_enum_1.PosDailyShiftStatus.OPEN,
                },
                relations: ['terminal_user'],
            });
            if (!shift) {
                throw new common_1.BadRequestException('No hay un corte global abierto válido para esta sucursal');
            }
            if (!(0, pos_user_type_enum_1.canPosCollect)(shift.terminal_user?.pos_user_type)) {
                throw new common_1.BadRequestException('El corte global debe pertenecer a una terminal de cobranza');
            }
        }
        else {
            shift = await this.getBranchOpenDailyShift(tenantId, terminalUser.billing_branch_id);
        }
        if (!shift) {
            if (!(0, pos_user_type_enum_1.canPosCollect)(terminalUser.pos_user_type)) {
                return { shift: null, terminalUser, queued: true };
            }
            throw new common_1.BadRequestException('No hay corte global abierto en la sucursal. La terminal de cobranza debe abrir el corte del día.');
        }
        if ((0, unclosed_shift_alert_1.isPreviousDayOpenShift)(shift.shift_date)) {
            if (!(0, pos_user_type_enum_1.canPosCollect)(terminalUser.pos_user_type)) {
                return { shift: null, terminalUser, queued: true };
            }
            throw new common_1.BadRequestException('Hay un corte abierto de un día anterior. Ciérralo antes de continuar.');
        }
        return { shift, terminalUser, queued: false };
    }
    async assertPosWarehouseForTerminal(tenantId, terminalUserId, warehouseId) {
        const terminalUser = await this.requirePosTerminal(tenantId, terminalUserId);
        if (!terminalUser.billing_branch_id) {
            throw new common_1.BadRequestException('El usuario POS no tiene una sucursal asignada');
        }
        const warehouse = await this.warehouseRepo.findOne({
            where: { id: warehouseId, tenant_id: tenantId },
        });
        if (!warehouse) {
            throw new common_1.BadRequestException('Almacén no encontrado');
        }
        if (warehouse.billing_branch_id !== terminalUser.billing_branch_id) {
            throw new common_1.BadRequestException(`El almacén "${warehouse.name}" no pertenece a la sucursal de esta terminal POS`);
        }
    }
    async assertOpenShiftForSale(tenantId, terminalUserId, sellerUserId, dailyShiftId) {
        const { shift, terminalUser } = await this.resolvePosSaleContext(tenantId, terminalUserId, sellerUserId, dailyShiftId);
        if (!shift) {
            throw new common_1.BadRequestException('No hay corte global abierto en la sucursal. La terminal de cobranza debe abrir el corte del día.');
        }
        return { shift, terminalUser };
    }
    async resolveWalkInCustomerId(tenantId) {
        const walkIn = (await this.customerRepo.findOne({
            where: { tenant_id: tenantId, fiscal_razon_social: WALK_IN_FISCAL_NAME },
        })) ??
            (await this.customerRepo.findOne({
                where: { tenant_id: tenantId, name: WALK_IN_DISPLAY_NAME },
            }));
        if (!walkIn) {
            throw new common_1.BadRequestException(`No existe cliente de mostrador. Cree un cliente "${WALK_IN_DISPLAY_NAME}" o con razón social "${WALK_IN_FISCAL_NAME}".`);
        }
        return walkIn.id;
    }
    async getPendingSales(tenantId, terminalUserId) {
        const terminalUser = await this.requireCobranzaTerminal(tenantId, terminalUserId);
        const branchId = terminalUser.billing_branch_id;
        const openShift = await this.getBranchOpenDailyShift(tenantId, branchId);
        const qb = this.salesOrderRepo
            .createQueryBuilder('so')
            .leftJoinAndSelect('so.seller_user', 'seller_user')
            .leftJoinAndSelect('so.terminal_user', 'terminal_user')
            .leftJoinAndSelect('so.customer', 'customer')
            .where('so.tenant_id = :tenantId', { tenantId })
            .andWhere('so.sales_order_type = :type', { type: 'POS' })
            .andWhere('so.general_status = :generalStatus', { generalStatus: 'Surtida' })
            .andWhere('so.payment_status = :paymentStatus', { paymentStatus: 'Pendiente' })
            .andWhere(`NOT EXISTS (
          SELECT 1 FROM pos_sale_collections col
          WHERE col.sales_order_id = so.id
        )`);
        if (openShift) {
            qb.andWhere('so.pos_daily_shift_id = :shiftId', { shiftId: openShift.id });
        }
        else {
            qb.innerJoin('so.warehouse', 'warehouse').andWhere('warehouse.billing_branch_id = :branchId', { branchId });
        }
        const orders = await qb.orderBy('so.created_at', 'ASC').getMany();
        const pendingByOrder = await this.salesOrderService.getAmountPendingMap(orders, tenantId);
        const creditEnabledByFiscal = await this.customerCreditService.getEnabledByFiscalMap(tenantId, orders
            .filter((order) => order.customer_id && order.fiscal_configuration_id)
            .map((order) => ({
            customerId: order.customer_id,
            fiscalConfigurationId: order.fiscal_configuration_id,
        })));
        return orders.map((order) => ({
            id: order.id,
            folio: order.folio,
            total: Number(order.total),
            amount_pending: pendingByOrder.get(order.id) ?? Number(order.total),
            subtotal: Number(order.subtotal),
            created_at: order.created_at,
            notes: order.notes,
            fiscal_configuration_id: order.fiscal_configuration_id,
            customer: order.customer
                ? {
                    id: order.customer.id,
                    name: order.customer.name,
                    lastname: order.customer.lastname,
                    company_name: order.customer.company_name,
                    fiscal_razon_social: order.customer.fiscal_razon_social,
                    is_walk_in: (0, pos_sale_collection_mapper_1.isWalkInCustomer)(order.customer),
                    credit_enabled: Boolean(order.fiscal_configuration_id &&
                        creditEnabledByFiscal.get(`${order.customer.id}:${order.fiscal_configuration_id}`)),
                }
                : null,
            seller_user: order.seller_user
                ? {
                    id: order.seller_user.id,
                    first_name: order.seller_user.first_name,
                    last_name: order.seller_user.last_name,
                    pos_user_code: order.seller_user.pos_user_code,
                }
                : null,
            terminal_user: order.terminal_user
                ? {
                    id: order.terminal_user.id,
                    first_name: order.terminal_user.first_name,
                    last_name: order.terminal_user.last_name,
                    pos_user_type: order.terminal_user.pos_user_type,
                }
                : null,
        }));
    }
    async getCollectedSales(tenantId, terminalUserId, dailyShiftId) {
        const terminalUser = await this.requireCobranzaTerminal(tenantId, terminalUserId);
        let shift;
        if (dailyShiftId) {
            shift = await this.dailyShiftRepo.findOne({
                where: {
                    id: dailyShiftId,
                    tenant_id: tenantId,
                    billing_branch_id: terminalUser.billing_branch_id,
                },
            });
            if (!shift) {
                throw new common_1.NotFoundException('Corte global no encontrado en esta sucursal');
            }
        }
        else {
            shift = await this.getBranchOpenDailyShift(tenantId, terminalUser.billing_branch_id);
        }
        if (!shift) {
            return {
                daily_shift: null,
                collected_sales: [],
                summary: this.buildCollectedSalesSummary([]),
            };
        }
        const collections = await this.collectionRepo.find({
            where: { tenant_id: tenantId, pos_daily_shift_id: shift.id },
            relations: [
                'sales_order',
                'sales_order.seller_user',
                'sales_order.terminal_user',
                'customer',
                'collected_by_user',
            ],
            order: { created_at: 'DESC' },
        });
        const collectedSales = collections.map((row) => this.mapCollectedSaleRow(row));
        return {
            daily_shift: this.mapDailyShiftSummary(shift),
            collected_sales: collectedSales,
            summary: this.buildCollectedSalesSummary(collections),
        };
    }
    async collectSale(tenantId, cobranzaUserId, salesOrderId, dto) {
        const cobranzaUser = await this.requireCobranzaTerminal(tenantId, cobranzaUserId);
        const order = await this.salesOrderRepo.findOne({
            where: { id: salesOrderId, tenant_id: tenantId },
            relations: ['warehouse', 'seller_user', 'terminal_user', 'customer'],
        });
        if (!order) {
            throw new common_1.NotFoundException('Orden de venta no encontrada');
        }
        if (order.sales_order_type !== 'POS') {
            throw new common_1.BadRequestException('Solo se pueden cobrar órdenes POS');
        }
        if (order.general_status !== 'Surtida' || order.payment_status !== 'Pendiente') {
            throw new common_1.BadRequestException('La orden no está pendiente de cobro (debe estar Surtida y Pendiente)');
        }
        const shift = await this.getBranchOpenDailyShift(tenantId, cobranzaUser.billing_branch_id);
        if (!shift) {
            throw new common_1.BadRequestException('Debe haber un corte global abierto para cobrar ventas');
        }
        const belongsToOpenShift = order.pos_daily_shift_id === shift.id;
        const belongsToBranch = order.warehouse?.billing_branch_id === cobranzaUser.billing_branch_id;
        if (!belongsToOpenShift && !belongsToBranch) {
            throw new common_1.BadRequestException('La orden no pertenece a la sucursal de esta terminal de cobranza');
        }
        const existingCollection = await this.collectionRepo.findOne({
            where: { sales_order_id: order.id },
        });
        if (existingCollection) {
            throw new common_1.ConflictException('Esta orden ya fue cobrada');
        }
        const orderTotal = Number(order.total);
        const amountPending = await this.salesOrderService.getAmountPending(order.id, tenantId);
        if (amountPending <= 0) {
            throw new common_1.BadRequestException('La orden ya no tiene saldo pendiente');
        }
        const customerId = await this.resolveCollectionCustomerId(tenantId, order, dto.customer_id);
        const customer = await this.customerRepo.findOne({
            where: { id: customerId, tenant_id: tenantId },
        });
        if (!customer) {
            throw new common_1.BadRequestException('Cliente no válido');
        }
        const isCredit = dto.payment_method === pos_sale_payment_method_enum_1.PosSalePaymentMethod.CREDIT;
        if (isCredit) {
            await this.assertCustomerCanUseCredit(customer, amountPending, order.fiscal_configuration_id);
        }
        const fiscal = (0, fiscal_invoice_readiness_util_1.getFiscalInvoiceReadiness)(customer);
        if (dto.generate_invoice) {
            if ((0, pos_sale_collection_mapper_1.isWalkInCustomer)(customer) || !fiscal.fiscal_ready_for_invoice) {
                throw new common_1.BadRequestException(`No se puede generar factura: faltan ${fiscal.fiscal_missing_fields.join(', ') || 'datos fiscales'}`);
            }
        }
        const payment = this.validateAndNormalizePayment(dto, amountPending);
        const collection = this.collectionRepo.create({
            id: (0, uuid_1.v4)(),
            tenant_id: tenantId,
            sales_order_id: order.id,
            pos_daily_shift_id: shift.id,
            customer_id: customerId,
            payment_method: dto.payment_method,
            order_total_mxn: amountPending,
            amount_cash_mxn: payment.amountCashMxn,
            amount_cash_usd: payment.amountCashUsd,
            usd_exchange_rate: payment.usdExchangeRate,
            amount_transfer_mxn: payment.amountTransferMxn,
            transfer_reference: payment.transferReference,
            amount_card_mxn: payment.amountCardMxn,
            amount_credit_mxn: payment.amountCreditMxn,
            card_reference: payment.cardReference ?? null,
            received_cash_mxn: payment.receivedCashMxn,
            received_cash_usd: payment.receivedCashUsd,
            change_cash_mxn: payment.changeCashMxn,
            change_cash_usd: payment.changeCashUsd,
            collected_by_user_id: cobranzaUserId,
            notes: dto.notes ?? null,
        });
        await this.collectionRepo.save(collection);
        const referenceNumber = payment.transferReference ||
            payment.cardReference ||
            null;
        if (!isCredit) {
            await this.salesOrderService.createPayment(order.id, {
                amount: amountPending,
                payment_date: new Date().toISOString().slice(0, 10),
                payment_method: dto.payment_method,
                currency: 'MXN',
                reference_number: referenceNumber ?? undefined,
                notes: dto.notes,
            }, tenantId, cobranzaUserId, 'pos_cobranza');
        }
        const paymentStatus = isCredit ? 'Pendiente' : 'Pagado';
        await this.salesOrderRepo.update({ id: order.id, tenant_id: tenantId }, {
            payment_status: paymentStatus,
            is_credit: isCredit,
            invoice_requested: Boolean(dto.generate_invoice),
            collected_by_user_id: cobranzaUserId,
            customer_id: customerId,
            pos_daily_shift_id: shift.id,
        });
        collection.customer = customer;
        collection.collected_by_user = cobranzaUser;
        let receipt = null;
        let receipt_error = null;
        try {
            receipt = await this.posReceiptService.generateAndSavePosTicket(tenantId, order.id, cobranzaUserId);
        }
        catch (error) {
            receipt_error =
                error instanceof Error ? error.message : 'Error desconocido al generar ticket';
            this.logger.error(`Venta cobrada pero fallo generacion de ticket ${order.id}: ${receipt_error}`);
        }
        return {
            message: isCredit
                ? 'Venta registrada a crédito correctamente'
                : 'Venta cobrada correctamente',
            collection: (0, pos_sale_collection_mapper_1.mapPosSaleCollection)(collection),
            receipt,
            receipt_error,
            invoice: {
                requested: Boolean(dto.generate_invoice),
                fiscal_ready: fiscal.fiscal_ready_for_invoice,
                fiscal_missing_fields: fiscal.fiscal_missing_fields,
                stamp_path: dto.generate_invoice
                    ? `/tenant/sales-orders/${order.id}/invoices/stamp`
                    : null,
            },
            sales_order: {
                id: order.id,
                folio: order.folio,
                payment_status: paymentStatus,
                is_credit: isCredit,
                invoice_requested: Boolean(dto.generate_invoice),
                collected_by_user_id: cobranzaUserId,
                customer_id: customerId,
                customer: (0, pos_sale_collection_mapper_1.mapPosCustomer)(customer),
                pos_daily_shift_id: shift.id,
                total: orderTotal,
                amount_collected: isCredit ? 0 : amountPending,
                amount_on_credit: isCredit ? amountPending : 0,
            },
        };
    }
    async assignQueuedSalesToShift(tenantId, billingBranchId, shiftId) {
        const shiftDate = (0, unclosed_shift_alert_1.getTodayDateString)();
        const queued = await this.salesOrderRepo
            .createQueryBuilder('so')
            .innerJoin('so.warehouse', 'warehouse')
            .where('so.tenant_id = :tenantId', { tenantId })
            .andWhere('so.sales_order_type = :type', { type: 'POS' })
            .andWhere('so.general_status = :queued', { queued: 'En cola' })
            .andWhere('so.payment_status = :pending', { pending: 'Pendiente' })
            .andWhere('DATE(so.created_at) = :shiftDate', { shiftDate })
            .andWhere('warehouse.billing_branch_id = :billingBranchId', { billingBranchId })
            .getMany();
        const leftoverUnpaid = await this.salesOrderRepo
            .createQueryBuilder('so')
            .innerJoin('so.warehouse', 'warehouse')
            .where('so.tenant_id = :tenantId', { tenantId })
            .andWhere('so.sales_order_type = :type', { type: 'POS' })
            .andWhere('so.general_status = :surtida', { surtida: 'Surtida' })
            .andWhere('so.payment_status = :pending', { pending: 'Pendiente' })
            .andWhere('warehouse.billing_branch_id = :billingBranchId', { billingBranchId })
            .andWhere('(so.pos_daily_shift_id IS NULL OR so.pos_daily_shift_id != :shiftId)', {
            shiftId,
        })
            .andWhere(`NOT EXISTS (
          SELECT 1 FROM pos_sale_collections col
          WHERE col.sales_order_id = so.id
        )`)
            .getMany();
        const toAssign = [...queued, ...leftoverUnpaid];
        if (!toAssign.length) {
            return 0;
        }
        const seen = new Set();
        const unique = toAssign.filter((order) => {
            if (seen.has(order.id)) {
                return false;
            }
            seen.add(order.id);
            return true;
        });
        for (const order of unique) {
            order.general_status = 'Surtida';
            order.pos_daily_shift_id = shiftId;
        }
        await this.salesOrderRepo.save(unique);
        return unique.length;
    }
    async requireSellerUser(tenantId, sellerUserId) {
        const seller = await this.userRepo.findOne({
            where: {
                id: sellerUserId,
                tenant_id: tenantId,
            },
        });
        if (!seller) {
            throw new common_1.BadRequestException('Vendedor no válido para venta POS');
        }
        if (seller.pos_user_code == null) {
            throw new common_1.BadRequestException('El vendedor debe tener un código POS para operar en ventas');
        }
        return seller;
    }
    async resolveCollectionCustomerId(tenantId, order, customerId) {
        const normalizedCustomerId = customerId === undefined || customerId === null ? undefined : Number(customerId);
        if (normalizedCustomerId !== undefined &&
            !Number.isNaN(normalizedCustomerId) &&
            normalizedCustomerId > 0) {
            const customer = await this.customerRepo.findOne({
                where: { id: normalizedCustomerId, tenant_id: tenantId },
            });
            if (!customer) {
                throw new common_1.BadRequestException('Cliente no válido');
            }
            return customer.id;
        }
        return order.customer_id;
    }
    validateAndNormalizePayment(dto, orderTotal) {
        const amountCashMxn = Number(dto.amount_cash_mxn ?? 0);
        const amountCashUsd = Number(dto.amount_cash_usd ?? 0);
        const amountTransferMxn = Number(dto.amount_transfer_mxn ?? 0);
        const amountCardMxn = Number(dto.amount_card_mxn ?? 0);
        const amountCreditMxn = dto.payment_method === pos_sale_payment_method_enum_1.PosSalePaymentMethod.CREDIT
            ? Number(dto.amount_credit_mxn ?? orderTotal)
            : Number(dto.amount_credit_mxn ?? 0);
        const usdExchangeRate = amountCashUsd > 0 ? Number(dto.usd_exchange_rate ?? 0) : null;
        if (amountCashUsd > 0 && (!usdExchangeRate || usdExchangeRate <= 0)) {
            throw new common_1.BadRequestException('usd_exchange_rate es obligatorio cuando se cobra en USD');
        }
        if (amountTransferMxn > 0 && !dto.transfer_reference?.trim()) {
            throw new common_1.BadRequestException('transfer_reference es obligatorio para pagos por transferencia');
        }
        const paidMxn = amountCashMxn +
            amountCashUsd * (usdExchangeRate ?? 0) +
            amountTransferMxn +
            amountCardMxn +
            amountCreditMxn;
        if (Math.abs(paidMxn - orderTotal) > 0.01) {
            throw new common_1.BadRequestException(`El monto cubierto (${paidMxn.toFixed(2)}) debe coincidir con el total de la orden (${orderTotal.toFixed(2)})`);
        }
        this.assertPaymentMethodShape(dto.payment_method, {
            amountCashMxn,
            amountCashUsd,
            amountTransferMxn,
            amountCardMxn,
            amountCreditMxn,
        });
        const receivedCashMxn = Number(dto.received_cash_mxn ?? amountCashMxn);
        const receivedCashUsd = Number(dto.received_cash_usd ?? amountCashUsd);
        const changeCashMxn = Math.max(0, receivedCashMxn - amountCashMxn);
        const changeCashUsd = Math.max(0, receivedCashUsd - amountCashUsd);
        if (receivedCashMxn + 0.0001 < amountCashMxn) {
            throw new common_1.BadRequestException('received_cash_mxn es menor al monto en efectivo MXN');
        }
        if (receivedCashUsd + 0.0001 < amountCashUsd) {
            throw new common_1.BadRequestException('received_cash_usd es menor al monto en efectivo USD');
        }
        return {
            amountCashMxn,
            amountCashUsd,
            usdExchangeRate,
            amountTransferMxn,
            transferReference: dto.transfer_reference?.trim() ?? null,
            amountCardMxn,
            amountCreditMxn,
            cardReference: dto.card_reference?.trim() ?? null,
            receivedCashMxn,
            receivedCashUsd,
            changeCashMxn,
            changeCashUsd,
        };
    }
    assertPaymentMethodShape(method, amounts) {
        const { amountCashMxn, amountCashUsd, amountTransferMxn, amountCardMxn, amountCreditMxn, } = amounts;
        const cashTotal = amountCashMxn + amountCashUsd;
        const nonZeroMethods = [
            cashTotal > 0,
            amountTransferMxn > 0,
            amountCardMxn > 0,
        ].filter(Boolean).length;
        switch (method) {
            case pos_sale_payment_method_enum_1.PosSalePaymentMethod.CASH:
                if (cashTotal <= 0 ||
                    amountTransferMxn > 0 ||
                    amountCardMxn > 0 ||
                    amountCreditMxn > 0) {
                    throw new common_1.BadRequestException('payment_method cash requiere montos en efectivo MXN y/o USD');
                }
                break;
            case pos_sale_payment_method_enum_1.PosSalePaymentMethod.TRANSFER:
                if (amountTransferMxn <= 0 ||
                    cashTotal > 0 ||
                    amountCardMxn > 0 ||
                    amountCreditMxn > 0) {
                    throw new common_1.BadRequestException('payment_method transfer requiere amount_transfer_mxn');
                }
                break;
            case pos_sale_payment_method_enum_1.PosSalePaymentMethod.CARD:
                if (amountCardMxn <= 0 ||
                    cashTotal > 0 ||
                    amountTransferMxn > 0 ||
                    amountCreditMxn > 0) {
                    throw new common_1.BadRequestException('payment_method card requiere amount_card_mxn');
                }
                break;
            case pos_sale_payment_method_enum_1.PosSalePaymentMethod.MIXED:
                if (nonZeroMethods < 2 || amountCreditMxn > 0) {
                    throw new common_1.BadRequestException('payment_method mixed requiere al menos dos formas de pago entre efectivo, transferencia y tarjeta');
                }
                break;
            case pos_sale_payment_method_enum_1.PosSalePaymentMethod.CREDIT:
                if (amountCreditMxn <= 0 ||
                    cashTotal > 0 ||
                    amountTransferMxn > 0 ||
                    amountCardMxn > 0) {
                    throw new common_1.BadRequestException('payment_method credit requiere amount_credit_mxn y no admite otras formas de pago');
                }
                break;
            default:
                throw new common_1.BadRequestException('Método de pago no válido');
        }
    }
    async assertCustomerCanUseCredit(customer, amount, fiscalConfigurationId) {
        if ((0, pos_sale_collection_mapper_1.isWalkInCustomer)(customer)) {
            throw new common_1.BadRequestException('El cliente de mostrador no puede pagar a crédito');
        }
        if (!fiscalConfigurationId) {
            throw new common_1.BadRequestException('La orden no tiene razón social para aplicar crédito');
        }
        const snapshot = await this.customerCreditService.getSnapshotForFiscal(customer, fiscalConfigurationId);
        if (!snapshot.credit_enabled) {
            throw new common_1.BadRequestException('El cliente no tiene crédito activo con esta razón social');
        }
        if (amount - snapshot.credit_available > 0.01) {
            throw new common_1.BadRequestException(`Crédito insuficiente. Disponible: ${snapshot.credit_available.toFixed(2)} MXN`);
        }
    }
    mapCollectedSaleRow(collection) {
        const order = collection.sales_order;
        return {
            collection_id: collection.id,
            collected_at: collection.created_at,
            payment: (0, pos_sale_collection_mapper_1.mapPosSaleCollection)(collection),
            sales_order: order
                ? {
                    id: order.id,
                    folio: order.folio,
                    total: Number(order.total),
                    subtotal: Number(order.subtotal),
                    created_at: order.created_at,
                    seller_user: order.seller_user
                        ? {
                            id: order.seller_user.id,
                            first_name: order.seller_user.first_name,
                            last_name: order.seller_user.last_name,
                            pos_user_code: order.seller_user.pos_user_code,
                        }
                        : null,
                    terminal_user: order.terminal_user
                        ? {
                            id: order.terminal_user.id,
                            first_name: order.terminal_user.first_name,
                            last_name: order.terminal_user.last_name,
                            pos_user_type: order.terminal_user.pos_user_type,
                        }
                        : null,
                }
                : null,
            customer: collection.customer
                ? {
                    id: collection.customer.id,
                    name: collection.customer.name,
                    lastname: collection.customer.lastname,
                    company_name: collection.customer.company_name,
                    fiscal_razon_social: collection.customer.fiscal_razon_social,
                    is_walk_in: (0, pos_sale_collection_mapper_1.isWalkInCustomer)(collection.customer),
                }
                : null,
            collected_by_user: collection.collected_by_user
                ? {
                    id: collection.collected_by_user.id,
                    first_name: collection.collected_by_user.first_name,
                    last_name: collection.collected_by_user.last_name,
                }
                : null,
        };
    }
    buildCollectedSalesSummary(collections) {
        const summary = {
            count: collections.length,
            total_mxn: 0,
            cash_mxn: 0,
            cash_usd: 0,
            transfer_mxn: 0,
            card_mxn: 0,
            credit_mxn: 0,
        };
        for (const collection of collections) {
            summary.total_mxn += Number(collection.order_total_mxn);
            summary.cash_mxn += Number(collection.amount_cash_mxn);
            summary.cash_usd += Number(collection.amount_cash_usd);
            summary.transfer_mxn += Number(collection.amount_transfer_mxn);
            summary.card_mxn += Number(collection.amount_card_mxn);
            summary.credit_mxn += Number(collection.amount_credit_mxn ?? 0);
        }
        return summary;
    }
    async getSaleReceipt(tenantId, salesOrderId) {
        return {
            receipt: await this.posReceiptService.getPosTicket(tenantId, salesOrderId),
        };
    }
    async getSaleReceiptRaw(tenantId, salesOrderId, res) {
        const { buffer, fileName } = await this.posReceiptService.getPosTicketRawBuffer(tenantId, salesOrderId);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
        res.send(buffer);
    }
    async getSaleCollection(tenantId, salesOrderId) {
        const collection = await this.collectionRepo.findOne({
            where: { tenant_id: tenantId, sales_order_id: salesOrderId },
            relations: ['customer', 'collected_by_user'],
        });
        if (!collection) {
            throw new common_1.NotFoundException('Cobro no encontrado para esta orden');
        }
        return { collection: (0, pos_sale_collection_mapper_1.mapPosSaleCollection)(collection) };
    }
    async requireCobranzaTerminal(tenantId, userId) {
        const user = await this.requirePosTerminal(tenantId, userId);
        if (!(0, pos_user_type_enum_1.canPosCollect)(user.pos_user_type)) {
            throw new common_1.ForbiddenException('Esta operación solo está disponible en terminales de cobranza');
        }
        return user;
    }
    async requirePosTerminal(tenantId, userId) {
        const user = await this.userRepo.findOne({
            where: { id: userId, tenant_id: tenantId },
            relations: ['billing_branch', 'billing_branch.fiscal_configuration'],
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        if (!user.is_pos_user) {
            throw new common_1.ForbiddenException('Solo usuarios de tipo POS pueden operar la terminal');
        }
        if (!user.billing_branch_id) {
            throw new common_1.BadRequestException('El usuario POS debe tener una sucursal asignada');
        }
        if (!user.pos_user_type) {
            throw new common_1.BadRequestException('El usuario POS debe tener un tipo asignado (VENTAS, COBRANZA o AMBOS)');
        }
        return user;
    }
    async requireOpenDailyShift(tenantId, terminalUserId, dailyShiftId) {
        const terminalUser = await this.requireCobranzaTerminal(tenantId, terminalUserId);
        const shift = await this.dailyShiftRepo.findOne({
            where: {
                id: dailyShiftId,
                tenant_id: tenantId,
                status: pos_daily_shift_status_enum_1.PosDailyShiftStatus.OPEN,
            },
        });
        if (!shift) {
            throw new common_1.NotFoundException('Corte global abierto no encontrado');
        }
        if (shift.billing_branch_id !== terminalUser.billing_branch_id) {
            throw new common_1.BadRequestException('Este corte no pertenece a la sucursal activa');
        }
        return shift;
    }
    async getShiftRemovedTotals(dailyShiftId) {
        const result = await this.partialShiftRepo
            .createQueryBuilder('partial')
            .select('COALESCE(SUM(partial.removed_total_mxn), 0)', 'mxn')
            .addSelect('COALESCE(SUM(partial.removed_total_usd), 0)', 'usd')
            .where('partial.daily_shift_id = :dailyShiftId', { dailyShiftId })
            .getRawOne();
        return {
            mxn: Number(result?.mxn ?? 0),
            usd: Number(result?.usd ?? 0),
        };
    }
    async getShiftCashTotals(dailyShiftId) {
        const result = await this.collectionRepo
            .createQueryBuilder('collection')
            .select('COALESCE(SUM(collection.amount_cash_mxn), 0)', 'cash_mxn')
            .addSelect('COALESCE(SUM(collection.amount_cash_usd), 0)', 'cash_usd')
            .addSelect('COALESCE(SUM(collection.amount_transfer_mxn), 0)', 'transfer_mxn')
            .addSelect('COALESCE(SUM(collection.amount_card_mxn), 0)', 'card_mxn')
            .addSelect('COALESCE(SUM(collection.amount_credit_mxn), 0)', 'credit_mxn')
            .where('collection.pos_daily_shift_id = :dailyShiftId', { dailyShiftId })
            .getRawOne();
        return {
            cash_mxn: Number(result?.cash_mxn ?? 0),
            cash_usd: Number(result?.cash_usd ?? 0),
            transfer_mxn: Number(result?.transfer_mxn ?? 0),
            card_mxn: Number(result?.card_mxn ?? 0),
            credit_mxn: Number(result?.credit_mxn ?? 0),
        };
    }
    async getShiftSalesStats(dailyShiftId) {
        const result = await this.salesOrderRepo
            .createQueryBuilder('so')
            .select('COALESCE(SUM(so.total), 0)', 'total')
            .addSelect('COUNT(so.id)', 'count')
            .where('so.pos_daily_shift_id = :dailyShiftId', { dailyShiftId })
            .andWhere('so.sales_order_type = :type', { type: 'POS' })
            .andWhere('so.general_status != :cancelled', { cancelled: 'Cancelada' })
            .getRawOne();
        return {
            total: Number(result?.total ?? 0),
            count: Number(result?.count ?? 0),
        };
    }
    async getShiftSellerUserIds(dailyShiftId) {
        const rows = await this.salesOrderRepo
            .createQueryBuilder('so')
            .select('DISTINCT so.seller_user_id', 'seller_user_id')
            .where('so.pos_daily_shift_id = :dailyShiftId', { dailyShiftId })
            .andWhere('so.seller_user_id IS NOT NULL')
            .getRawMany();
        return rows.map((row) => row.seller_user_id);
    }
    computeDenominations(denominations) {
        let removedTotalMxn = 0;
        let removedTotalUsd = 0;
        const denominationRows = [];
        for (const item of denominations) {
            const amount = (0, cash_drawer_1.roundPosMoney)(Number(item.denomination) * item.bill_count);
            denominationRows.push({
                currency: item.currency,
                denomination: Number(item.denomination),
                bill_count: item.bill_count,
                amount,
            });
            if (item.currency === 'MXN') {
                removedTotalMxn += amount;
            }
            else {
                removedTotalUsd += amount;
            }
        }
        return {
            removedTotalMxn: (0, cash_drawer_1.roundPosMoney)(removedTotalMxn),
            removedTotalUsd: (0, cash_drawer_1.roundPosMoney)(removedTotalUsd),
            denominationRows,
        };
    }
    mapSeller(user) {
        return {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            pos_user_code: user.pos_user_code,
        };
    }
    mapTerminalUser(user) {
        return {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            billing_branch_id: user.billing_branch_id,
            pos_user_type: user.pos_user_type,
            billing_branch: user.billing_branch
                ? {
                    id: user.billing_branch.id,
                    code: user.billing_branch.code,
                    fiscal_configuration: user.billing_branch.fiscal_configuration
                        ? {
                            id: user.billing_branch.fiscal_configuration.id,
                            razon_social: user.billing_branch.fiscal_configuration.razon_social,
                            rfc: user.billing_branch.fiscal_configuration.rfc,
                        }
                        : null,
                }
                : null,
        };
    }
    mapDailyShiftSummary(shift) {
        return {
            id: shift.id,
            shift_date: shift.shift_date,
            status: shift.status,
            opening_cash_mxn: Number(shift.opening_cash_mxn),
            opening_cash_usd: Number(shift.opening_cash_usd),
        };
    }
    async mapDailyShiftDetail(shift) {
        const salesStats = await this.getShiftSalesStats(shift.id);
        const sellerIds = await this.getShiftSellerUserIds(shift.id);
        const partialShifts = (shift.partial_shifts ?? []).map((partial) => this.mapPartialShift(partial));
        const removedMxn = partialShifts.reduce((sum, partial) => sum + partial.removed_total_mxn, 0);
        const removedUsd = partialShifts.reduce((sum, partial) => sum + partial.removed_total_usd, 0);
        const cashTotals = await this.getShiftCashTotals(shift.id);
        const expectedMxn = (0, cash_drawer_1.expectedCashInDrawer)({
            opening: Number(shift.opening_cash_mxn),
            collectedCash: cashTotals.cash_mxn,
            removed: removedMxn,
        });
        const expectedUsd = (0, cash_drawer_1.expectedCashInDrawer)({
            opening: Number(shift.opening_cash_usd),
            collectedCash: cashTotals.cash_usd,
            removed: removedUsd,
        });
        const closingMxn = shift.closing_cash_mxn == null ? null : Number(shift.closing_cash_mxn);
        const closingUsd = shift.closing_cash_usd == null ? null : Number(shift.closing_cash_usd);
        return {
            id: shift.id,
            shift_date: shift.shift_date,
            status: shift.status,
            is_previous_day: shift.status === pos_daily_shift_status_enum_1.PosDailyShiftStatus.OPEN &&
                (0, unclosed_shift_alert_1.isPreviousDayOpenShift)(shift.shift_date),
            opening_cash_mxn: Number(shift.opening_cash_mxn),
            opening_cash_usd: Number(shift.opening_cash_usd),
            closed_at: shift.closed_at,
            notes: shift.notes,
            created_at: shift.created_at,
            updated_at: shift.updated_at,
            terminal_user: shift.terminal_user
                ? this.mapTerminalUser(shift.terminal_user)
                : null,
            billing_branch_id: shift.billing_branch_id,
            billing_branch: shift.billing_branch
                ? {
                    id: shift.billing_branch.id,
                    code: shift.billing_branch.code,
                    display_name: [shift.billing_branch.code, shift.billing_branch.city]
                        .filter(Boolean)
                        .join(' — '),
                    fiscal_configuration: shift.billing_branch.fiscal_configuration
                        ? {
                            id: shift.billing_branch.fiscal_configuration.id,
                            razon_social: shift.billing_branch.fiscal_configuration.razon_social,
                            rfc: shift.billing_branch.fiscal_configuration.rfc,
                        }
                        : null,
                }
                : null,
            sales_summary: {
                total_mxn: salesStats.total,
                sales_count: salesStats.count,
                seller_user_ids: sellerIds,
                sellers_count: sellerIds.length,
            },
            partial_shifts: partialShifts,
            totals: {
                partial_shifts_count: partialShifts.length,
                removed_total_mxn: removedMxn,
                removed_total_usd: removedUsd,
                sales_total_mxn: salesStats.total,
            },
            cash_drawer: {
                opening_cash_mxn: Number(shift.opening_cash_mxn),
                opening_cash_usd: Number(shift.opening_cash_usd),
                collected_cash_mxn: cashTotals.cash_mxn,
                collected_cash_usd: cashTotals.cash_usd,
                collected_transfer_mxn: cashTotals.transfer_mxn,
                collected_card_mxn: cashTotals.card_mxn,
                collected_credit_mxn: cashTotals.credit_mxn,
                removed_total_mxn: removedMxn,
                removed_total_usd: removedUsd,
                expected_cash_mxn: shift.expected_cash_mxn == null
                    ? expectedMxn
                    : Number(shift.expected_cash_mxn),
                expected_cash_usd: shift.expected_cash_usd == null
                    ? expectedUsd
                    : Number(shift.expected_cash_usd),
                closing_cash_mxn: closingMxn,
                closing_cash_usd: closingUsd,
                cash_difference_mxn: shift.cash_difference_mxn == null
                    ? null
                    : Number(shift.cash_difference_mxn),
                cash_difference_usd: shift.cash_difference_usd == null
                    ? null
                    : Number(shift.cash_difference_usd),
                closing_denominations: shift.closing_denominations ?? null,
            },
        };
    }
    mapPartialShift(partial) {
        const denominations = (partial.denominations ?? []).map((denom) => ({
            id: denom.id,
            currency: denom.currency,
            denomination: Number(denom.denomination),
            bill_count: denom.bill_count,
            amount: Number(denom.amount),
        }));
        const removedTotalMxn = Number(partial.removed_total_mxn);
        const removedTotalUsd = Number(partial.removed_total_usd);
        const mxnFromDenominations = denominations
            .filter((denom) => denom.currency === 'MXN')
            .reduce((sum, denom) => sum + denom.amount, 0);
        const usdFromDenominations = denominations
            .filter((denom) => denom.currency === 'USD')
            .reduce((sum, denom) => sum + denom.amount, 0);
        const totalMxn = removedTotalMxn > 0 ? removedTotalMxn : mxnFromDenominations;
        const totalUsd = removedTotalUsd > 0 ? removedTotalUsd : usdFromDenominations;
        return {
            id: partial.id,
            partial_number: partial.partial_number,
            removed_total_mxn: totalMxn,
            removed_total_usd: totalUsd,
            total_mxn: totalMxn,
            total_usd: totalUsd,
            sales_total_mxn: Number(partial.sales_total_mxn),
            sales_count: partial.sales_count,
            notes: partial.notes,
            created_at: partial.created_at,
            performed_by_user: partial.performed_by_user
                ? this.mapSeller(partial.performed_by_user)
                : null,
            denominations,
        };
    }
};
exports.PosShiftsService = PosShiftsService;
exports.PosShiftsService = PosShiftsService = PosShiftsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(pos_daily_shift_entity_1.PosDailyShift)),
    __param(1, (0, typeorm_1.InjectRepository)(pos_partial_shift_entity_1.PosPartialShift)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(sales_order_entity_1.SalesOrder)),
    __param(4, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(5, (0, typeorm_1.InjectRepository)(warehouse_entity_1.Warehouse)),
    __param(6, (0, typeorm_1.InjectRepository)(pos_sale_collection_entity_1.PosSaleCollection)),
    __param(7, (0, common_1.Inject)((0, common_1.forwardRef)(() => sales_order_pos_receipt_service_1.SalesOrderPosReceiptService))),
    __param(8, (0, common_1.Inject)((0, common_1.forwardRef)(() => sales_order_service_1.SalesOrderService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        sales_order_pos_receipt_service_1.SalesOrderPosReceiptService,
        sales_order_service_1.SalesOrderService,
        customer_credit_service_1.CustomerCreditService])
], PosShiftsService);
//# sourceMappingURL=pos-shifts.service.js.map