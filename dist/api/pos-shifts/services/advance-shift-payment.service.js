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
exports.AdvanceShiftPaymentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const advance_shift_payment_entity_1 = require("../../../entities/pos/advance-shift-payment.entity");
const pos_daily_shift_entity_1 = require("../../../entities/pos/pos-daily-shift.entity");
const pos_daily_shift_status_enum_1 = require("../../../entities/pos/pos-daily-shift-status.enum");
const pos_sale_payment_method_enum_1 = require("../../../entities/pos/pos-sale-payment-method.enum");
const sales_order_entity_1 = require("../../../entities/sales-orders/sales-order.entity");
const sales_order_payment_entity_1 = require("../../../entities/sales-orders/sales-order-payment.entity");
const advance_payment_method_util_1 = require("../utils/advance-payment-method.util");
let AdvanceShiftPaymentService = class AdvanceShiftPaymentService {
    paymentRepo;
    shiftRepo;
    salesOrderRepo;
    orderPaymentRepo;
    constructor(paymentRepo, shiftRepo, salesOrderRepo, orderPaymentRepo) {
        this.paymentRepo = paymentRepo;
        this.shiftRepo = shiftRepo;
        this.salesOrderRepo = salesOrderRepo;
        this.orderPaymentRepo = orderPaymentRepo;
    }
    async record(input) {
        const amount = roundMoney(input.amountMxn);
        if (amount <= 0) {
            throw new common_1.BadRequestException('El anticipo no tiene un importe por cobrar');
        }
        const existing = await this.paymentRepo.findOne({
            where: { electronic_invoice_id: input.invoiceId },
        });
        if (existing && !existing.voided_at) {
            if (input.salesOrderId && !existing.sales_order_payment_id) {
                await this.applyToSalesOrder(existing, input.salesOrderId, input.userId);
            }
            return existing;
        }
        const row = this.paymentRepo.create({
            id: existing?.id ?? (0, uuid_1.v4)(),
            tenant_id: input.tenantId,
            quotation_id: input.quotationId ?? null,
            sales_order_id: input.salesOrderId ?? null,
            electronic_invoice_id: input.invoiceId,
            pos_daily_shift_id: input.shiftId,
            payment_method: input.paymentMethod,
            amount_mxn: amount,
            document_folio: input.documentFolio,
            collected_by_user_id: input.userId,
            sales_order_payment_id: null,
            voided_at: null,
        });
        const saved = await this.paymentRepo.save(row);
        if (input.salesOrderId) {
            await this.applyToSalesOrder(saved, input.salesOrderId, input.userId);
        }
        return saved;
    }
    async attachQuotationPaymentToOrder(tenantId, userId, quotationId, salesOrderId) {
        const row = await this.paymentRepo.findOne({
            where: {
                tenant_id: tenantId,
                quotation_id: quotationId,
                voided_at: (0, typeorm_2.IsNull)(),
            },
            order: { created_at: 'DESC' },
        });
        if (!row)
            return null;
        if (row.sales_order_payment_id) {
            const order = await this.salesOrderRepo.findOne({
                where: { id: salesOrderId, tenant_id: tenantId },
            });
            return order ? { payment_status: order.payment_status } : null;
        }
        row.sales_order_id = salesOrderId;
        await this.paymentRepo.save(row);
        const status = await this.applyToSalesOrder(row, salesOrderId, userId);
        return { payment_status: status };
    }
    async describeQuotationPayment(tenantId, quotationId) {
        const row = await this.paymentRepo.findOne({
            where: { tenant_id: tenantId, quotation_id: quotationId, voided_at: (0, typeorm_2.IsNull)() },
            relations: ['pos_daily_shift'],
            order: { created_at: 'DESC' },
        });
        if (!row)
            return null;
        return {
            amount_mxn: Number(row.amount_mxn),
            payment_method: row.payment_method,
            payment_method_label: (0, advance_payment_method_util_1.advancePaymentMethodLabel)(row.payment_method),
            shift_date: row.pos_daily_shift?.shift_date ?? null,
        };
    }
    async assertVoidable(tenantId, invoiceId) {
        const row = await this.activeByInvoice(tenantId, invoiceId);
        if (!row)
            return;
        const shift = await this.shiftRepo.findOne({ where: { id: row.pos_daily_shift_id } });
        if (!shift || shift.status !== pos_daily_shift_status_enum_1.PosDailyShiftStatus.OPEN) {
            throw new common_1.BadRequestException('El anticipo ya quedó en un corte cerrado. No se puede cancelar el cobro.');
        }
    }
    async voidByInvoice(tenantId, userId, invoiceId) {
        const row = await this.activeByInvoice(tenantId, invoiceId);
        if (!row)
            return;
        await this.assertVoidable(tenantId, invoiceId);
        if (row.sales_order_payment_id && row.sales_order_id) {
            await this.removeOrderPayment(tenantId, userId, row.sales_order_id, row.sales_order_payment_id);
        }
        row.voided_at = new Date();
        row.sales_order_payment_id = null;
        await this.paymentRepo.save(row);
    }
    async sumActiveByShift(dailyShiftId) {
        const rows = await this.paymentRepo.find({
            where: { pos_daily_shift_id: dailyShiftId, voided_at: (0, typeorm_2.IsNull)() },
        });
        const totals = { cash_mxn: 0, card_mxn: 0, transfer_mxn: 0, check_mxn: 0 };
        for (const row of rows) {
            const amount = Number(row.amount_mxn || 0);
            if (row.payment_method === pos_sale_payment_method_enum_1.PosSalePaymentMethod.CASH)
                totals.cash_mxn += amount;
            else if (row.payment_method === pos_sale_payment_method_enum_1.PosSalePaymentMethod.CARD)
                totals.card_mxn += amount;
            else if (row.payment_method === pos_sale_payment_method_enum_1.PosSalePaymentMethod.TRANSFER)
                totals.transfer_mxn += amount;
            else if (row.payment_method === pos_sale_payment_method_enum_1.PosSalePaymentMethod.CHECK)
                totals.check_mxn += amount;
        }
        return {
            cash_mxn: roundMoney(totals.cash_mxn),
            card_mxn: roundMoney(totals.card_mxn),
            transfer_mxn: roundMoney(totals.transfer_mxn),
            check_mxn: roundMoney(totals.check_mxn),
        };
    }
    async listActive(dailyShiftId) {
        const rows = await this.paymentRepo.find({
            where: { pos_daily_shift_id: dailyShiftId, voided_at: (0, typeorm_2.IsNull)() },
            order: { created_at: 'ASC' },
        });
        return rows.map((row) => ({
            id: row.id,
            folio: row.document_folio,
            payment_method: row.payment_method,
            payment_method_label: (0, advance_payment_method_util_1.advancePaymentMethodLabel)(row.payment_method),
            amount_mxn: Number(row.amount_mxn),
        }));
    }
    async activeByInvoice(tenantId, invoiceId) {
        return this.paymentRepo.findOne({
            where: { tenant_id: tenantId, electronic_invoice_id: invoiceId, voided_at: (0, typeorm_2.IsNull)() },
        });
    }
    async applyToSalesOrder(row, salesOrderId, userId) {
        const order = await this.salesOrderRepo.findOne({
            where: { id: salesOrderId, tenant_id: row.tenant_id },
        });
        if (!order || order.general_status === 'Cancelada') {
            return order?.payment_status ?? 'Pendiente';
        }
        const existing = await this.orderPaymentRepo.find({
            where: { sales_order_id: salesOrderId, tenant_id: row.tenant_id },
        });
        let paid = existing.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
        const pending = roundMoney(Math.max(Number(order.total || 0) - paid, 0));
        const amount = roundMoney(Math.min(Number(row.amount_mxn || 0), pending));
        if (amount > 0 && !row.sales_order_payment_id) {
            const payment = this.orderPaymentRepo.create({
                id: (0, uuid_1.v4)(),
                tenant_id: row.tenant_id,
                sales_order_id: salesOrderId,
                payment_date: new Date(),
                amount,
                currency: 'MXN',
                payment_method: row.payment_method,
                reference_number: null,
                notes: `Anticipo ${row.document_folio}`,
                source: 'advance',
                created_by: userId,
            });
            await this.orderPaymentRepo.save(payment);
            row.sales_order_id = salesOrderId;
            row.sales_order_payment_id = payment.id;
            await this.paymentRepo.save(row);
            paid += amount;
        }
        const stillPending = roundMoney(Math.max(Number(order.total || 0) - paid, 0));
        order.payment_status = stillPending <= 0 ? 'Pagado' : 'Pendiente';
        order.updated_by = userId;
        await this.salesOrderRepo.save(order);
        return order.payment_status;
    }
    async removeOrderPayment(tenantId, userId, salesOrderId, paymentId) {
        const payment = await this.orderPaymentRepo.findOne({
            where: { id: paymentId, sales_order_id: salesOrderId, tenant_id: tenantId },
        });
        if (payment?.source === 'advance') {
            await this.orderPaymentRepo.remove(payment);
        }
        const order = await this.salesOrderRepo.findOne({
            where: { id: salesOrderId, tenant_id: tenantId },
        });
        if (!order)
            return;
        const remaining = await this.orderPaymentRepo.find({
            where: { sales_order_id: salesOrderId, tenant_id: tenantId },
        });
        const paid = remaining.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const pending = roundMoney(Math.max(Number(order.total || 0) - paid, 0));
        order.payment_status = pending <= 0 ? 'Pagado' : 'Pendiente';
        order.updated_by = userId;
        await this.salesOrderRepo.save(order);
    }
};
exports.AdvanceShiftPaymentService = AdvanceShiftPaymentService;
exports.AdvanceShiftPaymentService = AdvanceShiftPaymentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(advance_shift_payment_entity_1.AdvanceShiftPayment)),
    __param(1, (0, typeorm_1.InjectRepository)(pos_daily_shift_entity_1.PosDailyShift)),
    __param(2, (0, typeorm_1.InjectRepository)(sales_order_entity_1.SalesOrder)),
    __param(3, (0, typeorm_1.InjectRepository)(sales_order_payment_entity_1.SalesOrderPayment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdvanceShiftPaymentService);
function roundMoney(value) {
    return Number(Number(value || 0).toFixed(2));
}
//# sourceMappingURL=advance-shift-payment.service.js.map