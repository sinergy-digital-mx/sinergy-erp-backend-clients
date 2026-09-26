import { Repository } from 'typeorm';
import { Quotation } from '../../../entities/quotations/quotation.entity';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { CancelElectronicInvoiceDto } from '../../electronic-invoicing/dto/cancel-electronic-invoice.dto';
import { StampAdvanceInvoiceDto } from '../../electronic-invoicing/dto/stamp-advance-invoice.dto';
import { AdvanceCfdiService } from '../../electronic-invoicing/services/advance-cfdi.service';
import { ElectronicInvoiceService } from '../../electronic-invoicing/services/electronic-invoice.service';
import { PosShiftsService } from '../../pos-shifts/pos-shifts.service';
import { AdvanceShiftPaymentService } from '../../pos-shifts/services/advance-shift-payment.service';
export declare class QuotationAdvanceInvoiceService {
    private readonly quotationRepo;
    private readonly salesOrderRepo;
    private readonly advanceCfdi;
    private readonly electronicInvoiceService;
    private readonly posShiftsService;
    private readonly advancePayments;
    constructor(quotationRepo: Repository<Quotation>, salesOrderRepo: Repository<SalesOrder>, advanceCfdi: AdvanceCfdiService, electronicInvoiceService: ElectronicInvoiceService, posShiftsService: PosShiftsService, advancePayments: AdvanceShiftPaymentService);
    collectionPreview(id: string, tenantId: string): Promise<{
        billing_branch_id: string;
        sucursal: string | null;
        open_shift: {
            id: string;
            shift_date: string;
        } | null;
    }>;
    describe(quotation: Quotation): Promise<{
        enabled: boolean;
        summary: import("../../electronic-invoicing/services/advance-cfdi.service").AdvanceInvoiceSummary | null;
        canStamp: boolean;
        blocksCancel: boolean;
        blocksEdit: boolean;
        payment: {
            amount_mxn: number;
            payment_method: import("../../../entities/pos/pos-sale-payment-method.enum").PosSalePaymentMethod;
            payment_method_label: string;
            shift_date: string;
        } | null;
    }>;
    list(id: string, tenantId: string): Promise<import("../../../entities/electronic-invoicing").ElectronicInvoice[]>;
    stamp(id: string, tenantId: string, userId: string, dto: StampAdvanceInvoiceDto): Promise<import("../../../entities/electronic-invoicing").ElectronicInvoice>;
    cancel(id: string, invoiceId: string, tenantId: string, userId: string, dto: CancelElectronicInvoiceDto): Promise<import("../../../entities/electronic-invoicing").ElectronicInvoice>;
    assertQuotationCancellable(quotation: Quotation): Promise<void>;
    attachToSalesOrder(tenantId: string, userId: string, quotationId: string, salesOrderId: string): Promise<{
        payment_status: string;
    } | null>;
    private requireQuotation;
    private parties;
}
