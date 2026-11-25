export type PosCardKind = 'debit' | 'credit';
export type PosCardPayment = {
    amount_mxn: number;
    reference: string | null;
    card_kind: PosCardKind | null;
};
export declare function toCardKind(value: unknown): PosCardKind | null;
export declare function normalizeCardPayments(input: {
    card_payments?: Array<{
        amount_mxn?: number;
        reference?: string | null;
        card_kind?: string | null;
    }> | null;
    amount_card_mxn?: number;
    card_reference?: string | null;
    card_kind?: string | null;
}): PosCardPayment[];
export declare function sharedCardKind(payments: PosCardPayment[]): PosCardKind | null;
export declare function cardTicketLabel(kind: PosCardKind | null | undefined, index: number, multiple: boolean): string;
export declare function sumCardPayments(payments: PosCardPayment[]): number;
export declare function firstCardReference(payments: PosCardPayment[]): string | null;
export declare function mixedPaymentPartCount(input: {
    cashTotal: number;
    amountTransferMxn: number;
    amountCheckMxn: number;
    amountCheckUsd?: number;
    cardPayments: PosCardPayment[];
    transferPaymentCount?: number;
}): number;
export declare function cardPaymentsMatchDeclaredTotal(payments: PosCardPayment[], declaredAmount: number | undefined): boolean;
export declare function parseStoredCardPayments(value: unknown): PosCardPayment[];
export declare function cardPaymentsForResponse(stored: unknown, amountCardMxn: number, cardReference: string | null, cardKind?: string | null): PosCardPayment[];
