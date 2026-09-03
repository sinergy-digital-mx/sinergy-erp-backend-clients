import { Repository } from 'typeorm';
import { Payment } from '../../../entities/contracts/payment.entity';
import { Contract } from '../../../entities/contracts/contract.entity';
import { ContractDownpaymentPayment } from '../../../entities/contracts/contract-downpayment-payment.entity';
import { GenerateContractPaymentsDto } from './dto/generate-contract-payments.dto';
export interface PaymentSchedulePreview {
    start_date: string;
    end_date: string;
    payment_months: number;
    payment_day: number;
    payments_count: number;
    monthly_payment: number;
    currency: string;
}
export interface GeneratedPaymentsResult extends PaymentSchedulePreview {
    payments: Payment[];
}
export declare class PaymentsService {
    private paymentRepo;
    private contractRepo;
    private downpaymentPaymentRepo;
    constructor(paymentRepo: Repository<Payment>, contractRepo: Repository<Contract>, downpaymentPaymentRepo: Repository<ContractDownpaymentPayment>);
    previewPaymentSchedule(tenantId: string, contractId: string, startDateRaw?: string): Promise<PaymentSchedulePreview>;
    generatePaymentsForContract(tenantId: string, contractId: string, dto?: GenerateContractPaymentsDto): Promise<GeneratedPaymentsResult>;
    regeneratePaymentsForContract(tenantId: string, contractId: string, dto?: GenerateContractPaymentsDto): Promise<GeneratedPaymentsResult>;
    private createPaymentsForContract;
    getContractPayments(tenantId: string, contractId: string): Promise<any[]>;
    getPayment(tenantId: string, paymentId: string): Promise<Payment | null>;
    getContractPaymentStats(tenantId: string, contractId: string): Promise<any>;
    recordPayment(tenantId: string, paymentId: string, amount: number, paymentDate: string, paymentMethod: string, referenceNumber?: string, notes?: string): Promise<Payment>;
    updatePayment(tenantId: string, paymentId: string, updates: {
        amount_paid?: number;
        due_date?: Date;
        paid_date?: Date;
        payment_method?: string;
        reference_number?: string;
        notes?: string;
    }): Promise<Payment>;
    cancelPayment(tenantId: string, paymentId: string): Promise<Payment>;
    deletePayment(tenantId: string, paymentId: string): Promise<void>;
    resetPayment(tenantId: string, paymentId: string): Promise<Payment>;
    markOverduePayments(tenantId: string): Promise<number>;
    private getContractOrThrow;
    private countPaidOrPartialPayments;
    private resolveStartDate;
    private buildSchedulePreview;
    private resolveScheduleFromPayments;
    private parseDateOnly;
    private formatDateOnlyFromUnknown;
    private formatDateOnly;
    private addMonthsClamped;
    private hasPendingDownpaymentPayments;
}
