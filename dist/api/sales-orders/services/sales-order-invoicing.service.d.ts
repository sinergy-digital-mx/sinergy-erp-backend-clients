import { Repository } from 'typeorm';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { SalesOrderPayment } from '../../../entities/sales-orders/sales-order-payment.entity';
import { Customer } from '../../../entities/customers/customer.entity';
import { ElectronicInvoiceService } from '../../electronic-invoicing/services/electronic-invoice.service';
import { AdvanceCfdiService } from '../../electronic-invoicing/services/advance-cfdi.service';
import { CancelElectronicInvoiceDto } from '../../electronic-invoicing/dto/cancel-electronic-invoice.dto';
import { StampSalesOrderInvoiceDto } from '../dto/stamp-sales-order-invoice.dto';
import { StampAdvanceInvoiceDto } from '../../electronic-invoicing/dto/stamp-advance-invoice.dto';
import { ApplyAdvanceInvoiceDto } from '../../electronic-invoicing/dto/apply-advance-invoice.dto';
import { PosShiftsService } from '../../pos-shifts/pos-shifts.service';
import { AdvanceShiftPaymentService } from '../../pos-shifts/services/advance-shift-payment.service';
import { ServiceSubscriptionPeriod } from '../../../entities/service-subscriptions/service-subscription-period.entity';
import { ElectronicInvoice } from '../../../entities/electronic-invoicing/electronic-invoice.entity';
export declare class SalesOrderInvoicingService {
    private readonly salesOrderRepo;
    private readonly paymentRepo;
    private readonly customerRepo;
    private readonly electronicInvoiceService;
    private readonly advanceCfdi;
    private readonly posShiftsService;
    private readonly advancePayments;
    private readonly periodRepo;
    constructor(salesOrderRepo: Repository<SalesOrder>, paymentRepo: Repository<SalesOrderPayment>, customerRepo: Repository<Customer>, electronicInvoiceService: ElectronicInvoiceService, advanceCfdi: AdvanceCfdiService, posShiftsService: PosShiftsService, advancePayments: AdvanceShiftPaymentService, periodRepo: Repository<ServiceSubscriptionPeriod>);
    registerExistingInvoice(salesOrderId: string, tenantId: string, userId: string, files: {
        xml?: {
            buffer: Buffer;
            originalname?: string;
        };
        pdf?: {
            buffer: Buffer;
            originalname?: string;
        };
    }, typedUuid?: string): Promise<ElectronicInvoice>;
    attachManualFiles(salesOrderId: string, invoiceId: string, tenantId: string, files: {
        xml?: {
            buffer: Buffer;
            originalname?: string;
        };
        pdf?: {
            buffer: Buffer;
            originalname?: string;
        };
    }): Promise<ElectronicInvoice>;
    unlinkManualInvoice(salesOrderId: string, invoiceId: string, tenantId: string): Promise<void>;
    private readExistingCfdi;
    private readXmlCfdi;
    listInvoices(salesOrderId: string, tenantId: string): Promise<ElectronicInvoice[]>;
    getPaymentComplementStatus(salesOrderId: string, tenantId: string): Promise<PaymentComplementStatus>;
    stampPaymentComplement(salesOrderId: string, tenantId: string, userId: string): Promise<ElectronicInvoice>;
    private repairStoredStampDate;
    stampInvoice(salesOrderId: string, tenantId: string, userId: string, dto: StampSalesOrderInvoiceDto): Promise<ElectronicInvoice>;
    cancelInvoice(salesOrderId: string, invoiceId: string, tenantId: string, userId: string, dto: CancelElectronicInvoiceDto): Promise<ElectronicInvoice>;
    syncInvoiceSat(salesOrderId: string, invoiceId: string, tenantId: string, userId: string): Promise<ElectronicInvoice>;
    getInvoicePdf(salesOrderId: string, invoiceId: string, tenantId: string, regenerate?: boolean, preview?: boolean): Promise<import("../../electronic-invoicing/services/electronic-invoice-pdf.service").ElectronicInvoicePdfUploadResult>;
    getInvoiceXml(salesOrderId: string, invoiceId: string, tenantId: string): Promise<{
        xml: string;
        fileName: string;
    }>;
    private buildXmlPlaceholder;
    private preparePaymentComplement;
    private pickIncomeInvoice;
    private pickPaymentComplement;
    private mapPaymentComplement;
    private readMetodoPago;
    private finkokEnvironment;
    private getSalesOrderOrFail;
    private getSalesOrderWithRelations;
    stampAdvance(salesOrderId: string, tenantId: string, userId: string, dto: StampAdvanceInvoiceDto): Promise<ElectronicInvoice>;
    applyAdvance(salesOrderId: string, tenantId: string, userId: string, dto: ApplyAdvanceInvoiceDto): Promise<{
        merchandise: ElectronicInvoice;
        application: ElectronicInvoice;
    }>;
    private parties;
    private getAdvanceOrder;
}
export interface PaymentComplementCard {
    id: string;
    uuid: string | null;
    stamp_status: string;
    sat_status: string | null;
    stamped_at: Date | null;
    amount: number;
}
export interface PaymentComplementStatus {
    paid: boolean;
    can_generate: boolean;
    reason: string | null;
    payment_complement: PaymentComplementCard | null;
}
