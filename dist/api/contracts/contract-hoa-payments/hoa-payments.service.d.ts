import { Repository } from 'typeorm';
import { Contract } from '../../../entities/contracts/contract.entity';
import { ContractHoaPayment } from '../../../entities/contracts/contract-hoa-payment.entity';
import { GenerateHoaPaymentsDto } from './dto/generate-hoa-payments.dto';
import { RecordHoaPaymentDto } from './dto/record-hoa-payment.dto';
import { UpdateHoaPaymentDto } from './dto/update-hoa-payment.dto';
export declare class HoaPaymentsService {
    private hoaPaymentRepo;
    private contractRepo;
    constructor(hoaPaymentRepo: Repository<ContractHoaPayment>, contractRepo: Repository<Contract>);
    generateHoaPayments(tenantId: string, contractId: string, dto: GenerateHoaPaymentsDto): Promise<ContractHoaPayment[]>;
    getContractHoaPayments(tenantId: string, contractId: string): Promise<ContractHoaPayment[]>;
    getHoaPayment(tenantId: string, contractId: string, paymentId: string): Promise<ContractHoaPayment>;
    getHoaPaymentStats(tenantId: string, contractId: string): Promise<any>;
    recordHoaPayment(tenantId: string, contractId: string, paymentId: string, dto: RecordHoaPaymentDto): Promise<ContractHoaPayment>;
    updateHoaPayment(tenantId: string, contractId: string, paymentId: string, dto: UpdateHoaPaymentDto): Promise<ContractHoaPayment>;
    cancelHoaPayment(tenantId: string, contractId: string, paymentId: string): Promise<ContractHoaPayment>;
    resetHoaPayment(tenantId: string, contractId: string, paymentId: string): Promise<ContractHoaPayment>;
    deleteHoaPayment(tenantId: string, contractId: string, paymentId: string): Promise<void>;
    markOverdueHoaPayments(tenantId: string, contractId: string): Promise<number>;
    private ensureContractExists;
    private ensureContractAllowsHoaOperations;
    private resolveGenerateConfig;
    private getHoaPaymentOrThrow;
    private ensureNoOtherPartialPayment;
    private getMonthKey;
    private formatMonthLabel;
    private resolveCurrency;
}
