export type PosTransferPayment = {
    amount_mxn: number;
    reference: string;
};
export declare function transferReferenceKey(value: string): string;
export declare function cleanTransferReference(value: unknown): string;
export declare function normalizeTransferPayments(input: {
    transfer_payments?: Array<{
        amount_mxn?: number;
        reference?: string | null;
    }> | null;
    amount_transfer_mxn?: number;
    transfer_reference?: string | null;
}): PosTransferPayment[];
export declare function sumTransferPayments(payments: PosTransferPayment[]): number;
export declare function firstTransferReference(payments: PosTransferPayment[]): string | null;
export declare function duplicateTransferReference(payments: PosTransferPayment[]): string | null;
export declare function parseStoredTransferPayments(value: unknown): PosTransferPayment[];
export declare function transferPaymentsForResponse(stored: unknown, amountTransferMxn: number, transferReference: string | null): PosTransferPayment[];
