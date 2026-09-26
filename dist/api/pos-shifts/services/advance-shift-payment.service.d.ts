import { Repository } from 'typeorm';
import { AdvanceShiftPayment } from '../../../entities/pos/advance-shift-payment.entity';
import { PosDailyShift } from '../../../entities/pos/pos-daily-shift.entity';
import { PosSalePaymentMethod } from '../../../entities/pos/pos-sale-payment-method.enum';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { SalesOrderPayment } from '../../../entities/sales-orders/sales-order-payment.entity';
export interface RecordAdvanceShiftPaymentInput {
    tenantId: string;
    userId: string;
    shiftId: string;
    invoiceId: string;
    amountMxn: number;
    paymentMethod: PosSalePaymentMethod;
    documentFolio: string;
    quotationId?: string | null;
    salesOrderId?: string | null;
}
export declare class AdvanceShiftPaymentService {
    private readonly paymentRepo;
    private readonly shiftRepo;
    private readonly salesOrderRepo;
    private readonly orderPaymentRepo;
    constructor(paymentRepo: Repository<AdvanceShiftPayment>, shiftRepo: Repository<PosDailyShift>, salesOrderRepo: Repository<SalesOrder>, orderPaymentRepo: Repository<SalesOrderPayment>);
    record(input: RecordAdvanceShiftPaymentInput): Promise<AdvanceShiftPayment>;
    attachQuotationPaymentToOrder(tenantId: string, userId: string, quotationId: string, salesOrderId: string): Promise<{
        payment_status: string;
    } | null>;
    describeQuotationPayment(tenantId: string, quotationId: string): Promise<{
        amount_mxn: number;
        payment_method: PosSalePaymentMethod;
        payment_method_label: string;
        shift_date: string;
    } | null>;
    assertVoidable(tenantId: string, invoiceId: string): Promise<void>;
    voidByInvoice(tenantId: string, userId: string, invoiceId: string): Promise<void>;
    sumActiveByShift(dailyShiftId: string): Promise<{
        cash_mxn: number;
        card_mxn: number;
        transfer_mxn: number;
        check_mxn: number;
    }>;
    listActive(dailyShiftId: string): Promise<{
        id: string;
        folio: string;
        payment_method: PosSalePaymentMethod;
        payment_method_label: string;
        amount_mxn: number;
    }[]>;
    private activeByInvoice;
    private applyToSalesOrder;
    private removeOrderPayment;
}
