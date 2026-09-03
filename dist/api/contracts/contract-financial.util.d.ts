import { Contract } from '../../entities/contracts/contract.entity';
type ContractFinancialFields = Pick<Contract, 'down_payment' | 'down_payment_target' | 'down_payment_financed' | 'total_price' | 'payment_months' | 'status'>;
export declare function getDownPaymentTarget(contract: ContractFinancialFields): number;
export declare function getDownPaymentApplied(contract: Pick<Contract, 'down_payment'>): number;
export declare function computeFinancedAmount(totalPrice: number, contract: ContractFinancialFields): number;
export declare function computeMonthlyPayment(totalPrice: number, contract: ContractFinancialFields, paymentMonths: number): number;
export declare function sumPaidFromPaymentRows(payments: Array<{
    status: string;
    amount?: number | string | null;
    amount_paid?: number | string | null;
}>): number;
export declare function computeTotalPaid(downPaymentApplied: number, monthlyPaymentsPaid: number): number;
export declare function computeRemainingBalance(totalPrice: number, downPaymentApplied: number, monthlyPaymentsPaid: number): number;
export declare function resolveContractFinancials(contract: ContractFinancialFields, monthlyPaymentsPaid: number): {
    total_paid: number;
    total_paid_from_payments: number;
    remaining_balance: number;
    down_payment_applied: number;
};
export declare function computeFinancingSnapshot(contract: ContractFinancialFields, monthlyPaymentsPaid?: number): {
    remaining_balance: number;
    payment_months: number;
    monthly_payment: number;
};
export {};
