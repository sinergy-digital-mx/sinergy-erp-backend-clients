export interface MonthlyIncomePaymentInput {
    contract_id: string;
    contract_number: string;
    customer_name: string;
    currency?: string | null;
    due_date: string;
    amount: number;
    amount_paid: number;
    status: string;
}
export interface MonthlyIncomeUnscheduledInput {
    contract_id: string;
    contract_number: string;
    customer_name: string;
    currency?: string | null;
    monthly_payment: number;
}
export type MonthlyIncomeMonthStatus = 'paid' | 'partial' | 'unpaid' | 'none';
export interface MonthlyIncomeContractRow {
    contract_id: string;
    contract_number: string;
    customer_name: string;
    currency: string;
    month_expected: number;
    month_paid: number;
    month_pending: number;
    month_status: MonthlyIncomeMonthStatus;
    prior_amount: number;
    prior_installments: number;
    prior_oldest: string | null;
}
export interface MonthlyIncomeCurrencySummary {
    currency: string;
    expected: number;
    collected: number;
    pending: number;
    collection_pct: number;
    contracts: number;
    paid_contracts: number;
    partial_contracts: number;
    unpaid_contracts: number;
    prior_only_contracts: number;
    prior_amount: number;
    prior_installments: number;
    prior_contracts: number;
    average_installment: number;
}
export interface MonthlyIncomeAnalysis {
    year: number;
    month: number;
    month_label: string;
    currencies: MonthlyIncomeCurrencySummary[];
    contracts: MonthlyIncomeContractRow[];
    unscheduled: {
        count: number;
        contracts: Array<{
            contract_id: string;
            contract_number: string;
            customer_name: string;
            currency: string;
            monthly_payment: number;
        }>;
    };
}
export declare function buildMonthlyIncomeAnalysis(input: {
    year: number;
    month: number;
    payments: MonthlyIncomePaymentInput[];
    unscheduled?: MonthlyIncomeUnscheduledInput[];
}): MonthlyIncomeAnalysis;
