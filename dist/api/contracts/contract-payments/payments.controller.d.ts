import { TenantContextService } from '../../rbac/services/tenant-context.service';
import { PaymentsService } from './payments.service';
import { RecordPartialPaymentDto } from '../dto/record-partial-payment.dto';
import { GenerateContractPaymentsDto } from './dto/generate-contract-payments.dto';
export declare class PaymentsController {
    private paymentsService;
    private tenantContext;
    constructor(paymentsService: PaymentsService, tenantContext: TenantContextService);
    generatePayments(contractId: string, dto: GenerateContractPaymentsDto | undefined, req: any): Promise<import("./payments.service").GeneratedPaymentsResult>;
    regeneratePayments(contractId: string, dto: GenerateContractPaymentsDto | undefined, req: any): Promise<import("./payments.service").GeneratedPaymentsResult>;
    getPayments(contractId: string, req: any): Promise<any[]>;
    getStats(contractId: string, req: any): Promise<any>;
    previewSchedule(contractId: string, startDate: string | undefined): Promise<import("./payments.service").PaymentSchedulePreview>;
    getPayment(contractId: string, paymentId: string, req: any): Promise<import("../../../entities/contracts/payment.entity").Payment | null>;
    updatePayment(contractId: string, paymentId: string, body: {
        amount_paid?: number;
        due_date?: Date;
        paid_date?: Date;
        payment_method?: string;
        reference_number?: string;
        notes?: string;
    }, req: any): Promise<import("../../../entities/contracts/payment.entity").Payment>;
    recordPayment(contractId: string, paymentId: string, dto: RecordPartialPaymentDto, req: any): Promise<import("../../../entities/contracts/payment.entity").Payment>;
    cancelPayment(contractId: string, paymentId: string, req: any): Promise<import("../../../entities/contracts/payment.entity").Payment>;
    resetPayment(contractId: string, paymentId: string, req: any): Promise<import("../../../entities/contracts/payment.entity").Payment>;
    deletePayment(contractId: string, paymentId: string, req: any): Promise<{
        message: string;
    }>;
    markOverduePayments(contractId: string, req: any): Promise<{
        message: string;
        updated_count: number;
    }>;
}
