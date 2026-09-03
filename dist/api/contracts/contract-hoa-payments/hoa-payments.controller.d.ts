import { TenantContextService } from '../../rbac/services/tenant-context.service';
import { GenerateHoaPaymentsDto } from './dto/generate-hoa-payments.dto';
import { RecordHoaPaymentDto } from './dto/record-hoa-payment.dto';
import { UpdateHoaPaymentDto } from './dto/update-hoa-payment.dto';
import { HoaPaymentsService } from './hoa-payments.service';
export declare class HoaPaymentsController {
    private readonly hoaPaymentsService;
    private readonly tenantContext;
    constructor(hoaPaymentsService: HoaPaymentsService, tenantContext: TenantContextService);
    generateHoaPayments(contractId: string, dto: GenerateHoaPaymentsDto): Promise<import("../../../entities/contracts/contract-hoa-payment.entity").ContractHoaPayment[]>;
    getHoaPayments(contractId: string): Promise<import("../../../entities/contracts/contract-hoa-payment.entity").ContractHoaPayment[]>;
    getHoaPaymentStats(contractId: string): Promise<any>;
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
