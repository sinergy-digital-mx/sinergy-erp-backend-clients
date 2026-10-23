export type OpenContractPaymentStatus = 'pendiente' | 'parcial';
export type SettledContractPaymentStatus = OpenContractPaymentStatus | 'pagado';
export declare function roundPaymentMoney(value: number): number;
export declare function isOpenPaymentStatus(status: string | null | undefined): status is OpenContractPaymentStatus;
export declare function settlePaymentAmounts(amount: number, amountPaid: number): {
    status: SettledContractPaymentStatus;
    amount: number;
    amount_paid: number;
    amount_pending: number;
};
export declare function startOfLocalDay(value: Date | string): Date;
export declare function resolvePaymentOverdueFlag(status: string, dueDate: Date | string | null | undefined, today?: Date): boolean;
export declare function applyPaymentSettlement<T extends {
    amount: number;
    amount_paid: number;
    amount_pending: number;
    status: string;
    is_overdue: boolean;
    due_date?: Date | string | null;
}>(payment: T, today?: Date): T;
export declare function paymentSettlementChanged(before: {
    status: string;
    amount_paid: number;
    amount_pending: number;
    is_overdue: boolean;
}, after: {
    status: string;
    amount_paid: number;
    amount_pending: number;
    is_overdue: boolean;
}): boolean;
export declare function isActiveOverduePayment(payment: {
    status: string;
    is_overdue?: boolean;
}): boolean;
export declare function countActiveOverduePayments(payments: Array<{
    status: string;
    is_overdue?: boolean;
}>): number;
export declare function sumActiveOverdueAmount(payments: Array<{
    status: string;
    is_overdue?: boolean;
    amount_pending?: number | string | null;
    amount?: number | string | null;
}>): number;
export declare function isDownPaymentTargetMet(target: number | null | undefined, applied: number): boolean;
