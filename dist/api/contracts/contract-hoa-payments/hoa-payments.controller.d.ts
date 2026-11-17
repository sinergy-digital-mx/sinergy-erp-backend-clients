import { TenantContextService } from '../../rbac/services/tenant-context.service';
import { GenerateHoaPaymentsDto } from './dto/generate-hoa-payments.dto';
import { RecordHoaPaymentDto } from './dto/record-hoa-payment.dto';
import { UpdateHoaPaymentDto } from './dto/update-hoa-payment.dto';
import { HoaPaymentsService } from './hoa-payments.service';
import { PaymentReceiptService } from '../contract-payments/payment-receipt.service';
export declare class HoaPaymentsController {
    private readonly hoaPaymentsService;
    private readonly paymentReceiptService;
    private readonly tenantContext;
    constructor(hoaPaymentsService: HoaPaymentsService, paymentReceiptService: PaymentReceiptService, tenantContext: TenantContextService);
    generateHoaPayments(contractId: string, dto: GenerateHoaPaymentsDto): Promise<import("../../../entities/contracts/contract-hoa-payment.entity").ContractHoaPayment[]>;
    getHoaPayments(contractId: string): Promise<import("../../../entities/contracts/contract-hoa-payment.entity").ContractHoaPayment[]>;
    getHoaPaymentStats(contractId: string): Promise<any>;
    downloadReceipt(contractId: string, paymentId: string, res: any): Promise<void>;
    composeReceipt(contractId: string, paymentId: string): Promise<{
        to_email: string;
        additional_email: string | null;
        customer_name: string;
        subject: string;
        preview_html: string;
        body_html: string;
        values: {
            organization_name: string;
            organization_rfc: string;
            customer_name: string;
            contract_number: string;
            property_code: string;
            cadastral_key: string;
            cadastral_line: string;
            lot_phrase: string;
            payment_number: string;
            payment_month: string;
            payment_reference: string;
            amount_paid: string;
            amount_words: string;
            amount: string;
            amount_pending: string;
            payment_date: string;
            due_date: string;
            payment_method: string;
            concept: string;
            status: string;
            extra_message: string;
            property_link: string;
        };
        attachment_name: string;
    }>;
    sendReceipt(contractId: string, paymentId: string, body: {
        to_email?: string;
        cc?: string[];
        extra_message?: string;
    }): Promise<{
        sent: boolean;
        to_email: string;
    }>;
    getHoaPayment(contractId: string, paymentId: string): Promise<import("../../../entities/contracts/contract-hoa-payment.entity").ContractHoaPayment>;
    updateHoaPayment(contractId: string, paymentId: string, dto: UpdateHoaPaymentDto): Promise<import("../../../entities/contracts/contract-hoa-payment.entity").ContractHoaPayment>;
    recordHoaPayment(contractId: string, paymentId: string, dto: RecordHoaPaymentDto): Promise<import("../../../entities/contracts/contract-hoa-payment.entity").ContractHoaPayment>;
    cancelHoaPayment(contractId: string, paymentId: string): Promise<import("../../../entities/contracts/contract-hoa-payment.entity").ContractHoaPayment>;
    resetHoaPayment(contractId: string, paymentId: string): Promise<import("../../../entities/contracts/contract-hoa-payment.entity").ContractHoaPayment>;
    deleteHoaPayment(contractId: string, paymentId: string): Promise<{
        message: string;
    }>;
    markOverdueHoaPayments(contractId: string): Promise<{
        message: string;
        updated_count: number;
    }>;
    private getTenantIdOrThrow;
}
