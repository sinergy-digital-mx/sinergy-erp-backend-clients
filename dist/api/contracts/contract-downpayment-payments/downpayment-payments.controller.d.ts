import { TenantContextService } from '../../rbac/services/tenant-context.service';
import { RecordPartialPaymentDto } from '../dto/record-partial-payment.dto';
import { CreateManualDownpaymentPaymentDto } from './dto/create-manual-downpayment-payment.dto';
import { GenerateDownpaymentPaymentsDto } from './dto/generate-downpayment-payments.dto';
import { UpdateDownpaymentPaymentDto } from './dto/update-downpayment-payment.dto';
import { UpdateDownpaymentTargetDto } from './dto/update-downpayment-target.dto';
import { DownpaymentPaymentsService } from './downpayment-payments.service';
import { PaymentReceiptService } from '../contract-payments/payment-receipt.service';
export declare class DownpaymentPaymentsController {
    private readonly downpaymentPaymentsService;
    private readonly paymentReceiptService;
    private readonly tenantContext;
    constructor(downpaymentPaymentsService: DownpaymentPaymentsService, paymentReceiptService: PaymentReceiptService, tenantContext: TenantContextService);
    createManual(contractId: string, dto: CreateManualDownpaymentPaymentDto): Promise<import("../../../entities/contracts/contract-downpayment-payment.entity").ContractDownpaymentPayment>;
    generate(contractId: string, dto: GenerateDownpaymentPaymentsDto): Promise<import("../../../entities/contracts/contract-downpayment-payment.entity").ContractDownpaymentPayment[]>;
    updateTarget(contractId: string, dto: UpdateDownpaymentTargetDto): Promise<any>;
    list(contractId: string): Promise<any[]>;
    stats(contractId: string): Promise<any>;
    pay(contractId: string, paymentId: string, dto: RecordPartialPaymentDto): Promise<import("../../../entities/contracts/contract-downpayment-payment.entity").ContractDownpaymentPayment>;
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
    update(contractId: string, paymentId: string, dto: UpdateDownpaymentPaymentDto): Promise<import("../../../entities/contracts/contract-downpayment-payment.entity").ContractDownpaymentPayment>;
    cancel(contractId: string, paymentId: string): Promise<import("../../../entities/contracts/contract-downpayment-payment.entity").ContractDownpaymentPayment>;
    reset(contractId: string, paymentId: string): Promise<import("../../../entities/contracts/contract-downpayment-payment.entity").ContractDownpaymentPayment>;
    delete(contractId: string, paymentId: string): Promise<{
        message: string;
    }>;
    markOverdue(contractId: string): Promise<{
        message: string;
        updated_count: number;
    }>;
    private getTenantIdOrThrow;
}
