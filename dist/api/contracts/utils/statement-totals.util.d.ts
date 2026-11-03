import { LateInterestPaymentInput } from './late-interest.util';
type OverduePayment = {
    status: string;
    is_overdue?: boolean;
    amount_pending?: number | string | null;
    amount?: number | string | null;
};
export interface StatementTotals {
    overdue_count: number;
    overdue_amount: number;
    late_interest_amount: number;
}
export declare function buildStatementTotals(input: {
    contract: {
        interest_rate?: number | string | null;
        payment_due_day?: number | string | null;
    };
    payments: Array<OverduePayment & LateInterestPaymentInput>;
    downpayments?: OverduePayment[];
    today?: Date;
}): StatementTotals;
export {};
