import { TenantContextService } from '../../rbac/services/tenant-context.service';
import { RecordPartialPaymentDto } from '../dto/record-partial-payment.dto';
import { CreateManualDownpaymentPaymentDto } from './dto/create-manual-downpayment-payment.dto';
import { GenerateDownpaymentPaymentsDto } from './dto/generate-downpayment-payments.dto';
import { UpdateDownpaymentPaymentDto } from './dto/update-downpayment-payment.dto';
import { UpdateDownpaymentTargetDto } from './dto/update-downpayment-target.dto';
import { DownpaymentPaymentsService } from './downpayment-payments.service';
export declare class DownpaymentPaymentsController {
    private readonly downpaymentPaymentsService;
    private readonly tenantContext;
    constructor(downpaymentPaymentsService: DownpaymentPaymentsService, tenantContext: TenantContextService);
    createManual(contractId: string, dto: CreateManualDownpaymentPaymentDto): Promise<import("../../../entities/contracts/contract-downpayment-payment.entity").ContractDownpaymentPayment>;
    generate(contractId: string, dto: GenerateDownpaymentPaymentsDto): Promise<import("../../../entities/contracts/contract-downpayment-payment.entity").ContractDownpaymentPayment[]>;
    updateTarget(contractId: string, dto: UpdateDownpaymentTargetDto): Promise<any>;
    list(contractId: string): Promise<any[]>;
    stats(contractId: string): Promise<any>;
    pay(contractId: string, paymentId: string, dto: RecordPartialPaymentDto): Promise<import("../../../entities/contracts/contract-downpayment-payment.entity").ContractDownpaymentPayment>;
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
