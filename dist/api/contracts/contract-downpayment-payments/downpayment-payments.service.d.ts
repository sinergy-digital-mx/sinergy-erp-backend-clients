import { Repository } from 'typeorm';
import { Contract } from '../../../entities/contracts/contract.entity';
import { ContractDownpaymentPayment } from '../../../entities/contracts/contract-downpayment-payment.entity';
import { CreateManualDownpaymentPaymentDto } from './dto/create-manual-downpayment-payment.dto';
import { GenerateDownpaymentPaymentsDto } from './dto/generate-downpayment-payments.dto';
export declare class DownpaymentPaymentsService {
    private downpaymentRepo;
    private contractRepo;
    constructor(downpaymentRepo: Repository<ContractDownpaymentPayment>, contractRepo: Repository<Contract>);
    createManualDownpaymentPayment(tenantId: string, contractId: string, dto: CreateManualDownpaymentPaymentDto): Promise<ContractDownpaymentPayment>;
    generateDownpaymentPayments(tenantId: string, contractId: string, dto?: GenerateDownpaymentPaymentsDto): Promise<ContractDownpaymentPayment[]>;
    getDownpaymentPayments(tenantId: string, contractId: string): Promise<any[]>;
    getDownpaymentPaymentStats(tenantId: string, contractId: string): Promise<any>;
    recordDownpaymentPayment(tenantId: string, contractId: string, paymentId: string, amount: number, paymentDate: string, paymentMethod: string, referenceNumber?: string, notes?: string): Promise<ContractDownpaymentPayment>;
    updateDownpaymentTarget(tenantId: string, contractId: string, downPaymentTarget: number): Promise<any>;
    updateDownpaymentPayment(tenantId: string, contractId: string, paymentId: string, updates: {
        amount?: number;
        amount_paid?: number;
        due_date?: Date | string;
        paid_date?: Date | string;
        payment_method?: string;
        notes?: string;
    }): Promise<ContractDownpaymentPayment>;
    cancelDownpaymentPayment(tenantId: string, contractId: string, paymentId: string): Promise<ContractDownpaymentPayment>;
    resetDownpaymentPayment(tenantId: string, contractId: string, paymentId: string): Promise<ContractDownpaymentPayment>;
    deleteDownpaymentPayment(tenantId: string, contractId: string, paymentId: string): Promise<void>;
    markOverdueDownpaymentPayments(tenantId: string, contractId: string): Promise<number>;
    hasPendingDownpaymentPayments(tenantId: string, contractId: string): Promise<boolean>;
    getDownPaymentTarget(contract: Pick<Contract, 'down_payment_target' | 'down_payment' | 'down_payment_financed'>): number | null;
    recalculateContractFinancing(tenantId: string, contractId: string): Promise<void>;
    private getFinancedContractOrThrow;
    private getNextPaymentNumber;
    syncContractDownPaymentApplied(tenantId: string, contractId: string): Promise<void>;
    private createDownpaymentRow;
    private ensureContractExists;
    private getPaymentOrThrow;
    private ensureNoOtherPartialPayment;
}
