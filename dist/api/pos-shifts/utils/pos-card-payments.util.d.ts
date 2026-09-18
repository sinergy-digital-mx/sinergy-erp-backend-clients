export type PosCardPayment = {
    amount_mxn: number;
    reference: string | null;
};
export declare function normalizeCardPayments(input: {
    card_payments?: Array<{
        amount_mxn?: number;
        reference?: string | null;
    }> | null;
    amount_card_mxn?: number;
    card_reference?: string | null;
}): PosCardPayment[];
export declare function sumCardPayments(payments: PosCardPayment[]): number;
export declare function firstCardReference(payments: PosCardPayment[]): string | null;
export declare function mixedPaymentPartCount(input: {
    cashTotal: number;
    amountTransferMxn: number;
    amountCheckMxn: number;
    cardPayments: PosCardPayment[];
}): number;
export declare function cardPaymentsMatchDeclaredTotal(payments: PosCardPayment[], declaredAmount: number | undefined): boolean;
export declare function parseStoredCardPayments(value: unknown): PosCardPayment[];
export declare function cardPaymentsForResponse(stored: unknown, amountCardMxn: number, cardReference: string | null): PosCardPayment[];
